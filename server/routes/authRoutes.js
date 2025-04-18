import express from 'express';
import { register } from '../controllers/authController.js';

const router = express.Router();

// Define your routes
router.post('/register', register);

// You can define the login route later
// router.post('/login', login);

export default router;
