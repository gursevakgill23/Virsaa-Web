/**
 * pages/HomePage/Home.jsx
 * -----------------------------------------------------------------------------
 * The home page (/ and /home):
 *   - header slideshow (changes every 3 s, or with the up/down arrows) with the
 *     "Play Now" video link
 *   - quick dock of shortcuts, shelf of the newest ebooks, today's Hukamnama
 *     live from Sri Harmandir Sahib, Amritsar (through our server from BaniDB;
 *     a small prompt appears once it has loaded; the full text opens in a
 *     modal, its translations for signed-in readers),
 *     "Listen, learn and play", featured authors, heritage, Gurdwara + Premium
 *   - the "Ask about Sikhism" chat button
 * Data: /collections/ebooks/ (the newest 12), /collections/authors/ and
 * /api/sikhism/gurbani/hukamnama/ (all public, no token).
 * -----------------------------------------------------------------------------
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MdPlayArrow, MdClose } from 'react-icons/md';
import {
  FaArrowDown, FaArrowUp, FaBook, FaRegFileAudio, FaFeatherAlt, FaHistory,
  FaMusic, FaUtensils, FaCrown, FaMapMarkerAlt,
} from 'react-icons/fa';
import { FaHandsPraying } from 'react-icons/fa6';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import styles from './Home.module.css';
import ChatButton from '../../elements/ChatWithUs/ChatButton/ChatButton';
import { CoverPicture, SitePicture } from '../../components/SitePicture/SitePicture';
import Avatar from '../../components/Avatar/Avatar';
import { gurbaniApi } from '../../api/sikhismApi';

// Utility function to handle public/static images
// Converts image paths for the production build (same helper used across pages)
const getProductionImagePath = (imagePath) => {
  if (process.env.NODE_ENV === 'production') {
    if (typeof imagePath === 'string') {
      return (imagePath.startsWith('/') || /^(https?:|blob:|data:)/i.test(imagePath))
        ? imagePath
        : `/${imagePath.replace(/.*static\/media/, 'static/media')}`;
    } else {
      return imagePath.default || imagePath;
    }
  }
  return imagePath;
};

const Home = ({ isDarkMode, apiString }) => {
  const getStaticImagePath = getProductionImagePath;
  // Header slideshow pictures (light mode)
  const slide1Light = getStaticImagePath('/images/header-slide1.jpg');
  const slide2Light = getStaticImagePath('/images/header-slide2.jpg');
  const slide3Light = getStaticImagePath('/images/header-slide3.jpg');

  // Dark mode images
  const slide1Dark = getStaticImagePath('/images/header-slide1-dark.jpeg');
  const slide2Dark = getStaticImagePath('/images/header-slide2-dark.jpg');
  const slide3Dark = getStaticImagePath('/images/header-slide3-dark.jpg');

  // The section pictures are real photos from S3, by name (components/SitePicture)

  // Slideshow position and loading state for the book shelf
  const [imageIndex, setImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Newest ebooks and all authors (for names and the authors row)
  const [latestBooks, setLatestBooks] = useState([]);
  const [authors, setAuthors] = useState([]);

  // Hukamnama prompt / modal state (the translation needs sign-in)
  const { isLoggedIn } = useAuth();
  const [showHukamnamaToast, setShowHukamnamaToast] = useState(false);
  const [showHukamnamaModal, setShowHukamnamaModal] = useState(false);
  const [activeTab, setActiveTab] = useState('hukamnama');
  const toastTimer = useRef(null);
  // Today's Hukamnama from Sri Harmandir Sahib: { status: 'loading' | 'ready' | 'error', data }
  const [hukam, setHukam] = useState({ status: 'loading', data: null });
  const [hukamAttempt, setHukamAttempt] = useState(0);

  // Books and authors are public, so they're fetched without a token.
  // (Sending an expired token would make the request fail with 401.)
  useEffect(() => {
    const apiUrl = (apiString || process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
    // Lists may come back plain or paginated ({ results: [...] })
    const toList = (data) => (Array.isArray(data) ? data : data?.results || []);
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      const [booksRes, authorsRes] = await Promise.allSettled([
        // Just the newest 12 (one page of light cards, however big the library gets)
        axios.get(`${apiUrl}/collections/ebooks/?page=1&page_size=12&ordering=-id`, { timeout: 20000 }),
        axios.get(`${apiUrl}/collections/authors/`, { timeout: 20000 }),
      ]);
      if (cancelled) return;

      if (booksRes.status === 'fulfilled') {
        setLatestBooks([...toList(booksRes.value.data)].sort((a, b) => b.id - a.id).slice(0, 12));
      } else {
        console.error('Error fetching ebooks:', booksRes.reason?.response?.status);
      }
      if (authorsRes.status === 'fulfilled') {
        setAuthors(toList(authorsRes.value.data));
      } else {
        console.error('Error fetching authors:', authorsRes.reason?.response?.status);
      }
      setIsLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, [apiString]);

  // The ebook API returns the author as an id, so look the name up
  const authorNames = useMemo(
    () => Object.fromEntries(authors.map((a) => [a.id, a.name])),
    [authors]
  );
  const authorOf = (book) =>
    (typeof book.author === 'object' ? book.author?.name : book.author_name || authorNames[book.author]) || 'Unknown author';

  // Today's Hukamnama, live (the server asks BaniDB, which has it from Sri Harmandir Sahib each morning)
  useEffect(() => {
    let cancelled = false;
    setHukam((current) => ({ ...current, status: 'loading' }));
    gurbaniApi.hukamnama(apiString)
      .then((data) => {
        if (cancelled) return;
        const ready = Array.isArray(data?.shabads) && data.shabads.some((s) => s?.lines?.length);
        setHukam({ status: ready ? 'ready' : 'error', data: ready ? data : null });
      })
      .catch(() => { if (!cancelled) setHukam({ status: 'error', data: null }); });
    return () => { cancelled = true; };
  }, [apiString, hukamAttempt]);

  // The "View today's Hukamnama" prompt: 2 s after it has loaded, for 8 s
  const hukamReady = hukam.status === 'ready';
  useEffect(() => {
    if (!hukamReady) return undefined;
    const timer = setTimeout(() => {
      setShowHukamnamaToast(true);
      toastTimer.current = setTimeout(() => {
        setShowHukamnamaToast(false);
      }, 8000);
    }, 2000);

    return () => {
      clearTimeout(timer);
      clearTimeout(toastTimer.current);
    };
  }, [hukamReady]);

  // Open the Hukamnama from the prompt or the Hukamnama section
  const handleToastClick = () => {
    clearTimeout(toastTimer.current);
    setShowHukamnamaToast(false);
    setShowHukamnamaModal(true);
  };

  const openHukamnama = () => {
    clearTimeout(toastTimer.current);
    setShowHukamnamaToast(false);
    setShowHukamnamaModal(true);
  };

  const closeModal = () => {
    setShowHukamnamaModal(false);
  };

  // Today's Hukamnama: its shabads, lines (Gurmukhi, English, Punjabi meaning) and where it is from
  const shabads = (hukam.data?.shabads || []).filter((shabad) => shabad?.lines?.length);
  const firstShabad = shabads[0];
  const verseLines = (firstShabad?.lines || []).filter((line) => line.gurmukhi);
  const firstLine = (verseLines.find((line) => !line.header) || verseLines[0])?.gurmukhi || '';
  const hukamInfo = firstShabad?.info || {};
  const hukamDate = hukam.data?.date
    ? new Date(`${hukam.data.date}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  const hukamReference = [hukamInfo.raag, hukamInfo.writer, hukamInfo.ang ? `Ang ${hukamInfo.ang}` : '']
    .filter(Boolean).join(' · ');

  // Slides for the current theme, advanced every 3 s
  const bgImages = useMemo(() => {
    return isDarkMode
      ? [slide1Dark, slide2Dark, slide3Dark]
      : [slide1Light, slide2Light, slide3Light];
  }, [isDarkMode, slide1Dark, slide1Light, slide2Dark, slide2Light, slide3Dark, slide3Light]);

  useEffect(() => {
    const interval = setInterval(() => {
      setImageIndex((prevIndex) => (prevIndex + 1) % bgImages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [bgImages.length]);

  // Up / down arrows on the header
  const handleImageChange = (direction) => {
    if (direction === 'up') {
      setImageIndex((prevIndex) => (prevIndex - 1 + bgImages.length) % bgImages.length);
    } else {
      setImageIndex((prevIndex) => (prevIndex + 1) % bgImages.length);
    }
  };

  // Heading and text that go with each slide
  const textContent = [
    {
      h1: 'Ebooks and Audiobooks',
      p: 'Explore hundreds of ebooks and audiobooks about Sikh history and Punjab culture.',
    },
    {
      h1: 'Art of Preserving Culture',
      p: 'Learn how the art of preserving culture shapes our identity and history.',
    },
    {
      h1: 'Discover The History',
      p: 'Dive deep into the history of Sikhism and Punjab with resources and stories.',
    },
  ];

  // Content for the sections below (shortcuts, experiences, heritage)
  const quickLinks = [
    { to: '/collections/ebooks', icon: <FaBook />, label: 'Ebooks' },
    { to: '/collections/audiobooks', icon: <FaRegFileAudio />, label: 'Audiobooks' },
    { to: '/collections/authors', icon: <FaFeatherAlt />, label: 'Authors' },
    { to: '/gurbani', icon: <FaHandsPraying />, label: 'Gurbani' },
    { to: '/sikh-history', icon: <FaHistory />, label: 'Sikh history' },
  ];

  const experiences = [
    {
      to: '/collections/audiobooks', picture: 'home-audiobooks', size: 'large',
      title: 'Audiobooks and kirtan',
      text: 'Listen to kirtan and narrated books on Sikh history and spirituality, wherever you are.',
    },
    {
      to: '/learning', picture: 'home-learning',
      title: 'Learning resources',
      text: 'Lessons and reading on Punjabi language, culture and Sikh heritage.',
    },
    {
      to: '/learning', picture: 'home-games',
      title: 'Games and quizzes',
      text: 'Shabd Khoj, Memory Match and quizzes to test what you know.',
    },
    {
      to: '/sikh-history', picture: 'home-history', size: 'wide',
      title: 'Sikh history',
      text: 'From Guru Nanak Dev Ji to today, told through stories and sources.',
    },
    {
      to: '/news', picture: 'home-news', size: 'wide',
      title: 'Recent news',
      text: 'Updates from the Sikh and Punjabi community.',
    },
    {
      to: '/gurbani', picture: 'home-gurbani', size: 'wide',
      title: 'Gurbani',
      text: 'Read and listen to Gurbani, with meanings in Punjabi and English.',
    },
  ];

  const heritageItems = [
    {
      icon: <FaHandsPraying />,
      title: 'Spiritual legacy',
      text: 'Discover the teachings of Sikhism, rooted in equality, seva and devotion, and landmarks like Sri Harmandir Sahib in Amritsar, a symbol of peace and unity.',
    },
    {
      icon: <FaMusic />,
      title: 'Cultural vibrancy',
      text: 'From the beats of Bhangra to the melodies of Gurbani kirtan, and festivals like Vaisakhi and Lohri, Punjab’s traditions are full of life and warmth.',
    },
    {
      icon: <FaUtensils />,
      title: 'Culinary delights',
      text: 'Hearty, aromatic and shared generously: from makki di roti and sarson da saag to dal makhani and the langar served to everyone.',
    },
  ];

  return (
    <div className={styles.homeContainer}>
      {/* "View today's Hukamnama" prompt */}
      {showHukamnamaToast && (
        <div
          className={styles.hukamnamaToast}
          onClick={handleToastClick}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleToastClick(); } }}
          role="button"
          tabIndex={0}
        >
          <div className={styles.toastContent}>
            <span>View Today's Hukamnama</span>
            <span>ਅੱਜ ਦਾ ਹੁਕਮਨਾਮਾ ਦੇਖੋ</span>
          </div>
        </div>
      )}

      {/* Hukamnama modal */}
      {showHukamnamaModal && hukamReady && (
        <div className={styles.hukamnamaModalOverlay} onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }} role="presentation">
          <div className={styles.hukamnamaModal} role="dialog" aria-modal="true" aria-labelledby="hukam-modal-title">
            <button type="button" className={styles.modalCloseButton} onClick={closeModal} aria-label="Close">
              <MdClose />
            </button>

            <h2 id="hukam-modal-title" className={styles.modalTitle}>Today's Hukamnama</h2>
            <h3 className={styles.modalSubtitle} lang="pa">ਅੱਜ ਦਾ ਹੁਕਮਨਾਮਾ</h3>
            <p className={styles.modalWhere}>
              Sri Harmandir Sahib, Amritsar{hukamDate ? ` · ${hukamDate}` : ''}
              {hukamReference ? <><br />{hukamReference}</> : null}
            </p>

            <div className={styles.tabContainer} role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'hukamnama'}
                className={`${styles.tabButton} ${activeTab === 'hukamnama' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('hukamnama')}
              >
                Hukamnama
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'arth'}
                className={`${styles.tabButton} ${activeTab === 'arth' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('arth')}
              >
                ਅਰਥ (Meaning)
              </button>
            </div>

            <div className={styles.tabContent} role="tabpanel">
              {shabads.map((shabad, s) => (
                <div key={shabad.id || s} className={styles.hukamShabad}>
                  {shabad.lines.filter((line) => line.gurmukhi).map((line, i) => (
                    <div key={line.id || i} className={line.header ? styles.hukamHeaderLine : styles.hukamLine}>
                      <p className={styles.punjabiText} lang="pa">{line.gurmukhi}</p>
                      {activeTab === 'hukamnama' && isLoggedIn && !line.header && line.english && (
                        <p className={styles.englishText}>{line.english}</p>
                      )}
                      {activeTab === 'arth' && isLoggedIn && !line.header && line.punjabi && (
                        <p className={styles.arthText} lang="pa">{line.punjabi}</p>
                      )}
                    </div>
                  ))}
                </div>
              ))}
              {!isLoggedIn && (
                <p className={styles.signInNote}>
                  {activeTab === 'hukamnama'
                    ? 'Sign in to view the full Hukamnama translation'
                    : 'Sign in to view the detailed explanation'}
                </p>
              )}
            </div>

            {hukam.data?.attribution && <p className={styles.hukamCredit}>{hukam.data.attribution}, from SGPC, Sri Harmandir Sahib.</p>}

            <div className={styles.modalFooter}>
              <Link to={isLoggedIn ? '/gurbani' : '/login'} className={styles.modalActionButton}>
                {isLoggedIn ? 'Read More Gurbani' : 'Sign In to View Full Translation'}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ===================== Header (unchanged) ===================== */}
      <div className={styles.header}>
        <div className={styles.imageSlider}>
          {bgImages.map((image, index) => (
            <div
              key={index}
              className={styles.imageSlide}
              style={{
                backgroundImage: `url(${getStaticImagePath(image)})`,
                transform: `translateY(${(index - imageIndex) * 100}%)`,
                transition: 'transform 0.5s ease',
              }}
            >
              <div className={styles.textOverlay}>
                <h1 className={styles.headline}>{textContent[index].h1}</h1>
                <p className={styles.description}>{textContent[index].p}</p>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.playButtonContainer}>
          <a
            href="https://www.youtube.com/watch?v=L-1UAORcX4c&ab_channel=Cogito"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.playButton}
          >
            <div className={styles.playIconWrapper}>
              <div className={styles.rotatingBorder}></div>
              <MdPlayArrow className={styles.playIcon} />
              <span className={styles.playText}>Play Now</span>
            </div>
          </a>
        </div>

        <div className={styles.navigationButtons}>
          <button onClick={() => handleImageChange('up')} className={styles.navButton}>
            <FaArrowUp />
          </button>
          <button onClick={() => handleImageChange('down')} className={styles.navButton}>
            <FaArrowDown />
          </button>
        </div>
      </div>

      {/* ===================== Quick dock ===================== */}
      <nav className={styles.dockWrap} aria-label="Explore Virsaa">
        <div className={styles.dock}>
          {quickLinks.map((item) => (
            <Link key={item.to} to={item.to} className={styles.dockItem}>
              <span className={styles.dockIcon}>{item.icon}</span>
              <span className={styles.dockLabel}>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* ===================== Book shelf ===================== */}
      <section className={styles.shelfSection} aria-labelledby="shelf-title">
        <div className={styles.sectionHead}>
          <div>
            <h2 id="shelf-title" className={styles.title}>Fresh on the shelf</h2>
            <p className={styles.lede}>The newest books in the Virsaa library, in Punjabi and English. Pick one up and start reading.</p>
          </div>
          <button className={styles.ghostButton} onClick={() => navigate('/collections/ebooks')}>
            See all books
          </button>
        </div>

        <div className={styles.shelfStage}>
          <div className={styles.shelf}>
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={`skeleton-${i}`} className={styles.bookSlot} aria-hidden="true">
                    <div className={`${styles.book} ${styles.bookSkeleton}`} />
                    <div className={styles.skeletonLine} />
                    <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
                  </div>
                ))
              : latestBooks.map((book) => (
                  <Link key={book.id} to={`/collections/ebooks/ebook/${book.id}`} className={styles.bookSlot}>
                    <div className={styles.book}>
                      <CoverPicture src={book.cover_image} alt={`Cover of ${book.title}`} className={styles.bookCover} />
                    </div>
                    <h3 className={styles.bookTitle}>{book.title}</h3>
                    <p className={styles.bookAuthor}>{authorOf(book)}</p>
                  </Link>
                ))}
            {!isLoading && latestBooks.length === 0 && (
              <p className={styles.emptyShelf}>
                Books couldn’t be loaded right now. Refresh the page, or open the collection directly.
              </p>
            )}
          </div>
          <div className={styles.shelfBoard} aria-hidden="true" />
        </div>
      </section>

      {/* ===================== Today's Hukamnama (live) ===================== */}
      <section className={styles.hukamSection} aria-labelledby="hukam-title">
        <div className={styles.hukamPanel} aria-busy={hukam.status === 'loading'}>
          <div className={styles.hukamText}>
            <h2 id="hukam-title" className={styles.title}>Today’s Hukamnama</h2>
            {hukam.status === 'loading' && (
              <div className={styles.hukamSkeleton} role="status" aria-label="Loading today’s Hukamnama">
                <span /><span />
              </div>
            )}
            {hukamReady && (
              <>
                <p className={styles.hukamGurmukhi} lang="pa">{firstLine}</p>
                <p className={styles.hukamRef}>
                  Sri Harmandir Sahib, Amritsar{hukamDate ? ` · ${hukamDate}` : ''}
                  {hukamReference ? ` · ${hukamReference}` : ''}
                </p>
              </>
            )}
            {hukam.status === 'error' && (
              <p className={styles.hukamRef} role="alert">
                Today’s Hukamnama couldn’t be loaded just now.
              </p>
            )}
          </div>
          <div className={styles.hukamActions}>
            {hukam.status === 'error' ? (
              <button type="button" className={styles.solidButton} onClick={() => setHukamAttempt((n) => n + 1)}>Try again</button>
            ) : (
              <button type="button" className={styles.solidButton} onClick={openHukamnama} disabled={!hukamReady}>
                Read the Hukamnama
              </button>
            )}
            <Link to="/gurbani" className={styles.textLink}>More Gurbani</Link>
          </div>
        </div>
      </section>

      {/* ===================== Listen, learn and play ===================== */}
      <section className={styles.bentoSection} aria-labelledby="bento-title">
        <div className={styles.sectionHead}>
          <div>
            <h2 id="bento-title" className={styles.title}>Listen, learn and play</h2>
            <p className={styles.lede}>Ways to spend time with Punjabi and Sikh heritage, for every age.</p>
          </div>
        </div>

        <div className={styles.bento}>
          {experiences.map((item) => (
            <Link
              key={item.title}
              to={item.to}
              className={`${styles.bentoTile} ${item.size === 'large' ? styles.bentoLarge : ''} ${item.size === 'wide' ? styles.bentoWide : ''}`}
            >
              <SitePicture name={item.picture} alt="" className={styles.bentoImage} />
              <div className={styles.bentoGlass}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ===================== Featured authors ===================== */}
      {authors.length > 0 && (
        <section className={styles.authorsSection} aria-labelledby="authors-title">
          <div className={styles.sectionHead}>
            <div>
              <h2 id="authors-title" className={styles.title}>Writers in the library</h2>
              <p className={styles.lede}>Poets, historians and storytellers whose work you can read on Virsaa.</p>
            </div>
            <button className={styles.ghostButton} onClick={() => navigate('/collections/authors')}>
              All authors
            </button>
          </div>

          <div className={styles.authorRow}>
            {authors.slice(0, 8).map((author) => (
              <Link key={author.id} to={`/collections/authors/author/${author.id}`} className={styles.authorCard}>
                <Avatar src={author.image} name={author.name} className={styles.authorImage} loading="lazy" />
                <h3>{author.name}</h3>
                <p>
                  {author.books?.length
                    ? `${author.books.length} ${author.books.length === 1 ? 'book' : 'books'}`
                    : author.genre || 'Author'}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ===================== Heritage ===================== */}
      <section className={styles.heritageSection} aria-labelledby="heritage-title">
        <h2 id="heritage-title" className={styles.title}>The richness of Punjabi and Sikh heritage</h2>
        <div className={styles.heritageStage}>
          <div className={styles.heritagePhoto}>
            <SitePicture name="home-heritage" className={styles.heritageImage} />
          </div>
          <div className={styles.heritageStack}>
            {heritageItems.map((item) => (
              <article key={item.title} className={styles.heritagePane}>
                <span className={styles.heritageIcon} aria-hidden="true">{item.icon}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== Gurdwara + Premium ===================== */}
      <section className={styles.ctaSection}>
        <Link to="/gurdwara-access" className={`${styles.ctaPanel} ${styles.ctaLight}`}>
          <FaMapMarkerAlt className={styles.ctaIcon} aria-hidden="true" />
          <h3>Find a Gurdwara near you</h3>
          <p>Locations, services and history of Gurdwaras, in one place.</p>
          <span className={styles.ctaAction}>Open Gurdwara access</span>
        </Link>
        <Link to="/premium" className={`${styles.ctaPanel} ${styles.ctaDark}`}>
          <FaCrown className={styles.ctaIcon} aria-hidden="true" />
          <h3>Read and listen without limits</h3>
          <p>Premium unlocks every audiobook chapter, full translations and more.</p>
          <span className={styles.ctaAction}>See Premium plans</span>
        </Link>
      </section>

      <ChatButton apiString={apiString} />
    </div>
  );
};

export default Home;
