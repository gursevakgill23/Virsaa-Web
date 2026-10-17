/**
 * api/gurdwaraApi.js
 * -----------------------------------------------------------------------------
 * A Gurdwara's history, looked up live on Wikipedia by the Django server
 * (/collections/gurdwara-history/, collections_api/gurdwara_history.py).
 *
 *   history(api, { name, city })
 *     -> { found: true, title, url, summary: [paragraphs], sections: [{ heading, paragraphs }],
 *          image, image_page, coordinates, source, license, license_url, retrieved_at }
 *     -> { found: false, search_url }   Wikipedia has no article about it
 *     rejects with a 503 when Wikipedia can't be reached
 *
 * Answers are kept for this visit, so going from the finder to the history
 * page doesn't ask again (the server also caches them for a day).
 * -----------------------------------------------------------------------------
 */
import axios from 'axios';

const base = (apiString) =>
  `${(apiString || process.env.REACT_APP_API_URL || '').replace(/\/$/, '')}/collections`;

// Wikipedia can be slow on a first lookup, so allow a little longer than usual
const TIMEOUT_MS = 25000;

const answers = new Map(); // `${name}|${city}` -> Promise of the answer

const gurdwaraApi = {
  history: (api, { name, city = '' }) => {
    const key = `${name}|${city}`.toLowerCase();
    if (!answers.has(key)) {
      const request = axios
        .get(`${base(api)}/gurdwara-history/`, { params: { name, city }, timeout: TIMEOUT_MS })
        .then((r) => r.data)
        .catch((error) => {
          answers.delete(key); // a failure isn't remembered, so "Try again" asks again
          throw error;
        });
      answers.set(key, request);
    }
    return answers.get(key);
  },
};

export default gurdwaraApi;
