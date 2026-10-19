/**
 * pages/Learning/Arcade/GurmukhiKeyboard.jsx
 * -----------------------------------------------------------------------------
 * An on-screen Gurmukhi keyboard for the word games, laid out the way
 * children learn the letters: the Painti in rows of five (two rows side by
 * side), the letters with a dot at the foot, then the vowel signs.
 * Vowels are typed as their carrier and a sign (ੳ + ੁ = ਉ), as in class.
 * A Gurmukhi keyboard on the computer works too.
 *
 * Props: onKey(ch), onBackspace(), onEnter() (optional), states {letter: correct|close|present|absent},
 *        letters (which letters to show; all by default), signs (which signs; [] for none),
 *        disabled, enterLabel, language
 * -----------------------------------------------------------------------------
 */
import React, { useEffect } from 'react';
import { FaBackspace, FaCheck } from 'react-icons/fa';
import styles from './GurmukhiKeyboard.module.css';

export const LETTER_ROWS = [
  ['ੳ', 'ਅ', 'ੲ', 'ਸ', 'ਹ', 'ਕ', 'ਖ', 'ਗ', 'ਘ', 'ਙ'],
  ['ਚ', 'ਛ', 'ਜ', 'ਝ', 'ਞ', 'ਟ', 'ਠ', 'ਡ', 'ਢ', 'ਣ'],
  ['ਤ', 'ਥ', 'ਦ', 'ਧ', 'ਨ', 'ਪ', 'ਫ', 'ਬ', 'ਭ', 'ਮ'],
  ['ਯ', 'ਰ', 'ਲ', 'ਵ', 'ੜ', 'ਸ਼', 'ਖ਼', 'ਗ਼', 'ਜ਼', 'ਫ਼'],
];
export const SIGNS = ['ਾ', 'ਿ', 'ੀ', 'ੁ', 'ੂ', 'ੇ', 'ੈ', 'ੋ', 'ੌ', 'ਂ', 'ੰ', 'ੱ'];
const SIGN_NAMES = {
  'ਾ': 'kanna', 'ਿ': 'sihari', 'ੀ': 'bihari', 'ੁ': 'aunkar', 'ੂ': 'dulainkar', 'ੇ': 'lanv', 'ੈ': 'dulanvan',
  'ੋ': 'hora', 'ੌ': 'kanaura', 'ਂ': 'bindi', 'ੰ': 'tippi', 'ੱ': 'addak',
};

const isGurmukhiKey = (key) => typeof key === 'string' && [...key].every((ch) => ch >= '਀' && ch <= '੿');

export default function GurmukhiKeyboard({
  onKey, onBackspace, onEnter, states = {}, letters, signs = SIGNS, disabled = false, enterLabel, language = 'english',
}) {
  // A real keyboard with a Gurmukhi layout also types (and Backspace / Enter work)
  useEffect(() => {
    if (disabled) return undefined;
    const handler = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (e.key === 'Backspace' && onBackspace) {
        e.preventDefault();
        onBackspace();
      } else if (e.key === 'Enter' && onEnter) {
        e.preventDefault();
        onEnter();
      } else if (isGurmukhiKey(e.key)) {
        e.preventDefault();
        onKey(e.key.normalize('NFC'));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [disabled, onKey, onBackspace, onEnter]);

  const shown = letters ? new Set(letters) : null;
  const rows = LETTER_ROWS.map((row) => row.filter((k) => !shown || shown.has(k))).filter((row) => row.length);
  // (ਸ਼ ਖ਼ ਗ਼ ਜ਼ ਫ਼ ਲ਼ are compared as letter + dot, the form typed text is kept in)
  const stateOf = (k) => states[k.normalize('NFC')] || states[k];
  const keyClass = (k) => [styles.key, stateOf(k) ? styles[`state_${stateOf(k)}`] : ''].join(' ');

  return (
    <div className={`${styles.keyboard} ${letters ? styles.small : ''}`} role="group"
      aria-label={language === 'punjabi' ? 'ਗੁਰਮੁਖੀ ਕੀਬੋਰਡ' : 'Gurmukhi keyboard'}
    >
      {rows.map((row) => (
        <div key={row.join('')} className={styles.row}>
          {row.map((k, i) => (
            <button
              key={k}
              type="button"
              className={`${keyClass(k)} ${!letters && i === 5 ? styles.gapBefore : ''}`}
              onClick={() => onKey(k.normalize('NFC'))}
              disabled={disabled}
              lang="pa"
            >
              {k}
            </button>
          ))}
        </div>
      ))}
      {signs.length > 0 && (
        <div className={`${styles.row} ${styles.signRow}`}>
          {signs.map((s) => (
            <button key={s} type="button" className={`${styles.key} ${styles.sign}`} onClick={() => onKey(s)}
              disabled={disabled} aria-label={SIGN_NAMES[s] || s} lang="pa"
            >
              <span aria-hidden="true">{'◌'}{s}</span>
            </button>
          ))}
        </div>
      )}
      {(onBackspace || onEnter) && (
        <div className={`${styles.row} ${styles.actionRow}`}>
          {onBackspace && (
            <button type="button" className={`${styles.key} ${styles.action}`} onClick={onBackspace} disabled={disabled}
              aria-label={language === 'punjabi' ? 'ਮਿਟਾਓ' : 'Delete'}
            >
              <FaBackspace aria-hidden="true" />
            </button>
          )}
          {onEnter && (
            <button type="button" className={`${styles.key} ${styles.action} ${styles.enter}`} onClick={onEnter} disabled={disabled}>
              <FaCheck aria-hidden="true" /> {enterLabel || (language === 'punjabi' ? 'ਜਾਂਚੋ' : 'Enter')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
