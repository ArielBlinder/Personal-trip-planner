const express = require('express');
const axios = require('axios');
const Route = require('../models/Route');
const { authenticateToken } = require('../middleware/auth');
const weatherService = require('../services/weatherService');

const router = express.Router();

// generate trip (minimal validation)
router.post('/generate', authenticateToken, async (req, res, next) => {
  try {
    const { country, type } = req.body || {};
    if (!country || !type) return res.status(400).json({ message: 'country and type are required' });

    const tripCriteria = {
      hiking: `The trek must be a *round trip*: it starts and ends at the same location.
        The total distance per day should be between 5 and 15 kilometers.
        The trek can be one day or multiple days, but each day must be within this range.
        IMPORTANT: Hiking routes should prioritize trails, paths, gravel roads, and offroad routes suitable for hiking. 
        Avoid major highways and busy roads when possible. Include hiking trails, forest paths, mountain trails, dirt roads, and gravel paths.
        
        CRITICAL FOR ROUTING: Provide MORE waypoints along the actual hiking trail route (every 1-2km) to ensure the routing system follows the correct paths.
        Include intermediate waypoints at trail junctions, bridges, viewpoints, and other significant trail markers to guide the routing algorithm along the actual hiking paths.`,
      
      cycling: `The cycling trek must be 2 days from city to city.
        The maximum distance per day is 60 kilometers.`
    };


    const prompt = `Create a detailed ${type} trip in ${country} that meets all the following criteria.
    
    COORDINATE ACCURACY IS CRITICAL: You must provide precise, real-world coordinates that correspond to actual ${type === 'hiking' ? 'trails, trailheads, and hiking waypoints' : 'roads, towns, and cycling routes'}. Inaccurate coordinates will break the mapping system.
    
    Trip Requirements:
    ${tripCriteria[type]}
        

    *Coordinate Verification (MANDATORY):*
    1. For every place name (trailhead, junction, scenic point, town, etc.), search on *Wikidata*.
    2. Find the exact matching Wikidata item (QID) that represents the real location.
    3. Extract the official *coordinate location (P625)*.
    4. Only use verified points that exist in Wikidata — if not available, use the closest *mapped* point with a QID.
    5. DO NOT include locations that don't exist in Wikidata or on the map.

        *Response Must Include:*
    - Total trek distance.
    - General description of the trek.
    - A complete ordered list of *ALL waypoints* with highly accurate coordinates.
    - For each day limit the maximum waypoints to 4.
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

    const ai = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      { model: 'moonshotai/kimi-k2-instruct', messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 4000 },
      { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` } }
    );

    const raw = ai.data.choices[0].message.content || '{}';
    const json = raw.replace(/```json|```/g, '').trim();
    const trip = JSON.parse(json);
    trip.country = country;
    trip.type = type;

    if (trip.spots?.length) {
      const { lat, lng } = trip.spots[0];
      trip.weather = await weatherService.getThreeDayForecast(lat, lng);
    }

    res.json(trip);
  } catch (err) {
    // if parse fails or AI fails we still bubble to global error handler
    next(err);
  }
});

// save trip (let model validate)
router.post('/save', authenticateToken, async (req, res, next) => {
  try {
    const { routeData, userRouteName, userRouteDescription = '' } = req.body || {};
    if (!routeData || !userRouteName) return res.status(400).json({ message: 'routeData and userRouteName are required' });

    const route = await Route.create({
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
      userRouteName: String(userRouteName).trim(),
      userRouteDescription: String(userRouteDescription).trim()
    });

    res.status(201).json({ message: 'ok', routeId: route._id });
  } catch (err) {
    next(err);
  }
});

// list routes
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const routes = await Route.find({ userId: req.user.userId })
      .select('userRouteName userRouteDescription country type total_distance_km createdAt')
      .sort({ createdAt: -1 });
    res.json(routes);
  } catch (err) {
    next(err);
  }
});

// get by id (no regex; rely on CastError)
router.get('/:routeId', authenticateToken, async (req, res, next) => {
  try {
    const route = await Route.findOne({ _id: req.params.routeId, userId: req.user.userId });
    if (!route) return res.status(404).json({ message: 'Route not found' });
    res.json(route);
  } catch (err) {
    next(err);
  }
});

// delete
router.delete('/:routeId', authenticateToken, async (req, res, next) => {
  try {
    const route = await Route.findOneAndDelete({ _id: req.params.routeId, userId: req.user.userId });
    if (!route) return res.status(404).json({ message: 'Route not found' });
    res.json({ message: 'ok', deletedRoute: { id: route._id, name: route.userRouteName } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
