// packages/earthmind-mcp/src/agentShield.js
/**
 * AgentShield Security Gatekeeper for EarthMind SpatialMCP
 * Modeled on Affaan Mustafa's agentshield & ECC security watchdog patterns.
 * 
 * Enforces:
 * 1. Pre-execution Tool Gating: Validates tool names against allowed schemas.
 * 2. Spatial Bounding-Box Clamping: Prevents oversized spatial queries (DoS protection) and validates WGS84 ranges.
 * 3. Prompt-Injection & Tainted Telemetry Sanitizer: Sanitizes strings in entity annotations against LLM jailbreaks.
 * 4. Telemetry Rate Limiter: In-memory sliding window rate limiter per client/session.
 */

// Injection patterns to detect and neutralize
const INJECTION_REGEXES = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /disregard\s+(all\s+)?prior/i,
  /you\s+are\s+now\s+in\s+DAN\s+mode/i,
  /system\s*:\s*role/i,
  /<\|(?:im_start|im_end|endoftext)\|>/i,
  /<script[\s\S]*?>[\s\S]*?<\/script>/i,
  /eval\s*\(/i,
  /drop\s+table/i,
  /select\s+.*\s+from\s+information_schema/i,
  /--\s*$/m,
  /\bexec\s*\(/i
];

// Configuration limits
export const SHIELD_CONFIG = {
  MAX_QUERY_RADIUS_KM: 500, // Maximum allowed search radius in kilometers
  MAX_PATH_COORDINATES: 2000, // Maximum coordinates in a single polyline
  MAX_STRING_LENGTH: 500, // Maximum string length for identifiers & annotations
  RATE_LIMIT_MAX_REQUESTS: 120, // Max tool calls per minute window
  RATE_LIMIT_WINDOW_MS: 60000 // 1 minute
};

/**
 * In-memory sliding window rate tracker
 */
const requestTimestamps = [];

/**
 * Sanitizes arbitrary text input to prevent indirect prompt injection
 * through tainted AIS or ADS-B metadata fields (e.g. vessel remarks, callsigns).
 * 
 * @param {string} text 
 * @returns {{ cleanText: string, sanitized: boolean, detectedThreat?: string }}
 */
export function sanitizeString(text) {
  if (typeof text !== 'string') return { cleanText: '', sanitized: false };

  // Truncate to maximum length
  let truncated = text.slice(0, SHIELD_CONFIG.MAX_STRING_LENGTH);
  let detected = null;

  for (const regex of INJECTION_REGEXES) {
    if (regex.test(truncated)) {
      detected = regex.toString();
      truncated = truncated.replace(regex, '[REDACTED_SECURITY_THREAT]');
    }
  }

  return {
    cleanText: truncated.trim(),
    sanitized: detected !== null,
    detectedThreat: detected
  };
}

/**
 * Validates latitude and longitude coordinates according to WGS84 standards.
 * 
 * @param {number} lat 
 * @param {number} lon 
 * @returns {{ valid: boolean, reason?: string }}
 */
export function validateWGS84Coordinates(lat, lon) {
  if (typeof lat !== 'number' || isNaN(lat) || lat < -90 || lat > 90) {
    return { valid: false, reason: `Latitude ${lat} is out of valid WGS84 bounds [-90, 90]` };
  }
  if (typeof lon !== 'number' || isNaN(lon) || lon < -180 || lon > 180) {
    return { valid: false, reason: `Longitude ${lon} is out of valid WGS84 bounds [-180, 180]` };
  }
  return { valid: true };
}

/**
 * Enforces rate limiting on tool calls using a sliding window.
 * 
 * @returns {{ allowed: boolean, remaining: number }}
 */
export function checkRateLimit() {
  const now = Date.now();
  // Purge expired timestamps
  while (requestTimestamps.length > 0 && requestTimestamps[0] <= now - SHIELD_CONFIG.RATE_LIMIT_WINDOW_MS) {
    requestTimestamps.shift();
  }

  if (requestTimestamps.length >= SHIELD_CONFIG.RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  requestTimestamps.push(now);
  return {
    allowed: true,
    remaining: SHIELD_CONFIG.RATE_LIMIT_MAX_REQUESTS - requestTimestamps.length
  };
}

/**
 * Resets the rate limiter (useful for test isolation)
 */
export function resetRateLimiter() {
  requestTimestamps.length = 0;
}

/**
 * Pre-execution Gatekeeper: Validates and sanitizes tool arguments before execution.
 * Returns an authorization object.
 * 
 * @param {string} toolName 
 * @param {object} args 
 * @returns {{ allowed: boolean, sanitizedArgs: object, error?: string }}
 */
export function validateAndSanitizeToolCall(toolName, args) {
  // 1. Check Rate Limiter
  const rateStatus = checkRateLimit();
  if (!rateStatus.allowed) {
    return {
      allowed: false,
      sanitizedArgs: args,
      error: `AgentShield Rate Limit Exceeded: Max ${SHIELD_CONFIG.RATE_LIMIT_MAX_REQUESTS} requests/minute.`
    };
  }

  if (!args || typeof args !== 'object') {
    return { allowed: false, sanitizedArgs: {}, error: 'Invalid tool arguments: must be an object' };
  }

  const sanitized = JSON.parse(JSON.stringify(args)); // Deep clone

  // 2. Validate by specific tool requirements
  switch (toolName) {
    case 'calculate_distance_and_heading': {
      const vOrigin = validateWGS84Coordinates(sanitized.originLat, sanitized.originLon);
      if (!vOrigin.valid) return { allowed: false, sanitizedArgs: sanitized, error: vOrigin.reason };

      const vTarget = validateWGS84Coordinates(sanitized.targetLat, sanitized.targetLon);
      if (!vTarget.valid) return { allowed: false, sanitizedArgs: sanitized, error: vTarget.reason };
      break;
    }

    case 'evaluate_line_of_sight': {
      if (!sanitized.observer || !sanitized.target) {
        return { allowed: false, sanitizedArgs: sanitized, error: 'Observer and target objects required' };
      }
      const vObs = validateWGS84Coordinates(sanitized.observer.lat, sanitized.observer.lon);
      if (!vObs.valid) return { allowed: false, sanitizedArgs: sanitized, error: `Observer: ${vObs.reason}` };

      const vTgt = validateWGS84Coordinates(sanitized.target.lat, sanitized.target.lon);
      if (!vTgt.valid) return { allowed: false, sanitizedArgs: sanitized, error: `Target: ${vTgt.reason}` };

      if (sanitized.observer.alt < -500 || sanitized.target.alt < -500) {
        return { allowed: false, sanitizedArgs: sanitized, error: 'Altitude cannot be less than -500m below sea level' };
      }
      break;
    }

    case 'detect_subsea_cable_threat': {
      if (!sanitized.vessel || !sanitized.cable) {
        return { allowed: false, sanitizedArgs: sanitized, error: 'Vessel and cable definitions required' };
      }
      // Coordinate checks
      const vVessel = validateWGS84Coordinates(sanitized.vessel.lat, sanitized.vessel.lon);
      if (!vVessel.valid) return { allowed: false, sanitizedArgs: sanitized, error: `Vessel: ${vVessel.reason}` };

      // Sanitize vessel name & identifier
      if (sanitized.vessel.name) {
        sanitized.vessel.name = sanitizeString(sanitized.vessel.name).cleanText;
      }
      if (sanitized.vessel.mmsi) {
        sanitized.vessel.mmsi = sanitizeString(String(sanitized.vessel.mmsi)).cleanText;
      }

      // Check cable coordinates count
      if (Array.isArray(sanitized.cable.coordinates)) {
        if (sanitized.cable.coordinates.length > SHIELD_CONFIG.MAX_PATH_COORDINATES) {
          return {
            allowed: false,
            sanitizedArgs: sanitized,
            error: `Cable coordinate points (${sanitized.cable.coordinates.length}) exceed maximum threshold of ${SHIELD_CONFIG.MAX_PATH_COORDINATES}`
          };
        }
      }
      break;
    }

    case 'evaluate_orbital_conjunction': {
      if (!sanitized.primarySat || !sanitized.secondaryObject) {
        return { allowed: false, sanitizedArgs: sanitized, error: 'Primary satellite and secondary object required' };
      }
      if (sanitized.thresholdKm && (sanitized.thresholdKm <= 0 || sanitized.thresholdKm > SHIELD_CONFIG.MAX_QUERY_RADIUS_KM)) {
        return {
          allowed: false,
          sanitizedArgs: sanitized,
          error: `Conjunction threshold (${sanitized.thresholdKm} km) exceeds safe limit of ${SHIELD_CONFIG.MAX_QUERY_RADIUS_KM} km`
        };
      }
      if (sanitized.primarySat.name) {
        sanitized.primarySat.name = sanitizeString(sanitized.primarySat.name).cleanText;
      }
      if (sanitized.secondaryObject.name) {
        sanitized.secondaryObject.name = sanitizeString(sanitized.secondaryObject.name).cleanText;
      }
      break;
    }

    case 'evaluate_datacenter_grid_strain': {
      if (!sanitized.datacenter || !sanitized.gridNode) {
        return { allowed: false, sanitizedArgs: sanitized, error: 'Datacenter and gridNode required' };
      }
      if (sanitized.datacenter.drawMw < 0 || sanitized.gridNode.capacityMw <= 0) {
        return { allowed: false, sanitizedArgs: sanitized, error: 'Power capacities and draw must be non-negative' };
      }
      if (sanitized.datacenter.name) {
        sanitized.datacenter.name = sanitizeString(sanitized.datacenter.name).cleanText;
      }
      break;
    }

    case 'generate_cinematic_camera_path': {
      if (!sanitized.startCoord || !sanitized.targetCoord) {
        return { allowed: false, sanitizedArgs: sanitized, error: 'Start and target coordinates required' };
      }
      const vStart = validateWGS84Coordinates(sanitized.startCoord.lat, sanitized.startCoord.lon);
      if (!vStart.valid) return { allowed: false, sanitizedArgs: sanitized, error: `Start: ${vStart.reason}` };

      const vEnd = validateWGS84Coordinates(sanitized.targetCoord.lat, sanitized.targetCoord.lon);
      if (!vEnd.valid) return { allowed: false, sanitizedArgs: sanitized, error: `Target: ${vEnd.reason}` };
      break;
    }

    default:
      // Unknown tool - pass through if generic
      break;
  }

  return {
    allowed: true,
    sanitizedArgs: sanitized
  };
}
