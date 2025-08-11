import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { ShieldCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export interface WidgetConfig {
  id: string;
  name: string;
  type: 'iframe' | 'script' | 'component';
  src?: string;
  scriptUrl?: string;
  component?: React.ComponentType<any>;
  props?: Record<string, any>;
  security: {
    allowedOrigins: string[];
    sandboxRules: string[];
    contentSecurityPolicy?: string;
  };
  loading?: {
    showLoader?: boolean;
    timeout?: number;
    retryCount?: number;
  };
  dimensions?: {
    width?: string | number;
    height?: string | number;
    minWidth?: string | number;
    minHeight?: string | number;
  };
  responsive?: boolean;
  lazyLoad?: boolean;
}

interface WidgetContainerProps {
  config: WidgetConfig;
  className?: string;
  onLoad?: (widgetId: string) => void;
  onError?: (widgetId: string, error: string) => void;
  onMessage?: (widgetId: string, message: any) => void;
  fallbackContent?: React.ReactNode;
}

interface WidgetState {
  status: 'idle' | 'loading' | 'loaded' | 'error';
  error?: string;
  retryCount: number;
  isVisible: boolean;
}

const WidgetContainer: React.FC<WidgetContainerProps> = ({
  config,
  className = '',
  onLoad,
  onError,
  onMessage,
  fallbackContent
}) => {
  const [state, setState] = useState<WidgetState>({
    status: 'idle',
    retryCount: 0,
    isVisible: false
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const {
    loading = { showLoader: true, timeout: 15000, retryCount: 3 },
    dimensions = { width: '100%', height: 400 },
    security,
    lazyLoad = true
  } = config;

  // Validate widget origin against allowed origins
  const isOriginAllowed = useCallback((origin: string): boolean => {
    return security.allowedOrigins.some(allowed => {
      if (allowed === '*') return true;
      if (allowed.startsWith('*.')) {
        return origin.endsWith(allowed.slice(1));
      }
      return origin === allowed;
    });
  }, [security.allowedOrigins]);

  // Handle widget load success
  const handleLoad = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setState(prev => ({ ...prev, status: 'loaded', error: undefined }));
    onLoad?.(config.id);
  }, [config.id, onLoad]);

  // Handle widget load error
  const handleError = useCallback((error: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setState(prev => ({ 
      ...prev, 
      status: 'error', 
      error,
      retryCount: prev.retryCount + 1 
    }));
    onError?.(config.id, error);
  }, [config.id, onError]);

  // Retry widget loading
  const retryLoad = useCallback(() => {
    if (state.retryCount >= (loading.retryCount || 3)) {
      handleError('Maximum retry attempts reached');
      return;
    }

    setState(prev => ({ 
      ...prev, 
      status: 'loading', 
      error: undefined 
    }));

    // Force reload based on widget type
    if (config.type === 'iframe' && iframeRef.current) {
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = '';
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = currentSrc;
        }
      }, 100);
    }
  }, [state.retryCount, loading.retryCount, config.type, handleError]);

  // Setup intersection observer for lazy loading
  useEffect(() => {
    if (!lazyLoad || state.isVisible) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState(prev => ({ ...prev, isVisible: true, status: 'loading' }));
          observerRef.current?.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (containerRef.current) {
      observerRef.current.observe(containerRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [lazyLoad, state.isVisible]);

  // Setup loading timeout
  useEffect(() => {
    if (state.status === 'loading') {
      timeoutRef.current = setTimeout(() => {
        handleError('Loading timeout exceeded');
      }, loading.timeout || 15000);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [state.status, loading.timeout, handleError]);

  // Handle postMessage communication
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!isOriginAllowed(event.origin)) {
        console.warn(`Widget ${config.id}: Blocked message from unauthorized origin:`, event.origin);
        return;
      }

      onMessage?.(config.id, event.data);
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [config.id, isOriginAllowed, onMessage]);

  // Auto-start loading if not lazy loading
  useEffect(() => {
    if (!lazyLoad && state.status === 'idle') {
      setState(prev => ({ ...prev, status: 'loading', isVisible: true }));
    }
  }, [lazyLoad, state.status]);

  // Generate sandbox rules
  const getSandboxRules = (): string => {
    const defaultRules = ['allow-scripts', 'allow-same-origin'];
    const allRules = [...defaultRules, ...security.sandboxRules];
    const uniqueRules = Array.from(new Set(allRules));
    return uniqueRules.join(' ');
  };

  // Render loading state
  if (state.status === 'loading' && loading.showLoader) {
    return (
      <div 
        ref={containerRef}
        className={`widget-container ${className}`}
        style={dimensions}
      >
        <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
          <div className="text-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading {config.name}...</p>
            {state.retryCount > 0 && (
              <p className="text-sm text-gray-500 mt-2">
                Retry attempt {state.retryCount} of {loading.retryCount || 3}
              </p>
            )}
            <div className="flex items-center justify-center mt-3 text-xs text-gray-500">
              <ShieldCheckIcon className="h-4 w-4 mr-1" />
              <span>Secure Widget</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (state.status === 'error') {
    return (
      <div 
        ref={containerRef}
        className={`widget-container ${className}`}
        style={dimensions}
      >
        <div className="flex items-center justify-center h-full bg-red-50 rounded-lg border border-red-200">
          <div className="text-center p-6">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-900 mb-2">Widget Load Failed</h3>
            <p className="text-red-700 mb-4">{state.error}</p>
            
            {fallbackContent || (
              <div className="space-y-3">
                {state.retryCount < (loading.retryCount || 3) && (
                  <button
                    onClick={retryLoad}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Try Again ({(loading.retryCount || 3) - state.retryCount} attempts left)
                  </button>
                )}
                <p className="text-sm text-red-600">
                  {config.name} is currently unavailable
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Don't render anything if not visible and lazy loading
  if (lazyLoad && !state.isVisible) {
    return (
      <div 
        ref={containerRef}
        className={`widget-placeholder ${className}`}
        style={dimensions}
      >
        <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
          <p className="text-gray-600">Click to load {config.name}</p>
        </div>
      </div>
    );
  }

  // Render widget based on type
  const renderWidget = () => {
    switch (config.type) {
      case 'iframe':
        return (
          <iframe
            ref={iframeRef}
            className="w-full h-full rounded-lg"
            src={config.src}
            title={config.name}
            sandbox={getSandboxRules()}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            loading="lazy"
            onLoad={handleLoad}
            onError={() => handleError('Failed to load iframe')}
            style={{ border: 'none' }}
          />
        );

      case 'component':
        if (!config.component) {
          handleError('No component specified');
          return null;
        }
        
        return (
          <Suspense fallback={<div>Loading component...</div>}>
            <config.component 
              {...config.props} 
              onLoad={() => handleLoad()}
              onError={(err: string) => handleError(err)}
            />
          </Suspense>
        );

      case 'script':
        // Script widgets require special handling
        return (
          <div 
            className="widget-script-container"
            ref={containerRef}
            onLoad={handleLoad}
            onError={() => handleError('Script load failed')}
          />
        );

      default:
        handleError(`Unsupported widget type: ${config.type}`);
        return null;
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`widget-container ${className}`}
      style={dimensions}
    >
      {renderWidget()}
      
      {/* Security indicator */}
      <div className="absolute top-2 right-2 bg-white bg-opacity-90 rounded px-2 py-1">
        <div className="flex items-center text-xs text-gray-600">
          <ShieldCheckIcon className="h-3 w-3 mr-1" />
          <span>Secure</span>
        </div>
      </div>
    </div>
  );
};

export default WidgetContainer;