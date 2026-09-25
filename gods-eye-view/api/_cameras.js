/**
 * Shared CCTV camera catalog and helper utilities for Vercel serverless routes.
 * (Prefixed with _ so Vercel does not count it as a serverless function)
 */

export const CCTV_CATALOG = [
  // Austin, TX - Municipal Open Data Feeds
  {
    id: 'austin-congress-s',
    name: 'Congress Avenue Southbound @ Capitol',
    city: 'Austin',
    cityId: 'austin',
    provider: 'Austin Transportation & Public Works',
    lat: 30.2747,
    lon: -97.7404,
    headingDeg: 180,
    headingConfidence: 'high',
    pitchDeg: -22,
    fovDeg: 74,
    rangeM: 760,
    mountHeightM: 25,
    groundElevationM: 150,
    feedType: 'image',
    sourceKind: 'live-snapshot',
    poseSource: 'catalog',
    license: 'City of Austin Open Data',
    url: 'https://cctv.austinmobility.io/image/1.jpg',
    snapshotUrl: '/cctv/austin_capitol.jpg',
  },
  {
    id: 'austin-downtown-west',
    name: 'Downtown West @ Frost Bank Tower',
    city: 'Austin',
    cityId: 'austin',
    provider: 'Austin Transportation & Public Works',
    lat: 30.2674,
    lon: -97.7434,
    headingDeg: 35,
    headingConfidence: 'high',
    pitchDeg: -20,
    fovDeg: 69,
    rangeM: 700,
    mountHeightM: 30,
    groundElevationM: 150,
    feedType: 'image',
    sourceKind: 'live-snapshot',
    poseSource: 'catalog',
    license: 'City of Austin Open Data',
    url: 'https://cctv.austinmobility.io/image/2.jpg',
    snapshotUrl: 'https://cctv.austinmobility.io/image/2.jpg',
  },
  {
    id: 'austin-pennybacker-bridge',
    name: 'Pennybacker Bridge / Loop 360',
    city: 'Austin',
    cityId: 'austin',
    provider: 'Austin Transportation & Public Works',
    lat: 30.3451,
    lon: -97.7951,
    headingDeg: 90,
    headingConfidence: 'high',
    pitchDeg: -25,
    fovDeg: 65,
    rangeM: 800,
    mountHeightM: 35,
    groundElevationM: 180,
    feedType: 'image',
    sourceKind: 'live-snapshot',
    poseSource: 'catalog',
    license: 'City of Austin Open Data',
    url: 'https://cctv.austinmobility.io/image/3.jpg',
    snapshotUrl: 'https://cctv.austinmobility.io/image/3.jpg',
  },

  // New York, NY - Verified 24/7 Live Stream + Simulation Loop
  {
    id: 'nyc-times-square',
    name: 'Times Square Central Canyon 4K',
    city: 'New York',
    cityId: 'nyc',
    provider: 'EarthCam 24/7 Live Stream',
    lat: 40.7580,
    lon: -73.9855,
    headingDeg: 218,
    headingConfidence: 'high',
    pitchDeg: -18,
    fovDeg: 72,
    rangeM: 640,
    mountHeightM: 28,
    groundElevationM: 15,
    feedType: 'youtube',
    youtubeId: 'JQ_jwk_7OVE',
    sourceKind: 'live-stream',
    poseSource: 'catalog',
    license: 'EarthCam Public 24/7 Live Stream',
    url: 'https://www.youtube.com/watch?v=JQ_jwk_7OVE',
    snapshotUrl: '/cctv/nyc_times_square.jpg',
  },
  {
    id: 'nyc-harbor-1',
    name: 'New York Harbor Entrance Cam',
    city: 'New York',
    cityId: 'nyc',
    provider: 'Port Authority Maritime Watch',
    lat: 40.6892,
    lon: -74.0445,
    headingDeg: 45,
    headingConfidence: 'high',
    pitchDeg: -15,
    fovDeg: 70,
    rangeM: 650,
    mountHeightM: 35,
    groundElevationM: 10,
    feedType: 'mp4',
    sourceKind: 'simulation',
    poseSource: 'catalog',
    license: 'Operational Port Security Feed (Simulation)',
    url: '/cctv/nyc_harbor.mp4',
    snapshotUrl: '/cctv/nyc_harbor.jpg',
  },
  {
    id: 'nyc-wtc-plaza',
    name: 'One World Trade Center Plaza',
    city: 'New York',
    cityId: 'nyc',
    provider: 'Lower Manhattan Security Initiative',
    lat: 40.7127,
    lon: -74.0134,
    headingDeg: 164,
    headingConfidence: 'high',
    pitchDeg: -25,
    fovDeg: 68,
    rangeM: 760,
    mountHeightM: 32,
    groundElevationM: 10,
    feedType: 'image',
    sourceKind: 'configured',
    poseSource: 'catalog',
    license: 'City Open Data',
    url: '/cctv/nyc_harbor.jpg',
    snapshotUrl: '/cctv/nyc_harbor.jpg',
  },

  // Tokyo, Japan - Verified 24/7 Live Streams
  {
    id: 'tokyo-shibuya-scramble',
    name: 'Shibuya Crossing Scramble Cam 24/7',
    city: 'Tokyo',
    cityId: 'tokyo',
    provider: 'Shibuya Live 24/7 Web Stream',
    lat: 35.6595,
    lon: 139.7005,
    headingDeg: 18,
    headingConfidence: 'high',
    pitchDeg: -22,
    fovDeg: 82,
    rangeM: 640,
    mountHeightM: 30,
    groundElevationM: 40,
    feedType: 'youtube',
    youtubeId: 'dfVK7ld38Ys',
    sourceKind: 'live-stream',
    poseSource: 'catalog',
    license: 'ANNnewsCH 24/7 Live Stream',
    url: 'https://www.youtube.com/watch?v=dfVK7ld38Ys',
    snapshotUrl: '/cctv/tokyo_shibuya.jpg',
  },
  {
    id: 'tokyo-tower-observation',
    name: 'Tokyo Tower Skyline 24/7 Watch',
    city: 'Tokyo',
    cityId: 'tokyo',
    provider: 'Tokyo Live Camera TV 24/7',
    lat: 35.6586,
    lon: 139.7454,
    headingDeg: 0,
    headingConfidence: 'high',
    pitchDeg: -25,
    fovDeg: 70,
    rangeM: 850,
    mountHeightM: 45,
    groundElevationM: 40,
    feedType: 'youtube',
    youtubeId: 'nu6NE55_X7A',
    sourceKind: 'live-stream',
    poseSource: 'catalog',
    license: 'Tokyo Live Camera Network',
    url: 'https://www.youtube.com/watch?v=nu6NE55_X7A',
    snapshotUrl: '/cctv/tokyo_shibuya.jpg',
  },

  // London, UK - Verified 24/7 Live Stream
  {
    id: 'london-tower-bridge',
    name: 'London Abbey Road 24/7 Live Cam',
    city: 'London',
    cityId: 'london',
    provider: 'EarthCam 24/7 Live Stream',
    lat: 51.5320,
    lon: -0.1774,
    headingDeg: 340,
    headingConfidence: 'high',
    pitchDeg: -20,
    fovDeg: 70,
    rangeM: 400,
    mountHeightM: 20,
    groundElevationM: 35,
    feedType: 'youtube',
    youtubeId: 'zMCea32gpmg',
    sourceKind: 'live-stream',
    poseSource: 'catalog',
    license: 'EarthCam Official 24/7 Live Stream',
    url: 'https://www.youtube.com/watch?v=zMCea32gpmg',
    snapshotUrl: '/cctv/london_tower_bridge.jpg',
  },

  // Paris, France - Verified 24/7 Live Stream
  {
    id: 'paris-eiffel-tower',
    name: 'Paris Eiffel Tower & Seine 24/7 Live',
    city: 'Paris',
    cityId: 'paris',
    provider: 'Paris Livecam 24/7 Stream',
    lat: 48.8584,
    lon: 2.2945,
    headingDeg: 315,
    headingConfidence: 'high',
    pitchDeg: -25,
    fovDeg: 66,
    rangeM: 750,
    mountHeightM: 30,
    groundElevationM: 35,
    feedType: 'youtube',
    youtubeId: '5dsrqrzTPEo',
    sourceKind: 'live-stream',
    poseSource: 'catalog',
    license: 'Paris Livecam Network',
    url: 'https://www.youtube.com/watch?v=5dsrqrzTPEo',
    snapshotUrl: '/cctv/paris_eiffel.jpg',
  },

  // Miami Beach, FL - Verified 24/7 Coastal Live Stream
  {
    id: 'miami-sunny-isles',
    name: 'Miami Beach Sunny Isles 24/7 Live',
    city: 'Miami Beach',
    cityId: 'miami',
    provider: 'Sunny Isles Coastal 24/7 Live',
    lat: 25.9429,
    lon: -80.1221,
    headingDeg: 95,
    headingConfidence: 'high',
    pitchDeg: -15,
    fovDeg: 75,
    rangeM: 800,
    mountHeightM: 40,
    groundElevationM: 2,
    feedType: 'youtube',
    youtubeId: 'bi7B4EmyHHs',
    sourceKind: 'live-stream',
    poseSource: 'catalog',
    license: 'Sunny Isles Live Stream',
    url: 'https://www.youtube.com/watch?v=bi7B4EmyHHs',
    snapshotUrl: '/cctv/nyc_harbor.jpg',
  },

  // Venice, Italy - Verified 24/7 Grand Canal Live Stream
  {
    id: 'venice-grand-canal',
    name: 'Venice Grand Canal 24/7 Live',
    city: 'Venice',
    cityId: 'venice',
    provider: 'Venice Rolling Cam 24/7 Live',
    lat: 45.4381,
    lon: 12.3359,
    headingDeg: 120,
    headingConfidence: 'high',
    pitchDeg: -18,
    fovDeg: 72,
    rangeM: 700,
    mountHeightM: 25,
    groundElevationM: 1,
    feedType: 'youtube',
    youtubeId: 'a1mcaV3Sf9U',
    sourceKind: 'live-stream',
    poseSource: 'catalog',
    license: 'Venice Livecam Network',
    url: 'https://www.youtube.com/watch?v=a1mcaV3Sf9U',
    snapshotUrl: '/cctv/paris_eiffel.jpg',
  },

  // San Francisco, CA - Caltrans Simulation Loop
  {
    id: 'sf-golden-gate',
    name: 'Golden Gate Bridge South Vista',
    city: 'San Francisco',
    cityId: 'sf',
    provider: 'Caltrans District 4',
    lat: 37.8199,
    lon: -122.4783,
    headingDeg: 45,
    headingConfidence: 'high',
    pitchDeg: -20,
    fovDeg: 70,
    rangeM: 900,
    mountHeightM: 40,
    groundElevationM: 20,
    feedType: 'mp4',
    sourceKind: 'simulation',
    poseSource: 'catalog',
    license: 'Caltrans Operational Stream (Simulation)',
    url: '/cctv/sf_golden_gate.mp4',
    snapshotUrl: '/cctv/sf_golden_gate.jpg',
  },

  // Washington, DC
  {
    id: 'dc-national-mall',
    name: 'National Mall Center Axis',
    city: 'Washington',
    cityId: 'dc',
    provider: 'District DOT Traffic Ops',
    lat: 38.8895,
    lon: -77.0353,
    headingDeg: 258,
    headingConfidence: 'high',
    pitchDeg: -20,
    fovDeg: 78,
    rangeM: 940,
    mountHeightM: 24,
    groundElevationM: 10,
    feedType: 'image',
    sourceKind: 'configured',
    poseSource: 'catalog',
    license: 'District Open Data',
  },

  // Dubai, UAE
  {
    id: 'dubai-difc-axis',
    name: 'DIFC Financial Loop',
    city: 'Dubai',
    cityId: 'dubai',
    provider: 'Dubai Roads & Transport Authority',
    lat: 25.2048,
    lon: 55.2708,
    headingDeg: 196,
    headingConfidence: 'high',
    pitchDeg: -24,
    fovDeg: 70,
    rangeM: 720,
    mountHeightM: 26,
    groundElevationM: 5,
    feedType: 'image',
    sourceKind: 'configured',
    poseSource: 'catalog',
    license: 'RTA Smart City Feed',
  },
];

export function getCameraById(id) {
  return CCTV_CATALOG.find((c) => c.id === id) || null;
}

export function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildSyntheticCctvSvg({ cameraId, label, city, status }) {
  let hash = 0;
  const str = `${cameraId}:${label}:${city}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  const hue2 = (hue + 46) % 360;
  const now = new Date();
  const ts = now.toISOString().replace('T', ' ').replace('Z', 'Z').slice(0, 20);
  const safeLabel = escapeXml(label || cameraId);
  const safeCity = escapeXml(city || 'GLOBAL GRID');
  const safeId = escapeXml(cameraId);
  const safeStatus = escapeXml(status || 'OPTICAL LOCK · OK');

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hue}, 35%, 10%)" />
      <stop offset="60%" stop-color="hsl(${hue2}, 42%, 6%)" />
      <stop offset="100%" stop-color="#020509" />
    </linearGradient>
    <radialGradient id="flare" cx="0.22" cy="0.24" r="0.78">
      <stop offset="0%" stop-color="hsla(${hue2}, 100%, 65%, 0.35)" />
      <stop offset="100%" stop-color="hsla(${hue2}, 100%, 40%, 0)" />
    </radialGradient>
    <pattern id="scan" width="8" height="8" patternUnits="userSpaceOnUse">
      <rect width="8" height="8" fill="transparent" />
      <rect y="0" width="8" height="1" fill="rgba(255,255,255,0.08)" />
      <rect y="4" width="8" height="1" fill="rgba(255,255,255,0.05)" />
    </pattern>
  </defs>
  <rect width="960" height="540" fill="url(#bg)" />
  <rect width="960" height="540" fill="url(#flare)" />
  <rect width="960" height="540" fill="url(#scan)" />
  <g stroke="rgba(123,233,255,0.25)" stroke-width="1" fill="none">
    <path d="M60 460 Q300 300 520 420 T900 320" />
    <path d="M100 160 Q340 40 620 130 T920 90" />
    <path d="M20 280 Q220 230 390 270 T760 250" />
  </g>
  <g fill="none" stroke="rgba(180,248,255,0.2)" stroke-width="1">
    <rect x="70" y="80" width="820" height="380" rx="8" />
    <line x1="70" y1="270" x2="890" y2="270" />
    <line x1="480" y1="80" x2="480" y2="460" />
  </g>
  <g fill="#9cefff" font-family="monospace" text-transform="uppercase">
    <text x="74" y="54" font-size="16" letter-spacing="2">AETHERIS // PERSISTENT OPTICAL SENSOR</text>
    <text x="74" y="512" font-size="14" letter-spacing="1.5">${safeLabel} · ${safeCity}</text>
    <text x="646" y="512" font-size="13" letter-spacing="1.2">${safeId}</text>
    <text x="680" y="54" font-size="15" letter-spacing="2">${escapeXml(ts)}</text>
    <text x="74" y="486" font-size="13" letter-spacing="1.3">${safeStatus}</text>
  </g>
</svg>`.trim();
}
