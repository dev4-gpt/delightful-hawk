import cctvHandler from '../api/cctv.js';
import satellitesHandler from '../api/satellites.js';
import firmsHandler from '../api/firms.js';
import maritimeHandler from '../api/maritime.js';
import flightsHandler from '../api/flights.js';
import spatialHandler from '../api/spatial.js';
import aiHandler from '../api/ai.js';

function mockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(k, v) { res.headers[k.toLowerCase()] = v; },
    status(code) { res.statusCode = code; return res; },
    json(obj) { res.body = obj; res.setHeader('content-type', 'application/json'); return res; },
    send(data) { res.body = data; return res; },
    end(data) { if (data) res.body = data; return res; },
    writeHead(code, headers) { res.statusCode = code; Object.assign(res.headers, headers); return res; },
    redirect(code, url) { res.statusCode = code; res.setHeader('location', url); return res; }
  };
  return res;
}

async function runTests() {
  console.log('--- Testing API Handlers Locally ---');

  // 1. CCTV Sources
  {
    const res = mockRes();
    await cctvHandler({ method: 'GET', query: { sub: 'sources' }, url: '/api/cctv?sub=sources' }, res);
    console.log('cctv/sources:', res.statusCode, 'count:', res.body?.sources?.length);
    if (res.statusCode !== 200 || !res.body?.sources?.length) throw new Error('cctv/sources failed');
  }

  // 2. CCTV Health
  {
    const res = mockRes();
    await cctvHandler({ method: 'GET', query: { sub: 'health' }, url: '/api/cctv?sub=health' }, res);
    console.log('cctv/health:', res.statusCode, 'count:', res.body?.cameras?.length);
    if (res.statusCode !== 200 || !res.body?.cameras?.length) throw new Error('cctv/health failed');
  }

  // 3. CCTV Frame
  {
    const res = mockRes();
    await cctvHandler({ method: 'GET', query: { sub: 'frame', id: 'austin-congress-s' }, url: '/api/cctv?sub=frame&id=austin-congress-s' }, res);
    console.log('cctv/frame:', res.statusCode, 'ct:', res.headers['content-type'], 'bytes:', res.body?.length);
    if (res.statusCode !== 200 || !res.body?.length || res.body.length < 512) throw new Error('cctv/frame failed');
  }

  // 4. CelesTrak Stations
  {
    const res = mockRes();
    await satellitesHandler({ method: 'GET', query: { group: 'stations' }, url: '/api/satellites?group=stations' }, res);
    const lines = typeof res.body === 'string' ? res.body.trim().split('\n') : [];
    console.log('celestrak/stations:', res.statusCode, 'lines:', lines.length, 'cache:', res.headers['x-tle-cache']);
    if (res.statusCode !== 200 || lines.length < 3) throw new Error('celestrak/stations failed');
  }

  // 5. FIRMS Status (keyless)
  {
    const res = mockRes();
    await firmsHandler({ method: 'GET', query: { sub: 'status' }, url: '/api/firms?sub=status' }, res);
    console.log('firms/status:', res.statusCode, 'hasKey:', res.body?.hasKey);
    if (res.statusCode !== 200 || typeof res.body?.hasKey !== 'boolean') throw new Error('firms/status failed');
  }

  // 6. FIRMS Data (honest 503 when no key)
  {
    const res = mockRes();
    delete process.env.FIRMS_MAP_KEY;
    await firmsHandler({ method: 'GET', query: {}, url: '/api/firms' }, res);
    console.log('firms (keyless):', res.statusCode, 'error:', res.body?.error);
    if (res.statusCode !== 503 || res.body?.error !== 'no_key') throw new Error('firms honest degradation failed');
  }

  // 7. AIS Live (honest 503 when no key)
  {
    const res = mockRes();
    delete process.env.AISSTREAM_API_KEY;
    await maritimeHandler({ method: 'GET', query: {}, url: '/api/maritime' }, res);
    console.log('ais-live (keyless):', res.statusCode, 'status:', res.body?.status);
    if (res.statusCode !== 503 || res.body?.status !== 'missing-key') throw new Error('ais honest degradation failed');
  }

  // 8. OpenSky
  {
    const res = mockRes();
    await flightsHandler({ method: 'GET', query: { mode: 'opensky', lamin: 24, lomin: -125, lamax: 50, lomax: -66 }, url: '/api/flights?mode=opensky' }, res);
    const parsed = typeof res.body === 'string' ? JSON.parse(res.body) : res.body;
    console.log('opensky:', res.statusCode, 'states:', parsed?.states?.length, 'auth:', res.headers['x-opensky-auth-mode-used']);
    if (res.statusCode !== 200 || !parsed?.states?.length) throw new Error('opensky failed');
  }

  // 9. Radio
  {
    const res = mockRes();
    await spatialHandler({ method: 'GET', query: { sub: 'radio' }, url: '/api/spatial?sub=radio' }, res);
    console.log('radio/stations:', res.statusCode, 'stations:', res.body?.stations?.length);
    if (res.statusCode !== 200 || !res.body?.stations?.length) throw new Error('radio failed');
  }

  // 10. Terrain Heights
  {
    const res = mockRes();
    await spatialHandler({ method: 'GET', query: { sub: 'terrain', points: '-97.7431,30.2672' }, url: '/api/spatial?sub=terrain&points=-97.7431,30.2672' }, res);
    const first = res.body?.results?.[0];
    console.log('terrain/heights:', res.statusCode, 'elev:', first?.elevation, 'geoid:', first?.geoid, 'ellip:', first?.ellipsoid);
    if (res.statusCode !== 200 || !Number.isFinite(first?.elevation) || !Number.isFinite(first?.geoid)) throw new Error('terrain/heights failed');
  }

  // 11. Realtime Token (honest 503 when no key)
  {
    const res = mockRes();
    const oldKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    await aiHandler({ method: 'POST', query: { sub: 'realtime-token' }, url: '/api/ai?sub=realtime-token' }, res);
    console.log('realtime/token (keyless):', res.statusCode, 'error:', res.body?.error);
    if (res.statusCode !== 503 || !/OPENAI_API_KEY is not set/.test(JSON.stringify(res.body))) throw new Error('realtime token honest degradation failed');
    if (oldKey) process.env.OPENAI_API_KEY = oldKey;
  }

  console.log('✔ All consolidated API handler unit tests PASSED cleanly!');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});

