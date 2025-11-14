import { motion, AnimatePresence } from 'framer-motion';
import { Player } from '@/types/game';

interface ScoreDisplayProps {
  player: Player;
  position: 'left' | 'right';
}

export const ScoreDisplay = ({ player, position }: ScoreDisplayProps) => {
  return (
    <motion.div
      className={`
        relative p-4 rounded-lg bg-gradient-to-br from-wood to-wood-dark
        border-2 border-wood-dark shadow-xl
        ${position === 'left' ? 'text-left' : 'text-right'}
        ${player.isActive ? 'ring-2 ring-gold ring-offset-2 ring-offset-background' : ''}
      `}
      initial={{ x: position === 'left' ? -100 : 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, type: "spring" }}
    >
      {/* Active Player Indicator */}
      {player.isActive && (
        <motion.div
          className="absolute -top-2 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-gold text-xs font-minecraft">ACTIVE</span>
        </motion.div>
      )}
      
      {/* Player Name */}
      <h3 className="font-minecraft text-sm text-gold mb-3">
        PLAYER {player.id}
      </h3>
      
      {/* Round Score */}
      <div className="mb-2">
        <span className="text-xs text-muted-foreground">Round:</span>
        <AnimatePresence mode="wait">
          <motion.div
            key={player.roundScore}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-2xl font-bold text-foreground"
          >
            {player.roundScore}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Total Score */}
      <div className="pt-2 border-t border-wood-dark/50">
        <span className="text-xs text-muted-foreground">Total:</span>
        <AnimatePresence mode="wait">
          <motion.div
            key={player.totalScore}
            initial={{ scale: 1.2, opacity: 0, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            transition={{ duration: 0.4 }}
            className="text-xl font-bold text-gold"
          >
            {player.totalScore}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Secured Indicator */}
      {player.hasSecured && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -bottom-2 left-1/2 transform -translate-x-1/2
                     bg-accent px-2 py-1 rounded text-xs font-minecraft text-accent-foreground"
        >
          SECURED
        </motion.div>
      )}
    </motion.div>
  );
};