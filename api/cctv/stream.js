import { getCameraById } from './_cameras.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, s-maxage=300');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const rawId = req.query.id || req.query.cameraId || '';
  const cameraId = decodeURIComponent(String(rawId).replace(/^\/api\/cctv\/stream\/?/, '').trim());
  const camera = getCameraById(cameraId);

  const feedType = camera?.feedType || 'image';

  return res.status(200).json({
    id: cameraId,
    feedType,
    mediaUrl: feedType === 'mp4' ? `/api/cctv/media/${encodeURIComponent(cameraId)}` : null,
    frameUrl: `/api/cctv/frame/${encodeURIComponent(cameraId)}`,
    provider: camera?.provider || 'Configured Feed',
    sourceKind: camera?.sourceKind || 'configured',
  });
}
