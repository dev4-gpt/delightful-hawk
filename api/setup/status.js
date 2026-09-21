export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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

  return res.status(200).json({
    keys,
    store: 'environment',
  });
}
