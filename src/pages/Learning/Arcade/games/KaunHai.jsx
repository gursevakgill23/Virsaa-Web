/**
 * pages/Learning/Arcade/games/KaunHai.jsx
 * -----------------------------------------------------------------------------
 * Kaun Hai? (who is it?): a person from Sikh and Punjabi history, in four
 * clues from the hardest to the easiest. The first diya is lit; light more
 * to read more clues, and guess whenever you are ready. Fewer clues score
 * more; a wrong guess costs points. A hint (coins) takes away one wrong name.
 * Text only: no pictures of the Gurus.
 * Content: { rounds: [{name, name_pa, clues: [4], fact, options: [{name, name_pa}]}] }
 * -----------------------------------------------------------------------------
 */
import React, { useState } from 'react';
import { FaArrowRight, FaFire, FaLightbulb, FaQuestion } from 'react-icons/fa';
import { toast } from '../../../../utils/notify';
import arcade from '../Arcade.module.css';
import { sfx } from '../arcadeSound';
import styles from './KaunHai.module.css';

const VALUE_BY_CLUES = [1, 0.75, 0.5, 0.3];   // share of a round's points, by clues read
const WRONG_COST = 0.15;
const HINT_COST = 10;

const WORDS = {
  english: {
    who: 'Who is it?', light: 'Light the next diya', clue: 'Clue', guess: 'Your guess', itWas: (name) => `It was ${name}!`,
    next: 'Next person', finish: 'Finish', hint: 'Remove a wrong name', points: 'points', coins: 'coins',
    notQuite: 'Not quite! Read another clue or try again.',
  },
  punjabi: {
    who: 'ਕੌਣ ਹੈ?', light: 'ਅਗਲਾ ਦੀਵਾ ਜਗਾਓ', clue: 'ਇਸ਼ਾਰਾ', guess: 'ਤੁਹਾਡਾ ਜਵਾਬ', itWas: (name) => `ਇਹ ${name} ਸਨ!`,
    next: 'ਅਗਲਾ ਵਿਅਕਤੀ', finish: 'ਪੂਰਾ ਕਰੋ', hint: 'ਇੱਕ ਗ਼ਲਤ ਨਾਂ ਹਟਾਓ', points: 'ਅੰਕ', coins: 'ਸਿੱਕੇ',
    notQuite: 'ਨਹੀਂ! ਇੱਕ ਹੋਰ ਇਸ਼ਾਰਾ ਪੜ੍ਹੋ ਜਾਂ ਫਿਰ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
  },
};

const Diya = ({ lit, onClick, disabled, label }) => (
  <button type="button" className={`${styles.diya} ${lit ? styles.lit : ''}`} onClick={onClick} disabled={disabled} aria-label={label}>
    <span className={styles.glow} aria-hidden="true" />
    <span className={styles.flame} aria-hidden="true" />
    <span className={styles.lamp} aria-hidden="true" />
  </button>
);

export default function KaunHai({ content, language, onFinish, wallet }) {
  const w = WORDS[language];
  const rounds = content.rounds || [];
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(1);
  const [wrong, setWrong] = useState([]);
  const [removed, setRemoved] = useState([]);
  const [solved, setSolved] = useState(false);
  const [scores, setScores] = useState([]);
  const round = rounds[index];
  const pa = language === 'punjabi';

  const value = () => Math.max(0.1, VALUE_BY_CLUES[shown - 1] - WRONG_COST * wrong.length);

  const lightNext = () => {
    if (solved || shown >= round.clues.length) return;
    sfx.pick();
    setShown((n) => n + 1);
  };

  const guess = (name) => {
    if (solved || wrong.includes(name) || removed.includes(name)) return;
    if (name === round.name) {
      sfx.correct();
      setScores((s) => [...s, value()]);
      setSolved(true);
      setShown(round.clues.length);
    } else {
      sfx.wrong();
      setWrong((list) => [...list, name]);
      toast.info(w.notQuite);
    }
  };

  const hint = async () => {
    const left = round.options.map((o) => o.name).filter((n) => n !== round.name && !wrong.includes(n) && !removed.includes(n));
    if (left.length <= 1) return;
    const paid = await wallet.spend(HINT_COST, 'Kaun Hai hint');
    if (!paid.ok) {
      toast.error(paid.reason === 'coins' ? `A hint costs ${HINT_COST} ${w.coins}.` : paid.message);
      return;
    }
    sfx.pop();
    setRemoved((list) => [...list, left[Math.floor(Math.random() * left.length)]]);
  };

  const next = () => {
    sfx.pick();
    if (index + 1 < rounds.length) {
      setIndex((i) => i + 1);
      setShown(1);
      setWrong([]);
      setRemoved([]);
      setSolved(false);
      return;
    }
    const total = scores.reduce((a, b) => a + b, 0) / Math.max(1, rounds.length);
    onFinish({ score: Math.round(total * 1000), completed: true, details: { people: rounds.length } });
  };

  if (!round) return null;
  const pointsNow = Math.round((value() * 1000) / rounds.length);

  return (
    <div className={styles.game}>
      <div className={arcade.hud}>
        <span className={arcade.hudPill}>{index + 1}/{rounds.length}</span>
        {!solved && <span className={arcade.hudPill}><FaFire aria-hidden="true" /> {pointsNow} {w.points}</span>}
        <span className={arcade.hudSpacer} />
        {!solved && (
          <button type="button" className={styles.hintButton} onClick={hint}>
            <FaLightbulb aria-hidden="true" /> {w.hint} <small>{HINT_COST}</small>
          </button>
        )}
      </div>

      <div className={styles.night}>
        <h2 className={styles.question}>{solved ? w.itWas(pa ? round.name_pa : round.name) : w.who}</h2>
        <div className={styles.diyas}>
          {round.clues.map((clue, i) => (
            <div key={clue} className={styles.clueColumn}>
              <Diya
                lit={i < shown}
                onClick={i === shown ? lightNext : undefined}
                disabled={solved || i !== shown}
                label={`${w.clue} ${i + 1}`}
              />
              <p className={`${styles.clue} ${i < shown ? styles.clueShown : ''}`}>
                {i < shown ? clue : <FaQuestion aria-hidden="true" />}
              </p>
            </div>
          ))}
        </div>
        {!solved && shown < round.clues.length && (
          <button type="button" className={styles.lightButton} onClick={lightNext}>
            <FaFire aria-hidden="true" /> {w.light}
          </button>
        )}
        {solved && round.fact && <p className={styles.fact}>{round.fact}</p>}
      </div>

      {!solved && (
        <>
          <h3 className={styles.guessTitle}>{w.guess}</h3>
          <div className={styles.options}>
            {round.options.map((o) => {
              const out = wrong.includes(o.name) || removed.includes(o.name);
              return (
                <button key={o.name} type="button" className={`${styles.option} ${out ? styles.optionOut : ''}`}
                  onClick={() => guess(o.name)} disabled={out}
                >
                  <b>{pa ? o.name_pa || o.name : o.name}</b>
                  <small lang={pa ? 'en' : 'pa'}>{pa ? o.name : o.name_pa}</small>
                </button>
              );
            })}
          </div>
        </>
      )}

      {solved && (
        <div className={styles.actions}>
          <button type="button" className={arcade.btnBig} onClick={next}>
            {index + 1 < rounds.length ? w.next : w.finish} <FaArrowRight aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
