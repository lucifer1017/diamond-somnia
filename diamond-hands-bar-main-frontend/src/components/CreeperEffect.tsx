import { motion, AnimatePresence } from 'framer-motion';

interface CreeperEffectProps {
  isActive: boolean;
}

export const CreeperEffect = ({ isActive }: CreeperEffectProps) => {
  return (
    <AnimatePresence>
      {isActive && (
        <>
          {/* Screen Flash */}
          <motion.div
            className="fixed inset-0 bg-creeper z-50 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.8, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
          
          {/* Explosion Text */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [1, 2, 2.5],
              opacity: [1, 1, 0],
              rotate: [0, -5, 5, 0]
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="font-minecraft text-4xl text-destructive drop-shadow-2xl">
              BOOM!
            </div>
          </motion.div>
          
          {/* Screen Shake */}
          <motion.div
            className="fixed inset-0 z-40 pointer-events-none"
            animate={{
              x: [0, -10, 10, -10, 10, 0],
              y: [0, 10, -10, 10, -10, 0]
            }}
            transition={{ duration: 0.5 }}
          />
        </>
      )}
    </AnimatePresence>
  );
};