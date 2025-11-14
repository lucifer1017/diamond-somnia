import { motion, AnimatePresence } from 'framer-motion';
import { Card } from './Card';
import { Card as CardType } from '@/types/game';

interface GameTableProps {
  revealedCards: CardType[];
  onCardReveal?: (index: number) => void;
}

export const GameTable = ({ revealedCards, onCardReveal }: GameTableProps) => {
  return (
    <motion.div
      className="game-table relative w-full max-w-4xl mx-auto p-8 rounded-lg"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >

       
      {/* Table Surface */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-wood-light via-wood to-wood-dark opacity-90" />
      
      {/* Wood Grain Pattern Overlay */}
      <div className="absolute inset-0 rounded-lg opacity-10">
        <div className="w-full h-full bg-wood-grain" />
      </div>
      
      {/* Table Edge Highlight */}
      <div className="absolute inset-0 rounded-lg border-4 border-wood-dark shadow-inner" />
      
      {/* Dealing Area Label */}
      <motion.div
        className="relative text-center mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <span className="font-minecraft text-xs text-gold/70 tracking-wide">
          DEALING AREA
        </span>
      </motion.div>
      
      {/* Cards Container */}
      <div className="relative min-h-[140px] flex justify-center items-center gap-4 flex-wrap">
        <AnimatePresence>
          {revealedCards.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="font-minecraft text-xs text-muted-foreground"
            >
              DRAW A CARD TO BEGIN
            </motion.div>
          ) : (
            revealedCards.map((card, index) => (
              <Card
                key={card.id}
                type={card.type}
                isRevealed={card.isRevealed}
                index={index}
                onReveal={() => onCardReveal?.(index)}
              />
            ))
          )}
        </AnimatePresence>
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-gold/30" />
      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-gold/30" />
      <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-gold/30" />
      <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-gold/30" />
    </motion.div>
  );
};