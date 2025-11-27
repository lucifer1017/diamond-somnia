import { motion } from "framer-motion";
import type { MatchHistoryEntry } from "@/lib/somnia";

interface TavernLedgerProps {
  isConnected: boolean;
  isLoading: boolean;
  entries: MatchHistoryEntry[];
  onRefresh?: () => void;
}

const formatTimestamp = (timestamp: number) => {
  if (!timestamp) return "Unknown time";
  return new Date(timestamp).toLocaleString();
};

export const TavernLedger = ({ isConnected, isLoading, entries, onRefresh }: TavernLedgerProps) => (
  <motion.div
    className="w-full max-w-4xl mx-auto mt-4 rounded-lg border-2 border-wood-dark bg-gradient-to-br from-wood to-wood-dark shadow-wood px-4 py-3"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
  >
    <div className="flex items-center justify-between mb-3">
      <div>
        <p className="font-minecraft text-xs text-gold tracking-wide">TAVERN LEDGER</p>
        <p className="text-[11px] text-muted-foreground">Last on-chain matches</p>
      </div>
      <div className="flex items-center gap-2">
        {isConnected && onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="font-minecraft text-[10px] px-2 py-1 rounded-pixel border border-wood-dark bg-wood/50 hover:bg-wood/70 disabled:opacity-50 disabled:cursor-not-allowed transition"
            title="Refresh ledger"
          >
            🔄
          </button>
        )}
        {!isConnected && (
          <span className="font-minecraft text-[11px] text-muted-foreground">
            Connect wallet to fetch your records
          </span>
        )}
      </div>
    </div>
    <div className="max-h-52 overflow-y-auto pr-2 space-y-2 ledger-scrollbar">
      {!isConnected && (
        <p className="text-sm text-muted-foreground">No wallet connected.</p>
      )}
      {isConnected && isLoading && <p className="text-sm text-muted-foreground">Loading matches...</p>}
      {isConnected && !isLoading && entries.length === 0 && (
        <p className="text-sm text-muted-foreground">No Somnia records yet. Secure a win!</p>
      )}
      {entries.map((entry) => (
        <div
          key={entry.matchIdHash}
          className="rounded-pixel border border-wood-dark/60 bg-background/40 px-3 py-2 text-sm flex justify-between items-start gap-3"
        >
          <div>
            <p className="font-minecraft text-xs text-gold">Match {entry.matchId.slice(0, 6)}</p>
            <p className="text-[12px] text-foreground">
              {entry.winnerLabel} won {entry.playerOneScore} - {entry.playerTwoScore}
            </p>
            <p className="text-[10px] text-muted-foreground">{formatTimestamp(entry.timestamp)}</p>
          </div>
          <div className="text-right">
            <p className="font-minecraft text-[10px] text-muted-foreground">Data ID</p>
            <p className="text-[10px] break-all text-foreground/70">{entry.matchIdHash.slice(0, 10)}...</p>
          </div>
        </div>
      ))}
    </div>
  </motion.div>
);

