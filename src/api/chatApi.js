/**
 * api/chatApi.js
 * -----------------------------------------------------------------------------
 * The Virsaa helper behind the "Ask about Sikhism" chat
 * (/collections/chat/ on the Django server, collections_api/chatbot.py).
 *
 *   start(api, token)        -> { greeting: [text], suggestions: [{ slug, question, category }] }
 *   ask(api, token, body)    -> { replies: [text], topic, suggestions, link: { label, path } | null, matched }
 *        body: { message, last_topic }  a typed question ("tell me more" uses last_topic)
 *              { topic }                a suggestion button that was pressed
 *
 * Both work signed out. When signed in, the token is sent so the helper can
 * greet the person by their first name (an expired token is renewed by the
 * AuthContext interceptor). The server allows about 40 messages a minute and
 * answers 429 after that.
 * -----------------------------------------------------------------------------
 */
import axios from 'axios';

const base = (apiString) =>
  `${(apiString || process.env.REACT_APP_API_URL || '').replace(/\/$/, '')}/collections/chat`;

// Give up after 15 s so a stalled connection is answered with "Try again"
const TIMEOUT_MS = 15000;

// Request options: the timeout, plus the Bearer token when signed in
const auth = (token) => ({ timeout: TIMEOUT_MS, ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}) });

// Longest question the server reads (it cuts anything longer)
export const CHAT_MAX_CHARS = 300;

const chatApi = {
  start: (api, token) => axios.get(`${base(api)}/start/`, auth(token)).then((r) => r.data),
  ask: (api, token, body) => axios.post(`${base(api)}/ask/`, body, auth(token)).then((r) => r.data),
};

export default chatApi;
