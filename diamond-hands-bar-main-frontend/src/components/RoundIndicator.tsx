import { motion } from 'framer-motion';

interface RoundIndicatorProps {
  currentRound: number;
  totalRounds: number;
}

export const RoundIndicator = ({ currentRound, totalRounds }: RoundIndicatorProps) => {
  return (
    <motion.div
      className="relative bg-gradient-to-br from-wood to-wood-dark rounded-pixel px-4 py-2 border-2 border-wood-dark shadow-lg"
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, type: "spring" }}
    >
      <div className="text-center">
        <span className="font-minecraft text-xs text-muted-foreground">ROUND</span>
        <div className="flex items-center gap-1 justify-center mt-1">
          <motion.span
            key={currentRound}
            className="text-2xl font-bold text-gold"
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {currentRound}
          </motion.span>
          <span className="text-lg text-muted-foreground">/</span>
          <span className="text-lg text-foreground">{totalRounds}</span>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mt-2 h-1 bg-wood-dark rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-gold"
          initial={{ width: 0 }}
          animate={{ width: `${(currentRound / totalRounds) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
};