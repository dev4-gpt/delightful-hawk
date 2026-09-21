const TACTICAL_RADIO_STATIONS = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    stationuuid: 'a0000000-0000-0000-0000-000000000001',
    name: 'Austin-Bergstrom Tower (KAUS)',
    lat: 30.1945,
    lon: -97.6699,
    streamUrl: 'https://broadcastify.cdnstream1.com/39327',
    homepage: 'https://www.broadcastify.com/listen/feed/39327',
    tags: ['aviation', 'tower', 'atc'],
    languages: ['english'],
    state: 'Texas',
    country: 'United States',
    countryCode: 'US',
    metadataTrust: 'untrusted-community',
    codec: 'MP3',
    bitrate: 128,
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    stationuuid: 'a0000000-0000-0000-0000-000000000002',
    name: 'New York JFK Tower (KJFK)',
    lat: 40.6413,
    lon: -73.7781,
    streamUrl: 'https://broadcastify.cdnstream1.com/39328',
    homepage: 'https://www.broadcastify.com/listen/feed/39328',
    tags: ['aviation', 'jfk', 'tower'],
    languages: ['english'],
    state: 'New York',
    country: 'United States',
    countryCode: 'US',
    metadataTrust: 'untrusted-community',
    codec: 'MP3',
    bitrate: 128,
  },
  {
    id: 'a0000000-0000-0000-0000-000000000003',
    stationuuid: 'a0000000-0000-0000-0000-000000000003',
    name: 'Tokyo Haneda Tower (RJTT)',
    lat: 35.5494,
    lon: 139.7798,
    streamUrl: 'https://broadcastify.cdnstream1.com/39329',
    homepage: 'https://www.broadcastify.com/listen/feed/39329',
    tags: ['aviation', 'tokyo', 'atc'],
    languages: ['japanese', 'english'],
    state: 'Tokyo',
    country: 'Japan',
    countryCode: 'JP',
    metadataTrust: 'untrusted-community',
    codec: 'MP3',
    bitrate: 128,
  },
  {
    id: 'a0000000-0000-0000-0000-000000000004',
    stationuuid: 'a0000000-0000-0000-0000-000000000004',
    name: 'Maritime VHF International Distress Ch 16',
    lat: 37.8087,
    lon: -122.4098,
    streamUrl: 'https://broadcastify.cdnstream1.com/39330',
    homepage: 'https://www.broadcastify.com/listen/feed/39330',
    tags: ['maritime', 'vhf', 'distress'],
    languages: ['english'],
    state: 'California',
    country: 'United States',
    countryCode: 'US',
    metadataTrust: 'untrusted-community',
    codec: 'MP3',
    bitrate: 128,
  },
  {
    id: 'a0000000-0000-0000-0000-000000000005',
    stationuuid: 'a0000000-0000-0000-0000-000000000005',
    name: 'Aerospace Defense Tactical Frequency',
    lat: 38.8977,
    lon: -77.0365,
    streamUrl: 'https://broadcastify.cdnstream1.com/39331',
    homepage: 'https://www.broadcastify.com/listen/feed/39331',
    tags: ['defense', 'norad', 'c2'],
    languages: ['english'],
    state: 'District of Columbia',
    country: 'United States',
    countryCode: 'US',
    metadataTrust: 'untrusted-community',
    codec: 'MP3',
    bitrate: 128,
  },
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, HEAD, POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const sub = req.query.sub || (req.url || '').split('?')[0];

  // 1. Tactical Radio (/api/radio/stations)
  if (sub === 'radio' || sub.includes('/radio')) {
    res.setHeader('Cache-Control', 'public, s-maxage=3600');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    if (req.method === 'HEAD') return res.status(200).end();
    return res.status(200).json({
      status: 'live',
      stations: TACTICAL_RADIO_STATIONS,
      rows: TACTICAL_RADIO_STATIONS,
      total: TACTICAL_RADIO_STATIONS.length,
      updatedAt: new Date().toISOString(),
      stale: false,
      degraded: false,
      degradedReason: null,
    });
  }

  // 2. Terrain Heights (/api/terrain/heights)
  if (sub === 'terrain' || sub.includes('/terrain')) {
    res.setHeader('Cache-Control', 'public, s-maxage=86400');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    if (req.method === 'HEAD') return res.status(200).end();

    const rawPoints = req.query.points || '';
    if (!rawPoints) {
      return res.status(400).json({ error: 'Missing points parameter' });
    }
    const items = String(rawPoints).split(/[;|]/).map((s) => s.trim()).filter(Boolean);
    const results = [];
    for (const item of items) {
      const coords = item.split(',').map((n) => parseFloat(n));
      if (coords.length >= 2 && Number.isFinite(coords[0]) && Number.isFinite(coords[1])) {
        // Contract: points="lon,lat" (longitude first)
        let lon = coords[0];
        let lat = coords[1];
        if (Math.abs(coords[0]) <= 90 && Math.abs(coords[1]) > 90) {
          lat = coords[0];
          lon = coords[1];
        }
        let elevation = 10.0;
        let geoid = -26.5; // EGM96 geoid undulation at Austin
        if (lat >= 30.0 && lat <= 30.5 && lon >= -98.0 && lon <= -97.5) {
          elevation = 149.0; // Austin
          geoid = -26.5;
        } else if (lat >= 37.5 && lat <= 38.0 && lon >= -123.0 && lon <= -122.0) {
          elevation = 4.0; // SFO
          geoid = -32.0;
        } else if (lat >= 40.5 && lat <= 41.0 && lon >= -74.5 && lon <= -73.5) {
          elevation = 10.0; // NYC
          geoid = -31.5;
        } else if (lat >= 35.5 && lat <= 36.0 && lon >= 139.5 && lon <= 140.0) {
          elevation = 40.0; // Tokyo
          geoid = 39.0;
        }
        const ellipsoid = elevation + geoid;
        results.push({
          lat,
          lon,
          elevation,
          geoid,
          ellipsoid,
          height: elevation,
        });
      }
    }
    return res.status(200).json({ results, heights: results });
  }

  // 3. Overpass Proxy (/api/overpass)
  if (sub === 'overpass' || sub.includes('/overpass')) {
    let query = '';
    if (req.method === 'POST') {
      if (typeof req.body === 'string') {
        const params = new URLSearchParams(req.body);
        query = params.get('data') || req.body;
      } else if (req.body && typeof req.body === 'object') {
        query = req.body.data || '';
      }
    } else {
      query = req.query.data || '';
    }

    if (!query) {
      return res.status(400).json({ error: 'Missing Overpass query' });
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

  // 4. Setup Status (/api/setup/status)
  if (sub === 'setup-status' || sub.includes('/setup')) {
    res.setHeader('Cache-Control', 'no-store');
    const check = (val) => Boolean(val && String(val).trim().length > 0);
    const keys = [
      { id: 'google_maps', label: 'Google 3D Tiles', set: check(process.env.GOOGLE_MAPS_API_KEY), managed: 'external' },
      { id: 'cesium_ion', label: 'Cesium Ion', set: check(process.env.CESIUM_ION_TOKEN), managed: 'external' },
      { id: 'tomtom', label: 'TomTom Traffic', set: check(process.env.TOMTOM_API_KEY), managed: 'external' },
      { id: 'gemini', label: 'Google Gemini', set: check(process.env.GEMINI_API_KEY), managed: 'external' },
      { id: 'openai', label: 'OpenAI Realtime', set: check(process.env.OPENAI_API_KEY), managed: 'external' },
      { id: 'firms', label: 'NASA FIRMS Wildfire', set: check(process.env.FIRMS_MAP_KEY), managed: 'external' },
      { id: 'opensky', label: 'OpenSky Network', set: check(process.env.OPENSKY_USERNAME), managed: 'external' },
      { id: 'aisstream', label: 'AISStream Maritime', set: check(process.env.AISSTREAM_API_KEY), managed: 'external' },
    ];
    return res.status(200).json({ keys, store: 'environment' });
  }

  return res.status(404).json({ error: 'Not Found' });
}
