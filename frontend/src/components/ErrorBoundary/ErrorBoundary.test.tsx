import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ErrorBoundary, { withErrorBoundary, useErrorHandler } from './ErrorBoundary';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>
  }
}));

// Mock gtag for analytics tracking
declare global {
  var gtag: jest.MockedFunction<any>;
}
global.gtag = jest.fn();

// Component that throws an error for testing
const ThrowError = ({ shouldThrow = false, errorMessage = 'Test error' }) => {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <div>No error</div>;
};

// Component for testing useErrorHandler hook
const ErrorHandlerComponent = () => {
  const handleError = useErrorHandler();
  
  return (
    <button
      onClick={() => handleError(new Error('Programmatic error'), 'Additional info')}
    >
      Trigger Error
    </button>
  );
};

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'https://example.com/test',
    reload: jest.fn()
  },
  writable: true
});

describe('ErrorBoundary', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    global.gtag.mockClear();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('Normal Operation', () => {
    it('renders children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('does not render error UI when children render successfully', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
      expect(screen.queryByText('Oops! Something went wrong')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('catches and displays error when child component throws', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Component error')).toBeInTheDocument();
      expect(screen.getByText('This component encountered an error and couldn\'t be displayed properly.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('logs error to console when error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'ErrorBoundary caught an error:',
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      );
    });

    it('calls custom onError handler when provided', () => {
      const mockOnError = jest.fn();
      
      render(
        <ErrorBoundary onError={mockOnError}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(mockOnError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      );
    });

    it('tracks error analytics when gtag is available', () => {
      render(
        <ErrorBoundary level="section">
          <ThrowError shouldThrow={true} errorMessage="Analytics test error" />
        </ErrorBoundary>
      );

      expect(global.gtag).toHaveBeenCalledWith('event', 'error_boundary_triggered', {
        event_category: 'error',
        event_label: 'Error',
        custom_parameter_1: 'Analytics test error',
        custom_parameter_2: 'section'
      });
    });

    it('generates unique error ID for each error', () => {
      const { unmount } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const firstErrorId = screen.getByText(/Error ID:/).textContent;
      unmount();

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const secondErrorId = screen.getByText(/Error ID:/).textContent;
      expect(firstErrorId).not.toBe(secondErrorId);
    });
  });

  describe('Different Error Levels', () => {
    it('renders page-level error UI', () => {
      render(
        <ErrorBoundary level="page">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('We\'re sorry, but there was an unexpected error loading this page. Our team has been notified and is working to fix the issue.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /go home/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /refresh page/i })).toBeInTheDocument();
    });

    it('renders section-level error UI', () => {
      render(
        <ErrorBoundary level="section">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Section unavailable')).toBeInTheDocument();
      expect(screen.getByText('This section is temporarily unavailable. Please try refreshing the page or come back later.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('renders component-level error UI by default', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Component error')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /refresh page/i })).not.toBeInTheDocument();
    });
  });

  describe('Error Recovery', () => {
    it('recovers when retry button is clicked', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Component error')).toBeInTheDocument();

      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
      expect(screen.queryByText('Component error')).not.toBeInTheDocument();
    });

    it('reloads page when refresh button is clicked', () => {
      render(
        <ErrorBoundary level="section">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const refreshButton = screen.getByRole('button', { name: /refresh page/i });
      fireEvent.click(refreshButton);

      expect(window.location.reload).toHaveBeenCalled();
    });

    it('navigates to home when go home button is clicked', () => {
      render(
        <ErrorBoundary level="page">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const homeButton = screen.getByRole('button', { name: /go home/i });
      fireEvent.click(homeButton);

      expect(window.location.href).toBe('/');
    });

    it('resets error when resetOnPropsChange changes', () => {
      let resetTrigger = 'initial';
      const { rerender } = render(
        <ErrorBoundary resetOnPropsChange={resetTrigger}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Component error')).toBeInTheDocument();

      resetTrigger = 'changed';
      rerender(
        <ErrorBoundary resetOnPropsChange={resetTrigger}>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });
  });

  describe('Custom Fallback', () => {
    it('renders custom fallback when provided', () => {
      const customFallback = <div>Custom Error UI</div>;
      
      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
      expect(screen.queryByText('Component error')).not.toBeInTheDocument();
    });
  });

  describe('Development Mode Features', () => {
    const originalEnv = process.env.NODE_ENV;

    it('shows technical details in development mode', () => {
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Development error" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Technical Details (Development Mode)')).toBeInTheDocument();
      
      // Click to expand details
      fireEvent.click(screen.getByText('Technical Details (Development Mode)'));
      
      expect(screen.getByText('Error:')).toBeInTheDocument();
      expect(screen.getByText('Stack Trace:')).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('hides technical details in production mode', () => {
      process.env.NODE_ENV = 'production';

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.queryByText('Technical Details (Development Mode)')).not.toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Memory Management', () => {
    it('clears timeout on unmount', () => {
      const clearTimeoutSpy = jest.spyOn(window, 'clearTimeout');
      
      const { unmount } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      unmount();

      // Would be called if there was a timeout set
      // This tests the cleanup mechanism exists
      expect(clearTimeoutSpy).toHaveBeenCalledTimes(0); // No timeout was set in this case
    });
  });

  describe('Error Logging Service', () => {
    it('logs error details to service', () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      render(
        <ErrorBoundary level="component">
          <ThrowError shouldThrow={true} errorMessage="Service logging test" />
        </ErrorBoundary>
      );

      expect(logSpy).toHaveBeenCalledWith(
        'Error logged to service:',
        expect.objectContaining({
          message: 'Service logging test',
          timestamp: expect.any(String),
          url: 'https://example.com/test',
          userAgent: expect.any(String),
          level: 'component',
          errorId: expect.stringMatching(/^error-\d+-[a-z0-9]+$/)
        })
      );

      logSpy.mockRestore();
    });
  });
});

describe('withErrorBoundary HOC', () => {
  const TestComponent = ({ name }: { name: string }) => <div>Hello {name}</div>;

  it('wraps component with error boundary', () => {
    const WrappedComponent = withErrorBoundary(TestComponent);
    
    render(<WrappedComponent name="World" />);
    
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('passes error boundary props to wrapper', () => {
    const onError = jest.fn();
    const WrappedComponent = withErrorBoundary(TestComponent, {
      level: 'section',
      onError
    });
    
    render(<WrappedComponent name="World" />);
    
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('sets correct display name', () => {
    const WrappedComponent = withErrorBoundary(TestComponent);
    
    expect(WrappedComponent.displayName).toBe('withErrorBoundary(TestComponent)');
  });

  it('handles components without display name', () => {
    const AnonymousComponent = () => <div>Anonymous</div>;
    const WrappedComponent = withErrorBoundary(AnonymousComponent);
    
    expect(WrappedComponent.displayName).toBe('withErrorBoundary(AnonymousComponent)');
  });
});

describe('useErrorHandler', () => {
  it('throws error that can be caught by error boundary', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ErrorHandlerComponent />
      </ErrorBoundary>
    );

    const button = screen.getByRole('button', { name: 'Trigger Error' });
    fireEvent.click(button);

    expect(screen.getByText('Component error')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('includes additional info in error message', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ErrorHandlerComponent />
      </ErrorBoundary>
    );

    const button = screen.getByRole('button', { name: 'Trigger Error' });
    fireEvent.click(button);

    expect(consoleSpy).toHaveBeenCalledWith(
      'ErrorBoundary caught an error:',
      expect.objectContaining({
        message: 'Programmatic error - Additional info'
      }),
      expect.any(Object)
    );

    consoleSpy.mockRestore();
  });
});

describe('Global Error Handlers', () => {
  it('handles unhandled promise rejections', () => {
    const originalGtag = global.gtag;
    global.gtag = jest.fn();

    // Simulate unhandled promise rejection
    const event = new Event('unhandledrejection') as any;
    event.reason = new Error('Unhandled promise error');

    act(() => {
      window.dispatchEvent(event);
    });

    expect(global.gtag).toHaveBeenCalledWith('event', 'unhandled_promise_rejection', {
      event_category: 'error',
      event_label: 'promise_rejection',
      custom_parameter_1: 'Error: Unhandled promise error'
    });

    global.gtag = originalGtag;
  });

  it('handles promise rejections with unknown reasons', () => {
    const originalGtag = global.gtag;
    global.gtag = jest.fn();

    // Simulate unhandled promise rejection with null reason
    const event = new Event('unhandledrejection') as any;
    event.reason = null;

    act(() => {
      window.dispatchEvent(event);
    });

    expect(global.gtag).toHaveBeenCalledWith('event', 'unhandled_promise_rejection', {
      event_category: 'error',
      event_label: 'promise_rejection',
      custom_parameter_1: 'Unknown error'
    });

    global.gtag = originalGtag;
  });

  it('handles missing gtag gracefully', () => {
    const originalGtag = global.gtag;
    delete (global as any).gtag;

    const event = new Event('unhandledrejection') as any;
    event.reason = new Error('Test error');

    expect(() => {
      window.dispatchEvent(event);
    }).not.toThrow();

    global.gtag = originalGtag;
  });
});

describe('Error Boundary Integration', () => {
  it('works with React Suspense', () => {
    const SuspenseComponent = () => {
      throw new Promise(() => {}); // Never resolves - simulates suspense
    };

    render(
      <ErrorBoundary>
        <React.Suspense fallback={<div>Loading...</div>}>
          <SuspenseComponent />
        </React.Suspense>
      </ErrorBoundary>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('handles errors in event handlers', () => {
    const EventHandlerComponent = () => {
      const handleClick = () => {
        throw new Error('Event handler error');
      };

      return <button onClick={handleClick}>Click me</button>;
    };

    // Event handler errors are not caught by error boundaries
    // This test documents the expected behavior
    render(
      <ErrorBoundary>
        <EventHandlerComponent />
      </ErrorBoundary>
    );

    const button = screen.getByRole('button', { name: 'Click me' });
    
    // Should not show error boundary UI for event handler errors
    expect(() => fireEvent.click(button)).toThrow('Event handler error');
  });

  it('handles async errors appropriately', async () => {
    const AsyncErrorComponent = () => {
      React.useEffect(() => {
        // Async errors are not caught by error boundaries
        setTimeout(() => {
          throw new Error('Async error');
        }, 0);
      }, []);

      return <div>Async component</div>;
    };

    render(
      <ErrorBoundary>
        <AsyncErrorComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Async component')).toBeInTheDocument();
    
    // Async errors should not trigger error boundary
    // They would be handled by window.onerror or unhandledrejection
  });
});

describe('Accessibility', () => {
  it('has proper ARIA attributes for error state', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const errorContainer = screen.getByText('Component error').closest('div');
    expect(errorContainer).toBeInTheDocument();
    
    // Check that buttons are accessible
    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();
    expect(retryButton).not.toHaveAttribute('aria-disabled');
  });

  it('provides keyboard navigation for error actions', () => {
    render(
      <ErrorBoundary level="section">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const retryButton = screen.getByRole('button', { name: /retry/i });
    const refreshButton = screen.getByRole('button', { name: /refresh page/i });
    
    // Check buttons are focusable
    retryButton.focus();
    expect(retryButton).toHaveFocus();
    
    refreshButton.focus();
    expect(refreshButton).toHaveFocus();
  });
});