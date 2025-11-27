import { motion, AnimatePresence } from "framer-motion";
import { useMatchFeed } from "@/hooks/useMatchFeed";

export const BarGossipFeed = () => {
  // Temporarily disabled - WebSocket subscriptions not working reliably
  // Will re-enable once WebSocket/event schema issues are resolved
  return null;
  
  // const { feedItems, isConnected } = useMatchFeed(5);
  // if (!isConnected || feedItems.length === 0) {
  //   return null;
  // }

  return (
    <motion.div
      className="fixed top-20 right-4 w-80 max-w-[calc(100vw-2rem)] z-30 rounded-lg border-2 border-wood-dark bg-gradient-to-br from-wood to-wood-dark shadow-wood px-3 py-2"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">📢</span>
        <p className="font-minecraft text-xs text-gold tracking-wide">BAR GOSSIP</p>
        {!isConnected && (
          <span className="text-[9px] text-muted-foreground">(offline)</span>
        )}
      </div>
      <div className="max-h-48 overflow-y-auto space-y-2 ledger-scrollbar">
        <AnimatePresence>
          {feedItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="rounded-pixel border border-gold/30 bg-background/30 px-2 py-1.5 text-xs"
            >
              <p className="font-minecraft text-[10px] text-gold">
                {item.winnerLabel} won {item.playerOneScore} - {item.playerTwoScore}
              </p>
              <p className="text-[9px] text-muted-foreground mt-0.5">
                {new Date(item.timestamp).toLocaleTimeString()}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

