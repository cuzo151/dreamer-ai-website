import React from 'react';

const filterMotionProps = (props: any) => {
  const {
    initial,
    animate,
    exit,
    whileHover,
    whileTap,
    whileInView,
    viewport,
    transition,
    variants,
    custom,
    ...rest
  } = props;
  return rest;
};

export const motion = {
  div: React.forwardRef<HTMLDivElement, any>((props, ref) => 
    React.createElement('div', { ...filterMotionProps(props), ref })
  ),
  section: React.forwardRef<HTMLElement, any>((props, ref) => 
    React.createElement('section', { ...filterMotionProps(props), ref })
  ),
  p: React.forwardRef<HTMLParagraphElement, any>((props, ref) => 
    React.createElement('p', { ...filterMotionProps(props), ref })
  ),
  h2: React.forwardRef<HTMLHeadingElement, any>((props, ref) => 
    React.createElement('h2', { ...filterMotionProps(props), ref })
  ),
  form: React.forwardRef<HTMLFormElement, any>((props, ref) => 
    React.createElement('form', { ...filterMotionProps(props), ref })
  ),
  button: React.forwardRef<HTMLButtonElement, any>((props, ref) => 
    React.createElement('button', { ...filterMotionProps(props), ref })
  ),
};

export const AnimatePresence: React.FC<{ children: React.ReactNode; mode?: string }> = ({ children }) => {
  return React.createElement(React.Fragment, {}, children);
};