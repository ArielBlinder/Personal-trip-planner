const axios = require('axios');

class UnsplashService {
  constructor() {
    this.apiKey = process.env.UNSPLASH_ACCESS_KEY;
    this.baseUrl = 'https://api.unsplash.com';
  }

  async getCountryImage(country) {
    if (!this.apiKey) return this.getFallbackImage(country);
    try {
      const { data } = await axios.get(`${this.baseUrl}/search/photos`, {
        params: { query: `${country} landscape`, page: 1, per_page: 5, orientation: 'landscape' },
        headers: { Authorization: `Client-ID ${this.apiKey}` }
      });
      const photo = data.results?.[0];
      if (!photo) return this.getFallbackImage(country);
      return {
        url: photo.urls.regular,
        thumbnailUrl: photo.urls.small,
        description: photo.alt_description || `Beautiful view of ${country}`,
        photographer: photo.user.name,
        photographerUrl: photo.user.links.html,
        unsplashUrl: photo.links.html,
        attribution: `Photo by ${photo.user.name} on Unsplash`
      };
    } catch {
      return this.getFallbackImage(country);
    }
  }

  getFallbackImage(country) {
    const q = encodeURIComponent(country);
    return {
      url: `https://source.unsplash.com/800x400/?${q},landscape`,
      thumbnailUrl: `https://source.unsplash.com/400x200/?${q},landscape`,
      description: `Beautiful landscape of ${country}`,
      photographer: 'Unsplash Community',
      photographerUrl: 'https://unsplash.com',
      unsplashUrl: 'https://unsplash.com',
      attribution: 'Photo from Unsplash'
    };
  }
}

module.exports = new UnsplashService();
