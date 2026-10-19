/**
 * pages/Learning/Arcade/gurmukhi.js
 * -----------------------------------------------------------------------------
 * Gurmukhi text as tiles, the same way the server does it
 * (learning_api/gurmukhi.py): a tile is one letter with everything written on
 * it, its vowel sign, bindi, tippi, addak, nukta, or a letter joined
 * underneath. So ਕਿਤਾਬ is ਕਿ · ਤਾ · ਬ.
 *
 *   tiles('ਪੰਜਾਬ')                 -> ['ਪੰ', 'ਜਾ', 'ਬ']
 *   scoreGuess(['ਪ','ਜ','ਬ'], tiles('ਪੰਜਾਬ')) -> ['close', 'close', 'correct']
 * -----------------------------------------------------------------------------
 */

// Marks written on (or under) the letter before them
const COMBINING = new Set([
  'ਁ', 'ਂ', 'ਃ', '਼', 'ਾ', 'ਿ', 'ੀ', 'ੁ', 'ੂ',
  'ੇ', 'ੈ', 'ੋ', 'ੌ', '੍', 'ੑ', 'ੰ', 'ੱ', 'ੵ',
]);
const VIRAMA = '੍';
export const VOWEL_SIGNS = new Set(['ਾ', 'ਿ', 'ੀ', 'ੁ', 'ੂ', 'ੇ', 'ੈ', 'ੋ', 'ੌ']);
const NASAL_AND_DOUBLING = new Set(['ਁ', 'ਂ', 'ੰ', 'ੱ']);

// A vowel typed as its carrier letter plus a sign is the vowel letter
const VOWEL_PAIRS = [
  ['ੳੁ', 'ਉ'], ['ੳੂ', 'ਊ'], ['ੳੋ', 'ਓ'],
  ['ਅਾ', 'ਆ'], ['ਅੈ', 'ਐ'], ['ਅੌ', 'ਔ'],
  ['ੲਿ', 'ਇ'], ['ੲੀ', 'ਈ'], ['ੲੇ', 'ਏ'],
];

export const isCombining = (ch) => COMBINING.has(ch);

/** One spelling for the same word: NFC, no joiners or spaces, vowel letters joined. */
export const normalize = (text) => {
  let out = String(text || '').normalize('NFC').replace(/[​-‍﻿\s]/g, '');
  VOWEL_PAIRS.forEach(([pair, vowel]) => { out = out.split(pair).join(vowel); });
  return out;
};

export const tiles = (text) => {
  const out = [];
  let joining = false;
  for (const ch of normalize(text)) {
    if (out.length && (COMBINING.has(ch) || joining)) {
      out[out.length - 1] += ch;
      joining = ch === VIRAMA;
    } else {
      out.push(ch);
      joining = false;
    }
  }
  return out;
};

/** A tile's letter without its vowel sign, bindi, tippi or addak (the nukta stays). */
export const base = (tile) => [...tile].filter((ch) => !VOWEL_SIGNS.has(ch) && !NASAL_AND_DOUBLING.has(ch)).join('');

/** correct | close | present | absent for each tile of a guess (both lists of tiles). */
export const scoreGuess = (guess, answer) => {
  const states = guess.map(() => 'absent');
  const left = {};
  guess.forEach((g, i) => {
    if (g === answer[i]) states[i] = 'correct';
    else left[answer[i]] = (left[answer[i]] || 0) + 1;
  });
  guess.forEach((g, i) => {
    if (states[i] === 'correct') return;
    if (base(g) === base(answer[i])) states[i] = 'close';
    else if (left[g] > 0) {
      states[i] = 'present';
      left[g] -= 1;
    }
  });
  return states;
};

/** True for Gurmukhi letters only, with `length` tiles if given. */
export const isWord = (text, length) => {
  const parts = tiles(text);
  if (!parts.length || (length !== undefined && parts.length !== length)) return false;
  return parts.every((tile) => {
    const head = tile[0];
    if (head < '਀' || head > '੿' || COMBINING.has(head)) return false;
    if ((head >= '੦' && head <= '੯') || head === 'ੴ') return false;
    return [...tile].every((ch) => ch >= '਀' && ch <= '੿');
  });
};
