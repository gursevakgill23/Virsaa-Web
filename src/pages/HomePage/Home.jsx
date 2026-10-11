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

// Shown when a cover or portrait can't be loaded
const FALLBACK_IMAGE = '/images/logo.png';

// Utility function to handle public/static images
const getProductionImagePath = (imagePath) => {
  if (process.env.NODE_ENV === 'production') {
    if (typeof imagePath === 'string') {
      return imagePath.startsWith('/')
        ? imagePath
        : `/${imagePath.replace(/.*static\/media/, 'static/media')}`;
    } else {
      return imagePath.default || imagePath;
    }
  }
  return imagePath;
};

const handleImageError = (e) => {
  if (e.currentTarget.dataset.fallback) return;
  e.currentTarget.dataset.fallback = '1';
  e.currentTarget.src = FALLBACK_IMAGE;
};

const Home = ({ isDarkMode, apiString }) => {
  const getStaticImagePath = getProductionImagePath;
  const slide1Light = getStaticImagePath('../../images/header-slide1.jpg');
  const slide2Light = getStaticImagePath('../../images/header-slide2.jpg');
  const slide3Light = getStaticImagePath('../../images/header-slide3.jpg');

  // Dark mode images
  const slide1Dark = getStaticImagePath('../../images/header-slide1-dark.jpeg');
  const slide2Dark = getStaticImagePath('../../images/header-slide2-dark.jpg');
  const slide3Dark = getStaticImagePath('../../images/header-slide3-dark.jpg');

  const audiobooks_kirtan = getStaticImagePath('../../images/audiobooks_kirtan.jpg');
  const learning_resources = getStaticImagePath('../../images/learning_resources.jpg');
  const games_quizzes = getStaticImagePath('../../images/games_quizzes.jpg');
  const sikh_history = getStaticImagePath('../../images/sikh_history.jpg');
  const recent_news = getStaticImagePath('../../images/recent_news.jpg');
  const gurbani = getStaticImagePath('../../images/gurbani.jpg');
  const heritage = getStaticImagePath('../../images/heritage.jpg');

  const [imageIndex, setImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const [latestBooks, setLatestBooks] = useState([]);
  const [authors, setAuthors] = useState([]);

  const { isLoggedIn } = useAuth();
  const [showHukamnamaToast, setShowHukamnamaToast] = useState(false);
  const [showHukamnamaModal, setShowHukamnamaModal] = useState(false);
  const [activeTab, setActiveTab] = useState('hukamnama');
  const toastTimer = useRef(null);

  // Books and authors are public, so they're fetched without a token.
  // (Sending an expired token would make the request fail with 401.)
  useEffect(() => {
    const apiUrl = (apiString || '').replace(/\/$/, '');
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      const [booksRes, authorsRes] = await Promise.allSettled([
        axios.get(`${apiUrl}/collections/ebooks/`),
        axios.get(`${apiUrl}/collections/authors/`),
      ]);
      if (cancelled) return;

      if (booksRes.status === 'fulfilled') {
        setLatestBooks([...booksRes.value.data].sort((a, b) => b.id - a.id).slice(0, 12));
      } else {
        console.error('Error fetching ebooks:', booksRes.reason?.response?.status);
      }
      if (authorsRes.status === 'fulfilled') {
        setAuthors(authorsRes.value.data);
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
    (typeof book.author === 'object' ? book.author?.name : authorNames[book.author]) || 'Unknown author';

  // Show toast when component mounts
  useEffect(() => {
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
  }, []);

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

  const hukamnamaData = {
    punjabi: `ਹੁਕਮਿ ਰਜਾਈ ਚਲਣਾ ਨਾਨਕ ਲਿਖਿਆ ਨਾਲਿ ॥
    ਗਾਵੀਐ ਸੁਣੀਐ ਮਨਿ ਰਖੀਐ ਭਾਉ ॥
    ਦੁਖੁ ਪਰਹਰਿ ਸੁਖੁ ਘਰਿ ਲੈ ਜਾਇ ॥
    ਗੁਰਮੁਖਿ ਨਾਦੰ ਗੁਰਮੁਖਿ ਵੇਦੰ ਗੁਰਮੁਖਿ ਰਹਿਆ ਸਮਾਈ ॥
    ਗੁਰੁ ਈਸਰੁ ਗੁਰੁ ਗੋਰਖੁ ਬਰਮਾ ਗੁਰੁ ਪਾਰਬਤੀ ਮਾਈ ॥
    ਜੇ ਹਉ ਜਾਣਾ ਆਖਾ ਨਾਹੀ ਕਹਣਾ ਕਥਨੁ ਨ ਜਾਈ ॥`,

    english: isLoggedIn
      ? `By the Hukam of His Command, He leads us to walk on the Path; O Nanak, it is written in our destiny.
      Sing, and listen, and let your mind be filled with love.
      Your pain shall be sent far away, and peace shall come to your home.
      The Guru's Word is the Sound-current of the Naad; the Guru's Word is the Wisdom of the Vedas; the Guru's Word is all-pervading.
      The Guru is Shiva, the Guru is Vishnu and Brahma; the Guru is Paarvati and Lakhshmi.
      Even knowing God, I cannot describe Him; He cannot be described in words.`
      : `Sign in to view the full Hukamnama translation`,

    arth: isLoggedIn
      ? `The Almighty directs all beings according to His Will; O Nanak, our destiny is pre-ordained by Him.
      We should sing the Lord's praises, listen to them, and cherish love for Him in our hearts.
      By doing so, all sufferings will depart and tranquility will come to abide in our homes.
      The Guru's teachings connect us with the divine sound current, contain the essence of all scriptures, and are all-pervading.
      The Guru has the attributes of all deities - Shiva, Vishnu, Brahma, Parvati and Lakshmi.
      Even if I try to describe God, I cannot - He is beyond all description and explanation.`
      : `Sign in to view the detailed explanation`,

    reference: {
      source: 'Sri Guru Granth Sahib Ji',
      ang: 2,
      raag: 'Japji Sahib',
      writer: 'Guru Nanak Dev Ji',
    },
  };

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

  const handleImageChange = (direction) => {
    if (direction === 'up') {
      setImageIndex((prevIndex) => (prevIndex - 1 + bgImages.length) % bgImages.length);
    } else {
      setImageIndex((prevIndex) => (prevIndex + 1) % bgImages.length);
    }
  };

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

  const quickLinks = [
    { to: '/collections/ebooks', icon: <FaBook />, label: 'Ebooks' },
    { to: '/collections/audiobooks', icon: <FaRegFileAudio />, label: 'Audiobooks' },
    { to: '/collections/authors', icon: <FaFeatherAlt />, label: 'Authors' },
    { to: '/gurbani', icon: <FaHandsPraying />, label: 'Gurbani' },
    { to: '/sikh-history', icon: <FaHistory />, label: 'Sikh history' },
  ];

  const experiences = [
    {
      to: '/collections/audiobooks', img: audiobooks_kirtan, size: 'large',
      title: 'Audiobooks and kirtan',
      text: 'Listen to kirtan and narrated books on Sikh history and spirituality, wherever you are.',
    },
    {
      to: '/learning', img: learning_resources,
      title: 'Learning resources',
      text: 'Lessons and reading on Punjabi language, culture and Sikh heritage.',
    },
    {
      to: '/learning', img: games_quizzes,
      title: 'Games and quizzes',
      text: 'Shabd Khoj, Memory Match and quizzes to test what you know.',
    },
    {
      to: '/sikh-history', img: sikh_history, size: 'wide',
      title: 'Sikh history',
      text: 'From Guru Nanak Dev Ji to today, told through stories and sources.',
    },
    {
      to: '/news', img: recent_news, size: 'wide',
      title: 'Recent news',
      text: 'Updates from the Sikh and Punjabi community.',
    },
    {
      to: '/gurbani', img: gurbani, size: 'wide',
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

  const firstLine = hukamnamaData.punjabi.split('\n')[0].trim();

  return (
    <div className={styles.homeContainer}>
      {showHukamnamaToast && (
        <div className={styles.hukamnamaToast} onClick={handleToastClick}>
          <div className={styles.toastContent}>
            <span>View Today's Hukamnama</span>
            <span>ਅੱਜ ਦਾ ਹੁਕਮਨਾਮਾ ਦੇਖੋ</span>
          </div>
        </div>
      )}

      {showHukamnamaModal && (
        <div className={styles.hukamnamaModalOverlay}>
          <div className={styles.hukamnamaModal}>
            <button className={styles.modalCloseButton} onClick={closeModal}>
              <MdClose />
            </button>

            <h2 className={styles.modalTitle}>Today's Hukamnama</h2>
            <h3 className={styles.modalSubtitle}>ਅੱਜ ਦਾ ਹੁਕਮਨਾਮਾ</h3>

            <div className={styles.tabContainer}>
              <button
                className={`${styles.tabButton} ${activeTab === 'hukamnama' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('hukamnama')}
              >
                Hukamnama
              </button>
              <button
                className={`${styles.tabButton} ${activeTab === 'arth' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('arth')}
              >
                ਅਰਥ (Meaning)
              </button>
            </div>

            <div className={styles.tabContent}>
              {activeTab === 'hukamnama' ? (
                <>
                  <p className={styles.punjabiText}>{hukamnamaData.punjabi}</p>
                  <p className={styles.englishText}>{hukamnamaData.english}</p>
                </>
              ) : (
                <p className={styles.arthText}>{hukamnamaData.arth}</p>
              )}
            </div>

            <div className={styles.modalFooter}>
              {!isLoggedIn && (
                <button className={styles.modalActionButton}>
                  <Link to="/login">Sign In to View Full Translation</Link>
                </button>
              )}
              {isLoggedIn && (
                <button className={styles.modalActionButton}>
                  <Link to="/gurbani">Read More Gurbani</Link>
                </button>
              )}
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
            <p className={styles.lede}>The newest Punjabi books in the Virsaa library. Pick one up and start reading.</p>
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
                      <img
                        src={book.cover_image || FALLBACK_IMAGE}
                        alt={`Cover of ${book.title}`}
                        className={styles.bookCover}
                        loading="lazy"
                        onError={handleImageError}
                      />
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

      {/* ===================== Today's Hukamnama ===================== */}
      <section className={styles.hukamSection} aria-labelledby="hukam-title">
        <div className={styles.hukamPanel}>
          <div className={styles.hukamText}>
            <h2 id="hukam-title" className={styles.title}>Today’s Hukamnama</h2>
            <p className={styles.hukamGurmukhi} lang="pa">{firstLine}</p>
            <p className={styles.hukamRef}>
              {hukamnamaData.reference.source}, Ang {hukamnamaData.reference.ang}, {hukamnamaData.reference.writer}
            </p>
          </div>
          <div className={styles.hukamActions}>
            <button className={styles.solidButton} onClick={openHukamnama}>Read the Hukamnama</button>
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
              <img src={item.img} alt="" className={styles.bentoImage} loading="lazy" />
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
                <img
                  src={author.image || FALLBACK_IMAGE}
                  alt=""
                  className={styles.authorImage}
                  loading="lazy"
                  onError={handleImageError}
                />
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
            <img src={getStaticImagePath(heritage)} alt="Punjabi and Sikh heritage" loading="lazy" />
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

      <ChatButton isDarkMode={isDarkMode} />
    </div>
  );
};

export default Home;
