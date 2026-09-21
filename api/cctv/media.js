import fs from 'node:fs';
import path from 'node:path';
import { getCameraById } from './_cameras.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const rawId = req.query.id || req.query.cameraId || '';
  const cameraId = decodeURIComponent(String(rawId).replace(/^\/api\/cctv\/media\/?/, '').trim());
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
        const head = {
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': 'video/mp4',
        };
        res.writeHead(206, head);
        return file.pipe(res);
      } else {
        const head = {
          'Content-Length': stat.size,
          'Content-Type': 'video/mp4',
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, s-maxage=3600',
        };
        res.writeHead(200, head);
        return fs.createReadStream(p).pipe(res);
      }
    }
  }

  // Fallback: redirect to static frame
  return res.redirect(307, `/api/cctv/frame?id=${encodeURIComponent(cameraId)}`);
}
