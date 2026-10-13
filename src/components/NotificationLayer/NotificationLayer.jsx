/**
 * components/NotificationLayer/NotificationLayer.jsx
 * -----------------------------------------------------------------------------
 * Draws the notifications created with `toast.*()` from utils/notify.js.
 * Mounted once in App.js.
 *
 * Two different presentations, so a success never looks like an error:
 *
 * 1. Success / info → <Island />
 *    A dark glass pill at the top centre of the screen. It grows out of a small
 *    dot, draws a tick, shows the message with a countdown ring, then shrinks
 *    back into the dot. Only one island shows at a time; others wait their turn.
 *    Polite for screen readers (role="status").
 *
 * 2. Error / warning → <AlertSheet />
 *    A solid card that slides up from the bottom (above the phone tab bar) with
 *    a short shake. It has a title, the message, an optional action button
 *    (e.g. "Try again"), a Dismiss button and a draining time bar. It stays
 *    longer, pauses while hovered or focused, and is announced right away
 *    (role="alert"). Up to three stack.
 *
 * Both respect "reduce motion": the shapes simply fade instead of morphing.
 * -----------------------------------------------------------------------------
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FaInfo, FaExclamationTriangle, FaTimesCircle, FaTimes } from 'react-icons/fa';
import { subscribe, toast } from '../../utils/notify';
import styles from './NotificationLayer.module.css';

const LEAVE_MS = 280; // length of the closing animation (matches the CSS)

/**
 * Countdown that can be paused, e.g. while the pointer is over a notification.
 * Calls onDone when the time is up. Restarts whenever `resetKey` changes
 * (the same notification was shown again).
 */
const useCountdown = (duration, paused, onDone, resetKey) => {
  const remaining = useRef(duration);
  const startedAt = useRef(0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  // A repeat of the same notification starts the clock again
  useEffect(() => { remaining.current = duration; }, [duration, resetKey]);

  useEffect(() => {
    if (duration == null || paused) return undefined; // null = stays until dismissed
    startedAt.current = Date.now();
    const timer = setTimeout(() => doneRef.current(), Math.max(0, remaining.current));
    return () => {
      clearTimeout(timer);
      remaining.current -= Date.now() - startedAt.current; // keep what's left for later
    };
  }, [duration, paused, resetKey]);
};

// ============================================================== Island (success / info)
const Island = ({ item }) => {
  const [leaving, setLeaving] = useState(false);
  const [paused, setPaused] = useState(false);
  const isSuccess = item.kind === 'success';

  // Play the closing animation, then remove it from the store
  const close = useCallback(() => {
    setLeaving(true);
    setTimeout(() => toast.dismiss(item.id), LEAVE_MS);
  }, [item.id]);

  useCountdown(item.duration, paused, close, item.updatedAt);

  return (
    <div
      className={`${styles.island} ${isSuccess ? styles.islandSuccess : styles.islandInfo} ${leaving ? styles.islandLeaving : ''}`}
      role="status"
      aria-live="polite"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Icon with a ring that empties as the time runs out */}
      <span className={styles.islandIcon} aria-hidden="true">
        <svg viewBox="0 0 36 36" className={styles.ring}>
          <circle cx="18" cy="18" r="16" className={styles.ringTrack} />
          {item.duration != null && (
            <circle
              key={item.updatedAt}
              cx="18" cy="18" r="16"
              className={styles.ringTime}
              pathLength="1"
              style={{ animationDuration: `${item.duration}ms`, animationPlayState: paused ? 'paused' : 'running' }}
            />
          )}
        </svg>
        {isSuccess ? (
          <svg viewBox="0 0 24 24" className={styles.tick}>
            <path d="M5 12.5l4.2 4.2L19 7" pathLength="1" />
          </svg>
        ) : (
          <FaInfo className={styles.infoGlyph} />
        )}
      </span>

      <p className={styles.islandText}>{item.message}</p>

      <button type="button" className={styles.islandClose} onClick={close} aria-label="Close message">
        <FaTimes aria-hidden="true" />
      </button>
    </div>
  );
};

// ============================================================== AlertSheet (error / warning)
const AlertSheet = ({ item }) => {
  const [leaving, setLeaving] = useState(false);
  const [paused, setPaused] = useState(false);
  const isError = item.kind === 'error';
  const title = item.title || (isError ? 'Something went wrong' : 'Check this');

  const close = useCallback(() => {
    setLeaving(true);
    setTimeout(() => toast.dismiss(item.id), LEAVE_MS);
  }, [item.id]);

  useCountdown(item.duration, paused, close, item.updatedAt);

  // Run the action (e.g. "Try again"), then close the sheet
  const runAction = () => {
    try {
      item.action.onClick();
    } finally {
      close();
    }
  };

  return (
    <div
      key={item.updatedAt}
      className={`${styles.sheet} ${isError ? styles.sheetError : styles.sheetWarning} ${leaving ? styles.sheetLeaving : ''}`}
      role="alert"
      aria-live="assertive"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <span className={styles.sheetIcon} aria-hidden="true">
        {isError ? <FaTimesCircle /> : <FaExclamationTriangle />}
      </span>

      <div className={styles.sheetBody}>
        <p className={styles.sheetTitle}>
          {title}
          {item.repeat > 1 && <span className={styles.repeat}>×{item.repeat}</span>}
        </p>
        <p className={styles.sheetText}>{item.message}</p>
        <div className={styles.sheetActions}>
          {item.action && (
            <button type="button" className={styles.sheetAction} onClick={runAction}>{item.action.label}</button>
          )}
          <button type="button" className={styles.sheetDismiss} onClick={close}>Dismiss</button>
        </div>
      </div>

      {/* Draining bar: how long until it closes by itself */}
      {item.duration != null && (
        <span
          className={styles.sheetTimer}
          style={{ animationDuration: `${item.duration}ms`, animationPlayState: paused ? 'paused' : 'running' }}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

// ============================================================== Layer
const NotificationLayer = () => {
  const [items, setItems] = useState([]);

  // Listen to the notify store for the lifetime of the app
  useEffect(() => subscribe(setItems), []);

  // Escape closes every error sheet (keyboard users shouldn't have to tab to them)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      items.filter((n) => n.kind === 'error' || n.kind === 'warning').forEach((n) => toast.dismiss(n.id));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [items]);

  // One island at a time (first in, first shown); every alert sheet at once
  const island = items.find((n) => n.kind === 'success' || n.kind === 'info');
  const alerts = items.filter((n) => n.kind === 'error' || n.kind === 'warning');

  return (
    <>
      <div className={styles.islandDock}>
        {island && <Island key={island.id} item={island} />}
      </div>
      <div className={styles.sheetDock}>
        {alerts.map((item) => <AlertSheet key={item.id} item={item} />)}
      </div>
    </>
  );
};

export default NotificationLayer;
