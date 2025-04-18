import { Router } from 'express';
const router = Router();

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