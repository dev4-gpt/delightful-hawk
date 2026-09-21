import fs from 'node:fs';
import path from 'node:path';
import { CCTV_CATALOG, getCameraById, buildSyntheticCctvSvg } from './_cameras.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Determine subroute from query param `sub` or URL path
  const sub = req.query.sub || (req.url || '').split('?')[0].replace(/^\/api\/cctv\/?/, '');

  // 1. /api/cctv/sources
  if (sub === 'sources') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    if (req.method === 'HEAD') return res.status(200).end();
    return res.status(200).json({ sources: CCTV_CATALOG });
  }

  // 2. /api/cctv/health
  if (sub === 'health') {
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    const now = Date.now();
    const cameras = CCTV_CATALOG.map((cam) => ({
      id: cam.id,
      status: 'ok',
      sourceKind: cam.feedType === 'mp4' ? 'live' : 'snapshot',
      label: cam.provider || 'Configured Feed',
      message: cam.feedType === 'mp4' ? 'Live stream connected' : 'Snapshot feed active',
      updatedAt: now,
    }));
    return res.status(200).json({ cameras });
  }

  // 3. /api/cctv/stream/:id
  if (sub === 'stream' || sub.startsWith('stream')) {
    const rawId = req.query.id || sub.replace(/^stream\/?/, '');
    const cameraId = decodeURIComponent(String(rawId).trim());
    const camera = getCameraById(cameraId);
    const feedType = camera?.feedType || 'image';

    res.setHeader('Cache-Control', 'public, s-maxage=300');
    return res.status(200).json({
      id: cameraId,
      feedType,
      mediaUrl: feedType === 'mp4' ? `/api/cctv/media/${encodeURIComponent(cameraId)}` : null,
      frameUrl: `/api/cctv/frame/${encodeURIComponent(cameraId)}`,
      provider: camera?.provider || 'Configured Feed',
      sourceKind: camera?.sourceKind || 'configured',
    });
  }

  // 4. /api/cctv/media/:id
  if (sub === 'media' || sub.startsWith('media')) {
    const rawId = req.query.id || sub.replace(/^media\/?/, '');
    const cameraId = decodeURIComponent(String(rawId).trim());
    const camera = getCameraById(cameraId);
    const videoName = camera?.id?.includes('shibuya') || camera?.id?.includes('tokyo')
      ? 'tokyo_shibuya.mp4'
      : 'nyc_harbor.mp4';

    const possiblePaths = [
      path.resolve(process.cwd(), 'public/cctv', videoName),
      path.resolve(process.cwd(), 'dist/cctv', videoName),
      path.resolve(process.cwd(), 'cctv', videoName),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        const stat = fs.statSync(p);
        const range = req.headers.range;
        if (range) {
          const parts = range.replace(/bytes=/, '').split('-');
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
          const chunksize = end - start + 1;
          const file = fs.createReadStream(p, { start, end });
          res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${stat.size}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4',
          });
          return file.pipe(res);
        } else {
          res.writeHead(200, {
            'Content-Length': stat.size,
            'Content-Type': 'video/mp4',
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'public, s-maxage=3600',
          });
          return fs.createReadStream(p).pipe(res);
        }
      }
    }
    return res.redirect(307, `/api/cctv/frame/${encodeURIComponent(cameraId)}`);
  }

  // 5. Default / Frame: /api/cctv/frame/:id
  const rawId = req.query.id || sub.replace(/^frame\/?/, '');
  const cameraId = decodeURIComponent(String(rawId).trim());
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

  // 5a. Local snapshot
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
          res.setHeader('Cache-Control', 'public, s-maxage=30');
          return res.status(200).send(buf);
        }
      }
    }
  }

  // 5b. Google Street View
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
          res.setHeader('Cache-Control', 'public, s-maxage=30');
          return res.status(200).send(buf);
        }
      }
    } catch {
      // Fall through to synthetic
    }
  }

  // 5c. Synthetic Vector Frame
  const svg = buildSyntheticCctvSvg({
    cameraId: camera.id,
    label: camera.name,
    city: camera.city,
    status: 'ACTIVE · PERSISTENT LOCK',
  });

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('X-CCTV-Source', 'synthetic-tactical');
  res.setHeader('Cache-Control', 'public, s-maxage=30');
  return res.status(200).send(Buffer.from(svg, 'utf8'));
}
