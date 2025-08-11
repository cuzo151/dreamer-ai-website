const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// User factory
const createUser = async (overrides = {}) => {
  const defaultUser = {
    id: uuidv4(),
    email: `test-${Date.now()}@example.com`,
    password: 'Test@1234',
    firstName: 'Test',
    lastName: 'User',
    company: 'Test Company',
    role: 'client',
    status: 'active',
    mfaEnabled: false,
    emailVerifiedAt: new Date(),
    ...overrides
  };

  // Hash password if provided
  if (defaultUser.password) {
    defaultUser.passwordHash = await bcrypt.hash(defaultUser.password, 10);
    delete defaultUser.password;
  }

  return defaultUser;
};

// Mock insert user - returns user data without actual database insertion
const insertUser = async (pool, userData = {}) => {
  const user = await createUser(userData);
  
  // Return user data in the format expected by database queries
  return {
    id: user.id,
    email: user.email,
    password_hash: user.passwordHash,
    first_name: user.firstName,
    last_name: user.lastName,
    company: user.company,
    role: user.role,
    status: user.status,
    mfa_enabled: user.mfaEnabled,
    mfa_secret: user.mfaSecret || null,
    email_verified_at: user.emailVerifiedAt
  };
};

// Session factory
const createSession = (userId, overrides = {}) => {
  return {
    id: uuidv4(),
    userId,
    token: jwt.sign(
      { userId, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    ),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
    ...overrides
  };
};

// Mock insert session - returns session data without actual database insertion
const insertSession = async (pool, sessionData) => {
  // Return session data in the format expected by database queries
  return {
    id: sessionData.id,
    user_id: sessionData.userId,
    token: sessionData.token,
    expires_at: sessionData.expiresAt,
    ip_address: sessionData.ipAddress,
    user_agent: sessionData.userAgent
  };
};

// Verification token factory
const createVerificationToken = (userId, type = 'email', overrides = {}) => {
  return {
    userId,
    token: uuidv4(),
    type,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    ...overrides
  };
};

// Mock insert verification token - returns token data without actual database insertion
const insertVerificationToken = async (pool, tokenData) => {
  // Return token data in the format expected by database queries
  return {
    user_id: tokenData.userId,
    token: tokenData.token,
    type: tokenData.type,
    expires_at: tokenData.expiresAt
  };
};

// Generate JWT tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '30d' }
  );

  return { accessToken, refreshToken };
};

// Create test request object
const createMockRequest = (overrides = {}) => {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: null,
    ip: '127.0.0.1',
    get: jest.fn((header) => {
      if (header === 'user-agent') return 'test-agent';
      return null;
    }),
    ...overrides
  };
};

// Create test response object
const createMockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
  };
  return res;
};

module.exports = {
  createUser,
  insertUser,
  createSession,
  insertSession,
  createVerificationToken,
  insertVerificationToken,
  generateTokens,
  createMockRequest,
  createMockResponse
};