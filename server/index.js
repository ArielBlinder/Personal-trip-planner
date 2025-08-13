require("dotenv").config();

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Database connection
const connectDB = require('./config/database');
const { handleDatabaseError } = require('./middleware/errorHandler');

// Middleware
const { authenticateToken } = require('./middleware/auth');
const { 
  notFound, 
  errorHandler, 
  requestTimeout, 
  rateLimitHandler 
} = require('./middleware/errorHandler');

// Route handlers
const authRoutes = require('./routes/auth');
const routeRoutes = require('./routes/routes');
const externalRoutes = require('./routes/external');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000; 

// Trust proxy (important for rate limiting behind reverse proxies)
app.set('trust proxy', 1);

// Connect to MongoDB with error handling
const initializeDatabase = async () => {
  try {
    await connectDB();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error.message);
    handleDatabaseError(error);
    process.exit(1);
  }
};

// Rate limiting configuration
const createRateLimit = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: { 
    message,
    error: 'RATE_LIMIT_EXCEEDED',
    retryAfter: Math.ceil(windowMs / 60000) + ' minutes'
  },
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
});

// Global rate limiting - 100 requests per 15 minutes
const globalLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100,
  'Too many requests from this IP, please try again later'
);

// Auth rate limiting - stricter for auth endpoints
const authLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes  
  10, // 10 attempts
  'Too many authentication attempts, please try again later'
);

// API rate limiting - for route generation
const apiLimiter = createRateLimit(
  60 * 1000, // 1 minute
  5, // 5 requests per minute
  'Too many API requests, please slow down'
);

// Middleware stack
app.use(requestTimeout(30000)); // 30 second timeout
app.use(globalLimiter);
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`📝 ${new Date().toISOString()} - ${req.method} ${req.originalUrl} - ${req.ip}`);
        next();
    });
}

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Personal Trip Planner API',
    version: '1.0.0',
    documentation: {
      auth: {
        'POST /auth/register': 'Register a new user',
        'POST /auth/login': 'Login user',
        'GET /auth/profile': 'Get user profile (protected)',
        'GET /auth/verify': 'Verify token (protected)',
        'POST /auth/logout': 'Logout user (protected)'
      },
      routes: {
        'POST /api/routes/generate': 'Generate new trip route (protected)',
        'POST /api/routes/save': 'Save generated route (protected)',
        'GET /api/routes': 'Get user saved routes (protected)',
        'GET /api/routes/:id': 'Get specific route (protected)',
        'DELETE /api/routes/:id': 'Delete route (protected)'
      },
      external: {
        'GET /api/external/weather': 'Get weather forecast (protected)',
        'GET /api/external/country-image': 'Get country image (protected)',
        'GET /api/external/health': 'Check external services health'
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Protected test endpoint
app.get('/protected', authenticateToken, (req, res) => {
  res.json({ 
    message: `Hello ${req.user.username}! Welcome back, what would you like to do?`,
    user: {
      id: req.user.userId,
      username: req.user.username,
      email: req.user.email
    },
    timestamp: new Date().toISOString()
  });
});

// Route handlers with rate limiting
app.use('/auth', authLimiter, authRoutes);
app.use('/api/routes', apiLimiter, routeRoutes);
app.use('/api/external', externalRoutes);

// Legacy route redirects for backward compatibility
app.post('/register', authLimiter, (req, res) => {
  res.redirect(307, '/auth/register');
});

app.post('/login', authLimiter, (req, res) => {
  res.redirect(307, '/auth/login');
});

app.post('/api/generate-route', apiLimiter, (req, res) => {
  res.redirect(307, '/api/routes/generate');
});

app.get('/api/weather', (req, res) => {
  res.redirect(307, '/api/external/weather?' + new URLSearchParams(req.query));
});

app.get('/api/country-image', (req, res) => {
  res.redirect(307, '/api/external/country-image?' + new URLSearchParams(req.query));
});

// Handle legacy route paths
app.use('/api/routes/save', (req, res, next) => {
  if (req.originalUrl === '/api/routes/save') {
    req.url = '/save';
  }
  next();
});

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Uncaught exception handler
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Start the application
startServer();
