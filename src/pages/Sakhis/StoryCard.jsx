/**
 * pages/Sakhis/StoryCard.jsx
 * -----------------------------------------------------------------------------
 * One sakhi or kahani as a card, and the arch that goes with it.
 *
 * The arch (StoryArch) shows the story's picture when it has one; otherwise
 * the first letter of its Gurmukhi title, the way a Punjabi alphabet chart
 * pairs ਕ with ਕੱਛੂਕੁੰਮਾ. Sakhis have the maroon arch used across the site,
 * kahaniyaan a golden one, so the two kinds are easy to tell apart.
 *
 * Used on the Sakhis & Kahaniyaan page (all stories, today's story) and under
 * a story ("Read next").
 * -----------------------------------------------------------------------------
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaHeadphones, FaPlay } from 'react-icons/fa';
import styles from './Sakhis.module.css';

// Words that don't name the story's subject, skipped when choosing the arch's letter
const COMMON_WORDS = new Set(['ਗੁਰੂ', 'ਸ੍ਰੀ', 'ਬਾਬਾ', 'ਭਾਈ', 'ਬੀਬੀ', 'ਮਾਤਾ', 'ਮਾਈ', 'ਭਗਤ', 'ਪੀਰ', 'ਸੰਤ', 'ਦਾ', 'ਦੀ', 'ਦੇ', 'ਜੀ']);

// A letter of the alphabet (vowel carriers, vowels, consonants, ਸ਼ ਖ਼ ਗ਼ ਜ਼ ੜ ਫ਼ ਲ਼), an optional nukta,
// and the vowel sign only when the letter is a vowel carrier (ੳ ਅ ੲ), so ੳ + ੁ still reads as ਉ
const LETTER = /^([ਅ-ਹਖ਼-ਫ਼ੲੳ])(਼?)([ਾ-ੌ]?)/;

/** The first letter of the most distinctive Gurmukhi word: ਭਾਈ ਮੰਝ ਜੀ -> ਮ, ਸ਼ੇਰ ਤੇ ਚੂਹਾ -> ਸ਼. */
export const storyLetter = (titlePa) => {
  const words = String(titlePa || '').split(/\s+/).filter(Boolean);
  const word = words.find((w) => !COMMON_WORDS.has(w)) || words[0] || '';
  const match = word.match(LETTER);
  if (!match) return '';
  const [, letter, nukta, sign] = match;
  return `${letter}${nukta}${/[ਅੲੳ]/.test(letter) ? sign : ''}`;
};

/** The arch: the story's picture, or its letter. size: 'card' | 'large' | 'small'. */
export const StoryArch = ({ story, size = 'card', className = '' }) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [story.image]);
  const letter = storyLetter(story.title_pa) || String(story.title || '').charAt(0);
  const kindClass = story.kind === 'kahani' ? styles.archKahani : styles.archSakhi;
  return (
    <span className={`${styles.arch} ${kindClass} ${styles[`arch_${size}`] || ''} ${className}`} aria-hidden="true">
      {story.image && !failed ? (
        <img src={story.image} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} />
      ) : (
        <span className={`${styles.archLetter} notranslate`} lang="pa" translate="no">{letter}</span>
      )}
    </span>
  );
};

/** A story card; the whole card links to the story. */
const StoryCard = ({ story, showCategory = false, compact = false }) => (
  <Link to={`/sakhis/${encodeURIComponent(story.slug)}`} className={`${styles.card} ${compact ? styles.cardCompact : ''}`}>
    <StoryArch story={story} size={compact ? 'small' : 'card'} />
    <span className={styles.cardBody}>
      {story.title_pa && <span className={`${styles.cardPa} notranslate`} lang="pa" translate="no">{story.title_pa}</span>}
      <span className={styles.cardTitle}>{story.title}</span>
      <span className={styles.cardMeta}>{[story.about, showCategory ? story.category_label : ''].filter(Boolean).join(', ')}</span>
      {!compact && story.summary && <span className={styles.cardSummary}>{story.summary}</span>}
      {!compact && (
        <span className={styles.cardFoot}>
          {story.read_minutes ? <span>{story.read_minutes} min read</span> : null}
          {story.has_audio && <span className={styles.cardMedia}><FaHeadphones aria-hidden="true" /> Listen</span>}
          {story.has_video && <span className={styles.cardMedia}><FaPlay aria-hidden="true" /> Video</span>}
        </span>
      )}
    </span>
  </Link>
);

export default StoryCard;
