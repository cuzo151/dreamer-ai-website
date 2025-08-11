import React from 'react';
import { motion, Variants } from 'framer-motion';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  animation?: 'fadeIn' | 'fadeInUp' | 'fadeInDown' | 'slideInLeft' | 'slideInRight' | 'scale';
  delay?: number;
  duration?: number;
}

const AnimatedSection: React.FC<AnimatedSectionProps> = ({
  children,
  className = '',
  animation = 'fadeInUp',
  delay = 0,
  duration = 0.6,
}) => {
  const { ref, isVisible } = useIntersectionObserver({ threshold: 0.1, freezeOnceVisible: true });
  const prefersReducedMotion = useReducedMotion();

  const animations: Record<string, Variants> = {
    fadeIn: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    },
    fadeInUp: {
      hidden: { opacity: 0, y: 30 },
      visible: { opacity: 1, y: 0 },
    },
    fadeInDown: {
      hidden: { opacity: 0, y: -30 },
      visible: { opacity: 1, y: 0 },
    },
    slideInLeft: {
      hidden: { opacity: 0, x: -50 },
      visible: { opacity: 1, x: 0 },
    },
    slideInRight: {
      hidden: { opacity: 0, x: 50 },
      visible: { opacity: 1, x: 0 },
    },
    scale: {
      hidden: { opacity: 0, scale: 0.8 },
      visible: { opacity: 1, scale: 1 },
    },
  };

  const selectedAnimation = prefersReducedMotion
    ? { hidden: {}, visible: {} }
    : animations[animation];

  return (
    <motion.div
      ref={ref as any}
      className={className}
      initial="hidden"
      animate={isVisible ? 'visible' : 'hidden'}
      variants={selectedAnimation}
      transition={{
        duration: prefersReducedMotion ? 0 : duration,
        delay: prefersReducedMotion ? 0 : delay,
        ease: 'easeOut',
      }}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedSection;