import { SchemaEncoder } from "@somnia-chain/streams";
import { keccak256, toBytes, type Hex } from "viem";
import type { GameState } from "@/types/game";

// Schema for live game state updates (for watching matches)
export const GAME_STATE_SCHEMA =
  "string roomCode,uint8 currentRound,uint8 totalRounds,uint16 player1RoundScore,uint16 player1TotalScore,uint16 player2RoundScore,uint16 player2TotalScore,uint8 activePlayerId,string gameStatus,uint64 timestamp";

const encoder = new SchemaEncoder(GAME_STATE_SCHEMA);

export interface GameStatePayload {
  roomCode: string;
  currentRound: number;
  totalRounds: number;
  player1RoundScore: number;
  player1TotalScore: number;
  player2RoundScore: number;
  player2TotalScore: number;
  activePlayerId: number;
  gameStatus: string;
}

export const encodeGameState = (payload: GameStatePayload) => {
  return encoder.encodeData([
    { name: "roomCode", value: payload.roomCode, type: "string" },
    { name: "currentRound", value: payload.currentRound.toString(), type: "uint8" },
    { name: "totalRounds", value: payload.totalRounds.toString(), type: "uint8" },
    { name: "player1RoundScore", value: payload.player1RoundScore.toString(), type: "uint16" },
    { name: "player1TotalScore", value: payload.player1TotalScore.toString(), type: "uint16" },
    { name: "player2RoundScore", value: payload.player2RoundScore.toString(), type: "uint16" },
    { name: "player2TotalScore", value: payload.player2TotalScore.toString(), type: "uint16" },
    { name: "activePlayerId", value: payload.activePlayerId.toString(), type: "uint8" },
    { name: "gameStatus", value: payload.gameStatus, type: "string" },
    { name: "timestamp", value: Date.now().toString(), type: "uint64" },
  ]);
};

// Generate deterministic data ID from room code
export const getRoomDataId = (roomCode: string): Hex => {
  return keccak256(toBytes(`room-${roomCode}`));
};

// Generate human-readable room code
export const generateRoomCode = (): string => {
  const prefix = "DIAMOND";
  const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit number
  return `${prefix}-${randomNum}`;
};

// Convert game state to payload for publishing
export const gameStateToPayload = (gameState: GameState, roomCode: string): GameStatePayload => {
  return {
    roomCode,
    currentRound: gameState.currentRound,
    totalRounds: gameState.totalRounds,
    player1RoundScore: gameState.players[0].roundScore,
    player1TotalScore: gameState.players[0].totalScore,
    player2RoundScore: gameState.players[1].roundScore,
    player2TotalScore: gameState.players[1].totalScore,
    activePlayerId: gameState.players.find((p) => p.isActive)?.id || 1,
    gameStatus: gameState.gameStatus,
  };
};

