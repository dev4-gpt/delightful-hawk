import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ScreenplayAgent,
  CinematographerAgent,
  VoiceDirectorAgent,
  VideoDirectorAgent,
  EditorAgent,
  SwarmCoordinator
} from '../src/index.js';

test('ScreenplayAgent decomposes concept into scenes', () => {
  const agent = new ScreenplayAgent();
  const scenes = agent.decompose('A cybernetic detective searches for an encrypted drive in Neo-Tokyo');
  assert.equal(scenes.length, 2);
  assert.ok(scenes[0].slugline.includes('TOKYO'));
  assert.ok(scenes[1].dialogue.length > 0);
});

test('CinematographerAgent plans lenses and 3D camera waypoints', () => {
  const screenplay = new ScreenplayAgent();
  const dp = new CinematographerAgent();

  const scenes = screenplay.decompose('A high-speed orbital shuttle docking with a space station');
  const shots = dp.planShots(scenes);

  assert.equal(shots.length, scenes.length);
  assert.ok(shots[0].cameraSplineWaypoints.length >= 2);
  assert.ok(shots[0].lens.includes('Anamorphic') || shots[0].lens.includes('Prime'));
});

test('SwarmCoordinator orchestrates full end-to-end production', async () => {
  const coordinator = new SwarmCoordinator();
  const production = await coordinator.directProduction(
    'EXT. DESERT LAUNCHPAD - DAWN\nA massive starship prepares for launch.\nCommander: All telemetry green. Ignition in ten seconds.'
  );

  assert.equal(production.status, 'ready_for_render');
  assert.ok(production.scenes.length >= 1);
  assert.ok(production.shotPlans.length >= 1);
  assert.ok(production.vocalJobs.length >= 1);
  assert.equal(production.vocalJobs[0].speaker, 'Commander');
  assert.ok(production.videoJobs.length >= 1);
  assert.ok(production.videoJobs[0].prompt.includes('DESERT LAUNCHPAD'));
  assert.ok(production.assemblyPackage.timeline.videoTrack.length >= 1);
  assert.ok(production.telemetry.agentStepsCompleted >= 5);
});
