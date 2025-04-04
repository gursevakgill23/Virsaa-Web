import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "./Collections.module.css";
import book_image from "../../images/book-image.jpg";
import header_image_light from "../../images/Collections/header-image.png";
import header_image_dark from "../../images/Collections/header-image-dark.png";
import { FaFilter, FaTimes } from "react-icons/fa";
import skeleton_image from "../../images/skelton-image.png";

const Collections = ({ isDarkMode }) => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(segment => segment);
  const currentSection = pathSegments.length > 1 ? pathSegments[1] : 'ebooks';
  
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
  const cards = [
    {
      id: 1,
      title: "Punjab Diyan Lok Kathavan",
      author: "Sohan Singh Sital",
      rating: 4.5,
      image: book_image,
      genre: "History",
      pages: 320,
    },
    {
      id: 2,
      title: "Ik Si Anita",
      author: "Nanak Singh",
      rating: 4.2,
      image: book_image,
      genre: "Novel",
      pages: 280,
    },
    {
      id: 3,
      title: "Punjab Da Itihas",
      author: "Kirpal Singh",
      rating: 4.7,
      image: book_image,
      genre: "History",
      pages: 450,
    },
    {
      id: 4,
      title: "Heer Ranjha",
      author: "Waris Shah",
      rating: 4.8,
      image: book_image,
      genre: "Poetry",
      pages: 200,
    },
    {
      id: 5,
      title: "Nanak Singh Diyan Kahaniyan",
      author: "Nanak Singh",
      rating: 4.1,
      image: book_image,
      genre: "Short Stories",
      pages: 150,
    },
    {
      id: 6,
      title: "Punjabi Virsa",
      author: "Gurbachan Singh Bhullar",
      rating: 4.6,
      image: book_image,
      genre: "Culture",
      pages: 300,
    },
    {
      id: 7,
      title: "Sadda Punjab",
      author: "Kartar Singh Duggal",
      rating: 4.3,
      image: book_image,
      genre: "Biography",
      pages: 400,
    },
    {
      id: 8,
      title: "Punjabi Lok Geet",
      author: "Devinder Satyarthi",
      rating: 4.4,
      image: book_image,
      genre: "Music",
      pages: 250,
    },
    {
      id: 9,
      title: "Punjab Diyan Lok Kathavan",
      author: "Sohan Singh Sital",
      rating: 4.5,
      image: book_image,
      genre: "History",
      pages: 320,
    },
    {
      id: 10,
      title: "Ik Si Anita",
      author: "Nanak Singh",
      rating: 4.2,
      image: book_image,
      genre: "Novel",
      pages: 280,
    },
    {
      id: 11,
      title: "Punjab Da Itihas",
      author: "Kirpal Singh",
      rating: 4.7,
      image: book_image,
      genre: "History",
      pages: 450,
    },
    {
      id: 12,
      title: "Heer Ranjha",
      author: "Waris Shah",
      rating: 4.8,
      image: book_image,
      genre: "Poetry",
      pages: 200,
    },
    {
      id: 13,
      title: "Nanak Singh Diyan Kahaniyan",
      author: "Nanak Singh",
      rating: 4.1,
      image: book_image,
      genre: "Short Stories",
      pages: 150,
    },
    {
      id: 14,
      title: "Punjabi Virsa",
      author: "Gurbachan Singh Bhullar",
      rating: 4.6,
      image: book_image,
      genre: "Culture",
      pages: 300,
    },
    {
      id: 15,
      title: "Sadda Punjab",
      author: "Kartar Singh Duggal",
      rating: 4.3,
      image: book_image,
      genre: "Biography",
      pages: 400,
    },
    {
      id: 16,
      title: "Punjabi Lok Geet",
      author: "Devinder Satyarthi",
      rating: 4.4,
      image: book_image,
      genre: "Music",
      pages: 250,
    },
    {
      id: 17,
      title: "Punjab Diyan Lok Kathavan",
      author: "Sohan Singh Sital",
      rating: 4.5,
      image: book_image,
      genre: "History",
      pages: 320,
    },
    {
      id: 18,
      title: "Ik Si Anita",
      author: "Nanak Singh",
      rating: 4.2,
      image: book_image,
      genre: "Novel",
      pages: 280,
    },
    {
      id: 19,
      title: "Punjab Da Itihas",
      author: "Kirpal Singh",
      rating: 4.7,
      image: book_image,
      genre: "History",
      pages: 450,
    },
    {
      id: 20,
      title: "Heer Ranjha",
      author: "Waris Shah",
      rating: 4.8,
      image: book_image,
      genre: "Poetry",
      pages: 200,
    },
    {
      id: 21,
      title: "Nanak Singh Diyan Kahaniyan",
      author: "Nanak Singh",
      rating: 4.1,
      image: book_image,
      genre: "Short Stories",
      pages: 150,
    },
    {
      id: 22,
      title: "Punjabi Virsa",
      author: "Gurbachan Singh Bhullar",
      rating: 4.6,
      image: book_image,
      genre: "Culture",
      pages: 300,
    },
    {
      id: 23,
      title: "Sadda Punjab",
      author: "Kartar Singh Duggal",
      rating: 4.3,
      image: book_image,
      genre: "Biography",
      pages: 400,
    },
    {
      id: 24,
      title: "Punjabi Lok Geet",
      author: "Devinder Satyarthi",
      rating: 4.4,
      image: book_image,
      genre: "Music",
      pages: 250,
    },
  ];
  
  // Trending Ebooks data
  const trendingEbooks = [
    {
      id: 101,
      title: "Punjab Di Kahani",
      author: "Sant Singh Sekhon",
      rating: 4.6,
      image: book_image,
      pages: 280,
    },
    {
      id: 102,
      title: "Loona",
      author: "Shiv Kumar Batalvi",
      rating: 4.8,
      image: book_image,
      pages: 320,
    },
    {
      id: 103,
      title: "Punjabi Lok Dhara",
      author: "Devinder Satyarthi",
      rating: 4.4,
      image: book_image,
      pages: 250,
    },
    {
      id: 104,
      title: "Sadda Pind",
      author: "Gurdial Singh",
      rating: 4.7,
      image: book_image,
      pages: 350,
    },
    {
      id: 105,
      title: "Ik Si Anita",
      author: "Nanak Singh",
      rating: 4.5,
      image: book_image,
      pages: 280,
    },
    {
      id: 106,
      title: "Heer Waris Shah",
      author: "Waris Shah",
      rating: 4.9,
      image: book_image,
      pages: 200,
    },
  ];

  // Audiobooks data
  const audiobooks = [
    {
      id: 201,
      title: "Punjab Di Kahani",
      author: "Sant Singh Sekhon",
      rating: 4.7,
      image: book_image,
      duration: "5h 20m",
    },
    {
      id: 202,
      title: "Loona",
      author: "Shiv Kumar Batalvi",
      rating: 4.9,
      image: book_image,
      duration: "6h 15m",
    },
    {
      id: 203,
      title: "Sadda Pind",
      author: "Gurdial Singh",
      rating: 4.6,
      image: book_image,
      duration: "7h 30m",
    },
    {
      id: 204,
      title: "Heer Waris Shah",
      author: "Waris Shah",
      rating: 4.8,
      image: book_image,
      duration: "4h 45m",
    },
    {
      id: 205,
      title: "Ik Si Anita",
      author: "Nanak Singh",
      rating: 4.5,
      image: book_image,
      duration: "5h 10m",
    },
    {
      id: 206,
      title: "Punjabi Lok Dhara",
      author: "Devinder Satyarthi",
      rating: 4.4,
      image: book_image,
      duration: "4h 20m",
    },
  ];

  // Featured Authors data
  const featuredAuthors = [
    {
      id: 1,
      name: "Nanak Singh",
      image: book_image,
    },
    {
      id: 2,
      name: "Amrita Pritam",
      image: book_image,
    },
    {
      id: 3,
      name: "Gurdial Singh",
      image: book_image,
    },
    {
      id: 4,
      name: "Nanak Singh",
      image: book_image,
    },
    {
      id: 5,
      name: "Amrita Pritam",
      image: book_image,
    },
    {
      id: 6,
      name: "Gurdial Singh",
      image: book_image,
    },
  ];

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
          src={isDarkMode ? header_image_dark : header_image_light}
          alt="Header"
          className={styles.headerImage}
        />
        <div className={styles.headerText}>
          <h1>COLLECTIONS</h1>
          <p>{getHeaderSubtitle()}</p>
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
        / <span> {getHeaderSubtitle()}</span>
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
        <div
          className={`${styles.filtersSection} ${
            isFiltersOpen ? styles.filtersOpen : ""
          }`}
        >
          <div className={styles.fullScreenFilters}>
            <button className={styles.closeButton} onClick={closeFilters}>
              <FaTimes />
            </button>
            <h3>Filters</h3>

            <div className={styles.filterButtons}>
              <button
                className={`${styles.filterButton} ${
                  filters.title ? styles.active : ""
                }`}
                onClick={() => handleFilterChange("title")}
              >
                Title
              </button>
              <button
                className={`${styles.filterButton} ${
                  filters.highRatings ? styles.active : ""
                }`}
                onClick={() => handleFilterChange("highRatings")}
              >
                High Ratings
              </button>
              <button
                className={`${styles.filterButton} ${
                  filters.lessRatings ? styles.active : ""
                }`}
                onClick={() => handleFilterChange("lessRatings")}
              >
                Less Ratings
              </button>
              <button
                className={`${styles.filterButton} ${
                  filters.author ? styles.active : ""
                }`}
                onClick={() => handleFilterChange("author")}
              >
                Author
              </button>
              <button
                className={`${styles.filterButton} ${
                  filters.dateAdded ? styles.active : ""
                }`}
                onClick={() => handleFilterChange("dateAdded")}
              >
                Date added
              </button>
              <button
                className={`${styles.filterButton} ${
                  filters.hasAudiobook ? styles.active : ""
                }`}
                onClick={() => handleFilterChange("hasAudiobook")}
              >
                Has Audiobook
              </button>
              <button
                className={`${styles.filterButton} ${
                  filters.premiumOnly ? styles.active : ""
                }`}
                onClick={() => handleFilterChange("premiumOnly")}
              >
                Premium Only
              </button>
            </div>

            <h3>Genre</h3>
            <div className={styles.filterButtons}>
              <button
                className={`${styles.filterButton} ${
                  filters.history ? styles.active : ""
                }`}
                onClick={() => handleFilterChange("history")}
              >
                History
              </button>
              <button
                className={`${styles.filterButton} ${
                  filters.novel ? styles.active : ""
                }`}
                onClick={() => handleFilterChange("novel")}
              >
                Novel
              </button>
              <button
                className={`${styles.filterButton} ${
                  filters.biography ? styles.active : ""
                }`}
                onClick={() => handleFilterChange("biography")}
              >
                Biography
              </button>
              <button
                className={`${styles.filterButton} ${
                  filters.fiction ? styles.active : ""
                }`}
                onClick={() => handleFilterChange("fiction")}
              >
                Fiction
              </button>
              <button
                className={`${styles.filterButton} ${
                  filters.nonFiction ? styles.active : ""
                }`}
                onClick={() => handleFilterChange("nonFiction")}
              >
                Non-Fiction
              </button>
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
                  <img 
                    src={skeleton_image} 
                    alt="Loading" 
                    className={styles.skeletonImage}
                  />
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
                    src={card.image}
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
                  <img 
                    src={skeleton_image} 
                    alt="Loading author" 
                    className={styles.skeletonAuthorImage}
                  />
                </div>
                <div className={styles.skeletonAuthorText}></div>
              </div>
            ))
          ) : (
            featuredAuthors.map((author) => (
              <div key={author.id} className={styles.authorCard}>
                <img
                  src={author.image}
                  alt={author.name}
                  className={styles.authorImage}
                />
                <h3>{author.name}</h3>
              </div>
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
                  <img 
                    src={skeleton_image} 
                    alt="Loading trending" 
                    className={styles.skeletonTrendingImage}
                  />
                </div>
                <div className={styles.skeletonTrendingText}></div>
              </div>
            ))
          ) : (
            trendingEbooks.map((ebook) => (
              <Link to={`/collections/ebooks/ebook/${ebook.id}`} key={ebook.id}>
                <div className={styles.trendingCard}>
                  <img
                    src={ebook.image}
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
                  <img 
                    src={skeleton_image} 
                    alt="Loading audiobook" 
                    className={styles.skeletonAudiobookImage}
                  />
                </div>
                <div className={styles.skeletonAudiobookText}></div>
              </div>
            ))
          ) : (
            audiobooks.map((audiobook) => (
              <Link to={`/collections/audiobooks/audiobook/${audiobook.id}`} key={audiobook.id}>
                <div className={styles.audiobookCard}>
                  <img
                    src={audiobook.image}
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