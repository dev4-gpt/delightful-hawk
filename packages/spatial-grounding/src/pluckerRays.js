/**
 * @aetheris/spatial-grounding - pluckerRays.js
 * Computes 6D Plücker camera ray coordinates (d, m) where:
 *   d = ray direction unit vector
 *   m = o x d (moment of the ray about the origin, where o is the camera position)
 *
 * Plücker coordinates provide an invariant, coordinate-system-agnostic representation
 * of 3D camera geometry utilized directly in video diffusion transformer cross-attention layers.
 */

import { vec3Cross, vec3Normalize, vec3Sub } from './cameraSpline.js';

export function computePluckerRay(cameraPos, pixelWorldTarget) {
  // Ray direction
  const d = vec3Normalize(vec3Sub(pixelWorldTarget, cameraPos));
  // Moment m = o x d
  const m = vec3Cross(cameraPos, d);

  // Return 6D Plücker vector [dx, dy, dz, mx, my, mz]
  return [d[0], d[1], d[2], m[0], m[1], m[2]];
}

/**
 * Generate a grid of Plücker rays for a given camera pose and resolution.
 * @param {Array<number>} pos - [x, y, z] camera center
 * @param {Array<number>} forward - [fx, fy, fz] camera forward unit vector
 * @param {number} fovDeg - Field of view in degrees (vertical)
 * @param {number} width - Output width (e.g., 64)
 * @param {number} height - Output height (e.g., 64)
 * @returns {Float32Array} - Flattened tensor of shape (height, width, 6)
 */
export function generatePluckerGrid(pos, forward, fovDeg, width = 32, height = 32) {
  const tensor = new Float32Array(height * width * 6);
  const aspect = width / height;
  const vFovRad = (fovDeg * Math.PI) / 180;
  const halfHeight = Math.tan(vFovRad / 2);
  const halfWidth = halfHeight * aspect;

  // Build camera coordinate frame (Up = [0, 1, 0] reference)
  const worldUp = [0, 1, 0];
  let right = vec3Cross(forward, worldUp);
  if (Math.hypot(right[0], right[1], right[2]) < 1e-4) {
    right = [1, 0, 0];
  } else {
    right = vec3Normalize(right);
  }
  const up = vec3Cross(right, forward);

  let offset = 0;
  for (let y = 0; y < height; y++) {
    const v = (1.0 - (2.0 * (y + 0.5)) / height) * halfHeight;
    for (let x = 0; x < width; x++) {
      const u = (((2.0 * (x + 0.5)) / width) - 1.0) * halfWidth;

      // Pixel ray direction in world space
      const rayDir = vec3Normalize([
        forward[0] + right[0] * u + up[0] * v,
        forward[1] + right[1] * u + up[1] * v,
        forward[2] + right[2] * u + up[2] * v
      ]);

      // Moment m = pos x rayDir
      const m = vec3Cross(pos, rayDir);

      tensor[offset++] = rayDir[0];
      tensor[offset++] = rayDir[1];
      tensor[offset++] = rayDir[2];
      tensor[offset++] = m[0];
      tensor[offset++] = m[1];
      tensor[offset++] = m[2];
    }
  }

  return tensor;
}
