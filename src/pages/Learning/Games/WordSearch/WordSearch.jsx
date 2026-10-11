/**
 * WordSearch.jsx
 * A cinematic Word Search game component for the Virsaa project.
 * Features a dedicated game navbar, map selection, multilingual support (Punjabi/English),
 * timer-based gameplay, achievements, top scorers, hints, coin system, and user profile management.
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../../../context/AuthContext';
import learningApi from '../../../../api/learningApi';
import BadgeIcon from '../../../../components/BadgeIcon/BadgeIcon';
import useGameWallet from '../useGameWallet';
import styles from './WordSearch.module.css';
import { Howl } from 'howler';
import { FaLock, FaCoins, FaTrophy, FaCrown, FaUser, FaSignInAlt, FaInfoCircle, FaLightbulb, FaGem, FaEdit, FaCreditCard, FaTrash, FaSignOutAlt, FaGamepad, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { GiTreasureMap, GiClockwork, GiStairsGoal } from 'react-icons/gi';
import { IoMdTimer, IoMdSettings } from 'react-icons/io';
import { MdLeaderboard, MdStars } from 'react-icons/md';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { SOUND_URLS, themeBackground } from '../gameAssets';

const playable1 = '/images/Learning/playables.jpg';
const avatar = '/images/Learning/avatar.jpg';
const userDefault = '/images/games/user-default.jpg';

const useProductionImagePath = () => {
  return (imagePath) => {
    if (process.env.NODE_ENV === 'production') {
      if (typeof imagePath === 'string') {
        return (imagePath.startsWith('/') || /^(https?:|blob:|data:)/i.test(imagePath)) 
          ? imagePath 
          : `/${imagePath.replace(/.*static\/media/, 'static/media')}`;
      } else {
        return imagePath.default || imagePath;
      }
    }
    return imagePath;
  };
};

const GAME_KEY = 'word_search';

// Initialize sound effects for the game
const sounds = {
  complete: new Howl({ src: [SOUND_URLS.complete] }),
  achievement: new Howl({ src: [SOUND_URLS.levelUp] }),
  coin: new Howl({ src: [SOUND_URLS.found] }),
  wordFound: new Howl({ src: [SOUND_URLS.found] }),
  error: new Howl({ src: [SOUND_URLS.error] }),
};

// Top scorers this month from the server
const fetchTopScorers = async (apiString) => {
  const data = await learningApi.leaderboard(apiString, { game_key: GAME_KEY, period: 'month', limit: 5 });
  return (data.results || []).map((row) => ({
    id: row.user_id,
    name: row.name,
    score: row.score,
    avatar: row.avatar || avatar,
  }));
};

// Achievements for this game (and general ones) with the player's progress
const fetchUserAchievements = async (apiString, token) => {
  const data = await learningApi.achievements(apiString, token, GAME_KEY);
  return (data.achievements || []).map((a) => ({
    id: a.key,
    name: a.name,
    description: a.description,
    earned: a.earned,
    icon: <BadgeIcon name={a.icon} image={a.image} />,
    progress: !a.earned && a.target > 1 ? `${a.current}/${a.target}` : null,
  }));
};

// The player's Word Search record from the server
const fetchUserGameStats = async (apiString, token) => {
  const { stats } = await learningApi.summary(apiString, token);
  const game = stats.per_game?.[GAME_KEY] || {};
  return {
    totalMatches: game.played || 0,
    wins: game.won || 0,
    losses: (game.played || 0) - (game.won || 0),
    totalCoinsWon: stats.coins_earned_total || 0,
    totalCoinsLostOnHints: stats.coins_spent_total || 0,
  };
};

// Mock API to fetch user payment methods (to be replaced with actual API)
const fetchPaymentMethods = async (userId) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  if (!userId) return [];
  return [
    { id: 1, type: 'Credit Card', lastFour: '1234', expiry: '12/25' },
    { id: 2, type: 'PayPal', email: 'user@example.com' },
  ];
};

// Words come from the server (Admin > Learning api > Game words), by map level and difficulty
const fetchWords = async (apiString, map, difficulty, language) => {
  try {
    const levelRange = map.id <= 10 ? '1-10' : '11-20';
    const data = await learningApi.gameWords(apiString, GAME_KEY, {
      level: levelRange,
      difficulty: difficulty.toLowerCase(),
      count: 10,
    });
    const words = data.words || [];
    if (words.length < 5) {
      throw new Error(`Not enough words for level ${levelRange}, difficulty ${difficulty}`);
    }
    return words.map((w) => (language === 'punjabi' ? w.punjabi : w.word));
  } catch (error) {
    console.error('Error fetching words:', error.response?.status || error.message);
    return [];
  }
};

// Game maps configuration with free, premium, login-only, and new Snow/Sand maps
const gameMaps = [
  { id: 1, name: 'Punjabi Basics', description: 'Learn basic Punjabi words', difficulty: 'Easy', timeLimit: 300, entryFee: 0, reward: 50, premium: false, loginRequired: false, size: 10, language: 'punjabi', theme: 'traditional' },
  { id: 2, name: 'Advanced Vocabulary', description: 'Challenge with advanced Punjabi words', difficulty: 'Medium', timeLimit: 420, entryFee: 0, reward: 75, premium: false, loginRequired: false, size: 12, language: 'punjabi', theme: 'cultural' },
  { id: 3, name: 'Gurmukhi Legacy', description: 'Explore historical Punjabi words', difficulty: 'Hard', timeLimit: 600, entryFee: 25, reward: 150, premium: true, loginRequired: false, size: 15, language: 'punjabi', theme: 'gold' },
  { id: 4, name: 'English Basics', description: 'Simple English words', difficulty: 'Easy', timeLimit: 240, entryFee: 0, reward: 40, premium: false, loginRequired: false, size: 10, language: 'english', theme: 'nature' },
  { id: 5, name: 'English Advanced', description: 'Tougher English words', difficulty: 'Medium', timeLimit: 360, entryFee: 10, reward: 100, premium: false, loginRequired: true, size: 12, language: 'english', theme: 'abstract' },
  { id: 6, name: 'Jungle Expedition', description: 'Wildlife related words', difficulty: 'Medium', timeLimit: 360, entryFee: 15, reward: 120, premium: false, loginRequired: true, size: 12, language: 'english', theme: 'jungle' },
  { id: 7, name: 'Mountain Trek', description: 'Adventure and nature words', difficulty: 'Hard', timeLimit: 480, entryFee: 20, reward: 180, premium: true, loginRequired: false, size: 14, language: 'english', theme: 'mountain' },
  { id: 8, name: 'Cosmic Voyage', description: 'Space-themed premium challenge', difficulty: 'Hard', timeLimit: 600, entryFee: 30, reward: 200, premium: true, loginRequired: false, size: 15, language: 'english', theme: 'cosmic' },
  { id: 9, name: 'Mystic Realms', description: 'Fantasy words for premium users', difficulty: 'Hard', timeLimit: 540, entryFee: 25, reward: 180, premium: true, loginRequired: false, size: 14, language: 'english', theme: 'mystic' },
  { id: 10, name: 'Punjabi Poetry', description: 'Poetic Punjabi words', difficulty: 'Medium', timeLimit: 480, entryFee: 20, reward: 150, premium: true, loginRequired: false, size: 12, language: 'punjabi', theme: 'poetry' },
  { id: 11, name: 'Snowy Slopes', description: 'Winter-themed words', difficulty: 'Medium', timeLimit: 420, entryFee: 15, reward: 120, premium: false, loginRequired: true, size: 12, language: 'english', theme: 'snow' },
  { id: 12, name: 'Sandy Dunes', description: 'Desert-themed words', difficulty: 'Hard', timeLimit: 540, entryFee: 20, reward: 160, premium: false, loginRequired: true, size: 14, language: 'english', theme: 'sand' },
];

// Virsaa Playables data
const virsaaPlayables = [
  {
    id: 1,
    name: 'Punjabi Puzzle',
    description: 'Solve puzzles in Punjabi',
    image: playable1,
    link: '/learning/games/shabd-khoj'
  },
  {
    id: 2,
    name: 'Gurmukhi Match',
    description: 'Match Gurmukhi characters',
    image: playable1,
    link: '/learning/games/memory-match'
  },
  {
    id: 3,
    name: 'Shabad Quiz',
    description: 'Test your knowledge of Shabads',
    image: playable1,
    link: '/learning'
  },
  {
    id: 4,
    name: 'Sikh History Trivia',
    description: 'Learn Sikh history through trivia',
    image: playable1,
    link: '/learning'
  },
  {
    id: 5,
    name: 'Shabd Khoj',
    description: 'Learn Sikh history through trivia',
    image: playable1,
    link: '/learning'
  },
  {
    id: 6,
    name: 'Gurmukhi Match',
    description: 'Match Gurmukhi characters',
    image: playable1,
    link: '/learning/games/memory-match'
  },
  {
    id: 7,
    name: 'Shabad Quiz',
    description: 'Test your knowledge of Shabads',
    image: playable1,
    link: '/learning'
  },
  {
    id: 8,
    name: 'Sikh History Trivia',
    description: 'Learn Sikh history through trivia',
    image: playable1,
    link: '/learning'
  },
  {
    id: 9,
    name: 'Shabd Khoj',
    description: 'Learn Sikh history through trivia',
    image: playable1,
    link: '/learning'
  },
  {
    id: 10,
    name: 'Punjabi Puzzle',
    description: 'Solve puzzles in Punjabi',
    image: playable1,
    link: '/learning/games/shabd-khoj'
  },
  {
    id: 11,
    name: 'Gurmukhi Match',
    description: 'Match Gurmukhi characters',
    image: playable1,
    link: '/learning/games/memory-match'
  },
  {
    id: 12,
    name: 'Shabad Quiz',
    description: 'Test your knowledge of Shabads',
    image: playable1,
    link: '/learning'
  },
  {
    id: 13,
    name: 'Sikh History Trivia',
    description: 'Learn Sikh history through trivia',
    image: playable1,
    link: '/learning'
  },
  {
    id: 14,
    name: 'Shabd Khoj',
    description: 'Learn Sikh history through trivia',
    image: playable1,
    link: '/learning'
  },
  {
    id: 15,
    name: 'Gurmukhi Match',
    description: 'Match Gurmukhi characters',
    image: playable1,
    link: '/learning/games/memory-match'
  },
  {
    id: 16,
    name: 'Shabad Quiz',
    description: 'Test your knowledge of Shabads',
    image: playable1,
    link: '/learning'
  },
  {
    id: 17,
    name: 'Sikh History Trivia',
    description: 'Learn Sikh history through trivia',
    image: playable1,
    link: '/learning'
  },
  {
    id: 18,
    name: 'Shabd Khoj',
    description: 'Learn Sikh history through trivia',
    image: playable1,
    link: '/learning'
  },
];

// Define difficulty levels with time multipliers and colors
const difficultyLevels = [
  { id: 'easy', name: 'Easy', timeMultiplier: 1.2, color: '#4CAF50' },
  { id: 'medium', name: 'Medium', timeMultiplier: 1.0, color: '#FF9800' },
  { id: 'hard', name: 'Hard', timeMultiplier: 0.8, color: '#F44336' },
];

// Main component to handle opening the game in a new tab
const WordSearch = () => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const hasOpenedGame = sessionStorage.getItem('wordSearchTabOpened');
    if (hasOpenedGame) return;

    sessionStorage.setItem('wordSearchTabOpened', 'true');
    const gameUrl = '/learning/games/shabd-khoj';
    const newWindow = window.open(gameUrl, '_blank');
    if (newWindow) {
      newWindow.focus();
      navigate('/');
    }

    return () => {
      sessionStorage.removeItem('wordSearchTabOpened');
    };
  }, [isLoggedIn, navigate]);

  return null;
};

// GamePlay component to be rendered in the new tab
const WordSearchGamePlay = ({ apiString }) => {
  const getImagePath = useProductionImagePath();

  const { isLoggedIn, isPremium, accessToken, userData: authUser, logout } = useAuth();
  // Coins, XP and the game name/avatar: saved on the server when signed in, in the browser for guests
  const wallet = useGameWallet({ apiString, accessToken, isLoggedIn, gameKey: GAME_KEY });
  const defaultName = [authUser?.first_name, authUser?.last_name].filter(Boolean).join(' ') || authUser?.username || 'Player';
  const userData = useMemo(() => (authUser ? {
    ...authUser,
    isPremium,
    coins: wallet.coins,
    xp: wallet.xp,
    welcomeBonusGiven: wallet.welcomeBonusGiven,
    name: wallet.name || defaultName,
    avatar: wallet.avatar || authUser.profile_photo || '',
  } : null), [authUser, isPremium, wallet.coins, wallet.xp, wallet.welcomeBonusGiven, wallet.name, wallet.avatar, defaultName]);
  const navigate = useNavigate();

  // State management for the game
  const [gameState, setGameState] = useState('select');
  const [selectedMap, setSelectedMap] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState(difficultyLevels[1]);
  const [board, setBoard] = useState([]);
  const [wordsToFind, setWordsToFind] = useState([]);
  const [foundWords, setFoundWords] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const coins = wallet.coins;
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [playAsGuest, setPlayAsGuest] = useState(false);
  const [topScorers, setTopScorers] = useState([]);
  const [loadingTopScorers, setLoadingTopScorers] = useState(true);
  const [userAchievements, setUserAchievements] = useState([]);
  const [loadingAchievements, setLoadingAchievements] = useState(true);
  const [settings, setSettings] = useState({
    soundEnabled: true,
    constantDifficulty: false,
    language: 'english',
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showBuyCoins, setShowBuyCoins] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectedCells, setSelectedCells] = useState([]);
  const [wordPositions, setWordPositions] = useState({});
  const [showWelcomeBonus, setShowWelcomeBonus] = useState(false);
  const [welcomeBonusAmount, setWelcomeBonusAmount] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [userStats, setUserStats] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [editingProfile, setEditingProfile] = useState(false);
  const [newName, setNewName] = useState(userData?.name || '');
  const [newAvatar, setNewAvatar] = useState(userData?.avatar || userDefault);
  const [newAvatarFile, setNewAvatarFile] = useState(null);
  const [lastResult, setLastResult] = useState(null);   // server reply after a game: badges, best score
  const scoreRef = useRef(0);
  const foundCountRef = useRef(0);
  const [gameWon, setGameWon] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('game'); // New state for tab navigation
  const [displayCount, setDisplayCount] = useState(6); // Updated for Virsaa Playables
  const timerRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const mapsContainerRef = useRef(null);
  const [isTabDropdownOpen, setIsTabDropdownOpen] = useState(false);

  // Scroll maps horizontally
  const scrollMaps = (direction) => {
    if (mapsContainerRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      mapsContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Effect to handle welcome bonus on first load
  // (the server decides the amount and gives it only once per account)
  const { loaded: walletLoaded, welcomeBonusGiven, claimWelcomeBonus } = wallet;
  useEffect(() => {
    if (!walletLoaded || welcomeBonusGiven) return undefined;
    let cancelled = false;
    claimWelcomeBonus().then((bonus) => {
      if (cancelled || !bonus) return;
      setWelcomeBonusAmount(bonus);
      setShowWelcomeBonus(true);
      if (settings.soundEnabled) sounds.coin.play();
      setTimeout(() => setShowWelcomeBonus(false), 5000);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletLoaded, welcomeBonusGiven, claimWelcomeBonus]);

  // Tell the player if their coins couldn't be loaded
  useEffect(() => {
    if (wallet.error) toast.error(wallet.error, { toastId: 'wallet-error' });
  }, [wallet.error]);

  // Keep the latest score for the timer, which runs outside React's render cycle
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { foundCountRef.current = foundWords.length; }, [foundWords]);

  // Effect to load top scorers, achievements, user stats, and payment methods
  useEffect(() => {
    const loadData = async () => {
      try {
        const scorers = await fetchTopScorers(apiString).catch(() => []);
        setTopScorers(scorers);
        setLoadingTopScorers(false);

        if (isLoggedIn && accessToken) {
          const [achievements, stats] = await Promise.all([
            fetchUserAchievements(apiString, accessToken).catch(() => []),
            fetchUserGameStats(apiString, accessToken).catch(() => null),
          ]);
          setUserAchievements(achievements);
          setUserStats(stats);

          const methods = await fetchPaymentMethods(authUser?.id);
          setPaymentMethods(methods);
        }
        setLoadingAchievements(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoadingTopScorers(false);
        setLoadingAchievements(false);
      }
    };
    loadData();
    // refreshKey reloads everything after a game is saved
  }, [isLoggedIn, accessToken, apiString, authUser?.id, refreshKey]);

  // Effect to handle clicks outside the profile dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup timer on component unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Initialize the game board with words
  const initializeBoard = async () => {
    if (!selectedMap) return;

    const fetchedWords = await fetchWords(apiString, selectedMap, selectedMap.difficulty, selectedMap.language);
    if (fetchedWords.length === 0) {
      setErrorMessage('The words for this map couldn’t be loaded. Check your connection and try again.');
      console.error('No words fetched for the map:', selectedMap);
      setGameState('select');
      return;
    }
    setWordsToFind(fetchedWords);

    const size = selectedMap.size;
    const words = fetchedWords;
    const newBoard = Array(size).fill().map(() => Array(size).fill(''));
    const newWordPositions = {};

    const alphabet =
      selectedMap.language === 'punjabi'
        ? ['ੳ', 'ਅ', 'ੲ', 'ਸ', 'ਹ', 'ਕ', 'ਖ', 'ਗ', 'ਘ', 'ਙ', 'ਚ', 'ਛ', 'ਜ', 'ਝ', 'ਞ', 'ਟ', 'ਠ', 'ਡ', 'ਢ', 'ਣ', 'ਤ', 'ਥ', 'ਦ', 'ਧ', 'ਨ', 'ਪ', 'ਫ', 'ਬ', 'ਭ', 'ਮ', 'ਯ', 'ਰ', 'ਲ', 'ਵ', 'ਸ', 'ਹ']
        : 'abcdefghijklmnopqrstuvwxyz'.split('');

    words.forEach(word => {
      let placed = false;
      let attempts = 0;
      const maxAttempts = 200;

      while (!placed && attempts < maxAttempts) {
        attempts++;
        const direction = Math.floor(Math.random() * 3);
        const row = direction === 0 ? Math.floor(Math.random() * size) : Math.floor(Math.random() * (size - word.length));
        const col = direction === 1 ? Math.floor(Math.random() * size) : Math.floor(Math.random() * (size - word.length));

        let canPlace = true;
        const positions = [];

        for (let i = 0; i < word.length; i++) {
          let r, c;
          if (direction === 0) {
            r = row;
            c = col + i;
          } else if (direction === 1) {
            r = row + i;
            c = col;
          } else {
            r = row + i;
            c = col + i;
          }

          if (r >= size || c >= size || (newBoard[r][c] && newBoard[r][c] !== word[i])) {
            canPlace = false;
            break;
          }
          positions.push({ row: r, col: c });
        }

        if (canPlace) {
          for (let i = 0; i < word.length; i++) {
            const { row, col } = positions[i];
            newBoard[row][col] = word[i];
          }
          newWordPositions[word] = positions;
          placed = true;
        }
      }

      if (!placed) {
        console.warn(`Could not place word "${word}" on map "${selectedMap.name}" after ${maxAttempts} attempts`);
        setErrorMessage(`Unable to place word "${word}" on the board. Please try again or select a different map.`);
      }
    });

    // Fill remaining cells
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (!newBoard[i][j]) {
          newBoard[i][j] = alphabet[Math.floor(Math.random() * alphabet.length)];
        }
      }
    }

    setBoard(newBoard);
    setWordPositions(newWordPositions);
    setFoundWords([]);
    setTimeLeft(Math.floor(selectedMap.timeLimit * selectedDifficulty.timeMultiplier));
    setScore(0);
    setGameState('playing');

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleGameEnd(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Handle mouse down event on a cell to start selection
  const handleCellMouseDown = (row, col) => {
    setSelectionStart({ row, col });
    setSelectedCells([{ row, col }]);
  };

  // Handle mouse enter event on a cell to continue selection
  const handleCellMouseEnter = (row, col) => {
    if (!selectionStart) return;

    const newSelectedCells = [];
    const rowStart = Math.min(selectionStart.row, row);
    const rowEnd = Math.max(selectionStart.row, row);
    const colStart = Math.min(selectionStart.col, col);
    const colEnd = Math.max(selectionStart.col, col);

    if (rowStart === rowEnd || colStart === colEnd || (rowEnd - rowStart === colEnd - colStart)) {
      for (let r = rowStart; r <= rowEnd; r++) {
        for (let c = colStart; c <= colEnd; c++) {
          if (rowStart === rowEnd || colStart === colEnd || (r - rowStart === c - colStart)) {
            newSelectedCells.push({ row: r, col: c });
          }
        }
      }
    }

    setSelectedCells(newSelectedCells);
  };

  // Handle mouse up event to end selection and check the word
  const handleCellMouseUp = () => {
    if (selectedCells.length > 1) {
      checkSelectedWord();
    }
    setSelectionStart(null);
    setSelectedCells([]);
  };

  // Check if the selected cells form a valid word
  const checkSelectedWord = () => {
    const word = selectedCells.map(cell => board[cell.row][cell.col]).join('');
    const reversedWord = word.split('').reverse().join('');

    const matchedWord = wordsToFind.find(w => w === word || w === reversedWord);

    if (matchedWord && !foundWords.includes(matchedWord)) {
      const expectedPositions = wordPositions[matchedWord] || [];
      const isExactMatch =
        expectedPositions.length === selectedCells.length &&
        expectedPositions.every(pos =>
          selectedCells.some(cell => cell.row === pos.row && cell.col === pos.col)
        );

      if (isExactMatch) {
        if (settings.soundEnabled) sounds.wordFound.play();
        setFoundWords(prev => [...prev, matchedWord]);

        const wordScore =
          matchedWord.length * 10 * (selectedDifficulty.id === 'easy' ? 1 : selectedDifficulty.id === 'medium' ? 1.5 : 2);
        setScore(prev => prev + wordScore);

        if (foundWords.length + 1 === wordsToFind.length) {
          handleGameEnd(true, score + wordScore, foundWords.length + 1);
        }
      } else {
        if (settings.soundEnabled) sounds.error.play();
      }
    } else {
      if (settings.soundEnabled) sounds.error.play();
    }
  };

  // Handle the end of the game (win or lose)
  // Save the result (signed in: on the server, with badges and leaderboard; guest: in the browser)
  const saveResult = async (result) => {
    if (!isLoggedIn && !playAsGuest) return;
    const data = await wallet.submitResult(result);
    setLastResult(data);
    if (data) setRefreshKey((k) => k + 1); // reload stats, achievements and top scorers
  };

  const handleGameEnd = (completed, finalScore = scoreRef.current, wordsFound = foundCountRef.current) => {
    clearInterval(timerRef.current);
    setGameWon(completed);
    const fullTime = Math.floor(selectedMap.timeLimit * selectedDifficulty.timeMultiplier);
    const remaining = completed ? timeLeft : 0;
    const base = {
      score: Math.round(finalScore),
      completed,
      time_taken_seconds: Math.max(1, fullTime - remaining),
      level: `${selectedMap.name} / ${selectedDifficulty.id}`.slice(0, 50),
      details: { map_id: selectedMap.id, words_found: wordsFound, words_total: wordsToFind.length, language: selectedMap.language },
    };

    if (completed) {
      const timeBonus = Math.floor(timeLeft / 10);
      const coinsEarned = Math.floor(selectedMap.reward * (timeLeft / selectedMap.timeLimit)) + timeBonus;
      saveResult({ ...base, coins_earned: coinsEarned, xp_earned: 20 + wordsFound * 3 });
      if ((isLoggedIn || playAsGuest) && settings.soundEnabled) {
        sounds.complete.play();
        sounds.coin.play();
      }
    } else {
      saveResult({ ...base, coins_earned: 0, xp_earned: wordsFound * 2 });
    }
    setGameState('completed');
  };

  // Handle map selection with access checks
  const handleMapSelect = (map) => {
    if (map.loginRequired && !isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    if (map.premium && (!isLoggedIn || !userData || !userData.isPremium)) {
      navigate('/premium');
      return;
    }

    if (map.entryFee > 0 && coins < map.entryFee) {
      setShowBuyCoins(true);
      return;
    }

    setSelectedMap(map);
    setGameState('difficulty');
  };

  // Handle difficulty selection
  const handleDifficultySelect = (difficulty) => {
    setSelectedDifficulty(difficulty);
  };

  // Start the game after difficulty selection
  const handleStartGame = async () => {
    if (!selectedMap) return;

    if (selectedMap.entryFee > 0 && (isLoggedIn || playAsGuest)) {
      const paid = await wallet.spend(selectedMap.entryFee, `Entry fee: ${selectedMap.name}`);
      if (!paid.ok) {
        if (paid.reason === 'coins') setShowBuyCoins(true);
        else setErrorMessage(paid.message);
        return;
      }
    }
    setLastResult(null);

    setErrorMessage(null);
    await initializeBoard();
  };

  // Use a hint to reveal a word
  // Hint: pay 10 coins first, then flash the first word you haven't found
  const HINT_COST = 10;
  const useHint = async () => {
    const remainingWords = wordsToFind.filter(word => !foundWords.includes(word));
    if (remainingWords.length === 0) return;
    if (!isLoggedIn && !playAsGuest) {
      setShowLoginModal(true);
      return;
    }

    const paid = await wallet.spend(HINT_COST, 'Hint');
    if (!paid.ok) {
      if (paid.reason === 'coins') setShowBuyCoins(true);
      else toast.error(paid.message);
      return;
    }

    const hintWord = remainingWords[0];
    setSelectedCells(wordPositions[hintWord] || []);
    setTimeout(() => setSelectedCells([]), 2000);
    setUserStats(prev => (prev && {
      ...prev,
      totalCoinsLostOnHints: prev.totalCoinsLostOnHints + HINT_COST,
    }));
  };

  // Format time in MM:SS format
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Allow playing as a guest without saving progress
  const handlePlayAsGuest = () => {
    setPlayAsGuest(true);
    setShowLoginModal(false);
  };

  // Buying coins: go to checkout, then come back to this game afterwards
  const handleBuyCoins = (amount) => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    setShowBuyCoins(false);
    navigate(`/checkout?product=coins_${amount}&return=/learning/games/shabd-khoj`);
  };

  // Toggle sound settings
  const toggleSound = () => {
    setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  };

  // Reset the game to the map selection screen
  const resetGame = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameState('select');
    setSelectedMap(null);
    setSelectedDifficulty(difficultyLevels[1]);
    setErrorMessage(null);
  };

  // Handle profile updates (avatar and name)
  const handleProfileUpdate = async () => {
    if (isLoggedIn) {
      const ok = await wallet.saveProfile({ name: newName.trim(), avatarFile: newAvatarFile, avatarPreview: newAvatar });
      if (!ok) {
        setErrorMessage('Your game profile couldn’t be saved. Try again.');
        return;
      }
      setNewAvatarFile(null);
      setEditingProfile(false);
      setShowProfileDropdown(false);
    }
  };

  // Handle avatar upload (mock for now)
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewAvatar(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle adding a payment method (mock for now)
  const handleAddPaymentMethod = () => {
    const newMethod = {
      id: paymentMethods.length + 1,
      type: 'Credit Card',
      lastFour: '5678',
      expiry: '01/27',
    };
    setPaymentMethods([...paymentMethods, newMethod]);
  };

  // Handle removing a payment method
  const handleRemovePaymentMethod = (id) => {
    setPaymentMethods(paymentMethods.filter(method => method.id !== id));
  };

  // Handle Virsaa Playables display toggle
  const handleToggleDisplay = () => {
    if (displayCount < virsaaPlayables.length) {
      setDisplayCount(prev => prev + 6);
    } else {
      setDisplayCount(prev => Math.max(6, prev - 6));
    }
  };

  // Render the game board with interactive cells
  const renderBoard = () => {
    if (!selectedMap) return null;

    return (
      <div className={styles.board} style={themeBackground(selectedMap.theme)}>
        <div className={styles.boardOverlay}></div>
        <div className={styles.boardGrid}>
          {board.map((row, rowIndex) => (
            <div key={rowIndex} className={styles.row}>
              {row.map((cell, colIndex) => {
                const isSelected = selectedCells.some(c => c.row === rowIndex && c.col === colIndex);
                const isFound = foundWords.some(word => {
                  const positions = wordPositions[word] || [];
                  return positions.some(pos => pos.row === rowIndex && pos.col === colIndex);
                });

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`${styles.cell} ${isSelected ? styles.selected : ''} ${isFound ? styles.found : ''}`}
                    onMouseDown={() => handleCellMouseDown(rowIndex, colIndex)}
                    onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
                    onMouseUp={handleCellMouseUp}
                    onTouchStart={() => handleCellMouseDown(rowIndex, colIndex)}
                    onTouchMove={e => {
                      const touch = e.touches[0];
                      const element = document.elementFromPoint(touch.clientX, touch.clientY);
                      if (element && element.classList.contains(styles.cell)) {
                        const [r, c] = element.dataset.coords.split('-').map(Number);
                        handleCellMouseEnter(r, c);
                      }
                    }}
                    onTouchEnd={handleCellMouseUp}
                    tabIndex={0}
                    data-coords={`${rowIndex}-${colIndex}`}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleCellMouseDown(rowIndex, colIndex);
                      }
                    }}
                    role="gridcell"
                    aria-label={selectedMap.language === 'punjabi' ? `ਅੱਖਰ ${cell}` : `Letter ${cell}`}
                  >
                    {cell}
                    <div className={styles.cellHighlight}></div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render the map selection screen
  const renderMapSelection = () => {
    const filteredMaps =
      selectedCategory === 'all'
        ? gameMaps
        : gameMaps.filter(map =>
            selectedCategory === 'punjabi'
              ? map.language === 'punjabi'
              : selectedCategory === 'english'
              ? map.language === 'english'
              : selectedCategory === 'premium' && map.premium
          );

    return (
      <div className={styles.mapSelection}>
        <div className={styles.sectionHeader}>
          <GiTreasureMap className={styles.sectionIcon} />
          <h2>{settings.language === 'punjabi' ? 'ਮੈਪ ਚੁਣੋ' : 'Select a Map'}</h2>
        </div>

        <div className={styles.mapCategories}>
          <button
            className={selectedCategory === 'all' ? styles.activeCategory : ''}
            onClick={() => setSelectedCategory('all')}
          >
            {settings.language === 'punjabi' ? 'ਸਾਰੇ' : 'All'}
          </button>
          <button
            className={selectedCategory === 'punjabi' ? styles.activeCategory : ''}
            onClick={() => setSelectedCategory('punjabi')}
          >
            {settings.language === 'punjabi' ? 'ਪੰਜਾਬੀ' : 'Punjabi'}
          </button>
          <button
            className={selectedCategory === 'english' ? styles.activeCategory : ''}
            onClick={() => setSelectedCategory('english')}
          >
            {settings.language === 'punjabi' ? 'ਅੰਗਰੇਜ਼ੀ' : 'English'}
          </button>
          <button
            className={selectedCategory === 'premium' ? styles.activeCategory : ''}
            onClick={() => setSelectedCategory('premium')}
          >
            <FaCrown /> {settings.language === 'punjabi' ? 'ਪ੍ਰੀਮੀਅਮ' : 'Premium'}
          </button>
        </div>

        <div className={styles.mapsContainerWrapper}>
          <button 
            className={styles.scrollButtonLeft} 
            onClick={() => scrollMaps('left')}
            aria-label="Scroll maps left"
          >
            <FaChevronLeft />
          </button>
          <div className={styles.mapsContainer} ref={mapsContainerRef}>
            {filteredMaps.map(map => (
              <div
                key={map.id}
                className={`${styles.mapCard} ${map.premium ? styles.premium : ''} ${map.loginRequired ? styles.locked : ''}`}
              >
                <div className={styles.mapImage} style={themeBackground(map.theme)}>
                  {map.loginRequired && !isLoggedIn && (
                    <div className={styles.lockOverlay}>
                      <FaLock />
                      <span>{settings.language === 'punjabi' ? 'ਲੌਗਇਨ ਕਰੋ' : 'Login Required'}</span>
                      <button
                        className={styles.actionButton}
                        onClick={() => navigate('/login')}
                      >
                        {settings.language === 'punjabi' ? 'ਲੌਗਇਨ' : 'Login'}
                      </button>
                    </div>
                  )}
                  {map.premium && (!isLoggedIn || !userData || !userData.isPremium) && (
                    <div className={styles.lockOverlay}>
                      <FaCrown />
                      <span>{settings.language === 'punjabi' ? 'ਪ੍ਰੀਮੀਅਮ ਦੀ ਲੋੜ ਹੈ' : 'Premium Required'}</span>
                      <button
                        className={styles.actionButton}
                        onClick={() => {
                          setShowSettings(false);
                          setShowProfileDropdown(false);
                          navigate('/premium');
                        }}
                      >
                        {settings.language === 'punjabi' ? 'ਪ੍ਰੀਮੀਅਮ ਬਣੋ' : 'Go Premium'}
                      </button>
                    </div>
                  )}
                  {(!map.loginRequired || isLoggedIn) && (map.premium ? (isLoggedIn && userData?.isPremium) : true) && (
                    <button className={styles.playButton} onClick={() => handleMapSelect(map)}>
                      {settings.language === 'punjabi' ? 'ਖੇਡੋ' : 'Play'}
                    </button>
                  )}
                  {map.premium && (
                    <div className={styles.premiumBadge}>
                      <FaCrown /> PREMIUM
                    </div>
                  )}
                </div>

                <div className={styles.mapInfo}>
                  <h3>{map.name}</h3>
                  <p>{map.description}</p>

                  <div className={styles.mapStats}>
                    <div>
                      <GiClockwork />
                      <span>{formatTime(map.timeLimit)}</span>
                    </div>
                    <div>
                      <FaCoins />
                      <span>{map.entryFee > 0 ? `${map.entryFee}` : 'Free'}</span>
                    </div>
                    <div>
                      <GiStairsGoal />
                      <span>{map.reward}</span>
                    </div>
                  </div>

                  <div className={styles.difficultyTag} data-difficulty={map.difficulty.toLowerCase()}>
                    {map.difficulty}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button 
            className={styles.scrollButtonRight} 
            onClick={() => scrollMaps('right')}
            aria-label="Scroll maps right"
          >
            <FaChevronRight />
          </button>
        </div>

        {/* Virsaa Playables Section */}
        <div className={styles.virsaaPlayables}>
          <div className={styles.sectionHeader}>
            <GiTreasureMap className={styles.sectionIcon} />
            <h2>Virsaa Playables</h2>
          </div>
          <div className={styles.playablesContainer}>
            {virsaaPlayables.slice(0, displayCount).map(game => (
              <div key={game.id} className={styles.playableCard}>
                <div className={styles.playableImage} style={{ backgroundImage: `url(${getImagePath(game.image)})` }}>
                  <button 
                    className={styles.playButton}
                    onClick={() => navigate(game.link)}
                  >
                    Play
                  </button>
                </div>
                <div className={styles.playableInfo}>
                  <h3>{game.name}</h3>
                  <p>{game.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.toggleButtonContainer}>
            <button 
              className={styles.toggleButton}
              onClick={handleToggleDisplay}
            >
              {displayCount >= virsaaPlayables.length ? 'Show Less' : 'Show More'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render the difficulty selection screen
  const renderDifficultySelection = () => {
    if (!selectedMap) return null;

    return (
      <div className={styles.difficultySelection}>
        <h2>{settings.language === 'punjabi' ? 'ਮੁਸ਼ਕਲਤਾ ਚੁਣੋ' : 'Select Difficulty'}</h2>
        {errorMessage && (
          <div className={styles.errorMessage}>
            <FaInfoCircle /> {errorMessage}
          </div>
        )}
        <div className={styles.difficultyOptions}>
          {difficultyLevels.map(difficulty => (
            <div
              key={difficulty.id}
              className={`${styles.difficultyCard} ${selectedDifficulty.id === difficulty.id ? styles.selected : ''}`}
              onClick={() => handleDifficultySelect(difficulty)}
            >
              <h3>{difficulty.name}</h3>
              <p>
                {settings.language === 'punjabi'
                  ? `ਟਾਈਮ: ${formatTime(Math.floor(selectedMap.timeLimit * difficulty.timeMultiplier))}`
                  : `Time: ${formatTime(Math.floor(selectedMap.timeLimit * difficulty.timeMultiplier))}`}
              </p>
              <p>
                {settings.language === 'punjabi'
                  ? `ਸਕੋਰ ਗੁਣਕ: ${difficulty.id === 'easy' ? '1x' : difficulty.id === 'medium' ? '1.5x' : '2x'}`
                  : `Score Multiplier: ${difficulty.id === 'easy' ? '1x' : difficulty.id === 'medium' ? '1.5x' : '2x'}`}
              </p>
            </div>
          ))}
        </div>
        <button className={styles.startButton} onClick={handleStartGame}>
          {settings.language === 'punjabi' ? 'ਖੇਡ ਸ਼ੁਰੂ ਕਰੋ' : 'Start Game'}
        </button>
      </div>
    );
  };

  // Render the main game UI during gameplay
  const renderGameUI = () => {
    return (
      <div className={styles.gameLayout}>
        <div className={styles.gameMain}>
          <div className={styles.gameHeader}>
            <div className={styles.gameInfo}>
              <div className={styles.timeDisplay} style={{ color: selectedDifficulty.color }}>
                <IoMdTimer /> {formatTime(timeLeft)}
              </div>
              <div className={styles.scoreDisplay}>
                <FaTrophy /> {score}
              </div>
              <div className={styles.coinDisplay}>
                <FaCoins /> {coins}
              </div>
            </div>

            <div className={styles.gameControls}>
              <button className={styles.hintButton} onClick={useHint}>
                <FaLightbulb /> {settings.language === 'punjabi' ? 'ਸੰਕੇਤ' : 'Hint'} (10 <FaCoins />)
              </button>
            </div>
          </div>

          <div
            className={`${styles.tabContainer} ${isTabDropdownOpen ? styles.open : ''}`}
            onClick={() => {
              setIsTabDropdownOpen(!isTabDropdownOpen);
            }}
          >
            <button
              className={`${styles.tabButton} ${activeTab === 'game' ? styles.activeTab : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab('game');
                setIsTabDropdownOpen(false);
              }}
            >
              {settings.language === 'punjabi' ? 'ਖੇਡ ਖੇਡੋ' : 'Play Game'}
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === 'achievements' ? styles.activeTab : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab('achievements');
                setIsTabDropdownOpen(false);
              }}
            >
              {settings.language === 'punjabi' ? 'ਪ੍ਰਾਪਤੀਆਂ ਵੇਖੋ' : 'View Achievements'}
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === 'scorers' ? styles.activeTab : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab('scorers');
                setIsTabDropdownOpen(false);
              }}
            >
              {settings.language === 'punjabi' ? 'ਚੋਟੀ ਦੇ ਸਕੋਰਰ ਵੇਖੋ' : 'View Top Scorers'}
            </button>
          </div>

          {activeTab === 'game' && (
            <>
              <div className={styles.wordList}>
                <h3>{settings.language === 'punjabi' ? 'ਸ਼ਬਦ ਲੱਭੋ' : 'Find These Words'}:</h3>
                <div className={styles.wordsContainer}>
                  {wordsToFind.map((word, index) => (
                    <div key={index} className={`${styles.word} ${foundWords.includes(word) ? styles.found : ''}`}>
                      {word}
                      {foundWords.includes(word) && <span className={styles.checkmark}>✓</span>}
                    </div>
                  ))}
                </div>
              </div>
              {renderBoard()}
            </>
          )}

          {activeTab === 'achievements' && (
            <div className={styles.tabContent}>
              {renderAchievements()}
            </div>
          )}

          {activeTab === 'scorers' && (
            <div className={styles.tabContent}>
              {renderTopScorers()}
            </div>
          )}
        </div>

        <div className={styles.gameSidebar}>
          {renderTopScorers()}
          {renderAchievements()}
        </div>
      </div>
    );
  };

  // Render the game completion screen
  const renderCompletedScreen = () => {
    const timeBonus = gameWon ? Math.floor(timeLeft / 10) : 0;
    const estimate = gameWon ? Math.floor(selectedMap.reward * (timeLeft / selectedMap.timeLimit)) + timeBonus : 0;
    // The server may cap coins; show what was actually saved when we have it
    const coinsEarned = lastResult ? lastResult.coins_earned : estimate;
    const pa = settings.language === 'punjabi';

    return (
      <div className={styles.completedScreen}>
        <div className={styles.completedContent}>
          <h2>{gameWon ? (pa ? 'ਵਧਾਈਆਂ!' : 'Congratulations!') : (pa ? 'ਸਮਾਂ ਖਤਮ!' : 'Time’s up!')}</h2>
          <p>
            {gameWon
              ? (pa ? `ਤੁਸੀਂ ${selectedMap.name} ਮੈਪ ਪੂਰੀ ਕਰ ਲਈ ਹੈ!` : `You completed the ${selectedMap.name} map!`)
              : (pa ? `ਤੁਸੀਂ ${foundWords.length}/${wordsToFind.length} ਸ਼ਬਦ ਲੱਭੇ।` : `You found ${foundWords.length} of ${wordsToFind.length} words.`)}
          </p>
          {lastResult?.is_new_best && lastResult.score > 0 && <p><FaTrophy /> {pa ? 'ਨਵਾਂ ਨਿੱਜੀ ਰਿਕਾਰਡ!' : 'New personal best!'}</p>}

          <div className={styles.resultStats}>
            <div className={styles.statItem}>
              <span>{settings.language === 'punjabi' ? 'ਅੰਤਿਮ ਸਕੋਰ' : 'Final Score'}</span>
              <span className={styles.statValue}>{score}</span>
            </div>
            <div className={styles.statItem}>
              <span>{settings.language === 'punjabi' ? 'ਸਮਾਂ ਬਾਕੀ' : 'Time Remaining'}</span>
              <span className={styles.statValue}>{formatTime(timeLeft)}</span>
            </div>
            <div className={styles.statItem}>
              <span>{settings.language === 'punjabi' ? 'ਸਿੱਕੇ ਕਮਾਏ' : 'Coins Earned'}</span>
              <span className={styles.statValue}>
                {coinsEarned} <FaCoins />
                {timeBonus > 0 && ` (+${timeBonus} bonus)`}
              </span>
            </div>
            {lastResult && (
              <div className={styles.statItem}>
                <span>XP</span>
                <span className={styles.statValue}>+{lastResult.xp_earned}</span>
              </div>
            )}
          </div>

          {lastResult?.new_badges?.length > 0 && (
            <div className={styles.achievementsList}>
              {lastResult.new_badges.map((b) => (
                <div key={b.key} className={`${styles.achievement} ${styles.earned}`}>
                  <span className={styles.achievementIcon}><BadgeIcon name={b.icon} image={b.image} /></span>
                  <div className={styles.achievementDetails}>
                    <h4>{pa ? 'ਨਵਾਂ ਬੈਜ: ' : 'Badge earned: '}{b.name}</h4>
                    <p>{b.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className={styles.completedActions}>
            <button className={styles.primaryButton} onClick={resetGame}>
              {settings.language === 'punjabi' ? 'ਦੂਜੀ ਮੈਪ ਚੁਣੋ' : 'Choose Another Map'}
            </button>
            {!isLoggedIn && !playAsGuest && (
              <button
                className={styles.secondaryButton}
                onClick={() => navigate('/login')}
              >
                <FaSignInAlt /> {settings.language === 'punjabi' ? 'ਪ੍ਰਗਤੀ ਨੂੰ ਸੰਭਾਲਣ ਲਈ ਲੌਗਇਨ ਕਰੋ' : 'Login to Save Progress'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render the top scorers sidebar
  const renderTopScorers = () => {
    return (
      <div className={styles.sidePanel}>
        <div className={styles.panelHeader}>
          <MdLeaderboard />
          <h3>{settings.language === 'punjabi' ? 'ਚੋਟੀ ਦੇ ਖਿਡਾਰੀ' : 'Top Scorers'}</h3>
        </div>
        {loadingTopScorers ? (
          <Skeleton count={5} height={40} style={{ marginBottom: '10px' }} />
        ) : (
          <div className={styles.leaderboard}>
            {topScorers.map((player, index) => (
              <div key={player.id} className={styles.leaderboardItem}>
                <span className={styles.rank}>{index + 1}</span>
                <img src={getImagePath(player.avatar)} alt={player.name} className={styles.avatar} />
                <div className={styles.playerInfo}>
                  <span className={styles.name}>{player.name}</span>
                  <span className={styles.score}>{player.score} pts</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render the achievements sidebar
  const renderAchievements = () => {
    return (
      <div className={styles.sidePanel}>
        <div className={styles.panelHeader}>
          <MdStars />
          <h3>{settings.language === 'punjabi' ? 'ਪ੍ਰਾਪਤੀਆਂ' : 'Achievements'}</h3>
        </div>
        {loadingAchievements ? (
          <Skeleton count={4} height={60} style={{ marginBottom: '10px' }} />
        ) : (
          <div className={styles.achievementsList}>
            {userAchievements.length > 0 ? (
              userAchievements.map(achievement => (
                <div
                  key={achievement.id}
                  className={`${styles.achievement} ${achievement.earned ? styles.earned : ''}`}
                >
                  <span className={styles.achievementIcon}>{achievement.icon}</span>
                  <div className={styles.achievementDetails}>
                    <h4>{achievement.name}</h4>
                    <p>{achievement.description}</p>
                    {achievement.progress && (
                      <div className={styles.progressBar}>
                        <div
                          className={styles.progressFill}
                          style={{
                            width: `${
                              (parseInt(achievement.progress.split('/')[0]) /
                                parseInt(achievement.progress.split('/')[1])) *
                              100
                            }%`,
                          }}
                        ></div>
                        <span>{achievement.progress}</span>
                      </div>
                    )}
                  </div>
                  {achievement.earned && <span className={styles.earnedBadge}>✓</span>}
                </div>
              ))
            ) : (
              <p className={styles.noAchievements}>
                {settings.language === 'punjabi'
                  ? 'ਕੋਈ ਪ੍ਰਾਪਤੀਆਂ ਨਹੀਂ ਮਿਲੀਆਂ। ਖੇਡਣਾ ਸ਼ੁਰੂ ਕਰੋ!'
                  : 'No achievements yet. Start playing!'}
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render the settings sidebar
  const renderSettingsSidebar = () => {
    return (
      <div className={`${styles.settingsSidebar} ${showSettings ? styles.open : ''}`}>
        <div className={styles.settingsHeader}>
          <h2>
            <IoMdSettings /> {settings.language === 'punjabi' ? 'ਸੈਟਿੰਗਾਂ' : 'Settings'}
          </h2>
          <button className={styles.closeButton} onClick={() => setShowSettings(false)} aria-label="Close settings">
            ×
          </button>
        </div>

        <div className={styles.settingsContent}>
          <div className={styles.settingGroup}>
            <h3>{settings.language === 'punjabi' ? 'ਆਡੀਓ' : 'Audio'}</h3>
            <div className={styles.settingItem}>
              <label>
                <input type="checkbox" checked={settings.soundEnabled} onChange={toggleSound} />
                {settings.language === 'punjabi' ? 'ਆਵਾਜ਼ ਚਾਲੂ ਕਰੋ' : 'Enable Sound'}
              </label>
            </div>
          </div>

          <div className={styles.settingGroup}>
            <h3>{settings.language === 'punjabi' ? 'ਗੇਮਪਲੇ' : 'Gameplay'}</h3>
            <div className={styles.settingItem}>
              <label>
                <input
                  type="checkbox"
                  checked={settings.constantDifficulty}
                  onChange={() =>
                    setSettings(prev => ({ ...prev, constantDifficulty: !prev.constantDifficulty }))
                  }
                />
                {settings.language === 'punjabi' ? 'ਲਗਾਤਾਰ ਮੁਸ਼ਕਲਤਾ' : 'Constant Difficulty'}
              </label>
            </div>
          </div>

          <div className={styles.settingGroup}>
            <h3>{settings.language === 'punjabi' ? 'ਭਾਸ਼ਾ' : 'Language'}</h3>
            <div className={styles.settingItem}>
              <label>{settings.language === 'punjabi' ? 'ਇੰਟਰਫੇਸ ਭਾਸ਼ਾ' : 'Interface Language'}</label>
              <select
                value={settings.language}
                onChange={e => setSettings(prev => ({ ...prev, language: e.target.value }))}
              >
                <option value="english">English</option>
                <option value="punjabi">Punjabi</option>
              </select>
              <p className={styles.note}>
                {settings.language === 'punjabi'
                  ? 'ਨੋਟ: ਬੋਰਡ ਦੀ ਭਾਸ਼ਾ ਚੁਣੇ ਹੋਏ ਮੈਪ ਦੀ ਭਾਸ਼ਾ ਨਾਲ ਮੇਲ ਖਾਂਦੀ ਹੈ।'
                  : 'Note: Board language matches the selected map\'s language.'}
              </p>
            </div>
          </div>

          <div className={styles.settingGroup}>
            <h3>{settings.language === 'punjabi' ? 'ਖਾਤਾ' : 'Account'}</h3>
            {isLoggedIn ? (
              <>
                <div className={styles.userInfo}>
                  <img
                    src={getImagePath(userData?.avatar) || userDefault}
                    alt="User"
                    className={styles.userAvatar}
                  />
                  <div>
                    <h4>{userData?.name || 'Demo User'}</h4>
                    <p>
                      {coins} <FaCoins />
                    </p>
                    {userData?.isPremium && (
                      <p className={styles.premiumBadge}>
                        <FaCrown /> Premium User
                      </p>
                    )}
                  </div>
                </div>
                <button className={styles.logoutButton} onClick={logout}>
                  {settings.language === 'punjabi' ? 'ਲੌਗਆਉਟ' : 'Logout'}
                </button>
              </>
            ) : (
              <button
                className={styles.loginButton}
                onClick={() => {
                  setShowSettings(false);
                  navigate('/login');
                }}
              >
                <FaSignInAlt /> {settings.language === 'punjabi' ? 'ਲੌਗਇਨ ਕਰੋ' : 'Login'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render the login modal
  const renderLoginModal = () => {
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.loginModal}>
          <h2>{settings.language === 'punjabi' ? 'ਲੌਗਇਨ ਕਰੋ' : 'Login Required'}</h2>
          <p>
            {settings.language === 'punjabi'
              ? 'ਇਸ ਮੈਪ ਨੂੰ ਖੇਡਣ ਲਈ ਤੁਹਾਨੂੰ ਲੌਗਇਨ ਕਰਨ ਦੀ ਲੋੜ ਹੈ। ਜੇਕਰ ਤੁਸੀਂ ਮਹਿਮਾਨ ਵਜੋਂ ਖੇਡਦੇ ਹੋ, ਤਾਂ ਤੁਹਾਡੀ ਪ੍ਰਗਤੀ ਸੰਭਾਲੀ ਨਹੀਂ ਜਾਵੇਗੀ।'
              : 'You need to login to play this map. If you play as guest, your progress will not be saved.'}
          </p>

          <div className={styles.loginActions}>
            <button
              className={styles.primaryButton}
              onClick={() => navigate('/login')}
            >
              <FaSignInAlt /> {settings.language === 'punjabi' ? 'ਲੌਗਇਨ ਕਰੋ' : 'Login'}
            </button>
            <button className={styles.secondaryButton} onClick={handlePlayAsGuest}>
              <FaUser /> {settings.language === 'punjabi' ? 'ਮਹਿਮਾਨ ਵਜੋਂ ਖੇਡੋ' : 'Play as Guest'}
            </button>
          </div>

          <div className={styles.loginWarning}>
            <FaInfoCircle />
            {settings.language === 'punjabi'
              ? 'ਮਹਿਮਾਨ ਖੇਡ: ਕੋਈ ਪ੍ਰਾਪਤੀਆਂ ਜਾਂ ਸਿੱਕੇ ਨਹੀਂ ਸੰਭਾਲੇ ਜਾਣਗੇ'
              : 'Guest play: No achievements or coins will be saved'}
          </div>
        </div>
      </div>
    );
  };

  // Render the buy coins modal
  const renderBuyCoinsModal = () => {
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.buyCoinsModal}>
          <h2>
            <FaCoins /> {settings.language === 'punjabi' ? 'ਸਿੱਕੇ ਖਰੀਦੋ' : 'Buy Coins'}
          </h2>
          <p>
            {settings.language === 'punjabi'
              ? 'ਤੁਹਾਡੇ ਕੋਲ ਇਸ ਮੈਪ ਨੂੰ ਖੇਡਣ ਲਈ ਕਾਫ਼ੀ ਸਿੱਕੇ ਨਹੀਂ ਹਨ। ਹੇਠਾਂ ਦਿੱਤੇ ਵਿਕਲਪਾਂ ਵਿੱਚੋਂ ਸਿੱਕੇ ਖਰੀਦੋ:'
              : "You don't have enough coins to play this map. Buy coins from the options below:"}
          </p>

          <div className={styles.coinPackages}>
            <div className={styles.coinPackage} onClick={() => handleBuyCoins(100)}>
              <div className={styles.coinAmount}>
                100 <FaCoins />
              </div>
              <div className={styles.coinPrice}>$1.99 CAD</div>
              <div className={styles.coinBonus}>+10 bonus</div>
            </div>
            <div className={styles.coinPackage} onClick={() => handleBuyCoins(250)}>
              <div className={styles.coinAmount}>
                250 <FaCoins />
              </div>
              <div className={styles.coinPrice}>$3.99 CAD</div>
              <div className={styles.coinBonus}>+30 bonus</div>
            </div>
            <div className={styles.coinPackage} onClick={() => handleBuyCoins(500)}>
              <div className={styles.coinAmount}>
                500 <FaCoins />
              </div>
              <div className={styles.coinPrice}>$6.99 CAD</div>
              <div className={styles.coinBonus}>+75 bonus</div>
            </div>
          </div>

          <button className={styles.closeButton} onClick={() => setShowBuyCoins(false)}>
            {settings.language === 'punjabi' ? 'ਰੱਦ ਕਰੋ' : 'Cancel'}
          </button>
        </div>
      </div>
    );
  };

  // Render the welcome bonus notification
  const renderWelcomeBonus = () => {
    if (!showWelcomeBonus) return null;

    return (
      <div className={styles.welcomeBonus}>
        <div className={styles.bonusContent}>
          <FaGem className={styles.bonusIcon} />
          <div>
            <h3>{settings.language === 'punjabi' ? 'ਸੁਆਗਤ ਬੋਨਸ!' : 'Welcome Bonus!'}</h3>
            <p>
              {settings.language === 'punjabi'
                ? `ਤੁਹਾਨੂੰ ${welcomeBonusAmount} ਸਿੱਕੇ ਮਿਲੇ ਹਨ`
                : `You received ${welcomeBonusAmount} coins`}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Render the user profile dropdown
  const renderProfileDropdown = () => {
    if (!isLoggedIn || !userData) return null;

    return (
      <div className={styles.profileDropdown} ref={profileDropdownRef}>
        <div className={styles.profileHeader}>
          <h3>{settings.language === 'punjabi' ? 'ਪ੍ਰੋਫਾਈਲ' : 'Game Profile'}</h3>
          <button
            className={styles.profileCloseButton}
            onClick={() => setShowProfileDropdown(false)}
            aria-label={settings.language === 'punjabi' ? 'ਬੰਦ ਕਰੋ' : 'Close'}
          >
            ×
          </button>
        </div>
        <div className={styles.profileContent}>
          <div className={styles.profileSection}>
            {editingProfile ? (
              <div className={styles.profileEdit}>
                <div className={styles.avatarUpload}>
                  <img src={getImagePath(newAvatar)} alt="User Avatar" className={styles.profileAvatar} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className={styles.avatarInput}
                    id="avatar-upload"
                  />
                  <label htmlFor="avatar-upload" className={styles.avatarUploadButton}>
                    {settings.language === 'punjabi' ? 'ਅਵਤਾਰ ਬਦਲੋ' : 'Change Avatar'}
                  </label>
                </div>
                <div className={styles.nameEdit}>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={settings.language === 'punjabi' ? 'ਨਵਾਂ ਨਾਮ ਦਰਜ ਕਰੋ' : 'Enter new name'}
                    className={styles.nameInput}
                  />
                </div>
                <div className={styles.editActions}>
                  <button onClick={handleProfileUpdate} className={styles.saveButton}>
                    {settings.language === 'punjabi' ? 'ਸੰਭਾਲੋ' : 'Save'}
                  </button>
                  <button onClick={() => setEditingProfile(false)} className={styles.cancelButton}>
                    {settings.language === 'punjabi' ? 'ਰੱਦ ਕਰੋ' : 'Cancel'}
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.profileInfo}>
                <img src={getImagePath(userData.avatar || userDefault)} alt="User Avatar" className={styles.profileAvatar} />
                <h4>{userData.name}</h4>
                <button
                  onClick={() => {
                    setNewName(userData.name || '');
                    setNewAvatar(userData.avatar || userDefault);
                    setEditingProfile(true);
                  }}
                  className={styles.editProfileButton}
                >
                  <FaEdit /> {settings.language === 'punjabi' ? 'ਸੋਧੋ' : 'Edit Profile'}
                </button>
              </div>
            )}
          </div>

          <div className={styles.profileSection}>
            <h4>
              <FaGamepad /> {settings.language === 'punjabi' ? 'ਖੇਡ ਦੇ ਅੰਕੜੇ' : 'Game Stats'}
            </h4>
            {userStats ? (
              <div className={styles.statsList}>
                <div className={styles.statItem}>
                  <span>{settings.language === 'punjabi' ? 'ਕੁੱਲ ਮੈਚ' : 'Total Matches'}</span>
                  <span>{userStats.totalMatches}</span>
                </div>
                <div className={styles.statItem}>
                  <span>{settings.language === 'punjabi' ? 'ਜਿੱਤਾਂ' : 'Wins'}</span>
                  <span>{userStats.wins}</span>
                </div>
                <div className={styles.statItem}>
                  <span>{settings.language === 'punjabi' ? 'ਹਾਰਾਂ' : 'Losses'}</span>
                  <span>{userStats.losses}</span>
                </div>
                <div className={styles.statItem}>
                  <span>{settings.language === 'punjabi' ? 'ਕੁੱਲ ਸਿੱਕੇ ਜਿੱਤੇ' : 'Total Coins Won'}</span>
                  <span>{userStats.totalCoinsWon} <FaCoins /></span>
                </div>
                <div className={styles.statItem}>
                  <span>{settings.language === 'punjabi' ? 'ਸੰਕੇਤਾਂ ਤੇ ਖਰਚੇ ਸਿੱਕੇ' : 'Coins Spent on Hints'}</span>
                  <span>{userStats.totalCoinsLostOnHints} <FaCoins /></span>
                </div>
              </div>
            ) : (
              <p>{settings.language === 'punjabi' ? 'ਅੰਕੜੇ ਲੋਡ ਹੋ ਰਹੇ ਹਨ...' : 'Loading stats...'}</p>
            )}
          </div>

          <div className={styles.profileSection}>
            <h4>
              <FaCreditCard /> {settings.language === 'punjabi' ? 'ਭੁਗਤਾਨ ਵਿਧੀਆਂ' : 'Payment Methods'}
            </h4>
            <div className={styles.paymentMethods}>
              {paymentMethods.length > 0 ? (
                paymentMethods.map(method => (
                  <div key={method.id} className={styles.paymentMethod}>
                    <div className={styles.methodDetails}>
                      <span>{method.type}</span>
                      {method.lastFour ? (
                        <span>**** {method.lastFour} (Exp: {method.expiry})</span>
                      ) : (
                        <span>{method.email}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemovePaymentMethod(method.id)}
                      className={styles.removeMethodButton}
                      aria-label={settings.language === 'punjabi' ? 'ਭੁਗਤਾਨ ਵਿਧੀ ਹਟਾਓ' : 'Remove payment method'}
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))
              ) : (
                <p>{settings.language === 'punjabi' ? 'ਕੋਈ ਭੁਗਤਾਨ ਵਿਧੀ ਨਹੀਂ ਜੋੜੀ ਗਈ।' : 'No payment methods added.'}</p>
              )}
              <button onClick={handleAddPaymentMethod} className={styles.addMethodButton}>
                {settings.language === 'punjabi' ? '+ ਨਵੀਂ ਵਿਧੀ ਜੋੜੋ' : '+ Add New Method'}
              </button>
            </div>
          </div>

          <button onClick={logout} className={styles.logoutButton}>
            <FaSignOutAlt /> {settings.language === 'punjabi' ? 'ਲੌਗਆਉਟ' : 'Logout'}
          </button>
        </div>
      </div>
    );
  };

  // Render the game navbar
  const renderGameNavbar = () => {
    return (
      <nav className={styles.gameNavbar}>
        <div className={styles.navbarLeft}>
          <h1 className={styles.navbarBrand}>Shabad Khoj</h1>
        </div>
        <div className={styles.navbarRight}>
          {isLoggedIn && userData && (
            <div className={styles.userInfo}>
              <div
                className={styles.avatarContainer}
                onMouseEnter={() => setShowProfileDropdown(true)}
                onClick={() => setShowProfileDropdown(true)}
              >
                <img src={getImagePath(userData.avatar || userDefault)} alt="User" className={styles.userAvatar} />
              </div>
              <span>{userData.name}</span>
              <span className={styles.coins}>
                {coins} <FaCoins />
              </span>
              {userData.isPremium && (
                <span className={styles.premiumBadge}>
                  <FaCrown /> Premium
                </span>
              )}
              {showProfileDropdown && renderProfileDropdown()}
            </div>
          )}
          <button className={styles.settingsButton} onClick={() => setShowSettings(!showSettings)} aria-label="Settings">
            <IoMdSettings className={styles.icon} />
          </button>
        </div>
      </nav>
    );
  };

  // Main render method for the game
  return (
    <div className={styles.wordSearchContainer}>
      {renderGameNavbar()}
      <div className={styles.mainContent}>
        {gameState === 'select' && renderMapSelection()}
        {gameState === 'difficulty' && renderDifficultySelection()}
        {gameState === 'playing' && renderGameUI()}
        {gameState === 'completed' && renderCompletedScreen()}
      </div>

      {renderSettingsSidebar()}
      {showLoginModal && renderLoginModal()}
      {showBuyCoins && renderBuyCoinsModal()}
      {renderWelcomeBonus()}
    </div>
  );
};

export default WordSearch;
export { WordSearchGamePlay };