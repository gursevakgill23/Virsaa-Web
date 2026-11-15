/**
 * api/siteApi.js
 * -----------------------------------------------------------------------------
 * Calls to /api/site/: the text pages (About and the policies, edited in the
 * Django admin) and the Help Center (FAQs, messages and refund requests).
 * Used by About, LegalPage, Help and the footer's feedback box.
 * -----------------------------------------------------------------------------
 */
import axios from 'axios';

const base = (apiString) =>
  `${(apiString || process.env.REACT_APP_API_URL || '').replace(/\/$/, '')}/api/site`;
const TIMEOUT_MS = 20000;
const auth = (token) => ({ timeout: TIMEOUT_MS, ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}) });

// The policies, in the order the footer and the Help page list them
export const POLICY_LINKS = [
  { slug: 'privacy-policy', label: 'Privacy Policy', to: '/privacy-policy' },
  { slug: 'terms', label: 'Terms of Service', to: '/terms' },
  { slug: 'subscription-policy', label: 'Subscription and Billing', to: '/subscription-policy' },
  { slug: 'refund-policy', label: 'Refund Policy', to: '/refund-policy' },
  { slug: 'copyright', label: 'Copyright', to: '/copyright' },
  { slug: 'cookie-policy', label: 'Cookies', to: '/cookie-policy' },
];

const siteApi = {
  pages: (api) => axios.get(`${base(api)}/pages/`, { timeout: TIMEOUT_MS }).then((r) => r.data),
  page: (api, slug) =>
    axios.get(`${base(api)}/pages/${encodeURIComponent(slug)}/`, { timeout: TIMEOUT_MS }).then((r) => r.data),
  help: (api) => axios.get(`${base(api)}/help/`, { timeout: TIMEOUT_MS }).then((r) => r.data),
  // {name?, email?, category, subject, message, order_reference?} -> {reference, message}
  sendRequest: (api, token, body) =>
    axios.post(`${base(api)}/help/requests/`, { platform: 'web', ...body }, auth(token)).then((r) => r.data),
  myRequests: (api, token) => axios.get(`${base(api)}/help/requests/`, auth(token)).then((r) => r.data),
  // Paid orders and how a refund for each is asked for ('form', 'apple' or 'none')
  orders: (api, token) => axios.get(`${base(api)}/help/orders/`, auth(token)).then((r) => r.data),
};

export default siteApi;
