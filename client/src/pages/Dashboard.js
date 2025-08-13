
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


  // Request a new trip from the server using the chosen country and type
  const generateTrip = useCallback(async () => {
    if (!ValidationHelper.validateCountry(country)) {
      setError(ERROR_MESSAGES.COUNTRY_REQUIRED);
      return;
    }

    setLoading(true);
    setError('');
    setTripData(null);

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
