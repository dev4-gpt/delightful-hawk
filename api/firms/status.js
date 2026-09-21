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

  const key = process.env.FIRMS_MAP_KEY;
  if (!key) {
    return res.status(200).json({
      hasKey: false,
      lastFetch: null,
      count: null,
      stale: false,
      ttlMs: 3600000,
      transactions: null,
    });
  }

  try {
    const url = `https://firms.modaps.eosdis.nasa.gov/mapserver/mapkey_status/?MAP_KEY=${encodeURIComponent(key)}`;
    const upstream = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!upstream.ok) {
      return res.status(200).json({
        hasKey: true,
        lastFetch: Date.now(),
        count: 0,
        stale: false,
        ttlMs: 3600000,
        transactions: null,
      });
    }
    const data = await upstream.json();
    return res.status(200).json({
      hasKey: true,
      lastFetch: Date.now(),
      count: 0,
      stale: false,
      ttlMs: 3600000,
      transactions: {
        used: Number(data?.current_transactions || 0),
        limit: Number(data?.transaction_limit || 5000),
      },
    });
  } catch {
    return res.status(200).json({
      hasKey: true,
      lastFetch: null,
      count: null,
      stale: false,
      ttlMs: 3600000,
      transactions: null,
    });
  }
}
