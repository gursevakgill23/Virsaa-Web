/**
 * api/sikhismApi.js
 * -----------------------------------------------------------------------------
 * Calls to the Django Sikhism API (/api/sikhism/...): Gurbani and Sikh History.
 *
 * gurbaniApi (used by pages/Gurbani)
 *   list(api, token, params)        -> [item]                           anyone (guests too)
 *   text(api, token, id, offset)    -> { info, lines, total, next_offset, attribution }
 *   media(api, token, id, part)     -> { kind, url | youtubeId, credit } | null
 *   hukamnama(api)                  -> { date, shabads: [{ info, lines }], attribution }
 *   Text comes from BaniDB (Khalis Foundation) through our backend, which keeps a
 *   copy. Media is only returned to signed-in users (premium items need a plan);
 *   the server answers 401 { code: 'login_required' } or 403 { code: 'premium_required' }.
 *
 * historyApi (used by pages/SikhHistory)
 *   list(api, params)               -> { categories: [{ id, label }], results: [card] }
 *   timeline(api)                   -> [card] oldest first
 *   entry(api, slug)                -> one article with sections, sources and related
 * -----------------------------------------------------------------------------
 */
import axios from 'axios';
import { safeExternalUrl, safeUrl } from '../utils/safeUrl';

// ---------------------------------------------------------------- helpers
const root = (apiString) =>
  `${(apiString || process.env.REACT_APP_API_URL || '').replace(/\/$/, '')}/api/sikhism`;

// Give up after 20 s so a stalled connection shows an error instead of loading forever
const TIMEOUT_MS = 20000;

// Request options: the timeout, plus the Bearer token when signed in
const auth = (token) => ({ timeout: TIMEOUT_MS, ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}) });

// Path pieces are encoded so they can never change the URL path
const seg = (value) => encodeURIComponent(String(value));

// Lines of a long bani requested at a time (the server allows up to 500)
export const TEXT_PAGE_SIZE = 300;

// YouTube ids are exactly 11 letters, digits, - or _
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

// How each licence is credited under the player
const LICENCE_LABELS = {
  'cc-by': 'Creative Commons Attribution (CC BY)',
  permission: 'Used with permission',
  own: 'Virsaa recording',
  youtube: '',
};

/** The credit line for a recording: who made it, a safe link to the source, the licence. */
const cleanCredit = (credit) => {
  if (!credit || typeof credit !== 'object') return null;
  const label = typeof credit.label === 'string' ? credit.label.slice(0, 150) : '';
  const url = safeExternalUrl(credit.url) || '';
  if (!label && !url) return null;
  return { label, url, license: credit.license || '', licenseLabel: LICENCE_LABELS[credit.license] || '' };
};

/**
 * Check a media answer before the page uses it: only http(s) links, only a
 * well-formed YouTube id. Anything else becomes null, so a bad response can't
 * put a script URL into an <audio>, <video> or <iframe>.
 */
const cleanMedia = (data) => {
  if (!data || typeof data !== 'object') return null;
  const credit = cleanCredit(data.credit);
  if (data.kind === 'youtube') {
    return YOUTUBE_ID.test(data.youtube_id || '') ? { kind: 'youtube', youtubeId: data.youtube_id, credit } : null;
  }
  const url = safeExternalUrl(data.url) || safeUrl(data.url);
  if (!url || !['audio', 'video', 'pdf'].includes(data.kind)) return null;
  return { kind: data.kind, url, expiresIn: data.expires_in || null, credit };
};

// ---------------------------------------------------------------- Gurbani
export const gurbaniApi = {
  // The catalogue. params: { type, category, q, premium: 1 } (all optional)
  list: (api, token, params = {}) =>
    axios.get(`${root(api)}/gurbani/items/`, { ...auth(token), params })
      .then((r) => (Array.isArray(r.data) ? r.data : [])),

  // Part of an item's text, starting at line `offset`
  text: (api, token, id, offset = 0) =>
    axios
      .get(`${root(api)}/gurbani/items/${seg(id)}/text/`, { ...auth(token), params: { offset, limit: TEXT_PAGE_SIZE } })
      .then((r) => r.data),

  // What to play ('media') or the PDF ('pdf'); null when the answer isn't usable
  media: (api, token, id, part = 'media') =>
    axios
      .get(`${root(api)}/gurbani/items/${seg(id)}/media/`, { ...auth(token), params: part === 'pdf' ? { part: 'pdf' } : {} })
      .then((r) => cleanMedia(r.data)),

  // Today's Hukamnama from Sri Darbar Sahib (public)
  hukamnama: (api) => axios.get(`${root(api)}/gurbani/hukamnama/`, { timeout: TIMEOUT_MS }).then((r) => r.data),
};

// ---------------------------------------------------------------- Sikh History
export const historyApi = {
  // Cards + the categories. params: { category, q } (optional)
  list: (api, params = {}) =>
    axios.get(`${root(api)}/history/`, { timeout: TIMEOUT_MS, params }).then((r) => ({
      categories: Array.isArray(r.data?.categories) ? r.data.categories : [],
      results: Array.isArray(r.data?.results) ? r.data.results : [],
    })),

  // Every dated article, oldest first
  timeline: (api) =>
    axios.get(`${root(api)}/history/timeline/`, { timeout: TIMEOUT_MS }).then((r) => (Array.isArray(r.data) ? r.data : [])),

  // One article
  entry: (api, slug) => axios.get(`${root(api)}/history/${seg(slug)}/`, { timeout: TIMEOUT_MS }).then((r) => r.data),
};

const sikhismApi = { gurbani: gurbaniApi, history: historyApi };
export default sikhismApi;
