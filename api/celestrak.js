const memoryCache = new Map();
const TTL_MS = 60 * 60 * 1000;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=3600');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).send('Method Not Allowed');
  }

  const rawGroup = req.query.group || 'stations';
  const group = String(rawGroup).replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase() || 'stations';

  const now = Date.now();
  const entry = memoryCache.get(group);
  if (entry && (now - entry.at < TTL_MS)) {
    res.setHeader('x-tle-cache', 'HIT');
    return res.status(200).send(entry.body);
  }

  try {
    const upstream = await fetch(`https://celestrak.org/NORAD/elements/gp.php?GROUP=${encodeURIComponent(group)}&FORMAT=tle`, {
      headers: {
        'User-Agent': 'gods-eye-view-celestrak-proxy/1.0 (+https://github.com/bilawalsidhu/gods-eye-view)',
        'Accept': 'text/plain',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!upstream.ok) {
      throw new Error(`Upstream HTTP ${upstream.status}`);
    }

    const body = await upstream.text();
    if (!/^1 /m.test(body)) {
      throw new Error('No valid TLE lines in upstream response');
    }

    memoryCache.set(group, { at: now, body });
    res.setHeader('x-tle-cache', 'MISS');
    return res.status(200).send(body);
  } catch (err) {
    if (entry) {
      res.setHeader('x-tle-cache', 'STALE');
      return res.status(200).send(entry.body);
    }
    res.setHeader('x-tle-cache', 'NONE');
    return res.status(502).send(`celestrak fetch failed for group ${group}`);
  }
}
