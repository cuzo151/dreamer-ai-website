const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const { query, transaction } = require('../../config/database');
const authController = require('../../controllers/authController');
const { generateAccessToken, generateRefreshToken } = require('../../utils/tokenUtils');
const { createMockRequest, createMockResponse, createUser } = require('../utils/factories');
// Mock dependencies
jest.mock('../../config/database');
jest.mock('../../utils/tokenUtils');
jest.mock('uuid');

describe('Auth Controller - Unit Tests', () => {
  let sendEmailMock;

  beforeEach(() => {
    jest.clearAllMocks();
    // Use the global email mock
    sendEmailMock = global.mockSendEmail;
    uuidv4.mockReturnValue('test-uuid');
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          email: 'newuser@example.com',
          password: 'Test@1234',
          firstName: 'John',
          lastName: 'Doe',
          company: 'Test Corp'
        }
      });
      const res = createMockResponse();

      query.mockResolvedValueOnce({ rows: [] }); // No existing user
      bcrypt.hash = jest.fn().mockResolvedValue('hashed-password');
      transaction.mockImplementation(async (callback) => {
        const mockClient = {
          query: jest.fn()
            .mockResolvedValueOnce({ rows: [{ id: 'user-id' }] }) // Insert user
            .mockResolvedValueOnce({ rows: [] }) // Insert verification
        };
        return callback(mockClient);
      });

      // Act
      await authController.register(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Registration successful. Please check your email to verify your account.',
        userId: 'user-id'
      });
      expect(sendEmailMock).toHaveBeenCalledWith({
        to: 'newuser@example.com',
        subject: 'Verify your Dreamer AI account',
        template: 'verify-email',
        data: {
          name: 'John',
          verificationLink: expect.stringContaining('verify-email?token=test-uuid')
        }
      });
    });

    it('should return error if user already exists', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          email: 'existing@example.com',
          password: 'Test@1234',
          firstName: 'John',
          lastName: 'Doe'
        }
      });
      const res = createMockResponse();

      query.mockResolvedValueOnce({ rows: [{ id: 'existing-user-id' }] });

      // Act
      await authController.register(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: 'User already exists',
        code: 'USER_EXISTS'
      });
      expect(sendEmailMock).not.toHaveBeenCalled();
    });

    it('should handle registration errors', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          email: 'test@example.com',
          password: 'Test@1234',
          firstName: 'John',
          lastName: 'Doe'
        }
      });
      const res = createMockResponse();

      query.mockRejectedValueOnce(new Error('Database error'));

      // Act
      await authController.register(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Registration failed',
        code: 'REGISTRATION_ERROR'
      });
    });
  });

  describe('login', () => {
    it('should successfully login user without MFA', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          email: 'user@example.com',
          password: 'Test@1234'
        },
        ip: '192.168.1.1'
      });
      const res = createMockResponse();

      const mockUser = {
        id: 'user-id',
        email: 'user@example.com',
        password_hash: 'hashed-password',
        first_name: 'John',
        last_name: 'Doe',
        role: 'client',
        status: 'active',
        mfa_enabled: false
      };

      query
        .mockResolvedValueOnce({ rows: [mockUser] }) // Get user
        .mockResolvedValueOnce({ rows: [] }) // Insert session
        .mockResolvedValueOnce({ rows: [] }); // Update last login

      bcrypt.compare = jest.fn().mockResolvedValue(true);
      generateAccessToken.mockReturnValue('access-token');
      generateRefreshToken.mockReturnValue('refresh-token');

      // Act
      await authController.login(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'client'
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      });
    });

    it('should require MFA when enabled', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          email: 'user@example.com',
          password: 'Test@1234'
        }
      });
      const res = createMockResponse();

      const mockUser = {
        id: 'user-id',
        email: 'user@example.com',
        password_hash: 'hashed-password',
        status: 'active',
        mfa_enabled: true,
        mfa_secret: 'secret'
      };

      query.mockResolvedValueOnce({ rows: [mockUser] });
      bcrypt.compare = jest.fn().mockResolvedValue(true);
      jwt.sign = jest.fn().mockReturnValue('mfa-token');

      // Act
      await authController.login(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        requiresMfa: true,
        mfaToken: 'mfa-token'
      });
    });

    it('should reject invalid credentials', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          email: 'user@example.com',
          password: 'wrong-password'
        }
      });
      const res = createMockResponse();

      const mockUser = {
        id: 'user-id',
        password_hash: 'hashed-password',
        status: 'active'
      };

      query.mockResolvedValueOnce({ rows: [mockUser] });
      bcrypt.compare = jest.fn().mockResolvedValue(false);

      // Act
      await authController.login(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    });

    it('should reject inactive accounts', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          email: 'user@example.com',
          password: 'Test@1234'
        }
      });
      const res = createMockResponse();

      const mockUser = {
        id: 'user-id',
        password_hash: 'hashed-password',
        status: 'pending'
      };

      query.mockResolvedValueOnce({ rows: [mockUser] });

      // Act
      await authController.login(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Account is not active. Please verify your email.',
        code: 'ACCOUNT_INACTIVE'
      });
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh access token', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          refreshToken: 'valid-refresh-token'
        }
      });
      const res = createMockResponse();

      const mockSession = {
        user_id: 'user-id',
        email: 'user@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'client',
        status: 'active'
      };

      jwt.verify = jest.fn().mockReturnValue({ userId: 'user-id' });
      query.mockResolvedValueOnce({ rows: [mockSession] });
      generateAccessToken.mockReturnValue('new-access-token');

      // Act
      await authController.refreshToken(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        accessToken: 'new-access-token'
      });
    });

    it('should reject missing refresh token', async () => {
      // Arrange
      const req = createMockRequest({ body: {} });
      const res = createMockResponse();

      // Act
      await authController.refreshToken(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Refresh token required',
        code: 'TOKEN_REQUIRED'
      });
    });

    it('should reject invalid refresh token', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          refreshToken: 'invalid-token'
        }
      });
      const res = createMockResponse();

      jwt.verify = jest.fn().mockImplementation(() => {
        throw new jwt.JsonWebTokenError('Invalid token');
      });

      // Act
      await authController.refreshToken(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    });
  });

  describe('logout', () => {
    it('should logout specific session', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          refreshToken: 'refresh-token'
        },
        user: { id: 'user-id' }
      });
      const res = createMockResponse();

      query.mockResolvedValueOnce({ rows: [] });

      // Act
      await authController.logout(req, res);

      // Assert
      expect(query).toHaveBeenCalledWith(
        'DELETE FROM sessions WHERE user_id = $1 AND token = $2',
        ['user-id', 'refresh-token']
      );
      expect(res.json).toHaveBeenCalledWith({
        message: 'Logout successful'
      });
    });

    it('should logout all sessions when no token provided', async () => {
      // Arrange
      const req = createMockRequest({
        body: {},
        user: { id: 'user-id' }
      });
      const res = createMockResponse();

      query.mockResolvedValueOnce({ rows: [] });

      // Act
      await authController.logout(req, res);

      // Assert
      expect(query).toHaveBeenCalledWith(
        'DELETE FROM sessions WHERE user_id = $1',
        ['user-id']
      );
    });
  });

  describe('verifyEmail', () => {
    it('should successfully verify email', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          token: 'verification-token'
        }
      });
      const res = createMockResponse();

      const mockVerification = {
        user_id: 'user-id',
        email: 'user@example.com',
        first_name: 'John'
      };

      query.mockResolvedValueOnce({ rows: [mockVerification] });
      transaction.mockImplementation(async (callback) => {
        const mockClient = {
          query: jest.fn().mockResolvedValue({ rows: [] })
        };
        return callback(mockClient);
      });

      // Act
      await authController.verifyEmail(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        message: 'Email verified successfully',
        email: 'user@example.com'
      });
    });

    it('should reject invalid verification token', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          token: 'invalid-token'
        }
      });
      const res = createMockResponse();

      query.mockResolvedValueOnce({ rows: [] });

      // Act
      await authController.verifyEmail(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid or expired verification token',
        code: 'INVALID_TOKEN'
      });
    });
  });

  describe('requestPasswordReset', () => {
    it('should send password reset email for existing user', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          email: 'user@example.com'
        }
      });
      const res = createMockResponse();

      const mockUser = {
        id: 'user-id',
        first_name: 'John'
      };

      query
        .mockResolvedValueOnce({ rows: [mockUser] }) // Find user
        .mockResolvedValueOnce({ rows: [] }); // Insert token

      // Act
      await authController.requestPasswordReset(req, res);

      // Assert
      expect(sendEmailMock).toHaveBeenCalledWith({
        to: 'user@example.com',
        subject: 'Reset your Dreamer AI password',
        template: 'reset-password',
        data: {
          name: 'John',
          resetLink: expect.stringContaining('reset-password?token=test-uuid')
        }
      });
      expect(res.json).toHaveBeenCalledWith({
        message: 'If an account exists with this email, you will receive password reset instructions.'
      });
    });

    it('should return generic message for non-existent user', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          email: 'nonexistent@example.com'
        }
      });
      const res = createMockResponse();

      query.mockResolvedValueOnce({ rows: [] });

      // Act
      await authController.requestPasswordReset(req, res);

      // Assert
      expect(sendEmailMock).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: 'If an account exists with this email, you will receive password reset instructions.'
      });
    });
  });

  describe('resetPassword', () => {
    it('should successfully reset password', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          token: 'reset-token',
          newPassword: 'NewPass@1234'
        }
      });
      const res = createMockResponse();

      const mockVerification = {
        user_id: 'user-id',
        email: 'user@example.com'
      };

      query.mockResolvedValueOnce({ rows: [mockVerification] });
      bcrypt.hash = jest.fn().mockResolvedValue('new-hashed-password');
      transaction.mockImplementation(async (callback) => {
        const mockClient = {
          query: jest.fn().mockResolvedValue({ rows: [] })
        };
        return callback(mockClient);
      });

      // Act
      await authController.resetPassword(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        message: 'Password reset successful. Please login with your new password.'
      });
    });

    it('should reject invalid reset token', async () => {
      // Arrange
      const req = createMockRequest({
        body: {
          token: 'invalid-token',
          newPassword: 'NewPass@1234'
        }
      });
      const res = createMockResponse();

      query.mockResolvedValueOnce({ rows: [] });

      // Act
      await authController.resetPassword(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid or expired reset token',
        code: 'INVALID_TOKEN'
      });
    });
  });
});