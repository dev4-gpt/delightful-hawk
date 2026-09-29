import test from 'node:test';
import assert from 'node:assert/strict';
import { getSouthCity2Buildings } from './southCity2Buildings.js';

test('southCity2Buildings: generates high-density residential fabric and condominium towers', () => {
  const buildings = getSouthCity2Buildings();
  assert.ok(buildings.length >= 250, `Expected >= 250 residential buildings, got ${buildings.length}`);

  // Fresco towers verification
  const fresco = buildings.filter(b => b.name.includes('Unitech Fresco'));
  assert.ok(fresco.length >= 16, `Expected >= 16 Unitech Fresco towers, got ${fresco.length}`);
  for (const f of fresco) {
    assert.equal(f.groundAlt, 222, 'AMSL ground altitude must be 222m');
    assert.equal(f.h, 68, 'High-rise tower height must be 68m');
  }

  // Arcadia commercial verification
  const arcadia = buildings.find(b => b.name.includes('Arcadia Central Retail Galleria'));
  assert.ok(arcadia, 'Arcadia Galleria must exist');
  assert.equal(arcadia.groundAlt, 222);

  // Block F villas verification
  const blockF = buildings.filter(b => b.name.includes('Villa F-'));
  assert.ok(blockF.length >= 40, `Expected >= 40 Block F residential villas, got ${blockF.length}`);

  // Block C & D builder floors verification
  const blockCD = buildings.filter(b => b.name.includes('Block C-') || b.name.includes('Block D-'));
  assert.ok(blockCD.length >= 40, `Expected >= 40 Block C/D builder floors, got ${blockCD.length}`);

  // Nirvana Country verification
  const nirvana = buildings.filter(b => b.name.includes('Nirvana Country'));
  assert.ok(nirvana.length >= 30, `Expected >= 30 Nirvana Country villas, got ${nirvana.length}`);

  // Coordinate and metric bounds sanity check
  for (const b of buildings) {
    assert.ok(Number.isFinite(b.lon) && b.lon > 77.045 && b.lon < 77.070, `Invalid lon: ${b.lon}`);
    assert.ok(Number.isFinite(b.lat) && b.lat > 28.405 && b.lat < 28.425, `Invalid lat: ${b.lat}`);
    assert.ok(b.w > 0 && b.d > 0 && b.h > 0, `Invalid dimensions: ${b.name}`);
    assert.equal(b.groundAlt, 222, `Invalid groundAlt for ${b.name}`);
    assert.ok(b.roofMumty === true, `Expected roofMumty for ${b.name}`);
  }
});
