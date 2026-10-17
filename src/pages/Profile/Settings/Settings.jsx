/**
 * pages/Profile/Settings/Settings.jsx
 * -----------------------------------------------------------------------------
 * Account Settings (/account-settings), in sections:
 *   - General: theme (light / dark / match the device) and language
 *   - Notifications: which kinds of notification to receive
 *   - Privacy: save history on/off, clear history, delete the account
 *   - Security: change password
 *   - Storage: how much this site stores on the device, and clearing it
 * Switches save straight away (and switch back if the server refuses).
 * Data: /api/auth/settings/, change-password/, delete-account/ (api/accountApi.js).
 * -----------------------------------------------------------------------------
 */
import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from '../../../utils/notify';
import {
  FaMoon, FaSun, FaLanguage, FaBell, FaLock,
  FaDatabase, FaTrash, FaPalette, FaUserShield, FaDesktop, FaKey, FaCheck, FaHistory,
} from 'react-icons/fa';
import PageHero from '../../../components/PageHero/PageHero';
import AccountTabs from '../AccountTabs/AccountTabs';
import { useAuth } from '../../../context/AuthContext';
import accountApi from '../../../api/accountApi';
import { describeApiError } from '../../../utils/apiError';
import { refreshUnread } from '../../../hooks/useUnreadNotifications';
import { LANGUAGES, getLanguage, setLanguage as setSiteLanguage } from '../../../i18n/siteLanguage';
import styles from './Settings.module.css';

// Converts image paths for the production build (same helper used across pages)
const getImagePath = (imagePath) => {
  if (process.env.NODE_ENV === 'production' && typeof imagePath === 'string') {
    return (imagePath.startsWith('/') || /^(https?:|blob:|data:)/i.test(imagePath)) ? imagePath : `/${imagePath.replace(/.*static\/media/, 'static/media')}`;
  }
  return imagePath;
};

// Theme choices, sections, and the notification switches
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

// Remembers "match the device" on this device
const THEME_KEY = 'virsaa:theme-choice';
// 1536 → "1.5 KB"
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

// After a language change the page reloads; this flag shows "Settings saved" afterwards
const SAVED_FLAG = 'virsaa:settings-saved';

const Settings = ({ isDarkMode, toggleTheme, setTheme, apiString }) => {
  const headerImage = getImagePath(isDarkMode ? '/images/header-image-dark.png' : '/images/header-image.png');
  const { isLoggedIn, accessToken, logout, updateUserData, replaceTokens } = useAuth();
  const navigate = useNavigate();
  const toastTheme = isDarkMode ? 'dark' : 'light';
  // Show a success / error message
  const say = (type, text) => toast[type](text, { position: 'top-center', autoClose: 3000, theme: toastTheme });

  // Open section, theme choice, saved settings and their error
  const [activeTab, setActiveTab] = useState('general');
  // The saved theme choice: "system" if chosen here before, otherwise whatever is showing now
  const [selectedTheme, setSelectedTheme] = useState(() => {
    let stored = null;
    try { stored = localStorage.getItem(THEME_KEY); } catch { /* storage blocked */ }
    return stored === 'system' ? 'system' : (isDarkMode ? 'dark' : 'light');
  });
  const [prefs, setPrefs] = useState(null);
  const [prefsError, setPrefsError] = useState(null);

  // Security
  // Password form
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwSaving, setPwSaving] = useState(false);

  // Storage
  // Storage estimate
  const [storage, setStorage] = useState(null);

  // Privacy
  // Clear-history confirmation and the delete-account form
  const [confirmClearHistory, setConfirmClearHistory] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Load saved settings
  const loadPrefs = useCallback(async () => {
    if (!isLoggedIn || !accessToken) return;
    try {
      setPrefs(await accountApi.settings(apiString, accessToken));
      setPrefsError(null);
    } catch (err) {
      setPrefsError(err.response?.status === 401 ? 'Your session has ended. Log in again.' : describeApiError(err, 'Your settings couldn’t be loaded right now.'));
    }
  }, [apiString, accessToken, isLoggedIn]);

  useEffect(() => { loadPrefs(); }, [loadPrefs]);

  // How much this site stores on the device (browser estimate)
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

  // ---------- Appearance (theme + language), saved with the "Save settings" button ----------
  // Choices on screen that haven't been saved yet
  const [draft, setDraft] = useState(() => ({ theme: selectedTheme, language: getLanguage() }));
  const [savingGeneral, setSavingGeneral] = useState(false);

  // Show "Settings saved" after the reload a language change causes
  useEffect(() => {
    try {
      if (sessionStorage.getItem(SAVED_FLAG)) {
        sessionStorage.removeItem(SAVED_FLAG);
        toast.success('Settings saved', { toastId: 'settings-saved' });
      }
    } catch { /* storage blocked */ }
  }, []);

  /**
   * Save theme and language:
   *   1. signed in: store the theme on the account (so it follows the user to other devices)
   *   2. apply the theme here and remember it on this device
   *   3. switch language last, because that reloads the page
   * If the server refuses, nothing changes and an error explains why.
   */
  const saveGeneral = async () => {
    if (savingGeneral) return;
    const themeChanged = draft.theme !== selectedTheme;
    const languageChanged = draft.language !== getLanguage();
    if (!themeChanged && !languageChanged) return;

    const wantDark = draft.theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : draft.theme === 'dark';
    setSavingGeneral(true);
    try {
      if (themeChanged && isLoggedIn) {
        await accountApi.updateSettings(apiString, accessToken, { theme: wantDark ? 'dark' : 'light' });
        updateUserData?.({ theme_preference: wantDark ? 'dark' : 'light' });
      }
    } catch (err) {
      setSavingGeneral(false);
      say('error', err.response?.status === 401
        ? 'Your session has ended. Log in again to save your settings.'
        : describeApiError(err, 'Your settings couldn’t be saved. Try again.'));
      return;
    }

    if (themeChanged) {
      if (typeof setTheme === 'function') setTheme(wantDark);
      else if (wantDark !== isDarkMode && typeof toggleTheme === 'function') toggleTheme();
      setSelectedTheme(draft.theme);
      try { localStorage.setItem(THEME_KEY, draft.theme); } catch { /* storage blocked */ }
    }

    if (languageChanged) {
      try { sessionStorage.setItem(SAVED_FLAG, '1'); } catch { /* storage blocked */ }
      setSiteLanguage(draft.language); // reloads the page in the new language
      return;
    }
    setSavingGeneral(false);
    say('success', 'Settings saved');
  };

  // Put the choices back to what's saved
  const resetGeneral = () => setDraft({ theme: selectedTheme, language: getLanguage() });

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
    // Same rules as sign-up: 8+ characters with upper case, lower case and a number
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(pw.next)) errors.next = 'Use 8+ characters with upper case, lower case and a number.';
    else if (pw.next === pw.current) errors.next = 'Choose a password different from your current one.';
    if (pw.next !== pw.confirm) errors.confirm = 'The passwords don’t match.';
    setPwErrors(errors);
    if (Object.keys(errors).length) return;
    setPwSaving(true);
    try {
      const result = await accountApi.changePassword(apiString, accessToken, pw.current, pw.next);
      // The server signed every other device out; this one carries on with the new tokens
      replaceTokens?.(result?.access, result?.refresh);
      setPw({ current: '', next: '', confirm: '' });
      say('success', 'Password changed. Any other devices have been signed out.');
      refreshUnread();
    } catch (err) {
      const d = err.response?.data || {};
      const first = (v) => (Array.isArray(v) ? v[0] : v);
      setPwErrors({
        current: first(d.current_password) || (err.response?.status === 401 ? 'Your session has ended. Log in again.' : undefined),
        next: first(d.new_password) || (!d.current_password && !d.new_password && err.response?.status !== 401
          ? describeApiError(err, 'The password couldn’t be changed. Try again.') : undefined),
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
    } catch (err) {
      say('error', describeApiError(err, 'History couldn’t be cleared. Try again.'));
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
      setDeleteError((Array.isArray(d.password) ? d.password[0] : d.password)
        || (err.response?.status === 401 ? 'Your session has ended. Log in again first.' : describeApiError(err, 'The account couldn’t be deleted. Try again.')));
      setDeleting(false);
    }
  };

  const tab = TABS.find((t) => t.id === activeTab);
  const currentLanguage = getLanguage();
  const generalDirty = draft.theme !== selectedTheme || draft.language !== currentLanguage;

  // Shown instead of server settings when signed out, or while they load
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
                    const active = draft.theme === theme.value;
                    return (
                      <button
                        key={theme.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        className={`${styles.themeCard} ${active ? styles.themeActive : ''}`}
                        onClick={() => setDraft((d) => ({ ...d, theme: theme.value }))}
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
                  value={draft.language}
                  onChange={(e) => setDraft((d) => ({ ...d, language: e.target.value }))}
                >
                  {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
                <p className={styles.hint}>The whole website switches language. Gurbani and the word games stay as written.</p>
              </div>

              {/* Save bar: nothing changes until "Save settings" is pressed */}
              <div className={styles.saveBar}>
                <p className={styles.saveStatus} role="status">
                  {generalDirty ? 'You have unsaved changes.' : 'Your settings are saved.'}
                  {!isLoggedIn && ' Sign in to keep your theme on every device.'}
                </p>
                <div className={styles.saveButtons}>
                  <button type="button" className={styles.secondaryButton} onClick={resetGeneral} disabled={!generalDirty || savingGeneral}>
                    Cancel
                  </button>
                  <button type="button" className={styles.primaryButton} onClick={saveGeneral} disabled={!generalDirty || savingGeneral}>
                    {savingGeneral ? 'Saving…' : 'Save settings'}
                  </button>
                </div>
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
                      maxLength={128}
                      onChange={(e) => { setPw((p) => ({ ...p, [f.key]: e.target.value })); if (pwErrors[f.key]) setPwErrors((er) => ({ ...er, [f.key]: undefined })); }}
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
                        maxLength={128}
                        onChange={(e) => { setDeletePassword(e.target.value); if (deleteError) setDeleteError(''); }}
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
