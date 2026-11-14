import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

// middleware/auth.js
export const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Invalid authorization format' });
    }

    const token = authHeader.split(' ')[1].trim();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        error: 'This account has been suspended. Please contact support.',
        code: 'ACCOUNT_SUSPENDED'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    const suspended = error?.name === 'JsonWebTokenError' || error?.name === 'TokenExpiredError';
    res.status(401).json({
      error: 'Authentication failed',
      details: suspended ? 'Invalid or expired token' : undefined
    });
  }
};

/**
 * Admin-only access middleware
 */
export const adminAuth = (req, res, next) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ 
      error: 'Admin access required' 
    });
  }
  next();
};

// Optional: Export all middlewares together
export default {
  auth,
  adminAuth
};