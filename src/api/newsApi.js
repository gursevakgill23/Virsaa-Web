/*
 * News and events from the Django collections API (/collections/news/, /collections/events/).
 */
import axios from 'axios';

const base = (apiString) =>
  `${(apiString || process.env.REACT_APP_API_URL || '').replace(/\/$/, '')}/collections`;

const auth = (token) => (token ? { headers: { Authorization: `Bearer ${token}` } } : {});
const data = (r) => r.data;
const list = (r) => (Array.isArray(r.data) ? r.data : r.data?.results || []);

// The visitor's own date, so "today" matches their calendar, not the server's
export const localISODate = (d = new Date()) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const newsApi = {
  news: (api, params) => axios.get(`${base(api)}/news/`, { params }).then(list),
  events: (api, params) => axios.get(`${base(api)}/events/`, { params: { date: localISODate(), ...params } }).then(list),
  // { date, events: [...today's], pick: null | { type: 'event' | 'news', item } }
  today: (api, token) => axios.get(`${base(api)}/events/today/`, { ...auth(token), params: { date: localISODate() } }).then(data),
  createEvent: (api, token, fields, imageFile) => {
    const form = new FormData();
    Object.entries(fields).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') form.append(k, v); });
    if (imageFile) form.append('image', imageFile);
    return axios.post(`${base(api)}/events/`, form, auth(token)).then(data);
  },
  deleteEvent: (api, token, id) => axios.delete(`${base(api)}/events/${id}/`, auth(token)),
};

export default newsApi;
