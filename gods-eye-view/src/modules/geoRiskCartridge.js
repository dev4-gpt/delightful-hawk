// gods-eye-view/src/modules/geoRiskCartridge.js
/**
 * GeoRisk Domain Cartridge:
 * Wildfire FIRMS & Critical Asset Proximity Watchstander
 */

import { CARTRIDGE_IDS } from './cartridgeRegistry.js';

export function createGeoRiskCartridge(options = {}) {
  const activeAlerts = new Map();

  return {
    id: CARTRIDGE_IDS.GEO_RISK,
    title: 'GeoRisk: Wildfire & Asset Proximity Defense',
    category: 'Disaster Response & Environmental Intelligence',
    description: 'Correlates NASA VIIRS thermal fire pixels with critical facilities and viewshed cameras to compute real-time evacuation zones.',

    onActivate(context) {
      if (context.layerManager && typeof context.layerManager.setFirmsActive === 'function') {
        context.layerManager.setFirmsActive(true);
      }
    },

    onDeactivate(context) {
      activeAlerts.clear();
      if (context.layerManager && typeof context.layerManager.setFirmsActive === 'function') {
        context.layerManager.setFirmsActive(false);
      }
    },

    /**
     * Evaluates distance between active fire hotspots and critical facilities
     * @param {Array<object>} fireHotspots
     * @param {Array<object>} facilities
     * @param {number} warningBufferMeters (default 5000)
     */
    evaluateAlerts(fireHotspots = [], facilities = [], warningBufferMeters = 5000) {
      const results = [];

      for (const fire of fireHotspots) {
        // High confidence filter (e.g. FRP > 10 MW or confidence === 'high')
        const frp = fire.frp || 0.0;

        for (const facility of facilities) {
          const distM = approximateDistanceM(fire.lat, fire.lon, facility.lat, facility.lon);

          if (distM <= warningBufferMeters) {
            const isCritical = distM <= 2000;
            const alert = {
              id: `wildfire-${facility.id}-${fire.id}`,
              level: isCritical ? 'CRITICAL_ENCROACHMENT' : 'WARNING_PROXIMITY',
              facilityName: facility.name,
              facilityType: facility.type || 'Infrastructure',
              distanceMeters: Math.round(distM),
              fireRadiativePowerMw: Math.round(frp * 10) / 10,
              timestamp: Date.now(),
              advisory: isCritical
                ? `Active firefront within ${Math.round(distM)}m of ${facility.name}. Issue immediate evacuation advisory and task viewshed cameras.`
                : `Thermal anomaly detected ${Math.round(distM / 1000)}km from ${facility.name}. Dispatch suppression drone reconnaissance.`
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
