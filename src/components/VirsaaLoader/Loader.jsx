import React, { useEffect, useRef, useState } from 'react';
import styles from './Loader.module.css';

const useProductionImagePath = () => {
  return (imagePath) => {
    if (process.env.NODE_ENV === 'production') {
      if (typeof imagePath === 'string') {
        return imagePath.startsWith('/')
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

const TRACE_MS = 1550; // how long the outline takes to draw
const EXIT_MS = 450; // the "step through the doorway" at the end

/**
 * Splash screen shown while the app starts.
 * A glass doorway traces itself in gold, then opens toward you and fades away.
 * Props: onLoadingComplete() is called once, when the splash has gone.
 */
const Loader = ({ onLoadingComplete }) => {
  const getImagePath = useProductionImagePath();
  const logo = getImagePath('/images/logo.png');

  const [phase, setPhase] = useState('trace'); // trace -> exit -> done
  const sceneRef = useRef(null);

  // Keep the latest callback without restarting the timers if the parent re-renders
  const doneRef = useRef(onLoadingComplete);
  useEffect(() => {
    doneRef.current = onLoadingComplete;
  }, [onLoadingComplete]);

  useEffect(() => {
    const exitTimer = setTimeout(() => setPhase('exit'), TRACE_MS);
    const doneTimer = setTimeout(() => {
      setPhase('done');
      if (typeof doneRef.current === 'function') doneRef.current();
    }, TRACE_MS + EXIT_MS);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, []);

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
      className={`${styles.overlay} ${phase === 'exit' ? styles.exiting : ''}`}
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
