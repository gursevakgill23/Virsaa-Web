import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import styles from './WordSearch.module.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaCoins, FaTrophy, FaShareAlt, FaArrowRight, FaLanguage, FaPause, FaPlay, FaSync, FaUser, FaUserAltSlash, FaCog, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import { GiLaurelCrown, GiStairsGoal } from 'react-icons/gi';
import { IoMdArrowRoundBack, IoMdClose } from 'react-icons/io';
import games from '../../../../images/Learning/games.jpg';
import wordData from './wordData.json';

// Sound files
import backgroundSound from './sounds/background.mp3';
import foundSound from './sounds/found.mp3';
import levelUpSound from './sounds/level-up.mp3';

const WordSearch = () => {
  const { isLoggedIn, userData, login, logout } = useAuth();
  const [isGuest, setIsGuest] = useState(false);
  
  // Game states
  const [currentScreen, setCurrentScreen] = useState('levelSelect');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState(1);
  const [difficulty, setDifficulty] = useState('easy');
  const [language, setLanguage] = useState('english');
  const [gameStarted, setGameStarted] = useState(false);
  const [gamePaused, setGamePaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  
  // Settings states
  const [showSettings, setShowSettings] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [rememberDifficulty, setRememberDifficulty] = useState(false);
  
  // Game data
  const [board, setBoard] = useState([]);
  const [words, setWords] = useState([]);
  const [foundWords, setFoundWords] = useState([]);
  const [selectedCells, setSelectedCells] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);
  
  // User data
  const [coins, setCoins] = useState(0);
  const [score, setScore] = useState(0);
  const [scores, setScores] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [hintsUsed, setHintsUsed] = useState(0);

  // Time
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);
  
  // Audio refs
  const backgroundAudioRef = useRef(null);
  const foundAudioRef = useRef(null);
  const levelUpAudioRef = useRef(null);

  // Mock data for guests and initial state
  const mockScores = useMemo(() => [
    { 
      name: "PunjabiPro", 
      score: 450, 
      level: 10, 
      difficulty: "hard", 
      date: new Date(Date.now() - 86400000).toISOString(), 
      completed: true, 
      timeUsed: 120, 
      wordsFound: 15, 
      totalWords: 15 
    },
    { 
      name: "SikhHistoryBuff", 
      score: 380, 
      level: 8, 
      difficulty: "medium", 
      date: new Date(Date.now() - 172800000).toISOString(), 
      completed: true, 
      timeUsed: 180, 
      wordsFound: 12, 
      totalWords: 12 
    },
    { 
      name: "GurmukhiGuru", 
      score: 320, 
      level: 5, 
      difficulty: "easy", 
      date: new Date(Date.now() - 259200000).toISOString(), 
      completed: true, 
      timeUsed: 240, 
      wordsFound: 10, 
      totalWords: 10 
    }
  ], []);

  const mockAchievements = useMemo(() => [
    { 
      id: "level-5", 
      title: "Level 5 Completed", 
      description: "Completed level 5", 
      icon: <GiStairsGoal />, 
      coins: 5 
    },
    { 
      id: "perfect-3", 
      title: "Perfect Score!", 
      description: "Found all words in level 3", 
      icon: <GiLaurelCrown />, 
      coins: 6 
    },
    { 
      id: "speed-2", 
      title: "Speed Runner", 
      description: "Completed level 2 quickly", 
      icon: <FaTrophy />, 
      coins: 2 
    }
  ], []);

  // Initialize audio elements
  useEffect(() => {
    backgroundAudioRef.current = new Audio(backgroundSound);
    foundAudioRef.current = new Audio(foundSound);
    levelUpAudioRef.current = new Audio(levelUpSound);

    return () => {
      backgroundAudioRef.current?.pause();
      foundAudioRef.current?.pause();
      levelUpAudioRef.current?.pause();
    };
  }, []);

  // Update audio volume when volume changes
  useEffect(() => {
    if (backgroundAudioRef.current) {
      backgroundAudioRef.current.volume = soundOn ? volume : 0;
    }
    if (foundAudioRef.current) {
      foundAudioRef.current.volume = soundOn ? volume : 0;
    }
    if (levelUpAudioRef.current) {
      levelUpAudioRef.current.volume = soundOn ? volume : 0;
    }
  }, [volume, soundOn]);

  useEffect(() => {
    if (isLoggedIn && !isGuest) {
      const savedScores = JSON.parse(localStorage.getItem('wordSearchScores')) || mockScores;
      const savedCoins = parseInt(localStorage.getItem('userCoins')) || 0;
      const savedLevel = parseInt(localStorage.getItem('maxUnlockedLevel')) || 1;
      const savedAchievements = JSON.parse(localStorage.getItem('achievements')) || mockAchievements;
      const savedSettings = JSON.parse(localStorage.getItem('wordSearchSettings')) || {};
  
      setScores(savedScores);
      setCoins(savedCoins);
      setMaxUnlockedLevel(savedLevel);
      setAchievements(savedAchievements);
      setSoundOn(savedSettings.soundOn !== undefined ? savedSettings.soundOn : true);
      setVolume(savedSettings.volume !== undefined ? savedSettings.volume : 0.5);
      setRememberDifficulty(savedSettings.rememberDifficulty || false);
      if (savedSettings.difficulty) setDifficulty(savedSettings.difficulty);
    } else if (isGuest) {
      setMaxUnlockedLevel(1);
      setCoins(0);
      setScores(mockScores);
      setAchievements(mockAchievements);
    }
  }, [isLoggedIn, isGuest, userData, mockScores, mockAchievements]);

  // Handle audio when game starts/pauses
  useEffect(() => {
    const bgAudio = backgroundAudioRef.current;
    if (!bgAudio) return;

    if (gameStarted && !gamePaused) {
      bgAudio.loop = true;
      bgAudio.play().catch(e => console.log("Audio play error:", e));
    } else {
      bgAudio.pause();
    }
  }, [gameStarted, gamePaused]);

  // Board generation functions
  const getWordsForGame = () => {
    const levelRange = currentLevel <= 10 ? '1-10' : '11-20';
    const levelWords = wordData.levels[levelRange][difficulty];
    const wordCount = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 12 : 15;
    const shuffled = [...levelWords].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, wordCount);
  };

  const calculateBoardSize = (words) => {
    const longestWord = Math.max(...words.map(w => 
      language === 'punjabi' ? w.punjabi.length : w.word.length
    ));
    return Math.max(
      difficulty === 'easy' ? 12 : difficulty === 'medium' ? 15 : 18,
      longestWord + 5
    );
  };

  const getRandomPunjabiCharacter = () => {
    const start = 0x0A00;
    const end = 0x0A7F;
    const randomCode = start + Math.floor(Math.random() * (end - start + 1));
    return String.fromCodePoint(randomCode);
  };

  const canPlaceWord = (word, row, col, direction, size, board) => {
    const directionVectors = [
      { dr: 0, dc: 1 }, { dr: 0, dc: -1 }, { dr: 1, dc: 0 }, { dr: -1, dc: 0 },
      { dr: 1, dc: 1 }, { dr: 1, dc: -1 }, { dr: -1, dc: 1 }, { dr: -1, dc: -1 }
    ];
    const { dr, dc } = directionVectors[direction];

    for (let i = 0; i < word.length; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      
      if (r < 0 || r >= size || c < 0 || c >= size || 
          (board[r][c] !== '' && board[r][c] !== word[i])) {
        return false;
      }
    }
    return true;
  };

  const placeWord = (word, row, col, direction, board) => {
    const directionVectors = [
      { dr: 0, dc: 1 }, { dr: 0, dc: -1 }, { dr: 1, dc: 0 }, { dr: -1, dc: 0 },
      { dr: 1, dc: 1 }, { dr: 1, dc: -1 }, { dr: -1, dc: 1 }, { dr: -1, dc: -1 }
    ];
    const { dr, dc } = directionVectors[direction];

    for (let i = 0; i < word.length; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      board[r][c] = word[i];
    }
  };

  const generateBoard = () => {
    const selectedWords = getWordsForGame();
    setWords(selectedWords);
    setFoundWords([]);
    
    const size = calculateBoardSize(selectedWords);
    const newBoard = Array(size).fill().map(() => Array(size).fill(''));
    
    let allWordsPlaced = false;
    let attempts = 0;
    const maxAttempts = 1000;
    
    while (!allWordsPlaced && attempts < maxAttempts) {
      allWordsPlaced = true;
      newBoard.forEach(row => row.fill('')); // Reset board
      
      for (const wordObj of selectedWords) {
        const word = language === 'punjabi' ? wordObj.punjabi : wordObj.word.toLowerCase();
        let placed = false;
        let wordAttempts = 0;
        
        while (!placed && wordAttempts < 100) {
          const direction = Math.floor(Math.random() * 8);
          const row = Math.floor(Math.random() * size);
          const col = Math.floor(Math.random() * size);
          
          if (canPlaceWord(word, row, col, direction, size, newBoard)) {
            placeWord(word, row, col, direction, newBoard);
            placed = true;
          }
          wordAttempts++;
        }
        
        if (!placed) {
          allWordsPlaced = false;
          break;
        }
      }
      
      attempts++;
    }
    
    if (!allWordsPlaced) {
      toast.error("Couldn't place all words - trying again");
      return generateBoard(); // Recursively retry
    }
    
    // Fill remaining cells
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (newBoard[i][j] === '') {
          newBoard[i][j] = language === 'punjabi' 
            ? getRandomPunjabiCharacter()
            : String.fromCharCode(97 + Math.floor(Math.random() * 26));
        }
      }
    }
    
    setBoard(newBoard);
    setTimeLeft(difficultyTimes[difficulty]);
  };

  // Game control functions
  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          endGame(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startGame = () => {
    if (!isLoggedIn && !isGuest) {
      toast.error('Please login or play as guest to start the game');
      return;
    }
    generateBoard();
    setGameStarted(true);
    setGameOver(false);
    setGamePaused(false);
    startTimer();
  };

  const endGame = (completed) => {
    clearInterval(timerRef.current);
    setGameOver(true);
    setGameStarted(false);
    
    const timeUsed = difficultyTimes[difficulty] - timeLeft;
    const newScore = calculateScore(completed, timeUsed);
    setScore(newScore);
    
    const coinsEarned = completed ? currentLevel : -Math.floor(currentLevel / 2);
    const newCoins = Math.max(0, coins + coinsEarned);
    setCoins(newCoins);
    
    if (!isGuest && isLoggedIn) {
      localStorage.setItem('userCoins', newCoins.toString());
      
      if (completed && currentLevel === maxUnlockedLevel) {
        const newLevel = Math.min(maxUnlockedLevel + 1, 50);
        setMaxUnlockedLevel(newLevel);
        localStorage.setItem('maxUnlockedLevel', newLevel.toString());
        levelUpAudioRef.current?.play().catch(e => console.log("Level up sound error:", e));
      }
      
      const newScoreEntry = createScoreEntry(completed, timeUsed, newScore);
      updateScores(newScoreEntry);

      // Save settings for logged-in users
      const settings = {
        soundOn,
        volume,
        rememberDifficulty,
        difficulty: rememberDifficulty ? difficulty : null
      };
      localStorage.setItem('wordSearchSettings', JSON.stringify(settings));
    }
    
    checkAchievements(completed, timeUsed);
    
    if (completed) {
      setShowAchievementModal(true);
    } else {
      toast.error(`Time's up! You found ${foundWords.length}/${words.length} words`);
    }
  };

  const calculateScore = (completed, timeUsed) => {
    const baseScore = currentLevel * (difficulty === 'easy' ? 10 : difficulty === 'medium' ? 15 : 20);
    const timeBonus = Math.max(0, difficultyTimes[difficulty] - timeUsed) * 2;
    const completionBonus = completed ? 100 : 0;
    const foundWordsBonus = foundWords.length * 5;
    return baseScore + timeBonus + completionBonus + foundWordsBonus;
  };

  const createScoreEntry = (completed, timeUsed, score) => ({
    name: isGuest ? 'Guest' : userData?.name || 'Player',
    score,
    level: currentLevel,
    difficulty,
    date: new Date().toISOString(),
    completed,
    timeUsed,
    wordsFound: foundWords.length,
    totalWords: words.length
  });

  const updateScores = (newScoreEntry) => {
    const updatedScores = [...scores, newScoreEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    setScores(updatedScores);
    if (!isGuest && isLoggedIn) {
      localStorage.setItem('wordSearchScores', JSON.stringify(updatedScores));
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Word selection functions
  const handleCellMouseDown = (row, col) => {
    if (gameOver || !gameStarted || gamePaused) return;
    setIsSelecting(true);
    setSelectedCells([[row, col]]);
  };

  const handleCellMouseEnter = (row, col) => {
    if (!isSelecting || gameOver || !gameStarted || gamePaused) return;
    const firstCell = selectedCells[0];
    const newSelectedCells = getCellsBetween(firstCell[0], firstCell[1], row, col);
    setSelectedCells(newSelectedCells);
  };

  const handleCellMouseUp = () => {
    if (!isSelecting || gameOver || !gameStarted || gamePaused) return;
    setIsSelecting(false);
    checkSelectedWord();
    setSelectedCells([]);
  };

  const getCellsBetween = (row1, col1, row2, col2) => {
    const cells = [];
    const rowStep = row1 === row2 ? 0 : (row2 > row1 ? 1 : -1);
    const colStep = col1 === col2 ? 0 : (col2 > col1 ? 1 : -1);
    
    let row = row1;
    let col = col1;
    
    while (true) {
      cells.push([row, col]);
      if (row === row2 && col === col2) break;
      row += rowStep;
      col += colStep;
    }
    
    return cells;
  };

  const checkSelectedWord = () => {
    try {
      if (selectedCells.length < 3) return;
      
      const selectedWord = selectedCells.map(([r, c]) => {
        const cell = board[r][c];
        return typeof cell === 'object' ? cell.char : cell;
      }).join('');
      
      const reversedWord = selectedWord.split('').reverse().join('');
      
      for (const wordObj of words) {
        const targetWord = language === 'punjabi' ? wordObj.punjabi : wordObj.word.toLowerCase();
        
        if (!foundWords.includes(wordObj.word) && 
            (selectedWord === targetWord || reversedWord === targetWord)) {
          const newFoundWords = [...foundWords, wordObj.word];
          setFoundWords(newFoundWords);
          foundAudioRef.current?.play().catch(e => console.log("Found word sound error:", e));
          toast.success(`Found: ${wordObj.word} (${wordObj.punjabi})`);
          highlightFoundWord(selectedCells);
          
          if (newFoundWords.length === words.length) {
            endGame(true);
          }
          return;
        }
      }
    } catch (error) {
      console.error('Error in word selection:', error);
      toast.error('Aww Snap! Something went wrong with word selection');
    }
  };

  const highlightFoundWord = (cells) => {
    const newBoard = [...board];
    cells.forEach(([row, col]) => {
      newBoard[row][col] = {
        char: newBoard[row][col],
        found: true,
        justFound: true
      };
    });
    setBoard(newBoard);
    
    setTimeout(() => {
      setBoard(prev => prev.map(row => 
        row.map(cell => typeof cell === 'object' ? {...cell, justFound: false} : cell)
      ));
    }, 500);
  };

  // Game management functions
  const togglePause = () => {
    if (gameOver) return;
    if (gamePaused) {
      setGamePaused(false);
      startTimer();
    } else {
      setGamePaused(true);
      clearInterval(timerRef.current);
    }
  };

  const changeDifficulty = (newDifficulty) => {
    if (gameStarted && !gameOver) {
      if (window.confirm('Changing difficulty will restart the current level. Continue?')) {
        setDifficulty(newDifficulty);
        resetGame();
      }
    } else {
      setDifficulty(newDifficulty);
    }
  };

  const resetGame = () => {
    clearInterval(timerRef.current);
    setGameStarted(false);
    setGameOver(false);
    setGamePaused(false);
    setFoundWords([]);
    setSelectedCells([]);
    backgroundAudioRef.current?.pause();
  };

  const backToLevels = () => {
    resetGame();
    setCurrentScreen('levelSelect');
  };

  const selectLevel = (level) => {
    if (level > maxUnlockedLevel) {
      toast.info(`Complete level ${maxUnlockedLevel} first to unlock this level`);
      return;
    }
    setCurrentLevel(level);
    if (rememberDifficulty && isLoggedIn && !isGuest) {
      setCurrentScreen('game');
      setTimeout(() => {
        startGame();
      }, 300);
    } else {
      setCurrentScreen('difficultySelect');
    }
  };

  const startWithDifficulty = () => {
    setCurrentScreen('game');
    setTimeout(() => {
      startGame();
    }, 300);
  };

  const shareScore = () => {
    if (navigator.share) {
      navigator.share({
        title: `I scored ${score} on Virsaa Word Search!`,
        text: `Can you beat my score in Level ${currentLevel} (${difficulty})?`,
        url: 'https://virsaa.com/word-search'
      }).catch(err => {
        console.log('Error sharing:', err);
        copyToClipboard();
      });
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    const text = `I scored ${score} on Virsaa Word Search (Level ${currentLevel}, ${difficulty})! Can you beat me? https://virsaa.com/word-search`;
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Score copied to clipboard!');
    });
  };

  const checkAchievements = (completed, timeUsed) => {
    const newAchievements = [];
    
    if (completed && !achievements.some(a => a.id === `level-${currentLevel}`)) {
      newAchievements.push({
        id: `level-${currentLevel}`,
        title: `Level ${currentLevel} Completed`,
        description: `You've successfully completed level ${currentLevel}`,
        icon: <GiStairsGoal />,
        coins: currentLevel
      });
    }
    
    if (foundWords.length === words.length && !achievements.some(a => a.id === `perfect-${currentLevel}`)) {
      newAchievements.push({
        id: `perfect-${currentLevel}`,
        title: `Perfect Score!`,
        description: `Found all words in level ${currentLevel}`,
        icon: <GiLaurelCrown />,
        coins: currentLevel * 2
      });
    }
    
    if (timeUsed < difficultyTimes[difficulty] / 2 && !achievements.some(a => a.id === `speed-${currentLevel}`)) {
      newAchievements.push({
        id: `speed-${currentLevel}`,
        title: `Speed Runner`,
        description: `Completed level ${currentLevel} in half the time`,
        icon: <FaTrophy />,
        coins: currentLevel
      });
    }
    
    if (newAchievements.length > 0) {
      const updatedAchievements = [...achievements, ...newAchievements];
      setAchievements(updatedAchievements);
      
      if (!isGuest && isLoggedIn) {
        localStorage.setItem('achievements', JSON.stringify(updatedAchievements));
      }
      
      const achievementCoins = newAchievements.reduce((sum, a) => sum + a.coins, 0);
      const totalCoins = coins + achievementCoins + (completed ? currentLevel : 0);
      setCoins(totalCoins);
      
      if (!isGuest && isLoggedIn) {
        localStorage.setItem('userCoins', totalCoins.toString());
      }
      
      newAchievements.forEach(achievement => {
        toast.success(`Achievement Unlocked: ${achievement.title} (+${achievement.coins} coins)`);
      });
    }
  };

  const refreshScores = () => {
    if (isGuest) {
      toast.info('Guest scores are not saved');
      return;
    }
    const savedScores = JSON.parse(localStorage.getItem('wordSearchScores')) || mockScores;
    setScores(savedScores);
    toast.info('Scores refreshed');
  };

  const showHint = () => {
    if (coins < 5 || hintsUsed >= 3 || !gameStarted || gameOver) return;
    
    const unfoundWords = words.filter(w => !foundWords.includes(w.word));
    if (unfoundWords.length === 0) return;
    
    const randomWord = unfoundWords[Math.floor(Math.random() * unfoundWords.length)];
    const word = language === 'punjabi' ? randomWord.punjabi : randomWord.word.toLowerCase();
    
    // Find word positions on board
    const positions = [];
    board.forEach((row, r) => {
      row.forEach((cell, c) => {
        const cellChar = typeof cell === 'object' ? cell.char : cell;
        if (cellChar === word[0]) {
          // Check all directions for the word
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              let match = true;
              for (let i = 0; i < word.length; i++) {
                const newR = r + dr * i;
                const newC = c + dc * i;
                if (newR < 0 || newR >= board.length || newC < 0 || newC >= board[0].length) {
                  match = false;
                  break;
                }
                const targetCell = board[newR][newC];
                const targetChar = typeof targetCell === 'object' ? targetCell.char : targetCell;
                if (targetChar !== word[i]) {
                  match = false;
                  break;
                }
              }
              if (match) {
                for (let i = 0; i < word.length; i++) {
                  positions.push([r + dr * i, c + dc * i]);
                }
                return;
              }
            }
          }
        }
      });
    });
    
    if (positions.length === 0) return;
    
    // Highlight the word
    const newBoard = [...board];
    positions.forEach(([r, c]) => {
      newBoard[r][c] = {
        char: newBoard[r][c],
        hint: true
      };
    });
    
    setBoard(newBoard);
    setHintsUsed(hintsUsed + 1);
    setCoins(coins - 5);
    
    setTimeout(() => {
      setBoard(prev => prev.map(row => 
        row.map(cell => typeof cell === 'object' ? {...cell, hint: false} : cell)
      ));
    }, 2000);
  };

  const playAsGuest = () => {
    setIsGuest(true);
    setCurrentScreen('levelSelect');
    toast.info('Playing as guest - progress will not be saved');
  };

  const handleLogin = () => {
    const username = prompt('Enter your username:');
    if (username) {
      login('dummy_token', { name: username, id: Date.now() }, false);
      toast.success(`Welcome back, ${username}!`);
    }
  };

  // Difficulty times (in seconds)
  const difficultyTimes = {
    easy: 300,
    medium: 420,
    hard: 600
  };

  // Similar Games data
  const similarGames = [
    {
      id: 1,
      title: 'Punjabi Crossword',
      image: games,
      description: 'Solve crosswords in Punjabi language with increasing difficulty'
    },
    {
      id: 2,
      title: 'Gurmukhi Match',
      image: games,
      description: 'Match Gurmukhi characters with their English equivalents'
    },
    {
      id: 3,
      title: 'Sikh History Quiz',
      image: games,
      description: 'Test your knowledge of Sikh history and gurus'
    },
    {
      id: 4,
      title: 'Shabad Puzzle',
      image: games,
      description: 'Reconstruct Shabads from mixed up lines'
    },
    {
      id: 5,
      title: 'Punjabi Vocabulary',
      image: games,
      description: 'Build your Punjabi vocabulary with fun challenges'
    },
    {
      id: 6,
      title: 'Gurbani Explorer',
      image: games,
      description: 'Learn meanings of Gurbani words through interactive play'
    }
  ];

  // Render functions
  const renderSettingsSidebar = () => (
    <div className={`${styles.settingsSidebar} ${showSettings ? styles.show : ''}`}>
      <div className={styles.settingsHeader}>
        <h3>Game Settings</h3>
        <button 
          className={styles.closeButton}
          onClick={() => setShowSettings(false)}
        >
          <IoMdClose />
        </button>
      </div>
      
      <div className={styles.settingsSection}>
        <h4>Sound</h4>
        <div className={styles.soundControl}>
          <button 
            className={styles.soundToggle}
            onClick={() => setSoundOn(!soundOn)}
          >
            {soundOn ? <FaVolumeUp /> : <FaVolumeMute />}
            {soundOn ? ' On' : ' Off'}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            disabled={!soundOn}
            className={styles.volumeSlider}
          />
        </div>
      </div>
      
      {isLoggedIn && !isGuest && (
        <div className={styles.settingsSection}>
          <h4>Difficulty</h4>
          <div className={styles.difficultySetting}>
            <label className={styles.settingOption}>
              <input
                type="checkbox"
                checked={rememberDifficulty}
                onChange={() => setRememberDifficulty(!rememberDifficulty)}
              />
              <span>Remember my difficulty choice</span>
            </label>
            {rememberDifficulty && (
              <div className={styles.difficultyOptions}>
                <button
                  className={difficulty === 'easy' ? styles.active : ''}
                  onClick={() => setDifficulty('easy')}
                >
                  Easy
                </button>
                <button
                  className={difficulty === 'medium' ? styles.active : ''}
                  onClick={() => setDifficulty('medium')}
                >
                  Medium
                </button>
                <button
                  className={difficulty === 'hard' ? styles.active : ''}
                  onClick={() => setDifficulty('hard')}
                >
                  Hard
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {(!isLoggedIn || isGuest) && (
        <div className={styles.loginPrompt}>
          <p>Login to save your settings and progress!</p>
          <button 
            className={styles.loginButton}
            onClick={handleLogin}
          >
            <FaUser /> Login
          </button>
        </div>
      )}
    </div>
  );

  const renderLevelSelectScreen = () => (
    <div className={styles.levelSelectScreen}>
      <div className={styles.levelBackground}>
        <div className={styles.bgParticles}></div>
        <div className={styles.bgParticles2}></div>
      </div>
      
      <button 
        className={styles.settingsButton}
        onClick={() => setShowSettings(true)}
      >
        <FaCog />
      </button>
      
      {renderSettingsSidebar()}
      
      <div className={styles.levelContainer}>
        <h1>Select Level</h1>
        <div className={styles.levelLadder}>
          {Array.from({ length: 50 }, (_, i) => i + 1).map(level => (
            <div 
              key={level}
              className={`${styles.levelRung} ${level <= maxUnlockedLevel ? styles.unlocked : styles.locked}`}
              onClick={() => selectLevel(level)}
            >
              <div className={styles.levelContent}>
                <span>Level {level}</span>
                {level === maxUnlockedLevel && (
                  <div className={styles.currentLevelPointer}>
                    <GiStairsGoal />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {!isLoggedIn && !isGuest ? (
          <div className={styles.authOptions}>
            <h3>Choose how to play:</h3>
            <button 
              className={styles.guestButton}
              onClick={playAsGuest}
            >
              <FaUserAltSlash /> Play As Guest
            </button>
            <button 
              className={styles.loginButton}
              onClick={handleLogin}
            >
              <FaUser /> Login
            </button>
          </div>
        ) : (
          <div className={styles.userInfo}>
            <p>Playing as: <strong>{isGuest ? 'Guest' : userData?.name}</strong></p>
            {isGuest && <p className={styles.guestNote}>Guest progress won't be saved</p>}
            {isLoggedIn && (
              <button 
                className={styles.logoutButton}
                onClick={() => {
                  logout();
                  setIsGuest(false);
                }}
              >
                Logout
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderDifficultySelectScreen = () => {
    if (rememberDifficulty && isLoggedIn && !isGuest) {
      // Skip difficulty selection if user wants to remember it
      startWithDifficulty();
      return null;
    }
    
    return (
      <div className={styles.difficultySelectScreen}>
        <div className={styles.difficultyModal}>
          <h2>Level {currentLevel}</h2>
          <p>Select Difficulty</p>
          <div className={styles.difficultyOptions}>
            <button 
              className={difficulty === 'easy' ? styles.active : ''}
              onClick={() => setDifficulty('easy')}
            >
              Easy
            </button>
            <button 
              className={difficulty === 'medium' ? styles.active : ''}
              onClick={() => setDifficulty('medium')}
            >
              Medium
            </button>
            <button 
              className={difficulty === 'hard' ? styles.active : ''}
              onClick={() => setDifficulty('hard')}
            >
              Hard
            </button>
          </div>
          
          <div className={styles.languageToggle}>
            <span>Language:</span>
            <button
              className={language === 'english' ? styles.active : ''}
              onClick={() => setLanguage('english')}
            >
              <FaLanguage /> English
            </button>
            <button
              className={language === 'punjabi' ? styles.active : ''}
              onClick={() => setLanguage('punjabi')}
            >
              <FaLanguage /> Punjabi
            </button>
          </div>
          
          <button className={styles.startButton} onClick={startWithDifficulty}>
            Start Game
          </button>
          <button className={styles.backButton} onClick={() => setCurrentScreen('levelSelect')}>
            <IoMdArrowRoundBack /> Back to Levels
          </button>
        </div>
      </div>
    );
  };

  const renderGameScreen = () => (
    <>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={backToLevels}>
          <IoMdArrowRoundBack /> <span className={styles.backButtonText}>Levels</span>
        </button>
        
        <div className={styles.gameInfo}>
          <h1 className={styles.levelTitle}>Level {currentLevel}</h1>
          <div className={styles.difficultyBadge}>
            {difficulty.toUpperCase()}
          </div>
        </div>
        
        <div className={styles.gameControls}>
          <div className={styles.coinDisplay}>
            <FaCoins className={styles.coinIcon} />
            <span className={styles.coinCount}>{coins}</span>
          </div>
          <button 
            className={styles.pauseButton} 
            onClick={togglePause}
            disabled={gameOver}
          >
            {gamePaused ? <FaPlay /> : <FaPause />}
          </button>
        </div>
      </div>
      
      <div className={styles.gameArea}>
        <div className={styles.boardSection}>
          <div className={styles.languageTabs}>
            <button
              className={language === 'english' ? styles.active : ''}
              onClick={() => {
                if (gameStarted && !gameOver) {
                  if (window.confirm('Changing language will restart the game. Continue?')) {
                    setLanguage('english');
                    resetGame();
                  }
                } else {
                  setLanguage('english');
                }
              }}
            >
              <FaLanguage /> English
            </button>
            <button
              className={language === 'punjabi' ? styles.active : ''}
              onClick={() => {
                if (gameStarted && !gameOver) {
                  if (window.confirm('Changing language will restart the game. Continue?')) {
                    setLanguage('punjabi');
                    resetGame();
                  }
                } else {
                  setLanguage('punjabi');
                }
              }}
            >
              <FaLanguage /> Punjabi
            </button>
          </div>
          
          {gameStarted && (
            <div className={styles.stats}>
              <div className={styles.timeLeft}>
                Time: <span>{formatTime(timeLeft)}</span>
              </div>
              <div className={styles.wordsFound}>
                Found: <span>{foundWords.length}/{words.length}</span>
              </div>
              <button 
                className={styles.hintButton}
                onClick={showHint}
                disabled={hintsUsed >= 3 || coins < 5 || !gameStarted || gameOver}
              >
                Hint ({3 - hintsUsed} left) - 5 <FaCoins />
              </button>
            </div>
          )}
          
          <div className={styles.wordList}>
            {words.map((wordObj) => (
              <div
                key={wordObj.word}
                className={`${styles.wordItem} ${
                  foundWords.includes(wordObj.word) ? styles.foundWord : ''
                }`}
                data-tooltip={wordObj.hint}
              >
                {language === 'punjabi' ? wordObj.punjabi : wordObj.word}
                <span className={styles.wordCategory}>{wordObj.category}</span>
              </div>
            ))}
          </div>
          
          <div className={styles.boardContainer}>
            {board.length > 0 ? (
              <div className={styles.board}>
                {board.map((row, rowIndex) => (
                  <div key={rowIndex} className={styles.row}>
                    {row.map((cell, colIndex) => {
                      const cellData = typeof cell === 'object' ? cell : { char: cell, found: false };
                      const isSelected = selectedCells.some(
                        ([r, c]) => r === rowIndex && c === colIndex
                      );
                      return (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          className={`${styles.cell} ${isSelected ? styles.selectedCell : ''} ${
                            cellData.found ? styles.foundCell : ''
                          } ${cellData.hint ? styles.hintCell : ''} ${
                            cellData.justFound ? styles.justFound : ''
                          }`}
                          onMouseDown={() => handleCellMouseDown(rowIndex, colIndex)}
                          onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
                          onMouseUp={handleCellMouseUp}
                          onTouchStart={() => handleCellMouseDown(rowIndex, colIndex)}
                          onTouchMove={(e) => {
                            e.preventDefault();
                            const touch = e.touches[0];
                            const element = document.elementFromPoint(touch.clientX, touch.clientY);
                            if (element && element.dataset.row && element.dataset.col) {
                              handleCellMouseEnter(
                                parseInt(element.dataset.row),
                                parseInt(element.dataset.col)
                              );
                            }
                          }}
                          onTouchEnd={handleCellMouseUp}
                          data-row={rowIndex}
                          data-col={colIndex}
                        >
                          {cellData.char}
                          {cellData.justFound && (
                            <div className={styles.wordParticles}>
                              {[...Array(8)].map((_, i) => (
                                <div 
                                  key={i}
                                  className={styles.wordParticle}
                                  style={{
                                    '--tx': `${Math.random() * 100 - 50}px`,
                                    '--ty': `${Math.random() * 100 - 50}px`
                                  }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.placeholder}>
                {!gameStarted && !gameOver && 'Click Start Game to begin'}
                {gameOver && 'Game Over! Click Play Again to restart'}
              </div>
            )}
          </div>
          
          <div className={styles.controls}>
            {!gameStarted && (
              <button className={styles.startButton} onClick={startGame}>
                {gameOver ? 'Play Again' : 'Start Game'}
              </button>
            )}
            
            {gameStarted && (
              <button className={styles.resetButton} onClick={resetGame}>
                Reset Game
              </button>
            )}

            <div className={styles.difficultyToggle}>
              <span>Difficulty:</span>
              <button
                className={difficulty === 'easy' ? styles.active : ''}
                onClick={() => changeDifficulty('easy')}
              >
                Easy
              </button>
              <button
                className={difficulty === 'medium' ? styles.active : ''}
                onClick={() => changeDifficulty('medium')}
              >
                Medium
              </button>
              <button
                className={difficulty === 'hard' ? styles.active : ''}
                onClick={() => changeDifficulty('hard')}
              >
                Hard
              </button>
            </div>
          </div>
        </div>
        
        <div className={styles.achievementsSection}>
          <div className={styles.scoresHeader}>
            <h2><FaTrophy /> Achievements</h2>
          </div>
          
          <div className={styles.achievementsList}>
            {achievements.length > 0 ? (
              achievements.slice(0, 5).map((achievement, index) => (
                <div key={index} className={styles.achievementCard}>
                  <div className={styles.achievementIcon}>
                    {achievement.icon}
                  </div>
                  <div className={styles.achievementContent}>
                    <h3>{achievement.title}</h3>
                    <p>{achievement.description}</p>
                  </div>
                  <div className={styles.achievementReward}>
                    +{achievement.coins} <FaCoins />
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.noAchievements}>
                <p>Complete levels to earn achievements!</p>
              </div>
            )}
          </div>
          
          <div className={styles.scoresHeader}>
            <h2><GiLaurelCrown /> Top Scores</h2>
            <button 
              className={styles.refreshButton}
              onClick={refreshScores}
            >
              <FaSync /> Refresh
            </button>
          </div>
          
          <div className={styles.scoresList}>
            {scores.length > 0 ? (
              scores.slice(0, 3).map((scoreEntry, index) => (
                <div key={index} className={styles.scoreCard}>
                  <div className={styles.scoreRank}>{index + 1}</div>
                  <div className={styles.scoreDetails}>
                    <h3>{scoreEntry.name}</h3>
                    <p>Level {scoreEntry.level} • {scoreEntry.difficulty}</p>
                  </div>
                  <div className={styles.scoreValue}>{scoreEntry.score}</div>
                </div>
              ))
            ) : (
              <div className={styles.noScores}>
                <p>No scores yet. Be the first!</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className={styles.similarGamesSection}>
        <h2 className={styles.similarGamesTitle}>Similar Games</h2>
        <div className={styles.similarGamesContainer}>
          {similarGames.map(game => (
            <div key={game.id} className={styles.gameCard}>
              <div className={styles.gameImageContainer}>
                <img src={game.image} alt={game.title} className={styles.gameImage} />
              </div>
              <h3 className={styles.gameTitle}>{game.title}</h3>
              <p className={styles.gameDescription}>{game.description}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const renderAchievementModal = () => {
    const levelAchievements = achievements.filter(a => a.id.includes(`level-${currentLevel}`));
    const totalCoinsEarned = levelAchievements.reduce((sum, a) => sum + a.coins, 0) + currentLevel;
    
    return (
      <div className={styles.achievementModal}>
        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <GiLaurelCrown className={styles.crownIcon} />
            <h2>Level Complete!</h2>
          </div>
          
          <div className={styles.achievementList}>
            {levelAchievements.map((achievement, index) => (
              <div key={index} className={styles.achievementItem}>
                <div className={styles.achievementIcon}>{achievement.icon}</div>
                <div className={styles.achievementDetails}>
                  <h3>{achievement.title}</h3>
                  <p>{achievement.description}</p>
                </div>
                <div className={styles.achievementCoins}>
                  +{achievement.coins} <FaCoins />
                </div>
              </div>
            ))}
            
            <div className={styles.levelCompletion}>
              <div className={styles.levelCompletionIcon}>
                <GiStairsGoal />
              </div>
              <div className={styles.levelCompletionDetails}>
                <h3>Level {currentLevel} Completed</h3>
                <p>You've unlocked level {currentLevel + 1}</p>
              </div>
              <div className={styles.levelCompletionCoins}>
                +{currentLevel} <FaCoins />
              </div>
            </div>
          </div>
          
          <div className={styles.totalCoins}>
            <span>Total Earned:</span>
            <span className={styles.coinsAmount}>
              {totalCoinsEarned} <FaCoins />
            </span>
          </div>
          
          <div className={styles.modalActions}>
            <button 
              className={styles.shareButton}
              onClick={() => {
                shareScore();
                setShowAchievementModal(false);
              }}
            >
              <FaShareAlt /> Share
            </button>
            <button 
              className={styles.nextButton}
              onClick={() => {
                setShowAchievementModal(false);
                if (currentLevel < maxUnlockedLevel) {
                  setCurrentLevel(currentLevel + 1);
                  resetGame();
                } else {
                  backToLevels();
                }
              }}
            >
              {currentLevel < maxUnlockedLevel ? (
                <>
                  Next Level <FaArrowRight />
                </>
              ) : (
                'Back to Levels'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <ToastContainer position="top-center" autoClose={3000} />
      
      {currentScreen === 'levelSelect' && renderLevelSelectScreen()}
      {currentScreen === 'difficultySelect' && renderDifficultySelectScreen()}
      {currentScreen === 'game' && renderGameScreen()}
      {showAchievementModal && renderAchievementModal()}
    </div>
  );
};

export default WordSearch;