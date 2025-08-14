const axios = require('axios');

// Weather Service using OpenWeatherMap API
// Provides 3-day weather forecast starting from tomorrow
class WeatherService {
  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY;
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
  }

  // Get weather forecast for the next 3 days starting tomorrow
  // @param {number} lat - Latitude
  // @param {number} lng - Longitude
  // @returns {Promise<Array>} Array of 3 weather objects
  async getThreeDayForecast(lat, lng) {
    if (!this.apiKey) {
      console.warn('OpenWeather API key not configured, using fallback weather');
      return this.getFallbackWeather();
    }

    try {
      // Get 5-day forecast (we'll extract 3 days starting from tomorrow)
      const response = await axios.get(`${this.baseUrl}/forecast`, {
        params: {
          lat: lat,
          lon: lng,
          appid: this.apiKey,
          units: 'metric', // Celsius
          cnt: 40 // 5 days * 8 forecasts per day (every 3 hours)
        }
      });

      const forecasts = response.data.list;
      const threeDayForecast = this.extractThreeDayForecast(forecasts);
      
      return threeDayForecast;
    } catch (error) {
      console.error('OpenWeather API error:', error.message);
      // Return fallback weather if API fails
      return this.getFallbackWeather();
    }
  }

  // Extract 3-day forecast starting from tomorrow
  // Takes the midday forecast (12:00) for each day
  extractThreeDayForecast(forecasts) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0); // Set to noon tomorrow

    const threeDayForecasts = [];
    const targetDates = [];

    // Generate target dates for next 3 days at noon
    for (let i = 0; i < 3; i++) {
      const targetDate = new Date(tomorrow);
      targetDate.setDate(targetDate.getDate() + i);
      targetDates.push(targetDate);
    }

    // Find forecast closest to noon for each target date
    targetDates.forEach(targetDate => {
      let closestForecast = null;
      let smallestDiff = Infinity;

      forecasts.forEach(forecast => {
        const forecastDate = new Date(forecast.dt * 1000);
        const timeDiff = Math.abs(forecastDate.getTime() - targetDate.getTime());

        if (timeDiff < smallestDiff) {
          smallestDiff = timeDiff;
          closestForecast = forecast;
        }
      });

      if (closestForecast) {
        threeDayForecasts.push({
          degrees: Math.round(closestForecast.main.temp),
          description: this.capitalizeDescription(closestForecast.weather[0].description),
          date: targetDate.toDateString(),
          humidity: closestForecast.main.humidity,
          windSpeed: closestForecast.wind?.speed || 0
        });
      }
    });

    // Ensure we always return 3 forecasts
    while (threeDayForecasts.length < 3) {
      threeDayForecasts.push({
        degrees: 20,
        description: 'Weather data unavailable',
        date: 'Unknown',
        humidity: 50,
        windSpeed: 0
      });
    }

    return threeDayForecasts.slice(0, 3);
  }

  // Capitalize weather description
  capitalizeDescription(description) {
    return description
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Fallback weather when API is unavailable
  getFallbackWeather() {
    return [
      {
        degrees: 22,
        description: 'Pleasant weather expected',
        date: 'Tomorrow',
        humidity: 60,
        windSpeed: 5
      },
      {
        degrees: 24,
        description: 'Partly cloudy',
        date: 'Day after tomorrow',
        humidity: 55,
        windSpeed: 8
      },
      {
        degrees: 21,
        description: 'Mostly sunny',
        date: 'In 3 days',
        humidity: 50,
        windSpeed: 6
      }
    ];
  }

  // Get current weather for a location
  async getCurrentWeather(lat, lng) {
    if (!this.apiKey) {
      return {
        degrees: 20,
        description: 'Current weather unavailable',
        humidity: 50,
        windSpeed: 0
      };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/weather`, {
        params: {
          lat: lat,
          lon: lng,
          appid: this.apiKey,
          units: 'metric'
        }
      });

      return {
        degrees: Math.round(response.data.main.temp),
        description: this.capitalizeDescription(response.data.weather[0].description),
        humidity: response.data.main.humidity,
        windSpeed: response.data.wind?.speed || 0
      };
    } catch (error) {
      console.error('OpenWeather current weather API error:', error.message);
      return {
        degrees: 20,
        description: 'Current weather unavailable',
        humidity: 50,
        windSpeed: 0
      };
    }
  }
}

module.exports = new WeatherService();
