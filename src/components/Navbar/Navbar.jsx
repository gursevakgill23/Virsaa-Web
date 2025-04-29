import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './Navbar.module.css';
import { 
  FaBars, 
  FaSearch, 
  FaTimes, 
  FaMoon, 
  FaSun,
  FaUser,
  FaUserCog,
  FaHeart,
  FaCrown,
  FaHistory,
  FaSignOutAlt,
  FaBell,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const useProductionImagePath = () => {
  return (imagePath) => {
    if (process.env.NODE_ENV === 'production') {
      if (typeof imagePath === 'string') {
        return imagePath.startsWith('/')
          ? imagePath
          : `/${imagePath.replace(/.*static\/media/, 'static/media')}`;
      } else {
        return imagePath.default || imagePath;
      }
    }
    return imagePath;
  };
};


const Navbar = ({ toggleSidebar, isDarkMode, toggleTheme }) => {
  const logo_virsaa = '/images/logo.png'
  const result_image = '/images/search_result.jpeg';
  const userImage = '/images/Login/user-placeholder.jpg';

  const getImagepath = useProductionImagePath();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showProfileSidebar, setShowProfileSidebar] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const navbarRef = useRef(null);
  const navigate = useNavigate();
  
  const { isLoggedIn, userData, logout } = useAuth();

  const handleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
  };

  const closeSearch = () => {
    setShowSearch(false);
  };

  const toggleProfileSidebar = () => {
    setShowProfileSidebar(!showProfileSidebar);
  };

  const handleLogout = () => {
    logout();
    setShowProfileSidebar(false);
    navigate('/login');
  };

  useEffect(() => {
    if (showSearch || showProfileSidebar) {
      document.body.classList.add(styles.noScroll);
    } else {
      document.body.classList.remove(styles.noScroll);
    }

    return () => {
      document.body.classList.remove(styles.noScroll);
    };
  }, [showSearch, showProfileSidebar]);


  // Touch event handlers for swipe to open
  const handleTouchStart = (e) => {
    if (window.innerWidth > 480) return;
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (!touchStart || window.innerWidth > 480) return;
    const touchEnd = e.touches[0].clientX;
    const difference = touchStart - touchEnd;
    if (difference > 50) { // Swipe left to right
      toggleSidebar();
      setTouchStart(null);
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
  };

  return (
    <>
      <nav 
        className={styles.navbar} 
        ref={navbarRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Left Side: Logo and Arrow Button */}
        <div className={styles.leftSection}>
        <div className={styles.logoContainer}>
          <img 
            src={getImagepath(logo_virsaa)} 
            alt="VIRSAA Logo" 
            className={styles.logoImage}
          />
        </div>

        </div>

        {/* Center: Nav Links */}
        <div className={styles.navLinks}>
          <Link to="/home">Home</Link>
          <div className={styles.dropdown} onMouseEnter={handleDropdown} onMouseLeave={handleDropdown}>
            <Link to="/collections/ebooks">Collections</Link>
            {showDropdown && (
              <div className={styles.dropdownContent}>
                <Link to="/collections/ebooks">Ebooks</Link>
                <Link to="/collections/audiobooks">Audiobooks</Link>
                <Link to="/collections/authors">Authors</Link>
              </div>
            )}
          </div>
          <Link to="/sikh-history">Sikh History</Link>
          <Link to="/gurbani">Gurbani</Link>
          <Link to="/learning">Learning</Link>
          <Link to="/news">News</Link>
          <Link to="/about">About</Link>
        </div>

        {/* Right Side: Search, Menu Icon, Theme Toggle, and User Profile */}
        <div className={styles.navRight}>
          <button className={styles.searchIcon} onClick={toggleSearch}>
            <FaSearch />
          </button>
          <button className={styles.themeToggle} onClick={toggleTheme}>
            {isDarkMode ? <FaSun /> : <FaMoon />}
          </button>
          <button className={styles.menuIcon} onClick={toggleSidebar}>
            <FaBars />
          </button>
          
          {isLoggedIn ? (
            <div className={styles.userProfile} onClick={toggleProfileSidebar}>
              <img 
                src={getImagepath(userData?.profileImage || userImage)} 
                alt="User" 
                className={styles.userImage}
              />
            </div>
          ) : (
            <>
              <button onClick={() => navigate('/login')} className={styles.loginButton}>
                Login
              </button>
              <button onClick={() => navigate('/premium')} className={styles.getPremiumButton}>
                Premium
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Search Section */}
      {showSearch && (
        <div className={styles.searchSection}>
          <form className={styles.searchForm}>
            <input
              type="text"
              placeholder="What are you looking for ?"
              className={styles.searchInput}
            />
            <button type="submit" className={styles.searchButton}>
              Submit
            </button>
            <button type="button" className={styles.closeButton} onClick={closeSearch}>
              <FaTimes />
            </button>
          </form>

          {/* Results List */}
          <div className={styles.resultsList}>
            {[...Array(8)].map((_, index) => (
              <div key={index} className={styles.resultItem}>
                <img src={getImagepath(result_image)} alt="Result" className={styles.resultImage} />
                <div className={styles.resultContent}>
                  <h3>Result Title {index + 1}</h3>
                  <p>This is a description for Result {index + 1}.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Profile Sidebar */}
      {showProfileSidebar && (
        <div className={styles.profileSidebar}>
          <div className={styles.sidebarHeader}>
            <button className={styles.closeSidebar} onClick={toggleProfileSidebar}>
              <FaTimes />
            </button>
          </div>
          
          <div className={styles.userInfo}>
            <img 
              src={getImagepath(userData?.profileImage || userImage)} 
              alt="User" 
              className={styles.sidebarUserImage}
            />
            <h3>{userData?.username || 'User'}</h3>
            <p>{userData?.email || ''}</p>
          </div>
          
          <div className={styles.sidebarMenu}>
            <Link to="/my-profile" className={styles.menuItem} onClick={() => setShowProfileSidebar(false)}>
              <span>My Profile</span>
              <FaUser className={styles.sidebarMenuIcon} />
            </Link>
            
            <Link to="/account-settings" className={styles.menuItem} onClick={() => setShowProfileSidebar(false)}>
              <span>Account Settings</span>
              <FaUserCog className={styles.sidebarMenuIcon} />
            </Link>
            
            <Link to="/my-favorites" className={styles.menuItem} onClick={() => setShowProfileSidebar(false)}>
              <span>My Favorites</span>
              <FaHeart className={styles.sidebarMenuIcon} />
            </Link>
            
            <Link to="/history" className={styles.menuItem} onClick={() => setShowProfileSidebar(false)}>
              <span>History</span>
              <FaHistory className={styles.sidebarMenuIcon} />
            </Link>

            <Link to="/notifications" className={styles.menuItem} onClick={() => setShowProfileSidebar(false)}>
              <span>Notifications</span>
              <FaBell className={styles.sidebarMenuIcon} />
            </Link>
            
            <Link to="/premium" className={styles.menuItem} onClick={() => setShowProfileSidebar(false)}>
              <span>Get Premium</span>
              <FaCrown className={styles.sidebarMenuIcon} />
            </Link>
            
            <button 
              onClick={handleLogout} 
              className={`${styles.menuItem} ${styles.logoutButton}`}
            >
              <span>Logout</span>
              <FaSignOutAlt className={styles.sidebarMenuIcon} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;