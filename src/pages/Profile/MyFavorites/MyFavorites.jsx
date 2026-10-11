import { useState, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FiSearch, FiX, FiChevronLeft, FiChevronRight, FiGrid, FiList,
  FiBook, FiHeadphones, FiUser, FiClock, FiHeart, FiTrash2,
} from 'react-icons/fi';
import PageHero from '../../../components/PageHero/PageHero';
import AccountTabs from '../AccountTabs/AccountTabs';
import styles from './MyFavorites.module.css';

const getImagePath = (imagePath) => {
  if (process.env.NODE_ENV === 'production' && typeof imagePath === 'string') {
    return imagePath.startsWith('/') ? imagePath : `/${imagePath.replace(/.*static\/media/, 'static/media')}`;
  }
  return imagePath;
};

const bookImage = '/images/book-image.jpg';
const authorImage = '/images/author-image.jpg';

// Placeholder favourites until the favourites API exists
const makeEbooks = () => Array.from({ length: 10 }, (_, i) => ({
  id: `ebook-${i + 1}`,
  title: `Sacred Wisdom Vol. ${i + 1}`,
  author: `Author ${String.fromCharCode(65 + i)}`,
  image: bookImage,
  progress: (i * 23 + 12) % 100,
  rating: (4.5 + ((i * 7) % 5) / 10).toFixed(1),
}));

const makeAudiobooks = () => Array.from({ length: 10 }, (_, i) => ({
  id: `audiobook-${i + 1}`,
  title: `Divine Listenings Vol. ${i + 1}`,
  author: `Narrator ${String.fromCharCode(65 + i)}`,
  image: bookImage,
  duration: `${(i % 3) + 1}h ${(i * 17) % 60}m`,
  rating: (4.5 + ((i * 3) % 5) / 10).toFixed(1),
}));

const makeAuthors = () => Array.from({ length: 10 }, (_, i) => ({
  id: `author-${i + 1}`,
  name: `Scholar ${String.fromCharCode(65 + i)} Singh`,
  image: authorImage,
  books: 5 + ((i * 7) % 20),
  followers: `${10 + ((i * 11) % 50)}k`,
}));

const makeSaved = () => Array.from({ length: 8 }, (_, i) => ({
  id: `saved-${i + 1}`,
  title: `Spiritual Journey ${i + 1}`,
  type: ['Ebook', 'Audiobook', 'Article'][i % 3],
  image: i % 2 === 0 ? bookImage : authorImage,
  added: `${(i * 4) + 1} days ago`,
}));

const TABS = [
  { id: 'ebooks', label: 'Ebooks', icon: <FiBook />, path: '/collections/ebooks' },
  { id: 'audiobooks', label: 'Audiobooks', icon: <FiHeadphones />, path: '/collections/audiobooks' },
  { id: 'authors', label: 'Authors', icon: <FiUser />, path: '/collections/authors' },
];

const matches = (item, q) => {
  if (!q) return true;
  const text = `${item.title || ''} ${item.name || ''} ${item.author || ''} ${item.type || ''}`.toLowerCase();
  return text.includes(q.toLowerCase());
};

/* Horizontally scrolling row with previous / next buttons */
const ScrollRow = ({ label, children }) => {
  const rowRef = useRef(null);
  const scroll = (dir) => {
    const el = rowRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };
  return (
    <div className={styles.rowWrap}>
      <button type="button" className={`${styles.rowButton} ${styles.rowPrev}`} onClick={() => scroll(-1)} aria-label={`Scroll ${label} left`}>
        <FiChevronLeft />
      </button>
      <div className={styles.row} ref={rowRef}>{children}</div>
      <button type="button" className={`${styles.rowButton} ${styles.rowNext}`} onClick={() => scroll(1)} aria-label={`Scroll ${label} right`}>
        <FiChevronRight />
      </button>
    </div>
  );
};

const Stars = ({ rating }) => (
  <span className={styles.rating}>
    <span className={styles.stars} style={{ '--rating': rating }} aria-hidden="true" />
    <span className={styles.ratingValue}>{rating}</span>
    <span className={styles.srOnly}>out of 5</span>
  </span>
);

const RemoveButton = ({ label, onClick, variant = 'card' }) => (
  <button
    type="button"
    className={variant === 'card' ? styles.removeButton : styles.removeInline}
    onClick={onClick}
    aria-label={`Remove ${label}`}
    title="Remove"
  >
    {variant === 'card' ? <FiHeart /> : <FiTrash2 />}
  </button>
);

const MyFavorites = ({ isDarkMode }) => {
  const headerImage = getImagePath(isDarkMode ? '/images/header-image-dark.png' : '/images/header-image.png');

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [activeTab, setActiveTab] = useState('ebooks');
  const [lists, setLists] = useState(() => ({
    ebooks: makeEbooks(),
    audiobooks: makeAudiobooks(),
    authors: makeAuthors(),
    saved: makeSaved(),
  }));
  const [lastRemoved, setLastRemoved] = useState(null); // { key, item, index }

  const remove = (key, id) => {
    const index = lists[key].findIndex((x) => x.id === id);
    if (index === -1) return;
    setLastRemoved({ key, item: lists[key][index], index });
    setLists((prev) => ({ ...prev, [key]: prev[key].filter((x) => x.id !== id) }));
  };

  const undo = () => {
    if (!lastRemoved) return;
    const { key, item, index } = lastRemoved;
    setLists((prev) => {
      const next = [...prev[key]];
      next.splice(index, 0, item);
      return { ...prev, [key]: next };
    });
    setLastRemoved(null);
  };

  const filtered = useMemo(() => ({
    ebooks: lists.ebooks.filter((x) => matches(x, searchQuery)),
    audiobooks: lists.audiobooks.filter((x) => matches(x, searchQuery)),
    authors: lists.authors.filter((x) => matches(x, searchQuery)),
    saved: lists.saved.filter((x) => matches(x, searchQuery)),
  }), [lists, searchQuery]);

  const current = filtered[activeTab];
  const tab = TABS.find((t) => t.id === activeTab);

  const empty = (what, path) => (
    <p className={styles.emptyNote}>
      {searchQuery
        ? `Nothing in ${what} matches “${searchQuery}”.`
        : <>No {what} yet. Tap the heart on anything in <Link to={path}>Collections</Link> to save it here.</>}
    </p>
  );

  /* ---------- Section renderers ---------- */
  const renderGrid = () => {
    if (current.length === 0) return empty(tab.label.toLowerCase(), tab.path);
    return (
      <ScrollRow label={tab.label}>
        {current.map((item) => {
          if (activeTab === 'authors') {
            return (
              <article key={item.id} className={styles.authorCard}>
                <div className={styles.authorFrame}>
                  <img src={getImagePath(item.image)} alt="" loading="lazy" />
                  <RemoveButton label={`${item.name} from favorites`} onClick={() => remove('authors', item.id)} />
                </div>
                <h3 className={styles.cardTitle}>{item.name}</h3>
                <p className={styles.cardMeta}>{item.books} books, {item.followers} followers</p>
              </article>
            );
          }
          const isEbook = activeTab === 'ebooks';
          return (
            <article key={item.id} className={isEbook ? styles.bookCard : styles.audioCard}>
              <div className={isEbook ? styles.bookCover : styles.audioCover}>
                <img src={getImagePath(item.image)} alt="" loading="lazy" />
                {!isEbook && <span className={styles.audioBadge} aria-hidden="true"><FiHeadphones /></span>}
                <RemoveButton label={`${item.title} from favorites`} onClick={() => remove(activeTab, item.id)} />
              </div>
              <h3 className={styles.cardTitle}>{item.title}</h3>
              <p className={styles.cardMeta}>{item.author}</p>
              <div className={styles.cardFoot}>
                <Stars rating={item.rating} />
                {isEbook
                  ? <span className={styles.cardMeta}>{item.progress}% read</span>
                  : <span className={styles.cardMeta}><FiClock aria-hidden="true" /> {item.duration}</span>}
              </div>
              {isEbook && (
                <div className={styles.progress} role="progressbar" aria-valuenow={item.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`${item.title} reading progress`}>
                  <div className={styles.progressFill} style={{ width: `${item.progress}%` }} />
                </div>
              )}
            </article>
          );
        })}
      </ScrollRow>
    );
  };

  const renderList = () => {
    if (current.length === 0) return empty(tab.label.toLowerCase(), tab.path);
    const cols = {
      ebooks: ['Title', 'Author', 'Progress', 'Rating'],
      audiobooks: ['Title', 'Narrator', 'Duration', 'Rating'],
      authors: ['Name', 'Books', 'Followers', ''],
    }[activeTab];
    return (
      <div className={styles.table} role="table" aria-label={`Favorite ${tab.label.toLowerCase()}`}>
        <div className={`${styles.tr} ${styles.thead}`} role="row">
          {cols.map((c, i) => <span key={i} role="columnheader">{c}</span>)}
          <span role="columnheader"><span className={styles.srOnly}>Actions</span></span>
        </div>
        {current.map((item) => (
          <div key={item.id} className={styles.tr} role="row">
            <span role="cell" className={styles.tdMain}>
              <img src={getImagePath(item.image)} alt="" className={activeTab === 'authors' ? styles.thumbRound : styles.thumb} loading="lazy" />
              <span>{item.title || item.name}</span>
            </span>
            {activeTab === 'authors' ? (
              <>
                <span role="cell">{item.books} books</span>
                <span role="cell">{item.followers}</span>
                <span role="cell" />
              </>
            ) : (
              <>
                <span role="cell">{item.author}</span>
                <span role="cell">
                  {activeTab === 'ebooks' ? (
                    <span className={styles.inlineProgress}>
                      <span className={styles.progress}><span className={styles.progressFill} style={{ width: `${item.progress}%` }} /></span>
                      {item.progress}%
                    </span>
                  ) : item.duration}
                </span>
                <span role="cell"><Stars rating={item.rating} /></span>
              </>
            )}
            <span role="cell" className={styles.tdAction}>
              <RemoveButton variant="inline" label={`${item.title || item.name} from favorites`} onClick={() => remove(activeTab, item.id)} />
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.page}>
      <PageHero
        compact
        image={headerImage}
        title="My favorites"
        subtitle="Everything you’ve saved, in one place."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'My profile', to: '/my-profile' }, { label: 'Favorites' }]}
      >
        <AccountTabs />
      </PageHero>

      {/* ---------- Toolbar ---------- */}
      <div className={styles.toolbarWrap}>
        <div className={styles.toolbar}>
          <div className={styles.segmented} role="tablist" aria-label="Favorite type">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={activeTab === t.id}
                className={`${styles.segment} ${activeTab === t.id ? styles.segmentOn : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                <span aria-hidden="true">{t.icon}</span> {t.label}
                <span className={styles.count}>{lists[t.id].length}</span>
              </button>
            ))}
          </div>

          <div className={styles.search}>
            <FiSearch className={styles.searchIcon} aria-hidden="true" />
            <label htmlFor="fav-search" className={styles.srOnly}>Search your favorites</label>
            <input
              id="fav-search"
              type="search"
              placeholder="Search your favorites"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} className={styles.clearSearch} aria-label="Clear search">
                <FiX />
              </button>
            )}
          </div>

          <div className={styles.viewToggle} role="group" aria-label="View">
            <button type="button" aria-pressed={viewMode === 'grid'} className={`${styles.viewButton} ${viewMode === 'grid' ? styles.viewOn : ''}`} onClick={() => setViewMode('grid')}>
              <FiGrid aria-hidden="true" /> <span>Grid</span>
            </button>
            <button type="button" aria-pressed={viewMode === 'list'} className={`${styles.viewButton} ${viewMode === 'list' ? styles.viewOn : ''}`} onClick={() => setViewMode('list')}>
              <FiList aria-hidden="true" /> <span>List</span>
            </button>
          </div>
        </div>
      </div>

      {lastRemoved && (
        <div className={styles.undoWrap}>
          <p className={styles.undo} role="status">
            Removed “{lastRemoved.item.title || lastRemoved.item.name}”.
            <button type="button" onClick={undo}>Undo</button>
            <button type="button" className={styles.undoClose} onClick={() => setLastRemoved(null)} aria-label="Dismiss"><FiX /></button>
          </p>
        </div>
      )}

      {/* ---------- Favorites ---------- */}
      <section className={styles.section} aria-labelledby="fav-title">
        <div className={styles.rowHead}>
          <h2 id="fav-title" className={styles.sectionTitle}>Favorite {tab.label.toLowerCase()}</h2>
          <Link to={tab.path} className={styles.textLink}>Browse {tab.label.toLowerCase()}</Link>
        </div>
        {viewMode === 'grid' ? renderGrid() : renderList()}
      </section>

      {/* ---------- Saved for later ---------- */}
      <section className={styles.section} aria-labelledby="saved-title">
        <div className={styles.rowHead}>
          <h2 id="saved-title" className={styles.sectionTitle}><FiClock aria-hidden="true" className={styles.titleIcon} /> Saved for later</h2>
        </div>
        {filtered.saved.length === 0 ? (
          <p className={styles.emptyNote}>{searchQuery ? `Nothing saved matches “${searchQuery}”.` : 'Nothing saved for later.'}</p>
        ) : (
          <ul className={styles.savedList}>
            {filtered.saved.map((item) => (
              <li key={item.id} className={styles.savedItem}>
                <img src={getImagePath(item.image)} alt="" loading="lazy" className={styles.savedThumb} />
                <div className={styles.savedBody}>
                  <h3>{item.title}</h3>
                  <p><span className={styles.typeTag}>{item.type}</span> <span className={styles.savedWhen}>Saved {item.added}</span></p>
                </div>
                <RemoveButton variant="inline" label={`${item.title} from saved`} onClick={() => remove('saved', item.id)} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default MyFavorites;
