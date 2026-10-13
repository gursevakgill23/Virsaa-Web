/**
 * hooks/useLibraryItem.js
 * -----------------------------------------------------------------------------
 * React hook behind the Like, Save for later and Download buttons on the
 * Ebook, Audiobook and Author detail pages. Talks to api/libraryApi.js and
 * reports the result with toast messages (utils/notify.js).
 * -----------------------------------------------------------------------------
 */
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '../utils/notify';
import { useAuth } from '../context/AuthContext';
import libraryApi, { startDownload } from '../api/libraryApi';

// Words used in messages for each item type
const LABELS = { ebook: 'book', audiobook: 'audiobook', author: 'author' };

/*
 * Like / save for later (and, for ebooks, download) for one item on a detail page.
 *   const lib = useLibraryItem(apiString, 'ebook', id);
 *   lib.liked, lib.saved, lib.toggleLike(), lib.toggleSave(), lib.download(), lib.downloading
 * Signed-out visitors are sent to the login page.
 */
const useLibraryItem = (apiString, type, id) => {
  const { isLoggedIn, accessToken } = useAuth();
  const navigate = useNavigate();
  // Current status from the server, and which button is waiting for a reply
  const [state, setState] = useState({ liked: false, saved: false, like_count: 0 });
  const [busy, setBusy] = useState(null); // 'like' | 'save' | null
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!id) return undefined;
    let cancelled = false;
    // Load whether this item is already liked/saved (and its like count)
    libraryApi.status(apiString, isLoggedIn ? accessToken : null, type, id)
      .then((data) => { if (!cancelled) setState(data); })
      .catch(() => { /* the buttons still work; they start unselected */ });
    return () => { cancelled = true; };
  }, [apiString, accessToken, isLoggedIn, type, id]);

  // Signed-out visitors get a message and go to the login page
  const requireLogin = useCallback((action) => {
    if (isLoggedIn) return true;
    toast.info(`Log in to ${action}.`, { position: 'top-center', autoClose: 2500, toastId: 'library-login' });
    navigate('/login');
    return false;
  }, [isLoggedIn, navigate]);

  // Like or save (or undo it). The button changes at once; if the server
  // refuses, it changes back and an error is shown.
  const toggle = useCallback(async (kind) => {
    const field = kind === 'like' ? 'liked' : 'saved';
    if (!requireLogin(kind === 'like' ? `like this ${LABELS[type]}` : 'save things for later')) return;
    const turningOn = !state[field];
    setState((s) => ({ ...s, [field]: turningOn })); // show it straight away
    setBusy(kind);
    try {
      const data = turningOn
        ? await libraryApi.add(apiString, accessToken, kind, type, id)
        : await libraryApi.remove(apiString, accessToken, kind, type, id);
      setState(data);
      const what = kind === 'like' ? 'liked' : 'saved for later';
      toast.success(turningOn ? `Added to ${what}` : `Removed from ${what}`, { position: 'top-right', autoClose: 2000 });
    } catch {
      setState((s) => ({ ...s, [field]: !turningOn }));
      toast.error('That didn’t save. Try again.', { position: 'top-right', autoClose: 3000 });
    } finally {
      setBusy(null);
    }
  }, [apiString, accessToken, type, id, state, requireLogin]);

  // Ebook download: the server checks the membership and the monthly limit,
  // then returns a temporary link. Out of downloads → the membership page.
  const download = useCallback(async () => {
    if (type !== 'ebook' || !requireLogin('download books')) return;
    setDownloading(true);
    try {
      const data = await libraryApi.downloadEbook(apiString, accessToken, id);
      startDownload(data.download_url, data.filename);
      const left = data.download_allowance?.remaining;
      toast.success(left == null ? 'Download started' : `Download started. ${left} left this month.`,
        { position: 'top-right', autoClose: 3000 });
    } catch (err) {
      const body = err.response?.data || {};
      if (body.code === 'membership_required' || body.code === 'limit_reached') {
        toast.info(body.error, { position: 'top-center', autoClose: 4000 });
        navigate('/premium');
      } else {
        toast.error(body.error || 'The download couldn’t start. Try again.', { position: 'top-right', autoClose: 3000 });
      }
    } finally {
      setDownloading(false);
    }
  }, [apiString, accessToken, type, id, requireLogin, navigate]);

  return {
    ...state,
    busy,
    downloading,
    toggleLike: () => toggle('like'),
    toggleSave: () => toggle('save'),
    download,
  };
};

export default useLibraryItem;
