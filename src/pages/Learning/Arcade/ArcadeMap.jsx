/**
 * pages/Learning/Arcade/ArcadeMap.jsx
 * -----------------------------------------------------------------------------
 * The game's map: nine stages along a winding trail, in three stretches
 * (easy, medium, hard). Each stage shows its stars; the next one to play
 * glows; locked ones show a padlock. The trail is drawn in the game's own
 * style (a phulkari thread, a rail track, a river, a kite string...).
 * -----------------------------------------------------------------------------
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { FaLock, FaStar } from 'react-icons/fa';
import styles from './Arcade.module.css';

const ROW = 116;          // px between stages
const ZONE_GAP = 88;      // px for a stretch's label
const TOP = 26;
const X = [50, 76, 50, 24];   // the trail snakes left and right (percent of the width)

const layout = (count) => {
  let y = TOP;
  return Array.from({ length: count }, (_, i) => {
    if (i % 3 === 0) y += ZONE_GAP;
    const point = { x: X[i % X.length], y };
    y += ROW;
    return point;
  });
};

// A smooth curve through the points (Catmull-Rom as Bezier curves); x in %, y in px
const trailPath = (points) => {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`;
  }
  return d;
};

// The trail's look: layers of strokes drawn on top of each other. Colours that
// change in dark mode come from the game's palette (Arcade.module.css).
const TRAILS = {
  thread: [{ w: 12, c: 'var(--accent)', o: 0.25 }, { w: 5, c: 'var(--accent-2)', dash: '10 9' }],
  chalk: [{ w: 14, c: 'var(--trail-shade, rgba(60, 40, 20, .18))' }, { w: 4, c: '#fffaf0', dash: '14 10' }],
  ribbon: [{ w: 16, c: 'var(--accent)' }, { w: 5, c: 'rgba(255,255,255,.7)', dash: '2 12' }],
  stones: [{ w: 18, c: 'var(--trail-stone, rgba(42, 91, 215, .25))', dash: '0.1 26', cap: 'round' },
    { w: 6, c: 'var(--trail-stone-2, rgba(42, 91, 215, .35))', dash: '3 20' }],
  rail: [{ w: 26, c: 'var(--rail-tie, #8b6a4a)', dash: '5 9' }, { w: 15, c: 'var(--rail, #4b3a2c)' }, { w: 10, c: 'var(--background-color, #fff)' }],
  lights: [{ w: 3, c: 'rgba(255, 182, 39, .45)' }, { w: 12, c: 'var(--accent)', dash: '0.1 30', cap: 'round', glow: true }],
  river: [{ w: 22, c: '#2E86C1', o: 0.85 }, { w: 9, c: '#9fd4f5', dash: '18 12' }],
  marble: [{ w: 20, c: 'var(--accent)' }, { w: 14, c: 'var(--marble, #fffdf7)' }, { w: 2, c: 'var(--accent)', dash: '1 14' }],
  string: [{ w: 3, c: 'var(--kite-string, rgba(45, 42, 31, .7))', dash: '8 6' }],
  durrie: [{ w: 22, c: 'var(--accent-2)' }, { w: 22, c: 'var(--accent-3)', dash: '12 12' }, { w: 4, c: '#fff4dc' }],
};

const Stars = ({ count, className }) => (
  <span className={className} aria-hidden="true">
    {[0, 1, 2].map((i) => <FaStar key={i} className={i < count ? styles.starOn : styles.starOff} />)}
  </span>
);

export { Stars };

/**
 * Props: stages, progress {stage: {stars}}, unlockedUpTo, pathStyle, t (words), language,
 *        onSelect(stageNumber)
 */
export default function ArcadeMap({ stages, progress, unlockedUpTo, pathStyle, t, language, onSelect }) {
  const points = useMemo(() => layout(stages.length), [stages.length]);
  const height = (points[points.length - 1]?.y || 0) + 110;
  const d = trailPath(points);
  const currentRef = useRef(null);

  // Bring the next stage to play into view (once, when the map opens)
  useEffect(() => {
    if (unlockedUpTo > 2 && currentRef.current?.scrollIntoView) {
      currentRef.current.scrollIntoView({ block: 'center', behavior: 'auto' });
    }
  }, [unlockedUpTo]);

  return (
    <div className={styles.mapArea} style={{ height }}>
      <svg className={styles.trail} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <filter id="arcade-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {(TRAILS[pathStyle] || TRAILS.thread).map((layer, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={layer.c}
            strokeOpacity={layer.o ?? 1}
            strokeWidth={layer.w}
            strokeDasharray={layer.dash}
            strokeLinecap={layer.cap || 'round'}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            filter={layer.glow ? 'url(#arcade-glow)' : undefined}
          />
        ))}
      </svg>

      {stages.map((stage, i) => {
        const point = points[i];
        const stars = progress[stage.stage]?.stars || 0;
        const locked = stage.stage > unlockedUpTo;
        const current = stage.stage === unlockedUpTo && stars === 0;
        const zone = i % 3 === 0 ? (
          <div key={`zone-${stage.difficulty}`} className={`${styles.zoneLabel} ${styles[`zone_${stage.difficulty}`]}`}
            style={{ top: point.y - ZONE_GAP + 4 }}
          >
            {t.zone[stage.difficulty]}
          </div>
        ) : null;
        const name = language === 'punjabi' ? stage.name_pa : stage.name;
        // The name goes on the side away from the trail's next bend
        const towards = point.x === 50 ? (points[i + 1] || points[i - 1] || point).x : point.x;
        const labelSide = towards > 50 ? styles.nodeNameLeft : styles.nodeNameRight;
        return (
          <React.Fragment key={stage.stage}>
            {zone}
            <button
              type="button"
              ref={current ? currentRef : undefined}
              className={[styles.node, styles[`node_${stage.difficulty}`], locked ? styles.nodeLocked : '',
                current ? styles.nodeCurrent : '', stars === 3 ? styles.nodePerfect : ''].join(' ')}
              style={{ left: `${point.x}%`, top: point.y }}
              onClick={() => onSelect(stage.stage)}
              aria-label={`${t.stageLabel(stage.stage)}: ${name}. ${locked ? t.locked : t.progressLabel(stars, 3)}`}
            >
              <span className={styles.nodeFace}>{locked ? <FaLock aria-hidden="true" /> : stage.stage}</span>
              <Stars count={stars} className={styles.nodeStars} />
              <span className={`${styles.nodeName} ${labelSide}`}>
                {name}
              </span>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}
