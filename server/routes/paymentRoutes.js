import express from 'express';
import {
  initiatePayment,
  payWithQR,
  getPaymentHistory,
  getPaymentDetails,
  searchUserPayments
} from '../controllers/paymentController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// All payment routes require authentication
router.use(auth);

// POST /payments - Initiate a bill/merchant payment
router.post('/', initiatePayment);

// POST /payments/qr - Pay a merchant from a scanned QR payload
router.post('/qr', payWithQR);

// GET /payments/search - Search the current user's payments
router.get('/search', searchUserPayments);

// GET /payments/history - Get current user's payment history
router.get('/history', getPaymentHistory);

// GET /payments/history/:userId - Get a specific user's payment history (admin/self)
router.get('/history/:userId', getPaymentHistory);

// GET /payments/:paymentId - Get payment details
router.get('/:paymentId', getPaymentDetails);

export default router;
