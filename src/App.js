/**
 * src/App.js
 * -----------------------------------------------------------------------------
 * The root of the Virsaa web app. It:
 *   - shows the Virsaa splash loader once while the app starts,
 *   - keeps the light/dark theme (saved in the "theme" cookie),
 *   - renders the navbar, side panel, footer and floating Gurdwara button,
 *   - maps every URL to its page (the <Routes> list below),
 *   - plays the quick Virsaa loader on every page change,
 *   - catches page crashes with <ErrorBoundary> so one broken page never
 *     blanks the whole site,
 *   - mounts <NotificationLayer>, which draws all toast.*() messages.
 *
 * Pages are loaded on demand (React.lazy), so the first visit downloads only
 * the code for the page being opened. While a page's code downloads, the
 * Virsaa loader is shown (Suspense fallback).
 * -----------------------------------------------------------------------------
 */
import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import Cookies from 'js-cookie';
import Navbar from './components/Navbar/Navbar';
import Sidebar from './components/Sidebar/Sidebar';
import Footer from './components/Footer/Footer';
import Loader from './components/VirsaaLoader/Loader';
import NotificationLayer from './components/NotificationLayer/NotificationLayer';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import GurdwaraAccessButton from './pages/GurdwaraAccess/GurdwaraAccessButton/GurdwaraAccessButton';
import { AuthProvider } from './context/AuthContext';
import './App.css';

// ---------------------------------------------------------------- pages (loaded on demand)
const Home = lazy(() => import('./pages/HomePage/Home'));
const Collections = lazy(() => import('./pages/Collections/Collections'));
const SikhHistory = lazy(() => import('./pages/SikhHistory/SikhHistory'));
const Login = lazy(() => import('./pages/Login/Login'));
const Signup = lazy(() => import('./pages/Signup/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword/ForgotPassword'));
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

  // Switch theme and remember it in the "theme" cookie.
  // SameSite=Lax keeps the cookie out of cross-site requests; Secure on HTTPS.
  const toggleTheme = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    Cookies.set('theme', newTheme, { sameSite: 'Lax', secure: window.location.protocol === 'https:' });
    setIsDarkMode(!isDarkMode);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

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

  const isGamePage = GAME_PATHS.includes(location.pathname);

  // Every page gets the same two props
  const pageProps = { isDarkMode, apiString: API_STRING };

  return (
    <AuthProvider apiString={API_STRING}>
      <CssBaseline />
      {/* Success / error messages from toast.*() (utils/notify.js) */}
      <NotificationLayer />

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

                {/* Account */}
                <Route path="/login" element={<Login {...pageProps} />} />
                <Route path="/signup" element={<Signup {...pageProps} />} />
                <Route path="/forgot-password" element={<ForgotPassword {...pageProps} />} />
                <Route path="/forgot-password/:email/:token" element={<ForgotPassword {...pageProps} />} />
                <Route path="/my-profile" element={<ProfileRoute {...pageProps} />} />
                <Route path="/account-settings" element={<Settings {...pageProps} toggleTheme={toggleTheme} />} />
                <Route path="/my-favorites" element={<MyFavorites {...pageProps} toggleTheme={toggleTheme} />} />
                <Route path="/history" element={<History {...pageProps} toggleTheme={toggleTheme} />} />
                <Route path="/notifications" element={<Notifications {...pageProps} toggleTheme={toggleTheme} />} />

                {/* Membership and payments */}
                <Route path="/premium" element={<Membership {...pageProps} />} />
                <Route path="/checkout" element={<Checkout {...pageProps} />} />
                <Route path="/payment/:reference" element={<Payment {...pageProps} />} />

                {/* Information */}
                <Route path="/news" element={<News {...pageProps} />} />
                <Route path="/about" element={<About {...pageProps} />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy {...pageProps} />} />

                {/* Any other address: "page not found" instead of an empty screen */}
                <Route path="*" element={<NotFound {...pageProps} />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>

          {!isGamePage && <Footer isDarkMode={isDarkMode} apiString={API_STRING} />}
          <GurdwaraAccessButton isDarkMode={isDarkMode} apiString={API_STRING} />
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
