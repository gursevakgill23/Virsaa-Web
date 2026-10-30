/**
 * pages/Collections/Collections.jsx
 * -----------------------------------------------------------------------------
 * The library (/collections, /collections/ebooks, /audiobooks, /authors).
 *   - tabs switch between Ebooks, Audiobooks and Authors (the URL decides which)
 *   - search by title/author; filters: language (English / ਪੰਜਾਬੀ), rating and
 *     topic (Gurus, Sikhi, History...); 12 cards per page
 *   - pages: Previous / numbers / Next, "13–24 of 75"; the page is kept in the
 *     address (?page=2), so a refresh, a shared link or Back opens the same page
 *   - Ebooks are paged by the server (/collections/ebooks/?page=2&page_size=12
 *     with the search and filters), so the library can grow to any size;
 *     audiobooks and authors are filtered and paged here
 *   - featured rows underneath: trending ebooks, featured authors, latest audiobooks
 *   - "Share a book": a button in the header and a note under the grid
 *     (ebooks and audiobooks) that open /share-a-book (pages/Rewards)
 * Data: the public /collections/ lists (no token); if they fail, a message
 * with "Try again" is shown.
 * -----------------------------------------------------------------------------
 */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FaSearch, FaTimes, FaBook, FaRegFileAudio, FaFeatherAlt, FaStar, FaClock, FaPlus, FaChevronLeft, FaChevronRight,
} from 'react-icons/fa';
import axios from 'axios';
import PageHero from '../../components/PageHero/PageHero';
import { CoverPicture } from '../../components/SitePicture/SitePicture';
import Avatar from '../../components/Avatar/Avatar';
import RewardCoin from '../../components/RewardCoin/RewardCoin';
import styles from './Collections.module.css';

// Public/static images
// Converts image paths for the production build (same helper used across pages)
const getProductionImagePath = (imagePath) => {
  if (process.env.NODE_ENV === 'production') {
    if (typeof imagePath === 'string') {
      return (imagePath.startsWith('/') || /^(https?:|blob:|data:)/i.test(imagePath))
        ? imagePath
        : `/${imagePath.replace(/.*static\/media/, 'static/media')}`;
    }
    return imagePath.default || imagePath;
  }
  return imagePath;
};

// API files come back as full S3 URLs. Covers without one show the website picture
// 'fallback-book' (CoverPicture); authors without a photo show their initials (Avatar).
const fileUrl = (path) => (typeof path === 'string' && path.startsWith('http') ? path.replace('/uthors/', '/authors/') : '');

// The three tabs (ids match the URL: /collections/<id>)
const SECTIONS = [
  { id: 'ebooks', label: 'Ebooks', icon: <FaBook /> },
  { id: 'audiobooks', label: 'Audiobooks', icon: <FaRegFileAudio /> },
  { id: 'authors', label: 'Authors', icon: <FaFeatherAlt /> },
];

const PAGE_SIZE = 12;

// Language of books and audiobooks (one at a time)
const LANGUAGE_FILTERS = [
  { id: 'en', label: 'English' },
  { id: 'pa', label: 'ਪੰਜਾਬੀ', lang: 'pa', name: 'Punjabi' },
];
const RATING_FILTERS = [
  { id: 'highRatings', label: '4★ and up' },
  { id: 'lessRatings', label: 'Under 3★' },
];
// Topics: the ids are the server's (?genre=gurus); the words find them in an audiobook's or author's genre
const GENRE_FILTERS = [
  { id: 'gurus', label: 'Gurus', match: ['guru'] },
  { id: 'sikhi', label: 'Sikhi', match: ['sikhi', 'sikhism', 'gurbani', 'kirtan', 'religion', 'spirituality'] },
  { id: 'history', label: 'History', match: ['history'] },
  { id: 'novel', label: 'Novel', match: ['novel'] },
  { id: 'biography', label: 'Biography', match: ['biography'] },
  { id: 'fiction', label: 'Fiction', match: ['fiction', 'novel', 'stories'] },
  { id: 'non_fiction', label: 'Non-fiction', match: ['non-fiction', 'nonfiction'] },
];

// Does a genre text ("History, Gurus") have this topic? ("Non-fiction" isn't "fiction")
const hasTopic = (genre, topic) => {
  const text = String(genre || '').toLowerCase();
  return topic.match.some((word) => (word === 'fiction'
    ? /(^|[^-\w])fiction/.test(text)
    : text.includes(word)));
};

// The page numbers to show: 1 … 4 5 6 … 12
const pageItems = (page, pages) => {
  const wanted = new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages));
  if (page <= 3) [2, 3, 4].forEach((n) => n <= pages && wanted.add(n));
  if (page >= pages - 2) [pages - 1, pages - 2, pages - 3].forEach((n) => n >= 1 && wanted.add(n));
  const sorted = [...wanted].sort((a, b) => a - b);
  return sorted.flatMap((n, i) => (i > 0 && n - sorted[i - 1] > 1 ? ['gap', n] : [n]));
};

// Previous / page numbers / Next
const Pagination = ({ page, pages, onGo }) => {
  if (pages <= 1) return null;
  return (
    <nav className={styles.pagination} aria-label="Pages">
      <button type="button" className={styles.pageArrow} onClick={() => onGo(page - 1)} disabled={page <= 1}>
        <FaChevronLeft aria-hidden="true" /> <span>Previous</span>
      </button>
      {pageItems(page, pages).map((item, i) => (item === 'gap'
        ? <span key={`gap-${i}`} className={styles.pageGap} aria-hidden="true">…</span>
        : (
          <button
            key={item}
            type="button"
            onClick={() => onGo(item)}
            className={item === page ? styles.activePage : ''}
            aria-current={item === page ? 'page' : undefined}
            aria-label={`Page ${item}`}
          >
            {item}
          </button>
        )))}
      <button type="button" className={styles.pageArrow} onClick={() => onGo(page + 1)} disabled={page >= pages}>
        <span>Next</span> <FaChevronRight aria-hidden="true" />
      </button>
    </nav>
  );
};

// A list from a successful request (plain or paged); [] otherwise
const listOf = (result) => {
  if (result.status !== 'fulfilled') return [];
  const body = result.value.data;
  return Array.isArray(body) ? body : (Array.isArray(body?.results) ? body.results : []);
};

const Collections = ({ isDarkMode, apiString }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const base = (apiString || process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

  // Which tab is open, and which page, from the URL
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const currentSection = SECTIONS.some((s) => s.id === pathSegments[1]) ? pathSegments[1] : 'ebooks';
  const sectionLabel = SECTIONS.find((s) => s.id === currentSection).label;
  const currentPage = Math.max(1, parseInt(new URLSearchParams(location.search).get('page'), 10) || 1);

  const headerImage = getProductionImagePath(isDarkMode ? '/images/header-image-dark.png' : '/images/header-image.png');

  // Audiobooks and authors (whole lists), trending ebooks, and loading / error state
  const [authors, setAuthors] = useState([]);
  const [audiobooks, setAudiobooks] = useState([]);
  const [trendingEbooks, setTrendingEbooks] = useState([]);
  const [listsLoading, setListsLoading] = useState(true);
  const [listsFailed, setListsFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0); // bumped by "Try again" to load again

  // One page of ebooks from the server
  const [ebookPage, setEbookPage] = useState({ status: 'loading', items: [], count: 0, pages: 1 });

  // Filters and search
  const [filters, setFilters] = useState([]);       // rating and topic chips
  const [language, setLanguage] = useState('');      // '' | 'en' | 'pa'
  const [query, setQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); // the query, once typing pauses

  // ---------------------------------------------------------------- the whole lists (public, no token)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setListsLoading(true);
      const [a, au, t] = await Promise.allSettled([
        axios.get(`${base}/collections/authors/`, { timeout: 20000 }),
        axios.get(`${base}/collections/audiobooks/`, { timeout: 20000 }),
        axios.get(`${base}/collections/ebooks/?page=1&page_size=8&min_rating=4.7&ordering=-rating`, { timeout: 20000 }),
      ]);
      if (cancelled) return;
      setAuthors(listOf(a));
      setAudiobooks(listOf(au));
      setTrendingEbooks(listOf(t).filter((e) => Number(e.rating) >= 4.7).slice(0, 8));
      setListsFailed([a, au].every((r) => r.status === 'rejected'));
      setListsLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [base, reloadKey]);

  // The search waits for a pause in typing
  useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Go to a page of results (kept in the address); `replace` doesn't add a Back step
  const goToPage = (page, { replace = false, scroll = true } = {}) => {
    const params = new URLSearchParams(location.search);
    if (page > 1) params.set('page', String(page));
    else params.delete('page');
    const search = params.toString();
    navigate({ pathname: location.pathname, search: search ? `?${search}` : '' }, { replace });
    if (scroll) document.getElementById('collection-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // New search or filter: back to page 1 (a link to ?page=3 keeps its page)
  const filterKey = `${searchTerm}|${language}|${filters.join(',')}`;
  const shownFilters = useRef(filterKey);
  useEffect(() => {
    if (shownFilters.current === filterKey) return;
    shownFilters.current = filterKey;
    if (currentPage !== 1) goToPage(1, { replace: true, scroll: false });
    // only when the search or filters change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  // ---------------------------------------------------------------- a page of ebooks (server)
  useEffect(() => {
    if (currentSection !== 'ebooks') return undefined;
    let cancelled = false;
    const params = new URLSearchParams({ page: String(currentPage), page_size: String(PAGE_SIZE) });
    if (searchTerm) params.set('search', searchTerm);
    if (language) params.set('language', language);
    if (filters.includes('highRatings')) params.set('min_rating', '4');
    if (filters.includes('lessRatings')) params.set('max_rating', '3');
    GENRE_FILTERS.filter((g) => filters.includes(g.id)).forEach((g) => params.append('genre', g.id));

    setEbookPage((prev) => ({ ...prev, status: 'loading' }));
    axios.get(`${base}/collections/ebooks/?${params.toString()}`, { timeout: 20000 })
      .then(({ data }) => {
        if (cancelled) return;
        if (Array.isArray(data)) {
          // A server without pages yet: filter and page here (language and topics need the new server)
          const q = searchTerm.toLowerCase();
          const all = data.filter((item) => {
            const rating = Number(item.rating) || 0;
            if (filters.includes('highRatings') && rating < 4) return false;
            if (filters.includes('lessRatings') && rating >= 3) return false;
            return !q || String(item.title || '').toLowerCase().includes(q);
          });
          const pages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
          const page = Math.min(currentPage, pages);
          setEbookPage({ status: 'ready', items: all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), count: all.length, pages });
          return;
        }
        const items = Array.isArray(data?.results) ? data.results : [];
        setEbookPage({ status: 'ready', items, count: Number(data?.count) || 0, pages: Number(data?.pages) || 1 });
        if (data?.page && Number(data.page) !== currentPage) goToPage(Number(data.page), { replace: true, scroll: false });
      })
      .catch(() => {
        if (!cancelled) setEbookPage({ status: 'error', items: [], count: 0, pages: 1 });
      });
    return () => { cancelled = true; };
    // goToPage changes every render; the page and filters decide when to ask again
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, currentSection, currentPage, filterKey, reloadKey]);

  // Author id → name, for audiobooks (ebook cards bring their author's name)
  const authorNames = useMemo(() => Object.fromEntries(authors.map((a) => [a.id, a.name])), [authors]);

  // Turn a chip on/off; Clear resets search and filters
  const toggleFilter = (id) => {
    setFilters((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  };

  const clearAll = () => {
    setFilters([]);
    setLanguage('');
    setQuery('');
    setSearchTerm('');
  };

  // ---------------------------------------------------------------- audiobooks and authors (here)
  const localData = useMemo(() => {
    if (currentSection === 'ebooks') return [];
    const source = currentSection === 'authors' ? authors : audiobooks;
    const q = searchTerm.toLowerCase();
    const topics = GENRE_FILTERS.filter((g) => filters.includes(g.id));
    return source.filter((item) => {
      const rating = Number(item.rating) || 0;
      if (filters.includes('highRatings') && rating < 4) return false;
      if (filters.includes('lessRatings') && rating >= 3) return false;
      if (language && currentSection === 'audiobooks' && (item.language || 'pa') !== language) return false;
      if (topics.length && !topics.every((topic) => hasTopic(item.genre, topic))) return false;
      if (q) {
        const name = (item.title || item.name || '').toLowerCase();
        const author = (authorNames[item.author] || '').toLowerCase();
        if (!name.includes(q) && !author.includes(q)) return false;
      }
      return true;
    });
  }, [currentSection, authors, audiobooks, filters, language, searchTerm, authorNames]);

  // What the grid shows now
  const isEbooks = currentSection === 'ebooks';
  const localPages = Math.max(1, Math.ceil(localData.length / PAGE_SIZE));
  const page = isEbooks ? currentPage : Math.min(currentPage, localPages);
  const pages = isEbooks ? ebookPage.pages : localPages;
  const total = isEbooks ? ebookPage.count : localData.length;
  const currentCards = isEbooks ? ebookPage.items : localData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const isLoading = isEbooks ? ebookPage.status === 'loading' && ebookPage.items.length === 0 : listsLoading;
  const isRefreshing = isEbooks && ebookPage.status === 'loading' && ebookPage.items.length > 0;
  const loadError = isEbooks ? ebookPage.status === 'error' : listsFailed;
  const isFiltering = filters.length > 0 || Boolean(language) || Boolean(query.trim());
  const featuredAuthors = authors.slice(0, 8);
  const latestAudiobooks = audiobooks.slice(0, 12);
  const noun = total === 1 ? sectionLabel.toLowerCase().replace(/s$/, '') : sectionLabel.toLowerCase();
  const first = total ? (page - 1) * PAGE_SIZE + 1 : 0;
  const last = Math.min(page * PAGE_SIZE, total);

  // "Share a book" opens on the kind of book being browsed
  const shareType = currentSection === 'audiobooks' ? 'audiobook' : currentSection === 'ebooks' ? 'ebook' : '';

  // ---------- Card renderers ----------
  // Card layouts for each kind of item
  const BookCard = ({ item }) => (
    <Link to={`/collections/ebooks/ebook/${item.id}`} className={styles.bookCard}>
      <span className={styles.bookCover}>
        <CoverPicture src={fileUrl(item.cover_image)} alt="" className={styles.coverImage} />
      </span>
      <span className={styles.cardTitle}>{item.title}</span>
      <span className={styles.cardMeta}>
        {item.author_name || authorNames[item.author] || (item.pages ? `${item.pages} pages` : 'Ebook')}
      </span>
    </Link>
  );

  const AudioCard = ({ item }) => (
    <Link to={`/collections/audiobooks/audiobook/${item.id}`} className={styles.audioCard}>
      <span className={styles.audioCover}>
        <CoverPicture src={fileUrl(item.cover)} alt="" className={styles.coverImage} />
        <span className={styles.audioBadge}><FaRegFileAudio aria-hidden="true" /></span>
      </span>
      <span className={styles.cardTitle}>{item.title}</span>
      <span className={styles.cardMeta}>
        {authorNames[item.author] ? `${authorNames[item.author]} · ` : ''}
        {item.duration ? <><FaClock aria-hidden="true" /> {item.duration}</> : 'Audiobook'}
      </span>
    </Link>
  );

  const AuthorCard = ({ item }) => (
    <Link to={`/collections/authors/author/${item.id}`} className={styles.authorCard}>
      <span className={styles.authorFrame}>
        <Avatar src={fileUrl(item.image)} name={item.name} className={styles.coverImage} loading="lazy" />
      </span>
      <span className={styles.cardTitle}>{item.name}</span>
      <span className={styles.cardMeta}>{item.genre || 'Author'}</span>
    </Link>
  );

  const renderCard = (item) => {
    if (currentSection === 'authors') return <AuthorCard key={item.id} item={item} />;
    if (currentSection === 'audiobooks') return <AudioCard key={item.id} item={item} />;
    return <BookCard key={item.id} item={item} />;
  };

  const skeletonClass = currentSection === 'authors'
    ? styles.authorFrame
    : currentSection === 'audiobooks' ? styles.audioCover : styles.bookCover;

  return (
    <div className={styles.page}>
      <PageHero
        image={headerImage}
        title="COLLECTIONS"
        subtitle={`Browse ${sectionLabel.toLowerCase()} on Punjabi history, culture and Sikhi.`}
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Collections', to: '/collections' }, { label: sectionLabel }]}
      >
        <div className={styles.heroTools}>
          <div className={styles.tabRow}>
            <nav className={styles.sectionTabs} aria-label="Collection type">
              {SECTIONS.map((s) => (
                <Link
                  key={s.id}
                  to={`/collections/${s.id}`}
                  className={`${styles.sectionTab} ${currentSection === s.id ? styles.sectionTabActive : ''}`}
                  aria-current={currentSection === s.id ? 'page' : undefined}
                >
                  <span aria-hidden="true">{s.icon}</span> {s.label}
                </Link>
              ))}
            </nav>
            <Link to={`/share-a-book${shareType ? `?type=${shareType}` : ''}`} className={styles.shareLink}>
              <FaPlus aria-hidden="true" /> Share a book
            </Link>
          </div>
          <form className={styles.searchBar} role="search" onSubmit={(e) => { e.preventDefault(); setSearchTerm(query.trim()); }}>
            <FaSearch className={styles.searchIcon} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={currentSection === 'authors' ? 'Search authors by name' : 'Search by title or author'}
              maxLength={100}
              aria-label={`Search ${sectionLabel.toLowerCase()}`}
            />
          </form>
        </div>
      </PageHero>

      {/* ---------- Filters ---------- */}
      <div className={styles.filterBar}>
        <div className={styles.chips} role="group" aria-label="Filters">
          {currentSection !== 'authors' && (
            <>
              {LANGUAGE_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  lang={f.lang}
                  className={`${styles.chip} ${language === f.id ? styles.chipOn : ''}`}
                  onClick={() => setLanguage((current) => (current === f.id ? '' : f.id))}
                  aria-pressed={language === f.id}
                  aria-label={f.name ? `${f.name} (${f.label})` : undefined}
                >
                  {f.label}
                </button>
              ))}
              <span className={styles.chipDivider} aria-hidden="true" />
            </>
          )}
          {RATING_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`${styles.chip} ${filters.includes(f.id) ? styles.chipOn : ''}`}
              onClick={() => toggleFilter(f.id)}
              aria-pressed={filters.includes(f.id)}
            >
              <FaStar aria-hidden="true" /> {f.label}
            </button>
          ))}
          <span className={styles.chipDivider} aria-hidden="true" />
          {GENRE_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`${styles.chip} ${filters.includes(f.id) ? styles.chipOn : ''}`}
              onClick={() => toggleFilter(f.id)}
              aria-pressed={filters.includes(f.id)}
            >
              {f.label}
            </button>
          ))}
          {isFiltering && (
            <button type="button" className={styles.clearChip} onClick={clearAll}>
              <FaTimes aria-hidden="true" /> Clear
            </button>
          )}
        </div>
        {!isLoading && !loadError && (
          <p className={styles.count} aria-live="polite">
            {total > PAGE_SIZE ? `${first}–${last} of ${total} ${noun}` : `${total} ${noun}`}
          </p>
        )}
      </div>

      {/* ---------- Grid ---------- */}
      <section className={styles.gridSection} id="collection-grid" aria-label={sectionLabel} aria-busy={isLoading || isRefreshing}>
        {loadError && (
          <div className={styles.emptyNote} role="alert">
            <p>The collection couldn’t be loaded. Check your connection and try again.</p>
            <button type="button" className={styles.textButton} onClick={() => setReloadKey((k) => k + 1)}>Try again</button>
          </div>
        )}
        {!loadError && !isLoading && !isRefreshing && total === 0 && (
          <div className={styles.emptyNote}>
            <p>Nothing matches{query.trim() ? ` “${query.trim()}”` : ''}.</p>
            {isFiltering && <button type="button" className={styles.textButton} onClick={clearAll}>Clear search and filters</button>}
          </div>
        )}
        <div className={`${styles.grid} ${currentSection === 'authors' ? styles.gridAuthors : ''} ${isRefreshing ? styles.gridBusy : ''}`}>
          {isLoading
            ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <div key={`s-${i}`} className={styles.skeletonCard} aria-hidden="true">
                  <span className={`${skeletonClass} ${styles.skeleton}`} />
                  <span className={`${styles.skeleton} ${styles.skeletonLine}`} />
                  <span className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonShort}`} />
                </div>
              ))
            : currentCards.map(renderCard)}
        </div>

        {!loadError && <Pagination page={page} pages={pages} onGo={(n) => goToPage(Math.min(Math.max(n, 1), pages))} />}
      </section>

      {/* ---------- Share a book ---------- */}
      {shareType && (
        <section className={styles.section} aria-labelledby="share-title">
          <div className={styles.shareBanner}>
            <span className={styles.shareCoin}><RewardCoin size={64} shine /></span>
            <div className={styles.shareText}>
              <h2 id="share-title">Have a Punjabi {shareType === 'audiobook' ? 'recording' : 'book'} to share?</h2>
              <p>
                Send it to Virsaa. When it passes our review it joins the library and you earn reward coins,
                for game coins, a membership or printed books.
              </p>
            </div>
            <div className={styles.shareActions}>
              <Link to={`/share-a-book?type=${shareType}`} className={styles.shareButton}>
                <FaPlus aria-hidden="true" /> Share {shareType === 'audiobook' ? 'an audiobook' : 'an ebook'}
              </Link>
              <Link to="/my-rewards" className={styles.textLink}>How rewards work</Link>
            </div>
          </div>
        </section>
      )}

      {/* ---------- Featured rows ---------- */}
      {featuredAuthors.length > 0 && (
        <section className={styles.section} aria-labelledby="featured-authors">
          <div className={styles.rowHead}>
            <h2 id="featured-authors" className={styles.sectionTitle}>Featured authors</h2>
            <Link to="/collections/authors" className={styles.textLink}>All authors</Link>
          </div>
          <div className={styles.row}>
            {featuredAuthors.map((a) => <AuthorCard key={a.id} item={a} />)}
          </div>
        </section>
      )}

      {trendingEbooks.length > 0 && (
        <section className={styles.section} aria-labelledby="trending">
          <div className={styles.rowHead}>
            <h2 id="trending" className={styles.sectionTitle}>Trending ebooks</h2>
            <Link to="/collections/ebooks" className={styles.textLink}>All ebooks</Link>
          </div>
          <div className={styles.row}>
            {trendingEbooks.map((b) => <BookCard key={b.id} item={b} />)}
          </div>
        </section>
      )}

      {latestAudiobooks.length > 0 && (
        <section className={styles.section} aria-labelledby="latest-audio">
          <div className={styles.rowHead}>
            <h2 id="latest-audio" className={styles.sectionTitle}>Latest audiobooks</h2>
            <Link to="/collections/audiobooks" className={styles.textLink}>All audiobooks</Link>
          </div>
          <div className={styles.row}>
            {latestAudiobooks.map((b) => <AudioCard key={b.id} item={b} />)}
          </div>
        </section>
      )}
    </div>
  );
};

export default Collections;
