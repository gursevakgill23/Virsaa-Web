
import React, { useState, useEffect, useMemo } from 'react'; // Add useMemo
import { Link } from 'react-router-dom';
import { FaFilter, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import styles from './Learning.module.css';
import learningImage from '../../images/Learning/learning.jpg';
import quizImage from '../../images/Learning/quizzes.jpg';
import puzzleImage from '../../images/Learning/games.jpg';
import memoryImage from '../../images/Learning/quizzes.jpg';
import learningCarousel from '../../images/Learning/interactive-carousel.jpg';
import gameTurnCard from '../../images/Learning/games-turn-card.jpg';
import header_image_light from '../../images/Learning/header-image.png'; // Light mode image
import header_image_dark from '../../images/Learning/header-image-dark.png'; // Dark mode image

const Learning = ({ isLoggedIn, isDarkMode }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [gameIndex, setGameIndex] = useState(0); // For games carousel
  const [currentPage, setCurrentPage] = useState(1); // For pagination
  const [shuffledCards, setShuffledCards] = useState([]); // Shuffled cards

  // Memoize the allCards array to prevent unnecessary re-renders
  const allCards = useMemo(() => [
    // Learning Tutorials (10 items)
    {
      id: 1,
      type: 'learning',
      image: learningImage,
      title: 'Punjabi Grammar',
      description: 'Learn the basics of Punjabi grammar and sentence structure.',
      category: 'Grammar',
    },
    {
      id: 2,
      type: 'learning',
      image: learningImage,
      title: 'Sikhism History',
      description: 'Explore the rich history and teachings of Sikhism.',
      category: 'History',
    },
    {
      id: 3,
      type: 'learning',
      image: learningImage,
      title: 'Gurmukhi Script',
      description: 'Master the Gurmukhi script used in Punjabi literature.',
      category: 'Language',
    },
    {
      id: 4,
      type: 'learning',
      image: learningImage,
      title: 'Punjabi Vocabulary',
      description: 'Expand your Punjabi vocabulary with common words and phrases.',
      category: 'Vocabulary',
    },
    {
      id: 5,
      type: 'learning',
      image: learningImage,
      title: 'Punjabi Proverbs',
      description: 'Discover the wisdom of Punjabi proverbs and their meanings.',
      category: 'Culture',
    },
    {
      id: 6,
      type: 'learning',
      image: learningImage,
      title: 'Sikh Gurus',
      description: 'Learn about the lives and teachings of the Sikh Gurus.',
      category: 'History',
    },
    {
      id: 7,
      type: 'learning',
      image: learningImage,
      title: 'Punjabi Poetry',
      description: 'Explore the beauty of Punjabi poetry and its famous poets.',
      category: 'Literature',
    },
    {
      id: 8,
      type: 'learning',
      image: learningImage,
      title: 'Punjabi Folklore',
      description: 'Dive into the rich world of Punjabi folklore and legends.',
      category: 'Culture',
    },
    {
      id: 9,
      type: 'learning',
      image: learningImage,
      title: 'Punjabi Music',
      description: 'Understand the history and styles of Punjabi music.',
      category: 'Music',
    },
    {
      id: 10,
      type: 'learning',
      image: learningImage,
      title: 'Punjabi Cuisine',
      description: 'Learn about traditional Punjabi dishes and their recipes.',
      category: 'Food',
    },
  
    // Quizzes (10 items)
    {
      id: 11,
      type: 'quiz',
      image: quizImage,
      title: 'Punjabi Grammar Quiz',
      description: 'Test your knowledge of Punjabi grammar.',
      category: 'Grammar',
    },
    {
      id: 12,
      type: 'quiz',
      image: quizImage,
      title: 'Sikhism Quiz',
      description: 'Challenge your understanding of Sikhism.',
      category: 'History',
    },
    {
      id: 13,
      type: 'quiz',
      image: quizImage,
      title: 'Gurmukhi Quiz',
      description: 'Evaluate your expertise in the Gurmukhi script.',
      category: 'Language',
    },
    {
      id: 14,
      type: 'quiz',
      image: quizImage,
      title: 'Punjabi Proverbs Quiz',
      description: 'Test your knowledge of Punjabi proverbs.',
      category: 'Culture',
    },
    {
      id: 15,
      type: 'quiz',
      image: quizImage,
      title: 'Sikh Gurus Quiz',
      description: 'How well do you know the Sikh Gurus?',
      category: 'History',
    },
    {
      id: 16,
      type: 'quiz',
      image: quizImage,
      title: 'Punjabi Poetry Quiz',
      description: 'Test your knowledge of Punjabi poetry.',
      category: 'Literature',
    },
    {
      id: 17,
      type: 'quiz',
      image: quizImage,
      title: 'Punjabi Folklore Quiz',
      description: 'How well do you know Punjabi folklore?',
      category: 'Culture',
    },
    {
      id: 18,
      type: 'quiz',
      image: quizImage,
      title: 'Punjabi Music Quiz',
      description: 'Test your knowledge of Punjabi music.',
      category: 'Music',
    },
    {
      id: 19,
      type: 'quiz',
      image: quizImage,
      title: 'Punjabi Cuisine Quiz',
      description: 'How well do you know Punjabi cuisine?',
      category: 'Food',
    },
    {
      id: 20,
      type: 'quiz',
      image: quizImage,
      title: 'Punjabi History Quiz',
      description: 'Test your knowledge of Punjabi history.',
      category: 'History',
    },
  
    // Games (10 items)
    {
      id: 21,
      type: 'game',
      image: puzzleImage,
      title: 'Punjabi Puzzle',
      description: 'Solve fun puzzles related to Punjabi language.',
      category: 'Puzzle',
    },
    {
      id: 22,
      type: 'game',
      image: memoryImage,
      title: 'Sikhism Memory Match',
      description: 'Match terms and concepts related to Sikhism.',
      category: 'Memory',
    },
    {
      id: 23,
      type: 'game',
      image: puzzleImage,
      title: 'Punjabi Word Search',
      description: 'Find hidden Punjabi words in a grid.',
      category: 'Puzzle',
    },
    {
      id: 24,
      type: 'game',
      image: memoryImage,
      title: 'Punjabi Proverbs Match',
      description: 'Match Punjabi proverbs with their meanings.',
      category: 'Memory',
    },
    {
      id: 25,
      type: 'game',
      image: puzzleImage,
      title: 'Gurmukhi Crossword',
      description: 'Solve a crossword puzzle using Gurmukhi script.',
      category: 'Puzzle',
    },
    {
      id: 26,
      type: 'game',
      image: memoryImage,
      title: 'Sikh Gurus Memory Game',
      description: 'Match the Sikh Gurus with their teachings.',
      category: 'Memory',
    },
    {
      id: 27,
      type: 'game',
      image: puzzleImage,
      title: 'Punjabi Literature Trivia',
      description: 'Answer trivia questions about Punjabi literature.',
      category: 'Trivia',
    },
    {
      id: 28,
      type: 'game',
      image: memoryImage,
      title: 'Punjabi Music Match',
      description: 'Match Punjabi songs with their artists.',
      category: 'Memory',
    },
    {
      id: 29,
      type: 'game',
      image: puzzleImage,
      title: 'Punjabi Cuisine Quiz Game',
      description: 'Guess the dish based on its description.',
      category: 'Trivia',
    },
    {
      id: 30,
      type: 'game',
      image: memoryImage,
      title: 'Punjabi History Trivia',
      description: 'Test your knowledge of Punjabi history.',
      category: 'Trivia',
    },    
  ], []); // Empty dependency array ensures this is only computed once
   // Games Data
   const games = [
    {
      id: 21,
      title: 'Punjabi Puzzle',
      description: 'Solve fun puzzles related to Punjabi language.',
      image: learningCarousel,
    },
    {
      id: 22,
      title: 'Sikhism Memory Match',
      description: 'Match terms and concepts related to Sikhism.',
      image: gameTurnCard,
    },
    {
      id: 23,
      title: 'Punjabi Puzzle',
      description: 'Solve fun puzzles related to Punjabi language.',
      image: learningCarousel,
    },  ];

  // Quizzes Data
  const quizzes = [
    {
      id: 11,
      title: 'Punjabi Grammar Quiz',
      description: 'Test your knowledge of Punjabi grammar.',
      image: gameTurnCard,
    },
    {
      id: 12,
      title: 'Sikhism Quiz',
      description: 'Challenge your understanding of Sikhism.',
      image: learningCarousel,
    },
    {
      id: 13,
      title: 'Sikhism Quiz',
      description: 'Challenge your understanding of Sikhism.',
      image: gameTurnCard,
    },
    {
      id: 14,
      title: 'Punjabi Grammar Quiz',
      description: 'Test your knowledge of Punjabi grammar.',
      image: gameTurnCard,
    },
    {
      id: 15,
      title: 'Sikhism Quiz',
      description: 'Challenge your understanding of Sikhism.',
      image: learningCarousel,
    },
    {
      id: 16,
      title: 'Sikhism Quiz',
      description: 'Challenge your understanding of Sikhism.',
      image: gameTurnCard,
    },
  ];
  // Shuffle the cards array
  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  // Shuffle cards on component mount or when filters change
  useEffect(() => {
    const filtered = allCards.filter((card) => {
      if (activeTab === 'all') {
        return selectedFilters.length === 0 || selectedFilters.includes(card.category);
      } else {
        return card.type === activeTab && (selectedFilters.length === 0 || selectedFilters.includes(card.category));
      }
    });
    setShuffledCards(shuffleArray(filtered));
    setCurrentPage(1); // Reset to first page after shuffling
  }, [activeTab, selectedFilters, allCards]); // Add allCards to the dependency array

  // Pagination logic
  const cardsPerPage = 12;
  const indexOfLastCard = currentPage * cardsPerPage;
  const indexOfFirstCard = indexOfLastCard - cardsPerPage;
  const currentCards = shuffledCards.slice(indexOfFirstCard, indexOfLastCard);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Handle tab click
  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  // Handle filter click
  const handleFilterClick = (filter) => {
    if (selectedFilters.includes(filter)) {
      setSelectedFilters(selectedFilters.filter((item) => item !== filter));
    } else {
      setSelectedFilters([...selectedFilters, filter]);
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSelectedFilters([]);
  };

  // Get unique categories for filters
  const categories = [...new Set(allCards.map((card) => card.category))];

  // Games Carousel Navigation
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
        style={{ backgroundImage: `url(${isDarkMode ? header_image_dark : header_image_light})` }}
      >
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
            {/* Show all filters when "All" tab is selected */}
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
            {/* Show specific filters for other tabs */}
            {activeTab === 'learning' && (
              <>
                <div
                  className={`${styles.filterItem} ${selectedFilters.includes('grammar') ? styles.selected : ''}`}
                  onClick={() => handleFilterClick('grammar')}
                >
                  Grammar
                </div>
                <div
                  className={`${styles.filterItem} ${selectedFilters.includes('history') ? styles.selected : ''}`}
                  onClick={() => handleFilterClick('history')}
                >
                  History
                </div>
                <div
                  className={`${styles.filterItem} ${selectedFilters.includes('language') ? styles.selected : ''}`}
                  onClick={() => handleFilterClick('language')}
                >
                  Language
                </div>
                <div
                  className={`${styles.filterItem} ${selectedFilters.includes('vocabulary') ? styles.selected : ''}`}
                  onClick={() => handleFilterClick('vocabulary')}
                >
                  Vocabulary
                </div>
              </>
            )}
            {activeTab === 'quiz' && (
              <>
                <div
                  className={`${styles.filterItem} ${selectedFilters.includes('grammar') ? styles.selected : ''}`}
                  onClick={() => handleFilterClick('grammar')}
                >
                  Grammar
                </div>
                <div
                  className={`${styles.filterItem} ${selectedFilters.includes('history') ? styles.selected : ''}`}
                  onClick={() => handleFilterClick('history')}
                >
                  History
                </div>
                <div
                  className={`${styles.filterItem} ${selectedFilters.includes('language') ? styles.selected : ''}`}
                  onClick={() => handleFilterClick('language')}
                >
                  Language
                </div>
              </>
            )}
            {activeTab === 'game' && (
              <>
                <div
                  className={`${styles.filterItem} ${selectedFilters.includes('puzzle') ? styles.selected : ''}`}
                  onClick={() => handleFilterClick('puzzle')}
                >
                  Puzzle
                </div>
                <div
                  className={`${styles.filterItem} ${selectedFilters.includes('memory') ? styles.selected : ''}`}
                  onClick={() => handleFilterClick('memory')}
                >
                  Memory
                </div>
                <div
                  className={`${styles.filterItem} ${selectedFilters.includes('trivia') ? styles.selected : ''}`}
                  onClick={() => handleFilterClick('trivia')}
                >
                  Trivia
                </div>
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
          {currentCards.map((card) => (
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
          ))}
        </div>

        {/* Pagination Controls */}
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

        {/* Games Section */}
        <div className={styles.gamesSection}>
          <h2>Top Interactive Games</h2>
          <p className={styles.gamesDesc}>
            Discover interactive games that help improve your Punjabi language skills. 
            Choose from our variety of games, including memory, trivia, 
            and puzzle-solving.
          </p>
          <div className={styles.gamesCarousel}>
            <button className={styles.carouselButton} onClick={handlePrevGame}>
              <FaChevronLeft />
            </button>
            <div className={styles.carouselContent}>
              <img src={games[gameIndex].image} alt={games[gameIndex].title} />
              <h3>{games[gameIndex].title}</h3>
              <p>{games[gameIndex].description}</p>
            </div>
            <button className={styles.carouselButton} onClick={handleNextGame}>
              <FaChevronRight />
            </button>
          </div>
        </div>

        {/* Quizzes Section */}
        <div className={styles.quizzesSection}>
          <h2>Challenge Yourself with these Quizzes</h2>
          <Link to={'/quizzes/1'}>
          <div className={styles.quizzesGrid}>
            {quizzes.map((quiz) => (
              <div key={quiz.id} className={styles.quizCard}>
                <div className={styles.quizFront}>
                  <img src={quiz.image} alt={quiz.title} />
                  <h3>{quiz.title}</h3>
                </div>
                <div className={styles.quizBack}>
                  <p>{quiz.description}</p>
                  <button>Start Quiz</button>
                </div>
              </div>
            ))}
          </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Learning;