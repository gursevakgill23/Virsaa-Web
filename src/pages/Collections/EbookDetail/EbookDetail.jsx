import React, { useState, useEffect, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaBookmark, FaRegBookmark, FaShareAlt, FaChevronLeft, FaChevronRight, FaStar, FaRegStar, FaSort } from 'react-icons/fa';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import { Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from './EbookDetail.module.css';
import Loader from '../../../components/Loader';
import { useAuth } from '../../../context/AuthContext.jsx';
import axios from 'axios';
import { PDFViewer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// S3 base URL (updated to match the response)
const S3_BASE_URL = 'https://virsaa-media-2025.s3.amazonaws.com';

// PDF styles
const pdfStyles = StyleSheet.create({
  page: {
    backgroundColor: '#FFF',
    padding: 20,
    flexDirection: 'column',
    fontSize: 12,
    fontFamily: 'Helvetica',
  },
  coverPage: {
    backgroundColor: 'white',
    padding: 40,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  coverAuthor: {
    fontSize: 16,
    marginBottom: 10,
    color: '#666',
  },
  chapterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  content: {
    lineHeight: 1.5,
    color: '#444',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 10,
    right: 20,
    fontSize: 10,
    color: '#666',
  },
});

// Utility function to handle S3-based images paths
const useProductionImagePath = () => {
  return (imagePath) => {
    if (!imagePath) {
      return `${S3_BASE_URL}/images/Collections/book-image.jpg`;
    }
    if (typeof imagePath === 'string' && imagePath.startsWith('https://')) {
      return imagePath;
    }
    return imagePath || `${S3_BASE_URL}/images/Collections/book-image.jpg`;
  };
};

// Utility function to handle public/static images
const getProductionImagePath = (imagePath) => {
  if (process.env.NODE_ENV === 'development') {
    if (typeof imagePath === 'string') {
      return imagePath.startsWith('/')
        ? imagePath
        : `/${imagePath.replace(/.*static\/media/, 'static/media/')}`;
    }
    return imagePath?.default || imagePath || '/images/Collections/book-image.jpg';
  }
  return imagePath || '/images/Collections/book-image.jpg';
};

// PDF Document Component
const MyDocument = ({ ebook }) => (
  <Document>
    {/* Cover Page */}
    <Page size="A4" style={pdfStyles.coverPage}>
      <View>
        <Text style={pdfStyles.coverTitle}>{ebook?.title || 'Untitled Ebook'}</Text>
        <Text style={pdfStyles.coverAuthor}>{ebook?.author || 'Unknown Author'}</Text>
      </View>
    </Page>
    {/* Chapter Pages */}
    {ebook?.chapters?.map((chapter, index) => (
      <Page key={chapter.id} size="A4" style={pdfStyles.page}>
        <View>
          <Text style={pdfStyles.chapterTitle}>
            Chapter {chapter.id}:: {chapter.title}
          </Text>
          <Text style={pdfStyles.content}>
            This is a placeholder for the content of {chapter.title}. Actual content would be fetched from the backend or provided in the PDF file.
          </Text>
        </View>
        <Text style={pdfStyles.pageNumber}>Page {index + 2}</Text>
      </Page>
    ))}
    {/* Additional Pages if Needed */}
    {Array.from({ length: (ebook?.pages || 0) - (ebook?.chapters?.length || 0) - 1 }, (_, index) => (
      <Page key={`extra-${index}`} size="A4" style={pdfStyles.page}>
        <View>
          <Text style={pdfStyles.content}>
            Page {ebook?.chapters?.length + index + 2} content. This is a placeholder for additional pages.
          </Text>
        </View>
        <Text style={pdfStyles.pageNumber}>Page {ebook?.chapters?.length + index + 2}</Text>
      </Page>
    ))}
  </Document>
);

const EbookDetail = ({ isDarkMode, apiString }) => {
  const { isLoggedIn, accessToken, userData } = useAuth();
  const getS3ImagePath = useProductionImagePath();
  const getStaticImagePath = getProductionImagePath;
  const { id } = useParams();
  const navigate = useNavigate();
  const [ebook, setEbook] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expandedChapter, setExpandedChapter] = useState(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(null);

  // Image paths
  const header_image_dark = getStaticImagePath("/images/Collections/header-image-dark.png");
  const header_image_light = getStaticImagePath("/images/Collections/header-image-light.png");

  // Review form state
  const [reviewForm, setReviewForm] = useState({
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
      try {
        const apiUrl = apiString ? apiString.replace(/\/$/, '') : 'http://localhost:8000'; // Use prop with fallback
        const ebookResponse = await axios.get(`${apiUrl}/collections/ebooks/${id}/`);
        if (!ebookResponse.data) {
          throw new Error('Failed to fetch ebook details');
        }
        const ebookData = ebookResponse.data;
        // Map author ID to name (assuming a simple mapping; adjust if a separate API call is needed)
        const authorName = ebookData.author ? `Author ${ebookData.author}` : 'Unknown Author'; // Placeholder
        setEbook({
          ...ebookData,
          cover: ebookData.cover_image,
          author: authorName,
          reviews: Array.isArray(ebookData.reviews) ? ebookData.reviews.length : 0,
          chapters: ebookData.chapters || [],
          pdf_file: ebookData.pdf_file, // Directly use pdf_file from response
        });

        const reviewsResponse = await axios.get(`${apiUrl}/collections/ebooks/${id}/reviews/`);
        if (reviewsResponse.data) {
          setReviews(reviewsResponse.data.map(review => ({
            id: review.id || Date.now() + Math.random(), // Fallback if no id
            name: review.user || 'Anonymous',
            date: new Date(review.date).toLocaleDateString(),
            rating: review.rating || 0,
            review: review.review || 'No review text',
            helpful: review.helpful || 0,
          })));
        }

        setTimeout(async () => {
          const relatedResponse = await axios.get(`${apiUrl}/collections/ebooks/?author__name=${encodeURIComponent(authorName)}`);
          if (relatedResponse.data) {
            const relatedData = relatedResponse.data;
            setEbook(prev => ({
              ...prev,
              related: relatedData
                .filter(item => item.id !== parseInt(id))
                .slice(0, 10)
                .map(item => ({
                  id: item.id,
                  title: item.title,
                  author: item.author ? `Author ${item.author}` : 'Unknown Author', // Placeholder
                  cover: item.cover_image,
                })),
            }));
          }
          setRelatedLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching ebook data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEbook();
  }, [id, apiString]);

  const handleReadNow = async () => {
    setPdfLoading(true);
    setPdfError(null);
    try {
      const apiUrl = apiString ? apiString.replace(/\/$/, '') : 'http://localhost:8000';
      if (isLoggedIn && accessToken) {
        const response = await axios.get(`${apiUrl}/collections/ebooks/${id}/read_pdf/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (response.data && response.data.pdf_url) {
          setPdfUrl(response.data.pdf_url);
        } else {
          setPdfUrl(ebook.pdf_file); // Fallback to pdf_file if read_pdf endpoint returns nothing
        }
      } else {
        setPdfUrl(ebook.pdf_file); // Public access fallback
      }
      setShowPdfModal(true);
    } catch (error) {
      console.error('Error fetching PDF URL:', error);
      setPdfError(error.message || 'Failed to load PDF. Falling back to generated PDF.');
      setShowPdfModal(true);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleLike = () => {
    setLiked(!liked);
    toast.success(liked ? 'Ebook unliked!' : 'Ebook liked!', {
      position: 'top-right',
      autoClose: 3000,
    });
  };

  const toggleChapter = (chapterId) => {
    setExpandedChapter(expandedChapter === chapterId ? null : chapterId);
  };

  const handleReadChapter = (chapterId) => {
    toast.info(`Reading Chapter ${chapterId}`, {
      position: 'top-right',
      autoClose: 3000,
    });
  };

  const scrollRelated = (direction, sectionId) => {
    const container = document.querySelector(`.${styles.relatedScrollContainer}[data-section="${sectionId}"]`);
    if (container) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleRatingChange = (rating) => {
    setReviewForm({ ...reviewForm, rating });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setReviewForm({ ...reviewForm, [name]: value });
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.warn('Please log in to submit a review.', {
        position: 'top-right',
        autoClose: 3000,
      });
      navigate('/login');
      return;
    }
    setIsSubmitting(true);
    try {
      const apiUrl = apiString ? apiString.replace(/\/$/, '') : 'http://localhost:8000';
      const response = await axios.post(
        `${apiUrl}/collections/reviews/`,
        {
          ebook_id: id,
          rating: reviewForm.rating,
          review: reviewForm.review,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
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
      toast.success('Review submitted successfully!', {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (error) {
      console.error('Error submitting review:', error.response?.data || error);
      toast.error('Failed to submit review. Please try again.', {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
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
    }
    return b.helpful - a.helpful;
  });

  const displayedReviews = sortedReviews.slice(0, visibleReviews);

  const truncatedDescription = ebook?.description
    ? ebook.description.split(' ').slice(0, 7).join(' ') + (ebook.description.split(' ').length > 7 ? '...' : '')
    : '';

  if (isLoading) {
    return (
      <div className={styles.ebookDetailContainer}>
        <Loader />
      </div>
    );
  }

  if (!ebook) {
    return (
      <div className={styles.ebookDetailContainer}>
        Ebook not found
      </div>
    );
  }

  return (
    <div className={styles.ebookDetailContainer}>
      <ToastContainer />
      <div className={styles.headerImageSection}>
        <img
          src={getStaticImagePath(isDarkMode ? header_image_dark : header_image_light)}
          alt="Header"
          className={styles.headerImage}
          onError={(e) => console.error('Header image failed to load:', e)}
        />
        <div className={styles.headerText}>
          <h1>{ebook.title.toUpperCase()}</h1>
          <p>{truncatedDescription}</p>
        </div>
      </div>

      <nav className={styles.breadcrumb}>
        <Link to="/">Home</Link> /{" "}
        <Link to="/collections">Collections</Link> /{" "}
        <Link to="/collections/ebooks">Ebooks</Link> /{" "}
        <span>{ebook.title}</span>
      </nav>

      <div className={styles.mainContentContainer}>
        <div className={styles.leftColumn}>
          <section className={styles.heroSection}>
            <div className={styles.coverContainer}>
              <img
                src={getS3ImagePath(ebook.cover)}
                alt={ebook.title}
                className={styles.ebookCover}
                onError={(e) => console.error(`Ebook cover failed to load: ${ebook.cover}`, e)}
              />
            </div>

            <div className={styles.detailsContainer}>
              <div className={styles.metaHeader}>
                <span className={styles.genre}>{ebook.genre || 'Unknown Genre'}</span>
                <div className={styles.rating}>
                  ⭐ {ebook.rating || 0} <span className={styles.reviews}>({ebook.reviews} reviews)</span>
                </div>
              </div>

              <h1 className={styles.title}>{ebook.title}</h1>
              <h2 className={styles.author}>By {ebook.author}</h2>

              <div className={styles.metaFooter}>
                <span>{ebook.pages} pages</span>
                <span>•</span>
                <span>PDF/EPUB</span>
              </div>

              <div className={styles.descriptionContainer}>
                <h3 className={styles.sectionTitle}>Description</h3>
                <div className={styles.descriptionText}>
                  {showFullDescription ? ebook.description : `${ebook.description.split('\n')[0]}\n\n${ebook.description.split('\n')[1] || ''}`}
                  <button
                    className={styles.showMoreButton}
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    aria-label={showFullDescription ? "Show less description" : "Show more description"}
                  >
                    {showFullDescription ? 'Show Less' : 'Show More'}
                  </button>
                </div>
              </div>

              <div className={styles.actionButtons}>
                <button
                  className={styles.primaryButton}
                  onClick={handleReadNow}
                  disabled={pdfLoading}
                  aria-label="Read ebook now"
                >
                  {pdfLoading ? 'Loading...' : 'Read Now'}
                </button>
                <button
                  className={styles.secondaryButton}
                  onClick={handleLike}
                  aria-label={liked ? "Unlike ebook" : "Like ebook"}
                >
                  {liked ? 'Unlike PDF' : 'Like PDF'}
                </button>
                <button
                  className={styles.iconButton}
                  onClick={() => setSaved(!saved)}
                  aria-label={saved ? "Unsave ebook" : "Save ebook for later"}
                >
                  {saved ? <FaBookmark color="var(--icon-color)" /> : <FaRegBookmark />}
                </button>
                <button
                  className={styles.iconButton}
                  aria-label="Share ebook"
                >
                  <FaShareAlt />
                </button>
              </div>
            </div>
          </section>

          <section className={styles.chaptersSection}>
            <h3 className={styles.sectionTitle}>Chapters</h3>
            <div className={styles.chaptersList}>
              {ebook.chapters.map((chapter) => (
                <Fragment key={chapter.id}>
                  <div className={styles.chapterItem}>
                    <div
                      className={styles.chapterHeader}
                      onClick={() => toggleChapter(chapter.id)}
                      role="button"
                      tabIndex={0}
                      aria-expanded={expandedChapter === chapter.id}
                      aria-label={`Toggle chapter ${chapter.title}`}
                    >
                      <span className={styles.chapterNumber}>Chapter {chapter.id}</span>
                      <h4 className={styles.chapterTitle}>{chapter.title}</h4>
                      <span className={styles.chapterPage}>Order {chapter.order}</span>
                      {expandedChapter === chapter.id ? <IoIosArrowUp /> : <IoIosArrowDown />}
                    </div>
                    {expandedChapter === chapter.id && (
                      <div className={styles.chapterContent}>
                        <p className={styles.chapterSummary}>
                          This chapter details {chapter.title.toLowerCase()}.
                        </p>
                        <button
                          className={styles.readChapterButton}
                          onClick={() => handleReadChapter(chapter.id)}
                          aria-label={`Read chapter ${chapter.title}`}
                        >
                          Read This Chapter
                        </button>
                      </div>
                    )}
                  </div>
                </Fragment>
              ))}
            </div>
          </section>

          <section className={styles.reviewsSection}>
            <h3 className={styles.sectionTitle}>Ratings & Reviews</h3>

            <div className={styles.reviewFormContainer}>
              <h4>Write a Review</h4>
              {!isLoggedIn ? (
                <p>
                  Please <Link to="/login">log in</Link> to submit a review.
                </p>
              ) : (
                <form onSubmit={handleSubmitReview} aria-label="Submit a review">
                  <div className={styles.formGroup}>
                    <label>Rating</label>
                    <div className={styles.ratingInput}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleRatingChange(star)}
                          className={styles.starButton}
                          aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
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
                      aria-required="true"
                    />
                  </div>

                  <button
                    type="submit"
                    className={styles.submitReviewButton}
                    disabled={isSubmitting || reviewForm.rating === 0}
                    aria-label="Submit review"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              )}
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
                    aria-label="Sort reviews"
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
                          <Fragment key={i}>
                            {i < review.rating ? (
                              <FaStar className={styles.starFilled} aria-label="Filled star" />
                            ) : (
                              <FaRegStar className={styles.starEmpty} aria-label="Empty star" />
                            )}
                          </Fragment>
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
                        aria-label={`Mark review by ${review.name} as helpful`}
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
                  aria-label="Load more reviews"
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
                <button
                  onClick={() => scrollRelated('left', 'related')}
                  className={styles.scrollButton}
                  aria-label="Scroll left through related books"
                >
                  <FaChevronLeft />
                </button>
                <button
                  onClick={() => scrollRelated('right', 'related')}
                  className={styles.scrollButton}
                  aria-label="Scroll right through related books"
                >
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
                    <div
                      key={book.id}
                      className={styles.relatedCard}
                      onClick={() => navigate(`/collections/ebooks/ebook/${book.id}`)}
                      role="button"
                      tabIndex={0}
                      aria-label={`View details for ${book.title}`}
                    >
                      <div className={styles.relatedImageContainer}>
                        <img
                          src={getS3ImagePath(book.cover)}
                          alt={book.title}
                          className={styles.relatedCover}
                          onError={(e) => console.error(`Related book cover failed to load: ${book.cover}`, e)}
                        />
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
              <h3 className={styles.sectionTitle}>Because you liked {ebook.title}</h3>
              <div className={styles.scrollButtons}>
                <button
                  onClick={() => scrollRelated('left', 'recommended')}
                  className={styles.scrollButton}
                  aria-label="Scroll left through recommended books"
                >
                  <FaChevronLeft />
                </button>
                <button
                  onClick={() => scrollRelated('right', 'recommended')}
                  className={styles.scrollButton}
                  aria-label="Scroll right through recommended books"
                >
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
                  [...ebook.related].reverse().map((book) => (
                    <div
                      key={book.id}
                      className={styles.relatedCard}
                      onClick={() => navigate(`/collections/ebooks/ebook/${book.id}`)}
                      role="button"
                      tabIndex={0}
                      aria-label={`View details for ${book.title}`}
                    >
                      <div className={styles.relatedImageContainer}>
                        <img
                          src={getS3ImagePath(book.cover)}
                          alt={book.title}
                          className={styles.relatedCover}
                          onError={(e) => console.error(`Recommended book cover failed to load: ${book.cover}`, e)}
                        />
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
        </div>
      </div>

      {showPdfModal && (
        <div className={styles.pdfModal}>
          <div className={styles.pdfModalContent}>
            <div className={styles.pdfModalHeader}>
              <h2>{ebook.title}</h2>
              <button
                onClick={() => setShowPdfModal(false)}
                className={styles.closeModalButton}
                aria-label="Close PDF modal"
              >
                Close
              </button>
            </div>
            <div className={styles.pdfModalBody}>
              {pdfError && !pdfUrl ? (
                <div>
                  <p className={styles.pdfError}>{pdfError}</p>
                  <PDFViewer width="100%" height="100%" showToolbar={true}>
                    <MyDocument ebook={ebook} />
                  </PDFViewer>
                </div>
              ) : pdfLoading ? (
                <Loader />
              ) : pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  width="100%"
                  height="100%"
                  title="Ebook PDF"
                  style={{ border: 'none' }}
                  onError={(e) => console.error('Failed to load PDF iframe:', e)}
                />
              ) : (
                <PDFViewer width="100%" height="100%" showToolbar={true}>
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

const RelatedCardSkeleton = () => (
  <div className={styles.relatedCard}>
    <div className={styles.skeletonRelatedImageContainer}></div>
    <div className={styles.relatedInfo}>
      <div className={styles.skeletonRelatedTitle}></div>
      <div className={styles.skeletonRelatedAuthor}></div>
    </div>
  </div>
);

export default EbookDetail;