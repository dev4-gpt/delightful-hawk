import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CameraPath,
  catmullRomCentripetal,
  vec3Add,
  vec3Sub,
  vec3Normalize,
  vec3Cross,
  computePluckerRay,
  generatePluckerGrid,
  generateSyntheticDepthBuffer,
  CesiumCameraBridge
} from '../src/index.js';

test('Vector 3D math operations', () => {
  const a = [1, 2, 3];
  const b = [4, 5, 6];
  assert.deepEqual(vec3Add(a, b), [5, 7, 9]);
  assert.deepEqual(vec3Sub(b, a), [3, 3, 3]);

  const cross = vec3Cross([1, 0, 0], [0, 1, 0]);
  assert.deepEqual(cross, [0, 0, 1]);

  const norm = vec3Normalize([3, 0, 4]);
  assert.ok(Math.abs(norm[0] - 0.6) < 1e-6);
  assert.ok(Math.abs(norm[2] - 0.8) < 1e-6);
});

test('Catmull-Rom Centripetal Spline interpolation', () => {
  const p0 = [0, 0, 0];
  const p1 = [10, 0, 0];
  const p2 = [20, 10, 0];
  const p3 = [30, 10, 0];

  const mid = catmullRomCentripetal(p0, p1, p2, p3, 0.5);
  assert.ok(mid[0] > 10 && mid[0] < 20, 'X must lie between p1 and p2');
  assert.ok(mid[1] >= 0 && mid[1] <= 10, 'Y must smoothly rise between 0 and 10');
});

test('CameraPath generates continuous 6-DOF frames', () => {
  const path = new CameraPath({ fps: 24, duration: 2.0 });
  path.addWaypoint({ pos: [0, 5, 10], target: [0, 0, 0], fov: 60, time: 0 });
  path.addWaypoint({ pos: [10, 8, 10], target: [0, 0, 0], fov: 50, time: 1.0 });
  path.addWaypoint({ pos: [15, 12, 5], target: [0, 0, 0], fov: 40, time: 2.0 });

  const frames = path.generateFrames();
  assert.equal(frames.length, 48, 'Should produce 48 frames for 2 seconds at 24fps');

  // Verify first and last frame continuity
  assert.equal(frames[0].frameIndex, 0);
  assert.ok(Math.abs(frames[0].fov - 60) < 1e-4);
  assert.ok(Math.abs(frames[47].fov - 40) < 1e-4);

  const exportData = path.exportCameraCtrlFormat();
  assert.equal(exportData.cameraPoses.length, 48);
  assert.equal(exportData.metadata.fps, 24);
});

test('Plücker camera ray computation', () => {
  const cameraPos = [0, 2, 5];
  const pixelTarget = [0, 0, 0];
  const ray = computePluckerRay(cameraPos, pixelTarget);

  assert.equal(ray.length, 6);
  // Direction unit vector magnitude should be 1
  const dirMag = Math.hypot(ray[0], ray[1], ray[2]);
  assert.ok(Math.abs(dirMag - 1.0) < 1e-5);

  const grid = generatePluckerGrid(cameraPos, [0, -0.37, -0.93], 50, 8, 8);
  assert.equal(grid.length, 8 * 8 * 6, 'Grid tensor should match resolution * 6 dimensions');
});

test('Synthetic depth buffer generation', () => {
  const depth = generateSyntheticDepthBuffer([0, 10, 20], [0, 0, 0], { width: 16, height: 16 });
  assert.equal(depth.width, 16);
  assert.equal(depth.height, 16);
  assert.equal(depth.depthBuffer.length, 256);
  for (let i = 0; i < depth.depthBuffer.length; i++) {
    assert.ok(depth.depthBuffer[i] >= 0 && depth.depthBuffer[i] <= 1);
  }
});

test('CesiumCameraBridge records and exports geographic 3D poses', () => {
  const bridge = new CesiumCameraBridge();
  bridge.addPose(0.0, [-122.4194, 37.7749, 800.0], [-30.0, 15.0, 0.0], 60.0);
  bridge.addPose(3.0, [-122.4100, 37.7800, 400.0], [-20.0, 25.0, 0.0], 50.0);

  const pkg = bridge.getTrajectoryPackage();
  assert.equal(pkg.totalWaypoints, 2);
  assert.equal(pkg.durationSec, 3.0);
  assert.equal(pkg.cameraPoses.length, 2);
  assert.equal(pkg.cameraPoses[0].position[2], 800.0);
  assert.equal(pkg.cameraPoses[1].position[2], 400.0);
});

