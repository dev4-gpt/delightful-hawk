// gods-eye-view/src/modules/gridTwinCartridge.js
/**
 * GridTwin Domain Cartridge:
 * AI Datacenter & Power Grid Thermal Resilience Watchstander
 */

import { CARTRIDGE_IDS } from './cartridgeRegistry.js';

export function createGridTwinCartridge(options = {}) {
  const activeAlerts = new Map();

  return {
    id: CARTRIDGE_IDS.GRID_TWIN,
    title: 'GridTwin: Datacenter & Power Grid Resilience',
    category: 'Critical Infrastructure & Energy Security',
    description: 'Autonomous watchstander correlating AI compute cluster load with ambient temperature spikes to prevent substation cascading failures.',

    onActivate(context) {
      if (context.layerManager && typeof context.layerManager.setPowerGridActive === 'function') {
        context.layerManager.setPowerGridActive(true);
      }
    },

    onDeactivate(context) {
      activeAlerts.clear();
      if (context.layerManager && typeof context.layerManager.setPowerGridActive === 'function') {
        context.layerManager.setPowerGridActive(false);
      }
    },

    /**
     * Evaluates datacenter cluster power consumption against substation rated capacity and heat
     * @param {Array<object>} clusters
     * @param {number} ambientTempC
     */
    evaluateAlerts(clusters = [], ambientTempC = 25.0) {
      const results = [];

      for (const cluster of clusters) {
        const capacity = cluster.substationCapacityMw || 100.0;
        const draw = cluster.drawMw || 0.0;
        const loadPct = (draw / capacity) * 100.0;

        // Thermal derating: for every degree above 35°C, effective capacity decreases by 1.2%
        const heatPenaltyPct = Math.max(0, (ambientTempC - 35.0) * 1.2);
        const effectiveCapacityMw = capacity * (1.0 - heatPenaltyPct / 100.0);
        const effectiveLoadPct = (draw / effectiveCapacityMw) * 100.0;

        if (effectiveLoadPct >= 80.0) {
          const isCritical = effectiveLoadPct >= 95.0 || (effectiveLoadPct >= 88.0 && ambientTempC >= 40.0);
          const alert = {
            id: `grid-${cluster.id}`,
            level: isCritical ? 'CRITICAL_OVERLOAD' : 'WARNING_HIGH_LOAD',
            datacenterName: cluster.name,
            substationName: cluster.substationName,
            drawMw: draw,
            effectiveCapacityMw: Math.round(effectiveCapacityMw * 10) / 10,
            loadPercent: Math.round(effectiveLoadPct * 10) / 10,
            ambientTempC: ambientTempC,
            timestamp: Date.now(),
            advisory: isCritical
              ? `Substation ${cluster.substationName} exceeding derated thermal ceiling (${Math.round(effectiveLoadPct)}%). Initiate compute load shedding / battery BESS backup.`
              : `High load under ambient heat stress (${Math.round(effectiveLoadPct)}%). Monitor transformer cooling telemetry.`
          };
          results.push(alert);
          activeAlerts.set(alert.id, alert);
        }
      }

      return results;
    },

    getActiveAlerts() {
      return Array.from(activeAlerts.values());
    }
  };
}
