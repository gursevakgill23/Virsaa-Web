import React, { useMemo } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import 'swiper/css';
import 'swiper/css/navigation';
import PageHero from '../../components/PageHero/PageHero';
import styles from './News.module.css';

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

const headerLight = '/images/header-image.png';
const headerDark = '/images/header-image-dark.png';
const latestNewsImage = '/images/News/latest-news.jpg';
const upcomingEventsImage = '/images/News/upcoming-events.jpg';
const featuredNewsImage = '/images/News/featured-news.jpg';

// Placeholder content until news and events come from the backend
const newsItems = [
  { id: 1, image: latestNewsImage, title: 'Sikh Heritage Exhibition', excerpt: 'Explore the rich history of Sikh culture at the upcoming exhibition.', date: '2023-11-15' },
  { id: 2, image: latestNewsImage, title: 'Punjabi Literature Festival', excerpt: 'Join us for a celebration of Punjabi literature and authors.', date: '2023-12-01' },
  { id: 3, image: latestNewsImage, title: 'Guru Nanak Dev Ji’s Teachings', excerpt: 'Learn about the life and teachings of Guru Nanak Dev Ji.', date: '2023-11-20' },
  { id: 4, image: latestNewsImage, title: 'Punjabi Folk Music Concert', excerpt: 'Experience the soulful melodies of Punjabi folk music.', date: '2023-12-10' },
  { id: 5, image: latestNewsImage, title: 'Sikh Martial Arts Workshop', excerpt: 'Discover the art of Gatka, a traditional Sikh martial art.', date: '2023-11-25' },
  { id: 6, image: latestNewsImage, title: 'Punjabi Cuisine Festival', excerpt: 'Savor the flavors of traditional Punjabi cuisine.', date: '2023-12-05' },
  { id: 7, image: latestNewsImage, title: 'Sikh History Seminar', excerpt: 'Dive deep into the history of Sikhism with renowned scholars.', date: '2023-11-30' },
  { id: 8, image: latestNewsImage, title: 'Punjabi Poetry Night', excerpt: 'Enjoy an evening of Punjabi poetry and recitations.', date: '2023-12-15' },
];

const events = [
  { id: 1, image: upcomingEventsImage, title: 'Baisakhi Celebration', date: '2024-04-13', time: '10:00 AM', location: 'Golden Temple, Amritsar' },
  { id: 2, image: upcomingEventsImage, title: 'Gurbani Kirtan Night', date: '2024-05-20', time: '7:00 PM', location: 'Anandpur Sahib' },
  { id: 3, image: upcomingEventsImage, title: 'Punjabi Heritage Walk', date: '2024-03-15', time: '9:00 AM', location: 'Lahore, Pakistan' },
  { id: 4, image: upcomingEventsImage, title: 'Sikh Art Exhibition', date: '2024-06-10', time: '11:00 AM', location: 'Chandigarh Museum' },
  { id: 5, image: upcomingEventsImage, title: 'Punjabi Film Festival', date: '2024-07-05', time: '6:00 PM', location: 'Patiala, Punjab' },
  { id: 6, image: upcomingEventsImage, title: 'Sikh History Conference', date: '2024-08-20', time: '9:00 AM', location: 'Delhi, India' },
];

const featuredNews = [
  { id: 1, image: featuredNewsImage, title: 'Punjabi Culture Festival 2024', description: 'Join us for a grand celebration of Punjabi culture, music, and food.' },
  { id: 2, image: featuredNewsImage, title: 'Sikh Heritage Exhibition', description: 'Explore the rich history of Sikh culture at the upcoming exhibition.' },
];

// Parse "YYYY-MM-DD" as a local date (new Date('2024-04-13') would be UTC and can shift a day)
const toDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const longDate = (iso) => toDate(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });

const News = ({ isDarkMode }) => {
  const headerImage = useMemo(() => getImagePath(isDarkMode ? headerDark : headerLight), [isDarkMode]);
  const sortedNews = useMemo(() => [...newsItems].sort((a, b) => toDate(b.date) - toDate(a.date)), []);
  const sortedEvents = useMemo(() => [...events].sort((a, b) => toDate(a.date) - toDate(b.date)), []);
  const [lead, second] = featuredNews;

  return (
    <div className={styles.page}>
      <PageHero
        image={headerImage}
        title="News & Events"
        subtitle="Stay updated with the latest news and upcoming events."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'News & Events' }]}
      />

      {/* ---------- Featured ---------- */}
      <section className={styles.section} aria-labelledby="featured-title">
        <h2 id="featured-title" className={styles.sectionTitle}>Featured</h2>
        <p className={styles.lede}>The stories we’re following most closely.</p>
        <div className={styles.featuredGrid}>
          {[lead, second].filter(Boolean).map((item, i) => (
            <article key={item.id} className={`${styles.featuredCard} ${i === 0 ? styles.featuredLead : ''}`}>
              <img src={getImagePath(item.image)} alt="" className={styles.featuredImage} loading="lazy" />
              <div className={styles.featuredScrim} aria-hidden="true" />
              <div className={styles.featuredContent}>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ---------- Upcoming events ---------- */}
      <section className={styles.section} aria-labelledby="events-title">
        <h2 id="events-title" className={styles.sectionTitle}>Upcoming events</h2>
        <p className={styles.lede}>Gatherings, kirtan and exhibitions across Punjab and beyond.</p>
        <Swiper
          modules={[Navigation]}
          spaceBetween={22}
          slidesPerView={1.1}
          navigation
          className={styles.swiper}
          breakpoints={{
            576: { slidesPerView: 2 },
            992: { slidesPerView: 3 },
          }}
        >
          {sortedEvents.map((event) => {
            const d = toDate(event.date);
            return (
              <SwiperSlide key={event.id} className={styles.slide}>
                <article className={styles.eventCard}>
                  <div className={styles.eventMedia}>
                    <img src={getImagePath(event.image)} alt="" className={styles.eventImage} loading="lazy" />
                    <time className={styles.dateTile} dateTime={event.date}>
                      <span className={styles.dateDay}>{d.getDate()}</span>
                      <span className={styles.dateMonth}>{d.toLocaleDateString(undefined, { month: 'short' })}</span>
                      <span className={styles.dateYear}>{d.getFullYear()}</span>
                    </time>
                  </div>
                  <div className={styles.eventBody}>
                    <h3>{event.title}</h3>
                    <p><FaClock aria-hidden="true" /> {event.time}</p>
                    <p><FaMapMarkerAlt aria-hidden="true" /> {event.location}</p>
                  </div>
                </article>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </section>

      {/* ---------- Latest news ---------- */}
      <section className={styles.section} aria-labelledby="latest-title">
        <h2 id="latest-title" className={styles.sectionTitle}>Latest news</h2>
        <p className={styles.lede}>Newest first.</p>
        <div className={styles.newsGrid}>
          {sortedNews.map((news) => (
            <article key={news.id} className={styles.newsCard}>
              <div className={styles.newsMedia}>
                <img src={getImagePath(news.image)} alt="" className={styles.newsImage} loading="lazy" />
              </div>
              <div className={styles.newsBody}>
                <time className={styles.newsDate} dateTime={news.date}>{longDate(news.date)}</time>
                <h3>{news.title}</h3>
                <p>{news.excerpt}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default News;
