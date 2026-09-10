// gods-eye-view/src/modules/cartridges.test.mjs
import assert from 'node:assert/strict';
import { cartridgeRegistry, CARTRIDGE_IDS } from './cartridgeRegistry.js';
import { createSentinelMeshCartridge } from './sentinelMeshCartridge.js';

console.log('🧪 Testing Aetheris Enterprise Cartridge Architecture...\n');

// 1. Test Registry Initialization
{
  const listEmpty = cartridgeRegistry.list();
  assert.equal(listEmpty.length, 0, 'Registry starts empty');

  // Register SentinelMesh
  const sentinel = createSentinelMeshCartridge();
  cartridgeRegistry.register(sentinel);

  const listAfter = cartridgeRegistry.list();
  assert.equal(listAfter.length, 1);
  assert.equal(listAfter[0].id, CARTRIDGE_IDS.SENTINEL_MESH);
  console.log(`✓ Cartridge registered successfully: ${listAfter[0].title}`);
}

// 2. Test Activation & Deactivation Lifecycle
{
  let layerToggled = false;
  const mockContext = {
    layerManager: {
      setSubmarineCablesActive(val) {
        layerToggled = val;
      }
    }
  };

  const active = cartridgeRegistry.activate(CARTRIDGE_IDS.SENTINEL_MESH, mockContext);
  assert.equal(active.id, CARTRIDGE_IDS.SENTINEL_MESH);
  assert.equal(layerToggled, true, 'Layer activation callback should fire');
  assert.equal(cartridgeRegistry.getActiveCartridge().id, CARTRIDGE_IDS.SENTINEL_MESH);
  console.log('✓ Cartridge activation lifecycle executed');

  cartridgeRegistry.deactivate(mockContext);
  assert.equal(cartridgeRegistry.getActiveCartridge(), null);
  console.log('✓ Cartridge deactivation lifecycle executed');
}

// 3. Test SentinelMesh Threat Evaluation
{
  const sentinel = createSentinelMeshCartridge();
  
  const sampleCables = [
    { id: 'cable-atlantic-1', name: 'Atlantic Cross-Fiber', midLat: 40.71, midLon: -73.99 }
  ];

  const safeVessels = [
    { mmsi: '999111', name: 'Safe Cargo', lat: 40.71, lon: -73.99, speedKnots: 14.0, durationMins: 10 }
  ];
  const safeAlerts = sentinel.evaluateAlerts(safeVessels, sampleCables);
  assert.equal(safeAlerts.length, 0, 'Fast vessel should not trigger loitering alert');

  const threatVessels = [
    { mmsi: '888222', name: 'Suspicious Drifter', lat: 40.7105, lon: -73.9905, speedKnots: 1.1, durationMins: 75 }
  ];
  const threatAlerts = sentinel.evaluateAlerts(threatVessels, sampleCables);
  assert.equal(threatAlerts.length, 1, 'Stationary vessel within cable bounds should trigger alert');
  assert.equal(threatAlerts[0].level, 'CRITICAL');
  assert.ok(threatAlerts[0].advisory.includes('loitering'));
  console.log(`✓ SentinelMesh Threat Alert verified: ${threatAlerts[0].level} - ${threatAlerts[0].advisory}`);
}

console.log('\n🎉 ALL ENTERPRISE CARTRIDGE TESTS PASSED!');
