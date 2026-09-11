/**
 * Core 3D Geodetic & Spatial Math Primitives
 * WGS84 ellipsoid constants and spatial analytical functions for AI agents.
 */

export const WGS84_SEMI_MAJOR_AXIS = 6378137.0; // meters (a)
export const WGS84_SEMI_MINOR_AXIS = 6356752.314245; // meters (b)
export const WGS84_FLATTENING = 1 / 298.257223563; // f
export const WGS84_E_SQUARED = 0.00669437999014; // e^2
export const WGS84_MEAN_RADIUS = 6371008.8; // Mean Earth radius in meters

/**
 * Calculates Great-Circle distance between two coordinates in meters (Haversine formula).
 * @param {number} lat1 Latitude 1 in degrees
 * @param {number} lon1 Longitude 1 in degrees
 * @param {number} lat2 Latitude 2 in degrees
 * @param {number} lon2 Longitude 2 in degrees
 * @returns {number} Distance in meters
 */
export function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = WGS84_MEAN_RADIUS;
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
  const R = WGS84_MEAN_RADIUS;
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

  const R = WGS84_MEAN_RADIUS;

  for (let i = 0; i < path.length - 1; i++) {
    const p1 = path[i];
    const p2 = path[i + 1];
    
    // Antimeridian handling for segment
    let p2Lon = p2.lon;
    if (Math.abs(p2Lon - p1.lon) > 180) {
      p2Lon += p2Lon < p1.lon ? 360 : -360;
    }
    
    // Antimeridian handling for point
    let ptLon = point.lon;
    if (Math.abs(ptLon - p1.lon) > 180) {
      ptLon += ptLon < p1.lon ? 360 : -360;
    }

    const dist12 = haversineDistanceMeters(p1.lat, p1.lon, p2.lat, p2Lon);
    if (dist12 === 0) continue;
    
    const bearing12 = calculateBearing(p1.lat, p1.lon, p2.lat, p2Lon) * Math.PI / 180;
    const bearing13 = calculateBearing(p1.lat, p1.lon, point.lat, ptLon) * Math.PI / 180;
    const dist13 = haversineDistanceMeters(p1.lat, p1.lon, point.lat, ptLon);

    const crossTrackDist = Math.asin(Math.sin(dist13 / R) * Math.sin(bearing13 - bearing12)) * R;
    const alongTrackDist = Math.acos(Math.cos(dist13 / R) / Math.cos(crossTrackDist / R)) * R;

    let d;
    let closestPtLat, closestPtLon;

    if (alongTrackDist < 0) {
      d = dist13;
      closestPtLat = p1.lat;
      closestPtLon = p1.lon;
    } else if (alongTrackDist > dist12) {
      d = haversineDistanceMeters(p2.lat, p2Lon, point.lat, ptLon);
      closestPtLat = p2.lat;
      closestPtLon = p2Lon;
    } else {
      d = Math.abs(crossTrackDist);
      const fraction = alongTrackDist / dist12;
      closestPtLat = p1.lat + fraction * (p2.lat - p1.lat);
      closestPtLon = p1.lon + fraction * (p2Lon - p1.lon);
    }
    
    closestPtLon = ((closestPtLon + 180) % 360) - 180;

    if (d < minDistance) {
      minDistance = d;
      closestVertex = { lat: closestPtLat, lon: closestPtLon };
      segmentIdx = i;
    }
  }

  return {
    minDistanceM: Math.round(minDistance),
    closestPoint: closestVertex,
    segmentIndex: segmentIdx
  };
}
