import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import WeatherDisplay from './WeatherDisplay';
import CountryImage from './CountryImage';
import { weatherAPI } from '../utils/api';
import { MAP_CONFIG, ROUTING_PROFILES } from '../utils/constants';
import 'leaflet-routing-machine';
import 'lrm-graphhopper';
import polyline from '@mapbox/polyline';

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

function GeneratedTrip({ tripData, isLoadedRoute, onSaveClick }) {
  const mapRef = useRef(null);
  const routeRefs = useRef([]);
  const [mapReady, setMapReady] = useState(false);
  const [currentWeather, setCurrentWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);

  const dayColors = useCallback(() => MAP_CONFIG.ROUTE_COLORS, []);

  // Handle map ready event
  const handleMapReady = useCallback(() => {
    setMapReady(true);
  }, []);

  // Fetch weather for loaded routes
  const fetchWeatherForRoute = useCallback(async (routeData) => {
    if (!routeData?.spots?.length || !isLoadedRoute) {
      return;
    }

    setLoadingWeather(true);
    try {
      const startLocation = routeData.spots[0];
      const weatherData = await weatherAPI.getThreeDayForecast(startLocation.lat, startLocation.lng);
      setCurrentWeather(weatherData.forecast);
    } catch (err) {
      console.error('Failed to fetch weather for loaded route:', err);
      setCurrentWeather(null);
    } finally {
      setLoadingWeather(false);
    }
  }, [isLoadedRoute]);

  // Refresh weather manually
  const handleRefreshWeather = useCallback(async () => {
    if (tripData?.spots?.length) {
      setLoadingWeather(true);
      try {
        const startLocation = tripData.spots[0];
        const weatherData = await weatherAPI.getThreeDayForecast(startLocation.lat, startLocation.lng);
        setCurrentWeather(weatherData.forecast);
      } catch (err) {
        console.error('Failed to refresh weather:', err);
      } finally {
        setLoadingWeather(false);
      }
    }
  }, [tripData]);


  useEffect(() => {
  if (!tripData?.spots?.length || !mapRef.current || !mapReady || !tripData.daily_info?.length)
    return;

  const currentMap = mapRef.current;

  // Helper to decode encoded polyline from GraphHopper response
  const decodePolyline = (encoded) => {
  // Decode to array of [lat, lng]
  const coords = polyline.decode(encoded);
  // Map to Leaflet LatLng objects
  return coords.map(([lat, lng]) => L.latLng(lat, lng));
};

  const fetchRouteFromGraphHopper = async (waypoints) => {
    // Convert waypoints to [lng, lat] as required by GraphHopper
    const points = waypoints.map(p => [p.lng, p.lat]);

    const body = {
      profile: tripData.type === 'cycling' ? 'bike' : 'foot',
      points,
      locale: 'en',
      instructions: false,
      points_encoded: true,
    };

    const params = new URLSearchParams({
      key: process.env.REACT_APP_GRAPHHOPPER_API_KEY
    });

    const res = await fetch(`https://graphhopper.com/api/1/route?${params.toString()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      console.error('GraphHopper routing failed:', res.status);
      return null;
    }

    return await res.json();
  };

  const timeoutId = setTimeout(async () => {
    try {
      if (!currentMap) return;

      const bounds = L.latLngBounds(tripData.spots.map(s => [s.lat, s.lng]));
      currentMap.fitBounds(bounds, { padding: MAP_CONFIG.MARKER_BOUNDS_PADDING });

      // Remove previous polylines/routes
      routeRefs.current.forEach(layer => {
        if (currentMap.hasLayer(layer)) {
          currentMap.removeLayer(layer);
        }
      });
      routeRefs.current = [];

      // For each day, request route and draw polyline
      for (let index = 0; index < tripData.daily_info.length; index++) {
        const day = tripData.daily_info[index];
        if (!day.day_locations || day.day_locations.length === 0) continue;

        const color = dayColors()[index % dayColors().length];
        const waypoints = day.day_locations.map(location => ({
          lat: location.lat,
          lng: location.lng
        }));

        try {
          const routeData = await fetchRouteFromGraphHopper(waypoints);
          console.log('GraphHopper route response:', routeData);

          if (routeData && routeData.paths && routeData.paths.length > 0) {
            const coordinates = decodePolyline(routeData.paths[0].points);

            const polyline = L.polyline(coordinates, {
              color,
              opacity: 0.8,
              weight: 4
            }).addTo(currentMap);

            routeRefs.current.push(polyline);
          } else {
            console.warn(`No route found for day ${index + 1}`);
          }
        } catch (error) {
          console.error(`Error creating route for day ${index + 1}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in map rendering:', error);
    }
  }, 500);

  return () => clearTimeout(timeoutId);

}, [tripData, mapReady, dayColors]);

  // Auto-fetch weather for loaded routes
  useEffect(() => {
    if (tripData && isLoadedRoute) {
      fetchWeatherForRoute(tripData);
    }
  }, [tripData, isLoadedRoute, fetchWeatherForRoute]);


  return (
    <div className='trip-container'>
      {/* Trip Details */}
      {tripData && (
        <div style={{ marginBottom: '20px' }}>
          <h3>{tripData.name}</h3>
          <p><strong>Description:</strong> {tripData.description}</p>
          <p><strong>Logistics:</strong> {tripData.logistics}</p>
          {tripData.spots_names && (
            <p><strong>Key Spots:</strong> {tripData.spots_names.join(', ')}</p>
          )}

          {/* Country Image Display */}
          {tripData.country && (
            <CountryImage country={tripData.country} />
          )}

          {/* Weather Display Component */}
          <WeatherDisplay 
            weatherData={currentWeather || tripData.weather}
            isLoading={loadingWeather}
            isForSavedRoute={isLoadedRoute}
            onRefresh={isLoadedRoute ? handleRefreshWeather : null}
          />

          <p><strong>Travel Plan:</strong>
            {tripData.daily_info.length > 1 ? (
              <ul>
                {tripData.daily_info.map((day, index) => (
                  <li key={index}>
                    <strong>Day {index + 1}:</strong> {day.description} <br></br> traveling distance: {day.distance_km} km.
                    <br></br><br></br>
                  </li>
                ))}
              </ul>
            ) : (
              <p>
                <strong>One day:</strong> {tripData.daily_info[0].description} <br></br> traveling distance: {tripData.daily_info[0].distance_km} km.
              </p>
            )}
          </p>

          {/* Save Route Button - Only show for newly generated routes */}
          {!isLoadedRoute && onSaveClick && (
            <div style={{ marginTop: '15px' }}>
              <button className='trip-save-btn' onClick={onSaveClick}>
                💾 Save This Route
              </button>
            </div>
          )}

          {/* Show indication for loaded routes */}
          {isLoadedRoute && (
            <div className="saved-route-indicator">
              This is a saved route loaded from your collection
            </div>
          )}
        </div>
      )}

      {/* Map */}
      <div className='map-container'>
        <MapContainer center={MAP_CONFIG.DEFAULT_CENTER} zoom={MAP_CONFIG.DEFAULT_ZOOM} style={{ height: '100%', width: '100%' }} ref={mapRef} whenReady={handleMapReady}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
          {tripData?.spots?.map((spot, index) => (
            <Marker key={index} position={[spot.lat, spot.lng]}>
              <Popup>{spot.name}</Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

export default memo(GeneratedTrip);