import { useEffect, useState } from 'react';
import GeneratedTrip from '../components/GeneratedTrip';
import { useNavigate } from 'react-router-dom';
import SaveRouteModal from '../components/SaveRouteModal';
import { authAPI } from '../utils/api';


function Dashboard() {
  const [user, setUser] = useState('');
  const [country, setCountry] = useState('');
  const [type, setType] = useState('hiking');
  const [tripData, setTripData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isLoadedRoute, setIsLoadedRoute] = useState(false); // Track if route is loaded from saved routes
  const navigate = useNavigate();


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
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleShowSavedRoutes = () => {
    navigate('/saved-routes')
  }

  const handleSaveSuccess = (routeId) => {
    alert('Route saved successfully!');
  };

  const generateTrip = async () => {
    if (!country.trim()) {
      setError('Please enter a country');
      return;
    }

    setLoading(true);
    setError('');
    setTripData(null);



  //   const hiking_content_hardCoded = `
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
  //     tripDataOffline = JSON.parse(hiking_content_hardCoded);
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
      <div className='header'>
        <div>
          <h2>Trip Planner</h2>
          <p>{user}</p>
        </div>
        <button onClick={handleLogout} className="logout">Logout</button>
      </div>

      {/* Trip Search Form */}
      <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h3>Generate Your Trip</h3>
        <div style={{ marginBottom: '10px' }}>
          <label>Country: </label>
          <input className='input' type="text" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Enter country name" />
        </div>
        <div>
          <label>Trip Type: </label>
          <select className='input' value={type} onChange={(e) => setType(e.target.value)}>
            <option value="hiking">Hiking</option>
            <option value="cycling">Cycling</option>
          </select>
        </div>
        <button onClick={generateTrip} disabled={loading} className={`btn-secondary ${loading ? 'btn-disabled' : ''}`}>
          {loading ? 'Generating...' : 'Generate Trip'}
        </button>
        {error && <p className="error-message">{error}</p>}
      </div>

      

      <button onClick={handleShowSavedRoutes} className="back-btn" style={{ marginBottom: '20px' }}>go to saved routes</button>

      {tripData && (
        <GeneratedTrip tripData={tripData} isLoadedRoute={isLoadedRoute} onSaveClick={() => setShowSaveModal(true)}/>
      )}

      {/* Save Route Modal */}
      <SaveRouteModal isOpen={showSaveModal} onClose={() => setShowSaveModal(false)} tripData={tripData} onSaveSuccess={handleSaveSuccess}/>
    </div>
  );
}

export default Dashboard;
