import { Router } from 'express';
import {
  register,
  sendMFACode,
  verifyMFA,
  login,
  verifyLoginMFA
} from '../controllers/authController.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

// Registration route (now properly mounted at /api/auth/register)
router.post('/register', register);

// MFA routes
router.post('/send-mfa', sendMFACode);
router.post('/verify-mfa', verifyMFA);

// Authentication routes
router.post('/login', login);
router.post('/verify-login-mfa', verifyLoginMFA);

export default router;