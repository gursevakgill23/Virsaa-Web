import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './Navbar.module.css';
import { FaBars, FaSearch, FaTimes, FaMoon, FaSun } from 'react-icons/fa';
import virsaa_logo from '../../images/logo.png';
import result_image from '../../images/search_result.jpeg';

const Navbar = ({ toggleSidebar, isDarkMode, toggleTheme }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const navigate = useNavigate();

  const handleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
  };

  const closeSearch = () => {
    setShowSearch(false);
  };

  const openLogin = () => {
    navigate('/login');
  };

  const openMembership = () => {
    navigate('/membership');
  };

  // Disable main page scroll when search is open
  useEffect(() => {
    if (showSearch) {
      document.body.classList.add(styles.noScroll);
    } else {
      document.body.classList.remove(styles.noScroll);
    }

    return () => {
      document.body.classList.remove(styles.noScroll);
    };
  }, [showSearch]);

  return (
    <>
      <nav className={styles.navbar}>
        {/* Left Side: Logo */}
        <div className={styles.logo}>
          <img src={virsaa_logo} className="logo-image" alt="" />
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

        {/* Right Side: Search, Menu Icon, Theme Toggle, and Buttons */}
        <div className={styles.navRight}>
          <button className={styles.searchIcon} onClick={toggleSearch}>
            <FaSearch />
          </button>
          <button className={styles.themeToggle} onClick={toggleTheme}>
            {isDarkMode ? <FaSun /> : <FaMoon />} {/* Toggle between Moon and Sun icons */}
          </button>
          <button className={styles.menuIcon} onClick={toggleSidebar}>
            <FaBars />
          </button>
          <button onClick={openLogin} className={styles.loginButton}>
            Login
          </button>
          <button onClick={openMembership} className={styles.getPremiumButton}>
            Premium
          </button>
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
                <img src={result_image} alt="Result" className={styles.resultImage} />
                <div className={styles.resultContent}>
                  <h3>Result Title {index + 1}</h3>
                  <p>This is a description for Result {index + 1}.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;