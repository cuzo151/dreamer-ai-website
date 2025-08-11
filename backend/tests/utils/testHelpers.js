const supertest = require('supertest');

const app = require('../../server');

// Create authenticated request helper
const createAuthenticatedRequest = (token) => {
  return supertest(app)
    .set('Authorization', `Bearer ${token}`);
};

// Wait for async operations
const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock email service
const mockEmailService = () => {
  const sendEmail = jest.fn().mockResolvedValue({
    messageId: 'test-message-id',
    accepted: ['test@example.com']
  });

  jest.doMock('../../utils/emailService', () => ({
    sendEmail
  }));

  return sendEmail;
};

// Mock Redis client
const mockRedisClient = () => {
  const redisMock = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    ttl: jest.fn().mockResolvedValue(-1),
    incr: jest.fn().mockResolvedValue(1),
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
  };

  jest.doMock('redis', () => ({
    createClient: jest.fn(() => redisMock)
  }));

  return redisMock;
};

// Extract token from email mock
const extractTokenFromEmail = (sendEmailMock, emailType = 'verify-email') => {
  const {calls} = sendEmailMock.mock;
  const relevantCall = calls.find(call => call[0].template === emailType);
  
  if (!relevantCall) {
    throw new Error(`No email sent with template: ${emailType}`);
  }

  const emailData = relevantCall[0];
  const link = emailData.data.verificationLink || emailData.data.resetLink;
  
  if (!link) {
    throw new Error('No token link found in email');
  }

  const tokenMatch = link.match(/token=([^&]+)/);
  return tokenMatch ? tokenMatch[1] : null;
};

// Clean up database after each test
const cleanupDatabase = async (pool) => {
  const { clearDatabase } = require('./testDatabase');
  await clearDatabase(pool);
};

// Create test context with database transaction
const withTransaction = async (pool, callback) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('ROLLBACK');
    return result;
  } finally {
    client.release();
  }
};

// Assert API error response
const assertApiError = (response, expectedError) => {
  expect(response.body).toHaveProperty('error');
  expect(response.body).toHaveProperty('code');
  
  if (expectedError.message) {
    expect(response.body.error).toBe(expectedError.message);
  }
  
  if (expectedError.code) {
    expect(response.body.code).toBe(expectedError.code);
  }
};

// Assert successful API response
const assertApiSuccess = (response, expectedData = {}) => {
  expect(response.body).not.toHaveProperty('error');
  
  for (const [key, value] of Object.entries(expectedData)) {
    expect(response.body).toHaveProperty(key, value);
  }
};

// Create database query spy
const createQuerySpy = (pool) => {
  const originalQuery = pool.query.bind(pool);
  const querySpy = jest.fn(originalQuery);
  pool.query = querySpy;
  return querySpy;
};

// Mock environment variables
const withEnv = (envVars, callback) => {
  const originalEnv = { ...process.env };
  
  Object.assign(process.env, envVars);
  
  try {
    return callback();
  } finally {
    process.env = originalEnv;
  }
};

module.exports = {
  createAuthenticatedRequest,
  waitFor,
  mockEmailService,
  mockRedisClient,
  extractTokenFromEmail,
  cleanupDatabase,
  withTransaction,
  assertApiError,
  assertApiSuccess,
  createQuerySpy,
  withEnv
};