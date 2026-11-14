/**
 * api/paymentsApi.js
 * -----------------------------------------------------------------------------
 * Calls to the Django payments API (/api/payments/...): products, orders,
 * Stripe's payment page and billing page, and the current subscription. Used
 * by Membership, Checkout, Payment and the membership hook.
 *
 * Card details never pass through Virsaa: people pay on Stripe's own page.
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
  // Stop renewing (the plan stays until the paid time ends), or keep renewing after all
  cancelMembership: (api, token) =>
    axios.post(`${base(api)}/subscription/cancel/`, {}, auth(token)).then((r) => r.data),
  resumeMembership: (api, token) =>
    axios.post(`${base(api)}/subscription/resume/`, {}, auth(token)).then((r) => r.data),
  // Stripe: { url } of Stripe's payment page for a product, or of the person's billing page
  stripeCheckout: (api, token, productCode) =>
    axios.post(`${base(api)}/stripe/checkout/`, { product_code: productCode }, auth(token)).then((r) => r.data),
  billingPortal: (api, token) =>
    axios.post(`${base(api)}/stripe/portal/`, {}, auth(token)).then((r) => r.data),
};

// Only ever leave Virsaa for Stripe's own pages
export const isStripeUrl = (url) => {
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === 'https:' && (hostname === 'stripe.com' || hostname.endsWith('.stripe.com'));
  } catch {
    return false;
  }
};

// Open Stripe's billing page (change plan, card, cancel, invoices). Throws with a readable message.
export const openBillingPortal = async (api, token) => {
  const data = await paymentsApi.billingPortal(api, token);
  if (!isStripeUrl(data?.url)) throw new Error('No billing page address');
  window.location.assign(data.url);
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
