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
      style={{
        marginBottom: '20px',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        backgroundColor: '#f8f9fa',
        ...style
      }}
    >
      {/* Loading State */}
      {loading && (
        <div style={{
          height: '300px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8f9fa',
          border: '1px solid #e9ecef'
        }}>
          <div style={{ textAlign: 'center', color: '#6c757d' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🏞️</div>
            <p style={{ margin: 0 }}>Loading beautiful view of {country}...</p>
          </div>
        </div>
      )}

      {/* Image Display */}
      {!loading && imageData && (
        <div style={{ position: 'relative' }}>
          {/* Image Loading Placeholder */}
          {!imageLoaded && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '300px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f8f9fa',
              zIndex: 1
            }}>
              <div style={{ textAlign: 'center', color: '#6c757d' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🏞️</div>
                <p style={{ margin: 0 }}>Loading image...</p>
              </div>
            </div>
          )}

          {/* Actual Image */}
          <img
            src={imageData.url}
            alt={imageData.description || `Beautiful landscape of ${country}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{
              width: '100%',
              height: '300px',
              objectFit: 'cover',
              display: 'block',
              opacity: imageLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease'
            }}
          />

          
        </div>
      )}

      {/* Error State */}
      {!loading && error && !imageData && (
        <div style={{
          height: '300px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8f9fa',
          border: '1px solid #e9ecef',
          color: '#6c757d'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '10px', opacity: 0.3 }}>🖼️</div>
            <p style={{ margin: 0 }}>Image not available for {country}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(CountryImage);
