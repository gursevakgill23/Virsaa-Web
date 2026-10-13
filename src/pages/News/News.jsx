/**
 * pages/News/News.jsx
 * -----------------------------------------------------------------------------
 * The News & Events page (/news):
 *   - Featured: stories marked "featured" in Django admin (else the two newest)
 *   - Upcoming events: a swipeable row, refreshed every minute so events added
 *     from the side panel appear without reloading
 *   - Latest news: newest first, with a link to the source or a "Read more"
 * Data: /collections/news/ and /collections/events/ (api/newsApi.js).
 * -----------------------------------------------------------------------------
 */
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { FaMapMarkerAlt, FaClock, FaCalendarAlt, FaExternalLinkAlt } from 'react-icons/fa';
import 'swiper/css';
import 'swiper/css/navigation';
import PageHero from '../../components/PageHero/PageHero';
import newsApi from '../../api/newsApi';
import { safeExternalUrl } from '../../utils/safeUrl';
import styles from './News.module.css';

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

// Header pictures
const headerLight = '/images/header-image.png';
const headerDark = '/images/header-image-dark.png';
// Shown when a story or event has no picture of its own
const latestNewsImage = '/images/News/latest-news.jpg';
const upcomingEventsImage = '/images/News/upcoming-events.jpg';
const featuredNewsImage = '/images/News/featured-news.jpg';

const REFRESH_MS = 60000; // new events appear without reloading

// Parse "YYYY-MM-DD" as a local date (new Date('2024-04-13') would be UTC and can shift a day)
const toDate = (iso) => {
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
};
// Date / time formatting in the visitor's locale
const longDate = (value) => new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
const shortDate = (iso) => toDate(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
const formatTime = (hhmm) => {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
};

// onError handler: swap a broken picture for the default one (once)
const useFallbackImage = (fallback) => (e) => {
  const img = e.currentTarget;
  if (img.dataset.fallback) return;
  img.dataset.fallback = '1';
  img.src = getImagePath(fallback);
};

const News = ({ isDarkMode, apiString }) => {
  const headerImage = useMemo(() => getImagePath(isDarkMode ? headerDark : headerLight), [isDarkMode]);
  // Loaded items and the loading state of each list
  const [news, setNews] = useState([]);
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState({ news: 'loading', events: 'loading' });

  // Load upcoming events. `quiet` (background refresh) keeps the list if it fails.
  const loadEvents = useCallback(async (quiet = false) => {
    try {
      setEvents(await newsApi.events(apiString));
      setStatus((s) => ({ ...s, events: 'ready' }));
    } catch {
      if (!quiet) setStatus((s) => ({ ...s, events: 'error' }));
    }
  }, [apiString]);

  // Load news stories
  const loadNews = useCallback(async () => {
    try {
      setNews(await newsApi.news(apiString));
      setStatus((s) => ({ ...s, news: 'ready' }));
    } catch {
      setStatus((s) => ({ ...s, news: 'error' }));
    }
  }, [apiString]);

  useEffect(() => {
    loadNews();
    loadEvents();
    const timer = setInterval(() => { if (document.visibilityState === 'visible') loadEvents(true); }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [loadNews, loadEvents]);

  // Featured: stories marked featured in admin, otherwise the two newest
  const featured = useMemo(() => {
    const marked = news.filter((n) => n.is_featured);
    return (marked.length ? marked : news).slice(0, 2);
  }, [news]);

  const onNewsImageError = useFallbackImage(latestNewsImage);
  const onEventImageError = useFallbackImage(upcomingEventsImage);
  const onFeaturedImageError = useFallbackImage(featuredNewsImage);

  // Message shown instead of a list: loading, error (with Try again) or empty
  const stateNote = (state, emptyText, retry) => {
    if (state === 'loading') return <p className={styles.note} role="status">Loading…</p>;
    if (state === 'error') {
      return (
        <p className={styles.note} role="alert">
          This couldn’t be loaded right now. <button type="button" className={styles.linkButton} onClick={retry}>Try again</button>
        </p>
      );
    }
    return <p className={styles.note}>{emptyText}</p>;
  };

  return (
    <div className={styles.page}>
      <PageHero
        image={headerImage}
        title="News & Events"
        subtitle="Stay updated with the latest news and upcoming events."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'News & Events' }]}
      />

      {/* ---------- Featured ---------- */}
      <section className={styles.section} aria-labelledby="featured-title">
        <h2 id="featured-title" className={styles.sectionTitle}>Featured</h2>
        <p className={styles.lede}>The stories we’re following most closely.</p>
        {featured.length === 0 ? stateNote(status.news, 'No featured stories yet.', loadNews) : (
          <div className={`${styles.featuredGrid} ${featured.length === 1 ? styles.featuredSingle : ''}`}>
            {featured.map((item, i) => (
              <article key={item.id} className={`${styles.featuredCard} ${i === 0 ? styles.featuredLead : ''}`}>
                <img src={getImagePath(item.image || featuredNewsImage)} alt="" className={styles.featuredImage} loading="lazy" onError={onFeaturedImageError} />
                <div className={styles.featuredScrim} aria-hidden="true" />
                <div className={styles.featuredContent}>
                  <time className={styles.featuredDate} dateTime={item.published_at}>{longDate(item.published_at)}</time>
                  <h3>{item.title}</h3>
                  <p>{item.excerpt}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ---------- Upcoming events ---------- */}
      <section className={styles.section} aria-labelledby="events-title">
        <h2 id="events-title" className={styles.sectionTitle}>Upcoming events</h2>
        <p className={styles.lede}>Gatherings, kirtan and exhibitions. Add your own from the side panel.</p>
        {events.length === 0 ? stateNote(status.events, 'No upcoming events yet. Add one from the side panel.', () => loadEvents()) : (
          <Swiper
            modules={[Navigation]}
            spaceBetween={22}
            slidesPerView={1.1}
            navigation
            className={styles.swiper}
            breakpoints={{
              576: { slidesPerView: 2 },
              992: { slidesPerView: 3 },
            }}
          >
            {events.map((event) => {
              const d = toDate(event.start_date);
              return (
                <SwiperSlide key={event.id} className={styles.slide}>
                  <article className={styles.eventCard}>
                    <div className={styles.eventMedia}>
                      <img src={getImagePath(event.image_url || upcomingEventsImage)} alt="" className={styles.eventImage} loading="lazy" onError={onEventImageError} />
                      <time className={styles.dateTile} dateTime={event.start_date}>
                        <span className={styles.dateDay}>{d.getDate()}</span>
                        <span className={styles.dateMonth}>{d.toLocaleDateString(undefined, { month: 'short' })}</span>
                        <span className={styles.dateYear}>{d.getFullYear()}</span>
                      </time>
                    </div>
                    <div className={styles.eventBody}>
                      <h3>{event.title}</h3>
                      {event.end_date && event.end_date !== event.start_date && (
                        <p><FaCalendarAlt aria-hidden="true" /> {shortDate(event.start_date)} – {shortDate(event.end_date)}</p>
                      )}
                      {event.start_time && <p><FaClock aria-hidden="true" /> {formatTime(event.start_time)}</p>}
                      <p><FaMapMarkerAlt aria-hidden="true" /> {event.location}</p>
                      {event.description && <p className={styles.eventDesc}>{event.description}</p>}
                      {event.details && (
                        <details className={styles.eventDetails}>
                          <summary>Details</summary>
                          <p>{event.details}</p>
                          <p className={styles.postedBy}>Added by {event.posted_by}</p>
                        </details>
                      )}
                    </div>
                  </article>
                </SwiperSlide>
              );
            })}
          </Swiper>
        )}
      </section>

      {/* ---------- Latest news ---------- */}
      <section className={styles.section} aria-labelledby="latest-title">
        <h2 id="latest-title" className={styles.sectionTitle}>Latest news</h2>
        <p className={styles.lede}>Newest first.</p>
        {news.length === 0 ? stateNote(status.news, 'No news yet.', loadNews) : (
          <div className={styles.newsGrid}>
            {news.map((item) => (
              <article key={item.id} className={styles.newsCard}>
                <div className={styles.newsMedia}>
                  <img src={getImagePath(item.image || latestNewsImage)} alt="" className={styles.newsImage} loading="lazy" onError={onNewsImageError} />
                </div>
                <div className={styles.newsBody}>
                  <time className={styles.newsDate} dateTime={item.published_at}>{longDate(item.published_at)}</time>
                  <h3>{item.title}</h3>
                  <p>{item.excerpt}</p>
                  {/* The source link comes from the API, so only real http(s) links are used */}
                  {safeExternalUrl(item.source_url) ? (
                    <a href={safeExternalUrl(item.source_url)} target="_blank" rel="noopener noreferrer" className={styles.readMore}>
                      Read the full story <FaExternalLinkAlt aria-hidden="true" />
                    </a>
                  ) : item.body && item.body !== item.excerpt && (
                    <details className={styles.newsMore}>
                      <summary>Read more</summary>
                      <p>{item.body}</p>
                    </details>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default News;
