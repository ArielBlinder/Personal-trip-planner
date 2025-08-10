import { useCallback } from 'react';
import L from 'leaflet';

// Routing service configuration
const ROUTING_SERVICES = {
  BROUTER: {
    name: 'BRouter',
    priority: 1,
    profiles: {
      hiking: 'hiking',
      cycling: 'fastbike'
    },
    dashArrays: {
      hiking: '8, 4',
      cycling: '12, 8'
    }
  },
  OPENROUTE: {
    name: 'OpenRouteService',
    priority: 2,
    profiles: {
      hiking: 'foot-hiking',
      cycling: 'cycling-regular'
    },
    dashArrays: {
      hiking: '12, 6',
      cycling: '16, 6'
    }
  },
  OSRM: {
    name: 'OSRM',
    priority: 3,
    profiles: {
      hiking: 'foot',
      cycling: 'driving'
    },
    dashArrays: {
      hiking: 'solid',
      cycling: 'solid'
    }
  }
};

// Distance calculation utility
export const calculateDistanceFromCoordinates = (coordinates) => {
  if (!coordinates || coordinates.length < 2) return 0;
  
  const toRadians = (degrees) => degrees * (Math.PI / 180);
  const R = 6371; // Earth's radius in kilometers
  
  let totalDistance = 0;
  for (let i = 1; i < coordinates.length; i++) {
    const [lng1, lat1] = coordinates[i - 1];
    const [lng2, lat2] = coordinates[i];
    
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    totalDistance += R * c;
  }
  
  return totalDistance;
};

// Generic routing service interface
class RoutingService {
  constructor(config) {
    this.config = config;
  }

  async route(waypoints, profile) {
    throw new Error('route method must be implemented');
  }

  createLayer(geojson, color, profile) {
    const dashArray = this.config.dashArrays[profile];
    return L.geoJSON(geojson, {
      style: { 
        color,
        weight: 6,
        opacity: 0.9,
        dashArray: dashArray === 'solid' ? undefined : dashArray
      }
    });
  }
}

// BRouter implementation
class BRouterService extends RoutingService {
  async route(waypoints, profile) {
    if (waypoints.length < 2) return null;
    
    // Build lonlats string for all waypoints
    const lonlats = waypoints.map(wp => `${wp.lng},${wp.lat}`).join('|');
    const brouterProfile = this.config.profiles[profile];
    
    const url = `https://brouter.de/brouter?lonlats=${lonlats}&profile=${brouterProfile}&alternativeidx=0&format=geojson`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`${this.config.name} API error: ${response.status}`);
    }
    
    const geojson = await response.json();
    
    if (geojson.features && geojson.features.length > 0) {
      const feature = geojson.features[0];
      let distance = 0;
      
      if (feature.properties && feature.properties.distance) {
        distance = feature.properties.distance / 1000; // Convert to km
      } else if (feature.geometry && feature.geometry.coordinates) {
        distance = calculateDistanceFromCoordinates(feature.geometry.coordinates);
      }
      
      return { geojson, distance };
    }
    
    return null;
  }
}

// OpenRouteService implementation
class OpenRouteService extends RoutingService {
  async route(waypoints, profile) {
    if (waypoints.length < 2) return null;
    
    const coordinates = waypoints.map(wp => [wp.lng, wp.lat]);
    const orsProfile = this.config.profiles[profile];
    const url = `https://api.openrouteservice.org/v2/directions/${orsProfile}/geojson`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add API key here when available
      },
      body: JSON.stringify({
        coordinates,
        instructions: false,
        preference: "recommended"
      })
    });
    
    if (!response.ok) {
      throw new Error(`${this.config.name} API error: ${response.status}`);
    }
    
    const geojson = await response.json();
    
    if (geojson.features && geojson.features.length > 0) {
      const feature = geojson.features[0];
      let distance = 0;
      
      if (feature.properties && feature.properties.segments) {
        distance = feature.properties.segments.reduce((total, segment) => {
          return total + (segment.distance || 0);
        }, 0) / 1000;
      } else if (feature.properties && feature.properties.summary) {
        distance = (feature.properties.summary.distance || 0) / 1000;
      } else if (feature.geometry && feature.geometry.coordinates) {
        distance = calculateDistanceFromCoordinates(feature.geometry.coordinates);
      }
      
      return { geojson, distance };
    }
    
    return null;
  }
}

// OSRM implementation - needs special handling since it requires a map instance
class OSRMService extends RoutingService {
  async route(waypoints, profile, map) {
    if (!map) {
      throw new Error('Map instance required for OSRM routing');
    }
    
    return new Promise((resolve, reject) => {
      const osrmProfile = this.config.profiles[profile];
      
      const control = L.Routing.control({
        waypoints,
        routeWhileDragging: false,
        draggableWaypoints: false,
        addWaypoints: false,
        show: false,
        router: L.Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1',
          profile: osrmProfile
        }),
        lineOptions: {
          styles: [{ color: '#000000', opacity: 0.8, weight: 5 }] // Will be overridden
        },
        createMarker: () => null
      });

      let resolved = false;

      control.on("routesfound", (e) => {
        if (!resolved && e.routes && e.routes[0]) {
          resolved = true;
          const distance = (e.routes[0].summary?.totalDistance || 0) / 1000;
          resolve({ control, distance });
        }
      });

      control.on("routingerror", (e) => {
        if (!resolved) {
          resolved = true;
          resolve(null);
        }
      });

      // Add timeout to prevent hanging
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(null);
        }
      }, 10000); // 10 second timeout
      
      // Add the control to the map - this is what triggers the routing!
      try {
        control.addTo(map);
      } catch (error) {
        console.error('OSRM: Error adding control to map:', error);
        resolved = true;
        resolve(null);
      }
    });
  }
}

export const useRouting = () => {
  const services = [
    new BRouterService(ROUTING_SERVICES.BROUTER),
    new OpenRouteService(ROUTING_SERVICES.OPENROUTE),
    new OSRMService(ROUTING_SERVICES.OSRM)
  ];

  const calculateRoute = useCallback(async (waypoints, color, profile, map) => {
    for (const service of services) {
      try {
        // Pass map instance to OSRM service, others don't need it
        const result = service instanceof OSRMService 
          ? await service.route(waypoints, profile, map)
          : await service.route(waypoints, profile);
        
        if (result) {
          if (result.geojson) {
            // GeoJSON-based services (BRouter, OpenRouteService)
            const layer = service.createLayer(result.geojson, color, profile);
            layer.actualDistance = result.distance;
            return { layer, distance: result.distance, service: service.config.name };
          } else if (result.control) {
            // OSRM control-based service
            // Update the line style with the correct color
            result.control.options.lineOptions = {
              styles: [{ color, opacity: 0.8, weight: 5 }]
            };
            return { 
              layer: result.control, 
              distance: result.distance, 
              service: service.config.name,
              isControl: true // Flag to identify OSRM controls
            };
          }
        }
      } catch (error) {
        console.warn(`${service.config.name} routing failed:`, error.message);
        continue;
      }
    }
    
    console.warn('All routing services failed for this segment');
    return null;
  }, []);

  return { calculateRoute };
};
