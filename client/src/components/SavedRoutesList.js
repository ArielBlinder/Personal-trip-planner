import { useState, useEffect } from 'react';
import { routeAPI } from '../utils/api';

function SavedRoutesList({ onLoadRoute, refreshTrigger }) {
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadSavedRoutes = async () => {
    setLoading(true);
    setError('');
    try {
      const routes = await routeAPI.getSavedRoutes();
      setSavedRoutes(routes);
    } catch (error) {
      setError('Failed to load saved routes');
      console.error('Error loading routes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSavedRoutes();
  }, [refreshTrigger]);

  const handleLoadRoute = async (routeId) => {
    try {
      const routeData = await routeAPI.getRoute(routeId);
      onLoadRoute(routeData);
    } catch (error) {
      alert('Failed to load route: ' + error.message);
    }
  };

  const handleDeleteRoute = async (routeId, routeName) => {
    if (!window.confirm(`Are you sure you want to delete "${routeName}"?`)) {
      return;
    }

    try {
      await routeAPI.deleteRoute(routeId);
      // Refresh the list
      loadSavedRoutes();
    } catch (error) {
      alert('Failed to delete route: ' + error.message);
    }
  };

  if (loading) {
    return <p>Loading saved routes...</p>;
  }

  if (error) {
    return (
      <div>
        <p style={{ color: 'red' }}>{error}</p>
        <button onClick={loadSavedRoutes}>Retry</button>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '5px' }}>
      <h3>Saved Routes ({savedRoutes.length})</h3>
      
      {savedRoutes.length === 0 ? (
        <p style={{ color: '#666', fontStyle: 'italic' }}>
          No saved routes yet. Generate and save a route to see it here!
        </p>
      ) : (
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {savedRoutes.map((route) => (
            <div
              key={route._id}
              style={{
                padding: '15px',
                border: '1px solid #eee',
                borderRadius: '5px',
                marginBottom: '10px',
                backgroundColor: '#f9f9f9'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>
                    {route.userRouteName}
                  </h4>
                  <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>
                    {route.userRouteDescription || 'No description'}
                  </p>
                  <div style={{ fontSize: '12px', color: '#888' }}>
                    <span>{route.country} • {route.type} • {route.total_distance_km}km</span>
                    <br />
                    <span>Saved: {new Date(route.createdAt).toLocaleDateString('en-GB', {
                       day: '2-digit',
                        month: '2-digit',
                       year: 'numeric'
                     })}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '5px', marginLeft: '10px' }}>
                  <button
                    onClick={() => handleLoadRoute(route._id)}
                    style={{
                      padding: '5px 10px',
                      fontSize: '12px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                  >
                    Load
                  </button>
                  <button
                    onClick={() => handleDeleteRoute(route._id, route.userRouteName)}
                    style={{
                      padding: '5px 10px',
                      fontSize: '12px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SavedRoutesList;