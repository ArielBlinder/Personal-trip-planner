const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const { authenticateToken, generateToken } = require('../middleware/auth');

const router = express.Router();

// register
router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body || {};
    if (!username || !email || !password) return res.status(400).json({ message: 'username, email, password are required' });

    const existing = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      username: String(username).trim(),
      email: String(email).trim().toLowerCase(),
      password: hashed
    });

    const token = generateToken(user);
    res.status(201).json({ message: 'ok', token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Email already registered' });
    next(err);
  }
});

// login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'email and password are required' });

    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid email or password' });

    const token = generateToken(user);
    res.json({ message: 'ok', token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    next(err);
  }
});

// profile
router.get('/profile', authenticateToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user: { id: user._id, username: user.username, email: user.email, createdAt: user.createdAt } });
  } catch (err) {
    next(err);
  }
});

// logout (stateless)
router.post('/logout', authenticateToken, (_req, res) => res.json({ message: 'ok' }));

// verify
router.get('/verify', authenticateToken, (req, res) => {
  res.json({ message: 'ok', user: req.user });
});

module.exports = router;
