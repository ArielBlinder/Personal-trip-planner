import React from 'react';

const WeatherDisplay = ({ 
  weatherData, 
  isLoading, 
  isForSavedRoute = false, 
  onRefresh = null 
}) => {
  if (!weatherData && !isLoading) {
    return (
      <div style={{ 
        padding: '15px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '4px',
        textAlign: 'center'
      }}>
        <p style={{ margin: 0, color: '#6c757d' }}>
          Weather forecast will appear here.
        </p>
      </div>
    );
  }

  return (
    <div style={{ 
      marginBottom: '15px', 
      padding: '15px', 
      backgroundColor: '#f8f9fa', 
      borderRadius: '5px',
      border: '1px solid #e9ecef'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>
            🌤️ Weather Forecast (Next 3 Days)
            {isLoading && (
              <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#007bff', marginLeft: '10px' }}>
                (Loading...)
              </span>
            )}
          </h4>
          
          {/* Show loading state while fetching weather */}
          {isLoading ? (
            <div style={{ 
              padding: '20px',
              backgroundColor: '#e7f3ff',
              border: '1px solid #b3d9ff',
              borderRadius: '4px',
              textAlign: 'center'
            }}>
              <p style={{ margin: 0, color: '#0056b3' }}>
                🌤️ Fetching current weather forecast...
              </p>
            </div>
          ) : weatherData && weatherData.length > 0 ? (
            /* Show weather data */
            <div>
              {weatherData.map((day, index) => (
                <div key={index} style={{ 
                  marginBottom: '8px',
                  padding: '12px',
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  border: '1px solidhsl(210, 13.80%, 88.60%)',
                  boxShadow: '0 1px 3px hsla(0, 0.00%, 0.00%, 0.10)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ color: '#495057' }}>Day {index + 1}:</strong> 
                      <span style={{ marginLeft: '8px', fontSize: '16px', fontWeight: 'bold', color: '#007bff' }}>
                        {day.degrees}°C
                      </span>
                      <span style={{ marginLeft: '8px', color: '#6c757d' }}>
                        {day.description}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '12px', color: '#6c757d' }}>
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
            <div style={{ 
              padding: '15px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              textAlign: 'center'
            }}>
              <p style={{ margin: 0, color: '#6c757d' }}>
                Weather forecast not available.
              </p>
            </div>
          )}
          
          {/* Status messages */}
          {weatherData && !isLoading && (
            <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: '12px', color: '#28a745', margin: 0 }}>
                ✓ {isForSavedRoute ? 'Current weather forecast loaded' : 'Weather forecast included'}
              </p>
            </div>      
          )}
        </div>
      </div>
    </div>
  );
};

export default WeatherDisplay;
