/**
 * hooks/useUnreadNotifications.js
 * -----------------------------------------------------------------------------
 * React hook for the number of unread notifications (navbar badge, account
 * tabs, Notifications page). A single shared poller keeps every screen in step;
 * see the comment below the imports.
 * -----------------------------------------------------------------------------
 */
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import accountApi from '../api/accountApi';

/*
 * The unread notification count, shared by the navbar badge, the account panel,
 * the account tabs and the Notifications page.
 *
 * One poller for the whole app: it checks every 30 seconds while the tab is visible,
 * straight away when the tab comes back into view, and whenever a page calls
 * refreshUnread() or setUnread() (e.g. after marking something read).
 */
// How often to check while the tab is visible
const POLL_MS = 30000;

// Shared state for the whole app (lives outside React, so there is one poller)
const store = {
  count: 0,
  listeners: new Set(),
  api: '',
  token: null,
  timer: null,
  inflight: null,
};

// Tell every mounted hook about a new count
const emit = () => store.listeners.forEach((fn) => fn(store.count));

// Pages call this when they already know the new count (e.g. after marking read)
export const setUnread = (count) => {
  const next = Math.max(0, Number(count) || 0);
  if (next !== store.count) {
    store.count = next;
    emit();
  }
};

// Ask the server for the count. Calls that overlap share one request.
export const refreshUnread = () => {
  if (!store.token) return Promise.resolve(0);
  if (store.inflight) return store.inflight;
  store.inflight = accountApi.unreadCount(store.api, store.token)
    .then((d) => { setUnread(d.unread_count); return d.unread_count; })
    .catch(() => store.count) // offline or not deployed yet: keep the last number
    .finally(() => { store.inflight = null; });
  return store.inflight;
};

// Check again when the tab comes back into view
const onVisible = () => { if (document.visibilityState === 'visible') refreshUnread(); };

// Start polling (once)
const start = () => {
  if (store.timer) return;
  refreshUnread();
  store.timer = setInterval(() => { if (document.visibilityState === 'visible') refreshUnread(); }, POLL_MS);
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('focus', refreshUnread);
};

// Stop polling and remove the listeners
const stop = () => {
  clearInterval(store.timer);
  store.timer = null;
  document.removeEventListener('visibilitychange', onVisible);
  window.removeEventListener('focus', refreshUnread);
};

// The hook: subscribe to the store, and start/stop polling as the user signs in or out
const useUnreadNotifications = (apiString) => {
  const { isLoggedIn, accessToken } = useAuth();
  const [count, setCount] = useState(store.count);

  useEffect(() => {
    store.listeners.add(setCount);
    return () => store.listeners.delete(setCount);
  }, []);

  useEffect(() => {
    if (apiString) store.api = apiString;
    const token = isLoggedIn ? accessToken : null;
    if (token === store.token) return;
    store.token = token;
    if (token) {
      stop();
      start();
    } else {
      stop();
      setUnread(0);
    }
  }, [apiString, isLoggedIn, accessToken]);

  return isLoggedIn ? count : 0;
};

export default useUnreadNotifications;
