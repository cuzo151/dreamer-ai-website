const jwt = require('jsonwebtoken');

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      firstName: user.firstName || user.first_name,
      lastName: user.lastName || user.last_name,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '15m',
      issuer: 'dreamer-ai',
      audience: 'dreamer-ai-api'
    }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      type: 'refresh'
    },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    {
      expiresIn: '30d',
      issuer: 'dreamer-ai',
      audience: 'dreamer-ai-api'
    }
  );
};

const verifyToken = (token, secret) => {
  return jwt.verify(token, secret, {
    issuer: 'dreamer-ai',
    audience: 'dreamer-ai-api'
  });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken
};