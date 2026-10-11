import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
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
  FaChevronRight,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import SearchPalette from './SearchPalette';
import useMembership from '../../hooks/useMembership';
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher';
import useUnreadNotifications, { refreshUnread } from '../../hooks/useUnreadNotifications';

const useProductionImagePath = () => {
  return (imagePath) => {
    if (process.env.NODE_ENV === 'production') {
      if (typeof imagePath === 'string') {
        return (imagePath.startsWith('/') || /^(https?:|blob:|data:)/i.test(imagePath))
          ? imagePath
          : `/${imagePath.replace(/.*static\/media/, 'static/media')}`;
      } else {
        return imagePath.default || imagePath;
      }
    }
    return imagePath;
  };
};

const userImage = '/images/Login/user-placeholder.jpg';

const Navbar = ({ toggleSidebar, isDarkMode, toggleTheme, apiString }) => {
  const logo_virsaa = '/images/logo.png';
  const getImagePath = useProductionImagePath();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showProfileSidebar, setShowProfileSidebar] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const navbarRef = useRef(null);
  const navigate = useNavigate();
  const { isLoggedIn, userData, accessToken, logout } = useAuth();
  const membership = useMembership(apiString);
  const refreshMembership = membership.refresh;
  const unread = useUnreadNotifications(apiString);
  const unreadLabel = unread > 99 ? '99+' : String(unread);

  // Check the plan and notifications again each time the account panel opens
  useEffect(() => {
    if (showProfileSidebar) {
      refreshMembership();
      refreshUnread();
    }
  }, [showProfileSidebar, refreshMembership]);

  // What the plan card in the account panel says
  const planCard = (() => {
    switch (membership.plan) {
      case 'premium':
        return { title: 'Change plan', text: 'You have every feature. Switch to Standard or Basic anytime.' };
      case 'standard':
        return { title: 'Upgrade or downgrade', text: 'Upgrade to Premium for unlimited downloads, or switch to Basic.' };
      case 'basic':
        return { title: 'Upgrade your plan', text: 'Get every ebook, audiobook and lesson, ad-free' };
      default:
        return { title: 'Get Premium', text: 'Every ebook, audiobook and lesson, ad-free' };
    }
  })();
  // Latest values for the profile fetch, so it only re-runs when the panel opens
  const latest = useRef({});
  latest.current = { logout, navigate, isDarkMode, userData };

  // Fetch profile data when the profile sidebar is opened
  useEffect(() => {
    if (showProfileSidebar && accessToken) {
      const { logout: doLogout, navigate: go, isDarkMode: dark, userData: user } = latest.current;
      const fetchProfile = async () => {
        try {
          const response = await fetch(`${apiString}/api/auth/profile/`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.status === 401) {
            await doLogout();
            go('/login');
            toast.error('Session expired. Please log in again.', {
              position: 'top-center',
              autoClose: 3000,
              theme: dark ? 'dark' : 'light',
            });
            return;
          }

          if (!response.ok) {
            throw new Error('Failed to fetch profile data');
          }

          const data = await response.json();
          setProfileData({
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            profile_photo: data.profile_photo || userImage,
            email: data.email || user?.email || '',
          });
        } catch (error) {
          console.error('Error fetching profile data:', error);
          toast.error('Failed to load profile data.', {
            position: 'top-center',
            autoClose: 3000,
            theme: dark ? 'dark' : 'light',
          });
          setProfileData({
            first_name: user?.first_name || '',
            last_name: user?.last_name || '',
            profile_photo: user?.profile_photo || userImage,
            email: user?.email || '',
          });
        }
      };

      fetchProfile();
    }
  }, [showProfileSidebar, accessToken, apiString]);

  const handleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
  };

  const closeSearch = () => {
    setShowSearch(false);
  };

  // Ctrl/Cmd + K or "/" opens search from anywhere
  useEffect(() => {
    const onKey = (e) => {
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.isContentEditable;
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const toggleProfileSidebar = () => {
    setShowProfileSidebar(!showProfileSidebar);
  };

  const closeProfileSidebar = () => setShowProfileSidebar(false);

  // Close the account panel with Escape, like the events sidebar
  useEffect(() => {
    if (!showProfileSidebar) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setShowProfileSidebar(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showProfileSidebar]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully!', {
        position: 'top-center',
        autoClose: 2000,
        theme: isDarkMode ? 'dark' : 'light',
      });
      setShowProfileSidebar(false);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Logout failed. Please try again.', {
        position: 'top-center',
        autoClose: 5000,
        theme: isDarkMode ? 'dark' : 'light',
      });
    }
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

  const handleTouchStart = (e) => {
    if (window.innerWidth > 480) return;
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (!touchStart || window.innerWidth > 480) return;
    const touchEnd = e.touches[0].clientX;
    const difference = touchStart - touchEnd;
    if (difference > 50) {
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
        <div className={styles.leftSection}>
          <div className={`${styles.logoContainer} notranslate`} translate="no">
            <img 
              src={getImagePath(logo_virsaa)} 
              alt="VIRSAA Logo" 
              className={styles.logoImage}
            />
          </div>
        </div>

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

        <div className={styles.navRight}>
          <button className={styles.searchIcon} onClick={toggleSearch} aria-label="Search (Ctrl+K)">
            <FaSearch />
          </button>
          <LanguageSwitcher />
          <button className={styles.themeToggle} onClick={toggleTheme}>
            {isDarkMode ? <FaSun /> : <FaMoon />}
          </button>
          <button className={styles.menuIcon} onClick={toggleSidebar}>
            <FaBars />
          </button>
          
          {isLoggedIn ? (
            <button
              type="button"
              className={styles.userProfile}
              onClick={toggleProfileSidebar}
              aria-label={unread > 0 ? `Open account menu, ${unread} unread notifications` : 'Open account menu'}
              aria-expanded={showProfileSidebar}
            >
              {unread > 0 && <span className={styles.avatarBadge} aria-hidden="true">{unreadLabel}</span>}
              <img 
                src={getImagePath(profileData?.profile_photo || userData?.profile_photo || userImage)} 
                alt="" 
                className={styles.userImage}
              />
            </button>
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

      {showSearch && <SearchPalette onClose={closeSearch} apiString={apiString} />}

      {/* Account panel: floating glass that slides in from the right, mirroring the events sidebar */}
      {isLoggedIn && (
        <>
          <div
            className={`${styles.accountBackdrop} ${showProfileSidebar ? styles.accountBackdropVisible : ''}`}
            onClick={closeProfileSidebar}
            aria-hidden="true"
          />
          <aside
            className={`${styles.accountPanel} ${showProfileSidebar ? styles.accountPanelOpen : ''}`}
            aria-hidden={!showProfileSidebar}
            aria-label="Account"
          >
            <header className={styles.accountHeader}>
              <p className={styles.accountGreeting}>Your account</p>
              <button type="button" className={styles.accountClose} onClick={closeProfileSidebar} aria-label="Close account menu">
                <FaTimes />
              </button>
            </header>

            <div className={styles.accountBody}>
              <section className={styles.accountCard}>
                <img
                  src={getImagePath(profileData?.profile_photo || userData?.profile_photo || userImage)}
                  alt=""
                  className={styles.accountAvatar}
                />
                <div className={styles.accountWho}>
                  <h3>
                    {profileData?.first_name && profileData?.last_name
                      ? `${profileData.first_name} ${profileData.last_name}`
                      : userData?.first_name && userData?.last_name
                        ? `${userData.first_name} ${userData.last_name}`
                        : userData?.username || 'Your account'}
                  </h3>
                  {(profileData?.email || userData?.email) && <p>{profileData?.email || userData?.email}</p>}
                  {membership.isMember && (
                    <span className={styles.planChip}><FaCrown aria-hidden="true" /> {membership.planName} member</span>
                  )}
                </div>
              </section>

              <nav className={styles.accountLinks} aria-label="Account pages">
              <Link to="/my-profile" className={styles.accountLink} onClick={closeProfileSidebar}>
                <span className={styles.accountLinkIcon}><FaUser /></span>
                <span>My Profile</span>
                <FaChevronRight className={styles.accountLinkArrow} aria-hidden="true" />
              </Link>
              <Link to="/account-settings" className={styles.accountLink} onClick={closeProfileSidebar}>
                <span className={styles.accountLinkIcon}><FaUserCog /></span>
                <span>Account Settings</span>
                <FaChevronRight className={styles.accountLinkArrow} aria-hidden="true" />
              </Link>
              <Link to="/my-favorites" className={styles.accountLink} onClick={closeProfileSidebar}>
                <span className={styles.accountLinkIcon}><FaHeart /></span>
                <span>My Favorites</span>
                <FaChevronRight className={styles.accountLinkArrow} aria-hidden="true" />
              </Link>
              <Link to="/history" className={styles.accountLink} onClick={closeProfileSidebar}>
                <span className={styles.accountLinkIcon}><FaHistory /></span>
                <span>History</span>
                <FaChevronRight className={styles.accountLinkArrow} aria-hidden="true" />
              </Link>
              <Link to="/notifications" className={styles.accountLink} onClick={closeProfileSidebar}>
                <span className={styles.accountLinkIcon}><FaBell /></span>
                <span>Notifications</span>
                {unread > 0 && (
                  <span className={styles.linkCount}>
                    {unreadLabel}<span className={styles.srOnlyText}> unread</span>
                  </span>
                )}
                <FaChevronRight className={styles.accountLinkArrow} aria-hidden="true" />
              </Link>
              </nav>

              <Link to="/premium" className={styles.premiumCard} onClick={closeProfileSidebar}>
                <span className={styles.premiumIcon} aria-hidden="true"><FaCrown /></span>
                <span>
                  <strong>{planCard.title}</strong>
                  <small>{planCard.text}</small>
                </span>
              </Link>

              <button type="button" onClick={handleLogout} className={styles.accountLogout}>
                <FaSignOutAlt aria-hidden="true" /> Log out
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  );
};

export default Navbar;