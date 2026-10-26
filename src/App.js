/**
 * src/App.js
 * -----------------------------------------------------------------------------
 * The root of the Virsaa web app. It:
 *   - shows the Virsaa splash loader once while the app starts,
 *   - keeps the light/dark theme (saved in the "theme" cookie),
 *   - renders the navbar, side panel, footer and floating Gurdwara button,
 *   - maps every URL to its page (the <Routes> list below),
 *   - plays the quick Virsaa loader on every page change, and opens every new
 *     page at the top (Back and Forward return to where you were),
 *   - catches page crashes with <ErrorBoundary> so one broken page never
 *     blanks the whole site,
 *   - mounts <NotificationLayer>, which draws all toast.*() messages.
 *
 * Pages are loaded on demand (React.lazy), so the first visit downloads only
 * the code for the page being opened. While a page's code downloads, the
 * Virsaa loader is shown (Suspense fallback).
 * -----------------------------------------------------------------------------
 */
import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import Cookies from 'js-cookie';
import Navbar from './components/Navbar/Navbar';
import Sidebar from './components/Sidebar/Sidebar';
import Footer from './components/Footer/Footer';
import Loader from './components/VirsaaLoader/Loader';
import NotificationLayer from './components/NotificationLayer/NotificationLayer';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import GurdwaraAccessButton from './pages/GurdwaraAccess/GurdwaraAccessButton/GurdwaraAccessButton';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

// ---------------------------------------------------------------- pages (loaded on demand)
const Home = lazy(() => import('./pages/HomePage/Home'));
const Collections = lazy(() => import('./pages/Collections/Collections'));
const SikhHistory = lazy(() => import('./pages/SikhHistory/SikhHistory'));
const SikhHistoryArticle = lazy(() => import('./pages/SikhHistory/SikhHistoryArticle'));
// Sakhis & Kahaniyaan: the list of stories and one story (pages/Sakhis)
const Sakhis = lazy(() => import('./pages/Sakhis/Sakhis'));
const SakhiStory = lazy(() => import('./pages/Sakhis/SakhiStory'));
const Login = lazy(() => import('./pages/Login/Login'));
const Signup = lazy(() => import('./pages/Signup/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword/ForgotPassword'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail/VerifyEmail'));
const Membership = lazy(() => import('./pages/Membership/Membership'));
const GurdwaraAccess = lazy(() => import('./pages/GurdwaraAccess/GurdwaraAccess'));
const GurdwaraLocate = lazy(() => import('./pages/GurdwaraAccess/GurdwaraLocate/GurdwaraLocate'));
const GurdwaraServices = lazy(() => import('./pages/GurdwaraAccess/GurdwaraServices/GurdwaraServices'));
const GurdwaraHistory = lazy(() => import('./pages/GurdwaraAccess/GurdwaraHistory/GurdwaraHistory'));
const Gurbani = lazy(() => import('./pages/Gurbani/Gurbani'));
const Learning = lazy(() => import('./pages/Learning/Learning'));
const News = lazy(() => import('./pages/News/News'));
const About = lazy(() => import('./pages/About/About'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy/PrivacyPolicy'));
const Quizzes = lazy(() => import('./pages/Learning/Quizzes/Quizzes'));
const EbookDetail = lazy(() => import('./pages/Collections/EbookDetail/EbookDetail'));
const AuthorDetail = lazy(() => import('./pages/Collections/AuthorDetail/AuthorDetail'));
const AudiobookDetail = lazy(() => import('./pages/Collections/AudiobookDetail/AudiobookDetail'));
// WordSearch.jsx exports the game page as a named export, so pick it out
const WordSearchGamePlay = lazy(() => import('./pages/Learning/Games/WordSearch/WordSearch')
  .then((module) => ({ default: module.WordSearchGamePlay })));
const MemoryMatch = lazy(() => import('./pages/Learning/Games/MemoryMatch/MemoryMatch'));
// The Khed Mela (all games) and the ten map games (pages/Learning/Arcade)
const ArcadeHub = lazy(() => import('./pages/Learning/Arcade/ArcadeHub'));
const ArcadeRoute = lazy(() => import('./pages/Learning/Arcade/ArcadeRoute'));
// /my-profile shows CompleteProfile until every required detail is filled in,
// then MyProfile (see pages/Profile/ProfileRoute.jsx).
const ProfileRoute = lazy(() => import('./pages/Profile/ProfileRoute'));
const Checkout = lazy(() => import('./pages/Checkout/Checkout'));
const Payment = lazy(() => import('./pages/Payment/Payment'));
const MyFavorites = lazy(() => import('./pages/Profile/MyFavorites/MyFavorites'));
const Settings = lazy(() => import('./pages/Profile/Settings/Settings'));
const History = lazy(() => import('./pages/Profile/History/History'));
const Notifications = lazy(() => import('./pages/Profile/Notifications/Notifications'));
const LearningMaterial = lazy(() => import('./pages/Learning/LearningMaterial/LearningMaterial'));
const NotFound = lazy(() => import('./pages/NotFound/NotFound'));
const PictureCredits = lazy(() => import('./pages/PictureCredits/PictureCredits'));
// Sharing books and the reward coins people earn for them (pages/Rewards)
const MyRewards = lazy(() => import('./pages/Rewards/MyRewards'));
const ShareBook = lazy(() => import('./pages/Rewards/ShareBook'));

// Base URL of the Django API, set in .env / Vercel as REACT_APP_API_URL
const API_STRING = process.env.REACT_APP_API_URL;

// Full-screen game pages hide the footer
const GAME_PATHS = ['/learning/games/shabd-khoj', '/learning/games/memory-match'];

/**
 * Plays the quick Virsaa loader whenever the page (URL path) changes.
 * Not on the very first render: the splash loader already covers that.
 * Changes to only the ?query or #hash (e.g. filters) don't count as a new page.
 */
const RouteLoader = () => {
  const { pathname } = useLocation();
  const previous = useRef(pathname);
  const [playing, setPlaying] = useState(0); // 0 = idle; otherwise a key that restarts the loader

  useEffect(() => {
    if (previous.current === pathname) return;
    previous.current = pathname;
    setPlaying((n) => n + 1);
  }, [pathname]);

  if (!playing) return null;
  return <Loader key={playing} variant="quick" onLoadingComplete={() => setPlaying(0)} />;
};

// Try `step` until it returns true (the page may still be drawing), for up to 2 seconds;
// the visitor scrolling or pressing a key stops it. Returns the function that stops it.
const USER_SCROLLS = ['wheel', 'touchstart', 'keydown'];
const keepTrying = (step) => {
  let tries = 0;
  let timer = null;
  const stop = () => {
    clearTimeout(timer);
    USER_SCROLLS.forEach((name) => window.removeEventListener(name, stop));
  };
  const run = () => {
    tries += 1;
    if (step() || tries >= 20) stop();
    else timer = setTimeout(run, 100);
  };
  USER_SCROLLS.forEach((name) => window.addEventListener(name, stop, { passive: true }));
  run();
  return stop;
};

/**
 * Opens every new page at the top. (The router keeps the scroll position by
 * itself, so a link near the bottom of one page used to open the next page
 * near its bottom too.) Back and Forward return to where you were on that
 * page once it has drawn; an address with #part goes to that part. Changing
 * only the ?query (filters) keeps the place.
 */
const ScrollToTop = () => {
  const { pathname, hash, key } = useLocation();
  const navigationType = useNavigationType();
  const positions = useRef({}); // how far down each visited page was (by history entry)
  const entry = useRef(key);
  const lastPath = useRef(pathname);

  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    const remember = () => { positions.current[entry.current] = window.scrollY; };
    window.addEventListener('scroll', remember, { passive: true });
    return () => window.removeEventListener('scroll', remember);
  }, []);

  useEffect(() => {
    entry.current = key;
    const newPage = lastPath.current !== pathname;
    lastPath.current = pathname;
    const saved = positions.current[key];
    if (navigationType === 'POP' && saved) {
      return keepTrying(() => {
        window.scrollTo(0, saved);
        return Math.abs(window.scrollY - saved) < 2;
      });
    }
    if (!newPage) return undefined;
    window.scrollTo(0, 0);
    if (!hash) return undefined;
    return keepTrying(() => {
      const target = document.getElementById(decodeURIComponent(hash.slice(1)));
      target?.scrollIntoView();
      return Boolean(target);
    });
  }, [key, pathname, hash, navigationType]);

  return null;
};

/**
 * Tidies addresses with doubled slashes ("//verify-email/…", e.g. from a link
 * built with a trailing slash) or a trailing slash, so they open the right
 * page instead of "not found" or the login page.
 */
const CleanPath = () => {
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const clean = pathname.replace(/\/{2,}/g, '/').replace(/(.)\/$/, '$1');
    if (clean !== pathname) navigate(`${clean}${search}${hash}`, { replace: true });
  }, [pathname, search, hash, navigate]);
  return null;
};

/**
 * Applies the theme saved on the user's account (Settings → Save settings) when they
 * sign in or it changes. Skipped when "Match device" was chosen on this device.
 * Lives inside <AuthProvider> so it can read the signed-in user.
 */
const ThemeFromProfile = ({ setTheme }) => {
  const { userData } = useAuth();
  const saved = userData?.theme_preference;
  const applied = useRef(null);

  useEffect(() => {
    if (!saved || applied.current === saved) return;
    applied.current = saved;
    let choice = null;
    try { choice = localStorage.getItem('virsaa:theme-choice'); } catch { /* storage blocked */ }
    if (choice === 'system') return;
    setTheme(saved === 'dark');
  }, [saved, setTheme]);

  return null;
};

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const location = useLocation(); // current route

  // ---------------------------------------------------------------- theme
  // Read the saved theme once on start and apply it to <html data-theme="…">
  useEffect(() => {
    const savedTheme = Cookies.get('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  // Set the theme and remember it on this device for a year ("theme" cookie).
  // SameSite=Lax keeps the cookie out of cross-site requests; Secure on HTTPS.
  const setTheme = useCallback((dark) => {
    const newTheme = dark ? 'dark' : 'light';
    Cookies.set('theme', newTheme, { expires: 365, sameSite: 'Lax', secure: window.location.protocol === 'https:' });
    setIsDarkMode(dark);
    document.documentElement.setAttribute('data-theme', newTheme);
  }, []);

  // The navbar's sun/moon button
  const toggleTheme = () => setTheme(!isDarkMode);

  // Called by the splash loader when it has finished
  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  // ---------------------------------------------------------------- side panel
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Games fill the page without the footer, the floating button or the phone tab bar (the Khed Mela list keeps them)
  const isGamePage = GAME_PATHS.includes(location.pathname) || location.pathname.startsWith('/learning/games/');

  // ...so the room kept at the bottom for the tab bar isn't needed there (App.css)
  useEffect(() => {
    document.body.classList.toggle('game-page', isGamePage);
    return () => document.body.classList.remove('game-page');
  }, [isGamePage]);

  // Every page gets the same two props
  const pageProps = { isDarkMode, apiString: API_STRING };

  return (
    <AuthProvider apiString={API_STRING}>
      <CssBaseline />
      {/* Success / error messages from toast.*() (utils/notify.js) */}
      <NotificationLayer />
      {/* Use the theme saved on the account when someone signs in */}
      <ThemeFromProfile setTheme={setTheme} />
      <CleanPath />
      {/* Every new page opens at the top */}
      <ScrollToTop />

      {isLoading ? (
        <Loader onLoadingComplete={handleLoadingComplete} />
      ) : (
        <>
          <Navbar
            toggleSidebar={toggleSidebar}
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
            apiString={API_STRING}
          />
          <Sidebar
            open={isSidebarOpen}
            closeSidebar={closeSidebar}
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
            apiString={API_STRING}
            showTabs={!isGamePage}
          />

          {/* Quick Virsaa loader on each page change */}
          <RouteLoader />

          {/* A crash inside one page shows a friendly message instead of a blank site.
              Keyed by path so moving to another page clears the error. */}
          <ErrorBoundary key={location.pathname}>
            <Suspense fallback={<Loader variant="wait" />}>
              <Routes>
                <Route path="/" element={<Home {...pageProps} />} />
                <Route path="/home" element={<Home {...pageProps} />} />

                {/* Library */}
                <Route path="/collections" element={<Collections {...pageProps} />} />
                <Route path="/collections/ebooks" element={<Collections {...pageProps} />} />
                <Route path="/collections/audiobooks" element={<Collections {...pageProps} />} />
                <Route path="/collections/authors" element={<Collections {...pageProps} />} />
                <Route path="/collections/ebooks/ebook/:id" element={<EbookDetail {...pageProps} />} />
                <Route path="/collections/authors/author/:id" element={<AuthorDetail {...pageProps} />} />
                <Route path="/collections/audiobooks/audiobook/:id" element={<AudiobookDetail {...pageProps} />} />

                {/* Sikhism */}
                <Route path="/sikh-history" element={<SikhHistory {...pageProps} />} />
                <Route path="/sikh-history/:slug" element={<SikhHistoryArticle {...pageProps} />} />
                <Route path="/sakhis" element={<Sakhis {...pageProps} />} />
                <Route path="/sakhis/:slug" element={<SakhiStory {...pageProps} />} />
                <Route path="/gurbani" element={<Gurbani {...pageProps} />} />
                <Route path="/gurdwara-access" element={<GurdwaraAccess {...pageProps} />} />
                <Route path="/gurdwara-access/locate/:id" element={<GurdwaraLocate {...pageProps} />} />
                <Route path="/gurdwara-access/services/:id" element={<GurdwaraServices {...pageProps} />} />
                <Route path="/gurdwara-access/history/:id" element={<GurdwaraHistory {...pageProps} />} />

                {/* Learning */}
                <Route path="/learning" element={<Learning {...pageProps} />} />
                <Route path="/learning/quizzes/:id" element={<Quizzes {...pageProps} />} />
                <Route path="/learning-material/:id" element={<LearningMaterial {...pageProps} />} />
                <Route path="/learning/games/shabd-khoj" element={<WordSearchGamePlay {...pageProps} />} />
                <Route path="/learning/games/memory-match" element={<MemoryMatch {...pageProps} />} />
                <Route path="/learning/games" element={<ArcadeHub {...pageProps} />} />
                <Route path="/learning/games/:slug" element={<ArcadeRoute {...pageProps} />} />

                {/* Account */}
                <Route path="/login" element={<Login {...pageProps} />} />
                <Route path="/signup" element={<Signup {...pageProps} />} />
                <Route path="/forgot-password" element={<ForgotPassword {...pageProps} />} />
                <Route path="/forgot-password/:email/:token" element={<ForgotPassword {...pageProps} />} />
                <Route path="/verify-email/:token" element={<VerifyEmail {...pageProps} />} />
                <Route path="/verify-email/:email/:token" element={<VerifyEmail {...pageProps} />} />
                <Route path="/my-profile" element={<ProfileRoute {...pageProps} />} />
                <Route path="/account-settings" element={<Settings {...pageProps} toggleTheme={toggleTheme} setTheme={setTheme} />} />
                <Route path="/my-favorites" element={<MyFavorites {...pageProps} toggleTheme={toggleTheme} />} />
                <Route path="/history" element={<History {...pageProps} toggleTheme={toggleTheme} />} />
                <Route path="/notifications" element={<Notifications {...pageProps} toggleTheme={toggleTheme} />} />
                <Route path="/my-rewards" element={<MyRewards {...pageProps} />} />
                <Route path="/share-a-book" element={<ShareBook {...pageProps} />} />

                {/* Membership and payments */}
                <Route path="/premium" element={<Membership {...pageProps} />} />
                <Route path="/checkout" element={<Checkout {...pageProps} />} />
                <Route path="/payment/:reference" element={<Payment {...pageProps} />} />

                {/* Information */}
                <Route path="/news" element={<News {...pageProps} />} />
                <Route path="/about" element={<About {...pageProps} />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy {...pageProps} />} />
                <Route path="/picture-credits" element={<PictureCredits {...pageProps} />} />

                {/* Any other address: "page not found" instead of an empty screen */}
                <Route path="*" element={<NotFound {...pageProps} />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>

          {!isGamePage && <Footer isDarkMode={isDarkMode} apiString={API_STRING} />}
          {/* The floating button would cover game pieces and buttons */}
          {!isGamePage && <GurdwaraAccessButton isDarkMode={isDarkMode} apiString={API_STRING} />}
        </>
      )}
    </AuthProvider>
  );
};

// App uses useLocation(), so it has to sit inside the Router
const AppWrapper = () => (
  <Router>
    <App />
  </Router>
);

export default AppWrapper;
