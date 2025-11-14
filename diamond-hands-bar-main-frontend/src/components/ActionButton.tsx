import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface ActionButtonProps {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'hold' | 'secure';
  icon?: string;
}

export const ActionButton = ({ 
  children, 
  onClick, 
  disabled = false, 
  variant = 'hold',
  icon 
}: ActionButtonProps) => {
  const variants = {
    hold: 'bg-gradient-to-br from-gold to-gold-glow text-wood-dark shadow-glow-gold border-2 border-gold-glow',
    secure: 'bg-gradient-to-br from-diamond to-diamond-glow text-wood-dark shadow-glow-diamond border-2 border-diamond-glow'
  };

  return (
    <motion.button
      className={`
        button-3d relative px-8 py-4 rounded-pixel
        font-minecraft text-sm font-bold
        ${variants[variant]}
        ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer hover:brightness-110'}
        transition-all duration-200 transform
      `}
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95, y: 2 } : {}}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <span className="flex items-center gap-2">
        {icon && <span className="text-lg">{icon}</span>}
        {children}
      </span>
      
      {!disabled && (
        <motion.div
          className="absolute inset-0 rounded-pixel bg-white/20"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 0.3 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </motion.button>
  );
};