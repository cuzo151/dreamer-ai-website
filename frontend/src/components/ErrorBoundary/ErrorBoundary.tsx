import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ExclamationTriangleIcon, ArrowPathIcon, HomeIcon } from '@heroicons/react/24/outline';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: any;
  level?: 'page' | 'section' | 'component';
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Send error to analytics if available
    if (typeof gtag !== 'undefined') {
      gtag('event', 'error_boundary_triggered', {
        event_category: 'error',
        event_label: error.name,
        custom_parameter_1: error.message,
        custom_parameter_2: this.props.level || 'unknown'
      });
    }

    // Log to external error tracking service (in production)
    this.logErrorToService(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    if (hasError && prevProps.resetOnPropsChange !== resetOnPropsChange) {
      this.resetError();
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId);
    }
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // In production, send to error tracking service like Sentry
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: 'anonymous', // Replace with actual user ID if available
      level: this.props.level || 'unknown',
      errorId: this.state.errorId
    };

    // Mock API call - replace with actual error tracking service
    console.log('Error logged to service:', errorData);
  };

  private resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  private handleRetry = () => {
    this.resetError();
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private renderErrorDetails = () => {
    const { error, errorInfo } = this.state;
    
    if (process.env.NODE_ENV !== 'development') {
      return null;
    }

    return (
      <details className="mt-6 p-4 bg-gray-50 border rounded-lg">
        <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
          Technical Details (Development Mode)
        </summary>
        <div className="mt-3 space-y-2">
          <div>
            <h4 className="text-sm font-semibold text-gray-800">Error:</h4>
            <pre className="text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
              {error?.toString()}
            </pre>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-800">Stack Trace:</h4>
            <pre className="text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-auto max-h-32">
              {error?.stack}
            </pre>
          </div>
          {errorInfo && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800">Component Stack:</h4>
              <pre className="text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-auto max-h-32">
                {errorInfo.componentStack}
              </pre>
            </div>
          )}
        </div>
      </details>
    );
  };

  private renderErrorUI = () => {
    const { level = 'component' } = this.props;
    const { errorId } = this.state;

    const errorMessages = {
      page: {
        title: "Oops! Something went wrong",
        description: "We're sorry, but there was an unexpected error loading this page. Our team has been notified and is working to fix the issue.",
        primaryAction: "Go Home",
        primaryHandler: this.handleGoHome
      },
      section: {
        title: "Section unavailable",
        description: "This section is temporarily unavailable. Please try refreshing the page or come back later.",
        primaryAction: "Retry",
        primaryHandler: this.handleRetry
      },
      component: {
        title: "Component error",
        description: "This component encountered an error and couldn't be displayed properly.",
        primaryAction: "Retry",
        primaryHandler: this.handleRetry
      }
    };

    const config = errorMessages[level];

    return (
      <motion.div
        className={`
          flex flex-col items-center justify-center p-8 text-center
          ${level === 'page' ? 'min-h-screen bg-gray-50' : 'min-h-96 bg-white border border-gray-200 rounded-lg'}
        `}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
        </motion.div>

        <motion.h2
          className={`font-bold text-gray-900 mb-4 ${
            level === 'page' ? 'text-2xl' : 'text-xl'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {config.title}
        </motion.h2>

        <motion.p
          className="text-gray-600 mb-6 max-w-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {config.description}
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <button
            onClick={config.primaryHandler}
            className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            {level === 'page' ? (
              <HomeIcon className="w-5 h-5 mr-2" />
            ) : (
              <ArrowPathIcon className="w-5 h-5 mr-2" />
            )}
            {config.primaryAction}
          </button>

          {level !== 'component' && (
            <button
              onClick={this.handleReload}
              className="flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ArrowPathIcon className="w-5 h-5 mr-2" />
              Refresh Page
            </button>
          )}
        </motion.div>

        {errorId && (
          <motion.p
            className="text-xs text-gray-400 mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Error ID: {errorId}
          </motion.p>
        )}

        {this.renderErrorDetails()}
      </motion.div>
    );
  };

  render() {
    const { hasError } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      return fallback || this.renderErrorUI();
    }

    return children;
  }
}

// HOC for wrapping components with error boundaries
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Hook for programmatically triggering error boundaries
export const useErrorHandler = () => {
  return React.useCallback((error: Error, errorInfo?: string) => {
    // Create a synthetic error that will be caught by error boundary
    throw new Error(`${error.message}${errorInfo ? ` - ${errorInfo}` : ''}`);
  }, []);
};

// Global error handler for unhandled promise rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Send to analytics if available
    if (typeof gtag !== 'undefined') {
      gtag('event', 'unhandled_promise_rejection', {
        event_category: 'error',
        event_label: 'promise_rejection',
        custom_parameter_1: event.reason?.toString() || 'Unknown error'
      });
    }
  });
}

declare global {
  function gtag(...args: any[]): void;
}

export default ErrorBoundary;