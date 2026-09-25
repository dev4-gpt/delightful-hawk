import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILDINGS, LANDMARKS, TEXTURES } from './landmarks3d.js';

test('landmarks3d: verifies high-fidelity 3D PBR buildings across all major metropolitan hubs', () => {
  assert.ok(BUILDINGS.length >= 25, `Expected >= 25 high-fidelity buildings, got ${BUILDINGS.length}`);

  // 1. Austin Verification
  const austinBuildings = BUILDINGS.filter(b => b.lon > -98.0 && b.lon < -97.0 && b.lat > 30.0 && b.lat < 31.0);
  assert.ok(austinBuildings.length >= 5, `Expected >= 5 Austin buildings, got ${austinBuildings.length}`);

  const capitol = austinBuildings.find(b => b.name.includes('Capitol'));
  assert.ok(capitol, 'Texas State Capitol must exist');
  assert.equal(capitol.groundAlt, 158, 'Austin Capitol ground elevation offset must be 158m');

  const frost = austinBuildings.find(b => b.name.includes('Frost Bank'));
  assert.ok(frost, 'Frost Bank Tower must exist');
  assert.equal(frost.architecturalType, 'frost-bank');

  const jenga = austinBuildings.find(b => b.name.includes('Jenga Tower') || b.name.includes('The Independent'));
  assert.ok(jenga, 'The Independent (Jenga Tower) must exist');

  // 2. San Francisco Verification
  const sfBuildings = BUILDINGS.filter(b => b.lon > -122.5 && b.lon < -122.3 && b.lat > 37.7 && b.lat < 37.9);
  assert.ok(sfBuildings.length >= 4, `Expected >= 4 SF buildings, got ${sfBuildings.length}`);

  const salesforce = sfBuildings.find(b => b.name.includes('Salesforce'));
  assert.ok(salesforce, 'Salesforce Tower must exist');
  assert.equal(salesforce.h, 326);

  const transamerica = sfBuildings.find(b => b.name.includes('Transamerica'));
  assert.ok(transamerica, 'Transamerica Pyramid must exist');

  // 3. New York Verification
  const nycBuildings = BUILDINGS.filter(b => b.lon > -74.1 && b.lon < -73.9 && b.lat > 40.6 && b.lat < 40.85);
  assert.ok(nycBuildings.length >= 5, 'NYC buildings must exist');

  const wtc = nycBuildings.find(b => b.name.includes('One World Trade Center'));
  assert.ok(wtc, 'One World Trade Center must exist');

  const esb = nycBuildings.find(b => b.name.includes('Empire State Building'));
  assert.ok(esb, 'Empire State Building must exist');

  // 4. London, Paris, Dubai, Gurgaon Verification
  const london = BUILDINGS.find(b => b.name.includes('The Shard'));
  assert.ok(london, 'The Shard in London must exist');

  const dubai = BUILDINGS.find(b => b.name.includes('Burj Khalifa'));
  assert.ok(dubai, 'Burj Khalifa in Dubai must exist');
  assert.equal(dubai.h, 828);

  const gurgaon = BUILDINGS.find(b => b.name.includes('DLF Cyber City'));
  assert.ok(gurgaon, 'Gurgaon Cyber City must exist');
  assert.equal(gurgaon.groundAlt, 225);
});

test('landmarks3d: all buildings have valid coordinates, dimensions, and groundAlt', () => {
  for (const b of BUILDINGS) {
    assert.ok(Number.isFinite(b.lon), `Invalid lon for ${b.name}`);
    assert.ok(Number.isFinite(b.lat), `Invalid lat for ${b.name}`);
    assert.ok(b.w > 0 && b.d > 0 && b.h > 0, `Invalid dimensions for ${b.name}`);
    assert.ok(b.groundAlt !== undefined && Number.isFinite(b.groundAlt), `Missing groundAlt for ${b.name}`);
    assert.ok(b.tex, `Missing texture for ${b.name}`);
  }
});
