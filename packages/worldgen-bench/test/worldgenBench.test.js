import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeCameraTrajectoryError,
  computeDepthAlignmentScore,
  computeCrossShotFidelity,
  WorldGenBenchmark
} from '../src/index.js';

test('Camera Trajectory Error calculation', () => {
  const intended = [{ pos: [0, 0, 0] }, { pos: [0, 5, 0] }];
  const recoveredExact = [{ pos: [0, 0, 0] }, { pos: [0, 5, 0] }];
  assert.equal(computeCameraTrajectoryError(intended, recoveredExact), 0.0);

  const recoveredDrift = [{ pos: [0.1, 0, 0] }, { pos: [0, 5.1, 0] }];
  const err = computeCameraTrajectoryError(intended, recoveredDrift);
  assert.ok(err > 0 && err < 0.2);
});

test('Depth Alignment Score calculation', () => {
  const gt = new Float32Array([0.2, 0.5, 0.8]);
  const estimatedExact = new Float32Array([0.2, 0.5, 0.8]);
  assert.equal(computeDepthAlignmentScore(gt, estimatedExact), 100.0);

  const estimatedSlight = new Float32Array([0.25, 0.45, 0.85]);
  const score = computeDepthAlignmentScore(gt, estimatedSlight);
  assert.ok(score >= 90.0 && score < 100.0);
});

test('Cross-shot cosine fidelity', () => {
  const v1 = [1.0, 0.0, 0.0];
  const v2 = [1.0, 0.0, 0.0];
  assert.ok(Math.abs(computeCrossShotFidelity(v1, v2) - 1.0) < 1e-6);

  const v3 = [0.0, 1.0, 0.0];
  assert.ok(Math.abs(computeCrossShotFidelity(v1, v3) - 0.0) < 1e-6);
});

test('WorldGenBenchmark end-to-end evaluation', () => {
  const bench = new WorldGenBenchmark();
  const evaluation = bench.evaluateModel('wan-2.1-t2v-14b', {
    intendedPoses: [{ pos: [0, 0, 0] }, { pos: [5, 5, 5] }],
    recoveredPoses: [{ pos: [0.05, 0, 0] }, { pos: [5.02, 5.01, 4.98] }],
    groundTruthDepth: [0.3, 0.6, 0.9],
    estimatedDepth: [0.31, 0.59, 0.88],
    embeddingShotA: [0.8, 0.6],
    embeddingShotB: [0.79, 0.61]
  });

  assert.equal(evaluation.modelId, 'wan-2.1-t2v-14b');
  assert.ok(evaluation.metrics.compositeWorldGenScore >= 85.0);
  assert.equal(evaluation.evaluation, 'EXCEPTIONAL_SPATIAL_COHERENCE');
});
