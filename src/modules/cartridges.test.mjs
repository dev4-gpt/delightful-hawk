// gods-eye-view/src/modules/cartridges.test.mjs
import assert from 'node:assert/strict';
import { cartridgeRegistry, CARTRIDGE_IDS } from './cartridgeRegistry.js';
import { createSentinelMeshCartridge } from './sentinelMeshCartridge.js';
import { createOrbitalOpsCartridge } from './orbitalOpsCartridge.js';
import { createGridTwinCartridge } from './gridTwinCartridge.js';
import { createGeoRiskCartridge } from './geoRiskCartridge.js';

console.log('🧪 Testing Aetheris Enterprise Cartridge Architecture...\n');

// 1. Test Registry Initialization with all 4 Cartridges
{
  const sentinel = createSentinelMeshCartridge();
  const orbital = createOrbitalOpsCartridge();
  const grid = createGridTwinCartridge();
  const geo = createGeoRiskCartridge();

  cartridgeRegistry.register(sentinel);
  cartridgeRegistry.register(orbital);
  cartridgeRegistry.register(grid);
  cartridgeRegistry.register(geo);

  const listAfter = cartridgeRegistry.list();
  assert.equal(listAfter.length, 4, 'All 4 enterprise cartridges should be registered');
  console.log(`✓ Cartridges registered successfully (${listAfter.length} cartridges):`);
  listAfter.forEach(c => console.log(`   - [${c.category}] ${c.title}`));
}

// 2. Test Activation & Deactivation Lifecycle
{
  let subseaActive = false;
  let satsActive = false;
  const mockContext = {
    layerManager: {
      setSubmarineCablesActive(val) { subseaActive = val; },
      setSatellitesActive(val) { satsActive = val; }
    }
  };

  const active = cartridgeRegistry.activate(CARTRIDGE_IDS.SENTINEL_MESH, mockContext);
  assert.equal(active.id, CARTRIDGE_IDS.SENTINEL_MESH);
  assert.equal(subseaActive, true, 'Subsea layer activation should trigger');
  console.log('✓ SentinelMesh activation lifecycle executed');

  // Switch to OrbitalOps
  const activeOrbital = cartridgeRegistry.activate(CARTRIDGE_IDS.ORBITAL_OPS, mockContext);
  assert.equal(activeOrbital.id, CARTRIDGE_IDS.ORBITAL_OPS);
  assert.equal(satsActive, true, 'Satellites layer activation should trigger');
  console.log('✓ Cartridge switch to OrbitalOps executed cleanly');

  cartridgeRegistry.deactivate(mockContext);
  assert.equal(cartridgeRegistry.getActiveCartridge(), null);
  console.log('✓ Cartridge deactivation lifecycle executed');
}

// 3. Test SentinelMesh Threat Evaluation
{
  const sentinel = createSentinelMeshCartridge();
  const sampleCables = [{ id: 'cable-atlantic-1', name: 'Atlantic Cross-Fiber', midLat: 40.71, midLon: -73.99 }];
  const threatVessels = [{ mmsi: '888222', name: 'Suspicious Drifter', lat: 40.7105, lon: -73.9905, speedKnots: 1.1, durationMins: 75 }];
  const threatAlerts = sentinel.evaluateAlerts(threatVessels, sampleCables);
  assert.equal(threatAlerts.length, 1);
  assert.equal(threatAlerts[0].level, 'CRITICAL');
  console.log(`✓ SentinelMesh Threat Alert verified: ${threatAlerts[0].level} - ${threatAlerts[0].advisory}`);
}

// 4. Test OrbitalOps Conjunction Assessment
{
  const orbital = createOrbitalOpsCartridge();
  const sats = [{ id: 'ISS', name: 'International Space Station', lat: 28.5, lon: -80.5, altKm: 420.0 }];
  const debris = [{ id: 'DEBRIS-88', name: 'Cosmos 1408 Fragment', lat: 28.51, lon: -80.51, altKm: 421.5 }];
  const alerts = orbital.evaluateAlerts(sats, debris, 15.0);
  assert.equal(alerts.length, 1, 'Should detect close orbital conjunction');
  assert.equal(alerts[0].level, 'CRITICAL_CONJUNCTION');
  console.log(`✓ OrbitalOps Conjunction Alert verified: ${alerts[0].primarySat} vs ${alerts[0].secondaryObject} (${alerts[0].missDistanceKm} km miss)`);
}

// 5. Test GridTwin Datacenter Thermal Load Overload
{
  const grid = createGridTwinCartridge();
  const clusters = [{
    id: 'dc-ashburn-1',
    name: 'Northern Virginia AI Mega-Cluster',
    substationName: 'Loudoun 500kV Substation',
    substationCapacityMw: 300.0,
    drawMw: 275.0
  }];
  const alerts = grid.evaluateAlerts(clusters, 41.5); // High heat dome
  assert.equal(alerts.length, 1, 'Should detect heat-derated substation overload');
  assert.equal(alerts[0].level, 'CRITICAL_OVERLOAD');
  console.log(`✓ GridTwin Alert verified: ${alerts[0].datacenterName} on ${alerts[0].substationName} (${alerts[0].loadPercent}% effective load)`);
}

// 6. Test GeoRisk Wildfire Asset Proximity
{
  const geo = createGeoRiskCartridge();
  const fires = [{ id: 'fire-cal-1', lat: 34.20, lon: -118.50, frp: 150.0 }];
  const assets = [{ id: 'grid-sub-1', name: 'Porter Ranch Substation', lat: 34.21, lon: -118.51, type: 'Power Substation' }];
  const alerts = geo.evaluateAlerts(fires, assets, 5000);
  assert.equal(alerts.length, 1, 'Should detect wildfire front encroaching on facility');
  assert.equal(alerts[0].level, 'CRITICAL_ENCROACHMENT');
  console.log(`✓ GeoRisk Alert verified: Fire encroaching on ${alerts[0].facilityName} (${alerts[0].distanceMeters}m away)`);
}

console.log('\n🎉 ALL ENTERPRISE CARTRIDGE TESTS PASSED!');
