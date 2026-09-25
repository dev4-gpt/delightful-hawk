import test from 'node:test';
import assert from 'node:assert/strict';
import {
  get10mBoundingBox,
  generate64DEmbedding,
  scoreLandParcel,
  analyzeAgCropStress,
  detectUnmappedFrontierAnomaly,
  createAlphaEarthCartridge
} from './alphaEarthCartridge.js';

test('AlphaEarth: 10m bounding box calculation and grid quantization', () => {
  const lat = 30.2747;
  const lon = -97.7404;
  const bbox = get10mBoundingBox(lat, lon);

  assert.ok(bbox.north > bbox.south, 'North must be greater than South');
  assert.ok(bbox.east > bbox.west, 'East must be greater than West');
  assert.ok(bbox.centerLat >= bbox.south && bbox.centerLat <= bbox.north);
  assert.ok(bbox.centerLon >= bbox.west && bbox.centerLon <= bbox.east);

  const latDeltaDeg = bbox.north - bbox.south;
  const latDeltaM = latDeltaDeg * 111320.0;
  assert.ok(Math.abs(latDeltaM - 10.0) < 0.05, `Latitude delta should be ~10m, got ${latDeltaM}m`);
  assert.match(bbox.gridId, /^AE-10M-/);
});

test('AlphaEarth: 64-dimensional multimodal latent embedding synthesis', () => {
  const emb1 = generate64DEmbedding(30.2747, -97.7404);
  const emb2 = generate64DEmbedding(30.2747, -97.7404);
  const embDifferent = generate64DEmbedding(35.6585, 139.7454);

  assert.equal(emb1.length, 64, 'Must produce 64-D embedding');
  assert.deepEqual(Array.from(emb1), Array.from(emb2), 'Deterministic reproduction for same coordinates');
  assert.notDeepEqual(Array.from(emb1), Array.from(embDifferent), 'Different coordinates yield distinct embeddings');

  for (let i = 0; i < 64; i++) {
    assert.ok(emb1[i] >= -1.0 && emb1[i] <= 1.0, `Embedding element ${i} out of bounds: ${emb1[i]}`);
  }
});

test('AlphaEarth: Pre-acquisition land risk due diligence scoring (Capability 1)', () => {
  const score = scoreLandParcel(30.2747, -97.7404, 'Austin Downtown Core');

  assert.equal(score.label, 'Austin Downtown Core');
  assert.ok(score.floodRiskScore >= 1 && score.floodRiskScore <= 99, `Flood risk valid range: ${score.floodRiskScore}`);
  assert.ok(score.wildfireRiskScore >= 1 && score.wildfireRiskScore <= 99, `Wildfire risk valid range: ${score.wildfireRiskScore}`);
  assert.ok(score.soilHealthIndex >= 5 && score.soilHealthIndex <= 100, `Soil health valid range: ${score.soilHealthIndex}`);
  assert.match(score.compositeGrade, /^(AAA|AA|A|BBB|BB|B|CCC|D)$/, `Valid grade: ${score.compositeGrade}`);
  assert.ok(score.valuationAdvisory.length > 10, 'Must provide actionable valuation advisory');
  assert.equal(score.dataResolution, '10x10m Multimodal Ground Truth');
});

test('AlphaEarth: Cloud-penetrating agricultural crop stress via SAR (Capability 2)', () => {
  const stress = analyzeAgCropStress(36.7468, -119.7726, 'California Almonds');

  assert.equal(stress.cropType, 'California Almonds');
  assert.ok(stress.rootZoneMoistureIndex >= 5 && stress.rootZoneMoistureIndex <= 100);
  assert.ok(stress.opticalLeadDays >= 10, `Optical lead days should be >10 days, got ${stress.opticalLeadDays}`);
  assert.match(stress.stressLevel, /^(NOMINAL|MODERATE_STRESS|CRITICAL_DROUGHT)$/);
  assert.ok(stress.cloudPenetration.includes('Radar'));
});

test('AlphaEarth: Unmapped frontier monitoring in Amazon & Antarctica (Capability 3)', () => {
  const amazon = detectUnmappedFrontierAnomaly(-4.2150, -55.9820, 'Amazon Tapajós Basin');
  assert.equal(amazon.biome, 'Amazon Tapajós Basin');
  assert.match(amazon.eventType, /^(STABLE_CANOPY|ILLEGAL_LOGGING_ROAD)$/);
  assert.ok(amazon.latentCosineDistance >= 0 && amazon.latentCosineDistance <= 1.0);

  const antarctica = detectUnmappedFrontierAnomaly(-75.1667, -100.0000, 'Pine Island Ice Shelf');
  assert.match(antarctica.eventType, /^(STABLE_CANOPY|SUB_SURFACE_ICE_RIFT)$/);
});

test('AlphaEarth: Cartridge lifecycle and threat evaluation', () => {
  const cartridge = createAlphaEarthCartridge();
  assert.equal(cartridge.id, 'alpha-earth');

  const alerts = cartridge.evaluateAlerts([
    { lat: 30.1785, lon: -97.7554, label: 'Austin Flood Plain' }
  ]);
  assert.ok(Array.isArray(alerts));
});
