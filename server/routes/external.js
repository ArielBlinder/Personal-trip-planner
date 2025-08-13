const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const weatherService = require('../services/weatherService');
const unsplashService = require('../services/unsplashService');

const router = express.Router();

/**
 * GET /weather
 * Get weather forecast for given coordinates
 */
router.get('/weather', authenticateToken, async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    // Input validation
    if (!lat || !lng) {
      return res.status(400).json({ 
        message: 'Latitude and longitude are required',
        error: 'MISSING_COORDINATES'
      });
    }

    // Parse and validate coordinates
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ 
        message: 'Invalid latitude or longitude format',
        error: 'INVALID_COORDINATES'
      });
    }

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({ 
        message: 'Latitude must be between -90 and 90',
        error: 'INVALID_LATITUDE'
      });
    }

    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({ 
        message: 'Longitude must be between -180 and 180',
        error: 'INVALID_LONGITUDE'
      });
    }

    // Fetch weather forecast
    const weatherForecast = await weatherService.getThreeDayForecast(latitude, longitude);
    
    res.json({
      location: { 
        lat: latitude, 
        lng: longitude 
      },
      forecast: weatherForecast,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Weather API error:', error);
    
    // Return fallback weather data on error
    res.status(500).json({ 
      message: 'Failed to fetch weather data, using fallback',
      error: 'WEATHER_API_ERROR',
      location: { 
        lat: parseFloat(req.query.lat) || 0, 
        lng: parseFloat(req.query.lng) || 0 
      },
      forecast: weatherService.getFallbackWeather(),
      timestamp: new Date().toISOString(),
      isFallback: true
    });
  }
});

/**
 * GET /country-image
 * Get image for a specific country
 */
router.get('/country-image', authenticateToken, async (req, res) => {
  try {
    const { country } = req.query;
    
    // Input validation
    if (!country) {
      return res.status(400).json({ 
        message: 'Country parameter is required',
        error: 'MISSING_COUNTRY'
      });
    }

    // Validate country name
    const countryName = country.trim();
    if (countryName.length < 2) {
      return res.status(400).json({ 
        message: 'Country name must be at least 2 characters long',
        error: 'INVALID_COUNTRY_NAME'
      });
    }

    // Fetch country image
    const imageData = await unsplashService.getCountryImage(countryName);
    
    res.json({
      country: countryName,
      image: imageData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Country image API error:', error);
    
    // Return fallback image on error
    const countryName = req.query.country?.trim() || 'landscape';
    res.status(500).json({ 
      message: 'Failed to fetch country image, using fallback',
      error: 'IMAGE_API_ERROR',
      country: countryName,
      image: unsplashService.getFallbackImage(countryName),
      timestamp: new Date().toISOString(),
      isFallback: true
    });
  }
});

/**
 * GET /health
 * Health check for external services (optional auth)
 */
router.get('/health', async (req, res) => {
  const healthStatus = {
    timestamp: new Date().toISOString(),
    services: {}
  };

  // Test weather service
  try {
    await weatherService.getThreeDayForecast(40.7128, -74.0060); // NYC coordinates
    healthStatus.services.weather = 'healthy';
  } catch (error) {
    healthStatus.services.weather = 'unhealthy';
  }

  // Test image service
  try {
    await unsplashService.getCountryImage('test');
    healthStatus.services.images = 'healthy';
  } catch (error) {
    healthStatus.services.images = 'unhealthy';
  }

  // Determine overall health
  const allHealthy = Object.values(healthStatus.services).every(status => status === 'healthy');
  healthStatus.overall = allHealthy ? 'healthy' : 'degraded';

  res.status(allHealthy ? 200 : 503).json(healthStatus);
});

/**
 * GET /weather/fallback
 * Get fallback weather data (for testing)
 */
router.get('/weather/fallback', authenticateToken, (req, res) => {
  res.json({
    message: 'Fallback weather data',
    forecast: weatherService.getFallbackWeather(),
    timestamp: new Date().toISOString(),
    isFallback: true
  });
});

/**
 * GET /image/fallback
 * Get fallback image data (for testing)
 */
router.get('/image/fallback', authenticateToken, (req, res) => {
  const { country = 'landscape' } = req.query;
  
  res.json({
    message: 'Fallback image data',
    country: country,
    image: unsplashService.getFallbackImage(country),
    timestamp: new Date().toISOString(),
    isFallback: true
  });
});

module.exports = router;
