/**
 * pages/Gurbani/GurbaniReader.jsx
 * -----------------------------------------------------------------------------
 * Shows the words of a shabad or bani: Gurmukhi line by line, with optional
 * transliteration, English and Punjabi meanings underneath each line.
 *
 * Two ways to use it:
 *   <GurbaniReader item={item} ... />         loads the text from our API
 *                                             (long banis arrive 300 lines at a
 *                                             time, more load as you scroll)
 *   <GurbaniReader preloaded={shabad} ... />  shows text already in hand
 *                                             (today's Hukamnama)
 *
 * variant="modal"  -> full reading sheet over the page (Escape / × closes it)
 * variant="inline" -> compact panel inside the audio/video player ("Read along")
 *
 * The reader's display choices (which meanings to show, text size) are
 * remembered in this browser only.
 *
 * Text and translations: BaniDB (Khalis Foundation); the credit line at the
 * bottom comes from the server.
 * -----------------------------------------------------------------------------
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FaTimes, FaMinus, FaPlus, FaFilePdf } from 'react-icons/fa';
import { gurbaniApi } from '../../api/sikhismApi';
import { describeApiError } from '../../utils/apiError';
import styles from './GurbaniReader.module.css';

// ---------------------------------------------------------------- display choices
const PREFS_KEY = 'virsaa:gurbani-reader';
const DEFAULT_PREFS = { translit: true, english: true, punjabi: false, size: 1 };
const SIZES = [0.85, 1, 1.2, 1.45, 1.75]; // text size steps (index stored in prefs.size)

// Read / save the choices; storage can be blocked (private mode), so both are guarded
const readPrefs = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(PREFS_KEY) || 'null');
    if (!saved || typeof saved !== 'object') return DEFAULT_PREFS;
    const size = Number.isInteger(saved.size) ? Math.min(SIZES.length - 1, Math.max(0, saved.size)) : 1;
    return { translit: saved.translit !== false, english: saved.english !== false, punjabi: saved.punjabi === true, size };
  } catch {
    return DEFAULT_PREFS;
  }
};
const savePrefs = (prefs) => {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch { /* storage blocked */ }
};

// "Ang 268 · Raag Gauri · Guru Arjan Dev Ji" pieces, skipping the empty ones
const metaParts = (info = {}) => [
  info.ang ? `Ang ${info.ang}` : null,
  info.raag && !/^(none|n\/a)$/i.test(info.raag) ? info.raag : null,
  info.writer || null,
].filter(Boolean);

const GurbaniReader = ({
  apiString, token, item, preloaded, title, variant = 'modal', onClose, onLocked, onOpenPdf,
}) => {
  const isModal = variant === 'modal';

  // ---- Text state ----
  const [lines, setLines] = useState(() => preloaded?.lines || []);
  const [info, setInfo] = useState(() => preloaded?.info || null);
  const [attribution, setAttribution] = useState(() => preloaded?.attribution || '');
  const [total, setTotal] = useState(() => preloaded?.lines?.length || 0);
  const [nextOffset, setNextOffset] = useState(preloaded ? null : 0);
  const [status, setStatus] = useState(preloaded ? 'ready' : 'loading'); // loading | more | ready | error
  const [error, setError] = useState('');
  const [prefs, setPrefs] = useState(readPrefs);

  const scrollRef = useRef(null);
  const sentinelRef = useRef(null);
  const closeRef = useRef(null);
  const requestId = useRef(0); // ignores answers that arrive after the reader moved on
  // Latest callbacks in refs, so a parent re-render never restarts loading or steals focus
  const onLockedRef = useRef(onLocked);
  const onCloseRef = useRef(onClose);
  const tokenRef = useRef(token); // a refreshed sign-in token shouldn't reload the text
  onLockedRef.current = onLocked;
  tokenRef.current = token;
  onCloseRef.current = onClose;

  // ---- Loading ----
  // Fetch the lines starting at `offset` and add them to what is shown
  const load = useCallback(async (offset) => {
    if (!item?.id) return;
    const id = ++requestId.current;
    setStatus(offset === 0 ? 'loading' : 'more');
    setError('');
    try {
      const data = await gurbaniApi.text(apiString, tokenRef.current, item.id, offset);
      if (id !== requestId.current) return;
      setLines((prev) => (offset === 0 ? data.lines || [] : [...prev, ...(data.lines || [])]));
      setInfo(data.info || {});
      setAttribution(data.attribution || '');
      setTotal(data.total || 0);
      setNextOffset(data.next_offset ?? null);
      setStatus('ready');
    } catch (err) {
      if (id !== requestId.current) return;
      const code = err?.response?.data?.code;
      if ((code === 'login_required' || code === 'premium_required' || err?.response?.status === 401) && onLockedRef.current) {
        onLockedRef.current(code || 'login_required');
        return;
      }
      setError(describeApiError(err, 'The Gurbani text couldn’t be loaded. Check your connection and try again.'));
      setStatus('error');
    }
  }, [apiString, item?.id]);

  // First page when the item changes (not for preloaded text)
  useEffect(() => {
    if (preloaded) return undefined;
    setLines([]);
    setNextOffset(0);
    load(0);
    return () => { requestId.current += 1; }; // drop answers for the previous item
  }, [load, preloaded]);

  // Long banis: load the next part when the end of the list scrolls into view
  useEffect(() => {
    const target = sentinelRef.current;
    if (!target || nextOffset == null || status !== 'ready' || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      (entries) => { if (entries.some((e) => e.isIntersecting)) load(nextOffset); },
      { root: isModal ? scrollRef.current : null, rootMargin: '600px 0px' },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [nextOffset, status, load, isModal]);

  // ---- Modal behaviour: focus, Escape, no page scroll behind it ----
  useEffect(() => {
    if (!isModal) return undefined;
    closeRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onCloseRef.current?.(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [isModal]);

  // Change one display choice and remember it
  const setPref = (key, value) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      savePrefs(next);
      return next;
    });
  };

  const heading = title || item?.title || 'Gurbani';
  const gurmukhiTitle = item?.titleGurmukhi || info?.title_gurmukhi || '';
  const parts = metaParts(info || {});

  // ---- The text itself ----
  const body = (
    <>
      {status === 'loading' && (
        <div className={styles.placeholder} aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => <span key={i} className={styles.placeholderLine} />)}
        </div>
      )}

      {status === 'error' && lines.length === 0 && (
        <div className={styles.problem} role="alert">
          <p>{error}</p>
          <button type="button" className={styles.retry} onClick={() => load(0)}>Try again</button>
        </div>
      )}

      {lines.length > 0 && (
        <ol className={styles.lines} style={{ '--reader-scale': SIZES[prefs.size] }} lang="pa">
          {lines.map((line, index) => {
            // A small gap where a new verse/paragraph starts, so long banis read in stanzas
            const newParagraph = index > 0 && line.paragraph != null && line.paragraph !== lines[index - 1].paragraph;
            return (
              <li
                key={`${line.id}-${index}`}
                className={`${styles.line} ${line.header ? styles.header : ''} ${newParagraph ? styles.stanza : ''}`}
              >
                <p className={styles.gurmukhi}>{line.gurmukhi}</p>
                {prefs.translit && line.translit && <p className={styles.translit} lang="en">{line.translit}</p>}
                {prefs.english && line.english && <p className={styles.english} lang="en">{line.english}</p>}
                {prefs.punjabi && line.punjabi && <p className={styles.punjabi}>{line.punjabi}</p>}
              </li>
            );
          })}
        </ol>
      )}

      {/* End of what is loaded: more arrives automatically; the button is for keyboards and old browsers */}
      {nextOffset != null && lines.length > 0 && (
        <div ref={sentinelRef} className={styles.more}>
          {status === 'error' ? (
            <>
              <p role="alert">{error}</p>
              <button type="button" className={styles.retry} onClick={() => load(nextOffset)}>Try again</button>
            </>
          ) : (
            <button type="button" className={styles.retry} onClick={() => load(nextOffset)} disabled={status === 'more'}>
              {status === 'more' ? 'Loading more lines…' : `Show more (${lines.length} of ${total} lines)`}
            </button>
          )}
        </div>
      )}

      {attribution && status !== 'loading' && <p className={styles.credit}>{attribution}</p>}
    </>
  );

  // ---- Display choices (shared by both variants) ----
  const options = (
    <div className={styles.options} role="group" aria-label="Show with each line">
      <button type="button" className={styles.toggle} aria-pressed={prefs.translit} onClick={() => setPref('translit', !prefs.translit)}>
        Transliteration
      </button>
      <button type="button" className={styles.toggle} aria-pressed={prefs.english} onClick={() => setPref('english', !prefs.english)}>
        English
      </button>
      <button type="button" className={styles.toggle} aria-pressed={prefs.punjabi} onClick={() => setPref('punjabi', !prefs.punjabi)}>
        ਪੰਜਾਬੀ
      </button>
      <span className={styles.sizer}>
        <button
          type="button"
          onClick={() => setPref('size', Math.max(0, prefs.size - 1))}
          disabled={prefs.size === 0}
          aria-label="Smaller text"
        >
          <FaMinus aria-hidden="true" />
        </button>
        <span aria-hidden="true">ੳ</span>
        <button
          type="button"
          onClick={() => setPref('size', Math.min(SIZES.length - 1, prefs.size + 1))}
          disabled={prefs.size === SIZES.length - 1}
          aria-label="Larger text"
        >
          <FaPlus aria-hidden="true" />
        </button>
      </span>
    </div>
  );

  if (!isModal) {
    return (
      <section className={styles.inline} aria-label={`Words of ${heading}`}>
        {options}
        <div className={styles.inlineScroll}>{body}</div>
      </section>
    );
  }

  return (
    <div className={styles.overlay} onMouseDown={onClose} role="presentation">
      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gurbani-reader-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className={styles.top}>
          <div className={styles.titles}>
            {gurmukhiTitle && <p className={styles.titleGurmukhi} lang="pa">{gurmukhiTitle}</p>}
            <h2 id="gurbani-reader-title" className={styles.title}>{heading}</h2>
            {parts.length > 0 && (
              <ul className={styles.meta}>
                {parts.map((p) => <li key={p}>{p}</li>)}
              </ul>
            )}
          </div>
          <div className={styles.topActions}>
            {onOpenPdf && (
              <button type="button" className={styles.pdfButton} onClick={onOpenPdf}>
                <FaFilePdf aria-hidden="true" /> PDF
              </button>
            )}
            <button ref={closeRef} type="button" className={styles.close} onClick={onClose} aria-label="Close reader">
              <FaTimes aria-hidden="true" />
            </button>
          </div>
        </header>
        {options}
        <div className={styles.scroll} ref={scrollRef}>{body}</div>
      </div>
    </div>
  );
};

export default GurbaniReader;
