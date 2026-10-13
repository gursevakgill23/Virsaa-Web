/**
 * pages/Collections/EbookDetail/EbookDetail.jsx
 * -----------------------------------------------------------------------------
 * One ebook (/collections/ebooks/ebook/:id):
 *   - cover, details, Read now (opens the flip-book reader full screen),
 *     Like / Save for later / Download (useLibraryItem), Share
 *   - chapters, description, reviews (signed-in users can post one)
 *   - related and recommended books
 * Reading progress is saved to History while reading, when the reader closes
 * and when the page is left. While loading, the Virsaa loader is shown;
 * "not found" and "couldn't load" (with Try again) are told apart.
 * -----------------------------------------------------------------------------
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FaBookmark, FaRegBookmark, FaShareAlt, FaChevronLeft, FaChevronRight, FaStar, FaRegStar,
  FaSort, FaHeart, FaRegHeart, FaBookOpen, FaFilePdf, FaChevronDown, FaDownload,
} from 'react-icons/fa';
import { toast } from '../../../utils/notify';
import styles from './EbookDetail.module.css';
import PageHero from '../../../components/PageHero/PageHero';
import Loader from '../../../components/VirsaaLoader/Loader';
import { useAuth } from '../../../context/AuthContext.jsx';
import axios from 'axios';
import BookReader from '../../../components/BookReader/BookReader';
import useLibraryItem from '../../../hooks/useLibraryItem';
import useHistoryRecorder from '../../../hooks/useHistoryRecorder';

const DEFAULT_IMAGE_PATH = '/images/Collections/book-image.jpg';

// Fisher-Yates shuffle
// Random order for the recommendations
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Public/static images
// Converts image paths for the production build (same helper used across pages)
const getProductionImagePath = (imagePath) => {
  if (!imagePath || typeof imagePath !== 'string') return DEFAULT_IMAGE_PATH;
  if (process.env.NODE_ENV === 'production' && !(imagePath.startsWith('/') || /^(https?:|blob:|data:)/i.test(imagePath)) && !imagePath.startsWith('http')) {
    return `/images/Collections/${imagePath.split('/').pop()}`;
  }
  return imagePath;
};

// onError handler: switch a broken cover to the default one (once)
const handleImgError = (e) => {
  if (e.currentTarget.dataset.fallback) return;
  e.currentTarget.dataset.fallback = '1';
  e.currentTarget.src = DEFAULT_IMAGE_PATH;
};

// Five stars, filled up to `value`
const Stars = ({ value }) => (
  <span className={styles.stars} aria-label={`${value} out of 5`}>
    {[1, 2, 3, 4, 5].map((i) =>
      i <= Math.round(value) ? <FaStar key={i} className={styles.starOn} /> : <FaRegStar key={i} className={styles.starOff} />
    )}
  </span>
);

// Placeholder cards while related books load
const RelatedSkeleton = () => (
  <div className={styles.relatedCard} aria-hidden="true">
    <span className={`${styles.relatedThumb} ${styles.skeleton}`} />
    <span className={styles.relatedInfo}>
      <span className={`${styles.skeleton} ${styles.skeletonLine}`} />
      <span className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineShort}`} />
    </span>
  </div>
);

// Lists may come back plain or paginated ({ results: [...] })
const toList = (data) => (Array.isArray(data) ? data : data?.results || []);

// Review length limits
const REVIEW_MIN = 10;
const REVIEW_MAX = 2000;

// A clear message for a failed review: signed out, the server's own reason, or a general one
const reviewErrorMessage = (error) => {
  const status = error.response?.status;
  const d = error.response?.data || {};
  if (status === 401) return 'Your session has ended. Log in again to post your review.';
  const first = (v) => (Array.isArray(v) ? v[0] : v);
  const serverReason = first(d.review) || first(d.rating) || first(d.non_field_errors) || d.detail || d.error;
  if (status >= 400 && status < 500 && typeof serverReason === 'string') return serverReason;
  return 'Your review couldn’t be posted. Try again.';
};

const EbookDetail = ({ isDarkMode, apiString }) => {
  const { isLoggedIn, accessToken, userData } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const library = useLibraryItem(apiString, 'ebook', id);
  const recordHistory = useHistoryRecorder(apiString);
  const readingRef = useRef(null); // last page reached, saved to History when the reader closes
  const { liked, saved } = library;
  const relatedRef = useRef(null);
  const recommendedRef = useRef(null);

  // Book data, loading flags, chapter/description toggles and the reader's state
  const [ebook, setEbook] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [related, setRelated] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [expandedChapter, setExpandedChapter] = useState(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(null);

  // Review form and list
  const [reviewForm, setReviewForm] = useState({ rating: 0, review: '' });
  const [reviews, setReviews] = useState([]);
  const [visibleReviews, setVisibleReviews] = useState(5);
  const [sortBy, setSortBy] = useState('newest');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState(''); // message under the review form
  const [loadFailed, setLoadFailed] = useState(false); // true = network/server problem (not "not found")
  const [reloadKey, setReloadKey] = useState(0); // bumped by "Try again"

  const apiUrl = (apiString || process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
  const safeId = encodeURIComponent(id); // the id comes from the URL, so encode it before use in a path
  const headerImage = getProductionImagePath(isDarkMode ? '/images/header-image-dark.png' : '/images/header-image.png');

  // Ebook, its author and reviews. These endpoints are public, so no token is sent
  // (an expired token would make them fail with 401).
  useEffect(() => {
    let cancelled = false;
    const fetchEbook = async () => {
      setIsLoading(true);
      setRelatedLoading(true);
      setExpandedChapter(null);
      setShowFullDescription(false);
      setLoadFailed(false);
      try {
        const { data } = await axios.get(`${apiUrl}/collections/ebooks/${safeId}/`, { timeout: 20000 });
        if (cancelled) return;

        let authorName = 'Unknown author';
        if (data.author) {
          try {
            const authorRes = await axios.get(`${apiUrl}/collections/authors/${encodeURIComponent(data.author)}/`, { timeout: 20000 });
            authorName = authorRes.data?.name || authorName;
          } catch {
            // keep the fallback name
          }
        }
        if (cancelled) return;

        setEbook({
          ...data,
          authorId: data.author,
          authorName,
          cover: data.detail_image || data.cover_image,
          chapters: Array.isArray(data.chapters) ? [...data.chapters].sort((a, b) => a.order - b.order) : [],
        });
        setIsLoading(false);

        const reviewsRes = await axios.get(`${apiUrl}/collections/ebooks/${safeId}/reviews/`, { timeout: 20000 }).catch(() => ({ data: [] }));
        if (cancelled) return;
        setReviews(toList(reviewsRes.data).map((review) => ({
          id: review.id,
          name: review.user || 'Anonymous',
          date: review.date ? new Date(review.date).toLocaleDateString() : '',
          rating: review.rating || 0,
          review: review.review || '',
          helpful: review.helpful || 0,
        })));

        // Related: same author first, then other books
        const allRes = await axios.get(`${apiUrl}/collections/ebooks/`, { timeout: 20000 }).catch(() => ({ data: [] }));
        if (cancelled) return;
        const others = toList(allRes.data).filter((item) => item.id !== Number(id));
        const sameAuthor = others.filter((item) => data.author && item.author === data.author);
        const rest = shuffleArray(others.filter((item) => !sameAuthor.includes(item)));
        const toCard = (item) => ({ id: item.id, title: item.title, cover: item.cover_image });
        const relatedList = [...sameAuthor, ...rest].slice(0, 5);
        setRelated(relatedList.map(toCard));
        setRecommended(rest.filter((item) => !relatedList.includes(item)).slice(0, 5).map(toCard));
      } catch (error) {
        console.error('Error fetching ebook:', error.response?.status || error.message);
        if (!cancelled) {
          setEbook(null);
          setLoadFailed(error.response?.status !== 404); // 404 = really not found
          setIsLoading(false);
        }
      } finally {
        if (!cancelled) setRelatedLoading(false);
      }
    };
    fetchEbook();
    return () => { cancelled = true; };
  }, [id, safeId, apiUrl, reloadKey]);

  // PDFs are private on S3; read_pdf returns a temporary link.
  // The reader opens straight away (full screen, from the click) and shows
  // "Opening the book…" until the link and the file arrive.
  const fetchPdfLink = async () => {
    setPdfLoading(true);
    setPdfError(null);
    setPdfUrl(null);
    try {
      const response = await axios.get(`${apiUrl}/collections/ebooks/${safeId}/read_pdf/`, { timeout: 20000 });
      if (!response.data?.pdf_url) throw new Error('No PDF link returned');
      setPdfUrl(response.data.pdf_url);
    } catch (error) {
      console.error('Error fetching PDF link:', error.response?.status || error.message);
      setPdfError(error.response?.status === 404 ? 'This book has no file yet.' : 'The book couldn’t be opened right now.');
    } finally {
      setPdfLoading(false);
    }
  };

  // Read now: open the reader (full screen) and record the visit
  const handleReadNow = () => {
    // Must run inside the click, or the browser refuses full screen
    if (document.fullscreenEnabled && !document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }
    setShowPdfModal(true);
    fetchPdfLink(); // links expire after an hour, so get a fresh one each time
    if (ebook) recordHistory(historyEntry());
  };

  // What gets saved to History for this book
  const historyEntry = (extra = {}) => ({
    type: 'ebook',
    item_id: id,
    title: ebook?.title,
    path: `/collections/ebooks/ebook/${id}`,
    image: ebook?.cover,
    ...extra,
  });

  // Called by the reader on each page turn (throttled inside the recorder)
  const handleReaderProgress = (page, numPages) => {
    const progress = numPages ? (page / numPages) * 100 : 0;
    readingRef.current = { progress, position: page };
    recordHistory(historyEntry(readingRef.current), { progressOnly: true });
  };

  // Save the last page if the reader is left open and the user leaves the page
  const flushRef = useRef(null);
  flushRef.current = () => {
    if (readingRef.current) recordHistory(historyEntry(readingRef.current), { progressOnly: true, force: true });
  };
  useEffect(() => {
    const onHide = () => flushRef.current?.();
    window.addEventListener('pagehide', onHide);
    return () => { window.removeEventListener('pagehide', onHide); onHide(); readingRef.current = null; };
  }, [id]);

  // Close the reader and save the last page straight away
  const closeReader = () => {
    setShowPdfModal(false);
    if (readingRef.current) recordHistory(historyEntry(readingRef.current), { progressOnly: true, force: true });
  };


  // Share sheet on phones, otherwise copy the link
  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: ebook.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied', { position: 'top-right', autoClose: 2000 });
      }
    } catch {
      // share sheet dismissed
    }
  };

  const toggleChapter = (chapterId) => {
    setExpandedChapter(expandedChapter === chapterId ? null : chapterId);
  };

  const handleReadChapter = () => {
    handleReadNow();
  };

  const scrollRow = (ref, direction) => {
    ref.current?.scrollBy({ left: direction === 'left' ? -300 : 300, behavior: 'smooth' });
  };

  const handleRatingChange = (rating) => setReviewForm({ ...reviewForm, rating });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setReviewForm({ ...reviewForm, [name]: value });
    if (reviewError) setReviewError('');
  };

  // Post a review (signed-in only). Problems are shown under the form and as an alert.
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.warn('Sign in to write a review.', { position: 'top-right', autoClose: 3000 });
      navigate('/login');
      return;
    }
    // Check the form before sending
    const text = reviewForm.review.trim();
    if (!reviewForm.rating) { setReviewError('Choose a star rating.'); return; }
    if (text.length < REVIEW_MIN) { setReviewError(`Write at least ${REVIEW_MIN} characters.`); return; }
    setReviewError('');
    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `${apiUrl}/collections/reviews/`,
        { ebook_id: id, rating: reviewForm.rating, review: text },
        { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, timeout: 20000 }
      );
      const userFullName = userData?.first_name && userData?.last_name
        ? `${userData.first_name} ${userData.last_name}`
        : userData?.username || 'Anonymous';
      setReviews([
        {
          id: response.data.id,
          name: userFullName,
          date: new Date(response.data.date).toLocaleDateString(),
          rating: response.data.rating,
          review: response.data.review,
          helpful: response.data.helpful || 0,
        },
        ...reviews,
      ]);
      setReviewForm({ rating: 0, review: '' });
      toast.success('Review posted. Thank you!', { position: 'top-right', autoClose: 3000 });
    } catch (error) {
      console.error('Error submitting review:', error.response?.status || error.message);
      const message = reviewErrorMessage(error);
      setReviewError(message);
      toast.error(message, { position: 'top-right', autoClose: 3000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  // "Helpful" counter (on this page only)
  const toggleHelpful = (reviewId) => {
    setReviews(reviews.map((r) => (r.id === reviewId ? { ...r, helpful: r.helpful + 1 } : r)));
  };

  // Reviews in the chosen order, a few at a time
  const sortedReviews = useMemo(
    () => [...reviews].sort((a, b) => (sortBy === 'newest' ? b.id - a.id : b.helpful - a.helpful)),
    [reviews, sortBy]
  );
  const displayedReviews = sortedReviews.slice(0, visibleReviews);

  // ---------------------------------------------------------------- render
  if (isLoading) {
    return (
      <div className={styles.page}>
        <Loader />
      </div>
    );
  }

  if (!ebook) {
    return (
      <div className={styles.page}>
        <div className={`${styles.stateBox} ${styles.glass}`}>
          {loadFailed ? (
            <>
              <h2>This book couldn’t be loaded</h2>
              <p>Check your connection and try again.</p>
              <button type="button" className={styles.primaryButton} onClick={() => setReloadKey((k) => k + 1)}>Try again</button>
            </>
          ) : (
            <>
              <h2>This book couldn’t be found</h2>
              <p>It may have been removed, or the link is wrong.</p>
              <Link to="/collections/ebooks" className={styles.primaryButton}>Browse all ebooks</Link>
            </>
          )}
        </div>
      </div>
    );
  }

  const description = ebook.description || '';
  const isLong = description.length > 420;
  const shownDescription = showFullDescription || !isLong ? description : `${description.slice(0, 420).trim()}…`;
  const shortDescription = description.split(' ').slice(0, 12).join(' ') + (description.split(' ').length > 12 ? '…' : '');

  // A scrolling row of related books
  const renderRelated = (items, ref, label) => (
    <section className={`${styles.asideBlock} ${styles.glass}`}>
      <div className={styles.asideHead}>
        <h3 className={styles.asideTitle}>{label}</h3>
        <div className={styles.scrollButtons}>
          <button type="button" onClick={() => scrollRow(ref, 'left')} className={styles.scrollButton} aria-label={`Scroll ${label} left`}>
            <FaChevronLeft />
          </button>
          <button type="button" onClick={() => scrollRow(ref, 'right')} className={styles.scrollButton} aria-label={`Scroll ${label} right`}>
            <FaChevronRight />
          </button>
        </div>
      </div>
      <div className={styles.relatedList} ref={ref}>
        {relatedLoading && Array.from({ length: 4 }).map((_, i) => <RelatedSkeleton key={i} />)}
        {!relatedLoading && items.length === 0 && <p className={styles.relatedMeta}>No other books to show yet.</p>}
        {!relatedLoading && items.map((book) => (
          <Link key={book.id} to={`/collections/ebooks/ebook/${book.id}`} className={styles.relatedCard}>
            <img src={book.cover || DEFAULT_IMAGE_PATH} alt="" className={styles.relatedThumb} loading="lazy" onError={handleImgError} />
            <span className={styles.relatedInfo}>
              <span className={styles.relatedTitle}>{book.title}</span>
              <span className={styles.relatedMeta}>Ebook</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );

  return (
    <div className={styles.page}>
      <PageHero
        compact
        image={headerImage}
        title={ebook.title}
        subtitle={shortDescription}
        crumbs={[
          { label: 'Home', to: '/' },
          { label: 'Collections', to: '/collections' },
          { label: 'Ebooks', to: '/collections/ebooks' },
          { label: ebook.title },
        ]}
      />

      <div className={styles.layout}>
        <div className={styles.main}>
          {/* ---------- Book card ---------- */}
          <section className={styles.productCard} aria-label="Book details">
            <div className={styles.coverStage}>
              <div className={styles.cover}>
                <img src={ebook.cover || DEFAULT_IMAGE_PATH} alt={`Cover of ${ebook.title}`} className={styles.coverImg} onError={handleImgError} />
              </div>
            </div>

            <div className={styles.info}>
              <div className={styles.chipRow}>
                <span className={styles.chip}><FaBookOpen aria-hidden="true" /> Ebook</span>
                <span className={styles.ratingRow}>
                  <Stars value={ebook.rating || 0} />
                  {(ebook.rating || 0).toFixed(1)} · {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                </span>
              </div>

              <h2 className={styles.title}>{ebook.title}</h2>
              <p className={styles.byline}>
                by{' '}
                {ebook.authorId ? (
                  <Link to={`/collections/authors/author/${ebook.authorId}`} className={styles.bylineLink}>{ebook.authorName}</Link>
                ) : ebook.authorName}
              </p>

              <div className={styles.metaRow}>
                {ebook.pages > 0 && <span className={styles.metaPill}><FaBookOpen aria-hidden="true" /> {ebook.pages} pages</span>}
                <span className={styles.metaPill}><FaFilePdf aria-hidden="true" /> PDF</span>
                {ebook.chapters.length > 0 && <span className={styles.metaPill}>{ebook.chapters.length} chapters</span>}
              </div>

              {description && (
                <div className={styles.description}>
                  <p className={styles.descText}>{shownDescription}</p>
                  {isLong && (
                    <button type="button" className={styles.moreButton} onClick={() => setShowFullDescription(!showFullDescription)}>
                      {showFullDescription ? 'Show less' : 'Read full description'}
                    </button>
                  )}
                </div>
              )}

              <div className={styles.actions}>
                <button type="button" className={styles.primaryButton} onClick={handleReadNow} disabled={pdfLoading}>
                  <FaBookOpen aria-hidden="true" /> {pdfLoading ? 'Opening…' : 'Read now'}
                </button>
                <button type="button" className={styles.secondaryButton} onClick={library.download} disabled={library.downloading}>
                  <FaDownload aria-hidden="true" /> {library.downloading ? 'Preparing…' : 'Download'}
                </button>
                <button
                  type="button"
                  className={`${styles.iconButton} ${liked ? styles.iconButtonOn : ''}`}
                  onClick={library.toggleLike}
                  disabled={library.busy === 'like'}
                  aria-pressed={liked}
                  aria-label={liked ? 'Unlike this book' : 'Like this book'}
                >
                  {liked ? <FaHeart /> : <FaRegHeart />}
                </button>
                <button
                  type="button"
                  className={`${styles.iconButton} ${saved ? styles.iconButtonOn : ''}`}
                  onClick={library.toggleSave}
                  disabled={library.busy === 'save'}
                  aria-pressed={saved}
                  aria-label={saved ? 'Remove from saved' : 'Save for later'}
                  title={saved ? 'Saved for later' : 'Save for later'}
                >
                  {saved ? <FaBookmark /> : <FaRegBookmark />}
                </button>
                <button type="button" className={styles.iconButton} onClick={handleShare} aria-label="Share this book">
                  <FaShareAlt />
                </button>
              </div>
            </div>
          </section>

          {/* ---------- Chapters ---------- */}
          <section className={styles.section} aria-labelledby="chapters-title">
            <div className={styles.sectionHead}>
              <div>
                <h3 id="chapters-title" className={styles.sectionTitle}>Chapters</h3>
                {ebook.chapters.length > 0 && <p className={styles.sectionNote}>{ebook.chapters.length} chapters in this book</p>}
              </div>
            </div>
            {ebook.chapters.length === 0 ? (
              <p className={styles.emptyNote}>Chapter list isn’t available for this book. Open it with “Read now”.</p>
            ) : (
              <ol className={styles.chapterList}>
                {ebook.chapters.map((chapter, index) => {
                  const open = expandedChapter === chapter.id;
                  return (
                    <li key={chapter.id} className={`${styles.chapter} ${styles.glass} ${open ? styles.chapterOpen : ''}`}>
                      <button
                        type="button"
                        className={styles.chapterHead}
                        onClick={() => toggleChapter(chapter.id)}
                        aria-expanded={open}
                      >
                        <span className={styles.chapterIndex}>{index + 1}</span>
                        <span className={styles.chapterName}>{chapter.title}</span>
                        <span className={styles.chapterMeta}>Chapter {index + 1}</span>
                        <FaChevronDown className={styles.chapterChevron} aria-hidden="true" />
                      </button>
                      {open && (
                        <div className={styles.chapterBody}>
                          <p className={styles.chapterText}>Open the book to start reading “{chapter.title}”.</p>
                          <button type="button" className={styles.smallButton} onClick={() => handleReadChapter(chapter.id)}>
                            <FaBookOpen aria-hidden="true" /> Read this chapter
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          {/* ---------- Reviews ---------- */}
          <section className={styles.section} aria-labelledby="reviews-title">
            <div className={styles.sectionHead}>
              <h3 id="reviews-title" className={styles.sectionTitle}>Ratings and reviews</h3>
            </div>

            <div className={`${styles.reviewForm} ${styles.glass}`}>
              <h4 className={styles.formTitle}>Write a review</h4>
              {!isLoggedIn ? (
                <p className={styles.loginPrompt}>
                  <Link to="/login">Sign in</Link> to rate this book and share what you thought.
                </p>
              ) : (
                <form onSubmit={handleSubmitReview}>
                  <div className={styles.field}>
                    <span className={styles.label} id="rating-label">Your rating</span>
                    <div className={styles.starPicker} role="group" aria-labelledby="rating-label">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleRatingChange(star)}
                          className={styles.starButton}
                          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
                          aria-pressed={star <= reviewForm.rating}
                        >
                          {star <= reviewForm.rating ? <FaStar className={styles.starOn} /> : <FaRegStar className={styles.starOff} />}
                        </button>
                      ))}
                      <span className={styles.ratingHint}>
                        {reviewForm.rating > 0 ? `${reviewForm.rating} of 5` : 'Tap a star'}
                      </span>
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="review" className={styles.label}>Your review</label>
                    <textarea
                      id="review"
                      name="review"
                      className={styles.textarea}
                      value={reviewForm.review}
                      onChange={handleInputChange}
                      placeholder="What did you enjoy? Who would you recommend it to?"
                      required
                      maxLength={REVIEW_MAX}
                      aria-invalid={Boolean(reviewError)}
                      aria-describedby={reviewError ? 'review-error' : undefined}
                    />
                  </div>
                  {reviewError && <p id="review-error" className={styles.reviewError} role="alert">{reviewError}</p>}
                  <div className={styles.formActions}>
                    <button type="submit" className={styles.primaryButton} disabled={isSubmitting || reviewForm.rating === 0}>
                      {isSubmitting ? 'Posting…' : 'Post review'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className={styles.reviewsHeader}>
              <p className={styles.reviewsCount}>{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</p>
              {reviews.length > 1 && (
                <label className={styles.sortWrap}>
                  <FaSort aria-hidden="true" />
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={styles.sortSelect} aria-label="Sort reviews">
                    <option value="newest">Newest first</option>
                    <option value="top">Most helpful</option>
                  </select>
                </label>
              )}
            </div>

            {reviews.length === 0 ? (
              <p className={styles.emptyNote}>No reviews yet. Be the first to share what you thought.</p>
            ) : (
              <ul className={styles.reviewList}>
                {displayedReviews.map((review) => (
                  <li key={review.id} className={`${styles.review} ${styles.glass}`}>
                    <div className={styles.reviewTop}>
                      <div className={styles.reviewer}>
                        <span className={styles.avatar} aria-hidden="true">{review.name.charAt(0).toUpperCase()}</span>
                        <div>
                          <div className={styles.reviewName}>{review.name}</div>
                          <div className={styles.reviewDate}>{review.date}</div>
                        </div>
                      </div>
                      <Stars value={review.rating} />
                    </div>
                    <p className={styles.reviewBody}>{review.review}</p>
                    <button type="button" className={styles.helpful} onClick={() => toggleHelpful(review.id)}>
                      Helpful ({review.helpful})
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {visibleReviews < reviews.length && (
              <button type="button" className={`${styles.secondaryButton} ${styles.loadMore}`} onClick={() => setVisibleReviews((v) => v + 5)}>
                Show more reviews
              </button>
            )}
          </section>
        </div>

        <aside className={styles.aside}>
          {renderRelated(related, relatedRef, 'Related books')}
          {renderRelated(recommended, recommendedRef, 'You might also like')}
        </aside>
      </div>

      {/* ---------- Reader ---------- */}
      {showPdfModal && (
        <BookReader
          url={pdfUrl}
          title={ebook.title}
          linkError={pdfError}
          onRetry={fetchPdfLink}
          onClose={closeReader}
          onProgress={handleReaderProgress}
        />
      )}
    </div>
  );
};

export default EbookDetail;
