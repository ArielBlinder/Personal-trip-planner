// Application Constants
export const TRIP_TYPES = {
  HIKING: 'hiking',
  CYCLING: 'cycling'
};

export const ROUTE_CONSTRAINTS = {
  HIKING: {
    MIN_KM_PER_DAY: 5,
    MAX_KM_PER_DAY: 15,
    IS_ROUND_TRIP: true
  },
  CYCLING: {
    MAX_KM_PER_DAY: 60,
    REQUIRED_DAYS: 2,
    IS_CITY_TO_CITY: true
  }
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
  DEFAULT_CENTER: [32.0853, 34.7818], // Default coordinates (Israel)
  DEFAULT_ZOOM: 10,
  ROUTE_COLORS: ['#2563eb', '#ff4433', '#4bff33', '#ffff33', '#ee33ff'],
  IMAGE_HEIGHT: 300,
  MARKER_BOUNDS_PADDING: [50, 50]
};

export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  ROUTE_NAME_MAX_LENGTH: 50,
  ROUTE_DESCRIPTION_MAX_LENGTH: 200,
  USERNAME_MIN_LENGTH: 1
};

export const COORDINATE_BOUNDS = {
  LATITUDE: { MIN: -90, MAX: 90 },
  LONGITUDE: { MIN: -180, MAX: 180 }
};

export const ROUTING_PROFILES = {
  [TRIP_TYPES.HIKING]: 'walking',
  [TRIP_TYPES.CYCLING]: 'cycling'
};

export const WEATHER_CONFIG = {
  FORECAST_DAYS: 3,
  DEFAULT_TEMP: 20,
  FALLBACK_WEATHER: [
    { degrees: 20, description: "Pleasant weather", date: "Tomorrow" },
    { degrees: 22, description: "Partly cloudy", date: "Day 2" },
    { degrees: 18, description: "Mostly sunny", date: "Day 3" }
  ]
};
