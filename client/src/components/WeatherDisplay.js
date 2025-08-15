import React, { memo } from 'react';

// Displays a simple 3-day forecast block. Supports a loading state and optional refresh.
const WeatherDisplay = ({ weatherData, isLoading }) => {
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
          </h4>
          {!isLoading && weatherData && weatherData.length > 0 && (
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
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(WeatherDisplay);
