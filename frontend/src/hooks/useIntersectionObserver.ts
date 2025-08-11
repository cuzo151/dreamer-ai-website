import { useEffect, useRef, useState, useCallback } from 'react';

export interface IntersectionObserverEntry {
  isIntersecting: boolean;
  intersectionRatio: number;
  boundingClientRect: DOMRectReadOnly;
  target: Element;
  time: number;
}

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  freezeOnceVisible?: boolean;
  trackVisibility?: boolean;
  trackTimeInView?: boolean;
  triggerOnce?: boolean;
  onVisibilityChange?: (entry: IntersectionObserverEntry) => void;
}

interface IntersectionObserverResult {
  ref: React.RefObject<Element>;
  entry?: IntersectionObserverEntry;
  isIntersecting: boolean;
  isVisible: boolean;
  visibilityRatio: number;
  timeInView: number;
  hasBeenVisible: boolean;
}

export const useIntersectionObserver = (
  options: UseIntersectionObserverOptions = {}
): IntersectionObserverResult => {
  const {
    root = null,
    rootMargin = '0px',
    threshold = 0,
    freezeOnceVisible = false,
    trackVisibility = false,
    trackTimeInView = false,
    triggerOnce = false,
    onVisibilityChange
  } = options;

  const [entry, setEntry] = useState<IntersectionObserverEntry>();
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const [timeInView, setTimeInView] = useState(0);
  
  const elementRef = useRef<Element | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const timeInViewStartRef = useRef<number | null>(null);
  const timeInViewIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const frozen = entry?.isIntersecting && freezeOnceVisible;

  const updateVisibility = useCallback((observerEntry: IntersectionObserverEntry) => {
    const wasVisible = isVisible;
    const nowVisible = observerEntry.isIntersecting;
    
    setIsVisible(nowVisible);
    
    if (!wasVisible && nowVisible) {
      setHasBeenVisible(true);
      
      if (trackTimeInView) {
        timeInViewStartRef.current = Date.now();
        timeInViewIntervalRef.current = setInterval(() => {
          if (timeInViewStartRef.current) {
            setTimeInView(Date.now() - timeInViewStartRef.current);
          }
        }, 100);
      }
    } else if (wasVisible && !nowVisible) {
      if (trackTimeInView && timeInViewIntervalRef.current) {
        clearInterval(timeInViewIntervalRef.current);
        timeInViewIntervalRef.current = null;
      }
    }

    onVisibilityChange?.(observerEntry);

    // Performance tracking
    if (typeof gtag !== 'undefined' && trackVisibility) {
      if (!wasVisible && nowVisible) {
        gtag('event', 'element_visibility', {
          event_category: 'engagement',
          event_label: 'element_visible',
          custom_parameter_1: observerEntry.target.id || 'unknown',
          custom_parameter_2: observerEntry.intersectionRatio.toString()
        });
      }
    }
  }, [isVisible, trackTimeInView, trackVisibility, onVisibilityChange]);

  useEffect(() => {
    const element = elementRef.current;
    
    // Do nothing if element is not available
    if (!element) return;

    // If frozen or triggered once and already visible, don't observe
    if (frozen || (triggerOnce && hasBeenVisible)) return;

    const observerParams = { root, rootMargin, threshold };
    const hasDifferentParams = observerRef.current && 
      JSON.stringify(observerParams) !== JSON.stringify({
        root: observerRef.current.root,
        rootMargin: observerRef.current.rootMargin,
        threshold: observerRef.current.thresholds
      });

    // Create new observer if params changed or doesn't exist
    if (!observerRef.current || hasDifferentParams) {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      
      observerRef.current = new IntersectionObserver(([entry]) => {
        const enhancedEntry: IntersectionObserverEntry = {
          isIntersecting: entry.isIntersecting,
          intersectionRatio: entry.intersectionRatio,
          boundingClientRect: entry.boundingClientRect,
          target: entry.target,
          time: entry.time
        };

        setEntry(enhancedEntry);
        updateVisibility(enhancedEntry);
      }, observerParams);
    }

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current && element) {
        observerRef.current.unobserve(element);
      }
      
      if (timeInViewIntervalRef.current) {
        clearInterval(timeInViewIntervalRef.current);
      }
    };
  }, [frozen, root, rootMargin, threshold, triggerOnce, hasBeenVisible, updateVisibility]);

  // Create ref callback that stores the element
  const ref = useCallback((element: Element | null) => {
    elementRef.current = element;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (timeInViewIntervalRef.current) {
        clearInterval(timeInViewIntervalRef.current);
      }
    };
  }, []);

  return {
    ref: elementRef as React.RefObject<Element>,
    entry,
    isIntersecting: !!entry?.isIntersecting,
    isVisible,
    visibilityRatio: entry?.intersectionRatio || 0,
    timeInView,
    hasBeenVisible
  };
};

// Hook for tracking multiple elements
export const useMultipleIntersectionObserver = (
  elements: Element[],
  options: UseIntersectionObserverOptions = {}
): Map<Element, IntersectionObserverResult> => {
  const [results, setResults] = useState<Map<Element, IntersectionObserverResult>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (elements.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      setResults(prev => {
        const newResults = new Map(prev);
        
        entries.forEach(entry => {
          const enhancedEntry: IntersectionObserverEntry = {
            isIntersecting: entry.isIntersecting,
            intersectionRatio: entry.intersectionRatio,
            boundingClientRect: entry.boundingClientRect,
            target: entry.target,
            time: entry.time
          };

          newResults.set(entry.target as Element, {
            ref: { current: entry.target as Element },
            entry: enhancedEntry,
            isIntersecting: entry.isIntersecting,
            isVisible: entry.isIntersecting,
            visibilityRatio: entry.intersectionRatio,
            timeInView: 0, // Would need additional tracking
            hasBeenVisible: entry.isIntersecting
          });
        });
        
        return newResults;
      });
    }, options);

    observerRef.current = observer;
    elements.forEach(element => observer.observe(element));

    return () => {
      observer.disconnect();
    };
  }, [elements, options]);

  return results;
};

// Hook for scroll-based performance analytics
export const useScrollPerformanceTracking = () => {
  const [scrollMetrics, setScrollMetrics] = useState({
    scrollDepth: 0,
    maxScrollDepth: 0,
    averageScrollSpeed: 0,
    totalScrollDistance: 0,
    bounceRate: 0
  });

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let lastScrollTime = Date.now();
    let scrollSpeeds: number[] = [];
    let totalDistance = 0;
    let sessionStartTime = Date.now();

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const currentTime = Date.now();
      const distance = Math.abs(currentScrollY - lastScrollY);
      const timeDiff = currentTime - lastScrollTime;
      
      if (timeDiff > 0) {
        const speed = distance / timeDiff;
        scrollSpeeds.push(speed);
        totalDistance += distance;
        
        // Keep only recent speeds for average calculation
        if (scrollSpeeds.length > 50) {
          scrollSpeeds = scrollSpeeds.slice(-50);
        }
      }

      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollDepth = documentHeight > 0 ? (currentScrollY / documentHeight) * 100 : 0;
      const avgSpeed = scrollSpeeds.length > 0 
        ? scrollSpeeds.reduce((sum, speed) => sum + speed, 0) / scrollSpeeds.length 
        : 0;

      setScrollMetrics(prev => ({
        scrollDepth,
        maxScrollDepth: Math.max(prev.maxScrollDepth, scrollDepth),
        averageScrollSpeed: avgSpeed,
        totalScrollDistance: totalDistance,
        bounceRate: (Date.now() - sessionStartTime) < 10000 && scrollDepth < 25 ? 1 : 0
      }));

      lastScrollY = currentScrollY;
      lastScrollTime = currentTime;
    };

    const throttledScrollHandler = throttle(handleScroll, 100);
    window.addEventListener('scroll', throttledScrollHandler, { passive: true });

    return () => {
      window.removeEventListener('scroll', throttledScrollHandler);
    };
  }, []);

  return scrollMetrics;
};

// Throttle utility function
function throttle<T extends (...args: any[]) => void>(func: T, limit: number): T {
  let inThrottle: boolean;
  return ((...args) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  }) as T;
}

declare global {
  function gtag(...args: any[]): void;
}