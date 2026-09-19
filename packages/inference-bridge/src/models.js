/**
 * @aetheris/inference-bridge - models.js
 * Comprehensive foundation model registry for open-source generative media.
 */

export const MODEL_REGISTRY = {
  // Video Generation Models
  'wan-2.1-t2v-14b': {
    id: 'wan-2.1-t2v-14b',
    name: 'Wan 2.1 (14B) Text-to-Video',
    type: 'video',
    family: 'wan',
    parameters: '14B',
    vramRequirement: '16GB (Wan2GP quantized) - 32GB',
    defaultFps: 24,
    supportedResolutions: ['720p', '1080p'],
    supportedAspectRatios: ['16:9', '9:16', '1:1', '2.39:1'],
    capabilities: ['spatial-conditioning', 'camera-control', 'high-motion-fidelity']
  },
  'wan-2.1-i2v-14b': {
    id: 'wan-2.1-i2v-14b',
    name: 'Wan 2.1 (14B) Image-to-Video',
    type: 'video',
    family: 'wan',
    parameters: '14B',
    vramRequirement: '16GB - 32GB',
    defaultFps: 24,
    supportedResolutions: ['720p', '1080p'],
    supportedAspectRatios: ['16:9', '9:16', '1:1', '2.39:1'],
    capabilities: ['image-prompting', 'camera-control', 'plucker-conditioning']
  },
  'wan-2.1-t2v-1.3b': {
    id: 'wan-2.1-t2v-1.3b',
    name: 'Wan 2.1 (1.3B) Fast Consumer',
    type: 'video',
    family: 'wan',
    parameters: '1.3B',
    vramRequirement: '8GB (Consumer RTX 3060/4060 / Apple Silicon)',
    defaultFps: 24,
    supportedResolutions: ['480p', '720p'],
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    capabilities: ['ultra-fast', 'low-vram']
  },
  'skyreels-v2': {
    id: 'skyreels-v2',
    name: 'SkyReels-V2 Cinematic Director',
    type: 'video',
    family: 'skywork',
    parameters: '13B',
    vramRequirement: '24GB',
    defaultFps: 24,
    supportedResolutions: ['720p', '1080p'],
    supportedAspectRatios: ['16:9', '2.39:1'],
    capabilities: ['narrative-continuity', 'multi-shot', 'film-lighting']
  },

  // Photorealistic Keyframe Models
  'flux-1-dev': {
    id: 'flux-1-dev',
    name: 'Flux.1 Dev Photoreal',
    type: 'image',
    family: 'black-forest-labs',
    parameters: '12B',
    vramRequirement: '12GB - 24GB',
    supportedResolutions: ['1024x1024', '1280x720', '1920x1080'],
    capabilities: ['typography-rendering', 'anatomical-perfection', 'lora-support']
  },
  'flux-1-schnell': {
    id: 'flux-1-schnell',
    name: 'Flux.1 Schnell (4-Step Turbo)',
    type: 'image',
    family: 'black-forest-labs',
    parameters: '12B',
    vramRequirement: '8GB - 16GB',
    supportedResolutions: ['1024x1024', '1280x720'],
    capabilities: ['sub-second-generation', 'interactive-preview']
  },

  // Digital Human & Vocal Performance
  'duix-avatar-v1': {
    id: 'duix-avatar-v1',
    name: 'Duix-Avatar Offline Talking Human',
    type: 'avatar',
    family: 'duix',
    capabilities: ['offline-avatar', 'phoneme-lipsync', 'facial-microexpression']
  },
  'voxcpm-tts': {
    id: 'voxcpm-tts',
    name: 'VoxCPM Zero-Shot Multilingual Voice Clone',
    type: 'audio',
    family: 'openbmb',
    capabilities: ['zero-shot-cloning', 'affective-acting', 'tokenizer-free']
  },

  // Post-Production Pipeline
  'openmontage-v1': {
    id: 'openmontage-v1',
    name: 'OpenMontage 12-Stage Assembly Pipeline',
    type: 'pipeline',
    family: 'calesthio',
    capabilities: ['auto-timeline-cutting', 'color-lut', 'foley-ducking', 'multi-track-export']
  }
};
