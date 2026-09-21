import { CCTV_CATALOG } from './_cameras.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

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
