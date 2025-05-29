import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "./Collections.module.css";
import { FaFilter, FaTimes } from "react-icons/fa";

// Define S3 base URL as a constant
const S3_BASE_URL = 'https://virsaa-media-2025.s3.amazonaws.com';

// Utility function to handle S3-based image paths
const useProductionImagePath = () => {
  return (imagePath) => {
    if (!imagePath) {
      console.log('Image path is null/undefined, using default:', imagePath);
      return getProductionImagePath('/images/Collections/book-image.jpg');
    }

    if (typeof imagePath === 'string' && imagePath.startsWith('https://')) {
      console.log('Full URL detected, returning:', imagePath);
      return imagePath;
    }

    if (typeof imagePath === 'string') {
      const cleanedPath = imagePath.replace(/^\/+|\/+$/g, '').replace(/ /g, '%20');
      const fullUrl = `${S3_BASE_URL}/${cleanedPath}`;
      console.log('Processed relative path to:', fullUrl);
      return fullUrl;
    }

    if (process.env.NODE_ENV === 'production') {
      if (typeof imagePath === 'string') {
        return imagePath.startsWith('/')
          ? imagePath
          : `/${imagePath.replace(/.*static\/media/, 'static/media')}`;
      } else {
        return imagePath.default || imagePath || getProductionImagePath('/images/Collections/book-image.jpg');
      }
    }

    return imagePath || getProductionImagePath('/images/Collections/book-image.jpg');
  };
};

// Utility function to handle public/static images (restored)
const getProductionImagePath = (imagePath) => {
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

const Collections = ({ isDarkMode }) => {
  const getS3ImagePath = useProductionImagePath();
  const getStaticImagePath = getProductionImagePath;
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(segment => segment);
  const currentSection = pathSegments.length > 1 ? pathSegments[1] : 'ebooks';

  // Image paths for header
  const header_image_light = getStaticImagePath("/images/Collections/header-image-light.png");
  const header_image_dark = getStaticImagePath("/images/Collections/header-image-dark.png");
  const default_book_image = getStaticImagePath("/images/Collections/book-image.jpg");

  const getHeaderSubtitle = () => {
    switch (currentSection) {
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

  // State for data fetched from API
  const [ebooks, setEbooks] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [audiobooks, setAudiobooks] = useState([]);
  const [trendingEbooks, setTrendingEbooks] = useState([]);
  const [featuredAuthors, setFeaturedAuthors] = useState([]);
  const [latestAudiobooks, setLatestAudiobooks] = useState([]);

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

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const ebooksResponse = await fetch('http://localhost:8000/collections/ebooks/');
        const ebooksData = await ebooksResponse.json();
        console.log('Fetched ebooks:', ebooksData);
        setEbooks(ebooksData);

        const authorsResponse = await fetch('http://localhost:8000/collections/authors/');
        const authorsData = await authorsResponse.json();
        console.log('Fetched authors:', authorsData);
        setAuthors(authorsData);
        setFeaturedAuthors(authorsData.slice(0, 6));

        const audiobooksResponse = await fetch('http://localhost:8000/collections/audiobooks/');
        const audiobooksData = await audiobooksResponse.json();
        console.log('Fetched audiobooks:', audiobooksData);
        setAudiobooks(audiobooksData);
        setLatestAudiobooks(audiobooksData.slice(0, 6));

        const trending = ebooksData.filter(ebook => ebook.rating >= 4.7).slice(0, 6);
        setTrendingEbooks(trending);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
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

  const applyFilters = (items) => {
    return items.filter((item) => {
      if (filters.highRatings && item.rating < 4) return false;
      if (filters.lessRatings && item.rating >= 3) return false;

      if (currentSection === 'ebooks' || currentSection === 'audiobooks') {
        if (filters.history && item.genre !== "History" && item.genre !== "history") return false;
        if (filters.novel && item.genre !== "Novel" && item.genre !== "novel") return false;
        if (filters.biography && item.genre !== "Biography" && item.genre !== "biography") return false;
        if (filters.fiction && item.genre !== "Fiction" && item.genre !== "fiction") return false;
        if (filters.nonFiction && item.genre !== "Non-Fiction" && item.genre !== "nonFiction" && item.genre !== "non-fiction") return false;
      } else if (currentSection === 'authors') {
        const genres = item.genre ? item.genre.split(',').map(g => g.trim().toLowerCase()) : [];
        if (filters.history && !genres.includes("history")) return false;
        if (filters.novel && !genres.includes("novel")) return false;
        if (filters.biography && !genres.includes("biography")) return false;
        if (filters.fiction && !genres.includes("fiction")) return false;
        if (filters.nonFiction && !genres.includes("non-fiction") && !genres.includes("nonfiction")) return false;
      }

      return true;
    });
  };

  let displayData = [];
  if (currentSection === 'ebooks') {
    displayData = applyFilters(ebooks);
  } else if (currentSection === 'authors') {
    displayData = applyFilters(authors);
  } else if (currentSection === 'audiobooks') {
    displayData = applyFilters(audiobooks);
  }

  const indexOfLastCard = currentPage * cardsPerPage;
  const indexOfFirstCard = indexOfLastCard - cardsPerPage;
  const currentCards = displayData.slice(indexOfFirstCard, indexOfLastCard);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className={styles.collectionsContainer}>
      <div className={styles.headerImageSection}>
        <img
          src={getStaticImagePath(isDarkMode ? header_image_dark : header_image_light)}
          alt="Header"
          className={styles.headerImage}
          onError={(e) => console.log('Header image failed to load:', e)}
        />
        <div className={styles.headerText}>
          <h1>COLLECTIONS</h1>
          <p>{getHeaderSubtitle()}</p>
        </div>
      </div>

      <div className={styles.breadcrumb}>
        <Link to="/"><span>Home</span></Link> /{" "}
        <Link to="/collections"><span>Collections</span></Link> /{" "}
        <span>{getHeaderSubtitle()}</span>
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

        <div className={styles.gridContainer}>
          {isLoading ? (
            Array(cardsPerPage).fill().map((_, index) => (
              <div key={`skeleton-${index}`} className={styles.cardSkeleton}>
                <div className={styles.skeletonImageContainer}></div>
                <div className={styles.skeletonContent}>
                  <div className={styles.skeletonTitle}></div>
                  <div className={styles.skeletonPages}></div>
                </div>
              </div>
            ))
          ) : (
            currentCards.map((item) => {
              console.log('Rendering item:', item);
              if (currentSection === 'ebooks') {
                return (
                  <Link to={`/collections/ebooks/ebook/${item.id}`} key={item.id}>
                    <div className={styles.card}>
                      <img
                        src={getS3ImagePath(item.cover_image) || getStaticImagePath(default_book_image)}
                        alt={item.title}
                        className={styles.cardImage}
                        onError={(e) => console.log(`Ebook image failed to load: ${item.title}`, item.cover_image, e)}
                      />
                      <div className={styles.cardContent}>
                        <h3>{item.title}</h3>
                        <p className={styles.pages}>{item.pages} pages</p>
                      </div>
                    </div>
                  </Link>
                );
              } else if (currentSection === 'authors') {
                return (
                  <Link to={`/collections/authors/author/${item.id}`} key={item.id}>
                    <div className={styles.card}>
                      <img
                        src={getS3ImagePath(item.image) || getStaticImagePath(default_book_image)}
                        alt={item.name}
                        className={styles.cardImage}
                        onError={(e) => console.log(`Author image failed to load: ${item.name}`, item.image, e)}
                      />
                      <div className={styles.cardContent}>
                        <h3>{item.name}</h3>
                        <p className={styles.pages}>{item.genre}</p>
                      </div>
                    </div>
                  </Link>
                );
              } else if (currentSection === 'audiobooks') {
                return (
                  <Link to={`/collections/audiobooks/audiobook/${item.id}`} key={item.id}>
                    <div className={styles.card}>
                      <img
                        src={getS3ImagePath(item.cover) || getStaticImagePath(default_book_image)}
                        alt={item.title}
                        className={styles.cardImage}
                        onError={(e) => console.log(`Audiobook image failed to load: ${item.title}`, item.cover, e)}
                      />
                      <div className={styles.cardContent}>
                        <h3>{item.title}</h3>
                        <p className={styles.duration}>{item.duration}</p>
                      </div>
                    </div>
                  </Link>
                );
              }
              return null;
            })
          )}
        </div>

        <div className={styles.pagination}>
          {Array.from(
            { length: Math.ceil(displayData.length / cardsPerPage) },
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

      <section className={styles.featuredAuthors}>
        <h2>Featured Authors</h2>
        <div className={styles.authorsGrid}>
          {isLoading ? (
            Array(6).fill().map((_, index) => (
              <div key={`author-skeleton-${index}`} className={styles.authorCardSkeleton}>
                <div className={styles.skeletonAuthorImageContainer}></div>
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
                  src={getS3ImagePath(author.image) || getStaticImagePath(default_book_image)}
                  alt={author.name}
                  className={styles.authorImage}
                  onError={(e) => console.log(`Featured author image failed to load: ${author.name}`, author.image, e)}
                />
                <h3>{author.name}</h3>
              </Link>
            ))
          )}
        </div>
      </section>

      <section className={styles.trendingSection}>
        <h2>Trending Ebooks</h2>
        <div className={styles.trendingGrid}>
          {isLoading ? (
            Array(6).fill().map((_, index) => (
              <div key={`trending-skeleton-${index}`} className={styles.trendingCardSkeleton}>
                <div className={styles.skeletonTrendingImageContainer}></div>
                <div className={styles.skeletonTrendingText}></div>
              </div>
            ))
          ) : (
            trendingEbooks.map((ebook) => (
              <Link to={`/collections/ebooks/ebook/${ebook.id}`} key={ebook.id}>
                <div className={styles.trendingCard}>
                  <img
                    src={getS3ImagePath(ebook.cover_image) || getStaticImagePath(default_book_image)}
                    alt={ebook.title}
                    className={styles.trendingImage}
                    onError={(e) => console.log(`Trending ebook image failed to load: ${ebook.title}`, ebook.cover_image, e)}
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

      <section className={styles.audiobooksSection}>
        <h2>Latest Audiobooks</h2>
        <div className={styles.audiobooksGrid}>
          {isLoading ? (
            Array(6).fill().map((_, index) => (
              <div key={`audiobook-skeleton-${index}`} className={styles.audiobookCardSkeleton}>
                <div className={styles.skeletonAudiobookImageContainer}></div>
                <div className={styles.skeletonAudiobookText}></div>
              </div>
            ))
          ) : (
            latestAudiobooks.map((audiobook) => (
              <Link to={`/collections/audiobooks/audiobook/${audiobook.id}`} key={audiobook.id}>
                <div className={styles.audiobookCard}>
                  <img
                    src={getS3ImagePath(audiobook.cover) || getStaticImagePath(default_book_image)}
                    alt={audiobook.title}
                    className={styles.audiobookImage}
                    onError={(e) => console.log(`Latest audiobook image failed to load: ${audiobook.title}`, audiobook.cover, e)}
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