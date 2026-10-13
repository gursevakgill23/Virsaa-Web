/**
 * pages/Learning/Learning.jsx
 * -----------------------------------------------------------------------------
 * The Learning hub (/learning): lessons, quizzes and games.
 *   - tabs (All / Lessons / Quizzes / Games) and category chips
 *   - 12 cards per page; locked cards say whether they need sign-in or Premium
 *   - a games spotlight (both built-in games always appear) and a quizzes row
 * Data: /api/learning/items/categorized/ (sent with the token when signed in,
 * so the server can mark what this user can open).
 * -----------------------------------------------------------------------------
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaLock, FaBookOpen, FaQuestionCircle, FaGamepad, FaTimes, FaPlay } from 'react-icons/fa';
import PageHero from '../../components/PageHero/PageHero';
import styles from './Learning.module.css';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

// Picture used when an item has none
const DEFAULT_IMAGE_PATH = '/images/Learning/learning.jpg';

// Public/static images
// Converts image paths for the production build (same helper used across pages)
const getProductionImagePath = (imagePath) => {
  if (process.env.NODE_ENV === 'production') {
    if (typeof imagePath === 'string') {
      return (imagePath.startsWith('/') || /^(https?:|blob:|data:)/i.test(imagePath))
        ? imagePath
        : `/${imagePath.replace(/.*static\/media/, 'static/media')}`;
    }
    return imagePath.default || imagePath;
  }
  return imagePath;
};

// API images come back as full URLs; anything else uses the default image
// First paragraph of a description, used on cards (the full text shows on the lesson page)
// First paragraph of a description, for the card
const summary = (text = '') => String(text).split(/\n\s*\n/)[0].trim();

// The two games that exist in the app (see the routes in App.js)
// Game key → page
const GAME_ROUTES = {
  wordSearch: '/learning/games/shabd-khoj',
  memoryMatch: '/learning/games/memory-match',
};

// Shown in the Games section even when the database has no game rows yet
// Games that always show, even before they're added in the admin
const BUILT_IN_GAMES = [
  {
    id: 'game-word-search',
    title: 'Word Search (Shabad Khoj)',
    description: 'Find hidden Punjabi and English words on themed maps before the timer runs out.',
    image: '/images/Learning/playables.jpg',
    category: 'Games',
    link: GAME_ROUTES.wordSearch,
  },
  {
    id: 'game-memory-match',
    title: 'Memory Match (Virsaa Vich Yaad)',
    description: 'Memorise Punjabi festivals and Sikh symbols, then match each picture with its name.',
    image: '/images/games/lohri.jpg',
    category: 'Games',
    link: GAME_ROUTES.memoryMatch,
  },
];

// Work out which game page a database item opens.
// Uses the item's link when it points at a game route (full URL or path),
// otherwise recognises the game from its title.
// "Completed", "In progress", "Best 7/8" for signed-in users
// "New", "In progress", "Completed"… from the user's progress
const cardStatus = (item) => {
  if (item.my_progress?.status === 'completed') return 'Completed';
  if (item.my_progress) return 'In progress';
  if (item.my_best) {
    const max = item.my_best.max_score;
    return max ? `Best ${item.my_best.score}/${max}` : `Best ${item.my_best.score}`;
  }
  if (item.duration_minutes) return `${item.duration_minutes} min`;
  return '';
};

// Page for a game item from the database
const gameRoute = (item) => {
  if (item.game_key === 'word_search') return GAME_ROUTES.wordSearch;
  if (item.game_key === 'memory_match') return GAME_ROUTES.memoryMatch;
  const known = Object.values(GAME_ROUTES);
  let path = item.link || '';
  try {
    if (path && !path.startsWith('/')) path = new URL(path).pathname;
  } catch {
    path = '';
  }
  path = path.replace(/\/$/, '');
  if (known.includes(path)) return path;

  const title = `${item.title || ''}`.toLowerCase();
  if (/memory|match|yaad/.test(title)) return GAME_ROUTES.memoryMatch;
  if (/word|search|shabad|shabd|khoj/.test(title)) return GAME_ROUTES.wordSearch;
  return GAME_ROUTES.wordSearch;
};

// Use the item's picture only if it's a real URL or site path
const imageUrl = (path) => (typeof path === 'string' && (path.startsWith('http') || path.startsWith('/')) ? path : DEFAULT_IMAGE_PATH);

const handleImgError = (e) => {
  if (e.currentTarget.dataset.fallback) return;
  e.currentTarget.dataset.fallback = '1';
  e.currentTarget.src = DEFAULT_IMAGE_PATH;
};

// Tabs and the label/icon for each content type
const TABS = [
  { id: 'all', label: 'All' },
  { id: 'learning', label: 'Lessons', icon: <FaBookOpen /> },
  { id: 'quiz', label: 'Quizzes', icon: <FaQuestionCircle /> },
  { id: 'game', label: 'Games', icon: <FaGamepad /> },
];

const TYPE_META = {
  learning: { label: 'Lesson', icon: <FaBookOpen /> },
  quiz: { label: 'Quiz', icon: <FaQuestionCircle /> },
  game: { label: 'Game', icon: <FaGamepad /> },
};

// Random order for the library
const shuffleArray = (array) => {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const Learning = ({ isDarkMode, apiString }) => {
  const { isLoggedIn, isPremium, accessToken, API_STRING } = useAuth();
  // Tab, filters, games carousel, page, loading/error state and the loaded items
  const [activeTab, setActiveTab] = useState('all');
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [gameIndex, setGameIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [allCards, setAllCards] = useState([]);
  const [games, setGames] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0); // bumped by "Try again"
  const headerImage = getProductionImagePath(isDarkMode ? '/images/header-image-dark.png' : '/images/header-image.png');

  useEffect(() => {
    let cancelled = false;
    const fetchItems = async () => {
      setIsLoading(true);
      setError(null);
      const apiUrl = (apiString || API_STRING || process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
      try {
        const config = isLoggedIn && accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {};
        const { data } = await axios.get(`${apiUrl}/api/learning/items/categorized/`, { ...config, timeout: 20000 });
        if (cancelled) return;
        const listOf = (value) => (Array.isArray(value) ? value : []);

        const map = (item, type, link) => ({
          id: item.id,
          type,
          image: item.image || DEFAULT_IMAGE_PATH,
          title: item.title,
          description: summary(item.description),
          category: item.category || 'Uncategorized',
          link,
          is_restricted: item.is_restricted,
          is_premium: item.is_premium,
          status: cardStatus(item),
        });

        const learning = listOf(data?.learning).map((i) => map(i, 'learning', `/learning-material/${i.id}`));
        const quiz = listOf(data?.quiz).map((i) => map(i, 'quiz', `/learning/quizzes/${i.id}`));
        const fromDb = listOf(data?.game).map((i) => map(i, 'game', gameRoute(i)));
        // Add any built-in game the database doesn't have yet, so both games always show
        const missing = BUILT_IN_GAMES
          .filter((g) => !fromDb.some((d) => d.link === g.link))
          .map((g) => ({ ...g, type: 'game', is_restricted: false, is_premium: false }));
        const game = [...fromDb, ...missing];

        setAllCards([...learning, ...quiz, ...game]);
        setGames(game);
        setQuizzes(quiz);
      } catch (err) {
        if (cancelled) return;
        console.error('Error fetching learning items:', err.response?.status || err.message);
        setError('Learning items couldn’t be loaded. Check your connection and try again.');
        const builtIns = BUILT_IN_GAMES.map((g) => ({ ...g, type: 'game', is_restricted: false, is_premium: false }));
        setAllCards(builtIns);
        setGames(builtIns);
        setQuizzes([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchItems();
    return () => { cancelled = true; };
  }, [isLoggedIn, isPremium, accessToken, API_STRING, apiString, reloadKey]);

  // Shuffle once per tab/filter change, like before
  const shuffledCards = useMemo(() => {
    const filtered = allCards.filter((card) =>
      (activeTab === 'all' || card.type === activeTab)
      && (selectedFilters.length === 0 || selectedFilters.includes(card.category))
    );
    return shuffleArray(filtered);
  }, [activeTab, selectedFilters, allCards]);

  useEffect(() => setCurrentPage(1), [activeTab, selectedFilters]);

  const cardsPerPage = 12;
  const totalPages = Math.ceil(shuffledCards.length / cardsPerPage);
  const currentCards = shuffledCards.slice((currentPage - 1) * cardsPerPage, currentPage * cardsPerPage);

  // Categories available in the current tab
  const categories = useMemo(
    () => [...new Set(allCards.filter((c) => activeTab === 'all' || c.type === activeTab).map((c) => c.category))],
    [allCards, activeTab]
  );

  // Tab and category chip changes (filters reset when the tab changes)
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setSelectedFilters([]);
  };

  const handleFilterClick = (filter) => {
    setSelectedFilters((prev) => (prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]));
  };

  // Can this user open the card? Otherwise say why and where to go
  const isCardAccessible = (card) => {
    if (card.type === 'game') return true;
    if (!card.is_restricted) return true;
    if (!isLoggedIn) return false;
    if (card.is_premium && !isPremium) return false;
    return true;
  };

  const lockLabel = (card) => (card.is_premium ? 'Premium required' : 'Sign in required');
  const lockLink = (card) => (card.is_premium ? '/premium' : '/login');

  // Games spotlight: next / previous
  const nextGame = () => setGameIndex((i) => (i + 1) % games.length);
  const prevGame = () => setGameIndex((i) => (i - 1 + games.length) % games.length);
  const game = games[gameIndex];

  // One card in the library grid
  const renderCard = (card) => {
    const open = isCardAccessible(card);
    const inner = (
      <>
        <span className={styles.cardMedia}>
          <img src={imageUrl(card.image)} alt="" loading="lazy" onError={handleImgError} className={open ? '' : styles.dimmed} />
          <span className={styles.typeBadge}>
            <span aria-hidden="true">{TYPE_META[card.type].icon}</span> {TYPE_META[card.type].label}
          </span>
          {!open && (
            <span className={styles.lockBadge}><FaLock aria-hidden="true" /> {lockLabel(card)}</span>
          )}
        </span>
        <span className={styles.cardBody}>
          <span className={styles.cardCategory}>{card.category}</span>
          <span className={styles.cardTitle}>{card.title}</span>
          {card.description && <span className={styles.cardText}>{card.description}</span>}
          {card.status && <span className={`${styles.cardStatus} ${card.status === 'Completed' ? styles.cardStatusDone : ''}`}>{card.status}</span>}
        </span>
      </>
    );
    return (
      <Link key={`${card.type}-${card.id}`} to={open ? card.link : lockLink(card)} className={`${styles.card} ${open ? '' : styles.cardLocked}`}>
        {inner}
      </Link>
    );
  };

  return (
    <div className={styles.page}>
      <PageHero
        image={headerImage}
        title="Welcome to the Learning Hub"
        subtitle="Explore tutorials, quizzes, and games to enhance your knowledge!"
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Learning' }]}
      >
        <div className={styles.tabs} role="tablist" aria-label="Type">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => handleTabClick(tab.id)}
            >
              {tab.icon && <span aria-hidden="true">{tab.icon}</span>} {tab.label}
            </button>
          ))}
        </div>
      </PageHero>

      {/* ---------- Category chips ---------- */}
      {categories.length > 1 && (
        <div className={styles.filterBar}>
          <div className={styles.chips} role="group" aria-label="Category">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={`${styles.chip} ${selectedFilters.includes(category) ? styles.chipOn : ''}`}
                onClick={() => handleFilterClick(category)}
                aria-pressed={selectedFilters.includes(category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
            {selectedFilters.length > 0 && (
              <button type="button" className={styles.clearChip} onClick={() => setSelectedFilters([])}>
                <FaTimes aria-hidden="true" /> Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* ---------- Library ---------- */}
      <section className={styles.gridSection} aria-label="Learning library">
        {error && (
          <div className={styles.emptyNote} role="alert">
            <p>{error}</p>
            <button type="button" className={styles.textButton} onClick={() => setReloadKey((k) => k + 1)}>Try again</button>
          </div>
        )}
        {!error && !isLoading && shuffledCards.length === 0 && (
          <p className={styles.emptyNote}>Nothing here yet. Try another tab or clear the filters.</p>
        )}
        <div className={styles.cardGrid}>
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={`s-${i}`} className={styles.card} aria-hidden="true">
                  <span className={`${styles.cardMedia} ${styles.skeleton}`} />
                  <span className={styles.cardBody}>
                    <span className={`${styles.skeleton} ${styles.skeletonLine}`} />
                    <span className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonShort}`} />
                  </span>
                </div>
              ))
            : currentCards.map(renderCard)}
        </div>

        {totalPages > 1 && (
          <nav className={styles.pagination} aria-label="Pages">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                type="button"
                className={currentPage === i + 1 ? styles.activePage : ''}
                onClick={() => setCurrentPage(i + 1)}
                aria-current={currentPage === i + 1 ? 'page' : undefined}
              >
                {i + 1}
              </button>
            ))}
          </nav>
        )}
      </section>

      {/* ---------- Games spotlight ---------- */}
      {(isLoading || games.length > 0) && (
        <section className={styles.section} aria-labelledby="games-title">
          <h2 id="games-title" className={styles.sectionTitle}>Top Interactive Games</h2>
          <p className={styles.lede}>Discover interactive games that help improve your Punjabi language skills.</p>

          {isLoading || !game ? (
            <div className={`${styles.spotlight} ${styles.skeleton}`} aria-hidden="true" />
          ) : (
            <div className={styles.spotlight}>
              <img src={imageUrl(game.image)} alt="" className={styles.spotlightImage} onError={handleImgError} />
              <div className={styles.spotlightGlass}>
                <span className={styles.spotlightCount}>{gameIndex + 1} / {games.length}</span>
                <h3>{game.title}</h3>
                {game.description && <p>{game.description}</p>}
                <Link to={game.link} className={styles.primaryButton}>
                  <FaPlay aria-hidden="true" /> Play now
                </Link>
              </div>
              {games.length > 1 && (
                <div className={styles.spotlightNav}>
                  <button type="button" onClick={prevGame} aria-label="Previous game"><FaChevronLeft /></button>
                  <button type="button" onClick={nextGame} aria-label="Next game"><FaChevronRight /></button>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* ---------- Quizzes ---------- */}
      {(isLoading || quizzes.length > 0) && (
        <section className={styles.section} aria-labelledby="quizzes-title">
          <h2 id="quizzes-title" className={styles.sectionTitle}>Challenge Yourself with these Quizzes</h2>
          <div className={styles.quizGrid}>
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => <div key={`q-${i}`} className={`${styles.quizCard} ${styles.skeleton}`} aria-hidden="true" />)
              : quizzes.map((quiz) => {
                  const open = isCardAccessible(quiz);
                  return (
                    <article key={quiz.id} className={styles.quizCard}>
                      <img src={imageUrl(quiz.image)} alt="" className={`${styles.quizImage} ${open ? '' : styles.dimmed}`} loading="lazy" onError={handleImgError} />
                      <div className={styles.quizBody}>
                        <h3>{quiz.title}</h3>
                        {quiz.description && <p>{quiz.description}</p>}
                        {open ? (
                          <Link to={quiz.link} className={styles.primaryButton}>Start quiz</Link>
                        ) : (
                          <Link to={lockLink(quiz)} className={styles.secondaryButton}>
                            <FaLock aria-hidden="true" /> {lockLabel(quiz)}
                          </Link>
                        )}
                      </div>
                    </article>
                  );
                })}
          </div>
        </section>
      )}
    </div>
  );
};

export default Learning;
