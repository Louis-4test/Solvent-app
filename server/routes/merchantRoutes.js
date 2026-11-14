import express from 'express';
import { listMerchants, getMerchantByCode } from '../controllers/merchantController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.use(auth);
router.get('/', listMerchants);
router.get('/:code', getMerchantByCode);

export default router;
