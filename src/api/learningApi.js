/**
 * api/learningApi.js
 * -----------------------------------------------------------------------------
 * Calls to the Django learning API (/api/learning/...): lessons, quizzes,
 * tournaments, the word games, the ten map games, the coin wallet, badges
 * and leaderboards.
 *
 * Every function takes the API base address and (where needed) the signed-in
 * user's access token, and returns a Promise with the response body.
 * Callers handle errors and show a message.
 * -----------------------------------------------------------------------------
 */
import axios from 'axios';

// ---------------------------------------------------------------- helpers
const base = (apiString) =>
  `${(apiString || process.env.REACT_APP_API_URL || '').replace(/\/$/, '')}/api/learning`;

// Give up after 20 s so a stalled connection shows an error instead of loading forever
const TIMEOUT_MS = 20000;

// Request options: the timeout, plus the Bearer token when signed in
const auth = (token) => ({ timeout: TIMEOUT_MS, ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}) });

// Ids and game keys go into the URL path, so encode them
const seg = (value) => encodeURIComponent(String(value));

const get = (apiString, token, path, params) =>
  axios.get(`${base(apiString)}${path}`, { ...auth(token), params }).then((r) => r.data);

const post = (apiString, token, path, body = {}) =>
  axios.post(`${base(apiString)}${path}`, body, auth(token)).then((r) => r.data);

// ---------------------------------------------------------------- endpoints
const learningApi = {
  // Content
  categorized: (api, token) => get(api, token, '/items/categorized/'),
  item: (api, token, id) => get(api, token, `/learning-material/${seg(id)}/`),
  itemLeaderboard: (api, id, limit = 10) => get(api, null, `/items/${seg(id)}/leaderboard/`, { limit }),
  // Random words for a word game: params { level: '1-10', difficulty: 'easy', count: 10 }
  gameWords: (api, gameKey, params) => get(api, null, `/items/games/${seg(gameKey)}/words/`, params),

  // Results
  submitQuiz: (api, token, id, result) => post(api, token, `/items/${seg(id)}/submit_score/`, result),
  submitTournament: (api, token, tournamentId, result) =>
    post(api, token, `/tournaments/${seg(tournamentId)}/submit_score/`, result),
  joinTournament: (api, token, tournamentId) => post(api, token, `/tournaments/${seg(tournamentId)}/join/`),
  tournamentLeaderboard: (api, tournamentId) => get(api, null, `/tournaments/${seg(tournamentId)}/leaderboard/`),
  submitGame: (api, token, gameKey, result) => post(api, token, `/items/games/${seg(gameKey)}/submit/`, result),
  saveProgress: (api, token, id, progress) => post(api, token, `/items/${seg(id)}/progress/`, progress),

  // The signed-in player
  summary: (api, token) => get(api, token, '/me/summary/'),
  wallet: (api, token) => get(api, token, '/me/wallet/'),
  updateWallet: (api, token, fields) => {
    // An avatar file needs multipart; everything else is JSON
    if (fields.game_avatar instanceof Blob) {
      const form = new FormData();
      Object.entries(fields).forEach(([k, v]) => {
        // Objects (like preferences) can't go in a multipart form; send those separately as JSON
        if (v === undefined || v === null || (typeof v === 'object' && !(v instanceof Blob))) return;
        form.append(k, v);
      });
      return axios.patch(`${base(api)}/me/wallet/`, form, auth(token)).then((r) => r.data);
    }
    return axios.patch(`${base(api)}/me/wallet/`, fields, auth(token)).then((r) => r.data);
  },
  claimWelcomeBonus: (api, token) => post(api, token, '/me/wallet/welcome-bonus/'),
  spendCoins: (api, token, amount, reason, gameKey = '') =>
    post(api, token, '/me/wallet/spend/', { amount, reason, game_key: gameKey }),
  earnCoins: (api, token, amount, reason, gameKey = '') =>
    post(api, token, '/me/wallet/earn/', { amount, reason, game_key: gameKey }),
  achievements: (api, token, gameKey) => get(api, token, '/me/achievements/', gameKey ? { game_key: gameKey } : undefined),
  myBadges: (api, token) => get(api, token, '/me/badges/'),
  myAttempts: (api, token, params) => get(api, token, '/me/attempts/', params),
  myProgress: (api, token) => get(api, token, '/me/progress/'),

  // Public leaderboards
  leaderboard: (api, params) => get(api, null, '/leaderboard/', params),

  // Every badge there is (for guests: what they could earn)
  badges: (api) => get(api, null, '/badges/'),

  // The ten map games (pages/Learning/Arcade): pass the token so signed-in players get their stars
  arcadeGames: (api, token) => get(api, token, '/games/'),
  arcadeGame: (api, token, slug) => get(api, token, `/games/${seg(slug)}/`),
  arcadeContent: (api, token, slug, stage) => get(api, token, `/games/${seg(slug)}/content/`, { stage }),
  // result: { stage, score (0-1000), time_taken_seconds, completed, details }
  arcadeSubmit: (api, token, slug, result) => post(api, token, `/games/${seg(slug)}/submit/`, result),
  arcadeLeaderboard: (api, token, slug, period = 'all', limit = 10) =>
    get(api, token, `/games/${seg(slug)}/leaderboard/`, { period, limit }),
  // Shabad-le is marked on the server
  shabadPuzzle: (api, token, params) => get(api, token, '/games/shabad-le/puzzle/', params),
  shabadGuess: (api, token, body) => post(api, token, '/games/shabad-le/guess/', body),
  shabadHint: (api, token, body) => post(api, token, '/games/shabad-le/hint/', body),
};

export default learningApi;
