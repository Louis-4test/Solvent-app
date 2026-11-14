import express from 'express';
import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  uploadKYCDocument,
  getKYCStatus,
  getKYCDocument
} from '../controllers/kycController.js';
import { auth } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KYC_UPLOAD_DIR = path.join(__dirname, '../uploads/kyc');

fs.mkdirSync(KYC_UPLOAD_DIR, { recursive: true });

const allowedTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf'
]);
const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.pdf']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, KYC_UPLOAD_DIR),
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const safeExtension = allowedExtensions.has(extension) ? extension : '';
    cb(
      null,
      `kyc-${req.user?.id || 'user'}-${Date.now()}-${crypto.randomUUID()}${safeExtension}`
    );
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (!allowedTypes.has(file.mimetype) || !allowedExtensions.has(extension)) {
      const error = new Error('Upload a JPG, PNG, WEBP, or PDF file');
      error.code = 'INVALID_KYC_FILE_TYPE';
      return cb(error);
    }

    return cb(null, true);
  }
});

const handleKYCFiles = (req, res, next) => {
  upload.fields([
    { name: 'idDocument', maxCount: 1 },
    { name: 'documentFront', maxCount: 1 },
    { name: 'documentBack', maxCount: 1 },
    { name: 'selfie', maxCount: 1 }
  ])(req, res, (error) => {
    if (!error) return next();

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'Each KYC file must be 5 MB or smaller',
        code: 'KYC_FILE_TOO_LARGE'
      });
    }

    return res.status(400).json({
      success: false,
      error: error.message || 'KYC upload failed',
      code: error.code || 'KYC_UPLOAD_FAILED'
    });
  });
};

const router = express.Router();

router.get('/status', auth, getKYCStatus);
router.post('/upload', auth, handleKYCFiles, uploadKYCDocument);
router.get('/submissions/:id/document/:side', auth, getKYCDocument);

export default router;
