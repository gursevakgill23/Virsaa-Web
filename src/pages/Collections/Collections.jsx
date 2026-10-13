/**
 * pages/Collections/Collections.jsx
 * -----------------------------------------------------------------------------
 * The library (/collections, /collections/ebooks, /audiobooks, /authors).
 *   - tabs switch between Ebooks, Audiobooks and Authors (the URL decides which)
 *   - search by title/author, rating and genre filters, 12 cards per page
 *   - featured rows underneath: trending ebooks, featured authors, latest audiobooks
 * Data: the three public /collections/ lists, loaded together; if all three
 * fail, a message with "Try again" is shown.
 * -----------------------------------------------------------------------------
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaSearch, FaTimes, FaBook, FaRegFileAudio, FaFeatherAlt, FaStar, FaClock } from 'react-icons/fa';
import axios from 'axios';
import PageHero from '../../components/PageHero/PageHero';
import styles from './Collections.module.css';

// Cover shown when an item has no picture or it fails to load
const DEFAULT_IMAGE_PATH = '/images/Collections/book-image.jpg';

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

// API files come back as full S3 URLs; anything else falls back to the default cover
const fileUrl = (path) => {
  if (typeof path === 'string' && path.startsWith('http')) return path.replace('/uthors/', '/authors/');
  return DEFAULT_IMAGE_PATH;
};

// onError handler: switch a broken cover to the default one (once)
const handleImgError = (e) => {
  if (e.currentTarget.dataset.fallback) return;
  e.currentTarget.dataset.fallback = '1';
  e.currentTarget.src = DEFAULT_IMAGE_PATH;
};

// The three tabs (ids match the URL: /collections/<id>)
const SECTIONS = [
  { id: 'ebooks', label: 'Ebooks', icon: <FaBook /> },
  { id: 'audiobooks', label: 'Audiobooks', icon: <FaRegFileAudio /> },
  { id: 'authors', label: 'Authors', icon: <FaFeatherAlt /> },
];

// Filters that work with the data the API returns
const RATING_FILTERS = [
  { id: 'highRatings', label: '4★ and up' },
  { id: 'lessRatings', label: 'Under 3★' },
];
const GENRE_FILTERS = [
  { id: 'history', label: 'History', match: ['history'] },
  { id: 'novel', label: 'Novel', match: ['novel'] },
  { id: 'biography', label: 'Biography', match: ['biography'] },
  { id: 'fiction', label: 'Fiction', match: ['fiction'] },
  { id: 'nonFiction', label: 'Non-fiction', match: ['non-fiction', 'nonfiction'] },
];

const Collections = ({ isDarkMode, apiString }) => {
  const location = useLocation();
  // Which tab is open, from the URL
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const currentSection = SECTIONS.some((s) => s.id === pathSegments[1]) ? pathSegments[1] : 'ebooks';
  const sectionLabel = SECTIONS.find((s) => s.id === currentSection).label;

  const headerImage = getProductionImagePath(isDarkMode ? '/images/header-image-dark.png' : '/images/header-image.png');

  // Loaded lists, loading/error state, active filters, search text and page
  const [ebooks, setEbooks] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [audiobooks, setAudiobooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [filters, setFilters] = useState([]);
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0); // bumped by "Try again" to load again
  const cardsPerPage = 12;

  // Collections are public, so no token is sent (an expired one would cause a 401)
  useEffect(() => {
    let cancelled = false;
    const base = (apiString || process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
    const load = async () => {
      setIsLoading(true);
      const [e, a, au] = await Promise.allSettled([
        axios.get(`${base}/collections/ebooks/`, { timeout: 20000 }),
        axios.get(`${base}/collections/authors/`, { timeout: 20000 }),
        axios.get(`${base}/collections/audiobooks/`, { timeout: 20000 }),
      ]);
      if (cancelled) return;
      // A list from a successful request (plain or paginated); [] for a failed one
      const data = (r) => {
        if (r.status !== 'fulfilled') return [];
        const body = r.value.data;
        return Array.isArray(body) ? body : (Array.isArray(body?.results) ? body.results : []);
      };
      setEbooks(data(e));
      setAuthors(data(a));
      setAudiobooks(data(au));
      setLoadError([e, a, au].every((r) => r.status === 'rejected'));
      setIsLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [apiString, reloadKey]);

  // New section, search or filter: back to page 1
  useEffect(() => setCurrentPage(1), [currentSection, query, filters]);

  // Author id → name, so ebooks can be searched and shown by author
  const authorNames = useMemo(() => Object.fromEntries(authors.map((a) => [a.id, a.name])), [authors]);

  // Turn a filter chip on/off; Clear resets search and filters
  const toggleFilter = (id) => {
    setFilters((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  };

  const clearAll = () => {
    setFilters([]);
    setQuery('');
  };

  // The current tab's items after filters and search
  const displayData = useMemo(() => {
    const source = currentSection === 'authors' ? authors : currentSection === 'audiobooks' ? audiobooks : ebooks;
    const q = query.trim().toLowerCase();
    const genres = GENRE_FILTERS.filter((g) => filters.includes(g.id));

    return source.filter((item) => {
      const rating = Number(item.rating) || 0;
      if (filters.includes('highRatings') && rating < 4) return false;
      if (filters.includes('lessRatings') && rating >= 3) return false;

      if (genres.length) {
        const itemGenres = (item.genre || '').split(',').map((g) => g.trim().toLowerCase());
        if (!genres.every((g) => g.match.some((m) => itemGenres.includes(m)))) return false;
      }

      if (q) {
        const name = (item.title || item.name || '').toLowerCase();
        const author = (authorNames[item.author] || '').toLowerCase();
        if (!name.includes(q) && !author.includes(q)) return false;
      }
      return true;
    });
  }, [currentSection, authors, audiobooks, ebooks, filters, query, authorNames]);

  // This page's cards and the featured rows
  const totalPages = Math.ceil(displayData.length / cardsPerPage);
  const currentCards = displayData.slice((currentPage - 1) * cardsPerPage, currentPage * cardsPerPage);
  const trendingEbooks = ebooks.filter((e) => e.rating >= 4.7).slice(0, 8);
  const featuredAuthors = authors.slice(0, 8);
  const latestAudiobooks = audiobooks.slice(0, 8);
  const isFiltering = filters.length > 0 || query.trim();

  // Go to a page of results
  const paginate = (page) => {
    setCurrentPage(page);
    document.getElementById('collection-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ---------- Card renderers ----------
  // Card layouts for each kind of item
  const BookCard = ({ item }) => (
    <Link to={`/collections/ebooks/ebook/${item.id}`} className={styles.bookCard}>
      <span className={styles.bookCover}>
        <img src={fileUrl(item.cover_image)} alt="" loading="lazy" onError={handleImgError} />
      </span>
      <span className={styles.cardTitle}>{item.title}</span>
      <span className={styles.cardMeta}>
        {authorNames[item.author] || (item.pages ? `${item.pages} pages` : 'Ebook')}
      </span>
    </Link>
  );

  const AudioCard = ({ item }) => (
    <Link to={`/collections/audiobooks/audiobook/${item.id}`} className={styles.audioCard}>
      <span className={styles.audioCover}>
        <img src={fileUrl(item.cover)} alt="" loading="lazy" onError={handleImgError} />
        <span className={styles.audioBadge}><FaRegFileAudio aria-hidden="true" /></span>
      </span>
      <span className={styles.cardTitle}>{item.title}</span>
      <span className={styles.cardMeta}>{item.duration ? <><FaClock aria-hidden="true" /> {item.duration}</> : 'Audiobook'}</span>
    </Link>
  );

  const AuthorCard = ({ item }) => (
    <Link to={`/collections/authors/author/${item.id}`} className={styles.authorCard}>
      <span className={styles.authorFrame}>
        <img src={fileUrl(item.image)} alt="" loading="lazy" onError={handleImgError} />
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
          <form className={styles.searchBar} role="search" onSubmit={(e) => e.preventDefault()}>
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
        {!isLoading && (
          <p className={styles.count}>
            {displayData.length} {displayData.length === 1 ? sectionLabel.toLowerCase().replace(/s$/, '') : sectionLabel.toLowerCase()}
          </p>
        )}
      </div>

      {/* ---------- Grid ---------- */}
      <section className={styles.gridSection} id="collection-grid" aria-label={sectionLabel}>
        {loadError && (
          <div className={styles.emptyNote} role="alert">
            <p>The collection couldn’t be loaded. Check your connection and try again.</p>
            <button type="button" className={styles.textButton} onClick={() => setReloadKey((k) => k + 1)}>Try again</button>
          </div>
        )}
        {!loadError && !isLoading && displayData.length === 0 && (
          <div className={styles.emptyNote}>
            <p>Nothing matches{query.trim() ? ` “${query.trim()}”` : ''}.</p>
            {isFiltering && <button type="button" className={styles.textButton} onClick={clearAll}>Clear search and filters</button>}
          </div>
        )}
        <div className={`${styles.grid} ${currentSection === 'authors' ? styles.gridAuthors : ''}`}>
          {isLoading
            ? Array.from({ length: cardsPerPage }).map((_, i) => (
                <div key={`s-${i}`} className={styles.skeletonCard} aria-hidden="true">
                  <span className={`${skeletonClass} ${styles.skeleton}`} />
                  <span className={`${styles.skeleton} ${styles.skeletonLine}`} />
                  <span className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonShort}`} />
                </div>
              ))
            : currentCards.map(renderCard)}
        </div>

        {totalPages > 1 && (
          <nav className={styles.pagination} aria-label="Pages">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                type="button"
                onClick={() => paginate(i + 1)}
                className={currentPage === i + 1 ? styles.activePage : ''}
                aria-current={currentPage === i + 1 ? 'page' : undefined}
              >
                {i + 1}
              </button>
            ))}
          </nav>
        )}
      </section>

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
