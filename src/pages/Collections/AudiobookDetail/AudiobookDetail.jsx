import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaBookmark, FaRegBookmark, FaShareAlt, FaChevronLeft, FaChevronRight, FaStar, FaRegStar, FaSort, FaPlay, FaPause } from 'react-icons/fa';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import { Link } from 'react-router-dom';
import styles from './AudiobookDetail.module.css';
import Loader from '../../../components/Loader'


// Utility function to handle production image paths
const useProductionImagePath = () => {
  return (imagePath) => {
    if (process.env.NODE_ENV === 'production') {
      if (typeof imagePath === 'string') {
        return imagePath.startsWith('/') 
          ? imagePath 
          : `/${imagePath.replace(/.*static\/media/, 'static/media')}`;
      } else {
        return imagePath.default || imagePath;
      }
    }
    return imagePath;
  };
};

const AudiobookDetail = ({ isDarkMode }) => {
  const getImagePath = useProductionImagePath();
  const { id } = useParams();
  const navigate = useNavigate();
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
  
  // Image paths
  const header_image_dark = "/images/Collections/header-image-dark.png";
  const header_image_light = "/images/Collections/header-image-light.png";
  const bookImage = "/images/Collections/book-image.jpg";
  const audioFile = "/images/Collections/Nitnem.mp3";

  // Review form state
  const [reviewForm, setReviewForm] = useState({
    name: '',
    email: '',
    rating: 0,
    review: '',
  });
  const [reviews, setReviews] = useState([]);
  const [visibleReviews, setVisibleReviews] = useState(5);
  const [sortBy, setSortBy] = useState('newest');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Audio player controls
  const togglePlayPause = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    setDuration(audioRef.current.duration);
  };

  const handleSeek = (e) => {
    const seekTime = e.target.value;
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  useEffect(() => {
    const fetchAudiobook = async () => {
      setIsLoading(true);
      setTimeout(() => {
        setAudiobook({
          id,
          title: "Nitnem",
          author: "Guru Granth Sahib",
          cover: bookImage,
          rating: 4.9,
          reviews: 1842,
          length: "2 hours 45 minutes",
          format: "MP3",
          genre: "Spiritual",
          description: `Nitnem is a collection of Sikh hymns (Gurbani) to be read daily by devout Sikhs. These hymns are recited at specific times throughout the day and are considered essential for spiritual growth and connection with the Divine.

          The Nitnem banis include Japji Sahib, Jaap Sahib, Tav-Prasad Savaiye, Chaupai Sahib, and Anand Sahib. These sacred compositions by the Sikh Gurus provide guidance, inspiration, and a framework for daily spiritual practice.`,
          chapters: [
            { id: 1, title: "Japji Sahib", duration: "20:15", locked: false },
            { id: 2, title: "Jaap Sahib", duration: "15:30", locked: false },
            { id: 3, title: "Tav-Prasad Savaiye", duration: "08:45", locked: false },
            { id: 4, title: "Chaupai Sahib", duration: "12:20", locked: true },
            { id: 5, title: "Anand Sahib", duration: "18:40", locked: true },
          ],
        });
        
        // Mock reviews data
        const mockReviews = Array.from({ length: 20 }, (_, i) => ({
          id: i + 1,
          name: ['Amrit', 'Gurpreet', 'Harpreet', 'Jaspreet', 'Manpreet', 'Navpreet'][i % 6],
          date: new Date(Date.now() - (i * 86400000)).toLocaleDateString(),
          rating: [4, 5, 3, 4, 5, 4, 3, 5, 4, 5][i % 10],
          review: [
            "This audiobook brings peace to my daily routine. The recitation is beautiful!",
            "A must-have for every Sikh household. Perfect for morning meditation.",
            "The pronunciation is very clear and easy to follow along.",
            "Listening to Nitnem while commuting has transformed my day.",
            "The audio quality is excellent and the voice is very soothing.",
            "Helps me maintain my daily spiritual practice even when traveling.",
            "Would be better with translations included.",
            "The chapters are perfectly timed for daily listening.",
            "I love how this preserves the traditional way of reciting Gurbani.",
            "The ending shabads give me chills every time."
          ][i % 10],
          helpful: Math.floor(Math.random() * 50)
        }));
        
        setReviews(mockReviews);
        setIsLoading(false);
        
        // Simulate separate loading for related books
        setTimeout(() => {
          setAudiobook(prev => ({
            ...prev,
            related: [
              { id: 201, title: "Sukhmani Sahib", author: "Guru Arjan Dev", cover: bookImage },
              { id: 202, title: "Asa Di Var", author: "Guru Nanak Dev", cover: bookImage },
              { id: 203, title: "Rehras Sahib", author: "Guru Granth Sahib", cover: bookImage },
              { id: 204, title: "Kirtan Sohila", author: "Guru Granth Sahib", cover: bookImage },
              { id: 205, title: "Gurbani Kirtan", author: "Various Ragis", cover: bookImage },
              { id: 206, title: "Sukhmani Sahib", author: "Guru Arjan Dev", cover: bookImage },
              { id: 207, title: "Asa Di Var", author: "Guru Nanak Dev", cover: bookImage },
              { id: 208, title: "Rehras Sahib", author: "Guru Granth Sahib", cover: bookImage },
              { id: 209, title: "Kirtan Sohila", author: "Guru Granth Sahib", cover: bookImage },
              { id: 210, title: "Gurbani Kirtan", author: "Various Ragis", cover: bookImage },
            ]
          }));
          setRelatedLoading(false);
        }, 1500);
      }, 1000);
    };
    fetchAudiobook();
  }, [id]);

  const toggleChapter = (chapterId) => {
    setExpandedChapter(expandedChapter === chapterId ? null : chapterId);
  };

  const handleListenChapter = (chapterId) => {
    // In a real app, this would load the specific chapter audio
    audioRef.current.currentTime = 0;
    audioRef.current.play();
    setIsPlaying(true);
  };

  const scrollRelated = (direction, sectionId) => {
    const container = document.querySelector(`.${styles.relatedScrollContainer}[data-section="${sectionId}"]`);
    const scrollAmount = direction === 'left' ? -300 : 300;
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const handleRatingChange = (rating) => {
    setReviewForm({ ...reviewForm, rating });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setReviewForm({ ...reviewForm, [name]: value });
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    setTimeout(() => {
      const newReview = {
        id: reviews.length + 1,
        name: reviewForm.name,
        date: new Date().toLocaleDateString(),
        rating: reviewForm.rating,
        review: reviewForm.review,
        helpful: 0
      };
      
      setReviews([newReview, ...reviews]);
      setReviewForm({
        name: '',
        email: '',
        rating: 0,
        review: '',
      });
      setIsSubmitting(false);
    }, 1000);
  };

  const loadMoreReviews = () => {
    setVisibleReviews(prev => prev + 5);
  };

  const toggleHelpful = (reviewId) => {
    setReviews(reviews.map(review => 
      review.id === reviewId 
        ? { ...review, helpful: review.helpful + 1 } 
        : review
    ));
  };

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === 'newest') {
      return b.id - a.id;
    } else {
      return b.helpful - a.helpful;
    }
  });

  const displayedReviews = sortedReviews.slice(0, visibleReviews);

  if (isLoading) {
    return <div className={styles.audiobookDetailContainer}><Loader/></div>;
  }

  return (
    <div className={styles.audiobookDetailContainer}>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={audioFile}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />
      
      <div className={styles.headerImageSection}>
        <img
          src={getImagePath(isDarkMode ? header_image_dark : header_image_light)}
          alt="Header"
          className={styles.headerImage}
        />
        <div className={styles.headerText}>
          <h1>NITNEM</h1>
          <p>Daily prayers from Guru Granth Sahib</p>
        </div>
      </div>

      <div className={styles.breadcrumb}>
        <Link to="/">
          <span>Home</span>
        </Link>{" "}
        /{" "}
        <Link to="/collections">
          <span> Collections</span>
        </Link>{" "}
        /{" "}
        <Link to="/collections/audiobooks">
          <span> Audiobooks</span>
        </Link>{" "}
        / <span> Nitnem</span>
      </div>

      <div className={styles.mainContentContainer}>
        <div className={styles.leftColumn}>
          <div className={styles.heroSection}>
            <div className={styles.coverContainer}>
              <img 
                src={getImagePath(audiobook.cover)} 
                alt={audiobook.title} 
                className={styles.audiobookCover}
              />
            </div>

            <div className={styles.detailsContainer}>
              <div className={styles.metaHeader}>
                <span className={styles.genre}>{audiobook.genre}</span>
                <div className={styles.rating}>
                  ⭐ {audiobook.rating} <span className={styles.reviews}>({audiobook.reviews} reviews)</span>
                </div>
              </div>

              <h1 className={styles.title}>{audiobook.title}</h1>
              <h2 className={styles.author}>By {audiobook.author}</h2>

              <div className={styles.metaFooter}>
                <span>{audiobook.length}</span>
                <span>•</span>
                <span>{audiobook.format}</span>
              </div>

              <div className={styles.descriptionContainer}>
                <h3 className={styles.sectionTitle}>Description</h3>
                <div className={styles.descriptionText}>
                  {showFullDescription ? audiobook.description : `${audiobook.description.split('\n')[0]}\n\n${audiobook.description.split('\n')[1]}`}
                  <button 
                    className={styles.showMoreButton}
                    onClick={() => setShowFullDescription(!showFullDescription)}
                  >
                    {showFullDescription ? 'Show Less' : 'Show More'}
                  </button>
                </div>
              </div>

              {/* Audio Player Controls */}
              <div className={styles.audioPlayer}>
                <div className={styles.progressContainer}>
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className={styles.progressBar}
                  />
                  <div className={styles.timeDisplay}>
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
              </div>

              <div className={styles.actionButtons}>
                <button 
                  className={styles.primaryButton}
                  onClick={togglePlayPause}
                >
                  {isPlaying ? <FaPause /> : <FaPlay />}
                  {isPlaying ? 'Pause' : 'Listen Now'}
                </button>
                <button className={styles.secondaryButton}>Download</button>
                <button 
                  className={styles.iconButton} 
                  onClick={() => setLiked(!liked)}
                  aria-label={liked ? "Unlike" : "Like"}
                >
                  {liked ? <FaHeart color="red" /> : <FaRegHeart />}
                </button>
                <button 
                  className={styles.iconButton}
                  onClick={() => setSaved(!saved)}
                  aria-label={saved ? "Unsave" : "Save for later"}
                >
                  {saved ? <FaBookmark color="var(--icon-color)" /> : <FaRegBookmark />}
                </button>
                <button className={styles.iconButton} aria-label="Share">
                  <FaShareAlt />
                </button>
              </div>
            </div>
          </div>

          <section className={styles.chaptersSection}>
            <h3 className={styles.sectionTitle}>Chapters</h3>
            <div className={styles.chaptersList}>
              {audiobook.chapters.map((chapter) => (
                <div key={chapter.id} className={styles.chapterItem}>
                  <div 
                    className={styles.chapterHeader}
                    onClick={() => toggleChapter(chapter.id)}
                  >
                    <span className={styles.chapterNumber}>Chapter {chapter.id}</span>
                    <h4 className={styles.chapterTitle}>{chapter.title}</h4>
                    <span className={styles.chapterDuration}>{chapter.duration}</span>
                    {expandedChapter === chapter.id ? <IoIosArrowUp /> : <IoIosArrowDown />}
                  </div>
                  {expandedChapter === chapter.id && (
                    <div className={styles.chapterContent}>
                      <p className={styles.chapterSummary}>
                        This chapter contains {chapter.title}. A sacred composition from Guru Granth Sahib.
                      </p>
                      {chapter.locked ? (
                        <button className={styles.lockedButton}>Unlock with Premium</button>
                      ) : (
                        <button 
                          className={styles.listenChapterButton}
                          onClick={() => handleListenChapter(chapter.id)}
                        >
                          Listen to This Audiobook
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Reviews Section (same as EbookDetail) */}
          <section className={styles.reviewsSection}>
            <h3 className={styles.sectionTitle}>Ratings & Reviews</h3>
            
            <div className={styles.reviewFormContainer}>
              <h4>Write a Review</h4>
              <form onSubmit={handleSubmitReview}>
                <div className={styles.formGroup}>
                  <label htmlFor="name">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={reviewForm.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={reviewForm.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label>Rating</label>
                  <div className={styles.ratingInput}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingChange(star)}
                        className={styles.starButton}
                      >
                        {star <= reviewForm.rating ? (
                          <FaStar className={styles.starFilled} />
                        ) : (
                          <FaRegStar className={styles.starEmpty} />
                        )}
                      </button>
                    ))}
                    <span className={styles.ratingText}>
                      {reviewForm.rating > 0 ? `${reviewForm.rating} star${reviewForm.rating !== 1 ? 's' : ''}` : 'Select rating'}
                    </span>
                  </div>
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="review">Your Review</label>
                  <textarea
                    id="review"
                    name="review"
                    value={reviewForm.review}
                    onChange={handleInputChange}
                    rows="4"
                    required
                  />
                </div>
                
                <button 
                  type="submit" 
                  className={styles.submitReviewButton}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>
            
            <div className={styles.reviewsListContainer}>
              <div className={styles.reviewsHeader}>
                <h4>{reviews.length} Reviews</h4>
                <div className={styles.sortDropdown}>
                  <FaSort className={styles.sortIcon} />
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className={styles.sortSelect}
                  >
                    <option value="newest">Newest First</option>
                    <option value="top">Top Comments</option>
                  </select>
                </div>
              </div>
              
              <div className={styles.reviewsList}>
                {displayedReviews.map((review) => (
                  <div key={review.id} className={styles.reviewItem}>
                    <div className={styles.reviewHeader}>
                      <div className={styles.reviewerInfo}>
                        <div className={styles.reviewerInitial}>{review.name.charAt(0)}</div>
                        <div>
                          <div className={styles.reviewerName}>{review.name}</div>
                          <div className={styles.reviewDate}>{review.date}</div>
                        </div>
                      </div>
                      <div className={styles.reviewRating}>
                        {[...Array(5)].map((_, i) => (
                          i < review.rating ? 
                            <FaStar key={i} className={styles.starFilled} /> : 
                            <FaRegStar key={i} className={styles.starEmpty} />
                        ))}
                      </div>
                    </div>
                    <div className={styles.reviewContent}>
                      {review.review}
                    </div>
                    <div className={styles.reviewActions}>
                      <button 
                        className={styles.helpfulButton}
                        onClick={() => toggleHelpful(review.id)}
                      >
                        Helpful ({review.helpful})
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {visibleReviews < reviews.length && (
                <button 
                  className={styles.loadMoreButton}
                  onClick={loadMoreReviews}
                >
                  Show More Reviews
                </button>
              )}
            </div>
          </section>
        </div>

        <div className={styles.rightColumn}>
          <section className={styles.relatedSection}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Related Audiobooks</h3>
              <div className={styles.scrollButtons}>
                <button onClick={() => scrollRelated('left', 'related')} className={styles.scrollButton}>
                  <FaChevronLeft />
                </button>
                <button onClick={() => scrollRelated('right', 'related')} className={styles.scrollButton}>
                  <FaChevronRight />
                </button>
              </div>
            </div>
            <div 
              className={styles.relatedScrollContainer} 
              data-section="related"
            >
              <div className={styles.relatedGrid}>
                {relatedLoading ? (
                  Array(5).fill().map((_, index) => (
                    <RelatedCardSkeleton key={`related-skeleton-${index}`} />
                  ))
                ) : (
                  audiobook.related.map((book) => (
                    <div key={book.id} className={styles.relatedCard} onClick={() => navigate(`/audiobooks/${book.id}`)}>
                      <div className={styles.relatedImageContainer}>
                        <img src={getImagePath(book.cover)} alt={book.title} className={styles.relatedCover} />
                      </div>
                      <div className={styles.relatedInfo}>
                        <h4 className={styles.relatedTitle}>{book.title}</h4>
                        <p className={styles.relatedAuthor}>{book.author}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <section className={styles.recommendedSection}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Because you liked Gurbani Kirtan</h3>
              <div className={styles.scrollButtons}>
                <button onClick={() => scrollRelated('left', 'recommended')} className={styles.scrollButton}>
                  <FaChevronLeft />
                </button>
                <button onClick={() => scrollRelated('right', 'recommended')} className={styles.scrollButton}>
                  <FaChevronRight />
                </button>
              </div>
            </div>
            <div 
              className={styles.relatedScrollContainer} 
              data-section="recommended"
            >
              <div className={styles.relatedGrid}>
                {relatedLoading ? (
                  Array(5).fill().map((_, index) => (
                    <RelatedCardSkeleton key={`recommended-skeleton-${index}`} />
                  ))
                ) : (
                  [...audiobook.related].reverse().map((book) => (
                    <div key={book.id} className={styles.relatedCard} onClick={() => navigate(`/audiobooks/${book.id}`)}>
                      <div className={styles.relatedImageContainer}>
                        <img src={getImagePath(book.cover)} alt={book.title} className={styles.relatedCover} />
                      </div>
                      <div className={styles.relatedTextContent}>
                        <h4 className={styles.relatedTitle}>{book.title}</h4>
                        <p className={styles.relatedAuthor}>{book.author}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const RelatedCardSkeleton = () => {
  return (
    <div className={styles.relatedCard}>
      <div className={styles.skeletonRelatedImageContainer}>
      </div>
      <div className={styles.relatedCardText}>
        <div className={styles.skeletonRelatedTitle}></div>
        <div className={styles.skeletonRelatedAuthor}></div>
      </div>
    </div>
  );
};

export default AudiobookDetail;