/*
 * Calls to the Django payments API (/api/payments/...).
 * Card numbers are never sent here: only the method, card brand and last 4 digits.
 */
import axios from 'axios';

const base = (apiString) =>
  `${(apiString || process.env.REACT_APP_API_URL || '').replace(/\/$/, '')}/api/payments`;

const auth = (token) => (token ? { headers: { Authorization: `Bearer ${token}` } } : {});

const paymentsApi = {
  products: (api, kind) =>
    axios.get(`${base(api)}/products/`, { params: kind ? { kind } : undefined }).then((r) => r.data),
  createOrder: (api, token, body) =>
    axios.post(`${base(api)}/orders/`, body, auth(token)).then((r) => r.data),
  order: (api, token, reference) =>
    axios.get(`${base(api)}/orders/${reference}/`, auth(token)).then((r) => r.data),
  pay: (api, token, reference, body) =>
    axios.post(`${base(api)}/orders/${reference}/pay/`, body, auth(token)).then((r) => r.data),
  cancel: (api, token, reference) =>
    axios.post(`${base(api)}/orders/${reference}/cancel/`, {}, auth(token)).then((r) => r.data),
  subscription: (api, token) =>
    axios.get(`${base(api)}/subscription/`, auth(token)).then((r) => r.data),
};

// Where to send people back to after paying (e.g. the game they came from)
const RETURN_KEY = 'virsaa_checkout_return';
export const saveReturnTo = (path) => {
  try { if (path && path.startsWith('/')) sessionStorage.setItem(RETURN_KEY, path); } catch { /* ignore */ }
};
export const readReturnTo = () => {
  try { return sessionStorage.getItem(RETURN_KEY) || ''; } catch { return ''; }
};

export const formatMoney = (amount, currency = 'CAD') => {
  const n = Number(amount);
  if (Number.isNaN(n)) return '';
  return `${new Intl.NumberFormat('en-CA', { style: 'currency', currency }).format(n)} ${currency}`;
};

export default paymentsApi;
