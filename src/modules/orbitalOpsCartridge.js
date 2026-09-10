// gods-eye-view/src/modules/orbitalOpsCartridge.js
/**
 * OrbitalOps Domain Cartridge:
 * LEO Space Domain Awareness & Conjunction Assessment Watchstander
 */

import { CARTRIDGE_IDS } from './cartridgeRegistry.js';

export function createOrbitalOpsCartridge(options = {}) {
  const activeAlerts = new Map();

  return {
    id: CARTRIDGE_IDS.ORBITAL_OPS,
    title: 'OrbitalOps: Space Domain Awareness & Conjunctions',
    category: 'Space Systems & Orbital Defense',
    description: 'Autonomous LEO debris and satellite close-approach conjunction assessment engine.',

    onActivate(context) {
      if (context.layerManager && typeof context.layerManager.setSatellitesActive === 'function') {
        context.layerManager.setSatellitesActive(true);
      }
    },

    onDeactivate(context) {
      activeAlerts.clear();
      if (context.layerManager && typeof context.layerManager.setSatellitesActive === 'function') {
        context.layerManager.setSatellitesActive(false);
      }
    },

    /**
     * Evaluates pairwise proximity between satellites and tracked debris
     * @param {Array<object>} primarySats
     * @param {Array<object>} secondaryObjects
     * @param {number} thresholdKm
     */
    evaluateAlerts(primarySats = [], secondaryObjects = [], thresholdKm = 10) {
      const results = [];

      for (const sat of primarySats) {
        for (const obj of secondaryObjects) {
          if (sat.id === obj.id) continue;

          // Estimate 3D distance in ECEF/geocentric space (simplified sphere model)
          const R = 6371.0;
          const r1 = R + (sat.altKm || 550.0);
          const r2 = R + (obj.altKm || 550.0);

          const phi1 = (sat.lat * Math.PI) / 180.0;
          const lam1 = (sat.lon * Math.PI) / 180.0;
          const phi2 = (obj.lat * Math.PI) / 180.0;
          const lam2 = (obj.lon * Math.PI) / 180.0;

          const x1 = r1 * Math.cos(phi1) * Math.cos(lam1);
          const y1 = r1 * Math.cos(phi1) * Math.sin(lam1);
          const z1 = r1 * Math.sin(phi1);

          const x2 = r2 * Math.cos(phi2) * Math.cos(lam2);
          const y2 = r2 * Math.cos(phi2) * Math.sin(lam2);
          const z2 = r2 * Math.sin(phi2);

          const distanceKm = Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2 + (z1 - z2) ** 2);

          if (distanceKm <= thresholdKm) {
            const isCritical = distanceKm <= 5.0;
            const alert = {
              id: `conj-${sat.id}-${obj.id}`,
              level: isCritical ? 'CRITICAL_CONJUNCTION' : 'WARNING_PROXIMITY',
              primarySat: sat.name || sat.id,
              secondaryObject: obj.name || obj.id,
              missDistanceKm: Math.round(distanceKm * 100) / 100,
              altitudeKm: Math.round(sat.altKm),
              timestamp: Date.now(),
              advisory: isCritical
                ? `Critical close approach (${distanceKm.toFixed(2)} km). Recommend immediate collision avoidance burn.`
                : `Orbital crossing within warning bubble (${distanceKm.toFixed(2)} km). Increase radar tracking cadence.`
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
