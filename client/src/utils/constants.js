// Application constants and configuration used across the client
export const TRIP_TYPES = {
  HIKING: 'hiking',
  CYCLING: 'cycling'
};


export const API_ENDPOINTS = {
  BASE_URL: 'http://localhost:5000',
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
    PROTECTED: '/protected'
  },
  ROUTES: {
    GENERATE: '/api/generate-route',
    SAVE: '/api/routes/save',
    GET_ALL: '/api/routes',
    GET_ONE: '/api/routes',
    DELETE: '/api/routes'
  },
  WEATHER: '/api/weather',
  COUNTRY_IMAGE: '/api/country-image'
};

export const ERROR_MESSAGES = {
  NETWORK: "Unable to connect. Please check your internet connection.",
  AUTH_EXPIRED: "Session expired. Please log in again.",
  AUTH_REQUIRED: "Please log in to access this feature.",
  ROUTE_EXISTS: "A route with this name already exists.",
  ROUTE_SAVE_FAILED: "Unable to save route. Please try again.",
  ROUTE_LOAD_FAILED: "Unable to load route. Please try again.",
  ROUTE_DELETE_FAILED: "Unable to delete route. Please try again.",
  WEATHER_FAILED: "Weather data unavailable. Please try again later.",
  IMAGE_FAILED: "Unable to load country image.",
  TRIP_GENERATION_FAILED: "Unable to generate trip. Please try again.",
  INVALID_INPUT: "Please enter valid information.",
  COUNTRY_REQUIRED: "Please enter a country name.",
  ROUTE_NAME_REQUIRED: "Route name is required."
};

export const SUCCESS_MESSAGES = {
  ROUTE_SAVED: "Route saved successfully!",
  ROUTE_DELETED: "Route deleted successfully!",
  LOGIN_SUCCESS: "Welcome back!",
  REGISTER_SUCCESS: "Account created successfully!"
};

export const MAP_CONFIG = {
  DEFAULT_CENTER: [32.0853, 34.7818],
  DEFAULT_ZOOM: 10,
  ROUTE_COLORS: ['#2563eb', '#ff4433', '#4bff33', '#ffff33', '#ee33ff'],
  IMAGE_HEIGHT: 300,
  MARKER_BOUNDS_PADDING: [50, 50]
};

