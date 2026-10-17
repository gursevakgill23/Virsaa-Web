/**
 * context/AuthContext.jsx
 * -----------------------------------------------------------------------------
 * Who is signed in, for the whole app. Wraps everything in App.js and is read
 * with `const { isLoggedIn, userData, accessToken, login, logout } = useAuth();`
 *
 * What it does:
 *   - restores the session when the site opens (tokens in cookies, the user's
 *     profile in localStorage) and checks it with /api/auth/profile/
 *   - renews the access token (it lasts 30 minutes) with the refresh token when
 *     it has expired (also when the access-token cookie has already gone, so
 *     "Remember me" keeps working for its full 7 days)
 *   - adds the Bearer token to /api/auth/ requests and, when any request comes
 *     back 401, renews the token once and retries it
 *   - sends signed-out visitors to /login, except on the public pages below
 *   - "Explore as guest" (Login page): guests may browse the main sections
 *     (GUEST_ROUTES) but opening anything (a book, lesson, game, account page…)
 *     asks them to sign in
 *   - login(), logout(), continueAsGuest(), updateUserData() and
 *     replaceTokens() (after a password change) for the pages
 *
 * Security notes:
 *   - tokens are never written to the console
 *   - cookies are SameSite=Lax (never sent with other sites' requests) and
 *     Secure on HTTPS. JavaScript can still read them; moving the tokens to
 *     httpOnly cookies set by Django would be the next step up.
 *   - a failed token renewal signs the user out cleanly
 *   - a temporary network problem doesn't sign anyone out
 * -----------------------------------------------------------------------------
 */
import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Cookies from 'js-cookie';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from '../utils/notify';

const AuthContext = createContext(null);

// ---------------------------------------------------------------- settings

// Pages signed-out visitors may open; every other page sends them to /login
const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/forgot-password/:email/:token',
  '/verify-email/:token',
  '/verify-email/:email/:token',
  '/about',
  '/news',
  '/privacy-policy',
  '/picture-credits',
];

// Extra pages a guest ("Explore as guest") may browse. These are the overview pages;
// anything opened from them (book, audiobook, author, lesson, quiz, game, Gurdwara
// details, checkout, account) needs an account.
const GUEST_ROUTES = [
  '/',
  '/home',
  '/collections',
  '/collections/ebooks',
  '/collections/audiobooks',
  '/collections/authors',
  '/sikh-history',
  '/gurbani',
  '/learning',
  '/gurdwara-access',
  '/premium',
];

// The guest choice is remembered on this device until the person signs in
const GUEST_KEY = 'virsaa:guest';
const readGuest = () => {
  try { return localStorage.getItem(GUEST_KEY) === '1'; } catch { return false; }
};
const writeGuest = (on) => {
  try {
    if (on) localStorage.setItem(GUEST_KEY, '1');
    else localStorage.removeItem(GUEST_KEY);
  } catch { /* storage blocked: guest mode lasts until the page reloads */ }
};

// Auth endpoints that must never get a token or trigger a token renewal
const AUTH_FREE_PATHS = [
  '/login/', '/signup/', '/verify-email/', '/resend-verification/', '/token/refresh/', '/forget-password/',
  '/verify-reset-code/', '/reset-password/',
];

// Whether "Remember me" was ticked at sign-in, so renewed tokens keep the same cookie lifetime
const REMEMBER_KEY = 'virsaa:remember';
const readRemember = () => {
  try { return localStorage.getItem(REMEMBER_KEY) === '1'; } catch { return false; }
};
const writeRemember = (on) => {
  try {
    if (on) localStorage.setItem(REMEMBER_KEY, '1');
    else localStorage.removeItem(REMEMBER_KEY);
  } catch { /* storage blocked: tokens last a day */ }
};

const TIMEOUT_MS = 20000; // give up on auth requests after 20 s
const ACCESS_DAYS = 1; // access-token cookie lifetime
const REMEMBER_DAYS = 7; // refresh-token cookie lifetime with "Remember me"

// Signed-out state
const SIGNED_OUT = {
  isLoggedIn: false,
  userData: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  isPremium: false,
  isProfileComplete: false,
};

// ---------------------------------------------------------------- helpers

/** "//verify-email/x/" -> "/verify-email/x" (doubled and trailing slashes don't change the page) */
const tidyPath = (pathname) => String(pathname || '/').replace(/\/{2,}/g, '/').replace(/(.)\/$/, '$1');

/** Does this path belong to a public page? (":email/:token" match any segment) */
const isPublicPath = (pathname) => {
  const path = tidyPath(pathname);
  return PUBLIC_ROUTES.some((route) => (route.includes(':')
    ? new RegExp(`^${route.replace(/:[^/]+/g, '[^/]+')}$`).test(path)
    : path === route));
};

/** Is this URL one of the auth endpoints that work without a token? */
const isAuthFreeUrl = (url) => AUTH_FREE_PATHS.some((path) => String(url || '').includes(path));

/** Cookie options: whole site, Lax, Secure on HTTPS, expiring after `days` */
const cookieOptions = (days) => ({
  expires: days,
  path: '/',
  sameSite: 'Lax',
  secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
});

/** Premium membership? Accepts "Premium", "premium_member", etc. */
const isPremiumLevel = (level) => /premium/i.test(String(level || ''));

/** The old completeness check: an "about me" and a date of birth */
const checkProfileCompleteness = (userData) => {
  if (!userData) return false;
  const { about_me: aboutMe, dob } = userData;
  return Boolean(aboutMe && String(aboutMe).trim() !== '' && dob);
};

/** Errors are only logged while developing, and never include tokens */
const logError = (label, error) => {
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.error(label, error?.response?.status || error?.message || error);
  }
};

/** localStorage can be blocked (private mode); never let that break sign-in */
const readStoredUser = () => {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
};
const storeUser = (user) => {
  try { localStorage.setItem('user', JSON.stringify(user)); } catch { /* storage blocked */ }
};
const forgetUser = () => {
  try { localStorage.removeItem('user'); } catch { /* storage blocked */ }
};

// ---------------------------------------------------------------- provider

export const AuthProvider = ({ children, apiString }) => {
  const [authState, setAuthState] = useState({ ...SIGNED_OUT, isLoading: true });
  const [isGuest, setIsGuest] = useState(readGuest); // exploring without an account
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // API base address (trailing slash removed)
  const apiUrl = useMemo(
    () => (apiString || process.env.REACT_APP_API_URL || '').replace(/\/$/, ''),
    [apiString]
  );

  // Latest values for code that runs outside React's render (interceptors, async calls)
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  const tokensRef = useRef({ accessToken: null, refreshToken: null });
  tokensRef.current = { accessToken: authState.accessToken, refreshToken: authState.refreshToken };

  // One token renewal at a time: requests that fail together share it
  const refreshPromiseRef = useRef(null);

  /** Forget the session everywhere (cookies, storage, state). */
  const handleCleanup = useCallback(() => {
    Cookies.remove('accessToken', { path: '/' });
    Cookies.remove('refreshToken', { path: '/' });
    forgetUser();
    writeRemember(false);
    tokensRef.current = { accessToken: null, refreshToken: null };
    setAuthState(SIGNED_OUT);
  }, []);

  /** Put a signed-in user into state (and remember their profile). */
  const applyUser = useCallback((user, accessToken, refreshToken) => {
    storeUser(user);
    tokensRef.current = { accessToken, refreshToken };
    setAuthState({
      isLoggedIn: true,
      userData: user,
      accessToken,
      refreshToken,
      isLoading: false,
      isPremium: isPremiumLevel(user?.membership_level),
      isProfileComplete: checkProfileCompleteness(user),
    });
  }, []);

  /** Get a new access token with the refresh token. Resolves to the new token. */
  const refreshAccessToken = useCallback((refreshToken) => {
    if (!refreshPromiseRef.current) {
      refreshPromiseRef.current = axios
        .post(`${apiUrl}/api/auth/token/refresh/`, { refresh: refreshToken }, { timeout: TIMEOUT_MS, _skipAuthRefresh: true })
        .then((response) => {
          const newAccessToken = response.data?.access;
          if (!newAccessToken) throw new Error('No access token in the refresh reply');
          Cookies.set('accessToken', newAccessToken, cookieOptions(readRemember() ? REMEMBER_DAYS : ACCESS_DAYS));
          tokensRef.current = { ...tokensRef.current, accessToken: newAccessToken };
          return newAccessToken;
        })
        .finally(() => { refreshPromiseRef.current = null; });
    }
    return refreshPromiseRef.current;
  }, [apiUrl]);

  // ---------------------------------------------------------------- restore the session (once)
  useEffect(() => {
    let cancelled = false;

    const fetchProfile = (token) => axios.get(`${apiUrl}/api/auth/profile/`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: TIMEOUT_MS,
      _skipAuthRefresh: true, // handled right here instead of by the interceptor
    });

    const restore = async () => {
      const accessToken = Cookies.get('accessToken');
      const refreshToken = Cookies.get('refreshToken');
      const storedUser = readStoredUser();

      // No session to restore
      if (!refreshToken || !storedUser) {
        handleCleanup();
        return;
      }

      try {
        // The access cookie may have expired before the refresh cookie ("Remember me")
        let token = accessToken || await refreshAccessToken(refreshToken);
        let response;
        try {
          response = await fetchProfile(token);
        } catch (error) {
          if (error.response?.status !== 401) throw error;
          token = await refreshAccessToken(refreshToken); // expired: renew once, then retry
          response = await fetchProfile(token);
        }
        if (!cancelled) applyUser(response.data, token, refreshToken);
      } catch (error) {
        if (cancelled) return;
        logError('Session check failed:', error);
        if (!error.response && accessToken) {
          // Offline or server unreachable: keep the saved session instead of signing out
          applyUser(storedUser, accessToken, refreshToken);
        } else {
          handleCleanup(); // the redirect effect below sends them to /login if needed
        }
      }
    };

    restore();
    return () => { cancelled = true; };
  }, [apiUrl, applyUser, handleCleanup, refreshAccessToken]);

  // ---------------------------------------------------------------- sign-in guard
  // Signed-out visitors on a non-public page go to /login (checked on every page change,
  // without another network request). Guests may also browse GUEST_ROUTES; anything
  // else they try to open asks them to sign in.
  useEffect(() => {
    if (authState.isLoading || authState.isLoggedIn || isPublicPath(pathname)) return;
    if (isGuest && GUEST_ROUTES.includes(tidyPath(pathname))) return;
    if (isGuest) {
      toast.info('Sign in or create a free account to open this. As a guest you can explore, but not open content.', { toastId: 'guest-locked' });
    }
    navigateRef.current('/login');
  }, [authState.isLoading, authState.isLoggedIn, isGuest, pathname]);

  // ---------------------------------------------------------------- axios interceptors (set up once)
  useEffect(() => {
    // Add the current token to /api/auth/ requests (except the token-free endpoints)
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const url = String(config.url || '');
        const { accessToken } = tokensRef.current;
        if (url.includes('/api/auth/') && !isAuthFreeUrl(url) && accessToken && !config._skipAuthRefresh) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // A 401 means the access token expired: renew it once and retry the request.
    // If that isn't possible, sign out and go to the login page.
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const original = error.config || {};
        if (error.response?.status !== 401 || original._skipAuthRefresh || isAuthFreeUrl(original.url)) {
          return Promise.reject(error); // not a token problem (or a wrong password on the login form)
        }

        const { refreshToken } = tokensRef.current;
        if (refreshToken && !original._retry) {
          original._retry = true;
          try {
            const newAccessToken = await refreshAccessToken(refreshToken);
            setAuthState((prev) => ({ ...prev, accessToken: newAccessToken }));
            original.headers = original.headers || {};
            original.headers.Authorization = `Bearer ${newAccessToken}`;
            return axios(original);
          } catch (refreshError) {
            logError('Token renewal failed:', refreshError);
            handleCleanup();
            navigateRef.current('/login');
            return Promise.reject(refreshError);
          }
        }

        // No refresh token, or the retry was also refused
        handleCleanup();
        navigateRef.current('/login');
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [handleCleanup, refreshAccessToken]);

  // ---------------------------------------------------------------- actions for the pages

  /** Save a new session after a successful login (Login.jsx). */
  const login = useCallback((accessToken, refreshToken, user, rememberMe = false) => {
    writeGuest(false); // a real account replaces guest mode
    setIsGuest(false);
    writeRemember(rememberMe);
    const days = rememberMe ? REMEMBER_DAYS : ACCESS_DAYS;
    Cookies.set('accessToken', accessToken, cookieOptions(days));
    Cookies.set('refreshToken', refreshToken, cookieOptions(days));
    applyUser(user, accessToken, refreshToken);
  }, [applyUser]);

  /**
   * New tokens for the same person, e.g. after changing the password (the server signs
   * every other device out and sends this one a fresh pair). Keeps the "Remember me" choice.
   */
  const replaceTokens = useCallback((accessToken, refreshToken) => {
    if (!accessToken || !refreshToken) return;
    const days = readRemember() ? REMEMBER_DAYS : ACCESS_DAYS;
    Cookies.set('accessToken', accessToken, cookieOptions(days));
    Cookies.set('refreshToken', refreshToken, cookieOptions(days));
    tokensRef.current = { accessToken, refreshToken };
    setAuthState((prev) => (prev.isLoggedIn ? { ...prev, accessToken, refreshToken } : prev));
  }, []);

  /** "Explore as guest" on the Login page: browse the main sections without an account. */
  const continueAsGuest = useCallback(() => {
    writeGuest(true);
    setIsGuest(true);
    toast.info('You’re exploring as a guest. Sign in any time to open books, lessons and games.', { toastId: 'guest-on' });
    navigateRef.current('/');
  }, []);

  /** Tell the server to retire the refresh token, then forget the session locally. */
  const logout = useCallback(async () => {
    const { refreshToken } = tokensRef.current;
    if (refreshToken) {
      try {
        // The refresh token itself is the proof, so this works even after the access token expired
        await axios.post(
          `${apiUrl}/api/auth/logout/`,
          { refresh_token: refreshToken },
          { timeout: TIMEOUT_MS, _skipAuthRefresh: true }
        );
      } catch (error) {
        logError('Logout request failed:', error); // signed out locally anyway
      }
    }
    handleCleanup();
    navigateRef.current('/login');
  }, [apiUrl, handleCleanup]);

  /**
   * Refresh the signed-in user's profile.
   *   updateUserData(newData)  use data the page already has (e.g. after saving the profile
   *                            or buying a membership) — no extra request
   *   updateUserData()         fetch the latest profile from the server
   * A failed fetch keeps the current data; it never signs the user out.
   */
  const updateUserData = useCallback(async (newData) => {
    const isPlainObject = newData && typeof newData === 'object' && !newData.nativeEvent && !Array.isArray(newData);
    if (isPlainObject) {
      setAuthState((prev) => {
        if (!prev.isLoggedIn) return prev;
        const userData = { ...(prev.userData || {}), ...newData };
        storeUser(userData);
        return { ...prev, userData, isPremium: isPremiumLevel(userData.membership_level), isProfileComplete: checkProfileCompleteness(userData) };
      });
      return;
    }

    const { accessToken } = tokensRef.current;
    if (!accessToken) return;
    try {
      const response = await axios.get(`${apiUrl}/api/auth/profile/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: TIMEOUT_MS,
      });
      storeUser(response.data);
      setAuthState((prev) => ({
        ...prev,
        userData: response.data,
        isPremium: isPremiumLevel(response.data?.membership_level),
        isProfileComplete: checkProfileCompleteness(response.data),
      }));
    } catch (error) {
      logError('Profile refresh failed:', error); // a 401 is handled by the interceptor
    }
  }, [apiUrl]);

  // One value object, recreated only when something in it changes
  const value = useMemo(() => ({
    isLoggedIn: authState.isLoggedIn,
    userData: authState.userData,
    accessToken: authState.accessToken,
    refreshToken: authState.refreshToken,
    isLoading: authState.isLoading,
    isPremium: authState.isPremium,
    isProfileComplete: authState.isProfileComplete,
    isGuest: isGuest && !authState.isLoggedIn,
    login,
    logout,
    continueAsGuest,
    updateUserData,
    replaceTokens,
  }), [authState, isGuest, login, logout, continueAsGuest, updateUserData, replaceTokens]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/** Read the auth state from any component inside <AuthProvider>. */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
