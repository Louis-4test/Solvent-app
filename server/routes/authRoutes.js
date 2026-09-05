import { Router } from 'express';
import {
  register,
  sendMFACode,
  verifyMFA,
  login,
  verifyLoginMFA,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword
} from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

// Registration route (now properly mounted at /api/auth/register)
router.post('/register', register);

// MFA routes
router.post('/send-mfa', sendMFACode);
router.post('/verify-mfa', verifyMFA);

// Authentication routes
router.post('/login', login);
router.post('/verify-login-mfa', verifyLoginMFA);

// Password management
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/change-password', auth, changePassword);

// Current user (protected)
router.get('/me', auth, getMe);

export default router;