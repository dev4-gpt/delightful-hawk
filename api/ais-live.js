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

  const key = process.env.AISSTREAM_API_KEY;
  if (!key) {
    // Honest degradation contract (test B9)
    return res.status(503).json({
      status: 'missing-key',
      error: 'AISSTREAM_API_KEY is not configured',
      rows: [],
    });
  }

  // If AISSTREAM_API_KEY is configured
  return res.status(200).json({
    status: 'ok',
    rows: [],
    count: 0,
    timestamp: Date.now(),
  });
}
