/**
 * pages/Profile/History/History.jsx
 * -----------------------------------------------------------------------------
 * History (/history): what the user has read, listened to, watched and
 * played, grouped by day or by type, with progress where known.
 *   - search, select several and delete, remove one, or clear everything
 *   - refreshes every minute and when the tab comes back into view
 *   - shows a note when saving history is turned off in Settings
 * Data: /api/auth/history/ (api/accountApi.js).
 * -----------------------------------------------------------------------------
 */
import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FaTrash, FaSearch, FaTimes, FaBook, FaHeadphones, FaGraduationCap,
  FaQuestionCircle, FaHandsHelping, FaHistory, FaCheck, FaPlayCircle,
} from 'react-icons/fa';
import { toast } from '../../../utils/notify';
import PageHero from '../../../components/PageHero/PageHero';
import AccountTabs from '../AccountTabs/AccountTabs';
import { useAuth } from '../../../context/AuthContext';
import accountApi from '../../../api/accountApi';
import { describeApiError } from '../../../utils/apiError';
import { isInternalPath } from '../../../utils/safeUrl';
import styles from './History.module.css';

// Converts image paths for the production build (same helper used across pages)
const getImagePath = (imagePath) => {
  if (process.env.NODE_ENV === 'production' && typeof imagePath === 'string') {
    return (imagePath.startsWith('/') || /^(https?:|blob:|data:)/i.test(imagePath)) ? imagePath : `/${imagePath.replace(/.*static\/media/, 'static/media')}`;
  }
  return imagePath;
};

// Label and icon per content type
const TYPES = {
  ebook: { label: 'Ebook', icon: <FaBook />, verb: 'read' },
  audiobook: { label: 'Audiobook', icon: <FaHeadphones />, verb: 'listened' },
  lesson: { label: 'Lesson', icon: <FaGraduationCap />, verb: 'done' },
  quiz: { label: 'Quiz', icon: <FaQuestionCircle />, verb: 'done' },
  gurbani: { label: 'Gurbani', icon: <FaHandsHelping />, verb: 'listened' },
  video: { label: 'Video', icon: <FaPlayCircle />, verb: 'watched' },
};
const typeOf = (t) => TYPES[t] || TYPES.lesson;

// How often the list refreshes while open
const POLL_MS = 60000;

// Day grouping helpers ("Today", "Yesterday", weekday + date)
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const daysAgo = (iso) => Math.round((startOfDay(new Date()) - startOfDay(new Date(iso))) / 86400000);
const timeOf = (iso) => new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

const dayLabel = (daysAgoValue) => {
  if (daysAgoValue <= 0) return 'Today';
  if (daysAgoValue === 1) return 'Yesterday';
  const d = new Date();
  d.setDate(d.getDate() - daysAgoValue);
  return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
};

const History = ({ isDarkMode, apiString }) => {
  const headerImage = getImagePath(isDarkMode ? '/images/header-image-dark.png' : '/images/header-image.png');
  const { isLoggedIn, accessToken } = useAuth();

  // Entries, loading/error, the history setting, selection, search, grouping, clear confirmation
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [historyOn, setHistoryOn] = useState(true);
  const [selected, setSelected] = useState(() => new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('byDate'); // 'byDate' | 'byType'
  const [confirmClear, setConfirmClear] = useState(false);

  // Load the history. `quiet` (background refresh) keeps the list if it fails.
  const load = useCallback(async (quiet = false) => {
    if (!isLoggedIn || !accessToken) { setLoading(false); return; }
    if (!quiet) setLoading(true);
    try {
      const data = await accountApi.history(apiString, accessToken);
      const rows = Array.isArray(data?.results) ? data.results : [];
      setItems(rows.map((r) => ({ ...r, type: r.content_type, day: daysAgo(r.accessed_at), time: timeOf(r.accessed_at) })));
      setHistoryOn(data?.save_history !== false);
      setLoadError(null);
    } catch (err) {
      if (!quiet) setLoadError(err.response?.status === 401 ? 'Your session has ended. Log in again.' : describeApiError(err, 'Your history couldn’t be loaded right now.'));
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [apiString, accessToken, isLoggedIn]);

  // Things opened in another tab appear when you come back here
  useEffect(() => {
    load();
    const timer = setInterval(() => { if (document.visibilityState === 'visible') load(true); }, POLL_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') load(true); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, [load]);

  // Put the list back and say so when a delete fails
  const failed = (before) => {
    setItems(before);
    toast.error('That couldn’t be removed. Try again.', { position: 'top-right', autoClose: 2500 });
  };

  // Entries matching the search, then grouped by day or type
  const visible = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return q
      ? items.filter((i) => `${i.title} ${typeOf(i.type).label}`.toLowerCase().includes(q))
      : items;
  }, [items, searchQuery]);

  const groups = useMemo(() => {
    const map = new Map();
    visible.forEach((item) => {
      const key = viewMode === 'byDate' ? item.day : item.type;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return [...map.entries()].map(([key, list]) => ({
      key,
      title: viewMode === 'byDate' ? dayLabel(key) : `${typeOf(key).label}s`,
      icon: viewMode === 'byType' ? typeOf(key).icon : null,
      items: list,
    }));
  }, [visible, viewMode]);

  const selectedCount = selected.size;
  const allVisibleSelected = visible.length > 0 && visible.every((i) => selected.has(i.id));

  // Selection: one entry, or every visible entry
  const toggleItem = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(allVisibleSelected ? new Set() : new Set(visible.map((i) => i.id)));
  };

  // Delete the selected entries (removed at once, restored if the server refuses)
  const deleteSelected = async () => {
    const before = items;
    const ids = [...selected];
    setItems((prev) => prev.filter((i) => !selected.has(i.id)));
    setSelected(new Set());
    try { await accountApi.deleteHistoryMany(apiString, accessToken, ids); } catch { failed(before); }
  };

  // Delete one entry
  const removeItem = async (id) => {
    const before = items;
    setItems((prev) => prev.filter((i) => i.id !== id));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    try { await accountApi.deleteHistory(apiString, accessToken, id); } catch { failed(before); }
  };

  // Clear the whole history (after confirming)
  const clearAll = async () => {
    const before = items;
    setItems([]);
    setSelected(new Set());
    setConfirmClear(false);
    try { await accountApi.clearHistory(apiString, accessToken); } catch { failed(before); }
  };

  return (
    <div className={styles.page}>
      <PageHero
        compact
        image={headerImage}
        title="History"
        subtitle="What you’ve read, listened to and learned recently."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'My profile', to: '/my-profile' }, { label: 'History' }]}
      >
        <AccountTabs />
      </PageHero>

      {/* ---------- Toolbar ---------- */}
      <div className={styles.toolbarWrap}>
        {selectedCount === 0 ? (
          <div className={styles.toolbar}>
            <div className={styles.search}>
              <FaSearch className={styles.searchIcon} aria-hidden="true" />
              <label htmlFor="history-search" className={styles.srOnly}>Search history</label>
              <input
                id="history-search"
                type="search"
                placeholder="Search history"
                maxLength={100}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
              {searchQuery && (
                <button type="button" className={styles.clearSearch} onClick={() => setSearchQuery('')} aria-label="Clear search">
                  <FaTimes />
                </button>
              )}
            </div>
            <div className={styles.segmented} role="group" aria-label="Group history">
              <button type="button" aria-pressed={viewMode === 'byDate'} className={`${styles.segment} ${viewMode === 'byDate' ? styles.segmentOn : ''}`} onClick={() => setViewMode('byDate')}>
                By date
              </button>
              <button type="button" aria-pressed={viewMode === 'byType'} className={`${styles.segment} ${viewMode === 'byType' ? styles.segmentOn : ''}`} onClick={() => setViewMode('byType')}>
                By type
              </button>
            </div>
            {items.length > 0 && (
              <button type="button" className={styles.clearAll} onClick={() => setConfirmClear(true)}>
                <FaTrash aria-hidden="true" /> Clear all
              </button>
            )}
          </div>
        ) : (
          <div className={`${styles.toolbar} ${styles.selectionBar}`}>
            <button type="button" className={styles.selectAll} onClick={toggleAll} aria-pressed={allVisibleSelected}>
              <span className={`${styles.box} ${allVisibleSelected ? styles.boxOn : ''}`} aria-hidden="true">{allVisibleSelected && <FaCheck />}</span>
              {allVisibleSelected ? 'Unselect all' : 'Select all'}
            </button>
            <span className={styles.selectedCount}>{selectedCount} selected</span>
            <button type="button" className={styles.ghostButton} onClick={() => setSelected(new Set())}>Cancel</button>
            <button type="button" className={styles.dangerButton} onClick={deleteSelected}>
              <FaTrash aria-hidden="true" /> Delete
            </button>
          </div>
        )}

        {confirmClear && (
          <div className={styles.confirm} role="alertdialog" aria-labelledby="clear-title">
            <p id="clear-title">Clear your whole history? This can’t be undone.</p>
            <div>
              <button type="button" className={styles.ghostButton} onClick={() => setConfirmClear(false)}>Keep it</button>
              <button type="button" className={styles.dangerButton} onClick={clearAll}>Clear history</button>
            </div>
          </div>
        )}
      </div>

      {/* ---------- Timeline ---------- */}
      <section className={styles.section} aria-label="History">
        {!historyOn && (
          <p className={styles.historyOff} role="status">
            History is turned off, so new things you open aren’t being saved. <Link to="/account-settings">Turn it on in Settings</Link>.
          </p>
        )}
        {!isLoggedIn || loading || loadError || groups.length === 0 ? (
          <div className={styles.emptyState} role={loadError ? 'alert' : undefined}>
            <span className={styles.emptyIcon} aria-hidden="true"><FaHistory /></span>
            <h2>
              {!isLoggedIn ? 'Log in to see your history'
                : loading ? 'Loading your history…'
                  : loadError ? 'Couldn’t load your history'
                    : searchQuery ? 'No matches' : 'Your history is empty'}
            </h2>
            <p>
              {!isLoggedIn ? <><Link to="/login">Log in</Link> to keep track of what you read, watch and listen to.</>
                : loading ? null
                  : loadError ? <>{loadError} <button type="button" className={styles.retryButton} onClick={() => load()}>Try again</button></>
                    : searchQuery
                      ? `Nothing in your history matches “${searchQuery}”.`
                      : <>Books you read, audiobooks and kirtan you listen to, and lessons you watch show up here. Start with the <Link to="/collections/ebooks">library</Link>.</>}
            </p>
          </div>
        ) : (
          <div className={styles.timeline}>
            {groups.map((group) => (
              <div key={group.key} className={styles.group}>
                <h2 className={styles.groupTitle}>
                  {group.icon && <span className={styles.groupIcon} aria-hidden="true">{group.icon}</span>}
                  {group.title}
                  <span className={styles.groupCount}>{group.items.length}</span>
                </h2>
                <ul className={styles.list}>
                  {group.items.map((item) => {
                    const isSelected = selected.has(item.id);
                    const type = typeOf(item.type);
                    return (
                      <li key={item.id} className={`${styles.item} ${isSelected ? styles.itemSelected : ''}`}>
                        <label className={styles.check}>
                          <input type="checkbox" checked={isSelected} onChange={() => toggleItem(item.id)} />
                          <span className={`${styles.box} ${isSelected ? styles.boxOn : ''}`} aria-hidden="true">{isSelected && <FaCheck />}</span>
                          <span className={styles.srOnly}>Select {item.title}</span>
                        </label>
                        <span className={`${styles.typeIcon} ${styles[item.type] || ''}`} aria-hidden="true">{type.icon}</span>
                        <div className={styles.itemBody}>
                          {/* The path comes from the server; only paths inside Virsaa become links */}
                          {isInternalPath(item.path)
                            ? <Link to={item.path} className={styles.itemTitle}>{item.title}</Link>
                            : <span className={styles.itemTitle}>{item.title}</span>}
                          <span className={styles.itemMeta}>
                            {type.label}
                            <span aria-hidden="true" className={styles.dot} />
                            {viewMode === 'byType' ? `${dayLabel(item.day)}, ${item.time}` : item.time}
                            {item.progress > 0 && (
                              <>
                                <span aria-hidden="true" className={styles.dot} />
                                {item.progress >= 100 ? 'Finished' : `${item.progress}% ${type.verb}`}
                              </>
                            )}
                          </span>
                          {item.progress > 0 && item.progress < 100 && (
                            <span className={styles.progress} role="progressbar" aria-valuenow={item.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`${item.title} progress`}>
                              <span className={styles.progressFill} style={{ width: `${item.progress}%` }} />
                            </span>
                          )}
                        </div>
                        <button type="button" className={styles.removeButton} onClick={() => removeItem(item.id)} aria-label={`Remove ${item.title} from history`}>
                          <FaTimes />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default History;
