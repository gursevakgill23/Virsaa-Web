/**
 * pages/Profile/MyFavorites/MyFavorites.jsx
 * -----------------------------------------------------------------------------
 * My Favorites (/my-favorites): everything the user has liked (ebooks,
 * audiobooks, authors), saved for later and downloaded.
 *   - tabs, search, grid or list view
 *   - remove with Undo; download an ebook again (monthly allowance shown)
 * Data: /api/library/ (api/libraryApi.js).
 * -----------------------------------------------------------------------------
 */
import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from '../../../utils/notify';
import {
  FiSearch, FiX, FiChevronLeft, FiChevronRight, FiGrid, FiList,
  FiBook, FiHeadphones, FiUser, FiClock, FiHeart, FiTrash2, FiDownload, FiBookmark,
} from 'react-icons/fi';
import PageHero from '../../../components/PageHero/PageHero';
import AccountTabs from '../AccountTabs/AccountTabs';
import { useAuth } from '../../../context/AuthContext';
import libraryApi, { startDownload } from '../../../api/libraryApi';
import { describeApiError } from '../../../utils/apiError';
import Avatar from '../../../components/Avatar/Avatar';
import { CoverPicture } from '../../../components/SitePicture/SitePicture';
import styles from './MyFavorites.module.css';

// Converts image paths for the production build (same helper used across pages)
const getImagePath = (imagePath) => {
  if (process.env.NODE_ENV === 'production' && typeof imagePath === 'string') {
    return (imagePath.startsWith('/') || /^(https?:|blob:|data:)/i.test(imagePath)) ? imagePath : `/${imagePath.replace(/.*static\/media/, 'static/media')}`;
  }
  return imagePath;
};

// A thumbnail: the item's own picture; otherwise an author's initials, or the
// website's book picture from S3 ('fallback-book')
const Thumb = ({ item, className }) => (item.type === 'author'
  ? <Avatar src={item.image} name={item.name || item.title} className={className} loading="lazy" />
  : <CoverPicture src={item.image} alt="" className={className} />);

// Tabs, labels and the empty state
const TABS = [
  { id: 'ebooks', label: 'Ebooks', icon: <FiBook />, path: '/collections/ebooks' },
  { id: 'audiobooks', label: 'Audiobooks', icon: <FiHeadphones />, path: '/collections/audiobooks' },
  { id: 'authors', label: 'Authors', icon: <FiUser />, path: '/collections/authors' },
];

const TYPE_LABELS = { ebook: 'Ebook', audiobook: 'Audiobook', author: 'Author' };

const EMPTY = { ebooks: [], audiobooks: [], authors: [], saved: [], downloads: [] };

// Does an item match the search text (title, author, genre)?
const matches = (item, q) => {
  if (!q) return true;
  const text = `${item.title || ''} ${item.name || ''} ${item.author || ''} ${item.genre || ''} ${TYPE_LABELS[item.type] || ''}`.toLowerCase();
  return text.includes(q.toLowerCase());
};

// "3 days ago", "just now"
// "3 days ago" style time
const timeAgo = (iso) => {
  if (!iso) return '';
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  const units = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
  for (const [unit, size] of units) {
    const n = Math.floor(seconds / size);
    if (n >= 1) return `${n} ${unit}${n > 1 ? 's' : ''} ago`;
  }
  return 'just now';
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

// Star rating display
const Stars = ({ rating }) => {
  const value = Number(rating || 0).toFixed(1);
  return (
    <span className={styles.rating}>
      <span className={styles.stars} style={{ '--rating': value }} aria-hidden="true" />
      <span className={styles.ratingValue}>{value}</span>
      <span className={styles.srOnly}>out of 5</span>
    </span>
  );
};

// The remove (heart/bookmark) button on a card or row
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

// "3 of 5 downloads left this month"
const allowanceText = (a) => {
  if (!a) return '';
  if (a.limit === null) return 'Unlimited downloads on your plan.';
  if (a.limit === 0) return 'Downloads come with a membership.';
  return `${a.used} of ${a.limit} downloads used this month.`;
};

const MyFavorites = ({ isDarkMode, apiString }) => {
  const headerImage = getImagePath(isDarkMode ? '/images/header-image-dark.png' : '/images/header-image.png');
  const { isLoggedIn, accessToken } = useAuth();

  // Search, view, tab, the loaded lists, allowance, loading/error, undo and download state
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [activeTab, setActiveTab] = useState('ebooks');
  const [lists, setLists] = useState(EMPTY);
  const [allowance, setAllowance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [lastRemoved, setLastRemoved] = useState(null); // { key, item, index }
  const [downloadingId, setDownloadingId] = useState(null);

  // Load every list at once
  const load = useCallback(async () => {
    if (!isLoggedIn || !accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const data = await libraryApi.all(apiString, accessToken);
      const listOf = (value) => (Array.isArray(value) ? value : []); // never trust the shape blindly
      setLists({
        ebooks: listOf(data?.likes?.ebooks),
        audiobooks: listOf(data?.likes?.audiobooks),
        authors: listOf(data?.likes?.authors),
        saved: listOf(data?.saved),
        downloads: listOf(data?.downloads),
      });
      setAllowance(data?.download_allowance || null);
    } catch (err) {
      setLoadError(err.response?.status === 401
        ? 'Your session has ended. Log in again to see your favorites.'
        : describeApiError(err, 'Your favorites couldn’t be loaded right now.'));
    } finally {
      setLoading(false);
    }
  }, [apiString, accessToken, isLoggedIn]);

  useEffect(() => { load(); }, [load]);

  // Likes come from the three tabs; saved items from "Saved for later"
  const remove = async (key, item) => {
    const index = lists[key].findIndex((x) => x.type === item.type && x.id === item.id);
    if (index === -1) return;
    const kind = key === 'saved' ? 'save' : 'like';
    setLastRemoved({ key, item, index });
    setLists((prev) => ({ ...prev, [key]: prev[key].filter((_, i) => i !== index) }));
    try {
      await libraryApi.remove(apiString, accessToken, kind, item.type, item.id);
    } catch {
      setLists((prev) => {
        const next = [...prev[key]];
        next.splice(index, 0, item);
        return { ...prev, [key]: next };
      });
      setLastRemoved(null);
      toast.error('That couldn’t be removed. Try again.', { position: 'top-right', autoClose: 3000 });
    }
  };

  // Undo the last removal (adds it back on the server)
  const undo = async () => {
    if (!lastRemoved) return;
    const { key, item, index } = lastRemoved;
    setLastRemoved(null);
    setLists((prev) => {
      const next = [...prev[key]];
      next.splice(Math.min(index, next.length), 0, item);
      return { ...prev, [key]: next };
    });
    try {
      await libraryApi.add(apiString, accessToken, key === 'saved' ? 'save' : 'like', item.type, item.id);
    } catch {
      toast.error('That couldn’t be restored. Try again.', { position: 'top-right', autoClose: 3000 });
      load();
    }
  };

  // Download an ebook again (counts toward the monthly allowance)
  const downloadAgain = async (item) => {
    setDownloadingId(item.id);
    try {
      const data = await libraryApi.downloadEbook(apiString, accessToken, item.id);
      startDownload(data.download_url, data.filename);
      setAllowance(data.download_allowance || allowance);
    } catch (err) {
      toast.error(describeApiError(err, 'The download couldn’t start. Try again.'), { position: 'top-right', autoClose: 3500 });
    } finally {
      setDownloadingId(null);
    }
  };

  // Every list filtered by the search text
  const filtered = useMemo(() => ({
    ebooks: lists.ebooks.filter((x) => matches(x, searchQuery)),
    audiobooks: lists.audiobooks.filter((x) => matches(x, searchQuery)),
    authors: lists.authors.filter((x) => matches(x, searchQuery)),
    saved: lists.saved.filter((x) => matches(x, searchQuery)),
    downloads: lists.downloads.filter((x) => matches(x, searchQuery)),
  }), [lists, searchQuery]);

  const current = filtered[activeTab];
  const tab = TABS.find((t) => t.id === activeTab);

  // Empty state with a link to find something
  const empty = (what, path) => (
    <p className={styles.emptyNote}>
      {searchQuery
        ? `Nothing in ${what} matches “${searchQuery}”.`
        : <>No liked {what} yet. Tap the heart on any of the {what} in <Link to={path}>Collections</Link> to add it here.</>}
    </p>
  );

  /* ---------- Section renderers ---------- */
  // Grid and list layouts of the current tab
  const renderGrid = () => {
    if (current.length === 0) return empty(tab.label.toLowerCase(), tab.path);
    return (
      <ScrollRow label={tab.label}>
        {current.map((item) => {
          if (activeTab === 'authors') {
            return (
              <article key={`${item.type}-${item.id}`} className={styles.authorCard}>
                <div className={styles.authorFrame}>
                  <Link to={item.url} aria-label={item.name}><Thumb item={item} className={styles.frameImage} /></Link>
                  <RemoveButton label={`${item.name} from liked authors`} onClick={() => remove('authors', item)} />
                </div>
                <h3 className={styles.cardTitle}><Link to={item.url} className={styles.cardLink}>{item.name}</Link></h3>
                <p className={styles.cardMeta}>
                  {item.books} {item.books === 1 ? 'book' : 'books'}{item.genre ? `, ${item.genre}` : ''}
                </p>
              </article>
            );
          }
          const isEbook = activeTab === 'ebooks';
          return (
            <article key={`${item.type}-${item.id}`} className={isEbook ? styles.bookCard : styles.audioCard}>
              <div className={isEbook ? styles.bookCover : styles.audioCover}>
                <Link to={item.url} aria-label={item.title}><Thumb item={item} className={styles.frameImage} /></Link>
                {!isEbook && <span className={styles.audioBadge} aria-hidden="true"><FiHeadphones /></span>}
                <RemoveButton label={`${item.title} from liked ${tab.label.toLowerCase()}`} onClick={() => remove(activeTab, item)} />
              </div>
              <h3 className={styles.cardTitle}><Link to={item.url} className={styles.cardLink}>{item.title}</Link></h3>
              <p className={styles.cardMeta}>{item.author}</p>
              <div className={styles.cardFoot}>
                <Stars rating={item.rating} />
                {isEbook
                  ? <span className={styles.cardMeta}>{item.pages} pages</span>
                  : item.duration && <span className={styles.cardMeta}><FiClock aria-hidden="true" /> {item.duration}</span>}
              </div>
            </article>
          );
        })}
      </ScrollRow>
    );
  };

  const renderList = () => {
    if (current.length === 0) return empty(tab.label.toLowerCase(), tab.path);
    const cols = {
      ebooks: ['Title', 'Author', 'Pages', 'Rating'],
      audiobooks: ['Title', 'Author', 'Duration', 'Rating'],
      authors: ['Name', 'Books', 'Genre', 'Rating'],
    }[activeTab];
    return (
      <div className={styles.table} role="table" aria-label={`Liked ${tab.label.toLowerCase()}`}>
        <div className={`${styles.tr} ${styles.thead}`} role="row">
          {cols.map((c) => <span key={c} role="columnheader">{c}</span>)}
          <span role="columnheader"><span className={styles.srOnly}>Actions</span></span>
        </div>
        {current.map((item) => (
          <div key={`${item.type}-${item.id}`} className={styles.tr} role="row">
            <span role="cell" className={styles.tdMain}>
              <Thumb item={item} className={activeTab === 'authors' ? styles.thumbRound : styles.thumb} />
              <Link to={item.url} className={styles.cardLink}>{item.title || item.name}</Link>
            </span>
            {activeTab === 'authors' ? (
              <>
                <span role="cell">{item.books} {item.books === 1 ? 'book' : 'books'}</span>
                <span role="cell">{item.genre || '—'}</span>
              </>
            ) : (
              <>
                <span role="cell">{item.author || '—'}</span>
                <span role="cell">{activeTab === 'ebooks' ? `${item.pages} pages` : item.duration || '—'}</span>
              </>
            )}
            <span role="cell"><Stars rating={item.rating} /></span>
            <span role="cell" className={styles.tdAction}>
              <RemoveButton variant="inline" label={`${item.title || item.name} from liked ${tab.label.toLowerCase()}`} onClick={() => remove(activeTab, item)} />
            </span>
          </div>
        ))}
      </div>
    );
  };

  const hero = (
    <PageHero
      compact
      image={headerImage}
      title="My favorites"
      subtitle="Everything you’ve liked, saved and downloaded, in one place."
      crumbs={[{ label: 'Home', to: '/' }, { label: 'My profile', to: '/my-profile' }, { label: 'Favorites' }]}
    >
      <AccountTabs />
    </PageHero>
  );

  if (!isLoggedIn) {
    return (
      <div className={styles.page}>
        {hero}
        <div className={styles.stateBox}>
          <h2>Log in to see your favorites</h2>
          <p>Likes, saved books and downloads are kept in your Virsaa account.</p>
          <Link to="/login" className={styles.primaryButton}>Log in</Link>
        </div>
      </div>
    );
  }

  if (loading || loadError) {
    return (
      <div className={styles.page}>
        {hero}
        <div className={styles.stateBox} role={loadError ? 'alert' : 'status'}>
          {loadError ? (
            <>
              <h2>Couldn’t load your favorites</h2>
              <p>{loadError}</p>
              <button type="button" className={styles.primaryButton} onClick={load}>Try again</button>
            </>
          ) : (
            <>
              <span className={styles.spinner} aria-hidden="true" />
              <p>Loading your favorites…</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {hero}

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
              maxLength={100}
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

      {/* ---------- Liked ---------- */}
      <section className={styles.section} aria-labelledby="fav-title">
        <div className={styles.rowHead}>
          <h2 id="fav-title" className={styles.sectionTitle}><FiHeart aria-hidden="true" className={styles.titleIcon} /> Liked {tab.label.toLowerCase()}</h2>
          <Link to={tab.path} className={styles.textLink}>Browse {tab.label.toLowerCase()}</Link>
        </div>
        {viewMode === 'grid' ? renderGrid() : renderList()}
      </section>

      {/* ---------- Saved for later ---------- */}
      <section className={styles.section} aria-labelledby="saved-title">
        <div className={styles.rowHead}>
          <h2 id="saved-title" className={styles.sectionTitle}><FiBookmark aria-hidden="true" className={styles.titleIcon} /> Saved for later</h2>
        </div>
        {filtered.saved.length === 0 ? (
          <p className={styles.emptyNote}>
            {searchQuery
              ? `Nothing saved matches “${searchQuery}”.`
              : 'Nothing saved yet. Tap the bookmark on a book, audiobook or author to come back to it later.'}
          </p>
        ) : (
          <ul className={styles.savedList}>
            {filtered.saved.map((item) => (
              <li key={`${item.type}-${item.id}`} className={styles.savedItem}>
                <Thumb item={item} className={`${styles.savedThumb} ${item.type === 'author' ? styles.savedThumbRound : ''}`} />
                <div className={styles.savedBody}>
                  <h3><Link to={item.url} className={styles.cardLink}>{item.title}</Link></h3>
                  <p><span className={styles.typeTag}>{TYPE_LABELS[item.type]}</span> <span className={styles.savedWhen}>Saved {timeAgo(item.added_at)}</span></p>
                </div>
                <RemoveButton variant="inline" label={`${item.title} from saved`} onClick={() => remove('saved', item)} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---------- Downloads ---------- */}
      <section className={styles.section} aria-labelledby="downloads-title">
        <div className={styles.rowHead}>
          <h2 id="downloads-title" className={styles.sectionTitle}><FiDownload aria-hidden="true" className={styles.titleIcon} /> Downloads</h2>
          {allowance && (
            <p className={styles.allowance}>
              {allowanceText(allowance)}
              {allowance.limit !== null && <> <Link to="/premium" className={styles.textLink}>{allowance.limit === 0 ? 'See plans' : 'Get more'}</Link></>}
            </p>
          )}
        </div>
        {filtered.downloads.length === 0 ? (
          <p className={styles.emptyNote}>
            {searchQuery
              ? `No downloads match “${searchQuery}”.`
              : <>Books you download appear here. Open any <Link to="/collections/ebooks">ebook</Link> and choose Download.</>}
          </p>
        ) : (
          <ul className={styles.savedList}>
            {filtered.downloads.map((item) => (
              <li key={`dl-${item.id}`} className={styles.savedItem}>
                <Thumb item={item} className={styles.savedThumb} />
                <div className={styles.savedBody}>
                  <h3><Link to={item.url} className={styles.cardLink}>{item.title}</Link></h3>
                  <p><span className={styles.savedMeta}>{item.author ? `${item.author}. ` : ''}Downloaded {timeAgo(item.downloaded_at)}</span></p>
                </div>
                <button
                  type="button"
                  className={`${styles.removeInline} ${styles.downloadInline}`}
                  onClick={() => downloadAgain(item)}
                  disabled={downloadingId === item.id}
                  aria-label={`Download ${item.title} again`}
                  title="Download again"
                >
                  <FiDownload />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default MyFavorites;
