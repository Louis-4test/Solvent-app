import express from 'express';
import { listReceipts, getReceipt } from '../controllers/receiptController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.use(auth);
router.get('/', listReceipts);
router.get('/:reference', getReceipt);

export default router;
