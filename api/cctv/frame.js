import fs from 'node:fs';
import path from 'node:path';
import { getCameraById, buildSyntheticCctvSvg } from './_cameras.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Extract camera ID from query or URL
  const rawId = req.query.id || req.query.cameraId || '';
  const cameraId = decodeURIComponent(String(rawId).replace(/^\/api\/cctv\/frame\/?/, '').trim());
  const camera = getCameraById(cameraId) || {
    id: cameraId || 'tactical-feed',
    name: req.query.label || 'Tactical Camera',
    city: req.query.city || 'GLOBAL GRID',
    lat: Number(req.query.lat) || 30.2747,
    lon: Number(req.query.lon) || -97.7404,
    headingDeg: Number(req.query.heading) || 0,
    fovDeg: Number(req.query.fov) || 70,
    pitchDeg: Number(req.query.pitch) || -18,
  };

  // 1. Try bundled local JPEG snapshot
  const localSnapshotCandidates = [
    camera.snapshotUrl,
    `/cctv/${camera.id.includes('shibuya') || camera.id.includes('tokyo') ? 'tokyo_shibuya.jpg' : 'nyc_harbor.jpg'}`,
  ].filter(Boolean);

  for (const candidate of localSnapshotCandidates) {
    if (typeof candidate === 'string' && candidate.startsWith('/cctv/')) {
      const rel = candidate.replace(/^\//, '');
      const possiblePaths = [
        path.resolve(process.cwd(), 'public', rel),
        path.resolve(process.cwd(), 'dist', rel),
        path.resolve(process.cwd(), rel),
      ];
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          const buf = fs.readFileSync(p);
          res.setHeader('Content-Type', 'image/jpeg');
          res.setHeader('X-CCTV-Source', 'local-snapshot');
          return res.status(200).send(buf);
        }
      }
    }
  }

  // 2. Try Google Street View Static API if GOOGLE_MAPS_API_KEY is available
  const googleKey = process.env.GOOGLE_MAPS_API_KEY;
  if (googleKey && Number.isFinite(camera.lat) && Number.isFinite(camera.lon)) {
    try {
      const sv = new URL('https://maps.googleapis.com/maps/api/streetview');
      sv.searchParams.set('size', '960x540');
      sv.searchParams.set('location', `${camera.lat},${camera.lon}`);
      sv.searchParams.set('heading', String(Math.round(camera.headingDeg || 0)));
      sv.searchParams.set('fov', String(Math.round(camera.fovDeg || 70)));
      sv.searchParams.set('pitch', String(Math.round(camera.pitchDeg || -15)));
      sv.searchParams.set('source', 'outdoor');
      sv.searchParams.set('return_error_code', 'true');
      sv.searchParams.set('key', googleKey);

      const svResp = await fetch(sv.toString(), {
        headers: { 'User-Agent': 'gods-eye-view-cctv-proxy/1.0' },
        signal: AbortSignal.timeout(8000),
      });
      const svType = svResp.headers.get('content-type') || '';
      if (svResp.ok && svType.startsWith('image/')) {
        const buf = Buffer.from(await svResp.arrayBuffer());
        if (buf.length > 512) {
          res.setHeader('Content-Type', svType);
          res.setHeader('X-CCTV-Source', 'google-streetview');
          return res.status(200).send(buf);
        }
      }
    } catch {
      // Fall through to synthetic vector frame
    }
  }

  // 3. Fallback: Tactical Synthetic Vector Scanline Frame
  const svg = buildSyntheticCctvSvg({
    cameraId: camera.id,
    label: camera.name,
    city: camera.city,
    status: 'ACTIVE · PERSISTENT LOCK',
  });

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('X-CCTV-Source', 'synthetic-tactical');
  return res.status(200).send(Buffer.from(svg, 'utf8'));
}
