import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  className?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  className = '',
  disabled = false,
  fullWidth = false,
  type = 'button',
}) => {
  const prefersReducedMotion = useReducedMotion();

  const baseClasses = 'font-semibold rounded-md transition-all duration-300 relative overflow-hidden';
  
  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-6 py-3 text-sm',
    large: 'px-8 py-4 text-base',
  };

  const variantClasses = {
    primary: 'bg-dreamer-blue text-white hover:bg-blue-600 shadow-sm hover:shadow-lg',
    secondary: 'bg-white text-dreamer-blue border-2 border-dreamer-blue hover:bg-dreamer-blue hover:text-white',
    ghost: 'text-dreamer-blue hover:bg-blue-50',
  };

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
  const widthClasses = fullWidth ? 'w-full' : '';

  return (
    <motion.button
      type={type}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${disabledClasses} ${widthClasses} ${className}`}
      onClick={onClick}
      disabled={disabled}
      whileHover={
        !disabled && !prefersReducedMotion
          ? {
              scale: 1.05,
              transition: { duration: 0.2 },
            }
          : {}
      }
      whileTap={
        !disabled && !prefersReducedMotion
          ? {
              scale: 0.95,
              transition: { duration: 0.1 },
            }
          : {}
      }
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.span
        className="relative z-10"
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
      >
        {children}
      </motion.span>
      
      {variant === 'primary' && !prefersReducedMotion && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700"
          initial={{ x: '-100%' }}
          whileHover={{ x: 0 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.button>
  );
};

export default AnimatedButton;