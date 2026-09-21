const TACTICAL_RADIO_STATIONS = [
  {
    stationuuid: 'atc-austin-tower',
    name: 'Austin-Bergstrom Tower (KAUS)',
    url: 'https://broadcastify.cdnstream1.com/39327',
    country: 'United States',
    tags: 'atc,aviation,tower',
    bitrate: 128,
  },
  {
    stationuuid: 'atc-jfk-tower',
    name: 'New York JFK Tower & Approach (KJFK)',
    url: 'https://broadcastify.cdnstream1.com/39328',
    country: 'United States',
    tags: 'atc,aviation,jfk',
    bitrate: 128,
  },
  {
    stationuuid: 'atc-tokyo-haneda',
    name: 'Tokyo Haneda International Tower (RJTT)',
    url: 'https://broadcastify.cdnstream1.com/39329',
    country: 'Japan',
    tags: 'atc,aviation,tokyo',
    bitrate: 128,
  },
  {
    stationuuid: 'vhf-marine-channel-16',
    name: 'Maritime VHF International Distress Channel 16',
    url: 'https://broadcastify.cdnstream1.com/39330',
    country: 'International',
    tags: 'maritime,vhf,distress',
    bitrate: 128,
  },
  {
    stationuuid: 'emergency-norad-c2',
    name: 'Aerospace Defense Tactical Watch Frequency',
    url: 'https://broadcastify.cdnstream1.com/39331',
    country: 'United States',
    tags: 'defense,norad,c2',
    bitrate: 128,
  },
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, s-maxage=3600');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  return res.status(200).json({
    status: 'live',
    rows: TACTICAL_RADIO_STATIONS,
    total: TACTICAL_RADIO_STATIONS.length,
  });
}
