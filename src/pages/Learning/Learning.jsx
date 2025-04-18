import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FaFilter, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import styles from './Learning.module.css';
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


const Learning = ({ isLoggedIn, isDarkMode }) => {
  const getImagePath = useProductionImagePath();
  const [activeTab, setActiveTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [gameIndex, setGameIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [shuffledCards, setShuffledCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const learningImage = 'images/Learning/learning.jpg';
  const quizImage = 'images/Learning/quizzes.jpg';
  const puzzleImage = 'images/Learning/games.jpg';
  const memoryImage = 'images/Learning/memory.jpg';
  const learningCarousel = '/images/Learning/interactive-carousel.jpg';
  const gameTurnCard = '/images/Learning/games-turn-card.jpg';
  const header_image_light = '/images/Learning/header-image.png';
  const header_image_dark = '/images/Learning/header-image-dark.png';



  // Simulate loading
  useEffect(() => {
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(loadingTimer);
  }, []);

  const allCards = useMemo(() => [
    // Learning Tutorials (10 items)
    { id: 1, type: 'learning', image: learningImage, title: 'Punjabi Grammar', description: 'Learn the basics of Punjabi grammar.', category: 'Grammar' },
    { id: 2, type: 'learning', image: learningImage, title: 'Sikhism History', description: 'Explore the rich history of Sikhism.', category: 'History' },
    { id: 3, type: 'learning', image: learningImage, title: 'Gurmukhi Script', description: 'Master the Gurmukhi script.', category: 'Language' },
    { id: 4, type: 'learning', image: learningImage, title: 'Punjabi Vocabulary', description: 'Expand your vocabulary.', category: 'Vocabulary' },
    { id: 5, type: 'learning', image: learningImage, title: 'Punjabi Proverbs', description: 'Discover Punjabi proverbs.', category: 'Culture' },
    { id: 6, type: 'learning', image: learningImage, title: 'Sikh Gurus', description: 'Learn about Sikh Gurus.', category: 'History' },
    { id: 7, type: 'learning', image: learningImage, title: 'Punjabi Poetry', description: 'Explore Punjabi poetry.', category: 'Literature' },
    { id: 8, type: 'learning', image: learningImage, title: 'Punjabi Folklore', description: 'Dive into folklore.', category: 'Culture' },
    { id: 9, type: 'learning', image: learningImage, title: 'Punjabi Music', description: 'Understand Punjabi music.', category: 'Music' },
    { id: 10, type: 'learning', image: learningImage, title: 'Punjabi Cuisine', description: 'Learn about cuisine.', category: 'Food' },
  
    // Quizzes (10 items)
    { id: 11, type: 'quiz', image: quizImage, title: 'Punjabi Grammar Quiz', description: 'Test your grammar knowledge.', category: 'Grammar' },
    { id: 12, type: 'quiz', image: quizImage, title: 'Sikhism Quiz', description: 'Challenge your understanding.', category: 'History' },
    { id: 13, type: 'quiz', image: quizImage, title: 'Gurmukhi Quiz', description: 'Evaluate your expertise.', category: 'Language' },
    { id: 14, type: 'quiz', image: quizImage, title: 'Punjabi Proverbs Quiz', description: 'Test your knowledge.', category: 'Culture' },
    { id: 15, type: 'quiz', image: quizImage, title: 'Sikh Gurus Quiz', description: 'How well do you know them?', category: 'History' },
    { id: 16, type: 'quiz', image: quizImage, title: 'Punjabi Poetry Quiz', description: 'Test your knowledge.', category: 'Literature' },
    { id: 17, type: 'quiz', image: quizImage, title: 'Punjabi Folklore Quiz', description: 'How well do you know?', category: 'Culture' },
    { id: 18, type: 'quiz', image: quizImage, title: 'Punjabi Music Quiz', description: 'Test your knowledge.', category: 'Music' },
    { id: 19, type: 'quiz', image: quizImage, title: 'Punjabi Cuisine Quiz', description: 'How well do you know?', category: 'Food' },
    { id: 20, type: 'quiz', image: quizImage, title: 'Punjabi History Quiz', description: 'Test your knowledge.', category: 'History' },
  
    // Games (10 items)
    { id: 21, type: 'game', image: puzzleImage, title: 'Punjabi Puzzle', description: 'Solve fun puzzles.', category: 'Puzzle' },
    { id: 22, type: 'game', image: memoryImage, title: 'Sikhism Memory Match', description: 'Match terms.', category: 'Memory' },
    { id: 23, type: 'game', image: puzzleImage, title: 'Punjabi Word Search', description: 'Find hidden words.', category: 'Puzzle' },
    { id: 24, type: 'game', image: memoryImage, title: 'Punjabi Proverbs Match', description: 'Match proverbs.', category: 'Memory' },
    { id: 25, type: 'game', image: puzzleImage, title: 'Gurmukhi Crossword', description: 'Solve crossword.', category: 'Puzzle' },
    { id: 26, type: 'game', image: memoryImage, title: 'Sikh Gurus Memory Game', description: 'Match teachings.', category: 'Memory' },
    { id: 27, type: 'game', image: puzzleImage, title: 'Punjabi Literature Trivia', description: 'Answer trivia.', category: 'Trivia' },
    { id: 28, type: 'game', image: memoryImage, title: 'Punjabi Music Match', description: 'Match songs.', category: 'Memory' },
    { id: 29, type: 'game', image: puzzleImage, title: 'Punjabi Cuisine Quiz Game', description: 'Guess dishes.', category: 'Trivia' },
    { id: 30, type: 'game', image: memoryImage, title: 'Punjabi History Trivia', description: 'Test knowledge.', category: 'Trivia' },    
  ], []);

  const games = [
    { 
      id: 21, 
      title: 'Punjabi Puzzle', 
      description: 'Solve fun puzzles.', 
      image: learningCarousel,
      link: '/' 
    },
    { 
      id: 22, 
      title: 'Sikhism Memory Match', 
      description: 'Match terms.', 
      image: gameTurnCard,
      link: '/' 
    },
    { 
      id: 23, 
      title: 'Word Search', 
      description: 'Solve fun puzzles.', 
      image: learningCarousel,
      link: '/learning/games/word-search' 
    },
  ];
  
  const quizzes = [
    { id: 11, title: 'Punjabi Grammar Quiz', description: 'Test your grammar.', image: gameTurnCard },
    { id: 12, title: 'Sikhism Quiz', description: 'Challenge yourself.', image: learningCarousel },
    { id: 13, title: 'Sikhism Quiz', description: 'Challenge yourself.', image: gameTurnCard },
    { id: 14, title: 'Punjabi Grammar Quiz', description: 'Test your grammar.', image: gameTurnCard },
    { id: 15, title: 'Sikhism Quiz', description: 'Challenge yourself.', image: learningCarousel },
    { id: 16, title: 'Sikhism Quiz', description: 'Challenge yourself.', image: gameTurnCard },
  ];

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

  return (
    <div className={styles.learningPage}>
      {/* Header Section */}
      <header
        className={styles.header}
        style={{ 
          backgroundImage: `url(${isDarkMode ? getImagePath(header_image_dark) : getImagePath(header_image_light)})` 
        }}      >
        <h1>Welcome to the Learning Hub</h1>
        <p>Explore tutorials, quizzes, and games to enhance your knowledge!</p>
      </header>

      {/* Breadcrumb Section */}
      <div className={styles.breadcrumb}>
        <Link to={'/'}><span>Home</span></Link> / 
        <Link to={'/learning'}><span> Learning</span></Link>
      </div>

      {/* Tab Buttons and Filters Icon */}
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

      {/* Filters Sidebar */}
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
                <div className={`${styles.filterItem} ${selectedFilters.includes('grammar') ? styles.selected : ''}`} onClick={() => handleFilterClick('grammar')}>Grammar</div>
                <div className={`${styles.filterItem} ${selectedFilters.includes('history') ? styles.selected : ''}`} onClick={() => handleFilterClick('history')}>History</div>
                <div className={`${styles.filterItem} ${selectedFilters.includes('language') ? styles.selected : ''}`} onClick={() => handleFilterClick('language')}>Language</div>
                <div className={`${styles.filterItem} ${selectedFilters.includes('vocabulary') ? styles.selected : ''}`} onClick={() => handleFilterClick('vocabulary')}>Vocabulary</div>
              </>
            )}
            {activeTab === 'quiz' && (
              <>
                <div className={`${styles.filterItem} ${selectedFilters.includes('grammar') ? styles.selected : ''}`} onClick={() => handleFilterClick('grammar')}>Grammar</div>
                <div className={`${styles.filterItem} ${selectedFilters.includes('history') ? styles.selected : ''}`} onClick={() => handleFilterClick('history')}>History</div>
                <div className={`${styles.filterItem} ${selectedFilters.includes('language') ? styles.selected : ''}`} onClick={() => handleFilterClick('language')}>Language</div>
              </>
            )}
            {activeTab === 'game' && (
              <>
                <div className={`${styles.filterItem} ${selectedFilters.includes('puzzle') ? styles.selected : ''}`} onClick={() => handleFilterClick('puzzle')}>Puzzle</div>
                <div className={`${styles.filterItem} ${selectedFilters.includes('memory') ? styles.selected : ''}`} onClick={() => handleFilterClick('memory')}>Memory</div>
                <div className={`${styles.filterItem} ${selectedFilters.includes('trivia') ? styles.selected : ''}`} onClick={() => handleFilterClick('trivia')}>Trivia</div>
              </>
            )}
          </div>
          <div className={styles.filterActions}>
            <button className={styles.saveButton}>Save Changes</button>
            <button className={styles.clearButton} onClick={clearFilters}>Clear Filters</button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Cards Grid */}
        <div className={styles.cardGrid}>
          {isLoading ? (
            Array(12).fill().map((_, index) => (
              <div key={`skeleton-${index}`} className={styles.cardSkeleton}>
                <div className={styles.skeletonImageContainer}>
                </div>
                <div className={styles.skeletonText}></div>
                <div className={styles.skeletonTextSmall}></div>
              </div>
            ))
          ) : (
            currentCards.map((card) => (
              <Link to={`/learning/${card.id}`} key={card.id} className={styles.card}>
                <div className={styles.cardImageContainer}>
                  <img src={card.image} alt={card.title} className={styles.cardImage} />
                  <div className={styles.cardOverlay}>
                    <h3>{card.title}</h3>
                    <p>{card.description}</p>
                    <div className={styles.cardCategory}>{card.category}</div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Pagination Controls */}
        {!isLoading && (
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

        {/* Games Section */}
        <div className={styles.gamesSection}>
          <h2>Top Interactive Games</h2>
          <p className={styles.gamesDesc}>
            Discover interactive games that help improve your Punjabi language skills.
          </p>
          <div className={styles.gamesCarousel}>
            {isLoading ? (
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
                  <img src={getImagePath(games[gameIndex].image)} alt={games[gameIndex].title} />
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

        {/* Quizzes Section */}
        <div className={styles.quizzesSection}>
          <h2>Challenge Yourself with these Quizzes</h2>
          <Link to={'/quizzes/quizz/1'}>
            <div className={styles.quizzesGrid}>
              {isLoading ? (
                Array(6).fill().map((_, index) => (
                  <div key={`quiz-skeleton-${index}`} className={styles.quizCardSkeleton}>
                    <div className={styles.skeletonImageContainer}>
                    </div>
                    <div className={styles.skeletonText}></div>
                  </div>
                ))
              ) : (
                quizzes.map((quiz) => (
                  <div key={quiz.id} className={styles.quizCard}>
                    <div className={styles.quizFront}>
                      <img src={getImagePath(quiz.image)} alt={quiz.title} />
                      <h3>{quiz.title}</h3>
                    </div>
                    <div className={styles.quizBack}>
                      <p>{quiz.description}</p>
                      <button>Start Quiz</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Learning;