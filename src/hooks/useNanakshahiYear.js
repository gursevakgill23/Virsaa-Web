/**
 * hooks/useNanakshahiYear.js
 * -----------------------------------------------------------------------------
 * React hook that loads the SGPC Nanakshahi month starts (the Sangrand dates)
 * for one Gregorian year from /collections/calendar/months/?year= and turns
 * any date of that year into its Nanakshahi date.
 *
 *   const ns = useNanakshahiYear(apiString, 2026);
 *   ns.status          'idle' (no year asked for) | 'loading' | 'ready' | 'error'
 *   ns.source          'sgpc'      the SGPC's published jantri
 *                      'computed'  worked out with the SGPC's rules
 *                      'fallback'  no SGPC dates on the server: the 2003 dates
 *   ns.convert(date)   { day, month, pa, index, year, label } or null
 *   ns.retry()         ask the server again after an error
 *
 * Each year is fetched once per visit and shared by everything that asks for
 * it (the side panel and the month view). Until the dates arrive, or when they
 * can't be loaded, convert() returns null, so a wrong date is never shown.
 * Pass a year of null to load nothing yet (e.g. while the panel is closed).
 * -----------------------------------------------------------------------------
 */
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { calendarApi } from '../api/newsApi';
import { fixedNanakshahi, nanakshahiFromStarts, parseMonthStarts } from '../utils/nanakshahi';

// Shared by every component: years already loaded, and requests still on the way
const loaded = new Map(); // key -> { source, starts }
const pending = new Map(); // key -> Promise

const keyOf = (apiString, year) => `${apiString || ''}|${year}`;

// Fetch a year once; a failed request is forgotten so it can be tried again
const loadYear = (apiString, year) => {
  const key = keyOf(apiString, year);
  if (!pending.has(key)) {
    pending.set(key, calendarApi.months(apiString, year)
      .then((data) => {
        loaded.set(key, { source: data?.source || 'computed', starts: parseMonthStarts(data?.months) });
      })
      .finally(() => pending.delete(key)));
  }
  return pending.get(key);
};

const useNanakshahiYear = (apiString, year) => {
  const key = year ? keyOf(apiString, year) : null;
  const [failedKey, setFailedKey] = useState(null); // the year whose request failed
  const [attempt, setAttempt] = useState(0); // bumped by retry()
  const [, rerender] = useReducer((n) => n + 1, 0);
  const data = key ? loaded.get(key) : undefined;

  useEffect(() => {
    if (!key || loaded.has(key)) return undefined;
    let cancelled = false;
    loadYear(apiString, year)
      .then(() => { if (!cancelled) rerender(); })
      .catch(() => { if (!cancelled) setFailedKey(key); });
    return () => { cancelled = true; };
  }, [apiString, year, key, attempt]);

  let status = 'loading';
  if (!key) status = 'idle';
  else if (data) status = 'ready';
  else if (failedKey === key) status = 'error';

  const convert = useCallback((date) => {
    if (!data) return null;
    // No SGPC dates for this year on the server: it uses the 2003 dates, and so do we
    if (data.source === 'fallback' || data.starts.length === 0) return fixedNanakshahi(date);
    return nanakshahiFromStarts(date, data.starts);
  }, [data]);

  const retry = useCallback(() => {
    setFailedKey(null);
    setAttempt((n) => n + 1);
  }, []);

  return useMemo(
    () => ({ status, source: data?.source || null, convert, retry }),
    [status, data, convert, retry]
  );
};

export default useNanakshahiYear;
