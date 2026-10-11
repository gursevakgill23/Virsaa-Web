/*
 * Calls to the Django library API (/api/library/...): likes, "save for later" and ebook downloads.
 * type is 'ebook', 'audiobook' or 'author'.
 */
import axios from 'axios';

const base = (apiString) =>
  `${(apiString || process.env.REACT_APP_API_URL || '').replace(/\/$/, '')}/api/library`;

const auth = (token) => (token ? { headers: { Authorization: `Bearer ${token}` } } : {});

const libraryApi = {
  // Everything for My Favorites: { likes: {ebooks, audiobooks, authors}, saved, downloads, download_allowance }
  all: (api, token) => axios.get(`${base(api)}/`, auth(token)).then((r) => r.data),
  status: (api, token, type, id) =>
    axios.get(`${base(api)}/status/`, { ...auth(token), params: { type, id } }).then((r) => r.data),
  bulkStatus: (api, token, type, ids) =>
    axios.get(`${base(api)}/status/`, { ...auth(token), params: { type, ids: ids.join(',') } }).then((r) => r.data.items),
  // kind is 'like' or 'save'
  add: (api, token, kind, type, id) =>
    axios.post(`${base(api)}/${kind}/`, { type, id }, auth(token)).then((r) => r.data),
  remove: (api, token, kind, type, id) =>
    axios.delete(`${base(api)}/${kind}/`, { ...auth(token), params: { type, id } }).then((r) => r.data),
  downloads: (api, token) => axios.get(`${base(api)}/downloads/`, auth(token)).then((r) => r.data),
  downloadEbook: (api, token, id) =>
    axios.post(`${base(api)}/ebooks/${id}/download/`, {}, auth(token)).then((r) => r.data),
};

// Start the browser download from a temporary link
export const startDownload = (url, filename) => {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || '';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
};

export default libraryApi;
