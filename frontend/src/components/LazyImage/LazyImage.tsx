import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { imageLoader } from '../../utils/performanceOptimizer';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  placeholder?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  placeholder = '/placeholder-image.png',
  priority = false,
  onLoad,
  onError
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState(priority ? src : placeholder);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isVisible, setIsVisible] = useState(priority);

  useEffect(() => {
    if (priority) {
      // Load immediately if priority is set
      loadImage();
      return;
    }

    const currentImg = imgRef.current;
    if (!currentImg) return;

    // Use Intersection Observer for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
            loadImage();
            observer.unobserve(currentImg);
          }
        });
      },
      {
        rootMargin: '50px 0px', // Start loading 50px before image comes into view
        threshold: 0.01
      }
    );

    observer.observe(currentImg);

    return () => {
      if (currentImg) {
        observer.unobserve(currentImg);
      }
    };
  }, [priority, isVisible, src]);

  const loadImage = () => {
    const img = new Image();
    
    img.onload = () => {
      setImageSrc(src);
      setImageLoaded(true);
      setImageError(false);
      onLoad?.();
    };
    
    img.onerror = () => {
      setImageError(true);
      onError?.();
    };
    
    img.src = src;
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
    // Fallback to placeholder if main image fails
    if (imageSrc !== placeholder && placeholder) {
      setImageSrc(placeholder);
    }
  };

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {/* Skeleton/placeholder while loading */}
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 bg-gray-300 rounded animate-pulse"></div>
        </div>
      )}

      {/* Main image */}
      <motion.img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-500 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ width, height }}
        onLoad={handleImageLoad}
        onError={handleImageError}
        initial={{ opacity: 0 }}
        animate={{ opacity: imageLoaded ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        data-src={src} // For debugging and testing
      />

      {/* Error state */}
      {imageError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-500">
          <div className="text-center p-4">
            <div className="w-12 h-12 mx-auto mb-2 bg-gray-300 rounded flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm">Image unavailable</p>
          </div>
        </div>
      )}

      {/* Loading indicator for priority images */}
      {priority && !imageLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default LazyImage;