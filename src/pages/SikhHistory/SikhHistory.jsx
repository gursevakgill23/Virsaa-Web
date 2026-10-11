import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaBookOpen } from 'react-icons/fa';
import PageHero from '../../components/PageHero/PageHero';
import ComingSoon from '../../elements/ComingSoon/ComingSoon';
import styles from './SikhHistory.module.css';

const header_image_light = '/images/header-image.png';
const header_image_dark = '/images/header-image-dark.png';
const filter_image = '/images/sikhHistory/filter_image.jpeg';
const sikh_history = '/images/sikhHistory/sikh_history1.jpg';
const book_image = '/images/book-image.jpg';
const inspiring_image = '/images/sikhHistory/inspiring.jpg';

const getImagePath = (imagePath) => {
  if (process.env.NODE_ENV === 'production') {
    if (typeof imagePath === 'string') {
      return imagePath.startsWith('/')
        ? imagePath
        : `/${imagePath.replace(/.*static\/media/, 'static/media')}`;
    }
    return imagePath.default || imagePath;
  }
  return imagePath;
};

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
  const headerImage = getImagePath(isDarkMode ? header_image_dark : header_image_light);
  const [activeTopic, setActiveTopic] = useState(null);

  // Topics are static for now; clicking one highlights the matching timeline entry when there is one
  const matchesTopic = (title) => activeTopic && title.toLowerCase() === activeTopic.toLowerCase();

  const handleTopic = (text) => {
    const next = activeTopic === text ? null : text;
    setActiveTopic(next);
    if (next) {
      const match = sikhHistoryData.find((c) => c.title.toLowerCase() === next.toLowerCase());
      if (match) document.getElementById(`era-${match.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className={styles.page}>
      <PageHero
        image={headerImage}
        title="Sikh History"
        subtitle="Explore Sikh history: timeless teachings, inspiring legacy, and profound wisdom for all."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Sikh History' }]}
      />

      {/* ---------- Topics strip ---------- */}
      <section className={styles.topicsSection} aria-label="Topics">
        <div className={styles.topics}>
          {scrollableImages.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${styles.topic} ${activeTopic === item.text ? styles.topicOn : ''}`}
              aria-pressed={activeTopic === item.text}
              onClick={() => handleTopic(item.text)}
            >
              <span className={styles.topicFrame}>
                <img src={getImagePath(item.src)} alt="" loading="lazy" />
              </span>
              <span className={styles.topicText}>{item.text}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ---------- Timeline ---------- */}
      <section className={styles.section} aria-labelledby="roots-title">
        <h2 id="roots-title" className={styles.sectionTitle}>Roots of Sikhism</h2>
        <p className={styles.lede}>The ten Gurus, the Guru Granth Sahib and the Khalsa, with their dates.</p>

        <ol className={styles.timeline}>
          {sikhHistoryData.map((card) => (
            <li
              key={card.id}
              id={`era-${card.id}`}
              className={`${styles.era} ${matchesTopic(card.title) ? styles.eraOn : ''}`}
            >
              <span className={styles.node} aria-hidden="true" />
              <article className={styles.eraCard}>
                <div className={styles.eraFrame}>
                  <img src={getImagePath(card.image)} alt="" loading="lazy" />
                </div>
                <div className={styles.eraBody}>
                  <p className={styles.eraDate}>{card.date.replace(' - ', ' – ')}</p>
                  <h3 className={styles.eraTitle}>{card.title}</h3>
                  <p className={styles.eraText}>{card.description}</p>
                </div>
              </article>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- Inspiring ---------- */}
      <section className={styles.section}>
        <div className={styles.inspiring}>
          <div className={styles.inspiringMedia}>
            <img src={getImagePath(inspiring_image)} alt="" loading="lazy" />
          </div>
          <div className={styles.inspiringBody}>
            <h2>Most inspiring in Sikhism</h2>
            <p>Discover the most inspiring stories, quotes, and lessons from the Sikh religion.</p>
            <Link to="/collections/ebooks" className={styles.primaryButton}>
              <FaBookOpen aria-hidden="true" /> Read now
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- Recommended ---------- */}
      <section className={styles.section} aria-labelledby="recommended-title">
        <div className={styles.rowHead}>
          <h2 id="recommended-title" className={styles.sectionTitle}>Recommended for you</h2>
          <Link to="/collections/ebooks" className={styles.textLink}>See all books</Link>
        </div>
        <div className={styles.shelf}>
          {recommendedItems.map((item) => (
            <article key={item.id} className={styles.book}>
              <div className={styles.bookCover}>
                <img src={getImagePath(item.image)} alt="" loading="lazy" />
              </div>
              <h3 className={styles.bookTitle}>{item.title}</h3>
            </article>
          ))}
        </div>
      </section>

      <ComingSoon isDarkMode={isDarkMode} />
    </div>
  );
};

export default SikhHistory;
