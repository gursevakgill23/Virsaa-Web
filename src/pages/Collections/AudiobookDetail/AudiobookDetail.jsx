import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FaHeart, FaRegHeart, FaBookmark, FaRegBookmark, FaShareAlt, FaChevronLeft, FaChevronRight,
  FaStar, FaRegStar, FaSort, FaPlay, FaPause, FaHeadphones, FaClock, FaLock, FaChevronDown,
  FaDownload, FaUndoAlt, FaRedoAlt,
} from 'react-icons/fa';
import styles from './AudiobookDetail.module.css';
import PageHero from '../../../components/PageHero/PageHero';
import Loader from '../../../components/VirsaaLoader/Loader';

const useProductionImagePath = () => {
  return (imagePath) => {
    if (process.env.NODE_ENV === 'production') {
      if (typeof imagePath === 'string') {
        return imagePath.startsWith('/')
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

const AudiobookDetail = ({ isDarkMode }) => {
  const getImagePath = useProductionImagePath();
  const { id } = useParams();
  const [audiobook, setAudiobook] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expandedChapter, setExpandedChapter] = useState(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef(null);
  const relatedRef = useRef(null);
  const recommendedRef = useRef(null);

  const header_image_dark = '/images/header-image-dark.png';
  const header_image_light = '/images/header-image-light.png';
  const bookImage = '/images/book-image.jpg';
  const audioFile = '/images/Collections/Nitnem.mp3';

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
    setIsLoading(true);
    setRelatedLoading(true);
    const t1 = setTimeout(() => {
      setAudiobook({
        id,
        title: 'Nitnem',
        author: 'Guru Granth Sahib',
        cover: bookImage,
        rating: 4.9,
        reviews: 1842,
        length: '2 hours 45 minutes',
        format: 'MP3',
        genre: 'Spiritual',
        description: `Nitnem is a collection of Sikh hymns (Gurbani) to be read daily by devout Sikhs. These hymns are recited at specific times throughout the day and are considered essential for spiritual growth and connection with the Divine.

The Nitnem banis include Japji Sahib, Jaap Sahib, Tav-Prasad Savaiye, Chaupai Sahib, and Anand Sahib. These sacred compositions by the Sikh Gurus provide guidance, inspiration, and a framework for daily spiritual practice.`,
        chapters: [
          { id: 1, title: 'Japji Sahib', duration: '20:15', locked: false },
          { id: 2, title: 'Jaap Sahib', duration: '15:30', locked: false },
          { id: 3, title: 'Tav-Prasad Savaiye', duration: '08:45', locked: false },
          { id: 4, title: 'Chaupai Sahib', duration: '12:20', locked: true },
          { id: 5, title: 'Anand Sahib', duration: '18:40', locked: true },
        ],
      });

      setReviews(Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        name: ['Amrit', 'Gurpreet', 'Harpreet', 'Jaspreet', 'Manpreet', 'Navpreet'][i % 6],
        date: new Date(Date.now() - (i * 86400000)).toLocaleDateString(),
        rating: [4, 5, 3, 4, 5, 4, 3, 5, 4, 5][i % 10],
        review: [
          'This audiobook brings peace to my daily routine. The recitation is beautiful!',
          'A must-have for every Sikh household. Perfect for morning meditation.',
          'The pronunciation is very clear and easy to follow along.',
          'Listening to Nitnem while commuting has transformed my day.',
          'The audio quality is excellent and the voice is very soothing.',
          'Helps me maintain my daily spiritual practice even when traveling.',
          'Would be better with translations included.',
          'The chapters are perfectly timed for daily listening.',
          'I love how this preserves the traditional way of reciting Gurbani.',
          'The ending shabads give me chills every time.',
        ][i % 10],
        helpful: (i * 7) % 50,
      })));
      setIsLoading(false);
    }, 600);

    const t2 = setTimeout(() => {
      setAudiobook((prev) => prev && ({
        ...prev,
        related: [
          { id: 201, title: 'Sukhmani Sahib', author: 'Guru Arjan Dev', cover: bookImage },
          { id: 202, title: 'Asa Di Var', author: 'Guru Nanak Dev', cover: bookImage },
          { id: 203, title: 'Rehras Sahib', author: 'Guru Granth Sahib', cover: bookImage },
          { id: 204, title: 'Kirtan Sohila', author: 'Guru Granth Sahib', cover: bookImage },
          { id: 205, title: 'Gurbani Kirtan', author: 'Various Ragis', cover: bookImage },
        ],
      }));
      setRelatedLoading(false);
    }, 1200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [id]);

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

  if (isLoading || !audiobook) {
    return <div className={styles.page}><Loader /></div>;
  }

  const [firstParagraph] = audiobook.description.split('\n');
  const progress = duration ? (currentTime / duration) * 100 : 0;
  const related = audiobook.related || [];

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
        src={audioFile}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      <PageHero
        compact
        image={getImagePath(isDarkMode ? header_image_dark : header_image_light)}
        title="NITNEM"
        subtitle="Daily prayers from Guru Granth Sahib"
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
                  {audiobook.rating} · {audiobook.reviews.toLocaleString()} reviews
                </span>
              </div>

              <h2 className={styles.title}>{audiobook.title}</h2>
              <p className={styles.byline}>by {audiobook.author}</p>

              <div className={styles.metaRow}>
                <span className={styles.metaPill}><FaClock aria-hidden="true" /> {audiobook.length}</span>
                <span className={styles.metaPill}>{audiobook.format}</span>
                <span className={styles.metaPill}>{audiobook.chapters.length} banis</span>
              </div>

              <div className={styles.description}>
                <p className={styles.descText}>{showFullDescription ? audiobook.description : firstParagraph}</p>
                <button type="button" className={styles.moreButton} onClick={() => setShowFullDescription(!showFullDescription)}>
                  {showFullDescription ? 'Show less' : 'Read full description'}
                </button>
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
                    <span className={styles.playerLabel}>{isPlaying ? 'Now playing' : 'Ready to play'}</span>
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
                <button type="button" className={styles.secondaryButton}>
                  <FaDownload aria-hidden="true" /> Download
                </button>
                <button
                  type="button"
                  className={`${styles.iconButton} ${liked ? styles.iconButtonOn : ''}`}
                  onClick={() => setLiked(!liked)}
                  aria-pressed={liked}
                  aria-label={liked ? 'Unlike' : 'Like'}
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
                <button type="button" className={styles.iconButton} aria-label="Share">
                  <FaShareAlt />
                </button>
              </div>
            </div>
          </section>

          {/* Chapters */}
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
                        <p className={styles.chapterText}>{chapter.title}, a sacred composition from Guru Granth Sahib.</p>
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
          {renderRelated([...related].reverse(), recommendedRef, 'Because you liked Gurbani Kirtan')}
        </aside>
      </div>
    </div>
  );
};

export default AudiobookDetail;
