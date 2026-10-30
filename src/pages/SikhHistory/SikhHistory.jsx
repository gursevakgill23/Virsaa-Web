/**
 * pages/SikhHistory/SikhHistory.jsx
 * -----------------------------------------------------------------------------
 * The Sikh History page (/sikh-history).
 *
 * Articles come from the backend (api/sikhismApi.js -> /api/sikhism/history/):
 *   - search and category chips in the header (The Gurus, The Khalsa and the
 *     Guru's family, Leaders and martyrs, Events, Places)
 *   - "Explore": the articles of the chosen category as cards
 *   - "Timeline": every dated article from 1469 onwards, oldest first
 *   - the "Inspiring" block, real books from the library, and "Stay tuned"
 * Opening an article goes to /sikh-history/<slug> (SikhHistoryArticle). Guests
 * can browse the cards; the router asks them to sign in before opening one.
 * Only the article list must load; the timeline and books fail quietly.
 * -----------------------------------------------------------------------------
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaBookOpen, FaRedo, FaSearch, FaTimes } from 'react-icons/fa';
import PageHero from '../../components/PageHero/PageHero';
import ComingSoon from '../../elements/ComingSoon/ComingSoon';
import { historyApi } from '../../api/sikhismApi';
import { describeApiError } from '../../utils/apiError';
import HistoryCard from './HistoryCard';
import { CoverPicture, SitePicture } from '../../components/SitePicture/SitePicture';
import styles from './SikhHistory.module.css';

// Header pictures (public/images); the other pictures are real photos from S3 (SitePicture)
const header_image_light = '/images/header-image.png';
const header_image_dark = '/images/header-image-dark.png';

// Converts image paths for the production build (same helper used across pages)
const getImagePath = (imagePath) => {
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

// Shown on the chips until the server's own list of categories arrives
const DEFAULT_CATEGORIES = [
  { id: 'gurus', label: 'The Gurus' },
  { id: 'khalsa', label: 'The Khalsa and the Guru’s family' },
  { id: 'leaders', label: 'Leaders and martyrs' },
  { id: 'events', label: 'Events' },
  { id: 'places', label: 'Places' },
];
const SKELETON_CARDS = 6;

const SikhHistory = ({ isDarkMode, apiString }) => {
  const apiUrl = (apiString || process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
  const headerImage = getImagePath(isDarkMode ? header_image_dark : header_image_light);

  // Articles, the timeline and the library books
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');
  const [timeline, setTimeline] = useState([]);
  const [books, setBooks] = useState([]);

  // What the reader picked
  const [category, setCategory] = useState('gurus');
  const [query, setQuery] = useState('');

  // ---------------------------------------------------------------- loading
  const loadArticles = useCallback(async () => {
    setStatus('loading');
    setError('');
    try {
      const data = await historyApi.list(apiUrl);
      setArticles(data.results);
      if (data.categories.length) setCategories(data.categories);
      setStatus('ready');
    } catch (err) {
      setError(describeApiError(err, 'Sikh History couldn’t be loaded. Check your connection and try again.'));
      setStatus('error');
    }
  }, [apiUrl]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  // The timeline and the books are extras: a failure just hides them
  useEffect(() => {
    let alive = true;
    historyApi.timeline(apiUrl).then((rows) => { if (alive) setTimeline(rows); }).catch(() => {});
    // History books first (the library's own topic filter); any books when it has none yet
    const listOf = (data) => (Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []));
    axios.get(`${apiUrl}/collections/ebooks/?page=1&page_size=10&genre=history`, { timeout: 20000 })
      .then((r) => (listOf(r.data).length
        ? r
        : axios.get(`${apiUrl}/collections/ebooks/?page=1&page_size=10`, { timeout: 20000 })))
      .then((r) => { if (alive) setBooks(listOf(r.data).slice(0, 10)); })
      .catch(() => {});
    return () => { alive = false; };
  }, [apiUrl]);

  // ---------------------------------------------------------------- filtering
  const searching = query.trim().length > 0;
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q) {
      // A search looks across every category
      return articles.filter((a) => [a.title, a.title_pa, a.subtitle, a.summary, a.date_label]
        .some((field) => field && String(field).toLowerCase().includes(q)));
    }
    return articles.filter((a) => a.category === category);
  }, [articles, category, query]);

  const categoryLabel = categories.find((c) => c.id === category)?.label || 'Articles';
  const heading = searching ? `Results for “${query.trim()}”` : categoryLabel;

  return (
    <div className={styles.page}>
      <PageHero
        image={headerImage}
        title="Sikh History"
        subtitle="The Gurus, the Khalsa, its heroes and the turning points of five centuries."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Sikh History' }]}
      >
        <div className={styles.toolbar}>
          <form className={styles.searchBar} role="search" onSubmit={(e) => e.preventDefault()}>
            <FaSearch className={styles.searchIcon} aria-hidden="true" />
            <input
              type="search"
              placeholder="Search people, places and events"
              maxLength={100}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search Sikh History"
            />
            {searching && (
              <button type="button" className={styles.clearSearch} onClick={() => setQuery('')} aria-label="Clear search">
                <FaTimes aria-hidden="true" />
              </button>
            )}
          </form>
          <div className={styles.chips} role="tablist" aria-label="Category">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={!searching && category === c.id}
                className={`${styles.chip} ${!searching && category === c.id ? styles.chipOn : ''}`}
                onClick={() => { setCategory(c.id); setQuery(''); }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </PageHero>

      {/* ---------- Explore: the chosen category (or search results) ---------- */}
      <section className={styles.section} aria-labelledby="explore-title">
        <div className={styles.rowHead}>
          <h2 id="explore-title" className={styles.sectionTitle}>{heading}</h2>
          {status === 'ready' && <p className={styles.count}>{shown.length} {shown.length === 1 ? 'article' : 'articles'}</p>}
        </div>

        {status === 'error' && (
          <div className={styles.problem} role="alert">
            <p>{error}</p>
            <button type="button" className={styles.secondaryButton} onClick={loadArticles}>
              <FaRedo aria-hidden="true" /> Try again
            </button>
          </div>
        )}

        {status === 'ready' && shown.length === 0 && (
          <p className={styles.empty}>
            {searching ? 'Nothing matches that search. Try a name, a place or a year.' : 'No articles here yet.'}
          </p>
        )}

        <ul className={styles.cards}>
          {status === 'loading'
            ? Array.from({ length: SKELETON_CARDS }).map((_, i) => (
                <li key={`s-${i}`} className={`${styles.cardSkeleton} ${styles.skeleton}`} aria-hidden="true" />
              ))
            : shown.map((article) => (
                <li key={article.slug}>
                  <HistoryCard article={article} showCategory={searching} />
                </li>
              ))}
        </ul>
      </section>

      {/* ---------- Timeline ---------- */}
      {timeline.length > 0 && (
        <section className={styles.section} aria-labelledby="timeline-title">
          <h2 id="timeline-title" className={styles.sectionTitle}>Five centuries, one story</h2>
          <p className={styles.lede}>From the birth of Guru Nanak Dev Ji in 1469 to the present day, in order.</p>
          <ol className={styles.timeline}>
            {timeline.map((entry) => (
              <li key={entry.slug} className={styles.era}>
                <span className={styles.node} aria-hidden="true" />
                <Link to={`/sikh-history/${encodeURIComponent(entry.slug)}`} className={styles.eraCard}>
                  <span className={styles.eraYear} aria-hidden="true">{entry.start_year}</span>
                  <span className={styles.eraBody}>
                    <span className={styles.eraDate}>{entry.date_label}</span>
                    <span className={styles.eraTitle}>{entry.title}</span>
                    {entry.subtitle && <span className={styles.eraText}>{entry.subtitle}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* ---------- Inspiring ---------- */}
      <section className={styles.section}>
        <div className={styles.inspiring}>
          <div className={styles.inspiringMedia}>
            <SitePicture name="history-inspiring" alt="" className={styles.mediaImage} />
          </div>
          <div className={styles.inspiringBody}>
            <h2>Most inspiring in Sikhism</h2>
            <p>Discover the most inspiring stories, quotes, and lessons from the Sikh religion.</p>
            <Link to="/collections/ebooks" className={styles.primaryButton}>
              <FaBookOpen aria-hidden="true" /> Read now
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- Books from the library ---------- */}
      {books.length > 0 && (
        <section className={styles.section} aria-labelledby="recommended-title">
          <div className={styles.rowHead}>
            <h2 id="recommended-title" className={styles.sectionTitle}>Read further</h2>
            <Link to="/collections/ebooks" className={styles.textLink}>See all books</Link>
          </div>
          <div className={styles.shelf}>
            {books.map((book) => (
              <Link key={book.id} to={`/collections/ebooks/ebook/${encodeURIComponent(book.id)}`} className={styles.book}>
                <div className={styles.bookCover}>
                  <CoverPicture src={book.cover_image} alt="" className={styles.mediaImage} />
                </div>
                <h3 className={styles.bookTitle}>{book.title}</h3>
              </Link>
            ))}
          </div>
        </section>
      )}

      <ComingSoon isDarkMode={isDarkMode} />
    </div>
  );
};

export default SikhHistory;
