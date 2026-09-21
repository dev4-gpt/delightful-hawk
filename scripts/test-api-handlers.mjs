import sourcesHandler from '../api/cctv/sources.js';
import healthHandler from '../api/cctv/health.js';
import frameHandler from '../api/cctv/frame.js';
import celestrakHandler from '../api/celestrak/stations.js';
import firmsStatusHandler from '../api/firms/status.js';
import firmsHandler from '../api/firms.js';
import aisHandler from '../api/ais-live.js';
import openskyHandler from '../api/opensky.js';
import radioHandler from '../api/radio.js';
import heightsHandler from '../api/terrain/heights.js';
import realtimeTokenHandler from '../api/realtime/token.js';

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
    await sourcesHandler({ method: 'GET' }, res);
    console.log('cctv/sources:', res.statusCode, 'count:', res.body?.sources?.length);
    if (res.statusCode !== 200 || !res.body?.sources?.length) throw new Error('cctv/sources failed');
  }

  // 2. CCTV Health
  {
    const res = mockRes();
    await healthHandler({ method: 'GET' }, res);
    console.log('cctv/health:', res.statusCode, 'count:', res.body?.cameras?.length);
    if (res.statusCode !== 200 || !res.body?.cameras?.length) throw new Error('cctv/health failed');
  }

  // 3. CCTV Frame
  {
    const res = mockRes();
    await frameHandler({ method: 'GET', query: { id: 'austin-congress-s' } }, res);
    console.log('cctv/frame:', res.statusCode, 'ct:', res.headers['content-type'], 'bytes:', res.body?.length);
    if (res.statusCode !== 200 || !res.body?.length || res.body.length < 512) throw new Error('cctv/frame failed');
  }

  // 4. CelesTrak Stations
  {
    const res = mockRes();
    await celestrakHandler({ method: 'GET' }, res);
    const lines = typeof res.body === 'string' ? res.body.trim().split('\n') : [];
    console.log('celestrak/stations:', res.statusCode, 'lines:', lines.length, 'cache:', res.headers['x-tle-cache']);
    if (res.statusCode !== 200 || lines.length < 3) throw new Error('celestrak/stations failed');
  }

  // 5. FIRMS Status (keyless)
  {
    const res = mockRes();
    await firmsStatusHandler({ method: 'GET' }, res);
    console.log('firms/status:', res.statusCode, 'hasKey:', res.body?.hasKey);
    if (res.statusCode !== 200 || typeof res.body?.hasKey !== 'boolean') throw new Error('firms/status failed');
  }

  // 6. FIRMS Data (honest 503 when no key)
  {
    const res = mockRes();
    delete process.env.FIRMS_MAP_KEY;
    await firmsHandler({ method: 'GET' }, res);
    console.log('firms (keyless):', res.statusCode, 'error:', res.body?.error);
    if (res.statusCode !== 503 || res.body?.error !== 'no_key') throw new Error('firms honest degradation failed');
  }

  // 7. AIS Live (honest 503 when no key)
  {
    const res = mockRes();
    delete process.env.AISSTREAM_API_KEY;
    await aisHandler({ method: 'GET' }, res);
    console.log('ais-live (keyless):', res.statusCode, 'status:', res.body?.status);
    if (res.statusCode !== 503 || res.body?.status !== 'missing-key') throw new Error('ais honest degradation failed');
  }

  // 8. OpenSky
  {
    const res = mockRes();
    await openskyHandler({ method: 'GET', query: { lamin: 24, lomin: -125, lamax: 50, lomax: -66 } }, res);
    const parsed = typeof res.body === 'string' ? JSON.parse(res.body) : res.body;
    console.log('opensky:', res.statusCode, 'states:', parsed?.states?.length, 'auth:', res.headers['x-opensky-auth-mode-used']);
    if (res.statusCode !== 200 || !parsed?.states) throw new Error('opensky failed');
  }

  // 9. Radio
  {
    const res = mockRes();
    await radioHandler({ method: 'GET' }, res);
    console.log('radio/stations:', res.statusCode, 'rows:', res.body?.rows?.length);
    if (res.statusCode !== 200 || !res.body?.rows?.length) throw new Error('radio failed');
  }

  // 10. Terrain Heights
  {
    const res = mockRes();
    await heightsHandler({ method: 'GET', query: { points: '30.2747,-97.7404|37.6189,-122.3750' } }, res);
    console.log('terrain/heights:', res.statusCode, 'results:', res.body?.heights?.length);
    if (res.statusCode !== 200 || res.body?.heights?.length !== 2) throw new Error('terrain/heights failed');
  }

  // 11. Realtime Token (honest 503 when no key)
  {
    const res = mockRes();
    const oldKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    await realtimeTokenHandler({ method: 'POST' }, res);
    console.log('realtime/token (keyless):', res.statusCode, 'error:', res.body?.error);
    if (res.statusCode !== 503 || !/OPENAI_API_KEY is not set/.test(JSON.stringify(res.body))) throw new Error('realtime token honest degradation failed');
    if (oldKey) process.env.OPENAI_API_KEY = oldKey;
  }

  console.log('✔ All API handler unit tests PASSED cleanly!');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
