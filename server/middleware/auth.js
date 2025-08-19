const jwt = require('jsonwebtoken');

// JWT Authentication Middleware
// Verifies JWT tokens from Authorization header
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        message: 'Access token required',
        error: 'MISSING_TOKEN'
      });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error('JWT verification error:', err.message);
        
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ 
            message: 'Token has expired',
            error: 'TOKEN_EXPIRED'
          });
        }
        
        if (err.name === 'JsonWebTokenError') {
          return res.status(403).json({ 
            message: 'Invalid token',
            error: 'INVALID_TOKEN'
          });
        }
        
        return res.status(403).json({ 
          message: 'Token verification failed',
          error: 'TOKEN_VERIFICATION_FAILED'
        });
      }

      // Attach user info to request object
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        username: decoded.username
      };
      
      next();
    });
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({ 
      message: 'Authentication error',
      error: 'AUTH_MIDDLEWARE_ERROR'
    });
  }
};

// Optional authentication middleware
// Continues even if token is invalid (for optional auth routes)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      req.user = null;
    } else {
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        username: decoded.username
      };
    }
    next();
  });
};

// Generate JWT token
const generateToken = (user) => {
  const payload = {
    userId: user._id,
 
    username: user.username
  };

  return jwt.sign(payload, process.env.JWT_SECRET, { 
    expiresIn: '24h',
    issuer: 'trip-planner-api',
    audience: 'trip-planner-client'
  });
};

// Verify JWT token manually (for utility purposes)
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
};

module.exports = {
  authenticateToken,
  optionalAuth,
  generateToken,
  verifyToken
};
