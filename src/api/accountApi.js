/*
 * Account settings, history and notifications (Django auth_api, /api/auth/...).
 */
import axios from 'axios';

const base = (apiString) =>
  `${(apiString || process.env.REACT_APP_API_URL || '').replace(/\/$/, '')}/api/auth`;

const auth = (token) => (token ? { headers: { Authorization: `Bearer ${token}` } } : {});
const data = (r) => r.data;

const accountApi = {
  // Settings
  settings: (api, token) => axios.get(`${base(api)}/settings/`, auth(token)).then(data),
  updateSettings: (api, token, fields) => axios.patch(`${base(api)}/settings/`, fields, auth(token)).then(data),
  changePassword: (api, token, currentPassword, newPassword) =>
    axios.post(`${base(api)}/change-password/`, { current_password: currentPassword, new_password: newPassword }, auth(token)).then(data),
  deleteAccount: (api, token, password) =>
    axios.post(`${base(api)}/delete-account/`, { password }, auth(token)).then(data),

  // History
  history: (api, token, params) => axios.get(`${base(api)}/history/`, { ...auth(token), params }).then(data),
  recordHistory: (api, token, entry) => axios.post(`${base(api)}/history/`, entry, auth(token)).then(data),
  deleteHistory: (api, token, id) => axios.delete(`${base(api)}/history/${id}/`, auth(token)),
  deleteHistoryMany: (api, token, ids) => axios.post(`${base(api)}/history/delete/`, { ids }, auth(token)).then(data),
  clearHistory: (api, token) => axios.post(`${base(api)}/history/clear/`, {}, auth(token)).then(data),

  // Notifications
  notifications: (api, token, params) => axios.get(`${base(api)}/notifications/`, { ...auth(token), params }).then(data),
  unreadCount: (api, token) => axios.get(`${base(api)}/notifications/unread-count/`, auth(token)).then(data),
  markRead: (api, token, id, read = true) =>
    axios.post(`${base(api)}/notifications/${id}/${read ? 'read' : 'unread'}/`, {}, auth(token)).then(data),
  markAllRead: (api, token) => axios.post(`${base(api)}/notifications/read-all/`, {}, auth(token)).then(data),
  deleteNotification: (api, token, id) => axios.delete(`${base(api)}/notifications/${id}/`, auth(token)).then(data),
};

export default accountApi;
