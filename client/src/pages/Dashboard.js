import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import SaveRouteModal from '../components/SaveRouteModal';
import SavedRoutesList from '../components/SavedRoutesList';
import RouteValidationWarnings from '../components/RouteValidationWarnings';

import { useMapRouting } from '../hooks/useMapRouting';
import { useRouteValidation } from '../hooks/useRouteValidation';
import { authAPI, weatherAPI } from '../utils/api';

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});



function Dashboard() {
  const [user, setUser] = useState('');
  const [country, setCountry] = useState('');
  const [type, setType] = useState('hiking');
  const [tripData, setTripData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [savedRoutesRefresh, setSavedRoutesRefresh] = useState(0);
  const [isLoadedRoute, setIsLoadedRoute] = useState(false);
  const [currentWeather, setCurrentWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const navigate = useNavigate();

  const defaultCenter = [32.0853, 34.7818];
  const mapRef = useRef(null);
  
  // Custom hooks for routing and validation
  const { addRoutesToMap, cleanup } = useMapRouting();
  const { validationResults, validateRoute, clearValidation } = useRouteValidation();



  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await authAPI.getProtectedData();
        setUser(data.message);
      } catch (err) {
        navigate('/login');
      }
    };

    fetchUserData();

    // Cleanup function for component unmount
    return () => {
      if (mapRef.current) {
        cleanup(mapRef.current);
      }
    };
  }, [navigate, cleanup]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleSaveSuccess = (routeId) => {
    alert('Route saved successfully!');
    // Refresh the saved routes list
    setSavedRoutesRefresh(prev => prev + 1);
  };

  const handleLoadRoute = (routeData) => {
    // Clear existing routes before loading new one using the hook
    if (mapRef.current) {
      cleanup(mapRef.current);
    }

    setTripData(routeData);
    setIsLoadedRoute(true); // This is a loaded route, don't show save button
    setCurrentWeather(null); // Clear any previous weather data
    
    // Automatically fetch fresh weather for the loaded route
    fetchWeatherForLoadedRoute(routeData);
  };

  const handleWeatherUpdate = (weatherData) => {
    setCurrentWeather(weatherData);
  };

  // Automatically fetch fresh weather when loading a saved route
  const fetchWeatherForLoadedRoute = async (routeData) => {
    if (!routeData?.spots?.length) {
      console.warn('No location data available for weather forecast');
      return;
    }

    setLoadingWeather(true);
    try {
      const startLocation = routeData.spots[0];
      const weatherData = await weatherAPI.getThreeDayForecast(startLocation.lat, startLocation.lng);
      setCurrentWeather(weatherData.forecast);
    } catch (err) {
      console.error('Failed to fetch weather for loaded route:', err);
      // Silently fail - don't show error to user as this is automatic
    } finally {
      setLoadingWeather(false);
    }
  };


  // Validate route when trip data changes
  useEffect(() => {
    if (tripData) {
      clearValidation();
      validateRoute(tripData);
    }
  }, [tripData, validateRoute, clearValidation]);

  // Add routes to map when trip data changes
  useEffect(() => {
    if (!tripData?.spots?.length || !mapRef.current || !tripData.daily_info?.length) {
      return;
    }

    const timeoutId = setTimeout(async () => {
      if (mapRef.current) {
        await addRoutesToMap(mapRef.current, tripData);
      }
    }, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [tripData, addRoutesToMap]);


  const generateTrip = async () => {
    if (!country.trim()) {
      setError('Please enter a country');
      return;
    }

    setLoading(true);
    setError('');
    setTripData(null);
    setCurrentWeather(null);

    try {
      const data = await authAPI.generateRoute(country, type);
      // Add the input parameters to the trip data for saving
      const enhancedData = {
        ...data,
        country: country.trim(),
        type: type
      };
      setTripData(enhancedData);
      setIsLoadedRoute(false); // This is a newly generated route
    } catch (err) {
      setError(err.message || 'Failed to generate trip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      {/* Header with user info and logout */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2>Trip Planner</h2>
          <p>{user}</p>
        </div>
        <button onClick={handleLogout} style={{ padding: '10px 20px' }}>Logout</button>
      </div>

              {/* Trip Search Form */}
      <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h3>Generate Your Trip</h3>
        <div style={{ marginBottom: '10px' }}>
          <label>Country: </label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="Enter country name"
            style={{ padding: '8px', margin: '0 10px', width: '200px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Trip Type: </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={{ padding: '8px', margin: '0 10px' }}
          >
            <option value="hiking">Hiking</option>
            <option value="cycling">Cycling</option>
          </select>
        </div>
        <button
          onClick={generateTrip}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Generating...' : 'Generate Trip'}
        </button>
        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      </div>

      {/* Saved Routes */}
      <SavedRoutesList 
        onLoadRoute={handleLoadRoute} 
        refreshTrigger={savedRoutesRefresh}
      />

      {/* Trip Details */}
      {tripData && (
        <div style={{ marginBottom: '20px' }}>
          <h3>{tripData.name}</h3>
          <p><strong>Description:</strong> {tripData.description}</p>
          <p><strong>Logistics:</strong> {tripData.logistics}</p>
          {tripData.spots_names && (
            <p><strong>Key Spots:</strong> {tripData.spots_names.join(', ')}</p>
          )}

          {/* Route Validation Warnings */}
          <RouteValidationWarnings validationResults={validationResults} />

          {/* Weather Forecast Section */}
          {tripData && (
            <div style={{ 
              marginBottom: '15px', 
              padding: '15px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '5px',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>
                    🌤️ Weather Forecast (Next 3 Days)
                    {loadingWeather && (
                      <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#007bff', marginLeft: '10px' }}>
                        (Updating...)
                      </span>
                    )}
                  </h4>
                  
                  {/* Show loading state while fetching weather */}
                  {loadingWeather ? (
                    <div style={{ 
                      padding: '20px',
                      backgroundColor: '#e7f3ff',
                      border: '1px solid #b3d9ff',
                      borderRadius: '4px',
                      textAlign: 'center'
                    }}>
                      <p style={{ margin: 0, color: '#0056b3' }}>
                        🌤️ Fetching current weather forecast...
                      </p>
                    </div>
                  ) : (currentWeather || tripData?.weather)?.length > 0 ? (
                    /* Show weather data */
                    (currentWeather || tripData.weather).map((day, index) => (
                      <div key={index} style={{ 
                        marginBottom: '8px',
                        padding: '8px',
                        backgroundColor: 'white',
                        borderRadius: '4px',
                        border: '1px solid #dee2e6'
                      }}>
                        <strong>Day {index + 1}:</strong> {day.degrees}°C, {day.description}
                        {day.humidity && (
                          <span style={{ fontSize: '12px', color: '#6c757d', marginLeft: '10px' }}>
                            (Humidity: {day.humidity}%)
                          </span>
                        )}
                        {day.date && (
                          <span style={{ fontSize: '10px', color: '#adb5bd', marginLeft: '10px' }}>
                            {day.date}
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    /* Fallback - should rarely be seen since weather fetches automatically */
                    <div style={{ 
                      padding: '15px',
                      backgroundColor: '#f8f9fa',
                      border: '1px solid #dee2e6',
                      borderRadius: '4px',
                      textAlign: 'center'
                    }}>
                      <p style={{ margin: 0, color: '#6c757d' }}>
                        Weather forecast will appear here.
                      </p>
                    </div>
                  )}
                  
                  {/* Status messages */}
                  {currentWeather && !loadingWeather && (
                    <p style={{ fontSize: '12px', color: '#28a745', margin: '10px 0 0 0' }}>
                      ✓ Current weather forecast loaded
                    </p>
                  )}
                </div>
                

              </div>
            </div>
          )}

          <p><strong>Travel Plan:</strong>
            {tripData.daily_info.length > 1 ? (
              <ul>
                {tripData.daily_info.map((day, index) => (
                  <li key={index}>
                    <storng>Day {index + 1}:</storng> {day.description} <br></br> travling distance: {day.distance_km} km.
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
          {!isLoadedRoute && (
            <div style={{ marginTop: '15px' }}>
              <button
                onClick={() => setShowSaveModal(true)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                💾 Save This Route
              </button>
            </div>
          )}
          
          {/* Show indication for loaded routes */}
          {isLoadedRoute && (
            <div style={{ 
              marginTop: '15px', 
              padding: '10px', 
              backgroundColor: '#e7f3ff', 
              borderRadius: '5px',
              fontSize: '14px',
              color: '#0066cc'
            }}>
               This is a saved route loaded from your collection
            </div>
          )}
        </div>
      )}

      {/* Map */}
      <div style={{ height: '400px', width: '100%', border: '1px solid #ddd' }}>
        <MapContainer center={defaultCenter} zoom={10} style={{ height: '100%', width: '100%' }} ref={mapRef}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
          
          {tripData?.spots?.map((spot, index) => (
            <Marker key={index} position={[spot.lat, spot.lng]}>
              <Popup>{spot.name}</Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Save Route Modal */}
      <SaveRouteModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        tripData={tripData}
        onSaveSuccess={handleSaveSuccess}
      />
    </div>
  );
}

export default Dashboard;
