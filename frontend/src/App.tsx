import React, { useEffect, Suspense, lazy, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Header/Header';
import Hero from './components/Hero/Hero';
import LoadingAnimation from './components/Animation/LoadingAnimation';
import AnimatedBackground from './components/Animation/AnimatedBackground';
import ScrollIndicator from './components/Animation/ScrollIndicator';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import { useWebVitals, usePerformanceMonitor } from './hooks/useWebVitals';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
import { useScrollPerformanceTracking } from './hooks/useIntersectionObserver';
import { resourcePreloader, imageLoader, apiCache } from './utils/performanceOptimizer';

// Lazy load components that aren't immediately visible
const About = lazy(() => import('./components/About/About'));
const VideoShowcase = lazy(() => import('./components/VideoShowcase/VideoShowcase'));
const IndustryUseCases = lazy(() => import('./components/IndustryUseCases/IndustryUseCases'));
const Capabilities = lazy(() => import('./components/Capabilities/Capabilities'));
const CaseStudies = lazy(() => import('./components/CaseStudies/CaseStudies'));
const AITools = lazy(() => import('./components/AITools/AITools'));

const FeaturesShowcase = lazy(() => import('./components/FeaturesShowcase/FeaturesShowcase'));
const Interactive = lazy(() => import('./components/Interactive/Interactive'));
const Contact = lazy(() => import('./components/Contact/Contact'));
const Footer = lazy(() => import('./components/Footer/Footer'));
const ElevenLabsChat = lazy(() => import('./components/ElevenLabsChat/ElevenLabsChat'));

// Enhanced section skeleton loader
const SectionSkeleton: React.FC = () => (
  <div className="py-16 px-4 sm:px-6 lg:px-8">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <div className="h-8 bg-gray-200 rounded-lg w-1/2 mx-auto mb-4 animate-pulse"></div>
        <div className="h-4 bg-gray-100 rounded w-3/4 mx-auto animate-pulse"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-100 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

function App() {
  const [loading, setLoading] = useState(true);
  const [preloadComplete, setPreloadComplete] = useState(false);
  const [criticalResourcesLoaded, setCriticalResourcesLoaded] = useState(false);
  
  // Initialize performance monitoring
  const { report } = useWebVitals(true);
  const { mark, measure } = usePerformanceMonitor();
  
  // Initialize keyboard navigation
  const keyboardNav = useKeyboardNavigation({
    enabled: true,
    announceNavigation: true,
    enableVirtualCursor: true
  });
  
  // Track scroll performance
  const scrollMetrics = useScrollPerformanceTracking();

  useEffect(() => {
    // Mark app initialization
    mark('app-init');
    
    const initializeApp = async () => {
      try {
        // Preload critical resources
        await Promise.all([
          resourcePreloader.preloadImage('/logo192.png', 'high'),
          resourcePreloader.preloadImage('/founder-jlasalle.png', 'low'),
          // Preload critical fonts if any
        ]);
        
        setCriticalResourcesLoaded(true);
        
        // Initialize service worker for PWA features
        if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
          navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('SW registered: ', registration))
            .catch(error => console.log('SW registration failed: ', error));
        }

        // Initialize API cache
        apiCache.clear(); // Start with fresh cache
        
        setPreloadComplete(true);
        
        // Set minimal loading time for smooth UX
        setTimeout(() => {
          setLoading(false);
          mark('app-loaded');
          measure('app-load-time', 'app-init', 'app-loaded');
        }, 200); // Reduced for better performance
        
      } catch (error) {
        console.warn('Resource preloading failed:', error);
        // Fallback: continue loading without preloaded resources
        setCriticalResourcesLoaded(true);
        setPreloadComplete(true);
        setLoading(false);
      }
    };

    initializeApp();
  }, [mark, measure]);

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.div
          key="loader"
          className="fixed inset-0 flex items-center justify-center bg-white z-50"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <LoadingAnimation variant="dots" size="large" />
        </motion.div>
      ) : (
        <motion.div
          key="content"
          className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-pink-100"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <AnimatedBackground variant="gradient" className="fixed inset-0 z-0" />
          <ScrollIndicator />
          <div className="relative z-10">
            <ErrorBoundary level="page">
              <Header />
              <main id="main" role="main">
                <ErrorBoundary level="section">
                  <Hero />
                </ErrorBoundary>
                {/* Video Showcase */}
                <ErrorBoundary level="section">
                  <Suspense fallback={<SectionSkeleton />}>
                    <section id="video-showcase" data-section="video-showcase">
                      <VideoShowcase />
                    </section>
                  </Suspense>
                </ErrorBoundary>
                
                {/* About */}
                <ErrorBoundary level="section">
                  <Suspense fallback={<SectionSkeleton />}>
                    <section id="about" data-section="about">
                      <About />
                    </section>
                  </Suspense>
                </ErrorBoundary>
                
                {/* Industry Use Cases */}
                <ErrorBoundary level="section">
                  <Suspense fallback={<SectionSkeleton />}>
                    <section id="industry-use-cases" data-section="industry-use-cases">
                      <IndustryUseCases />
                    </section>
                  </Suspense>
                </ErrorBoundary>
                
                {/* Capabilities */}
                <ErrorBoundary level="section">
                  <Suspense fallback={<SectionSkeleton />}>
                    <section id="capabilities" data-section="capabilities">
                      <Capabilities />
                    </section>
                  </Suspense>
                </ErrorBoundary>
                
                {/* Case Studies */}
                <ErrorBoundary level="section">
                  <Suspense fallback={<SectionSkeleton />}>
                    <section id="case-studies" data-section="case-studies">
                      <CaseStudies />
                    </section>
                  </Suspense>
                </ErrorBoundary>
                
                {/* AI Tools */}
                <ErrorBoundary level="section">
                  <Suspense fallback={<SectionSkeleton />}>
                    <section id="ai-tools" data-section="ai-tools">
                      <AITools />
                    </section>
                  </Suspense>
                </ErrorBoundary>
                
                {/* Features Showcase */}
                <ErrorBoundary level="section">
                  <Suspense fallback={<SectionSkeleton />}>
                    <section data-section="features">
                      <FeaturesShowcase />
                    </section>
                  </Suspense>
                </ErrorBoundary>
                
                {/* Interactive Demo */}
                <ErrorBoundary level="section">
                  <Suspense fallback={<SectionSkeleton />}>
                    <section id="interactive" data-section="interactive">
                      <Interactive />
                    </section>
                  </Suspense>
                </ErrorBoundary>
                
                {/* Contact */}
                <ErrorBoundary level="section">
                  <Suspense fallback={<SectionSkeleton />}>
                    <section id="contact" data-section="contact">
                      <Contact />
                    </section>
                  </Suspense>
                </ErrorBoundary>
              </main>
              
              <ErrorBoundary level="component">
                <Suspense fallback={<div className="h-16 bg-gray-100"></div>}>
                  <Footer />
                </Suspense>
              </ErrorBoundary>
              
              <ErrorBoundary level="component">
                <Suspense fallback={null}>
                  <ElevenLabsChat />
                </Suspense>
              </ErrorBoundary>
            </ErrorBoundary>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default App;