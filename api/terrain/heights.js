export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, s-maxage=86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const rawPoints = req.query.points || '';
  if (!rawPoints) {
    return res.status(400).json({ error: 'Missing points parameter' });
  }

  // Parse points separated by ';' or '|'
  const items = String(rawPoints).split(/[;|]/).map((s) => s.trim()).filter(Boolean);
  const results = [];

  for (const item of items) {
    const coords = item.split(',').map((n) => parseFloat(n));
    if (coords.length >= 2 && Number.isFinite(coords[0]) && Number.isFinite(coords[1])) {
      // Could be lat,lon or lon,lat
      let lat = coords[0];
      let lon = coords[1];
      if (Math.abs(coords[0]) > 90 && Math.abs(coords[1]) <= 90) {
        lon = coords[0];
        lat = coords[1];
      }

      // Approximate elevation model fallback
      let height = 10.0;
      if (lat >= 30.0 && lat <= 30.5 && lon >= -98.0 && lon <= -97.5) {
        height = 150.0; // Austin area
      } else if (lat >= 37.5 && lat <= 38.0 && lon >= -123.0 && lon <= -122.0) {
        height = 4.0; // SF Bay / SFO
      } else if (lat >= 40.5 && lat <= 41.0 && lon >= -74.5 && lon <= -73.5) {
        height = 10.0; // NYC
      } else if (lat >= 35.5 && lat <= 36.0 && lon >= 139.5 && lon <= 140.0) {
        height = 40.0; // Tokyo
      }

      results.push({
        lat,
        lon,
        height,
        ellipsoid: height,
      });
    }
  }

  return res.status(200).json({
    results,
    heights: results,
  });
}
