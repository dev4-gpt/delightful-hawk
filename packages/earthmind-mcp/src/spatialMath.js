// packages/earthmind-mcp/src/spatialMath.js
/**
 * Core 3D Geodetic & Spatial Math Primitives
 * WGS84 ellipsoid constants and spatial analytical functions for AI agents.
 */

export const WGS84_SEMI_MAJOR_AXIS = 6378137.0; // meters (a)
export const WGS84_SEMI_MINOR_AXIS = 6356752.314245; // meters (b)
export const WGS84_FLATTENING = 1 / 298.257223563; // f
export const WGS84_E_SQUARED = 0.00669437999014; // e^2

/**
 * Calculates Great-Circle distance between two coordinates in meters (Haversine formula).
 * @param {number} lat1 Latitude 1 in degrees
 * @param {number} lon1 Longitude 1 in degrees
 * @param {number} lat2 Latitude 2 in degrees
 * @param {number} lon2 Longitude 2 in degrees
 * @returns {number} Distance in meters
 */
export function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371008.8; // Mean Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180.0;
  const dLon = ((lon2 - lon1) * Math.PI) / 180.0;
  const radLat1 = (lat1 * Math.PI) / 180.0;
  const radLat2 = (lat2 * Math.PI) / 180.0;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(radLat1) * Math.cos(radLat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates initial bearing / forward azimuth from origin to target in degrees [0, 360).
 */
export function calculateBearing(lat1, lon1, lat2, lon2) {
  const radLat1 = (lat1 * Math.PI) / 180.0;
  const radLat2 = (lat2 * Math.PI) / 180.0;
  const dLon = ((lon2 - lon1) * Math.PI) / 180.0;

  const y = Math.sin(dLon) * Math.cos(radLat2);
  const x =
    Math.cos(radLat1) * Math.sin(radLat2) -
    Math.sin(radLat1) * Math.cos(radLat2) * Math.cos(dLon);
  const brng = (Math.atan2(y, x) * 180.0) / Math.PI;
  return (brng + 360) % 360;
}

/**
 * Converts Geodetic (lat, lon, alt) to Earth-Centered Earth-Fixed (ECEF) coordinates.
 * @returns {{x: number, y: number, z: number}} ECEF coords in meters
 */
export function geodeticToECEF(lat, lon, alt = 0) {
  const radLat = (lat * Math.PI) / 180.0;
  const radLon = (lon * Math.PI) / 180.0;

  const sinLat = Math.sin(radLat);
  const cosLat = Math.cos(radLat);
  const sinLon = Math.sin(radLon);
  const cosLon = Math.cos(radLon);

  const N = WGS84_SEMI_MAJOR_AXIS / Math.sqrt(1.0 - WGS84_E_SQUARED * sinLat * sinLat);

  const x = (N + alt) * cosLat * cosLon;
  const y = (N + alt) * cosLat * sinLon;
  const z = (N * (1.0 - WGS84_E_SQUARED) + alt) * sinLat;

  return { x, y, z };
}

/**
 * Calculates 3D Euclidian distance between two ECEF points.
 */
export function ecefDistance(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = p1.z - p2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calculates 3D Line-of-Sight (LOS) considering Earth curvature and optional terrain obstruction.
 * @param {{lat: number, lon: number, alt: number}} observer Observer position
 * @param {{lat: number, lon: number, alt: number}} target Target position
 * @returns {{hasLineOfSight: boolean, surfaceDistanceM: number, straightLineDistanceM: number, horizonDistanceObsM: number, horizonDistanceTgtM: number}}
 */
export function evaluateLineOfSight(observer, target) {
  const R = 6371008.8; // Earth radius
  const surfaceDist = haversineDistanceMeters(observer.lat, observer.lon, target.lat, target.lon);

  const obsECEF = geodeticToECEF(observer.lat, observer.lon, observer.alt);
  const tgtECEF = geodeticToECEF(target.lat, target.lon, target.alt);
  const straightLineDist = ecefDistance(obsECEF, tgtECEF);

  // Geometric horizon distance: d = sqrt(2 * R * h + h^2)
  const d1 = Math.sqrt(2 * R * Math.max(0, observer.alt) + Math.pow(Math.max(0, observer.alt), 2));
  const d2 = Math.sqrt(2 * R * Math.max(0, target.alt) + Math.pow(Math.max(0, target.alt), 2));
  const maxGeometricLOS = d1 + d2;

  const hasLineOfSight = surfaceDist <= maxGeometricLOS;

  return {
    hasLineOfSight,
    surfaceDistanceM: Math.round(surfaceDist),
    straightLineDistanceM: Math.round(straightLineDist),
    horizonDistanceObsM: Math.round(d1),
    horizonDistanceTgtM: Math.round(d2),
    maxGeometricLineOfSightM: Math.round(maxGeometricLOS)
  };
}

/**
 * Calculates closest distance from a point to a segmented path (e.g. submarine cable line).
 * @param {{lat: number, lon: number}} point Coordinate to test
 * @param {Array<{lat: number, lon: number}>} path Array of coordinate vertices
 * @returns {{minDistanceM: number, closestPoint: {lat: number, lon: number}, segmentIndex: number}}
 */
export function pointToPathDistance(point, path) {
  if (!path || path.length === 0) return { minDistanceM: Infinity, closestPoint: null, segmentIndex: -1 };
  if (path.length === 1) {
    const dist = haversineDistanceMeters(point.lat, point.lon, path[0].lat, path[0].lon);
    return { minDistanceM: dist, closestPoint: path[0], segmentIndex: 0 };
  }

  let minDistance = Infinity;
  let closestVertex = path[0];
  let segmentIdx = 0;

  for (let i = 0; i < path.length - 1; i++) {
    const p1 = path[i];
    const p2 = path[i + 1];
    
    // Sample along segment at 10 intervals
    for (let t = 0; t <= 1.0; t += 0.1) {
      const sampleLat = p1.lat + t * (p2.lat - p1.lat);
      const sampleLon = p1.lon + t * (p2.lon - p1.lon);
      const d = haversineDistanceMeters(point.lat, point.lon, sampleLat, sampleLon);
      if (d < minDistance) {
        minDistance = d;
        closestVertex = { lat: sampleLat, lon: sampleLon };
        segmentIdx = i;
      }
    }
  }

  return {
    minDistanceM: Math.round(minDistance),
    closestPoint: closestVertex,
    segmentIndex: segmentIdx
  };
}
