import React, { memo } from 'react';

// Displays a simple 3-day forecast block. Supports a loading state and optional refresh.
const WeatherDisplay = ({ 
  weatherData, 
  isLoading, 
  isForSavedRoute = false, 
  onRefresh = null 
}) => {
  if (!weatherData && !isLoading) {
    return (
      <div className="weather-no-data">
        <p className="weather-no-data-message">
          Weather forecast will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="weather-container">
      <div className="weather-header">
        <div className="weather-header-content">
          <h4 className="weather-title">
            🌤️ Weather Forecast for the next 3 days
            {isLoading && (
              <span className="weather-loading-text">
                (Loading...)
              </span>
            )}
          </h4>
          {/* Optional refresh shown for saved routes when handler provided */}
          {!isLoading && isForSavedRoute && onRefresh && (
            <button className="weather-refresh-btn" onClick={onRefresh}>Refresh</button>
          )}
          
          {/* Show loading state while fetching weather */}
          {isLoading ? (
            <div className="weather-loading-container">
              <p className="weather-loading-message">
                🌤️ Fetching current weather forecast...
              </p>
            </div>
          ) : weatherData && weatherData.length > 0 ? (
            /* Show weather data */
            <div>
              {weatherData.map((day, index) => (
                <div key={index} className="weather-day-item">
                  <div className="weather-day-content">
                    <div className="weather-day-main">
                      <strong className="weather-day-label">Day {index + 1}:</strong> 
                      <span className="weather-temperature">
                        {day.degrees}°C
                      </span>
                      <span className="weather-description">
                        {day.description}
                      </span>
                    </div>
                    <div className="weather-day-details">
                      {day.date && (
                        <div>{day.date}</div>
                      )}
                      {day.humidity && (
                        <div>Humidity: {day.humidity}%</div>
                      )}
                      {day.windSpeed && (
                        <div>Wind: {day.windSpeed} m/s</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Fallback - should rarely be seen since weather fetches automatically */
            <div className="weather-fallback">
              <p className="weather-fallback-message">
                Weather forecast not available.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(WeatherDisplay);
