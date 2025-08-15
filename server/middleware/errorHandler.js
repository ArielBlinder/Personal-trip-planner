// Simple 404
const notFound = (req, _res, next) => {
  const err = new Error(`Not Found - ${req.originalUrl}`);
  err.status = 404;
  next(err);
};

// Optional request-timeout wrapper
const requestTimeout = (ms = 30000) => (req, res, next) => {
  res.setTimeout(ms, () => {
    res.status(503).json({ message: 'Request timed out' });
  });
  next();
};

// Database error hook (used at startup)
const handleDatabaseError = (err) => {
  console.error('Database error:', err);
};

// Global error handler
const errorHandler = (err, req, res, _next) => {
  let status = err.status || res.statusCode || 500;
  let message = err.message || 'Server error';

  if (err.name === 'CastError') {
    status = 400; message = 'Invalid ID';
  }
  if (err.code === 11000) {
    status = 409; message = 'Duplicate key';
  }
  if (err.name === 'ValidationError') {
    status = 400; message = Object.values(err.errors).map(e => e.message).join(', ');
  }

  res.status(status).json({
    message,
    error: process.env.NODE_ENV === 'development'
      ? { status, path: req.originalUrl, method: req.method, stack: err.stack }
      : { status }
  });
};

module.exports = { notFound, errorHandler, requestTimeout, handleDatabaseError };
