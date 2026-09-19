/**
 * @aetheris/spatial-grounding - syntheticDepth.js
 * Generates synthetic metric depth buffers and surface normals from 3D camera geometry
 * to condition video diffusion models (ControlNet Depth, Wan 2.1 Depth Adapter).
 */

import { vec3Normalize, vec3Sub, vec3Length } from './cameraSpline.js';

export function generateSyntheticDepthBuffer(cameraPos, lookAtTarget, resolution = { width: 64, height: 64 }) {
  const { width, height } = resolution;
  const depthBuffer = new Float32Array(width * height);
  const targetDist = vec3Length(vec3Sub(lookAtTarget, cameraPos));

  for (let y = 0; y < height; y++) {
    const ny = (y / height) * 2 - 1; // -1 to 1
    for (let x = 0; x < width; x++) {
      const nx = (x / width) * 2 - 1;

      // Ground plane perspective depth simulation
      const radialDist = Math.hypot(nx, ny);
      // Perspective foreshortening curve
      const simulatedDistance = targetDist * (1.0 + 0.35 * radialDist + 0.5 * ny);
      // Normalized disparity [0 = far, 1 = near]
      const near = 0.5;
      const far = targetDist * 3.0;
      const normalizedDisparity = Math.max(0, Math.min(1, (far - simulatedDistance) / (far - near)));

      depthBuffer[y * width + x] = normalizedDisparity;
    }
  }

  return {
    width,
    height,
    depthBuffer,
    nearPlane: 0.5,
    farPlane: targetDist * 3.0
  };
}
