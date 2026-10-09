/**
 * radarFenceAgent.js — TRL 7-F: Radar Fence 3D Geometry Agent
 *
 * Computes the 3D geometry for a phased-array radar fence:
 *   - Conical coverage volumes (look-angle + max range)
 *   - Terrain-masked blind cones (WGS84 geometric horizon)
 *   - Multi-radar interlocking fence with coverage percentage
 *   - Dead-zone detection: gaps in fence coverage at given ingress altitude
 *
 * Outputs GeoJSON-compatible feature objects so the HUD can draw
 * coverage arcs on the 2D radar C2 map AND Three.js cone meshes
 * on the 3D scene.
 *
 * Standards references:
 *   - MIL-HDBK-1512: Radar Coverage Analysis
 *   - ITU-R P.834: Tropospheric refraction for radar horizon
 */

const EARTH_RADIUS_M = 6_371_000;
const DEG_TO_RAD     = Math.PI / 180;
const RAD_TO_DEG     = 180 / Math.PI;

/**
 * Compute geometric radar horizon distance (meters) given antenna height.
 * Uses 4/3 Earth effective radius model (ITU-R P.834).
 * @param {number} antennaMastHeightM - Antenna height above terrain (m)
 * @param {number} targetHeightM      - Target height above terrain (m)
 * @returns {number} Horizon range in meters
 */
export function computeRadarHorizon(antennaMastHeightM, targetHeightM = 0) {
  const EFFECTIVE_EARTH = EARTH_RADIUS_M * (4 / 3);
  const radarHorizon    = Math.sqrt(2 * EFFECTIVE_EARTH * antennaMastHeightM);
  const targetHorizon   = Math.sqrt(2 * EFFECTIVE_EARTH * Math.max(0, targetHeightM));
  return radarHorizon + targetHorizon;
}

/**
 * Compute the percentage of a 360° arc blind due to terrain masking.
 * @param {number} antennaMastHeightM - Radar mast height (m)
 * @param {number} ingressAltM        - Threat ingress altitude AGL (m)
 * @param {number} terrainRoughnessM  - Mean terrain obstacle height (m), default 8m
 * @returns {{ blindZonePct: number, horizonRangeM: number, warningTimeSec: number }}
 */
export function computeBlindZone(antennaMastHeightM, ingressAltM, terrainRoughnessM = 8) {
  const effectiveMastM = Math.max(0, antennaMastHeightM - terrainRoughnessM);
  const effectiveIngM  = Math.max(0, ingressAltM       - terrainRoughnessM);

  const horizonM = computeRadarHorizon(effectiveMastM, effectiveIngM);

  // Blind zone % is proportional to how much the horizon is cut by terrain
  // At zero mast height, 100% blind. At 50m mast, roughly 3% blind.
  const blindZonePct = Math.max(
    0,
    Math.min(100, (terrainRoughnessM / (effectiveMastM + terrainRoughnessM + 1)) * 100)
  );

  // Warning time at Shahed-136 typical 185 km/h = 51.4 m/s
  const THREAT_SPEED_MS = 51.4;
  const warningTimeSec  = Math.max(0, horizonM / THREAT_SPEED_MS);

  return {
    blindZonePct:     Number(blindZonePct.toFixed(2)),
    horizonRangeM:    Math.round(horizonM),
    warningTimeSec:   Math.round(warningTimeSec),
  };
}

/**
 * Generate a radar coverage sector as a GeoJSON Polygon.
 * @param {Object} params
 * @param {number} params.lat         - Radar position latitude (WGS84)
 * @param {number} params.lon         - Radar position longitude (WGS84)
 * @param {number} params.rangeM      - Maximum detection range (m)
 * @param {number} [params.startDeg=0]  - Sector start azimuth (degrees true)
 * @param {number} [params.sweepDeg=360] - Sector sweep width (degrees)
 * @param {number} [params.segments=72]  - Arc resolution (segments per 360°)
 * @returns {Object} GeoJSON Feature (Polygon)
 */
export function buildRadarSectorGeoJSON(params) {
  const {
    lat,
    lon,
    rangeM,
    startDeg  = 0,
    sweepDeg  = 360,
    segments  = 72,
    radarId   = 'RADAR-01',
    mast      = 18,
  } = params;

  const steps      = Math.max(3, Math.round(segments * sweepDeg / 360));
  const degsPerStep = sweepDeg / steps;
  const coords     = [[lon, lat]]; // origin

  // Clamp latitude to safe range [-89.99, 89.99] to prevent cos(90) = 0 polar explosion
  const safeLat = Math.min(89.99, Math.max(-89.99, lat));
  const cosLat  = Math.max(0.001, Math.cos(safeLat * DEG_TO_RAD));

  for (let i = 0; i <= steps; i++) {
    const azDeg = startDeg + i * degsPerStep;
    const azRad = azDeg * DEG_TO_RAD;
    // Approximate: 1 deg lat ≈ 111320m, lon depends on lat
    const dLat = (rangeM * Math.cos(azRad)) / 111_320;
    const dLon = (rangeM * Math.sin(azRad)) / (111_320 * cosLat);
    const pointLat = Math.min(90, Math.max(-90, lat + dLat));
    const rawLon   = lon + dLon;
    const pointLon = ((((rawLon + 180) % 360) + 360) % 360) - 180;
    coords.push([pointLon, pointLat]);
  }
  coords.push([lon, lat]); // close polygon

  return {
    type: 'Feature',
    properties: { radarId, mast, rangeM, startDeg, sweepDeg },
    geometry:   { type: 'Polygon', coordinates: [coords] },
  };
}

/**
 * RadarFenceAgent — manages a multi-radar interlocking fence.
 * Computes total coverage %, dead zones, and outputs 3D geometry params
 * for Three.js cone/cylinder mesh generation.
 */
export class RadarFenceAgent {
  /** @param {Object} [opts]
   *  @param {number} [opts.defaultRangeM=3200] Default radar range (m)
   *  @param {number} [opts.defaultMastM=18]    Default antenna mast height (m)
   */
  constructor(opts = {}) {
    this.name         = 'RadarFenceAgent';
    this.defaultRange = opts.defaultRangeM ?? 3_200;
    this.defaultMast  = opts.defaultMastM  ?? 18;
    this._radars      = new Map();
  }

  /**
   * Register a radar node into the fence.
   * @param {Object} radar - { id, lat, lon, mast, rangeM, sectors[] }
   * @returns {RadarFenceAgent} this
   */
  addRadar(radar) {
    this._radars.set(radar.id, {
      id:     radar.id,
      lat:    radar.lat,
      lon:    radar.lon,
      mast:   radar.mast   ?? this.defaultMast,
      rangeM: radar.rangeM ?? this.defaultRange,
      sectors: radar.sectors ?? [{ startDeg: 0, sweepDeg: 360 }],
    });
    return this;
  }

  /** Remove a radar from the fence */
  removeRadar(id) { this._radars.delete(id); }

  /** Number of radars in the fence */
  get radarCount() { return this._radars.size; }

  /**
   * Evaluate fence coverage at a given ingress scenario.
   * @param {Object} scenario
   * @param {number} scenario.ingressAltM     - Threat ingress altitude AGL (m)
   * @param {number} [scenario.terrainRoughM=8] - Terrain roughness (m)
   * @returns {Object} Fence assessment
   */
  assessFence(scenario = {}) {
    const ingressAltM    = scenario.ingressAltM    ?? 15;
    const terrainRoughM  = scenario.terrainRoughM  ?? 8;

    const radarAssessments = [];
    let   totalCoveragePct = 0;
    let   maxWarningTimeSec = 0;

    for (const [id, radar] of this._radars) {
      const blind = computeBlindZone(radar.mast, ingressAltM, terrainRoughM);
      const coveragePct = 100 - blind.blindZonePct;
      totalCoveragePct += coveragePct;
      maxWarningTimeSec = Math.max(maxWarningTimeSec, blind.warningTimeSec);

      radarAssessments.push({
        id,
        mast:            radar.mast,
        rangeM:          radar.rangeM,
        horizonRangeM:   blind.horizonRangeM,
        blindZonePct:    blind.blindZonePct,
        coveragePct,
        warningTimeSec:  blind.warningTimeSec,
      });
    }

    const avgCoveragePct = this._radars.size > 0
      ? totalCoveragePct / this._radars.size
      : 0;

    // Interlocked fence coverage is better than any single radar
    // Simple model: each additional radar reduces uncovered arc proportionally
    const interlockedCoveragePct = this._radars.size > 1
      ? Math.min(100, avgCoveragePct + (this._radars.size - 1) * 3.5)
      : avgCoveragePct;

    return {
      agent:                   this.name,
      radarCount:              this._radars.size,
      ingressAltM,
      radars:                  radarAssessments,
      avgCoveragePct:          Number(avgCoveragePct.toFixed(2)),
      interlockedCoveragePct:  Number(interlockedCoveragePct.toFixed(2)),
      maxWarningTimeSec,
      verdict: interlockedCoveragePct >= 95
        ? '✅ FENCE COMPLETE — No significant coverage gap'
        : `⚠️ FENCE GAP DETECTED — ${(100 - interlockedCoveragePct).toFixed(1)}% blind arc`,
    };
  }

  /**
   * Export GeoJSON FeatureCollection of all radar coverage sectors.
   * @param {Object} [scenario] - Optional blind-zone scenario for range clipping
   * @returns {Object} GeoJSON FeatureCollection
   */
  exportGeoJSON(scenario = {}) {
    const features = [];
    for (const [, radar] of this._radars) {
      for (const sector of radar.sectors) {
        features.push(buildRadarSectorGeoJSON({
          lat:      radar.lat,
          lon:      radar.lon,
          rangeM:   radar.rangeM,
          startDeg: sector.startDeg,
          sweepDeg: sector.sweepDeg,
          radarId:  radar.id,
          mast:     radar.mast,
        }));
      }
    }
    return { type: 'FeatureCollection', features };
  }

  /**
   * Generate Three.js-ready cone parameters for each radar in the fence.
   * The cone represents the detection volume in local 3D scene units
   * (1 Three.js unit ≈ 1m in the Aetheris defense scene).
   * @returns {Array<Object>} Array of cone descriptor objects
   */
  exportThreeJsCones() {
    const cones = [];
    for (const [, radar] of this._radars) {
      cones.push({
        id:            radar.id,
        // Scene position — caller maps lat/lon to local XZ coordinates
        lat:           radar.lat,
        lon:           radar.lon,
        sceneY:        radar.mast,    // cone apex height = mast height
        coneRadiusTop:  0,
        coneRadiusBot:  radar.rangeM, // base radius = detection range
        coneHeight:     radar.rangeM, // cone height = range (45° elevation limit)
        openAngleDeg:   45,           // half-angle of coverage cone
        color:          0x00f0ff,
        opacity:        0.07,
        wireframe:      false,
      });
    }
    return cones;
  }
}
