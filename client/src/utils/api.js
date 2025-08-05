// API utility functions for route management

const BASE_URL = 'http://localhost:5000';

// Get auth headers with JWT token
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// Handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = 'API request failed';
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
    const response = await fetch(`${BASE_URL}/api/routes/save`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        routeData,
        userRouteName,
        userRouteDescription
      })
    });
    return handleResponse(response);
  },

  // Get all saved routes for the user
  getSavedRoutes: async () => {
    const response = await fetch(`${BASE_URL}/api/routes`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Get specific route details
  getRoute: async (routeId) => {
    const response = await fetch(`${BASE_URL}/api/routes/${routeId}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Delete a route
  deleteRoute: async (routeId) => {
    const response = await fetch(`${BASE_URL}/api/routes/${routeId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// Authentication API calls
export const authAPI = {
  // Generate route (existing functionality)
  generateRoute: async (country, type) => {
    const response = await fetch(`${BASE_URL}/api/generate-route`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ country, type })
    });
    return handleResponse(response);
  },

  // Get protected user data
  getProtectedData: async () => {
    const response = await fetch(`${BASE_URL}/protected`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};