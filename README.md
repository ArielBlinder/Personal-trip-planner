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
git clone https://github.com/ArielBlinder/Personal-trip-planner.git
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

