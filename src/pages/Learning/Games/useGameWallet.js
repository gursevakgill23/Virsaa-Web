/**
 * pages/Learning/Games/useGameWallet.js
 * -----------------------------------------------------------------------------
 * React hook shared by all the games and the game profile card.
 * -----------------------------------------------------------------------------
 *
 * Coins, XP, welcome bonus and the player's game name/avatar.
 *
 * Signed in: everything is saved on the server (/api/learning/me/wallet/...),
 *            so it follows the player to any device and can't be edited in the browser.
 * Guest:     kept in this browser only (localStorage), as before.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import learningApi from '../../../api/learningApi';

// Guest progress is stored under this localStorage key
const GUEST_KEY = 'virsaa_game_guest';
const GUEST_WELCOME_BONUS = 100;

// Read / write the guest's saved progress (storage can be blocked, so both are guarded)
const readGuest = () => {
  try {
    return JSON.parse(localStorage.getItem(GUEST_KEY)) || {};
  } catch {
    return {};
  }
};

const writeGuest = (data) => {
  try {
    localStorage.setItem(GUEST_KEY, JSON.stringify(data));
  } catch {
    /* private mode: progress just isn't kept */
  }
};

// Server wallet -> the shape the games use
const fromServer = (w) => ({
  coins: w.coins ?? 0,
  xp: w.xp ?? 0,
  level: w.level ?? 1,
  xpIntoLevel: w.xp_into_level ?? 0,
  xpPerLevel: w.xp_per_level ?? 500,
  welcomeBonusGiven: Boolean(w.welcome_bonus_given),
  name: w.game_name || '',
  avatar: w.game_avatar || '',
  streak: w.current_streak ?? 0,
});

// A number from storage, or the fallback if it was edited into something else
const toCount = (value) => (Number.isFinite(Number(value)) && Number(value) >= 0 ? Math.floor(Number(value)) : 0);

// Guest progress -> the same shape (level is worked out from XP: 500 XP per level)
const fromGuest = (g) => ({
  coins: toCount(g.coins),
  xp: toCount(g.xp),
  level: Math.floor(toCount(g.xp) / 500) + 1,
  xpIntoLevel: toCount(g.xp) % 500,
  xpPerLevel: 500,
  welcomeBonusGiven: Boolean(g.welcomeBonusGiven),
  name: g.name || '',
  avatar: g.avatar || '',
  streak: 0,
});

/**
 * @param {{ apiString, accessToken, isLoggedIn, gameKey }} options
 * @returns the wallet values plus functions to change it (see the return value at the end)
 */
export default function useGameWallet({ apiString, accessToken, isLoggedIn, gameKey }) {
  const online = Boolean(isLoggedIn && accessToken);
  const [wallet, setWallet] = useState(() => fromGuest(readGuest()));
  const [loaded, setLoaded] = useState(!online);
  const [error, setError] = useState(null);
  // Always-current copy for the async functions below (avoids stale values)
  const walletRef = useRef(wallet);
  walletRef.current = wallet;

  // Replace the wallet with the server's numbers
  const applyServer = useCallback((w) => {
    if (w) setWallet(fromServer(w));
  }, []);

  // Update and store the guest's wallet
  const saveGuest = useCallback((next) => {
    setWallet(next);
    writeGuest({ coins: next.coins, xp: next.xp, welcomeBonusGiven: next.welcomeBonusGiven, name: next.name, avatar: next.avatar });
  }, []);

  // Load the wallet when signing in / out
  useEffect(() => {
    let cancelled = false;
    if (!online) {
      setWallet(fromGuest(readGuest()));
      setLoaded(true);
      return undefined;
    }
    setLoaded(false);
    learningApi.wallet(apiString, accessToken)
      .then((w) => { if (!cancelled) { applyServer(w); setError(null); } })
      .catch((err) => {
        if (cancelled) return;
        console.error('Wallet load failed:', err.response?.status || err.message);
        // Don't show the browser's guest coins as if they were the account's
        setWallet(fromServer({}));
        setError(err.response?.status === 401
          ? 'Your sign-in has expired. Sign in again to use your coins.'
          : 'Your coins couldn’t be loaded. Check your connection and refresh.');
      })
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [online, apiString, accessToken, applyServer]);

  /** Gives the welcome bonus once. Resolves to the amount given (0 if already given). */
  const claimWelcomeBonus = useCallback(async () => {
    if (!online) {
      const w = walletRef.current;
      if (w.welcomeBonusGiven) return 0;
      saveGuest({ ...w, coins: w.coins + GUEST_WELCOME_BONUS, welcomeBonusGiven: true });
      return GUEST_WELCOME_BONUS;
    }
    try {
      const data = await learningApi.claimWelcomeBonus(apiString, accessToken);
      applyServer(data.wallet);
      return data.amount || 0;
    } catch (err) {
      console.error('Welcome bonus failed:', err.response?.status || err.message);
      return 0;
    }
  }, [online, apiString, accessToken, applyServer, saveGuest]);

  /**
   * Spend coins. Resolves to { ok: true } or { ok: false, reason, message }:
   *   reason 'coins'  -> not enough coins (offer to buy more)
   *   reason 'error'  -> the server couldn't be reached / sign-in expired (show the message)
   */
  const spend = useCallback(async (amount, reason) => {
    const w = walletRef.current;
    if (w.coins < amount) return { ok: false, reason: 'coins' };
    if (!online) {
      saveGuest({ ...w, coins: w.coins - amount });
      return { ok: true };
    }
    setWallet({ ...w, coins: w.coins - amount }); // show it straight away
    try {
      const data = await learningApi.spendCoins(apiString, accessToken, amount, reason, gameKey);
      applyServer(data.wallet);
      return { ok: true };
    } catch (err) {
      const status = err.response?.status;
      if (err.response?.data?.wallet) applyServer(err.response.data.wallet);
      else setWallet(w);
      if (status === 402) return { ok: false, reason: 'coins' };
      console.error('Spending coins failed:', status || err.message);
      return {
        ok: false,
        reason: 'error',
        message: status === 401
          ? 'Your sign-in has expired. Sign in again to use your coins.'
          : 'Coins couldn’t be used right now. Check your connection and try again.',
      };
    }
  }, [online, apiString, accessToken, gameKey, applyServer, saveGuest]);

  /** Coins earned during play (the server caps how many can be earned). */
  const earn = useCallback(async (amount, reason) => {
    if (!amount) return 0;
    const w = walletRef.current;
    if (!online) {
      saveGuest({ ...w, coins: w.coins + amount });
      return amount;
    }
    setWallet({ ...w, coins: w.coins + amount });
    try {
      const data = await learningApi.earnCoins(apiString, accessToken, amount, reason, gameKey);
      applyServer(data.wallet);
      return data.amount;
    } catch (err) {
      setWallet(w);
      return 0;
    }
  }, [online, apiString, accessToken, gameKey, applyServer, saveGuest]);

  /**
   * Save a finished (or lost) game. `result`: score, completed, time_taken_seconds,
   * coins_earned, xp_earned, level, details. Resolves to the server's reply
   * (new_badges, best_score, ...) or null for guests / on failure.
   */
  const submitResult = useCallback(async (result) => {
    const w = walletRef.current;
    if (!online) {
      saveGuest({ ...w, coins: w.coins + (result.coins_earned || 0), xp: w.xp + (result.xp_earned || 0) });
      return null;
    }
    // Show the reward straight away; the server's numbers replace it
    setWallet({ ...w, coins: w.coins + (result.coins_earned || 0), xp: w.xp + (result.xp_earned || 0) });
    try {
      const data = await learningApi.submitGame(apiString, accessToken, gameKey, result);
      applyServer(data.wallet);
      return data;
    } catch (err) {
      console.error('Saving the game failed:', err.response?.status || err.message);
      setWallet(w);
      setError('Your result couldn’t be saved.');
      return null;
    }
  }, [online, apiString, accessToken, gameKey, applyServer, saveGuest]);

  /** Game name and avatar. `avatarFile` is a File from an <input type="file">. */
  const saveProfile = useCallback(async ({ name, avatarFile, avatarPreview }) => {
    const w = walletRef.current;
    if (!online) {
      saveGuest({ ...w, name: name ?? w.name, avatar: avatarPreview ?? w.avatar });
      return true;
    }
    try {
      const fields = { game_name: name ?? w.name };
      if (avatarFile) fields.game_avatar = avatarFile;
      applyServer(await learningApi.updateWallet(apiString, accessToken, fields));
      return true;
    } catch (err) {
      console.error('Saving the game profile failed:', err.response?.status || err.message);
      return false;
    }
  }, [online, apiString, accessToken, applyServer, saveGuest]);

  /** Rewards a guest earned in a map game (pages/Learning/Arcade): kept in this browser. */
  const addGuestRewards = useCallback(({ coins = 0, xp = 0 }) => {
    if (online) return;
    const w = walletRef.current;
    saveGuest({ ...w, coins: w.coins + coins, xp: w.xp + xp });
  }, [online, saveGuest]);

  return {
    ...wallet,
    online,
    loaded,
    error,
    claimWelcomeBonus,
    spend,
    earn,
    submitResult,
    saveProfile,
    applyWallet: applyServer,   // a wallet the server sent back with a result
    addGuestRewards,
  };
}
