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
const POLL_MS = 30000;

const store = {
  count: 0,
  listeners: new Set(),
  api: '',
  token: null,
  timer: null,
  inflight: null,
};

const emit = () => store.listeners.forEach((fn) => fn(store.count));

export const setUnread = (count) => {
  const next = Math.max(0, Number(count) || 0);
  if (next !== store.count) {
    store.count = next;
    emit();
  }
};

export const refreshUnread = () => {
  if (!store.token) return Promise.resolve(0);
  if (store.inflight) return store.inflight;
  store.inflight = accountApi.unreadCount(store.api, store.token)
    .then((d) => { setUnread(d.unread_count); return d.unread_count; })
    .catch(() => store.count) // offline or not deployed yet: keep the last number
    .finally(() => { store.inflight = null; });
  return store.inflight;
};

const onVisible = () => { if (document.visibilityState === 'visible') refreshUnread(); };

const start = () => {
  if (store.timer) return;
  refreshUnread();
  store.timer = setInterval(() => { if (document.visibilityState === 'visible') refreshUnread(); }, POLL_MS);
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('focus', refreshUnread);
};

const stop = () => {
  clearInterval(store.timer);
  store.timer = null;
  document.removeEventListener('visibilitychange', onVisible);
  window.removeEventListener('focus', refreshUnread);
};

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
