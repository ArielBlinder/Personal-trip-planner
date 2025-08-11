# Personal Trip Planner

A full-stack web application for planning and managing travel routes with AI-powered trip generation, interactive maps, and real-time weather forecasts.

## Features

- **User Authentication**: Secure registration and login with JWT tokens
- **AI Trip Planning**: Generate hiking and cycling routes using Groq's Llama AI
- **Interactive Maps**: View routes and waypoints on dynamic maps with real routing
- **Route Management**: Save, load, and delete your favorite routes
- **Weather Integration**: Real-time 3-day weather forecasts for trip locations
- **Country Images**: Beautiful country-characteristic images from Unsplash
- **Protected Routes**: Secure access ensuring users only see their own routes

## Technology Stack

### Frontend

- React 19 with modern hooks and functional components
- React Router DOM for navigation
- React Leaflet for interactive maps with OSRM routing
- Responsive CSS design
- JWT token handling

### Backend

- Node.js with Express.js RESTful API
- MongoDB with Mongoose ODM
- JWT authentication with bcrypt password hashing
- Groq's Llama AI for intelligent route generation
- OpenWeatherMap API for weather forecasts
- Unsplash API for country images

## Prerequisites

Before starting, ensure you have:

- Node.js (version 16 or higher)
- MongoDB Community Server (version 6.0 or higher)
- Git version control
- API keys for:
  - Groq API
  - OpenWeatherMap
  - Unsplash

## Installation

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repository-url>
cd Personal-trip-planner

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
cd ..
```

### 2. MongoDB Setup

#### Windows Installation:

1. Download MongoDB Community Server from the official website
2. Run the installer and choose "Complete" setup
3. Check "Install MongoDB as a Service" option
4. Check "Install MongoDB Compass" for database management
5. Complete installation

#### Verify MongoDB:

```bash
# Test MongoDB connection
mongosh --eval "db.runCommand({ping: 1})"
```

### 3. Environment Configuration

Create a `.env` file in the `server` directory:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/trip-planner

# Authentication
JWT_SECRET=your_secure_random_jwt_secret_key

# API Keys
GROQ_API_KEY=your_groq_api_key
OPENWEATHER_API_KEY=your_openweather_api_key
UNSPLASH_ACCESS_KEY=your_unsplash_access_key

# Environment
NODE_ENV=development
```

**Required API Keys:**

- **Groq API**: Get from [Groq Console](https://console.groq.com/)
- **OpenWeatherMap**: Free tier at [openweathermap.org](https://openweathermap.org/api)
- **Unsplash**: Optional, get from [Unsplash Developers](https://unsplash.com/developers)

### 4. Verify Setup

Run the setup verification script:

```bash
node setup-check.js
```

This checks Node.js, MongoDB, dependencies, and environment configuration.

## Running the Application

Start both frontend and backend in separate terminals:

**Terminal 1 - Backend Server:**

```bash
cd server
npm run dev
```

**Terminal 2 - Frontend Client:**

```bash
cd client
npm start
```

The application will be available at:

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Usage Guide

### Getting Started

1. **Create Account**: Register with username, email, and password
2. **Login**: Access your personal dashboard
3. **Plan Route**: Enter country and select trip type (hiking/cycling)
4. **Generate**: AI creates detailed routes with waypoints and distances
5. **Explore**: View interactive map with routing and weather forecast
6. **Save**: Store routes with custom names and descriptions

### Route Planning Features

**Hiking Routes:**

- Round-trip routes starting and ending at same location
- 5-15 km per day distance range
- Walking paths and trail routing

**Cycling Routes:**

- 2-day city-to-city routes
- Maximum 60 km per day
- Road and cycling path routing

### Route Management

- View all saved routes in organized list
- Load routes to display on interactive map
- Delete unwanted routes with confirmation
- Routes include weather forecasts and country images

## API Reference

### Authentication Endpoints

- `POST /register` - User registration
- `POST /login` - User authentication
- `GET /protected` - Verify token validity

### Route Management

- `POST /api/generate-route` - Generate AI-powered route
- `POST /api/routes/save` - Save route to user account
- `GET /api/routes` - Get user's saved routes
- `GET /api/routes/:id` - Get specific route details
- `DELETE /api/routes/:id` - Delete saved route

### Additional Services

- `GET /api/weather` - Get 3-day weather forecast
- `GET /api/country-image` - Get country characteristic image

## Data Management

### Export Data

```bash
cd server
npm run export-data
```

Creates timestamped backup with users and routes data.

### Import Data

1. Copy exported JSON files to server directory
2. Rename users export file to `users.json`
3. Run `npm run migrate`

## Project Structure

```
Personal-trip-planner/
├── client/                    # React frontend application
│   ├── src/
│   │   ├── components/        # Reusable React components
│   │   ├── pages/            # Page-level components
│   │   ├── utils/            # API utilities and constants
│   │   └── index.css         # Application styles
│   └── package.json
├── server/                   # Node.js backend application
│   ├── config/              # Database configuration
│   ├── models/              # MongoDB data models
│   ├── services/            # External API services
│   ├── index.js             # Main server application
│   ├── migrate.js           # Data migration script
│   └── package.json
├── setup-check.js           # Installation verification
└── README.md               # Project documentation
```

## Available Scripts

### Server Commands

- `npm start` - Production server
- `npm run dev` - Development with auto-reload

### Client Commands

- `npm start` - Development client
- `npm run build` - Production build
- `npm test` - Run test suite

## Troubleshooting

### Common Issues

**MongoDB Connection Failed:**

- Ensure MongoDB service is running
- Check connection string in .env file
- Verify MongoDB is installed correctly

**API Key Errors:**

- Verify all required API keys are set in .env
- Check API key validity and quotas
- Ensure .env file is in server directory

**Port Already in Use:**

- Kill processes using ports 3000 or 5000
- Use different ports if needed

**Route Generation Fails:**

- Check internet connection
- Verify Groq API key and quota
- Try different country names or be more specific

### Performance Optimization

- Routes are memoized to prevent unnecessary re-renders
- Map components use efficient leaflet routing
- Weather data includes fallback for offline scenarios
- Images are optimized with loading states

## Security Considerations

1. **Environment Variables**: Never commit or share .env files
2. **JWT Secret**: Use strong, unique secret for production
3. **API Keys**: Restrict API key permissions when possible
4. **Database**: Regular backups and access control
5. **Input Validation**: All user inputs are sanitized

## License

This project is licensed under the MIT License.

## Support

For issues and questions:

1. Check troubleshooting section above
2. Review API documentation
3. Verify environment configuration
4. Check console logs for specific errors
