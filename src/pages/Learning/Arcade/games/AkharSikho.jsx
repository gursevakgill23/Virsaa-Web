/**
 * pages/Learning/Arcade/games/AkharSikho.jsx
 * -----------------------------------------------------------------------------
 * Akhar Sikho: read a letter's name (ਊੜਾ, ਐੜਾ...), tap the letter, then trace
 * it. Each letter is worth the same share of 1000 points: 60% for finding it
 * (less after a wrong tap) and 40% for the tracing. The tracing has to follow
 * the letter (traceCheck.js): a scribble, another letter or part of the letter
 * is sent back with what to fix. After two tries the dotted guide stays on and
 * the letter can be skipped (no tracing points). After each letter its sound
 * and a word that starts with it are shown.
 * Content (learning_api/games.py): { rounds: [{letter, name, roman, sound, example,
 * example_meaning, options, kind}], trace: guided | outline | faint }
 * -----------------------------------------------------------------------------
 */
import React, { useCallback, useRef, useState } from 'react';
import { FaArrowRight, FaCheck, FaEraser, FaForward, FaStar } from 'react-icons/fa';
import arcade from '../Arcade.module.css';
import { sfx } from '../arcadeSound';
import styles from './AkharSikho.module.css';
import TraceCanvas from './TraceCanvas';
import { judgeTrace } from './traceCheck';

const WORDS = {
  english: {
    find: 'Find this letter', findSign: 'Find this vowel sign', trace: 'Now trace it', clear: 'Clear', done: 'Done',
    sound: 'Sound', startsWith: 'Starts', next: 'Next letter', finish: 'Finish', great: 'Lovely writing!',
    good: 'Well traced!', inside: 'in words, like', skip: 'Skip this one', skipped: 'Keep practising this one: try it again next time.',
    cover: 'Some of the letter isn’t traced yet. Go over every part of it.',
    stay: 'That doesn’t follow the letter. Keep your line on its shape.',
    scribble: 'Trace the letter’s lines, without scribbling over it.',
    help: 'The dots show the way: follow them.',
  },
  punjabi: {
    find: 'ਇਹ ਅੱਖਰ ਲੱਭੋ', findSign: 'ਇਹ ਲਗ ਲੱਭੋ', trace: 'ਹੁਣ ਇਸ ਨੂੰ ਲਿਖੋ', clear: 'ਮਿਟਾਓ', done: 'ਹੋ ਗਿਆ',
    sound: 'ਆਵਾਜ਼', startsWith: 'ਸ਼ੁਰੂ', next: 'ਅਗਲਾ ਅੱਖਰ', finish: 'ਪੂਰਾ ਕਰੋ', great: 'ਬਹੁਤ ਸੋਹਣਾ ਲਿਖਿਆ!',
    good: 'ਵਧੀਆ ਲਿਖਿਆ!', inside: 'ਸ਼ਬਦਾਂ ਵਿੱਚ, ਜਿਵੇਂ', skip: 'ਇਹ ਛੱਡੋ', skipped: 'ਇਸ ਦਾ ਅਭਿਆਸ ਕਰਦੇ ਰਹੋ: ਅਗਲੀ ਵਾਰ ਫਿਰ ਲਿਖਣਾ।',
    cover: 'ਅੱਖਰ ਦਾ ਕੁਝ ਹਿੱਸਾ ਅਜੇ ਨਹੀਂ ਲਿਖਿਆ। ਸਾਰੇ ਹਿੱਸਿਆਂ ਉੱਤੇ ਲਿਖੋ।',
    stay: 'ਇਹ ਅੱਖਰ ਵਰਗਾ ਨਹੀਂ ਬਣਿਆ। ਅੱਖਰ ਦੀ ਸ਼ਕਲ ਉੱਤੇ ਹੀ ਲਿਖੋ।',
    scribble: 'ਅੱਖਰ ਦੀਆਂ ਲਕੀਰਾਂ ਉੱਤੇ ਲਿਖੋ, ਉਸ ਨੂੰ ਰੰਗੋ ਨਾ।',
    help: 'ਬਿੰਦੀਆਂ ਰਾਹ ਦਿਖਾਉਂਦੀਆਂ ਹਨ: ਇਨ੍ਹਾਂ ਉੱਤੇ ਚੱਲੋ।',
  },
};

const SKIP_AFTER = 2;      // failed tries before the letter can be skipped

export default function AkharSikho({ content, language, onFinish, dark = false }) {
  const w = WORDS[language];
  const rounds = content.rounds || [];
  const mode = content.trace || 'guided';
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState('pick');
  const [wrong, setWrong] = useState([]);
  const [shake, setShake] = useState(null);
  const [ink, setInk] = useState(0);
  const [traceTries, setTraceTries] = useState(0);
  const [message, setMessage] = useState('');
  const [roundScores, setRoundScores] = useState([]);
  const pickScore = useRef(0);
  const firstTry = useRef(0);
  const traced = useRef(0);
  const traceRef = useRef(null);
  const round = rounds[index];
  const last = index === rounds.length - 1;

  const pick = (option) => {
    if (phase !== 'pick') return;
    if (option === round.letter) {
      sfx.correct();
      pickScore.current = wrong.length === 0 ? 1 : wrong.length === 1 ? 0.5 : 0.2;
      if (!wrong.length) firstTry.current += 1;
      setPhase('trace');
      setMessage('');
      setInk(0);
      setTraceTries(0);
    } else {
      sfx.wrong();
      setWrong((list) => [...list, option]);
      setShake(option);
      setTimeout(() => setShake(null), 450);
    }
  };

  const keepRound = useCallback((traceQuality) => {
    const value = 0.6 * pickScore.current + 0.4 * traceQuality;
    setRoundScores((list) => [...list, value]);
    setPhase('learned');
  }, []);

  // Only a tracing that follows the letter passes; anything else is sent back
  const checkTrace = () => {
    if (phase !== 'trace' || !traceRef.current) return;
    const verdict = judgeTrace(traceRef.current.measure(mode), mode);
    if (verdict.ok) {
      sfx.correct();
      traced.current += 1;
      const quality = verdict.quality * (traceTries ? 0.8 : 1);
      setMessage(quality > 0.75 ? w.great : w.good);
      keepRound(quality);
      return;
    }
    sfx.wrong();
    setTraceTries((n) => n + 1);
    setMessage(`${w[verdict.reason]}${mode !== 'guided' && !traceTries ? ` ${w.help}` : ''}`);
    traceRef.current.clear();
  };

  const skipTrace = () => {
    if (phase !== 'trace') return;
    sfx.tap();
    setMessage(w.skipped);
    keepRound(0);
  };

  const next = () => {
    sfx.pick();
    if (!last) {
      setIndex((i) => i + 1);
      setPhase('pick');
      setWrong([]);
      setMessage('');
      return;
    }
    const total = roundScores.reduce((a, b) => a + b, 0);
    onFinish({
      score: Math.round((total / rounds.length) * 1000),
      completed: true,
      details: { letters: rounds.map((r) => r.letter), first_try: firstTry.current, traced: traced.current },
    });
  };

  if (!round) return null;
  const isSign = round.kind === 'matra';

  return (
    <div className={styles.game}>
      <div className={arcade.hud}>
        <ol className={styles.dots} aria-label={`${index + 1} / ${rounds.length}`}>
          {rounds.map((r, i) => (
            <li key={r.slug || i} className={i < index || (i === index && phase === 'learned') ? styles.dotDone : i === index ? styles.dotNow : ''} />
          ))}
        </ol>
        <span className={arcade.hudSpacer} />
        <span className={arcade.hudPill}><FaStar aria-hidden="true" /> {Math.round((roundScores.reduce((a, b) => a + b, 0) / rounds.length) * 1000)}</span>
      </div>

      <div className={styles.frame}>
        <div className={styles.card}>
          {phase === 'pick' && (
            <>
              <p className={styles.prompt}>{isSign ? w.findSign : w.find}</p>
              <div className={styles.name}>
                <span lang="pa" className={styles.nameText}>{round.name}</span>
                <span className={styles.roman}>{round.roman}</span>
              </div>
              {isSign && <p className={styles.soundHint}>{round.sound}</p>}
              <div className={styles.options} data-count={round.options.length}>
                {round.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    lang="pa"
                    className={[styles.option, wrong.includes(option) ? styles.optionWrong : '', shake === option ? styles.shake : ''].join(' ')}
                    onClick={() => pick(option)}
                    disabled={wrong.includes(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </>
          )}

          {phase === 'trace' && (
            <>
              <p className={styles.prompt}>{w.trace}: <span lang="pa">{round.name}</span></p>
              <TraceCanvas ref={traceRef} text={round.letter} mode={traceTries ? 'guided' : mode} onInk={setInk} dark={dark} />
              {message && <p className={`${styles.message} ${styles.messageRetry}`} role="status">{message}</p>}
              <div className={styles.traceButtons}>
                <button type="button" className={arcade.btnGhost} onClick={() => traceRef.current?.clear()}>
                  <FaEraser aria-hidden="true" /> {w.clear}
                </button>
                <button type="button" className={arcade.btn} onClick={checkTrace} disabled={ink < 3}>
                  <FaCheck aria-hidden="true" /> {w.done}
                </button>
              </div>
              {traceTries >= SKIP_AFTER && (
                <button type="button" className={styles.skip} onClick={skipTrace}>
                  <FaForward aria-hidden="true" /> {w.skip}
                </button>
              )}
            </>
          )}

          {phase === 'learned' && (
            <div className={styles.learned}>
              <span className={styles.bigLetter} lang="pa">{round.letter}</span>
              <p className={styles.learnedName}><span lang="pa">{round.name}</span> <small>{round.roman}</small></p>
              {message && <p className={styles.message} role="status">{message}</p>}
              <p className={styles.fact}><b>{w.sound}:</b> {round.sound}</p>
              {round.example && (
                <p className={styles.example}>
                  <span lang="pa">{round.example}</span>
                  <small>{round.example_meaning}</small>
                </p>
              )}
              {!round.example && round.inside && (
                <p className={styles.fact}>{w.inside} <span lang="pa">{round.inside}</span> ({round.inside_meaning})</p>
              )}
              {round.note && <p className={styles.fact}>{round.note}</p>}
              <button type="button" className={arcade.btnBig} onClick={next}>
                {last ? w.finish : w.next} <FaArrowRight aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
