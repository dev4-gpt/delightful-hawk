import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MODEL_REGISTRY,
  InferenceRouter,
  OfflineSyntheticProvider,
  CloudServerlessProvider
} from '../src/index.js';

test('Model registry integrity', () => {
  assert.ok(MODEL_REGISTRY['wan-2.1-t2v-14b'], 'Wan 2.1 14B must be registered');
  assert.ok(MODEL_REGISTRY['skyreels-v2'], 'SkyReels-V2 must be registered');
  assert.ok(MODEL_REGISTRY['flux-1-dev'], 'Flux.1 Dev must be registered');
  assert.ok(MODEL_REGISTRY['voxcpm-tts'], 'VoxCPM must be registered');
  assert.ok(MODEL_REGISTRY['duix-avatar-v1'], 'Duix-Avatar must be registered');
  assert.ok(MODEL_REGISTRY['openmontage-v1'], 'OpenMontage must be registered');

  const wan = MODEL_REGISTRY['wan-2.1-t2v-14b'];
  assert.equal(wan.type, 'video');
  assert.ok(wan.capabilities.includes('spatial-conditioning'));
});

test('InferenceRouter dispatches jobs to active provider', async () => {
  const router = new InferenceRouter({ mode: 'offline-synthetic' });
  assert.equal(router.mode, 'offline-synthetic');

  const job = {
    modelId: 'wan-2.1-t2v-14b',
    prompt: 'A cinematic drone shot over neon-lit Tokyo harbor at night',
    duration: 6.0,
    aspectRatio: '2.39:1',
    spatialConditioning: {
      cameraPoses: [{ frame: 0, position: [0, 50, 100] }]
    }
  };

  const result = await router.dispatch(job);
  assert.equal(result.status, 'completed');
  assert.equal(result.modelId, 'wan-2.1-t2v-14b');
  assert.ok(result.output.url.includes('.mp4'));
  assert.equal(result.output.spatialConditioningApplied, true);
  assert.equal(result.output.cameraTrajectorySampleCount, 1);

  const history = router.getHistory();
  assert.equal(history.length, 1);
  assert.equal(history[0].modelId, 'wan-2.1-t2v-14b');
  assert.equal(history[0].spatialConditioningApplied, true);
});

test('InferenceRouter rejects unknown models', async () => {
  const router = new InferenceRouter();
  await assert.rejects(
    async () => {
      await router.dispatch({ modelId: 'non-existent-model-xyz', prompt: 'test' });
    },
    { message: /not registered/ }
  );
});

test('Cloud serverless provider simulation', async () => {
  const cloud = new CloudServerlessProvider({ platform: 'runpod-serverless' });
  const result = await cloud.generate({
    modelId: 'skyreels-v2',
    prompt: 'Dramatic cinematic lighting shot of cybernetic character'
  });

  assert.equal(result.status, 'completed');
  assert.equal(result.provider, 'runpod-serverless');
  assert.ok(result.output.url.includes('skyreels-v2'));
});
