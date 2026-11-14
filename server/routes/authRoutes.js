import { Router } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  register,
  sendMFACode,
  verifyMFA,
  login,
  verifyLoginMFA,
  getMe,
  updateProfile,
  deleteProfile,
  updateAvatar,
  deleteAvatar,
  forgotPassword,
  resetPassword,
  changePassword
} from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROFILE_UPLOAD_DIR = path.join(__dirname, '../uploads/profiles');

fs.mkdirSync(PROFILE_UPLOAD_DIR, { recursive: true });

const allowedImageTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
]);
const allowedImageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

const profileStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, PROFILE_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const uniqueName = `avatar-${req.user?.id || 'user'}-${Date.now()}-${crypto.randomUUID()}${extension}`;
    cb(null, uniqueName);
  }
});

const profileUpload = multer({
  storage: profileStorage,
  limits: {
    fileSize: 3 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (!allowedImageTypes.has(file.mimetype) || !allowedImageExtensions.has(extension)) {
      const error = new Error('Please upload a JPG, PNG, WEBP, or GIF image.');
      error.code = 'INVALID_AVATAR_TYPE';
      return cb(error);
    }

    return cb(null, true);
  }
});

const handleAvatarUpload = (req, res, next) => {
  profileUpload.single('avatar')(req, res, (error) => {
    if (!error) return next();

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'Profile picture must be 3 MB or smaller',
        code: 'AVATAR_TOO_LARGE'
      });
    }

    return res.status(400).json({
      success: false,
      error: error.message || 'Profile picture upload failed',
      code: error.code || 'AVATAR_UPLOAD_FAILED'
    });
  });
};

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

// Current user profile (protected)
router.get('/me', auth, getMe);
router.put('/me', auth, updateProfile);
router.delete('/me', auth, deleteProfile);
router.put('/me/avatar', auth, handleAvatarUpload, updateAvatar);
router.delete('/me/avatar', auth, deleteAvatar);

export default router;