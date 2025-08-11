import React from 'react';

interface LoadingAnimationProps {
  variant?: string;
  size?: string;
  color?: string;
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = () => {
  return <div>Loading...</div>;
};

export default LoadingAnimation;