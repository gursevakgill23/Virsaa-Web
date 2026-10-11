import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FaMoon, FaSun, FaLanguage, FaBell, FaLock,
  FaDatabase, FaTrash, FaPalette, FaUserShield, FaDesktop, FaKey, FaCheck,
} from 'react-icons/fa';
import PageHero from '../../../components/PageHero/PageHero';
import AccountTabs from '../AccountTabs/AccountTabs';
import styles from './Settings.module.css';

const getImagePath = (imagePath) => {
  if (process.env.NODE_ENV === 'production' && typeof imagePath === 'string') {
    return imagePath.startsWith('/') ? imagePath : `/${imagePath.replace(/.*static\/media/, 'static/media')}`;
  }
  return imagePath;
};

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'hi', name: 'Hindi' },
  { code: 'es', name: 'Spanish' },
];

const THEMES = [
  { value: 'light', name: 'Light', icon: <FaSun /> },
  { value: 'dark', name: 'Dark', icon: <FaMoon /> },
  { value: 'system', name: 'Match device', icon: <FaDesktop /> },
];

const TABS = [
  { id: 'general', label: 'Appearance', icon: <FaPalette /> },
  { id: 'notifications', label: 'Notifications', icon: <FaBell /> },
  { id: 'security', label: 'Security', icon: <FaLock /> },
  { id: 'storage', label: 'Storage', icon: <FaDatabase /> },
  { id: 'privacy', label: 'Privacy', icon: <FaUserShield /> },
];

/* One row with a title, a description and a switch */
const SwitchRow = ({ id, title, description, checked, onChange }) => (
  <div className={styles.settingItem}>
    <div className={styles.settingInfo}>
      <label htmlFor={id} className={styles.settingTitle}>{title}</label>
      <p id={`${id}-desc`}>{description}</p>
    </div>
    <span className={styles.switch}>
      <input id={id} type="checkbox" role="switch" checked={checked} onChange={onChange} aria-describedby={`${id}-desc`} />
      <span className={styles.track} aria-hidden="true"><span className={styles.thumb} /></span>
    </span>
  </div>
);

const Settings = ({ isDarkMode, toggleTheme }) => {
  const headerImage = getImagePath(isDarkMode ? '/images/header-image-dark.png' : '/images/header-image.png');

  const [activeTab, setActiveTab] = useState('general');
  const [selectedTheme, setSelectedTheme] = useState(isDarkMode ? 'dark' : 'light');
  const [language, setLanguage] = useState('en');
  const [notifications, setNotifications] = useState({ email: true, push: false, weeklyDigest: true });
  const [security, setSecurity] = useState({ twoFactor: false, passwordChangeRequired: false });
  const [privacy, setPrivacy] = useState({ dataCollection: true, personalizedAds: true, visibility: 'only_me' });
  const [cacheSize, setCacheSize] = useState('1.2 GB');

  const toastTheme = isDarkMode ? 'dark' : 'light';

  // App's toggleTheme() flips the theme, so only call it when the result should differ
  const handleThemeChange = (value) => {
    const wantDark = value === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : value === 'dark';
    if (wantDark !== isDarkMode && typeof toggleTheme === 'function') toggleTheme();
    setSelectedTheme(value);
  };

  const isThemeActive = (value) => {
    if (selectedTheme === 'system') return value === 'system';
    return (value === 'dark' && isDarkMode) || (value === 'light' && !isDarkMode);
  };

  const toggle = (setter, key) => () => setter((prev) => ({ ...prev, [key]: !prev[key] }));

  const clearCache = () => {
    setCacheSize('0 MB');
    toast.success('Cache cleared', { position: 'top-center', autoClose: 2000, theme: toastTheme });
  };

  const handleDeleteData = () => {
    toast.info('Deleting account data isn’t available online yet. Contact us from the About page and we’ll do it for you.', {
      position: 'top-center', autoClose: 5000, theme: toastTheme,
    });
  };

  const tab = TABS.find((t) => t.id === activeTab);

  return (
    <div className={styles.page}>
      <PageHero
        compact
        image={headerImage}
        title="Settings"
        subtitle="Make Virsaa look and behave the way you like."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'My profile', to: '/my-profile' }, { label: 'Settings' }]}
      >
        <AccountTabs />
      </PageHero>

      <div className={`${styles.section} ${styles.layout}`}>
        {/* ---------- Section nav ---------- */}
        <nav className={styles.nav} aria-label="Settings sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`${styles.navItem} ${activeTab === t.id ? styles.navActive : ''}`}
              aria-current={activeTab === t.id ? 'true' : undefined}
              onClick={() => setActiveTab(t.id)}
            >
              <span className={styles.navIcon} aria-hidden="true">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>

        {/* ---------- Content ---------- */}
        <div className={styles.content}>
          <h2 className={styles.contentTitle}>{tab.label}</h2>

          {activeTab === 'general' && (
            <>
              <div className={styles.block}>
                <h3 className={styles.blockTitle}><FaPalette aria-hidden="true" /> Theme</h3>
                <div className={styles.themes} role="radiogroup" aria-label="Theme">
                  {THEMES.map((theme) => {
                    const active = isThemeActive(theme.value);
                    return (
                      <button
                        key={theme.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        className={`${styles.themeCard} ${active ? styles.themeActive : ''}`}
                        onClick={() => handleThemeChange(theme.value)}
                      >
                        {/* Small preview of the page in that theme */}
                        <span className={`${styles.preview} ${styles[`preview_${theme.value}`]}`} aria-hidden="true">
                          <span className={styles.previewBar} />
                          <span className={styles.previewHero} />
                          <span className={styles.previewLine} />
                          <span className={`${styles.previewLine} ${styles.previewShort}`} />
                        </span>
                        <span className={styles.themeName}>
                          <span aria-hidden="true">{theme.icon}</span> {theme.name}
                          {active && <span className={styles.themeCheck} aria-hidden="true"><FaCheck /></span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={styles.block}>
                <h3 className={styles.blockTitle}><FaLanguage aria-hidden="true" /> Language</h3>
                <label htmlFor="language" className={styles.srOnly}>Language</label>
                <select id="language" className={`${styles.select} ${styles.narrow}`} value={language} onChange={(e) => setLanguage(e.target.value)}>
                  {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
                </select>
                <p className={styles.hint}>Translations are on the way. Some pages are still English only.</p>
              </div>
            </>
          )}

          {activeTab === 'notifications' && (
            <div className={styles.rows}>
              <SwitchRow id="n-email" title="Email notifications" description="Important updates about your account and saved items." checked={notifications.email} onChange={toggle(setNotifications, 'email')} />
              <SwitchRow id="n-push" title="Push notifications" description="Instant alerts in your browser for replies and events." checked={notifications.push} onChange={toggle(setNotifications, 'push')} />
              <SwitchRow id="n-digest" title="Weekly digest" description="One email a week with new books, lessons and events." checked={notifications.weeklyDigest} onChange={toggle(setNotifications, 'weeklyDigest')} />
            </div>
          )}

          {activeTab === 'security' && (
            <>
              <div className={styles.rows}>
                <SwitchRow id="s-2fa" title="Two-factor authentication" description="Ask for a code from your phone when you sign in." checked={security.twoFactor} onChange={toggle(setSecurity, 'twoFactor')} />
                <SwitchRow id="s-pw" title="Regular password change" description="Remind me to change my password every 90 days." checked={security.passwordChangeRequired} onChange={toggle(setSecurity, 'passwordChangeRequired')} />
              </div>
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <span className={styles.settingTitle}>Password</span>
                  <p>We’ll email you a code to set a new one.</p>
                </div>
                <Link to="/forgot-password" className={styles.secondaryButton}>
                  <FaKey aria-hidden="true" /> Change password
                </Link>
              </div>
            </>
          )}

          {activeTab === 'storage' && (
            <>
              <div className={styles.storage}>
                <div className={styles.storageHead}>
                  <span>Storage used</span>
                  <strong>1.2 GB of 3.5 GB</strong>
                </div>
                <div className={styles.storageBar} role="progressbar" aria-valuenow={35} aria-valuemin={0} aria-valuemax={100} aria-label="Storage used">
                  <div className={styles.storageFill} style={{ width: '35%' }} />
                </div>
              </div>
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <span className={styles.settingTitle}>Cache</span>
                  <p>Temporary files that make pages and audio load faster. Currently {cacheSize}.</p>
                </div>
                <button type="button" className={styles.secondaryButton} onClick={clearCache} disabled={cacheSize === '0 MB'}>
                  <FaTrash aria-hidden="true" /> Clear cache
                </button>
              </div>
            </>
          )}

          {activeTab === 'privacy' && (
            <>
              <div className={styles.rows}>
                <SwitchRow id="p-data" title="Usage data" description="Share anonymous usage data to help us improve Virsaa." checked={privacy.dataCollection} onChange={toggle(setPrivacy, 'dataCollection')} />
                <SwitchRow id="p-ads" title="Personalized recommendations" description="Suggest books and lessons based on what you open." checked={privacy.personalizedAds} onChange={toggle(setPrivacy, 'personalizedAds')} />
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <label htmlFor="visibility" className={styles.settingTitle}>Who can see your activity</label>
                    <p>Your reading history and favorites.</p>
                  </div>
                  <select id="visibility" className={`${styles.select} ${styles.inlineSelect}`} value={privacy.visibility} onChange={(e) => setPrivacy((p) => ({ ...p, visibility: e.target.value }))}>
                    <option value="only_me">Only me</option>
                    <option value="friends">Friends</option>
                    <option value="public">Everyone</option>
                  </select>
                </div>
              </div>

              <div className={styles.danger}>
                <div>
                  <h3>Delete account data</h3>
                  <p>Remove your profile, favorites and history from Virsaa.</p>
                </div>
                <button type="button" className={styles.dangerButton} onClick={handleDeleteData}>
                  <FaTrash aria-hidden="true" /> Delete data
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
