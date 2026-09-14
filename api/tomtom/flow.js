/**
 * Vercel Serverless Function: TomTom Traffic Flow Tile Proxy
 * 
 * Routes: /api/tomtom/flow/:z/:x/:y.pbf
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const apiKey = (process.env.TOMTOM_API_KEY || '').trim();
  if (!apiKey) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({ error: 'no_key', message: 'TOMTOM_API_KEY not configured' });
  }

  const rawUrl = String(req.url || '');
  const m = rawUrl.match(/\/flow\/(\d+)\/(\d+)\/(\d+)/i) || rawUrl.match(/(\d+)\/(\d+)\/(\d+)/i);
  if (!m) {
    return res.status(400).json({ error: 'invalid_tile_coordinates', url: rawUrl });
  }

  const [, z, x, y] = m;
  const upstreamUrl = `https://api.tomtom.com/traffic/map/4/tile/flow/relative/${z}/${x}/${y}.pbf?key=${encodeURIComponent(apiKey)}`;

  try {
    const upstream = await fetch(upstreamUrl, {
      signal: AbortSignal.timeout(10000)
    });

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: 'upstream_error', status: upstream.status });
    }

    const buffer = Buffer.from(await upstream.arrayBuffer());
    res.setHeader('Content-Type', 'application/x-protobuf');
    res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300');
    return res.status(200).send(buffer);
  } catch (err) {
    console.error('[tomtom-flow proxy error]:', err?.message || err);
    return res.status(502).json({ error: 'upstream_timeout' });
  }
}
