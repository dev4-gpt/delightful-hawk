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

  const slug = req.query.slug || [];
  let z, x, y;
  if (Array.isArray(slug) && slug.length >= 3) {
    z = slug[0];
    x = slug[1];
    y = slug[2].replace(/\.pbf$/i, '');
  } else {
    const m = String(req.url || '').match(/\/flow\/(\d+)\/(\d+)\/(\d+)(\.pbf)?/i);
    if (m) {
      z = m[1];
      x = m[2];
      y = m[3];
    }
  }

  if (!z || !x || !y) {
    return res.status(400).json({ error: 'invalid_tile_coordinates' });
  }

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
