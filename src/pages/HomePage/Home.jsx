import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdPlayArrow } from "react-icons/md";
import { FaArrowDown, FaArrowUp } from 'react-icons/fa';

// Light mode images
import slide1Light from '../../images/header-slide1.jpg';
import slide2Light from '../../images/header-slide2.jpg';
import slide3Light from '../../images/header-slide3.jpg';

// Dark mode images
import slide1Dark from '../../images/header-slide1-dark.jpg';
import slide2Dark from '../../images/header-slide2-dark.jpg';
import slide3Dark from '../../images/header-slide3-dark.jpg';

import book_image from '../../images/book-image.jpg';
import audiobooks_kirtan from '../../images/audiobooks_kirtan.jpg';
import learning_resources from '../../images/learning_resources.jpg';
import games_quizzes from '../../images/games_quizzes.jpg';
import sikh_history from '../../images/sikh_history.jpg';
import recent_news from '../../images/recent_news.jpg';
import gurbani from '../../images/gurbani.jpg';
import heritage from '../../images/heritage.jpg';
import styles from './Home.module.css';

const Home = ({ isDarkMode }) => {
  const [imageIndex, setImageIndex] = useState(0);
  const imageRefs = useRef([]);
  const navigate = useNavigate();

  // Memoize the bgImages array to prevent unnecessary recalculations
  const bgImages = useMemo(() => {
    return isDarkMode
      ? [slide1Dark, slide2Dark, slide3Dark]
      : [slide1Light, slide2Light, slide3Light];
  }, [isDarkMode]); // Only recalculate when isDarkMode changes


  // Function to change the image automatically
  useEffect(() => {
    const interval = setInterval(() => {
      setImageIndex((prevIndex) => (prevIndex + 1) % bgImages.length);
    }, 5000); // Change image every 5 seconds

    // Cleanup interval on unmount or when dependencies change
    return () => clearInterval(interval);
  }, [bgImages.length]); // Only depend on bgImages.length

  // Add animation on page load for book images
  useEffect(() => {
    imageRefs.current.forEach((image, index) => {
      setTimeout(() => {
        image.style.opacity = 1;
        image.style.transform = 'scale(1)';
      }, index * 200); // Staggered animation delay
    });
  }, []);

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
          {books.slice(0, 10).map((book, index) => (
            <div key={book.id} className={styles.bookCard}>
              <div className={styles.imageContainer}>
                <img
                  ref={(el) => (imageRefs.current[index] = el)}
                  src={book.image}
                  alt={book.name}
                  className={styles.bookImage}
                />
              </div>
              <h3 className={styles.bookName}>{book.name}</h3>
              <p className={styles.writerName}>By {book.writer}</p>
            </div>
          ))}
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
            <img src={heritage} alt="Punjabi & Sikh Heritage" />
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
          <div className={styles.card}>
            <div className={styles.cardImage}>
              <img src={audiobooks_kirtan} alt="Audiobooks and Kirtan" />
              <div className={styles.cardOverlay}>
                <h3>AUDIOBOOKS AND KIRTAN</h3>
                <p>Immerse yourself in the divine melodies of Gurbani and explore a vast collection of audiobooks on Sikh history and spirituality.</p>
              </div>
            </div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardImage}>
              <img src={learning_resources} alt="Learning Resources" />
              <div className={styles.cardOverlay}>
                <h3>LEARNING RESOURCES</h3>
                <p>Discover educational materials, books, and online courses to deepen your understanding of Punjabi culture and Sikh heritage.</p>
              </div>
            </div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardImage}>
              <img src={games_quizzes} alt="Games and Quizzes" />
              <div className={styles.cardOverlay}>
                <h3>GAMES AND QUIZZES</h3>
                <p>Engage in fun and interactive games and quizzes to test your knowledge of Punjabi culture and Sikh history.</p>
              </div>
            </div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardImage}>
              <img src={sikh_history} alt="Sikh History" />
              <div className={styles.cardOverlay}>
                <h3>SIKH HISTORY</h3>
                <p>Immerse yourself in the divine melodies of Gurbani and explore a vast collection of audiobooks on Sikh history and spirituality.</p>
              </div>
            </div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardImage}>
              <img src={recent_news} alt="Recent News" />
              <div className={styles.cardOverlay}>
                <h3>RECENT NEWS</h3>
                <p>Immerse yourself in the divine melodies of Gurbani and explore a vast collection of audiobooks on Sikh history and spirituality.</p>
              </div>
            </div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardImage}>
              <img src={gurbani} alt="Gurbani" />
              <div className={styles.cardOverlay}>
                <h3>GURBANI</h3>
                <p>Immerse yourself in the divine melodies of Gurbani and explore a vast collection of audiobooks on Sikh history and spirituality.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

