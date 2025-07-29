# Personal Trip Planner

A full-stack web application that combines user authentication with AI-powered trip planning and interactive maps.

## Features

- **User Authentication**: Secure registration and login with JWT tokens
- **AI Trip Planning**: Generate hiking, cycling, and walking trips using Gemini AI
- **Interactive Maps**: View trip routes and points of interest on a dynamic map
- **Protected Routes**: Access control to ensure only authenticated users can plan trips

## Technology Stack

### Frontend (Port 3000)

- React 19
- React Router DOM for navigation
- React Leaflet for interactive maps
- JWT decode for token handling

### Backend (Port 5000)

- Node.js with Express
- JWT for authentication
- bcrypt for password hashing
- Google Gemini AI for trip generation
- File-based user storage (JSON)

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm
- Google Gemini API key

### 1. Clone and Setup

```bash
git clone <repository-url>
cd Personal-trip-planner
```

### 2. Server Setup

```bash
cd server
npm install
```

Create a `.env` file in the server directory:

```
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 3. Client Setup

```bash
cd client
npm install
```

### 4. Running the Application

**Start the Server (Terminal 1):**

```bash
cd server
npm start
```

Server will run on http://localhost:5000

**Start the Client (Terminal 2):**

```bash
cd client
npm start
```

Client will run on http://localhost:3000

## Usage

1. **Registration**: Create a new account with username, email, and password
2. **Login**: Sign in with your credentials
3. **Trip Planning**:
   - Enter a country name
   - Select trip type (hiking, cycling, walking)
   - Click "Generate Trip" to get AI-powered suggestions
4. **Map Interaction**: View generated routes and points of interest on the interactive map
5. **Logout**: Securely log out when finished

## API Endpoints

### Authentication

- `POST /register` - Create new user account
- `POST /login` - User login
- `GET /protected` - Verify authentication status

### Trip Planning

- `POST /api/generate-route` - Generate trip suggestions (Protected)

## File Structure

```
Personal-trip-planner/
├── server/
│   ├── index.js          # Main server file
│   ├── package.json      # Server dependencies
│   ├── users.json        # User data storage
│   └── .env             # Environment variables
├── client/
│   ├── src/
│   │   ├── App.js       # Main React component
│   │   ├── pages/
│   │   │   ├── Login.js     # Login page
│   │   │   ├── Register.js  # Registration page
│   │   │   └── Dashboard.js # Trip planner dashboard
│   │   └── ...
│   └── package.json     # Client dependencies
└── README.md
```

## Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Protected API routes
- Client-side route protection

## Trip Generation

The application uses Google's Gemini AI to generate personalized trip suggestions based on:

- Country/location preference
- Trip type (hiking, cycling, walking)
- Distance requirements (5-15 km round trips)

Generated trips include:

- Trip name and description
- Logistics and access information
- GPS coordinates for key spots
- Interactive map visualization

## Development Notes

- The server uses file-based storage for simplicity (users.json)
- In production, consider migrating to a proper database
- Ensure the Gemini API key is kept secure and not committed to version control
- The application includes CORS configuration for local development

## Troubleshooting

1. **Server won't start**: Check if port 5000 is available
2. **Client won't start**: Check if port 3000 is available
3. **Trip generation fails**: Verify your Gemini API key is correct
4. **Map not displaying**: Ensure leaflet CSS is loaded properly

## License

This project is for educational purposes.
