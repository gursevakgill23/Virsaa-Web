/**
 * pages/Collections/AuthorDetail/AuthorDetail.jsx
 * -----------------------------------------------------------------------------
 * One author (/collections/authors/author/:id):
 *   - portrait, life dates, genre, rating, and the actions (components/DetailActions):
 *     View all works, then Like / Save for later / Share
 *   - tabs: Biography, Works (their ebooks), Awards, Reviews (components/Reviews:
 *     ratings and reviews saved on the server)
 *   - related authors (same genre first)
 * While loading, the Virsaa loader is shown; "not found" and "couldn't load"
 * (with Try again) are told apart.
 * -----------------------------------------------------------------------------
 */
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FaHeart, FaRegHeart, FaBookmark, FaRegBookmark, FaShareAlt, FaChevronLeft, FaChevronRight,
  FaStar, FaRegStar, FaPenFancy, FaBook, FaAward, FaQuoteLeft,
} from 'react-icons/fa';
import Loader from '../../../components/VirsaaLoader/Loader';
import Reviews from '../../../components/Reviews/Reviews';
import axios from 'axios';
import useLibraryItem from '../../../hooks/useLibraryItem';
import PageHero from '../../../components/PageHero/PageHero';
import Avatar from '../../../components/Avatar/Avatar';
import { CoverPicture } from '../../../components/SitePicture/SitePicture';
import { safeExternalUrl } from '../../../utils/safeUrl';
import styles from './AuthorDetail.module.css';
import DetailActions, { ActionButton } from '../../../components/DetailActions/DetailActions';

// Converts image paths for the production build (same helper used across pages)
const useProductionImagePath = () => {
  return (imagePath) => {
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
};

// The tabs under the author card
const TABS = [
  { id: 'biography', label: 'Biography' },
  { id: 'works', label: 'Major works' },
  { id: 'awards', label: 'Awards' },
  { id: 'reviews', label: 'Reviews' },
];

// Five stars, filled up to `value`
const Stars = ({ value }) => (
  <span className={styles.stars} aria-label={`${value} out of 5`}>
    {[1, 2, 3, 4, 5].map((i) =>
      i <= Math.floor(value) ? <FaStar key={i} className={styles.starOn} /> : <FaRegStar key={i} className={styles.starOff} />
    )}
  </span>
);

// Placeholder cards while related authors load
const RelatedAuthorSkeleton = () => (
  <div className={styles.relatedCard} aria-hidden="true">
    <span className={`${styles.relatedThumb} ${styles.relatedThumbRound} ${styles.skeleton}`} />
    <span className={styles.relatedInfo}>
      <span className={`${styles.skeleton} ${styles.skeletonLine}`} />
      <span className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineShort}`} />
    </span>
  </div>
);

// "1722-03-05" -> "5 March 1722"
// "1906-03-07" → a readable date; a year alone stays a year
const formatDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = String(iso).split('-').map(Number);
  if (!y) return iso;
  if (!m || !d) return String(y);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
};

// Awards are stored as text, one per line (or comma separated): "Sahitya Akademi Award 1956"
// Awards are stored as text, one per line ("Year - Award"); turn them into a list
const parseAwards = (text) => String(text || '')
  .split(/\n|,/)
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => {
    const match = line.match(/^(.*?)[\s(,-]*((?:1[5-9]|20)\d{2})\)?$/);
    return match && match[1] ? { name: match[1].trim(), year: match[2] } : { name: line, year: '' };
  });

const AuthorDetail = ({ isDarkMode, apiString }) => {
  const getImagePath = useProductionImagePath();
  const { id } = useParams();
  const relatedRef = useRef(null);
  // Author data and loading/error state
  const [author, setAuthor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const library = useLibraryItem(apiString, 'author', id);
  const { liked, saved } = library;
  const [loadError, setLoadError] = useState(null);
  const apiUrl = (apiString || process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
  const safeId = encodeURIComponent(id); // the id comes from the URL, so encode it before use in a path
  const [reloadKey, setReloadKey] = useState(0); // bumped by "Try again"
  // Open tab
  const [activeTab, setActiveTab] = useState('biography');
  const header_image_dark = '/images/header-image-dark.png';
  const header_image_light = '/images/header-image.png';
  // Authors without a photo show their initials (Avatar); books without a cover show the
  // website picture 'fallback-book' (CoverPicture)

  // Average rating and number of reviews, reported by the Reviews tab
  const [reviewSummary, setReviewSummary] = useState({ count: 0, average: null });

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setRelatedLoading(true);
    setLoadError(null);

    const asList = (data) => (Array.isArray(data) ? data : data?.results || []);

    const load = async () => {
      try {
        const { data } = await axios.get(`${apiUrl}/collections/authors/${safeId}/`, { timeout: 20000 });
        const booksRes = await axios.get(`${apiUrl}/collections/ebooks/`, {
          params: { author__name: data.name, page: 1, page_size: 60 }, timeout: 20000,
        })
          .catch(() => ({ data: [] }));
        if (cancelled) return;
        const books = asList(booksRes.data)
          .filter((b) => String(b.author) === String(data.id))
          .map((b) => ({ id: b.id, title: b.title, cover: b.cover_image || '', rating: Number(b.rating) || 0, pages: b.pages }));
        setAuthor({
          id: data.id,
          name: data.name,
          image: data.image || '',
          // Photos from Wikimedia Commons carry the credit their licence asks for
          imageCredit: data.image_credit?.text || '',
          imageSource: safeExternalUrl(data.image_credit?.source_url),
          rating: Number(data.rating) || 0,
          born: formatDate(data.born),
          died: formatDate(data.died),
          bornYear: data.born ? String(data.born).slice(0, 4) : '',
          diedYear: data.died ? String(data.died).slice(0, 4) : '',
          genre: data.genre || 'Author',
          notableWorks: String(data.notable_works || '').split(/\n|,/).map((w) => w.trim()).filter(Boolean),
          biography: data.biography || `${data.name} is one of the authors in the Virsaa library.`,
          books,
          awards: parseAwards(data.awards),
        });

        const all = await axios.get(`${apiUrl}/collections/authors/`, { timeout: 20000 }).catch(() => ({ data: [] }));
        if (cancelled) return;
        const others = asList(all.data).filter((a) => String(a.id) !== String(data.id));
        const sameGenre = others.filter((a) => data.genre && a.genre === data.genre);
        setAuthor((prev) => prev && ({
          ...prev,
          relatedAuthors: [...sameGenre, ...others.filter((a) => !sameGenre.includes(a))].slice(0, 8)
            .map((a) => ({ id: a.id, name: a.name, image: a.image || '', genre: a.genre })),
        }));
      } catch (err) {
        if (!cancelled) setLoadError(err.response?.status === 404 ? 'This author could not be found.' : 'This author couldn’t be loaded right now.');
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setRelatedLoading(false);
        }
      }
    };

    load();
    return () => { cancelled = true; };
  }, [id, safeId, apiUrl, reloadKey]);

  // Share sheet on phones, otherwise copy the link
  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: author?.name, url });
      else await navigator.clipboard.writeText(url);
    } catch {
      // share sheet dismissed
    }
  };

  // Scroll the related-authors row
  const scrollRelated = (direction) => {
    relatedRef.current?.scrollBy({ left: direction === 'left' ? -300 : 300, behavior: 'smooth' });
  };

  // "See all works": open the Works tab and scroll to it
  const openWorks = () => {
    setActiveTab('works');
    document.getElementById('author-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ---------------------------------------------------------------- render
  if (isLoading) {
    return <div className={styles.page}><Loader /></div>;
  }

  if (loadError || !author) {
    return (
      <div className={styles.page}>
        <div className={styles.layout}>
          <p>
            {loadError || 'This author could not be found.'}{' '}
            {loadError && loadError !== 'This author could not be found.' && (
              <><button type="button" className={styles.linkButton} onClick={() => setReloadKey((k) => k + 1)}>Try again</button> or </>
            )}
            <Link to="/collections/authors">Browse authors</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <PageHero
        compact
        image={getImagePath(isDarkMode ? header_image_dark : header_image_light)}
        title={author.name}
        subtitle={[author.genre, [author.bornYear, author.diedYear].filter(Boolean).join('–')].filter(Boolean).join(', ')}
        crumbs={[
          { label: 'Home', to: '/' },
          { label: 'Authors', to: '/collections/authors' },
          { label: author.name },
        ]}
      />

      <div className={styles.layout}>
        <div className={styles.main}>
          {/* ---------- Author card ---------- */}
          <section className={styles.productCard} aria-label="About the author">
            <div className={styles.portraitStage}>
              <div className={styles.portrait}>
                <Avatar src={author.image} name={author.name} alt={author.name} className={styles.portraitImg} />
                <div className={styles.portraitRating}>
                  <Stars value={reviewSummary.average ?? author.rating} />
                  <span>{(reviewSummary.average ?? author.rating).toFixed(1)} · {reviewSummary.count} {reviewSummary.count === 1 ? 'review' : 'reviews'}</span>
                </div>
              </div>
              {author.image && author.imageCredit && (
                <p className={styles.photoCredit}>
                  Photo: {author.imageSource
                    ? <a href={author.imageSource} target="_blank" rel="noopener noreferrer">{author.imageCredit}</a>
                    : author.imageCredit}
                </p>
              )}
            </div>

            <div className={styles.info}>
              <div className={styles.chipRow}>
                <span className={styles.chip}><FaPenFancy aria-hidden="true" /> {author.genre}</span>
              </div>
              <h2 className={styles.title}>{author.name}</h2>

              {(author.born || author.died) && (
                <dl className={styles.lifeDates}>
                  {author.born && (
                    <div className={styles.lifeItem}>
                      <dt>Born</dt>
                      <dd>{author.born}</dd>
                    </div>
                  )}
                  {author.died && (
                    <div className={styles.lifeItem}>
                      <dt>Died</dt>
                      <dd>{author.died}</dd>
                    </div>
                  )}
                </dl>
              )}

              <div className={styles.metaRow}>
                <span className={styles.metaPill}><FaBook aria-hidden="true" /> {author.books.length} {author.books.length === 1 ? 'book' : 'books'} on Virsaa</span>
                {author.awards.length > 0 && (
                  <span className={styles.metaPill}><FaAward aria-hidden="true" /> {author.awards.length} awards</span>
                )}
              </div>

              <DetailActions
                quick={[
                  { key: 'like', label: 'Like', icon: <FaRegHeart />, onIcon: <FaHeart />, on: liked,
                    onClick: library.toggleLike, busy: library.busy === 'like' },
                  { key: 'save', label: 'Save', icon: <FaRegBookmark />, onIcon: <FaBookmark />, on: saved,
                    onClick: library.toggleSave, busy: library.busy === 'save' },
                  { key: 'share', label: 'Share', icon: <FaShareAlt />, onClick: handleShare, pressable: false },
                ]}
              >
                <ActionButton icon={<FaBook aria-hidden="true" />} onClick={openWorks}>View all works</ActionButton>
              </DetailActions>
            </div>
          </section>

          {/* ---------- Tabs ---------- */}
          <section className={styles.section} id="author-tabs">
            <div className={styles.tabs} role="tablist" aria-label="Author information">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-selected={activeTab === tab.id}
                  aria-controls={`panel-${tab.id}`}
                  className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                  {tab.id === 'reviews' && <span className={styles.tabCount}>{reviewSummary.count}</span>}
                </button>
              ))}
            </div>

            <div
              className={`${styles.tabPanel} ${styles.glass}`}
              role="tabpanel"
              id={`panel-${activeTab}`}
              aria-labelledby={`tab-${activeTab}`}
            >
              {activeTab === 'biography' && (
                <>
                  <h3 className={styles.sectionTitle}>About {author.name}</h3>
                  <div className={styles.bio}>
                    {author.biography.split('\n').filter((p) => p.trim()).map((paragraph, i) => (
                      <p key={i}>{paragraph.trim()}</p>
                    ))}
                  </div>
                </>
              )}

              {activeTab === 'works' && (
                <>
                  <h3 className={styles.sectionTitle}>Major works</h3>
                  {author.books.length === 0 && (
                    <p>{author.notableWorks.length ? `Known for ${author.notableWorks.join(', ')}. ` : ''}No books by {author.name} on Virsaa yet.</p>
                  )}
                  <div className={styles.worksGrid}>
                    {author.books.map((book) => (
                      <Link key={book.id} to={`/collections/ebooks/ebook/${book.id}`} className={styles.workCard}>
                        <span className={styles.workCover}>
                          <CoverPicture src={book.cover} alt="" className={styles.workImage} />
                        </span>
                        <span className={styles.workTitle}>{book.title}</span>
                        <span className={styles.workMeta}>
                          <span><FaStar className={styles.starOn} aria-hidden="true" /> {book.rating}</span>
                          {book.pages ? <span>{book.pages} pages</span> : null}
                        </span>
                      </Link>
                    ))}
                  </div>
                </>
              )}

              {activeTab === 'awards' && (
                <>
                  <h3 className={styles.sectionTitle}>Awards and honours</h3>
                  {author.awards.length === 0 && <p>No awards listed yet.</p>}
                  <ul className={styles.awardList}>
                    {author.awards.map((award) => (
                      <li key={award.name} className={styles.award}>
                        <span className={styles.awardIcon} aria-hidden="true"><FaAward /></span>
                        <span>
                          <span className={styles.awardName}>{award.name}</span>
                          <span className={styles.awardYear}>{award.year}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {/* Always mounted (just hidden), so the review count in the header is known from the start */}
              <div hidden={activeTab !== 'reviews'}>
                <Reviews apiString={apiString} type="author" id={id} itemTitle={author.name} onSummary={setReviewSummary} />
              </div>
            </div>
          </section>
        </div>

        <aside className={styles.aside}>
          <section className={`${styles.asideBlock} ${styles.glass}`}>
            <div className={styles.asideHead}>
              <h3 className={styles.asideTitle}>Similar authors</h3>
              <div className={styles.scrollButtons}>
                <button type="button" onClick={() => scrollRelated('left')} className={styles.scrollButton} aria-label="Scroll left">
                  <FaChevronLeft />
                </button>
                <button type="button" onClick={() => scrollRelated('right')} className={styles.scrollButton} aria-label="Scroll right">
                  <FaChevronRight />
                </button>
              </div>
            </div>
            <div className={styles.relatedList} ref={relatedRef}>
              {relatedLoading
                ? Array.from({ length: 4 }).map((_, i) => <RelatedAuthorSkeleton key={i} />)
                : (author.relatedAuthors || []).map((related) => (
                    <Link key={related.id} to={`/collections/authors/author/${related.id}`} className={styles.relatedCard}>
                      <Avatar src={related.image} name={related.name} className={`${styles.relatedThumb} ${styles.relatedThumbRound}`} loading="lazy" />
                      <span className={styles.relatedInfo}>
                        <span className={styles.relatedTitle}>{related.name}</span>
                        <span className={styles.relatedMeta}>{related.genre}</span>
                      </span>
                    </Link>
                  ))}
            </div>
          </section>

          {author.notableWorks.length > 0 && (
            <figure className={styles.quoteCard}>
              <FaQuoteLeft className={styles.quoteMark} aria-hidden="true" />
              <blockquote className={styles.quoteText}>
                {author.notableWorks.slice(0, 3).join(', ')}
              </blockquote>
              <figcaption className={styles.quoteSource}>Best-known works of {author.name}</figcaption>
            </figure>
          )}
        </aside>
      </div>
    </div>
  );
};

export default AuthorDetail;
