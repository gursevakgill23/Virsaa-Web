import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaBookmark, FaRegBookmark, FaShareAlt, FaChevronLeft, FaChevronRight, FaStar, FaRegStar, FaPenFancy, FaBook, FaAward } from 'react-icons/fa';
import { Link } from 'react-router-dom';

import skeletonImage from '../../images/skelton-image.png';
import header_image_dark from '../../images/Details/header-image-dark.png';
import header_image_light from '../../images/Details/header-image.png';
import styles from './AuthorDetail.module.css';
import authorImage from '../../images/Details/author-image.jpg';

const AuthorDetail = ({ isDarkMode }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [author, setAuthor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('biography');
  const [showReviewForm, setShowReviewForm] = useState(false);
  
  const [reviewForm, setReviewForm] = useState({
    name: '',
    email: '',
    rating: 0,
    review: '',
  });
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const fetchAuthor = async () => {
      setIsLoading(true);
      setTimeout(() => {
        setAuthor({
          id,
          name: "Waris Shah",
          image: authorImage,
          rating: 4.7,
          reviews: 892,
          born: "1722, Jandiala Sher Khan, Punjab",
          died: "1798, Malka Hans, Punjab",
          genre: "Punjabi Poetry, Sufi Poetry",
          notableWorks: ["Heer Ranjha", "Ishq Daa Waaris"],
          biography: `Waris Shah was an 18th-century Punjabi Sufi poet, renowned for his contribution to Punjabi literature. He is best known for his seminal work Heer Ranjha, based on the traditional folk tale of Heer and her lover Ranjha.

          Born into a Syed family, Waris Shah received his early education in Kasur and later studied at the shrine of Hafiz Ghulam Murtaza in Qasur. His work is characterized by its spiritual depth, lyrical beauty, and profound understanding of human nature.

          Waris Shah's version of Heer Ranjha is considered the most popular and is a landmark in Punjabi literature. His poetry explores themes of divine love, human relationships, and social commentary. He wrote in the Majhi dialect of Punjabi, which became the standard literary language.

          Today, Waris Shah is celebrated as one of the greatest poets in the Punjabi language, and his work continues to influence Punjabi culture, music, and literature.`,
          books: [
            { id: 101, title: "Heer Ranjha", cover: authorImage, rating: 4.8, year: 1766 },
            { id: 102, title: "Ishq Daa Waaris", cover: authorImage, rating: 4.5, year: 1776 },
            { id: 103, title: "Dastan-E-Ranjeet", cover: authorImage, rating: 4.2, year: 1782 },
            { id: 104, title: "Punjabi Diyan Kahanian", cover: authorImage, rating: 4.0, year: 1788 },
          ],
          awards: [
            { name: "Pride of Punjab", year: 1998 },
            { name: "Literary Excellence Award", year: 2005 }
          ]
        });
        
        const mockReviews = Array.from({ length: 15 }, (_, i) => ({
          id: i + 1,
          name: ['Amanpreet', 'Gurpreet', 'Harpreet', 'Jaspreet', 'Manpreet', 'Navpreet'][i % 6],
          date: new Date(Date.now() - (i * 86400000)).toLocaleDateString(),
          rating: [4, 5, 3, 4, 5, 4, 3, 5, 4, 5][i % 10],
          review: [
            "Waris Shah's poetry transcends time and speaks directly to the soul.",
            "A true master of Punjabi literature whose work remains relevant centuries later.",
            "His understanding of human emotions is unparalleled in Punjabi poetry.",
            "The way he blends spiritual themes with human love is remarkable.",
            "Every Punjabi household should have a copy of Heer Ranjha.",
            "His work captures the essence of Punjabi culture beautifully.",
            "A bit difficult to understand at first, but worth the effort.",
            "The depth of his poetry increases with each reading.",
            "His work is the foundation of modern Punjabi literature.",
            "A literary giant whose influence continues to grow."
          ][i % 10],
          helpful: Math.floor(Math.random() * 50)
        }));
        
        setReviews(mockReviews);
        setIsLoading(false);
        
        setTimeout(() => {
          setAuthor(prev => ({
            ...prev,
            relatedAuthors: [
              { id: 201, name: "Bulleh Shah", image: authorImage, genre: "Sufi Poetry" },
              { id: 202, name: "Amrita Pritam", image: authorImage, genre: "Modern Poetry" },
              { id: 203, name: "Shiv Kumar Batalvi", image: authorImage, genre: "Lyrical Poetry" },
              { id: 204, name: "Pash", image: authorImage, genre: "Revolutionary Poetry" },
              { id: 205, name: "Surjit Patar", image: authorImage, genre: "Contemporary Poetry" },
            ]
          }));
          setRelatedLoading(false);
        }, 1500);
      }, 1000);
    };
    fetchAuthor();
  }, [id]);

  const handleRatingChange = (rating) => {
    setReviewForm({ ...reviewForm, rating });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setReviewForm({ ...reviewForm, [name]: value });
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
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
    setShowReviewForm(false);
  };

  const toggleHelpful = (reviewId) => {
    setReviews(reviews.map(review => 
      review.id === reviewId 
        ? { ...review, helpful: review.helpful + 1 } 
        : review
    ));
  };

  const scrollRelated = (direction, sectionId) => {
    const container = document.querySelector(`.${styles.relatedScrollContainer}[data-section="${sectionId}"]`);
    const scrollAmount = direction === 'left' ? -300 : 300;
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  if (isLoading) {
    return <div className={styles.authorDetailContainer}>Loading author details...</div>;
  }

  return (
    <div className={styles.authorDetailContainer}>
      <div className={styles.headerImageSection}>
        <img
          src={isDarkMode ? header_image_dark : header_image_light}
          alt="Header"
          className={styles.headerImage}
        />
        <div className={styles.headerText}>
          <h1>{author.name}</h1>
          <p>Renowned Punjabi Sufi Poet (1722-1798)</p>
        </div>
      </div>

      <div className={styles.breadcrumb}>
        <Link to="/">
          <span>Home</span>
        </Link>{" "}
        /{" "}
        <Link to="/authors">
          <span> Authors</span>
        </Link>{" "}
        / <span> {author.name}</span>
      </div>

      <div className={styles.mainContentContainer}>
        <div className={styles.leftColumn}>
          <div className={styles.heroSection}>
            <div className={styles.authorImageContainer}>
              <img 
                src={author.image} 
                alt={author.name} 
                className={styles.authorImage}
              />
              <div className={styles.authorRating}>
                <div className={styles.ratingStars}>
                  {[...Array(5)].map((_, i) => (
                    i < Math.floor(author.rating) ? 
                      <FaStar key={i} className={styles.starFilled} /> : 
                      <FaRegStar key={i} className={styles.starEmpty} />
                  ))}
                </div>
                <span>{author.rating} ({author.reviews} reviews)</span>
              </div>
            </div>

            <div className={styles.detailsContainer}>
              <div className={styles.metaInfo}>
                <div className={styles.metaItem}>
                  <FaPenFancy className={styles.metaIcon} />
                  <span>{author.genre}</span>
                </div>
                <div className={styles.metaItem}>
                  <FaBook className={styles.metaIcon} />
                  <span>{author.books.length} major works</span>
                </div>
                {author.awards.length > 0 && (
                  <div className={styles.metaItem}>
                    <FaAward className={styles.metaIcon} />
                    <span>{author.awards.length} awards</span>
                  </div>
                )}
              </div>

              <div className={styles.lifeDates}>
                <span>Born: {author.born}</span>
                <span>Died: {author.died}</span>
              </div>

              <div className={styles.actionButtons}>
                <button className={styles.primaryButton}>View All Works</button>
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

          <div className={styles.tabContainer}>
            <div className={styles.tabButtons}>
              <button 
                className={`${styles.tabButton} ${activeTab === 'biography' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('biography')}
              >
                Biography
              </button>
              <button 
                className={`${styles.tabButton} ${activeTab === 'works' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('works')}
              >
                Major Works
              </button>
              <button 
                className={`${styles.tabButton} ${activeTab === 'awards' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('awards')}
              >
                Awards
              </button>
              <button 
                className={`${styles.tabButton} ${activeTab === 'reviews' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('reviews')}
              >
                Reviews
              </button>
            </div>

            <div className={styles.tabContent}>
              {activeTab === 'biography' && (
                <div className={styles.biographyContent}>
                  <h3 className={styles.sectionTitle}>About {author.name}</h3>
                  <div className={styles.biographyText}>
                    {author.biography.split('\n').map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'works' && (
                <div className={styles.worksContent}>
                  <h3 className={styles.sectionTitle}>Major Works</h3>
                  <div className={styles.worksGrid}>
                    {author.books.map(book => (
                      <div key={book.id} className={styles.workCard} onClick={() => navigate(`/ebooks/${book.id}`)}>
                        <div className={styles.workImageContainer}>
                          <img src={book.cover} alt={book.title} className={styles.workImage} />
                        </div>
                        <div className={styles.workInfo}>
                          <h4 className={styles.workTitle}>{book.title}</h4>
                          <div className={styles.workMeta}>
                            <span className={styles.workRating}>
                              ⭐ {book.rating}
                            </span>
                            <span className={styles.workYear}>{book.year}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'awards' && (
                <div className={styles.awardsContent}>
                  <h3 className={styles.sectionTitle}>Awards & Honors</h3>
                  <div className={styles.awardsList}>
                    {author.awards.map((award, i) => (
                      <div key={i} className={styles.awardItem}>
                        <div className={styles.awardIcon}>
                          <FaAward />
                        </div>
                        <div className={styles.awardDetails}>
                          <h4 className={styles.awardName}>{award.name}</h4>
                          <span className={styles.awardYear}>{award.year}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className={styles.reviewsContent}>
                  {showReviewForm ? (
                    <div className={styles.reviewFormContainer}>
                      <h3 className={styles.sectionTitle}>Write a Review</h3>
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
                        
                        <div className={styles.formActions}>
                          <button 
                            type="button"
                            className={styles.secondaryButton}
                            onClick={() => setShowReviewForm(false)}
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit" 
                            className={styles.primaryButton}
                          >
                            Submit Review
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <>
                      <div className={styles.reviewsHeader}>
                        <h3 className={styles.sectionTitle}>Reviews ({reviews.length})</h3>
                        <button 
                          className={styles.primaryButton}
                          onClick={() => setShowReviewForm(true)}
                        >
                          Write a Review
                        </button>
                      </div>
                      <div className={styles.reviewsListContainer}>
                        <div className={styles.reviewsList}>
                          {reviews.map((review) => (
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
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.rightColumn}>
          <section className={styles.relatedSection}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Similar Authors</h3>
              <div className={styles.scrollButtons}>
                <button onClick={() => scrollRelated('left', 'authors')} className={styles.scrollButton}>
                  <FaChevronLeft />
                </button>
                <button onClick={() => scrollRelated('right', 'authors')} className={styles.scrollButton}>
                  <FaChevronRight />
                </button>
              </div>
            </div>
            <div 
              className={styles.relatedScrollContainer} 
              data-section="authors"
            >
              <div className={styles.relatedGrid}>
                {relatedLoading ? (
                  Array(5).fill().map((_, index) => (
                    <RelatedAuthorSkeleton key={`author-skeleton-${index}`} />
                  ))
                ) : (
                  author.relatedAuthors.map((relatedAuthor) => (
                    <div 
                      key={relatedAuthor.id} 
                      className={styles.relatedCard}
                      onClick={() => navigate(`/authors/${relatedAuthor.id}`)}
                    >
                      <div className={styles.relatedImageContainer}>
                        <img src={relatedAuthor.image} alt={relatedAuthor.name} className={styles.relatedCover} />
                      </div>
                      <div className={styles.relatedInfo}>
                        <h4 className={styles.relatedTitle}>{relatedAuthor.name}</h4>
                        <p className={styles.relatedGenre}>{relatedAuthor.genre}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <section className={styles.quoteSection}>
            <h3 className={styles.sectionTitle}>Famous Quote</h3>
            <div className={styles.quoteCard}>
              <blockquote className={styles.quoteText}>
                "The one who is in love with the Lord, neither dies nor is killed."
              </blockquote>
              <div className={styles.quoteSource}>— Waris Shah, Heer Ranjha</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const RelatedAuthorSkeleton = () => {
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

export default AuthorDetail;