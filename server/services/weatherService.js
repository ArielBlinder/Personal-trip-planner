const axios = require('axios');

class WeatherService {
  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY;
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
  }

  async getThreeDayForecast(lat, lng) {
    if (!this.apiKey) return this.getFallbackWeather();
    try {
      const { data } = await axios.get(`${this.baseUrl}/forecast`, {
        params: { lat, lon: lng, appid: this.apiKey, units: 'metric', cnt: 40 }
      });
      return this.extractThreeDayForecast(data.list);
    } catch {
      return this.getFallbackWeather();
    }
  }

  extractThreeDayForecast(forecasts) {
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(12, 0, 0, 0);
    const targets = [0,1,2].map(i => new Date(tomorrow.getTime() + i * 24 * 60 * 60 * 1000));
    const out = [];

    targets.forEach(t => {
      let best = null, bestDiff = Infinity;
      forecasts.forEach(f => {
        const d = new Date(f.dt * 1000);
        const diff = Math.abs(d - t);
        if (diff < bestDiff) { bestDiff = diff; best = f; }
      });
      if (best) {
        out.push({
          degrees: Math.round(best.main.temp),
          description: this.capitalize(best.weather[0].description),
          date: t.toDateString(),
          humidity: best.main.humidity,
          windSpeed: best.wind?.speed || 0
        });
      }
    });

    while (out.length < 3) out.push({ degrees: 20, description: 'Weather data unavailable', date: 'Unknown', humidity: 50, windSpeed: 0 });
    return out.slice(0, 3);
  }

  capitalize(s) { return String(s).split(' ').map(w => w[0]?.toUpperCase() + w.slice(1)).join(' '); }

  getFallbackWeather() {
    return [
      { degrees: 22, description: 'Pleasant weather expected', date: 'Tomorrow', humidity: 60, windSpeed: 5 },
      { degrees: 24, description: 'Partly cloudy', date: 'Day after tomorrow', humidity: 55, windSpeed: 8 },
      { degrees: 21, description: 'Mostly sunny', date: 'In 3 days', humidity: 50, windSpeed: 6 }
    ];
  }
}

module.exports = new WeatherService();
