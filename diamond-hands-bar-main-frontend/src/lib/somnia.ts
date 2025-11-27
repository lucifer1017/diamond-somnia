import { Buffer } from "buffer";
import { SDK, SchemaEncoder, zeroBytes32 } from "@somnia-chain/streams";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  webSocket,
  keccak256,
  toBytes,
  waitForTransactionReceipt,
  type Hex,
  type WalletClient,
} from "viem";
import { somniaTestnet } from "viem/chains";

const globalObjSomnia: typeof globalThis & { Buffer?: typeof Buffer } = globalThis as never;

if (!globalObjSomnia.Buffer) {
  globalObjSomnia.Buffer = Buffer;
}

const DEFAULT_HTTP_RPC = "https://dream-rpc.somnia.network";
const DEFAULT_WS_RPC = "wss://dream-rpc.somnia.network/ws";

const httpUrl = import.meta.env.VITE_SOMNIA_RPC_URL ?? DEFAULT_HTTP_RPC;
const wsUrl = import.meta.env.VITE_SOMNIA_WS_URL ?? DEFAULT_WS_RPC;

export const publicClient = createPublicClient({
  chain: somniaTestnet,
  transport: http(httpUrl),
});

// Create WebSocket client lazily to avoid connection attempts on module load
// This prevents error spam if WebSocket is unavailable
let _subscriptionClient: ReturnType<typeof createPublicClient> | null = null;

export const getSubscriptionClient = () => {
  if (typeof window === "undefined") {
    return publicClient;
  }
  
  if (!_subscriptionClient) {
    try {
      _subscriptionClient = createPublicClient({
        chain: somniaTestnet,
        transport: webSocket(wsUrl, {
          reconnect: false,
        }),
      });
    } catch (error) {
      console.warn("[Somnia] WebSocket client creation failed, subscriptions disabled");
      return publicClient;
    }
  }
  
  return _subscriptionClient;
};

export const subscriptionClient = getSubscriptionClient();

export const SOMNIA_CHAIN_PARAMS = {
  chainId: `0x${somniaTestnet.id.toString(16)}`,
  chainName: "Somnia Testnet",
  nativeCurrency: {
    name: "Somnia Test Token",
    symbol: "STT",
    decimals: 18,
  },
  rpcUrls: [httpUrl],
  blockExplorerUrls: ["https://shannon-explorer.somnia.network"],
};

export const SOMNIA_EXPLORER_TX_URL = "https://shannon-explorer.somnia.network/tx/";

export const createWalletClientFromProvider = async (account?: `0x${string}`): Promise<WalletClient> => {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("Wallet provider not found");
  }

  return createWalletClient({
    account,
    chain: somniaTestnet,
    transport: custom(window.ethereum),
  });
};

export const createSdk = (walletClient: WalletClient) =>
  new SDK({
    public: publicClient,
    wallet: walletClient,
  });

const schemaIdEnv = import.meta.env.VITE_SDS_SCHEMA_ID;

export const MATCH_RESULT_SCHEMA =
  "string matchId,string winner,uint16 playerOneScore,uint16 playerTwoScore,uint8 roundsPlayed,uint64 timestamp,address publisher";

const encoder = new SchemaEncoder(MATCH_RESULT_SCHEMA);
const publicSdk = new SDK({ public: publicClient });
type SchemaDecodedItem = { name: string; type: string; value: unknown };

export interface MatchResultPayload {
  matchId: string;
  winnerLabel: string;
  playerOneScore: number;
  playerTwoScore: number;
  roundsPlayed: number;
  publisher: `0x${string}`;
}

const getSchemaId = (): Hex => {
  if (!schemaIdEnv) {
    throw new Error("Missing VITE_SDS_SCHEMA_ID");
  }
  return schemaIdEnv as Hex;
};

export const encodeMatchResult = (payload: MatchResultPayload) => {
  return encoder.encodeData([
    { name: "matchId", value: payload.matchId, type: "string" },
    { name: "winner", value: payload.winnerLabel, type: "string" },
    { name: "playerOneScore", value: payload.playerOneScore.toString(), type: "uint16" },
    { name: "playerTwoScore", value: payload.playerTwoScore.toString(), type: "uint16" },
    { name: "roundsPlayed", value: payload.roundsPlayed.toString(), type: "uint8" },
    { name: "timestamp", value: Date.now().toString(), type: "uint64" },
    { name: "publisher", value: payload.publisher, type: "address" },
  ]);
};

export const MATCH_EVENT_ID = "DiamondHandsMatchCompleted";

export const publishMatchResult = async (walletClient: WalletClient, payload: MatchResultPayload): Promise<Hex> => {
  const sdk = createSdk(walletClient);
  const schemaId = getSchemaId();

  // Register data schema if not already registered
  const isRegistered = await publicSdk.streams.isDataSchemaRegistered(schemaId);
  if (!isRegistered) {
    console.log("[Somnia] Registering data schema...");
    const registerTxHash = await sdk.streams.registerDataSchemas(
      [
        {
          schemaName: "diamond_hands_match",
          schema: MATCH_RESULT_SCHEMA,
          parentSchemaId: zeroBytes32,
        },
      ],
      true // ignoreAlreadyRegistered
    );
    if (registerTxHash) {
      console.log("[Somnia] Data schema registration tx:", registerTxHash);
      await publicClient.waitForTransactionReceipt({ hash: registerTxHash });
    }
  }

  // Try to register event schema for live feed (optional - if it fails, we'll just use set() instead)
  let canEmitEvents = false;
  try {
    const eventSchemas = await publicSdk.streams.getEventSchemasById([MATCH_EVENT_ID]);
    canEmitEvents = eventSchemas && eventSchemas.length > 0;
  } catch (err) {
    // Schema doesn't exist, try to register it
    try {
      console.log("[Somnia] Registering event schema for live feed...");
      const eventRegisterTxHash = await sdk.streams.registerEventSchemas(
        [MATCH_EVENT_ID],
        [
          {
            params: [
              { name: "matchIdHash", type: "bytes32" },
            ],
            eventTopic: "MatchCompleted(bytes32)",
          },
        ]
      );
      if (eventRegisterTxHash && typeof eventRegisterTxHash === "string") {
        console.log("[Somnia] Event schema registration tx:", eventRegisterTxHash);
        await publicClient.waitForTransactionReceipt({ hash: eventRegisterTxHash as Hex });
        canEmitEvents = true;
      }
    } catch (registerErr) {
      console.warn("[Somnia] Event schema registration failed, will publish without events:", registerErr);
      canEmitEvents = false;
    }
  }

  const encoded = encodeMatchResult(payload);
  const dataId = keccak256(toBytes(payload.matchId));

  // If event schema is registered, emit events for live feed; otherwise just publish data
  if (canEmitEvents) {
    const matchIdHash = dataId;
    const eventData = "0x" as Hex;

    const txHash = await sdk.streams.setAndEmitEvents(
      [
        {
          id: dataId,
          schemaId,
          data: encoded,
        },
      ],
      [
        {
          id: MATCH_EVENT_ID,
          argumentTopics: [matchIdHash],
          data: eventData,
        },
      ]
    );
    return (txHash as Hex) || null;
  } else {
    // Fallback: just publish data without events (live feed won't work, but data is stored)
    const txHash = await sdk.streams.set([
      {
        id: dataId,
        schemaId,
        data: encoded,
      },
    ]);
    return txHash as Hex;
  }
};

const extractFieldValue = (item?: SchemaDecodedItem) => {
  if (!item) return null;
  const value = item.value as { value?: unknown } | unknown;
  if (value && typeof value === "object" && "value" in value) {
    // @ts-expect-error runtime shape
    return value.value;
  }
  return value;
};

export interface MatchHistoryEntry {
  matchId: string;
  matchIdHash: Hex;
  winnerLabel: string;
  playerOneScore: number;
  playerTwoScore: number;
  roundsPlayed: number;
  timestamp: number;
  publisher: `0x${string}`;
}

const decodeMatchHistoryItem = (items: SchemaDecodedItem[], publisher: `0x${string}`, matchIdHash: Hex): MatchHistoryEntry | null => {
  const get = (name: string) => extractFieldValue(items.find((field) => field.name === name));
  const matchId = (get("matchId") as string) ?? "";
  if (!matchId) return null;

  return {
    matchId,
    matchIdHash,
    winnerLabel: (get("winner") as string) ?? "Unknown",
    playerOneScore: Number(get("playerOneScore")) || 0,
    playerTwoScore: Number(get("playerTwoScore")) || 0,
    roundsPlayed: Number(get("roundsPlayed")) || 0,
    timestamp: Number(get("timestamp")) || 0,
    publisher,
  };
};

export const fetchMatchHistory = async (publisher: `0x${string}`, limit = 8): Promise<MatchHistoryEntry[]> => {
  try {
    const schemaId = getSchemaId();
    console.log("[TavernLedger] Fetching history for publisher:", publisher, "schemaId:", schemaId);
    
    // Check if schema is registered first
    const isRegistered = await publicSdk.streams.isDataSchemaRegistered(schemaId);
    console.log("[TavernLedger] Schema registered?", isRegistered);
    
    if (!isRegistered) {
      console.warn("[TavernLedger] Schema not registered on-chain. No data available yet.");
      return [];
    }

    // getAllPublisherDataForSchema takes (schemaId, publisher) - just Hex, not schema reference
    const raw = await publicSdk.streams.getAllPublisherDataForSchema(schemaId, publisher);
    
    console.log("[TavernLedger] Raw data from chain:", raw);

    if (!raw || (Array.isArray(raw) && raw.length === 0)) {
      console.log("[TavernLedger] No data found for publisher");
      return [];
    }

    // The SDK returns decoded items directly when schema is registered
    const decodedSet: SchemaDecodedItem[][] = Array.isArray(raw) ? (raw as SchemaDecodedItem[][]) : [];

    console.log("[TavernLedger] Decoded items:", decodedSet);

    const decodedEntries = decodedSet
      .map((items) => {
        const matchId = extractFieldValue(items.find((f) => f.name === "matchId"));
        const matchIdHash = typeof matchId === "string" ? (keccak256(toBytes(matchId)) as Hex) : (`0x${"0".repeat(64)}` as Hex);
        return decodeMatchHistoryItem(items, publisher, matchIdHash);
      })
      .filter((entry): entry is MatchHistoryEntry => Boolean(entry));

    console.log("[TavernLedger] Final decoded entries:", decodedEntries);
    return decodedEntries.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  } catch (error) {
    console.error("[TavernLedger] Error fetching match history:", error);
    return [];
  }
};

// ===== LOBBY / GAME STATE FUNCTIONS =====

import {
  GAME_STATE_SCHEMA,
  encodeGameState,
  getRoomDataId,
  type GameStatePayload,
} from "./lobbySchema";

let gameStateSchemaId: Hex | null = null;

const getGameStateSchemaId = async (): Promise<Hex> => {
  if (gameStateSchemaId) return gameStateSchemaId;
  gameStateSchemaId = await publicSdk.streams.computeSchemaId(GAME_STATE_SCHEMA);
  return gameStateSchemaId;
};

export interface WatchedGameState extends GameStatePayload {
  timestamp: number;
}

// Publish game state update to Somnia (for room watching)
export const publishGameStateUpdate = async (
  walletClient: WalletClient,
  payload: GameStatePayload
): Promise<Hex | null> => {
  try {
    console.log("[Lobby] Publishing game state update:", payload);
    const sdk = createSdk(walletClient);
    const schemaId = await getGameStateSchemaId();
    console.log("[Lobby] Schema ID:", schemaId);

    // Register schema if needed
    const isRegistered = await publicSdk.streams.isDataSchemaRegistered(schemaId);
    console.log("[Lobby] Schema registered?", isRegistered);
    
    if (!isRegistered) {
      console.log("[Lobby] Registering game state schema...");
      const registerTxHash = await sdk.streams.registerDataSchemas(
        [
          {
            schemaName: "diamond_hands_game_state",
            schema: GAME_STATE_SCHEMA,
            parentSchemaId: zeroBytes32,
          },
        ],
        true
      );
      if (registerTxHash) {
        console.log("[Lobby] Schema registration tx:", registerTxHash);
        await publicClient.waitForTransactionReceipt({ hash: registerTxHash as Hex });
      }
    }

    const encoded = encodeGameState(payload);
    const dataId = getRoomDataId(payload.roomCode);
    console.log("[Lobby] Publishing with dataId:", dataId);

    // Use set() to update the same data ID (replaces previous state)
    const txHash = await sdk.streams.set([
      {
        id: dataId,
        schemaId,
        data: encoded,
      },
    ]);

    console.log("[Lobby] Published successfully, tx:", txHash);
    
    // Wait for transaction confirmation so data is available for watchers
    if (txHash) {
      await publicClient.waitForTransactionReceipt({ hash: txHash as Hex });
      console.log("[Lobby] Transaction confirmed, data is now available on-chain");
    }
    
    return txHash as Hex;
  } catch (error) {
    console.error("[Lobby] Failed to publish game state:", error);
    return null;
  }
};

// Fetch current game state for a room (for watchers)
export const fetchRoomState = async (
  roomCode: string,
  publisher: `0x${string}`
): Promise<WatchedGameState | null> => {
  try {
    // Validate publisher address format
    if (!publisher || !publisher.startsWith("0x") || publisher.length !== 42) {
      console.error("[Lobby] Invalid publisher address:", publisher);
      return null;
    }
    
    if (!/^0x[a-fA-F0-9]{40}$/.test(publisher)) {
      console.error("[Lobby] Publisher address is not a valid hex address:", publisher);
      return null;
    }
    
    const schemaId = await getGameStateSchemaId();
    const dataId = getRoomDataId(roomCode);
    
    console.log("[Lobby] Fetching room state:", { roomCode, publisher, schemaId, dataId, publisherLength: publisher.length });

    // Check if schema is registered first
    const isRegistered = await publicSdk.streams.isDataSchemaRegistered(schemaId);
    if (!isRegistered) {
      console.log("[Lobby] Game state schema not registered yet");
      return null;
    }

    // Check if publisher has any data for this schema (skip if address is invalid)
    let totalCount;
    try {
      totalCount = await publicSdk.streams.totalPublisherDataForSchema(schemaId, publisher);
    } catch (error: any) {
      // If address validation fails, skip the check and try getByKey directly
      if (error?.message?.includes("Invalid address")) {
        console.warn("[Lobby] Invalid publisher address, skipping total count check:", publisher);
        // Continue to try getByKey anyway
      } else {
        throw error;
      }
    }
    
    if (totalCount !== undefined && (!totalCount || totalCount === 0n)) {
      console.log("[Lobby] No data published by this address yet");
      return null;
    }

    const raw = await publicSdk.streams.getByKey(schemaId, publisher, dataId);
    
    console.log("[Lobby] Raw data from getByKey:", raw);
    console.log("[Lobby] Raw data type:", typeof raw, "isArray:", Array.isArray(raw));
    if (Array.isArray(raw)) {
      console.log("[Lobby] Raw array length:", raw.length);
      if (raw.length > 0) {
        console.log("[Lobby] First element:", raw[0], "type:", typeof raw[0], "isArray:", Array.isArray(raw[0]));
      }
    }

    if (!raw || !Array.isArray(raw) || raw.length === 0) {
      console.log("[Lobby] No data found for this room code");
      return null;
    }

    // Decode the data - getByKey returns decoded data when schema is registered
    // Based on docs: data structure is an array of field objects
    // Each field has: { name: string, value: any } or { name: string, value: { value: any } }
    let items: SchemaDecodedItem[];
    
    if (Array.isArray(raw)) {
      // Check if nested array (array of arrays) or flat array
      if (raw.length > 0 && Array.isArray(raw[0])) {
        // Nested: take the first entry (latest data)
        items = raw[0] as SchemaDecodedItem[];
        console.log("[Lobby] Using nested array structure");
      } else {
        // Flat array of field objects
        items = raw as SchemaDecodedItem[];
        console.log("[Lobby] Using flat array structure");
      }
    } else {
      items = [];
    }
    
    console.log("[Lobby] Decoded items:", items);
    console.log("[Lobby] Items length:", items.length);
    
    if (items.length === 0) {
      console.log("[Lobby] No items to decode");
      return null;
    }
    
    // Log first few items to understand structure
    console.log("[Lobby] First 3 items:", items.slice(0, 3));
    
    // Helper to extract value (handles nested value.value structure from SDK)
    const val = (f: any) => {
      if (!f) {
        console.log("[Lobby] Field is null/undefined");
        return null;
      }
      console.log("[Lobby] Field structure:", { name: f.name, value: f.value, valueType: typeof f.value });
      // Handle nested value structure: f?.value?.value ?? f?.value
      if (f.value && typeof f.value === 'object' && 'value' in f.value) {
        return f.value.value;
      }
      return f.value;
    };
    
    const get = (name: string) => {
      const item = items.find((f) => f.name === name);
      const value = val(item);
      console.log(`[Lobby] Extracted ${name}:`, value);
      return value;
    };

    const state = {
      roomCode: String(get("roomCode") || ""),
      currentRound: Number(get("currentRound")) || 1,
      totalRounds: Number(get("totalRounds")) || 5,
      player1RoundScore: Number(get("player1RoundScore")) || 0,
      player1TotalScore: Number(get("player1TotalScore")) || 0,
      player2RoundScore: Number(get("player2RoundScore")) || 0,
      player2TotalScore: Number(get("player2TotalScore")) || 0,
      activePlayerId: Number(get("activePlayerId")) || 1,
      gameStatus: String(get("gameStatus") || "waiting"),
      timestamp: Number(get("timestamp")) || Date.now(),
    };
    
    console.log("[Lobby] Parsed state:", state);
    console.log("[Lobby] Room code extracted:", state.roomCode);
    
    return state;
  } catch (error: any) {
    // Handle "data not found" errors gracefully
    if (error?.message?.includes("IntegerOutOfRangeError") || 
        error?.message?.includes("NoData") ||
        error?.message?.includes("-1")) {
      console.log("[Lobby] Room data doesn't exist yet (this is normal)");
      return null;
    }
    console.error("[Lobby] Failed to fetch room state:", error);
    return null;
  }
};

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

