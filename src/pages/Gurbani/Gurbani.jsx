/**
 * pages/Gurbani/Gurbani.jsx
 * -----------------------------------------------------------------------------
 * The Gurbani page (/gurbani): banis, shabads, audio kirtan and video kirtan.
 *
 * Data comes from our backend (api/sikhismApi.js -> /api/sikhism/gurbani/):
 *   - the list of items (anyone can browse it, guests included)
 *   - today's Hukamnama from Sri Darbar Sahib (shown at the top)
 *   - an item's words (GurbaniReader), loaded only when it is opened
 *   - what to play, also only on open: a short-lived link to our own file, or
 *     a YouTube video played in YouTube's own player, with its credit line
 * Gurbani text and translations come from BaniDB (Khalis Foundation) via the
 * backend; recordings are added with the backend's load_gurbani_data.
 *
 * On the page:
 *   - search (typed, or by voice where the browser supports it), type filters
 *     and category tabs (Nitnem, Kirtan, Katha...)
 *   - 10 items per page, shown as rows. Each item is Free (any account),
 *     Standard (Standard or Premium plan) or Premium (Premium plan only);
 *     paid items carry their level, and when the visitor's plan doesn't
 *     include one its button says "Unlock to …" and leads to /premium.
 *     Daily Nitnem and the Hukamnama are always free.
 *   - audio/video open in a player with play/pause, previous/next, seek,
 *     volume, full screen and "Read along" (the words under the player)
 *   - shabads open in the reader; opens and plays are recorded in History
 *   - guests can look around; opening anything asks them to sign in
 * -----------------------------------------------------------------------------
 */
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaCrown, FaSearch, FaTimes, FaVideo, FaHeadphones, FaLock, FaMicrophone, FaPlay, FaPause,
  FaStepBackward, FaStepForward, FaVolumeUp, FaExpand, FaBookOpen, FaRedo, FaStar,
} from 'react-icons/fa';
import PageHero from '../../components/PageHero/PageHero';
import useHistoryRecorder from '../../hooks/useHistoryRecorder';
import useMembership, { PLAN_NAMES, PLAN_RANK } from '../../hooks/useMembership';
import { gurbaniApi } from '../../api/sikhismApi';
import { describeApiError } from '../../utils/apiError';
import { safeUrl } from '../../utils/safeUrl';
import { toast } from '../../utils/notify';
import { useAuth } from '../../context/AuthContext';
import GurbaniReader from './GurbaniReader';
import { CoverPicture, SitePicture } from '../../components/SitePicture/SitePicture';
import styles from './Gurbani.module.css';

// Converts image paths for the production build (same helper used across pages)
const useProductionImagePath = () => {
  return (imagePath) => {
    if (process.env.NODE_ENV === 'production') {
      if (typeof imagePath === 'string') {
        return (imagePath.startsWith('/') || /^(https?:|blob:|data:)/i.test(imagePath))
          ? imagePath
          : `/${imagePath.replace(/.*static\/media/, 'static/media')}`;
      }
      return imagePath.default || imagePath;
    }
    return imagePath;
  };
};

// Filter chips
const FILTERS = [
  { id: 'shabad', label: 'Shabad', icon: <FaBookOpen /> },
  { id: 'audio', label: 'Audio kirtan', icon: <FaHeadphones /> },
  { id: 'video', label: 'Video kirtan', icon: <FaVideo /> },
  { id: 'standard', label: 'Standard', icon: <FaStar /> },
  { id: 'premium', label: 'Premium', icon: <FaCrown /> },
];
const LEVEL_FILTERS = ['standard', 'premium'];

// Who can open an item: free = any account, standard = the Standard or Premium plan,
// premium = the Premium plan only (the server checks it again when something is opened)
const ACCESS_LEVELS = ['free', 'standard', 'premium'];
const LEVEL_META = {
  standard: { label: 'Standard', icon: <FaStar /> },
  premium: { label: 'Premium', icon: <FaCrown /> },
};

// Label and icon per content type
const TYPE_META = {
  shabad: { label: 'Shabad', icon: <FaBookOpen /> },
  audio: { label: 'Audio kirtan', icon: <FaHeadphones /> },
  video: { label: 'Video kirtan', icon: <FaVideo /> },
};

// Website pictures (S3) per type, for items without a picture of their own from the admin
const TYPE_PICTURES = {
  shabad: 'gurbani-shabad',
  audio: 'gurbani-audio',
  video: 'gurbani-video',
};

// Remembers the last opened item, for the "Because you viewed" heading
const LAST_KEY = 'virsaa:gurbani-last';
const readLast = () => {
  try { return JSON.parse(localStorage.getItem(LAST_KEY) || 'null')?.title || ''; } catch { return ''; }
};
const saveLast = (title) => {
  try { localStorage.setItem(LAST_KEY, JSON.stringify({ title })); } catch { /* storage blocked */ }
};

/**
 * Server item -> what the page uses. Only http(s) pictures are accepted;
 * items without one show the type's website picture (TYPE_PICTURES).
 */
const toPageItem = (raw) => {
  const type = TYPE_META[raw?.type] ? raw.type : 'shabad';
  return {
    id: raw.id,
    type,
    title: String(raw.title || 'Untitled'),
    titleGurmukhi: raw.title_gurmukhi || '',
    description: raw.description || '',
    category: raw.category || '',
    categoryLabel: raw.category_label || '',
    image: safeUrl(raw.image, { allowRelative: false }),
    picture: TYPE_PICTURES[type],
    artist: raw.artist || '',
    ang: raw.ang || null,
    raag: raw.raag || '',
    lineCount: raw.line_count || null,
    // older servers only said is_premium (= Standard)
    access: ACCESS_LEVELS.includes(raw.access) ? raw.access : (raw.is_premium ? 'standard' : 'free'),
    hasText: Boolean(raw.has_text),
    hasMedia: Boolean(raw.has_media),
    hasPdf: Boolean(raw.has_pdf),
  };
};

// "Bhai Harjinder Singh · Ang 268 · 48 lines" under a row's title
const rowDetails = (item) => [
  item.artist,
  item.ang ? `Ang ${item.ang}` : null,
  item.type === 'shabad' && item.lineCount ? `${item.lineCount} lines` : null,
].filter(Boolean);

const Gurbani = ({ isDarkMode, apiString }) => {
  const recordHistory = useHistoryRecorder(apiString);
  const getImagePath = useProductionImagePath();
  const navigate = useNavigate();
  const { isLoggedIn, accessToken, userData } = useAuth();
  const { plan } = useMembership(apiString);
  const isStaff = Boolean(userData?.is_staff);

  const header_image_light = '/images/header-image.png';
  const header_image_dark = '/images/header-image-dark.png';

  // ---- Catalogue ----
  const [items, setItems] = useState([]);
  const [listStatus, setListStatus] = useState('loading'); // loading | ready | error
  const [listError, setListError] = useState('');
  const [hukamnama, setHukamnama] = useState(null);

  // ---- Search, filters, paging, voice search ----
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [category, setCategory] = useState(''); // '' = every category
  const [currentPage, setCurrentPage] = useState(1);
  const [isListening, setIsListening] = useState(false);
  const [cardsPerPage] = useState(10);
  const [lastViewed, setLastViewed] = useState(readLast);

  // ---- Reader (shabads, Hukamnama) ----
  const [reader, setReader] = useState(null); // { item } or { preloaded, title }

  // ---- Media player ----
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [currentMedia, setCurrentMedia] = useState(null);
  const [mediaType, setMediaType] = useState(null); // 'audio' | 'video'
  const [media, setMedia] = useState({ status: 'idle' }); // idle | loading | ready | error (+ kind, url, youtubeId, message)
  const [showWords, setShowWords] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);

  // Voice recogniser, media element, player modal, results list, latest media request
  const recognitionRef = useRef(null);
  const mediaRef = useRef(null);
  const modalRef = useRef(null);
  const gridRef = useRef(null);
  const mediaRequest = useRef(0);
  const tokenRef = useRef(accessToken);
  tokenRef.current = accessToken;

  // Locked when the visitor's plan is below the item's level (staff can open everything)
  const isLocked = useCallback(
    (item) => item.access !== 'free' && !isStaff && (PLAN_RANK[plan] || 0) < PLAN_RANK[item.access],
    [plan, isStaff],
  );

  // Button text for a row (unlock, read, listen, watch)
  const actionLabel = (item) => {
    const locked = isLocked(item);
    if (item.type === 'shabad') return locked ? 'Unlock to read' : 'Read now';
    if (item.type === 'audio') return locked ? 'Unlock to listen' : 'Listen now';
    return locked ? 'Unlock to watch' : 'Watch now';
  };

  // ---------------------------------------------------------------- loading
  // The list. The token is sent when there is one so staff also see drafts.
  const loadItems = useCallback(async () => {
    setListStatus('loading');
    setListError('');
    try {
      const data = await gurbaniApi.list(apiString, tokenRef.current);
      setItems(data.map(toPageItem));
      setListStatus('ready');
    } catch (err) {
      setListError(describeApiError(err, 'The Gurbani library couldn’t be loaded. Check your connection and try again.'));
      setListStatus('error');
    }
  }, [apiString]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Today's Hukamnama. Not essential, so a failure just hides the card.
  useEffect(() => {
    let alive = true;
    gurbaniApi.hukamnama(apiString)
      .then((data) => { if (alive && data?.shabads?.[0]?.lines?.length) setHukamnama(data); })
      .catch(() => {});
    return () => { alive = false; };
  }, [apiString]);

  // ---------------------------------------------------------------- access
  // Server said no: sign in, or a plan is needed (`needed`: 'standard' | 'premium', when it says)
  const handleLocked = useCallback((code, needed) => {
    setReader(null);
    setShowMediaModal(false);
    document.body.style.overflow = 'auto';
    if (code === 'premium_required') {
      const message = LEVEL_META[needed]
        ? `This is part of the ${PLAN_NAMES[needed]} plan. Choose a plan to unlock it.`
        : 'This is part of Virsaa membership. Choose a plan to unlock it.';
      toast.info(message, { toastId: 'gurbani-premium' });
      navigate('/premium');
    } else {
      toast.info('Sign in or create a free account to listen, watch or read.', { toastId: 'guest-locked' });
      navigate('/login');
    }
  }, [navigate]);

  const remember = (item) => {
    saveLast(item.title);
    setLastViewed(item.title);
  };

  // ---------------------------------------------------------------- media player
  // Ask the server for a playable link for `item` (ignores answers for an item no longer open)
  const fetchMedia = useCallback(async (item) => {
    const id = ++mediaRequest.current;
    setMedia({ status: 'loading' });
    try {
      const result = await gurbaniApi.media(apiString, tokenRef.current, item.id);
      if (id !== mediaRequest.current) return;
      if (!result) {
        setMedia({ status: 'error', message: 'This recording isn’t available right now.' });
        return;
      }
      setMedia({ status: 'ready', ...result });
    } catch (err) {
      if (id !== mediaRequest.current) return;
      const code = err?.response?.data?.code;
      if (code === 'login_required' || code === 'premium_required' || err?.response?.status === 401) {
        handleLocked(code || 'login_required', err?.response?.data?.required_plan);
        return;
      }
      setMedia({ status: 'error', message: describeApiError(err, 'This recording couldn’t be loaded. Try again.') });
    }
  }, [apiString, handleLocked]);

  // Play / pause; a failed play is reported
  const togglePlayPause = () => {
    const el = mediaRef.current;
    if (!el) return;
    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      el.play().then(() => setIsPlaying(true)).catch((error) => {
        setIsPlaying(false);
        // AbortError just means another play/pause interrupted it; anything else is a real failure
        if (error.name !== 'AbortError') toast.error('This recording couldn’t be played. Try again.');
      });
    }
  };

  const handleTimeUpdate = () => setCurrentTime(mediaRef.current?.currentTime || 0);
  const handleLoadedMetadata = () => {
    if (!mediaRef.current) return;
    setDuration(mediaRef.current.duration);
    mediaRef.current.volume = volume;
  };

  // The file itself failed (expired link, network): offer to fetch a fresh link
  const handleMediaError = () => {
    setIsPlaying(false);
    setMedia((prev) => (prev.status === 'ready'
      ? { status: 'error', message: 'This recording stopped loading. Try again to get a fresh link.' }
      : prev));
  };

  const handleSeek = (e) => {
    const seekTime = Number(e.target.value);
    if (mediaRef.current) mediaRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleVolumeChange = (e) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);
    if (mediaRef.current) mediaRef.current.volume = newVolume;
  };

  // Seconds → "m:ss"
  const formatTime = (time) => {
    if (!Number.isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Open the player for an item, and close it again
  const playMedia = (item, type) => {
    recordHistory({ type: type === 'video' ? 'video' : 'gurbani', item_id: `gurbani-${item.id}`, title: item.title, path: '/gurbani' });
    remember(item);
    mediaRef.current?.pause();
    setCurrentMedia(item);
    setMediaType(type);
    setShowMediaModal(true);
    setShowWords(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    document.body.style.overflow = 'hidden';
    fetchMedia(item);
  };

  const closeModal = () => {
    mediaRequest.current += 1; // forget a link that is still on its way
    mediaRef.current?.pause();
    setShowMediaModal(false);
    setIsPlaying(false);
    setMedia({ status: 'idle' });
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    document.body.style.overflow = 'auto';
  };

  // Next / previous playable item of the same type
  const playlist = useMemo(
    () => items.filter((item) => item.type === mediaType && item.hasMedia && !isLocked(item)),
    [items, mediaType, isLocked],
  );

  const playStep = (step) => {
    if (!currentMedia || playlist.length < 2) return;
    const index = playlist.findIndex((item) => item.id === currentMedia.id);
    playMedia(playlist[(index + step + playlist.length) % playlist.length], mediaType);
  };

  // Player full screen on/off
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      modalRef.current?.requestFullscreen?.().catch(() => toast.warn('Full screen isn’t available here.'));
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // ---------------------------------------------------------------- PDFs
  // Open an item's PDF in a new tab (link fetched on demand, checked before use)
  const openPdf = async (item) => {
    // Open the tab now, while the click still counts as the user's action (pop-up blockers)
    const tab = window.open('', '_blank');
    if (tab) tab.opener = null;
    try {
      const result = await gurbaniApi.media(apiString, tokenRef.current, item.id, 'pdf');
      if (!result?.url) throw new Error('no link');
      if (tab) tab.location.href = result.url;
      else window.open(result.url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      tab?.close();
      const code = err?.response?.data?.code;
      if (code === 'login_required' || code === 'premium_required') {
        handleLocked(code, err?.response?.data?.required_plan);
        return;
      }
      toast.error(describeApiError(err, 'The PDF couldn’t be opened. Try again.'));
    }
  };

  // ---------------------------------------------------------------- open
  // Row/tile action. Guests sign in first; items above the visitor's plan go to /premium.
  const openItem = (item) => {
    if (!isLoggedIn) {
      toast.info('Sign in or create a free account to listen, watch or read.', { toastId: 'guest-locked' });
      navigate('/login');
      return;
    }
    if (isLocked(item)) {
      toast.info(`“${item.title}” is part of the ${PLAN_NAMES[item.access]} plan. Choose a plan to unlock it.`,
        { toastId: 'gurbani-premium' });
      navigate('/premium');
      return;
    }
    if ((item.type === 'audio' || item.type === 'video') && item.hasMedia) {
      playMedia(item, item.type);
    } else if (item.hasText) {
      recordHistory({ type: 'gurbani', item_id: `gurbani-${item.id}`, title: item.title, path: '/gurbani' });
      remember(item);
      setReader({ item });
    } else if (item.hasPdf) {
      remember(item);
      openPdf(item);
    } else {
      toast.warn('There is nothing to open for this item yet.');
    }
  };

  // Today's Hukamnama in the reader (the text is already loaded)
  const openHukamnama = () => {
    if (!isLoggedIn) {
      toast.info('Sign in or create a free account to read the Hukamnama.', { toastId: 'guest-locked' });
      navigate('/login');
      return;
    }
    setReader({ preloaded: hukamnama.shabads[0], title: 'Today’s Hukamnama' });
  };

  const closeReader = useCallback(() => setReader(null), []);

  // ---------------------------------------------------------------- voice search
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.onresult = (event) => setSearchQuery(event.results[0][0].transcript);
      recognitionRef.current.onerror = (event) => {
        setIsListening(false);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          toast.error('Allow microphone access in your browser to search by voice.');
        } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
          toast.error('Voice search stopped. Try again or type your search.');
        }
      };
      recognitionRef.current.onend = () => setIsListening(false);
    }
    return () => {
      recognitionRef.current?.stop();
      document.body.style.overflow = 'auto';
    };
  }, []);

  // Escape closes the player
  useEffect(() => {
    if (!showMediaModal) return undefined;
    const onKey = (e) => e.key === 'Escape' && closeModal();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // ---------------------------------------------------------------- list
  // Items after search and filters (Gurmukhi titles are searched too)
  const filteredData = useMemo(() => {
    let results = items;
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      results = results.filter((item) => [item.title, item.titleGurmukhi, item.description, item.artist]
        .some((field) => field && field.toLowerCase().includes(q)));
    }
    if (selectedFilters.length > 0) {
      // Levels (Standard, Premium) and types (Shabad, Audio, Video): any of the chosen ones in each group
      const levels = selectedFilters.filter((f) => LEVEL_FILTERS.includes(f));
      const types = selectedFilters.filter((f) => !LEVEL_FILTERS.includes(f));
      results = results.filter((item) => (!levels.length || levels.includes(item.access))
        && (!types.length || types.includes(item.type)));
    }
    if (category) results = results.filter((item) => item.category === category);
    return results;
  }, [searchQuery, selectedFilters, category, items]);

  // Category tabs: only the categories that have items, in the order they first appear
  const categories = useMemo(() => {
    const seen = new Map();
    items.forEach((item) => {
      if (item.category && !seen.has(item.category)) seen.set(item.category, item.categoryLabel || item.category);
    });
    return [...seen].map(([id, label]) => ({ id, label }));
  }, [items]);

  useEffect(() => setCurrentPage(1), [searchQuery, selectedFilters, category]);

  // This page of results
  const isLoading = listStatus === 'loading';
  const totalPages = Math.max(1, Math.ceil(filteredData.length / cardsPerPage));
  const currentCards = filteredData.slice((currentPage - 1) * cardsPerPage, currentPage * cardsPerPage);
  const isFiltering = searchQuery.trim() || selectedFilters.length > 0 || category;

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Start / stop voice search (unsupported browsers get a message)
  const toggleVoiceSearch = () => {
    if (!recognitionRef.current) {
      toast.warn('Voice search isn’t supported in this browser. Try Chrome or Edge.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start(); // throws if it is already running
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  // Filter chips on/off, and clear all
  const handleFilterClick = (filter) => {
    setSelectedFilters((prev) => (prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]));
  };

  const clearFilters = () => {
    setSelectedFilters([]);
    setSearchQuery('');
    setCategory('');
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;
  const hukam = hukamnama?.shabads?.[0];
  const hukamFirst = hukam?.lines?.find((line) => !line.header) || hukam?.lines?.[0];
  const hukamDate = hukamnama?.date
    ? new Date(`${hukamnama.date}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  const isOwnFile = media.status === 'ready' && media.kind !== 'youtube';

  return (
    <div className={`${styles.page} notranslate`} translate="no">
      {/* Audio plays from a hidden element so it keeps going while the words are scrolled */}
      {mediaType === 'audio' && showMediaModal && isOwnFile && (
        <audio
          ref={mediaRef}
          src={media.url}
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          onError={handleMediaError}
        />
      )}

      <PageHero
        image={getImagePath(isDarkMode ? header_image_dark : header_image_light)}
        title="DIVINE WISDOM: GURBANI"
        subtitle="Sacred Hymns from the Guru Granth Sahib Ji"
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Gurbani' }]}
      >
        <div className={styles.toolbarWrap}>
          <div className={styles.toolbar}>
            <form className={styles.searchBar} onSubmit={(e) => e.preventDefault()} role="search">
              <FaSearch className={styles.searchIcon} aria-hidden="true" />
              <input
                type="search"
                placeholder="Search shabads and kirtan"
                maxLength={100}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search Gurbani"
              />
              <button
                type="button"
                className={`${styles.voiceButton} ${isListening ? styles.listening : ''}`}
                onClick={toggleVoiceSearch}
                aria-label={isListening ? 'Stop voice search' : 'Search by voice'}
                aria-pressed={isListening}
              >
                <FaMicrophone />
              </button>
            </form>
            <div className={styles.chips} role="group" aria-label="Filter">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`${styles.chip} ${selectedFilters.includes(f.id) ? styles.chipOn : ''}`}
                  onClick={() => handleFilterClick(f.id)}
                  aria-pressed={selectedFilters.includes(f.id)}
                >
                  <span aria-hidden="true">{f.icon}</span> {f.label}
                </button>
              ))}
              {isFiltering && (
                <button type="button" className={styles.clearChip} onClick={clearFilters}>
                  <FaTimes aria-hidden="true" /> Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </PageHero>

      {/* ---------- Today's Hukamnama (only when it loaded) ---------- */}
      {hukam && hukamFirst && (
        <section className={styles.section} aria-labelledby="hukam-title">
          <div className={styles.hukam}>
            <div className={styles.hukamHead}>
              <h2 id="hukam-title" className={styles.hukamTitle}>Today’s Hukamnama</h2>
              <p className={styles.hukamWhere}>
                Sri Darbar Sahib, Amritsar{hukamDate ? `, ${hukamDate}` : ''}
                {hukam.info?.ang ? ` · Ang ${hukam.info.ang}` : ''}
              </p>
            </div>
            <p className={styles.hukamLine} lang="pa">{hukamFirst.gurmukhi}</p>
            {hukamFirst.english && <p className={styles.hukamMeaning}>{hukamFirst.english}</p>}
            <button type="button" className={styles.primaryButton} onClick={openHukamnama}>
              <FaBookOpen aria-hidden="true" /> Read the Hukamnama
            </button>
          </div>
        </section>
      )}

      {/* ---------- Results ---------- */}
      <section className={styles.section} ref={gridRef} aria-label="Gurbani library">
        {categories.length > 1 && (
          <div className={styles.tabs} role="tablist" aria-label="Category">
            {[{ id: '', label: 'All' }, ...categories].map((c) => (
              <button
                key={c.id || 'all'}
                type="button"
                role="tab"
                aria-selected={category === c.id}
                className={`${styles.tab} ${category === c.id ? styles.tabOn : ''}`}
                onClick={() => setCategory(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}

        {isFiltering && listStatus === 'ready' && (
          <p className={styles.resultsNote}>
            {filteredData.length === 0
              ? 'Nothing matches. Try another word or clear the filters.'
              : `${filteredData.length} ${filteredData.length === 1 ? 'result' : 'results'}${searchQuery.trim() ? ` for “${searchQuery.trim()}”` : ''}`}
          </p>
        )}

        {listStatus === 'error' && (
          <div className={styles.listProblem} role="alert">
            <p>{listError}</p>
            <button type="button" className={styles.secondaryButton} onClick={loadItems}>
              <FaRedo aria-hidden="true" /> Try again
            </button>
          </div>
        )}

        {listStatus === 'ready' && items.length === 0 && (
          <p className={styles.resultsNote}>The Gurbani library is being prepared. Please check back soon.</p>
        )}

        {/* The library as a list of rows: arch-shaped picture, type, title, text and one action.
            Premium items aren't labelled; their button simply says "Unlock to …". */}
        <ul className={styles.list}>
          {isLoading
            ? Array.from({ length: cardsPerPage }).map((_, i) => (
                <li key={`s-${i}`} className={styles.row} aria-hidden="true">
                  <div className={`${styles.rowThumb} ${styles.skeleton}`} />
                  <div className={styles.rowBody}>
                    <span className={`${styles.skeleton} ${styles.skeletonLine}`} />
                    <span className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonShort}`} />
                  </div>
                </li>
              ))
            : currentCards.map((item) => {
                const details = rowDetails(item);
                const locked = isLocked(item);
                return (
                  <li key={item.id} className={`${styles.row} ${styles[`row_${item.type}`] || ''}`}>
                    <div className={styles.rowThumb}>
                      <CoverPicture src={item.image} fallback={item.picture} alt="" className={styles.thumbImage} />
                    </div>
                    <div className={styles.rowBody}>
                      <p className={styles.rowType}>
                        <span aria-hidden="true">{TYPE_META[item.type].icon}</span> {TYPE_META[item.type].label}
                        {LEVEL_META[item.access] && (
                          <span className={`${styles.levelTag} ${styles[`level_${item.access}`]}`}>
                            <span aria-hidden="true">{LEVEL_META[item.access].icon}</span>
                            {LEVEL_META[item.access].label}
                          </span>
                        )}
                      </p>
                      <h3 className={styles.rowTitle}>{item.title}</h3>
                      {item.titleGurmukhi && <p className={styles.rowGurmukhi} lang="pa">{item.titleGurmukhi}</p>}
                      {item.description && <p className={styles.rowText}>{item.description}</p>}
                      {details.length > 0 && <p className={styles.rowDetails}>{details.join(' · ')}</p>}
                    </div>
                    <button
                      type="button"
                      className={`${styles.actionButton} ${styles.rowAction} ${locked ? styles.premiumButton : ''}`}
                      onClick={() => openItem(item)}
                    >
                      {locked ? <FaLock aria-hidden="true" /> : TYPE_META[item.type].icon}
                      {actionLabel(item)}
                    </button>
                  </li>
                );
              })}
        </ul>

        {listStatus === 'ready' && totalPages > 1 && (
          <nav className={styles.pagination} aria-label="Pages">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                type="button"
                onClick={() => paginate(i + 1)}
                className={currentPage === i + 1 ? styles.activePage : ''}
                aria-current={currentPage === i + 1 ? 'page' : undefined}
              >
                {i + 1}
              </button>
            ))}
          </nav>
        )}
      </section>

      {/* ---------- Explore ---------- */}
      <section className={styles.section}>
        <div className={styles.explore}>
          <div className={styles.exploreImage}>
            {isLoading ? <div className={styles.skeleton} /> : <SitePicture name="gurbani-section" alt="" className={styles.exploreImg} />}
          </div>
          <div className={styles.exploreText}>
            <h2 className={styles.sectionTitle}>Explore the Divine Wisdom</h2>
            <p>Immerse yourself in the sacred hymns and teachings of Guru Granth Sahib Ji. Discover the essence of Gurbani and elevate your spiritual journey.</p>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            >
              Start exploring
            </button>
          </div>
        </div>
      </section>

      {/* ---------- Because you viewed: arch tiles ---------- */}
      {(isLoading || items.length > 0) && (
        <section className={styles.section} aria-labelledby="because-title">
          <h2 id="because-title" className={styles.sectionTitle}>
            {lastViewed ? `Because You Viewed ${lastViewed}` : 'Begin With Nitnem'}
          </h2>
          <p className={styles.lede}>More shabads and kirtan you may find peace in.</p>
          <div className={styles.arches}>
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <div key={`a-${i}`} className={`${styles.arch} ${styles.skeleton}`} aria-hidden="true" />)
              : items.filter((item) => item.title !== lastViewed).slice(0, 6).map((item, index) => (
                  <article key={item.id} className={`${styles.arch} ${styles[`archTone${index % 3}`]}`}>
                    <span className={styles.archIcon} aria-hidden="true">{TYPE_META[item.type].icon}</span>
                    {LEVEL_META[item.access] && (
                      <span className={`${styles.levelTag} ${styles.archLevel} ${styles[`level_${item.access}`]}`}>
                        <span aria-hidden="true">{LEVEL_META[item.access].icon}</span>
                        {LEVEL_META[item.access].label}
                      </span>
                    )}
                    <h3 className={styles.archTitle}>{item.title}</h3>
                    <p className={styles.archText}>{item.description}</p>
                    <button
                      type="button"
                      className={`${styles.archButton} ${isLocked(item) ? styles.premiumButton : ''}`}
                      onClick={() => openItem(item)}
                    >
                      {actionLabel(item)}
                    </button>
                  </article>
                ))}
          </div>
        </section>
      )}

      {/* ---------- Reader ---------- */}
      {reader && (
        <GurbaniReader
          apiString={apiString}
          token={accessToken}
          item={reader.item}
          preloaded={reader.preloaded}
          title={reader.title}
          onClose={closeReader}
          onLocked={handleLocked}
          onOpenPdf={reader.item?.hasPdf ? () => openPdf(reader.item) : undefined}
        />
      )}

      {/* ---------- Player ---------- */}
      {showMediaModal && currentMedia && (
        <div className={styles.modalOverlay} onMouseDown={closeModal} role="presentation">
          <div
            className={styles.modal}
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Playing ${currentMedia.title}`}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button type="button" className={styles.modalClose} onClick={closeModal} aria-label="Close player">
              <FaTimes />
            </button>

            {/* The picture / video area, or a loading / problem message in its place */}
            {media.status === 'loading' && (
              <div className={`${styles.mediaState} ${mediaType === 'video' ? styles.mediaStateVideo : ''}`}>
                <span className={styles.spinner} aria-hidden="true" />
                <p>Getting the recording ready…</p>
              </div>
            )}
            {media.status === 'error' && (
              <div className={`${styles.mediaState} ${mediaType === 'video' ? styles.mediaStateVideo : ''}`} role="alert">
                <p>{media.message}</p>
                <button type="button" className={styles.secondaryButton} onClick={() => fetchMedia(currentMedia)}>
                  <FaRedo aria-hidden="true" /> Try again
                </button>
              </div>
            )}
            {media.status === 'ready' && media.kind === 'youtube' && (
              <div className={`${styles.videoContainer} ${styles.youtube}`}>
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(media.youtubeId)}?rel=0&modestbranding=1`}
                  title={currentMedia.title}
                  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            )}
            {isOwnFile && mediaType === 'video' && (
              <div className={styles.videoContainer}>
                <video
                  ref={mediaRef}
                  src={media.url}
                  className={styles.videoPlayer}
                  onClick={togglePlayPause}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={() => setIsPlaying(false)}
                  onError={handleMediaError}
                  preload="metadata"
                  playsInline
                />
              </div>
            )}
            {isOwnFile && mediaType === 'audio' && (
              <div className={styles.artwork}>
                <CoverPicture
                  src={currentMedia.image}
                  fallback={currentMedia.picture || 'gurbani-audio'}
                  alt=""
                  className={`${styles.artworkImg} ${isPlaying ? styles.artworkSpin : ''}`}
                />
              </div>
            )}

            <div className={styles.modalInfo}>
              <h3>{currentMedia.title}</h3>
              {currentMedia.artist && <p className={styles.modalArtist}>{currentMedia.artist}</p>}
              {currentMedia.description && <p>{currentMedia.description}</p>}
              {/* Credit for the recording: the channel, its source and licence (CC BY requires this) */}
              {media.status === 'ready' && media.credit && (
                <p className={styles.credit}>
                  {media.kind === 'youtube' ? 'From ' : 'Recording: '}
                  {media.credit.url ? (
                    <a href={media.credit.url} target="_blank" rel="noopener noreferrer">
                      {media.credit.label || 'the original'}{media.kind === 'youtube' ? ' on YouTube' : ''}
                    </a>
                  ) : (
                    media.credit.label
                  )}
                  {media.credit.licenseLabel && <span> · {media.credit.licenseLabel}</span>}
                </p>
              )}
            </div>

            {/* Our own controls for our files; YouTube brings its own */}
            {isOwnFile && (
              <div className={styles.controls}>
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="1"
                  value={currentTime}
                  onChange={handleSeek}
                  className={styles.progressBar}
                  style={{ '--progress': `${progress}%` }}
                  aria-label="Seek"
                />
                <div className={styles.timeDisplay}>
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>

                <div className={styles.mainControls}>
                  <button type="button" className={styles.controlButton} onClick={() => playStep(-1)} aria-label="Previous" disabled={playlist.length < 2}>
                    <FaStepBackward />
                  </button>
                  <button type="button" className={styles.playButton} onClick={togglePlayPause} aria-label={isPlaying ? 'Pause' : 'Play'}>
                    {isPlaying ? <FaPause /> : <FaPlay className={styles.playNudge} />}
                  </button>
                  <button type="button" className={styles.controlButton} onClick={() => playStep(1)} aria-label="Next" disabled={playlist.length < 2}>
                    <FaStepForward />
                  </button>
                </div>

                <div className={styles.secondaryControls}>
                  <label className={styles.volume}>
                    <FaVolumeUp aria-hidden="true" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={handleVolumeChange}
                      className={styles.volumeSlider}
                      style={{ '--progress': `${volume * 100}%` }}
                      aria-label="Volume"
                    />
                  </label>
                  {mediaType === 'video' && (
                    <button type="button" className={styles.controlButton} onClick={toggleFullscreen} aria-label="Full screen">
                      <FaExpand />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Read along: the words of what is playing */}
            {currentMedia.hasText && (
              <div className={styles.readAlong}>
                <button
                  type="button"
                  className={styles.readAlongToggle}
                  onClick={() => setShowWords((v) => !v)}
                  aria-expanded={showWords}
                >
                  <FaBookOpen aria-hidden="true" /> {showWords ? 'Hide the words' : 'Read along'}
                </button>
                {showWords && (
                  <GurbaniReader
                    apiString={apiString}
                    token={accessToken}
                    item={currentMedia}
                    variant="inline"
                    onLocked={handleLocked}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Gurbani;
