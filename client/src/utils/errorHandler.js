import { ERROR_MESSAGES } from './constants';

/**
 * Centralized error handling utility
 */
export class ErrorHandler {
  static handleApiError(error, defaultMessage = ERROR_MESSAGES.NETWORK) {
    console.error('API Error:', error);
    
    // Handle different types of errors
    if (error.message) {
      // Handle known error messages
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        return ERROR_MESSAGES.AUTH_EXPIRED;
      }
      if (error.message.includes('403') || error.message.includes('Forbidden')) {
        return ERROR_MESSAGES.AUTH_REQUIRED;
      }
      if (error.message.includes('400') && error.message.includes('exists')) {
        return ERROR_MESSAGES.ROUTE_EXISTS;
      }
      
      return error.message;
    }
    
    return defaultMessage;
  }

  static handleNetworkError(error) {
    return this.handleApiError(error, ERROR_MESSAGES.NETWORK);
  }

  static handleRouteError(error, operation = 'load') {
    const errorMap = {
      save: ERROR_MESSAGES.ROUTE_SAVE_FAILED,
      load: ERROR_MESSAGES.ROUTE_LOAD_FAILED,
      delete: ERROR_MESSAGES.ROUTE_DELETE_FAILED
    };
    
    return this.handleApiError(error, errorMap[operation] || ERROR_MESSAGES.ROUTE_LOAD_FAILED);
  }

  static handleWeatherError(error) {
    return this.handleApiError(error, ERROR_MESSAGES.WEATHER_FAILED);
  }

  static handleImageError(error) {
    return this.handleApiError(error, ERROR_MESSAGES.IMAGE_FAILED);
  }

  static handleTripGenerationError(error) {
    return this.handleApiError(error, ERROR_MESSAGES.TRIP_GENERATION_FAILED);
  }
}

/**
 * Validation helpers
 */
export class ValidationHelper {
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password) {
    return password && password.length >= 6;
  }

  static validateRouteName(name) {
    return name && name.trim().length > 0 && name.trim().length <= 50;
  }

  static validateCountry(country) {
    return country && country.trim().length > 0;
  }

  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input.trim().replace(/[<>]/g, '');
  }
}

/**
 * Simple coordinate validation
 */
export const isValidCoordinate = (lat, lng) => {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180 &&
    !isNaN(lat) && !isNaN(lng)
  );
};

/**
 * Debounce utility for performance
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
