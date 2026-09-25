export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sub = req.query.sub || (req.url || '').split('?')[0].replace(/^\/api\/tomtom\/?/, '');
  const apiKey = (process.env.TOMTOM_API_KEY || '').trim();

  // 1. Status (/api/tomtom/status)
  if (sub === 'status' || sub.startsWith('status')) {
    res.setHeader('Cache-Control', 'no-store');
    const hasKey = Boolean(apiKey);
    const rawBudget = Number.parseInt(process.env.TOMTOM_DAILY_TILE_BUDGET || '', 10);
    const budget = Number.isFinite(rawBudget) && rawBudget > 0 ? rawBudget : 40000;

    return res.status(200).json({
      hasKey,
      dailyCount: 0,
      budget,
      date: new Date().toISOString().slice(0, 10),
      provider: hasKey ? 'TomTom Live Flow' : 'Simulation Mode',
    });
  }

  // 2. Flow Tiles (/api/tomtom/flow/:z/:x/:y.pbf)
  if (sub === 'flow' || sub.startsWith('flow')) {
    if (!apiKey) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(503).json({ error: 'no_key', message: 'TOMTOM_API_KEY not configured' });
    }

    const rawUrl = String(req.url || '');
    const m = rawUrl.match(/\/flow\/(\d+)\/(\d+)\/(\d+)/i)
      || rawUrl.match(/(\d+)\/(\d+)\/(\d+)/i)
      || [null, req.query.z, req.query.x, req.query.y];

    if (!m || !m[1] || !m[2] || !m[3]) {
      return res.status(400).json({ error: 'invalid_tile_coordinates', url: rawUrl });
    }

    const [, z, x, y] = m;
    const cleanY = String(y).replace(/\.pbf$/, '');
    const upstreamUrl = `https://api.tomtom.com/traffic/map/4/tile/flow/relative/${z}/${x}/${cleanY}.pbf?key=${encodeURIComponent(apiKey)}`;

    try {
      const upstream = await fetch(upstreamUrl, { signal: AbortSignal.timeout(10000) });
      if (!upstream.ok) {
        return res.status(upstream.status).json({ error: 'upstream_error', status: upstream.status });
      }
      const buffer = Buffer.from(await upstream.arrayBuffer());
      res.setHeader('Content-Type', 'application/x-protobuf');
      res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300');
      return res.status(200).send(buffer);
    } catch (err) {
      return res.status(502).json({ error: 'upstream_timeout' });
    }
  }

  // 3. Incidents (/api/tomtom/incidents)
  if (sub === 'incidents' || sub.startsWith('incidents')) {
    res.setHeader('Cache-Control', 'public, s-maxage=60');
    return res.status(200).json({ incidents: [] });
  }

  return res.status(404).json({ error: 'Not Found' });
}
