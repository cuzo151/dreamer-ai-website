import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const ScrollIndicator: React.FC = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-gray-200 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1 }}
    >
      <motion.div
        className="h-full bg-gradient-to-r from-dreamer-blue to-purple-500"
        style={{ width: `${scrollProgress}%` }}
        transition={prefersReducedMotion ? {} : { type: 'spring', stiffness: 400, damping: 40 }}
      />
    </motion.div>
  );
};

export default ScrollIndicator;