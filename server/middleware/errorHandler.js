// Error handling middleware for the application

// Not Found middleware - handles 404 errors
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  // Default to 500 server error
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Mongoose bad ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found';
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate field value entered';
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join(', ');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Log error details (but not in production for security)
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
  }

  res.status(statusCode).json({
    message,
    error: {
      status: statusCode,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method
    },
    // Include stack trace only in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Request timeout middleware
const requestTimeout = (timeoutMs = 30000) => {
  return (req, res, next) => {
    req.setTimeout(timeoutMs, () => {
      const err = new Error('Request timeout');
      err.status = 408;
      next(err);
    });
    next();
  };
};

// Rate limiting error handler
const rateLimitHandler = (req, res) => {
  res.status(429).json({
    message: 'Too many requests from this IP, please try again later',
    error: {
      status: 429,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method,
      retryAfter: '15 minutes'
    }
  });
};

// Async error wrapper - catches async errors and passes to error handler
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Validation error formatter
const formatValidationError = (errors) => {
  return errors.map(error => ({
    field: error.param,
    message: error.msg,
    value: error.value
  }));
};

// Database connection error handler
const handleDatabaseError = (error) => {
  console.error('Database connection error:', error);
  
  if (error.code === 'ENOTFOUND') {
    throw new Error('Database server not found. Please check your connection string.');
  }
  
  if (error.code === 'ECONNREFUSED') {
    throw new Error('Database connection refused. Please check if the database server is running.');
  }
  
  if (error.name === 'MongooseServerSelectionError') {
    throw new Error('Unable to connect to database. Please check your database configuration.');
  }
  
  throw error;
};

module.exports = {
  notFound,
  errorHandler,
  requestTimeout,
  rateLimitHandler,
  asyncHandler,
  formatValidationError,
  handleDatabaseError
};
