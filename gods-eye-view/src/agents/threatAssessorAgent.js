/**
 * ThreatAssessorAgent - DoD UFC 4-010-01 Blast & Fragmentation Specialist
 * 
 * Part of the Aetheris Agentic Defense Swarm (Google Antigravity SDK + ECC Framework)
 * Calculates peak incident overpressure (PSI), scaled distance (Z),
 * standoff compliance, and asset structural survivability under DoD UFC 4-010-01.
 *
 * TRL 7-A addition: KalmanTracker — α-β discrete-time filter for multi-target path prediction.
 */

// ─── Constants ────────────────────────────────────────────────────────────────
// Shahed-136 / Lancet-3 operational envelope
const SHAHED_MAX_SPEED_MS = 300;           // m/s absolute ceiling
const DEG_PER_METER_LAT   = 1 / 111_320;  // approx (WGS-84 equatorial)
const MAX_VEL_DEG_PER_S   = SHAHED_MAX_SPEED_MS * DEG_PER_METER_LAT; // ≈ 0.00269

/**
 * KalmanTracker — 4-state discrete α-β position+velocity filter.
 *
 * State vector: [lat, lon, vLat, vLon]
 * Calibrated for Shahed-136 / Lancet-3 ingress kinematic envelope.
 *
 * α (position gain) = 0.85 — high trust in measurements
 * β (velocity gain) = 0.005 — slow velocity correction for smooth prediction
 *
 * Reference: Benedict-Bordner criterion for minimum steady-state noise.
 */
export class KalmanTracker {
  /**
   * @param {Object} initialPos - { lat, lon, alt }
   * @param {Object} [gains]    - Optional { alpha, beta } override
   */
  constructor(initialPos, gains = {}) {
    this.lat  = Number(initialPos.lat)  || 0;
    this.lon  = Number(initialPos.lon)  || 0;
    this.alt  = Number(initialPos.alt)  || 0;
    this.vLat = 0;
    this.vLon = 0;
    this.alpha = gains.alpha ?? 0.85;
    this.beta  = gains.beta  ?? 0.005;
    this.frameCount = 0;
  }

  /**
   * Predict next state (open-loop, no measurement).
   * @param {number} dt - Time step in seconds
   */
  predict(dt) {
    this.lat += this.vLat * dt;
    this.lon += this.vLon * dt;
  }

  /**
   * Update state with a new measurement using α-β residual correction.
   * Velocity is clamped to Shahed-136 max speed to reject sensor glitches.
   * @param {Object} measurement - { lat, lon, alt }
   * @param {number} dt          - Time step in seconds
   */
  update(measurement, dt) {
    const mLat = Number(measurement.lat);
    const mLon = Number(measurement.lon);

    // Predicted state
    const pLat = this.lat + this.vLat * dt;
    const pLon = this.lon + this.vLon * dt;

    // Innovation (residual)
    const rLat = mLat - pLat;
    const rLon = mLon - pLon;

    // Corrected position
    this.lat = pLat + this.alpha * rLat;
    this.lon = pLon + this.alpha * rLon;

    // Corrected velocity
    let newVLat = this.vLat + (this.beta / Math.max(dt, 0.001)) * rLat;
    let newVLon = this.vLon + (this.beta / Math.max(dt, 0.001)) * rLon;

    // Clamp velocity to Shahed-136 physical limit
    const speed = Math.sqrt(newVLat ** 2 + newVLon ** 2);
    if (speed > MAX_VEL_DEG_PER_S) {
      const scale = MAX_VEL_DEG_PER_S / speed;
      newVLat *= scale;
      newVLon *= scale;
    }

    this.vLat = newVLat;
    this.vLon = newVLon;

    if (measurement.alt !== undefined) this.alt = Number(measurement.alt);
    this.frameCount++;
  }

  /**
   * Projects N future waypoints using current velocity estimate (open-loop prediction).
   * @param {number} n  - Number of waypoints to project
   * @param {number} dt - Time step per waypoint (seconds)
   * @returns {Array<{lat, lon, alt, tSeconds}>} Projected path
   */
  getProjectedPath(n, dt = 1.0) {
    const path = [];
    let pLat = this.lat;
    let pLon = this.lon;

    for (let i = 1; i <= n; i++) {
      pLat += this.vLat * dt;
      pLon += this.vLon * dt;
      path.push({
        lat: Number(pLat.toFixed(6)),
        lon: Number(pLon.toFixed(6)),
        alt: this.alt,
        tSeconds: i * dt
      });
    }
    return path;
  }
}

export class ThreatAssessorAgent {
  constructor() {
    this.name = 'ThreatAssessorAgent';
    this.role = 'UFC 4-010-01 Blast & Fragmentation Specialist';
    
    // Asset hardness specifications (MIL-HDBK-1008C / STANAG 4569)
    this.facilitySpecs = Object.freeze({
      'TAOC-BUNKER': {
        name: 'Underground TAOC Command Bunker',
        blastRatingPsi: 65.0, // Subterranean reinforced C50/60 concrete
        stanagLevel: 'STANAG 4569 Level 4',
        criticality: 'CAT-1 CRITICAL'
      },
      'HAS-01': {
        name: 'HAS-01 Hardened Aircraft Shelter',
        blastRatingPsi: 30.0, // Corrugated reinforced arch with blast doors
        stanagLevel: 'STANAG 4569 Level 4',
        criticality: 'CAT-1 CRITICAL'
      },
      'HAS-02': {
        name: 'HAS-02 Hardened Aircraft Shelter',
        blastRatingPsi: 30.0,
        stanagLevel: 'STANAG 4569 Level 4',
        criticality: 'CAT-1 CRITICAL'
      },
      'RADAR-MAST': {
        name: 'Ku-Band 3D AESA Radar Mast',
        blastRatingPsi: 8.5, // Unhardened lattice structure
        stanagLevel: 'STANAG 4569 Level 1',
        criticality: 'CAT-2 ESSENTIAL'
      },
      'INTERCEPTOR-PODS': {
        name: 'Low-Cost Interceptor Canisters',
        blastRatingPsi: 15.0, // Armored steel quad-canister
        stanagLevel: 'STANAG 4569 Level 2',
        criticality: 'CAT-2 EFFECTOR'
      }
    });
  }

  /**
   * Computes scaled distance Z = R / (W^(1/3)) in m / kg^(1/3).
   * @param {number} standoffMeters - Distance from blast detonation point (m)
   * @param {number} warheadKg - Explosive charge mass in TNT equivalent (kg)
   * @returns {number} Scaled distance Z
   */
  calculateScaledDistance(standoffMeters, warheadKg) {
    const r = Math.max(1, standoffMeters);
    const w = Math.max(0.5, warheadKg);
    return Number((r / Math.cbrt(w)).toFixed(2));
  }

  /**
   * Calculates peak incident overpressure (PSI) using Kingery-Bulmash empirical fit.
   * @param {number} standoffMeters - Distance from detonation (m)
   * @param {number} warheadKg - Warhead weight TNT eq (kg)
   * @returns {number} Peak overpressure in PSI
   */
  calculatePeakOverpressurePsi(standoffMeters, warheadKg) {
    const Z = this.calculateScaledDistance(standoffMeters, warheadKg);
    // Standard Kingery-Bulmash scaled overpressure equation (calibrated in kPa, converted to PSI)
    // For near-to-mid range air blast (Z < 5 m/kg^(1/3)):
    const pKpa = (120.0 / Z) + (450.0 / Math.pow(Z, 2)) + (1100.0 / Math.pow(Z, 3));
    const pPsi = pKpa / 6.89476;
    return Number(Math.max(0.5, pPsi).toFixed(2));
  }

  /**
   * Evaluates blast effects against all airfield assets according to UFC 4-010-01.
   * @param {Object} params
   * @param {number} params.warheadKg - Threat warhead weight (kg TNT eq, default 50kg for Shahed-136)
   * @param {number} params.standoffBufferMeters - Perimeter standoff distance (m)
   * @returns {Object} Comprehensive threat assessment
   */
  evaluateThreat(params) {
    const warheadKg = Math.max(5, params.warheadKg ?? 50);
    const standoffM = Math.max(10, params.standoffBufferMeters ?? 45);
    const overpressurePsi = this.calculatePeakOverpressurePsi(standoffM, warheadKg);
    const scaledDistance = this.calculateScaledDistance(standoffM, warheadKg);

    const assetSurvivals = {};
    let allCriticalSurvive = true;

    for (const [key, asset] of Object.entries(this.facilitySpecs)) {
      const survives = overpressurePsi <= asset.blastRatingPsi;
      assetSurvivals[key] = {
        name: asset.name,
        blastRatingPsi: asset.blastRatingPsi,
        incidentPsi: overpressurePsi,
        survives,
        safetyMarginPsi: Number((asset.blastRatingPsi - overpressurePsi).toFixed(2))
      };
      if (asset.criticality === 'CAT-1 CRITICAL' && !survives) {
        allCriticalSurvive = false;
      }
    }

    const fragmentRadiusM = Number((18.5 * Math.pow(warheadKg, 0.4)).toFixed(1));
    const isFragmentHazard = standoffM < fragmentRadiusM;

    let verdictStatus = 'SURVIVABLE';
    if (!allCriticalSurvive) {
      verdictStatus = 'CRITICAL BREACH';
    } else if (isFragmentHazard) {
      verdictStatus = 'FRAGMENTATION HAZARD';
    }

    return {
      agent: this.name,
      status: 'NOMINAL',
      timestamp: Date.now(),
      warheadKg,
      standoffMeters: standoffM,
      scaledDistanceZ: scaledDistance,
      peakOverpressurePsi: overpressurePsi,
      fragmentRadiusMeters: fragmentRadiusM,
      isFragmentHazard,
      allCriticalSurvive,
      verdictStatus,
      structuralClassification: allCriticalSurvive ? 'SURVIVABLE (C50/60 RC)' : 'CATASTROPHIC BREACH',
      assetAssessments: assetSurvivals,
      telemetryVerdict: allCriticalSurvive
        ? `🛡️ UFC 4-010-01 PASSED: ${overpressurePsi} PSI blast mitigated by ${standoffM}m standoff buffer. CAT-1 assets intact.`
        : `🚨 UFC 4-010-01 FAILED: ${overpressurePsi} PSI exceeds CAT-1 shelter threshold (30 PSI)! Standoff must be expanded.`
    };
  }

  /**
   * Predicts the future trajectory of an active threat track using a Kalman α-β filter.
   * Feeds N sequential pseudo-measurements derived from the track's reported heading/speed,
   * then projects M waypoints ahead. Computes a fire-control intercept lead angle.
   *
   * @param {Object} track   - { lat, lon, alt, speed (km/h), heading (deg) }
   * @param {Object} options - { steps: number, dtSeconds: number }
   * @returns {Object} Prediction result with waypoints, lead angle, and confidence
   */
  predictTrajectory(track, options = {}) {
    const steps = Math.min(Math.max(1, options.steps ?? 5), 20);
    const dt    = Math.max(0.1, options.dtSeconds ?? 1.0);

    const speedMs      = (Number(track.speed) || 185) / 3.6; // km/h → m/s
    const headingRad   = ((Number(track.heading) || 0) * Math.PI) / 180;
    const vLat_ms      = speedMs * Math.cos(headingRad); // m/s northward
    const vLon_ms      = speedMs * Math.sin(headingRad); // m/s eastward
    const degPerMeterLat = 1 / 111_320;
    const degPerMeterLon = 1 / (111_320 * Math.cos((Number(track.lat) || 0) * Math.PI / 180));

    // Seed Kalman tracker with initial position
    const tracker = new KalmanTracker(
      { lat: Number(track.lat) || 0, lon: Number(track.lon) || 0, alt: Number(track.alt) || 150 }
    );

    // Feed N synthetic measurements from heading/speed to warm up the filter
    const WARMUP = Math.min(steps, 5);
    for (let i = 1; i <= WARMUP; i++) {
      tracker.update({
        lat: (Number(track.lat) || 0) + vLat_ms * degPerMeterLat * i * dt,
        lon: (Number(track.lon) || 0) + vLon_ms * degPerMeterLon * i * dt,
        alt: Number(track.alt) || 150
      }, dt);
    }

    const waypoints = tracker.getProjectedPath(steps, dt);

    // Compute proportional-navigation intercept lead angle (simplified PN guidance)
    // Assumes interceptor speed = 250 m/s (Aetheris low-cost KE round)
    const INTERCEPTOR_SPEED_MS = 250;
    const closureRatioMs = Math.max(0.01, INTERCEPTOR_SPEED_MS / Math.max(speedMs, 1));
    const interceptLeadAngleDeg = Number(
      (Math.asin(1 / closureRatioMs) * (180 / Math.PI)).toFixed(2)
    );

    // Confidence: higher after more Kalman warmup, degrades with high speed
    const confidence = Number(
      Math.min(1, (WARMUP / 5) * (1 - speedMs / 300)).toFixed(3)
    );

    return {
      agent: this.name,
      track: { lat: track.lat, lon: track.lon, alt: track.alt, speed: track.speed, heading: track.heading },
      waypoints,
      interceptLeadAngleDeg,
      confidence,
      kalmanFrames: tracker.frameCount,
      timestamp: Date.now()
    };
  }
}
