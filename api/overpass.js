export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let query = '';
  if (req.method === 'POST') {
    if (typeof req.body === 'string') {
      const params = new URLSearchParams(req.body);
      query = params.get('data') || req.body;
    } else if (req.body && typeof req.body === 'object') {
      query = req.body.data || '';
    }
  } else if (req.method === 'GET') {
    query = req.query.data || '';
  }

  if (!query) {
    return res.status(400).json({ error: 'Missing Overpass query (data param)' });
  }

  try {
    const upstream = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'gods-eye-view-overpass-proxy/1.0',
      },
      body: new URLSearchParams({ data: query }).toString(),
      signal: AbortSignal.timeout(25000),
    });

    if (!upstream.ok) {
      return res.status(502).json({ error: `Overpass upstream returned HTTP ${upstream.status}` });
    }

    const json = await upstream.json();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, s-maxage=300');
    return res.status(200).json(json);
  } catch (err) {
    return res.status(502).json({ error: err?.message || 'Overpass fetch failed' });
  }
}
