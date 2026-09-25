import test from 'node:test';
import assert from 'node:assert/strict';
import { SPLAT_SITES } from './gaussianSplatLayer.js';

test('GaussianSplatLayer: verifies strategic site ground anchors and palettes', () => {
  const sites = Object.keys(SPLAT_SITES);
  assert.ok(sites.length >= 4, 'Must register at least 4 strategic volumetric sites');

  // Verify Austin Capitol site
  const capitol = SPLAT_SITES['austin-capitol'];
  assert.ok(capitol, 'Austin Capitol site must exist');
  assert.equal(capitol.groundAlt, 158.0, 'Ground elevation offset must match Austin elevation');
  assert.ok(capitol.pointCount >= 1000, 'Point count must be >= 1000 for dense volumetric ground truth');
  assert.ok(capitol.palette.length >= 3, 'Must have diverse color palette for radiance field');

  // Verify Shibuya Crossing site
  const shibuya = SPLAT_SITES['shibuya-crossing'];
  assert.ok(shibuya, 'Shibuya site must exist');
  assert.equal(shibuya.lat, 35.6595);

  // Verify WTC Plaza site
  const wtc = SPLAT_SITES['nyc-wtc'];
  assert.ok(wtc, 'WTC site must exist');
  assert.equal(wtc.lat, 40.7127);
});
