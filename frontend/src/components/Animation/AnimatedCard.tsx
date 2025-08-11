import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className = '',
  delay = 0,
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.5,
        delay: prefersReducedMotion ? 0 : delay,
        ease: 'easeOut',
      }}
      whileHover={
        prefersReducedMotion
          ? {}
          : {
              scale: 1.05,
              transition: { duration: 0.2 },
            }
      }
      whileTap={
        prefersReducedMotion
          ? {}
          : {
              scale: 0.95,
              transition: { duration: 0.1 },
            }
      }
    >
      {children}
    </motion.div>
  );
};

export default AnimatedCard;