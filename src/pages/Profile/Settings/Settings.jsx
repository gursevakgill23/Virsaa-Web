import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FaMoon, FaSun, FaLanguage, FaBell, FaLock,
  FaDatabase, FaTrash, FaPalette, FaUserShield, FaDesktop, FaKey, FaCheck, FaHistory,
} from 'react-icons/fa';
import PageHero from '../../../components/PageHero/PageHero';
import AccountTabs from '../AccountTabs/AccountTabs';
import { useAuth } from '../../../context/AuthContext';
import accountApi from '../../../api/accountApi';
import { refreshUnread } from '../../../hooks/useUnreadNotifications';
import { LANGUAGES, getLanguage, setLanguage as setSiteLanguage } from '../../../i18n/siteLanguage';
import styles from './Settings.module.css';

const getImagePath = (imagePath) => {
  if (process.env.NODE_ENV === 'production' && typeof imagePath === 'string') {
    return (imagePath.startsWith('/') || /^(https?:|blob:|data:)/i.test(imagePath)) ? imagePath : `/${imagePath.replace(/.*static\/media/, 'static/media')}`;
  }
  return imagePath;
};

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

const NOTIFICATION_ROWS = [
  { key: 'notify_new_content', title: 'New in the library', description: 'New ebooks, audiobooks and authors.' },
  { key: 'notify_updates', title: 'Updates to things you liked or saved', description: 'When a book or author you follow gets new details.' },
  { key: 'notify_learning', title: 'Learning', description: 'New lessons, quizzes and games, and badges you earn.' },
  { key: 'notify_account', title: 'Account', description: 'Membership, password changes and other account messages.' },
];

const THEME_KEY = 'virsaa:theme-choice';
const formatBytes = (n) => {
  if (!n) return '0 MB';
  const mb = n / (1024 * 1024);
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
};

/* One row with a title, a description and a switch */
const SwitchRow = ({ id, title, description, checked, onChange, disabled }) => (
  <div className={styles.settingItem}>
    <div className={styles.settingInfo}>
      <label htmlFor={id} className={styles.settingTitle}>{title}</label>
      <p id={`${id}-desc`}>{description}</p>
    </div>
    <span className={styles.switch}>
      <input id={id} type="checkbox" role="switch" checked={checked} onChange={onChange} disabled={disabled} aria-describedby={`${id}-desc`} />
      <span className={styles.track} aria-hidden="true"><span className={styles.thumb} /></span>
    </span>
  </div>
);

const Settings = ({ isDarkMode, toggleTheme, apiString }) => {
  const headerImage = getImagePath(isDarkMode ? '/images/header-image-dark.png' : '/images/header-image.png');
  const { isLoggedIn, accessToken, logout } = useAuth();
  const navigate = useNavigate();
  const toastTheme = isDarkMode ? 'dark' : 'light';
  const say = (type, text) => toast[type](text, { position: 'top-center', autoClose: 3000, theme: toastTheme });

  const [activeTab, setActiveTab] = useState('general');
  const [selectedTheme, setSelectedTheme] = useState(() => {
    try { return localStorage.getItem(THEME_KEY) || (isDarkMode ? 'dark' : 'light'); } catch { return isDarkMode ? 'dark' : 'light'; }
  });
  const [prefs, setPrefs] = useState(null);
  const [prefsError, setPrefsError] = useState(null);

  // Security
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwSaving, setPwSaving] = useState(false);

  // Storage
  const [storage, setStorage] = useState(null);

  // Privacy
  const [confirmClearHistory, setConfirmClearHistory] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const loadPrefs = useCallback(async () => {
    if (!isLoggedIn || !accessToken) return;
    try {
      setPrefs(await accountApi.settings(apiString, accessToken));
      setPrefsError(null);
    } catch {
      setPrefsError('Your settings couldn’t be loaded right now.');
    }
  }, [apiString, accessToken, isLoggedIn]);

  useEffect(() => { loadPrefs(); }, [loadPrefs]);

  const measureStorage = useCallback(async () => {
    try {
      if (navigator.storage?.estimate) {
        const { usage = 0, quota = 0 } = await navigator.storage.estimate();
        setStorage({ usage, quota });
        return;
      }
    } catch { /* not supported */ }
    setStorage({ usage: 0, quota: 0 });
  }, []);

  useEffect(() => { if (activeTab === 'storage') measureStorage(); }, [activeTab, measureStorage]);

  // ---------- Appearance ----------
  const handleThemeChange = (value) => {
    const wantDark = value === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : value === 'dark';
    if (wantDark !== isDarkMode && typeof toggleTheme === 'function') toggleTheme();
    setSelectedTheme(value);
    try { localStorage.setItem(THEME_KEY, value); } catch { /* ignore */ }
    if (isLoggedIn) accountApi.updateSettings(apiString, accessToken, { theme: wantDark ? 'dark' : 'light' }).catch(() => {});
  };

  const isThemeActive = (value) => {
    if (selectedTheme === 'system') return value === 'system';
    return (value === 'dark' && isDarkMode) || (value === 'light' && !isDarkMode);
  };

  // ---------- Saved switches ----------
  const togglePref = async (key) => {
    const next = !prefs[key];
    setPrefs((p) => ({ ...p, [key]: next }));
    try {
      setPrefs(await accountApi.updateSettings(apiString, accessToken, { [key]: next }));
      if (key.startsWith('notify_')) refreshUnread(); // muted kinds drop out of the count
    } catch {
      setPrefs((p) => ({ ...p, [key]: !next }));
      say('error', 'That setting didn’t save. Try again.');
    }
  };

  // ---------- Password ----------
  const submitPassword = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!pw.current) errors.current = 'Enter your current password.';
    if (pw.next.length < 8) errors.next = 'Use at least 8 characters.';
    if (pw.next !== pw.confirm) errors.confirm = 'The passwords don’t match.';
    setPwErrors(errors);
    if (Object.keys(errors).length) return;
    setPwSaving(true);
    try {
      await accountApi.changePassword(apiString, accessToken, pw.current, pw.next);
      setPw({ current: '', next: '', confirm: '' });
      say('success', 'Password changed');
      refreshUnread();
    } catch (err) {
      const d = err.response?.data || {};
      const first = (v) => (Array.isArray(v) ? v[0] : v);
      setPwErrors({
        current: first(d.current_password),
        next: first(d.new_password) || (!d.current_password && !d.new_password ? 'The password couldn’t be changed. Try again.' : undefined),
      });
    } finally {
      setPwSaving(false);
    }
  };

  // ---------- Storage ----------
  const clearDeviceData = async () => {
    try {
      if (window.caches?.keys) {
        const keys = await window.caches.keys();
        await Promise.all(keys.map((k) => window.caches.delete(k)));
      }
      sessionStorage.clear();
      // Only Virsaa's own saved preferences; sign-in stays
      Object.keys(localStorage).filter((k) => k.startsWith('virsaa')).forEach((k) => localStorage.removeItem(k));
    } catch { /* storage blocked */ }
    say('success', 'Saved data on this device cleared');
    measureStorage();
  };

  // ---------- Privacy ----------
  const clearHistory = async () => {
    setConfirmClearHistory(false);
    try {
      await accountApi.clearHistory(apiString, accessToken);
      say('success', 'History cleared');
    } catch {
      say('error', 'History couldn’t be cleared. Try again.');
    }
  };

  const deleteAccount = async (e) => {
    e.preventDefault();
    if (!deletePassword) { setDeleteError('Enter your password to confirm.'); return; }
    setDeleting(true);
    setDeleteError('');
    try {
      await accountApi.deleteAccount(apiString, accessToken, deletePassword);
      try { await logout?.(); } catch { /* already gone */ }
      say('info', 'Your account was deleted.');
      navigate('/');
    } catch (err) {
      const d = err.response?.data || {};
      setDeleteError((Array.isArray(d.password) ? d.password[0] : d.password) || 'The account couldn’t be deleted. Try again.');
      setDeleting(false);
    }
  };

  const tab = TABS.find((t) => t.id === activeTab);
  const currentLanguage = getLanguage();

  const needLogin = (
    <p className={styles.emptyNote}><Link to="/login">Log in</Link> to change this setting.</p>
  );

  const prefsState = !isLoggedIn ? needLogin
    : prefsError ? (
      <p className={styles.errorText} role="alert">
        {prefsError} <button type="button" className={styles.editLink} onClick={loadPrefs}>Try again</button>
      </p>
    ) : !prefs ? <p className={styles.hint}>Loading…</p> : null;

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

              <div className={`${styles.block} notranslate`} translate="no">
                <h3 className={styles.blockTitle}><FaLanguage aria-hidden="true" /> Language</h3>
                <label htmlFor="language" className={styles.srOnly}>Language</label>
                <select
                  id="language"
                  className={`${styles.select} ${styles.narrow}`}
                  value={currentLanguage}
                  onChange={(e) => setSiteLanguage(e.target.value)}
                >
                  {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
                <p className={styles.hint}>The whole website switches language. Gurbani and the word games stay as written.</p>
              </div>
            </>
          )}

          {activeTab === 'notifications' && (
            prefsState || (
              <div className={styles.rows}>
                {NOTIFICATION_ROWS.map((row) => (
                  <SwitchRow
                    key={row.key}
                    id={`n-${row.key}`}
                    title={row.title}
                    description={row.description}
                    checked={Boolean(prefs[row.key])}
                    onChange={() => togglePref(row.key)}
                  />
                ))}
              </div>
            )
          )}

          {activeTab === 'security' && (
            !isLoggedIn ? needLogin : (
              <form className={styles.block} onSubmit={submitPassword} noValidate>
                <h3 className={styles.blockTitle}><FaKey aria-hidden="true" /> Change password</h3>
                {[
                  { key: 'current', label: 'Current password', auto: 'current-password' },
                  { key: 'next', label: 'New password', auto: 'new-password' },
                  { key: 'confirm', label: 'Confirm new password', auto: 'new-password' },
                ].map((f) => (
                  <label key={f.key} className={styles.field} htmlFor={`pw-${f.key}`}>
                    <span className={styles.fieldLabel}>{f.label}</span>
                    <input
                      id={`pw-${f.key}`}
                      type="password"
                      autoComplete={f.auto}
                      value={pw[f.key]}
                      onChange={(e) => setPw((p) => ({ ...p, [f.key]: e.target.value }))}
                      className={`${styles.input} ${pwErrors[f.key] ? styles.inputError : ''}`}
                      aria-invalid={Boolean(pwErrors[f.key])}
                      aria-describedby={pwErrors[f.key] ? `pw-${f.key}-err` : undefined}
                    />
                    {pwErrors[f.key] && <span id={`pw-${f.key}-err`} className={styles.errorText}>{pwErrors[f.key]}</span>}
                  </label>
                ))}
                <div className={styles.actions}>
                  <button type="submit" className={styles.primaryButton} disabled={pwSaving}>
                    {pwSaving ? 'Changing…' : 'Change password'}
                  </button>
                  <Link to="/forgot-password" className={styles.editLink}>Forgot your current password?</Link>
                </div>
              </form>
            )
          )}

          {activeTab === 'storage' && (
            <>
              <div className={styles.storage}>
                <div className={styles.storageHead}>
                  <span>Saved on this device</span>
                  <strong>
                    {storage
                      ? storage.quota ? `${formatBytes(storage.usage)} of ${formatBytes(storage.quota)}` : 'Not available in this browser'
                      : 'Checking…'}
                  </strong>
                </div>
                <div className={styles.storageBar} role="progressbar" aria-valuenow={storage?.quota ? Math.round((storage.usage / storage.quota) * 100) : 0} aria-valuemin={0} aria-valuemax={100} aria-label="Storage used">
                  <div className={styles.storageFill} style={{ width: storage?.quota ? `${Math.max(1, Math.min(100, (storage.usage / storage.quota) * 100))}%` : '0%' }} />
                </div>
              </div>
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <span className={styles.settingTitle}>Saved data</span>
                  <p>Cached pages and your preferences on this device. You stay signed in.</p>
                </div>
                <button type="button" className={styles.secondaryButton} onClick={clearDeviceData}>
                  <FaTrash aria-hidden="true" /> Clear
                </button>
              </div>
            </>
          )}

          {activeTab === 'privacy' && (
            prefsState || (
              <>
                <div className={styles.rows}>
                  <SwitchRow
                    id="p-history"
                    title="Save my history"
                    description="Keep a list of what you read, watch and listen to on the History page."
                    checked={Boolean(prefs.save_history)}
                    onChange={() => togglePref('save_history')}
                  />
                  <div className={styles.settingItem}>
                    <div className={styles.settingInfo}>
                      <span className={styles.settingTitle}>Clear history</span>
                      <p>Remove everything from your History page.</p>
                    </div>
                    {confirmClearHistory ? (
                      <span className={styles.actions}>
                        <button type="button" className={styles.secondaryButton} onClick={() => setConfirmClearHistory(false)}>Keep it</button>
                        <button type="button" className={styles.dangerButton} onClick={clearHistory}>Clear history</button>
                      </span>
                    ) : (
                      <button type="button" className={styles.secondaryButton} onClick={() => setConfirmClearHistory(true)}>
                        <FaHistory aria-hidden="true" /> Clear history
                      </button>
                    )}
                  </div>
                </div>

                <div className={styles.danger}>
                  <div>
                    <h3>Delete account</h3>
                    <p>Permanently delete your account, profile, favorites, history, coins and badges. This can’t be undone.</p>
                  </div>
                  {!deleteOpen && (
                    <button type="button" className={styles.dangerButton} onClick={() => setDeleteOpen(true)}>
                      <FaTrash aria-hidden="true" /> Delete account
                    </button>
                  )}
                </div>
                {deleteOpen && (
                  <form className={styles.block} onSubmit={deleteAccount} noValidate>
                    <label className={styles.field} htmlFor="delete-password">
                      <span className={styles.fieldLabel}>Enter your password to confirm</span>
                      <input
                        id="delete-password"
                        type="password"
                        autoComplete="current-password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        className={`${styles.input} ${deleteError ? styles.inputError : ''}`}
                        aria-invalid={Boolean(deleteError)}
                        aria-describedby={deleteError ? 'delete-err' : undefined}
                      />
                      {deleteError && <span id="delete-err" className={styles.errorText}>{deleteError}</span>}
                    </label>
                    <div className={styles.actions}>
                      <button type="button" className={styles.secondaryButton} onClick={() => { setDeleteOpen(false); setDeletePassword(''); setDeleteError(''); }}>
                        Cancel
                      </button>
                      <button type="submit" className={styles.dangerButton} disabled={deleting}>
                        {deleting ? 'Deleting…' : 'Delete my account'}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
