/**
 * BigQuery Spatial Lakehouse & GIS Connector
 * Generates production BigQuery GIS SQL, partitioned streaming ingestion statements,
 * and Uber H3 hexagonal spatial indexing for massive geospatial telemetry scale.
 */

export const ALLOWED_TABLES = new Set([
  'aetheris.maritime.live_ais',
  'aetheris.infrastructure.subsea_cables',
  'aetheris.energy.datacenters',
  'aetheris.energy.substations',
  'aetheris.environment.open_meteo_live',
]);

export function validateTableName(table) {
  if (!ALLOWED_TABLES.has(table)) {
    throw new Error(`[SQL_INJECTION_BLOCKED] Table '${table}' is not in the allowlist. Allowed: ${[...ALLOWED_TABLES].join(', ')}`);
  }
  return table;
}

/**
 * Converts geodetic coordinates to an H3 hexagonal cell index.
 * 
 * NOTE: This is a placeholder that generates deterministic pseudo-H3 indices.
 * For production, install `h3-js` and use: import { latLngToCell } from 'h3-js';
 * 
 * @param {number} lat - Latitude in decimal degrees [-90, 90]
 * @param {number} lon - Longitude in decimal degrees [-180, 180]  
 * @param {number} resolution - H3 resolution level (0-15, default 7)
 * @returns {string} H3 index string
 */
export function latLonToH3Index(lat, lon, resolution = 7) {
  // Input validation
  if (lat < -90 || lat > 90) throw new RangeError(`Latitude ${lat} out of bounds [-90, 90]`);
  if (lon < -180 || lon > 180) throw new RangeError(`Longitude ${lon} out of bounds [-180, 180]`);
  if (resolution < 0 || resolution > 15) throw new RangeError(`Resolution ${resolution} out of bounds [0, 15]`);
  
  // TODO: Replace with real h3-js implementation:
  // import { latLngToCell } from 'h3-js';
  // return latLngToCell(lat, lon, resolution);
  
  // Deterministic placeholder using geohash-style encoding
  const latBin = Math.floor(((lat + 90) / 180) * (1 << 20));
  const lonBin = Math.floor(((lon + 180) / 360) * (1 << 20));
  const combined = (BigInt(resolution) << 40n) | (BigInt(latBin) << 20n) | BigInt(lonBin);
  return `8${resolution.toString(16)}${combined.toString(16).padStart(12, '0')}`;
}

/**
 * Generates an optimized BigQuery GIS streaming ingest statement with
 * GEOGRAPHY types and clustering keys.
 * 
 * @param {string} dataset 
 * @param {string} table 
 * @param {Array<object>} records 
 * @returns {object} Executable SQL query and parameters
 */
export function generateSpatialIngestSQL(dataset, table, records) {
  // Validate table name
  const fullTable = `${validateTableName(`${dataset}.${table}`)}`;
  
  if (!records || records.length === 0) return { sql: '', params: {} };
  
  // Return parameterized SQL + params for BigQuery client
  const rows = records.map((r, i) => ({
    entity_id: String(r.id || r.mmsi || 'UNKNOWN'),
    entity_name: String(r.name || 'UNKNOWN'),
    lat: Number(r.lat),
    lon: Number(r.lon),
    speed_knots: Number(r.speedKnots ?? r.velocity ?? 0),
    h3_cell: latLonToH3Index(Number(r.lat), Number(r.lon)),
  }));
  
  return {
    sql: `INSERT INTO \`${fullTable}\` (entity_id, entity_name, location_geog, speed_knots, h3_res7_cell, recorded_at) VALUES ${rows.map(() => '(?, ?, ST_GEOGPOINT(?, ?), ?, ?, CURRENT_TIMESTAMP())').join(', ')}`,
    params: rows,
    warning: 'Use BigQuery client library with parameterized queries. Do NOT execute this SQL via string concatenation.'
  };
}

/**
 * Generates production BigQuery GIS query to detect marine vessels loitering
 * within a buffer distance of undersea telecommunications cables.
 * 
 * @param {object} options
 * @param {string} options.vesselTable (e.g. `aetheris.maritime.live_ais`)
 * @param {string} options.cableTable (e.g. `aetheris.infrastructure.subsea_cables`)
 * @param {number} options.bufferMeters (default 500)
 * @param {number} options.speedKnotsMax (default 2.0)
 * @param {number} options.windowHours (default 2)
 * @returns {string}
 */
export function generateSubseaLoiteringQuery({
  vesselTable = 'aetheris.maritime.live_ais',
  cableTable = 'aetheris.infrastructure.subsea_cables',
  bufferMeters = 500,
  speedKnotsMax = 2.0,
  windowHours = 2
} = {}) {
  const vTable = validateTableName(vesselTable);
  const cTable = validateTableName(cableTable);
  
  const buffer = Number(bufferMeters);
  const speedMax = Number(speedKnotsMax);
  const winHours = Number(windowHours);
  
  if (isNaN(buffer) || isNaN(speedMax) || isNaN(winHours)) {
    throw new TypeError('Numeric parameters must be valid numbers');
  }

  return `WITH RecentVessels AS (
  SELECT
    entity_id AS mmsi,
    entity_name AS vessel_name,
    location_geog,
    speed_knots,
    recorded_at,
    h3_res7_cell
  FROM
    \`${vTable}\`
  WHERE
    recorded_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL ${winHours} HOUR)
    AND speed_knots <= ${speedMax}
),
ProximityEvents AS (
  SELECT
    v.mmsi,
    v.vessel_name,
    c.cable_id,
    c.cable_name,
    c.landing_station,
    ROUND(ST_DISTANCE(v.location_geog, c.cable_geog), 2) AS distance_to_cable_meters,
    v.speed_knots,
    v.recorded_at,
    v.h3_res7_cell
  FROM
    RecentVessels v
  JOIN
    \`${cTable}\` c
  ON
    ST_DWITHIN(v.location_geog, c.cable_geog, ${buffer})
)
SELECT
  mmsi,
  vessel_name,
  cable_id,
  cable_name,
  MIN(distance_to_cable_meters) AS min_distance_meters,
  AVG(speed_knots) AS avg_speed_knots,
  COUNT(*) AS ping_count_in_zone,
  TIMESTAMP_DIFF(MAX(recorded_at), MIN(recorded_at), MINUTE) AS dwell_time_minutes,
  CASE
    WHEN COUNT(*) >= 6 AND AVG(speed_knots) < 1.0 THEN 'CRITICAL_ANCHOR_DRAG'
    WHEN COUNT(*) >= 3 THEN 'ELEVATED_LOITERING'
    ELSE 'MONITOR'
  END AS threat_classification
FROM
  ProximityEvents
GROUP BY
  mmsi, vessel_name, cable_id, cable_name
HAVING
  dwell_time_minutes >= 30 OR ping_count_in_zone >= 3
ORDER BY
  min_distance_meters ASC;`;
}

/**
 * Generates BigQuery query to correlate datacenter power draw with
 * regional ambient heat spikes to flag substation overload risks.
 * 
 * @param {object} options 
 * @returns {string}
 */
export function generateDatacenterGridStrainQuery({
  datacenterTable = 'aetheris.energy.datacenters',
  substationTable = 'aetheris.energy.substations',
  weatherTable = 'aetheris.environment.open_meteo_live',
  heatThresholdCelsius = 38.0,
  utilizationThresholdPercent = 85.0
} = {}) {
  const dcTable = validateTableName(datacenterTable);
  const subTable = validateTableName(substationTable);
  const wTable = validateTableName(weatherTable);
  
  const heatC = Number(heatThresholdCelsius);
  const utilPct = Number(utilizationThresholdPercent);
  
  if (isNaN(heatC) || isNaN(utilPct)) {
    throw new TypeError('Numeric parameters must be valid numbers');
  }

  return `WITH DatacenterGridJoin AS (
  SELECT
    d.datacenter_id,
    d.name AS datacenter_name,
    d.current_draw_mw,
    s.substation_id,
    s.name AS substation_name,
    s.rated_capacity_mw,
    ROUND((d.current_draw_mw / s.rated_capacity_mw) * 100.0, 1) AS load_utilization_pct,
    w.ambient_temp_c,
    w.heat_index_c
  FROM
    \`${dcTable}\` d
  JOIN
    \`${subTable}\` s
  ON
    d.substation_id = s.substation_id
  JOIN
    \`${wTable}\` w
  ON
    ST_DWITHIN(s.location_geog, w.station_geog, 25000)
)
SELECT
  datacenter_name,
  substation_name,
  current_draw_mw,
  rated_capacity_mw,
  load_utilization_pct,
  ambient_temp_c,
  CASE
    WHEN load_utilization_pct >= ${utilPct} AND ambient_temp_c >= ${heatC} THEN 'CRITICAL_THERMAL_OVERLOAD'
    WHEN load_utilization_pct >= ${utilPct} THEN 'STRAINED_HIGH_LOAD'
    WHEN ambient_temp_c >= ${heatC} THEN 'ELEVATED_AMBIENT_HEAT'
    ELSE 'NOMINAL'
  END AS grid_status
FROM
  DatacenterGridJoin
WHERE
  load_utilization_pct >= 70.0 OR ambient_temp_c >= 35.0
ORDER BY
  load_utilization_pct DESC;`;
}
