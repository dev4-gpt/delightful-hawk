import test from 'node:test';
import assert from 'node:assert/strict';
import { CameraTrajectoryBridge } from './cameraTrajectoryBridge.js';

test('CameraTrajectoryBridge records and exports waypoints', () => {
  // Mock Cesium Viewer & Camera
  const mockCamera = {
    positionWC: { x: 1000, y: 2000, z: 3000 },
    heading: 0.5,
    pitch: -0.4,
    roll: 0.0,
    frustum: { fovy: 1.047 }
  };
  const mockViewer = { camera: mockCamera };

  const bridge = new CameraTrajectoryBridge(mockViewer);
  assert.equal(bridge.isRecording, false);

  // Directly sample a pose
  bridge.recordedWaypoints.push({
    time: 0.0,
    pos: [-122.4194, 37.7749, 500.0],
    rotation: [-20.0, 30.0, 0.0],
    fov: 60.0
  });
  bridge.recordedWaypoints.push({
    time: 2.5,
    pos: [-122.4100, 37.7800, 350.0],
    rotation: [-15.0, 45.0, 0.0],
    fov: 55.0
  });

  const trajectory = bridge.getTrajectoryPackage();
  assert.equal(trajectory.totalWaypoints, 2);
  assert.equal(trajectory.durationSec, 2.5);
  assert.equal(trajectory.exportForStudio.cameraPoses.length, 2);
  assert.equal(trajectory.exportForStudio.cameraPoses[0].frame, 0);
  assert.equal(trajectory.exportForStudio.cameraPoses[1].frame, 1);
});
