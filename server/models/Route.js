const mongoose = require('mongoose');

const spotSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  lat: {
    type: Number,
    required: true
  },
  lng: {
    type: Number,
    required: true
  }
});

const dailyInfoSchema = new mongoose.Schema({
  day: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  day_locations: [spotSchema],
  distance_km: {
    type: Number,
    required: true
  }
});

const weatherSchema = new mongoose.Schema({
  degrees: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: false
  },
  humidity: {
    type: Number,
    required: false
  },
  windSpeed: {
    type: Number,
    required: false
  }
});

const routeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['hiking', 'cycling'],
    required: true
  },
  country: {
    type: String,
    required: true
  },
  logistics: {
    type: String,
    required: true
  },
  spots_names: [String],
  spots: [spotSchema],
  daily_info: [dailyInfoSchema],
  total_distance_km: {
    type: Number,
    required: true
  },
  // User provided name and description for saved route
  userRouteName: {
    type: String,
    required: true,
    trim: true
  },
  userRouteDescription: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

// Index for faster user-based queries
routeSchema.index({ userId: 1 });
routeSchema.index({ userId: 1, userRouteName: 1 });

module.exports = mongoose.model('Route', routeSchema);