import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { apiCache, PerformanceMonitor } from '../utils/performanceOptimizer';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Cache configuration interface
interface CacheConfig {
  ttl?: number; // Time to live in minutes
  key?: string; // Custom cache key
  enabled?: boolean; // Whether to use cache
}

// Enhanced API call wrapper with caching and performance monitoring
async function cachedApiCall<T>(
  apiCall: () => Promise<AxiosResponse<T>>,
  cacheConfig: CacheConfig = {}
): Promise<T> {
  const { ttl = 5, key, enabled = true } = cacheConfig;
  const cacheKey = key || apiCall.toString();

  // Check cache first
  if (enabled) {
    const cached = apiCache.get(cacheKey);
    if (cached) {
      console.log(`Cache hit for: ${cacheKey}`);
      return cached;
    }
  }

  // Performance monitoring
  const performanceTracker = PerformanceMonitor.measureAPICall(cacheKey);

  try {
    const response = await apiCall();
    const data = response.data;

    // Cache the response
    if (enabled) {
      apiCache.set(cacheKey, data, ttl);
    }

    performanceTracker.finish();
    return data;
  } catch (error) {
    performanceTracker.finish();
    
    // Enhanced error logging
    console.error('API call failed:', {
      endpoint: cacheKey,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    
    throw error;
  }
}

// Request interceptor for performance tracking
api.interceptors.request.use(
  (config) => {
    // Add request timestamp for performance tracking
    config.metadata = { startTime: Date.now() };
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling and performance tracking
api.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const duration = Date.now() - (response.config.metadata?.startTime || 0);
    if (duration > 5000) { // Log slow requests
      console.warn(`Slow API request detected: ${response.config.url} took ${duration}ms`);
    }
    return response;
  },
  (error) => {
    // Enhanced error handling
    if (error.response?.status === 429) {
      console.warn('Rate limit exceeded, consider implementing retry logic');
    } else if (error.code === 'ECONNABORTED') {
      console.error('Request timeout occurred');
    } else if (!error.response) {
      console.error('Network error occurred');
    }
    
    return Promise.reject(error);
  }
);

// Declare module augmentation for metadata
declare module 'axios' {
  interface AxiosRequestConfig {
    metadata?: { startTime: number };
  }
}


export const showcaseAPI = {
  analyzeDocument: async (text: string, type: string = 'general') => {
    return cachedApiCall(
      () => api.post('/showcase/analyze-document', { text, type }),
      { 
        key: `analyze-document-${type}-${text.slice(0, 50)}`, 
        ttl: 10,
        enabled: text.length > 100 // Only cache longer documents
      }
    );
  },
  
  transcribeAudio: async (audioUrl: string) => {
    return cachedApiCall(
      () => api.post('/showcase/transcribe', { audioUrl }),
      { 
        key: `transcribe-${audioUrl}`, 
        ttl: 30 // Audio transcription can be cached longer
      }
    );
  },
  
  analyzeData: async (data: any, analysisType: string = 'general') => {
    return cachedApiCall(
      () => api.post('/showcase/analyze-data', { data, analysisType }),
      { 
        key: `analyze-data-${analysisType}-${JSON.stringify(data).slice(0, 100)}`, 
        ttl: 15
      }
    );
  },
};

export const contactAPI = {
  submit: async (formData: any) => {
    // Contact submissions should not be cached
    return cachedApiCall(
      () => api.post('/contact/submit', formData),
      { enabled: false }
    );
  },
  
  subscribe: async (email: string) => {
    // Newsletter subscriptions should not be cached
    return cachedApiCall(
      () => api.post('/contact/subscribe', { email }),
      { enabled: false }
    );
  },
};

// Cache management utilities
export const cacheUtils = {
  clearAll: () => {
    apiCache.clear();
  },
  
  clearByPattern: (pattern: string) => {
    // Implementation would need to be added to APICache class
    console.log(`Clearing cache entries matching pattern: ${pattern}`);
  },
  
  getCacheStats: () => {
    return {
      size: apiCache.size(),
      maxSize: 100 // This should come from the APICache instance
    };
  }
};

export default api;