/**
 * @aetheris/inference-bridge - inferenceRouter.js
 * Unified dispatch router for multi-model generative video, audio, and avatar workflows.
 */

import { MODEL_REGISTRY } from './models.js';
import { OfflineSyntheticProvider, LocalGPUProvider, CloudServerlessProvider } from './providers.js';

export class InferenceRouter {
  constructor(options = {}) {
    this.mode = options.mode || 'offline-synthetic'; // 'offline-synthetic' | 'local-gpu' | 'cloud-serverless'
    this.providers = {
      'offline-synthetic': new OfflineSyntheticProvider(),
      'local-gpu': new LocalGPUProvider(options.localEndpoint),
      'cloud-serverless': new CloudServerlessProvider(options.cloudOptions)
    };
    this.history = [];
  }

  setMode(mode) {
    if (!this.providers[mode]) {
      throw new Error(`Unknown inference mode: ${mode}. Valid modes: ${Object.keys(this.providers).join(', ')}`);
    }
    this.mode = mode;
  }

  getActiveProvider() {
    return this.providers[this.mode];
  }

  /**
   * Dispatch a generation job to the active provider.
   * @param {Object} job - { modelId, prompt, negativePrompt, spatialConditioning, duration, aspectRatio, resolution }
   */
  async dispatch(job) {
    if (!job.modelId) {
      throw new Error('Inference job requires a valid modelId');
    }
    const modelMeta = MODEL_REGISTRY[job.modelId];
    if (!modelMeta) {
      throw new Error(`Model '${job.modelId}' is not registered in Aetheris Model Registry`);
    }

    // Sanitize & default parameters
    const sanitizedJob = {
      ...job,
      type: modelMeta.type,
      duration: job.duration || 5.0,
      aspectRatio: job.aspectRatio || '16:9',
      resolution: job.resolution || (modelMeta.supportedResolutions ? modelMeta.supportedResolutions[0] : '1080p')
    };

    const provider = this.getActiveProvider();
    const result = await provider.generate(sanitizedJob);

    const recordedEntry = {
      timestamp: new Date().toISOString(),
      jobId: result.jobId,
      modelId: sanitizedJob.modelId,
      provider: provider.name,
      executionMs: result.telemetry?.executionMs || 0,
      spatialConditioningApplied: !!sanitizedJob.spatialConditioning
    };
    this.history.push(recordedEntry);

    return result;
  }

  getHistory() {
    return [...this.history];
  }
}
