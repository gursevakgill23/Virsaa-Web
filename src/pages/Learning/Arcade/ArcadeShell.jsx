/**
 * pages/Learning/Arcade/ArcadeShell.jsx
 * -----------------------------------------------------------------------------
 * The frame every map game plays in:
 *   - the game bar, the same as Shabad Khoj's and Memory Match's: the game's
 *     name, then the player's picture (it opens the shared game profile card),
 *     name, coins, level and the settings button; Login and settings for guests
 *   - a settings panel from the right: sound, the coin shop, back to the map
 *     or to the Khed Mela
 *   - the map screen: a banner, the nine stages on a trail (ArcadeMap) and a
 *     side panel with how to play, badges and the leaderboard
 *   - the play screen, where the game itself runs (one of games/*.jsx)
 *   - the results card when a stage ends
 * The language is the site's (globe button in the site navbar) and the colours
 * follow the site's light / dark mode (each game's palette in Arcade.module.css).
 *
 * A game component gets: stage, content, t, language, dark, onFinish(result),
 * onQuit(), and for its own needs api, signedIn, wallet and arcade.
 * It calls onFinish({ score: 0-1000, completed, time_taken_seconds, details })
 * and the shell saves the result (useArcade) and shows the stars. Each play
 * is saved once (a second tap on Finish, or a slow connection, doesn't save
 * it again), and a result that arrives after the player has left the stage
 * isn't shown over the map.
 * -----------------------------------------------------------------------------
 */
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaArrowLeft, FaCog, FaCoins, FaLock, FaMap, FaPlay, FaSignInAlt, FaStar, FaSun, FaThLarge, FaTimes,
} from 'react-icons/fa';
import { useAuth } from '../../../context/AuthContext';
import Avatar from '../../../components/Avatar/Avatar';
import learningApi from '../../../api/learningApi';
import { useSiteImages } from '../../../hooks/useSiteImages';
import { toast } from '../../../utils/notify';
import GameProfileCard from '../Games/GameProfileCard';
import useGameWallet from '../Games/useGameWallet';
import ArcadeMap, { Stars } from './ArcadeMap';
import GameArt from './GameArt';
import Panels from './Panels';
import ResultsModal from './ResultsModal';
import styles from './Arcade.module.css';
import { TEXT, gameLanguage } from './arcadeText';
import { setSoundEnabled, sfx, soundEnabled } from './arcadeSound';
import { THEMES } from './themes';
import useArcade from './useArcade';

const COIN_PACKS = [100, 250, 500, 1000];

// Shabad-le's word of the day plays as "stage 0"
const DAILY_STAGE = {
  stage: 0, difficulty: 'medium', name: 'Word of the day', name_pa: 'ਅੱਜ ਦਾ ਸ਼ਬਦ', settings: { tiles: 4, hint: 'after:3' },
};

const fileProblem = (file) => {
  if (file && !/^image\/(jpeg|png|webp|gif)$/.test(file.type)) return 'Choose a JPG, PNG, WebP or GIF picture.';
  if (file && file.size > 5 * 1024 * 1024) return 'The picture must be smaller than 5 MB.';
  return null;
};

export default function ArcadeShell({ gameKey, Game, apiString, isDarkMode = false }) {
  const navigate = useNavigate();
  const { isLoggedIn, accessToken, userData, logout, API_STRING } = useAuth();
  const api = apiString || API_STRING;
  const pictures = useSiteImages(api);
  // Changing the site's language reloads the page, so it is read once
  const [language] = useState(gameLanguage);
  const t = TEXT[language];
  const wallet = useGameWallet({ apiString: api, accessToken, isLoggedIn, gameKey });
  const arcade = useArcade({ gameKey, apiString: api, accessToken, isLoggedIn, wallet, pictures });
  const { game, progress, unlockedUpTo } = arcade;
  const theme = THEMES[gameKey] || {};

  const [screen, setScreen] = useState('map');            // 'map' | 'play'
  const [sheet, setSheet] = useState(null);               // the stage card being looked at
  const [stage, setStage] = useState(null);               // the stage being played
  const [content, setContent] = useState(null);
  const [loadingStage, setLoadingStage] = useState(false);
  const [stageError, setStageError] = useState(null);
  const [result, setResult] = useState(null);
  const [extra, setExtra] = useState(null);               // a game's own part of the results card
  const [playKey, setPlayKey] = useState(0);
  const [sound, setSound] = useState(soundEnabled);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileStats, setProfileStats] = useState(null);
  const [shopOpen, setShopOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAvatar, setNewAvatar] = useState('');
  const [newAvatarFile, setNewAvatarFile] = useState(null);
  const profileRef = useRef(null);
  const playRef = useRef(null);
  const startedAt = useRef(0);
  const plays = useRef(0);          // numbers each play (the game's key)
  const livePlay = useRef(0);       // the play on screen (0 on the map)
  const savedPlay = useRef(0);      // the last play whose result was sent
  const stageRef = useRef(null);
  const arcadeRef = useRef(arcade);
  arcadeRef.current = arcade;

  const signedIn = arcade.signedIn;
  const playerName = wallet.name || userData?.first_name || userData?.username || t.player;
  const playerAvatar = wallet.avatar || userData?.profile_photo || '';
  // Stars on the map (stage 0, the word of the day, isn't on it)
  const totalStars = useMemo(() => Object.entries(progress)
    .filter(([n]) => Number(n) > 0).reduce((sum, [, p]) => sum + (p.stars || 0), 0), [progress]);
  const title = language === 'punjabi' ? game.title_pa : game.title;

  useEffect(() => {
    document.title = `${game.title} | Virsaa`;
  }, [game.title]);

  // Close the profile card on a click outside it
  useEffect(() => {
    if (!profileOpen) return undefined;
    const close = (e) => { if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [profileOpen]);

  // The profile card's game stats (like the other two games): this game's plays and wins
  useEffect(() => {
    if (!profileOpen || !signedIn || !accessToken) return undefined;
    let live = true;
    learningApi.summary(api, accessToken)
      .then(({ stats }) => {
        if (!live) return;
        const mine = stats?.per_game?.[gameKey] || {};
        setProfileStats({
          played: mine.played || 0,
          wins: mine.won || 0,
          losses: Math.max(0, (mine.played || 0) - (mine.won || 0)),
          earned: stats?.coins_earned_total || 0,
          spent: stats?.coins_spent_total || 0,
        });
      })
      .catch(() => { if (live) setProfileStats({ played: 0, wins: 0, losses: 0, earned: 0, spent: 0 }); });
    return () => { live = false; };
  }, [profileOpen, signedIn, accessToken, api, gameKey]);

  // Escape closes the open card or panel
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      setSheet(null);
      setShopOpen(false);
      setProfileOpen(false);
      setSettingsOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const toggleSound = () => {
    setSoundEnabled(!sound);
    setSound(!sound);
    if (!sound) sfx.tap();
  };

  const signIn = () => navigate(`/login?next=${encodeURIComponent(`/learning/games/${game.slug}`)}`);

  // ---------------------------------------------------------------- playing a stage
  const stageSpec = (number) => (number === 0 ? DAILY_STAGE : game.stages.find((s) => s.stage === number));

  const play = useCallback(async (number) => {
    const spec = number === 0 ? DAILY_STAGE : game.stages.find((s) => s.stage === number);
    if (!spec) return;
    sfx.pick();
    const key = plays.current + 1;
    plays.current = key;
    livePlay.current = key;
    stageRef.current = spec;
    setSheet(null);
    setResult(null);
    setExtra(null);
    setStageError(null);
    setStage(spec);
    setScreen('play');
    window.scrollTo({ top: 0 });
    if (gameKey === 'shabad_le') {          // Shabad-le asks the server for its own puzzle
      setContent({ stage: number });
      setPlayKey(key);
      startedAt.current = Date.now();
      return;
    }
    setLoadingStage(true);
    setContent(null);
    try {
      const data = await arcadeRef.current.loadStage(number);
      if (livePlay.current !== key) return;   // another stage was started, or the map opened
      setContent(data);
      setPlayKey(key);
      startedAt.current = Date.now();
    } catch {
      if (livePlay.current === key) setStageError(t.couldNotLoad);
    } finally {
      if (livePlay.current === key) setLoadingStage(false);
    }
  }, [game.stages, gameKey, t.couldNotLoad]);

  // On phones, scroll just enough to show the whole game (never past its top) when a stage starts
  useEffect(() => {
    if (!playKey) return undefined;
    const id = setTimeout(() => {
      const el = playRef.current;
      if (!el || !window.matchMedia?.('(max-width: 640px)').matches) return;
      const rect = el.getBoundingClientRect();
      const overflow = rect.bottom - window.innerHeight;
      const by = Math.min(overflow, rect.top - 64);   // 64: under the site's navbar
      if (by > 0) window.scrollBy({ top: by, behavior: 'smooth' });
    }, 350);
    return () => clearTimeout(id);
  }, [playKey]);

  // (the results card itself explains a run that was too quick to count)
  const showResult = useCallback((saved, extraContent = null) => {
    setResult(saved);
    setExtra(extraContent);
  }, []);

  // A game finished: save it (once per play) and show the stars, if the player is still there.
  // These belong to one play, so a game left behind can't show its result later
  const handlers = useMemo(() => {
    const key = playKey;
    return {
      onFinish: async (res, extraContent = null) => {
        if (!key || livePlay.current !== key || savedPlay.current === key) return;
        savedPlay.current = key;
        const seconds = res.time_taken_seconds ?? Math.round((Date.now() - startedAt.current) / 1000);
        const saved = await arcadeRef.current.submitStage(stageRef.current.stage, { ...res, time_taken_seconds: seconds });
        if (livePlay.current === key) showResult(saved, extraContent);
      },
      // Shabad-le saves its own result with the last guess
      onResult: (saved, extraContent = null) => {
        if (!key || livePlay.current !== key || savedPlay.current === key) return;
        savedPlay.current = key;
        showResult(saved, extraContent);
      },
    };
  }, [playKey, showResult]);

  const backToMap = () => {
    livePlay.current = 0;
    setScreen('map');
    setResult(null);
    setExtra(null);
    setStage(null);
    setContent(null);
    setLoadingStage(false);
  };

  const hasNext = Boolean(stage && stage.stage > 0 && game.stages.some((s) => s.stage === stage.stage + 1));

  // ---------------------------------------------------------------- game profile
  const saveProfile = async () => {
    if (!newName.trim()) {
      toast.error('Enter a player name.');
      return;
    }
    setSaving(true);
    const ok = await wallet.saveProfile({ name: newName.trim(), avatarFile: newAvatarFile, avatarPreview: newAvatar });
    setSaving(false);
    if (!ok) {
      toast.error('Your game profile couldn’t be saved. Try again.');
      return;
    }
    toast.success('Game profile saved');
    setEditing(false);
    setNewAvatarFile(null);
  };

  const chooseAvatar = (e) => {
    const file = e.target.files[0];
    const problem = fileProblem(file);
    if (problem) {
      toast.error(problem);
      e.target.value = '';
      return;
    }
    if (file) {
      setNewAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (event) => setNewAvatar(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const buyCoins = (amount) => {
    setShopOpen(false);
    if (!signedIn) {
      signIn();
      return;
    }
    navigate(`/checkout?product=coins_${amount}&return=${encodeURIComponent(`/learning/games/${game.slug}`)}`);
  };

  const loadBadges = useCallback(() => arcade.achievements(), [arcade]);
  const loadBoard = useCallback((period) => arcade.leaderboard(period), [arcade]);

  // ---------------------------------------------------------------- screens
  const sheetSpec = sheet !== null ? stageSpec(sheet) : null;
  const sheetProgress = sheet !== null ? progress[sheet] : null;
  const sheetLocked = sheet !== null && sheet > unlockedUpTo;
  const best = (n) => progress[n]?.bestScore || 0;

  const openShop = () => { setProfileOpen(false); setSettingsOpen(false); setShopOpen(true); };

  // The game bar: the same markup and classes as Memory Match's and Shabad Khoj's
  const gameNavbar = (
    <nav className={styles.gameNavbar}>
      <h1 className={styles.navbarBrand}>{title}</h1>
      <div className={styles.navbarRight}>
        {signedIn ? (
          <div className={styles.userInfo}>
            <button
              type="button"
              className={styles.avatarButton}
              onClick={() => setProfileOpen((o) => !o)}
              aria-label={t.profile}
              aria-expanded={profileOpen}
            >
              <Avatar src={playerAvatar} name={playerName} className={styles.userAvatar} />
            </button>
            <span>{playerName}</span>
            <span className={styles.coins}>
              {wallet.coins} <FaCoins aria-hidden="true" />
            </span>
            <div className={styles.levelProgress}>
              <span>{t.level} {wallet.level}</span>
              <div className={styles.progressBar}>
                <div style={{ width: `${Math.min(100, (wallet.xpIntoLevel / (wallet.xpPerLevel || 500)) * 100)}%` }} />
              </div>
            </div>
            <button type="button" onClick={() => setSettingsOpen(true)} className={styles.settingsButton} aria-label={t.settings}>
              <FaCog aria-hidden="true" />
            </button>
            {profileOpen && (
              <GameProfileCard
                ref={profileRef}
                idPrefix={`arcade-${gameKey}`}
                language={language}
                name={playerName}
                avatar={playerAvatar}
                coins={wallet.coins}
                level={wallet.level}
                xpIntoLevel={wallet.xpIntoLevel}
                xpPerLevel={wallet.xpPerLevel}
                stats={profileStats}
                editing={editing}
                saving={saving}
                newName={newName}
                newAvatar={newAvatar}
                onNameChange={setNewName}
                onAvatarChange={chooseAvatar}
                onStartEdit={() => { setNewName(playerName); setNewAvatar(playerAvatar); setEditing(true); }}
                onSave={saveProfile}
                onCancelEdit={() => setEditing(false)}
                onBuyCoins={openShop}
                onLogout={logout}
                onClose={() => setProfileOpen(false)}
              />
            )}
          </div>
        ) : (
          <>
            <button type="button" onClick={signIn} className={styles.loginButton}>
              <FaSignInAlt aria-hidden="true" /> {t.login}
            </button>
            <button type="button" onClick={() => setSettingsOpen(true)} className={styles.settingsButton} aria-label={t.settings}>
              <FaCog aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </nav>
  );

  // Settings: slides in from the right, like the other two games' panel
  const settingsPanel = (
    <>
      <div
        className={`${styles.settingsBackdrop} ${settingsOpen ? styles.settingsBackdropVisible : ''}`}
        onClick={() => setSettingsOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={`${styles.settingsSidebar} ${settingsOpen ? styles.settingsOpen : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={t.settings}
        aria-hidden={!settingsOpen}
      >
        <div className={styles.sidebarHeader}>
          <h2>{t.settings}</h2>
          <button type="button" onClick={() => setSettingsOpen(false)} className={styles.closeButton} aria-label="Close">×</button>
        </div>
        <div className={styles.settingsContent}>
          <label>
            <input type="checkbox" checked={sound} onChange={toggleSound} />
            <span>{t.sound}</span>
          </label>
          <button type="button" className={styles.settingsAction} onClick={openShop}>
            <FaCoins aria-hidden="true" /> {t.coinShop}
          </button>
          {screen === 'play' && (
            <button type="button" className={styles.settingsAction} onClick={() => { setSettingsOpen(false); backToMap(); }}>
              <FaMap aria-hidden="true" /> {t.backToMap}
            </button>
          )}
          <button type="button" className={styles.settingsAction} onClick={() => navigate('/learning/games')}>
            <FaThLarge aria-hidden="true" /> {t.allGames}
          </button>
        </div>
        <p className={styles.settingsNote}>{t.languageNote}</p>
      </aside>
    </>
  );

  // Under the bar: the way back, and on the play screen which stage this is
  const crumbs = (
    <div className={styles.crumbs}>
      {screen === 'play' ? (
        <button type="button" className={styles.crumbButton} onClick={backToMap}>
          <FaArrowLeft aria-hidden="true" /> {t.map}
        </button>
      ) : (
        <button type="button" className={styles.crumbButton} onClick={() => navigate('/learning/games')}>
          <FaArrowLeft aria-hidden="true" /> {t.hub}
        </button>
      )}
      {screen === 'play' && stage && (
        <span className={styles.crumbStage}>
          {theme.icon && <theme.icon aria-hidden="true" className={styles.crumbIcon} />}
          <span className={`${styles.diffChip} ${styles[`chip_${stage.difficulty}`]}`}>
            {stage.stage === 0 ? t.daily : `${t.stageLabel(stage.stage)}: ${t[stage.difficulty]}`}
          </span>
        </span>
      )}
    </div>
  );

  return (
    <div className={`${styles.arcade} ${styles[`theme_${gameKey}`] || ''} notranslate`} translate="no">
      {gameNavbar}
      {settingsPanel}
      {crumbs}

      {screen === 'map' && (
        <main className={styles.mapScreen}>
          <section className={styles.hero}>
            <div className={styles.heroText}>
              <h2 className={styles.heroTitle}>
                <span>{game.title}</span>
                <span className={styles.heroTitlePa} lang="pa">{game.title_pa}</span>
              </h2>
              <p className={styles.heroTagline}>{language === 'punjabi' ? game.tagline_pa : game.tagline}</p>
              <div className={styles.heroProgress}>
                <FaStar aria-hidden="true" />
                <span>{t.progressLabel(totalStars, game.stages.length * 3)}</span>
                <span className={styles.heroBar}><span style={{ width: `${(totalStars / (game.stages.length * 3)) * 100}%` }} /></span>
              </div>
              {!signedIn && <p className={styles.heroNote}>{t.guestNote}</p>}
              {arcade.serverDown && <p className={styles.heroNote}>{t.offline}</p>}
            </div>
            <GameArt gameKey={gameKey} className={styles.heroArt} />
          </section>

          {gameKey === 'shabad_le' && (
            <button type="button" className={styles.dailyCard} onClick={() => play(0)}>
              <FaSun aria-hidden="true" className={styles.dailyIcon} />
              <span>
                <b>{t.daily}</b>
                <small>{language === 'punjabi' ? 'ਸਭ ਲਈ ਇੱਕੋ ਸ਼ਬਦ। ਕੱਲ੍ਹ ਨਵਾਂ ਸ਼ਬਦ!' : 'The same word for everyone today. A new one tomorrow!'}</small>
              </span>
              <span className={styles.dailyPlay}><FaPlay aria-hidden="true" /> {t.play}</span>
            </button>
          )}

          <div className={styles.mapLayout}>
            <div className={styles.mapColumn}>
              <ArcadeMap
                stages={game.stages}
                progress={progress}
                unlockedUpTo={unlockedUpTo}
                pathStyle={theme.path}
                t={t}
                language={language}
                onSelect={(n) => { sfx.tap(); setSheet(n); }}
              />
            </div>
            <Panels
              gameKey={gameKey}
              t={t}
              language={language}
              signedIn={signedIn}
              onSignIn={signIn}
              loadBadges={loadBadges}
              loadLeaderboard={loadBoard}
            />
          </div>
        </main>
      )}

      {screen === 'play' && stage && (
        <main className={styles.playScreen} ref={playRef}>
          {loadingStage && <div className={styles.stageLoading}><span className={styles.spinner} aria-hidden="true" /> {t.loading}</div>}
          {stageError && (
            <div className={styles.stageError}>
              <p>{stageError}</p>
              <button type="button" className={styles.btn} onClick={() => play(stage.stage)}>{t.tryAgainButton}</button>
            </div>
          )}
          {content && !loadingStage && !stageError && (
            <Suspense fallback={<div className={styles.stageLoading}>{t.loading}</div>}>
              <Game
                key={playKey}
                gameKey={gameKey}
                stage={stage}
                content={content}
                t={t}
                language={language}
                dark={isDarkMode}
                onFinish={handlers.onFinish}
                onResult={handlers.onResult}
                onQuit={backToMap}
                api={{ apiString: api, token: signedIn ? accessToken : null }}
                signedIn={signedIn}
                wallet={wallet}
                arcade={arcade}
                pictures={pictures}
              />
            </Suspense>
          )}
        </main>
      )}

      {sheetSpec && (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="arcade-sheet-title" onClick={() => setSheet(null)}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <button type="button" className={styles.sheetClose} onClick={() => setSheet(null)} aria-label="Close"><FaTimes /></button>
            <span className={`${styles.diffChip} ${styles[`chip_${sheetSpec.difficulty}`]}`}>
              {t.stageLabel(sheetSpec.stage)}: {t[sheetSpec.difficulty]}
            </span>
            <h2 id="arcade-sheet-title" className={styles.sheetTitle}>{language === 'punjabi' ? sheetSpec.name_pa : sheetSpec.name}</h2>
            <p className={styles.sheetSub} lang={language === 'punjabi' ? 'en' : 'pa'}>
              {language === 'punjabi' ? sheetSpec.name : sheetSpec.name_pa}
            </p>
            <Stars count={sheetProgress?.stars || 0} className={styles.sheetStars} />
            {sheetProgress?.plays ? <p className={styles.sheetBest}>{t.best}: {best(sheet)}</p> : null}
            <p className={styles.sheetRewards}>
              <FaCoins aria-hidden="true" /> {t.upTo} {rewardsUpTo(game, sheetSpec)} {t.coins}
            </p>
            {sheetLocked ? (
              <p className={styles.sheetLocked}><FaLock aria-hidden="true" /> {t.lockedHint}</p>
            ) : (
              <button type="button" className={styles.btnBig} onClick={() => play(sheetSpec.stage)}>
                <FaPlay aria-hidden="true" /> {t.play}
              </button>
            )}
          </div>
        </div>
      )}

      {result && (
        <ResultsModal
          result={result}
          t={t}
          language={language}
          hasNext={hasNext}
          signedIn={signedIn}
          onReplay={() => play(stage.stage)}
          onNext={() => play(stage.stage + 1)}
          onMap={backToMap}
          onSignIn={signIn}
        >
          {extra}
        </ResultsModal>
      )}

      {shopOpen && (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="arcade-shop-title" onClick={() => setShopOpen(false)}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <button type="button" className={styles.sheetClose} onClick={() => setShopOpen(false)} aria-label="Close"><FaTimes /></button>
            <h2 id="arcade-shop-title" className={styles.sheetTitle}><FaCoins aria-hidden="true" /> {wallet.coins} {t.coins}</h2>
            <p className={styles.sheetSub}>
              {language === 'punjabi'
                ? 'ਪੜਾਅ ਪਾਰ ਕਰ ਕੇ ਤੇ ਤਾਰੇ ਜਿੱਤ ਕੇ ਸਿੱਕੇ ਕਮਾਓ। ਇਸ਼ਾਰਿਆਂ ਲਈ ਸਿੱਕੇ ਵਰਤੋ।'
                : 'Win stars on the stages to earn coins. Spend them on hints.'}
            </p>
            <div className={styles.shopGrid}>
              {COIN_PACKS.map((amount) => (
                <button key={amount} type="button" className={styles.shopPack} onClick={() => buyCoins(amount)}>
                  <FaCoins aria-hidden="true" /> {amount.toLocaleString()}
                </button>
              ))}
            </div>
            {!signedIn && <p className={styles.sheetLocked}>{t.signInToSave}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

// The most coins a stage can give: three new stars plus the first-time bonus
const REWARD_TABLE = {
  easy: 3 * 10 + 10, medium: 3 * 15 + 20, hard: 3 * 25 + 30,
};
function rewardsUpTo(game, spec) {
  const rule = game.stages?.find((s) => s.stage === spec.stage)?.rewards;
  if (rule) return 3 * rule.coins_per_star + rule.first_clear_coins;
  return REWARD_TABLE[spec.difficulty] || REWARD_TABLE.easy;
}
