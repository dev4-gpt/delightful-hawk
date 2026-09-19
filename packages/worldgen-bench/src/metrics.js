/**
 * @aetheris/worldgen-bench - metrics.js
 * Mathematical metrics evaluating 3D spatial consistency and narrative coherence.
 */

/**
 * Camera Trajectory Error (CTE)
 * Calculates RMSE between intended 3D camera trajectory points and recovered poses.
 * Lower is better (0 = perfect physical alignment).
 */
export function computeCameraTrajectoryError(intendedPoses, recoveredPoses) {
  if (!intendedPoses.length || !recoveredPoses.length) return 0;
  const n = Math.min(intendedPoses.length, recoveredPoses.length);
  let sumSqErr = 0;

  for (let i = 0; i < n; i++) {
    const p1 = intendedPoses[i].pos || intendedPoses[i].position;
    const p2 = recoveredPoses[i].pos || recoveredPoses[i].position;
    const dx = p1[0] - p2[0];
    const dy = p1[1] - p2[1];
    const dz = p1[2] - p2[2];
    sumSqErr += dx * dx + dy * dy + dz * dz;
  }

  return Math.sqrt(sumSqErr / n);
}

/**
 * Depth Alignment Score (DAS)
 * Calculates Mean Absolute Error (MAE) between ground truth 3D depth and estimated video depth.
 * Higher score is better (normalized to [0, 100%]).
 */
export function computeDepthAlignmentScore(groundTruthDepth, estimatedDepth) {
  if (!groundTruthDepth.length || !estimatedDepth.length) return 100.0;
  const n = Math.min(groundTruthDepth.length, estimatedDepth.length);
  let totalAbsDiff = 0;

  for (let i = 0; i < n; i++) {
    totalAbsDiff += Math.abs(groundTruthDepth[i] - estimatedDepth[i]);
  }
  const mae = totalAbsDiff / n;
  // Normalized score where 0 MAE = 100% alignment
  return Math.max(0, Math.min(100, (1.0 - mae) * 100));
}

/**
 * Cross-Shot Narrative Fidelity (CSNF)
 * Measures character appearance embedding cosine similarity across consecutive scenes.
 */
export function computeCrossShotFidelity(embeddingA, embeddingB) {
  if (!embeddingA || !embeddingB || embeddingA.length !== embeddingB.length) return 1.0;
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < embeddingA.length; i++) {
    dot += embeddingA[i] * embeddingB[i];
    normA += embeddingA[i] * embeddingA[i];
    normB += embeddingB[i] * embeddingB[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0;
  return dot / denom;
}
