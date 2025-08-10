import { useRef, useCallback } from 'react';
import L from 'leaflet';
import { useRouting } from './useRouting';
import { useRouteValidation } from './useRouteValidation';

export const useMapRouting = () => {
  const routeRefs = useRef([]);
  const { calculateRoute } = useRouting();
  const { addDistanceValidation } = useRouteValidation();

  const dayColors = ['#2563eb', '#ff4433', '#4bff33', '#ffff33', '#ee33ff'];

  const clearRoutes = useCallback((map) => {
    routeRefs.current.forEach(route => {
      try {
        if (route && map) {
          if (route.removeFrom) {
            // GeoJSON layer (BRouter/OpenRouteService)
            route.removeFrom(map);
          } else if (route.options && route.options.lineOptions) {
            // OSRM routing control
            map.removeControl(route);
          } else if (map.hasLayer && map.hasLayer(route)) {
            // Fallback for other layer types
            map.removeLayer(route);
          }
        }
      } catch (error) {
        console.warn('Error removing route control:', error);
      }
    });
    routeRefs.current = [];
  }, []);

  const addRoutesToMap = useCallback(async (map, tripData) => {
    if (!tripData?.spots?.length || !map || !tripData.daily_info?.length) {
      return;
    }

    try {
      // Clear existing routes
      clearRoutes(map);

      // Fit map to route bounds
      const bounds = L.latLngBounds(tripData.spots.map(s => [s.lat, s.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });

      // Process each day's routing
      const routingPromises = tripData.daily_info.map(async (day, index) => {
        if (!day.day_locations || day.day_locations.length === 0) return null;

        const color = dayColors[index % dayColors.length];
        const waypoints = day.day_locations.map(location => L.latLng(location.lat, location.lng));
        const profile = tripData.type || 'hiking';

        try {
          const result = await calculateRoute(waypoints, color, profile, map);
          
          if (result) {
            const { layer, distance, service, isControl } = result;
            
            // Add layer to map with proper handling for different layer types
            if (isControl) {
              // OSRM control - already added to map during route calculation
            } else if (layer.addTo) {
              // GeoJSON layer - add as layer
              layer.addTo(map);
            } else {
              console.warn(`Unknown layer type for ${service}`);
              return null;
            }
            
            routeRefs.current.push(layer);
            
            // Validate distance
            addDistanceValidation(distance, profile, index + 1);
            
            return { day: index + 1, distance, service };
          }
        } catch (error) {
          console.error(`Error creating route for day ${index + 1}:`, error);
        }
        
        return null;
      });

      // Wait for all routing to complete
      const results = await Promise.all(routingPromises);
      
      // Hide routing instructions
      setTimeout(() => {
        const containers = document.querySelectorAll('.leaflet-routing-container');
        containers.forEach(container => {
          try {
            container.style.display = 'none';
          } catch (error) {
            console.warn('Error hiding routing container:', error);
          }
        });
      }, 100);

      return results.filter(Boolean);
      
    } catch (error) {
      console.error('Error in map routing:', error);
      return [];
    }
  }, [calculateRoute, addDistanceValidation, clearRoutes]);

  const cleanup = useCallback((map) => {
    clearRoutes(map);
  }, [clearRoutes]);

  return {
    addRoutesToMap,
    clearRoutes,
    cleanup
  };
};
