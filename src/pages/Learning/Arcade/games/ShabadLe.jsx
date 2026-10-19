/**
 * pages/Learning/Arcade/games/ShabadLe.jsx
 * -----------------------------------------------------------------------------
 * Shabad-le: guess the Punjabi word in six tries, on a wooden takhti.
 * A tile is a letter with its vowel sign (gurmukhi.js). Guesses are marked by
 * the server (learning_api/shabad_le.py), so the answer only arrives at the
 * end: green = right tile, right place; orange = right letter, different
 * vowel sign; yellow = somewhere else in the word; grey = not in it.
 * Stage 0 is the word of the day, the same for everyone, with a shareable
 * result. Without the server, a word from the offline copy is used.
 * -----------------------------------------------------------------------------
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaCopy, FaLightbulb, FaTag } from 'react-icons/fa';
import learningApi from '../../../../api/learningApi';
import { toast } from '../../../../utils/notify';
import arcade from '../Arcade.module.css';
import { sfx } from '../arcadeSound';
import GurmukhiKeyboard from '../GurmukhiKeyboard';
import { isCombining, isWord, scoreGuess, tiles } from '../gurmukhi';
import { localShabadWord } from '../localGames';
import styles from './ShabadLe.module.css';

const MAX_GUESSES = 6;
const SCORE_BY_GUESSES = { 1: 1000, 2: 950, 3: 880, 4: 760, 5: 620, 6: 480 };
const RANK = { correct: 4, close: 3, present: 2, absent: 1 };
const EMOJI = { correct: '🟩', close: '🟧', present: '🟨', absent: '⬜' };

const WORDS = {
  english: {
    topic: 'Topic', hint: 'Show a tile', coins: 'coins', notEnough: 'Not enough tiles yet', tile: 'Tile',
    answer: 'The word was', share: 'Copy my result', copied: 'Result copied. Paste it to share!',
    playedToday: 'You have played today’s word. A new word comes tomorrow!', topicLater: (n) => `Topic shown after ${n} guesses`,
    noMoreHints: 'No more hints for this word', loading: 'Getting your word…', keyHelp: 'Type a vowel as its carrier and sign: ੳ + ੁ = ਉ',
    of: 'of', guesses: 'guesses',
  },
  punjabi: {
    topic: 'ਵਿਸ਼ਾ', hint: 'ਇੱਕ ਖਾਨਾ ਦਿਖਾਓ', coins: 'ਸਿੱਕੇ', notEnough: 'ਅਜੇ ਖਾਨੇ ਪੂਰੇ ਨਹੀਂ', tile: 'ਖਾਨਾ',
    answer: 'ਸ਼ਬਦ ਸੀ', share: 'ਨਤੀਜਾ ਕਾਪੀ ਕਰੋ', copied: 'ਨਤੀਜਾ ਕਾਪੀ ਹੋ ਗਿਆ!',
    playedToday: 'ਤੁਸੀਂ ਅੱਜ ਦਾ ਸ਼ਬਦ ਖੇਡ ਲਿਆ ਹੈ। ਕੱਲ੍ਹ ਨਵਾਂ ਸ਼ਬਦ ਆਵੇਗਾ!', topicLater: (n) => `${n} ਕੋਸ਼ਿਸ਼ਾਂ ਮਗਰੋਂ ਵਿਸ਼ਾ ਦਿਖੇਗਾ`,
    noMoreHints: 'ਇਸ ਸ਼ਬਦ ਲਈ ਹੋਰ ਇਸ਼ਾਰੇ ਨਹੀਂ', loading: 'ਸ਼ਬਦ ਆ ਰਿਹਾ ਹੈ…', keyHelp: 'ਲਗ ਵਾਲੇ ਅੱਖਰ: ੳ + ੁ = ਉ',
    of: 'ਵਿੱਚੋਂ', guesses: 'ਕੋਸ਼ਿਸ਼ਾਂ',
  },
};

const guestDailyKey = (date) => `virsaa_shabadle_${date}`;
const readJson = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || null;
  } catch {
    return null;
  }
};
const writeJson = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* not kept */
  }
};

// When the topic shows: always, after N guesses, or never
const topicVisible = (rule, guessCount) => {
  if (!rule || rule === 'never') return false;
  if (rule === 'always') return true;
  const n = Number(String(rule).split(':')[1] || 0);
  return guessCount >= n;
};

const AnswerCard = ({ answer, w }) => (
  <div className={styles.answerCard}>
    <p className={styles.answerLabel}>{w.answer}</p>
    <p className={styles.answerWord} lang="pa">{answer.word}</p>
    <p className={styles.answerRoman}>{answer.roman}</p>
    <p className={styles.answerMeaning}>{answer.meaning}</p>
  </div>
);

export default function ShabadLe({ stage, language, onResult, api, signedIn, wallet, arcade: game }) {
  const w = WORDS[language];
  const daily = stage.stage === 0;
  const [puzzle, setPuzzle] = useState(null);       // from the server
  const [offlineWord, setOfflineWord] = useState(null);
  const [rows, setRows] = useState([]);             // [{ guess, tiles: [{text, state}] }]
  const [typed, setTyped] = useState('');
  const [answer, setAnswer] = useState(null);
  const [finished, setFinished] = useState(false);
  const [solved, setSolved] = useState(false);
  const [hints, setHints] = useState([]);           // [{ position, tile }]
  const [busy, setBusy] = useState(false);
  const [shakeRow, setShakeRow] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [alreadyPlayed, setAlreadyPlayed] = useState(false);
  const started = useRef(Date.now());
  const length = puzzle?.length || (offlineWord ? tiles(offlineWord.word).length : stage.settings?.tiles || 4);

  // ------------------------------------------------------------ the puzzle
  useEffect(() => {
    let live = true;
    const load = async () => {
      try {
        const data = daily
          ? await learningApi.shabadPuzzle(api.apiString, api.token, { mode: 'daily' })
          : await learningApi.arcadeContent(api.apiString, api.token, 'shabad-le', stage.stage);
        if (!live) return;
        setPuzzle(data);
        if (daily && data.guesses?.length) {            // a signed-in player's board so far
          setRows(data.guesses.map((g) => ({ guess: g.guess, tiles: g.tiles })));
          setHints(data.hints || []);
          if (data.finished) {
            setFinished(true);
            setSolved(Boolean(data.solved));
            setAnswer(data.answer || null);
            setAlreadyPlayed(true);
          }
        } else if (daily && !signedIn && data.date) {   // a guest's board is kept in this browser
          const saved = readJson(guestDailyKey(data.date));
          if (saved?.rows?.length) {
            setRows(saved.rows);
            if (saved.finished) {
              setFinished(true);
              setSolved(Boolean(saved.solved));
              setAnswer(saved.answer || null);
              setAlreadyPlayed(true);
            }
          }
        }
      } catch (err) {
        if (!live) return;
        console.error('Shabad-le puzzle failed to load:', err.response?.status || err.message);
        const word = localShabadWord(stage.stage, daily);
        if (word) setOfflineWord(word);
        else setLoadError(true);
      }
    };
    load();
    return () => { live = false; };
  }, [api.apiString, api.token, daily, signedIn, stage.stage]);

  // ------------------------------------------------------------ keyboard colours
  const keyStates = useMemo(() => {
    const states = {};
    rows.forEach((row) => row.tiles.forEach(({ text, state }) => {
      const letter = [...text][0];
      if (!letter) return;
      const key = text.includes('਼') ? text.slice(0, 2) : letter;   // ਸ਼ ਖ਼ … keep their dot
      if (!states[key] || RANK[state] > RANK[states[key]]) states[key] = state;
    }));
    return states;
  }, [rows]);

  // ------------------------------------------------------------ typing
  const current = tiles(typed);
  const onKey = useCallback((ch) => {
    if (finished || busy) return;
    sfx.tap();
    setTyped((text) => {
      const parts = tiles(text);
      const combining = [...ch].every((c) => isCombining(c));
      if (combining) return parts.length ? text + ch : text;
      if (parts.length >= length) return text;
      return text + ch;
    });
  }, [finished, busy, length]);

  const onBackspace = useCallback(() => {
    if (finished || busy) return;
    setTyped((text) => [...text].slice(0, -1).join(''));
  }, [finished, busy]);

  const finishGame = useCallback((score, wasSolved, word, serverResult, finalRows) => {
    const seconds = Math.round((Date.now() - started.current) / 1000);
    const share = shareText(daily, puzzle, finalRows, wasSolved);
    const extra = (
      <div className={styles.resultExtra}>
        <AnswerCard answer={word} w={w} />
        {daily && (
          <button type="button" className={arcade.btnSecondary} onClick={() => copyShare(share, w)}>
            <FaCopy aria-hidden="true" /> {w.share}
          </button>
        )}
      </div>
    );
    let saved;
    if (serverResult) saved = game.applyServerResult(serverResult);
    else saved = game.recordLocal(stage.stage, score, wasSolved, seconds);
    onResult(saved, extra);
  }, [daily, puzzle, w, game, stage.stage, onResult]);

  const onEnter = useCallback(async () => {
    if (finished || busy) return;
    if (current.length !== length || !isWord(typed, length)) {
      sfx.wrong();
      setShakeRow(true);
      setTimeout(() => setShakeRow(false), 450);
      toast.info(w.notEnough);
      return;
    }
    setBusy(true);
    const guess = current.join('');
    try {
      let marked;
      let body = {};
      if (puzzle) {
        body = await learningApi.shabadGuess(api.apiString, api.token, { puzzle: puzzle.puzzle, guess, previous: rows.length });
        marked = body.tiles;
      } else {
        const states = scoreGuess(current, tiles(offlineWord.word));
        marked = current.map((text, i) => ({ text, state: states[i] }));
        const won = marked.every((t) => t.state === 'correct');
        body = { solved: won, finished: won || rows.length + 1 >= MAX_GUESSES };
        if (body.finished) {
          body.answer = { word: offlineWord.word, roman: offlineWord.roman, meaning: offlineWord.meaning };
          body.score = won ? Math.max(300, SCORE_BY_GUESSES[rows.length + 1] - 120 * hints.length) : 0;
        }
      }
      const nextRows = [...rows, { guess, tiles: marked }];
      setRows(nextRows);
      setTyped('');
      const correctCount = marked.filter((t) => t.state === 'correct').length;
      if (body.solved) sfx.win();
      else if (correctCount) sfx.correct();
      else sfx.drop();
      if (daily && !signedIn && puzzle?.date) {
        writeJson(guestDailyKey(puzzle.date), {
          rows: nextRows, finished: body.finished, solved: body.solved, answer: body.answer || null,
        });
      }
      if (body.finished) {
        setFinished(true);
        setSolved(Boolean(body.solved));
        setAnswer(body.answer);
        // let the last row turn over before the results card
        setTimeout(() => finishGame(body.score || 0, Boolean(body.solved), body.answer, body.result, nextRows), 1300);
      }
    } catch (err) {
      sfx.wrong();
      toast.error(err.response?.data?.error || 'That guess couldn’t be checked. Try again.');
    } finally {
      setBusy(false);
    }
  }, [finished, busy, current, length, typed, w, puzzle, api, rows, offlineWord, hints.length, daily, signedIn, finishGame]);

  // ------------------------------------------------------------ hints
  const canHint = !finished && hints.length < (puzzle?.max_hints ?? 2);
  const hintCost = puzzle?.hint_cost ?? 15;
  const showHint = async () => {
    if (!canHint || busy) return;
    if (!puzzle) {                                           // offline: from the local word
      const answerTiles = tiles(offlineWord.word);
      const known = new Set(hints.map((h) => h.position));
      const left = answerTiles.map((_, i) => i).filter((i) => !known.has(i));
      const pay = await wallet.spend(hintCost, 'Shabad-le hint');
      if (!pay.ok) { toast.error(pay.reason === 'coins' ? `A hint costs ${hintCost} ${w.coins}.` : pay.message); return; }
      const position = left[Math.floor(Math.random() * left.length)];
      setHints((list) => [...list, { position, tile: answerTiles[position] }]);
      sfx.pop();
      return;
    }
    setBusy(true);
    try {
      if (signedIn) {
        const body = await learningApi.shabadHint(api.apiString, api.token, { puzzle: puzzle.puzzle });
        if (body.wallet) wallet.applyWallet(body.wallet);
        setHints((list) => [...list, { position: body.position, tile: body.tile }]);
      } else {
        if (wallet.coins < hintCost) { toast.error(`A hint costs ${hintCost} ${w.coins}.`); return; }
        const body = await learningApi.shabadHint(api.apiString, null, { puzzle: puzzle.puzzle, shown: hints.map((h) => h.position) });
        await wallet.spend(hintCost, 'Shabad-le hint');
        setHints((list) => [...list, { position: body.position, tile: body.tile }]);
      }
      sfx.pop();
    } catch (err) {
      const status = err.response?.status;
      toast.error(status === 402 ? `A hint costs ${hintCost} ${w.coins}.` : err.response?.data?.error || w.noMoreHints);
    } finally {
      setBusy(false);
    }
  };

  if (loadError) return <p className={arcade.stageError}>This word couldn’t be loaded. Check your connection and try again.</p>;
  if (!puzzle && !offlineWord) return <div className={arcade.stageLoading}><span className={arcade.spinner} aria-hidden="true" /> {w.loading}</div>;

  const topic = puzzle?.topic || offlineWord?.hint;
  const rule = puzzle?.hint_rule || stage.settings?.hint || 'never';
  const topicShown = topicVisible(rule, rows.length) || finished;
  const later = String(rule).startsWith('after:') ? Number(rule.split(':')[1]) : null;

  // The board: rows already played, the row being typed, then empty rows
  const board = Array.from({ length: MAX_GUESSES }, (_, r) => {
    if (r < rows.length) return { done: true, tiles: rows[r].tiles };
    if (r === rows.length && !finished) {
      return { done: false, current: true, tiles: Array.from({ length }, (__, i) => ({ text: current[i] || '' })) };
    }
    return { done: false, tiles: Array.from({ length }, () => ({ text: '' })) };
  });

  return (
    <div className={styles.game}>
      <div className={arcade.hud}>
        {daily && puzzle?.number && <span className={arcade.hudPill}>#{puzzle.number}</span>}
        <span className={arcade.hudPill}>{Math.min(rows.length + (finished ? 0 : 1), MAX_GUESSES)} {w.of} {MAX_GUESSES}</span>
        <span className={arcade.hudSpacer} />
        {topicShown && topic ? (
          <span className={`${arcade.hudPill} ${styles.topic}`}>
            <FaTag aria-hidden="true" /> <span className={styles.wideOnly}>{w.topic}:</span> {topic}
          </span>
        ) : later ? <span className={styles.topicLater}>{w.topicLater(later)}</span> : null}
        {!finished && (
          <button type="button" className={styles.hintButton} onClick={showHint} disabled={!canHint || busy}
            aria-label={`${w.hint} (${hintCost} ${w.coins})`}
          >
            <FaLightbulb aria-hidden="true" /> <span className={styles.wideOnly}>{w.hint}</span> <small>{hintCost}</small>
          </button>
        )}
      </div>

      {alreadyPlayed && <p className={styles.played} role="status">{w.playedToday}</p>}

      <div className={styles.takhti}>
        <span className={styles.handle} aria-hidden="true" />
        <div className={styles.slate} style={{ '--cols': length }}>
          {hints.length > 0 && (
            <div className={styles.hintRow}>
              {hints.map((h) => (
                <span key={h.position} className={styles.hintChip}>
                  {w.tile} {h.position + 1}: <b lang="pa">{h.tile}</b>
                </span>
              ))}
            </div>
          )}
          <div className={styles.grid} role="grid" aria-label="Shabad-le board">
            {board.map((row, r) => (
              <div key={r} role="row" className={`${styles.row} ${row.current && shakeRow ? styles.shake : ''}`}>
                {row.tiles.map((tile, i) => (
                  <span
                    key={i}
                    role="gridcell"
                    lang="pa"
                    className={[styles.tile, tile.text ? styles.filled : '', row.done ? styles[`s_${tile.state}`] : '',
                      row.done ? styles.flip : ''].join(' ')}
                    style={row.done ? { animationDelay: `${i * 140}ms` } : undefined}
                    aria-label={tile.state ? `${tile.text} ${tile.state}` : tile.text || 'empty'}
                  >
                    {tile.text}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {finished && answer && !alreadyPlayed && <AnswerCard answer={answer} w={w} />}
      {alreadyPlayed && answer && (
        <div className={styles.resultExtra}>
          <AnswerCard answer={answer} w={w} />
          {daily && (
            <button type="button" className={arcade.btnSecondary} onClick={() => copyShare(shareText(daily, puzzle, rows, solved), w)}>
              <FaCopy aria-hidden="true" /> {w.share}
            </button>
          )}
        </div>
      )}

      {!finished && (
        <>
          <p className={styles.keyHelp}>{w.keyHelp}</p>
          <GurmukhiKeyboard
            onKey={onKey}
            onBackspace={onBackspace}
            onEnter={onEnter}
            states={keyStates}
            disabled={busy}
            language={language}
          />
        </>
      )}
    </div>
  );
}

function shareText(daily, puzzle, rows, solved) {
  const lines = rows.map((row) => row.tiles.map((t) => EMOJI[t.state] || '⬜').join(''));
  const head = daily && puzzle?.number ? `Shabad-le #${puzzle.number}` : 'Shabad-le';
  return `${head} ${solved ? rows.length : 'X'}/${MAX_GUESSES}\n${lines.join('\n')}\nvirsaa-web.vercel.app/learning/games/shabad-le`;
}

function copyShare(text, w) {
  const done = () => toast.success(w.copied);
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => window.prompt('Copy:', text));
  } else {
    window.prompt('Copy:', text);
  }
}
