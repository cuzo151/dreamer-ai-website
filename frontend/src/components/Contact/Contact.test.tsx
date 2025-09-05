import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Contact from './Contact';

// Mock axios for API calls
jest.mock('axios', () => ({
  post: jest.fn(() => Promise.resolve({ data: { success: true } })),
}));

// Mock the animation components
jest.mock('../Animation/AnimatedSection', () => ({ children, className }: any) => <div className={className}>{children}</div>);
jest.mock('../Animation/AnimatedButton', () => ({ children, disabled, onClick }: any) => <button disabled={disabled} onClick={onClick}>{children}</button>);
jest.mock('../Animation/LoadingAnimation', () => () => <div>Loading...</div>);
jest.mock('../../hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

describe('Contact Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders contact form with all fields', () => {
    render(<Contact />);
    
    expect(screen.getAllByText(/Get in Touch/i)[0]).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    expect(screen.getByText('Send Message')).toBeInTheDocument();
  });

  it('allows form input', () => {
    render(<Contact />);
    
    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const messageInput = screen.getByLabelText(/message/i);
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(messageInput, { target: { value: 'Test message' } });

    expect(nameInput).toHaveValue('John Doe');
    expect(emailInput).toHaveValue('john@example.com');
    expect(messageInput).toHaveValue('Test message');
  });

  it('submits form with valid data', async () => {
    const axios = require('axios');
    render(<Contact />);
    
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/company/i), { target: { value: 'Acme Corp' } });
    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: 'Hello, I need help.' } });
    
    const submitButton = screen.getByText('Send Message');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/contact/submit'),
        expect.objectContaining({
          name: 'John Doe',
          email: 'john@example.com',
          company: 'Acme Corp',
          message: 'Hello, I need help.',
          type: 'general'
        })
      );
    });
  });

  it('displays success message after form submission', async () => {
    render(<Contact />);
    
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: 'Test message' } });
    
    const submitButton = screen.getByText('Send Message');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Thank you for contacting us/i)).toBeInTheDocument();
    });
  });

  it('has proper accessibility attributes', () => {
    render(<Contact />);
    
    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const messageInput = screen.getByLabelText(/message/i);
    
    expect(nameInput).toHaveAttribute('id', 'name');
    expect(emailInput).toHaveAttribute('id', 'email');
    expect(messageInput).toHaveAttribute('id', 'message');
  });
});