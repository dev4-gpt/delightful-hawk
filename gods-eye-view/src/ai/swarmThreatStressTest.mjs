/**
 * Operational Swarm Threat Ingestion & Sentinel Correlation Test
 * 
 * Tests Aetheris Sentinel Watchstander against multi-agent adversarial
 * swarm scenarios generated via MiroFish simulation:
 * 1. Coordinated AIS Maritime Anchor-Drag Swarm over Subsea Fiber Landings
 * 2. Multi-UAV Grid Ingress near Critical 500kV Substations & Data Center Alley
 * 3. Cross-Domain Threat Correlation & Automated DEFCON 1 Escalation
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { SentinelWatchstander } from './sitrepEngine.js';

test('SentinelWatchstander: Ingests Coordinated Maritime Swarm and escalates to DEFCON 2', () => {
  const sentinel = new SentinelWatchstander();
  
  // Set nominal peacetime baseline
  sentinel.telemetryState.militaryFlightsCount = 2;
  sentinel.telemetryState.firesHotspotsCount = 3;
  const baseline = sentinel.evaluateThreatMatrix();
  assert.strictEqual(baseline.defcon, 4); // Index: 15 baseline + 15 maritime = 30 -> DEFCON 4

  // Ingest MiroFish Maritime Swarm Vector (Coordinated anchor drag over TAT-14)
  const maritimeSwarm = [
    {
      domain: 'MARITIME SWARM',
      severity: 'CRITICAL',
      code: 'SUBSEA_CABLE_ANCHOR_DRAG_LOITERING',
      threatWeight: 35,
      description: '4 AIS vessels (MMSI 211832000, 219018000, 244710000, 257038000) loitering at 0.3 knots directly atop TAT-14 subsea fiber cable segment 4.',
      recommendation: 'Alert US Coast Guard Sector New York and scramble maritime interdiction cutter.'
    }
  ];

  const assessment = sentinel.ingestSwarmTelemetry(maritimeSwarm);
  assert.ok(assessment.threatIndex >= 60, `Threat index was ${assessment.threatIndex}, expected >= 60`);
  assert.strictEqual(assessment.defcon, 2, 'Should escalate to DEFCON 2 (FAST PACE)');
  assert.ok(assessment.threatLevel.includes('FAST PACE'));
  assert.ok(assessment.activeThreats.some(t => t.code === 'SUBSEA_CABLE_ANCHOR_DRAG_LOITERING'));
});

test('SentinelWatchstander: Cross-domain multi-swarm correlation escalates to DEFCON 1 (COCKED PISTOL)', () => {
  const sentinel = new SentinelWatchstander();

  // Elevate underlying sensors (military air activity + wildfire thermal line)
  sentinel.updateTelemetry('military', new Array(18).fill({ type: 'fighter' }));
  sentinel.updateTelemetry('firms', new Array(25).fill({ temp: 360 }));

  // Ingest Dual Coordinated Swarms (Energy grid drone swarm + Subsea sabotage swarm)
  const multiDomainSwarm = [
    {
      domain: 'MARITIME SWARM',
      severity: 'CRITICAL',
      code: 'SUBSEA_CABLE_SABOTAGE_CLUSTER',
      threatWeight: 30,
      description: 'Coordinated commercial loitering cluster masking underwater acoustic signatures near Bude/TAT-14 cable landing.',
      recommendation: 'Engage subsea hydrophone array and deploy acoustic sonobuoys.'
    },
    {
      domain: 'UAV / GRID SWARM',
      severity: 'CRITICAL',
      code: 'UNIDENTIFIED_DRONE_GRID_INGRESS',
      threatWeight: 35,
      description: 'Swarm of 8 micro-UAVs flying in GPS-denied low-altitude formation within 1.2km of PJM 500kV Loudoun substation.',
      recommendation: 'Activate directed RF countermeasures and lock perimeter physical security.'
    }
  ];

  const assessment = sentinel.ingestSwarmTelemetry(multiDomainSwarm);
  
  // Threat index should saturate at >= 80, triggering DEFCON 1
  assert.ok(assessment.threatIndex >= 80, `Threat index was ${assessment.threatIndex}, expected >= 80`);
  assert.strictEqual(assessment.defcon, 1, 'Should escalate to DEFCON 1 (COCKED PISTOL)');
  assert.ok(assessment.threatLevel.includes('COCKED PISTOL') || assessment.threatLevel.includes('CRITICAL'));

  // Generate executive SITREP
  const sitrep = sentinel.generateSitrep();
  assert.ok(sitrep.reportText.includes('DEFCON 1'));
  assert.ok(sitrep.reportText.includes('SUBSEA_CABLE_SABOTAGE_CLUSTER'));
  assert.ok(sitrep.reportText.includes('UNIDENTIFIED_DRONE_GRID_INGRESS'));
  assert.ok(sitrep.spokenText.length > 50);

  console.log('\n--- VERIFIED SITREP GENERATION UNDER SWARM ATTACK ---');
  console.log(sitrep.reportText);
  console.log('Spoken Voiceover Dispatch:');
  console.log(sitrep.spokenText);
});
