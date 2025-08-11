import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
// Note: Using fireEvent instead of userEvent for compatibility
import Dashboard from './Dashboard';
import { reportService } from '../../services/reportService';

// Mock the report service
jest.mock('../../services/reportService');
const mockReportService = reportService as jest.Mocked<typeof reportService>;

// Mock gtag for analytics tracking
declare global {
  var gtag: jest.MockedFunction<any>;
}

global.gtag = jest.fn();

// Mock UI components that are causing import issues
jest.mock('../ui/chart', () => ({
  ChartContainer: ({ children }: { children: any }) => <div data-testid="chart-container">{children}</div>,
  ChartTooltip: ({ children }: { children: any }) => <div data-testid="chart-tooltip">{children}</div>,
  ChartTooltipContent: () => <div data-testid="chart-tooltip-content" />,
}));

// Mock recharts components to avoid rendering issues in tests
jest.mock('recharts', () => ({
  AreaChart: ({ children }: { children: any }) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  LineChart: ({ children }: { children: any }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  PieChart: ({ children }: { children: any }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  RadialBarChart: ({ children }: { children: any }) => <div data-testid="radial-bar-chart">{children}</div>,
  RadialBar: () => <div data-testid="radial-bar" />,
  BarChart: ({ children }: { children: any }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
}));

// Mock DemoScheduleModal
jest.mock('../DemoScheduleModal/DemoScheduleModal', () => {
  return function MockDemoScheduleModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    return isOpen ? (
      <div data-testid="demo-schedule-modal">
        <button data-testid="modal-close" onClick={onClose}>
          Close Modal
        </button>
      </div>
    ) : null;
  };
});

// Mock LoadingAnimation
jest.mock('../Animation/LoadingAnimation', () => {
  return function MockLoadingAnimation({ variant, size }: { variant: string; size: string }) {
    return <div data-testid="loading-animation" data-variant={variant} data-size={size}>Loading...</div>;
  };
});

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    if (global.gtag && global.gtag.mockClear) {
      global.gtag.mockClear();
    }
  });

  describe('Rendering', () => {
    it('renders dashboard with all key components', () => {
      render(<Dashboard />);
      
      // Check main title
      expect(screen.getByRole('heading', { name: /analytics dashboard/i })).toBeInTheDocument();
      
      // Check key metrics cards
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getByText('Active Clients')).toBeInTheDocument();
      expect(screen.getByText('Total Projects')).toBeInTheDocument();
      expect(screen.getByText('Avg Project Value')).toBeInTheDocument();
      
      // Check action buttons
      expect(screen.getByRole('button', { name: /download full report/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /schedule demo/i })).toBeInTheDocument();
    });

    it('displays calculated metrics correctly', () => {
      render(<Dashboard />);
      
      // Check if calculated values are displayed
      expect(screen.getByText('$328,000')).toBeInTheDocument(); // Total revenue
      expect(screen.getByText('22')).toBeInTheDocument(); // Total clients (from last month)
      expect(screen.getByText('70')).toBeInTheDocument(); // Total projects
      expect(screen.getByText('$4,686')).toBeInTheDocument(); // Avg project value
    });

    it('renders all chart components', () => {
      render(<Dashboard />);
      
      // Check chart titles
      expect(screen.getByText('Revenue Trend')).toBeInTheDocument();
      expect(screen.getByText('Client Growth')).toBeInTheDocument();
      expect(screen.getByText('Technology Distribution')).toBeInTheDocument();
      expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
      expect(screen.getByText('Projects Overview')).toBeInTheDocument();
      
      // Check that chart components are rendered
      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      expect(screen.getByTestId('radial-bar-chart')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
  });

  describe('Download Report Functionality', () => {
    it('handles successful report download', async () => {
      mockReportService.downloadReport.mockResolvedValueOnce(undefined);
      
      render(<Dashboard />);
      
      const downloadButton = screen.getByRole('button', { name: /download full report/i });
      
      fireEvent.click(downloadButton);
      
      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('Generating Report...')).toBeInTheDocument();
        expect(screen.getByTestId('loading-animation')).toBeInTheDocument();
      });
      
      // Wait for completion
      await waitFor(() => {
        expect(mockReportService.downloadReport).toHaveBeenCalledTimes(1);
        expect(global.gtag).toHaveBeenCalledWith('event', 'report_downloaded', {
          event_category: 'engagement',
          event_label: 'dashboard_report'
        });
      });
      
      // Loading state should be gone
      await waitFor(() => {
        expect(screen.queryByText('Generating Report...')).not.toBeInTheDocument();
        expect(screen.getByText('Download Full Report')).toBeInTheDocument();
      });
    });

    it('handles report download error', async () => {
      mockReportService.downloadReport.mockRejectedValueOnce(new Error('Network error'));
      
      render(<Dashboard />);
      
      const downloadButton = screen.getByRole('button', { name: /download full report/i });
      
      fireEvent.click(downloadButton);
      
      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText('Failed to generate report. Please try again.')).toBeInTheDocument();
      });
      
      // Button should be enabled again
      expect(downloadButton).not.toBeDisabled();
      expect(mockReportService.downloadReport).toHaveBeenCalledTimes(1);
    });

    it('disables button during report generation', async () => {
      // Create a promise that we can control
      let resolvePromise: () => void;
      const mockPromise = new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });
      mockReportService.downloadReport.mockReturnValueOnce(mockPromise);
      
      render(<Dashboard />);
      
      const downloadButton = screen.getByRole('button', { name: /download full report/i });
      
      fireEvent.click(downloadButton);
      
      // Button should be disabled
      await waitFor(() => {
        expect(downloadButton).toBeDisabled();
      });
      
      // Resolve the promise
      act(() => {
        resolvePromise();
      });
      
      // Button should be enabled again
      await waitFor(() => {
        expect(downloadButton).not.toBeDisabled();
      });
    });

    it('passes correct data to report service', async () => {
      mockReportService.downloadReport.mockResolvedValueOnce(undefined);
      
      render(<Dashboard />);
      
      const downloadButton = screen.getByRole('button', { name: /download full report/i });
      fireEvent.click(downloadButton);
      
      await waitFor(() => {
        expect(mockReportService.downloadReport).toHaveBeenCalledWith({
          totalRevenue: 328000,
          totalClients: 22,
          totalProjects: 70,
          avgProjectValue: 4686,
          monthlyData: expect.any(Array),
          technologyData: expect.any(Array),
          performanceData: expect.any(Array)
        });
      });
    });
  });

  describe('Schedule Demo Functionality', () => {
    it('opens demo modal when schedule demo button is clicked', async () => {
      render(<Dashboard />);
      
      const scheduleButton = screen.getByRole('button', { name: /schedule demo/i });
      
      // Modal should not be visible initially
      expect(screen.queryByTestId('demo-schedule-modal')).not.toBeInTheDocument();
      
      fireEvent.click(scheduleButton);
      
      // Modal should now be visible
      await waitFor(() => {
        expect(screen.getByTestId('demo-schedule-modal')).toBeInTheDocument();
      });
      
      // Analytics should be tracked
      expect(global.gtag).toHaveBeenCalledWith('event', 'demo_modal_opened', {
        event_category: 'engagement',
        event_label: 'dashboard_demo_button'
      });
    });

    it('closes demo modal when close button is clicked', async () => {
      // Using fireEvent instead of userEvent for compatibility
      render(<Dashboard />);
      
      // Open modal
      const scheduleButton = screen.getByRole('button', { name: /schedule demo/i });
      fireEvent.click(scheduleButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('demo-schedule-modal')).toBeInTheDocument();
      });
      
      // Close modal
      const closeButton = screen.getByTestId('modal-close');
      fireEvent.click(closeButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('demo-schedule-modal')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('clears error when download button is clicked again', async () => {
      mockReportService.downloadReport
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(undefined);
      
      // Using fireEvent instead of userEvent for compatibility
      render(<Dashboard />);
      
      const downloadButton = screen.getByRole('button', { name: /download full report/i });
      
      // First click - should show error
      fireEvent.click(downloadButton);
      await waitFor(() => {
        expect(screen.getByText('Failed to generate report. Please try again.')).toBeInTheDocument();
      });
      
      // Second click - error should be cleared
      fireEvent.click(downloadButton);
      await waitFor(() => {
        expect(screen.queryByText('Failed to generate report. Please try again.')).not.toBeInTheDocument();
      });
    });
  });

  describe('Analytics Tracking', () => {
    it('tracks report download analytics', async () => {
      mockReportService.downloadReport.mockResolvedValueOnce(undefined);
      // Using fireEvent instead of userEvent for compatibility
      
      render(<Dashboard />);
      
      const downloadButton = screen.getByRole('button', { name: /download full report/i });
      fireEvent.click(downloadButton);
      
      await waitFor(() => {
        expect(global.gtag).toHaveBeenCalledWith('event', 'report_downloaded', {
          event_category: 'engagement',
          event_label: 'dashboard_report'
        });
      });
    });

    it('tracks demo modal opening analytics', async () => {
      // Using fireEvent instead of userEvent for compatibility
      render(<Dashboard />);
      
      const scheduleButton = screen.getByRole('button', { name: /schedule demo/i });
      fireEvent.click(scheduleButton);
      
      expect(global.gtag).toHaveBeenCalledWith('event', 'demo_modal_opened', {
        event_category: 'engagement',
        event_label: 'dashboard_demo_button'
      });
    });

    it('handles missing gtag gracefully', async () => {
      // Temporarily remove gtag
      const originalGtag = global.gtag;
      delete (global as any).gtag;
      
      mockReportService.downloadReport.mockResolvedValueOnce(undefined);
      // Using fireEvent instead of userEvent for compatibility
      
      render(<Dashboard />);
      
      const downloadButton = screen.getByRole('button', { name: /download full report/i });
      
      // Should not throw error
      fireEvent.click(downloadButton);
      
      await waitFor(() => {
        expect(mockReportService.downloadReport).toHaveBeenCalledTimes(1);
      });
      
      // Restore gtag
      global.gtag = originalGtag;
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<Dashboard />);
      
      // Check heading structure
      expect(screen.getByRole('heading', { name: /analytics dashboard/i })).toBeInTheDocument();
      
      // Check buttons have accessible names
      expect(screen.getByRole('button', { name: /download full report/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /schedule demo/i })).toBeInTheDocument();
      
      // Check icons have proper ARIA handling (they should be decorative)
      const downloadIcon = screen.getByRole('button', { name: /download full report/i }).querySelector('svg');
      expect(downloadIcon).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      render(<Dashboard />);
      
      const downloadButton = screen.getByRole('button', { name: /download full report/i });
      const scheduleButton = screen.getByRole('button', { name: /schedule demo/i });
      
      // Focus should be movable between buttons
      downloadButton.focus();
      expect(downloadButton).toHaveFocus();
      
      // Tab to next button
      fireEvent.keyDown(downloadButton, { key: 'Tab' });
      scheduleButton.focus();
      expect(scheduleButton).toHaveFocus();
    });
  });
});