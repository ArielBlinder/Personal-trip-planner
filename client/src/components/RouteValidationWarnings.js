import React from 'react';

const RouteValidationWarnings = ({ validationResults }) => {
  const { warnings, errors } = validationResults;
  
  if (warnings.length === 0 && errors.length === 0) {
    return null;
  }

  const allIssues = [...errors, ...warnings];

  return (
    <div style={{
      backgroundColor: errors.length > 0 ? '#f8d7da' : '#fff3cd',
      border: `1px solid ${errors.length > 0 ? '#f5c6cb' : '#ffeaa7'}`,
      borderRadius: '5px',
      padding: '15px',
      marginBottom: '15px'
    }}>
      <h4 style={{ 
        color: errors.length > 0 ? '#721c24' : '#856404', 
        margin: '0 0 10px 0', 
        fontSize: '16px' 
      }}>
        {errors.length > 0 ? '❌' : '⚠️'} Route Validation {errors.length > 0 ? 'Errors' : 'Warnings'}
      </h4>
      
      <ul style={{ 
        margin: '0', 
        paddingLeft: '20px', 
        color: errors.length > 0 ? '#721c24' : '#856404' 
      }}>
        {allIssues.map((issue, index) => (
          <li key={index} style={{ 
            marginBottom: '5px',
            fontWeight: issue.severity === 'error' ? 'bold' : 'normal'
          }}>
            {issue.message}
          </li>
        ))}
      </ul>
      
      {errors.length > 0 && (
        <div style={{
          marginTop: '10px',
          fontSize: '14px',
          fontStyle: 'italic',
          color: '#721c24'
        }}>
          Please adjust your route parameters to meet the requirements.
        </div>
      )}
    </div>
  );
};

export default RouteValidationWarnings;
