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

  /**
   * Generates a multi-threat saturation raid scenario (e.g. 8x Shahed-136 / FPV UAS).
   * @param {number} [count=8] - Number of converging threats
   * @param {number} [baseAzimuth=45] - Central raid axis
   * @returns {Array<Object>} Ingress threat tracks
   */
  generateSwarmRaid(count = 8, baseAzimuth = 45) {
    const threats = [];
    const azimuthSpread = 360 / Math.max(1, count);

    for (let i = 0; i < count; i++) {
      const az = Math.round((baseAzimuth + i * azimuthSpread + (i % 2 === 0 ? 12 : -8)) % 360);
      const dist = Math.round(850 + (i * 140) + ((i * 37) % 150)); // Staggered 850m - 2000m
      const speed = Math.round(165 + ((i * 13) % 45)); // 165 - 210 km/h
      const alt = Math.round(14 + ((i * 7) % 35)); // 14m - 49m nap-of-the-earth

      threats.push({
        targetId: `TRK-SWARM-${String(i + 1).padStart(2, '0')}`,
        speedKmh: speed,
        altitudeM: alt,
        azimuthDeg: az,
        distanceMeters: dist,
        warheadKg: 50,
        threatClass: 'Shahed-136 Loitering Munition'
      });
    }

    return threats;
  }

  /**
   * Allocates battery effectors across a multi-target saturation raid.
   * Employs greedy bipartite matching weighted by Time-to-Impact and angular pod alignment.
   * @param {Array<Object>} swarmTracks 
   * @returns {Object} Swarm engagement plan
   */
  allocateSwarmEffectors(swarmTracks) {
    // Sort threats by Time-to-Impact ascending (closest / fastest first)
    const prioritized = [...swarmTracks].map(t => {
      const targetSpeedMps = (t.speedKmh || 180) / 3.6;
      const timeToImpactSeconds = Number(((t.distanceMeters || 1000) / Math.max(10, targetSpeedMps)).toFixed(1));
      return { ...t, timeToImpactSeconds };
    }).sort((a, b) => a.timeToImpactSeconds - b.timeToImpactSeconds);

    const allocations = [];
    let interceptedCount = 0;
    let leakedCount = 0;

    for (const threat of prioritized) {
      const podSelection = this.selectOptimalPod(threat.azimuthDeg);
      if (podSelection.available && podSelection.podId) {
        // Discharge from battery inventory
        const discharge = this.dischargeEffector(podSelection.podId);
        allocations.push({
          targetId: threat.targetId,
          targetAzimuthDeg: threat.azimuthDeg,
          distanceMeters: threat.distanceMeters,
          timeToImpactSeconds: threat.timeToImpactSeconds,
          assignedPod: podSelection.podId,
          assignedSector: podSelection.sector,
          remainingInPod: discharge.remainingInPod,
          status: 'INTERCEPT_SCHEDULED'
        });
        interceptedCount++;
      } else {
        allocations.push({
          targetId: threat.targetId,
          targetAzimuthDeg: threat.azimuthDeg,
          distanceMeters: threat.distanceMeters,
          timeToImpactSeconds: threat.timeToImpactSeconds,
          assignedPod: null,
          assignedSector: null,
          status: 'LEAKAGE_BATTERY_DEPLETED'
        });
        leakedCount++;
      }
    }

    const totalPatriotUsd = prioritized.length * this.patriotCostUsd;
    const totalAetherisUsd = interceptedCount * this.interceptorCostUsd;
    const costSavingsUsd = totalPatriotUsd - totalAetherisUsd;
    const costSavingsPercent = Number(((costSavingsUsd / totalPatriotUsd) * 100).toFixed(2));

    let totalBatteryRemaining = 0;
    for (const p of Object.values(this.battery)) {
      totalBatteryRemaining += p.count;
    }

    return {
      totalThreats: prioritized.length,
      interceptedCount,
      leakedCount,
      totalBatteryRemaining,
      allocations,
      economics: {
        totalPatriotCostUsd: totalPatriotUsd,
        totalAetherisCostUsd: totalAetherisUsd,
        netSavingsUsd: costSavingsUsd,
        costSavingsPercent
      }
    };
  }

  /**
   * Generates a standard QGroundControl .plan (MAVLink 2.0 waypoint mission)
   * ready to upload directly to PX4 or ArduPilot kinetic ram-drone autopilots.
   * @param {Object} threat - Ingress threat state
   * @param {string} [assignedPod='POD-A'] - Launch pod
   * @param {Object} [baseCoords] - Base GPS origin { lat, lon, alt }
   * @returns {string} QGroundControl .plan JSON formatted string
   */
  exportQGCPlan(threat, assignedPod = 'POD-A', baseCoords = { lat: 28.4312, lon: 77.0545, alt: 220 }) {
    const azRad = ((threat.azimuthDeg || 48) * Math.PI) / 180;
    const distM = threat.distanceMeters || 950;
    const interceptDistM = distM * 0.45; // Intercept ~45% along ingress vector

    // Geodesic offset calculation
    const dLat = (interceptDistM * Math.cos(azRad)) / 111320;
    const dLon = (interceptDistM * Math.sin(azRad)) / (111320 * Math.cos((baseCoords.lat * Math.PI) / 180));
    const interceptLat = Number((baseCoords.lat + dLat).toFixed(6));
    const interceptLon = Number((baseCoords.lon + dLon).toFixed(6));
    const interceptAltM = Math.round((threat.altitudeM || 18) + 12);

    const plan = {
      fileType: "Plan",
      version: 1,
      groundStation: "AETHERIS_DEFENSE_C2",
      mission: {
        cruiseSpeed: 77.7, // 280 km/h
        hoverSpeed: 0,
        firmwareType: 12, // MAV_AUTOPILOT_PX4
        vehicleType: 2, // MAV_TYPE_QUADROTOR / FIXED-WING RAM
        plannedHomePosition: [baseCoords.lat, baseCoords.lon, baseCoords.alt],
        items: [
          {
            autoContinue: true,
            command: 22, // MAV_CMD_NAV_TAKEOFF
            frame: 3, // MAV_FRAME_GLOBAL_RELATIVE_ALT
            params: [15, 0, 0, null, baseCoords.lat, baseCoords.lon, 45]
          },
          {
            autoContinue: true,
            command: 16, // MAV_CMD_NAV_WAYPOINT (Kinetic lead intercept point)
            frame: 3,
            params: [0, 0, 0, null, interceptLat, interceptLon, interceptAltM]
          },
          {
            autoContinue: true,
            command: 183, // MAV_CMD_DO_SET_SERVO (Deploy ram / net payload)
            frame: 2, // MAV_FRAME_MISSION
            params: [9, 2000, 0, 0, 0, 0, 0]
          },
          {
            autoContinue: true,
            command: 20, // MAV_CMD_NAV_RETURN_TO_LAUNCH
            frame: 2,
            params: [0, 0, 0, 0, 0, 0, 0]
          }
        ]
      },
      metadata: {
        callsign: `AETHERIS-RAM-${assignedPod}`,
        targetId: threat.targetId || 'TRK-UAS-0842',
        targetAzimuthDeg: threat.azimuthDeg || 48,
        generatedAt: new Date().toISOString()
      }
    };

    return JSON.stringify(plan, null, 2);
  }
}
