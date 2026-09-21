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

  const key = process.env.FIRMS_MAP_KEY;
  if (!key) {
    // Honest degradation contract (test B7)
    return res.status(503).json({ error: 'no_key' });
  }

  try {
    const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${encodeURIComponent(key)}/VIIRS_SNPP_NRT/world/1`;
    const upstream = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!upstream.ok) {
      return res.status(502).json({ error: `FIRMS upstream returned HTTP ${upstream.status}` });
    }
    const csv = await upstream.text();
    const lines = csv.trim().split('\n');
    const header = lines[0]?.split(',') || [];
    const fires = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length >= 3) {
        fires.push({
          lat: parseFloat(parts[0]),
          lon: parseFloat(parts[1]),
          bright_ti4: parseFloat(parts[2]),
        });
      }
    }

    res.setHeader('Cache-Control', 'public, s-maxage=3600');
    return res.status(200).json({
      fetchedAt: Date.now(),
      stale: false,
      ttlMs: 3600000,
      sources: ['VIIRS_SNPP_NRT'],
      count: fires.length,
      fires,
    });
  } catch (err) {
    return res.status(502).json({ error: err?.message || 'FIRMS fetch failed' });
  }
}
