/**
 * pages/Learning/Arcade/useArcade.js
 * -----------------------------------------------------------------------------
 * Everything a map game needs from the server, in one hook:
 *   - the game's nine stages and the player's stars on each (the map)
 *   - the content for a stage
 *   - saving a finished stage: stars, coins, XP and new badges
 *   - the leaderboard and the player's badges for this game
 *
 * Signed in: the server keeps the stars and works out the rewards
 *            (/api/learning/games/..., learning_api/game_views.py).
 * Guest, or the server can't be reached: the stars are kept in this browser
 *            and the same rules are applied here (localGames.js).
 * -----------------------------------------------------------------------------
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import learningApi from '../../../api/learningApi';
import {
  GAMES, localStageContent, readGuestProgress, stageRewards, starsFor, unlockedUpTo, writeGuestProgress,
} from './localGames';

const normalizeProgress = (raw = {}) => Object.fromEntries(
  Object.entries(raw).map(([stage, p]) => [Number(stage), {
    stars: p.stars || 0, bestScore: p.best_score ?? p.bestScore ?? 0,
    bestTime: p.best_time_seconds ?? p.bestTime ?? null, plays: p.plays || 0,
  }]),
);

// Badges every map game shows besides its own
const SHARED_BADGES = ['first-game', 'khed-mela', 'star-collector', 'virsaa-superstar'];

const guestProgressFor = (gameKey) => normalizeProgress(readGuestProgress()[gameKey] || {});

/**
 * @param {{ gameKey, apiString, accessToken, isLoggedIn, wallet, pictures }} options
 *   wallet: the value of useGameWallet (to show new coins straight away)
 *   pictures: website pictures (useSiteImages), for offline jigsaws
 */
export default function useArcade({ gameKey, apiString, accessToken, isLoggedIn, wallet, pictures }) {
  const signedIn = Boolean(isLoggedIn && accessToken);
  const spec = GAMES[gameKey];
  const [game, setGame] = useState(spec);
  const [progress, setProgress] = useState(() => (signedIn ? {} : guestProgressFor(gameKey)));
  const [loading, setLoading] = useState(true);
  const [serverDown, setServerDown] = useState(false);
  const walletRef = useRef(wallet);
  walletRef.current = wallet;
  const token = signedIn ? accessToken : null;

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await learningApi.arcadeGame(apiString, token, spec.slug);
      setGame({ ...spec, ...data, stages: data.stages || spec.stages });
      setProgress(signedIn ? normalizeProgress(data.progress) : guestProgressFor(gameKey));
      setServerDown(false);
    } catch (err) {
      console.error('Game map failed to load:', err.response?.status || err.message);
      setGame(spec);
      setProgress(signedIn ? {} : guestProgressFor(gameKey));
      setServerDown(true);
    } finally {
      setLoading(false);
    }
  }, [apiString, token, signedIn, spec, gameKey]);

  useEffect(() => { refresh(); }, [refresh]);

  /** What to play on a stage: from the server, or the offline copy. */
  const loadStage = useCallback(async (stage) => {
    try {
      const data = await learningApi.arcadeContent(apiString, token, spec.slug, stage);
      return { ...data, offline: false };
    } catch (err) {
      if (err.response?.status === 404) throw err;
      console.error('Stage content failed to load:', err.response?.status || err.message);
      const local = localStageContent(gameKey, stage, pictures);
      if (!local) throw err;
      return local;
    }
  }, [apiString, token, spec, gameKey, pictures]);

  // Save a result in this browser (guests, or when the server can't be reached)
  const saveLocally = useCallback((stage, score, completed, seconds) => {
    const stageSpec = spec.stages.find((s) => s.stage === stage) || { difficulty: 'easy' };
    const all = readGuestProgress();
    const mine = all[gameKey] || {};
    const before = mine[stage] || { stars: 0, best_score: 0, plays: 0 };
    const minSeconds = stageSpec.settings?.min_seconds ?? spec.min_seconds ?? 0;
    const tooFast = Boolean(completed && minSeconds && (seconds == null || seconds < minSeconds));
    const stars = tooFast ? 0 : starsFor(score, completed);
    const firstClear = stars >= 1 && !before.cleared;
    const rewards = tooFast ? { coins: 0, xp: 0, newStars: 0, firstClearCoins: 0 }
      : stageRewards(stageSpec.difficulty, before.stars || 0, stars, firstClear);
    const isNewBest = !tooFast && score > (before.best_score || 0);
    mine[stage] = {
      stars: Math.max(before.stars || 0, stars),
      best_score: isNewBest ? score : before.best_score || 0,
      best_time_seconds: isNewBest && completed ? seconds : before.best_time_seconds ?? null,
      plays: (before.plays || 0) + 1,
      cleared: before.cleared || stars >= 1,
    };
    all[gameKey] = mine;
    writeGuestProgress(all);
    const next = normalizeProgress(mine);
    setProgress(next);
    walletRef.current?.addGuestRewards?.({ coins: rewards.coins, xp: rewards.xp });
    return {
      stage, score: tooFast ? 0 : score, stars, previousStars: before.stars || 0, coins: rewards.coins, xp: rewards.xp,
      firstClear, firstClearCoins: rewards.firstClearCoins, isNewBest, tooFast, newBadges: [], local: true,
      bestScore: mine[stage].best_score, unlockedUpTo: unlockedUpTo(next, spec.stages.length),
    };
  }, [spec, gameKey]);

  // The server's reply to a result, in the shape the results screen uses
  const fromServer = useCallback((data) => {
    const next = normalizeProgress(data.progress);
    setProgress(next);
    if (data.wallet) walletRef.current?.applyWallet?.(data.wallet);
    return {
      stage: data.stage, score: data.score, stars: data.stars, previousStars: data.previous_stars,
      coins: data.coins_earned, xp: data.xp_earned, firstClear: data.first_clear,
      firstClearCoins: data.rewards?.first_clear_coins || 0, isNewBest: data.is_new_best, tooFast: data.too_fast,
      newBadges: data.new_badges || [], bestScore: data.best_score, local: false,
      unlockedUpTo: data.unlocked_up_to ?? unlockedUpTo(next, spec.stages.length),
    };
  }, [spec]);

  /**
   * Save a finished stage. result: { score (0-1000), completed, time_taken_seconds, details }.
   * Resolves to { stars, previousStars, score, coins, xp, newBadges, firstClear, isNewBest, tooFast, unlockedUpTo, local }.
   */
  const submitStage = useCallback(async (stage, result) => {
    const score = Math.max(0, Math.min(1000, Math.round(result.score || 0)));
    const completed = result.completed !== false;
    const seconds = result.time_taken_seconds ?? null;
    if (!signedIn) return saveLocally(stage, score, completed, seconds);
    try {
      const data = await learningApi.arcadeSubmit(apiString, token, spec.slug, {
        stage, score, completed, time_taken_seconds: seconds, details: result.details || {},
      });
      return fromServer(data);
    } catch (err) {
      console.error('Saving the stage failed:', err.response?.status || err.message);
      const local = saveLocally(stage, score, completed, seconds);
      return { ...local, saveFailed: true };
    }
  }, [signedIn, apiString, token, spec, saveLocally, fromServer]);

  /** For Shabad-le, whose results come back with the last guess. */
  const applyServerResult = useCallback((data) => fromServer(data), [fromServer]);
  const recordLocal = useCallback((stage, score, completed, seconds) => saveLocally(stage, score, completed, seconds),
    [saveLocally]);

  const leaderboard = useCallback((period) => learningApi.arcadeLeaderboard(apiString, token, spec.slug, period, 10),
    [apiString, token, spec]);

  /** This game's badges (and the ones shared by all the map games), with the player's progress. */
  const achievements = useCallback(async () => {
    const mine = (b) => b.game_key === gameKey || SHARED_BADGES.includes(b.key);
    if (signedIn) {
      const data = await learningApi.achievements(apiString, token, gameKey);
      return (data.achievements || []).filter(mine);
    }
    const list = await learningApi.badges(apiString);
    return (Array.isArray(list) ? list : list.results || []).filter(mine)
      .map((b) => ({ ...b, earned: false, current: 0, target: b.threshold, progress: 0 }));
  }, [signedIn, apiString, token, gameKey]);

  const stages = game?.stages || spec.stages;
  return {
    game: { ...spec, ...game, stages },
    progress,
    unlockedUpTo: unlockedUpTo(progress, stages.length),
    loading,
    serverDown,
    signedIn,
    refresh,
    loadStage,
    submitStage,
    applyServerResult,
    recordLocal,
    leaderboard,
    achievements,
  };
}
