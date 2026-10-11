import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FaBookmark, FaRegBookmark, FaShareAlt, FaChevronLeft, FaChevronRight, FaStar, FaRegStar,
  FaSort, FaHeart, FaRegHeart, FaBookOpen, FaFilePdf, FaTimes, FaChevronDown,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import styles from './EbookDetail.module.css';
import PageHero from '../../../components/PageHero/PageHero';
import Loader from '../../../components/Loader';
import { useAuth } from '../../../context/AuthContext.jsx';
import axios from 'axios';
import { PDFViewer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const DEFAULT_IMAGE_PATH = '/images/Collections/book-image.jpg';

// Fisher-Yates shuffle
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Styles for the generated fallback PDF
const pdfStyles = StyleSheet.create({
  page: { backgroundColor: '#FFF', padding: 20, flexDirection: 'column', fontSize: 12, fontFamily: 'Helvetica' },
  coverPage: { backgroundColor: 'white', padding: 40, flexDirection: 'column', justifyContent: 'center', alignItems: 'center' },
  coverTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#65041d' },
  coverAuthor: { fontSize: 16, marginBottom: 10, color: '#666' },
  chapterTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  content: { lineHeight: 1.5, color: '#444' },
  pageNumber: { position: 'absolute', bottom: 10, right: 20, fontSize: 10, color: '#666' },
});

// Public/static images
const getProductionImagePath = (imagePath) => {
  if (!imagePath || typeof imagePath !== 'string') return DEFAULT_IMAGE_PATH;
  if (process.env.NODE_ENV === 'production' && !imagePath.startsWith('/') && !imagePath.startsWith('http')) {
    return `/images/Collections/${imagePath.split('/').pop()}`;
  }
  return imagePath;
};

const handleImgError = (e) => {
  if (e.currentTarget.dataset.fallback) return;
  e.currentTarget.dataset.fallback = '1';
  e.currentTarget.src = DEFAULT_IMAGE_PATH;
};

// Generated PDF shown when the real file can't be opened
const MyDocument = ({ ebook }) => (
  <Document>
    <Page size="A4" style={pdfStyles.coverPage}>
      <View>
        <Text style={pdfStyles.coverTitle}>{ebook?.title || 'Untitled Ebook'}</Text>
        <Text style={pdfStyles.coverAuthor}>{ebook?.authorName || 'Unknown Author'}</Text>
      </View>
    </Page>
    {ebook?.chapters?.map((chapter, index) => (
      <Page key={chapter.id} size="A4" style={pdfStyles.page}>
        <View>
          <Text style={pdfStyles.chapterTitle}>
            Chapter {index + 1}: {chapter.title}
          </Text>
          <Text style={pdfStyles.content}>
            The full text of this chapter couldn’t be loaded. Close this window and try “Read now” again.
          </Text>
        </View>
        <Text style={pdfStyles.pageNumber}>Page {index + 2}</Text>
      </Page>
    ))}
  </Document>
);

const Stars = ({ value }) => (
  <span className={styles.stars} aria-label={`${value} out of 5`}>
    {[1, 2, 3, 4, 5].map((i) =>
      i <= Math.round(value) ? <FaStar key={i} className={styles.starOn} /> : <FaRegStar key={i} className={styles.starOff} />
    )}
  </span>
);

const RelatedSkeleton = () => (
  <div className={styles.relatedCard} aria-hidden="true">
    <span className={`${styles.relatedThumb} ${styles.skeleton}`} />
    <span className={styles.relatedInfo}>
      <span className={`${styles.skeleton} ${styles.skeletonLine}`} />
      <span className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineShort}`} />
    </span>
  </div>
);

const EbookDetail = ({ isDarkMode, apiString }) => {
  const { isLoggedIn, accessToken, userData } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const relatedRef = useRef(null);
  const recommendedRef = useRef(null);

  const [ebook, setEbook] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [related, setRelated] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expandedChapter, setExpandedChapter] = useState(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(null);

  const [reviewForm, setReviewForm] = useState({ rating: 0, review: '' });
  const [reviews, setReviews] = useState([]);
  const [visibleReviews, setVisibleReviews] = useState(5);
  const [sortBy, setSortBy] = useState('newest');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const apiUrl = apiString ? apiString.replace(/\/$/, '') : 'http://localhost:8000';
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
      try {
        const { data } = await axios.get(`${apiUrl}/collections/ebooks/${id}/`);
        if (cancelled) return;

        let authorName = 'Unknown author';
        if (data.author) {
          try {
            const authorRes = await axios.get(`${apiUrl}/collections/authors/${data.author}/`);
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

        const reviewsRes = await axios.get(`${apiUrl}/collections/ebooks/${id}/reviews/`).catch(() => ({ data: [] }));
        if (cancelled) return;
        setReviews((reviewsRes.data || []).map((review) => ({
          id: review.id,
          name: review.user || 'Anonymous',
          date: review.date ? new Date(review.date).toLocaleDateString() : '',
          rating: review.rating || 0,
          review: review.review || '',
          helpful: review.helpful || 0,
        })));

        // Related: same author first, then other books
        const allRes = await axios.get(`${apiUrl}/collections/ebooks/`).catch(() => ({ data: [] }));
        if (cancelled) return;
        const others = (allRes.data || []).filter((item) => item.id !== Number(id));
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
          setIsLoading(false);
        }
      } finally {
        if (!cancelled) setRelatedLoading(false);
      }
    };
    fetchEbook();
    return () => { cancelled = true; };
  }, [id, apiUrl]);

  // PDFs are private on S3; read_pdf returns a temporary link
  const handleReadNow = async () => {
    setPdfLoading(true);
    setPdfError(null);
    setPdfUrl(null);
    try {
      const response = await axios.get(`${apiUrl}/collections/ebooks/${id}/read_pdf/`);
      if (response.data?.pdf_url) {
        setPdfUrl(response.data.pdf_url);
      } else {
        throw new Error('No PDF link returned');
      }
    } catch (error) {
      console.error('Error fetching PDF link:', error.response?.status || error.message);
      setPdfError('The book file couldn’t be opened right now. Showing a preview instead.');
    } finally {
      setShowPdfModal(true);
      setPdfLoading(false);
    }
  };

  // Close the reader with Escape
  useEffect(() => {
    if (!showPdfModal) return undefined;
    const onKey = (e) => e.key === 'Escape' && setShowPdfModal(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showPdfModal]);

  const handleLike = () => {
    setLiked(!liked);
    toast.success(liked ? 'Removed from liked books' : 'Added to liked books', { position: 'top-right', autoClose: 2500 });
  };

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
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.warn('Sign in to write a review.', { position: 'top-right', autoClose: 3000 });
      navigate('/login');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `${apiUrl}/collections/reviews/`,
        { ebook_id: id, rating: reviewForm.rating, review: reviewForm.review },
        { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
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
      toast.error('Your review couldn’t be posted. Try again.', { position: 'top-right', autoClose: 3000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleHelpful = (reviewId) => {
    setReviews(reviews.map((r) => (r.id === reviewId ? { ...r, helpful: r.helpful + 1 } : r)));
  };

  const sortedReviews = useMemo(
    () => [...reviews].sort((a, b) => (sortBy === 'newest' ? b.id - a.id : b.helpful - a.helpful)),
    [reviews, sortBy]
  );
  const displayedReviews = sortedReviews.slice(0, visibleReviews);

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
          <h2>This book couldn’t be found</h2>
          <p>It may have been removed, or the link is wrong.</p>
          <Link to="/collections/ebooks" className={styles.primaryButton}>Browse all ebooks</Link>
        </div>
      </div>
    );
  }

  const description = ebook.description || '';
  const isLong = description.length > 420;
  const shownDescription = showFullDescription || !isLong ? description : `${description.slice(0, 420).trim()}…`;
  const shortDescription = description.split(' ').slice(0, 12).join(' ') + (description.split(' ').length > 12 ? '…' : '');

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
                <button
                  type="button"
                  className={`${styles.iconButton} ${liked ? styles.iconButtonOn : ''}`}
                  onClick={handleLike}
                  aria-pressed={liked}
                  aria-label={liked ? 'Unlike this book' : 'Like this book'}
                >
                  {liked ? <FaHeart /> : <FaRegHeart />}
                </button>
                <button
                  type="button"
                  className={`${styles.iconButton} ${saved ? styles.iconButtonOn : ''}`}
                  onClick={() => setSaved(!saved)}
                  aria-pressed={saved}
                  aria-label={saved ? 'Remove from saved' : 'Save for later'}
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
                    />
                  </div>
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
        <div className={styles.modalOverlay} onMouseDown={() => setShowPdfModal(false)} role="presentation">
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-label={`Reading ${ebook.title}`}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHead}>
              <h2 className={styles.modalTitle}>{ebook.title}</h2>
              <button type="button" onClick={() => setShowPdfModal(false)} className={styles.iconButton} aria-label="Close reader">
                <FaTimes />
              </button>
            </div>
            {pdfError && <p className={styles.pdfError}>{pdfError}</p>}
            <div className={styles.modalBody}>
              {pdfUrl ? (
                <iframe src={pdfUrl} title={`${ebook.title} PDF`} />
              ) : (
                <PDFViewer width="100%" height="100%" showToolbar>
                  <MyDocument ebook={ebook} />
                </PDFViewer>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EbookDetail;
