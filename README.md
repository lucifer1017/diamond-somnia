# Diamond Hands Bar — Somnia Data Streams Hackathon Build

## Overview

Diamond Hands Bar is a two‑player card game themed as a tavern showdown. We rebuilt the experience on **Somnia Data Streams (SDS)** so every match result, score update, and history entry is written to Somnia Testnet in real time. Players can:

- **Publish** final match results on‑chain (with explorer proof).
- **Share a lobby code** so friends can **watch the live game** as it plays out.
- **Browse the Tavern Ledger**, which pulls historical wins straight from Somnia Streams.

Live deployment: **https://diamond-somnia.vercel.app/**

Everything runs as a Vite + React SPA hosted on Vercel, but all state persistence is handled by SDS—no custom smart contracts required.

---

## What is Somnia Data Streams?

Somnia Data Streams is a protocol + SDK that turns on-chain storage into **structured, reactive streams**:

- You define a schema (similar to a strongly typed table).
- Write data with `sdk.streams.set(...)`.
- Anyone can read the decoded payload via `getByKey`, `getAtIndex`, or `getAllPublisherDataForSchema`.
- Because the schema is global, multiple apps can subscribe to the same stream, and every update is immediately queryable.

This removes the need to deploy bespoke smart contracts or run centralized indexers. The SDK handles schema registration, encoding, decoding, and even event emission if you want push-style notifications.

---

## How SDS powers this project

| Feature | SDS Usage | Files |
| --- | --- | --- |
| **Match Publishing** | `publishMatchResult` encodes `MATCH_RESULT_SCHEMA` data, auto-registers schemas, emits an event, and writes the result to Somnia Testnet. | `src/lib/somnia.ts` |
| **On-Chain Proof Card** | Shows pending/success/error status + Shannon explorer link for each SDS transaction. | `src/components/OnChainProofCard.tsx` |
| **Tavern Ledger** | Uses `sdk.streams.getAllPublisherDataForSchema` to pull historical wins for the connected wallet. | `src/lib/somnia.ts`, `src/hooks/useMatchHistory.ts`, `src/components/TavernLedger.tsx` |
| **Shared Lobbies / Live Spectators** | Hosts publish the current round snapshot using `GAME_STATE_SCHEMA`. Watchers call `sdk.streams.getByKey(schemaId, hostAddress, roomDataId)` every 3 seconds to stay synced. | `src/lib/lobbySchema.ts`, `src/lib/somnia.ts`, `src/hooks/useGameState.ts`, `src/hooks/useWatchRoom.ts` |
| **Room Codes & Data IDs** | Each room code becomes a deterministic `dataId = keccak256("room-{code}")`, so every publish overwrites that row, giving watchers the latest state instantly. | `src/lib/lobbySchema.ts` |

### Why this makes life easier

- **No custom contracts**: SDS handles on-chain storage, so we focus on gameplay logic.
- **Structured data**: Schemas guarantee type safety for publishers and readers.
- **Instant reactivity**: Watchers query the stream directly—no cron jobs, no third-party indexers.
- **Automatic history**: The ledger is just a filtered view of the stream; no extra DB needed.
- **Composability**: Other teams could subscribe to the same schemas to build dashboards or analytics.

---

## Architecture at a glance

```
MetaMask (Somnia Testnet) ──▶ React (Vite) ──▶ Somnia Data Streams
                                   ▲
                                   │
                      Watchers poll `getByKey` for room state
```

- **Frontend**: Vite + React + TypeScript + Tailwind (with Minecraft-inspired UI).
- **Wallets**: `useWallet` handles MetaMask connection + Somnia chain detection.
- **State management**: Hooks (`useGameState`, `useRoom`, `useWatchRoom`) orchestrate game flow and SDS traffic.
- **Networking**: Viem clients (`publicClient`, `walletClient`) point to Somnia Testnet RPC/WebSocket endpoints.
- **Hosting**: Vercel (SPA with `vercel.json` rewrites for React Router).

---

## Running locally

```bash
cd diamond-hands-bar-main-frontend
npm install
cp .env.example .env     # set VITE_SDS_SCHEMA_ID (see compute script / README)
npm run dev              # http://localhost:5173 by default
```

Required environment variables:

```
VITE_SDS_SCHEMA_ID=0x...
VITE_SOMNIA_RPC_URL=https://dream-rpc.somnia.network        # optional override
VITE_SOMNIA_WS_URL=wss://dream-rpc.somnia.network/ws        # optional override
```

To compute your schema ID locally:
```bash
node scripts/computeSchema.mjs
```

---

## Deploying to Vercel

1. Push the repo to GitHub.
2. Create a new Vercel project, pointing to `diamond-hands-bar-main-frontend`.
3. Set build settings (Vercel auto-detects Vite, but `vercel.json` is included just in case).
4. Add the environment variables above in Vercel’s dashboard.
5. Deploy. The live site is your “Web3 dApp on Somnia Testnet” entry point—MetaMask prompts will target Somnia automatically.

---

## Hackathon Deliverables Checklist

- [x] SDS integration (match results + live lobbies + ledger).
- [x] Live Vercel deployment (Somnia Testnet ready) — https://diamond-somnia.vercel.app/


---

## Judging Criteria — How Diamond Hands Bar Scores

| Criterion | How the project meets it |
| --- | --- |
| **Technical Excellence** | The frontend uses Somnia SDS for both writes and reads, handling schema registration, deterministic data IDs, and Viem clients within `src/lib/somnia.ts`. Match publishing includes event emission + explorer proof, while watchers and ledgers consume decoded data directly—no mock data or centralized DB. |
| **Real-Time UX** | Shared lobbies let spectators join via room code and immediately poll SDS `getByKey` for the host’s state every 3 seconds, so scores update live without page refreshes. On-chain proof cards and the Tavern Ledger refresh automatically after each confirmed publish, reinforcing the live experience. |
| **Somnia Integration** | All blockchain traffic goes through the official Somnia Testnet RPCs (defaulting to `https://dream-rpc.somnia.network`). MetaMask prompts require Somnia Testnet, and the live deployment at https://diamond-somnia.vercel.app/ works end-to-end on that network with no other chains involved. |
| **Potential Impact** | The reusable schemas (match results + live rooms) enable future analytics dashboards, tournaments, or multi-table spectators with zero additional contracts. Other builders can subscribe to the same streams, making this a strong showcase for SDS-based gaming and a foundation for further ecosystem tools. |

---

## Useful links

- Somnia Docs: https://docs.somnia.network
- Data Streams Portal: https://datastreams.somnia.network
- Shannon Explorer: https://shannon-explorer.somnia.network


