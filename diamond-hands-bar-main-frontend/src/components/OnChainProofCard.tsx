import { motion, AnimatePresence } from "framer-motion";
import { SOMNIA_EXPLORER_TX_URL } from "@/lib/somnia";

interface OnChainProofCardProps {
  status: "idle" | "pending" | "success" | "error";
  txHash: string | null;
  errorMessage: string | null;
}

const statusCopy = {
  pending: { title: "Publishing Match", message: "Sending result to Somnia Data Streams..." },
  success: { title: "On-Chain Proof Ready", message: "Victory recorded on Somnia!" },
  error: { title: "Publish Failed", message: "Could not record match on Somnia." },
};

export const OnChainProofCard = ({ status, txHash, errorMessage }: OnChainProofCardProps) => (
  <AnimatePresence>
    {status !== "idle" && (
      <motion.div
        className="fixed bottom-8 right-6 z-[60] w-72 rounded-lg border-2 border-wood-dark bg-gradient-to-br from-wood to-wood-dark shadow-wood px-4 py-3"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{status === "pending" ? "⏳" : status === "success" ? "✅" : "⚠️"}</span>
          <div>
            <p className="font-minecraft text-xs text-gold">{statusCopy[status]?.title ?? "On-Chain Status"}</p>
            <p className="text-[11px] text-muted-foreground">{statusCopy[status]?.message ?? ""}</p>
          </div>
        </div>
        {status === "error" && errorMessage && (
          <p className="mt-2 font-minecraft text-[10px] text-destructive">{errorMessage}</p>
        )}
        {status === "success" && txHash && (
          <a
            href={`${SOMNIA_EXPLORER_TX_URL}${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center justify-center w-full rounded-pixel border border-gold px-3 py-1 text-[10px] font-minecraft text-foreground bg-gold/10 hover:bg-gold/20 transition"
          >
            VIEW ON SHANNON EXPLORER ↗
          </a>
        )}
      </motion.div>
    )}
  </AnimatePresence>
);


