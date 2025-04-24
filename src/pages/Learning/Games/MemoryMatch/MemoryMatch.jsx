import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import styles from './MemoryMatch.module.css';
import { Howl } from 'howler';
import { FaCoins, FaUser, FaSignInAlt, FaEdit, FaCreditCard, FaSignOutAlt, FaCog, FaPlay, FaList } from 'react-icons/fa';
import { MdLeaderboard, MdStars } from 'react-icons/md';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import foundSound from './assets/sounds/found.mp3';
import achievementSound from './assets/sounds/level-up.mp3';
import completeSound from './assets/sounds/complete.mp3';
import userDefault from './assets/images/user-default.jpg';
import vaisakhi from './assets/images/vaisakhi.jpg';
import bhangra from './assets/images/bhangra.jpg';
import giddha from './assets/images/giddha.jpg';
import phulkari from './assets/images/phulkari.jpg';
import lassi from './assets/images/lassi.jpg';
import lohri from './assets/images/lohri.jpg';
import basant from './assets/images/basant.jpg'
import holi from './assets/images/holi.jpg';
import diwali from './assets/images/diwali.jpg';
import kangha from './assets/images/kangha.jpg';
import kara from './assets/images/kara.jpg';
import ik_onkar from './assets/images/basant.jpg'
import khanda from './assets/images/khanda.jpg';
import kirpan from './assets/images/kirpan.jpg';







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
    { id: 1, name: 'Vaisakhi Master', description: 'Match 50 festival cards', earned: true, icon: '🏵️' },
    { id: 2, name: 'Memory Guru', description: 'Complete 100 matches', earned: false, icon: '🧠', progress: '20/100' },
    { id: 3, name: 'Speed Sikh', description: 'Finish Time Attack in 30s', earned: false, icon: '⚡' },
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
  const { isLoggedIn, userData, login, logout } = useAuth();
  const navigate = useNavigate();

  // State management
  const [gameState, setGameState] = useState('select');
  const [selectedMode, setSelectedMode] = useState(gameModes[0]);
  const [selectedDifficulty, setSelectedDifficulty] = useState(difficultyLevels[1]);
  const [selectedCardSet, setSelectedCardSet] = useState('festivals');
  const [language, setLanguage] = useState('english');
  const [cards, setCards] = useState([]);
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
  const timerRef = useRef(null);
  const profileDropdownRef = useRef(null);

  // Initialize cards
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
    console.log('Initialized cards:', shuffledCards);
    setCards(shuffledCards);
    setTimeLeft(selectedDifficulty.timeLimit);
    setFlippedCards([]);
    setMatchedPairs([]);
    setScore(0);
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
    console.log('Starting memorize phase, gameState:', gameState);
    initializeCards();
    setShowStoryModal(false);
    setShowMemorizeScreen(true);
    setGameState('memorizing');
    setTimeLeft(selectedDifficulty.timeLimit);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        console.log('Time left:', prev);
        if (prev <= 3 && selectedMode.id !== 'zen') {
          clearInterval(timerRef.current);
          setCountdown(3);
          return prev;
        }
        if (prev <= 0) {
          clearInterval(timerRef.current);
          setShowMemorizeScreen(false);
          setGameState('playing');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Handle game end with useCallback
  const handleGameEnd = useCallback((completed) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (completed) {
      const coinsEarned = 100 + Math.floor(timeLeft / 5);
      setCoins(prev => prev + coinsEarned);
      setChapter(prev => prev + 1);
      if (isLoggedIn) {
        const updatedUser = { ...userData, coins: coins + coinsEarned, xp: xp + 50 };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        login(userData.token, updatedUser);
        setUserStats(prev => ({
          ...prev,
          totalMatches: prev.totalMatches + 1,
          wins: prev.wins + 1,
          totalCoinsWon: prev.totalCoinsWon + coinsEarned,
          xp: prev.xp + 50,
        }));
      }
      sounds.complete.play();
    }
    setGameState('select');
  }, [isLoggedIn, userData, login, coins, xp, timeLeft]);

  // Handle countdown and game start
  useEffect(() => {
    if (countdown === null) return;
    const timer = setTimeout(() => {
      console.log('Countdown:', countdown);
      if (countdown > 0) {
        setCountdown(prev => prev - 1);
      } else {
        console.log('Starting game, gameState:', gameState);
        setShowMemorizeScreen(false);
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
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, selectedMode.id, gameState, handleGameEnd]);

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

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Handle card click
  const handleCardClick = (card) => {
    console.log('Card clicked:', card, 'gameState:', gameState);
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
      localStorage.setItem('user', JSON.stringify(updatedUser));
      login(userData.token, updatedUser);
      setEditingProfile(false);
      setShowProfileDropdown(false);
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
      localStorage.setItem('user', JSON.stringify(updatedUser));
      login(userData.token, updatedUser);
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
              src={userData.avatar || userDefault}
              alt="User"
              className={styles.userAvatar}
              onClick={() => setShowProfileDropdown(true)}
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
            <button onClick={() => setShowSettings(true)} className={styles.settingsButton}>
              <FaCog />
            </button>
            {showProfileDropdown && (
              <div className={styles.profileDropdown} ref={profileDropdownRef}>
                <div className={styles.profileHeader}>
                  <h3>{language === 'punjabi' ? 'ਪ੍ਰੋਫਾਈਲ' : 'Profile'}</h3>
                  <button onClick={() => setShowProfileDropdown(false)} className={styles.closeButton}>×</button>
                </div>
                <div className={styles.profileContent}>
                  {editingProfile ? (
                    <div className={styles.profileEdit}>
                      <div className={styles.avatarUpload}>
                        <img src={newAvatar} alt="User Avatar" className={styles.profileAvatar} />
                        <input type="file" accept="image/*" onChange={handleAvatarChange} id="avatar-upload" />
                        <label htmlFor="avatar-upload">{language === 'punjabi' ? 'ਅਵਤਾਰ ਬਦਲੋ' : 'Change Avatar'}</label>
                      </div>
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder={language === 'punjabi' ? 'ਨਵਾਂ ਨਾਮ' : 'New Name'}
                      />
                      <button onClick={handleProfileUpdate}>{language === 'punjabi' ? 'ਸੰਭਾਲੋ' : 'Save'}</button>
                      <button onClick={() => setEditingProfile(false)}>{language === 'punjabi' ? 'ਰੱਦ ਕਰੋ' : 'Cancel'}</button>
                    </div>
                  ) : (
                    <div className={styles.profileInfo}>
                      <img src={userData.avatar || userDefault} alt="User Avatar" className={styles.profileAvatar} />
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
                  <button onClick={() => setShowCoinShop(true)}>
                    <FaCreditCard /> {language === 'punjabi' ? 'ਸਿੱਕੇ ਖਰੀਦੋ' : 'Coin Shop'}
                  </button>
                  <button onClick={logout}>
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
            <button onClick={() => setShowSettings(true)} className={styles.settingsButton}>
              <FaCog />
            </button>
          </>
        )}
      </div>
    </nav>
  );

  // Render settings sidebar
  const renderSettingsSidebar = () => (
    <div className={`${styles.settingsSidebar} ${showSettings ? styles.sidebarOpen : ''}`}>
      <div className={styles.sidebarHeader}>
        <h2>{language === 'punjabi' ? 'ਸੈਟਿੰਗਾਂ' : 'Settings'}</h2>
        <button onClick={() => setShowSettings(false)} className={styles.closeButton}>×</button>
      </div>
      <div className={styles.settingsContent}>
        <label>
          <input
            type="checkbox"
            checked={sounds.found.volume() > 0}
            onChange={() => sounds.found.volume(sounds.found.volume() > 0 ? 0 : 1)}
          />
          {language === 'punjabi' ? 'ਆਵਾਜ਼' : 'Sound'}
        </label>
        <label>
          <input
            type="checkbox"
            checked={true}
            onChange={() => {}}
          />
          {language === 'punjabi' ? 'ਸੰਗੀਤ' : 'Music'}
        </label>
        <label>
          {language === 'punjabi' ? 'ਥੀਮ' : 'Theme'}
          <select>
            <option value="phulkari">Phulkari</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={true}
            onChange={() => {}}
          />
          {language === 'punjabi' ? 'ਸੂਚਨਾਵਾਂ' : 'Notifications'}
        </label>
        <label>
          {language === 'punjabi' ? 'ਭਾਸ਼ਾ' : 'Language'}
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="english">English</option>
            <option value="punjabi">Punjabi</option>
          </select>
        </label>
      </div>
    </div>
  );

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
              <div
                key={mode.id}
                className={`${styles.modeCard} ${selectedMode.id === mode.id ? styles.selected : ''}`}
                onClick={() => setSelectedMode(mode)}
              >
                <h4>{mode.name}</h4>
                <p>{mode.description}</p>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.optionGroup}>
          <h3>{language === 'punjabi' ? 'ਮੁਸ਼ਕਲਤਾ' : 'Difficulty'}</h3>
          <div className={styles.difficultyOptions}>
            {difficultyLevels.map(diff => (
              <div
                key={diff.id}
                className={`${styles.difficultyCard} ${selectedDifficulty.id === diff.id ? styles.selected : ''}`}
                onClick={() => setSelectedDifficulty(diff)}
              >
                <h4>{diff.name}</h4>
                <p>{language === 'punjabi' ? `ਕਾਰਡ: ${diff.cardCount}` : `Cards: ${diff.cardCount}`}</p>
                <p>{language === 'punjabi' ? `ਸਮਾਂ: ${diff.timeLimit} ਸਕਿੰਟ` : `Time: ${diff.timeLimit} sec`}</p>
              </div>
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
        <button className={styles.startButton} onClick={() => {
          console.log('Start button clicked, ending memorize phase');
          setShowMemorizeScreen(false);
        }}>
          {language === 'punjabi' ? 'ਸ਼ੁਰੂ' : 'Start'}
        </button>
      </div>
      <div className={styles.cardGrid}>
        {cards.length > 0 ? (
          cards.map(card => (
            <div
              key={card.id}
              className={`${styles.card} ${card.isFlipped ? styles.flipped : ''} ${card.isMatched ? styles.matched : ''}`}
              onClick={() => handleCardClick(card)}
              onTouchStart={() => handleCardClick(card)}
              role="button"
              aria-label={card.type === 'image' ? `${card.text} image` : `${card.text} text`}
            >
              <div className={styles.cardInner}>
                <div className={styles.cardFront}>
                  <img src={card.image} alt={card.text} loading="lazy" />
                </div>
                <div className={styles.cardBack}>
                  {card.type === 'image' ? (
                    <img src={card.image} alt={card.text} loading="lazy" />
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
          {language === 'punjabi' ? 'ਸਕੋਰ: ' : 'Score: '} {score}
        </div>
      </div>
      <div className={styles.cardGrid}>
        {cards.length > 0 ? (
          cards.map(card => (
            <div
              key={card.id}
              className={`${styles.card} ${card.isFlipped ? styles.flipped : ''} ${card.isMatched ? styles.matched : ''}`}
              onClick={() => handleCardClick(card)}
              onTouchStart={() => handleCardClick(card)}
              role="button"
              aria-label={card.type === 'image' ? `${card.text} image` : `${card.text} text`}
            >
              <div className={styles.cardInner}>
                <div className={styles.cardFront}>
                  <img src={card.image} alt={card.text} loading="lazy" />
                </div>
                <div className={styles.cardBack}>
                  {card.type === 'image' ? (
                    <img src={card.image} alt={card.text} loading="lazy" />
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
                <img src={player.avatar} alt={player.name} />
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
                <span>{ach.icon}</span>
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

  // Render rules modal
  const renderRulesModal = () => (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2>{language === 'punjabi' ? 'ਨਿਯਮ' : 'Rules'}</h2>
        <ul>
          <li>{language === 'punjabi' ? '1 ਮਿੰਟ ਵਿੱਚ ਸਾਰੇ ਕਾਰਡ ਯਾਦ ਕਰੋ।' : 'Memorize all cards in 1 minute.'}</li>
          <li>{language === 'punjabi' ? 'ਚਿੱਤਰ ਅਤੇ ਟੈਕਸਟ ਕਾਰਡਾਂ ਨੂੰ ਮੇਲ ਕਰੋ।' : 'Match image and text cards.'}</li>
          <li>{language === 'punjabi' ? 'ਸਕੋਰ ਅਤੇ ਸਿੱਕੇ ਕਮਾਓ।' : 'Earn score and coins.'}</li>
          <li>{language === 'punjabi' ? 'ਟਾਈਮ ਅਟੈਕ ਵਿੱਚ ਤੇਜ਼ੀ ਨਾਲ ਜੋੜੀਆਂ ਲੱਭੋ।' : 'Find pairs quickly in Time Attack.'}</li>
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
    const pairCard = cards.find(c => c.pairId === showCardModal.pairId && c.type !== showCardModal.type);
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modal}>
          <h2>{language === 'punjabi' ? 'ਕਾਰਡ ਜੋੜਾ' : 'Card Pair'}</h2>
          <div className={styles.cardPair}>
            <div className={styles.cardPreview}>
              <img src={showCardModal.image} alt={showCardModal.text} loading="lazy" />
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
      {showLoginModal && renderLoginModal()}
    </div>
  );
};

export default MemoryMatch;