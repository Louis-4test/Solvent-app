import { Router } from 'express';
import authRoutes from './authRoutes.js';
import kycRoutes from './kycRoutes.js';
import transactionRoutes from './transactionRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import adminRoutes from './adminRoutes.js';
import merchantRoutes from './merchantRoutes.js';
import receiptRoutes from './receiptRoutes.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    message: 'Solvent API is running',
    endpoints: {
      auth: '/api/auth',
      kyc: '/api/kyc',
      transactions: '/api/transactions',
      payments: '/api/payments',
      merchants: '/api/merchants',
      receipts: '/api/receipts',
      notifications: '/api/notifications',
      admin: '/api/admin'
    },
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

router.use('/auth', authRoutes);
router.use('/kyc', kycRoutes);
router.use('/transactions', transactionRoutes);
router.use('/payments', paymentRoutes);
router.use('/merchants', merchantRoutes);
router.use('/receipts', receiptRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);

export default router;
