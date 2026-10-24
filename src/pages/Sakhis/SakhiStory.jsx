/**
 * pages/Sakhis/SakhiStory.jsx
 * -----------------------------------------------------------------------------
 * One sakhi or kahani (/sakhis/:slug), loaded from /api/sikhism/sakhis/<slug>/:
 *   - the Gurmukhi title with its arch, who it is about and the reading time
 *   - English / ਪੰਜਾਬੀ, when the story has a Punjabi version (the choice is
 *     remembered on this device; Punjabi is chosen first when the site is in
 *     Punjabi)
 *   - "Read aloud" with the device's own voice, highlighting each paragraph
 *     as it is read (shown only when the device has a voice for the language)
 *   - the recording and the video, when the story has them
 *   - ਸਿੱਖਿਆ, what the story teaches, and where it comes from
 *   - the next story of the same kind, and three more after it
 * While loading, the Virsaa loader is shown; an unknown slug shows a clear
 * "not found" message with a way back.
 * -----------------------------------------------------------------------------
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaArrowLeft, FaExternalLinkAlt, FaRedo, FaStop, FaVolumeUp } from 'react-icons/fa';
import PageHero from '../../components/PageHero/PageHero';
import Loader from '../../components/VirsaaLoader/Loader';
import { useAuth } from '../../context/AuthContext';
import { sakhiApi } from '../../api/sikhismApi';
import { getLanguage } from '../../i18n/siteLanguage';
import { describeApiError } from '../../utils/apiError';
import StoryCard, { StoryArch } from './StoryCard';
import useReadAloud from './useReadAloud';
import styles from './Sakhis.module.css';

const header_image_light = '/images/header-image.png';
const header_image_dark = '/images/header-image-dark.png';

// The reader's last choice of English or Punjabi, kept on this device
const LANG_KEY = 'virsaa:story-language';
const firstLanguage = () => {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'en' || saved === 'pa') return saved;
  } catch { /* storage blocked */ }
  return getLanguage() === 'pa' ? 'pa' : 'en';
};
const rememberLanguage = (lang) => {
  try { localStorage.setItem(LANG_KEY, lang); } catch { /* storage blocked: the choice lasts until the page closes */ }
};

const KIND_WORDS = {
  sakhi: { back: 'All sakhis', more: 'More sakhis', next: 'Next sakhi', link: '/sakhis' },
  kahani: { back: 'All kahaniyaan', more: 'More kahaniyaan', next: 'Next kahani', link: '/sakhis?kind=kahani' },
};

const prefersLessMotion = () => typeof window !== 'undefined' && window.matchMedia
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const SakhiStory = ({ isDarkMode, apiString }) => {
  const { slug } = useParams();
  const { accessToken } = useAuth();
  const apiUrl = (apiString || process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
  const [story, setStory] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | missing | error
  const [error, setError] = useState('');
  const [others, setOthers] = useState([]); // stories of the same kind, in order
  const [lang, setLang] = useState(firstLanguage);
  const paragraphRefs = useRef([]);
  // Read when loading (staff see unpublished stories); a renewed token doesn't reload the story
  const tokenRef = useRef(accessToken);
  tokenRef.current = accessToken;

  // ---------------------------------------------------------------- loading
  const load = useCallback(async () => {
    setStatus('loading');
    setError('');
    try {
      const data = await sakhiApi.story(apiUrl, slug, tokenRef.current);
      if (!data) throw new Error('Unexpected answer');
      setStory(data);
      setStatus('ready');
    } catch (err) {
      if (err?.response?.status === 404) {
        setStatus('missing');
        return;
      }
      setError(describeApiError(err, 'This story couldn’t be loaded. Check your connection and try again.'));
      setStatus('error');
    }
  }, [apiUrl, slug]);

  useEffect(() => {
    load();
    window.scrollTo({ top: 0 });
  }, [load]);

  // "Next" and "More": an extra, so a failure just leaves them out
  const kind = story?.kind === 'kahani' ? 'kahani' : 'sakhi';
  useEffect(() => {
    if (status !== 'ready') return undefined;
    let alive = true;
    sakhiApi.list(apiUrl)
      .then((data) => { if (alive) setOthers(data.results.filter((s) => (s.kind || 'sakhi') === kind)); })
      .catch(() => {});
    return () => { alive = false; };
  }, [apiUrl, status, kind]);

  // ---------------------------------------------------------------- language and reading
  const hasPunjabi = Boolean(story?.story_pa?.length);
  const showPunjabi = lang === 'pa' && hasPunjabi;
  const paragraphs = useMemo(() => {
    if (!story) return [];
    return showPunjabi ? story.story_pa : story.story;
  }, [story, showPunjabi]);
  const reader = useReadAloud(paragraphs, showPunjabi ? 'pa' : 'en');
  const readingAt = reader.current; // the paragraph being read, or -1

  const chooseLanguage = (next) => {
    setLang(next);
    rememberLanguage(next);
  };

  // Keep the paragraph being read in view
  useEffect(() => {
    const el = paragraphRefs.current[readingAt];
    if (!el) return;
    const box = el.getBoundingClientRect();
    if (box.top < 90 || box.bottom > window.innerHeight - 24) {
      el.scrollIntoView({ block: 'center', behavior: prefersLessMotion() ? 'auto' : 'smooth' });
    }
  }, [readingAt]);

  const headerImage = isDarkMode ? header_image_dark : header_image_light;
  const crumbs = [{ label: 'Home', to: '/' }, { label: 'Sakhis & Kahaniyaan', to: '/sakhis' }];

  if (status === 'loading') return <Loader variant="wait" />;

  if (status !== 'ready') {
    return (
      <div className={styles.page}>
        <PageHero image={headerImage} title="Sakhis & Kahaniyaan" compact crumbs={[crumbs[0], { label: 'Sakhis & Kahaniyaan' }]} />
        <section className={styles.section}>
          <div className={styles.problem} role={status === 'error' ? 'alert' : undefined}>
            <p>{status === 'missing' ? 'We couldn’t find that story. It may have been renamed.' : error}</p>
            <div className={styles.problemActions}>
              {status === 'error' && (
                <button type="button" className={styles.secondaryButton} onClick={load}>
                  <FaRedo aria-hidden="true" /> Try again
                </button>
              )}
              <Link to="/sakhis" className={styles.primaryButton}>
                <FaArrowLeft aria-hidden="true" /> All sakhis and kahaniyaan
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const words = KIND_WORDS[kind];
  const lesson = (showPunjabi ? story.lesson_pa || story.lesson : story.lesson || story.lesson_pa) || '';
  const lessonIsPunjabi = showPunjabi ? Boolean(story.lesson_pa) : !story.lesson && Boolean(story.lesson_pa);

  // The next story of the same kind (going round to the first), then three more
  const at = others.findIndex((s) => s.slug === story.slug);
  const after = others.length > 1
    ? [...others.slice(at + 1), ...others.slice(0, Math.max(at, 0))].filter((s) => s.slug !== story.slug)
    : [];
  const next = after[0];
  const more = after.slice(1, 4);

  return (
    <div className={styles.page}>
      <PageHero
        image={headerImage}
        title={story.title}
        subtitle={story.about}
        compact
        crumbs={[...crumbs, { label: story.title }]}
      />

      <article className={styles.story}>
        <header className={styles.storyHead}>
          <StoryArch story={story} size="large" className={styles.storyArch} />
          {story.title_pa && <p className={`${styles.storyPaTitle} notranslate`} lang="pa" translate="no">{story.title_pa}</p>}
          <p className={styles.storyMeta}>
            {[story.category_label, story.read_minutes ? `${story.read_minutes} min read` : ''].filter(Boolean).join(', ')}
          </p>
          <p className={styles.storySummary}>{story.summary}</p>
        </header>

        {/* English / ਪੰਜਾਬੀ and read aloud */}
        {(hasPunjabi || reader.available) && (
          <div className={styles.tools}>
            {hasPunjabi && (
              <div className={styles.langSwitch} role="group" aria-label="Language of the story">
                <button type="button" aria-pressed={!showPunjabi} className={!showPunjabi ? styles.langOn : ''}
                  onClick={() => chooseLanguage('en')}>
                  English
                </button>
                <button type="button" aria-pressed={showPunjabi} className={`${showPunjabi ? styles.langOn : ''} notranslate`}
                  lang="pa" translate="no" onClick={() => chooseLanguage('pa')}>
                  ਪੰਜਾਬੀ
                </button>
              </div>
            )}
            {reader.available && (
              <button
                type="button"
                className={`${styles.readAloud} ${reader.speaking ? styles.readAloudOn : ''}`}
                onClick={() => (reader.speaking ? reader.stop() : reader.start(0))}
              >
                {reader.speaking ? <FaStop aria-hidden="true" /> : <FaVolumeUp aria-hidden="true" />}
                {reader.speaking ? 'Stop reading' : 'Read aloud'}
              </button>
            )}
          </div>
        )}

        {/* A recording or a video of the story */}
        {story.audioUrl && (
          <div className={styles.recording}>
            <p className={styles.recordingLabel}>Listen to the story</p>
            <audio controls preload="none" src={story.audioUrl}>
              Your browser can’t play this recording.
            </audio>
          </div>
        )}
        {story.youtubeId && (
          <div className={styles.video}>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(story.youtubeId)}?rel=0&modestbranding=1`}
              title={`${story.title} (video)`}
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              loading="lazy"
            />
          </div>
        )}

        <div
          className={`${styles.storyText} ${showPunjabi ? `${styles.storyTextPa} notranslate` : ''}`}
          lang={showPunjabi ? 'pa' : 'en'}
          translate={showPunjabi ? 'no' : undefined}
        >
          {paragraphs.map((p, i) => (
            <p
              key={`${showPunjabi ? 'pa' : 'en'}-${i}`}
              ref={(el) => { paragraphRefs.current[i] = el; }}
              className={readingAt === i ? styles.reading : undefined}
            >
              {p}
            </p>
          ))}
        </div>

        {lesson && (
          <aside className={styles.lesson} aria-labelledby="lesson-title">
            <h2 id="lesson-title" className={styles.lessonTitle}>
              <span className="notranslate" lang="pa" translate="no">ਸਿੱਖਿਆ</span>
              {!showPunjabi && <span className={styles.lessonTitleEn}>What it teaches</span>}
            </h2>
            <p
              className={lessonIsPunjabi ? `${styles.lessonPa} notranslate` : undefined}
              lang={lessonIsPunjabi ? 'pa' : 'en'}
              translate={lessonIsPunjabi ? 'no' : undefined}
            >
              {lesson}
            </p>
          </aside>
        )}

        {story.source && (
          <p className={styles.source}>
            <span>Source: </span>
            {story.sourceUrl ? (
              <a href={story.sourceUrl} target="_blank" rel="noopener noreferrer">
                {story.source} <FaExternalLinkAlt aria-hidden="true" />
              </a>
            ) : story.source}
          </p>
        )}

        {next && (
          <Link to={`/sakhis/${encodeURIComponent(next.slug)}`} className={styles.next}>
            <StoryArch story={next} size="small" />
            <span className={styles.nextText}>
              <span className={styles.nextLabel}>{words.next}</span>
              {next.title_pa && <span className={`${styles.nextPa} notranslate`} lang="pa" translate="no">{next.title_pa}</span>}
              <span className={styles.nextTitle}>{next.title}</span>
            </span>
          </Link>
        )}

        <Link to={words.link} className={styles.backLink}>
          <FaArrowLeft aria-hidden="true" /> {words.back}
        </Link>
      </article>

      {more.length > 0 && (
        <section className={styles.section} aria-labelledby="more-title">
          <h2 id="more-title" className={styles.sectionTitle}>{words.more}</h2>
          <ul className={`${styles.cards} ${styles.cardsCompact}`}>
            {more.map((s) => (
              <li key={s.slug}><StoryCard story={s} compact /></li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default SakhiStory;
