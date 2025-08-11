import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlayIcon, PauseIcon, SpeakerWaveIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface HeyGenAvatarProps {
  avatarId: string;
  script?: string;
  autoplay?: boolean;
  controls?: boolean;
  width?: string | number;
  height?: string | number;
  className?: string;
  onLoad?: () => void;
  onError?: (error: string) => void;
  onVideoEnd?: () => void;
  fallbackContent?: React.ReactNode;
}

interface HeyGenVideoState {
  isLoading: boolean;
  isPlaying: boolean;
  hasError: boolean;
  errorMessage: string;
  duration: number;
  currentTime: number;
}

const HeyGenAvatar: React.FC<HeyGenAvatarProps> = ({
  avatarId,
  script,
  autoplay = false,
  controls = true,
  width = '100%',
  height = 400,
  className = '',
  onLoad,
  onError,
  onVideoEnd,
  fallbackContent
}) => {
  const [videoState, setVideoState] = useState<HeyGenVideoState>({
    isLoading: true,
    isPlaying: false,
    hasError: false,
    errorMessage: '',
    duration: 0,
    currentTime: 0
  });

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  const MAX_RETRIES = 3;
  const LOAD_TIMEOUT = 15000;

  // Generate HeyGen embed URL with parameters
  const getEmbedUrl = useCallback((id: string, options: Record<string, any> = {}) => {
    const params = new URLSearchParams({
      autoplay: autoplay ? '1' : '0',
      controls: controls ? '1' : '0',
      ...options
    });
    
    return `https://app.heygen.com/embeds/${id}?${params.toString()}`;
  }, [autoplay, controls]);

  // Handle iframe load success
  const handleLoad = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setVideoState(prev => ({
      ...prev,
      isLoading: false,
      hasError: false,
      errorMessage: ''
    }));
    
    retryCountRef.current = 0;
    onLoad?.();
  }, [onLoad]);

  // Handle iframe load error
  const handleError = useCallback((error: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setVideoState(prev => ({
      ...prev,
      isLoading: false,
      hasError: true,
      errorMessage: error
    }));
    
    onError?.(error);
  }, [onError]);

  // Retry loading avatar
  const retryLoad = useCallback(() => {
    if (retryCountRef.current >= MAX_RETRIES) {
      handleError('Maximum retry attempts reached');
      return;
    }
    
    retryCountRef.current++;
    setVideoState(prev => ({
      ...prev,
      isLoading: true,
      hasError: false,
      errorMessage: ''
    }));
    
    // Force iframe reload
    if (iframeRef.current) {
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = '';
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = currentSrc;
        }
      }, 100);
    }
  }, [handleError]);

  // Setup load timeout
  useEffect(() => {
    if (videoState.isLoading && !videoState.hasError) {
      timeoutRef.current = setTimeout(() => {
        handleError('Loading timeout exceeded');
      }, LOAD_TIMEOUT);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [videoState.isLoading, videoState.hasError, handleError]);

  // Message handler for iframe communication
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.origin.includes('heygen.com')) return;
      
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        switch (data.type) {
          case 'video_play':
            setVideoState(prev => ({ ...prev, isPlaying: true }));
            break;
          case 'video_pause':
            setVideoState(prev => ({ ...prev, isPlaying: false }));
            break;
          case 'video_ended':
            setVideoState(prev => ({ ...prev, isPlaying: false }));
            onVideoEnd?.();
            break;
          case 'video_timeupdate':
            setVideoState(prev => ({
              ...prev,
              currentTime: data.currentTime || 0,
              duration: data.duration || prev.duration
            }));
            break;
          case 'video_error':
            handleError(data.error || 'Video playback error');
            break;
        }
      } catch (err) {
        console.warn('Failed to parse HeyGen message:', err);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onVideoEnd, handleError]);

  // Render loading state
  if (videoState.isLoading) {
    return (
      <div className={`heygen-avatar-container ${className}`} style={{ width, height }}>
        <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading AI Avatar...</p>
            {retryCountRef.current > 0 && (
              <p className="text-sm text-gray-500 mt-2">
                Retry attempt {retryCountRef.current} of {MAX_RETRIES}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (videoState.hasError) {
    return (
      <div className={`heygen-avatar-container ${className}`} style={{ width, height }}>
        <div className="flex items-center justify-center h-full bg-red-50 rounded-lg border border-red-200">
          <div className="text-center p-6">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-900 mb-2">Avatar Load Failed</h3>
            <p className="text-red-700 mb-4">{videoState.errorMessage}</p>
            
            {fallbackContent || (
              <div className="space-y-3">
                {retryCountRef.current < MAX_RETRIES && (
                  <button
                    onClick={retryLoad}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Try Again
                  </button>
                )}
                <p className="text-sm text-red-600">
                  Please check your connection and try again
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render avatar iframe
  return (
    <div className={`heygen-avatar-container relative ${className}`} style={{ width, height }}>
      <iframe
        ref={iframeRef}
        className="w-full h-full rounded-lg"
        src={getEmbedUrl(avatarId)}
        title="HeyGen AI Avatar"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; microphone; camera"
        allowFullScreen
        loading="lazy"
        onLoad={handleLoad}
        onError={() => handleError('Failed to load iframe')}
        style={{ border: 'none' }}
      />
      
      {/* Custom controls overlay */}
      {controls && (
        <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-75 rounded-lg p-3 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                aria-label={videoState.isPlaying ? 'Pause' : 'Play'}
              >
                {videoState.isPlaying ? (
                  <PauseIcon className="h-5 w-5" />
                ) : (
                  <PlayIcon className="h-5 w-5" />
                )}
              </button>
              
              <SpeakerWaveIcon className="h-5 w-5" />
              
              <div className="text-sm">
                {Math.floor(videoState.currentTime)}s
                {videoState.duration > 0 && ` / ${Math.floor(videoState.duration)}s`}
              </div>
            </div>
            
            <div className="text-xs text-gray-300">
              AI Avatar
            </div>
          </div>
          
          {/* Progress bar */}
          {videoState.duration > 0 && (
            <div className="w-full bg-gray-600 rounded-full h-1 mt-2">
              <div
                className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                style={{
                  width: `${(videoState.currentTime / videoState.duration) * 100}%`
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HeyGenAvatar;