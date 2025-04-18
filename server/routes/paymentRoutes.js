// server/routes/paymentRoutes.js
import express from 'express';
import {
  initiatePayment,
  getPaymentHistory,
  getPaymentDetails
} from '../controllers/paymentController.js';

const router = express.Router();

// POST /payments - Initiate new payment
router.post('/', initiatePayment);

// GET /payments/history/:userId - Get user's payment history
router.get('/history/:userId', getPaymentHistory);

// GET /payments/:paymentId - Get payment details
router.get('/:paymentId', getPaymentDetails);

export default router;