/**
 * @aetheris/studio - server.js
 * Production HTTP API server and static host for Aetheris World Studio.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { InferenceRouter, MODEL_REGISTRY } from '../../packages/inference-bridge/src/index.js';
import { SwarmCoordinator } from '../../packages/director-swarm/src/index.js';
import { SecurityShield } from '../../packages/security-shield/src/index.js';
import { CameraPath, generateSyntheticDepthBuffer } from '../../packages/spatial-grounding/src/index.js';
import { WorldGenBenchmark } from '../../packages/worldgen-bench/src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3030;
const inferenceRouter = new InferenceRouter({ mode: 'offline-synthetic' });
const swarmCoordinator = new SwarmCoordinator();
const securityShield = new SecurityShield();
const worldGenBenchmark = new WorldGenBenchmark();

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
  });
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

export async function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // --- API Routes ---
  if (pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'nominal',
      service: 'Aetheris World Studio',
      version: '1.0.0',
      activeModelsCount: Object.keys(MODEL_REGISTRY).length,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  if (pathname === '/api/models' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ models: MODEL_REGISTRY }));
    return;
  }

  if (pathname === '/api/generate' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      // 1. Security Scan
      const securityCheck = securityShield.scanPrompt(payload.prompt || '');
      if (!securityCheck.safe) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Security violation',
          details: securityCheck
        }));
        return;
      }

      // 2. Build 3D Spatial Conditioning if requested
      const pathRig = new CameraPath({ fps: 24, duration: payload.duration || 5.0 });
      pathRig.addWaypoint({ pos: [0, 50, 100], target: [0, 0, 0], fov: 50, time: 0 });
      pathRig.addWaypoint({ pos: [50, 20, 50], target: [0, 0, 0], fov: 45, time: payload.duration || 5.0 });
      const spatialPoses = pathRig.exportCameraCtrlFormat();
      const syntheticDepth = generateSyntheticDepthBuffer([0, 50, 100], [0, 0, 0]);

      // 3. Dispatch to Inference Router
      const result = await inferenceRouter.dispatch({
        ...payload,
        spatialConditioning: {
          ...spatialPoses,
          depthBuffer: Array.from(syntheticDepth.depthBuffer.slice(0, 16))
        }
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  if (pathname === '/api/director/script' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const production = await swarmCoordinator.directProduction(payload.script || 'A cinematic cyberpunk shot');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(production));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  if (pathname === '/api/benchmark' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const evaluation = worldGenBenchmark.evaluateModel(payload.modelId || 'wan-2.1-t2v-14b', {
        intendedPoses: [{ pos: [0, 0, 0] }, { pos: [5, 5, 5] }],
        recoveredPoses: [{ pos: [0.02, 0, 0] }, { pos: [5.01, 5.0, 4.99] }],
        groundTruthDepth: [0.2, 0.5, 0.8],
        estimatedDepth: [0.21, 0.49, 0.81]
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(evaluation));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // --- Static Files ---
  let filePath = '';
  if (pathname === '/' || pathname === '/index.html') {
    filePath = path.join(__dirname, 'public', 'index.html');
  } else if (pathname.startsWith('/src/')) {
    filePath = path.join(__dirname, pathname);
  } else {
    filePath = path.join(__dirname, 'public', pathname);
  }

  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'text/plain';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(`404 Not Found: ${pathname}`);
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
}

const server = http.createServer(handleRequest);

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`[Aetheris World Studio] Server running at http://localhost:${PORT}`);
  });
}

export { server };
