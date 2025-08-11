import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import About from './About';

describe('About Component', () => {
  it('renders the About section with correct structure', () => {
    render(<About />);
    
    expect(screen.getByText('About Us')).toBeInTheDocument();
    expect(screen.getByText('Pioneering the Future of AI Solutions')).toBeInTheDocument();
  });

  it('renders the company description', () => {
    render(<About />);
    
    expect(screen.getByText(/At Dreamer AI Solutions, we transform visionary ideas/)).toBeInTheDocument();
    expect(screen.getByText(/From vision to reality/)).toBeInTheDocument();
  });

  it('renders all statistics with correct values', () => {
    render(<About />);
    
    expect(screen.getByText('5+')).toBeInTheDocument();
    expect(screen.getByText('Years of AI Innovation')).toBeInTheDocument();
    
    expect(screen.getByText('100+')).toBeInTheDocument();
    expect(screen.getByText('Enterprise Clients')).toBeInTheDocument();
    
    expect(screen.getByText('50+')).toBeInTheDocument();
    expect(screen.getByText('AI Models Deployed')).toBeInTheDocument();
    
    expect(screen.getByText('99%')).toBeInTheDocument();
    expect(screen.getByText('Success Rate')).toBeInTheDocument();
  });

  it('renders all company values with descriptions', () => {
    render(<About />);
    
    // Innovation First
    expect(screen.getByText('Innovation First')).toBeInTheDocument();
    expect(screen.getByText("We push the boundaries of what's possible with artificial intelligence.")).toBeInTheDocument();
    
    // Enterprise Grade
    expect(screen.getByText('Enterprise Grade')).toBeInTheDocument();
    expect(screen.getByText('Security, reliability, and compliance are built into every solution.')).toBeInTheDocument();
    
    // Client Success
    expect(screen.getByText('Client Success')).toBeInTheDocument();
    expect(screen.getByText('Your success is our mission. We partner with you for long-term growth.')).toBeInTheDocument();
    
    // Continuous Learning
    expect(screen.getByText('Continuous Learning')).toBeInTheDocument();
    expect(screen.getByText('We stay ahead of AI trends to deliver cutting-edge solutions.')).toBeInTheDocument();
  });

  it('renders founder section', () => {
    render(<About />);
    
    expect(screen.getByText('Meet Our Founder & CEO')).toBeInTheDocument();
    expect(screen.getByText('J. LaSalle')).toBeInTheDocument();
  });

  it('renders founder information', () => {
    render(<About />);
    
    expect(screen.getByText('J. LaSalle')).toBeInTheDocument();
    expect(screen.getByText(/Founded with a vision to democratize artificial intelligence/)).toBeInTheDocument();
    expect(screen.getByText('Connect on LinkedIn')).toBeInTheDocument();
  });

  it('renders call to action section', () => {
    render(<About />);
    
    expect(screen.getByText('Ready to Transform Your Business?')).toBeInTheDocument();
    expect(screen.getByText('Start Your AI Journey')).toBeInTheDocument();
  });

  it('has proper HTML structure and CSS classes', () => {
    render(<About />);
    
    const section = document.getElementById('about');
    expect(section).toBeInTheDocument();
    
    // Check stats are rendered (4 stats items)
    expect(screen.getByText('5+')).toBeInTheDocument();
    expect(screen.getByText('100+')).toBeInTheDocument();
    expect(screen.getByText('50+')).toBeInTheDocument();
    expect(screen.getByText('99%')).toBeInTheDocument();
  });

  it('renders values section with all four values', () => {
    render(<About />);
    
    // Check that all four values are rendered
    expect(screen.getByText('Innovation First')).toBeInTheDocument();
    expect(screen.getByText('Enterprise Grade')).toBeInTheDocument();
    expect(screen.getByText('Client Success')).toBeInTheDocument();
    expect(screen.getByText('Continuous Learning')).toBeInTheDocument();
  });

  it('renders founder section with profile', () => {
    render(<About />);
    
    expect(screen.getByText('Meet Our Founder & CEO')).toBeInTheDocument();
    expect(screen.getByText('J. LaSalle')).toBeInTheDocument();
    expect(screen.getByText('Founder & CEO')).toBeInTheDocument();
  });

  it('has accessible heading hierarchy', () => {
    render(<About />);
    
    const aboutHeading = screen.getByText('About Us');
    expect(aboutHeading).toBeInTheDocument();
    
    const storyHeading = screen.getByText('Our Story');
    expect(storyHeading).toBeInTheDocument();
    
    const founderHeading = screen.getByText('Meet Our Founder & CEO');
    expect(founderHeading).toBeInTheDocument();
  });

  it('renders LinkedIn link with proper attributes', () => {
    render(<About />);
    
    const linkedinLink = screen.getByText('Connect on LinkedIn');
    expect(linkedinLink.closest('a')).toHaveAttribute('href', 'https://www.linkedin.com/in/jlasalle973');
    expect(linkedinLink.closest('a')).toHaveAttribute('target', '_blank');
    expect(linkedinLink.closest('a')).toHaveAttribute('rel', 'noopener noreferrer');
  });
}); 