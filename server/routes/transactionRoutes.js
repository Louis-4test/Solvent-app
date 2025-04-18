import express from 'express';
import {
  createTransaction,
  getTransactions,
  getTransactionById
} from '../controllers/transactionController.js';

const router = express.Router();

// Create a new transaction
router.post('/', createTransaction);

// Get all transactions for a user
router.get('/user/:userId', getTransactions);

// Get specific transaction by ID
router.get('/:id', getTransactionById);

export default router;