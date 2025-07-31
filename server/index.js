const cors = require('cors');
const express = require('express');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const axios = require('axios');
require("dotenv").config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json()); // allows JSON parsing in requests
app.use(bodyParser.json());

// Temp "database"
const USERS_FILE = 'users.json';

// Utility: Load users from file
function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  const data = fs.readFileSync(USERS_FILE);
  return JSON.parse(data);
}

// Utility: Save users to file
function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// POST
// Route: Register
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body; 
    const users = loadUsers();
  
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
  
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
  
    const newUser = { username, email, password: hashedPassword };
    users.push(newUser);
    saveUsers(users);
  
    res.status(201).json({ message: 'User registered successfully' });
  });
  
// Secret key for signing JWTs — in real apps, put this in .env
const JWT_SECRET = 'my_super_secret_key'; // change this in production

// POST
// Route: Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const users = loadUsers();

    const user = users.find(u => u.email === email);
    if (!user) {
        return res.status(400).json({ message: 'Invalid password' });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(400).json({ message: 'Invalid password' });
    }

    const token = jwt.sign({ email: user.email, username: user.username }, JWT_SECRET, { expiresIn: '1h' });

    res.json({ message: 'Login successful', token });
});

// Middleware: Verify JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Token is required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'invalid token' });
        req.user = user;
        next();
    });
}

// GET
// Route: Protected
app.get('/protected', authenticateToken, (req, res) => {
    res.json({ message: `Hello ${req.user.username}, you have access to protected content` });
});

// POST
// Route: Generate Trip Route (Protected)
app.post("/api/generate-route", authenticateToken, async (req, res) => {
    const { country, type } = req.body;

    const prompt = `give my a ${type} trip in ${country} that meets **all** the following criteria:
    ${type == "hiking" ? hicking_critiria : cycling_critiria}
    Include the following in your response:
    - Total distance of the entire trek.
    - General information about the trek.
    - For each day:
    - A description of the day, including where it starts and ends, and where to sleep if the trek is multiple days.
    - A list of spots visited in order of visit including spot of sleep.
    - A main list of all **spots in order of visit for the whole trek**.
    - Practical logistics: how to access the trek, how to get there, and where it begins.
    - Weather: show the weather in the trek location for the next 3 days  

    
    Return the response as a JSON object with the following fields:
    {
        "name": "Name of the trek",
        "description": "1-2 paragraphs about the place, how many days, total distance, total distance per day(only if multiple days)",
        "logistics": "practical info: starting point, access, transport",
        "spots_names": ["Place1", "Place2", ...],
        "spots": [
        { "name": "Place1", "lat": 44.1234, "lng": 1.5678 },
        { "name": "Place2", "lat": 44.4567, "lng": 1.7890 }
        ],
        "daily_info": [
            {
                "day": 1,
                "description": "Short description of this day's hike, where it starts and ends",
                "day_locations": [
                { "name": "Place1", "lat": 44.1234, "lng": 1.5678 },
                { "name": "Place2", "lat": 44.4567, "lng": 1.7890 },
                { "name": "Place3", "lat": 44.4567, "lng": 1.7890 }
                ],
                "distance_km": 12
            },
            {
                "day": 2,
                "description": "Short description of this day's hike, where it starts and ends",
                "day_locations": [
                { "name": "Place4", "lat": 44.1234, "lng": 1.5678 },
                { "name": "Place5", "lat": 44.4567, "lng": 1.7890 },
                { "name": "Place6", "lat": 44.4567, "lng": 1.7890 }
                ], 
                "distance_km": 9
            }
        ],
        "total_distance_km": 21,
        "weather": [
            {"degrees": 30, "description": sunny},
            {"degrees": 30, "description": sunny},
            {"degrees": 30, "description": sunny},
        ]
    }


    IMPORTANT: Do NOT explain anything outside the JSON.`;

    const hicking_critiria = `The trek must be a **round trip**: it starts and ends at the same location.
    The total distance per day should be between 5 and 15 kilometers.
    The trek can be one day or multiple days, but each day must be within this range.`

    const cycling_critiria = `the cycling trek must be 2 days from city to city.
    The maximum distance per day is 60 kilometers.`

    try {
        const geminiRes = await axios.post(
            "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=" + process.env.GEMINI_API_KEY,
            {
                "contents": [
                    {
                        "parts": [
                            { text: prompt }       
                        ]
                    }
                ]
            }
        );

        const content = geminiRes.data.candidates[0].content.parts[0].text;
        console.log("Raw Gemini text:", content);

        const jsonString = content.replace(/```json|```/g, '').trim();

        let tripData;
        try {
            tripData = JSON.parse(jsonString)
        } catch (parseError) {
            console.error("JSON parse error:", parseError);
            return res.status(500).json({ error: "Failed to parse Gemini JSON response" });
        }

        console.log("Parsed trip data:", tripData);
        res.json(tripData);

    } catch (error) {
        console.error("Gemini Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to generate trip" });
    }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
