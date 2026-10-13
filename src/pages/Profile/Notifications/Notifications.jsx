/**
 * pages/Profile/Notifications/Notifications.jsx
 * -----------------------------------------------------------------------------
 * Notifications (/notifications): new content, updates, learning and account
 * messages, grouped by day.
 *   - All / Unread filter, mark one read or unread, mark all as read, delete
 *   - refreshes every 30 s and when the tab comes back into view
 *   - keeps the navbar badge and account tabs in step (setUnread)
 * Data: /api/auth/notifications/ (api/accountApi.js).
 * -----------------------------------------------------------------------------
 */
import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from '../../../utils/notify';
import {
  FaTrash, FaEnvelopeOpen, FaEnvelope, FaBell, FaBook,
  FaGraduationCap, FaCrown, FaCheckDouble, FaSyncAlt,
} from 'react-icons/fa';
import PageHero from '../../../components/PageHero/PageHero';
import AccountTabs from '../AccountTabs/AccountTabs';
import { useAuth } from '../../../context/AuthContext';
import accountApi from '../../../api/accountApi';
import { setUnread } from '../../../hooks/useUnreadNotifications';
import { isInternalPath } from '../../../utils/safeUrl';
import { describeApiError } from '../../../utils/apiError';
import styles from './Notifications.module.css';

// Converts image paths for the production build (same helper used across pages)
const getImagePath = (imagePath) => {
  if (process.env.NODE_ENV === 'production' && typeof imagePath === 'string') {
    return (imagePath.startsWith('/') || /^(https?:|blob:|data:)/i.test(imagePath)) ? imagePath : `/${imagePath.replace(/.*static\/media/, 'static/media')}`;
  }
  return imagePath;
};

// Label and icon per kind of notification
const KINDS = {
  content: { label: 'New in the library', icon: <FaBook /> },
  update: { label: 'Updated', icon: <FaSyncAlt /> },
  learning: { label: 'Learning', icon: <FaGraduationCap /> },
  account: { label: 'Account', icon: <FaCrown /> },
};

// How often the list refreshes while open
const POLL_MS = 30000;

// Day grouping helpers ("Today", "Yesterday", weekday + date)
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const daysAgo = (iso) => Math.round((startOfDay(new Date()) - startOfDay(new Date(iso))) / 86400000);

const dayLabel = (n) => {
  if (n <= 0) return 'Today';
  if (n === 1) return 'Yesterday';
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
};

const timeOf = (iso) => new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

const Notifications = ({ isDarkMode, apiString }) => {
  const headerImage = getImagePath(isDarkMode ? '/images/header-image-dark.png' : '/images/header-image.png');
  const { isLoggedIn, accessToken } = useAuth();

  // Notifications, unread count, filter, loading/error
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Update the count here and everywhere else that shows it
  const applyCount = (count) => {
    setUnreadCount(count);
    setUnread(count); // navbar badge and account tabs
  };

  // Load notifications. `quiet` (background refresh) keeps the list if it fails.
  const load = useCallback(async (quiet = false) => {
    if (!isLoggedIn || !accessToken) { setLoading(false); return; }
    if (!quiet) setLoading(true);
    try {
      const data = await accountApi.notifications(apiString, accessToken);
      setNotifications(Array.isArray(data?.results) ? data.results : []);
      applyCount(data?.unread_count || 0);
      setLoadError(null);
    } catch (err) {
      if (!quiet) setLoadError(err.response?.status === 401 ? 'Your session has ended. Log in again.' : describeApiError(err, 'Notifications couldn’t be loaded right now.'));
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [apiString, accessToken, isLoggedIn]);

  // New notifications appear while the page is open
  useEffect(() => {
    load();
    const timer = setInterval(() => { if (document.visibilityState === 'visible') load(true); }, POLL_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') load(true); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, [load]);

  // Notifications for the current filter, grouped by day
  const groups = useMemo(() => {
    const list = filter === 'unread' ? notifications.filter((n) => !n.is_read) : notifications;
    const map = new Map();
    list.forEach((n) => {
      const day = daysAgo(n.created_at);
      if (!map.has(day)) map.set(day, []);
      map.get(day).push(n);
    });
    return [...map.entries()].map(([day, items]) => ({ day, items }));
  }, [notifications, filter]);

  // Mark one read/unread (changes at once, restored if the server refuses)
  const setRead = async (id, read) => {
    const before = notifications;
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: read } : n)));
    try {
      const data = await accountApi.markRead(apiString, accessToken, id, read);
      applyCount(data.unread_count);
    } catch {
      setNotifications(before);
      toast.error('That didn’t save. Try again.', { position: 'top-right', autoClose: 2500 });
    }
  };

  // Mark everything read
  const markAllRead = async () => {
    const before = notifications;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await accountApi.markAllRead(apiString, accessToken);
      applyCount(0);
    } catch {
      setNotifications(before);
      toast.error('That didn’t save. Try again.', { position: 'top-right', autoClose: 2500 });
    }
  };

  // Delete one notification
  const deleteNotification = async (id) => {
    const before = notifications;
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      const data = await accountApi.deleteNotification(apiString, accessToken, id);
      applyCount(data.unread_count);
    } catch {
      setNotifications(before);
      toast.error('That couldn’t be deleted. Try again.', { position: 'top-right', autoClose: 2500 });
    }
  };

  // Opening a notification's link marks it read
  const openNotification = (n) => { if (!n.is_read) setRead(n.id, true); };

  const hero = (
    <PageHero
      compact
      image={headerImage}
      title="Notifications"
      subtitle={unreadCount > 0 ? `You have ${unreadCount} unread ${unreadCount === 1 ? 'notification' : 'notifications'}.` : 'You’re all caught up.'}
      crumbs={[{ label: 'Home', to: '/' }, { label: 'My profile', to: '/my-profile' }, { label: 'Notifications' }]}
    >
      <AccountTabs badge={{ '/notifications': unreadCount }} />
    </PageHero>
  );

  if (!isLoggedIn) {
    return (
      <div className={styles.page}>
        {hero}
        <section className={styles.section}>
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon} aria-hidden="true"><FaBell /></span>
            <h2>Log in to see your notifications</h2>
            <p><Link to="/login">Log in</Link> to hear about new books, lessons and your account.</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {hero}

      <div className={styles.toolbarWrap}>
        <div className={styles.toolbar}>
          <div className={styles.segmented} role="group" aria-label="Show">
            <button type="button" aria-pressed={filter === 'all'} className={`${styles.segment} ${filter === 'all' ? styles.segmentOn : ''}`} onClick={() => setFilter('all')}>
              All <span className={styles.count}>{notifications.length}</span>
            </button>
            <button type="button" aria-pressed={filter === 'unread'} className={`${styles.segment} ${filter === 'unread' ? styles.segmentOn : ''}`} onClick={() => setFilter('unread')}>
              Unread <span className={styles.count}>{unreadCount}</span>
            </button>
          </div>
          <button type="button" className={styles.ghostButton} onClick={markAllRead} disabled={unreadCount === 0}>
            <FaCheckDouble aria-hidden="true" /> Mark all as read
          </button>
        </div>
      </div>

      <section className={styles.section} aria-label="Notifications" aria-busy={loading}>
        {loading ? (
          <div className={styles.emptyState} role="status">
            <span className={styles.emptyIcon} aria-hidden="true"><FaBell /></span>
            <h2>Loading notifications…</h2>
          </div>
        ) : loadError ? (
          <div className={styles.emptyState} role="alert">
            <span className={styles.emptyIcon} aria-hidden="true"><FaBell /></span>
            <h2>Couldn’t load notifications</h2>
            <p>{loadError} <button type="button" className={styles.linkButton} onClick={() => load()}>Try again</button></p>
          </div>
        ) : groups.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon} aria-hidden="true"><FaBell /></span>
            <h2>{filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}</h2>
            <p>
              {filter === 'unread'
                ? <>You’ve read everything. <button type="button" className={styles.linkButton} onClick={() => setFilter('all')}>Show all</button></>
                : 'New books, lessons, badges and account updates will show up here.'}
            </p>
          </div>
        ) : (
          <div className={styles.groups}>
            {groups.map((group) => (
              <div key={group.day}>
                <h2 className={styles.groupTitle}>{dayLabel(group.day)}</h2>
                <ul className={styles.list}>
                  {group.items.map((n) => {
                    const kind = KINDS[n.kind] || KINDS.content;
                    return (
                      <li key={n.id} className={`${styles.item} ${n.is_read ? styles.read : styles.unread}`}>
                        <span className={`${styles.kindIcon} ${styles[n.kind] || ''}`} aria-hidden="true">{kind.icon}</span>
                        <div className={styles.body}>
                          <div className={styles.topLine}>
                            <span className={styles.kindLabel}>{kind.label}</span>
                            <span className={styles.time}>{timeOf(n.created_at)}</span>
                            {!n.is_read && <span className={styles.unreadDot}><span className={styles.srOnly}>Unread</span></span>}
                          </div>
                          {/* Links come from the server; only paths inside Virsaa become links */}
                          {isInternalPath(n.link)
                            ? <Link to={n.link} className={styles.title} onClick={() => openNotification(n)}>{n.title}</Link>
                            : <span className={styles.title}>{n.title}</span>}
                          {n.message && <p className={styles.description}>{n.message}</p>}
                        </div>
                        <div className={styles.actions}>
                          <button
                            type="button"
                            className={styles.iconButton}
                            onClick={() => setRead(n.id, !n.is_read)}
                            aria-label={n.is_read ? `Mark “${n.title}” as unread` : `Mark “${n.title}” as read`}
                            title={n.is_read ? 'Mark as unread' : 'Mark as read'}
                          >
                            {n.is_read ? <FaEnvelope /> : <FaEnvelopeOpen />}
                          </button>
                          <button
                            type="button"
                            className={`${styles.iconButton} ${styles.deleteIcon}`}
                            onClick={() => deleteNotification(n.id)}
                            aria-label={`Delete “${n.title}”`}
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
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

export default Notifications;
