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

    // Add delay to ensure map is ready

    const timeoutId = setTimeout(() => {
      try {
        if (!mapRef.current) return; // Double-check map is still available

        const bounds = L.latLngBounds(tripData.spots.map(s => [s.lat, s.lng]));
        mapRef.current.fitBounds(bounds, { padding: MAP_CONFIG.MARKER_BOUNDS_PADDING });

        // Clear all previous route controls safely
        routeRefs.current.forEach(route => {
          try {
            if (route && mapRef.current && mapRef.current.hasLayer && mapRef.current.hasLayer(route)) {
              mapRef.current.removeControl(route);
            }
          } catch (error) {
            console.warn('Error removing route control:', error);
          }
        });
        routeRefs.current = [];

        tripData.daily_info.forEach((day, index) => {
          if (!day.day_locations || day.day_locations.length === 0) return;

          const color = dayColors()[index % dayColors().length];
          const waypoints = day.day_locations.map(location => L.latLng(location.lat, location.lng));

          // try {
          //   const res = await fetch("https://api.openrouteservice.org/v2/directions/foot-hiking/geojson", {
          //     method: "POST",
          //     headers: {
          //       "Authorization": "your_api_key_here",
          //       "Content-Type": "application/json"
          //     },
          //     body: JSON.stringify({
          //       coordinates: coordinates,  // must be [lng, lat]
          //       instructions: false
          //     })
          //   });

          //   if (!res.ok) {
          //     const errorDetails = await res.json();
          //     throw new Error(`ORS API error: ${res.status} - ${JSON.stringify(errorDetails)}`);
          //   }

          //   const geojson = await res.json();

          //   // Then render with Leaflet:
          //   const routeLayer = L.geoJSON(geojson, {
          //     style: { color: "blue", weight: 4, opacity: 0.8 }
          //   }).addTo(mapRef.current);

          //   routeRefs.current.push(routeLayer);

          // } catch (error) {
          //   console.error('Error fetching route:', error);
          // }

          try {
            const control = L.Routing.control({
              waypoints: waypoints,
              routeWhileDragging: false,
              draggableWaypoints: false,
              addWaypoints: false,
              show: false,
              router: L.Routing.osrmv1({
                serviceUrl: 'https://router.project-osrm.org/route/v1',
                profile: ROUTING_PROFILES[tripData.type] || ROUTING_PROFILES.hiking
              }),
              lineOptions: {
                styles: [{ color: color, opacity: 0.8, weight: 4 }]
              },
              createMarker: function () { return null; }
            });

            if (mapRef.current) {
              control.addTo(mapRef.current);

              control.on("routesfound", e => {
                // Route successfully found for this day
              });

              control.on("routingerror", e => {
                console.warn("Routing error for day", index + 1, e);
              });

              routeRefs.current.push(control);
            }
          } catch (error) {
            console.error(`Error creating route control for day ${index + 1}:`, error);
          }
        });

        // Hide routing instructions
        setTimeout(() => {
          const containers = document.querySelectorAll('.leaflet-routing-container');
          containers.forEach(container => {
            try {
              container.style.display = 'none';
            } catch (error) {
              console.warn('Error hiding routing container:', error);
            }
          });
        }, 1000);

      } catch (error) {
        console.error('Error in map rendering:', error);
      }
    }, 500);

   // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      // Clean up routes when component unmounts or tripData changes
      routeRefs.current.forEach(route => {
        try {
          if (route && mapRef.current && mapRef.current.hasLayer && mapRef.current.hasLayer(route)) {
            mapRef.current.removeControl(route);
          }
        } catch (error) {
          console.warn('Error removing route control on cleanup:', error);
        }
      });
      routeRefs.current = [];
    };
  }, [tripData, dayColors, mapReady]);

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