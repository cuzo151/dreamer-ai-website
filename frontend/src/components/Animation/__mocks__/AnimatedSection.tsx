import React from 'react';

interface AnimatedSectionProps {
  children: React.ReactNode;
  animation?: string;
  delay?: number;
  className?: string;
}

const AnimatedSection: React.FC<AnimatedSectionProps> = ({ children, className }) => {
  return <div className={className}>{children}</div>;
};

export default AnimatedSection;