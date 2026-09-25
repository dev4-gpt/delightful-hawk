// gods-eye-view/src/modules/sentinelMeshCartridge.js
/**
 * SentinelMesh Domain Cartridge:
 * Subsea Fiber-Optic Cable & Maritime Infrastructure Defense Watchstander
 */

import { CARTRIDGE_IDS } from './cartridgeRegistry.js';

export function createSentinelMeshCartridge(options = {}) {
  const activeAlerts = new Map();

  return {
    id: CARTRIDGE_IDS.SENTINEL_MESH,
    title: 'SentinelMesh: Subsea Cable Defense',
    category: 'Critical Infrastructure & Maritime Defense',
    description: 'Autonomous watchstander detecting anomalous vessel loitering and anchor-drag threats over undersea fiber-optic cables.',
    
    onActivate(context) {
      // In a live viewer, enable submarine cables and AIS vessel layers
      if (context.layerManager) {
        if (typeof context.layerManager.setSubmarineCablesActive === 'function') {
          context.layerManager.setSubmarineCablesActive(true);
        }
        if (typeof context.layerManager.setAisLiveVesselsActive === 'function') {
          context.layerManager.setAisLiveVesselsActive(true);
        }
      }
    },

    onDeactivate(context) {
      activeAlerts.clear();
    },

    /**
     * Evaluates live vessel telemetry against known subsea cables
     */
    evaluateAlerts(vessels = [], cables = []) {
      const results = [];

      for (const vessel of vessels) {
        // Quick speed filter: vessels moving normally (> 5 kts) are low risk
        if (vessel.speedKnots > 3.0) continue;

        for (const cable of cables) {
          // Simple proximity check
          const distM = approximateDistanceM(vessel.lat, vessel.lon, cable.midLat, cable.midLon);
          if (distM < 1500) {
            const isCritical = vessel.durationMins >= 60;
            const alert = {
              id: `alert-${vessel.mmsi}-${cable.id}`,
              level: isCritical ? 'CRITICAL' : 'WARNING',
              vesselName: vessel.name || vessel.mmsi,
              vesselSpeed: vessel.speedKnots,
              cableName: cable.name,
              distanceMeters: Math.round(distM),
              timestamp: Date.now(),
              advisory: isCritical 
                ? 'Stationary vessel loitering over subsea fiber link >60m. Task satellite flyover and notify Port Authority.'
                : 'Vessel slowed in close proximity to subsea cable. Maintain radar lock.'
            };
            results.push(alert);
            activeAlerts.set(alert.id, alert);
          }
        }
      }

      return results;
    },

    getActiveAlerts() {
      return Array.from(activeAlerts.values());
    }
  };
}

function approximateDistanceM(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
