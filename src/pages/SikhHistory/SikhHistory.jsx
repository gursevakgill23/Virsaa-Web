import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './SikhHistory.module.css';
import header_image_light from '../../images/sikhHistory/header-image.png'; // Light mode image
import header_image_dark from '../../images/sikhHistory/header-image-dark.png'; // Dark mode image
import filter_image from '../../images/sikhHistory/filter_image.jpeg';
import sikh_history from '../../images/sikhHistory/sikh_history1.jpg';
import book_image from '../../images/book-image.jpg';
import inspiring_image from '../../images/sikhHistory/inspiring.jpg'; // New image for the section
import ComingSoon from '../../elements/ComingSoon/ComingSoon';

// Dummy data for scrollable images
const scrollableImages = [
  { id: 1, src: filter_image, text: 'Guru Nanak Dev Ji' },
  { id: 2, src: filter_image, text: 'Foundation of Sikhism' },
  { id: 3, src: filter_image, text: 'Guru Angad Dev Ji' },
  { id: 4, src: filter_image, text: 'Gurmukhi Script' },
  { id: 5, src: filter_image, text: 'Guru Amar Das Ji' },
  { id: 6, src: filter_image, text: 'Langar Tradition' },
  { id: 7, src: filter_image, text: 'Guru Ram Das Ji' },
  { id: 8, src: filter_image, text: 'Amritsar Foundation' },
  { id: 9, src: filter_image, text: 'Guru Arjan Dev Ji' },
  { id: 10, src: filter_image, text: 'Compilation of Guru Granth Sahib' },
  { id: 11, src: filter_image, text: 'Martyrdom of Guru Arjan Dev Ji' },
  { id: 12, src: filter_image, text: 'Guru Hargobind Ji' },
  { id: 13, src: filter_image, text: 'Miri-Piri Concept' },
  { id: 14, src: filter_image, text: 'Guru Har Rai Ji' },
  { id: 15, src: filter_image, text: 'Guru Harkrishan Ji' },
  { id: 16, src: filter_image, text: 'Youngest Guru' },
];

// Dummy data for Sikh History cards
const sikhHistoryData = [
  { id: 1, image: sikh_history, title: 'Guru Nanak Dev Ji', description: 'Founder of Sikhism', date: '1469 - 1539' },
  { id: 2, image: sikh_history, title: 'Guru Angad Dev Ji', description: 'Second Sikh Guru', date: '1504 - 1552' },
  { id: 3, image: sikh_history, title: 'Guru Amar Das Ji', description: 'Third Sikh Guru', date: '1479 - 1574' },
  { id: 4, image: sikh_history, title: 'Guru Ram Das Ji', description: 'Fourth Sikh Guru', date: '1534 - 1581' },
  { id: 5, image: sikh_history, title: 'Guru Arjan Dev Ji', description: 'Fifth Sikh Guru', date: '1563 - 1606' },
  { id: 6, image: sikh_history, title: 'Guru Hargobind Ji', description: 'Sixth Sikh Guru', date: '1595 - 1644' },
  { id: 7, image: sikh_history, title: 'Guru Har Rai Ji', description: 'Seventh Sikh Guru', date: '1630 - 1661' },
  { id: 8, image: sikh_history, title: 'Guru Harkrishan Ji', description: 'Eighth Sikh Guru', date: '1656 - 1664' },
  { id: 9, image: sikh_history, title: 'Guru Tegh Bahadur Ji', description: 'Ninth Sikh Guru', date: '1621 - 1675' },
  { id: 10, image: sikh_history, title: 'Guru Gobind Singh Ji', description: 'Tenth Sikh Guru', date: '1666 - 1708' },
  { id: 11, image: sikh_history, title: 'Guru Granth Sahib Ji', description: 'Eternal Guru', date: '1708 - Present' },
  { id: 12, image: sikh_history, title: 'Khalsa Panth', description: 'Sikh Community', date: '1699 - Present' },
];

const recommendedItems = [
  { id: 1, image: book_image, title: 'Heer Ranjha' },
  { id: 2, image: book_image, title: 'Pinjar' },
  { id: 3, image: book_image, title: 'Sadda Punjab' },
  { id: 4, image: book_image, title: 'Ik Si Punjab' },
  { id: 5, image: book_image, title: 'Loona' },
  { id: 6, image: book_image, title: 'Mera Pind' },
  { id: 7, image: book_image, title: 'Chitta Lahu' },
  { id: 8, image: book_image, title: 'Sunehray Din' },
  { id: 9, image: book_image, title: 'Punjab Diyan Lok Kathavan' },
  { id: 10, image: book_image, title: 'Raseedi Ticket' },
];

const SikhHistory = ({ isDarkMode }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 12;

  // Pagination logic
  const indexOfLastCard = currentPage * cardsPerPage;
  const indexOfFirstCard = indexOfLastCard - cardsPerPage;
  const currentCards = sikhHistoryData.slice(indexOfFirstCard, indexOfLastCard);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const imageRefs = useRef([]);

  useEffect(() => {
    imageRefs.current.forEach((image, index) => {
      setTimeout(() => {
        image.style.opacity = 1;
        image.style.transform = 'scale(1)';
      }, index * 200); // Staggered animation delay
    });
  }, []);

  return (
    <div className={styles.container}>
      {/* Header Section */}
      <div className={styles.header}>
        <img
          src={isDarkMode ? header_image_dark : header_image_light} // Conditionally render image
          alt="Sikh History Header"
          className={styles.headerImage}
        />
        <h1 className={styles.headerTitle}>SIKH HISTORY</h1>
        <p className={styles.headerText}>Explore Sikh history: timeless teachings, inspiring legacy, and profound wisdom for all.</p>
      </div>

      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <Link to={'/'}><span>Home</span></Link> / 
        <Link to={'/sikh-history'}><span> Sikh History</span></Link>
      </div>

      {/* Scrollable Images Section */}
      <div className={styles.scrollableSection}>
        {scrollableImages.map((item) => (
          <div key={item.id} className={styles.scrollableItem}>
            <img src={item.src} alt={item.text} className={styles.scrollableImage} />
            <p className={styles.scrollableText}>{item.text}</p>
          </div>
        ))}
      </div>

      {/* Sikh History Section */}
      <section className={styles.sikhHistorysection}>
        <div className={styles.sikhHistoryHeading}>
          <h1>Explore Sikh History : Roots Of Sikhism</h1>
        </div>
        <div className={styles.cardGrid}>
          {currentCards.map((card) => (
            <div key={card.id} className={styles.card}>
              <div className={styles.cardImageContainer}>
                <img src={card.image} alt={card.title} className={styles.cardImage} />
                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{card.title}</h3>
                  <p className={styles.cardDescription}>{card.description}</p>
                  <p className={styles.cardDate}>{card.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pagination */}
      <div className={styles.pagination}>
        {Array.from({ length: Math.ceil(sikhHistoryData.length / cardsPerPage) }, (_, i) => (
          <button
            key={i + 1}
            onClick={() => paginate(i + 1)}
            className={currentPage === i + 1 ? styles.activePage : styles.pageButton}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* New Section: Most Inspiring in Sikhism */}
      <div className={styles.inspiringSection}>
        <div className={styles.inspiringImageContainer}>
          <img src={inspiring_image} alt="Most Inspiring in Sikhism" className={styles.inspiringImage} />
        </div>
        <div className={styles.inspiringContent}>
          <h3>Most Inspiring in Sikhism</h3>
          <p>Discover the most inspiring stories, quotes, and lessons from the Sikh religion. Whether you're a beginner or a seasoned scholar, this resource will help you deepen your understanding of the divine teachings.</p>
          <button className={styles.readNowButton}>Read Now</button>
        </div>
      </div>

      {/* Recommended For You Section */}
      <div className={styles.recommendedSection}>
        <h2 className={styles.sectionTitle}>Recommended For You</h2>
        <div className={styles.recommendedGrid}>
          {recommendedItems.map((item) => (
            <div key={item.id} className={styles.recommendedCard}>
              <img src={item.image} alt={item.title} className={styles.recommendedImage} />
              <h3 className={styles.recommendedTitle}>{item.title}</h3>
            </div>
          ))}
        </div>
      </div>

      <ComingSoon isDarkMode={isDarkMode} />
    </div>
  );
};

export default SikhHistory;