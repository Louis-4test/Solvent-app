import express from 'express';
import {
  createTransaction,
  transferFunds,
  getTransactions,
  getMyTransactions,
  getTransactionById
} from '../controllers/transactionController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// All transaction routes require authentication
router.use(auth);

// Create a new transaction
router.post('/', createTransaction);

// Transfer funds to a recipient by phone number
router.post('/transfer', transferFunds);

// Get all transactions for the current user
router.get('/me', getMyTransactions);

// Get all transactions for a given user
router.get('/user/:userId', getTransactions);

// Get specific transaction by ID
router.get('/:id', getTransactionById);

export default router;