/**
 * utils/nanakshahi.js
 * -----------------------------------------------------------------------------
 * Converts a normal (Gregorian) date to its Nanakshahi date, e.g. 12 Oct 2026 →
 * "28 Assu 558". Used by the side panel header, the calendar card and the
 * Nanakshahi calendar month view.
 *
 * Uses the original 2003 Nanakshahi calendar, where every month starts on the
 * same Gregorian date each year (1 Chet = 14 March). Mirrors
 * collections_api/nanakshahi.py on the server, which also works out the
 * moon-based days (Gurpurab of Guru Nanak Dev Ji, Bandi Chhor, Puranmashi…).
 * -----------------------------------------------------------------------------
 */

// The 12 months: English and Gurmukhi names, and the Gregorian month/day each one starts on
export const NANAKSHAHI_MONTHS = [
  { name: 'Chet', pa: 'ਚੇਤ', m: 3, d: 14 },
  { name: 'Vaisakh', pa: 'ਵੈਸਾਖ', m: 4, d: 14 },
  { name: 'Jeth', pa: 'ਜੇਠ', m: 5, d: 15 },
  { name: 'Harh', pa: 'ਹਾੜ', m: 6, d: 15 },
  { name: 'Sawan', pa: 'ਸਾਵਣ', m: 7, d: 16 },
  { name: 'Bhadon', pa: 'ਭਾਦੋਂ', m: 8, d: 16 },
  { name: 'Assu', pa: 'ਅੱਸੂ', m: 9, d: 15 },
  { name: 'Katik', pa: 'ਕੱਤਕ', m: 10, d: 15 },
  { name: 'Maghar', pa: 'ਮੱਘਰ', m: 11, d: 14 },
  { name: 'Poh', pa: 'ਪੋਹ', m: 12, d: 14 },
  { name: 'Magh', pa: 'ਮਾਘ', m: 1, d: 13 },
  { name: 'Phagun', pa: 'ਫੱਗਣ', m: 2, d: 12 },
];

const DAY = 86400000;
// Dates are compared in UTC so daylight-saving changes can't shift a day
const utc = (y, m, d) => Date.UTC(y, m - 1, d);

/**
 * Nanakshahi date for a JavaScript Date (only its local year/month/day are used).
 * Returns { day, month, pa, year, label }, e.g. { day: 28, month: 'Assu', pa: 'ਅੱਸੂ',
 * year: 558, label: '28 Assu 558' }, or null for an invalid date.
 */
export const toNanakshahi = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  const y = date.getFullYear();
  const t = utc(y, date.getMonth() + 1, date.getDate());
  // The Nanakshahi year starts on 14 March; before that we're still in last year's
  const startYear = t >= utc(y, 3, 14) ? y : y - 1;
  // Walk back from the last month (Phagun) to find the month this date falls in.
  // Magh and Phagun (i >= 10) start in the next Gregorian year.
  for (let i = 11; i >= 0; i -= 1) {
    const mo = NANAKSHAHI_MONTHS[i];
    const first = utc(startYear + (i >= 10 ? 1 : 0), mo.m, mo.d);
    if (t >= first) {
      const day = Math.round((t - first) / DAY) + 1;
      const year = startYear - 1468; // Nanakshahi year 1 = 1469 CE, Guru Nanak Dev Ji's birth
      return { day, month: mo.name, pa: mo.pa, year, label: `${day} ${mo.name} ${year}` };
    }
  }
  return null;
};
