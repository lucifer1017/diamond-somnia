import { motion } from 'framer-motion';
import { CardType } from '@/types/game';
import cardBackImage from '@/assets/card-back.png';

interface CardProps {
  type: CardType;
  isRevealed: boolean;
  index: number;
  onReveal?: () => void;
}

const CARD_ICONS: Record<CardType, string> = {
  iron: '⛏️',
  gold: '🏆',
  diamond: '💎',
  creeper: '🧨'
};

const CARD_COLORS: Record<CardType, string> = {
  iron: 'bg-iron',
  gold: 'bg-gold',
  diamond: 'bg-diamond',
  creeper: 'bg-creeper'
};

export const Card = ({ type, isRevealed, index, onReveal }: CardProps) => {
  return (
    <motion.div
      className="relative w-24 h-32 cursor-pointer card-3d"
      initial={{ 
        y: -200, 
        scale: 0.5, 
        opacity: 0 
      }}
      animate={{ 
        y: 0, 
        scale: 1, 
        opacity: 1,
        // THE FIX: Only animate rotateY for the flip.
        rotateY: isRevealed ? 180 : 0
      }}
      transition={{
        delay: index * 0.1,
        duration: 0.6,
        type: "spring",
        stiffness: 100
      }}
      whileHover={!isRevealed ? {
        scale: 1.05,
        y: -5,
        transition: { duration: 0.2 }
      } : {}}
      onClick={onReveal}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Card Back Face (Static - does not need to change) */}
      <div className="card-face absolute inset-0 rounded-pixel border-2 border-wood-dark shadow-card">
        <img 
          src={cardBackImage} 
          alt="Card back" 
          className="w-full h-full object-cover rounded-pixel pixel-art"
        />
      </div>
      
      {/* Card Front Face (Static - pre-rotated) */}
      <div className={`card-face card-back absolute inset-0 rounded-pixel border-2 border-wood-dark shadow-card ${CARD_COLORS[type]} overflow-hidden`}>
        <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-white/10 to-transparent">
          <motion.div
            className="text-4xl mb-2"
            animate={isRevealed && type === 'creeper' ? {
              scale: [1, 1.2, 1],
              rotate: [0, -5, 5, -5, 0]
            } : {}}
            transition={{ duration: 0.5 }}
          >
            {CARD_ICONS[type]}
          </motion.div>
          <span className="font-minecraft text-xs text-card-foreground">
            {type.toUpperCase()}
          </span>
          {type !== 'creeper' && (
            <span className="font-minecraft text-xs text-card-foreground/70 mt-1">
              +{type === 'iron' ? 5 : type === 'gold' ? 10 : 15}
            </span>
          )}
          
          {type === 'diamond' && isRevealed && (
            <motion.div
              className="absolute inset-0 bg-gradient-radial from-diamond-glow/20 to-transparent"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
          
          {type === 'creeper' && isRevealed && (
            <motion.div
              className="absolute inset-0 bg-gradient-creeper opacity-30"
              animate={{ opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 0.5, repeat: 3 }}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
};