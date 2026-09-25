/**
 * Unit tests for Google 3D Mesh Coverage Classifier
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { detectCoverageKind, METRO_3D_MESH_ZONES } from './meshCoverage.js';

test('meshCoverage: detects verified 3D photogrammetric mesh metropolitan zones', () => {
  // Tokyo Shibuya (35.6595, 139.7005)
  const tokyo = detectCoverageKind(35.6595, 139.7005);
  assert.strictEqual(tokyo.is3DMesh, true);
  assert.strictEqual(tokyo.kind, '3D_PHOTOGRAMMETRIC_MESH');
  assert.strictEqual(tokyo.zoneName, 'Tokyo Metropolis');
  assert.strictEqual(tokyo.color, '#00f0ff');
  assert.ok(tokyo.badgeText.includes('TOKYO'));

  // New York Manhattan (40.7580, -73.9855)
  const nyc = detectCoverageKind(40.7580, -73.9855);
  assert.strictEqual(nyc.is3DMesh, true);
  assert.strictEqual(nyc.zoneName, 'New York Metro');

  // San Francisco (37.7749, -122.4194)
  const sf = detectCoverageKind(37.7749, -122.4194);
  assert.strictEqual(sf.is3DMesh, true);
  assert.strictEqual(sf.zoneName, 'San Francisco Bay Area');

  // London (51.5074, -0.1278)
  const london = detectCoverageKind(51.5074, -0.1278);
  assert.strictEqual(london.is3DMesh, true);
  assert.strictEqual(london.zoneName, 'Greater London');

  // Paris (48.8566, 2.3522)
  const paris = detectCoverageKind(48.8566, 2.3522);
  assert.strictEqual(paris.is3DMesh, true);
  assert.strictEqual(paris.zoneName, 'Paris Île-de-France');
});

test('meshCoverage: classifies non-mesh areas as 3D Elevation + Satellite Orthophoto', () => {
  // Gurgaon South City 2, India (28.4176, 77.0528)
  const gurgaon = detectCoverageKind(28.4176, 77.0528);
  assert.strictEqual(gurgaon.is3DMesh, false);
  assert.strictEqual(gurgaon.kind, '3D_ELEVATION_TERRAIN_ORTHO');
  assert.strictEqual(gurgaon.zoneName, null);
  assert.strictEqual(gurgaon.color, '#fbbf24');
  assert.strictEqual(gurgaon.badgeText, 'TERRAIN: 3D ELEVATION + SATELLITE');

  // Open ocean / null
  const invalid = detectCoverageKind(NaN, null);
  assert.strictEqual(invalid.is3DMesh, false);
  assert.strictEqual(invalid.kind, '3D_ELEVATION_TERRAIN_ORTHO');
});
