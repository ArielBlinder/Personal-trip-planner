import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SavedRoutesList from '../components/SavedRoutesList';
import GeneratedTrip from '../components/GeneratedTrip';

function SavedRoutes() {
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [savedRoutesRefresh, setSavedRoutesRefresh] = useState(0);
    const navigate = useNavigate();

    const handleLoadRoute = (routeData) => {
        setSelectedRoute(routeData);
    };

    const handleBackToDashboard = () => {
        navigate('/dashboard')
    };

    const handleBackToList = () => {
        setSelectedRoute(null);
    };

    return (
        <div className='container'>
            <div className='header'>
                <h2>Saved Routes</h2>
                <button className='back-btn' onClick={handleBackToDashboard}>Back To Dashboard</button>
            </div>
            <div>
                {selectedRoute && (
                    <button className='back-btn' onClick={handleBackToList}>← Back to Routes List</button>
                )}
            </div>

            {!selectedRoute ? (
                <div>
                    <p> Here are all your saved routes. Click on any route to view its details and map.</p>
                    <SavedRoutesList onLoadRoute={handleLoadRoute} refreshTrigger={savedRoutesRefresh} />
                </div>
            ) : (
                <div>
                    <GeneratedTrip tripData={selectedRoute} isLoadedRoute={true} onSaveClick={null} />
                </div>
            )}
        </div>
    );
}

export default SavedRoutes