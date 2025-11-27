import { SDK } from "@somnia-chain/streams";
import { createPublicClient, http } from "viem";
import { somniaTestnet } from "viem/chains";

const MATCH_RESULT_SCHEMA =
  "string matchId,string winner,uint16 playerOneScore,uint16 playerTwoScore,uint8 roundsPlayed,uint64 timestamp,address publisher";

const rpcUrl = process.env.SOMNIA_RPC_URL ?? "https://dream-rpc.somnia.network";

const publicClient = createPublicClient({
  chain: somniaTestnet,
  transport: http(rpcUrl),
});

const sdk = new SDK({ public: publicClient });

const main = async () => {
  const schemaId = await sdk.streams.computeSchemaId(MATCH_RESULT_SCHEMA);
  console.log("Computed schema ID:", schemaId);
};

main().catch((err) => {
  console.error("Failed to compute schema ID", err);
  process.exit(1);
});

