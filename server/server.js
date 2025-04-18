import express from 'express';
import routes from './routes/index.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.use('/api', routes);  // All API routes

// Root route handler
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Solvent API',
    endpoints: {
      docs: 'Coming soon',
      api: '/api',
      status: 'running',
      timestamp: new Date().toISOString()
    }
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method,
    availableEndpoints: ['/api/auth', '/api/users'] // Add your actual endpoints
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});