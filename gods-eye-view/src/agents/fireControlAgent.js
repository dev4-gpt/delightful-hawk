/**
 * FireControlAgent - Sensor-to-Shooter & Kinetic Effector Allocator
 * 
 * Part of the Aetheris Agentic Defense Swarm (Google Antigravity SDK + ECC Framework)
 * Solves kinematic intercept geometry, assigns optimal effector pods (Pods A-D),
 * computes asymmetric cost-per-kill economics, and generates DoD Cursor-on-Target (CoT) XML.
 */

export class FireControlAgent {
  constructor(options = {}) {
    this.name = 'FireControlAgent';
    this.role = 'Sensor-to-Shooter & Kinetic Effector Allocator';
    
    // Financial and effector parameters
    this.interceptorCostUsd = 4800; // Aetheris Attritable Kinetic Ram Drone
    this.patriotCostUsd = 3400000;  // Standard PAC-3 MSE interceptor
    this.shahedThreatCostUsd = 22000; // Shahed-136 loitering munition
    
    // Battery configuration: 4 pods x 4 canisters = 16 kinetic ram effectors
    this.battery = {
      'POD-A': { sector: 'Alpha (North-East)', azimuthDeg: 45, count: 4, ready: true },
      'POD-B': { sector: 'Bravo (South-East)', azimuthDeg: 135, count: 4, ready: true },
      'POD-C': { sector: 'Charlie (South-West)', azimuthDeg: 225, count: 4, ready: true },
      'POD-D': { sector: 'Delta (North-West)', azimuthDeg: 315, count: 4, ready: true }
    };
    
    this.ciwsModeActive = options.ciwsMode || false; // DoD Directive 3000.09 Human-in-the-loop by default
  }

  /**
   * Sets Semi-Autonomous CIWS auto-fire mode.
   * @param {boolean} active 
   */
  setCIWSMode(active) {
    this.ciwsModeActive = Boolean(active);
  }

  /**
   * Selects the optimal interceptor pod based on target ingress azimuth and inventory.
   * @param {number} targetAzimuthDeg - Azimuth of incoming threat (0 - 360 deg)
   * @returns {Object} Selected pod metadata
   */
  selectOptimalPod(targetAzimuthDeg) {
    const targetAz = ((targetAzimuthDeg % 360) + 360) % 360;
    let bestPodId = null;
    let minDiff = 360;

    for (const [podId, pod] of Object.entries(this.battery)) {
      if (pod.count > 0 && pod.ready) {
        let diff = Math.abs(pod.azimuthDeg - targetAz);
        if (diff > 180) diff = 360 - diff;
        if (diff < minDiff) {
          minDiff = diff;
          bestPodId = podId;
        }
      }
    }

    if (!bestPodId) {
      return { podId: null, available: false, error: 'MAGAZINE DEPLETED: Zero effectors remaining' };
    }

    return {
      podId: bestPodId,
      available: true,
      sector: this.battery[bestPodId].sector,
      remainingInPod: this.battery[bestPodId].count,
      angularOffsetDeg: minDiff
    };
  }

  /**
   * Calculates kinematic intercept parameters and closing velocity.
   * @param {Object} threat - Ingress threat state
   * @returns {Object} Solution geometry
   */
  computeInterceptSolution(threat) {
    const targetId = threat.targetId || 'TRK-UAS-0842';
    const targetSpeedKmh = threat.speedKmh || 185;
    const targetAltM = threat.altitudeM || threat.altitude || 18;
    const targetAzimuthDeg = threat.azimuthDeg ?? threat.targetAzimuthDeg ?? threat.azimuth ?? 48;
    const distanceMeters = threat.distanceMeters || 950; // Distance to impact point

    const targetSpeedMps = targetSpeedKmh / 3.6; // ~51.4 m/s
    const timeToImpactSeconds = Number((distanceMeters / Math.max(10, targetSpeedMps)).toFixed(1));

    // Aetheris kinetic interceptor acceleration: 0-250 km/h in 1.4s, cruise 280 km/h
    const interceptorSpeedMps = 77.7; // ~280 km/h
    const closingVelocityMps = targetSpeedMps + interceptorSpeedMps;
    const timeToInterceptSeconds = Number((distanceMeters / closingVelocityMps).toFixed(1));
    const interceptDistanceMeters = Number((interceptorSpeedMps * timeToInterceptSeconds).toFixed(1));

    const podSelection = this.selectOptimalPod(targetAzimuthDeg);
    const costSavingsPercent = Number((((this.patriotCostUsd - this.interceptorCostUsd) / this.patriotCostUsd) * 100).toFixed(2));

    return {
      targetId,
      targetSpeedKmh,
      targetAltitudeM: targetAltM,
      targetAzimuthDeg,
      distanceToImpactM: distanceMeters,
      timeToImpactSeconds,
      timeToInterceptSeconds,
      interceptAltitudeM: Math.round(targetAltM + 6), // Intercept from top-down plunge
      interceptDistanceMeters,
      assignedPod: podSelection.podId,
      assignedSector: podSelection.sector,
      effectorCostUsd: this.interceptorCostUsd,
      patriotCostUsd: this.patriotCostUsd,
      threatCostUsd: this.shahedThreatCostUsd,
      costSavingsPercent,
      ciwsAutonomousAuthorized: this.ciwsModeActive && timeToImpactSeconds < 10.0
    };
  }

  /**
   * Discharges an effector from the selected battery pod.
   * @param {string} podId 
   * @returns {Object} Discharge telemetry
   */
  dischargeEffector(podId) {
    if (!this.battery[podId]) {
      throw new Error(`Invalid pod ID: ${podId}`);
    }
    if (this.battery[podId].count <= 0) {
      return { success: false, error: `Pod ${podId} is depleted.` };
    }

    this.battery[podId].count -= 1;
    let totalReady = 0;
    for (const p of Object.values(this.battery)) {
      totalReady += p.count;
    }

    return {
      success: true,
      podId,
      remainingInPod: this.battery[podId].count,
      totalBatteryRemaining: totalReady,
      timestamp: Date.now()
    };
  }

  /**
   * Generates DoD-standard Cursor-on-Target (CoT) XML event stream for ATAK/WinTAK integration.
   * @param {Object} solution - Intercept solution
   * @param {number} [lat=28.4312] - Base latitude
   * @param {number} [lon=77.0545] - Base longitude
   * @returns {string} Standardized MIL-STD Cursor-on-Target XML
   */
  generateCursorOnTargetXML(solution, lat = 28.4312, lon = 77.0545) {
    const now = new Date();
    const timeIso = now.toISOString();
    const staleTime = new Date(now.getTime() + 60000).toISOString();
    
    return [
      `<?xml version="1.0" standalone="yes"?>`,
      `<event version="2.0" uid="AETHERIS-EFF-${solution.assignedPod || 'POD-A'}" type="a-f-A-M-F-Q" time="${timeIso}" start="${timeIso}" stale="${staleTime}" how="m-g">`,
      `  <point lat="${lat.toFixed(6)}" lon="${lon.toFixed(6)}" hae="${solution.interceptAltitudeM}" ce="1.5" le="2.0"/>`,
      `  <detail>`,
      `    <contact callsign="AETHERIS-RAM-${solution.assignedPod || 'A'}" endpoint="127.0.0.1:4242"/>`,
      `    <track course="${solution.targetAzimuthDeg}" speed="${solution.targetSpeedKmh}"/>`,
      `    <asymmetric-c2 target="${solution.targetId}" timeToIntercept="${solution.timeToInterceptSeconds}s" costUsd="${solution.effectorCostUsd}"/>`,
      `  </detail>`,
      `</event>`
    ].join('\n');
  }
}
