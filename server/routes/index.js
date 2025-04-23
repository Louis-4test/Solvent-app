import { Router } from 'express';
import authRoutes from './authRoutes.js';

const router = Router();

router.use('/auth', authRoutes); 

// Main API route
router.get('/', (req, res) => {
  res.json({ 
    message: 'Solvent API is running',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      // Add other endpoints
    },
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

export default router;