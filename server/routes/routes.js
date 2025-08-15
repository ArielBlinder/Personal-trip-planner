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
      hiking: `Round trip. 5–15km per day. Prefer trails/paths; avoid highways. Provide frequent trail waypoints for routing.`,
      cycling: `2 days from city to city. Max 60km per day.`
    };

    const prompt = `Create a detailed ${type} trip in ${country}.
Trip Requirements:
${tripCriteria[type] || ''}

Return JSON with:
{
  "name": "...",
  "description": "...",
  "logistics": "...",
  "spots_names": ["..."],
  "spots": [{ "name": "...", "lat": 0, "lng": 0 }],
  "daily_info": [{ "day": 1, "description": "...", "day_locations": [{ "name":"...", "lat":0, "lng":0 }], "distance_km": 0 }],
  "total_distance_km": 0,
  "country": "${country}",
  "type": "${type}"
}
IMPORTANT: Return ONLY JSON (no prose).`;

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
