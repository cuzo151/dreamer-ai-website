import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import VideoShowcase from './VideoShowcase';

describe('VideoShowcase Component', () => {
  it('renders the video showcase section with correct title', () => {
    render(<VideoShowcase />);
    
    expect(screen.getByText('AI Avatar Showcase')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'AI Avatar Showcase' })).toBeInTheDocument();
  });

  it('renders the HeyGen iframe with correct attributes', () => {
    render(<VideoShowcase />);
    
    const iframe = screen.getByTitle('HeyGen video player');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('src', 'https://app.heygen.com/embeds/8b9a648b26dd4891a6ac18059ab4aea7');
    expect(iframe).toHaveAttribute('width', '100%');
    expect(iframe).toHaveAttribute('height', '100%');
    expect(iframe).toHaveAttribute('frameBorder', '0');
    expect(iframe).toHaveAttribute('allow', 'encrypted-media; fullscreen;');
    expect(iframe).toHaveAttribute('allowFullScreen');
  });

  it('renders the video description', () => {
    render(<VideoShowcase />);
    
    expect(screen.getByText('Meet our AI-powered avatar introducing DreamerAI solutions')).toBeInTheDocument();
  });

  it('has proper HTML structure and CSS classes', () => {
    render(<VideoShowcase />);
    
    const section = document.getElementById('video-showcase');
    expect(section).toBeInTheDocument();
    expect(section).toHaveClass('video-showcase-section');
    
    const container = section.querySelector('.container');
    expect(container).toBeInTheDocument();
    
    const videoShowcase = container?.querySelector('.video-showcase');
    expect(videoShowcase).toBeInTheDocument();
    
    const videoContainer = videoShowcase?.querySelector('.video-container');
    expect(videoContainer).toBeInTheDocument();
    
    const iframe = videoContainer?.querySelector('.main-video');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveClass('main-video');
  });

  it('has proper video description styling', () => {
    render(<VideoShowcase />);
    
    const description = screen.getByText('Meet our AI-powered avatar introducing DreamerAI solutions');
    expect(description).toHaveClass('video-description');
  });

  it('uses the correct HeyGen video ID', () => {
    render(<VideoShowcase />);
    
    const iframe = screen.getByTitle('HeyGen video player');
    const expectedVideoId = '8b9a648b26dd4891a6ac18059ab4aea7';
    const expectedSrc = `https://app.heygen.com/embeds/${expectedVideoId}`;
    
    expect(iframe).toHaveAttribute('src', expectedSrc);
  });

  it('is accessible and has proper ARIA attributes', () => {
    render(<VideoShowcase />);
    
    const iframe = screen.getByTitle('HeyGen video player');
    expect(iframe).toHaveAttribute('title', 'HeyGen video player');
    
    const section = document.getElementById('video-showcase');
    expect(section).toBeInTheDocument();
  });

  it('has responsive video container structure', () => {
    render(<VideoShowcase />);
    
    const videoContainer = document.querySelector('.video-container');
    expect(videoContainer).toBeInTheDocument();
    
    const iframe = videoContainer?.querySelector('iframe');
    expect(iframe).toHaveAttribute('width', '100%');
    expect(iframe).toHaveAttribute('height', '100%');
  });
}); 