/**
 * pages/GurdwaraAccess/GurdwaraServices/GurdwaraServices.jsx
 * -----------------------------------------------------------------------------
 * Services at one Gurdwara (/gurdwara-access/services/:id): langar,
 * accommodation, classes, medical camps and the library, each with timings
 * and capacity. Opened from the Gurdwara finder.
 * Uses sample data for now; an unknown id shows the first Gurdwara.
 * -----------------------------------------------------------------------------
 */
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaUtensils, FaBed, FaBook, FaClinicMedical, FaMusic } from 'react-icons/fa';
import { toast } from '../../../utils/notify';
import styles from './GurdwaraServices.module.css';

// Converts image paths for the production build (same helper used across pages)
const useProductionImagePath = () => {
  return (imagePath) => {
    // Only modify in production
    if (process.env.NODE_ENV === 'production') {
      // Handle both imported images and public folder images
      if (typeof imagePath === 'string') {
        // For public folder images
        return (imagePath.startsWith('/') || /^(https?:|blob:|data:)/i.test(imagePath))
          ? imagePath
          : `/${imagePath.replace(/.*static\/media/, 'static/media')}`;
      }
      // For imported images
      return imagePath.default || imagePath;
    }
    return imagePath;
  };
};

// Header pictures (public/images). The light one is a .png like on every other page.
const HEADER_LIGHT = '/images/header-image.png';
const HEADER_DARK = '/images/header-image-dark.png';

// Sample Gurdwaras; will come from the API by id later
const GURDWARAS = [
  { id: 1, name: 'Gurdwara Sikh Sangat Brampton', address: '32 Regan Rd, Brampton, ON, Canada' },
  { id: 2, name: 'Gurudwara Nanaksar-Brampton', address: '64 Timberlane Dr, Brampton, ON, Canada' },
  { id: 3, name: 'Sri Guru Nanak Sikh Centre Brampton', address: '99 Glidden Rd, Brampton, ON, Canada' },
];

// Services offered, with timings and capacity
const SERVICES = [
  {
    id: 1,
    name: 'Langar (Free Community Kitchen)',
    description: 'Experience the warmth of community through our free langar service. Everyone is welcome to join and share a meal regardless of background, religion, or social status. The langar is served daily from 7:00 AM to 9:00 PM.',
    icon: <FaUtensils size={40} />,
    timing: 'Daily: 7:00 AM - 9:00 PM',
    capacity: 'Serves 500+ people daily',
  },
  {
    id: 2,
    name: 'Accommodation (Stay Facilities)',
    description: 'We provide comfortable accommodation facilities for visitors with separate dormitories for men and women. The rooms are clean, well-maintained and available for short-term stays (up to 3 nights).',
    icon: <FaBed size={40} />,
    timing: 'Check-in: 2:00 PM, Check-out: 11:00 AM',
    capacity: '20 rooms available',
  },
  {
    id: 3,
    name: 'Religious Classes',
    description: 'Join our religious classes to learn Gurbani, Kirtan, and Sikh history. We offer classes for all age groups with experienced teachers. Children\'s classes are held on weekends while adult classes are available on weekday evenings.',
    icon: <FaMusic size={40} />,
    timing: 'Children: Sat-Sun 10AM-12PM, Adults: Mon-Fri 7PM-9PM',
    capacity: '50 students per session',
  },
  {
    id: 4,
    name: 'Medical Camps',
    description: 'Free health checkups and medical camps are organized monthly with volunteer doctors providing general checkups, blood pressure monitoring, and basic consultations. Specialized camps (eye checkups, diabetes screening) are held quarterly.',
    icon: <FaClinicMedical size={40} />,
    timing: 'Monthly: First Sunday 10AM-4PM',
    capacity: '100 patients per camp',
  },
  {
    id: 5,
    name: 'Library & Resource Center',
    description: 'Our library contains an extensive collection of Sikh literature, history books, and religious texts in multiple languages. Members can borrow books for 2 weeks at a time. We also have a digital archive with rare manuscripts.',
    icon: <FaBook size={40} />,
    timing: 'Tue-Sun: 9:00 AM - 7:00 PM',
    capacity: '1000+ books available',
  },
];

const GurdwaraServices = ({ isDarkMode }) => {
  const getImagePath = useProductionImagePath();
  const { id } = useParams();

  // The Gurdwara for this URL (the first one if the id is unknown)
  const selectedGurdwara = GURDWARAS.find((g) => g.id === parseInt(id, 10)) || GURDWARAS[0];

  // If the header picture fails, try the light one once, then hide it
  const handleHeaderError = (e) => {
    const img = e.currentTarget;
    if (img.dataset.fallback) {
      img.style.visibility = 'hidden';
      return;
    }
    img.dataset.fallback = '1';
    img.src = getImagePath(HEADER_LIGHT);
  };

  // Contact details aren't stored yet, so point people to the Gurdwara itself
  const handleContact = (service) => {
    toast.info(`For ${service.name.split(' (')[0].toLowerCase()} details, contact ${selectedGurdwara.name} at ${selectedGurdwara.address}.`);
  };

  return (
    <div className={styles.page} data-theme={isDarkMode ? 'dark' : 'light'}>
      {/* Header with image and text */}
      <div className={styles.header}>
        <img
          src={getImagePath(isDarkMode ? HEADER_DARK : HEADER_LIGHT)}
          alt="Gurdwara Services"
          className={styles.headerImage}
          onError={handleHeaderError}
        />
        <div className={styles.headerText}>
          <h1>SERVICES AT {selectedGurdwara.name.toUpperCase()}</h1>
          <p>Explore the spiritual and community services we offer</p>
        </div>
      </div>

      {/* Breadcrumb */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link to="/"><span>Home</span></Link> /
        <Link to="/gurdwara-access"><span> Gurdwara Access</span></Link> /
        <span aria-current="page"> Services at {selectedGurdwara.name}</span>
      </nav>

      <div className={styles.mainContainer}>
        {/* Which Gurdwara */}
        <div className={styles.gurdwaraInfo}>
          <h2>{selectedGurdwara.name}</h2>
          <p>{selectedGurdwara.address}</p>
        </div>

        {/* One card per service */}
        <div className={styles.servicesGrid}>
          {SERVICES.map((service) => (
            <div key={service.id} className={styles.serviceCard}>
              <div className={styles.serviceIcon} aria-hidden="true">
                {service.icon}
              </div>
              <div className={styles.serviceContent}>
                <h3>{service.name}</h3>
                <p className={styles.serviceDescription}>{service.description}</p>
                <div className={styles.serviceDetails}>
                  <p><strong>Timing:</strong> {service.timing}</p>
                  <p><strong>Capacity:</strong> {service.capacity}</p>
                </div>
                <button type="button" className={styles.contactButton} onClick={() => handleContact(service)}>
                  Contact for More Info
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GurdwaraServices;
