/**
 * pages/GurdwaraAccess/gurdwaras.js
 * -----------------------------------------------------------------------------
 * Small helpers shared by the Gurdwara pages (finder, directions, services,
 * history). The Gurdwaras themselves are not stored here: they come live
 * from Google Maps (api/googleMaps.js), so any Gurdwara in the world can be
 * found.
 *
 *   distanceKm(a, b)              straight-line distance between [lat, lng] points
 *   travelEstimate(km, mode)      "about 25 min" by 'walk' | 'bus' | 'car'
 *   directionsLink(from, gurdwara, mode)  turn-by-turn directions in Google Maps
 *   placeLabel(gurdwara)          the address, or the town, or ''
 *   gurdwaraLink(kind, gurdwara, origin)  { pathname, state } for <Link to=...>
 * -----------------------------------------------------------------------------
 */

const toRad = (deg) => deg * (Math.PI / 180);

/** Kilometres between two [lat, lng] points, as the crow flies (haversine). */
export const distanceKm = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b)) return null;
  const [lat1, lng1] = a;
  const [lat2, lng2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

// Average speeds (km/h) and how much longer roads are than a straight line
const SPEEDS = { walk: 4.8, bus: 22, car: 38 };
const ROAD_FACTOR = 1.3;

/** A rough travel time, e.g. "about 25 min" or "about 1 hr 10 min" ('' without a distance). */
export const travelEstimate = (km, mode) => {
  if (km == null || Number.isNaN(km)) return '';
  const minutes = Math.max(1, Math.round(((km * ROAD_FACTOR) / (SPEEDS[mode] || 30)) * 60));
  if (minutes < 60) return `about ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `about ${hours} hr${rest ? ` ${rest} min` : ''}`;
};

/** "1.2 km" / "450 m" */
export const formatDistance = (km) => {
  if (km == null || Number.isNaN(km)) return '';
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
};

const point = (p) => `${Number(p[0]).toFixed(6)},${Number(p[1]).toFixed(6)}`;

/**
 * Turn-by-turn directions in Google Maps (the app on phones), to the
 * Gurdwara's own Google listing.
 * from: [lat, lng] or null (Google Maps then starts from where the visitor is)
 * mode: 'walk' | 'car' | 'bus'
 * (Google's terms keep its places to Google maps, so there are no Apple Maps
 * or OpenStreetMap links.)
 */
export const directionsLink = (from, gurdwara, mode = 'car') => {
  const to = gurdwara?.coordinates;
  if (!Array.isArray(to)) return '';
  const params = new URLSearchParams({
    api: '1',
    destination: gurdwara.name ? `${gurdwara.name}${gurdwara.address ? `, ${gurdwara.address}` : ''}` : point(to),
    travelmode: { walk: 'walking', car: 'driving', bus: 'transit' }[mode] || 'driving',
  });
  if (gurdwara.source === 'google' && gurdwara.id) params.set('destination_place_id', gurdwara.id);
  if (Array.isArray(from)) params.set('origin', point(from));
  return `https://www.google.com/maps/dir/?${params.toString()}`;
};

/** The address, or else the town and country, or '' */
export const placeLabel = (gurdwara) => gurdwara?.address
  || [gurdwara?.city, gurdwara?.country].filter(Boolean).join(', ');

/**
 * Where a Gurdwara's own pages live, with the Gurdwara (and the visitor's
 * starting point) handed over so the page opens without asking again.
 *   kind:  'locate' | 'services' | 'history'
 *   extra: more for the page, e.g. { mode: 'walk' } for the directions page
 */
export const gurdwaraLink = (kind, gurdwara, origin = null, extra = {}) => ({
  pathname: `/gurdwara-access/${kind}/${encodeURIComponent(gurdwara.id)}`,
  state: { ...extra, gurdwara, origin },
});
