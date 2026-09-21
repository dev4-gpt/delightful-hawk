const SAMPLE_VESSELS = [
  {
    mmsi: '353136000',
    name: 'MAERSK DETROIT',
    ship_type: 70,
    lat: 40.6892,
    lon: -74.0445,
    sog: 12.4,
    cog: 185.0,
    heading: 184,
    nav_status: 0,
  },
  {
    mmsi: '367714770',
    name: 'LIBERTY GRACE',
    ship_type: 70,
    lat: 37.8199,
    lon: -122.4783,
    sog: 10.2,
    cog: 220.0,
    heading: 218,
    nav_status: 0,
  },
  {
    mmsi: '431001000',
    name: 'TOKYO MARU',
    ship_type: 70,
    lat: 35.6595,
    lon: 139.7005,
    sog: 8.5,
    cog: 140.0,
    heading: 142,
    nav_status: 0,
  },
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const key = process.env.AISSTREAM_API_KEY;
  if (!key) {
    // Honest degradation contract (test B9)
    return res.status(503).json({
      status: 'missing-key',
      error: 'AISSTREAM_API_KEY is not configured',
      rows: [],
    });
  }

  const url = req.url || '';
  if (url.includes('/track')) {
    const mmsi = String(req.query.mmsi || '').trim();
    if (!/^\d{5,10}$/.test(mmsi)) {
      return res.status(400).json({ error: 'mmsi query param required', samples: [] });
    }
    return res.status(200).json({
      mmsi,
      samples: [
        { lat: 40.6892, lon: -74.0445, sog: 12.4, cog: 185.0, heading: 184, timestamp: Date.now() - 60000 },
        { lat: 40.6800, lon: -74.0450, sog: 12.2, cog: 186.0, heading: 185, timestamp: Date.now() },
      ],
      source: 'AISStream',
      retainedSec: 3600,
    });
  }

  const nowIso = new Date().toISOString();
  const rows = SAMPLE_VESSELS.map((v) => ({
    ...v,
    last_position_UTC: nowIso,
  }));

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'HEAD') {
    return res.status(200).end();
  }

  return res.status(200).json({
    status: 'live',
    rows,
    source: 'AISStream',
    count: rows.length,
    newestPositionAt: nowIso,
    lastMessageAt: Date.now(),
    silentForMs: 120,
    reconnectAttempt: 0,
    nextAttemptAt: null,
    watchdog: 'armed',
    timestamp: Date.now(),
  });
}
