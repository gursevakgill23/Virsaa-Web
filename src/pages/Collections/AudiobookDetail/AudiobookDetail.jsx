import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FaHeart, FaRegHeart, FaBookmark, FaRegBookmark, FaShareAlt, FaChevronLeft, FaChevronRight,
  FaStar, FaRegStar, FaSort, FaPlay, FaPause, FaHeadphones, FaClock, FaLock, FaChevronDown,
  FaUndoAlt, FaRedoAlt,
} from 'react-icons/fa';
import styles from './AudiobookDetail.module.css';
import PageHero from '../../../components/PageHero/PageHero';
import Loader from '../../../components/VirsaaLoader/Loader';
import axios from 'axios';
import useLibraryItem from '../../../hooks/useLibraryItem';

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

const Stars = ({ value }) => (
  <span className={styles.stars} aria-label={`${value} out of 5`}>
    {[1, 2, 3, 4, 5].map((i) =>
      i <= Math.round(value) ? <FaStar key={i} className={styles.starOn} /> : <FaRegStar key={i} className={styles.starOff} />
    )}
  </span>
);

const RelatedSkeleton = () => (
  <div className={styles.relatedCard} aria-hidden="true">
    <span className={`${styles.relatedThumb} ${styles.relatedThumbSquare} ${styles.skeleton}`} />
    <span className={styles.relatedInfo}>
      <span className={`${styles.skeleton} ${styles.skeletonLine}`} />
      <span className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineShort}`} />
    </span>
  </div>
);

const AudiobookDetail = ({ isDarkMode, apiString }) => {
  const getImagePath = useProductionImagePath();
  const { id } = useParams();
  const [audiobook, setAudiobook] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const library = useLibraryItem(apiString, 'audiobook', id);
  const { liked, saved } = library;
  const [loadError, setLoadError] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [related, setRelated] = useState([]);
  const apiUrl = (apiString || '').replace(/\/$/, '');
  const [expandedChapter, setExpandedChapter] = useState(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef(null);
  const relatedRef = useRef(null);
  const recommendedRef = useRef(null);

  const header_image_dark = '/images/header-image-dark.png';
  const header_image_light = '/images/header-image.png';
  const bookImage = '/images/book-image.jpg';

  const [reviewForm, setReviewForm] = useState({ name: '', email: '', rating: 0, review: '' });
  const [reviews, setReviews] = useState([]);
  const [visibleReviews, setVisibleReviews] = useState(5);
  const [sortBy, setSortBy] = useState('newest');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ---------- Player ----------
  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const skip = (seconds) => {
    if (!audioRef.current) return;
    const next = Math.min(Math.max(audioRef.current.currentTime + seconds, 0), duration || 0);
    audioRef.current.currentTime = next;
    setCurrentTime(next);
  };

  const handleTimeUpdate = () => setCurrentTime(audioRef.current.currentTime);
  const handleLoadedMetadata = () => setDuration(audioRef.current.duration);

  const handleSeek = (e) => {
    const seekTime = Number(e.target.value);
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const formatTime = (time) => {
    if (!Number.isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setRelatedLoading(true);
    setLoadError(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setCurrentTime(0);

    const load = async () => {
      try {
        const { data } = await axios.get(`${apiUrl}/collections/audiobooks/${id}/`);
        let authorName = '';
        if (data.author) {
          authorName = await axios.get(`${apiUrl}/collections/authors/${data.author}/`)
            .then((r) => r.data.name).catch(() => '');
        }
        const reviewRes = await axios.get(`${apiUrl}/collections/audiobooks/${id}/reviews/`).catch(() => ({ data: [] }));
        if (cancelled) return;
        setAudiobook({
          id: data.id,
          title: data.title,
          author: authorName,
          authorId: data.author,
          cover: data.cover || bookImage,
          rating: Number(data.rating) || 0,
          length: data.duration,
          format: data.format || 'MP3',
          genre: data.genre || 'Audiobook',
          description: data.description || '',
          chapters: data.chapters || [],
        });
        const rows = Array.isArray(reviewRes.data) ? reviewRes.data : [];
        setReviews(rows.map((r) => ({
          id: r.id,
          name: r.user,
          date: new Date(r.date).toLocaleDateString(),
          rating: r.rating,
          review: r.review,
          helpful: r.helpful || 0,
        })));
      } catch (err) {
        if (!cancelled) setLoadError(err.response?.status === 404 ? 'This audiobook could not be found.' : 'This audiobook couldn’t be loaded right now.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }

      // Audio files are private on S3; stream_audio returns a temporary link
      axios.get(`${apiUrl}/collections/audiobooks/${id}/stream_audio/`)
        .then((r) => { if (!cancelled) setAudioUrl(r.data.audio_url || null); })
        .catch(() => { if (!cancelled) setAudioUrl(null); });

      const all = await axios.get(`${apiUrl}/collections/audiobooks/`).catch(() => ({ data: [] }));
      if (cancelled) return;
      const list = Array.isArray(all.data) ? all.data : all.data?.results || [];
      setRelated(list.filter((a) => String(a.id) !== String(id)).slice(0, 10).map((a) => ({
        id: a.id, title: a.title, author: a.genre || 'Audiobook', cover: a.cover || bookImage,
      })));
      setRelatedLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, [id, apiUrl]);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: audiobook?.title, url });
      else await navigator.clipboard.writeText(url);
    } catch {
      // share sheet dismissed
    }
  };

  const toggleChapter = (chapterId) => setExpandedChapter(expandedChapter === chapterId ? null : chapterId);

  const handleListenChapter = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  };

  const scrollRow = (ref, direction) => {
    ref.current?.scrollBy({ left: direction === 'left' ? -300 : 300, behavior: 'smooth' });
  };

  const handleRatingChange = (rating) => setReviewForm({ ...reviewForm, rating });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setReviewForm({ ...reviewForm, [name]: value });
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setReviews((prev) => [
        {
          id: prev.length + 1,
          name: reviewForm.name,
          date: new Date().toLocaleDateString(),
          rating: reviewForm.rating,
          review: reviewForm.review,
          helpful: 0,
        },
        ...prev,
      ]);
      setReviewForm({ name: '', email: '', rating: 0, review: '' });
      setIsSubmitting(false);
    }, 600);
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
    return <div className={styles.page}><Loader /></div>;
  }

  if (loadError || !audiobook) {
    return (
      <div className={styles.page}>
        <div className={styles.layout}>
          <p className={styles.sectionNote}>
            {loadError || 'This audiobook could not be found.'} <Link to="/collections/audiobooks">Browse audiobooks</Link>
          </p>
        </div>
      </div>
    );
  }

  const [firstParagraph] = audiobook.description.split('\n');
  const progress = duration ? (currentTime / duration) * 100 : 0;
  const hasMoreDescription = audiobook.description.length > firstParagraph.length;

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
        {relatedLoading
          ? Array.from({ length: 4 }).map((_, i) => <RelatedSkeleton key={i} />)
          : items.map((book) => (
              <Link key={book.id} to={`/collections/audiobooks/audiobook/${book.id}`} className={styles.relatedCard}>
                <img src={getImagePath(book.cover)} alt="" className={`${styles.relatedThumb} ${styles.relatedThumbSquare}`} loading="lazy" />
                <span className={styles.relatedInfo}>
                  <span className={styles.relatedTitle}>{book.title}</span>
                  <span className={styles.relatedMeta}>{book.author}</span>
                </span>
              </Link>
            ))}
      </div>
    </section>
  );

  return (
    <div className={styles.page}>
      <audio
        ref={audioRef}
        src={audioUrl || undefined}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      <PageHero
        compact
        image={getImagePath(isDarkMode ? header_image_dark : header_image_light)}
        title={audiobook.title}
        subtitle={audiobook.author ? `by ${audiobook.author}` : 'Audiobook'}
        crumbs={[
          { label: 'Home', to: '/' },
          { label: 'Collections', to: '/collections' },
          { label: 'Audiobooks', to: '/collections/audiobooks' },
          { label: audiobook.title },
        ]}
      />

      <div className={styles.layout}>
        <div className={styles.main}>
          <section className={styles.productCard} aria-label="Audiobook details">
            <div className={styles.coverStage}>
              <div className={`${styles.cover} ${styles.coverSquare} ${isPlaying ? styles.coverPlaying : ''}`}>
                <img src={getImagePath(audiobook.cover)} alt={`Cover of ${audiobook.title}`} className={styles.coverImg} />
              </div>
            </div>

            <div className={styles.info}>
              <div className={styles.chipRow}>
                <span className={styles.chip}><FaHeadphones aria-hidden="true" /> {audiobook.genre}</span>
                <span className={styles.ratingRow}>
                  <Stars value={audiobook.rating} />
                  {audiobook.rating.toFixed(1)} · {reviews.length.toLocaleString()} {reviews.length === 1 ? 'review' : 'reviews'}
                </span>
              </div>

              <h2 className={styles.title}>{audiobook.title}</h2>
              {audiobook.author && (
                <p className={styles.byline}>
                  by {audiobook.authorId ? <Link to={`/collections/authors/author/${audiobook.authorId}`}>{audiobook.author}</Link> : audiobook.author}
                </p>
              )}

              <div className={styles.metaRow}>
                {audiobook.length && <span className={styles.metaPill}><FaClock aria-hidden="true" /> {audiobook.length}</span>}
                <span className={styles.metaPill}>{audiobook.format}</span>
                {audiobook.chapters.length > 0 && (
                  <span className={styles.metaPill}>{audiobook.chapters.length} {audiobook.chapters.length === 1 ? 'chapter' : 'chapters'}</span>
                )}
              </div>

              <div className={styles.description}>
                <p className={styles.descText}>{showFullDescription ? audiobook.description : firstParagraph}</p>
                {hasMoreDescription && (
                  <button type="button" className={styles.moreButton} onClick={() => setShowFullDescription(!showFullDescription)}>
                    {showFullDescription ? 'Show less' : 'Read full description'}
                  </button>
                )}
              </div>

              {/* Player */}
              <div className={styles.player}>
                <button
                  type="button"
                  className={styles.playButton}
                  onClick={togglePlayPause}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <FaPause /> : <FaPlay className={styles.playIconNudge} />}
                </button>
                <div className={styles.playerTrack}>
                  <div className={styles.playerTop}>
                    <span className={styles.playerLabel}>{!audioUrl ? 'Audio not available yet' : isPlaying ? 'Now playing' : 'Ready to play'}</span>
                    <div className={styles.skipButtons}>
                      <button type="button" className={styles.skipButton} onClick={() => skip(-15)} aria-label="Back 15 seconds">
                        <FaUndoAlt /><span>15</span>
                      </button>
                      <button type="button" className={styles.skipButton} onClick={() => skip(15)} aria-label="Forward 15 seconds">
                        <FaRedoAlt /><span>15</span>
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    step="1"
                    value={currentTime}
                    onChange={handleSeek}
                    className={styles.progressBar}
                    style={{ '--progress': `${progress}%` }}
                    aria-label="Seek"
                  />
                  <div className={styles.timeDisplay}>
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
              </div>

              <div className={styles.actions}>
                <button
                  type="button"
                  className={`${styles.iconButton} ${liked ? styles.iconButtonOn : ''}`}
                  onClick={library.toggleLike}
                  disabled={library.busy === 'like'}
                  aria-pressed={liked}
                  aria-label={liked ? 'Unlike' : 'Like'}
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
                >
                  {saved ? <FaBookmark /> : <FaRegBookmark />}
                </button>
                <button type="button" className={styles.iconButton} onClick={handleShare} aria-label="Share">
                  <FaShareAlt />
                </button>
              </div>
            </div>
          </section>

          {/* Chapters */}
          {audiobook.chapters.length > 0 && (
          <section className={styles.section} aria-labelledby="chapters-title">
            <div className={styles.sectionHead}>
              <div>
                <h3 id="chapters-title" className={styles.sectionTitle}>Chapters</h3>
                <p className={styles.sectionNote}>{audiobook.chapters.filter((c) => !c.locked).length} free, {audiobook.chapters.filter((c) => c.locked).length} with Premium</p>
              </div>
            </div>
            <ol className={styles.chapterList}>
              {audiobook.chapters.map((chapter, index) => {
                const open = expandedChapter === chapter.id;
                return (
                  <li key={chapter.id} className={`${styles.chapter} ${styles.glass} ${open ? styles.chapterOpen : ''}`}>
                    <button type="button" className={styles.chapterHead} onClick={() => toggleChapter(chapter.id)} aria-expanded={open}>
                      <span className={styles.chapterIndex}>{chapter.locked ? <FaLock aria-label="Premium" /> : index + 1}</span>
                      <span className={styles.chapterName}>{chapter.title}</span>
                      <span className={styles.chapterMeta}><FaClock aria-hidden="true" /> {chapter.duration}</span>
                      <FaChevronDown className={styles.chapterChevron} aria-hidden="true" />
                    </button>
                    {open && (
                      <div className={styles.chapterBody}>
                        <p className={styles.chapterText}>{chapter.title}{chapter.duration ? `, ${chapter.duration}` : ''}.</p>
                        {chapter.locked ? (
                          <Link to="/premium" className={`${styles.smallButton} ${styles.lockedButton}`}>
                            <FaLock aria-hidden="true" /> Unlock with Premium
                          </Link>
                        ) : (
                          <button type="button" className={styles.smallButton} onClick={() => handleListenChapter(chapter.id)}>
                            <FaPlay aria-hidden="true" /> Listen to this chapter
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
          )}

          {/* Reviews */}
          <section className={styles.section} aria-labelledby="reviews-title">
            <div className={styles.sectionHead}>
              <h3 id="reviews-title" className={styles.sectionTitle}>Ratings and reviews</h3>
            </div>

            <form className={`${styles.reviewForm} ${styles.glass}`} onSubmit={handleSubmitReview}>
              <h4 className={styles.formTitle}>Write a review</h4>
              <div className={styles.formRow}>
                <div className={styles.field}>
                  <label htmlFor="name" className={styles.label}>Name</label>
                  <input id="name" name="name" type="text" className={styles.input} value={reviewForm.name} onChange={handleInputChange} required />
                </div>
                <div className={styles.field}>
                  <label htmlFor="email" className={styles.label}>Email</label>
                  <input id="email" name="email" type="email" className={styles.input} value={reviewForm.email} onChange={handleInputChange} required />
                </div>
              </div>
              <div className={styles.field}>
                <span className={styles.label} id="a-rating-label">Your rating</span>
                <div className={styles.starPicker} role="group" aria-labelledby="a-rating-label">
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
                  <span className={styles.ratingHint}>{reviewForm.rating > 0 ? `${reviewForm.rating} of 5` : 'Tap a star'}</span>
                </div>
              </div>
              <div className={styles.field}>
                <label htmlFor="review" className={styles.label}>Your review</label>
                <textarea id="review" name="review" className={styles.textarea} value={reviewForm.review} onChange={handleInputChange} required />
              </div>
              <div className={styles.formActions}>
                <button type="submit" className={styles.primaryButton} disabled={isSubmitting || reviewForm.rating === 0}>
                  {isSubmitting ? 'Posting…' : 'Post review'}
                </button>
              </div>
            </form>

            <div className={styles.reviewsHeader}>
              <p className={styles.reviewsCount}>{reviews.length} reviews</p>
              <label className={styles.sortWrap}>
                <FaSort aria-hidden="true" />
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={styles.sortSelect} aria-label="Sort reviews">
                  <option value="newest">Newest first</option>
                  <option value="top">Most helpful</option>
                </select>
              </label>
            </div>

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

            {visibleReviews < reviews.length && (
              <button type="button" className={`${styles.secondaryButton} ${styles.loadMore}`} onClick={() => setVisibleReviews((v) => v + 5)}>
                Show more reviews
              </button>
            )}
          </section>
        </div>

        <aside className={styles.aside}>
          {renderRelated(related, relatedRef, 'Related audiobooks')}
          {related.length > 3 && renderRelated([...related].reverse(), recommendedRef, 'More to listen to')}
        </aside>
      </div>
    </div>
  );
};

export default AudiobookDetail;
