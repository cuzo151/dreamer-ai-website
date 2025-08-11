import React from 'react';

interface AnimatedBackgroundProps {
  variant?: string;
  className?: string;
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ className }) => {
  return <div className={className}></div>;
};

export default AnimatedBackground;