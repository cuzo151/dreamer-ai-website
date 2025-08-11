import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface LoadingAnimationProps {
  variant?: 'spinner' | 'dots' | 'pulse';
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  variant = 'spinner',
  size = 'medium',
  color = '#0096FF',
}) => {
  const prefersReducedMotion = useReducedMotion();

  const sizes = {
    small: 24,
    medium: 40,
    large: 60,
  };

  const currentSize = sizes[size];

  if (variant === 'spinner') {
    return (
      <motion.div
        className="inline-block"
        style={{
          width: currentSize,
          height: currentSize,
        }}
        animate={prefersReducedMotion ? {} : { rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="31.4"
            strokeDashoffset="10"
            opacity="0.25"
          />
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="31.4"
            strokeDashoffset="25"
          />
        </svg>
      </motion.div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className="flex space-x-2">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="rounded-full"
            style={{
              width: currentSize / 3,
              height: currentSize / 3,
              backgroundColor: color,
            }}
            animate={
              prefersReducedMotion
                ? {}
                : {
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }
            }
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: index * 0.2,
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <motion.div
        className="rounded-full"
        style={{
          width: currentSize,
          height: currentSize,
          backgroundColor: color,
        }}
        animate={
          prefersReducedMotion
            ? {}
            : {
                scale: [1, 1.2, 1],
                opacity: [0.7, 0.3, 0.7],
              }
        }
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    );
  }

  return null;
};

export default LoadingAnimation;