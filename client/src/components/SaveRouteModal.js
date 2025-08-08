import { useState } from 'react';
import { routeAPI } from '../utils/api';

function SaveRouteModal({ isOpen, onClose, tripData, onSaveSuccess }) {
  const [routeName, setRouteName] = useState('');
  const [routeDescription, setRouteDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!routeName.trim()) {
      setError('Route name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔍 Debug - Saving route with data:', {
        tripData: tripData,
        routeName: routeName.trim(),
        routeDescription: routeDescription.trim(),
        token: localStorage.getItem('token') ? 'Present' : 'Missing'
      });

      const response = await routeAPI.saveRoute(tripData, routeName.trim(), routeDescription.trim());
      console.log('Route saved successfully:', response);
      onSaveSuccess && onSaveSuccess(response.routeId);
      onClose();
      // Reset form
      setRouteName('');
      setRouteDescription('');
    } catch (error) {
      console.error('Save route error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        token: localStorage.getItem('token') ? 'Present' : 'Missing',
        tripData: tripData
      });
      setError(`Failed to save route: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        width: '400px',
        maxWidth: '90vw'
      }}>
        <h3 style={{ marginTop: 0 }}>Save Route</h3>
        
        {/* Debug Info */}
        <div style={{ 
          fontSize: '12px', 
          color: '#666', 
          marginBottom: '15px',
          padding: '10px',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px'
        }}>
          <strong>Debug Info:</strong><br/>
          Token: {localStorage.getItem('token') ? 'Present' : 'Missing'}<br/>
          Trip Data: {tripData ? 'Present' : 'Missing'}<br/>
          Route Name: {tripData?.name || 'N/A'}
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Route Name *
          </label>
          <input
            type="text"
            value={routeName}
            onChange={(e) => setRouteName(e.target.value)}
            placeholder="Enter a name for your route"
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
            maxLength={50}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Description (Optional)
          </label>
          <textarea
            value={routeDescription}
            onChange={(e) => setRouteDescription(e.target.value)}
            placeholder="Add a description for your route"
            rows={3}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              resize: 'vertical'
            }}
            maxLength={200}
          />
        </div>

        {error && (
          <div style={{ 
            color: 'red', 
            marginBottom: '15px',
            padding: '10px',
            backgroundColor: '#ffebee',
            borderRadius: '4px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={handleClose}
            style={{
              padding: '10px 20px',
              border: '1px solid #ddd',
              backgroundColor: 'white',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !routeName.trim()}
            style={{
              padding: '10px 20px',
              backgroundColor: loading ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Saving...' : 'Save Route'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SaveRouteModal;