import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

// middleware/auth.js
export const auth = async (req, res, next) => {
  try {
    console.log('Authorization header:', req.header('Authorization')); // Debug
    
    const authHeader = req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('Missing or malformed auth header');
      return res.status(401).json({ error: 'Invalid authorization format' });
    }

    const token = authHeader.split(' ')[1].trim();
    console.log('Extracted token:', token); // Debug

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded); // Debug

    const user = await User.findByPk(decoded.userId);
    if (!user) {
      console.error('User not found for ID:', decoded.userId);
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Full auth error:', error);
    res.status(401).json({ 
      error: 'Authentication failed',
      details: error.message 
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