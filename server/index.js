// server/index.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const connectDB = require('./config/database');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');

// Routers
const authRoutes = require('./routes/auth');
const routeRoutes = require('./routes/routes');
const externalRoutes = require('./routes/external');

const app = express();
const PORT = process.env.PORT || 5000;

// Core middleware
app.use(cors({ origin: process.env.CLIENT_URL || true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Canonical routers
app.use('/auth', authRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/external', externalRoutes);

// Errors (last)
app.use(notFound);
app.use(errorHandler);

// Start after DB connects
(async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();
