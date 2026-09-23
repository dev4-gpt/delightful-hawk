/**
 * Google Photorealistic 3D Mesh Coverage Classification Matrix
 * 
 * Classifies geographic coordinates into either:
 * 1. 3D_PHOTOGRAMMETRIC_MESH: Full 3D polygonal building geometry with photoreal
 *    facade textures (present in major metropolitan cores: Tokyo, NYC, SF, London, etc.)
 * 2. 3D_ELEVATION_TERRAIN_ORTHO: 3D Digital Elevation Model (DEM) terrain draped with
 *    sub-meter satellite orthophotography (global baseline, regional cities, suburbs).
 */

export const METRO_3D_MESH_ZONES = [
  // Japan
  { name: 'Tokyo Metropolis', minLat: 35.50, maxLat: 35.85, minLon: 139.50, maxLon: 139.95, region: 'Asia-Pacific' },
  { name: 'Osaka-Kyoto-Kobe', minLat: 34.55, maxLat: 35.10, minLon: 135.10, maxLon: 135.85, region: 'Asia-Pacific' },
  { name: 'Nagoya Metro', minLat: 35.05, maxLat: 35.28, minLon: 136.75, maxLon: 137.05, region: 'Asia-Pacific' },
  { name: 'Fukuoka', minLat: 33.50, maxLat: 33.70, minLon: 130.30, maxLon: 130.50, region: 'Asia-Pacific' },

  // United States & Canada
  { name: 'New York Metro', minLat: 40.50, maxLat: 40.95, minLon: -74.15, maxLon: -73.70, region: 'North America' },
  { name: 'San Francisco Bay Area', minLat: 37.20, maxLat: 37.95, minLon: -122.55, maxLon: -121.80, region: 'North America' },
  { name: 'Los Angeles Basin', minLat: 33.70, maxLat: 34.35, minLon: -118.65, maxLon: -118.10, region: 'North America' },
  { name: 'Chicago Metro', minLat: 41.65, maxLat: 42.10, minLon: -87.85, maxLon: -87.50, region: 'North America' },
  { name: 'Austin Metro', minLat: 30.15, maxLat: 30.45, minLon: -97.85, maxLon: -97.60, region: 'North America' },
  { name: 'Seattle Metro', minLat: 47.45, maxLat: 47.75, minLon: -122.45, maxLon: -122.20, region: 'North America' },
  { name: 'Boston Metro', minLat: 42.25, maxLat: 42.42, minLon: -71.18, maxLon: -70.98, region: 'North America' },
  { name: 'Washington DC Metro', minLat: 38.80, maxLat: 39.00, minLon: -77.15, maxLon: -76.90, region: 'North America' },
  { name: 'Miami Metro', minLat: 25.65, maxLat: 25.95, minLon: -80.35, maxLon: -80.10, region: 'North America' },
  { name: 'Toronto Metro', minLat: 43.58, maxLat: 43.85, minLon: -79.60, maxLon: -79.20, region: 'North America' },
  { name: 'Vancouver Metro', minLat: 49.18, maxLat: 49.32, minLon: -123.25, maxLon: -122.95, region: 'North America' },
  { name: 'Montreal Metro', minLat: 45.42, maxLat: 45.60, minLon: -73.72, maxLon: -73.48, region: 'North America' },

  // Europe
  { name: 'Greater London', minLat: 51.28, maxLat: 51.69, minLon: -0.51, maxLon: 0.33, region: 'Europe' },
  { name: 'Paris Île-de-France', minLat: 48.70, maxLat: 49.00, minLon: 2.10, maxLon: 2.55, region: 'Europe' },
  { name: 'Berlin Metro', minLat: 52.35, maxLat: 52.65, minLon: 13.10, maxLon: 13.75, region: 'Europe' },
  { name: 'Munich Metro', minLat: 48.05, maxLat: 48.25, minLon: 11.40, maxLon: 11.72, region: 'Europe' },
  { name: 'Frankfurt Metro', minLat: 50.00, maxLat: 50.20, minLon: 8.50, maxLon: 8.80, region: 'Europe' },
  { name: 'Rome Metro', minLat: 41.75, maxLat: 42.02, minLon: 12.35, maxLon: 12.65, region: 'Europe' },
  { name: 'Milan Metro', minLat: 45.38, maxLat: 45.54, minLon: 9.08, maxLon: 9.30, region: 'Europe' },
  { name: 'Madrid Metro', minLat: 40.30, maxLat: 40.55, minLon: -3.85, maxLon: -3.55, region: 'Europe' },
  { name: 'Barcelona Metro', minLat: 41.30, maxLat: 41.50, minLon: 2.05, maxLon: 2.25, region: 'Europe' },
  { name: 'Amsterdam Metro', minLat: 52.28, maxLat: 52.44, minLon: 4.75, maxLon: 5.05, region: 'Europe' },
  { name: 'Zurich Metro', minLat: 47.32, maxLat: 47.45, minLon: 8.45, maxLon: 8.62, region: 'Europe' },
  { name: 'Vienna Metro', minLat: 48.12, maxLat: 48.30, minLon: 16.25, maxLon: 16.50, region: 'Europe' },

  // Asia-Pacific & Oceania
  { name: 'Singapore Metro', minLat: 1.20, maxLat: 1.48, minLon: 103.60, maxLon: 104.05, region: 'Asia-Pacific' },
  { name: 'Sydney Metro', minLat: -33.95, maxLat: -33.70, minLon: 151.05, maxLon: 151.35, region: 'Oceania' },
  { name: 'Melbourne Metro', minLat: -38.00, maxLat: -37.65, minLon: 144.80, maxLon: 145.20, region: 'Oceania' },
  { name: 'Brisbane Metro', minLat: -27.55, maxLat: -27.35, minLon: 152.90, maxLon: 153.15, region: 'Oceania' },
  { name: 'Auckland Metro', minLat: -36.95, maxLat: -36.75, minLon: 174.65, maxLon: 174.90, region: 'Oceania' }
];

/**
 * Detects whether the given coordinates reside within a verified Google 3D Photogrammetric Mesh zone.
 * @param {number} lat Latitude in degrees
 * @param {number} lon Longitude in degrees
 * @returns {object} Classification object with coverage details
 */
export function detectCoverageKind(lat, lon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return {
      is3DMesh: false,
      kind: '3D_ELEVATION_TERRAIN_ORTHO',
      label: '3D Elevation + Satellite Orthophoto',
      zoneName: null,
      badgeText: 'TERRAIN: 3D ELEVATION + SATELLITE',
      streamQuality: 'STANDARD_ORTHO_LOD',
      color: '#fbbf24',
      description: 'Terrain elevation model draped with high-resolution satellite imagery.'
    };
  }

  for (const zone of METRO_3D_MESH_ZONES) {
    if (lat >= zone.minLat && lat <= zone.maxLat && lon >= zone.minLon && lon <= zone.maxLon) {
      return {
        is3DMesh: true,
        kind: '3D_PHOTOGRAMMETRIC_MESH',
        label: `3D Photogrammetric Mesh (${zone.name})`,
        zoneName: zone.name,
        region: zone.region,
        badgeText: `TERRAIN: 3D MESH [${zone.name.toUpperCase()}]`,
        streamQuality: 'ULTRA_PHOTOGRAMMETRY_LOD',
        color: '#00f0ff',
        description: `Full 3D photogrammetric building meshes & geometry in ${zone.name}.`
      };
    }
  }

  return {
    is3DMesh: false,
    kind: '3D_ELEVATION_TERRAIN_ORTHO',
    label: '3D Elevation + Satellite Orthophoto',
    zoneName: null,
    region: 'Global',
    badgeText: 'TERRAIN: 3D ELEVATION + SATELLITE',
    streamQuality: 'STANDARD_ORTHO_LOD',
    color: '#fbbf24',
    description: 'Terrain elevation model draped with high-resolution satellite imagery.'
  };
}
