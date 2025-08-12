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
const unsplashService = require('./services/unsplashService');

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
    res.json({ message: `Hello ${req.user.username}, Welcome back, what would you like to do?` });
});

// POST
// Route: Generate Trip Route (Protected)
app.post("/api/generate-route", authenticateToken, async (req, res) => {
    const { country, type } = req.body;


    const hiking_criteria = `The trek must be a **round trip**: it starts and ends at the same location.
    The total distance per day should be between 5 and 15 kilometers.
    The trek can be one day or multiple days, but each day must be within this range.
    IMPORTANT: Hiking routes should prioritize trails, paths, gravel roads, and offroad routes suitable for hiking. 
    Avoid major highways and busy roads when possible. Include hiking trails, forest paths, mountain trails, dirt roads, and gravel paths.
    
    CRITICAL FOR ROUTING: Provide MORE waypoints along the actual hiking trail route (every 1-2km) to ensure the routing system follows the correct paths.
    Include intermediate waypoints at trail junctions, bridges, viewpoints, and other significant trail markers to guide the routing algorithm along the actual hiking paths.`

    const cycling_criteria = `the cycling trek must be 2 days from city to city.

    The maximum distance per day is 60 kilometers.`

    const prompt = `Create a detailed ${type} trip in ${country} that meets **all** the following criteria.
    
    **COORDINATE ACCURACY IS CRITICAL**: You must provide precise, real-world coordinates that correspond to actual ${type === 'hiking' ? 'trails, trailheads, and hiking waypoints' : 'roads, towns, and cycling routes'}. Inaccurate coordinates will break the mapping system.
    
    Requirements:
    ${type == "hiking" ? hiking_criteria : cycling_criteria}
    Include the following in your response:
    - Total distance of the entire trek.
    - General information about the trek.
    - A list of all **spots in order of visit for the whole trek**.
    - The coordinates of the spots must be EXTREMELY ACCURATE and correspond to real locations
    - CRITICAL: Use precise coordinates from authoritative mapping sources (OpenStreetMap, official trail databases, or verified geographic databases)
    - Provide coordinates with AT LEAST 6-8 decimal places for maximum precision (e.g., 44.123456, 1.567890)
    - For hiking: coordinates must correspond to actual trailheads, trail junctions, bridges, viewpoints, mountain huts, trail markers, or specific points ALONG the hiking trail (not just destinations)
    - For cycling: coordinates must correspond to actual road junctions, towns, scenic stops, or cycling route waypoints
    - Include MORE intermediate waypoints (every 1-2km) to help routing algorithms follow the correct trail/path instead of creating straight lines
    - Verify coordinates represent accessible locations for the chosen activity type
    - Double-check that coordinates are in the correct country and region specified
    - For each day:
    - A description of the day, including where it starts and ends, and where to sleep if the trek is multiple days.
    - A list of spots visited in order of visit including spot of sleep.
    - A main list of all **spots in order of visit for the whole trek**.
    - Practical logistics: how to access the trek, how to get there, and where it begins.


    
    Return the response as a JSON object with the following fields:
    {
        "name": "Name of the trek",
        "description": "1-2 paragraphs about the place, how many days, total distance, total distance per day(only if multiple days)",
        "logistics": "practical info: starting point, access, transport",
        "spots_names": ["Place1", "Place2", ...],
        "spots": [
        { "name": "Specific Trail Name or Landmark", "lat": 44.123456, "lng": 1.567890 },
        { "name": "Exact Waypoint or Junction", "lat": 44.456789, "lng": 1.789012 }
        ],
        "daily_info": [
            {
                "day": 1,
                "description": "Short description of this day's hike, where it starts and ends",
                "day_locations": [
                { "name": "Trailhead Parking", "lat": 44.123456, "lng": 1.567890 },
                { "name": "Trail Junction", "lat": 44.456789, "lng": 1.789012 },
                { "name": "Mountain Hut", "lat": 44.456123, "lng": 1.789345 }
                ],
                "distance_km": 12
            },
            {
                "day": 2,
                "description": "Short description of this day's hike, where it starts and ends",
                "day_locations": [
                { "name": "Valley Viewpoint", "lat": 44.123456, "lng": 1.567890 },
                { "name": "Forest Trail", "lat": 44.456789, "lng": 1.789012 },
                { "name": "Summit Peak", "lat": 44.456123, "lng": 1.789345 }
                ], 
                "distance_km": 9
            }
        ],
        "total_distance_km": 21,
        
    }


    IMPORTANT: Do NOT explain anything outside the JSON.`;

    try {
        const groqRes = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                "model": "meta-llama/llama-4-scout-17b-16e-instruct",
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "temperature": 0.7,
                "max_tokens": 4000
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const content = groqRes.data.choices[0].message.content;
        console.log("Raw Groq text:", content);

        const jsonString = content.replace(/```json|```/g, '').trim();

        let tripData;
        try {
            tripData = JSON.parse(jsonString)
        } catch (parseError) {
            console.error("JSON parse error:", parseError);
            return res.status(500).json({ error: "Failed to parse Groq JSON response" });
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
        console.error("Groq Error:", error.response?.data || error.message);
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

// GET
// Route: Get Country Image (Protected)
app.get('/api/country-image', authenticateToken, async (req, res) => {
    try {
        const { country } = req.query;
        
        if (!country) {
            return res.status(400).json({ message: 'Country parameter is required' });
        }

        const imageData = await unsplashService.getCountryImage(country.trim());
        
        res.json({
            country: country.trim(),
            image: imageData
        });
    } catch (error) {
        console.error('Country image API error:', error);
        res.status(500).json({ 
            message: 'Failed to fetch country image',
            image: unsplashService.getFallbackImage(country || 'landscape')
        });
    }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
