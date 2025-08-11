const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = require('../../server');
const { 
  createUser,
  createVerificationToken, 
  generateTokens 
} = require('../utils/factories');
const { 
  assertApiError,
  assertApiSuccess
} = require('../utils/testHelpers');

describe('Auth API - Integration Tests', () => {
  let mockPool;

  beforeAll(() => {
    mockPool = global.testPool;
  });

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock responses
    mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 });
    global.mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      // Setup mocks for successful registration
      mockPool.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // No existing user
        .mockResolvedValueOnce({ rows: [{ id: 'new-user-id' }], rowCount: 1 }); // User created
      
      // Mock transaction
      const mockClient = global.mockClient;
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: 'new-user-id' }], rowCount: 1 }) // Insert user
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // Insert verification

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'Test@1234',
          firstName: 'John',
          lastName: 'Doe',
          company: 'Test Corp'
        });

      // Assert
      expect(response.status).toBe(201);
      assertApiSuccess(response, {
        message: 'Registration successful. Please check your email to verify your account.'
      });
      expect(response.body.userId).toBeDefined();
    });

    it('should reject duplicate email registration', async () => {
      // Setup mock for existing user
      mockPool.query.mockResolvedValueOnce({ 
        rows: [{ id: 'existing-user-id' }], 
        rowCount: 1 
      });

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'Test@1234',
          firstName: 'John',
          lastName: 'Doe'
        });

      // Assert
      expect(response.status).toBe(409);
      assertApiError(response, {
        error: 'User already exists',
        code: 'USER_EXISTS'
      });
    });

    it('should validate required fields', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com'
          // Missing password, firstName, lastName
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should validate email format', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Test@1234',
          firstName: 'John',
          lastName: 'Doe'
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          param: 'email',
          msg: expect.stringContaining('valid email')
        })
      );
    });

    it('should validate password strength', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'weak',
          firstName: 'John',
          lastName: 'Doe'
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          param: 'password',
          msg: expect.stringContaining('8 characters')
        })
      );
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      // Setup mock user data
      const mockUser = {
        id: 'user-id-123',
        email: 'user@example.com',
        password_hash: await bcrypt.hash('Test@1234', 10),
        first_name: 'John',
        last_name: 'Doe',
        role: 'client',
        status: 'active',
        mfa_enabled: false
      };

      // Mock database queries
      mockPool.query
        .mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 }) // Find user
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // Insert session
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // Update last login

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@example.com',
          password: 'Test@1234'
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.first_name,
        lastName: mockUser.last_name,
        role: mockUser.role
      });
    });

    it('should reject login with invalid password', async () => {
      // Setup mock user with different password
      const mockUser = {
        id: 'user-id-123',
        email: 'user@example.com',
        password_hash: await bcrypt.hash('Test@1234', 10),
        status: 'active'
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 });

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@example.com',
          password: 'WrongPassword'
        });

      // Assert
      expect(response.status).toBe(401);
      assertApiError(response, {
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    });

    it('should reject login for non-existent user', async () => {
      // Mock no user found
      mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Test@1234'
        });

      // Assert
      expect(response.status).toBe(401);
      assertApiError(response, {
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    });

    it('should reject login for unverified account', async () => {
      // Setup mock user with pending status
      const mockUser = {
        id: 'user-id-123',
        email: 'user@example.com',
        password_hash: await bcrypt.hash('Test@1234', 10),
        status: 'pending'
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 });

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@example.com',
          password: 'Test@1234'
        });

      // Assert
      expect(response.status).toBe(403);
      assertApiError(response, {
        error: 'Account is not active. Please verify your email.',
        code: 'ACCOUNT_INACTIVE'
      });
    });

    it('should require MFA when enabled', async () => {
      // Setup mock user with MFA enabled
      const mockUser = {
        id: 'user-id-123',
        email: 'user@example.com',
        password_hash: await bcrypt.hash('Test@1234', 10),
        status: 'active',
        mfa_enabled: true,
        mfa_secret: 'test-secret'
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 });

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@example.com',
          password: 'Test@1234'
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('requiresMfa', true);
      expect(response.body).toHaveProperty('mfaToken');
      expect(response.body).not.toHaveProperty('accessToken');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh access token successfully', async () => {
      // Setup mock session data
      const mockUser = {
        id: 'user-id-123',
        email: 'user@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'client',
        status: 'active'
      };
      
      const { refreshToken } = generateTokens(mockUser);
      
      // Mock successful session lookup
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          user_id: mockUser.id,
          email: mockUser.email,
          first_name: mockUser.first_name,
          last_name: mockUser.last_name,
          role: mockUser.role,
          status: mockUser.status
        }],
        rowCount: 1
      });

      // Act
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).not.toHaveProperty('refreshToken');
    });

    it('should reject expired refresh token', async () => {
      // Mock no session found (expired or invalid)
      mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      
      const { refreshToken } = generateTokens({ id: 'user-id-123' });

      // Act
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      // Assert
      expect(response.status).toBe(401);
      assertApiError(response, {
        error: 'Invalid or expired refresh token',
        code: 'INVALID_TOKEN'
      });
    });

    it('should reject refresh for inactive user', async () => {
      // Setup mock session with inactive user
      const mockSession = {
        user_id: 'user-id-123',
        email: 'user@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'client',
        status: 'suspended'
      };
      
      mockPool.query.mockResolvedValueOnce({ rows: [mockSession], rowCount: 1 });
      
      const { refreshToken } = generateTokens({ id: 'user-id-123' });

      // Act
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      // Assert
      expect(response.status).toBe(403);
      assertApiError(response, {
        error: 'Account is not active',
        code: 'ACCOUNT_INACTIVE'
      });
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      // Setup mock user
      const mockUser = {
        id: 'user-id-123',
        email: 'user@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'client'
      };
      
      const { accessToken, refreshToken } = generateTokens(mockUser);
      
      // Mock successful session deletion
      mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

      // Act
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken });

      // Assert
      expect(response.status).toBe(200);
      assertApiSuccess(response, {
        message: 'Logout successful'
      });
      
      // Verify correct query was called
      expect(mockPool.query).toHaveBeenCalledWith(
        'DELETE FROM sessions WHERE user_id = $1 AND token = $2',
        [mockUser.id, refreshToken]
      );
    });

    it('should logout all sessions when no token provided', async () => {
      // Setup mock user
      const mockUser = {
        id: 'user-id-123',
        email: 'user@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'client'
      };
      
      const { accessToken } = generateTokens(mockUser);
      
      // Mock successful session deletion
      mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 2 });

      // Act
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      // Assert
      expect(response.status).toBe(200);
      
      // Verify correct query was called
      expect(mockPool.query).toHaveBeenCalledWith(
        'DELETE FROM sessions WHERE user_id = $1',
        [mockUser.id]
      );
    });

    it('should require authentication', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/logout')
        .send({});

      // Assert
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/verify-email', () => {
    it('should verify email successfully', async () => {
      // Setup mock verification data
      const mockVerification = {
        user_id: 'user-id-123',
        email: 'user@example.com',
        first_name: 'John'
      };
      
      const verificationToken = createVerificationToken('user-id-123', 'email');
      
      // Mock database queries - find verification
      mockPool.query.mockResolvedValueOnce({ 
        rows: [mockVerification], 
        rowCount: 1 
      });
      
      // Mock transaction for updates
      const mockClient = global.mockClient;
      mockClient.query.mockResolvedValue({ rows: [], rowCount: 1 });

      // Act
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: verificationToken.token });

      // Assert
      expect(response.status).toBe(200);
      assertApiSuccess(response, {
        message: 'Email verified successfully',
        email: mockVerification.email
      });
    });

    it('should reject expired verification token', async () => {
      // Mock no verification found (expired or invalid)
      mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      
      const expiredToken = createVerificationToken('user-id-123', 'email', {
        expiresAt: new Date(Date.now() - 1000)
      });

      // Act
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: expiredToken.token });

      // Assert
      expect(response.status).toBe(400);
      assertApiError(response, {
        error: 'Invalid or expired verification token',
        code: 'INVALID_TOKEN'
      });
    });

    it('should reject invalid verification token', async () => {
      // Mock no verification found
      mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      
      // Act
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'invalid-token' });

      // Assert
      expect(response.status).toBe(400);
      assertApiError(response, {
        error: 'Invalid or expired verification token',
        code: 'INVALID_TOKEN'
      });
    });
  });

  describe('POST /api/auth/request-password-reset', () => {
    it('should send password reset email for existing user', async () => {
      // Setup mock user
      const mockUser = {
        id: 'user-id-123',
        first_name: 'John'
      };
      
      // Mock database queries
      mockPool.query
        .mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 }) // Find user
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // Insert reset token

      // Act
      const response = await request(app)
        .post('/api/auth/request-password-reset')
        .send({ email: 'user@example.com' });

      // Assert
      expect(response.status).toBe(200);
      assertApiSuccess(response, {
        message: 'If an account exists with this email, you will receive password reset instructions.'
      });
    });

    it('should return generic message for non-existent user', async () => {
      // Mock no user found
      mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      
      // Act
      const response = await request(app)
        .post('/api/auth/request-password-reset')
        .send({ email: 'nonexistent@example.com' });

      // Assert
      expect(response.status).toBe(200);
      assertApiSuccess(response, {
        message: 'If an account exists with this email, you will receive password reset instructions.'
      });
    });

    it('should replace existing reset token', async () => {
      // Setup mock user
      const mockUser = {
        id: 'user-id-123',
        email: 'user@example.com',
        first_name: 'John'
      };
      
      // Mock database queries
      mockPool.query
        .mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 }) // Find user
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // Insert new token

      // Act
      const response = await request(app)
        .post('/api/auth/request-password-reset')
        .send({ email: mockUser.email });

      // Assert
      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should reset password successfully', async () => {
      // Setup mock verification data
      const mockVerification = {
        user_id: 'user-id-123',
        email: 'user@example.com'
      };
      
      const resetToken = createVerificationToken('user-id-123', 'password_reset');
      
      // Mock database queries
      mockPool.query.mockResolvedValueOnce({ 
        rows: [mockVerification], 
        rowCount: 1 
      });
      
      // Mock transaction for password update
      const mockClient = global.mockClient;
      mockClient.query.mockResolvedValue({ rows: [], rowCount: 1 });

      // Act
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken.token,
          newPassword: 'NewPass@1234'
        });

      // Assert
      expect(response.status).toBe(200);
      assertApiSuccess(response, {
        message: 'Password reset successful. Please login with your new password.'
      });
    });

    it('should reject expired reset token', async () => {
      // Mock no verification found (expired)
      mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      
      const expiredToken = createVerificationToken('user-id-123', 'password_reset', {
        expiresAt: new Date(Date.now() - 1000)
      });

      // Act
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: expiredToken.token,
          newPassword: 'NewPass@1234'
        });

      // Assert
      expect(response.status).toBe(400);
      assertApiError(response, {
        error: 'Invalid or expired reset token',
        code: 'INVALID_TOKEN'
      });
    });

    it('should validate new password strength', async () => {
      // Act with weak password
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'any-token',
          newPassword: 'weak'
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          param: 'newPassword',
          msg: expect.stringContaining('8 characters')
        })
      );
    });
  });
});