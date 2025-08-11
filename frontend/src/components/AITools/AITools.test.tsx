import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AITools from './AITools';

// Mock console.log and alert to avoid noise in tests
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});

describe('AITools Component', () => {
  beforeEach(() => {
    mockConsoleLog.mockClear();
    mockAlert.mockClear();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockAlert.mockRestore();
  });

  it('renders the AI Tools section with correct title', () => {
    render(<AITools />);
    
    expect(screen.getByText('Our AI-Powered Tools')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Our AI-Powered Tools' })).toBeInTheDocument();
  });

  it('renders all tool cards with correct content', () => {
    render(<AITools />);
    
    // Test AI Voice Clone Tool
    expect(screen.getByText('AI Voice Clone Tool')).toBeInTheDocument();
    expect(screen.getByText('Create realistic voice clones with advanced AI technology. Perfect for content creation, accessibility, and personalized experiences.')).toBeInTheDocument();
    
    // Test Voice AI Assistant
    expect(screen.getByText('Voice AI Assistant')).toBeInTheDocument();
    expect(screen.getByText('Intelligent voice assistant powered by Eleven Labs integration. Natural conversations and smart responses.')).toBeInTheDocument();
    
    // Test Document Analyzer
    expect(screen.getByText('Document Analyzer')).toBeInTheDocument();
    expect(screen.getByText('AI-powered document analysis and insights. Extract key information and generate summaries automatically.')).toBeInTheDocument();
    
    // Test Data Insights Generator
    expect(screen.getByText('Data Insights Generator')).toBeInTheDocument();
    expect(screen.getByText('Transform raw data into actionable business insights with our advanced analytics AI.')).toBeInTheDocument();
  });

  it('renders action buttons for all tools', () => {
    render(<AITools />);
    
    expect(screen.getByText('Try Voice Clone')).toBeInTheDocument();
    expect(screen.getByText('Launch Assistant')).toBeInTheDocument();
    expect(screen.getByText('Analyze Documents')).toBeInTheDocument();
    expect(screen.getByText('Generate Insights')).toBeInTheDocument();
    expect(screen.getByText('Build Automation')).toBeInTheDocument();
    expect(screen.getByText('Get Recommendations')).toBeInTheDocument();
  });

  it('handles tool click for AI Voice Clone Tool', () => {
    render(<AITools />);
    
    const button = screen.getByText('Try Voice Clone');
    fireEvent.click(button);
    
    expect(mockConsoleLog).toHaveBeenCalledWith('Clicked on AI Voice Clone Tool');
    expect(mockAlert).toHaveBeenCalledWith('AI Voice Clone Tool - Coming Soon!');
  });

  it('handles tool click for Voice AI Assistant', () => {
    render(<AITools />);
    
    const button = screen.getByText('Launch Assistant');
    fireEvent.click(button);
    
    expect(mockConsoleLog).toHaveBeenCalledWith('Clicked on Voice AI Assistant');
    expect(mockAlert).toHaveBeenCalledWith('Voice AI Assistant - Coming Soon!');
  });

  it('handles tool click for Document Analyzer', () => {
    render(<AITools />);
    
    const button = screen.getByText('Analyze Documents');
    fireEvent.click(button);
    
    expect(mockConsoleLog).toHaveBeenCalledWith('Clicked on Document Analyzer');
    expect(mockAlert).toHaveBeenCalledWith('Document Analyzer - Coming Soon!');
  });

  it('has proper structure with all tools', () => {
    render(<AITools />);
    
    // Check that all six tools are rendered
    expect(screen.getByText('AI Voice Clone Tool')).toBeInTheDocument();
    expect(screen.getByText('Voice AI Assistant')).toBeInTheDocument();
    expect(screen.getByText('Document Analyzer')).toBeInTheDocument();
    expect(screen.getByText('Data Insights Generator')).toBeInTheDocument();
    expect(screen.getByText('Automation Builder')).toBeInTheDocument();
    expect(screen.getByText('Smart Recommendations')).toBeInTheDocument();
  });

  it('renders with correct accessibility', () => {
    render(<AITools />);
    
    const section = document.getElementById('ai-tools');
    expect(section).toBeInTheDocument();
    
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(6); // Should have 6 buttons for 6 tools
  });
}); 