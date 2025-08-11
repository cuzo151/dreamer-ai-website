import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Interactive from './Interactive';

// Mock axios for API calls
jest.mock('axios', () => ({
  post: jest.fn(() => Promise.resolve({ 
    data: { 
      analysis: 'Sample analysis result',
      summary: 'Document processed successfully'
    } 
  })),
}));

// Mock DemoResult component
jest.mock('./DemoResult', () => ({ result }: any) => (
  <div className="demo-result">
    <h4>Analysis Result</h4>
    <pre>{result}</pre>
  </div>
));

describe('Interactive Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders interactive demos section', () => {
    render(<Interactive />);
    
    expect(screen.getByText(/Experience Dreamer AI in Action/i)).toBeInTheDocument();
    expect(screen.getByText(/Try our AI capabilities/i)).toBeInTheDocument();
  });

  it('renders demo tabs', () => {
    render(<Interactive />);
    
    expect(screen.getByText('Document Analysis')).toBeInTheDocument();
    expect(screen.getByText('Voice Transcription')).toBeInTheDocument();
    expect(screen.getByText('Voice Cloning')).toBeInTheDocument();
    expect(screen.getByText('Lead Generator')).toBeInTheDocument();
  });

  it('switches between demo tabs', () => {
    render(<Interactive />);
    
    const voiceTab = screen.getByText('Voice Transcription');
    fireEvent.click(voiceTab);
    
    expect(screen.getAllByText(/Voice Transcription Demo/i)[0]).toBeInTheDocument();
  });

  it('allows text input for document analysis', () => {
    render(<Interactive />);
    
    const textarea = screen.getByPlaceholderText(/Paste your document text here/i);
    fireEvent.change(textarea, { target: { value: 'Sample document text' } });
    
    expect(textarea).toHaveValue('Sample document text');
  });

  it('processes document analysis', async () => {
    const axios = require('axios');
    render(<Interactive />);
    
    const textarea = screen.getByPlaceholderText(/Paste your document text here/i);
    fireEvent.change(textarea, { target: { value: 'Sample legal document' } });
    
    const analyzeButton = screen.getByText('Analyze Document');
    fireEvent.click(analyzeButton);
    
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/showcase/analyze-document'),
        expect.objectContaining({
          text: 'Sample legal document',
          type: 'legal'
        })
      );
    });
  });

  it('displays analysis results', async () => {
    render(<Interactive />);
    
    const textarea = screen.getByPlaceholderText(/Paste your document text here/i);
    fireEvent.change(textarea, { target: { value: 'Test document' } });
    
    const analyzeButton = screen.getByText('Analyze Document');
    fireEvent.click(analyzeButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Analysis Result/i)).toBeInTheDocument();
    });
  });

  it('handles lead generation demo', () => {
    render(<Interactive />);
    
    const leadTab = screen.getByText('Lead Generator');
    fireEvent.click(leadTab);
    
    expect(screen.getByText(/AI Lead Generator Demo/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Company type/i)).toBeInTheDocument();
  });

  it('shows loading state during processing', async () => {
    render(<Interactive />);
    
    const textarea = screen.getByPlaceholderText(/Paste your document text here/i);
    fireEvent.change(textarea, { target: { value: 'Test document' } });
    
    const analyzeButton = screen.getByText('Analyze Document');
    fireEvent.click(analyzeButton);
    
    expect(screen.getByText(/Analyzing/i)).toBeInTheDocument();
  });

  it('has proper structure', () => {
    render(<Interactive />);
    
    const section = document.getElementById('interactive');
    expect(section).toBeInTheDocument();
    
    const demoButtons = screen.getAllByRole('button');
    expect(demoButtons.length).toBeGreaterThan(0);
  });
});