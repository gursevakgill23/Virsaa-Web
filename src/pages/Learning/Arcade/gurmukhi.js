/**
 * pages/Learning/Arcade/gurmukhi.js
 * -----------------------------------------------------------------------------
 * Gurmukhi text as tiles, the same way the server does it
 * (learning_api/gurmukhi.py): a tile is one letter with everything written on
 * it, its vowel sign, bindi, tippi, addak, nukta, or a letter joined
 * underneath. So ਕਿਤਾਬ is ਕਿ · ਤਾ · ਬ.
 *
 * The marks on a tile are always kept in the same order (nukta, joined
 * letter, vowel sign, then bindi / tippi / addak), so ਸ + ੱ + ਿ and
 * ਸ + ਿ + ੱ are the same tile, however they were typed.
 *
 *   tiles('ਪੰਜਾਬ')                 -> ['ਪੰ', 'ਜਾ', 'ਬ']
 *   scoreGuess(['ਪ','ਜ','ਬ'], tiles('ਪੰਜਾਬ')) -> ['close', 'close', 'correct']
 *   tileFits('ਸੱ', 'ਸਿੱ') -> true (on the way to it)
 *   typeKey('ਕਿ', 'ੀ', 4) -> 'ਕੀ' (a new vowel sign takes the old one's place)
 * -----------------------------------------------------------------------------
 */

// Marks written on (or under) the letter before them
const COMBINING = new Set([
  'ਁ', 'ਂ', 'ਃ', '਼', 'ਾ', 'ਿ', 'ੀ', 'ੁ', 'ੂ',
  'ੇ', 'ੈ', 'ੋ', 'ੌ', '੍', 'ੑ', 'ੰ', 'ੱ', 'ੵ',
]);
const VIRAMA = '੍';
const NUKTA = '਼';
export const VOWEL_SIGNS = new Set(['ਾ', 'ਿ', 'ੀ', 'ੁ', 'ੂ', 'ੇ', 'ੈ', 'ੋ', 'ੌ']);
const NASAL_AND_DOUBLING = new Set(['ਁ', 'ਂ', 'ੰ', 'ੱ']);

// A vowel typed as its carrier letter plus a sign is the vowel letter
const VOWEL_PAIRS = [
  ['ੳੁ', 'ਉ'], ['ੳੂ', 'ਊ'], ['ੳੋ', 'ਓ'],
  ['ਅਾ', 'ਆ'], ['ਅੈ', 'ਐ'], ['ਅੌ', 'ਔ'],
  ['ੲਿ', 'ਇ'], ['ੲੀ', 'ਈ'], ['ੲੇ', 'ਏ'],
];

const SPELT_OUT = Object.fromEntries(VOWEL_PAIRS.map(([pair, vowel]) => [vowel, pair]));

export const isCombining = (ch) => COMBINING.has(ch);

// A tile with a vowel letter written as its carrier and sign (ਉੱ -> ੳ ੁ ੱ), for comparing and editing
const spellOut = (tile) => (SPELT_OUT[tile[0]] ? SPELT_OUT[tile[0]] + tile.slice(1) : tile);

// The order marks are kept in on a tile
const rank = (mark) => {
  if (mark === NUKTA) return 0;
  if (mark.startsWith(VIRAMA)) return 1;      // a joined letter (pairin)
  if (VOWEL_SIGNS.has(mark)) return 2;
  if (mark === 'ੵ' || mark === 'ੑ') return 3;
  return 4;                                    // bindi, tippi, addak, visarga
};

// A tile's letter and its marks (a joined letter, with its own nukta, counts as one mark)
const split = (tile) => {
  const chars = [...tile];
  const head = chars.shift() || '';
  const marks = [];
  for (let i = 0; i < chars.length; i += 1) {
    if (chars[i] === VIRAMA && i + 1 < chars.length && !COMBINING.has(chars[i + 1])) {
      let joined = VIRAMA + chars[i + 1];
      i += 1;
      if (chars[i + 1] === NUKTA) {
        joined += NUKTA;
        i += 1;
      }
      marks.push(joined);
    } else {
      marks.push(chars[i]);
    }
  }
  return { head, marks };
};

/** A tile with its marks in the usual order. */
export const canonicalTile = (tile) => {
  const { head, marks } = split(tile);
  return head + marks.map((m, i) => [m, i]).sort((a, b) => rank(a[0]) - rank(b[0]) || a[1] - b[1]).map(([m]) => m).join('');
};

// Text as tiles, before the marks are put in order
const rawTiles = (text) => {
  const out = [];
  let joining = false;
  for (const ch of text) {
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

/** One spelling for the same word: NFC, no joiners or spaces, vowel letters joined, marks in order. */
export const normalize = (text) => {
  let out = String(text || '').normalize('NFC').replace(/[​-‍﻿\s]/g, '');
  VOWEL_PAIRS.forEach(([pair, vowel]) => { out = out.split(pair).join(vowel); });
  out = rawTiles(out).map(canonicalTile).join('');
  VOWEL_PAIRS.forEach(([pair, vowel]) => { out = out.split(pair).join(vowel); });
  return out;
};

export const tiles = (text) => rawTiles(normalize(text));

/** A tile's letter without its vowel sign, bindi, tippi or addak (the nukta stays). */
export const base = (tile) => [...tile].filter((ch) => !VOWEL_SIGNS.has(ch) && !NASAL_AND_DOUBLING.has(ch)).join('');

/** Could a half-typed tile still become `target`? (the same letter, and only marks the target has;
 *  ੳ is on the way to ਉ, ਅ to ਆ ...) */
export const tileFits = (typed, target) => {
  if (typed === target) return true;
  const a = split(spellOut(canonicalTile(typed)));
  const b = split(spellOut(canonicalTile(target)));
  if (a.head !== b.head) return false;
  const left = [...b.marks];
  return a.marks.every((m) => {
    const at = left.indexOf(m);
    if (at < 0) return false;
    left.splice(at, 1);
    return true;
  });
};

/**
 * Typing one key into a word of at most `maxTiles` tiles: a mark goes on the last
 * tile (a new vowel sign takes the old one's place, the same mark isn't added
 * twice), a letter starts a new tile (or joins the last one after ੍).
 * Returns the new text, or the same text when the key can't go anywhere.
 */
export const typeKey = (text, ch, maxTiles = Infinity) => {
  const parts = tiles(text);
  if (COMBINING.has(ch)) {
    if (!parts.length) return text;
    const { head, marks } = split(spellOut(parts[parts.length - 1]));
    if (marks.includes(ch)) return text;
    const kept = VOWEL_SIGNS.has(ch) ? marks.filter((m) => !VOWEL_SIGNS.has(m)) : marks;
    parts[parts.length - 1] = head + kept.join('') + ch;
    return normalize(parts.join(''));
  }
  const next = normalize(text + ch);
  return tiles(next).length > maxTiles ? text : next;
};

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
