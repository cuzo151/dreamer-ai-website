import React from 'react';

interface AnimatedButtonProps {
  children: React.ReactNode;
  variant?: string;
  size?: string;
  fullWidth?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({ children, disabled, onClick }) => {
  return <button disabled={disabled} onClick={onClick}>{children}</button>;
};

export default AnimatedButton;