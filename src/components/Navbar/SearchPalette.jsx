/**
 * components/Navbar/SearchPalette.jsx
 * -----------------------------------------------------------------------------
 * The search overlay opened from the navbar (or Ctrl/Cmd+K, or "/").
 * Searches ebooks, audiobooks and authors as you type (after 2 letters, with a
 * short pause), groups the results, and supports the keyboard: arrows to move,
 * Enter to open, Esc to close. Shows recent searches and quick links when empty.
 * -----------------------------------------------------------------------------
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FaSearch, FaTimes, FaBook, FaRegFileAudio, FaFeatherAlt, FaHistory,
  FaGraduationCap, FaArrowRight,
} from 'react-icons/fa';
import { FaHandsPraying } from 'react-icons/fa6';
import Avatar from '../Avatar/Avatar';
import { CoverPicture } from '../SitePicture/SitePicture';
import styles from './SearchPalette.module.css';

const RECENT_KEY = 'virsaa_recent_searches'; // last 5 searches, kept in this browser
const MAX_QUERY = 100; // longest search we send
const TIMEOUT_MS = 15000; // give up on a slow search instead of spinning forever

// Quick links shown before anything is typed
const JUMP_LINKS = [
  { to: '/collections/ebooks', label: 'Ebooks', icon: <FaBook /> },
  { to: '/collections/audiobooks', label: 'Audiobooks', icon: <FaRegFileAudio /> },
  { to: '/collections/authors', label: 'Authors', icon: <FaFeatherAlt /> },
  { to: '/gurbani', label: 'Gurbani', icon: <FaHandsPraying /> },
  { to: '/sikh-history', label: 'Sikh history', icon: <FaHistory /> },
  { to: '/learning', label: 'Learning', icon: <FaGraduationCap /> },
];

// Recent searches: read and save (storage may be blocked, so both are guarded)
const readRecent = () => {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    // Only keep short strings, in case storage was edited by hand
    return Array.isArray(list) ? list.filter((t) => typeof t === 'string' && t.length <= MAX_QUERY).slice(0, 5) : [];
  } catch {
    return [];
  }
};

const saveRecent = (term) => {
  try {
    const next = [term, ...readRecent().filter((t) => t.toLowerCase() !== term.toLowerCase())].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    return next;
  } catch {
    return readRecent();
  }
};

// Wraps the matching part of a title in <mark>
const Highlight = ({ text: rawText, query }) => {
  const text = String(rawText ?? '');
  const i = text.toLowerCase().indexOf(query.toLowerCase());
  if (!query || i === -1) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + query.length)}</mark>
      {text.slice(i + query.length)}
    </>
  );
};

// Props: onClose() closes the overlay; apiString is the API base URL
const SearchPalette = ({ onClose, apiString }) => {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const listRef = useRef(null);
  // What was typed, request state, results per collection, author names, recents,
  // and which result row is highlighted
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [results, setResults] = useState({ ebooks: [], audiobooks: [], authors: [] });
  const [authorNames, setAuthorNames] = useState({});
  const [recent, setRecent] = useState(readRecent);
  const [active, setActive] = useState(0);

  const apiUrl = (apiString || process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
  const term = query.trim();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Author names, so ebook results can show who wrote them
  useEffect(() => {
    let cancelled = false;
    axios.get(`${apiUrl}/collections/authors/`, { timeout: TIMEOUT_MS })
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
        if (!cancelled) setAuthorNames(Object.fromEntries(list.map((a) => [a.id, a.name])));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [apiUrl]);

  // Debounced search across the three collections
  useEffect(() => {
    if (term.length < 2) {
      setStatus('idle');
      setResults({ ebooks: [], audiobooks: [], authors: [] });
      return undefined;
    }
    setStatus('loading');
    let cancelled = false;
    const timer = setTimeout(async () => {
      const q = encodeURIComponent(term);
      const [e, a, au] = await Promise.allSettled([
        axios.get(`${apiUrl}/collections/ebooks/?search=${q}`, { timeout: TIMEOUT_MS }),
        axios.get(`${apiUrl}/collections/audiobooks/?search=${q}`, { timeout: TIMEOUT_MS }),
        axios.get(`${apiUrl}/collections/authors/?search=${q}`, { timeout: TIMEOUT_MS }),
      ]);
      if (cancelled) return;
      const pick = (r) => (r.status === 'fulfilled' && Array.isArray(r.value.data) ? r.value.data.slice(0, 5) : []);
      const allFailed = [e, a, au].every((r) => r.status === 'rejected');
      setResults({ ebooks: pick(e), audiobooks: pick(a), authors: pick(au) });
      setStatus(allFailed ? 'error' : 'done');
      setActive(0);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [term, apiUrl]);

  // One flat list so arrow keys can move through every group
  const flat = useMemo(() => {
    const authorOf = (item) =>
      (typeof item.author === 'object' ? item.author?.name : authorNames[item.author]) || '';
    return [
      ...results.ebooks.map((b) => ({
        key: `e${b.id}`, group: 'Books', title: b.title, meta: authorOf(b) || 'Ebook',
        image: b.cover_image, to: `/collections/ebooks/ebook/${b.id}`,
      })),
      ...results.audiobooks.map((b) => ({
        key: `a${b.id}`, group: 'Audiobooks', title: b.title, meta: authorOf(b) || b.duration || 'Audiobook',
        image: b.cover, to: `/collections/audiobooks/audiobook/${b.id}`,
      })),
      ...results.authors.map((p) => ({
        key: `p${p.id}`, group: 'Authors', title: p.name, meta: p.genre || 'Author',
        image: p.image, to: `/collections/authors/author/${p.id}`, round: true,
      })),
    ];
  }, [results, authorNames]);

  // Open a result: remember the search, close, navigate
  const go = (to) => {
    if (term.length >= 2) setRecent(saveRecent(term));
    onClose();
    navigate(to);
  };

  // Keyboard control for the whole panel
  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown' && flat.length) {
      e.preventDefault();
      setActive((i) => (i + 1) % flat.length);
    } else if (e.key === 'ArrowUp' && flat.length) {
      e.preventDefault();
      setActive((i) => (i - 1 + flat.length) % flat.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flat[active]) go(flat[active].to);
    }
  };

  // Keep the highlighted row in view
  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  // Results grouped for display (empty groups are hidden)
  const groups = ['Books', 'Audiobooks', 'Authors']
    .map((g) => ({ name: g, items: flat.filter((r) => r.group === g) }))
    .filter((g) => g.items.length);

  // Clicking the dimmed area outside the panel closes it
  return (
    <div className={styles.overlay} onMouseDown={onClose} role="presentation">
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Search Virsaa"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className={styles.inputRow}>
          <FaSearch className={styles.inputIcon} aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search books, audiobooks and authors"
            className={styles.input}
            aria-label="Search"
            aria-controls="search-results"
            aria-activedescendant={flat[active] ? `sr-${flat[active].key}` : undefined}
            autoComplete="off"
            maxLength={MAX_QUERY}
            enterKeyHint="search"
          />
          {query && (
            <button type="button" className={styles.clear} onClick={() => { setQuery(''); inputRef.current?.focus(); }}>
              Clear
            </button>
          )}
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close search">
            <FaTimes />
          </button>
        </div>

        <div className={styles.body} id="search-results" ref={listRef}>
          {/* Before typing: recent searches and quick links */}
          {term.length < 2 && (
            <>
              {recent.length > 0 && (
                <section className={styles.block}>
                  <h3 className={styles.blockTitle}>Recent searches</h3>
                  <div className={styles.chips}>
                    {recent.map((r) => (
                      <button key={r} type="button" className={styles.chip} onClick={() => setQuery(r)}>
                        <FaHistory aria-hidden="true" /> {r}
                      </button>
                    ))}
                  </div>
                </section>
              )}
              <section className={styles.block}>
                <h3 className={styles.blockTitle}>Jump to</h3>
                <div className={styles.jumpGrid}>
                  {JUMP_LINKS.map((l) => (
                    <button key={l.to} type="button" className={styles.jump} onClick={() => go(l.to)}>
                      <span className={styles.jumpIcon} aria-hidden="true">{l.icon}</span>
                      {l.label}
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* Loading placeholders */}
          {status === 'loading' && (
            <ul className={styles.list} aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className={styles.skeletonRow}>
                  <span className={styles.skeletonThumb} />
                  <span className={styles.skeletonLines}><span /><span /></span>
                </li>
              ))}
            </ul>
          )}

          {/* No results / error messages */}
          {status === 'done' && groups.length === 0 && (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>Nothing found for “{term}”</p>
              <p>Try a shorter word, or a different spelling of a Punjabi name.</p>
            </div>
          )}

          {status === 'error' && (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>Search isn’t available right now</p>
              <p>Check your connection and try again.</p>
            </div>
          )}

          {/* Results */}
          {status === 'done' && groups.map((g) => (
            <section key={g.name} className={styles.block}>
              <h3 className={styles.blockTitle}>{g.name}</h3>
              <ul className={styles.list} role="listbox" aria-label={g.name}>
                {g.items.map((r) => {
                  const isActive = flat[active]?.key === r.key;
                  return (
                    <li key={r.key} role="option" id={`sr-${r.key}`} aria-selected={isActive}>
                      <button
                        type="button"
                        className={`${styles.row} ${isActive ? styles.rowActive : ''}`}
                        data-active={isActive}
                        onMouseEnter={() => setActive(flat.indexOf(r))}
                        onClick={() => go(r.to)}
                      >
                        {r.round
                          ? <Avatar src={r.image} name={r.title} className={`${styles.thumb} ${styles.thumbRound}`} />
                          : <CoverPicture src={r.image} alt="" className={styles.thumb} />}
                        <span className={styles.rowText}>
                          <span className={styles.rowTitle}><Highlight text={r.title} query={term} /></span>
                          <span className={styles.rowMeta}>{r.meta}</span>
                        </span>
                        <FaArrowRight className={styles.rowArrow} aria-hidden="true" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        <div className={styles.footer} aria-hidden="true">
          <span><kbd>↑</kbd><kbd>↓</kbd> move</span>
          <span><kbd>Enter</kbd> open</span>
          <span><kbd>Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
};

export default SearchPalette;
