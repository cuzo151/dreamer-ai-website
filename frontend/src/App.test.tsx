import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Mock all external components
jest.mock('./components/Header/Header', () => () => <div>Header</div>);
jest.mock('./components/Hero/Hero', () => () => <div>Hero</div>);
jest.mock('./components/About/About', () => () => <div>About</div>);
jest.mock('./components/VideoShowcase/VideoShowcase', () => () => <div>VideoShowcase</div>);
jest.mock('./components/Capabilities/Capabilities', () => () => <div>Capabilities</div>);
jest.mock('./components/AITools/AITools', () => () => <div>AITools</div>);
jest.mock('./components/Interactive/Interactive', () => () => <div>Interactive</div>);
jest.mock('./components/Contact/Contact', () => () => <div>Contact</div>);
jest.mock('./components/Footer/Footer', () => () => <div>Footer</div>);
jest.mock('./components/Animation/LoadingAnimation', () => () => <div>Loading...</div>);
jest.mock('./components/Animation/AnimatedBackground', () => () => <div></div>);
jest.mock('./components/Animation/ScrollIndicator', () => () => <div></div>);
jest.mock('./components/ElevenLabsChat/ElevenLabsChat', () => () => <div></div>);

describe('App Component', () => {
  it('renders loading animation initially', () => {
    render(<App />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders main app content after loading', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Hero')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
      expect(screen.getByText('VideoShowcase')).toBeInTheDocument();
    }, { timeout: 2000 });
  });
});
