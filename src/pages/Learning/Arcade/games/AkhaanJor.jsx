/**
 * pages/Learning/Arcade/games/AkhaanJor.jsx
 * -----------------------------------------------------------------------------
 * Akhaan Jor: join the two halves of Punjabi proverbs. Tap a beginning on the
 * left, then its ending on the right; a matched pair is tied with a coloured
 * parandi ribbon. When a board is done, each proverb's meaning is shown.
 * Each pair is worth full points first time, less after wrong tries; hard
 * stages have a timer per board, which stops as soon as the last pair is tied.
 * Content: { boards: [[{start, end, literal, meaning}]], timer }
 * -----------------------------------------------------------------------------
 */
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { FaArrowRight, FaClock, FaRibbon } from 'react-icons/fa';
import arcade from '../Arcade.module.css';
import { sfx } from '../arcadeSound';
import styles from './AkhaanJor.module.css';
import { formatTime, shuffle } from './common';

const RIBBONS = ['#E2477E', '#F2B134', '#3A4BA8', '#2FA36B', '#F0702A', '#8E44AD'];

const WORDS = {
  english: {
    beginnings: 'Beginnings', endings: 'Endings', tapStart: 'Tap a beginning, then its ending.',
    meanings: 'What they mean', says: 'Word for word', means: 'Meaning', nextBoard: 'Next board', finish: 'Finish',
    board: 'Board', timeUp: 'Time is up! Here are the answers.',
  },
  punjabi: {
    beginnings: 'ਸ਼ੁਰੂ', endings: 'ਅੰਤ', tapStart: 'ਪਹਿਲਾਂ ਸ਼ੁਰੂ ਛੂਹੋ, ਫਿਰ ਉਸ ਦਾ ਅੰਤ।',
    meanings: 'ਇਨ੍ਹਾਂ ਦੇ ਅਰਥ', says: 'ਸ਼ਬਦੀ ਅਰਥ', means: 'ਭਾਵ', nextBoard: 'ਅਗਲਾ ਬੋਰਡ', finish: 'ਪੂਰਾ ਕਰੋ',
    board: 'ਬੋਰਡ', timeUp: 'ਸਮਾਂ ਖ਼ਤਮ! ਇਹ ਰਹੇ ਜਵਾਬ।',
  },
};

export default function AkhaanJor({ content, language, onFinish }) {
  const w = WORDS[language];
  const boards = useMemo(() => content.boards || [], [content.boards]);
  const [boardIndex, setBoardIndex] = useState(0);
  // (two proverbs with the same ending can't share a board: either card would be right)
  const pairs = useMemo(() => (boards[boardIndex] || []).filter((p, i, list) => list.findIndex((q) => q.end === p.end) === i),
    [boards, boardIndex]);
  const endings = useMemo(() => shuffle(pairs.map((p, i) => ({ text: p.end, index: i }))), [pairs]);
  const [selected, setSelected] = useState(null);       // index of the chosen beginning
  const [matched, setMatched] = useState({});           // beginning index -> ribbon colour number
  const [misses, setMisses] = useState({});             // beginning index -> wrong tries
  const [wrongFlash, setWrongFlash] = useState(null);
  const [showMeanings, setShowMeanings] = useState(false);
  const [boardDone, setBoardDone] = useState(false);       // every pair tied (the meanings follow)
  const [timeLeft, setTimeLeft] = useState(content.timer || null);
  const [timedOut, setTimedOut] = useState(false);
  const boardScores = useRef([]);
  const mistakes = useRef(0);
  const boardRef = useRef(null);
  const startRefs = useRef([]);
  const endRefs = useRef([]);
  const [lines, setLines] = useState([]);
  const matchedCount = Object.keys(matched).length;

  // ------------------------------------------------------------ the timer (hard stages)
  useEffect(() => {
    if (!content.timer || showMeanings || boardDone) return undefined;
    const id = setInterval(() => setTimeLeft((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [content.timer, showMeanings, boardDone, boardIndex]);

  const closeBoard = useCallback((finalMatched, finalMisses, outOfTime) => {
    const score = pairs.reduce((sum, _, i) => {
      if (finalMatched[i] === undefined) return sum;
      return sum + Math.max(0.25, 1 - 0.3 * (finalMisses[i] || 0));
    }, 0) / Math.max(1, pairs.length);
    boardScores.current[boardIndex] = score;
    setTimedOut(outOfTime);
    setShowMeanings(true);
  }, [pairs, boardIndex]);

  useEffect(() => {
    if (content.timer && timeLeft === 0 && !showMeanings && !boardDone) {
      sfx.sad();
      closeBoard(matched, misses, true);
    }
  }, [timeLeft, content.timer, showMeanings, boardDone, closeBoard, matched, misses]);

  // ------------------------------------------------------------ ribbons between matched cards
  const measure = useCallback(() => {
    const box = boardRef.current?.getBoundingClientRect();
    if (!box) return;
    const next = Object.entries(matched).map(([i, colour]) => {
      const a = startRefs.current[i]?.getBoundingClientRect();
      const endPos = endings.findIndex((e) => e.index === Number(i));
      const b = endRefs.current[endPos]?.getBoundingClientRect();
      if (!a || !b) return null;
      return {
        key: i, colour: RIBBONS[colour % RIBBONS.length],
        x1: a.right - box.left, y1: a.top + a.height / 2 - box.top, x2: b.left - box.left, y2: b.top + b.height / 2 - box.top,
      };
    }).filter(Boolean);
    setLines(next);
  }, [matched, endings]);

  useLayoutEffect(() => { measure(); }, [measure]);
  useEffect(() => {
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  // ------------------------------------------------------------ choosing
  const chooseStart = (i) => {
    if (matched[i] !== undefined || showMeanings || boardDone) return;
    sfx.tap();
    setSelected(i);
  };

  const chooseEnd = (ending) => {
    if (showMeanings || boardDone || matched[ending.index] !== undefined) return;
    if (selected === null) {
      sfx.tap();
      return;
    }
    if (ending.index === selected) {
      sfx.correct();
      const nextMatched = { ...matched, [selected]: matchedCount };
      setMatched(nextMatched);
      setSelected(null);
      if (Object.keys(nextMatched).length === pairs.length) {
        setBoardDone(true);                 // the clock stops here, not when the meanings appear
        setTimeout(() => { sfx.win(); closeBoard(nextMatched, misses, false); }, 700);
      }
    } else {
      sfx.wrong();
      mistakes.current += 1;
      const nextMisses = { ...misses, [selected]: (misses[selected] || 0) + 1 };
      setMisses(nextMisses);
      setWrongFlash({ start: selected, end: ending.index });
      setTimeout(() => setWrongFlash(null), 450);
    }
  };

  const nextBoard = () => {
    sfx.pick();
    if (boardIndex + 1 < boards.length) {
      setBoardIndex((b) => b + 1);
      setSelected(null);
      setMatched({});
      setMisses({});
      setShowMeanings(false);
      setBoardDone(false);
      setTimedOut(false);
      setTimeLeft(content.timer || null);
      setLines([]);
      return;
    }
    const total = boardScores.current.reduce((a, b) => a + (b || 0), 0) / Math.max(1, boards.length);
    onFinish({
      score: Math.round(total * 1000),
      completed: true,
      details: { boards: boards.length, mistakes: mistakes.current },
    });
  };

  if (!pairs.length) return null;

  return (
    <div className={styles.game}>
      <div className={arcade.hud}>
        <span className={arcade.hudPill}>{w.board} {boardIndex + 1}/{boards.length}</span>
        <span className={arcade.hudPill}><FaRibbon aria-hidden="true" /> {matchedCount}/{pairs.length}</span>
        <span className={arcade.hudSpacer} />
        {content.timer && (
          <span className={`${arcade.hudPill} ${timeLeft <= 15 ? styles.timeLow : ''}`}><FaClock aria-hidden="true" /> {formatTime(timeLeft)}</span>
        )}
      </div>

      {!showMeanings && (
        <>
          <p className={styles.instructions}>{w.tapStart}</p>
          <div className={styles.board} ref={boardRef}>
            <svg className={styles.ribbons} aria-hidden="true">
              {lines.map((l) => {
                const mid = (l.x1 + l.x2) / 2;
                return (
                  <g key={l.key}>
                    <path d={`M${l.x1} ${l.y1} C${mid} ${l.y1}, ${mid} ${l.y2}, ${l.x2} ${l.y2}`} stroke={l.colour} strokeWidth="9" fill="none" strokeLinecap="round" />
                    <path d={`M${l.x1} ${l.y1} C${mid} ${l.y1}, ${mid} ${l.y2}, ${l.x2} ${l.y2}`} stroke="rgba(255,255,255,.55)" strokeWidth="2" strokeDasharray="2 8" fill="none" />
                    <circle cx={mid} cy={(l.y1 + l.y2) / 2} r="8" fill={l.colour} />
                  </g>
                );
              })}
            </svg>
            <div className={styles.column}>
              <h3 className={styles.columnTitle}>{w.beginnings}</h3>
              {pairs.map((p, i) => (
                <button
                  key={p.slug || p.start}
                  ref={(el) => { startRefs.current[i] = el; }}
                  type="button"
                  lang="pa"
                  className={[styles.card, selected === i ? styles.selected : '',
                    matched[i] !== undefined ? styles.matched : '', wrongFlash?.start === i ? styles.wrong : ''].filter(Boolean).join(' ')}
                  style={matched[i] !== undefined ? { '--ribbon': RIBBONS[matched[i] % RIBBONS.length] } : undefined}
                  onClick={() => chooseStart(i)}
                  aria-pressed={selected === i}
                >
                  {p.start} …
                </button>
              ))}
            </div>
            <div className={styles.column}>
              <h3 className={styles.columnTitle}>{w.endings}</h3>
              {endings.map((e, pos) => {
                const colour = matched[e.index];
                return (
                  <button
                    key={e.text}
                    ref={(el) => { endRefs.current[pos] = el; }}
                    type="button"
                    lang="pa"
                    className={[styles.card, styles.endCard, colour !== undefined ? styles.matched : '',
                      wrongFlash?.end === e.index ? styles.wrong : ''].filter(Boolean).join(' ')}
                    style={colour !== undefined ? { '--ribbon': RIBBONS[colour % RIBBONS.length] } : undefined}
                    onClick={() => chooseEnd(e)}
                    disabled={colour !== undefined}
                  >
                    … {e.text}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {showMeanings && (
        <div className={styles.meanings}>
          <h2 className={styles.meaningsTitle}>{w.meanings}</h2>
          {timedOut && <p className={styles.timeUp}>{w.timeUp}</p>}
          <ul>
            {pairs.map((p, i) => (
              <li key={p.slug || p.start} style={{ '--ribbon': RIBBONS[(matched[i] ?? i) % RIBBONS.length] }}>
                <p className={styles.proverb} lang="pa">{p.start} {p.end}</p>
                <p><b>{w.says}:</b> {p.literal}</p>
                <p><b>{w.means}:</b> {p.meaning}</p>
              </li>
            ))}
          </ul>
          <button type="button" className={arcade.btnBig} onClick={nextBoard}>
            {boardIndex + 1 < boards.length ? w.nextBoard : w.finish} <FaArrowRight aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
