/**
 * api/reviewsApi.js
 * -----------------------------------------------------------------------------
 * Ratings and reviews for ebooks, audiobooks and authors
 * (/collections/reviews/ on the Django server). Used by components/Reviews.
 *
 *   list(api, token, type, id, sort)  -> { count, average, distribution, mine, results }
 *   save(api, token, type, id, body)  -> the review (posting again updates your review)
 *   update(api, token, reviewId, body)
 *   remove(api, token, reviewId)
 *   helpful(api, token, reviewId)     -> { helpful, voted }   toggles your vote
 *
 * `type` is 'ebook', 'audiobook' or 'author'. Reading is open to everyone;
 * the token is sent when signed in so the answer can mark your own review
 * and the ones you found helpful.
 * -----------------------------------------------------------------------------
 */
import axios from 'axios';

const base = (apiString) =>
  `${(apiString || process.env.REACT_APP_API_URL || '').replace(/\/$/, '')}/collections/reviews`;

// Give up after 20 s so a stalled connection shows an error instead of loading forever
const TIMEOUT_MS = 20000;

// Request options: the timeout, plus the Bearer token when signed in
const auth = (token) => ({ timeout: TIMEOUT_MS, ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}) });

// Path pieces are encoded so they can never change the URL path
const seg = (value) => encodeURIComponent(String(value));

export const REVIEW_MIN = 10;
export const REVIEW_MAX = 2000;
export const REVIEW_SORTS = [
  { id: 'newest', label: 'Newest first' },
  { id: 'helpful', label: 'Most helpful' },
  { id: 'highest', label: 'Highest rated' },
  { id: 'lowest', label: 'Lowest rated' },
];

const reviewsApi = {
  list: (api, token, type, id, sort = 'newest') =>
    axios.get(`${base(api)}/`, { ...auth(token), params: { type, id, sort } }).then((r) => r.data),
  save: (api, token, type, id, body) =>
    axios.post(`${base(api)}/`, { type, id, ...body }, auth(token)).then((r) => r.data),
  update: (api, token, reviewId, body) =>
    axios.patch(`${base(api)}/${seg(reviewId)}/`, body, auth(token)).then((r) => r.data),
  remove: (api, token, reviewId) => axios.delete(`${base(api)}/${seg(reviewId)}/`, auth(token)),
  helpful: (api, token, reviewId) =>
    axios.post(`${base(api)}/${seg(reviewId)}/helpful/`, {}, auth(token)).then((r) => r.data),
};

export default reviewsApi;
