// routes/kycRoutes.js
import express from 'express';
import multer from 'multer';
import { fileURLToPath } from 'url';
import path from 'path';
import { uploadKYCDocument } from '../controllers/kycController.js';
import { auth } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/kyc/'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

router.post(
  '/upload',
  auth,
  upload.single('idDocument'),
  validateUploadedFile,
  uploadKYCDocument
);

// Middleware to validate file upload
function validateUploadedFile(req, res, next) {
  if (!req.file) {
    return res.status(400).json({ 
      success: false,
      error: 'No file uploaded',
      code: 'MISSING_FILE'
    });
  }
  next();
}

export default router;