import { useEffect, useRef, useState } from 'react';

interface UseParallaxProps {
  speed?: number;
  offset?: number;
}

export const useParallax = ({ speed = 0.5, offset = 0 }: UseParallaxProps = {}) => {
  const elementRef = useRef<HTMLElement | null>(null);
  const [parallaxOffset, setParallaxOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!elementRef.current) return;

      const rect = elementRef.current.getBoundingClientRect();
      const elementTop = rect.top + window.scrollY;
      const scrolled = window.scrollY;
      const rate = (scrolled - elementTop) * speed;

      setParallaxOffset(rate + offset);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial calculation

    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed, offset]);

  return { ref: elementRef, parallaxOffset };
};