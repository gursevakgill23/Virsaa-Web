import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaCrown, FaSearch, FaTimes, FaVideo, FaHeadphones, FaLock, FaMicrophone, FaPlay, FaPause,
  FaStepBackward, FaStepForward, FaVolumeUp, FaExpand, FaBookOpen,
} from 'react-icons/fa';
import PageHero from '../../components/PageHero/PageHero';
import useHistoryRecorder from '../../hooks/useHistoryRecorder';
import styles from './Gurbani.module.css';
import audioFile from './assets/Nitnem.mp3';
import videoFile from './assets/Aarti.mp4';

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

// Only filters that actually narrow the list. Language and raag filters can be
// added back here once the data has those fields.
const FILTERS = [
  { id: 'shabad', label: 'Shabad', icon: <FaBookOpen /> },
  { id: 'audio', label: 'Audio kirtan', icon: <FaHeadphones /> },
  { id: 'video', label: 'Video kirtan', icon: <FaVideo /> },
  { id: 'premium', label: 'Premium', icon: <FaCrown /> },
];

const TYPE_META = {
  shabad: { label: 'Shabad', icon: <FaBookOpen /> },
  audio: { label: 'Audio kirtan', icon: <FaHeadphones /> },
  video: { label: 'Video kirtan', icon: <FaVideo /> },
};

const actionLabel = (item) => {
  if (item.type === 'shabad') return item.isPremium ? 'Unlock to read' : 'Read now';
  if (item.type === 'audio') return item.isPremium ? 'Unlock to listen' : 'Listen now';
  return item.isPremium ? 'Unlock to watch' : 'Watch now';
};

const Gurbani = ({ isDarkMode, apiString }) => {
  const recordHistory = useHistoryRecorder(apiString);
  const getImagePath = useProductionImagePath();

  const header_image_light = '/images/header-image.png';
  const header_image_dark = '/images/header-image-dark.png';
  const gurbaniImage = '/images/Gurbani/gurbani.png';
  const audioKirtanImage = '/images/Gurbani/audio-kirtan.jpg';
  const videoKirtanImage = '/images/Gurbani/video-kirtan.jpg';
  const sectionImage = '/images/Gurbani/section-image.jpg';
  const bookImage = '/images/Collections/book-image.jpg';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [cardsPerPage] = useState(10);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [currentMedia, setCurrentMedia] = useState(null);
  const [mediaType, setMediaType] = useState(null); // 'audio' | 'video'
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);

  const recognitionRef = useRef(null);
  const mediaRef = useRef(null);
  const modalRef = useRef(null);
  const gridRef = useRef(null);
  const navigate = useNavigate();

  const gurbaniData = useMemo(() => [
    { id: 1, type: 'shabad', image: gurbaniImage, title: 'Shabad 1', description: 'This is a description of the first shabad.', isPremium: true },
    { id: 2, type: 'audio', image: audioKirtanImage, title: 'Anand Sahib', description: 'Listen to the divine Anand Sahib by Bhai Harjinder Singh.', isPremium: false },
    { id: 3, type: 'video', image: videoKirtanImage, title: 'Rehras Sahib', description: 'Watch the soulful Rehras Sahib by Bhai Balbir Singh.', isPremium: true },
    { id: 4, type: 'shabad', image: gurbaniImage, title: 'Shabad 2', description: 'This is a description of the second shabad.', isPremium: false },
    { id: 5, type: 'audio', image: audioKirtanImage, title: 'Japji Sahib', description: 'Experience the spiritual Japji Sahib by Bhai Niranjan Singh.', isPremium: true },
    { id: 6, type: 'video', image: videoKirtanImage, title: 'Kirtan Sohila', description: 'Enjoy the peaceful Kirtan Sohila by Bhai Jarnail Singh.', isPremium: false },
    { id: 7, type: 'shabad', image: gurbaniImage, title: 'Shabad 3', description: 'This is a description of the third shabad.', isPremium: true },
    { id: 8, type: 'audio', image: audioKirtanImage, title: 'Rehras Sahib', description: 'Meditate with the soothing Rehras Sahib by Bhai Balbir Singh.', isPremium: false },
    { id: 9, type: 'video', image: videoKirtanImage, title: 'Asa Di Var', description: 'Experience the uplifting Asa Di Var by Bhai Harjinder Singh.', isPremium: true },
    { id: 10, type: 'shabad', image: gurbaniImage, title: 'Shabad 4', description: 'This is a description of the fourth shabad.', isPremium: false },
    { id: 11, type: 'audio', image: audioKirtanImage, title: 'Sukhmani Sahib', description: 'Find peace with Sukhmani Sahib by Bhai Niranjan Singh.', isPremium: true },
    { id: 12, type: 'video', image: videoKirtanImage, title: 'Japji Sahib', description: 'Experience the spiritual Japji Sahib by Bhai Niranjan Singh.', isPremium: false },
    { id: 13, type: 'shabad', image: gurbaniImage, title: 'Shabad 5', description: 'This is a description of the fifth shabad.', isPremium: true },
    { id: 14, type: 'audio', image: audioKirtanImage, title: 'Anand Sahib', description: 'Listen to the divine Anand Sahib by Bhai Harjinder Singh.', isPremium: false },
    { id: 15, type: 'video', image: videoKirtanImage, title: 'Rehras Sahib', description: 'Watch the soulful Rehras Sahib by Bhai Balbir Singh.', isPremium: true },
    { id: 16, type: 'shabad', image: gurbaniImage, title: 'Shabad 6', description: 'This is a description of the sixth shabad.', isPremium: false },
    { id: 17, type: 'audio', image: audioKirtanImage, title: 'Kirtan Sohila', description: 'End your day with the peaceful Kirtan Sohila by Bhai Jarnail Singh.', isPremium: true },
    { id: 18, type: 'video', image: videoKirtanImage, title: 'Asa Di Var', description: 'Experience the uplifting Asa Di Var by Bhai Harjinder Singh.', isPremium: false },
    { id: 19, type: 'shabad', image: gurbaniImage, title: 'Shabad 7', description: 'This is a description of the seventh shabad.', isPremium: true },
    { id: 20, type: 'audio', image: audioKirtanImage, title: 'Sukhmani Sahib', description: 'Find peace with Sukhmani Sahib by Bhai Niranjan Singh.', isPremium: false },
  ], [gurbaniImage, audioKirtanImage, videoKirtanImage]);

  // ---------- Media player ----------
  const togglePlayPause = () => {
    const el = mediaRef.current;
    if (!el) return;
    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      el.play().then(() => setIsPlaying(true)).catch((error) => {
        console.error('Playback failed:', error.message);
        setIsPlaying(false);
      });
    }
  };

  const handleTimeUpdate = () => setCurrentTime(mediaRef.current.currentTime);
  const handleLoadedMetadata = () => {
    setDuration(mediaRef.current.duration);
    mediaRef.current.volume = volume;
  };

  const handleSeek = (e) => {
    const seekTime = Number(e.target.value);
    mediaRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleVolumeChange = (e) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);
    if (mediaRef.current) mediaRef.current.volume = newVolume;
  };

  const formatTime = (time) => {
    if (!Number.isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const playMedia = (item, type) => {
    recordHistory({ type: type === 'video' ? 'video' : 'gurbani', item_id: `gurbani-${item.id}`, title: item.title, path: '/gurbani' });
    setCurrentMedia(item);
    setMediaType(type);
    setShowMediaModal(true);
    setIsPlaying(false);
    setCurrentTime(0);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    mediaRef.current?.pause();
    setShowMediaModal(false);
    setIsPlaying(false);
    document.body.style.overflow = 'auto';
  };

  const playNext = () => {
    const currentIndex = gurbaniData.findIndex((item) => item.id === currentMedia.id);
    playMedia(gurbaniData[(currentIndex + 1) % gurbaniData.length], mediaType);
  };

  const playPrevious = () => {
    const currentIndex = gurbaniData.findIndex((item) => item.id === currentMedia.id);
    playMedia(gurbaniData[(currentIndex - 1 + gurbaniData.length) % gurbaniData.length], mediaType);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      modalRef.current?.requestFullscreen().catch((err) => console.error('Fullscreen failed:', err.message));
    } else {
      document.exitFullscreen();
    }
  };

  // Item action: premium goes to /premium, media opens the player
  const openItem = (item) => {
    if (item.isPremium) {
      navigate('/premium');
    } else if (item.type === 'audio' || item.type === 'video') {
      playMedia(item, item.type);
    } else if (item.fileUrl) {
      window.open(item.fileUrl, '_blank', 'noopener');
    }
  };

  // Voice search setup + fake loading delay
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.onresult = (event) => setSearchQuery(event.results[0][0].transcript);
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
      recognitionRef.current.onend = () => setIsListening(false);
    }

    const loadingTimer = setTimeout(() => setIsLoading(false), 1200);
    return () => {
      clearTimeout(loadingTimer);
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

  const filteredData = useMemo(() => {
    let results = gurbaniData;
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      results = results.filter((item) => item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q));
    }
    if (selectedFilters.length > 0) {
      results = results.filter((item) => {
        if (selectedFilters.includes('premium') && !item.isPremium) return false;
        const typeFilters = selectedFilters.filter((f) => f !== 'premium');
        if (typeFilters.length && !typeFilters.includes(item.type)) return false;
        return true;
      });
    }
    return results;
  }, [searchQuery, selectedFilters, gurbaniData]);

  useEffect(() => setCurrentPage(1), [searchQuery, selectedFilters]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / cardsPerPage));
  const currentCards = filteredData.slice((currentPage - 1) * cardsPerPage, currentPage * cardsPerPage);
  const isFiltering = searchQuery.trim() || selectedFilters.length > 0;

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const toggleVoiceSearch = () => {
    if (!recognitionRef.current) {
      alert('Voice search isn’t supported in this browser. Try Chrome or Edge.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleFilterClick = (filter) => {
    setSelectedFilters((prev) => (prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]));
  };

  const clearFilters = () => {
    setSelectedFilters([]);
    setSearchQuery('');
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`${styles.page} notranslate`} translate="no">
      {mediaType === 'audio' && showMediaModal && (
        <audio
          ref={mediaRef}
          src={audioFile}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
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


      {/* ---------- Results ---------- */}
      <section className={styles.section} ref={gridRef} aria-label="Gurbani library">
        {isFiltering && !isLoading && (
          <p className={styles.resultsNote}>
            {filteredData.length === 0
              ? 'Nothing matches. Try another word or clear the filters.'
              : `${filteredData.length} ${filteredData.length === 1 ? 'result' : 'results'}${searchQuery.trim() ? ` for “${searchQuery.trim()}”` : ''}`}
          </p>
        )}

        <div className={styles.cardGrid}>
          {isLoading
            ? Array.from({ length: cardsPerPage }).map((_, i) => (
                <div key={`s-${i}`} className={styles.card} aria-hidden="true">
                  <div className={`${styles.cardMedia} ${styles.skeleton}`} />
                  <div className={styles.cardBody}>
                    <span className={`${styles.skeleton} ${styles.skeletonLine}`} />
                    <span className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonShort}`} />
                  </div>
                </div>
              ))
            : currentCards.map((item) => (
                <article key={item.id} className={`${styles.card} ${item.isPremium ? styles.premiumCard : ''}`}>
                  <div className={styles.cardMedia}>
                    <img src={getImagePath(item.image)} alt="" className={styles.cardImage} loading="lazy" />
                    <span className={styles.typeBadge}>
                      <span aria-hidden="true">{TYPE_META[item.type].icon}</span> {TYPE_META[item.type].label}
                    </span>
                    {item.isPremium && (
                      <span className={styles.premiumBadge}><FaCrown aria-hidden="true" /> Premium</span>
                    )}
                  </div>
                  <div className={styles.cardBody}>
                    <h3 className={styles.cardTitle}>{item.title}</h3>
                    <p className={styles.cardText}>{item.description}</p>
                    <button
                      type="button"
                      className={`${styles.actionButton} ${item.isPremium ? styles.premiumButton : ''}`}
                      onClick={() => openItem(item)}
                    >
                      {item.isPremium ? <FaLock aria-hidden="true" /> : TYPE_META[item.type].icon}
                      {actionLabel(item)}
                    </button>
                  </div>
                </article>
              ))}
        </div>

        {!isLoading && totalPages > 1 && (
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
            {isLoading ? <div className={styles.skeleton} /> : <img src={getImagePath(sectionImage)} alt="" loading="lazy" />}
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
      <section className={styles.section} aria-labelledby="because-title">
        <h2 id="because-title" className={styles.sectionTitle}>Because You Viewed Rehraas Sahib</h2>
        <p className={styles.lede}>More shabads and kirtan you may find peace in.</p>
        <div className={styles.arches}>
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <div key={`a-${i}`} className={`${styles.arch} ${styles.skeleton}`} aria-hidden="true" />)
            : gurbaniData.slice(0, 6).map((item, index) => (
                <article key={item.id} className={`${styles.arch} ${styles[`archTone${index % 3}`]}`}>
                  {item.isPremium && <span className={styles.archCrown} aria-label="Premium"><FaCrown /></span>}
                  <span className={styles.archIcon} aria-hidden="true">{TYPE_META[item.type].icon}</span>
                  <h3 className={styles.archTitle}>{item.title}</h3>
                  <p className={styles.archText}>{item.description}</p>
                  <button
                    type="button"
                    className={`${styles.archButton} ${item.isPremium ? styles.premiumButton : ''}`}
                    onClick={() => openItem(item)}
                  >
                    {actionLabel(item)}
                  </button>
                </article>
              ))}
        </div>
      </section>

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

            {mediaType === 'video' ? (
              <div className={styles.videoContainer}>
                <video
                  ref={mediaRef}
                  src={videoFile}
                  className={styles.videoPlayer}
                  onClick={togglePlayPause}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={() => setIsPlaying(false)}
                  playsInline
                />
              </div>
            ) : (
              <div className={styles.artwork}>
                <img src={getImagePath(bookImage)} alt="" className={`${isPlaying ? styles.artworkSpin : ''}`} />
              </div>
            )}

            <div className={styles.modalInfo}>
              <h3>{currentMedia.title}</h3>
              <p>{currentMedia.description}</p>
            </div>

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
                <button type="button" className={styles.controlButton} onClick={playPrevious} aria-label="Previous">
                  <FaStepBackward />
                </button>
                <button type="button" className={styles.playButton} onClick={togglePlayPause} aria-label={isPlaying ? 'Pause' : 'Play'}>
                  {isPlaying ? <FaPause /> : <FaPlay className={styles.playNudge} />}
                </button>
                <button type="button" className={styles.controlButton} onClick={playNext} aria-label="Next">
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
          </div>
        </div>
      )}
    </div>
  );
};

export default Gurbani;
