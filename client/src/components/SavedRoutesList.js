import { useState, useEffect, useCallback, memo } from 'react';
import { routeAPI } from '../utils/api';
import { ErrorHandler } from '../utils/errorHandler';

function SavedRoutesList({ onLoadRoute, refreshTrigger }) {
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadSavedRoutes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const routes = await routeAPI.getSavedRoutes();
      setSavedRoutes(routes);
    } catch (error) {
      setError(ErrorHandler.handleRouteError(error, 'load'));
      console.error('Error loading routes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSavedRoutes();
  }, [refreshTrigger, loadSavedRoutes]);

  const handleLoadRoute = useCallback(async (routeId) => {
    try {
      const routeData = await routeAPI.getRoute(routeId);
      onLoadRoute(routeData);
    } catch (error) {
      alert(ErrorHandler.handleRouteError(error, 'load'));
    }
  }, [onLoadRoute]);

  const handleDeleteRoute = useCallback(async (routeId, routeName) => {
    if (!window.confirm(`Are you sure you want to delete "${routeName}"?`)) {
      return;
    }

    try {
      await routeAPI.deleteRoute(routeId);
      // Refresh the list
      loadSavedRoutes();
    } catch (error) {
      alert(ErrorHandler.handleRouteError(error, 'delete'));
    }
  }, [loadSavedRoutes]);

  if (loading) {
    return <p>Loading saved routes...</p>;
  }

  if (error) {
    return (
      <div>
        <p className="saved-routes-error">{error}</p>
        <button className="saved-routes-retry-btn" onClick={loadSavedRoutes}>Retry</button>
      </div>
    );
  }

  return (
    <div className="saved-routes-container">
      <h3 className="saved-routes-title">Saved Routes ({savedRoutes.length})</h3>
      
      {savedRoutes.length === 0 ? (
        <p className="saved-routes-empty">
          No saved routes yet. Generate and save a route to see it here!
        </p>
      ) : (
        <div className="saved-routes-list">
          {savedRoutes.map((route) => (
            <div key={route._id} className="saved-route-item">
              <div className="saved-route-content">
                <div className="saved-route-info">
                  <h4 className="saved-route-name">
                    {route.userRouteName}
                  </h4>
                  <p className="saved-route-description">
                    {route.userRouteDescription || 'No description'}
                  </p>
                  <div className="saved-route-meta">
                    <span>{route.country} • {route.type} • {route.total_distance_km}km</span>
                    <br />
                    <span>Saved: {new Date(route.createdAt).toLocaleDateString('en-GB', {
                       day: '2-digit',
                        month: '2-digit',
                       year: 'numeric'
                     })}</span>
                  </div>
                </div>
                <div className="saved-route-actions">
                  <button
                    onClick={() => handleLoadRoute(route._id)}
                    className="saved-route-load-btn"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => handleDeleteRoute(route._id, route.userRouteName)}
                    className="saved-route-delete-btn"
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

export default memo(SavedRoutesList);