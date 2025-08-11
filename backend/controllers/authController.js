const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const { query, transaction } = require('../config/database');
const { logger } = require('../middleware/logging');
const { sendEmail } = require('../utils/emailService');
const { generateAccessToken, generateRefreshToken } = require('../utils/tokenUtils');

// Register new user
const register = async (req, res) => {
  const { email, password, firstName, lastName, company } = req.body;

  try {
    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: 'User already exists',
        code: 'USER_EXISTS'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with transaction
    const userId = await transaction(async (client) => {
      // Insert user
      const userResult = await client.query(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, company, role, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [uuidv4(), email, hashedPassword, firstName, lastName, company, 'client', 'pending']
      );

      const newUserId = userResult.rows[0].id;

      // Create verification token
      const verificationToken = uuidv4();
      await client.query(
        `INSERT INTO user_verifications (user_id, token, type, expires_at)
         VALUES ($1, $2, 'email', NOW() + INTERVAL '24 hours')`,
        [newUserId, verificationToken]
      );

      // Send verification email
      await sendEmail({
        to: email,
        subject: 'Verify your Dreamer AI account',
        template: 'verify-email',
        data: {
          name: firstName,
          verificationLink: `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`
        }
      });

      return newUserId;
    });

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      userId
    });

  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      code: 'REGISTRATION_ERROR'
    });
  }
};

// Login user
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Get user by email
    const userResult = await query(
      `SELECT id, email, password_hash, first_name, last_name, role, status, 
              mfa_enabled, mfa_secret
       FROM users 
       WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const user = userResult.rows[0];

    // Check if account is active
    if (user.status !== 'active') {
      return res.status(403).json({
        error: 'Account is not active. Please verify your email.',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check if MFA is required
    if (user.mfa_enabled) {
      // Generate temporary MFA token
      const mfaToken = jwt.sign(
        { userId: user.id, type: 'mfa' },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
      );

      return res.json({
        requiresMfa: true,
        mfaToken
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store session
    await query(
      `INSERT INTO sessions (id, user_id, token, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, NOW() + INTERVAL '30 days', $4, $5)`,
      [uuidv4(), user.id, refreshToken, req.ip, req.get('user-agent')]
    );

    // Update last login
    await query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      },
      accessToken,
      refreshToken
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      code: 'LOGIN_ERROR'
    });
  }
};

// Refresh token
const refreshTokenHandler = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({
      error: 'Refresh token required',
      code: 'TOKEN_REQUIRED'
    });
  }

  try {
    // Verify refresh token
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Check if session exists and is valid
    const sessionResult = await query(
      `SELECT s.*, u.email, u.first_name, u.last_name, u.role, u.status
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.token = $1 AND s.expires_at > NOW()`,
      [refreshToken]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid or expired refresh token',
        code: 'INVALID_TOKEN'
      });
    }

    const session = sessionResult.rows[0];

    // Check if user is still active
    if (session.status !== 'active') {
      return res.status(403).json({
        error: 'Account is not active',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken({
      id: session.user_id,
      email: session.email,
      firstName: session.first_name,
      lastName: session.last_name,
      role: session.role
    });

    res.json({
      accessToken: newAccessToken
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    
    logger.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Token refresh failed',
      code: 'REFRESH_ERROR'
    });
  }
};

// Logout
const logout = async (req, res) => {
  const { refreshToken } = req.body;
  const userId = req.user.id;

  try {
    // Remove specific session or all sessions for user
    const deleteQuery = refreshToken
      ? 'DELETE FROM sessions WHERE user_id = $1 AND token = $2'
      : 'DELETE FROM sessions WHERE user_id = $1';
    const deleteParams = refreshToken ? [userId, refreshToken] : [userId];
    
    await query(deleteQuery, deleteParams);

    res.json({
      message: 'Logout successful'
    });

  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      code: 'LOGOUT_ERROR'
    });
  }
};

// Verify email
const verifyEmail = async (req, res) => {
  const { token } = req.body;

  try {
    // Check verification token
    const verificationResult = await query(
      `SELECT v.*, u.email, u.first_name
       FROM user_verifications v
       JOIN users u ON v.user_id = u.id
       WHERE v.token = $1 AND v.type = 'email' AND v.expires_at > NOW()`,
      [token]
    );

    if (verificationResult.rows.length === 0) {
      return res.status(400).json({
        error: 'Invalid or expired verification token',
        code: 'INVALID_TOKEN'
      });
    }

    const verification = verificationResult.rows[0];

    // Update user status and remove verification token
    await transaction(async (client) => {
      await client.query(
        'UPDATE users SET status = $1, email_verified_at = NOW() WHERE id = $2',
        ['active', verification.user_id]
      );

      await client.query(
        'DELETE FROM user_verifications WHERE token = $1',
        [token]
      );
    });

    res.json({
      message: 'Email verified successfully',
      email: verification.email
    });

  } catch (error) {
    logger.error('Email verification error:', error);
    res.status(500).json({
      error: 'Email verification failed',
      code: 'VERIFICATION_ERROR'
    });
  }
};

// Request password reset
const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    // Check if user exists
    const userResult = await query(
      'SELECT id, first_name FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      // Don't reveal if user exists
      return res.json({
        message: 'If an account exists with this email, you will receive password reset instructions.'
      });
    }

    const user = userResult.rows[0];

    // Create reset token
    const resetToken = uuidv4();
    await query(
      `INSERT INTO user_verifications (user_id, token, type, expires_at)
       VALUES ($1, $2, 'password_reset', NOW() + INTERVAL '1 hour')
       ON CONFLICT (user_id, type) 
       DO UPDATE SET token = $2, expires_at = NOW() + INTERVAL '1 hour'`,
      [user.id, resetToken]
    );

    // Send reset email
    await sendEmail({
      to: email,
      subject: 'Reset your Dreamer AI password',
      template: 'reset-password',
      data: {
        name: user.first_name,
        resetLink: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
      }
    });

    res.json({
      message: 'If an account exists with this email, you will receive password reset instructions.'
    });

  } catch (error) {
    logger.error('Password reset request error:', error);
    res.status(500).json({
      error: 'Password reset request failed',
      code: 'RESET_REQUEST_ERROR'
    });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // Check reset token
    const verificationResult = await query(
      `SELECT v.*, u.email
       FROM user_verifications v
       JOIN users u ON v.user_id = u.id
       WHERE v.token = $1 AND v.type = 'password_reset' AND v.expires_at > NOW()`,
      [token]
    );

    if (verificationResult.rows.length === 0) {
      return res.status(400).json({
        error: 'Invalid or expired reset token',
        code: 'INVALID_TOKEN'
      });
    }

    const verification = verificationResult.rows[0];

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password and remove reset token
    await transaction(async (client) => {
      await client.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [hashedPassword, verification.user_id]
      );

      await client.query(
        'DELETE FROM user_verifications WHERE token = $1',
        [token]
      );

      // Invalidate all existing sessions
      await client.query(
        'DELETE FROM sessions WHERE user_id = $1',
        [verification.user_id]
      );
    });

    res.json({
      message: 'Password reset successful. Please login with your new password.'
    });

  } catch (error) {
    logger.error('Password reset error:', error);
    res.status(500).json({
      error: 'Password reset failed',
      code: 'RESET_ERROR'
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken: refreshTokenHandler,
  logout,
  verifyEmail,
  requestPasswordReset,
  resetPassword
};