
import { useEffect, useState, useCallback } from 'react';
import GeneratedTrip from '../components/GeneratedTrip';
import { useNavigate } from 'react-router-dom';
import SaveRouteModal from '../components/SaveRouteModal';
import { authAPI } from '../utils/api';
import { TRIP_TYPES, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../utils/constants';
import { ValidationHelper, ErrorHandler } from '../utils/errorHandler';




function Dashboard() {
  const [user, setUser] = useState('');
  const [country, setCountry] = useState('');
  const [type, setType] = useState(TRIP_TYPES.HIKING);
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

  const handleSaveSuccess = useCallback((routeId) => {
    alert(SUCCESS_MESSAGES.ROUTE_SAVED);
  }, []);


  const generateTrip = useCallback(async () => {
    if (!ValidationHelper.validateCountry(country)) {
      setError(ERROR_MESSAGES.COUNTRY_REQUIRED);
      return;
    }

    setLoading(true);
    setError('');
    setTripData(null);

//     const israel = `{
//     "name": "Nahal Kziv Upper Loop",
//     "description": "This is a challenging two-day round trip in the Upper Galilee region of Israel, specifically within the Nahal Kziv Nature Reserve. The trek follows a loop, starting and ending at the Goren Park trailhead. It features sections along the Kziv stream, a visit to Montfort Castle, and scenic viewpoints of the Galilee landscape. The total distance is approximately 17.5 kilometers, with an average daily distance of around 8.75 kilometers.",
//     "logistics": "The trek begins at the main parking area of Goren Park, which serves as the trailhead for the Nahal Kziv Nature Reserve. The site is best accessed by car. The closest city is Ma'alot-Tarshiha. The route is well-marked with a combination of black, red, and green trail markers.",
//     "spots_names": [
//         "Goren Park Trailhead",
//         "Kziv Stream Descent Point",
//         "Trail Junction 1",
//         "Montfort Castle Viewpoint & Campsite",
//         "Final Ascent Path",
//         "Goren Park Trailhead"
//     ],
//     "spots": [
//         {
//             "name": "Goren Park Trailhead",
//             "lat": 33.047863,
//             "lng": 35.222280
//         },
//         {
//             "name": "Kziv Stream Descent Point",
//             "lat": 33.047701,
//             "lng": 35.225010
//         },
//         {
//             "name": "Trail Junction 1",
//             "lat": 33.047055,
//             "lng": 35.228148
//         },
//         {
//             "name": "Mid-Trail Point",
//             "lat": 33.046302,
//             "lng": 35.231267
//         },
//         {
//             "name": "Forest Path",
//             "lat": 33.045618,
//             "lng": 35.234591
//         },
//         {
//             "name": "Trail Bend 1",
//             "lat": 33.044991,
//             "lng": 35.237402
//         },
//         {
//             "name": "Trail Bend 2",
//             "lat": 33.044738,
//             "lng": 35.239999
//         },
//         {
//             "name": "Stream Path",
//             "lat": 33.043540,
//             "lng": 35.244018
//         },
//         {
//             "name": "Trail Junction 2",
//             "lat": 33.043425,
//             "lng": 35.246533
//         },
//         {
//             "name": "Start of Ascent",
//             "lat": 33.043511,
//             "lng": 35.248002
//         },
//         {
//             "name": "Montfort Castle Viewpoint & Campsite",
//             "lat": 33.044021,
//             "lng": 35.226544
//         },
//         {
//             "name": "Descent Point",
//             "lat": 33.043999,
//             "lng": 35.224151
//         },
//         {
//             "name": "Lower Trail Path",
//             "lat": 33.044754,
//             "lng": 35.222728
//         },
//         {
//             "name": "Final Ascent Path",
//             "lat": 33.045650,
//             "lng": 35.222381
//         },
//         {
//             "name": "Trail End",
//             "lat": 33.046200,
//             "lng": 35.222350
//         },
//         {
//             "name": "Near Trailhead",
//             "lat": 33.046801,
//             "lng": 35.222321
//         },
//         {
//             "name": "Goren Park Trailhead",
//             "lat": 33.047863,
//             "lng": 35.222280
//         }
//     ],
//     "daily_info": [
//         {
//             "day": 1,
//             "description": "Day one follows the red-marked trail into the Nahal Kziv canyon, providing a gradual descent with views of the valley. The route continues along the stream, with several intermediate waypoints, before ascending toward Montfort Castle. The campsite for the night is located at a viewpoint near the castle, offering stunning views.",
//             "day_locations": [
//                 {
//                     "name": "Goren Park Trailhead",
//                     "lat": 33.047863,
//                     "lng": 35.222280
//                 },
//                 {
//                     "name": "Kziv Stream Descent Point",
//                     "lat": 33.047701,
//                     "lng": 35.225010
//                 },
//                 {
//                     "name": "Trail Junction 1",
//                     "lat": 33.047055,
//                     "lng": 35.228148
//                 },
//                 {
//                     "name": "Mid-Trail Point",
//                     "lat": 33.046302,
//                     "lng": 35.231267
//                 },
//                 {
//                     "name": "Forest Path",
//                     "lat": 33.045618,
//                     "lng": 35.234591
//                 },
//                 {
//                     "name": "Trail Bend 1",
//                     "lat": 33.044991,
//                     "lng": 35.237402
//                 },
//                 {
//                     "name": "Trail Bend 2",
//                     "lat": 33.044738,
//                     "lng": 35.239999
//                 },
//                 {
//                     "name": "Stream Path",
//                     "lat": 33.043540,
//                     "lng": 35.244018
//                 },
//                 {
//                     "name": "Trail Junction 2",
//                     "lat": 33.043425,
//                     "lng": 35.246533
//                 },
//                 {
//                     "name": "Start of Ascent",
//                     "lat": 33.043511,
//                     "lng": 35.248002
//                 },
//                 {
//                     "name": "Montfort Castle Viewpoint & Campsite",
//                     "lat": 33.044021,
//                     "lng": 35.226544
//                 }
//             ],
//             "distance_km": 8.75
//         },
//         {
//             "day": 2,
//             "description": "Day two begins with a return hike, descending from the Montfort Castle viewpoint and following a different trail to complete the loop. The path winds through a forested section, offering new perspectives of the valley before a final, short ascent back to the Goren Park trailhead.",
//             "day_locations": [
//                 {
//                     "name": "Montfort Castle Viewpoint & Campsite",
//                     "lat": 33.044021,
//                     "lng": 35.226544
//                 },
//                 {
//                     "name": "Descent Point",
//                     "lat": 33.043999,
//                     "lng": 35.224151
//                 },
//                 {
//                     "name": "Lower Trail Path",
//                     "lat": 33.044754,
//                     "lng": 35.222728
//                 },
//                 {
//                     "name": "Final Ascent Path",
//                     "lat": 33.045650,
//                     "lng": 35.222381
//                 },
//                 {
//                     "name": "Trail End",
//                     "lat": 33.046200,
//                     "lng": 35.222350
//                 },
//                 {
//                     "name": "Near Trailhead",
//                     "lat": 33.046801,
//                     "lng": 35.222321
//                 },
//                 {
//                     "name": "Goren Park Trailhead",
//                     "lat": 33.047863,
//                     "lng": 35.222280
//                 }
//             ],
//             "distance_km": 8.75
//         }
//     ],
//     "total_distance_km": 17.5
// }`

// const israel = `{
//     "name": "The Nahal Kziv Loop",
//     "description": "This two-day round trip through the Nahal Kziv Nature Reserve in the Upper Galilee region of Israel follows the course of the Kziv Stream and leads to the ruins of Montfort Castle. The trek is a loop, starting and ending at the same location, with a total distance of approximately 32.9 kilometers. Each day's hike is between 15 and 17 kilometers, using marked hiking trails and dirt paths.",
//     "logistics": "The trek begins at the 'Goren Park' entrance to the Nahal Kziv Nature Reserve. It is best accessed by car, as there is a designated parking area at the trailhead. Public transportation is limited to the nearby city of Ma'alot-Tarshiha, requiring a taxi to reach the starting point.",
//     "spots_names": [
//         "Goren Park Trailhead",
//         "Nahal Kziv Bridge",
//         "Montfort Castle Viewpoint & Campsite",
//         "Montfort Castle Ruins"
//     ],
//     "spots": [
//         {
//             "name": "Goren Park Trailhead",
//             "lat": 33.047863,
//             "lng": 35.222280
//         },
//         {
//             "name": "Nahal Kziv Bridge",
//             "lat": 33.044393,
//             "lng": 35.226524
//         },
//         {
//             "name": "Montfort Castle Viewpoint & Campsite",
//             "lat": 33.044021,
//             "lng": 35.226544
//         },
//         {
//             "name": "Montfort Castle Ruins",
//             "lat": 33.044722,
//             "lng": 35.226111
//         }
//     ],
//     "daily_info": [
//         {
//             "day": 1,
//             "description": "The first day is a descent into the Nahal Kziv canyon, following the stream and crossing it multiple times, culminating in a climb to the viewpoint overlooking Montfort Castle where you will set up camp for the night.",
//             "day_locations": [
//                 {
//                     "name": "Goren Park Trailhead",
//                     "lat": 33.047863,
//                     "lng": 35.222280
//                 },
//                 {
//                     "name": "Nahal Kziv Bridge",
//                     "lat": 33.044393,
//                     "lng": 35.226524
//                 },
//                 {
//                     "name": "Montfort Castle Viewpoint & Campsite",
//                     "lat": 33.044021,
//                     "lng": 35.226544
//                 }
//             ],
//             "distance_km": 16.4
//         },
//         {
//             "day": 2,
//             "description": "Day two begins with an exploration of Montfort Castle before descending back into the valley. The return journey follows a different trail on the opposite side of the stream, providing new perspectives before the final ascent back to the starting point.",
//             "day_locations": [
//                 {
//                     "name": "Montfort Castle Viewpoint & Campsite",
//                     "lat": 33.044021,
//                     "lng": 35.226544
//                 },
//                 {
//                     "name": "Montfort Castle Ruins",
//                     "lat": 33.044722,
//                     "lng": 35.226111
//                 },
//                 {
//                     "name": "Nahal Kziv Bridge",
//                     "lat": 33.044393,
//                     "lng": 35.226524
//                 },
//                 {
//                     "name": "Goren Park Trailhead",
//                     "lat": 33.047863,
//                     "lng": 35.222280
//                 }
//             ],
//             "distance_km": 16.5
//         }
//     ],
//     "total_distance_km": 32.9
// }`

// const israel2 = `{
//     "name": "Shvil HaMitzpe (The Mitzpe Trail)",
//     "description": "This is a scenic two-day hiking trek in the Carmel Mountains, starting and ending at the Hai-Bar Carmel Nature Reserve. The loop trail passes through dense Mediterranean forest, offering stunning views of the coastal plain and the Jezreel Valley from various lookouts ('mitzpe' in Hebrew). The route combines well-maintained paths with more challenging sections, providing a great taste of the Carmel's unique ecosystem.",
//     "logistics": "The trek begins and ends at the main parking lot of the Hai-Bar Carmel Nature Reserve, which is easily accessible by car. There are well-marked trailheads with clear signage. The overnight stay is intended to be a designated camping area near a viewpoint, which requires carrying your own gear. Ensure you have enough water for the entire trip, as water sources are limited along the trail.",
//     "spots_names": [
//         "Hai-Bar Carmel Nature Reserve Entrance",
//         "Mitzpe Oranit Lookout",
//         "Mitzpe Ha-Shachar Lookout",
//         "Hai-Bar Carmel Nature Reserve Entrance"
//     ],
//     "spots": [
//         {
//             "name": "Hai-Bar Carmel Nature Reserve Entrance",
//             "lat": 32.730303,
//             "lng": 35.031580
//         },
//         {
//             "name": "Mitzpe Oranit Lookout",
//             "lat": 32.733560,
//             "lng": 35.050619
//         },
//         {
//             "name": "Mitzpe Ha-Shachar Lookout",
//             "lat": 32.716180,
//             "lng": 35.054320
//         },
//         {
//             "name": "Hai-Bar Carmel Nature Reserve Entrance",
//             "lat": 32.730303,
//             "lng": 35.031580
//         }
//     ],
//     "daily_info": [
//         {
//             "day": 1,
//             "description": "The first day starts at Hai-Bar Carmel and takes a path through the forest, gradually ascending to the Mitzpe Oranit lookout. From there, the trail continues along the ridge, offering expansive views, and ends at the Mitzpe Ha-Shachar lookout, which serves as the designated campsite for the night.",
//             "day_locations": [
//                 {
//                     "name": "Hai-Bar Carmel Nature Reserve Entrance",
//                     "lat": 32.730303,
//                     "lng": 35.031580
//                 },
//                 {
//                     "name": "Mitzpe Ha-Shachar Lookout",
//                     "lat": 32.716180,
//                     "lng": 35.054320
//                 }
//             ],
//             "distance_km": 10.5
//         },
//         {
//             "day": 2,
//             "description": "Day two begins at Mitzpe Ha-Shachar and follows a different path that loops back toward the starting point. The trail descends through a diverse landscape, offering new perspectives of the Carmel forest. The day concludes with the final stretch back to the Hai-Bar Carmel Nature Reserve.",
//             "day_locations": [
//                 {
//                     "name": "Mitzpe Ha-Shachar Lookout",
//                     "lat": 32.716180,
//                     "lng": 35.054320
//                 },
//                 {
//                     "name": "Hai-Bar Carmel Nature Reserve Entrance",
//                     "lat": 32.730303,
//                     "lng": 35.031580
//                 }
//             ],
//             "distance_km": 10.5
//         }
//     ],
//     "total_distance_km": 21.0
// }`


  // const hiking_content_hardCoded = `
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


  // let tripDataOffline;
  //   try {
  //     tripDataOffline = JSON.parse(hiking_content_hardCoded);
  //   } catch (parseError) {
  //     console.error("JSON parse error:", parseError);
  //   }


  //   setTripData(tripDataOffline);
  //   setLoading(false);







    try {
      const data = await authAPI.generateRoute(ValidationHelper.sanitizeInput(country), type);
      // Add the input parameters to the trip data for saving
      const enhancedData = {
        ...data,
        country: ValidationHelper.sanitizeInput(country),
        type: type
      };
      setTripData(enhancedData);
      setIsLoadedRoute(false); // This is a newly generated route
    } catch (err) {
      setError(ErrorHandler.handleTripGenerationError(err));
    } finally {
      setLoading(false);
    }
  }, [country, type]);

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
            <option value={TRIP_TYPES.HIKING}>Hiking</option>
            <option value={TRIP_TYPES.CYCLING}>Cycling</option>
          </select>
        </div>
        <button onClick={generateTrip} disabled={loading} className={`btn-secondary ${loading ? 'btn-disabled' : ''}`}>
          {loading ? 'Generating...' : 'Generate Trip'}
        </button>
        {error && <p className="error-message">{error}</p>}
      </div>

      

      <button onClick={handleShowSavedRoutes} className="back-btn" style={{ marginBottom: '20px' }}>Go To Saved Routes</button>

      {tripData && (

        <GeneratedTrip tripData={tripData} isLoadedRoute={isLoadedRoute} onSaveClick={() => setShowSaveModal(true)}/>
      )}

      {/* Save Route Modal */}
      <SaveRouteModal isOpen={showSaveModal} onClose={() => setShowSaveModal(false)} tripData={tripData} onSaveSuccess={handleSaveSuccess}/>
    </div>
  );
}

export default Dashboard;
