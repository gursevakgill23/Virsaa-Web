/**
 * pages/Collections/EbookDetail/EbookDetail.jsx
 * -----------------------------------------------------------------------------
 * One ebook (/collections/ebooks/ebook/:id):
 *   - cover, details, Read now (opens the flip-book reader full screen),
 *     Like / Save for later / Download (useLibraryItem), Share
 *   - Listen: the book read by Google's Punjabi voice (EbookListen), once its
 *     audiobook is made (`audio` from the API; while it is being made the page
 *     shows how far it has got and checks again every 20 seconds)
 *   - English word by word: Premium, coming soon (a placeholder for now)
 *   - chapters, description, ratings and reviews (components/Reviews)
 *   - related and recommended books
 * Reading progress is saved to History while reading, when the reader closes
 * and when the page is left. While loading, the Virsaa loader is shown;
 * "not found" and "couldn't load" (with Try again) are told apart.
 * -----------------------------------------------------------------------------
 */
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FaBookmark, FaRegBookmark, FaShareAlt, FaChevronLeft, FaChevronRight, FaStar, FaRegStar,
  FaHeart, FaRegHeart, FaBookOpen, FaFilePdf, FaChevronDown, FaDownload, FaHandHoldingHeart,
  FaHeadphones, FaLanguage, FaCrown } from 'react-icons/fa';
import { toast } from '../../../utils/notify';
import styles from './EbookDetail.module.css';
import EbookListen from './EbookListen';
import PageHero from '../../../components/PageHero/PageHero';
import Loader from '../../../components/VirsaaLoader/Loader';
import axios from 'axios';
import BookReader from '../../../components/BookReader/BookReader';
import Reviews from '../../../components/Reviews/Reviews';
import useLibraryItem from '../../../hooks/useLibraryItem';
import useHistoryRecorder from '../../../hooks/useHistoryRecorder';
import { useAuth } from '../../../context/AuthContext';
import { CoverPicture } from '../../../components/SitePicture/SitePicture';

// Fisher-Yates shuffle
// Random order for the recommendations
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Page header pictures (public/images). Book covers come from the API (S3); a book
// without one shows the website picture 'fallback-book' (CoverPicture).
const HEADER_LIGHT = '/images/header-image.png';
const HEADER_DARK = '/images/header-image-dark.png';

// Five stars, filled up to `value`
const Stars = ({ value }) => (
  <span className={styles.stars} aria-label={`${value} out of 5`}>
    {[1, 2, 3, 4, 5].map((i) =>
      i <= Math.round(value) ? <FaStar key={i} className={styles.starOn} /> : <FaRegStar key={i} className={styles.starOff} />
    )}
  </span>
);

// Placeholder cards while related books load
const RelatedSkeleton = () => (
  <div className={styles.relatedCard} aria-hidden="true">
    <span className={`${styles.relatedThumb} ${styles.skeleton}`} />
    <span className={styles.relatedInfo}>
      <span className={`${styles.skeleton} ${styles.skeletonLine}`} />
      <span className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineShort}`} />
    </span>
  </div>
);

// Lists may come back plain or paginated ({ results: [...] })
const toList = (data) => (Array.isArray(data) ? data : data?.results || []);

// The book's audiobook (Google's Punjabi voice), from the API's `audio`
const BEING_MADE = ['waiting', 'working'];
const AUDIO_CHECK_MS = 20000; // while it is being made

const EbookDetail = ({ isDarkMode, apiString }) => {
  const { id } = useParams();
  const library = useLibraryItem(apiString, 'ebook', id);
  const recordHistory = useHistoryRecorder(apiString);
  const readingRef = useRef(null); // last page reached, saved to History when the reader closes
  const { liked, saved } = library;
  const relatedRef = useRef(null);
  const recommendedRef = useRef(null);

  // Book data, loading flags, chapter/description toggles and the reader's state
  const [ebook, setEbook] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [related, setRelated] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [expandedChapter, setExpandedChapter] = useState(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  const [listening, setListening] = useState(false); // the Listen player is open

  // Average rating and number of reviews, reported by the Reviews section
  const [reviewSummary, setReviewSummary] = useState({ count: 0, average: null });
  const [loadFailed, setLoadFailed] = useState(false); // true = network/server problem (not "not found")
  const [reloadKey, setReloadKey] = useState(0); // bumped by "Try again"

  const apiUrl = (apiString || process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
  const safeId = encodeURIComponent(id); // the id comes from the URL, so encode it before use in a path
  const headerImage = isDarkMode ? HEADER_DARK : HEADER_LIGHT;
  const { accessToken, isLoggedIn } = useAuth(); // reading or listening needs an account

  // Ebook, its author and related books. These endpoints are public, so no token
  // is sent (an expired token would make them fail with 401). Reviews load
  // themselves inside <Reviews>.
  useEffect(() => {
    let cancelled = false;
    const fetchEbook = async () => {
      setIsLoading(true);
      setRelatedLoading(true);
      setExpandedChapter(null);
      setShowFullDescription(false);
      setLoadFailed(false);
      setListening(false);
      try {
        const { data } = await axios.get(`${apiUrl}/collections/ebooks/${safeId}/`, { timeout: 20000 });
        if (cancelled) return;

        let authorName = 'Unknown author';
        if (data.author) {
          try {
            const authorRes = await axios.get(`${apiUrl}/collections/authors/${encodeURIComponent(data.author)}/`, { timeout: 20000 });
            authorName = authorRes.data?.name || authorName;
          } catch {
            // keep the fallback name
          }
        }
        if (cancelled) return;

        setEbook({
          ...data,
          authorId: data.author,
          authorName,
          cover: data.detail_image || data.cover_image,
          chapters: Array.isArray(data.chapters) ? [...data.chapters].sort((a, b) => a.order - b.order) : [],
        });
        setIsLoading(false);

        // Related: same author first, then other books
        const allRes = await axios.get(`${apiUrl}/collections/ebooks/`, { timeout: 20000 }).catch(() => ({ data: [] }));
        if (cancelled) return;
        const others = toList(allRes.data).filter((item) => item.id !== Number(id));
        const sameAuthor = others.filter((item) => data.author && item.author === data.author);
        const rest = shuffleArray(others.filter((item) => !sameAuthor.includes(item)));
        const toCard = (item) => ({ id: item.id, title: item.title, cover: item.cover_image });
        const relatedList = [...sameAuthor, ...rest].slice(0, 5);
        setRelated(relatedList.map(toCard));
        setRecommended(rest.filter((item) => !relatedList.includes(item)).slice(0, 5).map(toCard));
      } catch (error) {
        console.error('Error fetching ebook:', error.response?.status || error.message);
        if (!cancelled) {
          setEbook(null);
          setLoadFailed(error.response?.status !== 404); // 404 = really not found
          setIsLoading(false);
        }
      } finally {
        if (!cancelled) setRelatedLoading(false);
      }
    };
    fetchEbook();
    return () => { cancelled = true; };
  }, [id, safeId, apiUrl, reloadKey]);

  // While the audiobook is being made, check how far it has got (and show Listen when it is ready)
  const audioStatus = ebook?.audio?.status;
  useEffect(() => {
    if (!BEING_MADE.includes(audioStatus)) return undefined;
    let cancelled = false;
    const timer = setInterval(async () => {
      if (document.hidden) return; // not while the tab is in the background
      try {
        const { data } = await axios.get(`${apiUrl}/collections/ebooks/${safeId}/`, { timeout: 20000 });
        if (!cancelled) setEbook((current) => (current ? { ...current, audio: data?.audio ?? null } : current));
      } catch {
        // checked again next time
      }
    }, AUDIO_CHECK_MS);
    return () => { cancelled = true; clearInterval(timer); };
  }, [audioStatus, apiUrl, safeId]);

  // PDFs are private on S3; read_pdf returns a temporary link.
  // The reader opens straight away (full screen, from the click) and shows
  // "Opening the book…" until the link and the file arrive.
  const fetchPdfLink = async () => {
    setPdfLoading(true);
    setPdfError(null);
    setPdfUrl(null);
    try {
      const response = await axios.get(`${apiUrl}/collections/ebooks/${safeId}/read_pdf/`, {
        timeout: 20000,
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      if (!response.data?.pdf_url) throw new Error('No PDF link returned');
      setPdfUrl(response.data.pdf_url);
    } catch (error) {
      console.error('Error fetching PDF link:', error.response?.status || error.message);
      const code = error.response?.status;
      setPdfError(code === 404 ? 'This book has no file yet.'
        : code === 401 ? 'Sign in to read this book.' : 'The book couldn’t be opened right now.');
    } finally {
      setPdfLoading(false);
    }
  };

  // Read now: open the reader (full screen) and record the visit
  const handleReadNow = () => {
    // Must run inside the click, or the browser refuses full screen
    if (document.fullscreenEnabled && !document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }
    setShowPdfModal(true);
    fetchPdfLink(); // links expire after an hour, so get a fresh one each time
    if (ebook) recordHistory(historyEntry());
  };

  // What gets saved to History for this book
  const historyEntry = (extra = {}) => ({
    type: 'ebook',
    item_id: id,
    title: ebook?.title,
    path: `/collections/ebooks/ebook/${id}`,
    image: ebook?.cover,
    ...extra,
  });

  // Called by the reader on each page turn (throttled inside the recorder)
  const handleReaderProgress = (page, numPages) => {
    const progress = numPages ? (page / numPages) * 100 : 0;
    readingRef.current = { progress, position: page };
    recordHistory(historyEntry(readingRef.current), { progressOnly: true });
  };

  // Save the last page if the reader is left open and the user leaves the page
  const flushRef = useRef(null);
  flushRef.current = () => {
    if (readingRef.current) recordHistory(historyEntry(readingRef.current), { progressOnly: true, force: true });
  };
  useEffect(() => {
    const onHide = () => flushRef.current?.();
    window.addEventListener('pagehide', onHide);
    return () => { window.removeEventListener('pagehide', onHide); onHide(); readingRef.current = null; };
  }, [id]);

  // Close the reader and save the last page straight away
  const closeReader = () => {
    setShowPdfModal(false);
    if (readingRef.current) recordHistory(historyEntry(readingRef.current), { progressOnly: true, force: true });
  };


  // Share sheet on phones, otherwise copy the link
  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: ebook.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied', { position: 'top-right', autoClose: 2000 });
      }
    } catch {
      // share sheet dismissed
    }
  };

  const toggleChapter = (chapterId) => {
    setExpandedChapter(expandedChapter === chapterId ? null : chapterId);
  };

  const handleReadChapter = () => {
    handleReadNow();
  };

  const scrollRow = (ref, direction) => {
    ref.current?.scrollBy({ left: direction === 'left' ? -300 : 300, behavior: 'smooth' });
  };

  // ---------------------------------------------------------------- render
  if (isLoading) {
    return (
      <div className={styles.page}>
        <Loader />
      </div>
    );
  }

  if (!ebook) {
    return (
      <div className={styles.page}>
        <div className={`${styles.stateBox} ${styles.glass}`}>
          {loadFailed ? (
            <>
              <h2>This book couldn’t be loaded</h2>
              <p>Check your connection and try again.</p>
              <button type="button" className={styles.primaryButton} onClick={() => setReloadKey((k) => k + 1)}>Try again</button>
            </>
          ) : (
            <>
              <h2>This book couldn’t be found</h2>
              <p>It may have been removed, or the link is wrong.</p>
              <Link to="/collections/ebooks" className={styles.primaryButton}>Browse all ebooks</Link>
            </>
          )}
        </div>
      </div>
    );
  }

  // The audiobook: ready (Listen), being made (a note), or none
  const audio = ebook.audio;
  const canListen = audio?.status === 'done' && Boolean(audio.audiobook);
  const beingMade = BEING_MADE.includes(audio?.status);
  const showWordByWord = audio?.status !== 'not_punjabi'; // English meanings of a Punjabi book

  const description = ebook.description || '';
  const isLong = description.length > 420;
  const shownDescription = showFullDescription || !isLong ? description : `${description.slice(0, 420).trim()}…`;
  const shortDescription = description.split(' ').slice(0, 12).join(' ') + (description.split(' ').length > 12 ? '…' : '');

  // A scrolling row of related books
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
        {relatedLoading && Array.from({ length: 4 }).map((_, i) => <RelatedSkeleton key={i} />)}
        {!relatedLoading && items.length === 0 && <p className={styles.relatedMeta}>No other books to show yet.</p>}
        {!relatedLoading && items.map((book) => (
          <Link key={book.id} to={`/collections/ebooks/ebook/${book.id}`} className={styles.relatedCard}>
            <CoverPicture src={book.cover} alt="" className={styles.relatedThumb} />
            <span className={styles.relatedInfo}>
              <span className={styles.relatedTitle}>{book.title}</span>
              <span className={styles.relatedMeta}>Ebook</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );

  return (
    <div className={styles.page}>
      <PageHero
        compact
        image={headerImage}
        title={ebook.title}
        subtitle={shortDescription}
        crumbs={[
          { label: 'Home', to: '/' },
          { label: 'Collections', to: '/collections' },
          { label: 'Ebooks', to: '/collections/ebooks' },
          { label: ebook.title },
        ]}
      />

      <div className={styles.layout}>
        <div className={styles.main}>
          {/* ---------- Book card ---------- */}
          <section className={styles.productCard} aria-label="Book details">
            <div className={styles.coverStage}>
              <div className={styles.cover}>
                <CoverPicture src={ebook.cover} alt={`Cover of ${ebook.title}`} className={styles.coverImg} loading="eager" />
              </div>
            </div>

            <div className={styles.info}>
              <div className={styles.chipRow}>
                <span className={styles.chip}><FaBookOpen aria-hidden="true" /> Ebook</span>
                <span className={styles.ratingRow}>
                  <Stars value={reviewSummary.average ?? (Number(ebook.rating) || 0)} />
                  {(reviewSummary.average ?? (Number(ebook.rating) || 0)).toFixed(1)} · {reviewSummary.count.toLocaleString()} {reviewSummary.count === 1 ? 'review' : 'reviews'}
                </span>
              </div>

              <h2 className={styles.title}>{ebook.title}</h2>
              <p className={styles.byline}>
                by{' '}
                {ebook.authorId ? (
                  <Link to={`/collections/authors/author/${ebook.authorId}`} className={styles.bylineLink}>{ebook.authorName}</Link>
                ) : ebook.authorName}
              </p>

              <div className={styles.metaRow}>
                {ebook.pages > 0 && <span className={styles.metaPill}><FaBookOpen aria-hidden="true" /> {ebook.pages} pages</span>}
                <span className={styles.metaPill}><FaFilePdf aria-hidden="true" /> PDF</span>
                {canListen && (
                  <span className={styles.metaPill}>
                    <FaHeadphones aria-hidden="true" /> {audio.duration ? `${audio.duration} audiobook` : 'Audiobook'}
                  </span>
                )}
                {ebook.chapters.length > 0 && <span className={styles.metaPill}>{ebook.chapters.length} chapters</span>}
                {ebook.genre && <span className={styles.metaPill}>{ebook.genre}</span>}
              </div>

              {/* Books shared by readers (My Rewards): their tags and who shared it */}
              {(ebook.shared_by || (ebook.tags || []).length > 0) && (
                <div className={styles.sharedRow}>
                  {(ebook.tags || []).map((tag) => <span key={tag} className={styles.tagPill}>{tag}</span>)}
                  {ebook.shared_by?.name && (
                    <span className={styles.sharedBy}><FaHandHoldingHeart aria-hidden="true" /> Shared by {ebook.shared_by.name}</span>
                  )}
                </div>
              )}

              {description && (
                <div className={styles.description}>
                  <p className={styles.descText}>{shownDescription}</p>
                  {isLong && (
                    <button type="button" className={styles.moreButton} onClick={() => setShowFullDescription(!showFullDescription)}>
                      {showFullDescription ? 'Show less' : 'Read full description'}
                    </button>
                  )}
                </div>
              )}

              <div className={styles.actions}>
                <button type="button" className={styles.primaryButton} onClick={handleReadNow} disabled={pdfLoading}>
                  <FaBookOpen aria-hidden="true" /> {pdfLoading ? 'Opening…' : 'Read now'}
                </button>
                {canListen && (
                  <button
                    type="button"
                    className={`${styles.secondaryButton} ${styles.listenButton} ${listening ? styles.listenButtonOn : ''}`}
                    onClick={() => setListening((open) => !open)}
                    aria-expanded={listening}
                    aria-controls="ebook-listen"
                  >
                    <FaHeadphones aria-hidden="true" /> Listen
                  </button>
                )}
                <button type="button" className={styles.secondaryButton} onClick={library.download} disabled={library.downloading}>
                  <FaDownload aria-hidden="true" /> {library.downloading ? 'Preparing…' : 'Download'}
                </button>
                <button
                  type="button"
                  className={`${styles.iconButton} ${liked ? styles.iconButtonOn : ''}`}
                  onClick={library.toggleLike}
                  disabled={library.busy === 'like'}
                  aria-pressed={liked}
                  aria-label={liked ? 'Unlike this book' : 'Like this book'}
                >
                  {liked ? <FaHeart /> : <FaRegHeart />}
                </button>
                <button
                  type="button"
                  className={`${styles.iconButton} ${saved ? styles.iconButtonOn : ''}`}
                  onClick={library.toggleSave}
                  disabled={library.busy === 'save'}
                  aria-pressed={saved}
                  aria-label={saved ? 'Remove from saved' : 'Save for later'}
                  title={saved ? 'Saved for later' : 'Save for later'}
                >
                  {saved ? <FaBookmark /> : <FaRegBookmark />}
                </button>
                <button type="button" className={styles.iconButton} onClick={handleShare} aria-label="Share this book">
                  <FaShareAlt />
                </button>
              </div>

              {canListen && listening && (
                <EbookListen
                  id="ebook-listen"
                  apiUrl={apiUrl}
                  audiobookId={audio.audiobook}
                  accessToken={accessToken}
                  isLoggedIn={isLoggedIn}
                  onClose={() => setListening(false)}
                />
              )}

              {beingMade && (
                <p className={styles.audioNote}>
                  <FaHeadphones aria-hidden="true" />
                  {audio.status === 'working' && audio.progress > 0
                    ? `The audiobook is being made: ${audio.progress}% done.`
                    : 'The audiobook is being made.'}
                </p>
              )}

              {/* Not available yet: Premium, coming soon */}
              {showWordByWord && (
                <div className={styles.soonCard}>
                  <span className={styles.soonIcon} aria-hidden="true"><FaLanguage /></span>
                  <div>
                    <p className={styles.soonTitle}>
                      English word by word
                      <span className={styles.premiumPill}><FaCrown aria-hidden="true" /> Premium</span>
                    </p>
                    <p className={styles.soonNote}>The English meaning of each Punjabi word as you read. Coming soon.</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ---------- Chapters ---------- */}
          <section className={styles.section} aria-labelledby="chapters-title">
            <div className={styles.sectionHead}>
              <div>
                <h3 id="chapters-title" className={styles.sectionTitle}>Chapters</h3>
                {ebook.chapters.length > 0 && <p className={styles.sectionNote}>{ebook.chapters.length} chapters in this book</p>}
              </div>
            </div>
            {ebook.chapters.length === 0 ? (
              <p className={styles.emptyNote}>Chapter list isn’t available for this book. Open it with “Read now”.</p>
            ) : (
              <ol className={styles.chapterList}>
                {ebook.chapters.map((chapter, index) => {
                  const open = expandedChapter === chapter.id;
                  return (
                    <li key={chapter.id} className={`${styles.chapter} ${styles.glass} ${open ? styles.chapterOpen : ''}`}>
                      <button
                        type="button"
                        className={styles.chapterHead}
                        onClick={() => toggleChapter(chapter.id)}
                        aria-expanded={open}
                      >
                        <span className={styles.chapterIndex}>{index + 1}</span>
                        <span className={styles.chapterName}>{chapter.title}</span>
                        <span className={styles.chapterMeta}>Chapter {index + 1}</span>
                        <FaChevronDown className={styles.chapterChevron} aria-hidden="true" />
                      </button>
                      {open && (
                        <div className={styles.chapterBody}>
                          <p className={styles.chapterText}>Open the book to start reading “{chapter.title}”.</p>
                          <button type="button" className={styles.smallButton} onClick={() => handleReadChapter(chapter.id)}>
                            <FaBookOpen aria-hidden="true" /> Read this chapter
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          {/* ---------- Reviews ---------- */}
          <section className={styles.section} aria-labelledby="reviews-title">
            <div className={styles.sectionHead}>
              <h3 id="reviews-title" className={styles.sectionTitle}>Ratings and reviews</h3>
            </div>

            <Reviews
              apiString={apiString}
              type="ebook"
              id={id}
              itemTitle={ebook.title}
              onSummary={setReviewSummary}
            />
          </section>
        </div>

        <aside className={styles.aside}>
          {renderRelated(related, relatedRef, 'Related books')}
          {renderRelated(recommended, recommendedRef, 'You might also like')}
        </aside>
      </div>

      {/* ---------- Reader ---------- */}
      {showPdfModal && (
        <BookReader
          url={pdfUrl}
          title={ebook.title}
          linkError={pdfError}
          onRetry={fetchPdfLink}
          onClose={closeReader}
          onProgress={handleReaderProgress}
        />
      )}
    </div>
  );
};

export default EbookDetail;
