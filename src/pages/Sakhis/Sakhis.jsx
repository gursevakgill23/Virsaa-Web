/**
 * pages/Sakhis/Sakhis.jsx
 * -----------------------------------------------------------------------------
 * The Sakhis & Kahaniyaan page (/sakhis).
 *
 * Two kinds of story, from the backend (api/sikhismApi.js -> /api/sikhism/sakhis/):
 *   - Sakhis: from the lives of the Gurus, Gursikhs and Bhagats
 *   - Kahaniyaan: the childhood fables and Punjabi folk tales
 * The header switches between them (?kind=kahani opens the kahaniyaan) and
 * searches both. Each kind shows today's story (a new one every day), then
 * every story as a card, with chips for its categories.
 * Opening a story goes to /sakhis/<slug> (SakhiStory). Guests can browse the
 * cards; the router asks them to sign in before opening one.
 * -----------------------------------------------------------------------------
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FaRedo, FaSearch, FaTimes } from 'react-icons/fa';
import PageHero from '../../components/PageHero/PageHero';
import { sakhiApi } from '../../api/sikhismApi';
import { describeApiError } from '../../utils/apiError';
import StoryCard, { StoryArch } from './StoryCard';
import styles from './Sakhis.module.css';

// Header pictures (public/images), the same as the other content pages
const header_image_light = '/images/header-image.png';
const header_image_dark = '/images/header-image-dark.png';

// Shown until the server's own lists arrive
const DEFAULT_KINDS = [{ id: 'sakhi', label: 'Sakhis' }, { id: 'kahani', label: 'Kahaniyaan' }];
const DEFAULT_CATEGORIES = [
  { id: 'gurus', label: 'The Gurus', kind: 'sakhi' },
  { id: 'sikhs', label: 'Gursikhs and martyrs', kind: 'sakhi' },
  { id: 'bhagats', label: 'Bhagats', kind: 'sakhi' },
  { id: 'other', label: 'Other sakhis', kind: 'sakhi' },
  { id: 'bachpan', label: 'Childhood kahaniyaan', kind: 'kahani' },
  { id: 'lok', label: 'Punjabi folk tales', kind: 'kahani' },
];

// Words for each kind
const KIND = {
  sakhi: {
    pa: 'ਸਾਖੀਆਂ',
    today: 'Today’s sakhi',
    todayPa: 'ਅੱਜ ਦੀ ਸਾਖੀ',
    all: 'All sakhis',
    read: 'Read the sakhi',
    intro: 'Stories from the lives of the Gurus, Gursikhs and Bhagats, told simply for children and families.',
    empty: 'No sakhis here yet.',
  },
  kahani: {
    pa: 'ਕਹਾਣੀਆਂ',
    today: 'Today’s kahani',
    todayPa: 'ਅੱਜ ਦੀ ਕਹਾਣੀ',
    all: 'All kahaniyaan',
    read: 'Read the kahani',
    intro: 'The fables and folk tales Punjabi children grow up with, each ending with what it teaches.',
    empty: 'No kahaniyaan here yet.',
  },
};

const SKELETON_CARDS = 6;

// Days since 1 January 1970 in the reader's own time zone: today's story changes at their midnight
const localDay = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);

const Sakhis = ({ isDarkMode, apiString }) => {
  const apiUrl = (apiString || process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
  const headerImage = isDarkMode ? header_image_dark : header_image_light;
  const [params, setParams] = useSearchParams();
  const kind = params.get('kind') === 'kahani' ? 'kahani' : 'sakhi';
  const words = KIND[kind];

  const [stories, setStories] = useState([]);
  const [kinds, setKinds] = useState(DEFAULT_KINDS);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');

  // ---------------------------------------------------------------- loading
  const load = useCallback(async () => {
    setStatus('loading');
    setError('');
    try {
      const data = await sakhiApi.list(apiUrl);
      setStories(data.results);
      if (data.kinds.length) setKinds(data.kinds);
      if (data.categories.length) setCategories(data.categories);
      setStatus('ready');
    } catch (err) {
      setError(describeApiError(err, 'The stories couldn’t be loaded. Check your connection and try again.'));
      setStatus('error');
    }
  }, [apiUrl]);

  useEffect(() => {
    load();
  }, [load]);

  // Switching kind starts again from all of its stories
  const chooseKind = (id) => {
    setParams(id === 'kahani' ? { kind: 'kahani' } : {}, { replace: true });
    setCategory('all');
    setQuery('');
  };

  // ---------------------------------------------------------------- filtering
  const ofKind = useMemo(() => stories.filter((s) => (s.kind || 'sakhi') === kind), [stories, kind]);
  // Only the categories that have stories get a chip
  const chips = useMemo(
    () => categories.filter((c) => c.kind === kind && ofKind.some((s) => s.category === c.id)),
    [categories, kind, ofKind]
  );
  const searching = query.trim().length > 0;
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q) {
      // A search looks through both kinds
      return stories.filter((s) => [s.title, s.title_pa, s.about, s.summary, s.category_label]
        .some((field) => field && String(field).toLowerCase().includes(q)));
    }
    return category === 'all' ? ofKind : ofKind.filter((s) => s.category === category);
  }, [stories, ofKind, category, query]);

  // A different story every day, the same one all day
  const today = ofKind.length ? ofKind[localDay() % ofKind.length] : null;

  const chipLabel = chips.find((c) => c.id === category)?.label;
  const heading = searching ? `Results for “${query.trim()}”` : (category === 'all' ? words.all : chipLabel || words.all);
  const kindLabel = (id) => kinds.find((k) => k.id === id)?.label || DEFAULT_KINDS.find((k) => k.id === id).label;

  return (
    <div className={styles.page}>
      <PageHero
        image={headerImage}
        title="Sakhis & Kahaniyaan"
        subtitle="Sakhis from the lives of the Gurus and Gursikhs, and the kahaniyaan every Punjabi child grows up with."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Sakhis & Kahaniyaan' }]}
      >
        <div className={styles.toolbar}>
          <div className={styles.kinds} role="tablist" aria-label="Stories">
            {['sakhi', 'kahani'].map((id) => (
              <button
                key={id}
                type="button"
                role="tab"
                id={`kind-${id}`}
                aria-selected={!searching && kind === id}
                aria-controls="stories"
                className={`${styles.kind} ${!searching && kind === id ? styles.kindOn : ''}`}
                onClick={() => chooseKind(id)}
              >
                <span className={`${styles.kindPa} notranslate`} lang="pa" translate="no">{KIND[id].pa}</span>
                <span className={styles.kindEn}>{kindLabel(id)}</span>
              </button>
            ))}
          </div>
          <form className={styles.searchBar} role="search" onSubmit={(e) => e.preventDefault()}>
            <FaSearch className={styles.searchIcon} aria-hidden="true" />
            <input
              type="search"
              placeholder="Search sakhis and kahaniyaan"
              maxLength={100}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search sakhis and kahaniyaan"
            />
            {searching && (
              <button type="button" className={styles.clearSearch} onClick={() => setQuery('')} aria-label="Clear search">
                <FaTimes aria-hidden="true" />
              </button>
            )}
          </form>
        </div>
      </PageHero>

      {/* ---------- Today's story ---------- */}
      {!searching && status === 'loading' && (
        <section className={styles.section} aria-hidden="true">
          <div className={`${styles.todaySkeleton} ${styles.skeleton}`} />
        </section>
      )}
      {!searching && status === 'ready' && today && (
        <section className={styles.section} aria-label={words.today}>
          <Link to={`/sakhis/${encodeURIComponent(today.slug)}`} className={`${styles.today} ${kind === 'kahani' ? styles.todayKahani : ''}`}>
            <StoryArch story={today} size="large" />
            <span className={styles.todayBody}>
              <span className={styles.todayLabel}>
                {words.today}
                <span className={`${styles.todayLabelPa} notranslate`} lang="pa" translate="no">{words.todayPa}</span>
              </span>
              {today.title_pa && <span className={`${styles.todayPa} notranslate`} lang="pa" translate="no">{today.title_pa}</span>}
              <span className={styles.todayTitle}>{today.title}</span>
              {today.about && <span className={styles.todayAbout}>{today.about}</span>}
              <span className={styles.todaySummary}>{today.summary}</span>
              <span className={styles.todayCta}>
                {words.read}
                {today.read_minutes ? <span className={styles.todayMinutes}>{today.read_minutes} min</span> : null}
              </span>
            </span>
          </Link>
        </section>
      )}

      {/* ---------- Every story of this kind (or the search results) ---------- */}
      <section
        className={styles.section}
        id="stories"
        role="tabpanel"
        aria-labelledby={searching ? 'stories-title' : `kind-${kind}`}
      >
        <div className={styles.rowHead}>
          <div>
            <h2 id="stories-title" className={styles.sectionTitle}>{heading}</h2>
            {!searching && <p className={styles.lede}>{words.intro}</p>}
          </div>
          {status === 'ready' && <p className={styles.count}>{shown.length} {shown.length === 1 ? 'story' : 'stories'}</p>}
        </div>

        {!searching && chips.length > 1 && (
          <div className={styles.chips} role="group" aria-label="Category">
            {[{ id: 'all', label: 'All' }, ...chips].map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={category === c.id}
                className={`${styles.chip} ${category === c.id ? styles.chipOn : ''}`}
                onClick={() => setCategory(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}

        {status === 'error' && (
          <div className={styles.problem} role="alert">
            <p>{error}</p>
            <button type="button" className={styles.secondaryButton} onClick={load}>
              <FaRedo aria-hidden="true" /> Try again
            </button>
          </div>
        )}

        {status === 'ready' && shown.length === 0 && (
          <p className={styles.empty}>
            {searching ? 'Nothing matches that search. Try a name, like Nanak or Mardana, or an animal, like crow.' : words.empty}
          </p>
        )}

        <ul className={styles.cards}>
          {status === 'loading'
            ? Array.from({ length: SKELETON_CARDS }).map((_, i) => (
                <li key={`s-${i}`} className={`${styles.cardSkeleton} ${styles.skeleton}`} aria-hidden="true" />
              ))
            : shown.map((story) => (
                <li key={story.slug}>
                  <StoryCard story={story} showCategory={searching} />
                </li>
              ))}
        </ul>
      </section>
    </div>
  );
};

export default Sakhis;
