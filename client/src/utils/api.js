// API utility functions for route management
import { API_ENDPOINTS, ERROR_MESSAGES } from './constants';
import { ErrorHandler } from './errorHandler';

const BASE_URL = API_ENDPOINTS.BASE_URL;

// Get auth headers with JWT token
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// Handle API responses with improved error handling
const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = ERROR_MESSAGES.NETWORK;
    try {
      const error = await response.json();
      errorMessage = error.message || `HTTP ${response.status}: ${response.statusText}`;
    } catch (parseError) {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }
  
  return response.json();
};

// Route Management API calls
export const routeAPI = {
  // Save a route
  saveRoute: async (routeData, userRouteName, userRouteDescription = '') => {
    try {
      const response = await fetch(`${BASE_URL}${API_ENDPOINTS.ROUTES.SAVE}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          routeData,
          userRouteName,
          userRouteDescription
        })
      });
      return handleResponse(response);
    } catch (error) {
      throw new Error(ErrorHandler.handleRouteError(error, 'save'));
    }
  },

  // Get all saved routes for the user
  getSavedRoutes: async () => {
    try {
      const response = await fetch(`${BASE_URL}${API_ENDPOINTS.ROUTES.GET_ALL}`, {
        headers: getAuthHeaders()
      });
      return handleResponse(response);
    } catch (error) {
      throw new Error(ErrorHandler.handleRouteError(error, 'load'));
    }
  },

  // Get specific route details
  getRoute: async (routeId) => {
    try {
      const response = await fetch(`${BASE_URL}${API_ENDPOINTS.ROUTES.GET_ONE}/${routeId}`, {
        headers: getAuthHeaders()
      });
      return handleResponse(response);
    } catch (error) {
      throw new Error(ErrorHandler.handleRouteError(error, 'load'));
    }
  },

  // Delete a route
  deleteRoute: async (routeId) => {
    try {
      const response = await fetch(`${BASE_URL}${API_ENDPOINTS.ROUTES.DELETE}/${routeId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return handleResponse(response);
    } catch (error) {
      throw new Error(ErrorHandler.handleRouteError(error, 'delete'));
    }
  }
};

// Authentication API calls
export const authAPI = {
  // Generate route (existing functionality)
  generateRoute: async (country, type) => {
    try {
      const response = await fetch(`${BASE_URL}${API_ENDPOINTS.ROUTES.GENERATE}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ country, type })
      });
      return handleResponse(response);
    } catch (error) {
      throw new Error(ErrorHandler.handleTripGenerationError(error));
    }
  },

  // Get protected user data
  getProtectedData: async () => {
    try {
      const response = await fetch(`${BASE_URL}${API_ENDPOINTS.AUTH.PROTECTED}`, {
        headers: getAuthHeaders()
      });
      return handleResponse(response);
    } catch (error) {
      throw new Error(ErrorHandler.handleApiError(error, ERROR_MESSAGES.AUTH_EXPIRED));
    }
  }
};

// Weather API calls
export const weatherAPI = {
  // Get 3-day weather forecast
  getThreeDayForecast: async (lat, lng) => {
    try {
      const response = await fetch(`${BASE_URL}${API_ENDPOINTS.WEATHER}?lat=${lat}&lng=${lng}`, {
        headers: getAuthHeaders()
      });
      return handleResponse(response);
    } catch (error) {
      throw new Error(ErrorHandler.handleWeatherError(error));
    }
  }
};

// Country Image API calls
export const imageAPI = {
  // Get country characteristic image
  getCountryImage: async (country) => {
    try {
      const response = await fetch(`${BASE_URL}${API_ENDPOINTS.COUNTRY_IMAGE}?country=${encodeURIComponent(country)}`, {
        headers: getAuthHeaders()
      });
      return handleResponse(response);
    } catch (error) {
      throw new Error(ErrorHandler.handleImageError(error));
    }
  }
};