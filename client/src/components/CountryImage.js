import React, { useState, useEffect, useCallback, memo } from 'react';
import { imageAPI } from '../utils/api';

const CountryImage = ({ country }) => {
  const [imageData, setImageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Fetch a representative image for the given country
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
      setImageData({
        url: `https://source.unsplash.com/800x400/?${encodeURIComponent(countryName)},landscape`
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
    <div className="country-image-container">
      {!loading && imageData && (
        <div className="country-image-wrapper">
          <img src={imageData.url} alt={imageData.description || `Beautiful landscape of ${country}`} onLoad={handleImageLoad} onError={handleImageError} className="country-image" style={{ opacity: imageLoaded ? 1 : 0 }}/>
        </div>
      )}
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
