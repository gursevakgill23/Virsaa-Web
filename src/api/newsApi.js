/**
 * api/newsApi.js
 * -----------------------------------------------------------------------------
 * Calls to the Django collections API for News & Events and the Nanakshahi
 * calendar (/collections/news/, /collections/events/, /collections/calendar/).
 * Used by the News page, the side panel and the Nanakshahi calendar view.
 * -----------------------------------------------------------------------------
 */
import axios from 'axios';

// ---------------------------------------------------------------- helpers
const base = (apiString) =>
  `${(apiString || process.env.REACT_APP_API_URL || '').replace(/\/$/, '')}/collections`;

// Give up after 20 s (60 s for uploads) so a stalled connection shows an error
const TIMEOUT_MS = 20000;
const UPLOAD_TIMEOUT_MS = 60000;

// Request options: the timeout, plus the Bearer token when signed in
const auth = (token, timeout = TIMEOUT_MS) => ({ timeout, ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}) });
const data = (r) => r.data;
// Lists may come back plain or paginated ({ results: [...] })
const list = (r) => (Array.isArray(r.data) ? r.data : r.data?.results || []);

// Ids go into the URL path, so encode them
const seg = (value) => encodeURIComponent(String(value));

// The visitor's own date, so "today" matches their calendar, not the server's
export const localISODate = (d = new Date()) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// ---------------------------------------------------------------- news & events
const newsApi = {
  news: (api, params) => axios.get(`${base(api)}/news/`, { params, timeout: TIMEOUT_MS }).then(list),
  events: (api, params) => axios.get(`${base(api)}/events/`, { params: { date: localISODate(), ...params }, timeout: TIMEOUT_MS }).then(list),
  // { date, nanakshahi, calendar: [...], events: [...today's], pick: null | { type: 'event' | 'news', item } }
  today: (api, token) => axios.get(`${base(api)}/events/today/`, { ...auth(token), params: { date: localISODate() } }).then(data),
  // New event from the side panel (multipart, because it can include an image)
  createEvent: (api, token, fields, imageFile) => {
    const form = new FormData();
    Object.entries(fields).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') form.append(k, v); });
    if (imageFile) form.append('image', imageFile);
    return axios.post(`${base(api)}/events/`, form, auth(token, UPLOAD_TIMEOUT_MS)).then(data);
  },
  deleteEvent: (api, token, id) => axios.delete(`${base(api)}/events/${seg(id)}/`, auth(token)),
};

export default newsApi;

// ---------------------------------------------------------------- Nanakshahi calendar
// Entries for a month, a duplicate check before posting an event, and ranges
export const calendarApi = {
  month: (api, year, month) => axios.get(`${base(api)}/calendar/`, { params: { year, month }, timeout: TIMEOUT_MS }).then(list),
  check: (api, params) => axios.get(`${base(api)}/calendar/check/`, { params, timeout: TIMEOUT_MS }).then(data),
  eventsBetween: (api, from, to) => axios.get(`${base(api)}/events/`, { params: { from, to }, timeout: TIMEOUT_MS }).then(list),
  // Calendar entries in a date range, optionally only some kinds (e.g. 'gurpurab,festival')
  between: (api, from, to, kind) => axios.get(`${base(api)}/calendar/`, { params: { from, to, kind }, timeout: TIMEOUT_MS }).then(list),
};
