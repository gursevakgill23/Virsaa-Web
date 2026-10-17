/**
 * pages/SikhHistory/SikhHistoryArticle.jsx
 * -----------------------------------------------------------------------------
 * One Sikh History article (/sikh-history/:slug), loaded from
 * /api/sikhism/history/<slug>/:
 *   - Gurmukhi title, dates, category and reading time
 *   - the summary, then each section with its heading
 *   - "On this page" links to the sections (beside the text on wide screens)
 *   - sources for further reading (outside links open in a new tab)
 *   - related articles
 * While loading, the Virsaa loader is shown; an unknown slug shows a clear
 * "not found" message with a way back.
 * -----------------------------------------------------------------------------
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaArrowLeft, FaExternalLinkAlt, FaRedo } from 'react-icons/fa';
import PageHero from '../../components/PageHero/PageHero';
import Loader from '../../components/VirsaaLoader/Loader';
import { historyApi } from '../../api/sikhismApi';
import { describeApiError } from '../../utils/apiError';
import { safeExternalUrl } from '../../utils/safeUrl';
import HistoryCard from './HistoryCard';
import styles from './SikhHistory.module.css';

const header_image_light = '/images/header-image.png';
const header_image_dark = '/images/header-image-dark.png';

// Section headings become anchors: "Early life" -> "early-life"
const anchor = (text, index) => `${String(text || 'section').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${index}`;

const SikhHistoryArticle = ({ isDarkMode, apiString }) => {
  const { slug } = useParams();
  const apiUrl = (apiString || process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
  const [article, setArticle] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | missing | error
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setStatus('loading');
    setError('');
    try {
      const data = await historyApi.entry(apiUrl, slug);
      setArticle(data);
      setStatus('ready');
    } catch (err) {
      if (err?.response?.status === 404) {
        setStatus('missing');
        return;
      }
      setError(describeApiError(err, 'This article couldn’t be loaded. Check your connection and try again.'));
      setStatus('error');
    }
  }, [apiUrl, slug]);

  useEffect(() => {
    load();
    window.scrollTo({ top: 0 });
  }, [load]);

  const headerImage = isDarkMode ? header_image_dark : header_image_light;
  const crumbs = [{ label: 'Home', to: '/' }, { label: 'Sikh History', to: '/sikh-history' }];

  if (status === 'loading') return <Loader variant="wait" />;

  if (status !== 'ready') {
    return (
      <div className={styles.page}>
        <PageHero image={headerImage} title="Sikh History" compact crumbs={[...crumbs.slice(0, 1), { label: 'Sikh History' }]} />
        <section className={styles.section}>
          <div className={styles.problem} role={status === 'error' ? 'alert' : undefined}>
            <p>{status === 'missing' ? 'We couldn’t find that article. It may have been renamed.' : error}</p>
            <div className={styles.problemActions}>
              {status === 'error' && (
                <button type="button" className={styles.secondaryButton} onClick={load}>
                  <FaRedo aria-hidden="true" /> Try again
                </button>
              )}
              <Link to="/sikh-history" className={styles.primaryButton}>
                <FaArrowLeft aria-hidden="true" /> All of Sikh History
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const sections = Array.isArray(article.sections) ? article.sections : [];
  const sources = (Array.isArray(article.sources) ? article.sources : [])
    .map((s) => ({ title: s.title, url: safeExternalUrl(s.url) }))
    .filter((s) => s.url);
  const related = Array.isArray(article.related) ? article.related : [];

  return (
    <div className={styles.page}>
      <PageHero
        image={headerImage}
        title={article.title}
        subtitle={article.subtitle}
        compact
        crumbs={[...crumbs, { label: article.title }]}
      />

      <div className={styles.articleWrap}>
        {/* "On this page": jump to a section */}
        {sections.length > 1 && (
          <nav className={styles.toc} aria-label="On this page">
            <p className={styles.tocTitle}>On this page</p>
            <ol>
              {sections.map((s, i) => (
                <li key={anchor(s.heading, i)}><a href={`#${anchor(s.heading, i)}`}>{s.heading}</a></li>
              ))}
            </ol>
          </nav>
        )}

        <article className={styles.article}>
          <header className={styles.articleHead}>
            {article.title_pa && <p className={styles.articlePa} lang="pa">{article.title_pa}</p>}
            <p className={styles.articleMeta}>
              {[article.date_label, article.category_label, article.read_minutes ? `${article.read_minutes} min read` : '']
                .filter(Boolean).join(' · ')}
            </p>
            <p className={styles.articleSummary}>{article.summary}</p>
          </header>

          {sections.map((s, i) => (
            <section key={anchor(s.heading, i)} id={anchor(s.heading, i)} className={styles.articleSection}>
              {s.heading && <h2>{s.heading}</h2>}
              {(Array.isArray(s.paragraphs) ? s.paragraphs : []).map((p, j) => <p key={j}>{p}</p>)}
            </section>
          ))}

          {sources.length > 0 && (
            <footer className={styles.sources}>
              <h2>Further reading</h2>
              <ul>
                {sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.title || s.url} <FaExternalLinkAlt aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </footer>
          )}

          <Link to="/sikh-history" className={styles.backLink}>
            <FaArrowLeft aria-hidden="true" /> All of Sikh History
          </Link>
        </article>
      </div>

      {related.length > 0 && (
        <section className={styles.section} aria-labelledby="related-title">
          <h2 id="related-title" className={styles.sectionTitle}>Read next</h2>
          <ul className={`${styles.cards} ${styles.cardsCompact}`}>
            {related.map((r) => (
              <li key={r.slug}><HistoryCard article={r} compact /></li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default SikhHistoryArticle;
