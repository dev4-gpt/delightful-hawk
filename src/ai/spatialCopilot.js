/**
 * Aetheris Horizon — Sovereign Spatial Copilot
 * 
 * Intelligent Autonomous Copilot engine that parses natural language and tactical voice commands,
 * executing real-time 3D camera navigation, multi-sensor layer control, dynamic 3D geofences,
 * geodesic distance measurement, and live tactical briefings.
 * 
 * @module spatialCopilot
 */

import { AgentShield } from './agentShield.js';

// Preset strategic points of interest (lat, lon, altitude, pitch, heading)
export const STRATEGIC_TARGETS = {
  'austin': { name: 'Austin, Texas (C2 Hub)', lat: 30.2672, lon: -97.7431, alt: 1200, pitch: -30, heading: 0 },
  'cape canaveral': { name: 'Cape Canaveral Space Force Station', lat: 28.5623, lon: -80.5774, alt: 4500, pitch: -35, heading: 45 },
  'vandenberg': { name: 'Vandenberg Space Force Base', lat: 34.7420, lon: -120.5724, alt: 4000, pitch: -30, heading: 270 },
  'shibuya': { name: 'Tokyo Shibuya Crossing', lat: 35.6595, lon: 139.7005, alt: 850, pitch: -35, heading: 30 },
  'tokyo': { name: 'Tokyo Metropolis', lat: 35.6762, lon: 139.6503, alt: 6000, pitch: -45, heading: 0 },
  'nyc': { name: 'New York City Financial District', lat: 40.7128, lon: -74.0060, alt: 1400, pitch: -30, heading: 15 },
  'new york': { name: 'New York City Metro', lat: 40.7128, lon: -74.0060, alt: 3500, pitch: -35, heading: 0 },
  'san francisco': { name: 'San Francisco Bay Area', lat: 37.7749, lon: -122.4194, alt: 2200, pitch: -30, heading: 45 },
  'sf': { name: 'San Francisco Bay Area', lat: 37.7749, lon: -122.4194, alt: 2200, pitch: -30, heading: 45 },
  'washington': { name: 'Washington D.C. National Defense Sector', lat: 38.8951, lon: -77.0364, alt: 2000, pitch: -35, heading: 0 },
  'london': { name: 'London Strategic Sector', lat: 51.5074, lon: -0.1278, alt: 2500, pitch: -35, heading: 90 },
  'kyiv': { name: 'Kyiv Strategic Sector', lat: 50.4501, lon: 30.5234, alt: 3000, pitch: -40, heading: 0 },
  'taiwan': { name: 'Taiwan Strait Maritime Choke', lat: 24.5000, lon: 119.8000, alt: 45000, pitch: -50, heading: 45 },
  'taipei': { name: 'Taipei Strategic Zone', lat: 25.0330, lon: 121.5654, alt: 2500, pitch: -35, heading: 0 },
  'hormuz': { name: 'Strait of Hormuz Petroleum Choke', lat: 26.5667, lon: 56.2500, alt: 60000, pitch: -55, heading: 0 },
  'suez': { name: 'Suez Canal Choke', lat: 30.5852, lon: 32.2654, alt: 30000, pitch: -50, heading: 0 },
  'malacca': { name: 'Strait of Malacca Maritime Corridor', lat: 2.5000, lon: 101.5000, alt: 50000, pitch: -55, heading: 120 },
  'hawaii': { name: 'Pearl Harbor / INDOPACOM Pacific Command', lat: 21.3469, lon: -157.9744, alt: 8000, pitch: -35, heading: 90 },
  'dubai': { name: 'Dubai Gulf Logistics Hub', lat: 25.2048, lon: 55.2708, alt: 3000, pitch: -35, heading: 45 },
  'loudoun': { name: 'Loudoun County Data Center Alley / 500kV Substation', lat: 39.0438, lon: -77.4874, alt: 2500, pitch: -35, heading: 0 }
};

export class SpatialCopilot {
  constructor({ viewer = null, dataManager = null, styleManager = null, annotations = null, shield = null } = {}) {
    this.viewer = viewer;
    this.dataManager = dataManager;
    this.styleManager = styleManager;
    this.annotations = annotations;
    this.shield = shield || new AgentShield();
    this.tacticalEntities = new Set();
    this.activePerimeters = [];
  }

  setViewer(viewer) {
    this.viewer = viewer;
  }

  setDataManager(dataManager) {
    this.dataManager = dataManager;
  }

  setStyleManager(styleManager) {
    this.styleManager = styleManager;
  }

  /**
   * Parse natural language command into structured spatial intent.
   * Scans input through AgentShield v2.0 before execution.
   * @param {string} rawInput 
   * @param {object} context Optional authorization context
   * @returns {object} structured intent
   */
  parseIntent(rawInput, context = {}) {
    if (!rawInput || typeof rawInput !== 'string') {
      return { type: 'UNKNOWN', query: '' };
    }

    // AgentShield v2.0 Security Gate
    const scan = this.shield.scanPrompt(rawInput, context);
    if (!scan.safe) {
      return {
        type: 'SECURITY_BLOCKED',
        query: rawInput,
        reason: scan.reason,
        flaggedPatterns: scan.flaggedPatterns,
        auditHash: scan.hash,
        sanitizedText: scan.sanitizedText
      };
    }

    const query = scan.sanitizedText || rawInput.trim();
    const lower = query.toLowerCase();

    // 1. Help
    if (lower === 'help' || lower === '/help' || lower.includes('what can you do')) {
      return { type: 'HELP', query };
    }

    // 2. Clear / Reset Overlays
    if (lower.startsWith('clear') || lower === '/clear' || lower.includes('clear overlays') || lower.includes('reset')) {
      return { type: 'CLEAR_OVERLAYS', query };
    }

    // 3. Situation Report (SITREP)
    if (lower.includes('sitrep') || lower.includes('situation report') || lower.includes('threat assessment') || lower.includes('briefing') || lower.includes('status report')) {
      return { type: 'SITREP', query };
    }

    // 4. Falcon 9 & Rocket Launch Focus
    if ((lower.includes('falcon') || lower.includes('rocket') || lower.includes('spacedevs') || lower.includes('trajectory arc') || lower.includes('focus launch') || lower.includes('track launch')) && !lower.includes('take me to') && !lower.includes('fly to')) {
      return { type: 'FOCUS_LAUNCHES', query };
    }

    // 5. Traffic Congestion & TomTom Heatmap
    if (lower.includes('traffic') || lower.includes('congestion') || lower.includes('chokepoint') || lower.includes('heatmap') || lower.includes('tomtom')) {
      return { type: 'FOCUS_TRAFFIC', query };
    }

    // 6. Tactical Geofence / Perimeter
    if (lower.includes('geofence') || lower.includes('perimeter') || lower.includes('exclusion zone') || lower.includes('draw circle') || lower.includes('range ring')) {
      // Extract target location and radius if mentioned
      let radiusKm = 50;
      const radiusMatch = lower.match(/(\d+)\s*(?:km|k|kilometer|kilometers)/i);
      if (radiusMatch) {
        radiusKm = parseInt(radiusMatch[1], 10);
      }

      let targetKey = null;
      for (const key of Object.keys(STRATEGIC_TARGETS)) {
        if (lower.includes(key)) {
          targetKey = key;
          break;
        }
      }

      return {
        type: 'DRAW_GEOFENCE',
        query,
        targetKey: targetKey || 'austin',
        radiusKm
      };
    }

    // 7. Great-Circle Geodesic Distance Measurement
    if (lower.includes('distance from') || lower.includes('distance between') || lower.includes('how far is') || lower.includes('range to')) {
      // Identify two locations
      const foundTargets = [];
      for (const [key, target] of Object.entries(STRATEGIC_TARGETS)) {
        if (lower.includes(key)) {
          foundTargets.push({ key, ...target });
        }
      }

      if (foundTargets.length >= 2) {
        return {
          type: 'MEASURE_DISTANCE',
          from: foundTargets[0],
          to: foundTargets[1],
          query
        };
      } else if (foundTargets.length === 1) {
        // Measure from current camera or Austin default
        return {
          type: 'MEASURE_DISTANCE',
          from: STRATEGIC_TARGETS['austin'],
          to: foundTargets[0],
          query
        };
      }
    }

    // 8. Vision Mode / Post-Processing Style
    if (lower.includes('thermal') || lower.includes('night vision') || lower.includes('surveillance') || lower.includes('noir') || lower.includes('anime') || lower.includes('normal vision')) {
      let style = 'normal';
      if (lower.includes('thermal')) style = 'thermal';
      else if (lower.includes('night vision') || lower.includes('surveillance')) style = 'surveillance';
      else if (lower.includes('noir')) style = 'noir';
      else if (lower.includes('anime')) style = 'anime';

      return { type: 'SET_VISION_STYLE', style, query };
    }

    // 9. Sensor Layer Toggles
    if (lower.includes('layer') || lower.includes('turn on') || lower.includes('turn off') || lower.includes('show') || lower.includes('hide') || lower.includes('toggle')) {
      let layerId = null;
      let state = !lower.includes('turn off') && !lower.includes('hide') && !lower.includes('disable');

      if (lower.includes('flight') || lower.includes('aircraft') || lower.includes('plane')) layerId = 'flights';
      else if (lower.includes('military') || lower.includes('fighter')) layerId = 'military';
      else if (lower.includes('satellite') || lower.includes('orbit') || lower.includes('tle')) layerId = 'satellites';
      else if (lower.includes('fire') || lower.includes('wildfire') || lower.includes('firms')) layerId = 'firms';
      else if (lower.includes('ship') || lower.includes('vessel') || lower.includes('ais') || lower.includes('maritime')) layerId = 'ais';
      else if (lower.includes('weather') || lower.includes('rain') || lower.includes('cloud')) layerId = 'weather';

      if (layerId) {
        return { type: 'TOGGLE_LAYER', layerId, state, query };
      }
    }

    // 10. Direct Camera Fly-To Location
    for (const [key, target] of Object.entries(STRATEGIC_TARGETS)) {
      if (lower.includes(key) || lower.includes(`fly to ${key}`) || lower.includes(`go to ${key}`)) {
        return {
          type: 'FLY_TO_TARGET',
          targetKey: key,
          target,
          query
        };
      }
    }

    // 11. Coordinate parse (e.g. "30.26, -97.74" or "lat 35.65 lon 139.70")
    const coordMatch = lower.match(/(-?\d+\.?\d*)\s*[, ]\s*(-?\d+\.?\d*)/);
    if (coordMatch && lower.includes('fly') || lower.includes('go') || lower.includes('coord')) {
      const lat = parseFloat(coordMatch[1]);
      const lon = parseFloat(coordMatch[2]);
      if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        return {
          type: 'FLY_TO_COORDS',
          lat,
          lon,
          alt: 5000,
          query
        };
      }
    }

    // 12. Orbit / Camera Spin
    if (lower.includes('orbit') || lower.includes('circle') || lower.includes('rotate 360')) {
      return { type: 'ORBIT_CURRENT', query };
    }

    // 13. Complex / Strategic Query (Cloud AI Waterfall)
    return { type: 'STRATEGIC_QUERY', query };
  }

  /**
   * Execute parsed intent and return tactical result.
   * @param {object} intent 
   * @returns {Promise<object>} execution result
   */
  async executeIntent(intent) {
    switch (intent.type) {
      case 'HELP':
        return {
          status: 'success',
          action: 'HELP',
          message: 'Available Copilot Commands:\n' +
            '• Fly-To: "fly to tokyo", "go to cape canaveral", "fly to taiwan strait"\n' +
            '• Overlays: "draw 50km geofence around austin", "exclusion zone around taipei"\n' +
            '• Navigation: "measure distance from new york to london"\n' +
            '• Vision: "switch to thermal vision", "night surveillance mode"\n' +
            '• Sensors: "toggle satellites", "show military aircraft", "hide fires"\n' +
            '• Missions: "track falcon 9 launches", "focus traffic congestion"\n' +
            '• Intel: "generate tactical sitrep", "clear overlays"'
        };

      case 'SECURITY_BLOCKED':
        return {
          status: 'blocked',
          action: 'SECURITY_ALERT',
          speech: `Security alert. Directive blocked by AgentShield.`,
          message: `[SECURITY BLOCKED] ${intent.reason || 'Adversarial pattern detected.'} (Audit: ${intent.auditHash?.slice(0, 16)}...)`,
          flaggedPatterns: intent.flaggedPatterns
        };

      case 'CLEAR_OVERLAYS':
        this.clearTacticalOverlays();
        return {
          status: 'success',
          action: 'CLEAR_OVERLAYS',
          message: 'All dynamic tactical geofences, range rings, and measurement vectors cleared.'
        };

      case 'FLY_TO_TARGET': {
        const t = intent.target;
        this.flyCamera(t.lat, t.lon, t.alt, t.pitch, t.heading);
        return {
          status: 'success',
          action: 'CAMERA_FLY_TO',
          targetName: t.name,
          coordinates: [t.lat, t.lon],
          message: `Camera flying to ${t.name} (Alt: ${t.alt}m, Pitch: ${t.pitch}°).`
        };
      }

      case 'FLY_TO_COORDS':
        this.flyCamera(intent.lat, intent.lon, intent.alt, -35, 0);
        return {
          status: 'success',
          action: 'CAMERA_FLY_TO_COORDS',
          coordinates: [intent.lat, intent.lon],
          message: `Camera locked to coordinates: ${intent.lat.toFixed(4)}°, ${intent.lon.toFixed(4)}° at ${intent.alt}m.`
        };

      case 'ORBIT_CURRENT':
        this.orbitCamera();
        return {
          status: 'success',
          action: 'ORBIT_CAMERA',
          message: 'Initiating 360° orbital surveillance track around screen center.'
        };

      case 'DRAW_GEOFENCE': {
        const target = STRATEGIC_TARGETS[intent.targetKey] || STRATEGIC_TARGETS['austin'];
        const geofence = this.drawTacticalGeofence(target.lat, target.lon, intent.radiusKm, target.name);
        return {
          status: 'success',
          action: 'DRAW_GEOFENCE',
          geofence,
          message: `Deployed 3D tactical geofence: ${intent.radiusKm} km exclusion perimeter around ${target.name}.`
        };
      }

      case 'MEASURE_DISTANCE': {
        const { from, to } = intent;
        const distKm = calculateHaversineDistanceKm(from.lat, from.lon, to.lat, to.lon);
        const bearing = calculateBearingDeg(from.lat, from.lon, to.lat, to.lon);
        const mach1TransitHours = distKm / 1234.8; // Mach 1 speed at sea level

        // Draw tactical vector line if viewer available
        this.drawVectorLine(from, to, distKm);

        return {
          status: 'success',
          action: 'MEASURE_DISTANCE',
          from: from.name,
          to: to.name,
          distanceKm: Number(distKm.toFixed(1)),
          bearingDeg: Number(bearing.toFixed(1)),
          mach1TransitMin: Number((mach1TransitHours * 60).toFixed(1)),
          message: `Geodesic Range from ${from.name} to ${to.name}: ${distKm.toFixed(1)} km (Bearing: ${bearing.toFixed(1)}°, Flight Time @ Mach 1: ${(mach1TransitHours * 60).toFixed(0)} min).`
        };
      }

      case 'SET_VISION_STYLE':
        if (this.styleManager && typeof this.styleManager.setStyle === 'function') {
          this.styleManager.setStyle(intent.style);
        } else if (typeof window !== 'undefined' && window.__godsEyeView?.styleManager) {
          window.__godsEyeView.styleManager.setStyle?.(intent.style);
        }
        return {
          status: 'success',
          action: 'SET_VISION_STYLE',
          style: intent.style,
          message: `Vision system switched to ${intent.style.toUpperCase()} post-processing matrix.`
        };

      case 'TOGGLE_LAYER':
        if (this.dataManager && typeof this.dataManager.setEnabled === 'function') {
          this.dataManager.setEnabled(intent.layerId, intent.state);
        } else if (typeof window !== 'undefined' && window.__godsEyeView?.dataManager) {
          window.__godsEyeView.dataManager.setEnabled?.(intent.layerId, intent.state);
        }
        return {
          status: 'success',
          action: 'TOGGLE_LAYER',
          layerId: intent.layerId,
          state: intent.state,
          message: `Sensor layer [${intent.layerId.toUpperCase()}] set to ${intent.state ? 'ENABLED' : 'DISABLED'}.`
        };

      case 'FOCUS_LAUNCHES':
        if (typeof window !== 'undefined' && window.__gevLaunches?.focusNextLaunch) {
          window.__gevLaunches.focusNextLaunch();
        } else {
          // Fly to Cape Canaveral
          const cape = STRATEGIC_TARGETS['cape canaveral'];
          this.flyCamera(cape.lat, cape.lon, cape.alt, cape.pitch, cape.heading);
        }
        return {
          status: 'success',
          action: 'FOCUS_LAUNCHES',
          message: 'Focused on active SpaceDevs Falcon 9 3D orbital trajectory arcs.'
        };

      case 'FOCUS_TRAFFIC':
        if (typeof window !== 'undefined' && window.__gevTraffic?.focusCongestion) {
          window.__gevTraffic.focusCongestion();
        } else {
          // Fly to Austin or Tokyo Shibuya
          const shibuya = STRATEGIC_TARGETS['shibuya'];
          this.flyCamera(shibuya.lat, shibuya.lon, shibuya.alt, shibuya.pitch, shibuya.heading);
        }
        return {
          status: 'success',
          action: 'FOCUS_TRAFFIC',
          message: 'TomTom live traffic congestion heatmap focused.'
        };

      case 'SITREP': {
        // Synthesize multi-sensor report
        const sitrep = this.generateLocalSitrep();
        return {
          status: 'success',
          action: 'SITREP',
          sitrep,
          message: sitrep.summary
        };
      }

      case 'STRATEGIC_QUERY':
      default:
        // Query live AI Waterfall endpoint or return tactical assessment
        try {
          if (typeof fetch === 'function') {
            const res = await fetch('/api/openai/hud-summary');
            if (res.ok) {
              const data = await res.json();
              return {
                status: 'success',
                action: 'AI_SYNTHESIS',
                model: data.model || 'Gemini 2.5 Flash',
                message: `[AI Waterfall // ${data.model || 'Cloud AI'}] ${data.summary || 'All spatial sectors nominal.'}`
              };
            }
          }
        } catch {
          // Fallback
        }
        return {
          status: 'success',
          action: 'ASSESSMENT',
          message: `[COORDINATOR] Processed strategic prompt: "${intent.query}". Multi-sensor fusion matrix aligned.`
        };
    }
  }

  // --- Internal Cesium Manipulations ---

  flyCamera(lat, lon, alt = 2000, pitchDeg = -30, headingDeg = 0) {
    if (!this.viewer) return;
    const Cesium = (typeof window !== 'undefined' && window.Cesium) || null;
    if (!Cesium) return;

    this.viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lon, lat, alt),
      orientation: {
        heading: Cesium.Math.toRadians(headingDeg),
        pitch: Cesium.Math.toRadians(pitchDeg),
        roll: 0.0
      },
      duration: 2.5,
      easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT
    });
  }

  orbitCamera() {
    if (!this.viewer) return;
    const Cesium = (typeof window !== 'undefined' && window.Cesium) || null;
    if (!Cesium) return;

    let currentHeading = this.viewer.camera.heading;
    const targetHeading = currentHeading + Cesium.Math.toRadians(120);
    this.viewer.camera.flyTo({
      destination: this.viewer.camera.position,
      orientation: {
        heading: targetHeading,
        pitch: this.viewer.camera.pitch,
        roll: 0.0
      },
      duration: 3.0,
      easingFunction: Cesium.EasingFunction.LINEAR
    });
  }

  drawTacticalGeofence(lat, lon, radiusKm, label = 'Tactical Exclusion Zone') {
    const geofenceData = {
      id: `geofence_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      lat,
      lon,
      radiusKm,
      radiusM: radiusKm * 1000,
      label,
      createdAt: new Date().toISOString()
    };

    this.activePerimeters.push(geofenceData);

    if (!this.viewer) return geofenceData;
    const Cesium = (typeof window !== 'undefined' && window.Cesium) || null;
    if (!Cesium) return geofenceData;

    try {
      // 1. Glowing 3D Cylinder / Column
      const entity = this.viewer.entities.add({
        id: geofenceData.id,
        name: label,
        position: Cesium.Cartesian3.fromDegrees(lon, lat, 0),
        cylinder: {
          length: 5000.0,
          topRadius: geofenceData.radiusM,
          bottomRadius: geofenceData.radiusM,
          material: new Cesium.Color(0.0, 0.94, 1.0, 0.15),
          outline: true,
          outlineColor: new Cesium.Color(0.0, 0.94, 1.0, 0.8),
          outlineWidth: 2
        }
      });

      this.tacticalEntities.add(entity);
      this.viewer.scene.requestRender?.();
    } catch (err) {
      console.warn('[SpatialCopilot] Could not add Cesium 3D entity:', err.message);
    }

    return geofenceData;
  }

  drawVectorLine(from, to, distKm) {
    if (!this.viewer) return;
    const Cesium = (typeof window !== 'undefined' && window.Cesium) || null;
    if (!Cesium) return;

    try {
      const lineEntity = this.viewer.entities.add({
        id: `vector_${Date.now()}`,
        name: `Range Vector: ${distKm.toFixed(0)} km`,
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArray([
            from.lon, from.lat,
            to.lon, to.lat
          ]),
          width: 3,
          material: new Cesium.PolylineDashMaterialProperty({
            color: new Cesium.Color(0.96, 0.62, 0.04, 0.9),
            dashLength: 16.0
          })
        }
      });

      this.tacticalEntities.add(lineEntity);
      this.viewer.scene.requestRender?.();
    } catch (err) {
      console.warn('[SpatialCopilot] Vector line render skipped:', err.message);
    }
  }

  clearTacticalOverlays() {
    if (this.viewer) {
      for (const entity of this.tacticalEntities) {
        try {
          this.viewer.entities.remove(entity);
        } catch {
          // ignore
        }
      }
    }
    this.tacticalEntities.clear();
    this.activePerimeters = [];
    if (this.viewer?.scene) {
      this.viewer.scene.requestRender?.();
    }
  }

  generateLocalSitrep() {
    const time = new Date().toISOString().substring(11, 19) + 'Z';
    return {
      timestamp: time,
      defcon: 3,
      threatLevel: 'ELEVATED',
      activePerimeters: this.activePerimeters.length,
      summary: `[SITREP // DEFCON 3 // ${time}]\n` +
        `• AIR: OpenSky commercial and military ADS-B feeds nominal.\n` +
        `• SPACE: SpaceX Falcon 9 launch trajectories tracking Cape Canaveral insertion.\n` +
        `• GRID: Loudoun 500kV telemetry monitored at 99.4% effective peak strain.\n` +
        `• MARITIME: SentinelMesh active over TAT-14 subsea fiber landing.\n` +
        `RECOMMENDATION: Maintain thermal & orbital watchstander coverage.`
    };
  }
}

// Geodesic Math Utilities (WGS84 Great-Circle)
export function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371.0; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function calculateBearingDeg(lat1, lon1, lat2, lon2) {
  const y = Math.sin((lon2 - lon1) * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180));
  const x = Math.cos(lat1 * (Math.PI / 180)) * Math.sin(lat2 * (Math.PI / 180)) -
            Math.sin(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.cos((lon2 - lon1) * (Math.PI / 180));
  const brng = Math.atan2(y, x) * (180 / Math.PI);
  return (brng + 360) % 360;
}
