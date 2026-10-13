/**
 * api/paymentsApi.js
 * -----------------------------------------------------------------------------
 * Calls to the Django payments API (/api/payments/...): products, orders,
 * paying for an order and the current subscription. Used by Membership,
 * Checkout, Payment and the membership hook.
 *
 * Card numbers are never sent here: only the method, card brand and last 4 digits.
 * -----------------------------------------------------------------------------
 */
import axios from 'axios';
import { isInternalPath } from '../utils/safeUrl';

// ---------------------------------------------------------------- helpers
const base = (apiString) =>
  `${(apiString || process.env.REACT_APP_API_URL || '').replace(/\/$/, '')}/api/payments`;

// Give up after 30 s so a stalled connection shows an error instead of loading forever
const TIMEOUT_MS = 30000;

// Request options: the timeout, plus the Bearer token when signed in
const auth = (token) => ({ timeout: TIMEOUT_MS, ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}) });

// Order references go into the URL path, so encode them
const seg = (value) => encodeURIComponent(String(value));

// ---------------------------------------------------------------- endpoints
const paymentsApi = {
  products: (api, kind) =>
    axios.get(`${base(api)}/products/`, { params: kind ? { kind } : undefined, timeout: TIMEOUT_MS }).then((r) => r.data),
  createOrder: (api, token, body) =>
    axios.post(`${base(api)}/orders/`, body, auth(token)).then((r) => r.data),
  order: (api, token, reference) =>
    axios.get(`${base(api)}/orders/${seg(reference)}/`, auth(token)).then((r) => r.data),
  pay: (api, token, reference, body) =>
    axios.post(`${base(api)}/orders/${seg(reference)}/pay/`, body, auth(token)).then((r) => r.data),
  cancel: (api, token, reference) =>
    axios.post(`${base(api)}/orders/${seg(reference)}/cancel/`, {}, auth(token)).then((r) => r.data),
  subscription: (api, token) =>
    axios.get(`${base(api)}/subscription/`, auth(token)).then((r) => r.data),
};

// ---------------------------------------------------------------- return address
// Where to send people back to after paying (e.g. the game they came from)
const RETURN_KEY = 'virsaa_checkout_return';
// Only paths inside Virsaa are kept, so ?return=//evil.example can't send people
// to another site after paying (open-redirect protection).
export const saveReturnTo = (path) => {
  try { if (isInternalPath(path)) sessionStorage.setItem(RETURN_KEY, path); } catch { /* storage blocked */ }
};
export const readReturnTo = () => {
  try {
    const path = sessionStorage.getItem(RETURN_KEY) || '';
    return isInternalPath(path) ? path : '';
  } catch { return ''; }
};

// ---------------------------------------------------------------- formatting
// "$9.99 CAD". Returns '' for anything that isn't a number or a known currency.
export const formatMoney = (amount, currency = 'CAD') => {
  const n = Number(amount);
  if (Number.isNaN(n)) return '';
  try {
    return `${new Intl.NumberFormat('en-CA', { style: 'currency', currency }).format(n)} ${currency}`;
  } catch {
    return `${n.toFixed(2)} ${currency}`;
  }
};

export default paymentsApi;
