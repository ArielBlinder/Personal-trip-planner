import { useState, useCallback } from 'react';

// Validation constraints
const CONSTRAINTS = {
  hiking: {
    minDistance: 5,
    maxDistance: 15,
    requiresLoop: true,
    maxLoopDistance: 0.5 // 500m tolerance for loop closure
  },
  cycling: {
    maxDistance: 60,
    requiresLoop: false
  }
};

// Distance validation
const validateDayDistance = (distance, profile, dayNumber) => {
  const constraints = CONSTRAINTS[profile];
  if (!constraints) return [];

  const warnings = [];

  if (constraints.minDistance && distance < constraints.minDistance) {
    warnings.push({
      type: 'distance',
      severity: 'warning',
      day: dayNumber,
      message: `Day ${dayNumber}: Route is ${distance.toFixed(1)}km (below ${constraints.minDistance}km minimum for ${profile})`
    });
  }

  if (constraints.maxDistance && distance > constraints.maxDistance) {
    warnings.push({
      type: 'distance',
      severity: 'error',
      day: dayNumber,
      message: `Day ${dayNumber}: Route is ${distance.toFixed(1)}km (above ${constraints.maxDistance}km maximum for ${profile})`
    });
  }

  return warnings;
};

// Loop validation for hiking
const validateHikingLoop = (tripData) => {
  if (!tripData || tripData.type !== 'hiking' || !tripData.spots || tripData.spots.length < 2) {
    return { isValid: true, warnings: [] };
  }

  const constraints = CONSTRAINTS.hiking;
  const startPoint = tripData.spots[0];
  const endPoint = tripData.spots[tripData.spots.length - 1];

  // Calculate distance using Haversine formula
  const toRadians = (degrees) => degrees * (Math.PI / 180);
  const R = 6371; // Earth's radius in kilometers

  const dLat = toRadians(endPoint.lat - startPoint.lat);
  const dLng = toRadians(endPoint.lng - startPoint.lng);

  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(startPoint.lat)) * Math.cos(toRadians(endPoint.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  const isValid = distance <= constraints.maxLoopDistance;

  const warnings = isValid ? [] : [{
    type: 'loop',
    severity: 'warning',
    message: `Hiking route may not form a proper loop: start and end points are ${distance.toFixed(2)}km apart (should be ≤${constraints.maxLoopDistance}km)`
  }];

  return { isValid, warnings, distance };
};

export const useRouteValidation = () => {
  const [validationResults, setValidationResults] = useState({
    warnings: [],
    errors: [],
    isValid: true
  });

  const validateRoute = useCallback((tripData, routeDistances = []) => {
    const allWarnings = [];
    const allErrors = [];

    // Validate loop for hiking
    if (tripData?.type === 'hiking') {
      const loopValidation = validateHikingLoop(tripData);
      allWarnings.push(...loopValidation.warnings);
    }

    // Validate daily distances
    routeDistances.forEach((distance, index) => {
      const dayWarnings = validateDayDistance(distance, tripData?.type, index + 1);
      dayWarnings.forEach(warning => {
        if (warning.severity === 'error') {
          allErrors.push(warning);
        } else {
          allWarnings.push(warning);
        }
      });
    });

    const results = {
      warnings: allWarnings,
      errors: allErrors,
      isValid: allErrors.length === 0
    };

    setValidationResults(results);
    return results;
  }, []);

  const clearValidation = useCallback(() => {
    setValidationResults({
      warnings: [],
      errors: [],
      isValid: true
    });
  }, []);

  const addDistanceValidation = useCallback((distance, profile, dayNumber) => {
    const warnings = validateDayDistance(distance, profile, dayNumber);
    if (warnings.length > 0) {
      setValidationResults(prev => ({
        ...prev,
        warnings: [...prev.warnings, ...warnings.filter(w => w.severity !== 'error')],
        errors: [...prev.errors, ...warnings.filter(w => w.severity === 'error')],
        isValid: prev.isValid && warnings.every(w => w.severity !== 'error')
      }));
    }
  }, []);

  return {
    validationResults,
    validateRoute,
    clearValidation,
    addDistanceValidation
  };
};
