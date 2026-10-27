/**
 * api/libraryApi.js
 * -----------------------------------------------------------------------------
 * Calls to the Django library API (/api/library/...): likes, "save for later",
 * ebook downloads and the reader's bookmark. Used by hooks/useLibraryItem.js,
 * hooks/useBookmark.js, the detail pages and My Favorites.
 *
 * `type` is 'ebook', 'audiobook' or 'author'; `kind` is 'like' or 'save'.
 * -----------------------------------------------------------------------------
 */
import axios from 'axios';
import { safeUrl } from '../utils/safeUrl';

// ---------------------------------------------------------------- helpers
const base = (apiString) =>
  `${(apiString || process.env.REACT_APP_API_URL || '').replace(/\/$/, '')}/api/library`;

// Give up after 20 s so a stalled connection shows an error instead of loading forever
const TIMEOUT_MS = 20000;

// Request options: the timeout, plus the Bearer token when signed in
const auth = (token) => ({ timeout: TIMEOUT_MS, ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}) });

// Path pieces are encoded so they can never change the URL path
const seg = (value) => encodeURIComponent(String(value));

// ---------------------------------------------------------------- endpoints
const libraryApi = {
  // Everything for My Favorites: { likes: {ebooks, audiobooks, authors}, saved, downloads, download_allowance }
  all: (api, token) => axios.get(`${base(api)}/`, auth(token)).then((r) => r.data),
  status: (api, token, type, id) =>
    axios.get(`${base(api)}/status/`, { ...auth(token), params: { type, id } }).then((r) => r.data),
  bulkStatus: (api, token, type, ids) =>
    axios.get(`${base(api)}/status/`, { ...auth(token), params: { type, ids: ids.join(',') } }).then((r) => r.data.items),
  // kind is 'like' or 'save'
  add: (api, token, kind, type, id) =>
    axios.post(`${base(api)}/${seg(kind)}/`, { type, id }, auth(token)).then((r) => r.data),
  remove: (api, token, kind, type, id) =>
    axios.delete(`${base(api)}/${seg(kind)}/`, { ...auth(token), params: { type, id } }).then((r) => r.data),
  downloads: (api, token) => axios.get(`${base(api)}/downloads/`, auth(token)).then((r) => r.data),
  downloadEbook: (api, token, id) =>
    axios.post(`${base(api)}/ebooks/${seg(id)}/download/`, {}, auth(token)).then((r) => r.data),
  // The reader's bookmark in an ebook: { page, pages, updated_at } (page is null when there is none)
  bookmark: (api, token, id) =>
    axios.get(`${base(api)}/bookmarks/ebook/${seg(id)}/`, auth(token)).then((r) => r.data),
  setBookmark: (api, token, id, page, pages) =>
    axios.put(`${base(api)}/bookmarks/ebook/${seg(id)}/`, { page, pages }, auth(token)).then((r) => r.data),
  removeBookmark: (api, token, id) =>
    axios.delete(`${base(api)}/bookmarks/ebook/${seg(id)}/`, auth(token)).then((r) => r.data),
};

/**
 * Start the browser download from the temporary link the server returned.
 * The link is checked first (only http(s) or site paths), so a bad response
 * can't turn the download into a script.
 */
export const startDownload = (url, filename) => {
  const href = safeUrl(url);
  if (!href) throw new Error('The download link is not valid.');
  const a = document.createElement('a');
  a.href = href;
  a.download = filename || '';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
};

export default libraryApi;
