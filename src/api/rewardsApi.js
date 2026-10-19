/**
 * api/rewardsApi.js
 * -----------------------------------------------------------------------------
 * Calls to the Django rewards API (/api/rewards/...): sharing ebooks and
 * audiobooks (uploads), reward coins, the rewards they can be exchanged for,
 * and the person's exchanges. Used by the Share a book and My Rewards pages
 * and the navbar's account panel.
 *
 * Every function takes the API base address and the signed-in user's access
 * token, and returns a Promise with the response body. Callers show errors
 * (utils/apiError.js turns them into plain words).
 * -----------------------------------------------------------------------------
 */
import axios from 'axios';

// ---------------------------------------------------------------- helpers
const base = (apiString) =>
  `${(apiString || process.env.REACT_APP_API_URL || '').replace(/\/$/, '')}/api/rewards`;

// Give up after 30 s so a stalled connection shows an error instead of loading forever
const TIMEOUT_MS = 30000;

const auth = (token, extra = {}) => ({
  timeout: TIMEOUT_MS,
  ...extra,
  headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(extra.headers || {}) },
});

// Ids and references go into the URL path, so encode them
const seg = (value) => encodeURIComponent(String(value));

const get = (api, token, path, params) => axios.get(`${base(api)}${path}`, auth(token, { params })).then((r) => r.data);
const post = (api, token, path, body = {}) => axios.post(`${base(api)}${path}`, body, auth(token)).then((r) => r.data);

// ---------------------------------------------------------------- endpoints
const rewardsApi = {
  // Coins
  summary: (api, token) => get(api, token, '/'),
  history: (api, token, page = 1) => get(api, token, '/history/', { page }),

  // What coins can be exchanged for (public), exchanging, and the person's exchanges
  options: (api, kind) => get(api, null, '/options/', kind ? { kind } : undefined),
  redeem: (api, token, body) => post(api, token, '/redeem/', body),
  exchanges: (api, token) => get(api, token, '/exchanges/'),
  cancelExchange: (api, token, reference) => post(api, token, `/exchanges/${seg(reference)}/cancel/`),

  // Uploads (sharing a book)
  rules: (api) => get(api, null, '/uploads/rules/'),
  uploads: (api, token) => get(api, token, '/uploads/'),
  upload: (api, token, id) => get(api, token, `/uploads/${seg(id)}/`),
  startUpload: (api, token, body) => post(api, token, '/uploads/', body),
  updateUpload: (api, token, id, body) =>
    axios.patch(`${base(api)}/uploads/${seg(id)}/`, body, auth(token)).then((r) => r.data),
  deleteUpload: (api, token, id) => axios.delete(`${base(api)}/uploads/${seg(id)}/`, auth(token)),
  submit: (api, token, id, body) => post(api, token, `/uploads/${seg(id)}/submit/`, body),

  /**
   * Send one file (role: 'pdf', 'audio' or 'cover'). onProgress gets 0..1.
   * Big files take a while on slow connections, so there is no time limit here;
   * `signal` (an AbortController's) lets the page stop it.
   */
  sendFile: (api, token, id, role, file, { onProgress, signal } = {}) => {
    const form = new FormData();
    form.append('role', role);
    form.append('file', file);
    return axios.post(`${base(api)}/uploads/${seg(id)}/file/`, form, {
      ...auth(token),
      timeout: 0,
      signal,
      onUploadProgress: (event) => {
        if (onProgress && event.total) onProgress(Math.min(1, event.loaded / event.total));
      },
    }).then((r) => r.data);
  },
};

export default rewardsApi;

// ---------------------------------------------------------------- shared helpers for the pages
/** "2,350" */
export const formatCoins = (value) => Number(value || 0).toLocaleString('en-CA');

/** "12.4 MB" / "830 KB" */
export const formatBytes = (bytes) => {
  if (!bytes) return '';
  return bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

/** 5400 → "1:30:00", 754 → "12:34" */
export const formatClock = (seconds) => {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const two = (n) => String(n).padStart(2, '0');
  return h ? `${h}:${two(m)}:${two(s)}` : `${m}:${two(s)}`;
};

/** "1:30:00" / "12:34" / "75" → seconds, or null when it isn't a time */
export const parseClock = (text) => {
  const parts = String(text || '').trim().split(':');
  if (!parts.length || parts.length > 3 || parts.some((p) => !/^\d+$/.test(p.trim()))) return null;
  if (parts.slice(1).some((p) => Number(p) >= 60)) return null;
  return parts.reduce((total, p) => total * 60 + Number(p), 0);
};

/** "19 Oct 2026" */
export const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

// How each upload status looks (tone = the CSS class for its colour)
export const UPLOAD_STATUS = {
  draft: { label: 'Not sent yet', tone: 'muted' },
  pending: { label: 'Waiting for review', tone: 'waiting' },
  reviewing: { label: 'In review', tone: 'reviewing' },
  changes: { label: 'Changes needed', tone: 'changes' },
  passed: { label: 'Passed', tone: 'passed' },
  rejected: { label: 'Not accepted', tone: 'rejected' },
};

export const EXCHANGE_STATUS = {
  completed: { label: 'Done', tone: 'passed' },
  pending: { label: 'Order received', tone: 'waiting' },
  processing: { label: 'Being packed', tone: 'reviewing' },
  shipped: { label: 'Shipped', tone: 'reviewing' },
  delivered: { label: 'Delivered', tone: 'passed' },
  cancelled: { label: 'Cancelled', tone: 'muted' },
};
