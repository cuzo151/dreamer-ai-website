/**
 * Performance Configuration for Dreamer AI Solutions
 * Optimizations for Core Web Vitals and overall performance
 */

export const PERFORMANCE_CONFIG = {
  // Image optimization settings
  images: {
    formats: ['webp', 'avif', 'jpg', 'png'],
    sizes: {
      hero: '1920x1080',
      card: '400x300',
      avatar: '150x150',
      thumbnail: '200x200'
    },
    quality: {
      high: 90,
      medium: 75,
      low: 60
    },
    lazy_loading: {
      threshold: '10px',
      fadeIn: true
    }
  },

  // Bundle splitting configuration
  chunks: {
    vendor: ['react', 'react-dom', 'framer-motion'],
    ui: ['@heroicons/react'],
    animations: ['framer-motion'],
    utilities: ['axios', 'date-fns']
  },

  // Caching strategies
  caching: {
    static_assets: {
      maxAge: 31536000, // 1 year
      immutable: true
    },
    api_responses: {
      maxAge: 300, // 5 minutes
      staleWhileRevalidate: 86400 // 24 hours
    },
    images: {
      maxAge: 2592000, // 30 days
      staleWhileRevalidate: 86400 // 24 hours
    }
  },

  // Critical resource hints
  preload: [
    '/fonts/inter-var.woff2',
    '/logo192.png'
  ],

  prefetch: [
    '/api/content/industries',
    '/api/content/capabilities'
  ],

  // Animation performance
  animations: {
    reducedMotion: {
      respectPreference: true,
      fallback: 'crossfade'
    },
    performance: {
      willChange: ['transform', 'opacity'],
      useGPU: true,
      optimize: true
    }
  },

  // Core Web Vitals targets
  vitals: {
    lcp: 2.5, // Largest Contentful Paint (seconds)
    fid: 100, // First Input Delay (milliseconds)
    cls: 0.1,  // Cumulative Layout Shift
    fcp: 1.8,  // First Contentful Paint (seconds)
    ttfb: 600  // Time to First Byte (milliseconds)
  }
};

// Intersection Observer configuration for lazy loading
export const INTERSECTION_CONFIG = {
  rootMargin: '50px 0px',
  threshold: 0.1
};

// Service Worker configuration
export const SW_CONFIG = {
  precache: [
    '/',
    '/static/css/main.css',
    '/static/js/main.js',
    '/logo192.png',
    '/manifest.json'
  ],
  runtimeCache: [
    {
      urlPattern: /^https:\/\/api\.dreamerai\.solutions/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 300 // 5 minutes
        }
      }
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 2592000 // 30 days
        }
      }
    }
  ]
};

// Performance monitoring configuration
export const MONITORING_CONFIG = {
  // Web Vitals reporting
  vitals: {
    reportAllChanges: true,
    onLCP: (metric: any) => {
      console.log('LCP:', metric);
      // Send to analytics
    },
    onFID: (metric: any) => {
      console.log('FID:', metric);
      // Send to analytics
    },
    onCLS: (metric: any) => {
      console.log('CLS:', metric);
      // Send to analytics
    }
  },

  // Resource timing
  resourceTiming: {
    enabled: true,
    threshold: 1000, // Report resources taking longer than 1s
    maxEntries: 150
  },

  // User timing marks
  userTiming: {
    marks: [
      'app-init',
      'app-loaded',
      'hero-visible',
      'content-interactive'
    ],
    measures: [
      { name: 'app-load-time', start: 'app-init', end: 'app-loaded' },
      { name: 'hero-render-time', start: 'navigationStart', end: 'hero-visible' }
    ]
  }
};

// Bundle analysis configuration
export const BUNDLE_ANALYSIS = {
  enabled: process.env.ANALYZE_BUNDLE === 'true',
  options: {
    analyzerMode: 'static',
    openAnalyzer: false,
    reportFilename: 'bundle-analysis.html'
  }
};

// Compression settings
export const COMPRESSION_CONFIG = {
  gzip: {
    enabled: true,
    level: 6,
    threshold: 1024
  },
  brotli: {
    enabled: true,
    quality: 6,
    threshold: 1024
  }
};

// CDN configuration
export const CDN_CONFIG = {
  enabled: process.env.NODE_ENV === 'production',
  baseUrl: 'https://cdn.dreamerai.solutions',
  domains: [
    'cdn.dreamerai.solutions',
    'images.dreamerai.solutions'
  ],
  regions: ['us-east-1', 'eu-west-1', 'ap-southeast-1']
};

// Performance utilities
export const performanceUtils = {
  // Debounce function for performance-sensitive operations
  debounce: (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Throttle function for scroll/resize events
  throttle: (func: Function, limit: number) => {
    let inThrottle: boolean;
    return function executedFunction(this: any, ...args: any[]) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Preload critical resources
  preloadResource: (href: string, as: string, type?: string) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (type) link.type = type;
    document.head.appendChild(link);
  },

  // Prefetch resources for next navigation
  prefetchResource: (href: string) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  },

  // Check if user prefers reduced motion
  prefersReducedMotion: () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  // Get connection type for adaptive loading
  getConnectionType: () => {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    return connection?.effectiveType || 'unknown';
  },

  // Adaptive loading based on connection
  shouldLoadHighQuality: () => {
    const connectionType = performanceUtils.getConnectionType();
    return ['4g', 'unknown'].includes(connectionType);
  }
};

export default PERFORMANCE_CONFIG;