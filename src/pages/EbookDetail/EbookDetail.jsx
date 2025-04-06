import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaBookmark, FaRegBookmark, FaShareAlt, FaChevronLeft, FaChevronRight, FaStar, FaRegStar, FaSort } from 'react-icons/fa';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import { Link } from 'react-router-dom';

import skeletonImage from '../../images/skelton-image.png';
import header_image_dark from '../../images/Details/header-image-dark.png';
import header_image_light from '../../images/Details/header-image.png';
import styles from './EbookDetail.module.css';
import bookImage from '../../images/Details/book-image.jpg';

const EbookDetail = ({ isDarkMode }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ebook, setEbook] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expandedChapter, setExpandedChapter] = useState(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  
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

  useEffect(() => {
    const fetchEbook = async () => {
      setIsLoading(true);
      setTimeout(() => {
        setEbook({
          id,
          title: "Heer Ranjha",
          author: "Waris Shah",
          cover: bookImage,
          rating: 4.8,
          reviews: 1243,
          pages: 320,
          format: "PDF/EPUB",
          genre: "Punjabi Poetry",
          description: `Heer Ranjha is one of the most famous tragic romances of the Punjab. The story depicts the love of Heer and her lover Ranjha, and their eventual tragic end. This epic has been written by various poets, but Waris Shah's version is the most notable.

          The story is set in the Punjab region of South Asia, and follows the lives of Heer, a beautiful woman from a wealthy family, and Ranjha, a young man from a poor family. Despite their different social standings, they fall deeply in love. However, their love is forbidden by Heer's family, who arrange for her to marry another man.

          The poem is considered one of the quintessential works of classical Punjabi literature. It tells a story of intense love, separation, and eventual tragedy. Waris Shah's version, written in 1766, is particularly renowned for its lyrical beauty and philosophical depth. The story has been adapted into numerous plays, films, and television series across South Asia.`,
          chapters: [
            { id: 1, title: "Introduction", page: 1, locked: false },
            { id: 2, title: "Heer's Childhood", page: 15, locked: false },
            { id: 3, title: "Meeting Ranjha", page: 32, locked: false },
            { id: 4, title: "Family Opposition", page: 78, locked: true },
            { id: 5, title: "Separation", page: 112, locked: true },
          ],
        });
        
        // Mock reviews data
        const mockReviews = Array.from({ length: 20 }, (_, i) => ({
          id: i + 1,
          name: ['Amanpreet', 'Gurpreet', 'Harpreet', 'Jaspreet', 'Manpreet', 'Navpreet'][i % 6],
          date: new Date(Date.now() - (i * 86400000)).toLocaleDateString(),
          rating: [4, 5, 3, 4, 5, 4, 3, 5, 4, 5][i % 10],
          review: [
            "This book changed my perspective on Punjabi literature. The depth of emotions is incredible!",
            "A timeless classic that everyone should read at least once in their lifetime.",
            "The poetic language is beautiful, though some parts were difficult to understand.",
            "Waris Shah's masterpiece truly captures the essence of Punjabi culture.",
            "I couldn't put it down! The story is so engaging and emotional.",
            "The translation is excellent, making it accessible to non-Punjabi speakers.",
            "A bit overrated in my opinion, but still a good read.",
            "The character development is exceptional, especially Heer's transformation.",
            "I loved how the author portrayed the cultural context of the time.",
            "The ending was heartbreaking but perfect for the story."
          ][i % 10],
          helpful: Math.floor(Math.random() * 50)
        }));
        
        setReviews(mockReviews);
        setIsLoading(false);
        
        // Simulate separate loading for related books
        setTimeout(() => {
          setEbook(prev => ({
            ...prev,
            related: [
              { id: 101, title: "Sohni Mahiwal", author: "Hashim Shah", cover: bookImage },
              { id: 102, title: "Mirza Sahiban", author: "Piloo", cover: bookImage },
              { id: 103, title: "Sassi Punnun", author: "Shah Hussain", cover: bookImage },
              { id: 104, title: "Yusuf Zulekha", author: "Hamid", cover: bookImage },
              { id: 105, title: "Punjab Diyan Lok Kathavan", author: "Devinder Satyarthi", cover: bookImage },
              { id: 106, title: "Sohni Mahiwal", author: "Hashim Shah", cover: bookImage },
              { id: 107, title: "Mirza Sahiban", author: "Piloo", cover: bookImage },
              { id: 108, title: "Sassi Punnun", author: "Shah Hussain", cover: bookImage },
              { id: 109, title: "Yusuf Zulekha", author: "Hamid", cover: bookImage },
              { id: 110, title: "Punjab Diyan Lok Kathavan", author: "Devinder Satyarthi", cover: bookImage },
            ]
          }));
          setRelatedLoading(false);
        }, 1500);
      }, 1000);
    };
    fetchEbook();
  }, [id]);

  const toggleChapter = (chapterId) => {
    setExpandedChapter(expandedChapter === chapterId ? null : chapterId);
  };

  const handleReadChapter = (chapterId) => {
    alert(`Reading Chapter ${chapterId}`);
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
    
    // Simulate API call
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
    return <div className={styles.ebookDetailContainer}>Loading main content...</div>;
  }

  return (
    <div className={styles.ebookDetailContainer}>
      <div className={styles.headerImageSection}>
        <img
          src={isDarkMode ? header_image_dark : header_image_light}
          alt="Header"
          className={styles.headerImage}
        />
        <div className={styles.headerText}>
          <h1>HEER RANJHA</h1>
          <p>Heer Ranjha is one of the most famous tragic romances of the Punjab</p>
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
        <Link to="/collections/ebooks">
          <span> Ebooks</span>
        </Link>{" "}
        / <span> Heer Ranjha</span>
      </div>

      <div className={styles.mainContentContainer}>
        <div className={styles.leftColumn}>
          <div className={styles.heroSection}>
            <div className={styles.coverContainer}>
              <img 
                src={ebook.cover} 
                alt={ebook.title} 
                className={styles.ebookCover}
              />
            </div>

            <div className={styles.detailsContainer}>
              <div className={styles.metaHeader}>
                <span className={styles.genre}>{ebook.genre}</span>
                <div className={styles.rating}>
                  ⭐ {ebook.rating} <span className={styles.reviews}>({ebook.reviews} reviews)</span>
                </div>
              </div>

              <h1 className={styles.title}>{ebook.title}</h1>
              <h2 className={styles.author}>By {ebook.author}</h2>

              <div className={styles.metaFooter}>
                <span>{ebook.pages} pages</span>
                <span>•</span>
                <span>{ebook.format}</span>
              </div>

              <div className={styles.descriptionContainer}>
                <h3 className={styles.sectionTitle}>Description</h3>
                <div className={styles.descriptionText}>
                  {showFullDescription ? ebook.description : `${ebook.description.split('\n')[0]}\n\n${ebook.description.split('\n')[1]}`}
                  <button 
                    className={styles.showMoreButton}
                    onClick={() => setShowFullDescription(!showFullDescription)}
                  >
                    {showFullDescription ? 'Show Less' : 'Show More'}
                  </button>
                </div>
              </div>

              <div className={styles.actionButtons}>
                <button className={styles.primaryButton}>Read Now</button>
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
              {ebook.chapters.map((chapter) => (
                <div key={chapter.id} className={styles.chapterItem}>
                  <div 
                    className={styles.chapterHeader}
                    onClick={() => toggleChapter(chapter.id)}
                  >
                    <span className={styles.chapterNumber}>Chapter {chapter.id}</span>
                    <h4 className={styles.chapterTitle}>{chapter.title}</h4>
                    <span className={styles.chapterPage}>Page {chapter.page}</span>
                    {expandedChapter === chapter.id ? <IoIosArrowUp /> : <IoIosArrowDown />}
                  </div>
                  {expandedChapter === chapter.id && (
                    <div className={styles.chapterContent}>
                      <p className={styles.chapterSummary}>
                        This chapter details {chapter.title.toLowerCase()}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                      </p>
                      {chapter.locked ? (
                        <button className={styles.lockedButton}>Unlock with Premium</button>
                      ) : (
                        <button 
                          className={styles.readChapterButton}
                          onClick={() => handleReadChapter(chapter.id)}
                        >
                          Read This Chapter
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Rating and Reviews Section */}
          <section className={styles.reviewsSection}>
            <h3 className={styles.sectionTitle}>Ratings & Reviews</h3>
            
            {/* Review Form */}
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
            
            {/* Reviews List */}
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
              <h3 className={styles.sectionTitle}>Related Books</h3>
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
                  ebook.related.map((book) => (
                    <div key={book.id} className={styles.relatedCard} onClick={() => navigate(`/ebooks/${book.id}`)}>
                      <div className={styles.relatedImageContainer}>
                        <img src={book.cover} alt={book.title} className={styles.relatedCover} />
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
              <h3 className={styles.sectionTitle}>Because you liked Sassi Punnun</h3>
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
                  [...ebook.related].reverse().map((book, index) => (
                    <div key={book.id} className={styles.relatedCard} onClick={() => navigate(`/ebooks/${book.id}`)}>
                      <div className={styles.relatedImageContainer}>
                        <img src={book.cover} alt={book.title} className={styles.relatedCover} />
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
        <img src={skeletonImage} alt="Loading" className={styles.skeletonImg} />
      </div>
      <div className={styles.relatedCardText}>
      <div className={styles.skeletonRelatedTitle}></div>
      <div className={styles.skeletonRelatedAuthor}></div>
      </div>
    </div>
  );
};

export default EbookDetail;