/**
 * Critical Infrastructure & Space Domain Anomaly Detection Engines
 */

import { haversineDistanceMeters, pointToPathDistance, geodeticToECEF, ecefDistance } from './spatialMath.js';

/**
 * SentinelMesh Anomaly Rule: Subsea Fiber & Maritime Infrastructure Watchstander
 * Evaluates whether a marine vessel poses a potential anchor-drag, sabotage, or loitering threat.
 * 
 * @param {Object} vessel Vessel state from AIS
 * @param {string} vessel.mmsi Maritime Mobile Service Identity
 * @param {string} [vessel.name] Vessel name
 * @param {number} vessel.lat Current latitude
 * @param {number} vessel.lon Current longitude
 * @param {number} vessel.speedKnots Speed in knots
 * @param {number} [vessel.durationNearMins] Estimated minutes in current zone
 * @param {Object} cable Subsea cable record
 * @param {string} cable.id Cable unique ID
 * @param {string} cable.name Cable name
 * @param {Array<{lat: number, lon: number}>} cable.coordinates Line geometry
 * @param {Array<{name: string, lat: number, lon: number}>} [cable.landingStations] Landing points
 * @returns {Object} Threat assessment
 */
export function evaluateSubseaCableThreat(vessel, cable) {
  const pathResult = pointToPathDistance({ lat: vessel.lat, lon: vessel.lon }, cable.coordinates);
  const distanceToCableM = pathResult.minDistanceM;

  // Check landing station proximity
  let nearestStation = null;
  let minStationDistM = Infinity;
  if (cable.landingStations && cable.landingStations.length > 0) {
    for (const station of cable.landingStations) {
      const d = haversineDistanceMeters(vessel.lat, vessel.lon, station.lat, station.lon);
      if (d < minStationDistM) {
        minStationDistM = d;
        nearestStation = station;
      }
    }
  }

  // Anomaly Heuristics:
  // 1. Critical Loiter / Anchor Drag: Speed < 2.5 knots AND distance < 1,000 meters
  // 2. Landing Point Stalking: Speed < 3.0 knots AND distance to landing point < 3,000 meters
  // 3. Normal Transit: Speed > 5 knots
  const isCloseToCable = distanceToCableM <= 1500;
  const isNearStation = minStationDistM <= 3000;
  const isLowSpeed = vessel.speedKnots <= 2.5;
  const duration = vessel.durationNearMins || 15;

  let threatLevel = 'NORMAL';
  const triggers = [];

  if (isCloseToCable && isLowSpeed && duration >= 60) {
    threatLevel = 'CRITICAL';
    triggers.push(`Vessel is stationary/loitering (${vessel.speedKnots} kts) within ${distanceToCableM}m of subsea cable for ${duration} mins`);
  } else if (isCloseToCable && isLowSpeed) {
    threatLevel = 'WARNING';
    triggers.push(`Vessel slowing/drifting (${vessel.speedKnots} kts) within ${distanceToCableM}m of subsea cable`);
  } else if (isNearStation && isLowSpeed) {
    threatLevel = 'ELEVATED';
    triggers.push(`Vessel loitering near cable landing station '${nearestStation?.name}' (${Math.round(minStationDistM)}m)`);
  } else if (isCloseToCable) {
    threatLevel = 'MONITOR';
    triggers.push(`Vessel in proximity to cable (${distanceToCableM}m) at normal transit speed (${vessel.speedKnots} kts)`);
  }

  return {
    vesselMmsi: vessel.mmsi,
    vesselName: vessel.name || 'Unknown Contact',
    cableId: cable.id,
    cableName: cable.name,
    threatLevel,
    distanceToCableMeters: distanceToCableM,
    distanceToLandingStationMeters: nearestStation ? Math.round(minStationDistM) : null,
    nearestLandingStation: nearestStation ? nearestStation.name : null,
    triggers,
    recommendedAction: threatLevel === 'CRITICAL' 
      ? 'Alert Coast Guard / Port Authority; Task next optical/SAR satellite pass'
      : threatLevel === 'WARNING'
      ? 'Increase AIS polling rate to 30s; notify cable operator NOC'
      : 'Maintain standard telemetry logging'
  };
}

/**
 * OrbitalOps Anomaly Rule: Satellite Conjunction & Space Debris Deconfliction
 * Evaluates close approach between two orbital bodies.
 * 
 * @param {Object} primarySat Primary satellite {id, name, lat, lon, altKm}
 * @param {Object} secondaryObject Debris or secondary satellite {id, name, lat, lon, altKm}
 * @param {number} [thresholdKm=15] Danger distance threshold in kilometers
 * @returns {Object} Conjunction assessment
 */
export function evaluateOrbitalConjunction(primarySat, secondaryObject, thresholdKm = 15) {
  // Convert satellite positions to ECEF (altitude in meters = altKm * 1000)
  const primaryECEF = geodeticToECEF(primarySat.lat, primarySat.lon, primarySat.altKm * 1000);
  const secondaryECEF = geodeticToECEF(secondaryObject.lat, secondaryObject.lon, secondaryObject.altKm * 1000);
  const totalEuclideanDistKm = ecefDistance(primaryECEF, secondaryECEF) / 1000.0;
  const altDeltaKm = Math.abs(primarySat.altKm - secondaryObject.altKm);

  const isCollisionRisk = totalEuclideanDistKm <= thresholdKm;
  const isSevereRisk = totalEuclideanDistKm <= thresholdKm / 3.0;

  let severity = 'GREEN';
  if (isSevereRisk) severity = 'RED_CRITICAL';
  else if (isCollisionRisk) severity = 'YELLOW_WARNING';

  return {
    primaryId: primarySat.id,
    primaryName: primarySat.name,
    secondaryId: secondaryObject.id,
    secondaryName: secondaryObject.name,
    distanceKm: Math.round(totalEuclideanDistKm * 100) / 100,
    altitudeDeltaKm: Math.round(altDeltaKm * 100) / 100,
    isCollisionRisk,
    severity,
    maneuverAdvisory: isSevereRisk
      ? 'Initiate orbital collision avoidance thruster burn within 120 minutes'
      : isCollisionRisk
      ? 'Prepare automated delta-V advisory for ground flight controllers'
      : 'Clear - Normal orbital tracking'
  };
}

/**
 * GridTwin Anomaly Rule: AI Datacenter & Electric Transmission Grid Thermal Stress
 */
export function evaluateGridThermalStrain(datacenter, gridNode, ambientTempC) {
  // Heat strain index: higher ambient temperature reduces transmission line cooling capacity
  const capacityReductionPct = Math.max(0, (ambientTempC - 35) * 1.5);
  const effectiveCapacityMw = gridNode.capacityMw * (1 - capacityReductionPct / 100.0);
  const utilizationPct = Math.round((datacenter.drawMw / effectiveCapacityMw) * 100);

  let status = 'NOMINAL';
  if (utilizationPct >= 90) status = 'CRITICAL_OVERLOAD';
  else if (utilizationPct >= 75) status = 'STRAINED';

  return {
    datacenterName: datacenter.name,
    gridSubstation: gridNode.name,
    ambientTempC,
    powerDrawMw: datacenter.drawMw,
    effectiveGridCapacityMw: Math.round(effectiveCapacityMw),
    gridUtilizationPct: utilizationPct,
    status,
    advisory: status === 'CRITICAL_OVERLOAD'
      ? 'Initiate compute load shedding or shift inference traffic to cooler regional clusters'
      : 'Normal grid operation'
  };
}
