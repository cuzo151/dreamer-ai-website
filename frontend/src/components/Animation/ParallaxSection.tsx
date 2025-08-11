import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface ParallaxSectionProps {
  children: React.ReactNode;
  className?: string;
  speed?: number;
  offset?: number[];
}

const ParallaxSection: React.FC<ParallaxSectionProps> = ({
  children,
  className = '',
  speed = 0.5,
  offset = [0, 100],
}) => {
  const { scrollYProgress } = useScroll();
  const prefersReducedMotion = useReducedMotion();
  
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReducedMotion ? [0, 0] : [offset[0] * speed, offset[1] * speed]
  );

  return (
    <motion.div
      className={className}
      style={{ y }}
    >
      {children}
    </motion.div>
  );
};

export default ParallaxSection;