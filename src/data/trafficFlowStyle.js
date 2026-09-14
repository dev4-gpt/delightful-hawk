/**
 * @file Pure styling helpers for live traffic flow — level → bucket/color/
 * speed/density. Cesium-free so thresholds are unit-testable; the traffic
 * layer maps buckets to Cesium colors at spawn time.
 *
 * `level` is TomTom's `traffic_level`: current speed / free-flow speed,
 * 0..1 where 1 = free flow. Non-finite input degrades to free-flow/neutral
 * everywhere — a road with unusable data must render like the simulation,
 * never as a phantom traffic jam.
 *
 * @module data/trafficFlowStyle
 */

/** @const {number} Levels at/above this render as free-flowing (green). */
const FREE_THRESHOLD = 0.85;
/** @const {number} Levels at/above this (and below FREE) render slow (amber); below is jam (red). */
const SLOW_THRESHOLD = 0.55;

/**
 * Bucket color palette as Cesium-free rgba tuples ([r, g, b] 0–255 + alpha 0–1):
 * green #2ecc71 / amber #f0b23e / red #e05252, all at 0.9 alpha.
 * @type {{free:number[], slow:number[], jam:number[]}}
 */
export const FLOW_BUCKET_RGBA = {
  free: [46, 204, 113, 0.9],
  slow: [240, 178, 62, 0.9],
  jam: [224, 82, 82, 0.9],
};

/**
 * Classify a traffic level into a congestion bucket.
 * @param {number} level - traffic_level 0..1 (1 = free flow).
 * @returns {'free'|'slow'|'jam'} Bucket name; non-finite input → 'free'.
 */
export function flowBucket(level) {
  if (!Number.isFinite(level)) return 'free';
  if (level >= FREE_THRESHOLD) return 'free';
  if (level >= SLOW_THRESHOLD) return 'slow';
  return 'jam';
}

/**
 * rgba tuple for a traffic level (bucket palette lookup).
 * @param {number} level - traffic_level 0..1.
 * @returns {number[]} [r, g, b, a] with rgb 0–255, alpha 0–1.
 */
export function flowColor(level) {
  return FLOW_BUCKET_RGBA[flowBucket(level)];
}

/**
 * Dot speed multiplier for a traffic level. Jammed roads crawl but never
 * freeze (0.15 floor keeps the layer visibly alive); free flow is unchanged.
 * @param {number} level - traffic_level 0..1.
 * @returns {number} Multiplier within [0.15, 1]; non-finite input → 1.
 */
export function flowSpeedScale(level) {
  if (!Number.isFinite(level)) return 1;
  return Math.min(1, Math.max(0.15, level));
}

/**
 * Dot density multiplier for a traffic level — congestion means more cars on
 * the road, so slower roads pack more dots: 1/max(level, 0.4), capped at 2.5.
 *
 * With `jamBoost` (the jamViz density prototype) the same curve keeps
 * climbing through deep jams — 1/max(level, 0.25), capped at 4.0 — so
 * gridlock gets visibly denser while ordinary jams barely change. The two
 * curves are identical for level ≥ 0.4.
 *
 * @param {number} level - traffic_level 0..1.
 * @param {Object}  [opts]
 * @param {boolean} [opts.jamBoost=false] - Deepen the curve below the 2.5 cap.
 * @returns {number} Multiplier within [1, 2.5] (or [1, 4] boosted); non-finite input → 1.
 */
export function flowDensityMult(level, { jamBoost = false } = {}) {
  if (!Number.isFinite(level)) return 1;
  if (jamBoost) return Math.min(4, 1 / Math.max(level, 0.25));
  return Math.min(2.5, 1 / Math.max(level, 0.4));
}

/**
 * Multi-tier congestion gradient palette (Green -> Amber -> Crimson -> Deep Blood Red).
 * Used for high-contrast geospatial traffic flow heatmaps across major metropolitan grids.
 */
export const CONGESTION_GRADIENT_RGBA = {
  emerald: [16, 185, 129, 0.95],     // Free flow (level >= 0.85) - #10b981
  chartreuse: [132, 204, 22, 0.95],  // Steady flow (0.70 <= level < 0.85) - #84cc16
  amber: [245, 158, 11, 0.95],       // Moderate slowdown (0.55 <= level < 0.70) - #f59e0b
  crimson: [239, 68, 68, 0.95],      // Heavy congestion (0.35 <= level < 0.55) - #ef4444
  deep_jam: [153, 27, 27, 0.98],     // Gridlock / severe jam (level < 0.35) - #991b1b
};

/**
 * Resolve the calibrated multi-tier congestion RGBA color grade for a traffic level.
 * @param {number} level - traffic_level 0..1 (1 = free flow).
 * @returns {number[]} [r, g, b, a]
 */
export function flowCongestionGradient(level) {
  if (!Number.isFinite(level)) return CONGESTION_GRADIENT_RGBA.emerald;
  if (level >= FREE_THRESHOLD) return CONGESTION_GRADIENT_RGBA.emerald;
  if (level >= 0.70) return CONGESTION_GRADIENT_RGBA.chartreuse;
  if (level >= SLOW_THRESHOLD) return CONGESTION_GRADIENT_RGBA.amber;
  if (level >= 0.35) return CONGESTION_GRADIENT_RGBA.crimson;
  return CONGESTION_GRADIENT_RGBA.deep_jam;
}

/**
 * Return CSS hex color string for the multi-tier congestion grade.
 * @param {number} level - traffic_level 0..1.
 * @returns {string} Hex color string (e.g. '#10b981', '#f59e0b', '#ef4444', '#991b1b')
 */
export function flowCongestionHex(level) {
  if (!Number.isFinite(level) || level >= FREE_THRESHOLD) return '#10b981';
  if (level >= 0.70) return '#84cc16';
  if (level >= SLOW_THRESHOLD) return '#f59e0b';
  if (level >= 0.35) return '#ef4444';
  return '#991b1b';
}
