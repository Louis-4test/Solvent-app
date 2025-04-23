import jwt from 'jsonwebtoken';

// Generate normal JWT token
export const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

// Generate temporary token for MFA flow (shorter lifespan)
export const generateTempToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '5m' } // Short expiration for security
  );
};

// Default export (alternative style)
export default {
  generateToken,
  generateTempToken
  // ... other exports if needed
};