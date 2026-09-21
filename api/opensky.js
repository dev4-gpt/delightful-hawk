/**
 * Vercel Serverless Function: OpenSky Flight Tracking Proxy
 * 
 * Proxies live commercial flight states. If OpenSky is rate-limited (HTTP 429)
 * or credentials are not configured, seamlessly falls back to public ADS-B
 * telemetry so live aircraft are always visible on the globe.
 */

let cacheBody = null;
let cacheAt = 0;
const CACHE_TTL_MS = 10000; // 10s

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('X-OpenSky-Auth-Mode-Used', 'anon');
  res.setHeader('X-OpenSky-Auth-Reason', 'missing_basic_creds');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const now = Date.now();
  if (cacheBody && (now - cacheAt < CACHE_TTL_MS)) {
    res.setHeader('X-OpenSky-Cache', 'HIT');
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(cacheBody);
  }

  const { lamin, lomin, lamax, lomax } = req.query;

  // 1. Try OpenSky directly if params or general query
  try {
    const url = new URL('https://opensky-network.org/api/states/all');
    if (lamin && lomin && lamax && lomax) {
      url.searchParams.set('lamin', lamin);
      url.searchParams.set('lomin', lomin);
      url.searchParams.set('lamax', lamax);
      url.searchParams.set('lomax', lomax);
    }

    const upstream = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'gods-eye-view-opensky-proxy/1.0',
      },
      signal: AbortSignal.timeout(12000),
    });

    if (upstream.ok) {
      const data = await upstream.json();
      if (Array.isArray(data?.states) && data.states.length > 0) {
        cacheBody = JSON.stringify(data);
        cacheAt = now;
        res.setHeader('X-OpenSky-Cache', 'MISS');
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(cacheBody);
      }
    }
  } catch {
    // OpenSky failed or timed out — fallback to adsb.lol
  }

  // 2. High-availability Fallback: ADS-B Lol live aircraft feed
  try {
    const adsbResp = await fetch('https://api.adsb.lol/v2/mil', {
      headers: { 'User-Agent': 'gods-eye-view-opensky-proxy/1.0' },
      signal: AbortSignal.timeout(10000),
    });
    if (adsbResp.ok) {
      const payload = await adsbResp.json();
      const acList = Array.isArray(payload?.ac) ? payload.ac : [];
      const states = [];

      for (const ac of acList) {
        if (!Number.isFinite(ac.lat) || !Number.isFinite(ac.lon)) continue;
        const altM = typeof ac.alt_baro === 'number' ? ac.alt_baro * 0.3048 : 3000;
        const speedMs = typeof ac.gs === 'number' ? ac.gs * 0.5144 : 200;
        const heading = Number.isFinite(ac.true_heading) ? ac.true_heading : (ac.mag_heading || 0);

        states.push([
          ac.hex || 'unknown',
          (ac.flight || ac.r || 'FLIGHT').trim(),
          'United States',
          Math.floor(now / 1000),
          Math.floor(now / 1000),
          ac.lon,
          ac.lat,
          altM,
          ac.alt_baro === 'ground',
          speedMs,
          heading,
          0,
          null,
          altM,
          ac.squawk || null,
          false,
          0,
        ]);
      }

      if (states.length > 0) {
        const result = { time: Math.floor(now / 1000), states };
        cacheBody = JSON.stringify(result);
        cacheAt = now;
        res.setHeader('X-OpenSky-Cache', 'FALLBACK-ADSB');
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(cacheBody);
      }
    }
  } catch {
    // Both failed
  }

  // If cache exists, serve stale
  if (cacheBody) {
    res.setHeader('X-OpenSky-Cache', 'STALE');
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(cacheBody);
  }

  return res.status(200).json({ time: Math.floor(now / 1000), states: [] });
}
