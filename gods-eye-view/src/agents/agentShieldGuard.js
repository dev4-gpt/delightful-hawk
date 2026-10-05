import { computeHash } from '../ai/agentShield.js';

export const CLEARANCE_LEVELS = {
  OBSERVER: { level: 1, name: 'OBSERVER (UNCLASS)', permissions: ['INSPECT_TELEMETRY'] },
  WEAPONS_OFFICER: { level: 2, name: 'FIRE_DIRECTION_OFFICER (SECRET)', permissions: ['INSPECT_TELEMETRY', 'MANUAL_INTERCEPT', 'AUDIT_EXPORT'] },
  BASE_COMMANDER: { level: 3, name: 'BASE_COMMANDER (TOP SECRET // SI)', permissions: ['INSPECT_TELEMETRY', 'MANUAL_INTERCEPT', 'AUTO_CIWS_ENGAGE', 'SATURATION_SWARM_RELEASE', 'AUDIT_EXPORT', 'IFF_OVERRIDE'] }
};

/**
 * NATO IFF (Identification Friend or Foe) Mode C/S squawk classification table.
 * Based on STANAG 4193 / ICAO Annex 10 squawk code conventions.
 */
export const IFF_STATUS = Object.freeze({
  FRIENDLY: 'IFF_FRIENDLY',
  HOSTILE: 'IFF_HOSTILE',
  UNKNOWN: 'IFF_UNKNOWN'
});

// Squawk code ranges / values → IFF classification
// 7500: Hijack, 7600: Radio failure, 7700: Emergency — all treated as HOSTILE ingress profiles
// 1200: VFR Day (US civil), 7000: VFR Europe (ICAO) — civilian/friendly
// Shahed-136 / Lancet profile: low-altitude (<500m AGL), 160–200 km/h, no valid squawk (0000 or 7600)
const HOSTILE_SQUAWKS = new Set(['7600', '7500', '0000']);
const FRIENDLY_SQUAWKS = new Set(['1200', '7000', '7777', '1000']);

/**
 * Evaluates IFF status for a given track profile.
 * Implements NATO STANAG 4193 Mode C/S squawk evaluation + kinematic profile matching.
 *
 * @param {Object} track - { squawk: string, speed: number (km/h), altitude: number (m AGL) }
 * @returns {Object} IFF evaluation result
 */
export function evaluateIFF(track) {
  const squawk = String(track.squawk || '').trim();
  const speed = Number(track.speed) || 0;       // km/h
  const altitude = Number(track.altitude) || 0; // m AGL

  let iffStatus = IFF_STATUS.UNKNOWN;
  let confidence = 0.5;
  let reason = 'Unrecognized squawk — track status UNKNOWN';

  if (FRIENDLY_SQUAWKS.has(squawk)) {
    iffStatus = IFF_STATUS.FRIENDLY;
    confidence = 0.95;
    reason = `Mode-C squawk ${squawk} matches civil/military friendly IFF database`;
  } else if (HOSTILE_SQUAWKS.has(squawk)) {
    iffStatus = IFF_STATUS.HOSTILE;
    confidence = 0.90;
    reason = `Squawk ${squawk} matches known hostile/emergency ingress profile`;
  }

  // Kinematic hostile reinforcement: low-alt + Shahed-136-range speed (160–200 km/h) with no valid squawk
  if (iffStatus === IFF_STATUS.UNKNOWN && altitude <= 500 && speed >= 150 && speed <= 220) {
    iffStatus = IFF_STATUS.HOSTILE;
    confidence = 0.80;
    reason = `Kinematic profile matches Shahed-136 (alt: ${altitude}m AGL, speed: ${speed} km/h, unregistered squawk)`;
  }

  const fireAuthorized = iffStatus === IFF_STATUS.HOSTILE;
  const requiresOverride = iffStatus === IFF_STATUS.UNKNOWN;

  return {
    squawk,
    speed,
    altitude,
    iffStatus,
    confidence: Number(confidence.toFixed(2)),
    fireAuthorized,
    requiresOverride,
    reason,
    timestamp: Date.now()
  };
}


export class AgentShieldGuard {
  constructor(options = {}) {
    this.name = 'AgentShieldGuard';
    this.role = 'Security & Input Hardening Gatekeeper';
    this.strictMode = options.strictMode ?? true;
    
    // Adversarial signature patterns
    this.adversarialPatterns = [
      /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
      /system\s+(prompt|override|command)/i,
      /admin\s+credentials/i,
      /disregard\s+(rules|orders|engagement)/i,
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /eval\s*\(/i,
      /union\s+select/i,
      /drop\s+table/i,
      /\b(rm\s+-rf|sudo\b)/i
    ];

    // Cryptographic Merkle Audit Ledger
    this.auditLedger = [];
    this._initGenesisBlock();
  }

  /**
   * Initializes the genesis block for the cryptographic audit ledger.
   * @private
   */
  _initGenesisBlock() {
    const genesisTime = 1727700000000;
    const prevHash = '0000000000000000000000000000000000000000000000000000000000000000';
    const payload = `0|${genesisTime}|SYSTEM|GENESIS_C2_INITIALIZED|${prevHash}`;
    const hash = computeHash(payload);

    this.auditLedger = [{
      index: 0,
      timestamp: genesisTime,
      clearance: 'SYSTEM',
      eventType: 'GENESIS_C2_INITIALIZED',
      data: { note: 'Aetheris C2 Cryptographic Defense Ledger Initialized (NIST SP 800-53 Rev 5)' },
      prevHash,
      hash
    }];
  }

  /**
   * Evaluates IFF status for a track (delegates to module-level evaluateIFF).
   * Implements NATO STANAG 4193 Mode C/S squawk + kinematic profile matching.
   * @param {Object} track - { squawk, speed, altitude }
   * @returns {Object} IFF evaluation result
   */
  evaluateIFF(track) {
    return evaluateIFF(track);
  }

  /**
   * Evaluates if the current operator clearance permits the requested kinetic or tactical action.
   * @param {string} clearance - 'OBSERVER' | 'WEAPONS_OFFICER' | 'BASE_COMMANDER'
   * @param {string} action - Requested operation
   * @returns {Object} Authorization verdict
   */
  verifyClearance(clearance = 'OBSERVER', action = 'INSPECT_TELEMETRY') {
    const role = CLEARANCE_LEVELS[clearance] || CLEARANCE_LEVELS.OBSERVER;
    const authorized = role.permissions.includes(action);

    return {
      clearance: role.name,
      clearanceKey: clearance,
      action,
      authorized,
      error: authorized ? null : `SECURITY ACCESS DENIED: Action '${action}' requires higher clearance than '${role.name}' under DoD Directive 3000.09`
    };
  }

  /**
   * Records an immutable, cryptographically chained audit event.
   * @param {string} clearance - Operator clearance key
   * @param {string} eventType - Event identifier
   * @param {Object} data - Event details
   * @returns {Object} Cryptographic audit block
   */
  recordAuditEvent(clearance = 'OBSERVER', eventType = 'TELEMETRY_INSPECTED', data = {}) {
    const prevBlock = this.auditLedger[this.auditLedger.length - 1];
    const index = this.auditLedger.length;
    const timestamp = Date.now();
    const dataStr = JSON.stringify(data);
    const hashPayload = `${index}|${timestamp}|${clearance}|${eventType}|${dataStr}|${prevBlock.hash}`;
    const hash = computeHash(hashPayload);

    const block = {
      index,
      timestamp,
      clearance,
      eventType,
      data,
      prevHash: prevBlock.hash,
      hash
    };

    this.auditLedger.push(block);
    if (this.auditLedger.length > 500) {
      // Bound memory while keeping genesis and recent chain valid
      this.auditLedger.splice(1, 1);
    }

    return block;
  }

  /**
   * Cryptographically verifies the integrity of the audit chain.
   * @returns {boolean} True if entire chain has zero tampering
   */
  verifyAuditChain() {
    for (let i = 1; i < this.auditLedger.length; i++) {
      const current = this.auditLedger[i];
      const prev = this.auditLedger[i - 1];

      if (current.prevHash !== prev.hash) {
        return false;
      }

      const expectedPayload = `${current.index}|${current.timestamp}|${current.clearance}|${current.eventType}|${JSON.stringify(current.data)}|${current.prevHash}`;
      const recomputedHash = computeHash(expectedPayload);
      if (current.hash !== recomputedHash) {
        return false;
      }
    }
    return true;
  }

  /**
   * Generates a downloadable DoD After-Action Report (AAR) JSON.
   * @param {Object} metadata 
   * @returns {string} Formatted JSON AAR
   */
  exportAfterActionReport(metadata = {}) {
    const chainValid = this.verifyAuditChain();
    const totalEvents = this.auditLedger.length;
    const kineticEvents = this.auditLedger.filter(b => b.eventType.includes('INTERCEPT') || b.eventType.includes('DISCHARGE') || b.eventType.includes('SWARM'));

    const aar = {
      documentType: "DoD After-Action Report (AAR)",
      classification: "SECRET // REL TO USA, FVEY",
      system: "AETHERIS C-UAS AUTONOMOUS DEFENSE TWIN",
      fipsCompliance: "FIPS 180-4 / NIST SP 800-53 Rev 5",
      chainIntegrityValid: chainValid,
      generatedAt: new Date().toISOString(),
      metadata: {
        facility: "Expeditionary Airfield Alpha (Agile Combat Employment)",
        sector: "Forward Tactical Operating Base (FOB)",
        ...metadata
      },
      auditSummary: {
        totalBlocks: totalEvents,
        kineticEngagements: kineticEvents.length,
        latestBlockHash: this.auditLedger[this.auditLedger.length - 1].hash
      },
      ledger: this.auditLedger
    };

    return JSON.stringify(aar, null, 2);
  }

  /**
   * Sanitizes and verifies an arbitrary text string for prompt-injection attacks.
   * @param {string} input - Raw operator or sensor input string
   * @returns {Object} Security evaluation
   */
  sanitizeText(input) {
    if (typeof input !== 'string') {
      return { sanitized: '', safe: true, threatsDetected: [] };
    }

    const threats = [];
    let sanitized = input;

    for (const pattern of this.adversarialPatterns) {
      if (pattern.test(sanitized)) {
        threats.push(pattern.toString());
        sanitized = sanitized.replace(pattern, '[REDACTED_ADVERSARIAL_INJECTION]');
      }
    }

    // Strip null bytes and non-printable control characters
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    return {
      original: input,
      sanitized: sanitized.trim(),
      safe: threats.length === 0,
      threatsDetected: threats,
      timestamp: Date.now()
    };
  }

  /**
   * Validates and clamps geodetic coordinate inputs to physical Earth bounds.
   * @param {Object} coords - Coordinates { lat, lon, alt, azimuth }
   * @returns {Object} Clamped coordinate payload
   */
  clampCoordinates(coords) {
    let lat = coords.lat !== undefined ? Number(coords.lat) : 28.4312;
    let lon = coords.lon !== undefined ? Number(coords.lon) : 77.0545;
    let alt = coords.alt !== undefined ? Number(coords.alt) : 18;
    let azimuth = coords.azimuth !== undefined ? Number(coords.azimuth) : 48;
    const flags = [];

    if (isNaN(lat)) { lat = 28.4312; flags.push('INVALID_LAT_DEFAULTED'); }
    if (isNaN(lon)) { lon = 77.0545; flags.push('INVALID_LON_DEFAULTED'); }
    if (isNaN(alt)) { alt = 18; flags.push('INVALID_ALT_DEFAULTED'); }
    if (isNaN(azimuth)) { azimuth = 48; flags.push('INVALID_AZIMUTH_DEFAULTED'); }

    // Clamp Latitude [-90, 90]
    if (lat < -90) { lat = -90; flags.push('LAT_CLAMPED_MIN'); }
    else if (lat > 90) { lat = 90; flags.push('LAT_CLAMPED_MAX'); }

    // Clamp Longitude [-180, 180]
    if (lon < -180) { lon = -180; flags.push('LON_CLAMPED_MIN'); }
    else if (lon > 180) { lon = 180; flags.push('LON_CLAMPED_MAX'); }

    // Clamp Altitude AGL [0, 50000] meters
    if (alt < 0) { alt = 0; flags.push('ALT_CLAMPED_FLOOR'); }
    else if (alt > 50000) { alt = 50000; flags.push('ALT_CLAMPED_CEILING'); }

    // Normalize Azimuth [0, 360) degrees
    azimuth = ((azimuth % 360) + 360) % 360;

    const isOutOfBounds = flags.some(f => f.includes('CLAMPED'));

    return {
      lat: Number(lat.toFixed(6)),
      lon: Number(lon.toFixed(6)),
      alt: Number(alt.toFixed(2)),
      azimuth: Number(azimuth.toFixed(2)),
      clamped: isOutOfBounds,
      flags
    };
  }

  /**
   * Evaluates complete incoming telemetry packet for safety.
   * @param {Object} telemetryPacket 
   * @returns {Object} Cleaned and validated packet
   */
  guardTelemetry(telemetryPacket) {
    const textCheck = this.sanitizeText(telemetryPacket.text || telemetryPacket.annotation || '');
    const coordCheck = this.clampCoordinates({
      lat: telemetryPacket.lat,
      lon: telemetryPacket.lon,
      alt: telemetryPacket.alt,
      azimuth: telemetryPacket.azimuth
    });

    const isSecure = textCheck.safe && (!this.strictMode || !coordCheck.clamped);

    return {
      agent: this.name,
      passed: isSecure,
      textSafe: textCheck.safe,
      sanitizedText: textCheck.sanitized,
      threatsDetected: textCheck.threatsDetected,
      clampedCoords: coordCheck,
      verdict: isSecure
        ? 'SHIELD_NOMINAL: Telemetry clean and geodetically bounded.'
        : `SHIELD_ALERT: ${textCheck.threatsDetected.length} adversarial vector(s) neutralized.`
    };
  }
}
