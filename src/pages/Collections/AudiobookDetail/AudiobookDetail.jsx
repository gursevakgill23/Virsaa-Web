/**
 * pages/Collections/AudiobookDetail/AudiobookDetail.jsx
 * -----------------------------------------------------------------------------
 * One audiobook (/collections/audiobooks/audiobook/:id):
 *   - cover (a real picture, credited), details, and the actions
 *     (components/DetailActions): Like / Save for later / Share
 *   - where it plays from (the API's `media`):
 *       "youtube"  a recording on YouTube, played in YouTube's own player (its
 *                  terms allow embedding, not copying). The player loads only
 *                  when the visitor presses Play, so YouTube sees nothing before
 *                  that, and it uses YouTube's privacy-enhanced address.
 *                  Each part (or chapter time) can be played from the list.
 *       "file"     our own mp3 (private on S3; the API returns a temporary link
 *                  for signed-in visitors) in our player: play/pause, ±15 s, seek
 *   - chapters / parts, description, ratings and reviews (components/Reviews),
 *     related audiobooks
 *   - audiobooks made from one of our ebooks by Google's voice (the API's
 *     `ebook`): "Read the book", and Listen shows "Coming soon" until they
 *     have been checked (utils/features.js; staff accounts can already play them)
 * Listening is saved to History. While loading, the Virsaa loader is shown.
 * -----------------------------------------------------------------------------
 */
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FaHeart, FaRegHeart, FaBookmark, FaRegBookmark, FaShareAlt, FaChevronLeft, FaChevronRight,
  FaStar, FaRegStar, FaPlay, FaPause, FaHeadphones, FaClock, FaLock, FaChevronDown,
  FaUndoAlt, FaRedoAlt, FaYoutube, FaExternalLinkAlt, FaMicrophone, FaHandHoldingHeart, FaBookOpen } from 'react-icons/fa';
import styles from './AudiobookDetail.module.css';
import PageHero from '../../../components/PageHero/PageHero';
import Loader from '../../../components/VirsaaLoader/Loader';
import Reviews from '../../../components/Reviews/Reviews';
import { CoverPicture } from '../../../components/SitePicture/SitePicture';
import axios from 'axios';
import useLibraryItem from '../../../hooks/useLibraryItem';
import useHistoryRecorder from '../../../hooks/useHistoryRecorder';
import { useAuth } from '../../../context/AuthContext';
import { safeExternalUrl, safeUrl } from '../../../utils/safeUrl';
import DetailActions, { ActionLink, ListenSoon } from '../../../components/DetailActions/DetailActions';
import { canPlayEbookAudio } from '../../../utils/features';

const HEADER_LIGHT = '/images/header-image.png';
const HEADER_DARK = '/images/header-image-dark.png';

// ---------------------------------------------------------------- YouTube
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * YouTube's privacy-enhanced embed address for one video, from `start` seconds.
 * `next` lists the following parts' videos, which YouTube then plays in order.
 */
const embedUrl = (videoId, start, autoplay, next = []) => {
  const params = new URLSearchParams({ rel: '0', playsinline: '1' });
  if (start) params.set('start', String(Math.max(0, Math.floor(start))));
  if (autoplay) params.set('autoplay', '1');
  if (next.length) params.set('playlist', next.slice(0, 50).join(','));
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
};

/** Only links to youtube.com / youtu.be are shown as "on YouTube". */
const youtubeLink = (url) => {
  const safe = safeExternalUrl(url);
  try {
    const host = new URL(safe).hostname.replace(/^www\./, '');
    return ['youtube.com', 'm.youtube.com', 'youtu.be'].includes(host) ? safe : '';
  } catch {
    return '';
  }
};

// Five stars, filled up to `value`
const Stars = ({ value }) => (
  <span className={styles.stars} aria-label={`${value} out of 5`}>
    {[1, 2, 3, 4, 5].map((i) =>
      i <= Math.round(value) ? <FaStar key={i} className={styles.starOn} /> : <FaRegStar key={i} className={styles.starOff} />
    )}
  </span>
);

// Placeholder cards while related audiobooks load
const RelatedSkeleton = () => (
  <div className={styles.relatedCard} aria-hidden="true">
    <span className={`${styles.relatedThumb} ${styles.relatedThumbSquare} ${styles.skeleton}`} />
    <span className={styles.relatedInfo}>
      <span className={`${styles.skeleton} ${styles.skeletonLine}`} />
      <span className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineShort}`} />
    </span>
  </div>
);

/** API audiobook -> what the page shows. */
const toAudiobook = (data, authorName) => {
  const chapters = (Array.isArray(data.chapters) ? data.chapters : [])
    .map((c) => ({ ...c, youtube_id: VIDEO_ID.test(c.youtube_id || '') ? c.youtube_id : '' }));
  const youtube = data.media === 'youtube' && data.youtube ? {
    videoId: VIDEO_ID.test(data.youtube.video_id || '') ? data.youtube.video_id : (chapters.find((c) => c.youtube_id)?.youtube_id || ''),
    channel: data.youtube.channel || '',
    url: youtubeLink(data.youtube.url),
  } : null;
  return {
    id: data.id,
    title: data.title,
    titlePa: data.title_pa || '',
    author: authorName,
    authorId: data.author,
    narrator: data.narrator || '',
    language: data.language_label || '',
    cover: data.cover || '',
    coverCredit: data.cover_credit?.text || '',
    coverSource: safeExternalUrl(data.cover_credit?.source_url),
    rating: Number(data.rating) || 0,
    length: data.duration,
    format: data.format || 'MP3',
    genre: data.genre || 'Audiobook',
    description: data.description || '',
    media: youtube?.videoId ? 'youtube' : data.media === 'file' ? 'file' : null,
    youtube,
    chapters,
    tags: Array.isArray(data.tags) ? data.tags : [],
    sharedBy: data.shared_by?.name || '',
    // made from one of our ebooks by Google's Punjabi voice: {id, title}
    ebook: Number.isInteger(data.ebook?.id) ? { id: data.ebook.id, title: data.ebook.title || '' } : null,
  };
};

const AudiobookDetail = ({ isDarkMode, apiString }) => {
  const { id } = useParams();
  const { accessToken, isLoggedIn, userData } = useAuth();
  const mayListen = canPlayEbookAudio(userData); // staff check the audiobooks made from ebooks before everyone
  const tokenRef = useRef(accessToken); // a renewed token mustn't fetch the audio link again
  tokenRef.current = accessToken;
  // Audiobook data, loading/error state and the audio link
  const [audiobook, setAudiobook] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const library = useLibraryItem(apiString, 'audiobook', id);
  const recordHistory = useHistoryRecorder(apiString);
  const listenedRef = useRef(false); // first play of this visit counts as opening it
  const { liked, saved } = library;
  const [loadError, setLoadError] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [related, setRelated] = useState([]);
  const apiUrl = (apiString || process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
  const safeId = encodeURIComponent(id); // the id comes from the URL, so encode it before use in a path
  const [reloadKey, setReloadKey] = useState(0); // bumped by "Try again"
  // Chapter/description toggles and the player's state
  const [expandedChapter, setExpandedChapter] = useState(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  // YouTube: what is in the player (null until the visitor presses Play)
  const [nowPlaying, setNowPlaying] = useState(null); // { videoId, start, chapterId, autoplay }

  const audioRef = useRef(null);
  const listenRef = useRef(null);
  const relatedRef = useRef(null);
  const recommendedRef = useRef(null);

  // Average rating and number of reviews, reported by the Reviews section
  const [reviewSummary, setReviewSummary] = useState({ count: 0, average: null });

  // ---------- History ----------
  // What gets saved to History for this audiobook
  const historyEntry = (extra = {}) => ({
    type: 'audiobook',
    item_id: id,
    title: audiobook?.title,
    path: `/collections/audiobooks/audiobook/${id}`,
    image: audiobook?.cover,
    ...extra,
  });

  const listeningProgress = () => {
    const el = audioRef.current;
    if (!el || !el.duration) return {};
    return { progress: (el.currentTime / el.duration) * 100, position: Math.round(el.currentTime) };
  };

  const saveListening = (force = false) => {
    if (!audiobook || !listenedRef.current) return;
    recordHistory(historyEntry(listeningProgress()), { progressOnly: true, force });
  };

  const handlePlayStarted = () => {
    setIsPlaying(true);
    if (!listenedRef.current && audiobook) {
      listenedRef.current = true;
      recordHistory(historyEntry(listeningProgress()));
    }
  };

  // ---------------------------------------------------------------- our own player (mp3)
  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      saveListening(true);
    } else {
      audioRef.current.play().then(handlePlayStarted).catch(() => setIsPlaying(false));
    }
  };

  const skip = (seconds) => {
    if (!audioRef.current) return;
    const next = Math.min(Math.max(audioRef.current.currentTime + seconds, 0), duration || 0);
    audioRef.current.currentTime = next;
    setCurrentTime(next);
  };

  const handleTimeUpdate = () => {
    setCurrentTime(audioRef.current.currentTime);
    saveListening(); // throttled to every 15 seconds
  };
  const handleLoadedMetadata = () => setDuration(audioRef.current.duration);

  const handleSeek = (e) => {
    const seekTime = Number(e.target.value);
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  // Seconds → "m:ss"
  const formatTime = (time) => {
    if (!Number.isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // ---------------------------------------------------------------- YouTube player
  /** Load YouTube's player with this part (or chapter time) and start it. */
  const playOnYouTube = (picked = null) => {
    if (!audiobook?.youtube) return;
    // Starting from the top: the part that holds the book's first video, if parts are videos
    const chapter = picked
      || audiobook.chapters.find((c) => c.youtube_id && c.youtube_id === audiobook.youtube.videoId) || null;
    const videoId = chapter?.youtube_id || audiobook.youtube.videoId;
    if (!VIDEO_ID.test(videoId || '')) return;
    // The parts after this one play on by themselves
    const position = chapter ? audiobook.chapters.indexOf(chapter) : -1;
    const next = chapter?.youtube_id
      ? audiobook.chapters.slice(position + 1).map((c) => c.youtube_id).filter(Boolean)
      : [];
    setNowPlaying({
      videoId, next, start: chapter?.youtube_id ? 0 : chapter?.start_seconds || 0, chapterId: chapter?.id ?? null, autoplay: true,
    });
    if (!listenedRef.current) {
      listenedRef.current = true;
      const index = chapter ? audiobook.chapters.findIndex((c) => c.id === chapter.id) : 0;
      const parts = audiobook.chapters.length;
      recordHistory(historyEntry(parts > 1 && index >= 0 ? { progress: (index / parts) * 100, position: index + 1 } : {}));
    }
    listenRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  // ---------------------------------------------------------------- load
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setRelatedLoading(true);
    setLoadError(null);
    setAudioUrl(null);
    setNowPlaying(null);
    listenedRef.current = false;
    setIsPlaying(false);
    setCurrentTime(0);

    const load = async () => {
      let book = null;
      try {
        const { data } = await axios.get(`${apiUrl}/collections/audiobooks/${safeId}/`, { timeout: 20000 });
        let authorName = '';
        if (data.author) {
          authorName = await axios.get(`${apiUrl}/collections/authors/${encodeURIComponent(data.author)}/`, { timeout: 20000 })
            .then((r) => r.data?.name || '').catch(() => '');
        }
        if (cancelled) return;
        book = toAudiobook(data, authorName);
        setAudiobook(book);
      } catch (err) {
        if (!cancelled) setLoadError(err.response?.status === 404 ? 'This audiobook could not be found.' : 'This audiobook couldn’t be loaded right now.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }

      const all = await axios.get(`${apiUrl}/collections/audiobooks/`, { timeout: 20000 }).catch(() => ({ data: [] }));
      if (cancelled) return;
      const list = Array.isArray(all.data) ? all.data : all.data?.results || [];
      setRelated(list.filter((a) => String(a.id) !== String(id)).slice(0, 11).map((a) => ({
        id: a.id, title: a.title, meta: [a.genre, a.duration].filter(Boolean).join(' · ') || 'Audiobook', cover: a.cover || '',
      })));
      setRelatedLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, [id, safeId, apiUrl, reloadKey]);

  // Made from an ebook by Google's voice and not checked yet: "Coming soon" (staff can play it)
  const comingSoon = Boolean(audiobook?.ebook) && !mayListen;
  const playsFile = audiobook?.media === 'file' && !comingSoon;

  // Our own mp3s are private on S3; stream_audio returns a temporary link (signed in only)
  useEffect(() => {
    if (!playsFile || !isLoggedIn) return undefined;
    let cancelled = false;
    axios.get(`${apiUrl}/collections/audiobooks/${safeId}/stream_audio/`, {
      timeout: 20000, headers: { Authorization: `Bearer ${tokenRef.current}` },
    })
      .then((r) => { if (!cancelled) setAudioUrl(safeUrl(r.data?.audio_url) || null); })
      .catch(() => { if (!cancelled) setAudioUrl(null); });
    return () => { cancelled = true; };
  }, [playsFile, isLoggedIn, apiUrl, safeId, reloadKey]);

  // Share sheet on phones, otherwise copy the link
  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: audiobook?.title, url });
      else await navigator.clipboard.writeText(url);
    } catch {
      // share sheet dismissed
    }
  };

  const toggleChapter = (chapterId) => setExpandedChapter(expandedChapter === chapterId ? null : chapterId);

  // A chapter's play button: YouTube part / chapter time, or our player from the start
  const handleListenChapter = (chapter) => {
    if (audiobook?.media === 'youtube') {
      playOnYouTube(chapter);
      return;
    }
    if (!audioRef.current) return;
    // Our own recordings: a chapter is a point in the one file (start_seconds)
    audioRef.current.currentTime = Number(chapter?.start_seconds) || 0;
    audioRef.current.play().then(handlePlayStarted).catch(() => setIsPlaying(false));
  };

  const scrollRow = (ref, direction) => {
    ref.current?.scrollBy({ left: direction === 'left' ? -300 : 300, behavior: 'smooth' });
  };

  // ---------------------------------------------------------------- render
  if (isLoading) {
    return <div className={styles.page}><Loader /></div>;
  }

  if (loadError || !audiobook) {
    return (
      <div className={styles.page}>
        <div className={styles.layout}>
          <p className={styles.sectionNote}>
            {loadError || 'This audiobook could not be found.'}{' '}
            {loadError && loadError !== 'This audiobook could not be found.' && (
              <><button type="button" className={styles.linkButton} onClick={() => setReloadKey((k) => k + 1)}>Try again</button> or </>
            )}
            <Link to="/collections/audiobooks">Browse audiobooks</Link>
          </p>
        </div>
      </div>
    );
  }

  const [firstParagraph] = audiobook.description.split('\n');
  const progress = duration ? (currentTime / duration) * 100 : 0;
  const hasMoreDescription = audiobook.description.length > firstParagraph.length;
  const isYouTube = audiobook.media === 'youtube';
  const partsAreVideos = audiobook.chapters.some((c) => c.youtube_id);
  const lockedCount = audiobook.chapters.filter((c) => c.locked).length;

  // A scrolling row of related audiobooks
  const renderRelated = (items, ref, label) => (
    <section className={`${styles.asideBlock} ${styles.glass}`}>
      <div className={styles.asideHead}>
        <h3 className={styles.asideTitle}>{label}</h3>
        <div className={styles.scrollButtons}>
          <button type="button" onClick={() => scrollRow(ref, 'left')} className={styles.scrollButton} aria-label={`Scroll ${label} left`}>
            <FaChevronLeft />
          </button>
          <button type="button" onClick={() => scrollRow(ref, 'right')} className={styles.scrollButton} aria-label={`Scroll ${label} right`}>
            <FaChevronRight />
          </button>
        </div>
      </div>
      <div className={styles.relatedList} ref={ref}>
        {relatedLoading
          ? Array.from({ length: 4 }).map((_, i) => <RelatedSkeleton key={i} />)
          : items.map((book) => (
              <Link key={book.id} to={`/collections/audiobooks/audiobook/${book.id}`} className={styles.relatedCard}>
                <CoverPicture src={book.cover} alt="" className={`${styles.relatedThumb} ${styles.relatedThumbSquare}`} />
                <span className={styles.relatedInfo}>
                  <span className={styles.relatedTitle}>{book.title}</span>
                  <span className={styles.relatedMeta}>{book.meta}</span>
                </span>
              </Link>
            ))}
      </div>
    </section>
  );

  return (
    <div className={styles.page}>
      {playsFile && (
        <audio
          ref={audioRef}
          src={audioUrl || undefined}
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => { setIsPlaying(false); saveListening(true); }}
        />
      )}

      <PageHero
        compact
        image={isDarkMode ? HEADER_DARK : HEADER_LIGHT}
        title={audiobook.title}
        subtitle={audiobook.author ? `by ${audiobook.author}` : 'Audiobook'}
        crumbs={[
          { label: 'Home', to: '/' },
          { label: 'Collections', to: '/collections' },
          { label: 'Audiobooks', to: '/collections/audiobooks' },
          { label: audiobook.title },
        ]}
      />

      <div className={styles.layout}>
        <div className={styles.main}>
          <section className={styles.productCard} aria-label="Audiobook details">
            <div className={styles.coverStage}>
              <div className={`${styles.cover} ${styles.coverSquare} ${isPlaying || nowPlaying ? styles.coverPlaying : ''}`}>
                <CoverPicture src={audiobook.cover} alt={`Cover of ${audiobook.title}`} className={styles.coverImg} loading="eager" />
              </div>
              {audiobook.cover && audiobook.coverCredit && (
                <p className={styles.coverCredit}>
                  Cover picture:{' '}
                  {audiobook.coverSource
                    ? <a href={audiobook.coverSource} target="_blank" rel="noopener noreferrer">{audiobook.coverCredit}</a>
                    : audiobook.coverCredit}
                </p>
              )}
            </div>

            <div className={styles.info}>
              <div className={styles.chipRow}>
                <span className={styles.chip}><FaHeadphones aria-hidden="true" /> {audiobook.genre}</span>
                <span className={styles.ratingRow}>
                  <Stars value={reviewSummary.average ?? audiobook.rating} />
                  {(reviewSummary.average ?? audiobook.rating).toFixed(1)} · {reviewSummary.count.toLocaleString()} {reviewSummary.count === 1 ? 'review' : 'reviews'}
                </span>
              </div>

              <h2 className={styles.title}>{audiobook.title}</h2>
              {audiobook.titlePa && <p className={styles.titlePa} lang="pa">{audiobook.titlePa}</p>}
              {audiobook.author && (
                <p className={styles.byline}>
                  by {audiobook.authorId ? <Link to={`/collections/authors/author/${audiobook.authorId}`}>{audiobook.author}</Link> : audiobook.author}
                </p>
              )}

              <div className={styles.metaRow}>
                {audiobook.length && <span className={styles.metaPill}><FaClock aria-hidden="true" /> {audiobook.length}</span>}
                {audiobook.language && <span className={styles.metaPill}>{audiobook.language}</span>}
                {isYouTube
                  ? <span className={styles.metaPill}><FaYoutube aria-hidden="true" /> YouTube</span>
                  : <span className={styles.metaPill}>{audiobook.format}</span>}
                {audiobook.chapters.length > 0 && (
                  <span className={styles.metaPill}>
                    {audiobook.chapters.length} {partsAreVideos ? (audiobook.chapters.length === 1 ? 'part' : 'parts') : (audiobook.chapters.length === 1 ? 'chapter' : 'chapters')}
                  </span>
                )}
              </div>

              {/* Recordings shared by listeners (My Rewards): their tags and who shared it */}
              {(audiobook.sharedBy || audiobook.tags.length > 0) && (
                <div className={styles.sharedRow}>
                  {audiobook.tags.map((tag) => <span key={tag} className={styles.tagPill}>{tag}</span>)}
                  {audiobook.sharedBy && (
                    <span className={styles.sharedBy}><FaHandHoldingHeart aria-hidden="true" /> Shared by {audiobook.sharedBy}</span>
                  )}
                </div>
              )}

              <div className={styles.description}>
                <p className={styles.descText}>{showFullDescription ? audiobook.description : firstParagraph}</p>
                {hasMoreDescription && (
                  <button type="button" className={styles.moreButton} onClick={() => setShowFullDescription(!showFullDescription)}>
                    {showFullDescription ? 'Show less' : 'Read full description'}
                  </button>
                )}
              </div>

              {/* Player: YouTube's (below) or ours ("coming soon": the Listen button below instead) */}
              {comingSoon ? null : isYouTube ? (
                <div className={styles.player}>
                  <button
                    type="button"
                    className={styles.playButton}
                    onClick={() => (nowPlaying
                      ? listenRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                      : playOnYouTube())}
                    aria-label={nowPlaying ? 'Go to the player' : 'Play'}
                  >
                    <FaPlay className={styles.playIconNudge} />
                  </button>
                  <div className={styles.playerTrack}>
                    <span className={styles.playerLabel}>{nowPlaying ? 'Playing in the YouTube player below' : 'Ready to play'}</span>
                    {audiobook.narrator && <p className={styles.narrator}><FaMicrophone aria-hidden="true" /> Read by {audiobook.narrator}</p>}
                  </div>
                </div>
              ) : audiobook.media === 'file' ? (
                <div className={styles.player}>
                  <button
                    type="button"
                    className={styles.playButton}
                    onClick={togglePlayPause}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                    disabled={!audioUrl}
                  >
                    {isPlaying ? <FaPause /> : <FaPlay className={styles.playIconNudge} />}
                  </button>
                  <div className={styles.playerTrack}>
                    <div className={styles.playerTop}>
                      <span className={styles.playerLabel}>
                        {!isLoggedIn ? 'Sign in to listen' : !audioUrl ? 'Audio not available yet' : isPlaying ? 'Now playing' : 'Ready to play'}
                      </span>
                      <div className={styles.skipButtons}>
                        <button type="button" className={styles.skipButton} onClick={() => skip(-15)} aria-label="Back 15 seconds">
                          <FaUndoAlt /><span>15</span>
                        </button>
                        <button type="button" className={styles.skipButton} onClick={() => skip(15)} aria-label="Forward 15 seconds">
                          <FaRedoAlt /><span>15</span>
                        </button>
                      </div>
                    </div>
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
                    {audiobook.narrator && <p className={styles.narrator}><FaMicrophone aria-hidden="true" /> Read by {audiobook.narrator}</p>}
                  </div>
                </div>
              ) : (
                <p className={styles.sectionNote}>This audiobook’s recording is being prepared.</p>
              )}

              <DetailActions
                quick={[
                  { key: 'like', label: 'Like', icon: <FaRegHeart />, onIcon: <FaHeart />, on: liked,
                    onClick: library.toggleLike, busy: library.busy === 'like' },
                  { key: 'save', label: 'Save', icon: <FaRegBookmark />, onIcon: <FaBookmark />, on: saved,
                    onClick: library.toggleSave, busy: library.busy === 'save' },
                  { key: 'share', label: 'Share', icon: <FaShareAlt />, onClick: handleShare, pressable: false },
                ]}
              >
                {comingSoon && <ListenSoon />}
                {audiobook.ebook && (
                  <ActionLink to={`/collections/ebooks/ebook/${audiobook.ebook.id}`} icon={<FaBookOpen aria-hidden="true" />}>
                    Read the book
                  </ActionLink>
                )}
              </DetailActions>
            </div>
          </section>

          {/* YouTube's player: our cover until Play is pressed, then the video */}
          {isYouTube && (
            <section className={styles.listen} ref={listenRef} aria-labelledby="listen-title">
              <h3 id="listen-title" className={styles.sectionTitle}>Listen</h3>
              <div className={styles.playerFrame}>
                {nowPlaying ? (
                  <iframe
                    key={`${nowPlaying.videoId}-${nowPlaying.start}`}
                    src={embedUrl(nowPlaying.videoId, nowPlaying.start, nowPlaying.autoplay, nowPlaying.next)}
                    title={`${audiobook.title} on YouTube`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                ) : (
                  <button type="button" className={styles.poster} onClick={() => playOnYouTube()}
                    aria-label={`Play ${audiobook.title}`}>
                    <CoverPicture src={audiobook.cover} alt="" className={styles.posterImage} />
                    <span className={styles.posterShade} aria-hidden="true" />
                    <span className={styles.posterPlay} aria-hidden="true"><FaPlay /></span>
                    <span className={styles.posterNote}>
                      <FaYoutube aria-hidden="true" /> Plays in YouTube’s player
                    </span>
                  </button>
                )}
              </div>
              <p className={styles.recordingCredit}>
                {audiobook.narrator ? `Read by ${audiobook.narrator}. ` : ''}
                Recording published on YouTube{audiobook.youtube.channel ? ` by “${audiobook.youtube.channel}”` : ''}.
                {audiobook.youtube.url && (
                  <>
                    {' '}
                    <a href={audiobook.youtube.url} target="_blank" rel="noopener noreferrer">
                      Open on YouTube <FaExternalLinkAlt aria-hidden="true" />
                    </a>
                  </>
                )}
              </p>
            </section>
          )}

          {/* Chapters / parts */}
          {audiobook.chapters.length > 0 && (
          <section className={styles.section} aria-labelledby="chapters-title">
            <div className={styles.sectionHead}>
              <div>
                <h3 id="chapters-title" className={styles.sectionTitle}>{partsAreVideos ? 'Parts' : 'Chapters'}</h3>
                <p className={styles.sectionNote}>
                  {comingSoon ? 'Listening opens soon'
                    : isYouTube ? `${audiobook.chapters.length} to listen to, free`
                      : `${audiobook.chapters.length - lockedCount} free${lockedCount ? `, ${lockedCount} with Premium` : ''}`}
                </p>
              </div>
            </div>
            <ol className={styles.chapterList}>
              {audiobook.chapters.map((chapter, index) => {
                const open = expandedChapter === chapter.id;
                const current = nowPlaying?.chapterId === chapter.id;
                return (
                  <li key={chapter.id} className={`${styles.chapter} ${styles.glass} ${open ? styles.chapterOpen : ''} ${current ? styles.chapterCurrent : ''}`}>
                    <button type="button" className={styles.chapterHead} onClick={() => toggleChapter(chapter.id)} aria-expanded={open}>
                      <span className={styles.chapterIndex}>{chapter.locked ? <FaLock aria-label="Premium" /> : index + 1}</span>
                      <span className={styles.chapterName}>
                        {chapter.title}
                        {current && (
                          <span className={styles.nowTag}>{nowPlaying.next?.length ? ' · playing from here' : ' · now playing'}</span>
                        )}
                      </span>
                      <span className={styles.chapterMeta}><FaClock aria-hidden="true" /> {chapter.duration}</span>
                      <FaChevronDown className={styles.chapterChevron} aria-hidden="true" />
                    </button>
                    {open && (
                      <div className={styles.chapterBody}>
                        <p className={styles.chapterText}>{chapter.title}{chapter.duration ? `, ${chapter.duration}` : ''}.</p>
                        {comingSoon ? (
                          <button type="button" className={styles.smallButton} disabled>
                            <FaHeadphones aria-hidden="true" /> Coming soon
                          </button>
                        ) : chapter.locked ? (
                          <Link to="/premium" className={`${styles.smallButton} ${styles.lockedButton}`}>
                            <FaLock aria-hidden="true" /> Unlock with Premium
                          </Link>
                        ) : (
                          <button type="button" className={styles.smallButton} onClick={() => handleListenChapter(chapter)}>
                            <FaPlay aria-hidden="true" /> {partsAreVideos ? 'Play this part' : 'Listen to this chapter'}
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
          )}

          {/* Reviews */}
          <section className={styles.section} aria-labelledby="reviews-title">
            <div className={styles.sectionHead}>
              <h3 id="reviews-title" className={styles.sectionTitle}>Ratings and reviews</h3>
            </div>

            <Reviews
              apiString={apiString}
              type="audiobook"
              id={id}
              itemTitle={audiobook.title}
              onSummary={setReviewSummary}
            />
          </section>
        </div>

        <aside className={styles.aside}>
          {renderRelated(related, relatedRef, 'Related audiobooks')}
          {related.length > 3 && renderRelated([...related].reverse(), recommendedRef, 'More to listen to')}
        </aside>
      </div>
    </div>
  );
};

export default AudiobookDetail;
