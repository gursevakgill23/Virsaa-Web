/**
 * hooks/useBookmark.js
 * -----------------------------------------------------------------------------
 * The reader's bookmark in an ebook (one a book, kept on the server:
 * /api/library/bookmarks/ebook/<id>/ in api/libraryApi.js). The book opens at
 * it next time, on any device.
 *
 *   const bookmark = useBookmark(apiString, id);
 *   bookmark.page        the bookmarked page, or null
 *   bookmark.available   signed in, and bookmarks are set up on the server
 *                        (before then the API answers 503 and the button hides)
 *   await bookmark.save(page, pages)   true when it saved
 *   await bookmark.remove()            true when it was removed
 *
 * Changes show straight away and go back if the server refuses them.
 * -----------------------------------------------------------------------------
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import libraryApi from '../api/libraryApi';

const NONE = { page: null, pages: 0 };
const OFF = [401, 403, 503]; // signed out, or not set up on the server yet

const fromServer = (data) => ({ page: Number(data?.page) > 0 ? Number(data.page) : null, pages: Number(data?.pages) || 0 });

const useBookmark = (apiString, ebookId) => {
  const { isLoggedIn, accessToken } = useAuth();
  const [mark, setMark] = useState(NONE);
  const [available, setAvailable] = useState(false);
  const markRef = useRef(NONE);
  markRef.current = mark;

  // Another book, or signed out: forget the bookmark shown
  useEffect(() => {
    setMark(NONE);
  }, [ebookId, isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn || !ebookId) {
      setAvailable(false);
      return undefined;
    }
    let cancelled = false;
    setAvailable(true);
    libraryApi.bookmark(apiString, accessToken, ebookId)
      .then((data) => { if (!cancelled) setMark(fromServer(data)); })
      .catch((err) => { if (!cancelled && OFF.includes(err.response?.status)) setAvailable(false); });
    return () => { cancelled = true; };
  }, [apiString, accessToken, isLoggedIn, ebookId]);

  const change = useCallback(async (next, request) => {
    const before = markRef.current;
    setMark(next);
    try {
      setMark(fromServer(await request()));
      return true;
    } catch (err) {
      setMark(before);
      if (err.response?.status === 503) setAvailable(false);
      return false;
    }
  }, []);

  const save = useCallback(
    (page, pages = 0) => change({ page, pages }, () => libraryApi.setBookmark(apiString, accessToken, ebookId, page, pages)),
    [change, apiString, accessToken, ebookId],
  );
  const remove = useCallback(
    () => change(NONE, () => libraryApi.removeBookmark(apiString, accessToken, ebookId)),
    [change, apiString, accessToken, ebookId],
  );

  return { page: mark.page, pages: mark.pages, available, save, remove };
};

export default useBookmark;
