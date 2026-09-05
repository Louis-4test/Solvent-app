// server/routes/paymentRoutes.js
import express from 'express';
import {
  initiatePayment,
  getPaymentHistory,
  getPaymentDetails
} from '../controllers/paymentController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// All payment routes require authentication
router.use(auth);

// POST /payments - Initiate new payment
router.post('/', initiatePayment);

// GET /payments/history - Get current user's payment history
router.get('/history', getPaymentHistory);

// GET /payments/history/:userId - Get a specific user's payment history
router.get('/history/:userId', getPaymentHistory);

// GET /payments/:paymentId - Get payment details
router.get('/:paymentId', getPaymentDetails);

export default router;