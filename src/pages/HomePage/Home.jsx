import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate,Link } from 'react-router-dom';
import { MdPlayArrow, MdClose } from "react-icons/md";
import { FaArrowDown, FaArrowUp } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext'; // Import your AuthContext
import styles from './Home.module.css';
import ChatButton from '../../elements/ChatWithUs/ChatButton/ChatButton';

const useProductionImagePath = () => {
  
  return (imagePath) => {
    // Only modify in production
    if (process.env.NODE_ENV === 'production') {
      // Handle both imported images and public folder images
      if (typeof imagePath === 'string') {
        // For public folder images
        return imagePath.startsWith('/') 
          ? imagePath 
          : `/${imagePath.replace(/.*static\/media/, 'static/media')}`;
      } else {
        // For imported images
        return imagePath.default || imagePath;
      }
    }
    return imagePath;
  };
};
const Home = ({ isDarkMode }) => {
  const getImagePath = useProductionImagePath();
  const slide1Light = '../../images/header-slide1.jpg';
  const slide2Light = '../../images/header-slide2.jpg';
  const slide3Light = '../../images/header-slide3.jpg';

  // Dark mode images
  const slide1Dark = '../../images/header-slide1-dark.jpg';
  const slide2Dark = '../../images/header-slide2-dark.jpg';
  const slide3Dark = '../../images/header-slide3-dark.jpg';

  const book_image = '../../images/book-image.jpg';
  const audiobooks_kirtan = '../../images/audiobooks_kirtan.jpg';
  const learning_resources = '../../images/learning_resources.jpg';
  const games_quizzes = '../../images/games_quizzes.jpg';
  const sikh_history = '../../images/sikh_history.jpg';
  const recent_news = '../../images/recent_news.jpg';
  const gurbani = '../../images/gurbani.jpg';
  const heritage = '../../images/heritage.jpg';
  const [imageIndex, setImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const imageRefs = useRef([]);
  const navigate = useNavigate();

  const { isLoggedIn } = useAuth(); // Get auth state
  const [showHukamnamaToast, setShowHukamnamaToast] = useState(false);
  const [showHukamnamaModal, setShowHukamnamaModal] = useState(false);
  const [activeTab, setActiveTab] = useState('hukamnama');
  const toastTimer = useRef(null);

  // Show toast when component mounts - appears every time now
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHukamnamaToast(true);
      // Hide after 5 seconds
      toastTimer.current = setTimeout(() => {
        setShowHukamnamaToast(false);
      }, 8000);
    }, 2000); // Show after 2 seconds delay
    
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

  const closeModal = () => {
    setShowHukamnamaModal(false);
  };

 // Sample Hukamnama data - could be fetched from API based on auth state
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
    source: "Sri Guru Granth Sahib Ji",
    ang: 2,
    raag: "Japji Sahib",
    writer: "Guru Nanak Dev Ji"
  }
};

  // Memoize the bgImages array to prevent unnecessary recalculations
  const bgImages = useMemo(() => {
    return isDarkMode
      ? [slide1Dark, slide2Dark, slide3Dark]
      : [slide1Light, slide2Light, slide3Light];
  }, [isDarkMode]);

  useEffect(() => {
    // Simulate loading for 2 seconds
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
    }, 4000);

    return () => clearTimeout(loadingTimer);
  }, []);

  // Function to change the image automatically
  useEffect(() => {
    const interval = setInterval(() => {
      setImageIndex((prevIndex) => (prevIndex + 1) % bgImages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [bgImages.length]);

  // Add animation on page load for book images
  useEffect(() => {
    if (!isLoading) {
      imageRefs.current.forEach((image, index) => {
        setTimeout(() => {
          if (image) {
            image.style.opacity = 1;
            image.style.transform = 'scale(1)';
          }
        }, index * 200);
      });
    }
  }, [isLoading]);

  const handleImageChange = (direction) => {
    if (direction === 'up') {
      setImageIndex((prevIndex) => (prevIndex - 1 + bgImages.length) % bgImages.length);
    } else {
      setImageIndex((prevIndex) => (prevIndex + 1) % bgImages.length);
    }
  };

  const goToCollections = () => {
    navigate('/collections/ebooks');
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

  const books = [
    {
      id: 1,
      image: book_image,
      name: 'Heer Ranjha',
      writer: 'Waris Shah',
    },
    {
      id: 2,
      image: book_image,
      name: 'Pinjar',
      writer: 'Amrita Pritam',
    },
    {
      id: 3,
      image: book_image,
      name: 'Sadda Punjab',
      writer: 'Nanak Singh',
    },
    {
      id: 4,
      image: book_image,
      name: 'Ik Si Punjab',
      writer: 'Surjit Patar',
    },
    {
      id: 5,
      image: book_image,
      name: 'Loona',
      writer: 'Shiv Kumar Batalvi',
    },
    {
      id: 6,
      image: book_image,
      name: 'Mera Pind',
      writer: 'Gurdial Singh',
    },
    {
      id: 7,
      image: book_image,
      name: 'Chitta Lahu',
      writer: 'Nanak Singh',
      rating: '4.3',
    },
    {
      id: 8,
      image: book_image,
      name: 'Sunehray Din',
      writer: 'Kartar Singh Duggal',
    },
    {
      id: 9,
      image: book_image,
      name: 'Punjab Diyan Lok Kathavan',
      writer: 'Devinder Satyarthi',
    },
    {
      id: 10,
      image: book_image,
      name: 'Raseedi Ticket',
      writer: 'Amrita Pritam',
    },
  ];

  return (
    <div className={styles.homeContainer}>
      {/* Hukamnama Toast Notification - appears every time */}
      {showHukamnamaToast && (
        <div className={styles.hukamnamaToast} onClick={handleToastClick}>
          <div className={styles.toastContent}>
            <span>View Today's Hukamnama</span>
            <span>ਅੱਜ ਦਾ ਹੁਕਮਨਾਮਾ ਦੇਖੋ</span>
          </div>
        </div>
      )}

      {/* Hukamnama Modal */}
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

      <div className={styles.header}>
        <div className={styles.imageSlider}>
          {bgImages.map((image, index) => (
            <div
              key={index}
              className={styles.imageSlide}
              style={{
                backgroundImage: `url(${image})`,
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

        {/* Play Button */}
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

      {/* Explore Books Section */}
      <div className={styles.exploreBooksSection}>
        <h2 className={styles.sectionTitle}>Explore Our Latest Books</h2>
        <div className={styles.booksGrid}>
          {isLoading ? (
            // Skeleton loading state
            Array(10).fill().map((_, index) => (
              <div key={`skeleton-${index}`} className={styles.bookCardSkeleton}>
                <div className={styles.skeletonImageContainer}>
                  <div className={styles.skeletonImage}>
                  </div>
                </div>
                <div className={styles.skeletonText}></div>
                <div className={styles.skeletonTextSmall}></div>
              </div>
            ))
          ) : (
            // Actual book cards
            books.slice(0, 10).map((book, index) => (
              <Link to={`/collections/ebooks/ebook/${book.id}`} key={book.id}>
              <div key={book.id} className={styles.bookCard}>
                <div className={styles.imageContainer}>
                  <img
                    ref={(el) => (imageRefs.current[index] = el)}
                    src={getImagePath(book.image)}
                    alt={book.name}
                    className={styles.bookImage}
                  />
                </div>
                <h3 className={styles.bookName}>{book.name}</h3>
                <p className={styles.writerName}>By {book.writer}</p>
              </div>
              </Link>
            ))
          )}
        </div>
        <button className={styles.allBooksButton} onClick={goToCollections}>
          All Books
        </button>
      </div>

      {/* Heritage Section */}
      <section className={styles.heritageSection}>
        <h1 className={styles.heritageHeading}>Explore The Richness Of Punjabi & Sikh Heritage</h1>
        <div className={styles.heritageContainer}>
          <div className={styles.heritageImage}>
            <img src={getImagePath(heritage)} alt="Punjabi & Sikh Heritage" />
          </div>
          <div className={styles.heritageContent}>
            <div className={styles.heritageItem}>
              <span className={styles.heritageIcon}>🕌</span>
              <div className={styles.heritageText}>
                <h3>Spiritual Legacy</h3>
                <p>
                  Discover the profound spiritual teachings of Sikhism, rooted in the principles of equality, service, and devotion. Explore iconic landmarks like the Golden Temple in Amritsar, a symbol of peace and unity.
                </p>
              </div>
            </div>
            <div className={styles.heritageItem}>
              <span className={styles.heritageIcon}>🎵</span>
              <div className={styles.heritageText}>
                <h3>Cultural Vibrancy</h3>
                <p>
                  Immerse yourself in the lively traditions of Punjab, from the energetic beats of Bhangra to the soulful melodies of Gurbani. Experience the warmth of Punjabi hospitality and the richness of its festivals like Vaisakhi and Lohri.
                </p>
              </div>
            </div>
            <div className={styles.heritageItem}>
              <span className={styles.heritageIcon}>🥘</span>
              <div className={styles.heritageText}>
                <h3>Culinary Delights</h3>
                <p>
                  Savor the flavors of Punjabi cuisine, known for its hearty and aromatic dishes. From buttery parathas to creamy dal makhani, Punjabi food is a celebration of taste and tradition.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Listen, Learn, and Play Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Listen, Learn, And Play</h2>
        <div className={styles.cardContainer}>
          <Link to={'/collections'}>
          <div className={styles.card}>
            <div className={styles.cardImage}>
              <img src={getImagePath(audiobooks_kirtan)} alt="Audiobooks and Kirtan" />
              <div className={styles.cardOverlay}>
                <h3>AUDIOBOOKS AND KIRTAN</h3>
                <p>Immerse yourself in the divine melodies of Gurbani and explore a vast collection of audiobooks on Sikh history and spirituality.</p>
              </div>
            </div>
          </div>
          </Link>
          <Link to={'/learning'}>
          <div className={styles.card}>
            <div className={styles.cardImage}>
              <img src={getImagePath(learning_resources)} alt="Learning Resources" />
              <div className={styles.cardOverlay}>
                <h3>LEARNING RESOURCES</h3>
                <p>Discover educational materials, books, and online courses to deepen your understanding of Punjabi culture and Sikh heritage.</p>
              </div>
            </div>
          </div>
          </Link>
          <Link to={'/learning'}>
          <div className={styles.card}>
            <div className={styles.cardImage}>
              <img src={getImagePath(games_quizzes)} alt="Games and Quizzes" />
              <div className={styles.cardOverlay}>
                <h3>GAMES AND QUIZZES</h3>
                <p>Engage in fun and interactive games and quizzes to test your knowledge of Punjabi culture and Sikh history.</p>
              </div>
            </div>
          </div>
          </Link>
          <div className={styles.card}>
          <Link to={'/sikh-history'}>
            <div className={styles.cardImage}>
              <img src={getImagePath(sikh_history)} alt="Sikh History" />
              <div className={styles.cardOverlay}>
                <h3>SIKH HISTORY</h3>
                <p>Immerse yourself in the divine melodies of Gurbani and explore a vast collection of audiobooks on Sikh history and spirituality.</p>
              </div>
            </div>
            </Link>
          </div>
          <div className={styles.card}>
          <Link to={'/news'}>
            <div className={styles.cardImage}>
              <img src={getImagePath(recent_news)} alt="Recent News" />
              <div className={styles.cardOverlay}>
                <h3>RECENT NEWS</h3>
                <p>Immerse yourself in the divine melodies of Gurbani and explore a vast collection of audiobooks on Sikh history and spirituality.</p>
              </div>
            </div>
            </Link>

          </div>
          <div className={styles.card}>
          <Link to={'/gurbani'}>
            <div className={styles.cardImage}>
              <img src={getImagePath(gurbani)} alt="Gurbani" />
              <div className={styles.cardOverlay}>
                <h3>GURBANI</h3>
                <p>Immerse yourself in the divine melodies of Gurbani and explore a vast collection of audiobooks on Sikh history and spirituality.</p>
              </div>
            </div>
            </Link>
          </div>
        </div>
      </section>
      <ChatButton isDarkMode={isDarkMode} />      
    </div>
  );
};

export default Home;

