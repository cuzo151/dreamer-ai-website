import {
  LazyImageLoader,
  ResourcePreloader,
  APICache,
  BundleOptimizer,
  createDebouncer,
  VirtualScroller,
  PerformanceMonitor,
  imageLoader,
  resourcePreloader,
  apiCache
} from './performanceOptimizer';

// Mock DOM APIs
Object.defineProperty(global, 'IntersectionObserver', {
  writable: true,
  value: class MockIntersectionObserver {
    callback: IntersectionObserverCallback;
    options: IntersectionObserverInit;
    
    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
      this.callback = callback;
      this.options = options || {};
    }
    
    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
  }
});

Object.defineProperty(global, 'performance', {
  writable: true,
  value: {
    mark: jest.fn(),
    measure: jest.fn(),
    now: jest.fn(() => Date.now()),
    getEntriesByName: jest.fn(() => [{ duration: 100 }]),
    getEntriesByType: jest.fn(() => [
      {
        startTime: 100,
        domContentLoadedEventEnd: 200,
        domContentLoadedEventStart: 150,
        loadEventEnd: 300,
        loadEventStart: 250,
        domainLookupEnd: 50,
        domainLookupStart: 10,
        connectEnd: 80,
        connectStart: 60,
        responseEnd: 120,
        requestStart: 90,
        domComplete: 280,
        domInteractive: 200,
        fetchStart: 0
      }
    ])
  }
});

// Mock document methods
Object.defineProperty(document, 'createElement', {
  writable: true,
  value: jest.fn(() => {
    const element = {
      rel: '',
      as: '',
      href: '',
      type: '',
      crossOrigin: '',
      onload: null,
      onerror: null,
      style: {}
    };
    return element;
  })
});

Object.defineProperty(document.head, 'appendChild', {
  writable: true,
  value: jest.fn()
});

// Mock gtag
declare global {
  var gtag: jest.MockedFunction<any>;
}
global.gtag = jest.fn();

describe('Performance Optimization Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('LazyImageLoader', () => {
    let loader: LazyImageLoader;
    let mockImg: HTMLImageElement;

    beforeEach(() => {
      loader = new LazyImageLoader();
      mockImg = document.createElement('img') as HTMLImageElement;
      mockImg.dataset = { src: 'test-image.jpg' };
      mockImg.classList = {
        add: jest.fn(),
        remove: jest.fn()
      } as any;
    });

    it('creates IntersectionObserver with correct options', () => {
      expect(IntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          rootMargin: '50px 0px',
          threshold: 0.01
        })
      );
    });

    it('observes images when IntersectionObserver is available', () => {
      const mockObserver = new IntersectionObserver(jest.fn());
      loader['observer'] = mockObserver;
      
      loader.observe(mockImg);
      expect(mockObserver.observe).toHaveBeenCalledWith(mockImg);
    });

    it('falls back to immediate loading when IntersectionObserver is not available', () => {
      // Create loader without IntersectionObserver
      (global as any).IntersectionObserver = undefined;
      const fallbackLoader = new LazyImageLoader();
      
      fallbackLoader.observe(mockImg);
      expect(mockImg.src).toBe('test-image.jpg');
    });

    it('loads image and adds classes when intersecting', () => {
      const mockObserver = new IntersectionObserver(jest.fn());
      loader['observer'] = mockObserver;
      
      // Simulate intersection
      const entries: IntersectionObserverEntry[] = [{
        isIntersecting: true,
        target: mockImg
      } as IntersectionObserverEntry];
      
      loader['handleIntersection'](entries);
      
      expect(mockImg.src).toBe('test-image.jpg');
      expect(mockImg.classList.add).toHaveBeenCalledWith('loaded');
      expect(mockObserver.unobserve).toHaveBeenCalledWith(mockImg);
    });

    it('prevents duplicate loading of same image', () => {
      loader['loaded'].add('test-image.jpg');
      
      const entries: IntersectionObserverEntry[] = [{
        isIntersecting: true,
        target: mockImg
      } as IntersectionObserverEntry];
      
      loader['handleIntersection'](entries);
      
      // Should not set src again
      expect(mockImg.src).toBe('');
    });

    it('adds fade-in class after image loads', () => {
      const entries: IntersectionObserverEntry[] = [{
        isIntersecting: true,
        target: mockImg
      } as IntersectionObserverEntry];
      
      loader['handleIntersection'](entries);
      
      // Simulate image load event
      if (mockImg.onload) {
        mockImg.onload({} as Event);
      }
      
      expect(mockImg.classList.add).toHaveBeenCalledWith('fade-in');
    });

    it('disconnects observer properly', () => {
      const mockObserver = new IntersectionObserver(jest.fn());
      loader['observer'] = mockObserver;
      
      loader.disconnect();
      expect(mockObserver.disconnect).toHaveBeenCalled();
    });
  });

  describe('ResourcePreloader', () => {
    let preloader: ResourcePreloader;

    beforeEach(() => {
      preloader = new ResourcePreloader();
    });

    it('preloads images with high priority', async () => {
      const mockLink = document.createElement('link');
      (document.createElement as jest.Mock).mockReturnValue(mockLink);
      
      const promise = preloader.preloadImage('test.jpg', 'high');
      
      expect(mockLink.rel).toBe('preload');
      expect(mockLink.as).toBe('image');
      expect(mockLink.href).toBe('test.jpg');
      expect(document.head.appendChild).toHaveBeenCalledWith(mockLink);
      
      // Simulate successful load
      if (mockLink.onload) {
        mockLink.onload({} as Event);
      }
      
      await promise;
    });

    it('preloads images with low priority', async () => {
      const mockLink = document.createElement('link');
      (document.createElement as jest.Mock).mockReturnValue(mockLink);
      
      const promise = preloader.preloadImage('test.jpg', 'low');
      
      expect(mockLink.rel).toBe('prefetch');
      
      if (mockLink.onload) {
        mockLink.onload({} as Event);
      }
      
      await promise;
    });

    it('handles image preload errors', async () => {
      const mockLink = document.createElement('link');
      (document.createElement as jest.Mock).mockReturnValue(mockLink);
      
      const promise = preloader.preloadImage('test.jpg');
      
      // Simulate error
      if (mockLink.onerror) {
        mockLink.onerror({} as Event | string);
      }
      
      await expect(promise).rejects.toThrow('Failed to preload test.jpg');
    });

    it('prevents duplicate preloading', async () => {
      const mockLink = document.createElement('link');
      (document.createElement as jest.Mock).mockReturnValue(mockLink);
      
      // First preload
      const promise1 = preloader.preloadImage('test.jpg');
      if (mockLink.onload) mockLink.onload({} as Event);
      await promise1;
      
      // Second preload should resolve immediately
      const promise2 = preloader.preloadImage('test.jpg');
      await promise2;
      
      // Should only call createElement once
      expect(document.createElement).toHaveBeenCalledTimes(1);
    });

    it('preloads scripts correctly', async () => {
      const mockLink = document.createElement('link');
      (document.createElement as jest.Mock).mockReturnValue(mockLink);
      
      const promise = preloader.preloadScript('script.js');
      
      expect(mockLink.rel).toBe('prefetch');
      expect(mockLink.as).toBe('script');
      expect(mockLink.href).toBe('script.js');
      
      if (mockLink.onload) {
        mockLink.onload({} as Event);
      }
      
      await promise;
    });

    it('preloads fonts with correct attributes', () => {
      const mockLink = document.createElement('link');
      (document.createElement as jest.Mock).mockReturnValue(mockLink);
      
      preloader.preloadFont('font.woff2', 'woff2');
      
      expect(mockLink.rel).toBe('preload');
      expect(mockLink.as).toBe('font');
      expect(mockLink.type).toBe('font/woff2');
      expect(mockLink.crossOrigin).toBe('anonymous');
      expect(mockLink.href).toBe('font.woff2');
    });
  });

  describe('APICache', () => {
    let cache: APICache;

    beforeEach(() => {
      cache = new APICache(3); // Small size for testing
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('stores and retrieves data', () => {
      cache.set('key1', { data: 'value1' });
      expect(cache.get('key1')).toEqual({ data: 'value1' });
    });

    it('returns null for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeNull();
    });

    it('implements LRU eviction when cache is full', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.set('key4', 'value4'); // Should evict key1
      
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key4')).toBe('value4');
    });

    it('expires data based on TTL', () => {
      cache.set('key1', 'value1', 1); // 1 minute TTL
      
      // Fast forward 30 seconds - should still be valid
      jest.advanceTimersByTime(30 * 1000);
      expect(cache.get('key1')).toBe('value1');
      
      // Fast forward another 31 seconds - should be expired
      jest.advanceTimersByTime(31 * 1000);
      expect(cache.get('key1')).toBeNull();
    });

    it('updates LRU order when accessing items', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      // Access key1 to make it most recently used
      cache.get('key1');
      
      // Add another item - should evict key2 (least recently used)
      cache.set('key4', 'value4');
      
      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBeNull();
      expect(cache.get('key3')).toBe('value3');
      expect(cache.get('key4')).toBe('value4');
    });

    it('clears all cached data', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      expect(cache.size()).toBe(2);
      
      cache.clear();
      
      expect(cache.size()).toBe(0);
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
    });

    it('cleans up expired entries', () => {
      cache.set('key1', 'value1', 1); // 1 minute TTL
      cache.set('key2', 'value2', 10); // 10 minute TTL
      
      // Fast forward past first item's TTL
      jest.advanceTimersByTime(2 * 60 * 1000);
      
      cache.cleanup();
      
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBe('value2');
      expect(cache.size()).toBe(1);
    });
  });

  describe('BundleOptimizer', () => {
    it('loads components dynamically', async () => {
      const mockModule = { default: 'MockComponent' };
      const mockImport = jest.fn().mockResolvedValue(mockModule);
      
      // Mock dynamic import
      (global as any).import = mockImport;
      
      const component = await BundleOptimizer.loadComponent('./TestComponent');
      
      expect(mockImport).toHaveBeenCalledWith('./TestComponent');
      expect(component).toBe('MockComponent');
    });

    it('handles component loading errors', async () => {
      const mockImport = jest.fn().mockRejectedValue(new Error('Module not found'));
      (global as any).import = mockImport;
      
      await expect(BundleOptimizer.loadComponent('./NonExistentComponent'))
        .rejects.toThrow('Module not found');
    });

    it('creates chunk optimizer with correct categories', () => {
      const optimizer = BundleOptimizer.createChunkOptimizer();
      
      expect(optimizer.critical).toContain('Header');
      expect(optimizer.critical).toContain('Hero');
      expect(optimizer.lazy).toContain('Dashboard');
      expect(optimizer.lazy).toContain('Interactive');
      expect(optimizer.vendor).toContain('recharts');
      expect(optimizer.vendor).toContain('framer-motion');
    });

    it('optimizes recharts bundle imports', () => {
      const chartImports = BundleOptimizer.optimizeRechartsBundleSize();
      
      expect(chartImports.BarChart).toBeInstanceOf(Function);
      expect(chartImports.LineChart).toBeInstanceOf(Function);
      expect(chartImports.AreaChart).toBeInstanceOf(Function);
      expect(chartImports.PieChart).toBeInstanceOf(Function);
      expect(chartImports.RadialBarChart).toBeInstanceOf(Function);
    });
  });

  describe('createDebouncer', () => {
    it('debounces function calls', () => {
      jest.useFakeTimers();
      
      const mockFn = jest.fn();
      const debouncedFn = createDebouncer(mockFn, 100);
      
      debouncedFn('arg1');
      debouncedFn('arg2');
      debouncedFn('arg3');
      
      expect(mockFn).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(100);
      
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg3');
      
      jest.useRealTimers();
    });

    it('resets timer on subsequent calls', () => {
      jest.useFakeTimers();
      
      const mockFn = jest.fn();
      const debouncedFn = createDebouncer(mockFn, 100);
      
      debouncedFn('arg1');
      jest.advanceTimersByTime(50);
      
      debouncedFn('arg2');
      jest.advanceTimersByTime(50);
      
      expect(mockFn).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(50);
      
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg2');
      
      jest.useRealTimers();
    });
  });

  describe('VirtualScroller', () => {
    let container: HTMLElement;
    let scroller: VirtualScroller;

    beforeEach(() => {
      container = document.createElement('div');
      scroller = new VirtualScroller(container, 50, 2); // 50px items, 2 buffer
    });

    it('calculates visible range correctly', () => {
      const result = scroller.calculateVisibleRange(200, 300, 100);
      
      expect(result.startIndex).toBe(2); // Math.max(0, 4 - 2)
      expect(result.endIndex).toBe(12); // Math.min(99, 10 + 2)
      expect(result.offsetY).toBe(100); // 2 * 50
    });

    it('returns visible items with correct offset', () => {
      const items = Array.from({ length: 100 }, (_, i) => `item-${i}`);
      
      const result = scroller.getVisibleItems(items, 200, 300);
      
      expect(result.visibleItems).toHaveLength(11); // items 2-12
      expect(result.visibleItems[0]).toBe('item-2');
      expect(result.visibleItems[10]).toBe('item-12');
      expect(result.offsetY).toBe(100);
      expect(result.totalHeight).toBe(5000); // 100 * 50
    });

    it('handles edge cases at start of list', () => {
      const result = scroller.calculateVisibleRange(0, 300, 100);
      
      expect(result.startIndex).toBe(0);
      expect(result.offsetY).toBe(0);
    });

    it('handles edge cases at end of list', () => {
      const result = scroller.calculateVisibleRange(4000, 300, 100);
      
      expect(result.endIndex).toBe(99); // Total items - 1
    });
  });

  describe('PerformanceMonitor', () => {
    it('measures component render time', () => {
      const measurement = PerformanceMonitor.measureComponentRender('TestComponent');
      
      measurement.start();
      expect(performance.mark).toHaveBeenCalledWith('TestComponent-start');
      
      const duration = measurement.end();
      expect(performance.mark).toHaveBeenCalledWith('TestComponent-end');
      expect(performance.measure).toHaveBeenCalledWith(
        'TestComponent-render',
        'TestComponent-start',
        'TestComponent-end'
      );
      expect(duration).toBe(100); // Mocked duration
    });

    it('measures API call performance', () => {
      const measurement = PerformanceMonitor.measureAPICall('/api/test');
      
      const duration = measurement.finish();
      
      expect(duration).toBeGreaterThan(0);
      expect(global.gtag).toHaveBeenCalledWith('event', 'api_performance', {
        event_category: 'performance',
        event_label: '/api/test',
        value: expect.any(Number)
      });
    });

    it('gets page performance metrics', () => {
      const metrics = PerformanceMonitor.getPagePerformanceMetrics();
      
      expect(metrics).toEqual({
        FCP: 0, // No first-contentful-paint entry in mock
        LCP: 0, // No largest-contentful-paint entry in mock
        domContentLoaded: 50, // 200 - 150
        loadComplete: 50, // 300 - 250
        dnsLookup: 40, // 50 - 10
        tcpConnection: 20, // 80 - 60
        serverResponse: 30, // 120 - 90
        domProcessing: 80, // 280 - 200
        totalPageLoad: 300 // 300 - 0
      });
    });

    it('handles missing performance API gracefully', () => {
      const originalGetEntriesByType = performance.getEntriesByType;
      delete (performance as any).getEntriesByType;
      
      const metrics = PerformanceMonitor.getPagePerformanceMetrics();
      
      expect(metrics).toBeNull();
      
      performance.getEntriesByType = originalGetEntriesByType;
    });
  });

  describe('Global Instances', () => {
    it('exports global imageLoader instance', () => {
      expect(imageLoader).toBeInstanceOf(LazyImageLoader);
    });

    it('exports global resourcePreloader instance', () => {
      expect(resourcePreloader).toBeInstanceOf(ResourcePreloader);
    });

    it('exports global apiCache instance', () => {
      expect(apiCache).toBeInstanceOf(APICache);
      expect(apiCache.size()).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance in Production Environment', () => {
    it('handles browser compatibility gracefully', () => {
      // Test with missing IntersectionObserver
      const originalIntersectionObserver = (global as any).IntersectionObserver;
      delete (global as any).IntersectionObserver;
      
      expect(() => new LazyImageLoader()).not.toThrow();
      
      (global as any).IntersectionObserver = originalIntersectionObserver;
    });

    it('handles performance API missing gracefully', () => {
      const originalPerformance = global.performance;
      delete (global as any).performance;
      
      expect(() => PerformanceMonitor.measureAPICall('/test')).not.toThrow();
      
      global.performance = originalPerformance;
    });
  });

  describe('Memory Management', () => {
    it('cleans up resources in LazyImageLoader', () => {
      const loader = new LazyImageLoader();
      const mockObserver = new IntersectionObserver(jest.fn());
      loader['observer'] = mockObserver;
      
      loader.disconnect();
      
      expect(mockObserver.disconnect).toHaveBeenCalled();
    });

    it('implements LRU cache correctly to prevent memory leaks', () => {
      const cache = new APICache(2);
      
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3'); // Should evict key1
      
      expect(cache.size()).toBe(2);
      expect(cache.get('key1')).toBeNull();
    });
  });
});