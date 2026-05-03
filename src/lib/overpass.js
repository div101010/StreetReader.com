// Bounding box of the Gran Vía corridor (matches the export.geojson area).
// Order for Overpass: south,west,north,east
export const GRAN_VIA_BBOX = {
  south: 40.4192,
  west: -3.7115,
  north: 40.4246,
  east: -3.6991,
};

// Eastern extension — covers Edificio Metrópolis through Círculo de Bellas
// Artes and the blocks leading to Calle de Alcalá. Sits adjacent to the east
// edge of GRAN_VIA_BBOX, no overlap.
export const EAST_EXTENSION_BBOX = {
  south: 40.4180,
  west: -3.6991,
  north: 40.4220,
  east: -3.6950,
};

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// Returns an array of named OSM nodes inside the Gran Vía bbox, restricted to
// the categories the labelling layer cares about. Live fetch — falls back to
// returning [] on network/CORS/timeout failures.
export async function fetchOSMLandmarks(bbox = GRAN_VIA_BBOX) {
  const bboxStr = `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`;
  const query = `
    [out:json][timeout:25];
    (
      node["shop"]["name"](${bboxStr});
      node["amenity"]["name"](${bboxStr});
      node["railway"="station"]["name"](${bboxStr});
      node["tourism"="hotel"]["name"](${bboxStr});
    );
    out body;
  `;

  try {
    const res = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(query),
    });
    if (!res.ok) throw new Error('Overpass HTTP ' + res.status);
    const data = await res.json();

    // Only nodes with a name; cap volume to keep the screen readable.
    const named = (data.elements || []).filter(
      (el) => el.type === 'node' && el.tags?.name && el.lat != null && el.lon != null,
    );

    console.log(`[overpass] fetched ${named.length} named landmarks`);
    return named;
  } catch (err) {
    console.warn('[overpass] fetch failed:', err.message);
    return [];
  }
}

// Fetches every building that's either addressed on Gran Vía or sits within
// 100 m of the Gran Vía roadway (regardless of which way segment), from
// Plaza de España all the way through to Calle de Alcalá. The around-relation
// approach replaces the previous distance filter — the corridor is defined
// authoritatively by OSM's road geometry, not by a centreline polyline guess.
export async function fetchOSMBuildings(bbox = EAST_EXTENSION_BBOX) {
  // bbox kept as a parameter for back-compat; the query below uses a wider
  // search bbox to ensure we pick up the road segments at both ends.
  const query = `
    [out:json][timeout:30];
    // Find every Gran Vía road segment (it's split into multiple ways in OSM).
    way["name"="Gran Vía"]["highway"](40.4180,-3.7115,40.4250,-3.6940)->.granvia;
    // Buildings: addressed on Gran Vía OR within 100m of any Gran Vía way.
    (
      way["building"]["addr:street"="Gran Vía"];
      way["building"](around.granvia:100);
    );
    out geom;
  `;

  try {
    const res = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(query),
    });
    if (!res.ok) throw new Error('Overpass HTTP ' + res.status);
    const data = await res.json();

    const features = (data.elements || [])
      .filter(
        (el) =>
          el.type === 'way' &&
          Array.isArray(el.geometry) &&
          el.geometry.length > 2,
      )
      .map((el) => {
        const ring = el.geometry.map((g) => [g.lon, g.lat]);
        const first = ring[0];
        const last = ring[ring.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) ring.push(first);
        return {
          type: 'Feature',
          properties: { '@id': `way/${el.id}`, ...(el.tags || {}) },
          geometry: { type: 'Polygon', coordinates: [ring] },
        };
      });

    console.log(`[overpass] fetched ${features.length} extension buildings`);
    return features;
  } catch (err) {
    console.warn('[overpass] buildings fetch failed:', err.message);
    return [];
  }
}
