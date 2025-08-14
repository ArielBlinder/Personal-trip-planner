# Personal Trip Planner

Plan and manage hiking or cycling trips with AI-generated routes, interactive maps, and real-time weather.

## Features

- **Authentication**: Secure registration and login with JWT
- **AI trip generation**: Hiking or cycling routes via Groq API
- **Interactive maps**: Leaflet map with routing and waypoints
- **Saved routes**: Create, view, and delete your routes
- **Weather**: 3‑day forecast for the trip area
- **Country images**: Unsplash-powered images per country

## Known issues

- **AI-generated coordinates**: The AI prompt may return coordinates that are not fully accurate. As a result, some waypoints can appear slightly off on the map. If this occurs, try regenerating the route.


## Tech stack

- **Frontend**: React 19, React Router DOM 7, React Leaflet 5
- **Backend**: Node.js (Express 5), MongoDB (Mongoose 8), JWT (bcrypt)
- **Integrations**: Groq API (AI), OpenWeatherMap, Unsplash, Graphhopper

## Prerequisites

- Node.js 18+
- MongoDB Community Server 6+
- API keys: Groq, OpenWeatherMap, Unsplash, Graphhopper.

## Setup

### Clone and install

```bash
git clone <your-repository-url>
cd Personal-trip-planner

# Server in a separate terminal window
cd server
npm install

# Client in a separate terminal window
cd client
npm install
```

### Configure environment

Create a `.env` file in the `server` directory:

```env
# Server
PORT=5000
CLIENT_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/trip-planner

# Auth
JWT_SECRET=your_secure_random_jwt_secret_key

# External APIs
GROQ_API_KEY=your_groq_api_key
OPENWEATHER_API_KEY=your_openweather_api_key
UNSPLASH_ACCESS_KEY=your_unsplash_access_key

NODE_ENV=development
```

Create a `.env` file in the `client` directory:

```env
# External API
REACT_APP_GRAPHHOPPER_API_KEY=your_GRAPHHOPPER_api_key
```

Get API keys from: Groq Console, OpenWeatherMap, graphhopper, Unsplash Developers.

## Run

Open two terminals:

- Backend
  ```bash
  cd server
  npm start
  ```
- Frontend
  ```bash
  cd client
  npm start # http://localhost:3000 will open automatically
  ```

Default URLs:

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Using the app

1. Register and log in
2. Enter a country and choose hiking or cycling
3. Generate the trip and review waypoints on the map
4. See the 3‑day weather forecast
5. Save the route


## Scripts

- Server: `npm start`, `npm run dev`
- Client: `npm start`, `npm run build`, `npm test`




## Security

- Keep `.env` files private !
- Use a strong `JWT_SECRET`
- Back up your database and control access

## Authors & Credits

Ariel Blinder
Saar Attarchi
