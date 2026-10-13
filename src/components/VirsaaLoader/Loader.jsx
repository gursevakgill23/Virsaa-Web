/**
 * components/VirsaaLoader/Loader.jsx
 * -----------------------------------------------------------------------------
 * The Virsaa loader: a glass Gurdwara doorway whose outline traces itself in
 * gold. It is used in three ways, picked with the `variant` prop:
 *
 *   'splash' (default when onLoadingComplete is given)
 *       Shown once when the app starts (App.js). Traces the doorway, steps
 *       "through" it and calls onLoadingComplete() when it has gone.
 *
 *   'quick'
 *       A shorter version of the splash, played on every page change
 *       (App.js → RouteLoader), so each page opens with the Virsaa loader.
 *       Also calls onLoadingComplete() at the end.
 *
 *   'wait' (default when no onLoadingComplete is given)
 *       Stays on screen, tracing over and over, until the parent removes it.
 *       Used while a page loads its data (e.g. EbookDetail) and while a page's
 *       code is downloading (Suspense fallback in App.js).
 * -----------------------------------------------------------------------------
 */
import React, { useEffect, useRef, useState } from 'react';
import styles from './Loader.module.css';

// Converts image paths for the production build (same helper used across pages)

const useProductionImagePath = () => {
  return (imagePath) => {
    if (process.env.NODE_ENV === 'production') {
      if (typeof imagePath === 'string') {
        return (imagePath.startsWith('/') || /^(https?:|blob:|data:)/i.test(imagePath))
          ? imagePath
          : `/${imagePath.replace(/.*static\/media/, 'static/media')}`;
      }
      return imagePath.default || imagePath;
    }
    return imagePath;
  };
};

// Pointed Gurdwara doorway, drawn in a 200 x 260 box.
// The same shape cuts the glass panel and is traced as the progress line.
const ARCH =
  'M14 252 V118 C14 64 58 40 100 10 C142 40 186 64 186 118 V252 Z';

// Timings per variant (ms): how long the outline takes to draw, and how long the
// "step through the doorway" exit lasts. 'wait' has no exit; it loops until removed.
const TIMINGS = {
  splash: { trace: 1550, exit: 450 },
  quick: { trace: 650, exit: 300 },
  wait: { trace: 1550, exit: 0 },
};

/**
 * Props:
 *   onLoadingComplete()  called once, when a 'splash' or 'quick' loader has gone
 *   variant              'splash' | 'quick' | 'wait' (see the top of this file)
 */
const Loader = ({ onLoadingComplete, variant }) => {
  // Without a callback there is nothing to tell when it ends, so it waits
  const mode = TIMINGS[variant] ? variant : (onLoadingComplete ? 'splash' : 'wait');
  const { trace: TRACE_MS, exit: EXIT_MS } = TIMINGS[mode];

  const getImagePath = useProductionImagePath();
  const logo = getImagePath('/images/logo.png');

  const [phase, setPhase] = useState('trace'); // trace -> exit -> done
  const sceneRef = useRef(null);

  // Keep the latest callback without restarting the timers if the parent re-renders
  const doneRef = useRef(onLoadingComplete);
  useEffect(() => {
    doneRef.current = onLoadingComplete;
  }, [onLoadingComplete]);

  // 'splash' / 'quick': trace → exit → done, then tell the parent.
  // 'wait' skips this and keeps tracing until it is unmounted.
  useEffect(() => {
    if (mode === 'wait') return undefined;
    const exitTimer = setTimeout(() => setPhase('exit'), TRACE_MS);
    const doneTimer = setTimeout(() => {
      setPhase('done');
      if (typeof doneRef.current === 'function') doneRef.current();
    }, TRACE_MS + EXIT_MS);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [mode, TRACE_MS, EXIT_MS]);

  // The doorway leans gently toward the pointer, so it feels like an object in space
  const handlePointerMove = (e) => {
    const el = sceneRef.current;
    if (!el || e.pointerType === 'touch') return;
    const x = e.clientX / window.innerWidth - 0.5;
    const y = e.clientY / window.innerHeight - 0.5;
    el.style.setProperty('--tilt-x', `${(-y * 10).toFixed(2)}deg`);
    el.style.setProperty('--tilt-y', `${(x * 14).toFixed(2)}deg`);
  };

  if (phase === 'done') return null;

  return (
    <div
      className={`${styles.overlay} ${phase === 'exit' ? styles.exiting : ''} ${mode === 'wait' ? styles.waiting : ''} ${mode === 'quick' ? styles.quick : ''}`}
      onPointerMove={handlePointerMove}
      role="status"
      aria-live="polite"
      aria-label="Loading Virsaa"
    >
      {/* Depth: soft lights drifting at different distances */}
      <div className={styles.aura} aria-hidden="true" />
      <span className={`${styles.orb} ${styles.orbFar}`} aria-hidden="true" />
      <span className={`${styles.orb} ${styles.orbMid}`} aria-hidden="true" />
      <span className={`${styles.orb} ${styles.orbNear}`} aria-hidden="true" />

      <div className={styles.scene} ref={sceneRef}>
        <div className={styles.doorway}>
          {/* Light spilling from behind the door */}
          <div className={styles.glow} aria-hidden="true" />

          {/* Glass panel cut to the arch */}
          <div className={styles.glass}>
            <img src={logo} alt="" className={styles.logo} draggable="false" />
          </div>

          {/* Arch outline: faint track + gold line that draws as the app loads */}
          <svg className={styles.outline} viewBox="0 0 200 260" aria-hidden="true">
            <defs>
              <linearGradient id="virsaaLoaderGold" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#c9a24a" />
                <stop offset="100%" stopColor="#fff3d1" />
              </linearGradient>
            </defs>
            <path d={ARCH} className={styles.track} pathLength="1" />
            <path
              d={ARCH}
              className={styles.trace}
              pathLength="1"
              stroke="url(#virsaaLoaderGold)"
              style={{ animationDuration: `${TRACE_MS}ms` }}
            />
          </svg>
        </div>

        {/* Reflection on the floor */}
        <div className={styles.floor} aria-hidden="true" />

        <div className={styles.wordmark}>
          <span className={styles.name}>Virsaa</span>
          <span className={styles.gurmukhi} lang="pa">ਵਿਰਸਾ</span>
        </div>
      </div>
    </div>
  );
};

export default Loader;
