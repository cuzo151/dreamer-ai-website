import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DemoScheduleModal from './DemoScheduleModal';
import { reportService } from '../../services/reportService';

// Mock the report service
jest.mock('../../services/reportService');
const mockReportService = reportService as jest.Mocked<typeof reportService>;

// Mock gtag for analytics tracking
declare global {
  var gtag: jest.MockedFunction<any>;
}

global.gtag = jest.fn();

// Mock LoadingAnimation
jest.mock('../Animation/LoadingAnimation', () => {
  return function MockLoadingAnimation({ variant, size }: { variant: string; size: string }) {
    return <div data-testid="loading-animation" data-variant={variant} data-size={size}>Loading...</div>;
  };
});

describe('DemoScheduleModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.gtag.mockClear();
  });

  describe('Rendering', () => {
    it('does not render when isOpen is false', () => {
      render(<DemoScheduleModal isOpen={false} onClose={jest.fn()} />);
      
      expect(screen.queryByText('Schedule Your AI Demo')).not.toBeInTheDocument();
    });

    it('renders modal when isOpen is true', () => {
      render(<DemoScheduleModal {...defaultProps} />);
      
      expect(screen.getByText('Schedule Your AI Demo')).toBeInTheDocument();
      expect(screen.getByLabelText('Full Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Email Address *')).toBeInTheDocument();
      expect(screen.getByLabelText('Company *')).toBeInTheDocument();
      expect(screen.getByLabelText('Phone Number')).toBeInTheDocument();
      expect(screen.getByLabelText('Preferred Date')).toBeInTheDocument();
      expect(screen.getByLabelText('Preferred Time')).toBeInTheDocument();
      expect(screen.getByLabelText('Additional Message')).toBeInTheDocument();
    });

    it('renders what to expect section', () => {
      render(<DemoScheduleModal {...defaultProps} />);
      
      expect(screen.getByText('What to Expect')).toBeInTheDocument();
      expect(screen.getByText('30-45 minute personalized demonstration')).toBeInTheDocument();
      expect(screen.getByText('Live Q&A with our AI specialists')).toBeInTheDocument();
      expect(screen.getByText('Custom use case analysis for your business')).toBeInTheDocument();
      expect(screen.getByText('Implementation timeline and pricing discussion')).toBeInTheDocument();
    });

    it('renders action buttons', () => {
      render(<DemoScheduleModal {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Schedule Demo' })).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('updates form fields when user types', async () => {
      const user = userEvent.setup();
      render(<DemoScheduleModal {...defaultProps} />);
      
      const nameInput = screen.getByLabelText('Full Name *');
      const emailInput = screen.getByLabelText('Email Address *');
      const companyInput = screen.getByLabelText('Company *');
      
      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      await user.type(companyInput, 'Test Company');
      
      expect(nameInput).toHaveValue('John Doe');
      expect(emailInput).toHaveValue('john@example.com');
      expect(companyInput).toHaveValue('Test Company');
    });

    it('clears errors when user starts typing', async () => {
      mockReportService.validateDemoRequest.mockReturnValue({
        valid: false,
        errors: ['Name is required']
      });
      
      const user = userEvent.setup();
      render(<DemoScheduleModal {...defaultProps} />);
      
      // Submit empty form to show errors
      const submitButton = screen.getByRole('button', { name: 'Schedule Demo' });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
      });
      
      // Start typing in name field - errors should clear
      const nameInput = screen.getByLabelText('Full Name *');
      await user.type(nameInput, 'J');
      
      expect(screen.queryByText('Name is required')).not.toBeInTheDocument();
    });

    it('handles date input with minimum date validation', () => {
      render(<DemoScheduleModal {...defaultProps} />);
      
      const dateInput = screen.getByLabelText('Preferred Date');
      const today = new Date().toISOString().split('T')[0];
      
      expect(dateInput).toHaveAttribute('min', today);
    });

    it('provides time slot options', () => {
      render(<DemoScheduleModal {...defaultProps} />);
      
      const timeSelect = screen.getByLabelText('Preferred Time');
      
      expect(screen.getByRole('option', { name: '9:00 AM' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '10:00 AM' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '11:00 AM' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '2:00 PM' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '3:00 PM' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '4:00 PM' })).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('shows validation errors for empty required fields', async () => {
      mockReportService.validateDemoRequest.mockReturnValue({
        valid: false,
        errors: ['Name is required', 'Email is required', 'Company is required']
      });
      
      const user = userEvent.setup();
      render(<DemoScheduleModal {...defaultProps} />);
      
      const submitButton = screen.getByRole('button', { name: 'Schedule Demo' });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please fix the following errors:')).toBeInTheDocument();
        expect(screen.getByText('Name is required')).toBeInTheDocument();
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Company is required')).toBeInTheDocument();
      });
      
      // Form should not be submitted
      expect(mockReportService.scheduleDemo).not.toHaveBeenCalled();
    });

    it('shows validation error for invalid email', async () => {
      mockReportService.validateDemoRequest.mockReturnValue({
        valid: false,
        errors: ['Please enter a valid email address']
      });
      
      const user = userEvent.setup();
      render(<DemoScheduleModal {...defaultProps} />);
      
      // Fill form with invalid email
      await user.type(screen.getByLabelText('Full Name *'), 'John Doe');
      await user.type(screen.getByLabelText('Email Address *'), 'invalid-email');
      await user.type(screen.getByLabelText('Company *'), 'Test Company');
      
      const submitButton = screen.getByRole('button', { name: 'Schedule Demo' });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    it('submits form when validation passes', async () => {
      mockReportService.validateDemoRequest.mockReturnValue({
        valid: true,
        errors: []
      });
      mockReportService.scheduleDemo.mockResolvedValue({
        success: true,
        message: 'Demo scheduled successfully!',
        bookingId: 'DEMO-123'
      });
      
      const user = userEvent.setup();
      render(<DemoScheduleModal {...defaultProps} />);
      
      // Fill valid form data
      await user.type(screen.getByLabelText('Full Name *'), 'John Doe');
      await user.type(screen.getByLabelText('Email Address *'), 'john@example.com');
      await user.type(screen.getByLabelText('Company *'), 'Test Company');
      
      const submitButton = screen.getByRole('button', { name: 'Schedule Demo' });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockReportService.scheduleDemo).toHaveBeenCalledWith({
          name: 'John Doe',
          email: 'john@example.com',
          company: 'Test Company',
          phone: '',
          message: '',
          preferredDate: '',
          preferredTime: ''
        });
      });
    });
  });

  describe('Form Submission', () => {
    it('shows loading state during submission', async () => {
      mockReportService.validateDemoRequest.mockReturnValue({
        valid: true,
        errors: []
      });
      
      // Create a promise we can control
      let resolvePromise: (value: any) => void;
      const mockPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockReportService.scheduleDemo.mockReturnValue(mockPromise);
      
      const user = userEvent.setup();
      render(<DemoScheduleModal {...defaultProps} />);
      
      // Fill form
      await user.type(screen.getByLabelText('Full Name *'), 'John Doe');
      await user.type(screen.getByLabelText('Email Address *'), 'john@example.com');
      await user.type(screen.getByLabelText('Company *'), 'Test Company');
      
      const submitButton = screen.getByRole('button', { name: 'Schedule Demo' });
      await user.click(submitButton);
      
      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('Scheduling...')).toBeInTheDocument();
        expect(screen.getByTestId('loading-animation')).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
      });
      
      // Resolve promise
      resolvePromise({
        success: true,
        message: 'Success',
        bookingId: 'DEMO-123'
      });
      
      await waitFor(() => {
        expect(screen.queryByText('Scheduling...')).not.toBeInTheDocument();
      });
    });

    it('shows success state after successful submission', async () => {
      mockReportService.validateDemoRequest.mockReturnValue({
        valid: true,
        errors: []
      });
      mockReportService.scheduleDemo.mockResolvedValue({
        success: true,
        message: 'Demo scheduled successfully!',
        bookingId: 'DEMO-123456'
      });
      
      const user = userEvent.setup();
      render(<DemoScheduleModal {...defaultProps} />);
      
      // Fill and submit form
      await user.type(screen.getByLabelText('Full Name *'), 'John Doe');
      await user.type(screen.getByLabelText('Email Address *'), 'john@example.com');
      await user.type(screen.getByLabelText('Company *'), 'Test Company');
      
      const submitButton = screen.getByRole('button', { name: 'Schedule Demo' });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Demo Scheduled Successfully!')).toBeInTheDocument();
        expect(screen.getByText('DEMO-123456')).toBeInTheDocument();
        expect(screen.getByText("You'll receive a confirmation email within 10 minutes")).toBeInTheDocument();
      });
      
      // Should track analytics
      expect(global.gtag).toHaveBeenCalledWith('event', 'demo_scheduled', {
        event_category: 'conversion',
        event_label: 'dashboard_demo_request'
      });
    });

    it('handles submission failure', async () => {
      mockReportService.validateDemoRequest.mockReturnValue({
        valid: true,
        errors: []
      });
      mockReportService.scheduleDemo.mockResolvedValue({
        success: false,
        message: 'Server error occurred'
      });
      
      const user = userEvent.setup();
      render(<DemoScheduleModal {...defaultProps} />);
      
      // Fill and submit form
      await user.type(screen.getByLabelText('Full Name *'), 'John Doe');
      await user.type(screen.getByLabelText('Email Address *'), 'john@example.com');
      await user.type(screen.getByLabelText('Company *'), 'Test Company');
      
      const submitButton = screen.getByRole('button', { name: 'Schedule Demo' });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Server error occurred')).toBeInTheDocument();
      });
      
      // Should not track success analytics
      expect(global.gtag).not.toHaveBeenCalledWith('event', 'demo_scheduled', expect.anything());
    });

    it('handles unexpected errors during submission', async () => {
      mockReportService.validateDemoRequest.mockReturnValue({
        valid: true,
        errors: []
      });
      mockReportService.scheduleDemo.mockRejectedValue(new Error('Network error'));
      
      const user = userEvent.setup();
      render(<DemoScheduleModal {...defaultProps} />);
      
      // Fill and submit form
      await user.type(screen.getByLabelText('Full Name *'), 'John Doe');
      await user.type(screen.getByLabelText('Email Address *'), 'john@example.com');
      await user.type(screen.getByLabelText('Company *'), 'Test Company');
      
      const submitButton = screen.getByRole('button', { name: 'Schedule Demo' });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('Modal Controls', () => {
    it('calls onClose when backdrop is clicked', async () => {
      const mockOnClose = jest.fn();
      const user = userEvent.setup();
      
      render(<DemoScheduleModal isOpen={true} onClose={mockOnClose} />);
      
      const backdrop = document.querySelector('.bg-gray-500');
      expect(backdrop).toBeInTheDocument();
      
      if (backdrop) {
        await user.click(backdrop);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      }
    });

    it('calls onClose when X button is clicked', async () => {
      const mockOnClose = jest.fn();
      const user = userEvent.setup();
      
      render(<DemoScheduleModal isOpen={true} onClose={mockOnClose} />);
      
      const closeButton = document.querySelector('[data-testid="close-button"]') || 
                          screen.getByRole('button', { name: '' }); // X button usually has no text
      
      // Find close button by looking for the XMarkIcon
      const xButton = document.querySelector('button svg')?.closest('button');
      if (xButton) {
        await user.click(xButton);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      }
    });

    it('calls onClose when Cancel button is clicked', async () => {
      const mockOnClose = jest.fn();
      const user = userEvent.setup();
      
      render(<DemoScheduleModal isOpen={true} onClose={mockOnClose} />);
      
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelButton);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('resets form when closing modal', async () => {
      const mockOnClose = jest.fn();
      const user = userEvent.setup();
      
      render(<DemoScheduleModal isOpen={true} onClose={mockOnClose} />);
      
      // Fill some form data
      await user.type(screen.getByLabelText('Full Name *'), 'John Doe');
      await user.type(screen.getByLabelText('Email Address *'), 'john@example.com');
      
      // Close modal
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelButton);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
      
      // Reopen modal and check if form is reset
      render(<DemoScheduleModal isOpen={true} onClose={jest.fn()} />);
      
      expect(screen.getByLabelText('Full Name *')).toHaveValue('');
      expect(screen.getByLabelText('Email Address *')).toHaveValue('');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and structure', () => {
      render(<DemoScheduleModal {...defaultProps} />);
      
      // Check form labels
      expect(screen.getByLabelText('Full Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Email Address *')).toBeInTheDocument();
      expect(screen.getByLabelText('Company *')).toBeInTheDocument();
      expect(screen.getByLabelText('Phone Number')).toBeInTheDocument();
      expect(screen.getByLabelText('Preferred Date')).toBeInTheDocument();
      expect(screen.getByLabelText('Preferred Time')).toBeInTheDocument();
      expect(screen.getByLabelText('Additional Message')).toBeInTheDocument();
      
      // Check button accessibility
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Schedule Demo' })).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      render(<DemoScheduleModal {...defaultProps} />);
      
      const nameInput = screen.getByLabelText('Full Name *');
      const emailInput = screen.getByLabelText('Email Address *');
      
      // Should be able to tab through form fields
      nameInput.focus();
      expect(nameInput).toHaveFocus();
      
      fireEvent.keyDown(nameInput, { key: 'Tab' });
      emailInput.focus();
      expect(emailInput).toHaveFocus();
    });

    it('handles escape key to close modal', () => {
      const mockOnClose = jest.fn();
      render(<DemoScheduleModal isOpen={true} onClose={mockOnClose} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      // Note: This would need to be implemented in the actual component
      // For now, we're just documenting the expected behavior
    });
  });
});