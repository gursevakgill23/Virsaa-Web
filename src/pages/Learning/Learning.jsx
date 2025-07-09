import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaFilter, FaTimes, FaChevronLeft, FaChevronRight, FaLock } from 'react-icons/fa';
import styles from './Learning.module.css';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

// Define S3 base URL and default image path
const S3_BASE_URL = 'https://virsaa-media-2025.s3.amazonaws.com';
const DEFAULT_IMAGE_PATH = '/images/Learning/learning.jpg';
const FALLBACK_API_URL = 'http://virsaa-prod.eba-7cc3yk92.us-east-1.elasticbeanstalk.com';

// Utility function to handle S3-based image paths (from Collections.jsx)
const useProductionImagePath = () => {
  return (imagePath, context = 'unknown', getStaticImagePath) => {
    // Handle null, undefined, or empty string
    if (!imagePath || imagePath === '') {
      console.log(`Image path is null, undefined, or empty for ${context}, using default: ${DEFAULT_IMAGE_PATH}`);
      return getStaticImagePath(DEFAULT_IMAGE_PATH);
    }

    if (typeof imagePath === "string" && imagePath.startsWith("https://")) {
      console.log(`Full URL detected for ${context}, returning: ${imagePath}`);
      return imagePath;
    }

    // Encode relative paths to handle spaces and special characters
    if (typeof imagePath === "string") {
      const encodedPath = encodeURI(imagePath);
      console.log(`Encoded image path for ${context}: ${encodedPath}`);
      return `${S3_BASE_URL}/${encodedPath}`;
    }

    console.log(`Invalid image path for ${context}, using default: ${DEFAULT_IMAGE_PATH}`, imagePath);
    return getStaticImagePath(DEFAULT_IMAGE_PATH);
  };
};

// Utility function to handle public/static images (from Collections.jsx)
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

const Learning = ({ isDarkMode }) => {
  const { isLoggedIn, isPremium, accessToken, API_STRING } = useAuth();
  const getStaticImagePath = getProductionImagePath;
  const getS3ImagePath = useProductionImagePath();
  const [activeTab, setActiveTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [gameIndex, setGameIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [shuffledCards, setShuffledCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [allCards, setAllCards] = useState([]);
  const [games, setGames] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [error, setError] = useState(null);
  const header_image_light = getStaticImagePath('/images/header-image.png');
  const header_image_dark = getStaticImagePath('/images/header-image-dark.png');
  const default_learning_image = getStaticImagePath(DEFAULT_IMAGE_PATH);

  useEffect(() => {
    console.log('useAuth output:', { isLoggedIn, isPremium, accessToken, API_STRING }); // Debug AuthContext
    const fetchItems = async () => {
      setIsLoading(true);
      setError(null);
      const apiUrl = API_STRING || FALLBACK_API_URL;
      console.log('API_STRING:', API_STRING, 'Using apiUrl:', apiUrl); // Debug
      try {
        const config = isLoggedIn && accessToken
          ? { headers: { Authorization: `Bearer ${accessToken}` } }
          : {};
        const response = await axios.get(`${apiUrl.replace(/\/$/, "")}/api/learning/items/categorized/`, config);
        console.log('Fetched data:', response.data); // Debug
        const data = response.data;

        const mappedCards = [
          ...data.learning.map(item => ({
            id: item.id,
            type: 'learning',
            image: item.image || DEFAULT_IMAGE_PATH,
            title: item.title,
            description: item.description || 'No description available',
            category: item.category || 'Uncategorized',
            link: `/learning-material/${item.id}`,
            is_restricted: item.is_restricted,
            is_premium: item.is_premium,
          })),
          ...data.quiz.map(item => ({
            id: item.id,
            type: 'quiz',
            image: item.image || DEFAULT_IMAGE_PATH,
            title: item.title,
            description: item.description || 'No description available',
            category: item.category || 'Uncategorized',
            link: `/learning/quizzes/${item.id}`,
            is_restricted: item.is_restricted,
            is_premium: item.is_premium,
          })),
          ...data.game.map(item => ({
            id: item.id,
            type: 'game',
            image: item.image || DEFAULT_IMAGE_PATH,
            title: item.title,
            description: item.description || 'No description available',
            category: item.category || 'Uncategorized',
            link: item.link || `/learning/games/${item.id}`,
            is_restricted: item.is_restricted,
            is_premium: item.is_premium,
          })),
        ];

        const mappedGames = data.game.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description || 'No description available',
          image: item.image || DEFAULT_IMAGE_PATH,
          link: item.link || `/learning/games/${item.id}`,
          is_restricted: item.is_restricted,
          is_premium: item.is_premium,
        }));

        const mappedQuizzes = data.quiz.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description || 'No description available',
          image: item.image || DEFAULT_IMAGE_PATH,
          link: `/learning/quizzes/${item.id}`,
          is_restricted: item.is_restricted,
          is_premium: item.is_premium,
        }));

        setAllCards(mappedCards);
        setGames(mappedGames);
        setQuizzes(mappedQuizzes);
      } catch (error) {
        const errorMessage = error.response
          ? `HTTP ${error.response.status}: ${JSON.stringify(error.response.data)}`
          : error.message || 'Network error or server unreachable';
        console.error('Error fetching learning items:', errorMessage, error);
        setError(errorMessage);
        setAllCards([]);
        setGames([]);
        setQuizzes([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, [isLoggedIn, isPremium, accessToken, API_STRING]);

  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  useEffect(() => {
    const filtered = allCards.filter((card) => {
      if (activeTab === 'all') {
        return selectedFilters.length === 0 || selectedFilters.includes(card.category);
      } else {
        return card.type === activeTab && (selectedFilters.length === 0 || selectedFilters.includes(card.category));
      }
    });
    setShuffledCards(shuffleArray(filtered));
    setCurrentPage(1);
  }, [activeTab, selectedFilters, allCards]);

  const cardsPerPage = 12;
  const indexOfLastCard = currentPage * cardsPerPage;
  const indexOfFirstCard = indexOfLastCard - cardsPerPage;
  const currentCards = shuffledCards.slice(indexOfFirstCard, indexOfLastCard);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const handleTabClick = (tab) => setActiveTab(tab);

  const handleFilterClick = (filter) => {
    if (selectedFilters.includes(filter)) {
      setSelectedFilters(selectedFilters.filter((item) => item !== filter));
    } else {
      setSelectedFilters([...selectedFilters, filter]);
    }
  };

  const clearFilters = () => setSelectedFilters([]);
  const categories = [...new Set(allCards.map((card) => card.category))];

  const handleNextGame = () => {
    setGameIndex((prevIndex) => (prevIndex + 1) % games.length);
  };

  const handlePrevGame = () => {
    setGameIndex((prevIndex) => (prevIndex - 1 + games.length) % games.length);
  };

  const isCardAccessible = (card) => {
    if (card.type === 'game') return true;
    if (!card.is_restricted) return true;
    if (!isLoggedIn) return false;
    if (card.is_premium && !isPremium) return false;
    return true;
  };

  return (
    <div className={styles.learningPage}>
      <header
        className={styles.header}
        style={{ 
          backgroundImage: `url(${isDarkMode ? header_image_dark : header_image_light})` 
        }}
      >
        <h1>Welcome to the Learning Hub</h1>
        <p>Explore tutorials, quizzes, and games to enhance your knowledge!</p>
      </header>

      <div className={styles.breadcrumb}>
        <Link to={'/'}><span>Home</span></Link> / 
        <Link to={'/learning'}><span>Learning</span></Link>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.tabContainer}>
        <div className={styles.tabs}>
          <button className={styles.filterButton} onClick={() => setShowFilters(!showFilters)}>
            <FaFilter />
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'all' ? styles.activeTab : ''}`}
            onClick={() => handleTabClick('all')}
          >
            All
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'learning' ? styles.activeTab : ''}`}
            onClick={() => handleTabClick('learning')}
          >
            Learning
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'quiz' ? styles.activeTab : ''}`}
            onClick={() => handleTabClick('quiz')}
          >
            Quizzes
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'game' ? styles.activeTab : ''}`}
            onClick={() => handleTabClick('game')}
          >
            Games
          </button>
        </div>
      </div>

      {showFilters && (
        <div className={styles.filtersSidebar}>
          <button className={styles.closeButton} onClick={() => setShowFilters(false)}>
            <FaTimes />
          </button>
          <h3>Filters</h3>
          <div className={styles.filterOptions}>
            {activeTab === 'all' && (
              <>
                {categories.map((category) => (
                  <div
                    key={category}
                    className={`${styles.filterItem} ${selectedFilters.includes(category) ? styles.selected : ''}`}
                    onClick={() => handleFilterClick(category)}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </div>
                ))}
              </>
            )}
            {activeTab === 'learning' && (
              <>
                {categories
                  .filter(category => allCards.some(card => card.type === 'learning' && card.category === category))
                  .map(category => (
                    <div
                      key={category}
                      className={`${styles.filterItem} ${selectedFilters.includes(category) ? styles.selected : ''}`}
                      onClick={() => handleFilterClick(category)}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </div>
                  ))}
              </>
            )}
            {activeTab === 'quiz' && (
              <>
                {categories
                  .filter(category => allCards.some(card => card.type === 'quiz' && card.category === category))
                  .map(category => (
                    <div
                      key={category}
                      className={`${styles.filterItem} ${selectedFilters.includes(category) ? styles.selected : ''}`}
                      onClick={() => handleFilterClick(category)}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </div>
                  ))}
              </>
            )}
            {activeTab === 'game' && (
              <>
                {categories
                  .filter(category => allCards.some(card => card.type === 'game' && card.category === category))
                  .map(category => (
                    <div
                      key={category}
                      className={`${styles.filterItem} ${selectedFilters.includes(category) ? styles.selected : ''}`}
                      onClick={() => handleFilterClick(category)}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </div>
                  ))}
              </>
            )}
          </div>
          <div className={styles.filterActions}>
            <button className={styles.saveButton}>Save Changes</button>
            <button className={styles.clearButton} onClick={clearFilters}>Clear Filters</button>
          </div>
        </div>
      )}

      <div className={styles.mainContent}>
        <div className={styles.cardGrid}>
          {isLoading || shuffledCards.length === 0 ? (
            Array(12).fill().map((_, index) => (
              <div key={`skeleton-${index}`} className={styles.cardSkeleton}>
                <div className={styles.skeletonImageContainer}></div>
                <div className={styles.skeletonText}></div>
                <div className={styles.skeletonTextSmall}></div>
              </div>
            ))
          ) : (
            currentCards.map((card) => (
              isCardAccessible(card) ? (
                <Link to={card.link} key={card.id} className={styles.card}>
                  <div className={styles.cardImageContainer}>
                    <img 
                      src={getS3ImagePath(card.image, `card: ${card.title}`, getStaticImagePath) || default_learning_image} 
                      alt={card.title} 
                      className={styles.cardImage}
                      onError={(e) => {
                        console.error(`Card image failed to load: ${card.title}, path: ${getS3ImagePath(card.image, `card: ${card.title}`, getStaticImagePath)}`, e);
                        e.target.src = default_learning_image; // Fallback to default image
                      }}
                    />
                    <div className={styles.cardOverlay}>
                      <h3>{card.title}</h3>
                      <p>{card.description}</p>
                      <div className={styles.cardCategory}>{card.category}</div>
                    </div>
                  </div>
                </Link>
              ) : (
                <div key={card.id} className={styles.card}>
                  <div className={styles.cardImageContainer}>
                    <img 
                      src={getS3ImagePath(card.image, `card: ${card.title}`, getStaticImagePath) || default_learning_image} 
                      alt={card.title} 
                      className={styles.cardImage} 
                      style={{ opacity: 0.5 }}
                      onError={(e) => {
                        console.error(`Card image failed to load: ${card.title}, path: ${getS3ImagePath(card.image, `card: ${card.title}`, getStaticImagePath)}`, e);
                        e.target.src = default_learning_image; // Fallback to default image
                      }}
                    />
                    <div className={styles.cardOverlay}>
                      <h3>{card.title}</h3>
                      <p>{card.description}</p>
                      <div className={styles.cardCategory}>{card.category}</div>
                      <div className={styles.lockOverlay}>
                        <FaLock />
                        <p>{card.is_premium ? 'Premium Required' : 'Login Required'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            ))
          )}
        </div>

        {!isLoading && shuffledCards.length > 0 && (
          <div className={styles.pagination}>
            {Array.from({ length: Math.ceil(shuffledCards.length / cardsPerPage) }, (_, i) => (
              <button
                key={i + 1}
                className={`${styles.pageButton} ${currentPage === i + 1 ? styles.activePage : ''}`}
                onClick={() => paginate(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}

        <div className={styles.gamesSection}>
          <h2>Top Interactive Games</h2>
          <p className={styles.gamesDesc}>
            Discover interactive games that help improve your Punjabi language skills.
          </p>
          <div className={styles.gamesCarousel}>
            {isLoading || games.length === 0 ? (
              <div className={styles.carouselSkeleton}>
                <div className={styles.skeletonImageContainer}></div>
                <div className={styles.skeletonText}></div>
                <div className={styles.skeletonTextSmall}></div>
              </div>
            ) : (
              <>
                <button className={styles.carouselButton} onClick={handlePrevGame}>
                  <FaChevronLeft />
                </button>
                <Link to={games[gameIndex].link} className={styles.carouselContent}>
                  <img 
                    src={getS3ImagePath(games[gameIndex].image, `game: ${games[gameIndex].title}`, getStaticImagePath) || default_learning_image} 
                    alt={games[gameIndex].title}
                    onError={(e) => {
                      console.error(`Game image failed to load: ${games[gameIndex].title}, path: ${getS3ImagePath(games[gameIndex].image, `game: ${games[gameIndex].title}`, getStaticImagePath)}`, e);
                      e.target.src = default_learning_image; // Fallback to default image
                    }}
                  />
                  <h3>{games[gameIndex].title}</h3>
                  <p>{games[gameIndex].description}</p>
                </Link>
                <button className={styles.carouselButton} onClick={handleNextGame}>
                  <FaChevronRight />
                </button>
              </>
            )}
          </div>
        </div>

        <div className={styles.quizzesSection}>
          <h2>Challenge Yourself with these Quizzes</h2>
          <div className={styles.quizzesGrid}>
            {isLoading || quizzes.length === 0 ? (
              Array(6).fill().map((_, index) => (
                <div key={`quiz-skeleton-${index}`} className={styles.quizCardSkeleton}>
                  <div className={styles.skeletonImageContainer}></div>
                  <div className={styles.skeletonText}></div>
                </div>
              ))
            ) : (
              quizzes.map((quiz) => (
                isCardAccessible(quiz) ? (
                  <Link to={quiz.link} key={quiz.id} className={styles.quizCard}>
                    <div className={styles.quizFront}>
                      <img 
                        src={getS3ImagePath(quiz.image, `quiz: ${quiz.title}`, getStaticImagePath) || default_learning_image} 
                        alt={quiz.title}
                        onError={(e) => {
                          console.error(`Quiz image failed to load: ${quiz.title}, path: ${getS3ImagePath(quiz.image, `quiz: ${quiz.title}`, getStaticImagePath)}`, e);
                          e.target.src = default_learning_image; // Fallback to default image
                        }}
                      />
                      <h3>{quiz.title}</h3>
                    </div>
                    <div className={styles.quizBack}>
                      <p>{quiz.description}</p>
                      <button>Start Quiz</button>
                    </div>
                  </Link>
                ) : (
                  <div key={quiz.id} className={styles.quizCard}>
                    <div className={styles.quizFront}>
                      <img 
                        src={getS3ImagePath(quiz.image, `quiz: ${quiz.title}`, getStaticImagePath) || default_learning_image} 
                        alt={quiz.title} 
                        style={{ opacity: 0.5 }}
                        onError={(e) => {
                          console.error(`Quiz image failed to load: ${quiz.title}, path: ${getS3ImagePath(quiz.image, `quiz: ${quiz.title}`, getStaticImagePath)}`, e);
                          e.target.src = default_learning_image; // Fallback to default image
                        }}
                      />
                      <h3>{quiz.title}</h3>
                    </div>
                    <div className={styles.quizBack}>
                      <p>{quiz.description}</p>
                      <div className={styles.lockOverlay}>
                        <FaLock />
                        <p>{quiz.is_premium ? 'Premium Required' : 'Login Required'}</p>
                      </div>
                    </div>
                  </div>
                )
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Learning;