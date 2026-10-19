/**
 * pages/Learning/Arcade/games/LangarSeva.jsx
 * -----------------------------------------------------------------------------
 * Langar Seva: the sangat sits down in the pangat, and each person shows what
 * they would like. Pick up something from a station (rotis, dal, sabzi,
 * water, kheer) and serve it to everyone who asked for it, the way sevadars
 * carry a balti of dal down the row. On harder stages the rotis are cooked
 * on the tawa first. Nobody loses: the stage ends when everyone has been
 * served, and serving quickly earns more stars (at least one for finishing).
 * Settings: sangat, seats, items, wants (items per person, at most), target_seconds, cook.
 * -----------------------------------------------------------------------------
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaClock, FaFire, FaPlay, FaUsers } from 'react-icons/fa';
import arcade from '../Arcade.module.css';
import { sfx } from '../arcadeSound';
import styles from './LangarSeva.module.css';
import { formatTime } from './common';

const COOK_SECONDS = 2.4;
const EAT_SECONDS = 2.2;

const WORDS = {
  english: {
    served: 'Served', time: 'Time', goal: 'Three stars under', start: 'Start the seva',
    intro: 'Serve everyone in the pangat. Pick up food, then tap the people who asked for it.',
    holding: 'You are carrying', nothing: 'Tap a station to pick something up', tawa: 'Tawa', cook: 'Cook a roti',
    cooking: 'Cooking…', basket: 'Rotis ready', noRoti: 'No rotis ready yet: cook one on the tawa!', thanks: 'Waheguru!',
    items: { roti: 'Roti', dal: 'Dal', sabzi: 'Sabzi', water: 'Water', kheer: 'Kheer' },
  },
  punjabi: {
    served: 'ਛਕ ਚੁੱਕੇ', time: 'ਸਮਾਂ', goal: 'ਤਿੰਨ ਤਾਰੇ ਇਸ ਤੋਂ ਘੱਟ ਸਮੇਂ ਵਿੱਚ', start: 'ਸੇਵਾ ਸ਼ੁਰੂ ਕਰੋ',
    intro: 'ਪੰਗਤ ਵਿੱਚ ਬੈਠੀ ਸਾਰੀ ਸੰਗਤ ਨੂੰ ਲੰਗਰ ਛਕਾਓ। ਕੁਝ ਚੁੱਕੋ, ਫਿਰ ਮੰਗਣ ਵਾਲਿਆਂ ਨੂੰ ਛੂਹੋ।',
    holding: 'ਤੁਹਾਡੇ ਹੱਥ ਵਿੱਚ', nothing: 'ਕੁਝ ਚੁੱਕਣ ਲਈ ਛੂਹੋ', tawa: 'ਤਵਾ', cook: 'ਪ੍ਰਸ਼ਾਦਾ ਪਕਾਓ',
    cooking: 'ਪੱਕ ਰਿਹਾ ਹੈ…', basket: 'ਤਿਆਰ ਪ੍ਰਸ਼ਾਦੇ', noRoti: 'ਅਜੇ ਪ੍ਰਸ਼ਾਦਾ ਤਿਆਰ ਨਹੀਂ: ਤਵੇ ਤੇ ਪਕਾਓ!', thanks: 'ਵਾਹਿਗੁਰੂ!',
    items: { roti: 'ਪ੍ਰਸ਼ਾਦਾ', dal: 'ਦਾਲ', sabzi: 'ਸਬਜ਼ੀ', water: 'ਜਲ', kheer: 'ਖੀਰ' },
  },
};

// ------------------------------------------------------------ little drawings
export const FoodIcon = ({ item, size = 34 }) => {
  const s = { width: size, height: size };
  if (item === 'roti') {
    return (
      <svg viewBox="0 0 40 40" style={s} aria-hidden="true">
        <ellipse cx="20" cy="22" rx="17" ry="13" fill="#E9C38B" stroke="#C99A5B" strokeWidth="2" />
        <circle cx="14" cy="20" r="2.2" fill="#B9844B" /><circle cx="24" cy="25" r="2" fill="#B9844B" /><circle cx="25" cy="17" r="1.6" fill="#B9844B" />
      </svg>
    );
  }
  if (item === 'water') {
    return (
      <svg viewBox="0 0 40 40" style={s} aria-hidden="true">
        <path d="M10 6h20l-3 30H13z" fill="#E3EEF6" stroke="#9AA9B6" strokeWidth="2" />
        <path d="M11.5 16h17l-2 18h-13z" fill="#6FB2E6" />
      </svg>
    );
  }
  const fill = { dal: '#F2B33D', sabzi: '#7BBF4E', kheer: '#FFF6E2' }[item] || '#ccc';
  return (
    <svg viewBox="0 0 40 40" style={s} aria-hidden="true">
      <path d="M5 18h30c0 10-7 16-15 16S5 28 5 18z" fill="#B7C0C8" stroke="#8C979F" strokeWidth="2" />
      <ellipse cx="20" cy="18" rx="15" ry="5" fill={fill} stroke="#8C979F" strokeWidth="2" />
      {item === 'kheer' && <><ellipse cx="16" cy="17" rx="2.5" ry="1.2" fill="#C9894A" /><ellipse cx="23" cy="18.5" rx="2.5" ry="1.2" fill="#C9894A" /></>}
      {item === 'sabzi' && <><circle cx="15" cy="17" r="2" fill="#E8742A" /><circle cx="24" cy="18" r="2" fill="#4E8F2B" /></>}
    </svg>
  );
};

const SKIN = ['#F3C9A2', '#E2AB7F', '#C98B5E', '#A86E45', '#8A5636'];
const HEAD = ['#1F3A93', '#E8742A', '#C0392B', '#2E8B57', '#F2B33D', '#7B2D8E', '#FFFFFF', '#212121'];
const KURTA = ['#FFFFFF', '#F7E7C6', '#BFD8F2', '#F6C1CF', '#CDE8C3', '#E8D3F2'];

const Person = ({ look, mood }) => (
  <svg viewBox="0 0 80 92" className={styles.person} aria-hidden="true">
    <path d="M10 92c2-26 14-38 30-38s28 12 30 38z" fill={look.kurta} stroke="rgba(0,0,0,.15)" strokeWidth="2" />
    <ellipse cx="40" cy="88" rx="34" ry="7" fill="rgba(0,0,0,.08)" />
    <circle cx="40" cy="36" r="18" fill={look.skin} />
    {look.style === 'dastar' && (
      <>
        <path d="M20 32c0-16 10-24 20-24s20 8 20 24c-6-5-13-7-20-7s-14 2-20 7z" fill={look.head} stroke="rgba(0,0,0,.18)" strokeWidth="1.5" />
        <path d="M24 20l32 8M22 27l34-10" stroke="rgba(0,0,0,.14)" strokeWidth="2" />
      </>
    )}
    {look.style === 'patka' && (
      <path d="M22 30c0-14 8-20 18-20s18 6 18 20c-5-4-11-6-18-6s-13 2-18 6z" fill={look.head} />
    )}
    {look.style === 'chunni' && (
      <path d="M18 40c-2-20 10-30 22-30s24 10 22 30c-2 14-6 22-6 30H24c0-8-4-16-6-30zm6-2c2 12 8 16 16 16s14-4 16-16c-4-12-10-16-16-16s-12 4-16 16z"
        fill={look.head} opacity=".92" />
    )}
    {mood === 'eating' ? (
      <>
        <path d="M32 36q3 3 6 0M42 36q3 3 6 0" stroke="#3a2414" strokeWidth="2" fill="none" strokeLinecap="round" />
        <ellipse cx="40" cy="45" rx="4" ry="3" fill="#7a3b1f" />
      </>
    ) : (
      <>
        <circle cx="34" cy="35" r="2.2" fill="#3a2414" /><circle cx="46" cy="35" r="2.2" fill="#3a2414" />
        <path d={mood === 'happy' ? 'M33 43q7 6 14 0' : 'M34 44q6 2 12 0'} stroke="#3a2414" strokeWidth="2" fill="none" strokeLinecap="round" />
      </>
    )}
    <circle cx="29" cy="41" r="3" fill="#ff8a8a" opacity=".35" /><circle cx="51" cy="41" r="3" fill="#ff8a8a" opacity=".35" />
  </svg>
);

const randomLook = (i) => {
  const style = ['dastar', 'chunni', 'patka', 'dastar', 'chunni'][i % 5];
  return {
    style, skin: SKIN[Math.floor(Math.random() * SKIN.length)], head: HEAD[(i * 3 + Math.floor(Math.random() * 3)) % HEAD.length],
    kurta: KURTA[Math.floor(Math.random() * KURTA.length)],
  };
};

export default function LangarSeva({ stage, language, onFinish }) {
  const w = WORDS[language];
  const s = stage.settings || {};
  const items = useMemo(() => s.items || ['roti', 'water'], [s.items]);
  const total = s.sangat || 6;
  const seatsCount = s.seats || 3;
  const cookMode = Boolean(s.cook);
  const target = s.target_seconds || 90;

  const [started, setStarted] = useState(false);
  const [seats, setSeatsState] = useState(() => Array(seatsCount).fill(null));
  const seatsRef = useRef(seats);
  // Seats change from clicks and from the clock; the ref always has the latest
  const setSeats = useCallback((update) => {
    const next = typeof update === 'function' ? update(seatsRef.current) : update;
    seatsRef.current = next;
    setSeatsState(next);
  }, []);
  const tawaRef = useRef(null);
  const [holding, setHolding] = useState(null);
  const [basket, setBasket] = useState(cookMode ? 2 : Infinity);
  const [tawa, setTawa] = useState(null);            // seconds of cooking left, or null
  const [arrived, setArrived] = useState(0);
  const [served, setServed] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [nudge, setNudge] = useState(null);
  const [message, setMessage] = useState('');
  const timer = useRef({ elapsed: 0, nextArrival: 0.4, done: false });

  // Who sits down next, and what they would like (a roti nearly always)
  const newPerson = useCallback((n) => {
    const want = Math.max(1, Math.min(s.wants || 1, items.length));
    const count = 1 + Math.floor(Math.random() * want);
    const others = items.filter((i) => i !== 'roti').sort(() => Math.random() - 0.5);
    const list = Math.random() < 0.85 && items.includes('roti') ? ['roti', ...others] : others;
    return { id: n, look: randomLook(n), wants: list.slice(0, count), got: [], eating: 0 };
  }, [items, s.wants]);

  // ------------------------------------------------------------ the clock: arrivals, cooking, eating
  useEffect(() => {
    if (!started) return undefined;
    const id = setInterval(() => {
      const t = timer.current;
      if (t.done) return;
      t.elapsed += 0.1;
      setSeconds(t.elapsed);
      // the roti on the tawa
      if (tawaRef.current !== null) {
        tawaRef.current -= 0.1;
        if (tawaRef.current <= 0) {
          tawaRef.current = null;
          setBasket((b) => b + 1);
          sfx.pop();
        }
        setTawa(tawaRef.current);
      }
      // people who have finished eating leave, freeing their place
      const list = seatsRef.current;
      if (list.some((p) => p && p.eating)) {
        let leftCount = 0;
        const next = list.map((p) => {
          if (!p || !p.eating) return p;
          if (p.eating <= 0.1) {
            leftCount += 1;
            return null;
          }
          return { ...p, eating: p.eating - 0.1 };
        });
        setSeats(next);
        if (leftCount) setServed((n) => n + leftCount);
      }
      t.nextArrival -= 0.1;
    }, 100);
    return () => clearInterval(id);
  }, [started, setSeats]);

  // someone sits down when a seat is free
  useEffect(() => {
    if (!started) return;
    const free = seats.findIndex((p) => p === null);
    if (free < 0 || arrived >= total || timer.current.nextArrival > 0) return;
    timer.current.nextArrival = 0.6 + Math.random() * 0.8;
    const next = [...seatsRef.current];
    next[free] = newPerson(arrived);
    setSeats(next);
    setArrived((n) => n + 1);
  }, [started, seats, arrived, total, newPerson, seconds, setSeats]);

  // everyone served: the end
  useEffect(() => {
    if (!started || served < total || timer.current.done) return;
    timer.current.done = true;
    sfx.win();
    const time = timer.current.elapsed;
    const score = time <= target ? 1000 : Math.max(300, Math.round(1000 - (700 * (time - target)) / target));
    setTimeout(() => onFinish({ score, completed: true, time_taken_seconds: Math.round(time), details: { sangat: total } }), 700);
  }, [served, total, started, target, onFinish]);

  // ------------------------------------------------------------ serving
  const pick = (item) => {
    sfx.pick();
    setHolding(item);
    setMessage('');
  };

  const serve = (index) => {
    const person = seats[index];
    if (!person || person.eating || !holding) {
      if (!holding && person && !person.eating) { sfx.tap(); setMessage(w.nothing); }
      return;
    }
    const needs = person.wants.includes(holding) && !person.got.includes(holding);
    if (!needs) {
      sfx.tap();
      setNudge(index);
      setTimeout(() => setNudge(null), 400);
      return;
    }
    if (holding === 'roti') {
      if (basket <= 0) {
        sfx.wrong();
        setMessage(w.noRoti);
        return;
      }
      setBasket((b) => b - 1);
    }
    sfx.correct();
    setSeats((list) => list.map((p, i) => {
      if (i !== index) return p;
      const got = [...p.got, holding];
      const full = p.wants.every((x) => got.includes(x));
      return { ...p, got, eating: full ? EAT_SECONDS : 0 };
    }));
  };

  const cook = () => {
    if (tawaRef.current !== null) return;
    sfx.tap();
    tawaRef.current = COOK_SECONDS;
    setTawa(COOK_SECONDS);
  };

  return (
    <div className={styles.game}>
      <div className={arcade.hud}>
        <span className={arcade.hudPill}><FaUsers aria-hidden="true" /> {w.served}: {served}/{total}</span>
        <span className={arcade.hudPill}><FaClock aria-hidden="true" /> {formatTime(seconds)}</span>
        <span className={styles.goal}>{w.goal} {formatTime(target)}</span>
      </div>

      <div className={styles.hall}>
        <div className={styles.wall} aria-hidden="true">
          <span className={styles.window} />
          <span className={styles.sign}>
            <b lang="pa">ਗੁਰੂ ਕਾ ਲੰਗਰ</b>
            {language !== 'punjabi' && <small>Guru Ka Langar</small>}
          </span>
          <span className={styles.window} />
        </div>
        <div className={styles.pangat} data-seats={seatsCount}>
          {seats.map((p, i) => (
            <button
              key={i}
              type="button"
              className={`${styles.seat} ${nudge === i ? styles.nudge : ''} ${holding && p && !p.eating && p.wants.includes(holding) && !p.got.includes(holding) ? styles.wantsThis : ''}`}
              onClick={() => serve(i)}
              aria-label={p ? `${p.wants.filter((x) => !p.got.includes(x)).map((x) => w.items[x]).join(', ') || w.thanks}` : 'Empty place'}
            >
              {p ? (
                <>
                  <span className={styles.bubble}>
                    {p.eating ? <b className={styles.thanks}>{w.thanks}</b> : p.wants.map((item) => (
                      <span key={item} className={p.got.includes(item) ? styles.gotIt : ''}><FoodIcon item={item} size={30} /></span>
                    ))}
                  </span>
                  <Person look={p.look} mood={p.eating ? 'eating' : p.got.length ? 'happy' : 'waiting'} />
                  <span className={styles.thali} aria-hidden="true">
                    {p.got.map((item) => <FoodIcon key={item} item={item} size={20} />)}
                  </span>
                </>
              ) : <span className={styles.emptySeat} aria-hidden="true" />}
            </button>
          ))}
        </div>
        <div className={styles.durrie} aria-hidden="true" />
      </div>

      <p className={styles.holding} role="status">
        {holding ? <>{w.holding}: <FoodIcon item={holding} size={26} /> <b>{w.items[holding]}</b></> : w.nothing}
        {message && <span className={styles.message}> {message}</span>}
      </p>

      <div className={styles.stations}>
        {items.map((item) => (
          <button key={item} type="button" className={`${styles.station} ${holding === item ? styles.stationOn : ''}`} onClick={() => pick(item)}
            aria-pressed={holding === item}
          >
            <FoodIcon item={item} size={44} />
            <span>{w.items[item]}</span>
            {item === 'roti' && cookMode && <small className={styles.count}>{basket}</small>}
          </button>
        ))}
        {cookMode && (
          <button type="button" className={`${styles.station} ${styles.tawa}`} onClick={cook} disabled={tawa !== null}>
            <span className={styles.tawaPan}>
              {tawa !== null && <span className={styles.cookingRoti} style={{ transform: `scale(${1 + (COOK_SECONDS - tawa) * 0.08})` }} />}
            </span>
            <span>{tawa !== null ? w.cooking : w.cook}</span>
            <FaFire className={styles.fire} aria-hidden="true" />
          </button>
        )}
      </div>

      {!started && (
        <div className={styles.startCard}>
          <p>{w.intro}</p>
          <button type="button" className={arcade.btnBig} onClick={() => { sfx.pick(); setStarted(true); }}>
            <FaPlay aria-hidden="true" /> {w.start}
          </button>
        </div>
      )}
    </div>
  );
}
