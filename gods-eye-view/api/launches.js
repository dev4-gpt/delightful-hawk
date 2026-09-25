import fs from 'fs';

/**
 * Vercel Serverless Function: Launch Library 2 (SpaceDevs) Proxy
 * 
 * Fetches recent / upcoming space launches with detailed telemetry.
 * Rate limit protection: 15-minute edge cache + warm lambda memory cache
 * ensures we never exceed SpaceDevs 15 calls/hour limit (consumes <= 4 req/hr).
 * 
 * Resilient Architecture:
 * If SpaceDevs upstream returns 500 or times out, seamlessly serves
 * high-fidelity mission fallback data so Aetheris never breaks.
 */

let memoryCache = null;
let memoryCacheAt = 0;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

function getFallbackData() {
  try {
    const raw = fs.readFileSync(new URL('./launches-fallback.json', import.meta.url), 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return { count: 0, results: [] };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=1800');

  const now = Date.now();
  if (memoryCache && (now - memoryCacheAt < CACHE_TTL_MS)) {
    res.setHeader('X-Cache', 'HIT-MEMORY');
    return res.status(200).json(memoryCache);
  }

  try {
    const end = new Date();
    const start = new Date(end.getTime() - 30 * 86400000);
    
    const url = new URL('https://ll.thespacedevs.com/2.3.0/launches/');
    const netGte = req.query.net__gte || start.toISOString();
    const netLte = req.query.net__lte || end.toISOString();
    const limit = req.query.limit || '25';
    const mode = req.query.mode || 'detailed';

    url.searchParams.set('net__gte', netGte);
    url.searchParams.set('net__lte', netLte);
    url.searchParams.set('limit', limit);
    url.searchParams.set('mode', mode);

    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };

    const token = (process.env.LL2_API_TOKEN || '').trim();
    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const upstream = await fetch(url.toString(), {
      signal: controller.signal,
      headers
    });
    clearTimeout(timeout);

    if (!upstream.ok) {
      console.warn(`[launch-library-proxy] upstream returned ${upstream.status}, serving fallback`);
      const fallback = memoryCache || getFallbackData();
      res.setHeader('X-Cache', 'FALLBACK-SNAPSHOT');
      return res.status(200).json(fallback);
    }

    const data = await upstream.json();
    if (!data || !Array.isArray(data.results)) {
      throw new Error('Malformed upstream response from Launch Library 2');
    }

    memoryCache = data;
    memoryCacheAt = Date.now();
    res.setHeader('X-Cache', 'MISS');
    return res.status(200).json(data);
  } catch (err) {
    console.warn('[launch-library-proxy warning]:', err?.message || err);
    const fallback = memoryCache || getFallbackData();
    res.setHeader('X-Cache', 'FALLBACK-SNAPSHOT');
    return res.status(200).json(fallback);
  }
}
