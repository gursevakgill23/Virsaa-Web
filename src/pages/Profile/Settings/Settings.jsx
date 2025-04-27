import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaMoon, FaSun, FaLanguage, FaBell, FaLock, 
  FaDatabase, FaTrash, FaPalette, FaUserShield,
  FaChevronDown, FaChevronUp
} from 'react-icons/fa';
import styles from './Settings.module.css';
import header_image_light from '../../../images/Profile/header-image.png';
import header_image_dark from '../../../images/Profile/header-image-dark.png';

const Settings = ({ isDarkMode, toggleTheme }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    weeklyDigest: true
  });
  const [security, setSecurity] = useState({
    twoFactor: false,
    passwordChangeRequired: false
  });
  const [storage, setStorage] = useState({
    cacheSize: '1.2 GB',
    downloadLocation: '/user/downloads'
  });
  const [selectedTheme, setSelectedTheme] = useState(isDarkMode ? 'dark' : 'light');

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'pa', name: 'Punjabi' },
    { code: 'hi', name: 'Hindi' },
    { code: 'es', name: 'Spanish' }
  ];

  const themes = [
    { name: 'Light', icon: <FaSun />, value: 'light' },
    { name: 'Dark', icon: <FaMoon />, value: 'dark' },
    { name: 'System', icon: <FaPalette />, value: 'system' }
  ];

  const tabs = [
    { id: 'general', label: 'General', icon: <FaPalette /> },
    { id: 'notifications', label: 'Notifications', icon: <FaBell /> },
    { id: 'security', label: 'Security', icon: <FaLock /> },
    { id: 'storage', label: 'Storage', icon: <FaDatabase /> },
    { id: 'privacy', label: 'Privacy', icon: <FaUserShield /> }
  ];

  const handleNotificationToggle = (type) => {
    setNotifications(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const handleSecurityToggle = (type) => {
    setSecurity(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const clearCache = () => {
    setStorage(prev => ({ ...prev, cacheSize: '0 MB' }));
    // Actual cache clearing would happen here
  };

  const handleThemeChange = (themeValue) => {
    if (themeValue === 'system') {
      // Detect system preference
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      toggleTheme(systemDark);
      setSelectedTheme('system');
    } else {
      toggleTheme(themeValue === 'dark');
      setSelectedTheme(themeValue);
    }
  };

  // Determine if a theme is currently active
  const isThemeActive = (themeValue) => {
    if (themeValue === 'system') {
      return selectedTheme === 'system';
    }
    return (themeValue === 'dark' && isDarkMode) || (themeValue === 'light' && !isDarkMode);
  };

  return (
    <div className={styles.container}>
      {/* Header - Matches Gurbani page */}
      <div className={styles.header}>
        <img
          src={isDarkMode ? header_image_dark : header_image_light}
          alt="Settings Header"
          className={styles.headerImage}
        />
        <div className={styles.headerText}>
          <h1>SETTINGS</h1>
          <p>Customize your experience</p>
        </div>
      </div>

      {/* Breadcrumb - Matches standard */}
      <div className={styles.breadcrumb}>
        <Link to="/"><span>Home</span></Link> / 
        <Link to="/settings"><span> Settings</span></Link>
      </div>

      <div className={styles.settingsContainer}>
        {/* Settings Sidebar */}
        <div className={styles.sidebar}>
          {/* Mobile dropdown toggle */}
          <div 
            className={styles.mobileMenuToggle}
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            <div className={styles.mobileMenuTitle}>
              {tabs.find(tab => tab.id === activeTab)?.label}
              {showMobileMenu ? <FaChevronUp /> : <FaChevronDown />}
            </div>
          </div>
          
          {/* Desktop tabs and mobile dropdown content */}
          <div className={`${styles.sidebarContent} ${showMobileMenu ? styles.showMobileMenu : ''}`}>
            {tabs.map(tab => (
              <div 
                key={tab.id}
                className={`${styles.sidebarItem} ${activeTab === tab.id ? styles.active : ''}`}
                onClick={() => {
                  setActiveTab(tab.id);
                  setShowMobileMenu(false);
                }}
              >
                {tab.icon} {tab.label}
              </div>
            ))}
          </div>
        </div>

        {/* Settings Content */}
        <div className={styles.content}>
          {activeTab === 'general' && (
            <div className={styles.tabContent}>
              <h2><FaPalette /> Appearance</h2>
              <div className={styles.themeOptions}>
                {themes.map(theme => (
                  <div 
                    key={theme.value}
                    className={`${styles.themeOption} ${isThemeActive(theme.value) ? styles.selected : ''}`}
                    onClick={() => handleThemeChange(theme.value)}
                  >
                    <div className={styles.themeIcon}>{theme.icon}</div>
                    <span>{theme.name}</span>
                    {isThemeActive(theme.value) && (
                      <div className={styles.selectedIndicator}>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <h2><FaLanguage /> Language</h2>
              <div className={styles.languageSelect}>
                <select className={styles.selectInput}>
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className={styles.tabContent}>
              <h2><FaBell /> Notification Preferences</h2>
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <h3>Email Notifications</h3>
                  <p>Receive important updates via email</p>
                </div>
                <label className={styles.toggleSwitch}>
                  <input 
                    type="checkbox" 
                    checked={notifications.email} 
                    onChange={() => handleNotificationToggle('email')} 
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>

              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <h3>Push Notifications</h3>
                  <p>Get instant alerts on your device</p>
                </div>
                <label className={styles.toggleSwitch}>
                  <input 
                    type="checkbox" 
                    checked={notifications.push} 
                    onChange={() => handleNotificationToggle('push')} 
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>

              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <h3>Weekly Digest</h3>
                  <p>Summary of your weekly activity</p>
                </div>
                <label className={styles.toggleSwitch}>
                  <input 
                    type="checkbox" 
                    checked={notifications.weeklyDigest} 
                    onChange={() => handleNotificationToggle('weeklyDigest')} 
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className={styles.tabContent}>
              <h2><FaLock /> Security Settings</h2>
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <h3>Two-Factor Authentication</h3>
                  <p>Add an extra layer of security to your account</p>
                </div>
                <label className={styles.toggleSwitch}>
                  <input 
                    type="checkbox" 
                    checked={security.twoFactor} 
                    onChange={() => handleSecurityToggle('twoFactor')} 
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>

              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <h3>Require Password Change</h3>
                  <p>Force password change every 90 days</p>
                </div>
                <label className={styles.toggleSwitch}>
                  <input 
                    type="checkbox" 
                    checked={security.passwordChangeRequired} 
                    onChange={() => handleSecurityToggle('passwordChangeRequired')} 
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
              <button className={styles.actionButton}>
                <span>Change Password</span>
                <span className={styles.passwordAction}>***********</span>
              </button>
            </div>
          )}

          {activeTab === 'storage' && (
            <div className={styles.tabContent}>
              <h2><FaDatabase /> Storage Management</h2>
              <div className={styles.storageInfo}>
                <div className={styles.storageBar}>
                  <div 
                    className={styles.storageFill}
                    style={{ width: '35%' }}
                  ></div>
                </div>
                <p>1.2 GB of 3.5 GB used</p>
              </div>

              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <h3>Cache Size</h3>
                  <p>Temporary files to improve performance</p>
                </div>
                <span>{storage.cacheSize}</span>
              </div>

              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <h3>Download Location</h3>
                  <p>Where your downloaded files are saved</p>
                </div>
                <span>{storage.downloadLocation}</span>
              </div>

              <div className={styles.storageActions}>
                <button 
                  className={styles.actionButton}
                  onClick={clearCache}
                >
                  <FaTrash /> Clear Cache
                </button>
                <button className={styles.secondaryButton}>
                  Change Download Location
                </button>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className={styles.tabContent}>
              <h2><FaUserShield /> Privacy Settings</h2>
              <div className={styles.privacyOption}>
                <h3>Data Collection</h3>
                <p>Help us improve by sharing anonymous usage data</p>
                <label className={styles.toggleSwitch}>
                  <input type="checkbox" defaultChecked />
                  <span className={styles.slider}></span>
                </label>
              </div>

              <div className={styles.privacyOption}>
                <h3>Personalized Ads</h3>
                <p>See relevant content based on your activity</p>
                <label className={styles.toggleSwitch}>
                  <input type="checkbox" defaultChecked />
                  <span className={styles.slider}></span>
                </label>
              </div>

              <div className={styles.privacyOption}>
                <h3>Activity Visibility</h3>
                <p>Who can see your reading history and favorites</p>
                <select className={styles.selectInput}>
                  <option>Only Me</option>
                  <option>Friends</option>
                  <option>Public</option>
                </select>
              </div>

              <button className={styles.dangerButton}>
                Delete Account Data
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;