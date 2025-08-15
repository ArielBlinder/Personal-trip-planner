// API utility functions for route management
import { API_ENDPOINTS, ERROR_MESSAGES } from './constants';
import { ErrorHandler } from './errorHandler';

const BASE_URL = API_ENDPOINTS.BASE_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

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

export const routeAPI = {
  saveRoute: async (routeData, userRouteName, userRouteDescription = '') => {
    try {
      const response = await fetch(`${BASE_URL}${API_ENDPOINTS.ROUTES.SAVE}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ routeData, userRouteName, userRouteDescription })
      });
      return handleResponse(response);
    } catch (error) {
      throw new Error(ErrorHandler.handleRouteError(error, 'save'));
    }
  },
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

export const authAPI = {
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

export const weatherAPI = {
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

export const imageAPI = {
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
