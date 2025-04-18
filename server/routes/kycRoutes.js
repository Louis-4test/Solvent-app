// server/routes/kycRoutes.js
import express from 'express';
import {
  initiateKYC,
  verifyKYC,
  getKYCStatus
} from '../controllers/kycController.js';

const router = express.Router();

// POST /kyc/initiate - Start KYC process
router.post('/initiate', initiateKYC);

// POST /kyc/verify - Submit KYC documents
router.post('/verify', verifyKYC);

// GET /kyc/status/:userId - Check KYC status
router.get('/status/:userId', getKYCStatus);

export default router;