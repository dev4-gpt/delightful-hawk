/**
 * Unit tests for SentinelWatchstander & Threat Correlation Engine
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { SentinelWatchstander } from './sitrepEngine.js';

test('SentinelWatchstander: initializes with baseline DEFCON and telemetry counters', () => {
  const sentinel = new SentinelWatchstander();
  assert.strictEqual(sentinel.defconLevel, 3);
  assert.strictEqual(sentinel.threatIndex, 42);
  assert.ok(sentinel.telemetryState.flightsCount > 1000);
});

test('SentinelWatchstander: updates telemetry and computes dynamic threat matrix', () => {
  const sentinel = new SentinelWatchstander();

  // Test updating telemetry with active military flights and fire hotspots
  sentinel.updateTelemetry('military', new Array(15).fill({ callsign: 'VIPER11' }));
  sentinel.updateTelemetry('firms', new Array(35).fill({ brightness: 340 }));

  const assessment = sentinel.evaluateThreatMatrix();
  assert.ok(assessment.activeThreats.length >= 3);
  assert.ok(assessment.threatIndex >= 50);
  assert.strictEqual(assessment.defcon, 2); // Level 2 for index 60-79
  assert.ok(assessment.threatLevel.includes('FAST PACE') || assessment.threatLevel.includes('HIGH'));
});

test('SentinelWatchstander: generates structured text and spoken SITREP', () => {
  const sentinel = new SentinelWatchstander();
  const sitrep = sentinel.generateSitrep();

  assert.ok(sitrep.reportText.includes('[SITREP // DEFCON'));
  assert.ok(sitrep.reportText.includes('THREAT LEVEL:'));
  assert.ok(sitrep.spokenText.includes('Situation report:'));
  assert.ok(sitrep.activeThreats.length > 0);
});
