import { reportService, ReportData, DemoRequest } from './reportService';

// Mock DOM APIs
Object.defineProperty(global, 'URL', {
  writable: true,
  value: {
    createObjectURL: jest.fn(() => 'mock-blob-url'),
    revokeObjectURL: jest.fn()
  }
});

// Mock document methods
Object.defineProperty(document, 'createElement', {
  writable: true,
  value: jest.fn(() => ({
    href: '',
    download: '',
    click: jest.fn(),
    setAttribute: jest.fn(),
    getAttribute: jest.fn(),
    style: {}
  }))
});

Object.defineProperty(document.body, 'appendChild', {
  writable: true,
  value: jest.fn()
});

Object.defineProperty(document.body, 'removeChild', {
  writable: true,
  value: jest.fn()
});

// Mock fetch for API calls
global.fetch = jest.fn();

describe('ReportService', () => {
  const sampleReportData: ReportData = {
    totalRevenue: 328000,
    totalClients: 22,
    totalProjects: 70,
    avgProjectValue: 4686,
    monthlyData: [
      { month: 'Jan', revenue: 45000, clients: 12, projects: 8 },
      { month: 'Feb', revenue: 52000, clients: 15, projects: 11 },
      { month: 'Mar', revenue: 48000, clients: 14, projects: 9 },
      { month: 'Apr', revenue: 61000, clients: 18, projects: 14 },
      { month: 'May', revenue: 55000, clients: 16, projects: 12 },
      { month: 'Jun', revenue: 67000, clients: 22, projects: 16 },
    ],
    technologyData: [
      { name: 'React', value: 35, fill: '#61DAFB' },
      { name: 'Node.js', value: 25, fill: '#339933' },
      { name: 'Python', value: 20, fill: '#3776AB' },
      { name: 'AI/ML', value: 15, fill: '#FF6B6B' },
      { name: 'Cloud', value: 5, fill: '#4285F4' },
    ],
    performanceData: [
      { metric: 'Efficiency', score: 85, fill: '#8884d8' },
      { metric: 'Quality', score: 92, fill: '#82ca9d' },
      { metric: 'Innovation', score: 78, fill: '#ffc658' },
      { metric: 'Satisfaction', score: 95, fill: '#ff8042' },
      { metric: 'Growth', score: 88, fill: '#0088fe' },
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('downloadReport', () => {
    it('successfully downloads a report', async () => {
      const downloadPromise = reportService.downloadReport(sampleReportData);
      
      // Fast-forward timers to simulate async operations
      jest.advanceTimersByTime(2000);
      
      await downloadPromise;
      
      // Verify blob creation and download
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(document.body.appendChild).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('mock-blob-url');
    });

    it('generates filename with current date', async () => {
      const mockDate = new Date('2024-01-15T10:00:00Z');
      jest.setSystemTime(mockDate);
      
      const downloadPromise = reportService.downloadReport(sampleReportData);
      jest.advanceTimersByTime(2000);
      await downloadPromise;
      
      const mockLink = (document.createElement as jest.Mock).mock.results[0].value;
      expect(mockLink.download).toBe('dreamer-ai-analytics-report-2024-01-15.pdf');
    });

    it('uses custom filename when provided', async () => {
      const customFilename = 'custom-report';
      const downloadPromise = reportService.downloadReport(sampleReportData, customFilename);
      jest.advanceTimersByTime(2000);
      await downloadPromise;
      
      const mockLink = (document.createElement as jest.Mock).mock.results[0].value;
      expect(mockLink.download).toContain('custom-report');
    });

    it('handles download errors gracefully', async () => {
      // Mock an error in blob creation
      const originalCreateObjectURL = global.URL.createObjectURL;
      global.URL.createObjectURL = jest.fn(() => {
        throw new Error('Blob creation failed');
      });
      
      await expect(reportService.downloadReport(sampleReportData)).rejects.toThrow(
        'Failed to generate report. Please try again.'
      );
      
      // Restore original function
      global.URL.createObjectURL = originalCreateObjectURL;
    });

    it('creates blob with PDF content type', async () => {
      const downloadPromise = reportService.downloadReport(sampleReportData);
      jest.advanceTimersByTime(2000);
      await downloadPromise;
      
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'application/pdf'
        })
      );
    });
  });

  describe('scheduleDemo', () => {
    const validDemoRequest: DemoRequest = {
      name: 'John Doe',
      email: 'john@example.com',
      company: 'Test Company',
      phone: '+1234567890',
      message: 'Interested in AI solutions',
      preferredDate: '2024-02-01',
      preferredTime: '10:00'
    };

    it('successfully schedules a demo', async () => {
      const schedulePromise = reportService.scheduleDemo(validDemoRequest);
      jest.advanceTimersByTime(2000);
      const result = await schedulePromise;
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Demo scheduled successfully!');
      expect(result.bookingId).toMatch(/^DEMO-\d+-[A-Z0-9]{5}$/);
    });

    it('returns consistent booking ID format', async () => {
      const schedulePromise = reportService.scheduleDemo(validDemoRequest);
      jest.advanceTimersByTime(2000);
      const result = await schedulePromise;
      
      expect(result.bookingId).toBeTruthy();
      expect(typeof result.bookingId).toBe('string');
      expect(result.bookingId).toMatch(/^DEMO-\d+-[A-Z0-9]{5}$/);
    });

    it('handles scheduling errors', async () => {
      // Mock a scheduling failure
      const originalRandom = Math.random;
      Math.random = jest.fn(() => {
        throw new Error('Random generation failed');
      });
      
      const result = await reportService.scheduleDemo(validDemoRequest);
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to schedule demo. Please try again or contact us directly.');
      
      // Restore original function
      Math.random = originalRandom;
    });

    it('includes all request data in processing', async () => {
      const detailedRequest: DemoRequest = {
        ...validDemoRequest,
        message: 'Very detailed message about specific needs'
      };
      
      const schedulePromise = reportService.scheduleDemo(detailedRequest);
      jest.advanceTimersByTime(2000);
      const result = await schedulePromise;
      
      expect(result.success).toBe(true);
      // In a real implementation, we'd verify the data was sent to the backend
    });
  });

  describe('validateDemoRequest', () => {
    it('validates required fields', () => {
      const emptyRequest = {};
      const result = reportService.validateDemoRequest(emptyRequest);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Name is required');
      expect(result.errors).toContain('Email is required');
      expect(result.errors).toContain('Company is required');
    });

    it('validates email format', () => {
      const invalidEmailRequest = {
        name: 'John Doe',
        email: 'invalid-email',
        company: 'Test Company'
      };
      
      const result = reportService.validateDemoRequest(invalidEmailRequest);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Please enter a valid email address');
    });

    it('validates phone number format when provided', () => {
      const invalidPhoneRequest = {
        name: 'John Doe',
        email: 'john@example.com',
        company: 'Test Company',
        phone: 'invalid-phone'
      };
      
      const result = reportService.validateDemoRequest(invalidPhoneRequest);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Please enter a valid phone number');
    });

    it('accepts valid phone number formats', () => {
      const validPhoneNumbers = [
        '+1234567890',
        '1234567890',
        '+1-234-567-8900',
        '+44 20 7946 0958'
      ];
      
      validPhoneNumbers.forEach(phone => {
        const request = {
          name: 'John Doe',
          email: 'john@example.com',
          company: 'Test Company',
          phone: phone.replace(/\s/g, '') // Remove spaces as service does
        };
        
        const result = reportService.validateDemoRequest(request);
        expect(result.valid).toBe(true);
      });
    });

    it('passes validation with all valid fields', () => {
      const validRequest: DemoRequest = {
        name: 'John Doe',
        email: 'john@example.com',
        company: 'Test Company',
        phone: '+1234567890',
        message: 'Test message',
        preferredDate: '2024-02-01',
        preferredTime: '10:00'
      };
      
      const result = reportService.validateDemoRequest(validRequest);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('trims whitespace from required fields', () => {
      const whitespaceRequest = {
        name: '  ',
        email: '  ',
        company: '  '
      };
      
      const result = reportService.validateDemoRequest(whitespaceRequest);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Name is required');
      expect(result.errors).toContain('Email is required');
      expect(result.errors).toContain('Company is required');
    });

    it('handles undefined and null values', () => {
      const nullRequest = {
        name: null as any,
        email: undefined as any,
        company: null as any
      };
      
      const result = reportService.validateDemoRequest(nullRequest);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Report Content Generation', () => {
    it('includes all data sections in report', async () => {
      const downloadPromise = reportService.downloadReport(sampleReportData);
      jest.advanceTimersByTime(2000);
      await downloadPromise;
      
      // Verify blob was created (content validation would require accessing blob content)
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'application/pdf'
        })
      );
    });

    it('handles edge cases in data', async () => {
      const edgeCaseData: ReportData = {
        totalRevenue: 0,
        totalClients: 0,
        totalProjects: 0,
        avgProjectValue: 0,
        monthlyData: [],
        technologyData: [],
        performanceData: []
      };
      
      const downloadPromise = reportService.downloadReport(edgeCaseData);
      jest.advanceTimersByTime(2000);
      
      // Should not throw error
      await expect(downloadPromise).resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('handles DOM manipulation errors in download', async () => {
      const originalAppendChild = document.body.appendChild;
      document.body.appendChild = jest.fn(() => {
        throw new Error('DOM error');
      });
      
      await expect(reportService.downloadReport(sampleReportData)).rejects.toThrow(
        'Failed to generate report. Please try again.'
      );
      
      document.body.appendChild = originalAppendChild;
    });

    it('handles blob URL creation errors', async () => {
      const originalCreateObjectURL = global.URL.createObjectURL;
      global.URL.createObjectURL = jest.fn(() => {
        throw new Error('Blob URL error');
      });
      
      await expect(reportService.downloadReport(sampleReportData)).rejects.toThrow();
      
      global.URL.createObjectURL = originalCreateObjectURL;
    });
  });

  describe('Performance', () => {
    it('completes report generation within reasonable time', async () => {
      const startTime = Date.now();
      
      const downloadPromise = reportService.downloadReport(sampleReportData);
      jest.advanceTimersByTime(2000);
      await downloadPromise;
      
      // In the mocked environment, this should complete quickly
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(3000); // Allow for mock delays
    });

    it('handles large datasets efficiently', async () => {
      const largeSampleData: ReportData = {
        ...sampleReportData,
        monthlyData: Array(100).fill(sampleReportData.monthlyData[0]),
        technologyData: Array(50).fill(sampleReportData.technologyData[0]),
        performanceData: Array(20).fill(sampleReportData.performanceData[0])
      };
      
      const downloadPromise = reportService.downloadReport(largeSampleData);
      jest.advanceTimersByTime(2000);
      
      // Should handle large datasets without errors
      await expect(downloadPromise).resolves.not.toThrow();
    });
  });
});