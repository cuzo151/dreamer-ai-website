// Jest test setup
require('dotenv').config({ path: '.env.test' });

// Mock the database module before any imports
const mockPool = {
  query: jest.fn(),
  connect: jest.fn(),
  end: jest.fn().mockResolvedValue(undefined),
  on: jest.fn(),
  totalCount: 10,
  idleCount: 5,
  waitingCount: 0
};

const mockClient = {
  query: jest.fn(),
  release: jest.fn()
};

// Mock the entire pg module
jest.mock('pg', () => ({
  Pool: jest.fn(() => mockPool),
  Client: jest.fn(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    query: jest.fn(),
    end: jest.fn().mockResolvedValue(undefined)
  }))
}));

// Mock database functions
mockPool.connect.mockResolvedValue(mockClient);
mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 });
mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 });

// Mock Redis
const mockRedis = {
  ping: jest.fn().mockResolvedValue('PONG'),
  info: jest.fn().mockResolvedValue('redis_version:6.2.6'),
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  expire: jest.fn().mockResolvedValue(1),
  ttl: jest.fn().mockResolvedValue(-1),
  incr: jest.fn().mockResolvedValue(1),
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
  on: jest.fn()
};

jest.mock('../config/redis', () => mockRedis);

// Mock express-rate-limit to disable rate limiting in tests
const mockRateLimit = jest.fn(() => (req, res, next) => next());
// Handle both default export and named export
Object.assign(mockRateLimit, { rateLimit: mockRateLimit });
jest.mock('express-rate-limit', () => mockRateLimit);

// Mock email service with a flexible mock that can be reconfigured
const mockSendEmail = jest.fn().mockResolvedValue({
  messageId: 'test-message-id',
  accepted: ['test@example.com']
});

jest.mock('../utils/emailService', () => ({
  sendEmail: mockSendEmail
}));

// Make the email mock available globally for test access
global.mockSendEmail = mockSendEmail;

// Mock the database module
jest.mock('../database', () => ({
  pool: mockPool,
  createUser: jest.fn(),
  findUserByEmail: jest.fn(),
  verifyPassword: jest.fn(),
  createSession: jest.fn(),
  validateSession: jest.fn(),
  createLead: jest.fn(),
  logLeadActivity: jest.fn(),
  getLeads: jest.fn(),
  createBooking: jest.fn(),
  getAvailableSlots: jest.fn(),
  saveChat: jest.fn(),
  getChatHistory: jest.fn(),
  getContentBySlug: jest.fn(),
  getCaseStudies: jest.fn(),
  getTestimonials: jest.fn(),
  subscribeNewsletter: jest.fn(),
  trackEvent: jest.fn(),
  logAudit: jest.fn(),
  healthCheck: jest.fn().mockResolvedValue({ status: 'healthy', timestamp: new Date() }),
  getPool: jest.fn().mockReturnValue(mockPool)
}));

// Setup before all tests
beforeAll(async () => {
  // Make mock pool available globally
  global.testPool = mockPool;
  global.mockClient = mockClient;
  global.mockRedis = mockRedis;
});

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  
  // Reset default mock implementations
  mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 });
  mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 });
  mockRedis.ping.mockResolvedValue('PONG');
  mockRedis.info.mockResolvedValue('redis_version:6.2.6');
});

// Cleanup after all tests
afterAll(async () => {
  // No real cleanup needed with mocks
});

// Export mocks for use in tests
global.mockDatabase = {
  pool: mockPool,
  client: mockClient,
  redis: mockRedis
};

// Increase timeout for async operations
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};