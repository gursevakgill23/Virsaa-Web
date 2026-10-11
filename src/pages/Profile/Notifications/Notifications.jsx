import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FaTrash, FaEnvelopeOpen, FaEnvelope, FaBell, FaBook, FaCalendarAlt,
  FaGraduationCap, FaComments, FaCrown, FaCheckDouble,
} from 'react-icons/fa';
import PageHero from '../../../components/PageHero/PageHero';
import AccountTabs from '../AccountTabs/AccountTabs';
import styles from './Notifications.module.css';

const getImagePath = (imagePath) => {
  if (process.env.NODE_ENV === 'production' && typeof imagePath === 'string') {
    return imagePath.startsWith('/') ? imagePath : `/${imagePath.replace(/.*static\/media/, 'static/media')}`;
  }
  return imagePath;
};

const KINDS = {
  content: { label: 'New in the library', icon: <FaBook /> },
  event: { label: 'Event', icon: <FaCalendarAlt /> },
  learning: { label: 'Learning', icon: <FaGraduationCap /> },
  reply: { label: 'Discussion', icon: <FaComments /> },
  account: { label: 'Account', icon: <FaCrown /> },
};

// Placeholder notifications until the notifications API exists.
// `day` is days ago so the groups always read Today / Yesterday / ...
const SAMPLE = [
  { id: 1, day: 0, time: '6:30 PM', kind: 'reply', read: false, title: 'New reply to your question', description: 'An admin replied to “Is there a worksheet for the vowel signs?” in Introduction to Gurmukhi.', path: '/learning-material/1' },
  { id: 2, day: 0, time: '4:10 PM', kind: 'content', read: false, title: 'New ebook: Saka Sirhind', description: 'A retelling of the martyrdom of the younger Sahibzade, now in the library.', path: '/collections/ebooks/ebook/1' },
  { id: 3, day: 1, time: '7:45 PM', kind: 'event', read: false, title: 'Gurpurab kirtan this Sunday', description: 'An evening of kirtan was added to Events. Open the panel to see the details.', path: '/home' },
  { id: 4, day: 1, time: '11:20 AM', kind: 'learning', read: true, title: 'You scored 9/10 on Sikh history quiz', description: 'One more perfect score earns the Quiz Master badge.', path: '/learning/quizzes/5' },
  { id: 5, day: 3, time: '9:00 AM', kind: 'account', read: true, title: 'Your free trial ends in 3 days', description: 'Choose a plan to keep ad-free reading and unlimited downloads.', path: '/premium' },
  { id: 6, day: 3, time: '8:15 AM', kind: 'content', read: false, title: 'New audiobook: Lok Geet Punjab De', description: 'Folk songs of Punjab with their stories, narrated in Punjabi.', path: '/collections/audiobooks/audiobook/3' },
  { id: 7, day: 6, time: '6:00 PM', kind: 'learning', read: true, title: 'New lesson: Vowel signs (laga matra)', description: 'The next lesson in the Gurmukhi series is ready.', path: '/learning-material/2' },
];

const dayLabel = (daysAgo) => {
  if (daysAgo === 0) return 'Today';
  if (daysAgo === 1) return 'Yesterday';
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
};

const Notifications = ({ isDarkMode }) => {
  const headerImage = getImagePath(isDarkMode ? '/images/header-image-dark.png' : '/images/header-image.png');

  const [notifications, setNotifications] = useState(SAMPLE);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'

  const unreadCount = notifications.filter((n) => !n.read).length;

  const groups = useMemo(() => {
    const list = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;
    const map = new Map();
    list.forEach((n) => {
      if (!map.has(n.day)) map.set(n.day, []);
      map.get(n.day).push(n);
    });
    return [...map.entries()].map(([day, items]) => ({ day, items }));
  }, [notifications, filter]);

  const setRead = (id, read) => setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read } : n)));
  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const deleteNotification = (id) => setNotifications((prev) => prev.filter((n) => n.id !== id));

  return (
    <div className={styles.page}>
      <PageHero
        compact
        image={headerImage}
        title="Notifications"
        subtitle={unreadCount > 0 ? `You have ${unreadCount} unread ${unreadCount === 1 ? 'notification' : 'notifications'}.` : 'You’re all caught up.'}
        crumbs={[{ label: 'Home', to: '/' }, { label: 'My profile', to: '/my-profile' }, { label: 'Notifications' }]}
      >
        <AccountTabs badge={{ '/notifications': unreadCount }} />
      </PageHero>

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

      <section className={styles.section} aria-label="Notifications">
        {groups.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon} aria-hidden="true"><FaBell /></span>
            <h2>{filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}</h2>
            <p>
              {filter === 'unread'
                ? <>You’ve read everything. <button type="button" className={styles.linkButton} onClick={() => setFilter('all')}>Show all</button></>
                : 'Replies, new books and events will show up here.'}
            </p>
          </div>
        ) : (
          <div className={styles.groups}>
            {groups.map((group) => (
              <div key={group.day}>
                <h2 className={styles.groupTitle}>{dayLabel(group.day)}</h2>
                <ul className={styles.list}>
                  {group.items.map((n) => {
                    const kind = KINDS[n.kind];
                    return (
                      <li key={n.id} className={`${styles.item} ${n.read ? styles.read : styles.unread}`}>
                        <span className={`${styles.kindIcon} ${styles[n.kind] || ''}`} aria-hidden="true">{kind.icon}</span>
                        <div className={styles.body}>
                          <div className={styles.topLine}>
                            <span className={styles.kindLabel}>{kind.label}</span>
                            <span className={styles.time}>{n.time}</span>
                            {!n.read && <span className={styles.unreadDot}><span className={styles.srOnly}>Unread</span></span>}
                          </div>
                          <Link to={n.path} className={styles.title} onClick={() => setRead(n.id, true)}>{n.title}</Link>
                          <p className={styles.description}>{n.description}</p>
                        </div>
                        <div className={styles.actions}>
                          <button
                            type="button"
                            className={styles.iconButton}
                            onClick={() => setRead(n.id, !n.read)}
                            aria-label={n.read ? `Mark “${n.title}” as unread` : `Mark “${n.title}” as read`}
                            title={n.read ? 'Mark as unread' : 'Mark as read'}
                          >
                            {n.read ? <FaEnvelope /> : <FaEnvelopeOpen />}
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
