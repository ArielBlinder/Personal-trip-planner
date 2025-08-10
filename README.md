# Personal Trip Planner

A full-stack web application that combines user authentication with AI-powered trip planning and interactive maps.

## Features

- **User Authentication**: Secure registration and login with JWT tokens
- **AI Trip Planning**: Generate hiking, cycling, and walking trips using Gemini AI
- **Interactive Maps**: View trip routes and points of interest on a dynamic map
- **Route Management**: Save, load, and delete your favorite routes
- **Protected Routes**: Access control to ensure only authenticated users can plan trips

## Technology Stack

### Frontend (Port 3000)

- React 19
- React Router DOM for navigation
- React Leaflet for interactive maps
- JWT decode for token handling

### Backend (Port 5000)

- Node.js with Express
- MongoDB with Mongoose ODM
- JWT for authentication
- bcrypt for password hashing
- Google Gemini AI for trip generation

## Installation & Setup

### Prerequisites

Before starting, make sure you have:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **MongoDB Community Server** (v6.0 or higher) - [Download here](https://www.mongodb.com/try/download/community)
- **Git** - [Download here](https://git-scm.com/downloads)
- **Google Gemini API Key** - [Get one here](https://ai.google.dev/)

### Step 1: Install MongoDB

#### Windows:

1. Download MongoDB Community Server from the official website
2. Run the installer (.msi file)
3. Choose "Complete" setup
4. **Important**: Check "Install MongoDB as a Service" and "Run service as Network Service user"
5. **Important**: Check "Install MongoDB Compass" (useful for database management)
6. Complete the installation

#### Verify MongoDB Installation:

```bash
# Check if MongoDB is running
mongosh --eval "db.runCommand({ping: 1})"
```

### Step 2: Clone and Setup Project

```bash
# Clone the repository
git clone <your-github-repository-url>
cd Personal-trip-planner

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
cd ..
```

### Step 3: Environment Configuration

Create a `.env` file in the `server` directory:

```bash
cd server
```

Create `.env` file with the following content:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/trip-planner

# JWT Secret (change this to a random string)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Google Gemini AI API Key
GEMINI_API_KEY=your_gemini_api_key_here

# OpenWeather API Key (for real weather forecasts)
OPENWEATHER_API_KEY=your_openweather_api_key_here

# Environment
NODE_ENV=development
```

**Important**:

- Replace `your_gemini_api_key_here` with your actual Gemini API key
- Replace `your_openweather_api_key_here` with your OpenWeather API key (get one free at [openweathermap.org](https://openweathermap.org/api))

### Step 4: Database Setup and Data Migration

#### Option A: Start Fresh (Simplest)

If you want to start with a clean database, simply run the server - MongoDB will create the database automatically when the first user registers.

#### Option B: Migrate Existing Data

If you have existing JSON backup files, you can migrate them:

1. **Copy your JSON backup files** to the server directory
2. **Rename the backup file** to `users.json`:
   ```bash
   cd server
   cp users_backup_2025-08-05T08-38-34-649Z.json users.json
   ```
3. **Run the migration**:
   ```bash
   npm run migrate
   ```

#### Option C: Import from Another MongoDB Database

If you have an existing MongoDB database:

**From your original computer:**

```bash
# Export users collection
mongodump --db trip-planner --collection users --out backup

# Export routes collection (if it exists)
mongodump --db trip-planner --collection routes --out backup
```

**On the new computer:**

```bash
# Import the data
mongorestore backup
```

### Step 5: Verify Setup (Optional)

Run the setup checker to verify everything is configured correctly:

```bash
node setup-check.js
```

This will check:

- Node.js installation and version
- npm availability
- MongoDB connection
- Project dependencies
- Environment configuration

### Step 6: Start the Application

Open **two terminal windows/tabs**:

**Terminal 1 - Start the Backend Server:**

```bash
cd server
npm run dev
```

You should see:

```
Server running on port 5000
MongoDB Connected: localhost:27017
```

**Terminal 2 - Start the Frontend Client:**

```bash
cd client
npm start
```

The React application will open in your browser at `http://localhost:3000`

## How to Use the Application

### Getting Started

1. **Register/Login**:

   - **New users**: Click "Register" and create an account with username, email, and password
   - **Existing users**: Click "Login" and enter your credentials

2. **Plan a Trip**:

   - Enter a country or location you want to visit
   - Select trip type: 🥾 Hiking, 🚴 Cycling, or 🚶 Walking
   - Click "Generate Trip" for AI-powered suggestions

3. **Explore Your Route**:

   - View the interactive map with route markers
   - See distances, estimated times, and descriptions
   - Discover points of interest along your route

4. **Save Your Trip**:
   - Click "Save This Route" to open the save dialog
   - Add a route name (required) and description (optional)
   - Click "Save Route" to store it in your account

### Managing Saved Routes

- **View All Routes**: Navigate to the "Saved Routes" section
- **Load a Route**: Click "Load" to display a saved route on the map
- **Delete a Route**: Click "Delete" to permanently remove a route

### Tips for Best Experience

- **Be Specific**: Include region names (e.g., "Swiss Alps" vs. "Switzerland")
- **Try Different Types**: Same location offers different experiences for hiking/cycling/walking
- **Save Variations**: Save multiple route options for the same destination

## Data Export and Backup

### Export Your Current Data

To backup your routes and user data (useful for migrating to another computer):

```bash
cd server
npm run export-data
```

This creates a timestamped backup folder with:

- `users_export.json` - User accounts and authentication data
- `routes_export.json` - Saved trip routes and plans
- `README.md` - Instructions for restoring the data

### Import Data on New Installation

1. Copy the exported JSON files to your new server directory
2. Rename `users_export.json` to `users.json`
3. Run: `npm run migrate`

## API Endpoints

### Authentication

- `POST /register` - Create new user account
- `POST /login` - User login

### Trip Planning

- `POST /generate-trip` - Generate AI-powered trip suggestions
- `GET /routes` - Get user's saved routes
- `POST /routes` - Save a new route
- `DELETE /routes/:id` - Delete a saved route

## Troubleshooting

### MongoDB Connection Issues

- **Error**: "MongoNetworkError: connect ECONNREFUSED"
  - **Solution**: Make sure MongoDB service is running
  - **Windows**: Open Services, find "MongoDB Server", ensure it's running

### Port Already in Use

- **Error**: "EADDRINUSE: address already in use :::5000"
  - **Solution**: Kill the process using the port
  ```bash
  # Find the process
  netstat -ano | findstr :5000  # Windows
  ```

### Missing API Key

- **Error**: API requests failing
  - **Solution**: Make sure your Gemini API key is correctly set in the `.env` file

### Trip Generation Failed

- Check your internet connection
- Verify the Gemini API key is configured correctly
- Try a different destination or be more specific

### Map Not Loading

- Check your internet connection
- Try refreshing the page
- Ensure JavaScript is enabled in your browser

### Login Issues

- Verify your email and password are correct
- Check if Caps Lock is on
- Try registering again if you forgot your details

## Security Notes

1. **Change the JWT_SECRET** in production
2. **Keep your .env file secret** - never commit it to Git
3. **Use environment-specific configurations** for different deployments
4. **Regularly backup your database**

## Database Structure

Your MongoDB database will contain:

- **users** collection: User accounts with authentication
- **routes** collection: Saved trip routes and plans

## Project Structure

```
Personal-trip-planner/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   └── utils/         # API utilities
│   └── package.json
├── server/                # Node.js backend
│   ├── config/           # Database configuration
│   ├── models/           # MongoDB models
│   ├── export-data.js    # Data export script
│   ├── migrate.js        # Data migration script
│   └── package.json
├── setup-check.js        # Setup verification script
└── README.md            # This file
```

## Scripts Available

### Server Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm run migrate` - Migrate JSON data to MongoDB
- `npm run export-data` - Export current data to JSON files

### Client Scripts

- `npm start` - Start development client
- `npm run build` - Build for production
- `npm test` - Run tests

Once everything is set up:

- Users can register and login
- Generate AI-powered trip plans
- Save and manage routes
- View trips on interactive maps

The application will be available at:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

Enjoy.

---
