// Performance optimization utilities for the Dreamer AI website

/**
 * Image lazy loading utility with Intersection Observer
 */
export class LazyImageLoader {
  private observer: IntersectionObserver | null = null;
  private loaded: Set<string> = new Set();

  constructor(options?: IntersectionObserverInit) {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        this.handleIntersection.bind(this),
        {
          rootMargin: '50px 0px',
          threshold: 0.01,
          ...options
        }
      );
    }
  }

  private handleIntersection(entries: IntersectionObserverEntry[]) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        this.loadImage(img);
        this.observer?.unobserve(img);
      }
    });
  }

  private loadImage(img: HTMLImageElement) {
    const src = img.dataset.src;
    if (src && !this.loaded.has(src)) {
      img.src = src;
      img.classList.add('loaded');
      this.loaded.add(src);
      
      img.onload = () => {
        img.classList.add('fade-in');
      };
    }
  }

  observe(img: HTMLImageElement) {
    if (this.observer) {
      this.observer.observe(img);
    } else {
      // Fallback for browsers without IntersectionObserver
      this.loadImage(img);
    }
  }

  disconnect() {
    this.observer?.disconnect();
  }
}

/**
 * Resource preloader for critical assets
 */
export class ResourcePreloader {
  private preloadedResources: Set<string> = new Set();

  preloadImage(src: string, priority: 'high' | 'low' = 'low'): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.preloadedResources.has(src)) {
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.rel = priority === 'high' ? 'preload' : 'prefetch';
      link.as = 'image';
      link.href = src;
      
      link.onload = () => {
        this.preloadedResources.add(src);
        resolve();
      };
      
      link.onerror = () => reject(new Error(`Failed to preload ${src}`));
      
      document.head.appendChild(link);
    });
  }

  preloadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.preloadedResources.has(src)) {
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'script';
      link.href = src;
      
      link.onload = () => {
        this.preloadedResources.add(src);
        resolve();
      };
      
      link.onerror = () => reject(new Error(`Failed to preload script ${src}`));
      
      document.head.appendChild(link);
    });
  }

  preloadFont(href: string, format: 'woff2' | 'woff' | 'ttf' = 'woff2'): void {
    if (this.preloadedResources.has(href)) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = `font/${format}`;
    link.href = href;
    link.crossOrigin = 'anonymous';
    
    document.head.appendChild(link);
    this.preloadedResources.add(href);
  }
}

/**
 * Bundle analyzer and code splitting optimizer
 */
export class BundleOptimizer {
  static async loadComponent(componentPath: string) {
    try {
      const module = await import(componentPath);
      return module.default || module;
    } catch (error) {
      console.error(`Failed to load component: ${componentPath}`, error);
      throw error;
    }
  }

  static createChunkOptimizer() {
    return {
      // Critical components that should be loaded immediately
      critical: [
        'Header',
        'Hero', 
        'Footer'
      ],
      
      // Components that can be loaded lazily
      lazy: [
        'Dashboard',
        'Interactive',
        'VideoShowcase',
        'About',
        'Contact'
      ],

      // Third-party libraries that should be loaded separately
      vendor: [
        'recharts',
        'framer-motion',
        'axios'
      ]
    };
  }

  static optimizeRechartsBundleSize() {
    // Only import used recharts components to reduce bundle size
    return {
      BarChart: () => import('recharts').then(m => ({ BarChart: m.BarChart })),
      LineChart: () => import('recharts').then(m => ({ LineChart: m.LineChart })),
      AreaChart: () => import('recharts').then(m => ({ AreaChart: m.AreaChart })),
      PieChart: () => import('recharts').then(m => ({ PieChart: m.PieChart })),
      RadialBarChart: () => import('recharts').then(m => ({ RadialBarChart: m.RadialBarChart }))
    };
  }
}

/**
 * API response caching with TTL and LRU eviction
 */
export class APICache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private maxSize: number;

  constructor(maxSize = 50) {
    this.maxSize = maxSize;
  }

  set(key: string, data: any, ttlMinutes = 5): void {
    // Implement LRU eviction
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    });
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    // Check if expired
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Move to end for LRU
    this.cache.delete(key);
    this.cache.set(key, cached);
    
    return cached.data;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Clean expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Debounced search and input handler
 */
export function createDebouncer<T extends (...args: any[]) => void>(
  fn: T, 
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Virtual scrolling implementation for large lists
 */
export class VirtualScroller {
  private container: HTMLElement;
  private itemHeight: number;
  private buffer: number;
  private startIndex = 0;
  private endIndex = 0;

  constructor(container: HTMLElement, itemHeight: number, buffer = 5) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.buffer = buffer;
  }

  calculateVisibleRange(scrollTop: number, containerHeight: number, totalItems: number) {
    const visibleStart = Math.floor(scrollTop / this.itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / this.itemHeight),
      totalItems - 1
    );

    this.startIndex = Math.max(0, visibleStart - this.buffer);
    this.endIndex = Math.min(totalItems - 1, visibleEnd + this.buffer);

    return {
      startIndex: this.startIndex,
      endIndex: this.endIndex,
      offsetY: this.startIndex * this.itemHeight
    };
  }

  getVisibleItems<T>(items: T[], scrollTop: number, containerHeight: number): {
    visibleItems: T[];
    offsetY: number;
    totalHeight: number;
  } {
    const { startIndex, endIndex, offsetY } = this.calculateVisibleRange(
      scrollTop, 
      containerHeight, 
      items.length
    );

    return {
      visibleItems: items.slice(startIndex, endIndex + 1),
      offsetY,
      totalHeight: items.length * this.itemHeight
    };
  }
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  static measureComponentRender(componentName: string) {
    return {
      start: () => performance.mark(`${componentName}-start`),
      end: () => {
        performance.mark(`${componentName}-end`);
        performance.measure(
          `${componentName}-render`, 
          `${componentName}-start`, 
          `${componentName}-end`
        );
        
        const measure = performance.getEntriesByName(`${componentName}-render`)[0];
        return measure.duration;
      }
    };
  }

  static measureAPICall(endpoint: string) {
    const startTime = performance.now();
    
    return {
      finish: () => {
        const duration = performance.now() - startTime;
        console.log(`API call to ${endpoint} took ${duration.toFixed(2)}ms`);
        
        // Send to analytics if available
        if (typeof gtag !== 'undefined') {
          gtag('event', 'api_performance', {
            event_category: 'performance',
            event_label: endpoint,
            value: Math.round(duration)
          });
        }
        
        return duration;
      }
    };
  }

  static getPagePerformanceMetrics() {
    if (!performance.getEntriesByType) return null;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    return {
      // Core Web Vitals
      FCP: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      LCP: performance.getEntriesByType('largest-contentful-paint')[0]?.startTime || 0,
      
      // Load times
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      
      // Network
      dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcpConnection: navigation.connectEnd - navigation.connectStart,
      serverResponse: navigation.responseEnd - navigation.requestStart,
      
      // Processing
      domProcessing: navigation.domComplete - navigation.domInteractive,
      totalPageLoad: navigation.loadEventEnd - navigation.fetchStart
    };
  }
}

// Create global instances for easy access
export const imageLoader = new LazyImageLoader();
export const resourcePreloader = new ResourcePreloader();
export const apiCache = new APICache(100);

// Cleanup expired cache entries every 10 minutes
setInterval(() => apiCache.cleanup(), 10 * 60 * 1000);

declare global {
  function gtag(...args: any[]): void;
}