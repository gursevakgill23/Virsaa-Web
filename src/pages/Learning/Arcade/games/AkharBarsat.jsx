/**
 * pages/Learning/Arcade/games/AkharBarsat.jsx
 * -----------------------------------------------------------------------------
 * Akhar Barsat: letters, syllables and words fall from the monsoon clouds as
 * raindrops. Type each one (on the on-screen keyboard or a Gurmukhi
 * keyboard) before it lands. A word is typed tile by tile: the letter, then
 * its vowel sign. Every drop that lands takes a life; the stage ends when
 * the rain stops (or the lives run out). Score: the share of drops caught,
 * out of 1000. The game pauses when the tab is hidden.
 * Content: { drops: [{text, tiles, roman?, meaning?}] } + stage settings
 * (fall_seconds, spawn_seconds, lives, keyboard, groups).
 * -----------------------------------------------------------------------------
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaHeart, FaPause, FaPlay, FaTint } from 'react-icons/fa';
import arcade from '../Arcade.module.css';
import { sfx } from '../arcadeSound';
import GurmukhiKeyboard, { LETTER_ROWS, SIGNS } from '../GurmukhiKeyboard';
import { isCombining, tiles } from '../gurmukhi';
import styles from './AkharBarsat.module.css';

const WORDS = {
  english: {
    caught: 'Caught', pause: 'Pause', paused: 'Paused', resume: 'Keep playing', ready: 'Get ready…', typing: 'Typing',
    start: 'Start the rain', intro: 'Type each raindrop before it reaches the ground!', typeHere: 'Type what you see on a drop',
  },
  punjabi: {
    caught: 'ਫੜੀਆਂ', pause: 'ਰੋਕੋ', paused: 'ਖੇਡ ਰੁਕੀ ਹੋਈ ਹੈ', resume: 'ਖੇਡਦੇ ਰਹੋ', ready: 'ਤਿਆਰ ਹੋ ਜਾਓ…', typing: 'ਲਿਖ ਰਹੇ ਹੋ',
    start: 'ਮੀਂਹ ਸ਼ੁਰੂ ਕਰੋ', intro: 'ਹਰ ਬੂੰਦ ਨੂੰ ਧਰਤੀ ਤੇ ਪਹੁੰਚਣ ਤੋਂ ਪਹਿਲਾਂ ਲਿਖੋ!', typeHere: 'ਬੂੰਦ ਉੱਤੇ ਜੋ ਦਿਸਦਾ ਹੈ, ਲਿਖੋ',
  },
};

// Does the typed text fit the start of this drop? (the last tile may be half typed)
const fits = (typedTiles, target) => {
  if (typedTiles.length > target.length) return false;
  return typedTiles.every((t, i) => (i < typedTiles.length - 1 ? t === target[i] : target[i].startsWith(t)));
};

export default function AkharBarsat({ stage, content, language, onFinish }) {
  const w = WORDS[language];
  const s = stage.settings || {};
  const queue = useMemo(() => (content.drops || []).map((d, i) => ({ ...d, id: i, tiles: d.tiles || tiles(d.text) })), [content.drops]);
  const fall = (s.fall_seconds || 9) * 1000;
  const spawnEvery = (s.spawn_seconds || 2.5) * 1000;
  const maxLives = s.lives || 5;

  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [, setFrame] = useState(0);
  const [buffer, setBuffer] = useState('');
  const [bufferWrong, setBufferWrong] = useState(false);
  const [effects, setEffects] = useState([]);   // pops and splashes
  const game = useRef({ now: 0, last: null, spawned: 0, active: [], caught: 0, missed: 0, lives: maxLives, combo: 0, best: 0, over: false });
  const raf = useRef(null);

  const addEffect = useCallback((kind, x, y, text) => {
    const id = `${kind}-${Math.random()}`;
    setEffects((list) => [...list, { id, kind, x, y, text }]);
    setTimeout(() => setEffects((list) => list.filter((e) => e.id !== id)), 700);
  }, []);

  const end = useCallback((completed) => {
    const g = game.current;
    if (g.over) return;
    g.over = true;
    cancelAnimationFrame(raf.current);
    const score = Math.round((g.caught / Math.max(1, queue.length)) * 1000);
    setTimeout(() => onFinish({
      score: completed ? score : Math.min(score, 299),
      completed,
      details: { caught: g.caught, missed: g.missed, best_combo: g.best, drops: queue.length },
    }), 600);
  }, [queue.length, onFinish]);

  // ------------------------------------------------------------ the rain
  const tick = useCallback((t) => {
    const g = game.current;
    if (g.over) return;
    if (g.last === null) g.last = t;
    const dt = Math.min(100, t - g.last);
    g.last = t;
    g.now += dt;
    // a new drop every few seconds
    while (g.spawned < queue.length && g.now >= g.spawned * spawnEvery) {
      const drop = queue[g.spawned];
      g.active.push({ ...drop, x: 10 + Math.random() * 80, born: g.spawned * spawnEvery, wobble: Math.random() * Math.PI * 2 });
      g.spawned += 1;
    }
    // drops that reached the ground
    const landed = g.active.filter((d) => g.now - d.born >= fall);
    if (landed.length) {
      g.active = g.active.filter((d) => g.now - d.born < fall);
      landed.forEach((d) => {
        g.missed += 1;
        g.lives -= 1;
        g.combo = 0;
        sfx.splash();
        addEffect('splash', d.x, 100, d.text);
      });
      setBuffer('');
      if (g.lives <= 0) {
        setFrame((f) => f + 1);
        end(false);
        return;
      }
    }
    if (g.spawned >= queue.length && g.active.length === 0) {
      setFrame((f) => f + 1);
      end(true);
      return;
    }
    setFrame((f) => f + 1);
    raf.current = requestAnimationFrame(tick);
  }, [queue, spawnEvery, fall, end, addEffect]);

  useEffect(() => {
    if (!started || paused) return undefined;
    game.current.last = null;
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [started, paused, tick]);

  // Pause when the tab is hidden, so no drops are lost while away
  useEffect(() => {
    const onHide = () => { if (document.hidden) setPaused(true); };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, []);

  // ------------------------------------------------------------ typing
  const catchDrop = useCallback((drop) => {
    const g = game.current;
    g.active = g.active.filter((d) => d.id !== drop.id);
    g.caught += 1;
    g.combo += 1;
    g.best = Math.max(g.best, g.combo);
    sfx.pop();
    const y = Math.min(96, ((g.now - drop.born) / fall) * 100);
    addEffect('pop', drop.x, y, drop.text);
  }, [fall, addEffect]);

  const onKey = useCallback((ch) => {
    const g = game.current;
    if (!started || paused || g.over) return;
    const next = buffer + ch;
    if (isCombining(ch) && !buffer) return;
    const typed = tiles(next);
    // the drop nearest the ground that fits what has been typed
    const candidates = g.active.filter((d) => fits(typed, d.tiles)).sort((a, b) => a.born - b.born);
    if (!candidates.length) {
      sfx.wrong();
      g.combo = 0;
      setBufferWrong(true);
      setTimeout(() => setBufferWrong(false), 350);
      setBuffer('');
      return;
    }
    const done = candidates.find((d) => d.tiles.length === typed.length && d.tiles.every((t, i) => t === typed[i]));
    if (done) {
      catchDrop(done);
      setBuffer('');
    } else {
      sfx.tap();
      setBuffer(next);
    }
  }, [started, paused, buffer, catchDrop]);

  const onBackspace = useCallback(() => setBuffer((b) => [...b].slice(0, -1).join('')), []);

  // ------------------------------------------------------------ keyboard keys for this stage
  const letters = useMemo(() => {
    if (s.keyboard !== 'small') return undefined;
    const needed = new Set(queue.map((d) => d.text.normalize('NFC')));
    const all = LETTER_ROWS.flat();
    // the letters that fall, plus the letters next to them in the Painti, so it isn't too easy
    const near = new Set();
    all.forEach((k, i) => {
      if (needed.has(k.normalize('NFC'))) [all[i - 1], all[i + 1]].forEach((n) => n && near.add(n));
    });
    return all.filter((k) => needed.has(k.normalize('NFC')) || near.has(k));
  }, [queue, s.keyboard]);
  const signs = s.source === 'letters' ? [] : SIGNS;

  const g = game.current;
  const typedTiles = tiles(buffer);

  return (
    <div className={styles.game}>
      <div className={arcade.hud}>
        <span className={arcade.hudPill} aria-label={`${g.lives} lives`}>
          {Array.from({ length: maxLives }).map((_, i) => (
            <FaHeart key={i} className={i < g.lives ? styles.heartOn : styles.heartOff} aria-hidden="true" />
          ))}
        </span>
        <span className={arcade.hudPill}><FaTint aria-hidden="true" /> {w.caught}: {g.caught}/{queue.length}</span>
        {g.combo >= 3 && <span className={`${arcade.hudPill} ${styles.combo}`}>×{g.combo}</span>}
        <span className={arcade.hudSpacer} />
        {started && !g.over && (
          <button type="button" className={arcade.btnGhost} onClick={() => setPaused((p) => !p)} aria-label={paused ? w.resume : w.pause}>
            {paused ? <FaPlay aria-hidden="true" /> : <FaPause aria-hidden="true" />} <span className={styles.wideOnly}>{paused ? w.resume : w.pause}</span>
          </button>
        )}
      </div>

      <div className={styles.sky}>
        <div className={styles.clouds} aria-hidden="true">
          <span /><span /><span /><span />
        </div>
        {g.active.map((d) => {
          const y = ((g.now - d.born) / fall) * 100;
          const fit = buffer && fits(typedTiles, d.tiles);
          return (
            <div
              key={d.id}
              className={`${styles.drop} ${fit ? styles.dropFit : ''} ${d.tiles.length > 1 ? styles.dropWide : ''}`}
              style={{ left: `${d.x}%`, top: `${y}%`, transform: `translate(-50%, -100%) rotate(${Math.sin(g.now / 400 + d.wobble) * 4}deg)` }}
              lang="pa"
            >
              <span className={styles.dropText}>
                {d.tiles.map((t, i) => (
                  <span key={i} className={fit && i < typedTiles.length - 1 ? styles.tileDone : ''}>{t}</span>
                ))}
              </span>
            </div>
          );
        })}
        {effects.map((e) => (
          <span key={e.id} className={e.kind === 'pop' ? styles.pop : styles.splash} style={{ left: `${e.x}%`, top: `${e.y}%` }}
            aria-hidden="true"
          >
            {e.kind === 'pop' ? '✦' : ''}
          </span>
        ))}
        <div className={styles.ground} aria-hidden="true">
          <span className={styles.frog} style={{ left: `${20 + (g.caught % 5) * 14}%` }}>
            <i /><i />
          </span>
        </div>
        {!started && (
          <div className={styles.startPanel}>
            <p>{w.intro}</p>
            <button type="button" className={arcade.btnBig} onClick={() => { sfx.whoosh(); setStarted(true); }}>
              <FaPlay aria-hidden="true" /> {w.start}
            </button>
          </div>
        )}
        {paused && <div className={styles.pausedPanel}>{w.paused}</div>}
      </div>

      <div className={`${styles.buffer} ${bufferWrong ? styles.bufferWrong : ''} ${buffer ? '' : styles.bufferEmpty}`} aria-live="polite"
        lang={buffer ? 'pa' : undefined}
      >
        {buffer ? <><small>{w.typing}:</small> {buffer}</> : <small>{w.typeHere}</small>}
      </div>

      <GurmukhiKeyboard onKey={onKey} onBackspace={onBackspace} letters={letters} signs={signs} disabled={!started || paused}
        language={language}
      />
    </div>
  );
}
