import { Router } from 'express';
import authRoutes from './authRoutes.js';
import kycRoutes from './kycRoutes.js';
import transactionRoutes from './transactionRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import notificationRoutes from './notificationRoutes.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    message: 'Solvent API is running',
    endpoints: {
      auth: '/api/auth',
      kyc: '/api/kyc',
      transactions: '/api/transactions',
      payments: '/api/payments',
      notifications: '/api/notifications'
    },
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

router.use('/auth', authRoutes);
router.use('/kyc', kycRoutes);
router.use('/transactions', transactionRoutes);
router.use('/payments', paymentRoutes);
router.use('/notifications', notificationRoutes);

export default router;