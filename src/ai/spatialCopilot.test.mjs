/**
 * Unit tests for Aetheris SpatialCopilot Engine
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SpatialCopilot,
  STRATEGIC_TARGETS,
  calculateHaversineDistanceKm,
  calculateBearingDeg
} from './spatialCopilot.js';

test('SpatialCopilot: Haversine distance & bearing calculations', () => {
  // Austin, TX (30.2672, -97.7431) to Cape Canaveral, FL (28.5623, -80.5774)
  const dist = calculateHaversineDistanceKm(30.2672, -97.7431, 28.5623, -80.5774);
  assert.ok(dist > 1600 && dist < 1700, `Expected distance ~1650 km, got ${dist}`);

  const bearing = calculateBearingDeg(30.2672, -97.7431, 28.5623, -80.5774);
  assert.ok(bearing > 90 && bearing < 120, `Expected bearing ~100°, got ${bearing}`);
});

test('SpatialCopilot: parseIntent maps camera targets correctly', () => {
  const copilot = new SpatialCopilot();

  const intentTokyo = copilot.parseIntent('Fly camera to Tokyo Shibuya');
  assert.strictEqual(intentTokyo.type, 'FLY_TO_TARGET');
  assert.strictEqual(intentTokyo.targetKey, 'shibuya');

  const intentCape = copilot.parseIntent('Take me to Cape Canaveral for launch tracking');
  assert.strictEqual(intentCape.type, 'FLY_TO_TARGET');
  assert.strictEqual(intentCape.targetKey, 'cape canaveral');

  const intentTaiwan = copilot.parseIntent('Inspect Taiwan Strait naval corridor');
  assert.strictEqual(intentTaiwan.type, 'FLY_TO_TARGET');
  assert.strictEqual(intentTaiwan.targetKey, 'taiwan');
});

test('SpatialCopilot: parseIntent extracts geofence perimeters with radii', () => {
  const copilot = new SpatialCopilot();

  const intent = copilot.parseIntent('Deploy 75km tactical geofence around Austin');
  assert.strictEqual(intent.type, 'DRAW_GEOFENCE');
  assert.strictEqual(intent.radiusKm, 75);
  assert.strictEqual(intent.targetKey, 'austin');

  const intentDefault = copilot.parseIntent('Create exclusion perimeter');
  assert.strictEqual(intentDefault.type, 'DRAW_GEOFENCE');
  assert.strictEqual(intentDefault.radiusKm, 50);
});

test('SpatialCopilot: parseIntent extracts distance measurement between two targets', () => {
  const copilot = new SpatialCopilot();

  const intent = copilot.parseIntent('Measure distance from New York to London');
  assert.strictEqual(intent.type, 'MEASURE_DISTANCE');
  assert.strictEqual(intent.from.key, 'new york');
  assert.strictEqual(intent.to.key, 'london');
});

test('SpatialCopilot: parseIntent detects vision post-processing styles', () => {
  const copilot = new SpatialCopilot();

  assert.strictEqual(copilot.parseIntent('Switch to thermal vision mode').style, 'thermal');
  assert.strictEqual(copilot.parseIntent('Engage surveillance night vision').style, 'surveillance');
  assert.strictEqual(copilot.parseIntent('Set style to noir').style, 'noir');
});

test('SpatialCopilot: parseIntent toggles sensor layers', () => {
  const copilot = new SpatialCopilot();

  const flightsOn = copilot.parseIntent('Show all civilian flights');
  assert.strictEqual(flightsOn.type, 'TOGGLE_LAYER');
  assert.strictEqual(flightsOn.layerId, 'flights');
  assert.strictEqual(flightsOn.state, true);

  const satellitesOff = copilot.parseIntent('Turn off satellites layer');
  assert.strictEqual(satellitesOff.type, 'TOGGLE_LAYER');
  assert.strictEqual(satellitesOff.layerId, 'satellites');
  assert.strictEqual(satellitesOff.state, false);
});

test('SpatialCopilot: executeIntent executes geofence deployment & clear', async () => {
  const copilot = new SpatialCopilot();

  const geofenceIntent = copilot.parseIntent('Draw 50km geofence around Austin');
  const geoResult = await copilot.executeIntent(geofenceIntent);

  assert.strictEqual(geoResult.status, 'success');
  assert.strictEqual(geoResult.action, 'DRAW_GEOFENCE');
  assert.strictEqual(copilot.activePerimeters.length, 1);
  assert.strictEqual(copilot.activePerimeters[0].radiusKm, 50);

  const clearResult = await copilot.executeIntent({ type: 'CLEAR_OVERLAYS' });
  assert.strictEqual(clearResult.status, 'success');
  assert.strictEqual(copilot.activePerimeters.length, 0);
});

test('SpatialCopilot: executeIntent executes geodesic measurement with Mach 1 time', async () => {
  const copilot = new SpatialCopilot();

  const measureIntent = {
    type: 'MEASURE_DISTANCE',
    from: STRATEGIC_TARGETS['nyc'],
    to: STRATEGIC_TARGETS['london']
  };

  const res = await copilot.executeIntent(measureIntent);
  assert.strictEqual(res.status, 'success');
  assert.strictEqual(res.action, 'MEASURE_DISTANCE');
  assert.ok(res.distanceKm > 5500 && res.distanceKm < 5650);
  assert.ok(res.mach1TransitMin > 260 && res.mach1TransitMin < 280);
});

test('SpatialCopilot: executeIntent synthesizes executive SITREP report', async () => {
  const copilot = new SpatialCopilot();

  const sitrepIntent = copilot.parseIntent('Generate tactical situation report');
  assert.strictEqual(sitrepIntent.type, 'SITREP');

  const res = await copilot.executeIntent(sitrepIntent);
  assert.strictEqual(res.status, 'success');
  assert.strictEqual(res.action, 'SITREP');
  assert.strictEqual(res.sitrep.defcon, 3);
  assert.ok(res.message.includes('DEFCON 3'));
});
