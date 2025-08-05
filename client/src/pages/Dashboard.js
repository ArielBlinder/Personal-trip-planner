import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import SaveRouteModal from '../components/SaveRouteModal';
import SavedRoutesList from '../components/SavedRoutesList';
import { authAPI } from '../utils/api';

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
  const [isLoadedRoute, setIsLoadedRoute] = useState(false); // Track if route is loaded from saved routes
  const navigate = useNavigate();

  const defaultCenter = [32.0853, 34.7818];
  const mapRef = useRef(null);
  const routeRefs = useRef([]);

  // Stabilize dayColors to prevent unnecessary re-renders
  const dayColors = useCallback(() => 
    ['#2563eb', '#ff4433', '#4bff33', '#ffff33', '#ee33ff'], []
  );

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
      // Copy map ref to avoid stale reference warning
      const currentMap = mapRef.current;
      
      // Clear all route controls when component unmounts
      try {
        routeRefs.current.forEach(route => {
          try {
            if (route && currentMap && currentMap.hasLayer && currentMap.hasLayer(route)) {
              currentMap.removeControl(route);
            }
          } catch (error) {
            console.warn('Error removing route control on unmount:', error);
          }
        });
        routeRefs.current = [];
      } catch (error) {
        console.warn('Error during component cleanup:', error);
      }
    };
  }, [navigate]);

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
    // Clear existing routes before loading new one
    try {
      routeRefs.current.forEach(route => {
        try {
          if (route && mapRef.current && mapRef.current.hasLayer && mapRef.current.hasLayer(route)) {
            mapRef.current.removeControl(route);
          }
        } catch (error) {
          console.warn('Error removing route control during load:', error);
        }
      });
      routeRefs.current = [];
    } catch (error) {
      console.warn('Error clearing routes:', error);
    }

    setTripData(routeData);
    setIsLoadedRoute(true); // This is a loaded route, don't show save button
  };


  useEffect(() => {
    if (!tripData?.spots?.length || !mapRef.current || !tripData.daily_info?.length)
      return;

    // Add delay to ensure map is ready
    const timeoutId = setTimeout(() => {
      try {
        if (!mapRef.current) return; // Double-check map is still available

        const bounds = L.latLngBounds(tripData.spots.map(s => [s.lat, s.lng]));
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });

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

          try {
            const control = L.Routing.control({
              waypoints: waypoints,
              routeWhileDragging: false,
              draggableWaypoints: false,
              addWaypoints: false,
              show: false,
              router: L.Routing.osrmv1({
                serviceUrl: 'https://router.project-osrm.org/route/v1',
                profile: 'foot'
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
        }, 100);

      } catch (error) {
        console.error('Error in map rendering:', error);
      }
    }, 500);

    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
    };
  }, [tripData, dayColors]);


  const generateTrip = async () => {
    if (!country.trim()) {
      setError('Please enter a country');
      return;
    }

    setLoading(true);
    setError('');
    setTripData(null);



  //   const hiking_content_hardcoded = `
  //   {
  //   "name": "Ein Prat Spring Loop",
  //   "description": "This 2-day hike explores the beautiful Ein Prat Nature Reserve in the Judean Desert. Known for its lush vegetation fed by natural springs, Ein Prat offers a refreshing escape from the arid landscape. The loop trail takes you along the stream, through caves, and past ancient ruins, providing a mix of natural beauty and historical interest. The trek covers a total of 22 kilometers, averaging 11 kilometers per day.",
  //   "logistics": "The trek starts and ends at the Ein Prat (Wadi Qelt) Nature Reserve entrance. Access is via Route 1 (Jerusalem-Dead Sea highway). Turn north onto Road 437 towards Anatot. Follow signs to Ein Prat. A car is the most convenient way to reach the reserve. Public transportation is available to nearby settlements, but requires a walk to the reserve entrance. There is an entrance fee to the nature reserve.",
  //   "spots_names": [
  //     "Ein Prat Entrance",
  //     "Monastery Overlook",
  //     "Upper Pools",
  //     "Cave of the Hermit",
  //     "Lower Pools",
  //     "Ancient Aqueduct",
  //     "Ein Mabu'a Spring",
  //     "Ein Prat Entrance"
  //   ],
  //   "spots": [
  //     {
  //       "name": "Ein Prat Entrance",
  //       "lat": 31.8355,
  //       "lng": 35.3003
  //     },
  //     {
  //       "name": "Monastery Overlook",
  //       "lat": 31.8382,
  //       "lng": 35.3051
  //     },
  //     {
  //       "name": "Upper Pools",
  //       "lat": 31.8395,
  //       "lng": 35.3085
  //     },
  //     {
  //       "name": "Cave of the Hermit",
  //       "lat": 31.8407,
  //       "lng": 35.3102
  //     },
  //     {
  //       "name": "Lower Pools",
  //       "lat": 31.8375,
  //       "lng": 35.3020
  //     },
  //     {
  //       "name": "Ancient Aqueduct",
  //       "lat": 31.8340,
  //       "lng": 35.2955
  //     },
  //     {
  //       "name": "Ein Mabu'a Spring",
  //       "lat": 31.8320,
  //       "lng": 35.2922
  //     },
  //     {
  //       "name": "Ein Prat Entrance",
  //       "lat": 31.8355,
  //       "lng": 35.3003
  //     }
  //   ],
  //   "daily_info": [
  //     {
  //       "day": 1,
  //       "description": "Day 1 starts at the Ein Prat entrance and heads towards the Monastery Overlook, continuing to the upper pools and then through the cave of the hermit. This is the furthest point from the starting location for day 1.",
  //       "day_locations": [
  //         {
  //           "name": "Ein Prat Entrance",
  //           "lat": 31.8355,
  //           "lng": 35.3003
  //         },
  //         {
  //           "name": "Monastery Overlook",
  //           "lat": 31.8382,
  //           "lng": 35.3051
  //         },
  //         {
  //           "name": "Upper Pools",
  //           "lat": 31.8395,
  //           "lng": 35.3085
  //         },
  //         {
  //           "name": "Cave of the Hermit",
  //           "lat": 31.8407,
  //           "lng": 35.3102
  //         }
  //       ],
  //       "distance_km": 11
  //     },
  //     {
  //       "day": 2,
  //       "description": "Day 2 continues from the Cave of the Hermit, and heads back to the starting location by going through the Lower Pools, the ancient aqueduct and going to the Ein Mabu'a spring before arriving back at the Ein Prat entrance.",
  //       "day_locations": [
  //         {
  //           "name": "Cave of the Hermit",
  //           "lat": 31.8407,
  //           "lng": 35.3102
  //         },
  //         {
  //           "name": "Lower Pools",
  //           "lat": 31.8375,
  //           "lng": 35.3020
  //         },
  //         {
  //           "name": "Ancient Aqueduct",
  //           "lat": 31.8340,
  //           "lng": 35.2955
  //         },
  //         {
  //           "name": "Ein Mabu'a Spring",
  //           "lat": 31.8320,
  //           "lng": 35.2922
  //         },
  //         {
  //           "name": "Ein Prat Entrance",
  //           "lat": 31.8355,
  //           "lng": 35.3003
  //         }
  //       ],
  //       "distance_km": 11
  //     }
  //   ],
  //   "total_distance_km": 22,
  //   "weather": [
  //     {
  //       "degrees": 28,
  //       "description": "Sunny with a few clouds"
  //     },
  //     {
  //       "degrees": 30,
  //       "description": "Mostly sunny"
  //     },
  //     {
  //       "degrees": 32,
  //       "description": "Sunny and hot"
  //     }
  //   ]
  // }
  //    `;

  // const cycling_content_hardCoded = `
  // {
  //   "name": "Acadia National Park Loop",
  //   "description": "A leisurely 2-day cycling loop in Acadia National Park, Maine, showcasing the park's scenic carriage roads. This ride covers a total distance of approximately 20 kilometers, with each day ranging between 9 and 11 kilometers, ideal for relaxed exploration and enjoying the natural beauty. The mostly flat, gravel carriage roads make it suitable for various cycling levels.",
  //   "logistics": "The trek starts and ends at the Hulls Cove Visitor Center in Acadia National Park. The park is accessible by car via Route 3. From Bar Harbor, take Route 3 north. There are also seasonal shuttle bus services available within the park. Parking is available at the Hulls Cove Visitor Center, but can fill up quickly during peak season. Bikes can be rented in Bar Harbor, or you can bring your own.",
  //   "spots_names": [
  //     "Hulls Cove Visitor Center",
  //     "Eagle Lake",
  //     "Jordan Pond",
  //     "Bubble Rock Parking Area",
  //     "Hulls Cove Visitor Center"
  //   ],
  //   "spots": [
  //     { "name": "Hulls Cove Visitor Center", "lat": 44.4192, "lng": -68.2733 },
  //     { "name": "Eagle Lake", "lat": 44.3715, "lng": -68.2525 },
  //     { "name": "Jordan Pond", "lat": 44.3458, "lng": -68.2242 },
  //     { "name": "Bubble Rock Parking Area", "lat": 44.3569, "lng": -68.2208 },
  //     { "name": "Hulls Cove Visitor Center", "lat": 44.4192, "lng": -68.2733 }
  //   ],
  //   "daily_info": [
  //     {
  //       "day": 1,
  //       "description": "Start at Hulls Cove Visitor Center, cycle south towards Eagle Lake on the carriage roads, enjoy the views, and take a loop around the lake before heading back towards the Visitor Center area. The path back follows the loop, not backtracking the exact same route, to discover more.",
  //       "day_locations": [
  //         { "name": "Hulls Cove Visitor Center", "lat": 44.4192, "lng": -68.2733 },
  //         { "name": "Eagle Lake", "lat": 44.3715, "lng": -68.2525 },
  //         { "name": "Hulls Cove Visitor Center", "lat": 44.4192, "lng": -68.2733 }
  //       ],
  //       "distance_km": 11
  //     },
  //     {
  //       "day": 2,
  //       "description": "Start near Hulls Cove (end location of day 1), cycle to Jordan Pond, loop to Bubble Rock Parking Area, and loop back to the Hulls Cove area.",
  //       "day_locations": [
  //         { "name": "Hulls Cove Visitor Center", "lat": 44.4192, "lng": -68.2733 },
  //         { "name": "Jordan Pond", "lat": 44.3458, "lng": -68.2242 },
  //         { "name": "Bubble Rock Parking Area", "lat": 44.3569, "lng": -68.2208 },
  //         { "name": "Hulls Cove Visitor Center", "lat": 44.4192, "lng": -68.2733 }
  //       ],
  //       "distance_km": 9
  //     }
  //   ],
  //   "total_distance_km": 20,
  //   "weather": [
  //     { "degrees": 22, "description": "Partly Cloudy" },
  //     { "degrees": 23, "description": "Sunny" },
  //     { "degrees": 24, "description": "Sunny" }
  //   ]
  // }
  // `;



  //   let tripDataOffline;
  //   try {
  //     tripDataOffline = JSON.parse(cycling_content_hardCoded);
  //   } catch (parseError) {
  //     console.error("JSON parse error:", parseError);
  //   }


  //   setTripData(tripDataOffline);
  //   setLoading(false);
  // };



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
            <option value="walking">Walking</option>
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
          {tripData.weather && tripData.weather.length > 0 && (
            <p><strong>Weather Forecast:</strong>
            Today: {tripData.weather[0].degrees}°, {tripData.weather[0].description}; 
            Tomorrow: {tripData.weather[1].degrees}°, {tripData.weather[1].description}; 
            In 2 days: {tripData.weather[2].degrees}°, {tripData.weather[2].description}
            </p>
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
