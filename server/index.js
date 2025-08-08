require("dotenv").config();

const cors = require('cors');
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const axios = require('axios');
const connectDB = require('./config/database');
const User = require('./models/User');
const Route = require('./models/Route');
const weatherService = require('./services/weatherService');

// Connect to MongoDB
connectDB();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json()); // JSON parsing in requests
app.use(bodyParser.json());

// Secret key for signing JWTs in real apps, put this in .env
const JWT_SECRET = process.env.JWT_SECRET; // 

// POST
// Route: Register
app.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body; 
        
        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }
  
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
  
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
  
        const newUser = new User({ 
            username: username.trim(), 
            email: email.trim().toLowerCase(), 
            password: hashedPassword 
        });
        
        await newUser.save();
  
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
  
// POST
// Route: Login
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email: email.trim().toLowerCase() });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ 
            userId: user._id,
            email: user.email, 
            username: user.username 
        }, JWT_SECRET, { expiresIn: '24h' });

        res.json({ 
            message: 'Login successful', 
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Middleware: Verify JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Token is required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user; // Contains userId, email, username
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


    const hiking_criteria = `The trek must be a **round trip**: it starts and ends at the same location.
    The total distance per day should be between 5 and 15 kilometers.
    The trek can be one day or multiple days, but each day must be within this range.`

    const cycling_criteria = `the cycling trek must be 2 days from city to city.

    The maximum distance per day is 60 kilometers.`

    const prompt = `give my a ${type} trip in ${country} that meets **all** the following criteria:
    ${type == "hiking" ? hiking_criteria : cycling_criteria}
    Include the following in your response:
    - Total distance of the entire trek.
    - General information about the trek.
    - A list of all **spots in order of visit for the whole trek**.
    - The coordinates of the spots must be accurate for use in openstreetmap.org 
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

        // Replace LLM weather with real weather forecast
        if (tripData.spots && tripData.spots.length > 0) {
            const startLocation = tripData.spots[0];
            try {
                const realWeather = await weatherService.getThreeDayForecast(startLocation.lat, startLocation.lng);
                tripData.weather = realWeather;
                console.log("Updated trip data with real weather");
            } catch (weatherError) {
                console.warn("Failed to fetch real weather, keeping LLM weather:", weatherError.message);
                // Keep the LLM weather as fallback
            }
        }

        console.log("Parsed trip data:", tripData);
        res.json(tripData);

    } catch (error) {
        console.error("Gemini Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to generate trip" });
    }
});

// POST
// Route: Save Route (Protected)
app.post('/api/routes/save', authenticateToken, async (req, res) => {
    try {
        const { routeData, userRouteName, userRouteDescription } = req.body;
        
        if (!routeData || !userRouteName) {
            return res.status(400).json({ message: 'Route data and name are required' });
        }

        // Check if route name already exists for this user
        const existingRoute = await Route.findOne({ 
            userId: req.user.userId, 
            userRouteName: userRouteName.trim() 
        });
        
        if (existingRoute) {
            return res.status(400).json({ message: 'Route name already exists. Please choose a different name.' });
        }

        // Create new route with explicit field mapping excluding weather 
        const route = new Route({
            name: routeData.name,
            description: routeData.description,
            logistics: routeData.logistics,
            country: routeData.country,
            type: routeData.type,
            spots_names: routeData.spots_names || [],
            spots: routeData.spots || [],
            daily_info: routeData.daily_info || [],
            total_distance_km: routeData.total_distance_km || 0,
            weather: [], // don't save weather data
            userId: req.user.userId,
            userRouteName: userRouteName.trim(),
            userRouteDescription: userRouteDescription?.trim() || ''
        });

        await route.save();

        res.status(201).json({ 
            message: 'Route saved successfully',
            routeId: route._id
        });
    } catch (error) {
        console.error('Save route error:', error);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            userId: req.user?.userId,
            routeData: req.body?.routeData,
            userRouteName: req.body?.userRouteName
        });
        res.status(500).json({ 
            message: `Failed to save route: ${error.message}`,
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// GET
// Route: Get Users Saved Routes 
app.get('/api/routes', authenticateToken, async (req, res) => {
    try {
        const routes = await Route.find({ userId: req.user.userId })
            .select('userRouteName userRouteDescription country type total_distance_km createdAt')
            .sort({ createdAt: -1 });

        res.json(routes);
    } catch (error) {
        console.error('Get routes error:', error);
        res.status(500).json({ message: 'Failed to fetch routes' });
    }
});

// GET
// Route: Get Specific Route Details
app.get('/api/routes/:routeId', authenticateToken, async (req, res) => {
    try {
        const { routeId } = req.params;
        
        const route = await Route.findOne({ 
            _id: routeId, 
            userId: req.user.userId 
        });

        if (!route) {
            return res.status(404).json({ message: 'Route not found' });
        }

        res.json(route);
    } catch (error) {
        console.error('Get route error:', error);
        res.status(500).json({ message: 'Failed to fetch route' });
    }
});

// DELETE
// Route: Delete Saved Route
app.delete('/api/routes/:routeId', authenticateToken, async (req, res) => {
    try {
        const { routeId } = req.params;
        
        const route = await Route.findOneAndDelete({ 
            _id: routeId, 
            userId: req.user.userId 
        });

        if (!route) {
            return res.status(404).json({ message: 'Route not found' });
        }

        res.json({ message: 'Route deleted successfully' });
    } catch (error) {
        console.error('Delete route error:', error);
        res.status(500).json({ message: 'Failed to delete route' });
    }
});

// GET
// Route: Get Weather Forecast (Protected)
app.get('/api/weather', authenticateToken, async (req, res) => {
    try {
        const { lat, lng } = req.query;
        
        if (!lat || !lng) {
            return res.status(400).json({ message: 'Latitude and longitude are required' });
        }

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);

        if (isNaN(latitude) || isNaN(longitude)) {
            return res.status(400).json({ message: 'Invalid latitude or longitude' });
        }

        const weatherForecast = await weatherService.getThreeDayForecast(latitude, longitude);
        
        res.json({
            location: { lat: latitude, lng: longitude },
            forecast: weatherForecast
        });
    } catch (error) {
        console.error('Weather API error:', error);
        res.status(500).json({ 
            message: 'Failed to fetch weather data',
            forecast: weatherService.getFallbackWeather()
        });
    }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
