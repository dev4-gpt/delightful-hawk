/**
 * AgentShieldGuard - Telemetry Security & Prompt-Injection Gatekeeper
 * 
 * Part of the Aetheris Agentic Defense Swarm (Google Antigravity SDK + ECC Framework)
 * Inspects all incoming operator inputs, tactical datalinks, and external sensor strings.
 * Neutralizes prompt-injection attacks, clamps geographic coordinate bounds, and prevents
 * adversarial command-and-control spoofing.
 */

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
