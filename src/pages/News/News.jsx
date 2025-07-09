import React, { useEffect, useRef, useMemo } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules'; // Removed Pagination
import { FaNewspaper, FaCalendarAlt, FaMapMarkerAlt, FaClock, FaStar } from 'react-icons/fa';
import 'swiper/css';
import 'swiper/css/navigation';
import styles from './News.module.css';

// Import images for header
import { Link } from 'react-router-dom';

const useProductionImagePath = () => {
  return (imagePath) => {
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
};

const News = ({ isDarkMode }) => {
  const getImagePath = useProductionImagePath();
  const headerLight = '/images/header-image.png'; // Replace with your light mode image
  const headerDark = '/images/header-image-dark.png'; // Replace with your dark mode image

  // const images for sections
  const latestNewsImage = '/images/News/latest-news.jpg';
  const upcomingEventsImage = '/images/News/upcoming-events.jpg';
  const featuredNewsImage = '/images/News/featured-news.jpg';

  const headerRef = useRef(null);

  // Memoize the header image based on dark/light mode
  const headerImage = useMemo(() => (isDarkMode ? headerDark : headerLight), [isDarkMode]);

  // Appear animation for header
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = 1;
            entry.target.style.transform = 'translateY(0)';
          }
        });
      },
      { threshold: 0.1 }
    );

    if (headerRef.current) observer.observe(headerRef.current);

    return () => observer.disconnect();
  }, []);

   // News Items
   const newsItems = [
    {
      id: 1,
      image: latestNewsImage,
      title: 'Sikh Heritage Exhibition',
      excerpt: 'Explore the rich history of Sikh culture at the upcoming exhibition.',
      date: '2023-11-15',
    },
    {
      id: 2,
      image: latestNewsImage,
      title: 'Punjabi Literature Festival',
      excerpt: 'Join us for a celebration of Punjabi literature and authors.',
      date: '2023-12-01',
    },
    {
      id: 3,
      image: latestNewsImage,
      title: 'Guru Nanak Dev Ji’s Teachings',
      excerpt: 'Learn about the life and teachings of Guru Nanak Dev Ji.',
      date: '2023-11-20',
    },
    {
      id: 4,
      image: latestNewsImage,
      title: 'Punjabi Folk Music Concert',
      excerpt: 'Experience the soulful melodies of Punjabi folk music.',
      date: '2023-12-10',
    },
    {
      id: 5,
      image: latestNewsImage,
      title: 'Sikh Martial Arts Workshop',
      excerpt: 'Discover the art of Gatka, a traditional Sikh martial art.',
      date: '2023-11-25',
    },
    {
      id: 6,
      image: latestNewsImage,
      title: 'Punjabi Cuisine Festival',
      excerpt: 'Savor the flavors of traditional Punjabi cuisine.',
      date: '2023-12-05',
    },
    {
      id: 7,
      image: latestNewsImage,
      title: 'Sikh History Seminar',
      excerpt: 'Dive deep into the history of Sikhism with renowned scholars.',
      date: '2023-11-30',
    },
    {
      id: 8,
      image: latestNewsImage,
      title: 'Punjabi Poetry Night',
      excerpt: 'Enjoy an evening of Punjabi poetry and recitations.',
      date: '2023-12-15',
    },
  ];

  // Events
  const events = [
    {
      id: 1,
      image: upcomingEventsImage,
      title: 'Baisakhi Celebration',
      date: '2024-04-13',
      time: '10:00 AM',
      location: 'Golden Temple, Amritsar',
    },
    {
      id: 2,
      image: upcomingEventsImage,
      title: 'Gurbani Kirtan Night',
      date: '2024-05-20',
      time: '7:00 PM',
      location: 'Anandpur Sahib',
    },
    {
      id: 3,
      image: upcomingEventsImage,
      title: 'Punjabi Heritage Walk',
      date: '2024-03-15',
      time: '9:00 AM',
      location: 'Lahore, Pakistan',
    },
    {
      id: 4,
      image: upcomingEventsImage,
      title: 'Sikh Art Exhibition',
      date: '2024-06-10',
      time: '11:00 AM',
      location: 'Chandigarh Museum',
    },
    {
      id: 5,
      image: upcomingEventsImage,
      title: 'Punjabi Film Festival',
      date: '2024-07-05',
      time: '6:00 PM',
      location: 'Patiala, Punjab',
    },
    {
      id: 6,
      image: upcomingEventsImage,
      title: 'Sikh History Conference',
      date: '2024-08-20',
      time: '9:00 AM',
      location: 'Delhi, India',
    },
  ];

  // Featured News Items
  const featuredNews = [
    {
      id: 1,
      image: featuredNewsImage,
      title: 'Punjabi Culture Festival 2024',
      description: 'Join us for a grand celebration of Punjabi culture, music, and food.',
    },
    {
      id: 2,
      image: featuredNewsImage,
      title: 'Sikh Heritage Exhibition',
      description: 'Explore the rich history of Sikh culture at the upcoming exhibition.',
    },
  ];

  return (
    <div className={styles.newsContainer}>
      {/* Header Section */}
      <div
        ref={headerRef}
        className={styles.header}
        style={{ backgroundImage: `url(${headerImage})` }}
      >
        <div className={styles.textOverlay}>
          <h1 className={styles.headline}>NEWS & EVENTS</h1>
          <p className={styles.description}>Stay updated with the latest news and upcoming events.</p>
        </div>
      </div>
      {/* Breadcrumb Section */}
      <div className={styles.breadcrumb}>
        <Link to={'/'}><span>Home</span></Link> / 
        <Link to={'/events'}><span> Events</span></Link>
      </div>


      {/* News List Section */}
      <section className={styles.newsList}>
        <h2 className={styles.sectionTitle}>Latest News</h2>
        <div className={styles.newsGrid}>
          {newsItems.map((news, index) => (
            <div key={news.id} className={styles.newsCard}>
              <div className={styles.imageContainer}>
                <img src={getImagePath(latestNewsImage)} alt={news.title} className={styles.newsImage} />
                <div className={styles.overlay}>
                  <h3>{news.title}</h3>
                  <p>{news.excerpt}</p>
                  <button className={styles.readMore}>Read More</button>
                </div>
              </div>
              <div className={styles.newsMeta}>
                <FaNewspaper className={styles.icon} />
                <span>{news.date}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className={styles.eventsSection}>
        <h2 className={styles.sectionTitle}>Upcoming Events</h2>
        <Swiper
          modules={[Navigation]} // Removed Pagination
          spaceBetween={30}
          slidesPerView={3} // Default number of slides
          navigation
          className={styles.swiperContainer}
          breakpoints={{
            320: {
              slidesPerView: 1, // 1 slide on small screens
            },
            576: {
              slidesPerView: 2, // 2 slides on medium screens
            },
            992: {
              slidesPerView: 3, // 3 slides on large screens
            },
          }}
        >
          {events.map((event) => (
            <SwiperSlide key={event.id} className={styles.eventCard}>
              <img src={getImagePath(upcomingEventsImage)} alt={event.title} className={styles.eventImage} />
              <div className={styles.eventDetails}>
                <h3>{event.title}</h3>
                <p>
                  <FaCalendarAlt className={styles.icon} /> {event.date}
                </p>
                <p>
                  <FaClock className={styles.icon} /> {event.time}
                </p>
                <p>
                  <FaMapMarkerAlt className={styles.icon} /> {event.location}
                </p>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      {/* Featured News Section */}
      <section className={styles.featuredNews}>
        <h2 className={styles.sectionTitle}>
          <FaStar className={styles.icon} /> Featured News
        </h2>
        <div className={styles.featuredGrid}>
          {featuredNews.map((news) => (
            <div key={news.id} className={styles.featuredCard}>
              <img src={getImagePath(news.image)} alt={news.title} className={styles.featuredImage} />
              <div className={styles.featuredContent}>
                <h3>{news.title}</h3>
                <p>{news.description}</p>
                <button className={styles.featuredButton}>Learn More</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default News;

