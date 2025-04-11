import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import { AuthProvider } from './context/AuthContext';
import ChatButton from './pages/Login/ChatWithUs/ChatButton/ChatButton';
import AudiobookDetail from './pages/Collections/AudiobookDetail/AudiobookDetail';
import Account from './pages/Profile/Account/Account';
import Settings from './pages/Profile/Settings/Settings';


// Define your API base URL
const API_STRING = "http://localhost:5118";

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

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

  return (
    <AuthProvider>
    <Router>
      <CssBaseline />
      {/* ToastContainer should be placed here at the root level */}
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
            <Route path="/account" element={<Account isDarkMode={isDarkMode} apiString={API_STRING} />} />
            <Route path="/settings" element={<Settings isDarkMode={isDarkMode} apiString={API_STRING} toggleTheme={toggleTheme}/>} />
            <Route path="/quizzes/:id" element={<Quizzes isDarkMode={isDarkMode} apiString={API_STRING} />} />
            <Route path="/collections/ebooks/ebook/:id" element={<EbookDetail isDarkMode={isDarkMode} apiString={API_STRING} />} />
            <Route path="/collections/authors/author/:id" element={<AuthorDetail isDarkMode={isDarkMode} apiString={API_STRING} />} />
            <Route path="/collections/audiobooks/audiobook/:id" element={<AudiobookDetail isDarkMode={isDarkMode} apiString={API_STRING} />} />
          </Routes>
          <Footer isDarkMode={isDarkMode} apiString={API_STRING} />
          <GurdwaraAccessButton isDarkMode={isDarkMode} apiString={API_STRING} />
          <ChatButton isDarkMode={isDarkMode} apiString={API_STRING} />

        </>
      )}
    </Router>
    </AuthProvider>
  );
};

export default App;