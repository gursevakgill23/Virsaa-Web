import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar/Navbar';
import Sidebar from './components/Sidebar/Sidebar';
import Home from './pages/HomePage/Home';
import Collections from './pages/Collections/Collections';
import Loader from './components/Loader';
import { CssBaseline } from '@mui/material';
import Footer from './components/Footer/Footer';
import './App.css';
import SikhHistory from './pages/SikhHistory/SikhHistory';
import Login from './pages/Login/Login';
import Signup from './pages/Signup/Signup';
import Membership from './pages/Membership/Membership';
import GurdwaraAccess from './pages/GurdwaraAccess/GurdwaraAccess';
import GurdwaraAccessButton from './pages/GurdwaraAccess/GurdwaraAccessButton/GurdwaraAccessButton';
import GurdwaraLocate from './pages/GurdwaraAccess/GurdwaraLocate/GurdwaraLocate';
import GurdwaraServices from './pages/GurdwaraAccess/GurdwaraServices/GurdwaraServices';
import GurdwaraHistory from './pages/GurdwaraAccess/GurdwaraHistory/GurdwaraHistory';
import Gurbani from './pages/Gurbani/Gurbani';
import Learning from './pages/Learning/Learning';
import Cookies from 'js-cookie';
import News from './pages/News/News';
import About from './pages/About/About';
import Quizzes from './pages/Learning/Quizzes/Quizzes';
import EbookDetail from './pages/Collections/EbookDetail/EbookDetail';
import AuthorDetail from './pages/Collections/AuthorDetail/AuthorDetail';
import { AuthProvider, useAuth } from './context/AuthContext';
import AudiobookDetail from './pages/Collections/AudiobookDetail/AudiobookDetail';
import { WordSearchGamePlay } from './pages/Learning/Games/WordSearch/WordSearch';
import MemoryMatch from './pages/Learning/Games/MemoryMatch/MemoryMatch';
import MyProfile from './pages/Profile/MyProfile/MyProfile';
import MyFavorites from './pages/Profile/MyFavorites/MyFavorites';
import Settings from './pages/Profile/Settings/Settings';
import History from './pages/Profile/History/History';
import Notifications from './pages/Profile/Notifications/Notifications';
import CompleteProfile from './pages/Profile/CompleteProfile/CompleteProfile';
import LearningMaterial from './pages/Learning/LearningMaterial/LearningMaterial';

// Define your API base URL
const API_STRING = "http://localhost:8000";

// Component to handle profile completion check
const ProfileRoute = ({ isDarkMode, apiString }) => {
  const { userData } = useAuth();

  // Check if profile is complete
  const isProfileComplete = userData && (
    userData.first_name &&
    userData.last_name &&
    userData.profile_photo &&
    userData.about_me &&
    userData.preferred_content?.length > 0 &&
    userData.dob &&
    userData.gender !== 'prefer_not_to_say'
  );

  return isProfileComplete ? (
    <MyProfile isDarkMode={isDarkMode} apiString={apiString} />
  ) : (
    <CompleteProfile isDarkMode={isDarkMode} apiString={apiString} />
  );
};

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const location = useLocation(); // Get current route

  // Set theme based on cookie value on component mount
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

  // Function to toggle theme
  const toggleTheme = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    Cookies.set('theme', newTheme);
    setIsDarkMode(!isDarkMode);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Check if current route is a game page
  const isGamePage = location.pathname === '/learning/games/shabd-khoj' || 
                    location.pathname === '/learning/games/memory-match';

  return (
    <AuthProvider>
      <CssBaseline />
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={isDarkMode ? "dark" : "light"}
      />
      
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
          <Routes>
            <Route path="/" element={<Home isDarkMode={isDarkMode} apiString={API_STRING} />} />
            <Route path="/home" element={<Home isDarkMode={isDarkMode} apiString={API_STRING} />} />
            <Route path="/collections" element={<Collections isDarkMode={isDarkMode} apiString={API_STRING} />} />
            <Route path="/collections/ebooks" element={<Collections isDarkMode={isDarkMode} apiString={API_STRING} />} />
            <Route path="/collections/audiobooks" element={<Collections isDarkMode={isDarkMode} apiString={API_STRING} />} />
            <Route path="/collections/authors" element={<Collections isDarkMode={isDarkMode} apiString={API_STRING} />} />
            <Route path="/sikh-history" element={<SikhHistory isDarkMode={isDarkMode} apiString={API_STRING} />} />
            <Route path="/gurbani" element={<Gurbani isDarkMode={isDarkMode} apiString={API_STRING} />} />
            <Route path="/learning" element={<Learning isDarkMode={isDarkMode} apiString={API_STRING} />} />
            <Route path="/login" element={<Login isDarkMode={isDarkMode} apiString={API_STRING} />} />
            <Route path="/signup" element={<Signup isDarkMode={isDarkMode} apiString={API_STRING} />} />
            <Route path="/premium" element={<Membership isDarkMode={isDarkMode} apiString={API_STRING} />} />
            <Route path="/gurdwara-access" element={<GurdwaraAccess isDarkMode={isDarkMode} apiString={API_STRING} />} />
            <Route path="/gurdwara-access/locate/:id" element={<GurdwaraLocate isDarkMode={isDarkMode} apiString={API_STRING} />} />
            <Route path="/gurdwara-access/services/:id" element={<GurdwaraServices isDarkMode={isDarkMode} apiString={API_STRING} />} />
            <Route path="/gurdwara-access/history/:id" element={<GurdwaraHistory isDarkMode={isDarkMode} apiString={API_STRING} />} />
            <Route path="/news" element={<News isDarkMode={isDarkMode} apiString={API_STRING} />} />
            <Route path="/about" element={<About isDarkMode={isDarkMode} apiString={API_STRING} />} />
            <Route path="/my-profile" element={<ProfileRoute isDarkMode={isDarkMode} apiString={API_STRING} />} />
            <Route path="/account-settings" element={<Settings isDarkMode={isDarkMode} apiString={API_STRING} toggleTheme={toggleTheme}/>} />
            <Route path="/my-favorites" element={<MyFavorites isDarkMode={isDarkMode} apiString={API_STRING} toggleTheme={toggleTheme}/>} />
            <Route path="/history" element={<History isDarkMode={isDarkMode} apiString={API_STRING} toggleTheme={toggleTheme}/>} />
            <Route path="/notifications" element={<Notifications isDarkMode={isDarkMode} apiString={API_STRING} toggleTheme={toggleTheme}/>} />
            <Route path="/learning/quizzes/:id" element={<Quizzes isDarkMode={isDarkMode} apiString={API_STRING} />} />
            <Route path="/learning-material/:id" element={<LearningMaterial isDarkMode={isDarkMode} apiString={API_STRING} />} />

            <Route path="/collections/ebooks/ebook/:id" element={<EbookDetail isDarkMode={isDarkMode} apiString={API_STRING} />} />
            <Route path="/collections/authors/author/:id" element={<AuthorDetail isDarkMode={isDarkMode} apiString={API_STRING} />} />
            <Route path="/collections/audiobooks/audiobook/:id" element={<AudiobookDetail isDarkMode={isDarkMode} apiString={API_STRING} />} />
            <Route path="/learning/games/shabd-khoj" element={<WordSearchGamePlay isDarkMode={isDarkMode} apiString={API_STRING} />} />
            <Route path="/learning/games/memory-match" element={<MemoryMatch isDarkMode={isDarkMode} apiString={API_STRING} />} />
          </Routes>
          {/* Conditionally render Footer, excluding game pages */}
          {!isGamePage && <Footer isDarkMode={isDarkMode} apiString={API_STRING} />}
          <GurdwaraAccessButton isDarkMode={isDarkMode} apiString={API_STRING} />
        </>
      )}
    </AuthProvider>
  );
};

// Wrap App with Router to provide useLocation context
const AppWrapper = () => (
  <Router>
    <App />
  </Router>
);

export default AppWrapper;