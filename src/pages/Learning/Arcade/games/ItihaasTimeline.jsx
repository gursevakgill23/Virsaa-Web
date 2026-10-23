/**
 * pages/Learning/Arcade/games/ItihaasTimeline.jsx
 * -----------------------------------------------------------------------------
 * Itihaas Timeline: load the history train. Each carriage carries an event;
 * put them in order from oldest to newest, then press Check. Tap a carriage and then
 * another to swap them (or use the arrows). Right first time scores full
 * points; each wrong check costs some. A hint (coins) fixes one carriage in
 * its right place. When the order is right, the years appear and the train
 * leaves the station.
 * Content: { rounds: [[{year, title, title_pa, detail, slug}]] }
 * -----------------------------------------------------------------------------
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FaArrowLeft, FaArrowRight, FaCheck, FaLightbulb, FaTrain } from 'react-icons/fa';
import { toast } from '../../../../utils/notify';
import arcade from '../Arcade.module.css';
import { sfx } from '../arcadeSound';
import styles from './ItihaasTimeline.module.css';
import { shuffle } from './common';

const HINT_COST = 10;

const WORDS = {
  english: {
    instructions: 'Put the carriages in order, from Oldest to Newest.', junction: 'Itihaas Junction', check: 'Check', next: 'Next train',
    finish: 'Finish', oldest: 'Oldest', newest: 'Newest', hint: 'Fix one carriage', right: 'All aboard! The order is right.',
    tryAgain: (n) => `${n} carriage${n === 1 ? ' is' : 's are'} in the wrong place. Swap and check again!`,
    shown: 'Here is the right order.', round: 'Train', move: 'Move', coins: 'coins',
  },
  punjabi: {
    instructions: 'ਡੱਬਿਆਂ ਨੂੰ ਸਭ ਤੋਂ ਪੁਰਾਣੇ ਤੋਂ ਸਭ ਤੋਂ ਨਵੇਂ ਤੱਕ ਤਰਤੀਬ ਵਿੱਚ ਲਗਾਓ।', junction: 'ਇਤਿਹਾਸ ਜੰਕਸ਼ਨ', check: 'ਜਾਂਚੋ', next: 'ਅਗਲੀ ਗੱਡੀ',
    finish: 'ਪੂਰਾ ਕਰੋ', oldest: 'ਸਭ ਤੋਂ ਪੁਰਾਣਾ', newest: 'ਸਭ ਤੋਂ ਨਵਾਂ', hint: 'ਇੱਕ ਡੱਬਾ ਠੀਕ ਕਰੋ', right: 'ਸ਼ਾਬਾਸ਼! ਤਰਤੀਬ ਸਹੀ ਹੈ।',
    tryAgain: (n) => `${n} ਡੱਬੇ ਗ਼ਲਤ ਥਾਂ ਤੇ ਹਨ। ਬਦਲੋ ਤੇ ਫਿਰ ਜਾਂਚੋ!`,
    shown: 'ਇਹ ਹੈ ਸਹੀ ਤਰਤੀਬ।', round: 'ਗੱਡੀ', move: 'ਹਿਲਾਓ', coins: 'ਸਿੱਕੇ',
  },
};

const ERA = (year) => (year <= 1708 ? 'gurus' : year <= 1849 ? 'empire' : 'modern');

export default function ItihaasTimeline({ content, language, onFinish, wallet }) {
  const w = WORDS[language];
  const rounds = useMemo(() => content.rounds || [], [content.rounds]);
  const [roundIndex, setRoundIndex] = useState(0);
  const events = useMemo(() => rounds[roundIndex] || [], [rounds, roundIndex]);
  const [order, setOrder] = useState(() => shuffleUntilWrong(events));
  const [picked, setPicked] = useState(null);
  const [locked, setLocked] = useState([]);      // slots fixed by a hint
  const [checked, setChecked] = useState(null);  // per slot: true / false after a check
  const [fails, setFails] = useState(0);
  const [done, setDone] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [message, setMessage] = useState('');
  const [scores, setScores] = useState([]);
  const leaveTimer = useRef(null);      // the train leaving: cancelled if the next train comes first
  const hinting = useRef(false);        // a hint is being paid for

  const sorted = useMemo(() => [...events].sort((a, b) => a.year - b.year), [events]);

  useEffect(() => () => clearTimeout(leaveTimer.current), []);

  const swap = (a, b) => {
    if (a === b || locked.includes(a) || locked.includes(b)) return;
    setOrder((list) => {
      const next = [...list];
      [next[a], next[b]] = [next[b], next[a]];
      return next;
    });
    setChecked(null);
    sfx.snap();
  };

  const tapCarriage = (i) => {
    if (done || locked.includes(i)) return;
    if (picked === null) {
      sfx.tap();
      setPicked(i);
    } else {
      swap(picked, i);
      setPicked(null);
    }
  };

  const finishRound = (value, list) => {
    setOrder(list);
    setDone(true);
    setScores((s) => [...s, value]);
    clearTimeout(leaveTimer.current);
    leaveTimer.current = setTimeout(() => { setLeaving(true); sfx.whoosh(); }, 900);
  };

  const check = () => {
    if (done) return;
    setPicked(null);
    const marks = order.map((e, i) => e.year === sorted[i].year);
    setChecked(marks);
    if (marks.every(Boolean)) {
      sfx.win();
      setMessage(w.right);
      finishRound(Math.max(0.2, 1 - 0.3 * fails - 0.1 * locked.length), order);
      return;
    }
    sfx.wrong();
    const wrongCount = marks.filter((m) => !m).length;
    if (fails >= 2) {
      setMessage(w.shown);
      finishRound(0.2, sorted);
      setChecked(sorted.map(() => true));
      return;
    }
    setFails((n) => n + 1);
    setMessage(w.tryAgain(wrongCount));
  };

  // A hint puts the right carriage in the first wrong place and fixes it there. It is
  // worked out from the order as it is after paying (taps may have moved carriages meanwhile)
  const orderRef = useRef(order);
  orderRef.current = order;
  const doneRef = useRef(done);
  doneRef.current = done;
  const hint = async () => {
    if (done || hinting.current) return;
    if (!order.some((e, i) => e.year !== sorted[i].year && !locked.includes(i))) return;
    hinting.current = true;
    const paid = await wallet.spend(HINT_COST, 'Itihaas Timeline hint');
    hinting.current = false;
    if (!paid.ok) {
      toast.error(paid.reason === 'coins' ? `A hint costs ${HINT_COST} ${w.coins}.` : paid.message);
      return;
    }
    if (doneRef.current) return;
    const list = orderRef.current;
    const slot = list.findIndex((e, i) => e.year !== sorted[i].year && !locked.includes(i));
    if (slot < 0) return;
    const from = list.findIndex((e, i) => i !== slot && !locked.includes(i) && e.year === sorted[slot].year);
    if (from < 0) return;
    const next = [...list];
    [next[slot], next[from]] = [next[from], next[slot]];
    setOrder(next);
    setLocked((l) => [...l, slot]);
    setPicked(null);
    setChecked(null);
    sfx.pop();
  };

  const nextRound = () => {
    sfx.pick();
    if (roundIndex + 1 < rounds.length) {
      clearTimeout(leaveTimer.current);
      const nextEvents = rounds[roundIndex + 1];
      setRoundIndex((r) => r + 1);
      setOrder(shuffleUntilWrong(nextEvents));
      setPicked(null);
      setLocked([]);
      setChecked(null);
      setFails(0);
      setDone(false);
      setLeaving(false);
      setMessage('');
      return;
    }
    const total = scores.reduce((a, b) => a + b, 0) / Math.max(1, rounds.length);
    onFinish({ score: Math.round(total * 1000), completed: true, details: { trains: rounds.length } });
  };

  if (!events.length) return null;
  const title = (e) => (language === 'punjabi' ? e.title_pa || e.title : e.title);

  return (
    <div className={styles.game}>
      <div className={arcade.hud}>
        <span className={arcade.hudPill}><FaTrain aria-hidden="true" /> {w.round} {roundIndex + 1}/{rounds.length}</span>
        <span className={arcade.hudSpacer} />
        {!done && (
          <button type="button" className={styles.hintButton} onClick={hint}
            disabled={!order.some((e, i) => e.year !== sorted[i].year && !locked.includes(i))}
          >
            <FaLightbulb aria-hidden="true" /> {w.hint} <small>{HINT_COST}</small>
          </button>
        )}
      </div>
      <p className={styles.instructions}>{w.instructions}</p>

      <div className={styles.station}>
        <span className={styles.sign} aria-hidden="true">{w.junction}</span>
        <div className={`${styles.train} ${leaving ? styles.leaving : ''}`}>
          <span className={styles.endLabel}>{w.oldest}</span>
          {order.map((e, i) => {
            const mark = checked ? checked[i] : null;
            return (
              <div key={e.slug || `${e.year}-${e.title}`} className={styles.slot}>
                <button
                  type="button"
                  className={[styles.carriage, styles[`era_${ERA(e.year)}`], picked === i ? styles.picked : '',
                    mark === true ? styles.right : '', mark === false ? styles.wrong : '', locked.includes(i) ? styles.locked : ''].join(' ')}
                  onClick={() => tapCarriage(i)}
                  aria-pressed={picked === i}
                >
                  <span className={styles.number}>{i + 1}</span>
                  <span className={styles.title} lang={language === 'punjabi' ? 'pa' : 'en'}>{title(e)}</span>
                  {(mark === true || done) && <span className={styles.year}>{e.year}</span>}
                  {done && <span className={styles.detail}>{e.detail}</span>}
                  <span className={styles.wheels} aria-hidden="true"><i /><i /></span>
                </button>
                {!done && !locked.includes(i) && (
                  <span className={styles.moves}>
                    <button type="button" onClick={() => swap(i, i - 1)} disabled={i === 0 || locked.includes(i - 1)} aria-label={`${w.move} ←`}>
                      <FaArrowLeft aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => swap(i, i + 1)} disabled={i === order.length - 1 || locked.includes(i + 1)} aria-label={`${w.move} →`}>
                      <FaArrowRight aria-hidden="true" />
                    </button>
                  </span>
                )}
              </div>
            );
          })}
          <div className={styles.engine} aria-hidden="true">
            <span className={styles.smoke}><i /><i /><i /></span>
            <span className={styles.chimney} />
            <span className={styles.cab} />
            <span className={styles.wheels}><i /><i /></span>
          </div>
          <span className={styles.endLabel}>{w.newest}</span>
        </div>
        <div className={styles.track} aria-hidden="true" />
      </div>

      {message && <p className={styles.message} role="status">{message}</p>}
      <div className={styles.actions}>
        {!done ? (
          <button type="button" className={arcade.btnBig} onClick={check}><FaCheck aria-hidden="true" /> {w.check}</button>
        ) : (
          <button type="button" className={arcade.btnBig} onClick={nextRound}>
            {roundIndex + 1 < rounds.length ? w.next : w.finish} <FaArrowRight aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

// A shuffled order that isn't already right
function shuffleUntilWrong(events) {
  if (events.length < 2) return [...events];
  for (let i = 0; i < 12; i += 1) {
    const order = shuffle(events);
    if (order.some((e, j) => e.year !== [...events].sort((a, b) => a.year - b.year)[j].year)) return order;
  }
  return [...events].reverse();
}
