import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "./Collections.module.css";
import { FaFilter, FaTimes } from "react-icons/fa";

// Utility function to handle production image paths
const useProductionImagePath = () => {
  
  return (imagePath) => {
    // Only modify in production
    if (process.env.NODE_ENV === 'production') {
      // Handle both imported images and public folder images
      if (typeof imagePath === 'string') {
        // For public folder images
        return imagePath.startsWith('/') 
          ? imagePath 
          : `/${imagePath.replace(/.*static\/media/, 'static/media')}`;
      } else {
        // For imported images
        return imagePath.default || imagePath;
      }
    }
    return imagePath;
  };
};

const Collections = ({ isDarkMode }) => {
  const getImagePath = useProductionImagePath();
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(segment => segment);
  const currentSection = pathSegments.length > 1 ? pathSegments[1] : 'ebooks';
  
  // Image paths - now using public folder
  const header_image_light = "/images/Collections/header-image-light.png";
  const header_image_dark = "/images/Collections/header-image-dark.png";
  const book_image = "/images/Collections/book-image.jpg";

  const getHeaderSubtitle = () => {
    switch(currentSection) {
      case 'ebooks':
        return 'Ebooks';
      case 'audiobooks':
        return 'Audiobooks';
      case 'authors':
        return 'Authors';
      default:
        return 'Ebooks';
    }
  };

  const [filters, setFilters] = useState({
    title: false,
    highRatings: false,
    lessRatings: false,
    author: false,
    dateAdded: false,
    hasAudiobook: false,
    premiumOnly: false,
    history: false,
    novel: false,
    biography: false,
    fiction: false,
    nonFiction: false,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const cardsPerPage = 12;

  useEffect(() => {
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(loadingTimer);
  }, []);

  const handleFilterChange = (filterName) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [filterName]: !prevFilters[filterName],
    }));
  };

  const saveChanges = () => {
    console.log("Filters saved:", filters);
    setIsFiltersOpen(false);
  };

  const toggleFilters = () => {
    setIsFiltersOpen(!isFiltersOpen);
  };

  const closeFilters = () => {
    setIsFiltersOpen(false);
  };

  const clearFilters = () => {
    setFilters({
      title: false,
      highRatings: false,
      lessRatings: false,
      author: false,
      dateAdded: false,
      hasAudiobook: false,
      premiumOnly: false,
      history: false,
      novel: false,
      biography: false,
      fiction: false,
      nonFiction: false,
    });
  };

  // Dummy data for Punjabi books
  const cards = Array.from({ length: 24 }, (_, i) => ({
    id: i + 1,
    title: [
      "Punjab Diyan Lok Kathavan",
      "Ik Si Anita",
      "Punjab Da Itihas",
      "Heer Ranjha",
      "Nanak Singh Diyan Kahaniyan",
      "Punjabi Virsa",
      "Sadda Punjab",
      "Punjabi Lok Geet"
    ][i % 8],
    author: [
      "Sohan Singh Sital",
      "Nanak Singh",
      "Kirpal Singh",
      "Waris Shah",
      "Nanak Singh",
      "Gurbachan Singh Bhullar",
      "Kartar Singh Duggal",
      "Devinder Satyarthi"
    ][i % 8],
    rating: 4.0 + (i % 10) * 0.1,
    image: book_image,
    genre: [
      "History",
      "Novel",
      "History",
      "Poetry",
      "Short Stories",
      "Culture",
      "Biography",
      "Music"
    ][i % 8],
    pages: [320, 280, 450, 200, 150, 300, 400, 250][i % 8],
  }));

  // Trending Ebooks data
  const trendingEbooks = [
    { id: 101, title: "Punjab Di Kahani", author: "Sant Singh Sekhon", rating: 4.6, pages: 280 },
    { id: 102, title: "Loona", author: "Shiv Kumar Batalvi", rating: 4.8, pages: 320 },
    { id: 103, title: "Punjabi Lok Dhara", author: "Devinder Satyarthi", rating: 4.4, pages: 250 },
    { id: 104, title: "Sadda Pind", author: "Gurdial Singh", rating: 4.7, pages: 350 },
    { id: 105, title: "Ik Si Anita", author: "Nanak Singh", rating: 4.5, pages: 280 },
    { id: 106, title: "Heer Waris Shah", author: "Waris Shah", rating: 4.9, pages: 200 },
  ].map(item => ({ ...item, image: book_image }));

  // Audiobooks data
  const audiobooks = [
    { id: 201, title: "Punjab Di Kahani", author: "Sant Singh Sekhon", rating: 4.7, duration: "5h 20m" },
    { id: 202, title: "Loona", author: "Shiv Kumar Batalvi", rating: 4.9, duration: "6h 15m" },
    { id: 203, title: "Sadda Pind", author: "Gurdial Singh", rating: 4.6, duration: "7h 30m" },
    { id: 204, title: "Heer Waris Shah", author: "Waris Shah", rating: 4.8, duration: "4h 45m" },
    { id: 205, title: "Ik Si Anita", author: "Nanak Singh", rating: 4.5, duration: "5h 10m" },
    { id: 206, title: "Punjabi Lok Dhara", author: "Devinder Satyarthi", rating: 4.4, duration: "4h 20m" },
  ].map(item => ({ ...item, image: book_image }));

  // Featured Authors data
  const featuredAuthors = [1, 2, 3, 4, 5, 6].map(id => ({
    id,
    name: ["Nanak Singh", "Amrita Pritam", "Gurdial Singh"][id % 3],
    image: book_image
  }));

  // Apply filters
  const filteredCards = cards.filter((card) => {
    if (filters.history && card.genre !== "History") return false;
    if (filters.novel && card.genre !== "Novel") return false;
    if (filters.biography && card.genre !== "Biography") return false;
    if (filters.fiction && card.genre !== "Fiction") return false;
    if (filters.nonFiction && card.genre !== "Non-Fiction") return false;
    if (filters.highRatings && card.rating < 4) return false;
    if (filters.lessRatings && card.rating >= 3) return false;
    return true;
  });

  const indexOfLastCard = currentPage * cardsPerPage;
  const indexOfFirstCard = indexOfLastCard - cardsPerPage;
  const currentCards = filteredCards.slice(indexOfFirstCard, indexOfLastCard);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className={styles.collectionsContainer}>
      <div className={styles.headerImageSection}>
        <img
          src={getImagePath(isDarkMode ? header_image_dark : header_image_light)}
          alt="Header"
          className={styles.headerImage}
        />
        <div className={styles.headerText}>
          <h1>COLLECTIONS</h1>
          <p>{getHeaderSubtitle()}</p>
        </div>
      </div>

      <div className={styles.breadcrumb}>
        <Link to="/"><span>Home</span></Link> /{" "}
        <Link to="/collections"><span> Collections</span></Link> /{" "}
        <span> {getHeaderSubtitle()}</span>
      </div>

      <div className={styles.searchAndFilters}>
        <input
          type="text"
          placeholder="Search by title, author, or keyword"
          className={styles.searchBar}
        />
        <button className={styles.filtersIcon} onClick={toggleFilters}>
          <FaFilter />
        </button>
      </div>

      <div className={styles.collectionsPage}>
        {/* Filters Section */}
        <div className={`${styles.filtersSection} ${isFiltersOpen ? styles.filtersOpen : ""}`}>
          <div className={styles.fullScreenFilters}>
            <button className={styles.closeButton} onClick={closeFilters}>
              <FaTimes />
            </button>
            <h3>Filters</h3>

            <div className={styles.filterButtons}>
              {['title', 'highRatings', 'lessRatings', 'author', 'dateAdded', 'hasAudiobook', 'premiumOnly'].map(filter => (
                <button
                  key={filter}
                  className={`${styles.filterButton} ${filters[filter] ? styles.active : ""}`}
                  onClick={() => handleFilterChange(filter)}
                >
                  {filter.split(/(?=[A-Z])/).join(' ')}
                </button>
              ))}
            </div>

            <h3>Genre</h3>
            <div className={styles.filterButtons}>
              {['history', 'novel', 'biography', 'fiction', 'nonFiction'].map(genre => (
                <button
                  key={genre}
                  className={`${styles.filterButton} ${filters[genre] ? styles.active : ""}`}
                  onClick={() => handleFilterChange(genre)}
                >
                  {genre.charAt(0).toUpperCase() + genre.slice(1)}
                </button>
              ))}
            </div>

            <button onClick={saveChanges} className={styles.saveButton}>
              Save Changes
            </button>
            <button onClick={clearFilters} className={styles.clearButton}>
              Clear Filters
            </button>
          </div>
        </div>

        {/* Books Grid */}
        <div className={styles.gridContainer}>
          {isLoading ? (
            Array(cardsPerPage).fill().map((_, index) => (
              <div key={`skeleton-${index}`} className={styles.cardSkeleton}>
                <div className={styles.skeletonImageContainer}>
                  
                </div>
                <div className={styles.skeletonContent}>
                  <div className={styles.skeletonTitle}></div>
                  <div className={styles.skeletonPages}></div>
                </div>
              </div>
            ))
          ) : (
            currentCards.map((card) => (
              <Link to={`/collections/ebooks/ebook/${card.id}`} key={card.id}>
                <div className={styles.card}>
                  <img
                    src={getImagePath(card.image)}
                    alt={card.title}
                    className={styles.cardImage}
                  />
                  <div className={styles.cardContent}>
                    <h3>{card.title}</h3>
                    <p className={styles.pages}>{card.pages} pages</p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Pagination */}
        <div className={styles.pagination}>
          {Array.from(
            { length: Math.ceil(filteredCards.length / cardsPerPage) },
            (_, i) => (
              <button
                key={i + 1}
                onClick={() => paginate(i + 1)}
                className={currentPage === i + 1 ? styles.activePage : ""}
              >
                {i + 1}
              </button>
            )
          )}
        </div>
      </div>

      {/* Featured Authors Section */}
      <section className={styles.featuredAuthors}>
        <h2>Featured Authors</h2>
        <div className={styles.authorsGrid}>
          {isLoading ? (
            Array(6).fill().map((_, index) => (
              <div key={`author-skeleton-${index}`} className={styles.authorCardSkeleton}>
                <div className={styles.skeletonAuthorImageContainer}>
                </div>
                <div className={styles.skeletonAuthorText}></div>
              </div>
            ))
          ) : (
            featuredAuthors.map((author) => (
              <Link 
                to={`/collections/authors/author/${author.id}`} 
                key={author.id} 
                className={styles.authorCard}
              >
                <img
                  src={getImagePath(author.image)}
                  alt={author.name}
                  className={styles.authorImage}
                />
                <h3>{author.name}</h3>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Trending Ebooks Section */}
      <section className={styles.trendingSection}>
        <h2>Trending Ebooks</h2>
        <div className={styles.trendingGrid}>
          {isLoading ? (
            Array(6).fill().map((_, index) => (
              <div key={`trending-skeleton-${index}`} className={styles.trendingCardSkeleton}>
                <div className={styles.skeletonTrendingImageContainer}>
                </div>
                <div className={styles.skeletonTrendingText}></div>
              </div>
            ))
          ) : (
            trendingEbooks.map((ebook) => (
              <Link to={`/collections/ebooks/ebook/${ebook.id}`} key={ebook.id}>
                <div className={styles.trendingCard}>
                  <img
                    src={getImagePath(ebook.image)}
                    alt={ebook.title}
                    className={styles.trendingImage}
                  />
                  <div className={styles.trendingContent}>
                    <h3>{ebook.title}</h3>
                    <p className={styles.pages}>{ebook.pages} pages</p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Audiobooks Section */}
      <section className={styles.audiobooksSection}>
        <h2>Latest Audiobooks</h2>
        <div className={styles.audiobooksGrid}>
          {isLoading ? (
            Array(6).fill().map((_, index) => (
              <div key={`audiobook-skeleton-${index}`} className={styles.audiobookCardSkeleton}>
                <div className={styles.skeletonAudiobookImageContainer}>
                </div>
                <div className={styles.skeletonAudiobookText}></div>
              </div>
            ))
          ) : (
            audiobooks.map((audiobook) => (
              <Link to={`/collections/audiobooks/audiobook/${audiobook.id}`} key={audiobook.id}>
                <div className={styles.audiobookCard}>
                  <img
                    src={getImagePath(audiobook.image)}
                    alt={audiobook.title}
                    className={styles.audiobookImage}
                  />
                  <div className={styles.audiobookContent}>
                    <h3>{audiobook.title}</h3>
                    <p className={styles.duration}>{audiobook.duration}</p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default Collections;