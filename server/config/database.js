// MongoDB connection helper using Mongoose
// Reads connection string from MONGODB_URI and exits process on failure
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Use provided connection string or fallback to local dev database
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trip-planner', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;