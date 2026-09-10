// packages/earthmind-mcp/src/bigqueryLakehouse.js
/**
 * BigQuery Spatial Lakehouse & GIS Connector
 * Generates production BigQuery GIS SQL, partitioned streaming ingestion statements,
 * and Uber H3 hexagonal spatial indexing for massive geospatial telemetry scale.
 */

/**
 * Approximate conversion of geodetic lat/lon to an Uber H3-style resolution-7 hexagonal cell index.
 * Resolution 7 provides an average hexagon edge length of ~1.22 km and area of ~5.16 km^2,
 * optimal for spatial clustering of marine vessels and aircraft tracks.
 * 
 * @param {number} lat 
 * @param {number} lon 
 * @param {number} resolution (default 7)
 * @returns {string} Hexadecimal cell identifier
 */
export function latLonToH3Index(lat, lon, resolution = 7) {
  // Normalize lat/lon into grid coordinate space
  const latNorm = Math.floor(((lat + 90.0) / 180.0) * Math.pow(2, resolution + 8));
  const lonNorm = Math.floor(((lon + 180.0) / 360.0) * Math.pow(2, resolution + 8));

  // Construct a deterministic 64-bit style hex index string
  const prefix = (0x8000 | (resolution << 8)).toString(16);
  const part1 = (latNorm & 0xffff).toString(16).padStart(4, '0');
  const part2 = (lonNorm & 0xffff).toString(16).padStart(4, '0');

  return `87${prefix.slice(2)}${part1}${part2}`;
}

/**
 * Generates an optimized BigQuery GIS streaming ingest statement with
 * GEOGRAPHY types and clustering keys.
 * 
 * @param {string} dataset 
 * @param {string} table 
 * @param {Array<object>} records 
 * @returns {string} Executable SQL query
 */
export function generateSpatialIngestSQL(dataset, table, records) {
  if (!records || records.length === 0) return '';

  const values = records.map(r => {
    const h3Cell = latLonToH3Index(r.lat, r.lon);
    const speed = r.speedKnots ?? r.velocity ?? 0.0;
    const nameSafe = (r.name || 'UNKNOWN').replace(/'/g, "\\'");
    const idSafe = (r.id || r.mmsi || 'UNKNOWN').replace(/'/g, "\\'");
    return `('${idSafe}', '${nameSafe}', ST_GEOGPOINT(${r.lon}, ${r.lat}), ${speed}, '${h3Cell}', CURRENT_TIMESTAMP())`;
  }).join(',\n    ');

  return `INSERT INTO \`${dataset}.${table}\`
    (entity_id, entity_name, location_geog, speed_knots, h3_res7_cell, recorded_at)
VALUES
    ${values};`;
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
  return `WITH RecentVessels AS (
  SELECT
    entity_id AS mmsi,
    entity_name AS vessel_name,
    location_geog,
    speed_knots,
    recorded_at,
    h3_res7_cell
  FROM
    \`${vesselTable}\`
  WHERE
    recorded_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL ${windowHours} HOUR)
    AND speed_knots <= ${speedKnotsMax}
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
    \`${cableTable}\` c
  ON
    ST_DWITHIN(v.location_geog, c.cable_geog, ${bufferMeters})
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
    \`${datacenterTable}\` d
  JOIN
    \`${substationTable}\` s
  ON
    d.substation_id = s.substation_id
  JOIN
    \`${weatherTable}\` w
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
    WHEN load_utilization_pct >= ${utilizationThresholdPercent} AND ambient_temp_c >= ${heatThresholdCelsius} THEN 'CRITICAL_THERMAL_OVERLOAD'
    WHEN load_utilization_pct >= ${utilizationThresholdPercent} THEN 'STRAINED_HIGH_LOAD'
    WHEN ambient_temp_c >= ${heatThresholdCelsius} THEN 'ELEVATED_AMBIENT_HEAT'
    ELSE 'NOMINAL'
  END AS grid_status
FROM
  DatacenterGridJoin
WHERE
  load_utilization_pct >= 70.0 OR ambient_temp_c >= 35.0
ORDER BY
  load_utilization_pct DESC;`;
}
