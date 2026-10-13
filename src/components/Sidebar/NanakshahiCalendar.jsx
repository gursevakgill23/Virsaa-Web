/**
 * components/Sidebar/NanakshahiCalendar.jsx
 * -----------------------------------------------------------------------------
 * The Nanakshahi calendar view inside the side panel.
 *   - month grid: each day shows its Gregorian number and its Nanakshahi day
 *     (the Gurmukhi month name on the 1st of each Nanakshahi month)
 *   - coloured dots for Gurpurab, Shaheedi Purab, festivals, Sangrand,
 *     Puranmashi/Masya and community events (with a key underneath)
 *   - tap a day to list everything on it; "This month" lists the main days
 * Data: /collections/calendar/?year&month and /collections/events/?from&to.
 * -----------------------------------------------------------------------------
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FaChevronLeft, FaChevronRight, FaMoon, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import { calendarApi, localISODate } from '../../api/newsApi';
import { toNanakshahi } from '../../utils/nanakshahi';
import styles from './NanakshahiCalendar.module.css';

// Readable names for each kind of entry
const KIND_LABELS = {
  gurpurab: 'Gurpurab',
  shaheedi: 'Shaheedi Purab',
  festival: 'Festival',
  historical: 'Historic day',
  sangrand: 'Sangrand',
  puranmashi: 'Puranmashi',
  masya: 'Masya',
  event: 'Community event',
};

// Dot colour group for each kind
const DOT = {
  gurpurab: 'dotGurpurab', shaheedi: 'dotShaheedi', festival: 'dotFestival', historical: 'dotFestival',
  sangrand: 'dotSangrand', puranmashi: 'dotMoon', masya: 'dotMoon', event: 'dotEvent',
};

// ---------------------------------------------------------------- date helpers
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const pad = (n) => String(n).padStart(2, '0');
const isoOf = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
const parseISO = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const formatTime = (hhmm) => {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
};

/**
 * Month view of the Nanakshahi calendar inside the side panel, with community events
 * from the website marked alongside. Tap a day to see what's on.
 */
const NanakshahiCalendar = ({ apiString, focusDate }) => {
  const todayISO = localISODate();
  const start = parseISO(focusDate || todayISO);
  // Month on screen, selected day, loaded data, loading state, moon-days toggle
  const [cursor, setCursor] = useState({ y: start.getFullYear(), m: start.getMonth() + 1 });
  const [selected, setSelected] = useState(focusDate || todayISO);
  const [entries, setEntries] = useState([]);
  const [events, setEvents] = useState([]);
  const [state, setState] = useState('loading');
  const [showMoon, setShowMoon] = useState(true);

  // Jump to a date passed in from outside (e.g. "see it in the calendar")
  useEffect(() => {
    if (!focusDate) return;
    const d = parseISO(focusDate);
    setCursor({ y: d.getFullYear(), m: d.getMonth() + 1 });
    setSelected(focusDate);
  }, [focusDate]);

  // Load the month's calendar entries and community events together.
  // Events failing on their own still shows the calendar.
  const load = useCallback(async () => {
    setState('loading');
    const lastDay = new Date(cursor.y, cursor.m, 0).getDate();
    try {
      const [cal, evs] = await Promise.all([
        calendarApi.month(apiString, cursor.y, cursor.m),
        calendarApi.eventsBetween(apiString, isoOf(cursor.y, cursor.m, 1), isoOf(cursor.y, cursor.m, lastDay))
          .catch(() => []),
      ]);
      setEntries(cal);
      setEvents(evs);
      setState('ready');
    } catch {
      setState('error');
    }
  }, [apiString, cursor]);

  useEffect(() => { load(); }, [load]);

  // Everything per day: calendar entries plus community events (multi-day events on each day)
  const byDay = useMemo(() => {
    const map = {};
    const push = (iso, item) => { (map[iso] = map[iso] || []).push(item); };
    entries.forEach((e) => {
      if (!showMoon && (e.kind === 'puranmashi' || e.kind === 'masya')) return;
      push(e.date, { ...e, source: 'calendar' });
    });
    events.forEach((ev) => {
      const from = parseISO(ev.start_date);
      const to = parseISO(ev.end_date || ev.start_date);
      for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
        if (d.getMonth() + 1 === cursor.m) {
          push(isoOf(d.getFullYear(), d.getMonth() + 1, d.getDate()), { ...ev, date: ev.start_date, source: 'event', kind: 'event' });
        }
      }
    });
    return map;
  }, [entries, events, showMoon, cursor.m]);

  // Grid cells: blanks before the 1st (so it lands on the right weekday), then each day
  const cells = useMemo(() => {
    const first = new Date(cursor.y, cursor.m - 1, 1).getDay();
    const days = new Date(cursor.y, cursor.m, 0).getDate();
    return [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  }, [cursor]);

  // Previous / next month
  const move = (delta) => {
    setCursor(({ y, m }) => {
      const d = new Date(y, m - 1 + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() + 1 };
    });
  };

  // Back to today's month with today selected
  const goToday = () => {
    const d = new Date();
    setCursor({ y: d.getFullYear(), m: d.getMonth() + 1 });
    setSelected(todayISO);
  };

  // Header text: "October 2026" and the Nanakshahi months it covers
  const monthTitle = new Date(cursor.y, cursor.m - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const nsFirst = toNanakshahi(new Date(cursor.y, cursor.m - 1, 1));
  const nsLast = toNanakshahi(new Date(cursor.y, cursor.m, 0));
  const nsSpan = nsFirst && nsLast
    ? (nsFirst.month === nsLast.month ? `${nsFirst.month} ${nsFirst.year}` : `${nsFirst.month} – ${nsLast.month} ${nsLast.year}`)
    : '';

  // The selected day's entries, and the month's main days for the list at the bottom
  const selectedItems = byDay[selected] || [];
  const selectedDate = parseISO(selected);
  const selectedNs = toNanakshahi(selectedDate);
  const monthHighlights = entries.filter((e) => ['gurpurab', 'shaheedi', 'festival', 'historical'].includes(e.kind));

  return (
    <div className={styles.calendar}>
      {/* Month header with previous / next */}
      <div className={styles.head}>
        <button type="button" className={styles.navButton} onClick={() => move(-1)} aria-label="Previous month"><FaChevronLeft /></button>
        <div className={styles.headTitle}>
          <h3>{monthTitle}</h3>
          <p>{nsSpan} Nanakshahi</p>
        </div>
        <button type="button" className={styles.navButton} onClick={() => move(1)} aria-label="Next month"><FaChevronRight /></button>
      </div>

      <div className={styles.toolbar}>
        <button type="button" className={styles.todayButton} onClick={goToday}>Today</button>
        <label className={styles.moonToggle}>
          <input type="checkbox" checked={showMoon} onChange={(e) => setShowMoon(e.target.checked)} />
          <FaMoon aria-hidden="true" /> Puranmashi &amp; Masya
        </label>
      </div>

      {/* Month grid */}
      <div className={styles.grid} role="grid" aria-label={`${monthTitle} calendar`} aria-busy={state === 'loading'}>
        {WEEKDAYS.map((w, i) => <span key={`${w}${i}`} className={styles.weekday} aria-hidden="true">{w}</span>)}
        {cells.map((day, i) => {
          if (!day) return <span key={`blank-${i}`} className={styles.blank} />;
          const iso = isoOf(cursor.y, cursor.m, day);
          const items = byDay[iso] || [];
          const ns = toNanakshahi(new Date(cursor.y, cursor.m - 1, day));
          const kinds = [...new Set(items.map((x) => DOT[x.kind] || 'dotFestival'))].slice(0, 3);
          return (
            <button
              key={iso}
              type="button"
              role="gridcell"
              className={`${styles.day} ${iso === selected ? styles.daySelected : ''} ${iso === todayISO ? styles.dayToday : ''} ${ns?.day === 1 ? styles.dayMonthStart : ''}`}
              onClick={() => setSelected(iso)}
              aria-selected={iso === selected}
              aria-current={iso === todayISO ? 'date' : undefined}
              aria-label={`${parseISO(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}, ${ns?.label}${items.length ? `, ${items.length} listed` : ''}`}
            >
              <span className={styles.dayNumber}>{day}</span>
              <span className={styles.nsDay}>{ns?.day === 1 ? ns.pa : ns?.day}</span>
              <span className={styles.dots} aria-hidden="true">
                {kinds.map((k) => <span key={k} className={`${styles.dot} ${styles[k]}`} />)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Colour key for the dots */}
      <ul className={styles.legend} aria-label="Key">
        <li><span className={`${styles.dot} ${styles.dotGurpurab}`} /> Gurpurab</li>
        <li><span className={`${styles.dot} ${styles.dotShaheedi}`} /> Shaheedi</li>
        <li><span className={`${styles.dot} ${styles.dotFestival}`} /> Festival</li>
        <li><span className={`${styles.dot} ${styles.dotSangrand}`} /> Sangrand</li>
        <li><span className={`${styles.dot} ${styles.dotMoon}`} /> Moon</li>
        <li><span className={`${styles.dot} ${styles.dotEvent}`} /> Community</li>
      </ul>

      {/* What's on the selected day */}
      <section className={styles.dayPanel} aria-live="polite">
        <h4>
          {selectedDate.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
          <span>{selectedNs?.label} · {selectedNs?.pa}</span>
        </h4>
        {state === 'error' ? (
          <p className={styles.muted}>The calendar couldn’t be loaded. <button type="button" className={styles.linkButton} onClick={load}>Try again</button></p>
        ) : state === 'loading' ? (
          <p className={styles.muted}>Loading…</p>
        ) : selectedItems.length === 0 ? (
          <p className={styles.muted}>Nothing listed for this day.</p>
        ) : (
          <ul className={styles.items}>
            {selectedItems.map((item) => (
              <li key={`${item.source}-${item.id}`} className={styles.item}>
                <span className={`${styles.dot} ${styles[DOT[item.kind] || 'dotFestival']}`} aria-hidden="true" />
                <div>
                  <p className={styles.itemKind}>
                    {item.source === 'event' ? 'Community event' : KIND_LABELS[item.kind] || 'Calendar'}
                    {item.is_lunar && <span className={styles.lunar}> · moon-based, may differ by a day locally</span>}
                  </p>
                  <p className={styles.itemTitle}>{item.title}</p>
                  {item.source === 'event' && (
                    <p className={styles.itemMeta}>
                      {item.start_time && <><FaClock aria-hidden="true" /> {formatTime(item.start_time)} </>}
                      <FaMapMarkerAlt aria-hidden="true" /> {item.location}
                    </p>
                  )}
                  {(item.description) && <p className={styles.itemText}>{item.description}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {monthHighlights.length > 0 && (
        <section className={styles.monthList}>
          <h4>This month</h4>
          <ul>
            {monthHighlights.map((e) => (
              <li key={e.id}>
                <button type="button" onClick={() => setSelected(e.date)}>
                  <span className={styles.monthDate}>{parseISO(e.date).getDate()}</span>
                  <span>{e.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className={styles.footnote}>
        Dates follow the original Nanakshahi calendar. Moon-based days (Guru Nanak Dev Ji’s Gurpurab,
        Bandi Chhor Divas, Hola Mohalla, Puranmashi, Masya) are calculated and can differ by a day at your Gurdwara.
      </p>
    </div>
  );
};

export default NanakshahiCalendar;
