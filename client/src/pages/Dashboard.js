
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
