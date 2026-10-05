/**
 * adsbBridge.js — TRL 7-G: ADS-B Telemetry Bridge
 *
 * Converts ADS-B (Automatic Dependent Surveillance–Broadcast) track data
 * from OpenSky Network / ADS-B Exchange JSON format into Aetheris internal
 * threat track objects, then pipes them to AgentShieldGuard for IFF eval
 * and ThreatAssessorAgent for Kalman prediction.
 *
 * ADS-B is the primary real-world source for airspace telemetry. The bridge:
 *   1. Accepts raw OpenSky Network state vector arrays (or mock objects)
 *   2. Classifies each track: COOPERATIVE (has ADS-B), NON-COOPERATIVE (no ADS-B)
 *   3. Applies IFF pre-screen using squawk code + ICAO hex range
 *   4. Converts to Aetheris ThreatTrack format
 *   5. Emits through an optional callback for live HUD injection
 *
 * OpenSky state vector format (https://openskynetwork.github.io/opensky-api/):
 * [icao24, callsign, origin_country, time_position, last_contact,
 *  longitude, latitude, baro_altitude, on_ground, velocity,
 *  true_track, vertical_rate, sensors, geo_altitude, squawk,
 *  spi, position_source]
 *
 * For demo/offline mode, the bridge generates synthetic ADS-B tracks
 * mimicking real traffic patterns around a protected airspace.
 */

/** ICAO hex ranges for military transponders (simplified public reference) */
const MILITARY_ICAO_PREFIXES = new Set([
  'ae', // US Military (AE0000–AFFFFF)
  'e4', // UK Military
  'f0', // French Military
  '7c', // Australian RAAF
]);

/** Squawk codes with known ADS-B significance */
const SQUAWK_CLASSIFICATIONS = Object.freeze({
  '7700': 'EMERGENCY',
  '7600': 'RADIO_FAILURE',
  '7500': 'HIJACK',
  '1200': 'VFR_GENERAL',
  '2000': 'IFR_UNCONTROLLED',
  '7000': 'VFR_EU',
});

/**
 * Determine if an ICAO hex address belongs to a military aircraft.
 * @param {string} icao24 - ICAO 24-bit hex (e.g. 'ae1234')
 * @returns {boolean}
 */
export function isMilitaryIcao(icao24) {
  if (!icao24 || typeof icao24 !== 'string') return false;
  const prefix = icao24.toLowerCase().slice(0, 2);
  return MILITARY_ICAO_PREFIXES.has(prefix);
}

/**
 * Classify an ADS-B squawk code.
 * @param {string|null} squawk
 * @returns {string} classification label
 */
export function classifySquawk(squawk) {
  if (!squawk) return 'NO_TRANSPONDER';
  return SQUAWK_CLASSIFICATIONS[squawk] ?? 'NORMAL_OPS';
}

/**
 * Convert an OpenSky state vector array to an Aetheris ThreatTrack object.
 * Non-cooperative tracks (no lat/lon/alt) are marked as GHOST.
 *
 * @param {Array} stateVector - OpenSky state vector (17 elements)
 * @param {Object} [opts]
 * @param {number} [opts.protectedLat=0]   - Protected site center latitude
 * @param {number} [opts.protectedLon=0]   - Protected site center longitude
 * @param {number} [opts.geofenceRadiusM=50000] - Alert radius (m)
 * @returns {Object|null} ThreatTrack or null if on-ground / invalid
 */
export function stateVectorToTrack(stateVector, opts = {}) {
  if (!Array.isArray(stateVector) || stateVector.length < 17) return null;

  const [
    icao24, callsign, originCountry,
    /* timePos */, lastContact,
    lon, lat, baroAlt, onGround,
    velocity, trueTrack, verticalRate,
    /* sensors */, geoAlt, squawk, spi,
    /* posSource */
  ] = stateVector;

  // Skip ground-based transponders
  if (onGround) return null;

  // Non-cooperative ghost track (no position)
  const isGhost = (lat == null || lon == null);
  const altM    = geoAlt ?? baroAlt ?? 0;

  const track = {
    uid:         `ADSB-${icao24?.toUpperCase() ?? 'GHOST'}`,
    icao24:      icao24 ?? 'UNKNOWN',
    callsign:    callsign?.trim() || 'N/A',
    country:     originCountry ?? 'UNK',
    lat:         isGhost ? null : Number(lat),
    lon:         isGhost ? null : Number(lon),
    alt:         Number(altM),
    speed:       velocity != null ? Number(velocity) * 3.6 : null, // m/s → km/h
    heading:     trueTrack != null ? Number(trueTrack) : null,
    verticalRate: verticalRate ?? 0,
    squawk:      squawk ?? null,
    spi,
    lastContact: lastContact ?? null,
    cooperative: !isGhost,
    military:    isMilitaryIcao(icao24 ?? ''),
    squawkClass: classifySquawk(squawk),
    source:      'ADS-B',
    ts:          Date.now(),
  };

  // Geofence proximity check
  if (!isGhost && opts.protectedLat != null && opts.protectedLon != null) {
    const dLat = (track.lat - opts.protectedLat) * 111_320;
    const dLon = (track.lon - opts.protectedLon) * 111_320 * Math.cos(track.lat * Math.PI / 180);
    const distM = Math.sqrt(dLat * dLat + dLon * dLon);
    track.distanceToProtectedM = Math.round(distM);
    track.inGeofence = distM <= (opts.geofenceRadiusM ?? 50_000);
  }

  return track;
}

/**
 * AdsbBridge — ingests OpenSky or mock ADS-B frames and emits
 * classified Aetheris ThreatTrack objects.
 */
export class AdsbBridge {
  /**
   * @param {Object} [opts]
   * @param {number} [opts.protectedLat]         Protected airspace latitude
   * @param {number} [opts.protectedLon]         Protected airspace longitude
   * @param {number} [opts.geofenceRadiusM=50000] Geofence alert radius (m)
   * @param {number} [opts.pollIntervalMs=15000]  ADS-B refresh interval (ms)
   */
  constructor(opts = {}) {
    this.name             = 'AdsbBridge';
    this.protectedLat     = opts.protectedLat    ?? null;
    this.protectedLon     = opts.protectedLon    ?? null;
    this.geofenceRadiusM  = opts.geofenceRadiusM ?? 50_000;
    this.pollIntervalMs   = opts.pollIntervalMs  ?? 15_000;

    this._tracks          = new Map();   // icao24 → ThreatTrack
    this._timer           = null;
    this._frameCount      = 0;

    /** Called with (ThreatTrack[]) on every update cycle */
    this.onTracksUpdate   = null;
    /** Called with (ThreatTrack) when a track enters geofence */
    this.onGeofenceAlert  = null;
  }

  /**
   * Ingest a raw OpenSky API response and emit updated tracks.
   * @param {Object} openskyResponse - { time, states: [...] }
   * @returns {Object[]} Array of ThreatTrack objects
   */
  ingestOpenSky(openskyResponse) {
    const states  = openskyResponse?.states ?? [];
    const updated = [];

    for (const sv of states) {
      const track = stateVectorToTrack(sv, {
        protectedLat:    this.protectedLat,
        protectedLon:    this.protectedLon,
        geofenceRadiusM: this.geofenceRadiusM,
      });
      if (!track) continue;

      const prev = this._tracks.get(track.icao24);
      this._tracks.set(track.icao24, track);
      updated.push(track);

      // Fire geofence alert on entry
      if (track.inGeofence && (!prev || !prev.inGeofence)) {
        if (typeof this.onGeofenceAlert === 'function') {
          this.onGeofenceAlert(track);
        }
      }
    }

    this._frameCount++;
    if (typeof this.onTracksUpdate === 'function') {
      this.onTracksUpdate(updated, this._frameCount);
    }

    return updated;
  }

  /**
   * Generate synthetic ADS-B tracks for offline demo mode.
   * Produces 6 tracks: 3 cooperative civil, 1 military, 1 emergency, 1 ghost.
   * @param {Object} [center] - { lat, lon } scene center (defaults to Austin, TX)
   * @returns {Object[]} Array of ThreatTrack objects
   */
  generateDemoTracks(center = { lat: 30.2672, lon: -97.7431 }) {
    const t = Date.now();
    const spread = 0.18; // ~20 km spread

    const demoStates = [
      // [icao24, callsign, country, timePos, lastContact, lon, lat, baroAlt, onGround,
      //  velocity, track, vertRate, sensors, geoAlt, squawk, spi, posSource]
      ['a8b23c', 'DAL1234 ', 'United States', t, t,
       center.lon + spread,        center.lat + spread * 0.4, 3048, false,
       240, 270, -3, null, 3100, '2000', false, 0],

      ['a1c44f', 'UAL556  ', 'United States', t, t,
       center.lon - spread * 0.6,  center.lat + spread * 0.7, 9144, false,
       270, 180, 0,  null, 9200, '1200', false, 0],

      ['4ca2e1', 'RYR8801 ', 'Ireland',       t, t,
       center.lon + spread * 0.2,  center.lat - spread * 0.5, 11277, false,
       250, 90, 2,  null, 11300,'2000', false, 0],

      // Military — ICAO AE prefix
      ['ae45bc', 'TOPGUN1 ', 'United States', t, t,
       center.lon - spread,        center.lat - spread * 0.3, 914,  false,
       450, 135, 12, null, 950,  '6001', false, 0],

      // Emergency squawk 7700 — enters geofence
      ['a9f123', 'N12345  ', 'United States', t, t,
       center.lon + spread * 0.05, center.lat + spread * 0.05, 457, false,
       160, 320, -8, null, 460,  '7700', true,  0],

      // Ghost track — no position (non-cooperative UAS)
      ['000000', 'GHOST   ', 'Unknown',       null, t - 45000,
       null, null, null, false,
       null, null, null, null, null, null, false, 0],
    ];

    return this.ingestOpenSky({ time: Math.floor(t / 1000), states: demoStates });
  }

  /** All currently tracked aircraft */
  get allTracks() { return Array.from(this._tracks.values()); }

  /** Tracks currently inside the geofence */
  get geofenceTracks() { return this.allTracks.filter(t => t.inGeofence); }

  /** Non-cooperative (ghost) tracks */
  get ghostTracks() { return this.allTracks.filter(t => !t.cooperative); }

  /** Frame count (number of ADS-B poll cycles completed) */
  get frameCount() { return this._frameCount; }
}
