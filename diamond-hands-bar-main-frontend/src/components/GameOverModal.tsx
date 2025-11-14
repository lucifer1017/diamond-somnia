import { motion, AnimatePresence } from 'framer-motion';
import { Player } from '@/types/game';

interface GameOverModalProps {
  winner: Player | null;
  onNewGame: () => void;
  isVisible: boolean;
}

export const GameOverModal = ({ winner, onNewGame, isVisible }: GameOverModalProps) => {
  if (!winner) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          
          {/* Modal */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <div className="relative bg-gradient-to-br from-wood to-wood-dark p-8 rounded-lg border-4 border-gold shadow-2xl max-w-md w-full">
              {/* Victory Glow */}
              <motion.div
                className="absolute inset-0 rounded-lg bg-gradient-radial from-gold-glow/20 to-transparent"
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                  scale: [1, 1.05, 1]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              
              {/* Content */}
              <div className="relative text-center">
                <motion.div
                  className="text-6xl mb-4"
                  animate={{
                    rotate: [0, -10, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  🏆
                </motion.div>
                
                <h2 className="font-minecraft text-xl text-gold mb-2">
                  VICTORY!
                </h2>
                
                <p className="font-minecraft text-sm text-foreground mb-4">
                  PLAYER {winner.id} WINS!
                </p>
                
                <div className="bg-background/50 rounded p-3 mb-6">
                  <p className="text-sm text-muted-foreground mb-1">Final Score</p>
                  <motion.p
                    className="text-3xl font-bold text-gold"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.3 }}
                  >
                    {winner.totalScore}
                  </motion.p>
                </div>
                
                <motion.button
                  className="button-3d w-full bg-gradient-gold text-background font-minecraft text-sm py-3 px-6 rounded-pixel"
                  onClick={onNewGame}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  NEW GAME
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};