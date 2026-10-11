import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FaTrash, FaSearch, FaTimes, FaBook, FaHeadphones, FaGraduationCap,
  FaQuestionCircle, FaHandsHelping, FaHistory, FaCheck,
} from 'react-icons/fa';
import PageHero from '../../../components/PageHero/PageHero';
import AccountTabs from '../AccountTabs/AccountTabs';
import styles from './History.module.css';

const getImagePath = (imagePath) => {
  if (process.env.NODE_ENV === 'production' && typeof imagePath === 'string') {
    return imagePath.startsWith('/') ? imagePath : `/${imagePath.replace(/.*static\/media/, 'static/media')}`;
  }
  return imagePath;
};

const TYPES = {
  ebook: { label: 'Ebook', icon: <FaBook /> },
  audiobook: { label: 'Audiobook', icon: <FaHeadphones /> },
  lesson: { label: 'Lesson', icon: <FaGraduationCap /> },
  quiz: { label: 'Quiz', icon: <FaQuestionCircle /> },
  gurbani: { label: 'Gurbani', icon: <FaHandsHelping /> },
};

// Placeholder history until activity tracking exists on the backend.
// `day` is days ago, so the groups always read Today / Yesterday / ...
const SAMPLE = [
  { id: 1, day: 0, time: '6:30 PM', type: 'ebook', title: 'Saka Sirhind', path: '/collections/ebooks/ebook/1' },
  { id: 2, day: 0, time: '6:05 PM', type: 'gurbani', title: 'Japji Sahib', path: '/gurbani' },
  { id: 3, day: 0, time: '5:40 PM', type: 'lesson', title: 'Introduction to Gurmukhi', path: '/learning-material/1' },
  { id: 4, day: 1, time: '9:15 PM', type: 'audiobook', title: 'Punjab Di Virasat', path: '/collections/audiobooks/audiobook/2' },
  { id: 5, day: 1, time: '8:50 PM', type: 'quiz', title: 'Sikh history quiz', path: '/learning/quizzes/5' },
  { id: 6, day: 1, time: '7:20 PM', type: 'ebook', title: 'Heer Waris Shah', path: '/collections/ebooks/ebook/6' },
  { id: 7, day: 2, time: '10:42 AM', type: 'lesson', title: 'Vowel signs (laga matra)', path: '/learning-material/2' },
  { id: 8, day: 2, time: '10:20 AM', type: 'gurbani', title: 'Rehras Sahib', path: '/gurbani' },
  { id: 9, day: 4, time: '8:05 PM', type: 'audiobook', title: 'Lok Geet Punjab De', path: '/collections/audiobooks/audiobook/3' },
  { id: 10, day: 4, time: '7:45 PM', type: 'ebook', title: 'Sikh Itihas Bhag Pehla', path: '/collections/ebooks/ebook/4' },
];

const dayLabel = (daysAgo) => {
  if (daysAgo === 0) return 'Today';
  if (daysAgo === 1) return 'Yesterday';
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
};

const History = ({ isDarkMode }) => {
  const headerImage = getImagePath(isDarkMode ? '/images/header-image-dark.png' : '/images/header-image.png');

  const [items, setItems] = useState(SAMPLE);
  const [selected, setSelected] = useState(() => new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('byDate'); // 'byDate' | 'byType'
  const [confirmClear, setConfirmClear] = useState(false);

  const visible = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return q
      ? items.filter((i) => `${i.title} ${TYPES[i.type].label}`.toLowerCase().includes(q))
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
      title: viewMode === 'byDate' ? dayLabel(key) : `${TYPES[key].label}s`,
      icon: viewMode === 'byType' ? TYPES[key].icon : null,
      items: list,
    }));
  }, [visible, viewMode]);

  const selectedCount = selected.size;
  const allVisibleSelected = visible.length > 0 && visible.every((i) => selected.has(i.id));

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

  const deleteSelected = () => {
    setItems((prev) => prev.filter((i) => !selected.has(i.id)));
    setSelected(new Set());
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const clearAll = () => {
    setItems([]);
    setSelected(new Set());
    setConfirmClear(false);
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
        {groups.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon} aria-hidden="true"><FaHistory /></span>
            <h2>{searchQuery ? 'No matches' : 'Your history is empty'}</h2>
            <p>
              {searchQuery
                ? `Nothing in your history matches “${searchQuery}”.`
                : <>Things you open will show up here. Start with the <Link to="/collections/ebooks">library</Link>.</>}
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
                    const type = TYPES[item.type];
                    return (
                      <li key={item.id} className={`${styles.item} ${isSelected ? styles.itemSelected : ''}`}>
                        <label className={styles.check}>
                          <input type="checkbox" checked={isSelected} onChange={() => toggleItem(item.id)} />
                          <span className={`${styles.box} ${isSelected ? styles.boxOn : ''}`} aria-hidden="true">{isSelected && <FaCheck />}</span>
                          <span className={styles.srOnly}>Select {item.title}</span>
                        </label>
                        <span className={`${styles.typeIcon} ${styles[item.type] || ''}`} aria-hidden="true">{type.icon}</span>
                        <div className={styles.itemBody}>
                          <Link to={item.path} className={styles.itemTitle}>{item.title}</Link>
                          <span className={styles.itemMeta}>
                            {type.label}
                            <span aria-hidden="true" className={styles.dot} />
                            {viewMode === 'byType' ? `${dayLabel(item.day)}, ${item.time}` : item.time}
                          </span>
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
