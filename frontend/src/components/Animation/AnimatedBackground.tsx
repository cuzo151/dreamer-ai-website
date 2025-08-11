import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface AnimatedBackgroundProps {
  variant?: 'gradient' | 'shapes' | 'particles';
  className?: string;
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  variant = 'gradient',
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();

  if (variant === 'gradient') {
    return (
      <div className={`absolute inset-0 overflow-hidden ${className}`}>
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 opacity-20"
          animate={
            prefersReducedMotion
              ? {}
              : {
                  backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
                }
          }
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            backgroundSize: '200% 200%',
          }}
        />
      </div>
    );
  }

  if (variant === 'shapes') {
    return (
      <div className={`absolute inset-0 overflow-hidden ${className}`}>
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-br from-blue-400 to-purple-500 opacity-10"
            style={{
              width: `${Math.random() * 400 + 100}px`,
              height: `${Math.random() * 400 + 100}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={
              prefersReducedMotion
                ? {}
                : {
                    x: [0, Math.random() * 100 - 50],
                    y: [0, Math.random() * 100 - 50],
                    scale: [1, 1.2, 1],
                  }
            }
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'particles') {
    return (
      <div className={`absolute inset-0 overflow-hidden ${className}`}>
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={
              prefersReducedMotion
                ? {}
                : {
                    y: [-20, -100],
                    opacity: [0, 1, 0],
                  }
            }
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>
    );
  }

  return null;
};

export default AnimatedBackground;