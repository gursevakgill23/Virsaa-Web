import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FaHeart, FaRegHeart, FaBookmark, FaRegBookmark, FaShareAlt, FaChevronLeft, FaChevronRight,
  FaStar, FaRegStar, FaPenFancy, FaBook, FaAward, FaQuoteLeft,
} from 'react-icons/fa';
import Loader from '../../../components/Loader';
import PageHero from '../../../components/PageHero/PageHero';
import styles from './AuthorDetail.module.css';

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

const TABS = [
  { id: 'biography', label: 'Biography' },
  { id: 'works', label: 'Major works' },
  { id: 'awards', label: 'Awards' },
  { id: 'reviews', label: 'Reviews' },
];

const Stars = ({ value }) => (
  <span className={styles.stars} aria-label={`${value} out of 5`}>
    {[1, 2, 3, 4, 5].map((i) =>
      i <= Math.floor(value) ? <FaStar key={i} className={styles.starOn} /> : <FaRegStar key={i} className={styles.starOff} />
    )}
  </span>
);

const RelatedAuthorSkeleton = () => (
  <div className={styles.relatedCard} aria-hidden="true">
    <span className={`${styles.relatedThumb} ${styles.relatedThumbRound} ${styles.skeleton}`} />
    <span className={styles.relatedInfo}>
      <span className={`${styles.skeleton} ${styles.skeletonLine}`} />
      <span className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineShort}`} />
    </span>
  </div>
);

const AuthorDetail = ({ isDarkMode }) => {
  const getImagePath = useProductionImagePath();
  const { id } = useParams();
  const relatedRef = useRef(null);
  const [author, setAuthor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('biography');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const header_image_dark = '/images/header-image-dark.png';
  const header_image_light = '/images/header-image-light.png';
  const authorImage = '/images/author-image.jpg';

  const [reviewForm, setReviewForm] = useState({ name: '', email: '', rating: 0, review: '' });
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    setIsLoading(true);
    setRelatedLoading(true);
    const t1 = setTimeout(() => {
      setAuthor({
        id,
        name: 'Waris Shah',
        image: authorImage,
        rating: 4.7,
        reviews: 892,
        born: '1722, Jandiala Sher Khan, Punjab',
        died: '1798, Malka Hans, Punjab',
        genre: 'Punjabi Poetry, Sufi Poetry',
        notableWorks: ['Heer Ranjha', 'Ishq Daa Waaris'],
        biography: `Waris Shah was an 18th-century Punjabi Sufi poet, renowned for his contribution to Punjabi literature. He is best known for his seminal work Heer Ranjha, based on the traditional folk tale of Heer and her lover Ranjha.

Born into a Syed family, Waris Shah received his early education in Kasur and later studied at the shrine of Hafiz Ghulam Murtaza in Qasur. His work is characterized by its spiritual depth, lyrical beauty, and profound understanding of human nature.

Waris Shah's version of Heer Ranjha is considered the most popular and is a landmark in Punjabi literature. His poetry explores themes of divine love, human relationships, and social commentary. He wrote in the Majhi dialect of Punjabi, which became the standard literary language.

Today, Waris Shah is celebrated as one of the greatest poets in the Punjabi language, and his work continues to influence Punjabi culture, music, and literature.`,
        books: [
          { id: 101, title: 'Heer Ranjha', cover: authorImage, rating: 4.8, year: 1766 },
          { id: 102, title: 'Ishq Daa Waaris', cover: authorImage, rating: 4.5, year: 1776 },
          { id: 103, title: 'Dastan-E-Ranjeet', cover: authorImage, rating: 4.2, year: 1782 },
          { id: 104, title: 'Punjabi Diyan Kahanian', cover: authorImage, rating: 4.0, year: 1788 },
        ],
        awards: [
          { name: 'Pride of Punjab', year: 1998 },
          { name: 'Literary Excellence Award', year: 2005 },
        ],
      });

      setReviews(Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        name: ['Amanpreet', 'Gurpreet', 'Harpreet', 'Jaspreet', 'Manpreet', 'Navpreet'][i % 6],
        date: new Date(Date.now() - (i * 86400000)).toLocaleDateString(),
        rating: [4, 5, 3, 4, 5, 4, 3, 5, 4, 5][i % 10],
        review: [
          "Waris Shah's poetry transcends time and speaks directly to the soul.",
          'A true master of Punjabi literature whose work remains relevant centuries later.',
          'His understanding of human emotions is unparalleled in Punjabi poetry.',
          'The way he blends spiritual themes with human love is remarkable.',
          'Every Punjabi household should have a copy of Heer Ranjha.',
          'His work captures the essence of Punjabi culture beautifully.',
          'A bit difficult to understand at first, but worth the effort.',
          'The depth of his poetry increases with each reading.',
          'His work is the foundation of modern Punjabi literature.',
          'A literary giant whose influence continues to grow.',
        ][i % 10],
        helpful: (i * 7) % 50,
      })));
      setIsLoading(false);
    }, 600);

    const t2 = setTimeout(() => {
      setAuthor((prev) => prev && ({
        ...prev,
        relatedAuthors: [
          { id: 201, name: 'Bulleh Shah', image: authorImage, genre: 'Sufi Poetry' },
          { id: 202, name: 'Amrita Pritam', image: authorImage, genre: 'Modern Poetry' },
          { id: 203, name: 'Shiv Kumar Batalvi', image: authorImage, genre: 'Lyrical Poetry' },
          { id: 204, name: 'Pash', image: authorImage, genre: 'Revolutionary Poetry' },
          { id: 205, name: 'Surjit Patar', image: authorImage, genre: 'Contemporary Poetry' },
        ],
      }));
      setRelatedLoading(false);
    }, 1200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [id]);

  const handleRatingChange = (rating) => setReviewForm({ ...reviewForm, rating });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setReviewForm({ ...reviewForm, [name]: value });
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    setReviews([
      {
        id: reviews.length + 1,
        name: reviewForm.name,
        date: new Date().toLocaleDateString(),
        rating: reviewForm.rating,
        review: reviewForm.review,
        helpful: 0,
      },
      ...reviews,
    ]);
    setReviewForm({ name: '', email: '', rating: 0, review: '' });
    setShowReviewForm(false);
  };

  const toggleHelpful = (reviewId) => {
    setReviews(reviews.map((r) => (r.id === reviewId ? { ...r, helpful: r.helpful + 1 } : r)));
  };

  const scrollRelated = (direction) => {
    relatedRef.current?.scrollBy({ left: direction === 'left' ? -300 : 300, behavior: 'smooth' });
  };

  const openWorks = () => {
    setActiveTab('works');
    document.getElementById('author-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (isLoading || !author) {
    return <div className={styles.page}><Loader /></div>;
  }

  return (
    <div className={styles.page}>
      <PageHero
        compact
        image={getImagePath(isDarkMode ? header_image_dark : header_image_light)}
        title={author.name}
        subtitle="Renowned Punjabi Sufi Poet (1722-1798)"
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
                <img src={getImagePath(author.image)} alt={author.name} className={styles.portraitImg} />
                <div className={styles.portraitRating}>
                  <Stars value={author.rating} />
                  <span>{author.rating} · {author.reviews} reviews</span>
                </div>
              </div>
            </div>

            <div className={styles.info}>
              <div className={styles.chipRow}>
                <span className={styles.chip}><FaPenFancy aria-hidden="true" /> {author.genre}</span>
              </div>
              <h2 className={styles.title}>{author.name}</h2>

              <dl className={styles.lifeDates}>
                <div className={styles.lifeItem}>
                  <dt>Born</dt>
                  <dd>{author.born}</dd>
                </div>
                <div className={styles.lifeItem}>
                  <dt>Died</dt>
                  <dd>{author.died}</dd>
                </div>
              </dl>

              <div className={styles.metaRow}>
                <span className={styles.metaPill}><FaBook aria-hidden="true" /> {author.books.length} major works</span>
                {author.awards.length > 0 && (
                  <span className={styles.metaPill}><FaAward aria-hidden="true" /> {author.awards.length} awards</span>
                )}
              </div>

              <div className={styles.actions}>
                <button type="button" className={styles.primaryButton} onClick={openWorks}>
                  <FaBook aria-hidden="true" /> View all works
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
                  {tab.id === 'reviews' && <span className={styles.tabCount}>{reviews.length}</span>}
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
                  <div className={styles.worksGrid}>
                    {author.books.map((book) => (
                      <Link key={book.id} to={`/collections/ebooks/ebook/${book.id}`} className={styles.workCard}>
                        <span className={styles.workCover}>
                          <img src={getImagePath(book.cover)} alt="" />
                        </span>
                        <span className={styles.workTitle}>{book.title}</span>
                        <span className={styles.workMeta}>
                          <span><FaStar className={styles.starOn} aria-hidden="true" /> {book.rating}</span>
                          <span>{book.year}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </>
              )}

              {activeTab === 'awards' && (
                <>
                  <h3 className={styles.sectionTitle}>Awards and honours</h3>
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

              {activeTab === 'reviews' && (
                showReviewForm ? (
                  <form onSubmit={handleSubmitReview}>
                    <h3 className={styles.formTitle}>Write a review</h3>
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
                      <span className={styles.label} id="au-rating-label">Your rating</span>
                      <div className={styles.starPicker} role="group" aria-labelledby="au-rating-label">
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
                      </div>
                    </div>
                    <div className={styles.field}>
                      <label htmlFor="review" className={styles.label}>Your review</label>
                      <textarea id="review" name="review" className={styles.textarea} value={reviewForm.review} onChange={handleInputChange} required />
                    </div>
                    <div className={styles.formActions}>
                      <button type="button" className={styles.secondaryButton} onClick={() => setShowReviewForm(false)}>Cancel</button>
                      <button type="submit" className={styles.primaryButton} disabled={reviewForm.rating === 0}>Post review</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className={styles.reviewsHeader}>
                      <h3 className={styles.sectionTitle}>Reviews ({reviews.length})</h3>
                      <button type="button" className={styles.primaryButton} onClick={() => setShowReviewForm(true)}>
                        Write a review
                      </button>
                    </div>
                    <ul className={`${styles.reviewList} ${styles.reviewScroll}`}>
                      {reviews.map((review) => (
                        <li key={review.id} className={styles.review}>
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
                  </>
                )
              )}
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
                      <img src={getImagePath(related.image)} alt="" className={`${styles.relatedThumb} ${styles.relatedThumbRound}`} loading="lazy" />
                      <span className={styles.relatedInfo}>
                        <span className={styles.relatedTitle}>{related.name}</span>
                        <span className={styles.relatedMeta}>{related.genre}</span>
                      </span>
                    </Link>
                  ))}
            </div>
          </section>

          <figure className={styles.quoteCard}>
            <FaQuoteLeft className={styles.quoteMark} aria-hidden="true" />
            <blockquote className={styles.quoteText}>
              The one who is in love with the Lord, neither dies nor is killed.
            </blockquote>
            <figcaption className={styles.quoteSource}>Waris Shah, Heer Ranjha</figcaption>
          </figure>
        </aside>
      </div>
    </div>
  );
};

export default AuthorDetail;
