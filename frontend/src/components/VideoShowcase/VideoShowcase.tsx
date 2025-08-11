import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PlayIcon, ExclamationTriangleIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import './VideoShowcase.css';

interface VideoConfig {
  id: string;
  type: 'heygen' | 'youtube' | 'local';
  url?: string;
  thumbnail?: string;
}

const VideoShowcase: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [loadTimeout, setLoadTimeout] = useState<NodeJS.Timeout | null>(null);
  const [userInitiated, setUserInitiated] = useState(false);
  const videoRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Video configurations with fallback options
  const videoConfigs: VideoConfig[] = [
    { id: '8b9a648b26dd4891a6ac18059ab4aea7', type: 'heygen' },
    { id: 'dQw4w9WgXcQ', type: 'youtube' }, // Fallback YouTube video
  ];
  
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const currentVideo = videoConfigs[currentVideoIndex];
  
  const MAX_RETRIES = 1;
  const LOAD_TIMEOUT = 8000; // 8 seconds for faster loading

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !userInitiated) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { threshold: 0.01, rootMargin: '200px' } // Preload earlier
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => {
      observer.disconnect();
      if (loadTimeout) clearTimeout(loadTimeout);
    };
  }, [userInitiated, loadTimeout]);

  useEffect(() => {
    if (shouldLoad && !hasError) {
      const timeout = setTimeout(() => {
        if (isLoading) {
          handleTimeout();
        }
      }, LOAD_TIMEOUT);
      setLoadTimeout(timeout);
      
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldLoad, isLoading, hasError]);

  const getVideoUrl = useCallback((video: VideoConfig): string => {
    switch (video.type) {
      case 'heygen':
        return `https://app.heygen.com/embeds/${video.id}?preload=auto`;
      case 'youtube':
        return `https://www.youtube.com/embed/${video.id}?autoplay=0&controls=1&rel=0&loading=lazy`;
      case 'local':
        return video.url || '';
      default:
        return '';
    }
  }, []);

  const handleLoad = useCallback(() => {
    if (loadTimeout) clearTimeout(loadTimeout);
    setIsLoading(false);
    setHasError(false);
    setRetryCount(0);
  }, [loadTimeout]);

  const handleError = useCallback(() => {
    if (loadTimeout) clearTimeout(loadTimeout);
    
    if (retryCount < MAX_RETRIES && currentVideoIndex === 0) {
      setRetryCount(prev => prev + 1);
      setTimeout(() => {
        retryLoad();
      }, 500 * (retryCount + 1)); // Faster retry
    } else if (currentVideoIndex < videoConfigs.length - 1) {
      setCurrentVideoIndex(prev => prev + 1);
      setRetryCount(0);
      setIsLoading(true);
      setHasError(false);
    } else {
      setIsLoading(false);
      setHasError(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryCount, currentVideoIndex, loadTimeout]);

  const handleTimeout = useCallback(() => {
    console.warn('Video load timeout');
    handleError();
  }, [handleError]);

  const retryLoad = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
    if (iframeRef.current) {
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = '';
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = currentSrc;
        }
      }, 100);
    }
  }, []);

  const handleUserClick = useCallback(() => {
    setUserInitiated(true);
    setShouldLoad(true);
    setIsLoading(true);
    setHasError(false);
    setRetryCount(0);
    setCurrentVideoIndex(0);
  }, []);

  return (
    <section id="video-showcase" className="video-showcase-section">
      <div className="container">
        <div className="video-showcase">
          <h2>AI Avatar Showcase</h2>
          <div ref={videoRef} className="video-container">
            {!shouldLoad && (
              <div className="video-placeholder" onClick={handleUserClick}>
                <div className="video-poster">
                  <PlayIcon className="h-16 w-16 text-white" />
                  <p className="text-white mt-4">Click to load video</p>
                </div>
              </div>
            )}
            
            {shouldLoad && (
              <>
                {isLoading && (
                  <div className="video-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading {currentVideo.type === 'heygen' ? 'AI Avatar' : 'Video'}...</p>
                    {retryCount > 0 && (
                      <p className="text-sm text-gray-400 mt-2">
                        Retry attempt {retryCount} of {MAX_RETRIES}
                      </p>
                    )}
                  </div>
                )}
                
                {hasError && (
                  <div className="video-error">
                    <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mb-4" />
                    <p className="text-white mb-4">Unable to load video content</p>
                    <p className="text-sm text-gray-400 mb-4">
                      Please check your connection and try again
                    </p>
                    <button 
                      onClick={() => {
                        setCurrentVideoIndex(0);
                        setRetryCount(0);
                        retryLoad();
                      }} 
                      className="retry-btn"
                    >
                      Try Again
                    </button>
                  </div>
                )}
                
                {!hasError && (
                  <iframe
                    ref={iframeRef}
                    className="main-video"
                    width="100%"
                    height="100%"
                    src={shouldLoad ? getVideoUrl(currentVideo) : ''}
                    title={currentVideo.type === 'heygen' 
                      ? "HeyGen video player - AI Avatar introducing DreamerAI solutions"
                      : "Video showcase - DreamerAI solutions"
                    }
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                    loading="eager"
                    onLoad={handleLoad}
                    onError={handleError}
                    style={{ 
                      display: (isLoading || hasError) ? 'none' : 'block',
                      border: 'none',
                      borderRadius: '8px'
                    }}
                  />
                )}
                
                {currentVideoIndex > 0 && !isLoading && !hasError && (
                  <div className="fallback-notice">
                    <VideoCameraIcon className="h-4 w-4 inline mr-2" />
                    <span className="text-sm text-gray-400">
                      Showing alternative content
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
          <p className="video-description">
            {currentVideo.type === 'heygen' 
              ? "Meet our AI-powered avatar introducing DreamerAI solutions with enterprise-grade capabilities"
              : "Explore DreamerAI's innovative solutions and capabilities"
            }
          </p>
        </div>
      </div>
    </section>
  );
};

export default VideoShowcase;