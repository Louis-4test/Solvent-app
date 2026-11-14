import { Router } from 'express';
import {
  getAdminDashboard,
  getAdminUsers,
  updateAdminUser,
  getAdminTransactions,
  updateAdminTransactionStatus,
  getAdminPayments,
  getAdminKYC
} from '../controllers/adminController.js';
import { reviewKYCSubmission } from '../controllers/kycController.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = Router();

router.use(auth, adminAuth);

router.get('/dashboard', getAdminDashboard);
router.get('/users', getAdminUsers);
router.patch('/users/:id', updateAdminUser);
router.get('/transactions', getAdminTransactions);
router.patch('/transactions/:id/status', updateAdminTransactionStatus);
router.get('/payments', getAdminPayments);
router.get('/kyc', getAdminKYC);
router.patch('/kyc/:id', reviewKYCSubmission);

export default router;
