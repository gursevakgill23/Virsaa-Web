/**
 * api/gurdwaraApi.js
 * -----------------------------------------------------------------------------
 * Gurdwaras anywhere in the world and their history, through the Django
 * server (collections_api/gurdwara_finder.py and gurdwara_history.py), plus
 * worldwide address search.
 *
 *   nearby(api, { lat, lng })
 *     -> { center, radius_km, widened, gurdwaras: [...nearest first], source, licence, licence_url }
 *        Each Gurdwara: { id ('n123'), name, name_pa, address, city, country, coordinates [lat, lng],
 *        distance_km, website, phone, opening_hours, wikipedia, wikidata, commons_file,
 *        denomination, description, osm_url }  (from OpenStreetMap)
 *   place(api, id)        -> one Gurdwara (rejects with a 404 when there's no such Gurdwara)
 *   history(api, gurdwara)
 *     -> { found: true, title, url, summary, sections, image, image_page, image_credit, license, ... }
 *     -> { found: false, search_url, description, image, image_page, image_credit }
 *   remember(list) / remembered(id)
 *        Gurdwaras seen in this visit (sessionStorage), so a Gurdwara's own
 *        pages open at once, and still work after a refresh.
 *
 *   suggestPlaces(query)  -> [{ label, lat, lng }]  as you type (Photon, built for this)
 *   findPlace(query)      -> { label, lat, lng } or null   (OpenStreetMap's Nominatim)
 *   placeName(lat, lng)   -> a readable name for a position, or ''
 *
 * Answers are kept for this visit, so going between the pages doesn't ask
 * again (the server also caches them).
 * -----------------------------------------------------------------------------
 */
import axios from 'axios';

const base = (apiString) =>
  `${(apiString || process.env.REACT_APP_API_URL || '').replace(/\/$/, '')}/collections`;

// OpenStreetMap and Wikipedia can be slow on a first lookup, so allow a little longer than usual
const TIMEOUT_MS = 30000;
const STORE_KEY = 'virsaa.gurdwaras';
const STORE_MAX = 80;

const answers = new Map(); // request key -> Promise of the answer

// One request per key at a time, remembered on success (a failure is forgotten, so "Try again" asks again)
const once = (key, request) => {
  if (!answers.has(key)) {
    answers.set(key, request().catch((error) => {
      answers.delete(key);
      throw error;
    }));
  }
  return answers.get(key);
};

// ---------------------------------------------------------------------------- this visit's Gurdwaras
const readStore = () => {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(STORE_KEY) || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

const remember = (list) => {
  const items = (Array.isArray(list) ? list : [list]).filter((g) => g && typeof g.id === 'string');
  if (!items.length) return;
  try {
    const store = readStore();
    items.forEach((g) => { store[g.id] = { ...g, savedAt: Date.now() }; });
    const ids = Object.keys(store).sort((a, b) => (store[b].savedAt || 0) - (store[a].savedAt || 0));
    ids.slice(STORE_MAX).forEach((id) => delete store[id]);
    sessionStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    // private browsing or a full store: the pages ask the server instead
  }
};

const remembered = (id) => {
  const found = readStore()[id];
  return found && Array.isArray(found.coordinates) ? found : null;
};

// ---------------------------------------------------------------------------- addresses, worldwide
const PHOTON = 'https://photon.komoot.io/api/';
const NOMINATIM = 'https://nominatim.openstreetmap.org';

// "Southall, London, United Kingdom" from Photon's parts (no repeats)
const photonLabel = (p = {}) => {
  const street = [p.housenumber, p.street].filter(Boolean).join(' ');
  const parts = [p.name || street, p.name && street ? street : '', p.city || p.district, p.state, p.country];
  return parts.filter((part, i) => part && parts.indexOf(part) === i).join(', ');
};

const suggestPlaces = async (query, signal) => {
  const q = String(query || '').trim().slice(0, 120);
  if (q.length < 3) return [];
  const { data } = await axios.get(PHOTON, { params: { q, limit: 6, lang: 'en' }, timeout: 10000, signal });
  return (Array.isArray(data?.features) ? data.features : [])
    .map((f) => ({
      label: photonLabel(f.properties),
      lat: Number(f?.geometry?.coordinates?.[1]),
      lng: Number(f?.geometry?.coordinates?.[0]),
    }))
    .filter((p) => p.label && Number.isFinite(p.lat) && Number.isFinite(p.lng))
    .filter((p, i, all) => all.findIndex((o) => o.label === p.label) === i);
};

const findPlace = async (query) => {
  const q = String(query || '').trim().slice(0, 200);
  if (!q) return null;
  try {
    const { data } = await axios.get(`${NOMINATIM}/search`, {
      params: { format: 'jsonv2', q, limit: 1, 'accept-language': 'en' }, timeout: 12000,
    });
    const first = Array.isArray(data) ? data[0] : null;
    const lat = Number(first?.lat);
    const lng = Number(first?.lon);
    if (first && Number.isFinite(lat) && Number.isFinite(lng)) {
      return { label: String(first.display_name || q), lat, lng };
    }
  } catch {
    // Nominatim busy: Photon below may still know the place
  }
  const [best] = await suggestPlaces(q);
  return best || null;
};

const placeName = async (lat, lng) => {
  try {
    const { data } = await axios.get(`${NOMINATIM}/reverse`, {
      params: { format: 'jsonv2', lat, lon: lng, zoom: 14, 'accept-language': 'en' }, timeout: 10000,
    });
    const a = data?.address || {};
    const town = a.city || a.town || a.village || a.suburb || a.county || '';
    return [town, a.state, a.country].filter(Boolean).join(', ') || String(data?.display_name || '');
  } catch {
    return '';
  }
};

// ---------------------------------------------------------------------------- the server
const gurdwaraApi = {
  nearby: (api, { lat, lng }) => {
    const spot = `${Number(lat).toFixed(3)},${Number(lng).toFixed(3)}`;
    return once(`nearby|${spot}`, () => axios
      .get(`${base(api)}/gurdwaras/nearby/`, { params: { lat, lng }, timeout: TIMEOUT_MS })
      .then((r) => {
        remember(r.data?.gurdwaras || []);
        return r.data;
      }));
  },

  place: (api, id) => once(`place|${id}`, () => axios
    .get(`${base(api)}/gurdwaras/place/`, { params: { id }, timeout: TIMEOUT_MS })
    .then((r) => {
      remember(r.data?.gurdwara);
      return r.data?.gurdwara;
    })),

  history: (api, gurdwara) => {
    const [lat, lng] = Array.isArray(gurdwara?.coordinates) ? gurdwara.coordinates : [];
    const params = {
      name: gurdwara?.name || '',
      city: gurdwara?.city || '',
      lat: Number.isFinite(lat) ? lat : undefined,
      lng: Number.isFinite(lng) ? lng : undefined,
      wikipedia: gurdwara?.wikipedia || undefined,
      wikidata: gurdwara?.wikidata || undefined,
      commons_file: gurdwara?.commons_file || undefined,
    };
    const key = `history|${gurdwara?.id || ''}|${params.name}|${params.city}`.toLowerCase();
    return once(key, () => axios
      .get(`${base(api)}/gurdwara-history/`, { params, timeout: TIMEOUT_MS })
      .then((r) => r.data));
  },

  remember,
  remembered,
  suggestPlaces,
  findPlace,
  placeName,
};

export default gurdwaraApi;
