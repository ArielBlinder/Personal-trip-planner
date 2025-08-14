const express = require('express');
const axios = require('axios');
const Route = require('../models/Route');
const { authenticateToken } = require('../middleware/auth');
const weatherService = require('../services/weatherService');

const router = express.Router();

/**
 * POST /generate
 * Generate a new trip route using AI
 */
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { country, type } = req.body;

    // Input validation
    if (!country || !type) {
      return res.status(400).json({ 
        message: 'Country and type are required',
        error: 'MISSING_PARAMETERS'
      });
    }

    // Validate trip type
    const validTypes = ['hiking', 'cycling'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        message: 'Invalid trip type. Must be hiking or cycling',
        error: 'INVALID_TYPE'
      });
    }

    // Trip criteria definitions
    const tripCriteria = {
      hiking: `The trek must be a **round trip**: it starts and ends at the same location.
        The total distance per day should be between 5 and 15 kilometers.
        The trek can be one day or multiple days, but each day must be within this range.
        IMPORTANT: Hiking routes should prioritize trails, paths, gravel roads, and offroad routes suitable for hiking. 
        Avoid major highways and busy roads when possible. Include hiking trails, forest paths, mountain trails, dirt roads, and gravel paths.
        
        CRITICAL FOR ROUTING: Provide MORE waypoints along the actual hiking trail route (every 1-2km) to ensure the routing system follows the correct paths.
        Include intermediate waypoints at trail junctions, bridges, viewpoints, and other significant trail markers to guide the routing algorithm along the actual hiking paths.`,
      
      cycling: `The cycling trek must be 2 days from city to city.
        The maximum distance per day is 60 kilometers.`
    };

    // Build AI prompt
    const prompt = `Create a detailed ${type} trip in ${country} that meets *all* the following criteria.
    
    *COORDINATE ACCURACY IS CRITICAL*: You must provide precise, real-world coordinates that correspond to actual ${type === 'hiking' ? 'trails, trailheads, and hiking waypoints' : 'roads, towns, and cycling routes'}. Inaccurate coordinates will break the mapping system.
    
Trip Requirements:
    ${tripCriteria[type]}
    
*Coordinate Verification (MANDATORY):*
1. For every place name (trailhead, junction, scenic point, town, etc.), search on *Wikidata*.
2. Find the exact matching Wikidata item (QID) that represents the real location.
3. Extract the official *coordinate location (P625)*.
4. Only use verified points that exist in Wikidata — if not available, use the closest *mapped* point with a QID.
5. DO NOT include locations that don't exist in Wikidata or on the map.

---

    *Response Must Include:*
- Total trek distance.
- General description of the trek.
- A complete ordered list of *ALL waypoints* with highly accurate coordinates.
- For each day use maximum 4 waypoints.
- For hiking: Use trailheads, huts, trail junctions, markers.
- For cycling: Use towns, road crossings, scenic road points.
- Ensure ALL coordinates are inside the specified *country* and fit the activity type.
- For each day:
  - A short summary (start, end, overnight location)
  - Ordered list of locations visited (with coordinates)

---

    

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
    "country": "${country}",
    "type": "${type}"
}
    *IMPORTANT:* Return ONLY a JSON object in the exact structure below. DO NOT include explanations.
`;

    // Call AI service
    const groqResponse = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "moonshotai/kimi-k2-instruct",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 4000
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const content = groqResponse.data.choices[0].message.content;
    console.log("Raw AI response:", content);

    // Parse JSON response
    const jsonString = content.replace(/```json|```/g, '').trim();
    let tripData;
    
    try {
      tripData = JSON.parse(jsonString);
      
      // Ensure required fields
      tripData.country = country;
      tripData.type = type;
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return res.status(500).json({ 
        message: "Failed to parse AI response",
        error: 'AI_PARSE_ERROR'
      });
    }

    // Add real weather data
    if (tripData.spots && tripData.spots.length > 0) {
      const startLocation = tripData.spots[0];
      try {
        const realWeather = await weatherService.getThreeDayForecast(
          startLocation.lat, 
          startLocation.lng
        );
        tripData.weather = realWeather;
        console.log("Added real weather data to trip");
      } catch (weatherError) {
        console.warn("Failed to fetch weather, using fallback:", weatherError.message);
        tripData.weather = weatherService.getFallbackWeather();
      }
    }

    console.log("Generated trip data for user:", req.user.userId);
    res.json(tripData);

  } catch (error) {
    console.error("Route generation error:", error);
    
    if (error.response?.status === 429) {
      return res.status(429).json({ 
        message: "AI service rate limit exceeded. Please try again later.",
        error: 'RATE_LIMIT_EXCEEDED'
      });
    }
    
    res.status(500).json({ 
      message: "Failed to generate trip route",
      error: 'GENERATION_ERROR'
    });
  }
});

/**
 * POST /save
 * Save a generated route to user's collection
 */
router.post('/save', authenticateToken, async (req, res) => {
  try {
    const { routeData, userRouteName, userRouteDescription } = req.body;
    
    // Input validation
    if (!routeData || !userRouteName) {
      return res.status(400).json({ 
        message: 'Route data and name are required',
        error: 'MISSING_ROUTE_DATA'
      });
    }

    // Validate route name length
    if (userRouteName.trim().length < 3) {
      return res.status(400).json({ 
        message: 'Route name must be at least 3 characters long',
        error: 'ROUTE_NAME_TOO_SHORT'
      });
    }

    // Check for duplicate route names for this user
    const existingRoute = await Route.findOne({ 
      userId: req.user.userId, 
      userRouteName: userRouteName.trim() 
    });
    
    if (existingRoute) {
      return res.status(409).json({ 
        message: 'Route name already exists. Please choose a different name.',
        error: 'DUPLICATE_ROUTE_NAME'
      });
    }

    // Create new route
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
    res.status(500).json({ 
      message: 'Failed to save route',
      error: 'SAVE_ERROR'
    });
  }
});

/**
 * GET /
 * Get all saved routes for the authenticated user
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const routes = await Route.find({ userId: req.user.userId })
      .select('userRouteName userRouteDescription country type total_distance_km createdAt')
      .sort({ createdAt: -1 });

    res.json(routes);

  } catch (error) {
    console.error('Get routes error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch routes',
      error: 'FETCH_ERROR'
    });
  }
});

/**
 * GET /:routeId
 * Get specific route details
 */
router.get('/:routeId', authenticateToken, async (req, res) => {
  try {
    const { routeId } = req.params;
    
    // Validate ObjectId format
    if (!routeId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        message: 'Invalid route ID format',
        error: 'INVALID_ROUTE_ID'
      });
    }
    
    const route = await Route.findOne({ 
      _id: routeId, 
      userId: req.user.userId 
    });

    if (!route) {
      return res.status(404).json({ 
        message: 'Route not found',
        error: 'ROUTE_NOT_FOUND'
      });
    }

    res.json(route);

  } catch (error) {
    console.error('Get route error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch route',
      error: 'FETCH_ERROR'
    });
  }
});

/**
 * DELETE /:routeId
 * Delete a saved route
 */
router.delete('/:routeId', authenticateToken, async (req, res) => {
  try {
    const { routeId } = req.params;
    
    // Validate ObjectId format
    if (!routeId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        message: 'Invalid route ID format',
        error: 'INVALID_ROUTE_ID'
      });
    }
    
    const route = await Route.findOneAndDelete({ 
      _id: routeId, 
      userId: req.user.userId 
    });

    if (!route) {
      return res.status(404).json({ 
        message: 'Route not found',
        error: 'ROUTE_NOT_FOUND'
      });
    }

    res.json({ 
      message: 'Route deleted successfully',
      deletedRoute: {
        id: route._id,
        name: route.userRouteName
      }
    });

  } catch (error) {
    console.error('Delete route error:', error);
    res.status(500).json({ 
      message: 'Failed to delete route',
      error: 'DELETE_ERROR'
    });
  }
});

module.exports = router;
