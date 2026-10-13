/**
 * hooks/useHistoryRecorder.js
 * -----------------------------------------------------------------------------
 * React hook that records what the signed-in user opens (books, audiobooks,
 * lessons, quizzes, Gurbani) in their History (see pages/Profile/History).
 * Details of how to call it are in the comment below the imports.
 * -----------------------------------------------------------------------------
 */
import { useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import accountApi from '../api/accountApi';

/*
 * Adds things to the signed-in user's History.
 *   const record = useHistoryRecorder(apiString);
 *   record({ type: 'ebook', item_id: id, title, path, image });            // opened (sent as content_type / content_id)
 *   record({ ...same, progress: 40, position: 12 }, { progressOnly: true }); // moved on, not a new visit
 * Progress updates are throttled to one every 15 seconds per item (pass { force: true } on close/pause).
 * Failures are silent.
 */
// Minimum gap between two progress updates for the same item
const THROTTLE_MS = 15000;

const useHistoryRecorder = (apiString) => {
  const { isLoggedIn, accessToken } = useAuth();
  // When each item was last sent, so progress updates can be throttled
  const lastSent = useRef({});

  // The returned function; signed-out visitors and incomplete entries are ignored
  return useCallback((entry, { progressOnly = false, force = false } = {}) => {
    if (!isLoggedIn || !accessToken || !entry?.item_id || !entry?.title || !entry?.path) return;
    const key = `${entry.type}:${entry.item_id}`;
    const now = Date.now();
    if (progressOnly && !force && now - (lastSent.current[key] || 0) < THROTTLE_MS) return;
    lastSent.current[key] = now;
    // Shape the body the API expects. Only http(s) images are sent;
    // progress is clamped to 0–100.
    const { type, item_id: itemId, ...rest } = entry;
    const body = {
      ...rest,
      content_type: type,
      content_id: String(itemId),
      image: /^https?:\/\//.test(entry.image || '') ? entry.image : '',
      ...(entry.progress != null ? { progress: Math.max(0, Math.min(100, Math.round(entry.progress))) } : {}),
      ...(progressOnly ? { progress_only: true } : {}),
    };
    // History is a convenience: a failed save must never interrupt reading
    accountApi.recordHistory(apiString, accessToken, body).catch(() => {});
  }, [apiString, isLoggedIn, accessToken]);
};

export default useHistoryRecorder;
