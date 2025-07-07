import React, { useState, useRef, useEffect } from 'react';
import './VideoShowcase.css';

const VideoShowcase: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [userInteracted, setUserInteracted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Enable sound on first user interaction
    const enableSound = () => {
      setUserInteracted(true);
      if (videoRef.current && !videoRef.current.paused && isMuted) {
        videoRef.current.muted = false;
        setIsMuted(false);
      }
    };

    document.addEventListener('click', enableSound, { once: true });
    document.addEventListener('touchstart', enableSound, { once: true });

    return () => {
      document.removeEventListener('click', enableSound);
      document.removeEventListener('touchstart', enableSound);
    };
  }, [isMuted]);

  const toggleSound = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const handleVideoPlay = () => {
    setIsPlaying(true);
    if (userInteracted && videoRef.current && videoRef.current.muted) {
      videoRef.current.muted = false;
      setIsMuted(false);
    }
  };

  const handleVideoPause = () => {
    setIsPlaying(false);
  };

  return (
    <section id="video-showcase" className="video-showcase-section">
      <div className="container">
        <div className="video-showcase">
          <h2>AI Avatar Showcase</h2>
          <div className="video-container">
            <video
              ref={videoRef}
              className="main-video"
              controls
              muted
              playsInline
              onPlay={handleVideoPlay}
              onPause={handleVideoPause}
              poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Crect width='100%25' height='100%25' fill='%23000'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='white' font-size='24'%3EDreamerAI Introduction%3C/text%3E%3C/svg%3E"
            >
              <source src="/api/video" type="video/mp4" />
              <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <div className="video-overlay">
              <button 
                className="sound-indicator"
                onClick={toggleSound}
                title={isMuted ? 'Click to unmute' : 'Click to mute'}
              >
                {isMuted ? '🔇' : '🔊'}
              </button>
              <span>DreamerAI Intro</span>
            </div>
          </div>
          <p className="video-description">
            Meet our AI-powered avatar introducing DreamerAI solutions
          </p>
        </div>
      </div>
    </section>
  );
};

export default VideoShowcase;