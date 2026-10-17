/**
 * pages/SikhHistory/HistoryCard.jsx
 * -----------------------------------------------------------------------------
 * One Sikh History article as a card: an arch with the year it begins (in the
 * same arch shape as the rest of the site), the Gurmukhi and English titles,
 * the dates, a two-line summary and the reading time. The whole card links to
 * the article. Used on the Sikh History page and under an article ("Related").
 * -----------------------------------------------------------------------------
 */
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './SikhHistory.module.css';

// Words that don't identify the person or place, skipped when choosing the arch's letter
const COMMON_WORDS = new Set(['ਗੁਰੂ', 'ਸ੍ਰੀ', 'ਬਾਬਾ', 'ਭਾਈ', 'ਮਾਤਾ', 'ਮਾਈ', 'ਮਹਾਰਾਜਾ', 'ਮਹਾਰਾਣੀ', 'ਅਕਾਲੀ', 'ਨਵਾਬ', 'ਦਾ', 'ਦੀ', 'ਦੇ', 'ਜੀ']);

/**
 * The first letter (with its vowel signs) of the most distinctive Gurmukhi word,
 * e.g. ਗੁਰੂ ਨਾਨਕ ਦੇਵ ਜੀ -> ਨਾ. Shown when an article has no year.
 */
export const gurmukhiInitial = (text) => {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const word = words.find((w) => !COMMON_WORDS.has(w)) || words[0] || '';
  const match = word.match(/^[਀-੿][਼-ੑੰੱ]*/);
  return match ? match[0] : '';
};

const HistoryCard = ({ article, showCategory = false, compact = false }) => {
  const year = article.start_year;
  return (
    <Link
      to={`/sikh-history/${encodeURIComponent(article.slug)}`}
      className={`${styles.card} ${compact ? styles.cardCompact : ''}`}
    >
      <span className={styles.cardArch} aria-hidden="true">
        {year ? <span className={styles.cardYear}>{year}</span> : <span className={styles.cardLetter} lang="pa">{gurmukhiInitial(article.title_pa)}</span>}
      </span>
      <span className={styles.cardBody}>
        {article.title_pa && <span className={styles.cardPa} lang="pa">{article.title_pa}</span>}
        <span className={styles.cardTitle}>{article.title}</span>
        <span className={styles.cardMeta}>
          {[article.date_label, showCategory ? article.category_label : article.subtitle].filter(Boolean).join(' · ')}
        </span>
        {!compact && article.summary && <span className={styles.cardSummary}>{article.summary}</span>}
        {!compact && article.read_minutes && <span className={styles.cardRead}>{article.read_minutes} min read</span>}
      </span>
    </Link>
  );
};

export default HistoryCard;
