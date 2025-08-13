import React, { useState, useEffect, useCallback, memo } from 'react';
import { imageAPI } from '../utils/api';

const CountryImage = ({ country, className = '', style = {} }) => {
  const [imageData, setImageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const fetchCountryImage = useCallback(async (countryName) => {
    if (!countryName?.trim()) {
      return;
    }

    setLoading(true);
    setError(null);
    setImageLoaded(false);

    try {
      const response = await imageAPI.getCountryImage(countryName.trim());
      setImageData(response.image);
    } catch (err) {
      console.error('Failed to fetch country image:', err);
      setError(err.message);
      // Set fallback image data
      setImageData({
        url: `https://source.unsplash.com/800x400/?${encodeURIComponent(countryName)},landscape`,
        description: `Beautiful landscape of ${countryName}`,
        attribution: 'Photo from Unsplash'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (country) {
      fetchCountryImage(country);
    }
  }, [country, fetchCountryImage]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    console.warn('Image failed to load, using fallback');
    setImageData(prev => ({
      ...prev,
      url: `https://source.unsplash.com/800x400/?landscape,nature`
    }));
  };

  if (!country) {
    return null;
  }

  return (
    <div 
      className={`country-image-container ${className}`}
      style={style}
    >
      {/* Loading State */}
      {loading && (
        <div className="country-image-loading">
          <div className="country-image-loading-content">
            <div className="country-image-loading-icon">🏞️</div>
            <p className="country-image-loading-text">Loading beautiful view of {country}...</p>
          </div>
        </div>
      )}

      {/* Image Display */}
      {!loading && imageData && (
        <div className="country-image-wrapper">
          {/* Image Loading Placeholder */}
          {!imageLoaded && (
            <div className="country-image-placeholder">
              <div className="country-image-loading-content">
                <div className="country-image-loading-icon">🏞️</div>
                <p className="country-image-loading-text">Loading image...</p>
              </div>
            </div>
          )}

          {/* Actual Image */}
          <img
            src={imageData.url}
            alt={imageData.description || `Beautiful landscape of ${country}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            className="country-image"
            style={{ opacity: imageLoaded ? 1 : 0 }}
          />
          {/* Image Description Overlay */}
          {imageLoaded && imageData.description && (
            <div className="country-image-overlay">
              <p className="country-image-description">
                {imageData.description}
              </p>
              {imageData.attribution && (
                <p className="country-image-attribution">
                  {imageData.attribution}
                </p>
              )}
            </div>
          )}
          
        </div>
      )}

      {/* Error State */}
      {!loading && error && !imageData && (
        <div className="country-image-error">
          <div className="country-image-error-content">
            <div className="country-image-error-icon">🖼️</div>
            <p className="country-image-error-text">Image not available for {country}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(CountryImage);
