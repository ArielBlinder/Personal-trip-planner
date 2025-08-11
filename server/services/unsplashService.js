const axios = require('axios');

/**
 * Unsplash Service for fetching country-characteristic images
 * Provides images that represent the character and landscape of a country
 */
class UnsplashService {
  constructor() {
    this.apiKey = process.env.UNSPLASH_ACCESS_KEY;
    this.baseUrl = 'https://api.unsplash.com';
  }

  /**
   * Get a characteristic image for a country
   * @param {string} country - Country name
   * @returns {Promise<Object>} Image data with URL and attribution
   */
  async getCountryImage(country) {
    if (!this.apiKey) {
      console.warn('Unsplash API key not configured, using fallback image');
      return this.getFallbackImage(country);
    }

    try {
      // Search for landscape/travel images of the country
      const searchQuery = `${country} landscape travel nature architecture`;
      
      const response = await axios.get(`${this.baseUrl}/search/photos`, {
        params: {
          query: searchQuery,
          page: 1,
          per_page: 10,
          orientation: 'landscape',
          order_by: 'relevant'
        },
        headers: {
          'Authorization': `Client-ID ${this.apiKey}`,
          'Accept-Version': 'v1'
        }
      });

      const photos = response.data.results;
      
      if (photos && photos.length > 0) {
        // Get a random photo from the results for variety
        const randomPhoto = photos[Math.floor(Math.random() * Math.min(photos.length, 5))];
        
        return {
          url: randomPhoto.urls.regular,
          thumbnailUrl: randomPhoto.urls.small,
          description: randomPhoto.alt_description || `Beautiful view of ${country}`,
          photographer: randomPhoto.user.name,
          photographerUrl: randomPhoto.user.links.html,
          unsplashUrl: randomPhoto.links.html,
          attribution: `Photo by ${randomPhoto.user.name} on Unsplash`
        };
      } else {
        console.warn(`No images found for ${country}, using fallback`);
        return this.getFallbackImage(country);
      }
    } catch (error) {
      console.error('Unsplash API error:', error.response?.data || error.message);
      return this.getFallbackImage(country);
    }
  }

  /**
   * Fallback image when Unsplash API is unavailable
   */
  getFallbackImage(country) {
    return {
      url: `https://source.unsplash.com/800x400/?${encodeURIComponent(country)},landscape`,
      thumbnailUrl: `https://source.unsplash.com/400x200/?${encodeURIComponent(country)},landscape`,
      description: `Beautiful landscape of ${country}`,
      photographer: 'Unsplash Community',
      photographerUrl: 'https://unsplash.com',
      unsplashUrl: 'https://unsplash.com',
      attribution: 'Photo from Unsplash'
    };
  }

  /**
   * Get multiple images for a country (for future use)
   */
  async getCountryImages(country, count = 3) {
    if (!this.apiKey) {
      return Array(count).fill(null).map(() => this.getFallbackImage(country));
    }

    try {
      const searchQuery = `${country} landscape travel nature architecture`;
      
      const response = await axios.get(`${this.baseUrl}/search/photos`, {
        params: {
          query: searchQuery,
          page: 1,
          per_page: count * 2, // Get more than needed for variety
          orientation: 'landscape',
          order_by: 'relevant'
        },
        headers: {
          'Authorization': `Client-ID ${this.apiKey}`,
          'Accept-Version': 'v1'
        }
      });

      const photos = response.data.results.slice(0, count);
      
      return photos.map(photo => ({
        url: photo.urls.regular,
        thumbnailUrl: photo.urls.small,
        description: photo.alt_description || `Beautiful view of ${country}`,
        photographer: photo.user.name,
        photographerUrl: photo.user.links.html,
        unsplashUrl: photo.links.html,
        attribution: `Photo by ${photo.user.name} on Unsplash`
      }));
    } catch (error) {
      console.error('Unsplash API error:', error.response?.data || error.message);
      return Array(count).fill(null).map(() => this.getFallbackImage(country));
    }
  }
}

module.exports = new UnsplashService();
