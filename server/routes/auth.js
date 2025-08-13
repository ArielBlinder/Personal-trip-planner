const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const { generateToken, authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /register
 * Register a new user
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Input validation
    if (!username || !email || !password) {
      return res.status(400).json({ 
        message: 'All fields are required',
        error: 'MISSING_FIELDS'
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long',
        error: 'PASSWORD_TOO_SHORT'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Please provide a valid email address',
        error: 'INVALID_EMAIL'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      email: email.trim().toLowerCase() 
    });
    
    if (existingUser) {
      return res.status(409).json({ 
        message: 'User with this email already exists',
        error: 'USER_EXISTS'
      });
    }

    // Hash password
    const saltRounds = 12; // Increased for better security
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = new User({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword
    });

    await newUser.save();

    // Generate token for immediate login
    const token = generateToken(newUser);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({ 
        message: 'User with this email already exists',
        error: 'USER_EXISTS'
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to register user',
      error: 'REGISTRATION_ERROR'
    });
  }
});

/**
 * POST /login
 * Authenticate user and return JWT token
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Input validation
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email and password are required',
        error: 'MISSING_CREDENTIALS'
      });
    }

    // Find user by email
    const user = await User.findOne({ 
      email: email.trim().toLowerCase() 
    });
    
    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid email or password',
        error: 'INVALID_CREDENTIALS'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: 'Invalid email or password',
        error: 'INVALID_CREDENTIALS'
      });
    }

    // Generate JWT token
    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Failed to login',
      error: 'LOGIN_ERROR'
    });
  }
});

/**
 * GET /profile
 * Get current user profile (protected route)
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch profile',
      error: 'PROFILE_ERROR'
    });
  }
});

/**
 * POST /logout
 * Logout user (client-side token removal)
 */
router.post('/logout', authenticateToken, (req, res) => {
  // In a stateless JWT system, logout is handled client-side
  // This endpoint is mainly for consistency and potential future token blacklisting
  res.json({ 
    message: 'Logout successful. Please remove the token from client storage.' 
  });
});

/**
 * GET /verify
 * Verify if current token is valid
 */
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    message: 'Token is valid',
    user: {
      id: req.user.userId,
      username: req.user.username,
      email: req.user.email
    }
  });
});

module.exports = router;
