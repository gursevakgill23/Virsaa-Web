import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import styles from './MemoryMatch.module.css';
import { Howl } from 'howler';
import { FaCoins, FaUser, FaSignInAlt, FaEdit, FaCreditCard, FaSignOutAlt, FaCog, FaPlay, FaList, FaClock, FaExchangeAlt, FaStar, FaTachometerAlt, FaAward, FaBrain, FaBolt } from 'react-icons/fa';
import { MdLeaderboard, MdStars } from 'react-icons/md';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import foundSound from './assets/sounds/found.mp3';
import achievementSound from './assets/sounds/level-up.mp3';
import completeSound from './assets/sounds/complete.mp3';


const userDefault = '/images/games/user-default.jpg';
const vaisakhi = '/images/games/vaisakhi.jpg';
const bhangra = '/images/games/bhangra.jpg';
const giddha = '/images/games/giddha.jpg';
const phulkari = '/images/games/phulkari.jpg';
const lassi = '/images/games/lassi.jpg';
const lohri = '/images/games/lohri.jpg';
const basant = '/images/games/basant.jpg';
const holi = '/images/games/holi.jpg';
const diwali = '/images/games/diwali.jpg';
const kangha = '/images/games/kangha.jpg';
const kara = '/images/games/kara.jpg';
const ik_onkar = '/images/games/basant.jpg';
const khanda = '/images/games/khanda.jpg';
const kirpan = '/images/games/kirpan.jpg';

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

/*
 * Game progress (coins, XP, welcome bonus, game name/avatar) is kept in its own
 * browser storage key. It used to be saved by calling the auth `login()` with the
 * wrong arguments, which crashed the page and could overwrite the login session.
 */
const GAME_PROFILE_KEY = 'virsaa_game_profile';
const GAME_FIELDS = ['coins', 'xp', 'welcomeBonusGiven', 'name', 'avatar'];
const loadGameProfile = () => {
  try {
    return JSON.parse(localStorage.getItem(GAME_PROFILE_KEY)) || {};
  } catch {
    return {};
  }
};
const pickGameFields = (obj = {}) => GAME_FIELDS.reduce((acc, key) => {
  if (obj[key] !== undefined) acc[key] = obj[key];
  return acc;
}, {});
const writeGameProfile = (fields) => {
  try {
    localStorage.setItem(GAME_PROFILE_KEY, JSON.stringify({ ...loadGameProfile(), ...fields }));
  } catch {
    /* storage unavailable (private mode): progress just isn't kept */
  }
};

// Initialize sound effects
const sounds = {
  found: new Howl({ src: [foundSound] }),
  achievement: new Howl({ src: [achievementSound] }),
  complete: new Howl({ src: [completeSound] }),
};

// Card sets
const cardSets = {
  festivals: [
    { id: 1, image: vaisakhi, text: 'Vaisakhi', punjabiText: 'ਵਿਸਾਖੀ' },
    { id: 2, image: lohri, text: 'Lohri', punjabiText: 'ਲੋਹੜੀ' },
    { id: 3, image: basant, text: 'Basant', punjabiText: 'ਬਸੰਤ' },
    { id: 4, image: holi, text: 'Holi', punjabiText: 'ਹੋਲੀ' },
    { id: 5, image: diwali, text: 'Diwali', punjabiText: 'ਦੀਵਾਲੀ' },
    { id: 6, image: bhangra, text: 'Bhangra', punjabiText: 'ਭੰਗੜਾ' },
    { id: 7, image: giddha, text: 'Giddha', punjabiText: 'ਗਿੱਧਾ' },
    { id: 8, image: phulkari, text: 'Phulkari', punjabiText: 'ਫੁਲਕਾਰੀ' },
    { id: 9, image: lassi, text: 'Lassi', punjabiText: 'ਲੱਸੀ' },
    { id: 10, image: bhangra, text: 'Bhangra', punjabiText: 'ਭੰਗੜਾ' },
  ],
  symbols: [
    { id: 6, image: khanda, text: 'Khanda', punjabiText: 'ਖੰਡਾ' },
    { id: 7, image: ik_onkar, text: 'Ik Onkar', punjabiText: 'ਇੱਕ ਓਅੰਕਾਰ' },
    { id: 8, image: kirpan, text: 'Kirpan', punjabiText: 'ਕਿਰਪਾਨ' },
    { id: 9, image: kara, text: 'Kara', punjabiText: 'ਕੜਾ' },
    { id: 10, image: kangha, text: 'Kangha', punjabiText: 'ਕੰਘਾ' },
  ],
};

// Mock APIs
const fetchTopScorers = async () => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return [
    { id: 1, name: 'VirsaaMaster', score: 5000, avatar: userDefault },
    { id: 2, name: 'PunjabPro', score: 4500, avatar: userDefault },
    { id: 3, name: 'SikhStar', score: 4000, avatar: userDefault },
  ];
};

const fetchUserAchievements = async (userId) => {
  await new Promise(resolve => setTimeout(resolve, 800));
  if (!userId) return [];
  return [
    { id: 1, name: 'Vaisakhi Master', description: 'Match 50 festival cards', earned: true, icon: <FaAward /> },
    { id: 2, name: 'Memory Guru', description: 'Complete 100 matches', earned: false, icon: <FaBrain />, progress: '20/100' },
    { id: 3, name: 'Speed Sikh', description: 'Finish Time Attack in 30s', earned: false, icon: <FaBolt /> },
  ];
};

const fetchUserGameStats = async (userId) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  if (!userId) return null;
  return {
    totalMatches: 75,
    wins: 50,
    losses: 25,
    totalCoinsWon: 5000,
    level: 10,
    xp: 850,
    maxXp: 1000,
  };
};

const difficultyLevels = [
  { id: 'easy', name: 'Easy', cardCount: 8, timeLimit: 75 },
  { id: 'medium', name: 'Medium', cardCount: 10, timeLimit: 60 },
  { id: 'hard', name: 'Hard', cardCount: 12, timeLimit: 45 },
];

const gameModes = [
  { id: 'classic', name: 'Classic', description: 'Match pairs with a timer' },
  { id: 'timeAttack', name: 'Time Attack', description: 'Match as fast as possible' },
  { id: 'zen', name: 'Zen', description: 'No timer, unlimited hints' },
  { id: 'puzzle', name: 'Puzzle', description: 'Match partial images' },
];

const MemoryMatch = () => {
  const getImagePath = useProductionImagePath();

  const { isLoggedIn, userData: authUser, logout } = useAuth();
  // Game progress merged over the signed-in user (see GAME_PROFILE_KEY above)
  const [gameProfile, setGameProfile] = useState(loadGameProfile);
  const userData = useMemo(() => (authUser ? { ...authUser, ...gameProfile } : null), [authUser, gameProfile]);
  const saveGameUser = useCallback((updated) => {
    const fields = pickGameFields(updated);
    setGameProfile((prev) => ({ ...prev, ...fields }));
    writeGameProfile(fields);
  }, []);
  const navigate = useNavigate();

  // State management
  const [gameState, setGameState] = useState('select');
  const [selectedMode, setSelectedMode] = useState(gameModes[0]);
  const [selectedDifficulty, setSelectedDifficulty] = useState(difficultyLevels[1]);
  const [selectedCardSet, setSelectedCardSet] = useState('festivals');
  const [language, setLanguage] = useState('english');
  const [cards, setCards] = useState([]);
  const [memorizeCards, setMemorizeCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(userData?.coins || 0);
  const [xp, setXp] = useState(userData?.xp || 0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [playAsGuest, setPlayAsGuest] = useState(false);
  const [topScorers, setTopScorers] = useState([]);
  const [loadingTopScorers, setLoadingTopScorers] = useState(true);
  const [userAchievements, setUserAchievements] = useState([]);
  const [loadingAchievements, setLoadingAchievements] = useState(true);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [userStats, setUserStats] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [newName, setNewName] = useState(userData?.name || 'Gursevak Singh');
  const [newAvatar, setNewAvatar] = useState(userData?.avatar || userDefault);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showCardModal, setShowCardModal] = useState(null);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [showMemorizeScreen, setShowMemorizeScreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCoinShop, setShowCoinShop] = useState(false);
  const [chapter, setChapter] = useState(1);
  const [showGameEndModal, setShowGameEndModal] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const timerRef = useRef(null);
  const countdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
  // State for Music and Notifications
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Initialize cards (for playing phase)
  const initializeCards = () => {
    const cardCount = selectedDifficulty.cardCount;
    const selectedCards = cardSets[selectedCardSet].slice(0, cardCount / 2);
    const pairedCards = [
      ...selectedCards.map(card => ({ ...card, type: 'image', pairId: card.id })),
      ...selectedCards.map(card => ({ ...card, type: 'text', pairId: card.id })),
    ];
    const shuffledCards = pairedCards.sort(() => Math.random() - 0.5).map((card, index) => ({
      ...card,
      id: index,
      isFlipped: false,
      isMatched: false,
    }));
    setCards(shuffledCards);
    setTimeLeft(selectedDifficulty.timeLimit);
    setFlippedCards([]);
    setMatchedPairs([]);
    setScore(0);
  };

  // Initialize cards for memorization phase (only images)
  const initializeMemorizeCards = () => {
    const cardCount = selectedDifficulty.cardCount;
    const selectedCards = cardSets[selectedCardSet].slice(0, cardCount / 2);
    const imageCards = selectedCards.map((card, index) => ({
      ...card,
      type: 'image',
      pairId: card.id,
      id: index,
      isFlipped: true,
      isMatched: false,
    }));
    setMemorizeCards(imageCards);
  };

  // Start memorization phase
  const startMemorization = () => {
    if (!isLoggedIn && !playAsGuest) {
      setShowLoginModal(true);
      return;
    }
    setShowStoryModal(true);
  };

  // Start memorization phase after story modal
  const startMemorizePhase = () => {
    initializeCards();
    initializeMemorizeCards();
    setShowStoryModal(false);
    setShowMemorizeScreen(true);
    setGameState('memorizing');
    setTimeLeft(60);

    if (timerRef.current) clearInterval(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(timerRef.current);
          startPlayingPhase();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Start playing phase
  const startPlayingPhase = () => {
    setShowMemorizeScreen(false);
    setGameState('playing');
    setCards(prev => prev.map(card => ({ ...card, isFlipped: false })));
    setTimeLeft(selectedDifficulty.timeLimit);
    setCountdown(3); // Always start with 3 seconds countdown
  };

  // Handle game end with useCallback
  const handleGameEnd = useCallback((completed) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    const earned = completed ? 100 + Math.floor(timeLeft / 5) : 10; // Fewer coins for loss
    setCoinsEarned(earned);
    setCoins(prev => prev + earned);
    setGameResult(completed ? 'win' : 'lose');

    if (completed) {
      setChapter(prev => prev + 1);
      sounds.complete.play();
    }

    if (isLoggedIn) {
      const updatedUser = { ...userData, coins: coins + earned, xp: xp + (completed ? 50 : 10) };
      saveGameUser(updatedUser);
      setUserStats(prev => (prev && {
        ...prev,
        totalMatches: prev.totalMatches + 1,
        wins: completed ? prev.wins + 1 : prev.wins,
        losses: completed ? prev.losses : prev.losses + 1,
        totalCoinsWon: prev.totalCoinsWon + earned,
        xp: prev.xp + (completed ? 50 : 10),
      }));
    }

    setShowGameEndModal(true);
    setGameState('select');
    setShowMemorizeScreen(false);
    setCountdown(null);
  }, [isLoggedIn, userData, saveGameUser, coins, xp, timeLeft]);

  // Handle countdown and game start
  useEffect(() => {
    if (countdown === null) return;

    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 0) {
          clearInterval(countdownRef.current);
          setGameState('playing');
          setCountdown(null);
          if (selectedMode.id !== 'zen') {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
              setTimeLeft(prev => {
                if (prev <= 0) {
                  clearInterval(timerRef.current);
                  handleGameEnd(false);
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownRef.current);
  }, [countdown, selectedMode.id, handleGameEnd]);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const scorers = await fetchTopScorers();
        setTopScorers(scorers);
        setLoadingTopScorers(false);
        if (isLoggedIn && userData) {
          const achievements = await fetchUserAchievements(userData.id);
          setUserAchievements(achievements);
          const stats = await fetchUserGameStats(userData.id);
          setUserStats(stats);
        }
        setLoadingAchievements(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoadingTopScorers(false);
        setLoadingAchievements(false);
      }
    };
    loadData();
  }, [isLoggedIn, userData]);

  // Handle click outside profile dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // Handle card click
  const handleCardClick = (card) => {
    if (gameState === 'memorizing') {
      setShowCardModal(card);
      setTimeout(() => setShowCardModal(null), 2000);
      return;
    }
    if (gameState !== 'playing' || card.isFlipped || card.isMatched || flippedCards.length >= 2) return;

    const newCards = cards.map(c => (c.id === card.id ? { ...c, isFlipped: true } : c));
    setCards(newCards);
    const newFlipped = [...flippedCards, card];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;
      if (first.pairId === second.pairId && first.type !== second.type) {
        setMatchedPairs(prev => [...prev, first.pairId]);
        setCards(prev => prev.map(c => (c.pairId === first.pairId ? { ...c, isMatched: true } : c)));
        setScore(prev => prev + (selectedMode.id === 'timeAttack' ? 100 : 50));
        setXp(prev => prev + 10);
        sounds.found.play();
        if (matchedPairs.length + 1 === selectedDifficulty.cardCount / 2) {
          handleGameEnd(true);
        }
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c => (c.isFlipped && !c.isMatched ? { ...c, isFlipped: false } : c)));
        }, 1000);
      }
      setFlippedCards([]);
    }
  };

  // Handle profile update
  const handleProfileUpdate = () => {
    if (isLoggedIn) {
      const updatedUser = { ...userData, name: newName, avatar: newAvatar };
      saveGameUser(updatedUser);
      setEditingProfile(false);
    }
  };

  // Handle avatar change
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setNewAvatar(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Handle buy coins
  const handleBuyCoins = (amount) => {
    if (isLoggedIn) {
      const newCoins = coins + amount;
      setCoins(newCoins);
      const updatedUser = { ...userData, coins: newCoins };
      saveGameUser(updatedUser);
      setShowCoinShop(false);
    } else {
      navigate('/login');
    }
  };

  // Handle play as guest
  const handlePlayAsGuest = () => {
    setPlayAsGuest(true);
    setShowLoginModal(false);
    setShowStoryModal(true);
  };

  // Render navbar
  const renderNavbar = () => (
    <nav className={styles.navbar}>
      <h1 className={styles.navbarBrand}>{language === 'punjabi' ? 'ਵਿਰਸਾ ਵਿੱਚ ਯਾਦ' : 'Virsaa Vich Yaad'}</h1>
      <div className={styles.navbarRight}>
        {isLoggedIn && userData ? (
          <div className={styles.userInfo}>
            <img
              src={getImagePath(userData.avatar || userDefault)}
              alt="User"
              className={styles.userAvatar}
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            />
            <span>{userData.name || 'Virsaa Player'}</span>
            <span className={styles.coins}>
              {coins} <FaCoins />
            </span>
            <div className={styles.levelProgress}>
              <span>Level {userStats?.level || 1}</span>
              <div className={styles.progressBar}>
                <div style={{ width: `${((userStats?.xp || 0) / (userStats?.maxXp || 1000)) * 100}%` }}></div>
              </div>
            </div>
            <button onClick={() => setShowSettings(true)} className={styles.settingsButton} aria-label="Settings">
              <FaCog />
            </button>
            {showProfileDropdown && (
              <div className={styles.profileDropdown} ref={profileDropdownRef}>
                <div className={styles.profileHeader}>
                  <h3>{language === 'punjabi' ? 'ਪ੍ਰੋਫਾਈਲ' : 'Game Profile'}</h3>
                  <button onClick={() => setShowProfileDropdown(false)} className={styles.closeButton} aria-label="Close">×</button>
                </div>
                <div className={styles.profileContent}>
                  {editingProfile ? (
                    <div className={styles.profileEdit}>
                      <div className={styles.avatarUpload}>
                        <img src={getImagePath(newAvatar)} alt="User Avatar" className={styles.profileAvatar} />
                        <input type="file" accept="image/*" onChange={handleAvatarChange} id="avatar-upload" />
                        <label htmlFor="avatar-upload">{language === 'punjabi' ? 'ਅਵਤਾਰ ਬਦਲੋ' : 'Change Avatar'}</label>
                      </div>
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder={language === 'punjabi' ? 'ਨਵਾਂ ਨਾਮ' : 'New Name'}
                      />
                      <div className={styles.profileEditButtons}>
                        <button onClick={handleProfileUpdate}>{language === 'punjabi' ? 'ਸੰਭਾਲੋ' : 'Save'}</button>
                        <button onClick={() => setEditingProfile(false)}>{language === 'punjabi' ? 'ਰੱਦ ਕਰੋ' : 'Cancel'}</button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.profileInfo}>
                      <img src={getImagePath(userData.avatar || userDefault)} alt="User Avatar" className={styles.profileAvatar} />
                      <h4>{userData.name || 'Virsaa Player'}</h4>
                      <button onClick={() => setEditingProfile(true)}>
                        <FaEdit /> {language === 'punjabi' ? 'ਸੋਧੋ' : 'Edit Profile'}
                      </button>
                    </div>
                  )}
                  {userStats && (
                    <div className={styles.profileSection}>
                      <h4>{language === 'punjabi' ? 'ਖੇਡ ਦੇ ਅੰਕੜੇ' : 'Game Stats'}</h4>
                      <div className={styles.statsList}>
                        <div><span>{language === 'punjabi' ? 'ਕੁੱਲ ਮੈਚ' : 'Total Matches'}</span><span>{userStats.totalMatches}</span></div>
                        <div><span>{language === 'punjabi' ? 'ਜਿੱਤਾਂ' : 'Wins'}</span><span>{userStats.wins}</span></div>
                        <div><span>{language === 'punjabi' ? 'ਹਾਰਾਂ' : 'Losses'}</span><span>{userStats.losses}</span></div>
                        <div><span>{language === 'punjabi' ? 'ਕੁੱਲ ਸਿੱਕੇ' : 'Total Coins'}</span><span>{userStats.totalCoinsWon} <FaCoins /></span></div>
                      </div>
                    </div>
                  )}
                  <button className={styles.actionButton} onClick={() => setShowCoinShop(true)}>
                    <FaCreditCard /> {language === 'punjabi' ? 'ਸਿੱਕੇ ਖਰੀਦੋ' : 'Buy Coins'}
                  </button>
                  <button className={styles.actionButton} onClick={logout}>
                    <FaSignOutAlt /> {language === 'punjabi' ? 'ਲੌਗਆਉਟ' : 'Logout'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <button onClick={() => navigate('/login')} className={styles.loginButton}>
              <FaSignInAlt /> {language === 'punjabi' ? 'ਲੌਗਇਨ' : 'Login'}
            </button>
            <button onClick={() => setShowSettings(true)} className={styles.settingsButton} aria-label="Settings">
              <FaCog />
            </button>
          </>
        )}
      </div>
    </nav>
  );

  
  const renderSettingsSidebar = () => {
    
  
    return (
      <div className={`${styles.settingsSidebar} ${showSettings ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <h2>{language === 'punjabi' ? 'ਸੈਟਿੰਗਾਂ' : 'Settings'}</h2>
          <button onClick={() => setShowSettings(false)} className={styles.closeButton} aria-label="Close">×</button>
        </div>
        <div className={styles.settingsContent}>
          <label>
            <input
              type="checkbox"
              checked={sounds.found.volume() > 0}
              onChange={() => sounds.found.volume(sounds.found.volume() > 0 ? 0 : 1)}
            />
            <span>{language === 'punjabi' ? 'ਆਵਾਜ਼' : 'Sound'}</span>
          </label>
          <label>
            <input
              type="checkbox"
              checked={musicEnabled}
              onChange={() => setMusicEnabled(!musicEnabled)}
            />
            <span>{language === 'punjabi' ? 'ਸੰਗੀਤ' : 'Music'}</span>
          </label>
          <label>
            <span>{language === 'punjabi' ? 'ਥੀਮ' : 'Theme'}</span>
            <select>
              <option value="phulkari">Phulkari</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={() => setNotificationsEnabled(!notificationsEnabled)}
            />
            <span>{language === 'punjabi' ? 'ਸੂਚਨਾਵਾਂ' : 'Notifications'}</span>
          </label>
          <label>
            <span>{language === 'punjabi' ? 'ਭਾਸ਼ਾ' : 'Language'}</span>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="english">English</option>
              <option value="punjabi">Punjabi</option>
            </select>
          </label>
        </div>
      </div>
    );
  };
  // Render coin shop modal
  const renderCoinShopModal = () => (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2>{language === 'punjabi' ? 'ਸਿੱਕੇ ਦੀ ਦੁਕਾਨ' : 'Coin Shop'}</h2>
        <div className={styles.shopOptions}>
          <button onClick={() => handleBuyCoins(100)}>100 Coins - $0.99</button>
          <button onClick={() => handleBuyCoins(500)}>500 Coins - $4.99</button>
          <button onClick={() => handleBuyCoins(1000)}>1000 Coins - $9.99</button>
        </div>
        <button onClick={() => setShowCoinShop(false)}>{language === 'punjabi' ? 'ਬੰਦ ਕਰੋ' : 'Close'}</button>
      </div>
    </div>
  );

  // Render selection screen
  const renderSelectionScreen = () => (
    <div className={styles.selectionScreen}>
      <h2>{language === 'punjabi' ? 'ਖੇਡ ਸੈਟਿੰਗਜ਼' : 'Game Settings'}</h2>
      <div className={styles.selectionOptions}>
        <div className={styles.optionGroup}>
          <h3>{language === 'punjabi' ? 'ਮੋਡ' : 'Mode'}</h3>
          <div className={styles.modeOptions}>
            {gameModes.map(mode => (
              <button
                type="button"
                key={mode.id}
                className={`${styles.modeCard} ${selectedMode.id === mode.id ? styles.selected : ''}`}
                aria-pressed={selectedMode.id === mode.id}
                onClick={() => setSelectedMode(mode)}
              >
                <h4>{mode.name}</h4>
                <p>{mode.description}</p>
              </button>
            ))}
          </div>
        </div>
        <div className={styles.optionGroup}>
          <h3>{language === 'punjabi' ? 'ਮੁਸ਼ਕਲਤਾ' : 'Difficulty'}</h3>
          <div className={styles.difficultyOptions}>
            {difficultyLevels.map(diff => (
              <button
                type="button"
                key={diff.id}
                className={`${styles.difficultyCard} ${selectedDifficulty.id === diff.id ? styles.selected : ''}`}
                aria-pressed={selectedDifficulty.id === diff.id}
                onClick={() => setSelectedDifficulty(diff)}
              >
                <h4>{diff.name}</h4>
                <p>{language === 'punjabi' ? `ਕਾਰਡ: ${diff.cardCount}` : `Cards: ${diff.cardCount}`}</p>
                <p>{language === 'punjabi' ? `ਸਮਾਂ: ${diff.timeLimit} ਸਕਿੰਟ` : `Time: ${diff.timeLimit} sec`}</p>
              </button>
            ))}
          </div>
        </div>
        <div className={styles.optionGroup}>
          <h3>{language === 'punjabi' ? 'ਕਾਰਡ ਸੈੱਟ' : 'Card Set'}</h3>
          <select value={selectedCardSet} onChange={(e) => setSelectedCardSet(e.target.value)}>
            <option value="festivals">{language === 'punjabi' ? 'ਤਿਉਹਾਰ' : 'Festivals'}</option>
            <option value="symbols">{language === 'punjabi' ? 'ਚਿੰਨ੍ਹ' : 'Symbols'}</option>
          </select>
        </div>
        <div className={styles.optionGroup}>
          <h3>{language === 'punjabi' ? 'ਭਾਸ਼ਾ' : 'Language'}</h3>
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="english">English</option>
            <option value="punjabi">Punjabi</option>
          </select>
        </div>
      </div>
      <button className={styles.startButton} onClick={startMemorization}>
        {language === 'punjabi' ? 'ਖੇਡ ਸ਼ੁਰੂ' : 'Start Game'}
      </button>
    </div>
  );

  // Render memorize screen
  const renderMemorizeScreen = () => (
    <div className={styles.memorizeScreen}>
      <div className={styles.gameControls}>
        <button onClick={() => setShowHowToPlay(true)}>
          <FaPlay /> {language === 'punjabi' ? 'ਕਿਵੇਂ ਖੇਡਣਾ' : 'How to Play'}
        </button>
        <button onClick={() => setShowRulesModal(true)}>
          <FaList /> {language === 'punjabi' ? 'ਨਿਯਮ' : 'Rules'}
        </button>
        <div className={styles.timer}>
          {language === 'punjabi' ? 'ਯਾਦ ਕਰੋ: ' : 'Memorize: '} {timeLeft}s
        </div>
      </div>
      <div className={styles.memorizeNotification}>
        <h2>{language === 'punjabi' ? 'ਸਾਰੇ ਕਾਰਡ ਯਾਦ ਕਰੋ' : 'Memorize all the cards'}</h2>
        <button className={styles.startButton} onClick={startPlayingPhase}>
          {language === 'punjabi' ? 'ਸ਼ੁਰੂ' : 'Start'}
        </button>
      </div>
      <div className={styles.cardGrid}>
        {memorizeCards.length > 0 ? (
          memorizeCards.map(card => (
            <div
              key={card.id}
              className={`${styles.card} ${card.isFlipped ? styles.flipped : ''} ${card.isMatched ? styles.matched : ''}`}
              onClick={() => handleCardClick(card)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCardClick(card); } }}
              tabIndex={0}
              role="button"
              aria-label={card.type === 'image' ? `${card.text} image` : `${card.text} text`}
            >
              <div className={styles.cardInner}>
                <div className={styles.cardFront}>
                  <span className={styles.hiddenIcon}>?</span>
                </div>
                <div className={styles.cardBack}>
                  <img src={getImagePath(card.image)} alt={card.text} loading="lazy" />
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>{language === 'punjabi' ? 'ਕਾਰਡ ਲੋਡ ਹੋ ਰਹੇ ਹਨ...' : 'Loading cards...'}</p>
        )}
      </div>
    </div>
  );

  // Render game screen
  const renderGameScreen = () => (
    <div className={styles.gameScreen}>
      <div className={styles.gameControls}>
        <button onClick={() => setShowHowToPlay(true)}>
          <FaPlay /> {language === 'punjabi' ? 'ਕਿਵੇਂ ਖੇਡਣਾ' : 'How to Play'}
        </button>
        <button onClick={() => setShowRulesModal(true)}>
          <FaList /> {language === 'punjabi' ? 'ਨਿਯਮ' : 'Rules'}
        </button>
        <div className={styles.timer}>
          {language === 'punjabi' ? 'ਸਮਾਂ: ' : 'Time: '} {timeLeft}s | {language === 'punjabi' ? 'ਸਕੋਰ: ' : 'Score: '} {score}
        </div>
      </div>
      <div className={styles.cardGrid}>
        {cards.length > 0 ? (
          cards.map(card => (
            <div
              key={card.id}
              className={`${styles.card} ${card.isFlipped ? styles.flipped : ''} ${card.isMatched ? styles.matched : ''}`}
              onClick={() => handleCardClick(card)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCardClick(card); } }}
              tabIndex={0}
              role="button"
              aria-label={card.type === 'image' ? `${card.text} image` : `${card.text} text`}
            >
              <div className={styles.cardInner}>
                <div className={styles.cardFront}>
                  <span className={styles.hiddenIcon}>?</span>
                </div>
                <div className={styles.cardBack}>
                  {card.type === 'image' ? (
                    <img src={getImagePath(card.image)} alt={card.text} loading="lazy" />
                  ) : (
                    <span>{language === 'punjabi' ? card.punjabiText : card.text}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>{language === 'punjabi' ? 'ਕਾਰਡ ਲੋਡ ਹੋ ਰਹੇ ਹਨ...' : 'Loading cards...'}</p>
        )}
      </div>
      {countdown !== null && (
        <div className={styles.countdown}>
          {language === 'punjabi' ? `ਖੇਡ ਸ਼ੁਰੂ ਹੋਵੇਗੀ ${countdown} ਵਿੱਚ...` : `Game starts in ${countdown}...`}
        </div>
      )}
      <div className={styles.sidePanels}>
        <div className={styles.sidePanel}>
          <h3><MdLeaderboard /> {language === 'punjabi' ? 'ਚੋਟੀ ਦੇ ਖਿਡਾਰੀ' : 'Top Scorers'}</h3>
          {loadingTopScorers ? (
            <Skeleton count={3} height={40} />
          ) : (
            topScorers.map((player, index) => (
              <div key={player.id} className={styles.leaderboardItem}>
                <span>{index + 1}</span>
                <img src={getImagePath(player.avatar)} alt={player.name} />
                <div>
                  <span>{player.name}</span>
                  <span>{player.score} pts</span>
                </div>
              </div>
            ))
          )}
        </div>
        <div className={styles.sidePanel}>
          <h3><MdStars /> {language === 'punjabi' ? 'ਪ੍ਰਾਪਤੀਆਂ' : 'Achievements'}</h3>
          {loadingAchievements ? (
            <Skeleton count={3} height={60} />
          ) : (
            userAchievements.map(ach => (
              <div key={ach.id} className={`${styles.achievement} ${ach.earned ? styles.earned : ''}`}>
                <span className={styles.achievementIcon} aria-hidden="true">{ach.icon}</span>
                <div>
                  <h4>{ach.name}</h4>
                  <p>{ach.description}</p>
                  {ach.progress && <span>{ach.progress}</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  // Render story modal
  const renderStoryModal = () => (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2>{language === 'punjabi' ? `ਅਧਿਆਇ ${chapter}: ਵਿਰਸਾ ਦੀ ਯਾਤਰਾ` : `Chapter ${chapter}: Heritage Journey`}</h2>
        <p>{language === 'punjabi' ? 'ਪੰਜਾਬੀ ਵਿਰਸੇ ਦੀ ਖੋਜ ਕਰੋ, ਜਿੱਥੇ ਹਰ ਜੋੜਾ ਇੱਕ ਕਹਾਣੀ ਸੁਣਾਉਂਦਾ ਹੈ।' : 'Explore Punjabi heritage, where each pair tells a story.'}</p>
        <button onClick={startMemorizePhase}>
          {language === 'punjabi' ? 'ਖੇਡ ਸ਼ੁਰੂ' : 'Start Chapter'}
        </button>
      </div>
    </div>
  );

  // Render rules modal with icons
  const renderRulesModal = () => (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2>{language === 'punjabi' ? 'ਨਿਯਮ' : 'Rules'}</h2>
        <ul>
          <li><FaClock className={styles.ruleIcon} /> {language === 'punjabi' ? '1 ਮਿੰਟ ਵਿੱਚ ਸਾਰੇ ਕਾਰਡ ਯਾਦ ਕਰੋ।' : 'Memorize all cards in 1 minute.'}</li>
          <li><FaExchangeAlt className={styles.ruleIcon} /> {language === 'punjabi' ? 'ਚਿੱਤਰ ਅਤੇ ਟੈਕਸਟ ਕਾਰਡਾਂ ਨੂੰ ਮੇਲ ਕਰੋ।' : 'Match image and text cards.'}</li>
          <li><FaStar className={styles.ruleIcon} /> {language === 'punjabi' ? 'ਸਕੋਰ ਅਤੇ ਸਿੱਕੇ ਕਮਾਓ।' : 'Earn score and coins.'}</li>
          <li><FaTachometerAlt className={styles.ruleIcon} /> {language === 'punjabi' ? 'ਟਾਈਮ ਅਟੈਕ ਵਿੱਚ ਤੇਜ਼ੀ ਨਾਲ ਜੋੜੀਆਂ ਲੱਭੋ।' : 'Find pairs quickly in Time Attack.'}</li>
        </ul>
        <button onClick={() => setShowRulesModal(false)}>{language === 'punjabi' ? 'ਬੰਦ ਕਰੋ' : 'Close'}</button>
      </div>
    </div>
  );

  // Render how to play modal
  const renderHowToPlayModal = () => (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2>{language === 'punjabi' ? 'ਕਿਵੇਂ ਖੇਡਣਾ' : 'How to Play'}</h2>
        <video controls src="./assets/videos/how-to-play.mp4" className={styles.video} loading="lazy"></video>
        <button onClick={() => setShowHowToPlay(false)}>{language === 'punjabi' ? 'ਬੰਦ ਕਰੋ' : 'Close'}</button>
      </div>
    </div>
  );

  // Render card preview modal
  const renderCardModal = () => {
    if (!showCardModal) return null;
    const pairCard = cards.find(c => c.pairId === showCardModal.pairId && c.type === 'text');
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modal}>
          <h2>{language === 'punjabi' ? 'ਕਾਰਡ ਜੋੜਾ' : 'Card Pair'}</h2>
          <div className={styles.cardPair}>
            <div className={styles.cardPreview}>
              <img src={getImagePath(showCardModal.image)} alt={showCardModal.text} loading="lazy" />
            </div>
            <div className={styles.cardPreview}>
              <span>{language === 'punjabi' ? pairCard.punjabiText : pairCard.text}</span>
            </div>
          </div>
          <button onClick={() => setShowCardModal(null)}>{language === 'punjabi' ? 'ਬੰਦ ਕਰੋ' : 'Close'}</button>
        </div>
      </div>
    );
  };

  // Render game end modal
  const renderGameEndModal = () => (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modal} ${gameResult === 'win' ? styles.winModal : styles.loseModal}`}>
        <h2>
          {gameResult === 'win'
            ? (language === 'punjabi' ? 'ਵਧਾਈਆਂ!' : 'Congratulations!')
            : (language === 'punjabi' ? 'ਅਫਸੋਸ! ਅਗਲੀ ਵਾਰ ਬਿਹਤਰ ਕਿਸਮਤ' : 'Sorry! Better Luck Next Time')}
        </h2>
        <p>
          {gameResult === 'win'
            ? (language === 'punjabi' ? 'ਤੁਸੀਂ ਸਾਰੇ ਜੋੜੇ ਮਿਲਾ ਲਏ ਹਨ!' : 'You have matched all pairs!')
            : (language === 'punjabi' ? 'ਤੁਸੀਂ ਸਮਾਂ ਸਮਾਪਤ ਹੋਣ ਤੋਂ ਪਹਿਲਾਂ ਜੋੜੇ ਨਹੀਂ ਮਿਲਾਏ।' : 'You didn’t match all pairs before time ran out.')}
        </p>
        <div className={styles.coinsInfo}>
          <p>{language === 'punjabi' ? `ਕਮਾਏ ਸਿੱਕੇ: ${coinsEarned}` : `Coins Earned: ${coinsEarned}`}</p>
          <p>{language === 'punjabi' ? `ਕੁੱਲ ਸਿੱਕੇ: ${coins}` : `Total Coins: ${coins}`}</p>
        </div>
        <button onClick={() => setShowGameEndModal(false)}>
          {language === 'punjabi' ? 'ਬੰਦ ਕਰੋ' : 'Close'}
        </button>
      </div>
    </div>
  );

  // Render login modal
  const renderLoginModal = () => (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2>{language === 'punjabi' ? 'ਲੌਗਇਨ ਦੀ ਲੋੜ' : 'Login Required'}</h2>
        <p>{language === 'punjabi' ? 'ਪ੍ਰਗਤੀ ਅਤੇ ਲੀਡਰਬੋਰਡ ਲਈ ਲੌਗਇਨ ਕਰੋ।' : 'Login to save progress and access leaderboards.'}</p>
        <button onClick={() => navigate('/login')}>
          <FaSignInAlt /> {language === 'punjabi' ? 'ਲੌਗਇਨ' : 'Login'}
        </button>
        <button onClick={handlePlayAsGuest}>
          <FaUser /> {language === 'punjabi' ? 'ਮਹਿਮਾਨ' : 'Play as Guest'}
        </button>
      </div>
    </div>
  );

  // Main render
  return (
    <div className={styles.container}>
      {renderNavbar()}
      {showSettings && renderSettingsSidebar()}
      {showCoinShop && renderCoinShopModal()}
      {gameState === 'select' && renderSelectionScreen()}
      {showMemorizeScreen && renderMemorizeScreen()}
      {gameState === 'playing' && !showMemorizeScreen && renderGameScreen()} 
      {showStoryModal && renderStoryModal()}
      {showRulesModal && renderRulesModal()}
      {showHowToPlay && renderHowToPlayModal()}
      {showCardModal && renderCardModal()}
      {showGameEndModal && renderGameEndModal()}
      {showLoginModal && renderLoginModal()}
    </div>
  );
};

export default MemoryMatch;