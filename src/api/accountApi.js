/**
 * api/accountApi.js
 * -----------------------------------------------------------------------------
 * Calls to the Django auth_api for the account area (/api/auth/...):
 *   - the "verify your email" page and "send the link again" (no token)
 *   - Settings page: preferences, password change, account deletion
 *   - History page: what the user has read, watched and played
 *   - Notifications page and the unread badge in the navbar
 *
 * Every function takes the API base address (`api`) and the signed-in user's
 * access token, and returns a Promise with the response body. Errors are left
 * to the caller, which shows a message (see each page).
 * -----------------------------------------------------------------------------
 */
import axios from 'axios';

// ---------------------------------------------------------------- helpers
// "https://api.example.com/" + "/api/auth" (trailing slash removed first)
const base = (apiString) =>
  `${(apiString || process.env.REACT_APP_API_URL || '').replace(/\/$/, '')}/api/auth`;

// Give up after 20 s so a stalled connection shows an error instead of loading forever
const TIMEOUT_MS = 20000;

// Request options: the timeout, plus the Bearer token when signed in
const auth = (token) => ({ timeout: TIMEOUT_MS, ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}) });
const data = (r) => r.data;

// Ids go into the URL path, so encode them (an id can never change the path)
const seg = (value) => encodeURIComponent(String(value));

// ---------------------------------------------------------------- endpoints
const accountApi = {
  // Email verification (before signing in, so no token)
  //   verifyEmail -> { verified: true, already_verified? }  (400 { reason: 'expired' | 'invalid' })
  verifyEmail: (api, code) => axios.post(`${base(api)}/verify-email/`, { code }, { timeout: TIMEOUT_MS }).then(data),
  //   always the same answer, whether or not an account uses the email
  resendVerification: (api, email) =>
    axios.post(`${base(api)}/resend-verification/`, { email }, { timeout: TIMEOUT_MS }).then(data),

  // Settings
  settings: (api, token) => axios.get(`${base(api)}/settings/`, auth(token)).then(data),
  updateSettings: (api, token, fields) => axios.patch(`${base(api)}/settings/`, fields, auth(token)).then(data),
  // -> { message, access, refresh }: other devices are signed out, this one gets new tokens
  changePassword: (api, token, currentPassword, newPassword) =>
    axios.post(`${base(api)}/change-password/`, { current_password: currentPassword, new_password: newPassword }, auth(token)).then(data),
  deleteAccount: (api, token, password) =>
    axios.post(`${base(api)}/delete-account/`, { password }, auth(token)).then(data),

  // History
  history: (api, token, params) => axios.get(`${base(api)}/history/`, { ...auth(token), params }).then(data),
  recordHistory: (api, token, entry) => axios.post(`${base(api)}/history/`, entry, auth(token)).then(data),
  deleteHistory: (api, token, id) => axios.delete(`${base(api)}/history/${seg(id)}/`, auth(token)),
  deleteHistoryMany: (api, token, ids) => axios.post(`${base(api)}/history/delete/`, { ids }, auth(token)).then(data),
  clearHistory: (api, token) => axios.post(`${base(api)}/history/clear/`, {}, auth(token)).then(data),

  // Notifications
  notifications: (api, token, params) => axios.get(`${base(api)}/notifications/`, { ...auth(token), params }).then(data),
  unreadCount: (api, token) => axios.get(`${base(api)}/notifications/unread-count/`, auth(token)).then(data),
  markRead: (api, token, id, read = true) =>
    axios.post(`${base(api)}/notifications/${seg(id)}/${read ? 'read' : 'unread'}/`, {}, auth(token)).then(data),
  markAllRead: (api, token) => axios.post(`${base(api)}/notifications/read-all/`, {}, auth(token)).then(data),
  deleteNotification: (api, token, id) => axios.delete(`${base(api)}/notifications/${seg(id)}/`, auth(token)).then(data),
};

export default accountApi;
