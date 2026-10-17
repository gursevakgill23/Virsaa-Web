/**
 * utils/nanakshahi.js
 * -----------------------------------------------------------------------------
 * Nanakshahi dates, e.g. 14 Oct 2026 → "28 Assu 558".
 *
 * The website follows the Nanakshahi calendar as the SGPC publishes it today.
 * Each month begins on the Sangrand of the Bikrami (sidereal) solar month, so
 * its Gregorian date moves by a day or two from year to year: 1 Assu fell on
 * 17 September in 2026, not on a fixed 15 September as in the original 2003
 * calendar. The Sangrand dates therefore come from the server
 * (/collections/calendar/months/?year=, loaded by hooks/useNanakshahiYear),
 * which holds the SGPC jantri and the same calculation for 2024 to 2040.
 *
 * For years the server has no table for, it falls back to the original 2003
 * dates (every month starting on the same day each year). `fixedNanakshahi`
 * gives those same dates here, so the website and the server always agree.
 * -----------------------------------------------------------------------------
 */

// The 12 months in order, from Chet (March/April) to Phagun (February/March)
export const NANAKSHAHI_MONTHS = [
  { name: 'Chet', pa: 'ਚੇਤ' },
  { name: 'Vaisakh', pa: 'ਵੈਸਾਖ' },
  { name: 'Jeth', pa: 'ਜੇਠ' },
  { name: 'Harh', pa: 'ਹਾੜ' },
  { name: 'Sawan', pa: 'ਸਾਵਣ' },
  { name: 'Bhadon', pa: 'ਭਾਦੋਂ' },
  { name: 'Assu', pa: 'ਅੱਸੂ' },
  { name: 'Katik', pa: 'ਕੱਤਕ' },
  { name: 'Maghar', pa: 'ਮੱਘਰ' },
  { name: 'Poh', pa: 'ਪੋਹ' },
  { name: 'Magh', pa: 'ਮਾਘ' },
  { name: 'Phagun', pa: 'ਫੱਗਣ' },
];

// First day of each month in the original 2003 calendar, as [month, day].
// Only used for years the server has no SGPC dates for.
const FIXED_STARTS = [[3, 14], [4, 14], [5, 15], [6, 15], [7, 16], [8, 16], [9, 15], [10, 15], [11, 14], [12, 14], [1, 13], [2, 12]];

const DAY_MS = 86400000;
const MAGH = 10; // months from Magh on start in January, in the next Gregorian year
const LONGEST_MONTH = 32; // Bikrami solar months last 29 to 32 days

// Days are compared in UTC, so a daylight-saving change can never shift a date
const utc = (y, m, d) => Date.UTC(y, m - 1, d);
const dayOf = (date) => utc(date.getFullYear(), date.getMonth() + 1, date.getDate()); // the local calendar day
const isValidDate = (date) => date instanceof Date && !Number.isNaN(date.getTime());

/*
 * The date's Nanakshahi parts, given the first day of the month it falls in.
 * Year 1 began in March 1469 CE, the year of Guru Nanak Dev Ji's birth. Chet to
 * Poh belong to the year that began that March; Magh and Phagun (January to
 * March) still belong to the year that began the March before.
 */
const describe = (day, firstDay, index, firstYear) => {
  const dayOfMonth = Math.round((day - firstDay) / DAY_MS) + 1;
  const year = (index >= MAGH ? firstYear - 1 : firstYear) - 1468;
  const { name, pa } = NANAKSHAHI_MONTHS[index];
  return { day: dayOfMonth, month: name, pa, index, year, label: `${dayOfMonth} ${name} ${year}` };
};

/**
 * The server's month starts ([{ date: 'YYYY-MM-DD', index }]) as a sorted list
 * that nanakshahiFromStarts() can search. Malformed rows are dropped.
 */
export const parseMonthStarts = (months) => (Array.isArray(months) ? months : [])
  .map((row) => {
    const [y, m, d] = String(row?.date || '').split('-').map(Number);
    return { day: utc(y, m, d), year: y, index: Number(row?.index) };
  })
  .filter((s) => Number.isFinite(s.day) && Number.isInteger(s.index) && s.index >= 0 && s.index < 12)
  .sort((a, b) => a.day - b.day);

/**
 * SGPC Nanakshahi date for a JavaScript Date (only its local year, month and
 * day are used), from month starts made by parseMonthStarts().
 * Returns { day, month, pa, index, year, label }, or null when the date isn't
 * covered by the months given.
 */
export const nanakshahiFromStarts = (date, starts) => {
  if (!isValidDate(date) || !starts?.length) return null;
  const day = dayOf(date);
  let month = null;
  for (const start of starts) {
    if (start.day > day) break;
    month = start;
  }
  // Before the first Sangrand we know, or past the end of the last month
  if (!month || (day - month.day) / DAY_MS >= LONGEST_MONTH) return null;
  return describe(day, month.day, month.index, month.year);
};

/**
 * Nanakshahi date in the original 2003 calendar, where every month starts on
 * the same Gregorian date each year (1 Chet = 14 March). Same result shape as
 * nanakshahiFromStarts(); null for an invalid date.
 */
export const fixedNanakshahi = (date) => {
  if (!isValidDate(date)) return null;
  const y = date.getFullYear();
  const day = dayOf(date);
  // Before 14 March we're still in the year that began last March
  const startYear = day >= utc(y, 3, 14) ? y : y - 1;
  // Walk back from Phagun to find the month this date falls in
  for (let i = 11; i >= 0; i -= 1) {
    const [m, d] = FIXED_STARTS[i];
    const firstYear = startYear + (i >= MAGH ? 1 : 0);
    const firstDay = utc(firstYear, m, d);
    if (day >= firstDay) return describe(day, firstDay, i, firstYear);
  }
  return null;
};
