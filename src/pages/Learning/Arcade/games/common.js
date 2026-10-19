/**
 * pages/Learning/Arcade/games/common.js
 * -----------------------------------------------------------------------------
 * Small helpers the games share: shuffling, a stopwatch, and the fonts the
 * games draw with on a canvas.
 * -----------------------------------------------------------------------------
 */
import { useCallback, useEffect, useRef, useState } from 'react';

export const GURMUKHI_FONT = "'Baloo Paaji 2', 'Mukta Mahee', 'Noto Sans Gurmukhi', 'Raavi', sans-serif";

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const shuffle = (list) => {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

/** Seconds since the stage started (pausable). */
export function useStopwatch(running = true) {
  const [seconds, setSeconds] = useState(0);
  const elapsed = useRef(0);
  const last = useRef(null);
  useEffect(() => {
    if (!running) {
      last.current = null;
      return undefined;
    }
    last.current = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      elapsed.current += (now - last.current) / 1000;
      last.current = now;
      setSeconds(Math.floor(elapsed.current));
    }, 250);
    return () => clearInterval(id);
  }, [running]);
  const read = useCallback(() => {
    const extra = last.current ? (performance.now() - last.current) / 1000 : 0;
    return Math.round(elapsed.current + extra);
  }, []);
  return [seconds, read];
}

/** Resolves when the game fonts are ready (or after a short wait). */
export const fontsReady = (timeout = 1500) => new Promise((resolve) => {
  if (typeof document === 'undefined' || !document.fonts) {
    resolve();
    return;
  }
  const timer = setTimeout(resolve, timeout);
  document.fonts.load(`700 40px ${GURMUKHI_FONT}`, 'ਅ').then(() => document.fonts.ready).then(() => {
    clearTimeout(timer);
    resolve();
  }).catch(() => {
    clearTimeout(timer);
    resolve();
  });
});

export const formatTime = (seconds) => {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
