/**
 * api/gurdwaraApi.js
 * -----------------------------------------------------------------------------
 * A Gurdwara's history and photo from Wikipedia and Wikimedia Commons, through
 * the Django server (collections_api/gurdwara_history.py). The Gurdwaras
 * themselves, the map and address search come from Google Maps
 * (api/googleMaps.js).
 *
 *   history(api, gurdwara)
 *     -> { found: true, title, url, summary, sections, image, image_page, image_credit, license, ... }
 *     -> { found: false, search_url, description, image, image_page, image_credit }
 *
 * Answers are kept for this visit, so going between the pages doesn't ask
 * again (the server also caches them).
 * -----------------------------------------------------------------------------
 */
import axios from 'axios';

const base = (apiString) =>
  `${(apiString || process.env.REACT_APP_API_URL || '').replace(/\/$/, '')}/collections`;

// Wikipedia can be slow on a first lookup, so allow a little longer than usual
const TIMEOUT_MS = 30000;

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

const gurdwaraApi = {
  history: (api, gurdwara) => {
    const [lat, lng] = Array.isArray(gurdwara?.coordinates) ? gurdwara.coordinates : [];
    const params = {
      name: gurdwara?.name || '',
      city: gurdwara?.city || '',
      lat: Number.isFinite(lat) ? lat : undefined,
      lng: Number.isFinite(lng) ? lng : undefined,
    };
    const key = `history|${gurdwara?.id || ''}|${params.name}|${params.city}`.toLowerCase();
    return once(key, () => axios
      .get(`${base(api)}/gurdwara-history/`, { params, timeout: TIMEOUT_MS })
      .then((r) => r.data));
  },
};

export default gurdwaraApi;
