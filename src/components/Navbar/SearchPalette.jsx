import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FaSearch, FaTimes, FaBook, FaRegFileAudio, FaFeatherAlt, FaHistory,
  FaGraduationCap, FaArrowRight,
} from 'react-icons/fa';
import { FaHandsPraying } from 'react-icons/fa6';
import styles from './SearchPalette.module.css';

const RECENT_KEY = 'virsaa_recent_searches';
const FALLBACK_IMAGE = '/images/logo.png';

const JUMP_LINKS = [
  { to: '/collections/ebooks', label: 'Ebooks', icon: <FaBook /> },
  { to: '/collections/audiobooks', label: 'Audiobooks', icon: <FaRegFileAudio /> },
  { to: '/collections/authors', label: 'Authors', icon: <FaFeatherAlt /> },
  { to: '/gurbani', label: 'Gurbani', icon: <FaHandsPraying /> },
  { to: '/sikh-history', label: 'Sikh history', icon: <FaHistory /> },
  { to: '/learning', label: 'Learning', icon: <FaGraduationCap /> },
];

const readRecent = () => {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(list) ? list.slice(0, 5) : [];
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
const Highlight = ({ text, query }) => {
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

const SearchPalette = ({ onClose, apiString }) => {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const listRef = useRef(null);
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
    axios.get(`${apiUrl}/collections/authors/`)
      .then((res) => {
        if (!cancelled) setAuthorNames(Object.fromEntries(res.data.map((a) => [a.id, a.name])));
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
        axios.get(`${apiUrl}/collections/ebooks/?search=${q}`),
        axios.get(`${apiUrl}/collections/audiobooks/?search=${q}`),
        axios.get(`${apiUrl}/collections/authors/?search=${q}`),
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

  const go = (to) => {
    if (term.length >= 2) setRecent(saveRecent(term));
    onClose();
    navigate(to);
  };

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

  const groups = ['Books', 'Audiobooks', 'Authors']
    .map((g) => ({ name: g, items: flat.filter((r) => r.group === g) }))
    .filter((g) => g.items.length);

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
                        <img
                          src={r.image || FALLBACK_IMAGE}
                          alt=""
                          className={`${styles.thumb} ${r.round ? styles.thumbRound : ''}`}
                          onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                        />
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
