/**
 * elements/ComingSoon/ComingSoon.jsx
 * -----------------------------------------------------------------------------
 * "Stay tuned" block: a list of upcoming items on the left and a matching
 * picture on the right. Moves to the next item every 5 seconds; hovering or
 * focusing pauses it, and any item can be picked directly.
 * -----------------------------------------------------------------------------
 */
import React, { useState, useEffect } from 'react';
import { SitePicture } from '../../components/SitePicture/SitePicture';
import styles from './ComingSoon.module.css';

// The items and their pictures: real photos from S3, by name (components/SitePicture)
const CONTENT = [
  { text: 'Content coming soon', picture: 'coming-1' },
  { text: 'New features arriving', picture: 'coming-2' },
  { text: 'Stay tuned for updates', picture: 'coming-3' },
  { text: 'Exciting news ahead', picture: 'coming-4' },
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
            <SitePicture key={active.picture} name={active.picture} className={styles.horizontalImage} loading="eager" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComingSoon;
