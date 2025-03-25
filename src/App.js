import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import Gurbani from './pages/Gurbani/Gurbani';
import Learning from './pages/Learning/Learning';
import Cookies from 'js-cookie';
import News from './pages/News/News';
import About from './pages/About/About';
import Quizzes from './pages/Learning/Quizzes/Quizzes';

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
    <Router>
      <CssBaseline />
      {isLoading ? (
        <Loader onLoadingComplete={handleLoadingComplete} />
      ) : (
        <>
          <Navbar toggleSidebar={toggleSidebar} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
          <Sidebar open={isSidebarOpen} closeSidebar={closeSidebar} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
          <Routes>
            <Route path="/" element={<Home isDarkMode={isDarkMode} />} />
            <Route path="/home" element={<Home isDarkMode={isDarkMode} />} />
            <Route path="/collections/ebooks" element={<Collections isDarkMode={isDarkMode} />} />
            <Route path="/collections/audiobooks" element={<Collections isDarkMode={isDarkMode} />} />
            <Route path="/collections/authors" element={<Collections isDarkMode={isDarkMode} />} />
            <Route path="/sikh-history" element={<SikhHistory isDarkMode={isDarkMode} />} />
            <Route path="/gurbani" element={<Gurbani isDarkMode={isDarkMode} />} />
            <Route path="/learning" element={<Learning isDarkMode={isDarkMode} />} />
            <Route path="/login" element={<Login isDarkMode={isDarkMode} />} />
            <Route path="/signup" element={<Signup isDarkMode={isDarkMode} />} />
            <Route path="/membership" element={<Membership isDarkMode={isDarkMode} />} />
            <Route path="/gurdwara-access" element={<GurdwaraAccess isDarkMode={isDarkMode} />} />
            <Route path="/news" element={<News isDarkMode={isDarkMode} />} />
            <Route path="/about" element={<About isDarkMode={isDarkMode} />} />
            <Route path="/quizzes/:id" element={<Quizzes isDarkMode={isDarkMode} />} />

          </Routes>
          <Footer isDarkMode={isDarkMode} />
          <GurdwaraAccessButton isDarkMode={isDarkMode} />
        </>
      )}
    </Router>
  );
};

export default App;