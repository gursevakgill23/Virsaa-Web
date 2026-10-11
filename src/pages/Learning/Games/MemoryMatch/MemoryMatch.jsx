import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../../../context/AuthContext';
import learningApi from '../../../../api/learningApi';
import BadgeIcon from '../../../../components/BadgeIcon/BadgeIcon';
import useGameWallet from '../useGameWallet';
import GameProfileCard from '../GameProfileCard';
import styles from './MemoryMatch.module.css';
import { Howl } from 'howler';
import { FaCoins, FaUser, FaSignInAlt, FaCog, FaPlay, FaList, FaClock, FaExchangeAlt, FaStar, FaTachometerAlt } from 'react-icons/fa';
import { MdLeaderboard, MdStars } from 'react-icons/md';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { SOUND_URLS, HOW_TO_PLAY_VIDEO } from '../gameAssets';


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
const ik_onkar = '/images/games/ik-onkar.jpg';
const khanda = '/images/games/khanda.jpg';
const kirpan = '/images/games/kirpan.jpg';

const useProductionImagePath = () => {
  
  return (imagePath) => {
    // Only modify in production
    if (process.env.NODE_ENV === 'production') {
      // Handle both imported images and public folder images
      if (typeof imagePath === 'string') {
        // For public folder images
        return (imagePath.startsWith('/') || /^(https?:|blob:|data:)/i.test(imagePath)) 
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

const GAME_KEY = 'memory_match';

// Initialize sound effects
const sounds = {
  found: new Howl({ src: [SOUND_URLS.found] }),
  achievement: new Howl({ src: [SOUND_URLS.levelUp] }),
  complete: new Howl({ src: [SOUND_URLS.complete] }),
  error: new Howl({ src: [SOUND_URLS.error], volume: 0.6 }),
};

// The Sound switch is remembered on this device
const SOUND_PREF_KEY = 'virsaa:memory-match:sound';
const readSoundPref = () => {
  try {
    return localStorage.getItem(SOUND_PREF_KEY) !== 'off';
  } catch {
    return true;
  }
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

// Top scorers this month from the server
const fetchTopScorers = async (apiString) => {
  const data = await learningApi.leaderboard(apiString, { game_key: GAME_KEY, period: 'month', limit: 5 });
  return (data.results || []).map((row) => ({
    id: row.user_id,
    name: row.name,
    score: row.score,
    avatar: row.avatar || userDefault,
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

// The player's Memory Match record from the server
const fetchUserGameStats = async (apiString, token) => {
  const { stats } = await learningApi.summary(apiString, token);
  const game = stats.per_game?.[GAME_KEY] || {};
  return {
    totalMatches: game.played || 0,
    wins: game.won || 0,
    losses: (game.played || 0) - (game.won || 0),
    totalCoinsWon: stats.coins_earned_total || 0,
    totalCoinsSpent: stats.coins_spent_total || 0,
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

const MemoryMatch = ({ apiString }) => {
  const getImagePath = useProductionImagePath();

  const { isLoggedIn, accessToken, userData: authUser, logout } = useAuth();
  // Coins, XP and the game name/avatar: saved on the server when signed in, in the browser for guests
  const wallet = useGameWallet({ apiString, accessToken, isLoggedIn, gameKey: GAME_KEY });
  const defaultName = [authUser?.first_name, authUser?.last_name].filter(Boolean).join(' ') || authUser?.username || 'Player';
  const userData = useMemo(() => (authUser ? {
    ...authUser,
    coins: wallet.coins,
    xp: wallet.xp,
    name: wallet.name || defaultName,
    avatar: wallet.avatar || authUser.profile_photo || '',
  } : null), [authUser, wallet.coins, wallet.xp, wallet.name, wallet.avatar, defaultName]);
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
  const coins = wallet.coins;
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [playAsGuest, setPlayAsGuest] = useState(false);
  const [topScorers, setTopScorers] = useState([]);
  const [loadingTopScorers, setLoadingTopScorers] = useState(true);
  const [userAchievements, setUserAchievements] = useState([]);
  const [loadingAchievements, setLoadingAchievements] = useState(true);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [userStats, setUserStats] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [newName, setNewName] = useState(userData?.name || '');
  const [newAvatar, setNewAvatar] = useState(userData?.avatar || userDefault);
  const [newAvatarFile, setNewAvatarFile] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [lastResult, setLastResult] = useState(null);   // server reply: XP, badges, best score
  const [refreshKey, setRefreshKey] = useState(0);
  const scoreRef = useRef(0);
  const matchedRef = useRef(0);
  const timeLeftRef = useRef(0);
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
  // Sound effects on/off. The ref lets callbacks read the latest value.
  const [soundEnabled, setSoundEnabled] = useState(readSoundPref);
  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
    try {
      localStorage.setItem(SOUND_PREF_KEY, soundEnabled ? 'on' : 'off');
    } catch {
      /* storage blocked: the switch still works for this visit */
    }
    if (!soundEnabled) Object.values(sounds).forEach((s) => s.stop());
  }, [soundEnabled]);
  const playSound = useCallback((name) => {
    if (soundEnabledRef.current && sounds[name]) sounds[name].play();
  }, []);

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
  // Escape closes the settings panel
  useEffect(() => {
    if (!showSettings) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setShowSettings(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showSettings]);

  // Tell the player if their coins couldn't be loaded
  useEffect(() => {
    if (wallet.error) toast.error(wallet.error, { toastId: 'wallet-error' });
  }, [wallet.error]);

  // Latest values for the timers, which run outside React's render cycle
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { matchedRef.current = matchedPairs.length; }, [matchedPairs]);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);

  const { submitResult } = wallet;
  const handleGameEnd = useCallback((completed, finalScore = scoreRef.current) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    const remaining = completed ? timeLeftRef.current : 0;
    const earned = completed ? 100 + Math.floor(remaining / 5) : 10; // Fewer coins for loss
    setCoinsEarned(earned);
    setGameResult(completed ? 'win' : 'lose');
    setLastResult(null);

    if (completed) {
      setChapter(prev => prev + 1);
      playSound('complete');
    }

    if (isLoggedIn || playAsGuest) {
      const timed = selectedMode.id !== 'zen';
      submitResult({
        score: finalScore,
        completed,
        time_taken_seconds: timed ? Math.max(1, selectedDifficulty.timeLimit - remaining) : null,
        coins_earned: earned,
        xp_earned: completed ? 50 : 10,
        level: `${selectedMode.id} / ${selectedDifficulty.id} / ${selectedCardSet}`.slice(0, 50),
        details: {
          mode: selectedMode.id,
          difficulty: selectedDifficulty.id,
          card_set: selectedCardSet,
          pairs_matched: completed ? selectedDifficulty.cardCount / 2 : matchedRef.current,
          pairs_total: selectedDifficulty.cardCount / 2,
        },
      }).then((data) => {
        if (!data) return;
        setLastResult(data);
        setCoinsEarned(data.coins_earned);
        setRefreshKey((k) => k + 1); // reload stats, achievements and top scorers
      });
    }

    setShowGameEndModal(true);
    setGameState('select');
    setShowMemorizeScreen(false);
    setCountdown(null);
  }, [isLoggedIn, playAsGuest, submitResult, selectedMode.id, selectedDifficulty, selectedCardSet, playSound]);

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
  }, [isLoggedIn, accessToken, apiString, refreshKey]);

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
        const points = selectedMode.id === 'timeAttack' ? 100 : 50;
        setScore(prev => prev + points);
        playSound('found');
        if (matchedPairs.length + 1 === selectedDifficulty.cardCount / 2) {
          handleGameEnd(true, score + points);
        }
      } else {
        playSound('error');
        setTimeout(() => {
          setCards(prev => prev.map(c => (c.isFlipped && !c.isMatched ? { ...c, isFlipped: false } : c)));
        }, 1000);
      }
      setFlippedCards([]);
    }
  };

  // Handle profile update
  const handleProfileUpdate = async () => {
    if (isLoggedIn) {
      setSavingProfile(true);
      const ok = await wallet.saveProfile({ name: newName.trim(), avatarFile: newAvatarFile, avatarPreview: newAvatar });
      setSavingProfile(false);
      if (!ok) {
        toast.error('Your game profile couldn’t be saved. Try again.');
        return;
      }
      setNewAvatarFile(null);
      setEditingProfile(false);
    }
  };

  // Handle avatar change
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (event) => setNewAvatar(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Handle buy coins
  // Buying coins: go to checkout, then come back to this game afterwards
  const handleBuyCoins = (amount) => {
    setShowCoinShop(false);
    if (isLoggedIn) {
      navigate(`/checkout?product=coins_${amount}&return=/learning/games/memory-match`);
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
              <span>Level {wallet.level}</span>
              <div className={styles.progressBar}>
                <div style={{ width: `${(wallet.xpIntoLevel / (wallet.xpPerLevel || 500)) * 100}%` }}></div>
              </div>
            </div>
            <button onClick={() => setShowSettings(true)} className={styles.settingsButton} aria-label="Settings">
              <FaCog />
            </button>
            {showProfileDropdown && (
              <GameProfileCard
                ref={profileDropdownRef}
                idPrefix="mm"
                language={language}
                name={userData.name || 'Virsaa Player'}
                avatar={getImagePath(userData.avatar || userDefault)}
                coins={coins}
                level={wallet.level}
                xpIntoLevel={wallet.xpIntoLevel}
                xpPerLevel={wallet.xpPerLevel}
                stats={userStats && {
                  played: userStats.totalMatches,
                  wins: userStats.wins,
                  losses: userStats.losses,
                  earned: userStats.totalCoinsWon,
                  spent: userStats.totalCoinsSpent,
                }}
                editing={editingProfile}
                saving={savingProfile}
                newName={newName}
                newAvatar={getImagePath(newAvatar)}
                onNameChange={setNewName}
                onAvatarChange={handleAvatarChange}
                onStartEdit={() => {
                  setNewName(userData.name || '');
                  setNewAvatar(userData.avatar || userDefault);
                  setEditingProfile(true);
                }}
                onSave={handleProfileUpdate}
                onCancelEdit={() => setEditingProfile(false)}
                onBuyCoins={() => { setShowProfileDropdown(false); setShowCoinShop(true); }}
                onLogout={logout}
                onClose={() => setShowProfileDropdown(false)}
              />
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
      <>
      <div
        className={`${styles.settingsBackdrop} ${showSettings ? styles.settingsBackdropVisible : ''}`}
        onClick={() => setShowSettings(false)}
        aria-hidden="true"
      />
      <aside
        className={`${styles.settingsSidebar} ${showSettings ? styles.settingsOpen : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        aria-hidden={!showSettings}
      >
        <div className={styles.sidebarHeader}>
          <h2>{language === 'punjabi' ? 'ਸੈਟਿੰਗਾਂ' : 'Settings'}</h2>
          <button onClick={() => setShowSettings(false)} className={styles.closeButton} aria-label="Close">×</button>
        </div>
        <div className={styles.settingsContent}>
          <label>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={() => setSoundEnabled((on) => !on)}
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
      </aside>
      </>
    );
  };
  // Render coin shop modal
  const renderCoinShopModal = () => (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2>{language === 'punjabi' ? 'ਸਿੱਕੇ ਦੀ ਦੁਕਾਨ' : 'Coin Shop'}</h2>
        <div className={styles.shopOptions}>
          <button onClick={() => handleBuyCoins(100)}>100 + 10 bonus coins · $1.99 CAD</button>
          <button onClick={() => handleBuyCoins(250)}>250 + 30 bonus coins · $3.99 CAD</button>
          <button onClick={() => handleBuyCoins(500)}>500 + 75 bonus coins · $6.99 CAD</button>
          <button onClick={() => handleBuyCoins(1000)}>1,000 + 200 bonus coins · $12.99 CAD</button>
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
        <video controls src={HOW_TO_PLAY_VIDEO} className={styles.video} loading="lazy"></video>
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
          {lastResult && (
            <p>
              +{lastResult.xp_earned} XP
              {lastResult.is_new_best && lastResult.score > 0 ? (language === 'punjabi' ? ' · ਨਵਾਂ ਰਿਕਾਰਡ!' : ' · New personal best!') : ''}
            </p>
          )}
          {(lastResult?.new_badges || []).map((b) => (
            <p key={b.key}>
              <BadgeIcon name={b.icon} image={b.image} /> {language === 'punjabi' ? 'ਨਵਾਂ ਬੈਜ: ' : 'Badge earned: '}{b.name}
            </p>
          ))}
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
    <div className={`${styles.container} notranslate`} translate="no">
      {renderNavbar()}
      {renderSettingsSidebar()}
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