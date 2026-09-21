let cachedBody = null;
let cachedAt = 0;
const TTL_MS = 60 * 60 * 1000; // 1 hour

const FALLBACK_STATIONS_TLE = `ISS (ZARYA)             
1 25544U 98067A   26263.78762384  .00007766  00000+0  14793-3 0  9996
2 25544  51.6308 186.9475 0004819 163.3027 196.8121 15.49200337586572
CSS (TIANHE)            
1 48274U 21035A   26263.92234256  .00013769  00000+0  16837-3 0  9991
2 48274  41.4679 100.7142 0002502 293.6963  66.3613 15.60143111308111
POISK                   
1 36086U 09060A   26263.78762384  .00007766  00000+0  14793-3 0  9994
2 36086  51.6308 186.9475 0004819 163.3027 196.8121 15.49200337586946`;

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

  const now = Date.now();
  if (cachedBody && (now - cachedAt < TTL_MS)) {
    res.setHeader('x-tle-cache', 'HIT');
    return res.status(200).send(cachedBody);
  }

  try {
    const upstream = await fetch('https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle', {
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

    cachedBody = body;
    cachedAt = now;
    res.setHeader('x-tle-cache', 'MISS');
    return res.status(200).send(body);
  } catch (err) {
    if (cachedBody) {
      res.setHeader('x-tle-cache', 'STALE');
      return res.status(200).send(cachedBody);
    }
    res.setHeader('x-tle-cache', 'FALLBACK');
    return res.status(200).send(FALLBACK_STATIONS_TLE);
  }
}
