/**
 * elements/ComingSoon/ComingSoon.jsx
 * -----------------------------------------------------------------------------
 * "Stay tuned" block: a list of upcoming items on the left and a matching
 * picture on the right. Moves to the next item every 5 seconds; hovering or
 * focusing pauses it, and any item can be picked directly.
 * -----------------------------------------------------------------------------
 */
import React, { useState, useEffect } from 'react';
import styles from './ComingSoon.module.css';

// Converts image paths for the production build (same helper used across pages)
const getImagePath = (imagePath) => {
  if (process.env.NODE_ENV === 'production' && typeof imagePath === 'string') {
    return (imagePath.startsWith('/') || /^(https?:|blob:|data:)/i.test(imagePath)) ? imagePath : `/${imagePath.replace(/.*static\/media/, 'static/media')}`;
  }
  return imagePath;
};

// The items and their pictures (in public/images)
const CONTENT = [
  { text: 'Content coming soon', image: '/images/comingsoon1.jpeg' },
  { text: 'New features arriving', image: '/images/comingsoon2.jpg' },
  { text: 'Stay tuned for updates', image: '/images/comingsoon3.png' },
  { text: 'Exciting news ahead', image: '/images/comingsoon4.jpg' },
];

// Time each item stays (ms)
const INTERVAL = 5000;

const ComingSoon = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Move to the next item every 5 seconds, unless the visitor is hovering or focused inside
  useEffect(() => {
    if (paused) return undefined;
    const timer = setTimeout(() => setActiveIndex((i) => (i + 1) % CONTENT.length), INTERVAL);
    return () => clearTimeout(timer);
  }, [activeIndex, paused]);

  const active = CONTENT[activeIndex];

  return (
    <section
      className={styles.comingSoonContainer}
      aria-labelledby="coming-soon-title"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className={styles.panel}>
        <div className={styles.leftSide}>
          <h2 id="coming-soon-title" className={styles.comingSoonHeading}>Stay tuned for the latest updates</h2>
          <ol className={styles.textList}>
            {CONTENT.map((item, index) => {
              const isActive = index === activeIndex;
              return (
                <li key={item.text}>
                  <button
                    type="button"
                    className={`${styles.textItem} ${isActive ? styles.active : ''}`}
                    aria-current={isActive ? 'true' : undefined}
                    onClick={() => setActiveIndex(index)}
                  >
                    <span className={styles.itemText}>{item.text}</span>
                    {/* Fills while this item is showing */}
                    <span className={styles.meter} aria-hidden="true">
                      {isActive && (
                        <span
                          key={`${activeIndex}-${paused}`}
                          className={styles.meterFill}
                          style={{ animationDuration: `${INTERVAL}ms`, animationPlayState: paused ? 'paused' : 'running' }}
                        />
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        <div className={styles.rightSide}>
          <div className={styles.frame}>
            <img
              key={active.image}
              src={getImagePath(active.image)}
              alt={active.text}
              className={styles.horizontalImage}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComingSoon;
