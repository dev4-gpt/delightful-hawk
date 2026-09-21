let cacheBody = null;
let cacheAt = 0;
const CACHE_TTL_MS = 10000;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const now = Date.now();
  if (cacheBody && (now - cacheAt < CACHE_TTL_MS)) {
    res.setHeader('X-ADS-B-Cache', 'HIT');
    return res.status(200).send(cacheBody);
  }

  try {
    const upstream = await fetch('https://api.adsb.lol/v2/mil', {
      headers: { 'User-Agent': 'gods-eye-view-adsblol-proxy/1.0' },
      signal: AbortSignal.timeout(10000),
    });

    if (!upstream.ok) {
      throw new Error(`HTTP ${upstream.status}`);
    }

    const body = await upstream.text();
    cacheBody = body;
    cacheAt = now;
    res.setHeader('X-ADS-B-Cache', 'MISS');
    return res.status(200).send(body);
  } catch (err) {
    if (cacheBody) {
      res.setHeader('X-ADS-B-Cache', 'STALE');
      return res.status(200).send(cacheBody);
    }
    res.setHeader('X-ADS-B-Cache', 'FALLBACK');
    return res.status(200).json({ ac: [], total: 0 });
  }
}
