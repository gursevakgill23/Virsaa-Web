/**
 * utils/notify.js
 * -----------------------------------------------------------------------------
 * Virsaa's own notification system: the messages that pop up after an action
 * ("Added to your favourites", "That didn't save").
 *
 * Successes and errors are deliberately shown in two different ways:
 *   - success / info → the "island": one glass pill at the top of the screen that
 *     grows out of a dot, draws a tick and shrinks away again
 *     (see components/NotificationLayer).
 *   - error / warning → the "alert sheet": a solid card that slides up from the
 *     bottom, says what went wrong, stays longer and can be dismissed or retried.
 *
 * The API mirrors react-toastify (toast.success / toast.error / toast.info /
 * toast.warn / toast.dismiss), so existing calls keep working.
 * Only the import changes:
 *     import { toast } from '../utils/notify';
 *
 * How it works: a tiny in-memory store (no React context needed). Components call
 * toast.*() from anywhere, even outside React. <NotificationLayer /> subscribes
 * to the store and renders whatever is in it.
 * -----------------------------------------------------------------------------
 */

// ---------------------------------------------------------------- defaults
// How long each kind stays on screen (ms). Errors stay longer, because people
// need time to read what went wrong.
const DEFAULT_DURATION = {
  success: 3200,
  info: 3600,
  warning: 6500,
  error: 8000,
};

// The longest message we show. Longer text (e.g. a raw server error) is cut off,
// so a bad response can't flood the screen.
const MAX_MESSAGE_LENGTH = 280;

// At most this many alert sheets stack up; the oldest is dropped beyond that.
const MAX_ALERTS = 3;

// ---------------------------------------------------------------- store
let items = []; // everything currently on screen or waiting for its turn
let counter = 0; // used to make ids
const listeners = new Set();

/** Tell every subscriber (the NotificationLayer) that the list changed. */
const emit = () => {
  const snapshot = items.slice();
  listeners.forEach((listener) => listener(snapshot));
};

/**
 * Subscribe to changes. Returns an unsubscribe function.
 * Used by components/NotificationLayer/NotificationLayer.jsx.
 */
export const subscribe = (listener) => {
  listeners.add(listener);
  listener(items.slice());
  return () => listeners.delete(listener);
};

/**
 * Turn whatever was passed in into safe, short plain text.
 * Messages are always rendered as text (never as HTML), so this is about length
 * and readability, not about escaping.
 */
const toText = (message) => {
  if (message == null) return '';
  let text = typeof message === 'string' ? message : String(message?.message || message);
  text = text.replace(/\s+/g, ' ').trim();
  return text.length > MAX_MESSAGE_LENGTH ? `${text.slice(0, MAX_MESSAGE_LENGTH - 1)}…` : text;
};

/** A short buzz on phones that support it, so an error is felt as well as seen. */
const buzz = () => {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate([24, 40, 24]);
  } catch {
    /* some browsers block vibration without a user gesture; that's fine */
  }
};

/**
 * Add a notification.
 * @param {'success'|'info'|'warning'|'error'} kind
 * @param {string} message  what to say
 * @param {object} [options]
 *   - autoClose: ms before it closes, or false to keep it until dismissed
 *   - toastId:   a fixed id; showing the same id again updates the existing one
 *                instead of stacking a duplicate
 *   - title:     optional heading for alert sheets (defaults per kind)
 *   - action:    { label, onClick } shows a button on alert sheets (e.g. "Try again")
 *   Other react-toastify options (position, theme…) are accepted and ignored.
 * @returns {string} the notification id (use with toast.dismiss)
 */
const show = (kind, message, options = {}) => {
  const text = toText(message);
  if (!text) return '';

  const id = options.toastId != null ? String(options.toastId) : `n${(counter += 1)}`;
  const duration = options.autoClose === false
    ? null
    : (Number.isFinite(options.autoClose) ? options.autoClose : DEFAULT_DURATION[kind]);
  const action = options.action && typeof options.action.onClick === 'function' && options.action.label
    ? { label: String(options.action.label), onClick: options.action.onClick }
    : null;

  const isAlert = kind === 'error' || kind === 'warning';
  const existing = items.find((n) => n.id === id || (isAlert && n.kind === kind && n.message === text));

  if (existing) {
    // Same notification again: refresh it (and count repeats on alerts) instead of stacking
    items = items.map((n) => (n === existing
      ? { ...n, message: text, duration, action, title: options.title || n.title, repeat: n.repeat + 1, updatedAt: Date.now() }
      : n));
  } else {
    items = [...items, {
      id, kind, message: text, duration, action,
      title: options.title ? toText(options.title) : '',
      repeat: 1, createdAt: Date.now(), updatedAt: Date.now(),
    }];
    // Keep the alert stack short: drop the oldest alerts beyond the limit
    const alerts = items.filter((n) => n.kind === 'error' || n.kind === 'warning');
    if (alerts.length > MAX_ALERTS) {
      const drop = new Set(alerts.slice(0, alerts.length - MAX_ALERTS).map((n) => n.id));
      items = items.filter((n) => !drop.has(n.id));
    }
  }

  if (isAlert) buzz();
  emit();
  return existing ? existing.id : id;
};

/** Remove one notification, or all of them when no id is given. */
const dismiss = (id) => {
  items = id == null ? [] : items.filter((n) => n.id !== String(id));
  emit();
};

// ---------------------------------------------------------------- public API
// Same shape as react-toastify's `toast`, so existing code works unchanged.
export const toast = {
  success: (message, options) => show('success', message, options),
  info: (message, options) => show('info', message, options),
  warn: (message, options) => show('warning', message, options),
  warning: (message, options) => show('warning', message, options),
  error: (message, options) => show('error', message, options),
  dismiss,
};

export default toast;
