import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import routes from './routes/index.js';
import { securityHeaders } from './middleware/securityHeaders.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(securityHeaders);

// Global API rate limit
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' }
}));

// Strict rate limit for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many login attempts, please try again later.' }
});
app.use(['/api/auth/login', '/api/auth/register', '/api/auth/verify-login-mfa', '/api/auth/forgot-password'], authLimiter);

// Middleware
const defaultOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
const allowedOrigins = (process.env.FRONTEND_URL || defaultOrigins.join(','))
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Origin not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directories exist
const uploadsDir = path.join(__dirname, 'uploads');
const kycUploadDir = path.join(uploadsDir, 'kyc');
const profileUploadDir = path.join(uploadsDir, 'profiles');

for (const dir of [kycUploadDir, profileUploadDir]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Profile pictures are served publicly; KYC documents are not.
app.use('/uploads/profiles', express.static(profileUploadDir, {
  setHeaders: (res) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// API Documentation route
app.get('/api-docs', (req, res) => {
  res.json({
    message: 'API Documentation',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me',
        updateProfile: 'PUT /api/auth/me',
        deleteProfile: 'DELETE /api/auth/me',
        updateAvatar: 'PUT /api/auth/me/avatar',
        deleteAvatar: 'DELETE /api/auth/me/avatar',
        changePassword: 'POST /api/auth/change-password',
        mfa: {
          send: 'POST /api/auth/send-mfa',
          verify: 'POST /api/auth/verify-mfa'
        },
        password: {
          forgot: 'POST /api/auth/forgot-password',
          reset: 'POST /api/auth/reset-password'
        }
      },
      kyc: {
        upload: 'POST /api/kyc/upload',
        status: 'GET /api/kyc/status',
        document: 'GET /api/kyc/submissions/:id/document/:side'
      },
      transactions: {
        transfer: 'POST /api/transactions/transfer',
        mine: 'GET /api/transactions/me'
      },
      payments: {
        initiate: 'POST /api/payments',
        qr: 'POST /api/payments/qr',
        history: 'GET /api/payments/history',
        search: 'GET /api/payments/search'
      },
      merchants: {
        list: 'GET /api/merchants',
        detail: 'GET /api/merchants/:code'
      },
      receipts: {
        list: 'GET /api/receipts',
        detail: 'GET /api/receipts/:reference'
      },
      notifications: 'GET /api/notifications',
      admin: {
        dashboard: 'GET /api/admin/dashboard',
        users: 'GET /api/admin/users',
        updateUser: 'PATCH /api/admin/users/:id',
        transactions: 'GET /api/admin/transactions',
        updateTransactionStatus: 'PATCH /api/admin/transactions/:id/status',
        payments: 'GET /api/admin/payments',
        kyc: 'GET /api/admin/kyc',
        reviewKYC: 'PATCH /api/admin/kyc/:id'
      }
    }
  });
});

// API Routes
app.use('/api', routes);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'connected' // Add your DB status check here
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Solvent API',
    version: '1.0.0',
    documentation: '/api-docs',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Improved 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    suggestions: [
      '/api-docs',
      '/health',
      '/api/auth/register'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, _next) => {
  console.error('API Error:', err.stack || err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
  🚀 Server running on port ${PORT}
  🌐 Local: http://localhost:${PORT}
  📚 API Docs: http://localhost:${PORT}/api-docs
  📁 Uploads directory: ${uploadsDir}
  `);
});