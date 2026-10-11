import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaMapMarkerAlt, FaCalendarAlt, FaChevronLeft, FaChevronRight, FaMapMarkedAlt, FaUserAlt } from 'react-icons/fa';
import PageHero from '../../../components/PageHero/PageHero';
import styles from './GurdwaraHistory.module.css';

const useProductionImagePath = () => {
  return (imagePath) => {
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
};

const GurdwaraHistory = ({ isDarkMode }) => {
  const getImagePath = useProductionImagePath();
  const { id } = useParams();
  const [mainImage, setMainImage] = useState(0);

  const header_image_light = '/images/header-image.png';
  const header_image_dark = '/images/header-image-dark.png';
  const history_images = [
    '/images/gurdwaraAccess/history/history1.jpg',
    '/images/gurdwaraAccess/history/history2.jpg',
    '/images/gurdwaraAccess/history/history3.jpg',
    '/images/gurdwaraAccess/history/history4.jpg',
    '/images/gurdwaraAccess/history/history5.jpg',
  ];

  // Mock data; will come from the API by id later
  const gurdwaras = [
    {
      id: 1,
      name: 'Gurdwara Sikh Sangat Brampton',
      address: '32 Regan Rd, Brampton, ON, Canada',
      established: '1995',
      history: [
        'Founded in 1995 by a small group of Sikh immigrants who wanted to create a spiritual home for the growing Sikh community in Brampton.',
        'Started in a small rented space with just a handful of families attending weekly services.',
        'In 2001, the community purchased the current property and began construction of the main prayer hall.',
        'The current main building was completed in 2005 after years of community fundraising and volunteer work.',
        'Expanded in 2012 with the addition of a community center and langar hall that can serve 500 people.',
        'Today, it serves as one of the largest Sikh places of worship in the Greater Toronto Area with over 5,000 visitors weekly.',
      ],
      images: history_images,
    },
    {
      id: 2,
      name: 'Gurudwara Nanaksar-Brampton',
      address: '64 Timberlane Dr, Brampton, ON, Canada',
      established: '1988',
      history: [
        'Established in 1988 as the first Nanaksar Thath outside of India.',
        'Founded by followers of Sant Baba Isher Singh Ji who brought the Nanaksar tradition to Canada.',
        'Originally located in a small house before moving to the current location in 1992.',
        'The distinctive white domes were added in 1995 after extensive community fundraising.',
        'Known for its strict adherence to traditional Sikh practices and serene atmosphere.',
        'Hosts an annual Nagar Kirtan that attracts thousands of devotees from across North America.',
      ],
      images: history_images.slice(0, 3),
    },
    {
      id: 3,
      name: 'Sri Guru Nanak Sikh Centre Brampton',
      address: '99 Glidden Rd, Brampton, ON, Canada',
      established: '2002',
      history: [
        'Founded in 2002 to serve the rapidly growing Sikh population in northwest Brampton.',
        'Started as a small storefront Gurdwara before moving to its current purpose-built facility in 2008.',
        'The current building was designed by renowned Sikh architect Harinder Singh and blends traditional and modern elements.',
        'Known for its educational programs and youth engagement initiatives.',
        'Hosts one of the largest Vaisakhi celebrations in the region with over 10,000 attendees annually.',
        'Added a state-of-the-art community kitchen in 2015 that serves langar to over 1,000 people daily.',
      ],
      images: history_images.slice(0, 4),
    },
  ];

  const selectedGurdwara = gurdwaras.find((g) => g.id === parseInt(id, 10)) || gurdwaras[0];
  const count = selectedGurdwara.images.length;
  const step = (dir) => setMainImage((i) => (i + dir + count) % count);

  const figures = [
    { title: 'Founder Name', text: 'Description of their contribution to the Gurdwara' },
    { title: 'Prominent Leader', text: 'Description of their role in the Gurdwara’s development' },
    { title: 'Community Builder', text: 'Description of how they helped grow the congregation' },
  ];

  return (
    <div className={styles.page}>
      <PageHero
        image={getImagePath(isDarkMode ? header_image_dark : header_image_light)}
        title={`HISTORY OF ${selectedGurdwara.name.toUpperCase()}`}
        subtitle="Discover the rich heritage and journey of this sacred place"
        crumbs={[
          { label: 'Home', to: '/' },
          { label: 'Gurdwara Access', to: '/gurdwara-access' },
          { label: `History of ${selectedGurdwara.name}` },
        ]}
      />

      {/* ---------- Gallery + facts ---------- */}
      <section className={styles.section} aria-label="Photos and details">
        <div className={styles.galleryLayout}>
          <div className={styles.gallery}>
            <div className={styles.mainImageContainer}>
              <img
                src={getImagePath(selectedGurdwara.images[mainImage])}
                alt={`${selectedGurdwara.name} (${mainImage + 1} of ${count})`}
                className={styles.mainImage}
              />
              {count > 1 && (
                <>
                  <button type="button" className={`${styles.navArrow} ${styles.navPrev}`} onClick={() => step(-1)} aria-label="Previous photo">
                    <FaChevronLeft />
                  </button>
                  <button type="button" className={`${styles.navArrow} ${styles.navNext}`} onClick={() => step(1)} aria-label="Next photo">
                    <FaChevronRight />
                  </button>
                </>
              )}
              <div className={styles.thumbnailGallery}>
                {selectedGurdwara.images.map((image, index) => (
                  <button
                    key={image}
                    type="button"
                    className={`${styles.thumbnail} ${mainImage === index ? styles.active : ''}`}
                    onClick={() => setMainImage(index)}
                    aria-label={`Show image ${index + 1}`}
                    aria-pressed={mainImage === index}
                  >
                    <img src={getImagePath(image)} alt="" className={styles.thumbnailImage} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <aside className={styles.infoCard}>
            <h2 className={styles.infoTitle}>{selectedGurdwara.name}</h2>
            <dl className={styles.facts}>
              <div className={styles.fact}>
                <dt><FaMapMarkerAlt aria-hidden="true" /> Address</dt>
                <dd>{selectedGurdwara.address}</dd>
              </div>
              <div className={styles.fact}>
                <dt><FaCalendarAlt aria-hidden="true" /> Established</dt>
                <dd>{selectedGurdwara.established}</dd>
              </div>
            </dl>
            <Link to={`/gurdwara-access/locate/${selectedGurdwara.id}`} className={styles.primaryButton}>
              <FaMapMarkedAlt aria-hidden="true" /> Get directions
            </Link>
          </aside>
        </div>
      </section>

      {/* ---------- Timeline ---------- */}
      <section className={styles.section} aria-labelledby="timeline-title">
        <h2 id="timeline-title" className={styles.sectionTitle}>Historical timeline</h2>
        <p className={styles.lede}>How the Gurdwara grew, from its first days to today.</p>
        <ol className={styles.timeline}>
          {selectedGurdwara.history.map((event, index) => (
            <li key={index} className={styles.timelineItem}>
              <span className={styles.timelineDot} aria-hidden="true" />
              <div className={styles.timelineContent}>
                <p>{event}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- Notable figures ---------- */}
      <section className={styles.section} aria-labelledby="figures-title">
        <h2 id="figures-title" className={styles.sectionTitle}>Notable figures</h2>
        <ul className={styles.figuresGrid}>
          {figures.map((f) => (
            <li key={f.title} className={styles.figureCard}>
              <span className={styles.figureImage} aria-hidden="true"><FaUserAlt /></span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default GurdwaraHistory;
