import { useState, useEffect, useCallback } from 'react';
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

interface WebVitalsMetrics {
  CLS: number | null; // Cumulative Layout Shift
  FID: number | null; // First Input Delay
  FCP: number | null; // First Contentful Paint
  LCP: number | null; // Largest Contentful Paint
  TTFB: number | null; // Time to First Byte
}

interface WebVitalsThresholds {
  CLS: { good: number; poor: number };
  FID: { good: number; poor: number };
  FCP: { good: number; poor: number };
  LCP: { good: number; poor: number };
  TTFB: { good: number; poor: number };
}

interface WebVitalsReport {
  metrics: WebVitalsMetrics;
  scores: Record<keyof WebVitalsMetrics, 'good' | 'needs-improvement' | 'poor' | null>;
  overallScore: 'good' | 'needs-improvement' | 'poor';
}

const THRESHOLDS: WebVitalsThresholds = {
  CLS: { good: 0.1, poor: 0.25 },
  FID: { good: 100, poor: 300 },
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 }
};

export const useWebVitals = (reportToAnalytics = false) => {
  const [metrics, setMetrics] = useState<WebVitalsMetrics>({
    CLS: null,
    FID: null,
    FCP: null,
    LCP: null,
    TTFB: null
  });

  const [isCollecting, setIsCollecting] = useState(true);

  // Calculate score for a metric
  const calculateScore = useCallback((metric: keyof WebVitalsMetrics, value: number | null): 'good' | 'needs-improvement' | 'poor' | null => {
    if (value === null) return null;
    
    const threshold = THRESHOLDS[metric];
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }, []);

  // Generate comprehensive report
  const generateReport = useCallback((): WebVitalsReport => {
    const scores = Object.keys(metrics).reduce((acc, key) => {
      const metricKey = key as keyof WebVitalsMetrics;
      acc[metricKey] = calculateScore(metricKey, metrics[metricKey]);
      return acc;
    }, {} as Record<keyof WebVitalsMetrics, 'good' | 'needs-improvement' | 'poor' | null>);

    // Calculate overall score based on available metrics
    const availableScores = Object.values(scores).filter(score => score !== null);
    const goodCount = availableScores.filter(score => score === 'good').length;
    const poorCount = availableScores.filter(score => score === 'poor').length;
    
    let overallScore: 'good' | 'needs-improvement' | 'poor' = 'good';
    if (poorCount > 0) {
      overallScore = 'poor';
    } else if (goodCount < availableScores.length) {
      overallScore = 'needs-improvement';
    }

    return {
      metrics,
      scores,
      overallScore
    };
  }, [metrics, calculateScore]);

  // Update metric value
  const updateMetric = useCallback((name: keyof WebVitalsMetrics, value: number) => {
    setMetrics(prev => ({ ...prev, [name]: value }));

    // Report to analytics if enabled
    if (reportToAnalytics) {
      // Send to Google Analytics 4
      if (typeof gtag !== 'undefined') {
        gtag('event', name, {
          event_category: 'Web Vitals',
          value: Math.round(value),
          custom_parameter_1: calculateScore(name, value)
        });
      }

      // Send to custom analytics endpoint
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      fetch(`${apiUrl}/api/analytics/web-vitals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metric: name,
          value: value,
          score: calculateScore(name, value),
          url: window.location.href,
          timestamp: Date.now(),
          userAgent: navigator.userAgent
        })
      }).catch(err => console.warn('Failed to report web vitals:', err));
    }
  }, [reportToAnalytics, calculateScore]);

  // Initialize web vitals collection
  useEffect(() => {
    if (!isCollecting) return;

    // Collect Core Web Vitals
    getCLS(({ value }) => updateMetric('CLS', value));
    getFID(({ value }) => updateMetric('FID', value));
    getFCP(({ value }) => updateMetric('FCP', value));
    getLCP(({ value }) => updateMetric('LCP', value));
    getTTFB(({ value }) => updateMetric('TTFB', value));

    // Stop collecting after a reasonable time
    const timeout = setTimeout(() => {
      setIsCollecting(false);
    }, 30000); // 30 seconds

    return () => clearTimeout(timeout);
  }, [updateMetric, isCollecting]);

  return {
    metrics,
    report: generateReport(),
    isCollecting
  };
};

// Performance monitoring hook
export const usePerformanceMonitor = () => {
  const [performanceData, setPerformanceData] = useState<{
    navigation: PerformanceNavigationTiming | null;
    resources: PerformanceResourceTiming[];
    marks: PerformanceMark[];
    measures: PerformanceMeasure[];
  }>({
    navigation: null,
    resources: [],
    marks: [],
    measures: []
  });

  // Collect performance data
  const collectPerformanceData = useCallback(() => {
    if (!performance) return;

    // Navigation timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    // Resource timing
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    // Performance marks and measures
    const marks = performance.getEntriesByType('mark') as PerformanceMark[];
    const measures = performance.getEntriesByType('measure') as PerformanceMeasure[];

    setPerformanceData({
      navigation,
      resources,
      marks,
      measures
    });
  }, []);

  // Add performance mark
  const mark = useCallback((name: string) => {
    if (performance && performance.mark) {
      performance.mark(name);
      collectPerformanceData();
    }
  }, [collectPerformanceData]);

  // Add performance measure
  const measure = useCallback((name: string, startMark?: string, endMark?: string) => {
    if (performance && performance.measure) {
      performance.measure(name, startMark, endMark);
      collectPerformanceData();
    }
  }, [collectPerformanceData]);

  // Calculate key metrics
  const getKeyMetrics = useCallback(() => {
    const { navigation } = performanceData;
    if (!navigation) return null;

    return {
      // Page load times
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      
      // Network times
      dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcpConnection: navigation.connectEnd - navigation.connectStart,
      serverResponse: navigation.responseEnd - navigation.requestStart,
      
      // Page processing
      domProcessing: navigation.domComplete - navigation.domInteractive,
      totalPageLoad: navigation.loadEventEnd - navigation.fetchStart,
      
      // First byte
      timeToFirstByte: navigation.responseStart - navigation.requestStart
    };
  }, [performanceData]);

  useEffect(() => {
    // Collect initial performance data
    if (document.readyState === 'complete') {
      collectPerformanceData();
    } else {
      window.addEventListener('load', collectPerformanceData);
      return () => window.removeEventListener('load', collectPerformanceData);
    }
  }, [collectPerformanceData]);

  return {
    performanceData,
    keyMetrics: getKeyMetrics(),
    mark,
    measure,
    collectPerformanceData
  };
};

declare global {
  function gtag(...args: any[]): void;
}