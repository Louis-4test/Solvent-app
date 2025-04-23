import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

// middleware/auth.js
export const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('Invalid authorization format');
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) throw new Error('Authentication required');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);
    
    if (!user) throw new Error('User not found');

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
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