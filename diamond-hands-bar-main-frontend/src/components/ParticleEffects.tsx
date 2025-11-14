import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export const ParticleEffects = () => {
  const [particles, setParticles] = useState<number[]>([]);

  useEffect(() => {
    // Generate random particles
    setParticles(Array.from({ length: 15 }, (_, i) => i));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map((id) => (
        <motion.div
          key={id}
          className="absolute w-1 h-1 bg-lantern rounded-full opacity-60"
          initial={{
            x: Math.random() * window.innerWidth,
            y: window.innerHeight + 10,
          }}
          animate={{
            y: -10,
            x: Math.random() * window.innerWidth,
          }}
          transition={{
            duration: 15 + Math.random() * 10,
            repeat: Infinity,
            delay: Math.random() * 10,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
};