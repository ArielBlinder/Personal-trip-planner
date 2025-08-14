import { useState } from 'react';
import { routeAPI } from '../utils/api';

function SaveRouteModal({ isOpen, onClose, tripData, onSaveSuccess }) {
  const [routeName, setRouteName] = useState('');
  const [routeDescription, setRouteDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    // Basic validation
    if (!routeName.trim()) {
      setError('Route name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await routeAPI.saveRoute(tripData, routeName.trim(), routeDescription.trim());
      onSaveSuccess && onSaveSuccess(response.routeId);
      onClose();
      // Reset form
      setRouteName('');
      setRouteDescription('');
    } catch (error) {
      console.error('Save route error:', error);

      setError(`Failed to save route: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  if (!isOpen) return null; // Do not render when closed

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title">Save Route</h3>
        
        <div className="modal-field">
          <label className="modal-label">
            Route Name *
          </label>
          <input
            type="text"
            value={routeName}
            onChange={(e) => setRouteName(e.target.value)}
            placeholder="Enter a name for your route"
            className="modal-input"
            maxLength={50}
          />
        </div>

        <div className="modal-field-large">
          <label className="modal-label">
            Description (Optional)
          </label>
          <textarea
            value={routeDescription}
            onChange={(e) => setRouteDescription(e.target.value)}
            placeholder="Add a description for your route"
            rows={3}
            className="modal-textarea"
            maxLength={200}
          />
        </div>

        {error && (
          <div className="modal-error">
            {error}
          </div>
        )}

        <div className="modal-actions">
          <button
            onClick={handleClose}
            className="modal-cancel-btn"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !routeName.trim()}
            className="modal-save-btn"
          >
            {loading ? 'Saving...' : 'Save Route'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SaveRouteModal;