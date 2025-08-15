const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const weatherService = require('../services/weatherService');
const unsplashService = require('../services/unsplashService');

const router = express.Router();

// weather (minimal guard)
router.get('/weather', authenticateToken, async (req, res, next) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return res.status(400).json({ message: 'lat and lng must be numbers' });
    const forecast = await weatherService.getThreeDayForecast(lat, lng);
    res.json({ location: { lat, lng }, forecast, timestamp: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});

// country image (default to fallback if missing)
router.get('/country-image', authenticateToken, async (req, res, next) => {
  try {
    const country = String(req.query.country || '').trim();
    if (!country) return res.json({ country: 'landscape', image: unsplashService.getFallbackImage('landscape') });
    const image = await unsplashService.getCountryImage(country);
    res.json({ country, image, timestamp: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
