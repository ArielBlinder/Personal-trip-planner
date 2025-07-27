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

    const prompt = `give my a ${type} trip in distance between 5 to 15 kilometes in ${country}.
    The hiking trek needs to be a round trip (starts and ends at the same place). 
    Show the distance of the trek, and if it's for a cpuple of days show it's total distance and distance per day.
    Write a short discription about the place
    
    Return the response as a JSON object with the following fields:
    {
        "name": "Name of the trek",
        "description": "1-2 paragraphs about the place",
        "logistics": "practical info: starting point, access, transport",
        "spots_names": ["Place1", "Place2", ...],
        "spots": [
            { "name": "Place1", "lat": 44.1234, "lng": 1.5678 },
            { "name": "Place2", "lat": 44.4567, "lng": 1.7890 }
        ]
    }

    IMPORTANT: Do NOT explain anything outside the JSON.`;

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
