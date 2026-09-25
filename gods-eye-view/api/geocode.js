/**
 * Aetheris Sovereign Geocoder Serverless Endpoint
 * 
 * Provides resilient global geocoding for arbitrary cities, streets, landmarks,
 * and sectors with automatic multi-tier fallback:
 *   Tier 1: Google Maps Geocoding API (if process.env.GOOGLE_MAPS_API_KEY is present)
 *   Tier 2: OpenStreetMap Photon Geocoder (high-speed, CORS-open, global OSM index)
 *   Tier 3: OpenStreetMap Nominatim Geocoder (standard hierarchical search)
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const query = String(req.query.q || req.query.address || '').trim();
  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter "q" or "address"' });
  }

  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

  // Tier 1: Google Maps Geocoding API
  const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (googleApiKey) {
    try {
      const gUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${googleApiKey}`;
      const gRes = await fetch(gUrl, { signal: AbortSignal.timeout(4500) });
      if (gRes.ok) {
        const gData = await gRes.json();
        if (gData.status === 'OK' && Array.isArray(gData.results) && gData.results.length > 0) {
          const first = gData.results[0];
          const loc = first.geometry?.location;
          if (loc && Number.isFinite(loc.lat) && Number.isFinite(loc.lng)) {
            const bounds = first.geometry?.bounds || first.geometry?.viewport || null;
            return res.status(200).json({
              status: 'success',
              source: 'google',
              query,
              lat: loc.lat,
              lon: loc.lng,
              label: first.formatted_address || query,
              types: first.types || [],
              bounds: bounds ? {
                southwest: { lat: bounds.southwest?.lat, lng: bounds.southwest?.lng },
                northeast: { lat: bounds.northeast?.lat, lng: bounds.northeast?.lng }
              } : null
            });
          }
        }
      }
    } catch {
      // Proceed to Tier 2 on timeout or network error
    }
  }

  // Tier 2: OpenStreetMap Photon Geocoder (Komoot)
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1`;
    const pRes = await fetch(photonUrl, {
      headers: { 'User-Agent': 'AetherisSpatial/3.0 (https://aetheris-spatial.vercel.app)' },
      signal: AbortSignal.timeout(4000)
    });
    if (pRes.ok) {
      const pData = await pRes.json();
      const feature = pData?.features?.[0];
      if (feature && Array.isArray(feature.geometry?.coordinates)) {
        const [lon, lat] = feature.geometry.coordinates;
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          const props = feature.properties || {};
          const labelParts = [
            props.name,
            props.street,
            props.district,
            props.city,
            props.state,
            props.country
          ].filter(Boolean);
          const label = labelParts.length > 0 ? labelParts.join(', ') : query;
          const extent = props.extent; // [minLon, minLat, maxLon, maxLat]
          return res.status(200).json({
            status: 'success',
            source: 'photon',
            query,
            lat,
            lon,
            label,
            types: [props.osm_value, props.type].filter(Boolean),
            bounds: Array.isArray(extent) && extent.length === 4 ? {
              southwest: { lat: extent[1], lng: extent[0] },
              northeast: { lat: extent[3], lng: extent[2] }
            } : null
          });
        }
      }
    }
  } catch {
    // Proceed to Tier 3 on failure
  }

  // Tier 3: OpenStreetMap Nominatim Fallback
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
    const nRes = await fetch(nomUrl, {
      headers: { 'User-Agent': 'AetherisSpatial/3.0 (https://aetheris-spatial.vercel.app)' },
      signal: AbortSignal.timeout(4000)
    });
    if (nRes.ok) {
      const nData = await nRes.json();
      if (Array.isArray(nData) && nData.length > 0) {
        const hit = nData[0];
        const lat = parseFloat(hit.lat);
        const lon = parseFloat(hit.lon);
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          const bbox = hit.boundingbox; // [minLat, maxLat, minLon, maxLon]
          return res.status(200).json({
            status: 'success',
            source: 'nominatim',
            query,
            lat,
            lon,
            label: hit.display_name || query,
            types: [hit.type, hit.class].filter(Boolean),
            bounds: Array.isArray(bbox) && bbox.length === 4 ? {
              southwest: { lat: parseFloat(bbox[0]), lng: parseFloat(bbox[2]) },
              northeast: { lat: parseFloat(bbox[1]), lng: parseFloat(bbox[3]) }
            } : null
          });
        }
      }
    }
  } catch {
    // Fallback failed
  }

  return res.status(404).json({
    status: 'not_found',
    query,
    error: `Location "${query}" could not be resolved on the global spatial grid.`
  });
}
