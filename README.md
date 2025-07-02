# Personal-trip-planner

A full-stack web application for planning personal trips, built with React (frontend) and Node.js (backend).

## Prerequisites

- Node.js (version 14 or higher)
- npm (comes with Node.js)

## Project Structure

```
Personal-trip-planner/
├── client/          # React frontend application
├── server/          # Node.js backend API
└── README.md
```

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Personal-trip-planner
```

### 2. Install Dependencies

Install dependencies for both client and server:

```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

### 3. Running the Application

You'll need to run both the client and server in separate terminal windows.

#### Running the Server (Backend)

```bash
# From the project root directory
cd server
node index.js
```

The server will start on the default port (usually 3001 or 5000 - check the console output).

#### Running the Client (Frontend)

```bash
# From the project root directory (in a new terminal window)
cd client
npm start
```

The React development server will start and automatically open your browser to `http://localhost:3000`.

## Development Workflow

1. **Start the server first** - The backend API needs to be running for the frontend to work properly
2. **Start the client** - The React app will connect to the backend API
3. **Development** - Both servers support hot reload, so changes will be reflected automatically

## Available Scripts

### Client Scripts

- `npm start` - Runs the React app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App (irreversible)

### Server Scripts

- `node index.js` - Starts the Node.js server
- `npm test` - Runs tests (currently not implemented)

## Ports

- **Frontend (React)**: http://localhost:3000
- **Backend (Node.js)**: Check console output for the actual port (typically 3001 or 5000)

## Features

- User authentication (login/register)
- Trip planning dashboard
- RESTful API backend
- JWT-based authentication

## Troubleshooting

### Port Already in Use

If you get a port error, make sure no other applications are running on the same ports, or modify the port configuration in the respective applications.

### Dependencies Issues

If you encounter dependency issues, try:

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules
npm install
```
