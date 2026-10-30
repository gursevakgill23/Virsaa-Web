/**
 * pages/GurdwaraAccess/GurdwaraServices/GurdwaraServices.jsx
 * -----------------------------------------------------------------------------
 * Services at one Gurdwara (/gurdwara-access/services/:id), any Gurdwara in
 * the world, opened from the Gurdwara finder (hooks/useGurdwara gets it from
 * the finder or Google Maps).
 *
 * What most Gurdwaras offer (langar, the prayer hall, rooms, classes, health
 * camps, the library), with a tip for each, and how to reach this Gurdwara:
 * its phone, website and opening hours when Google Maps has them (credited,
 * as Google asks), and directions. Services and times differ from one Gurdwara to another, so the
 * page says so and points to the Gurdwara itself rather than inventing them.
 * -----------------------------------------------------------------------------
 */
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FaUtensils, FaBed, FaBook, FaClinicMedical, FaMusic, FaPhoneAlt, FaGlobe, FaMapMarkedAlt, FaClock, FaRedo,
} from 'react-icons/fa';
import { FaHandsPraying } from 'react-icons/fa6';
import useGurdwara from '../../../hooks/useGurdwara';
import { safeExternalUrl } from '../../../utils/safeUrl';
import { gurdwaraLink, placeLabel } from '../gurdwaras';
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

// What most Gurdwaras offer, with a tip for visitors
const SERVICES = [
  {
    id: 'langar',
    name: 'Langar (Free Community Kitchen)',
    description: 'Every Gurdwara serves langar: a free vegetarian meal, cooked and served by volunteers, for everyone who comes, whatever their background or faith. People sit together, side by side.',
    tip: 'Usually served after the morning and evening programmes, and all day at larger Gurdwaras.',
    icon: <FaUtensils size={40} />,
  },
  {
    id: 'darbar',
    name: 'Darbar Sahib (Prayer Hall)',
    description: 'The main hall, where Sri Guru Granth Sahib Ji is kept. Kirtan, Ardas and the day’s Hukamnama take place here, and anyone may sit and listen.',
    tip: 'Cover your head, take off your shoes and wash your hands before you go in.',
    icon: <FaHandsPraying size={40} />,
  },
  {
    id: 'stay',
    name: 'Accommodation (Stay Facilities)',
    description: 'Many larger and historic Gurdwaras have a sarai, rooms where visitors and pilgrims can stay, often free or for a donation.',
    tip: 'Ask the Gurdwara office before you plan to stay.',
    icon: <FaBed size={40} />,
  },
  {
    id: 'classes',
    name: 'Religious Classes',
    description: 'Classes in Gurmukhi, Gurbani, kirtan and Sikh history, and at some Gurdwaras gatka, often for children at weekends.',
    tip: 'Class times change from term to term.',
    icon: <FaMusic size={40} />,
  },
  {
    id: 'health',
    name: 'Medical Camps',
    description: 'Some Gurdwaras hold free health check-ups, blood drives and awareness camps with volunteer doctors.',
    tip: 'Camps are usually announced on the Gurdwara’s website or notice board.',
    icon: <FaClinicMedical size={40} />,
  },
  {
    id: 'library',
    name: 'Library & Resource Center',
    description: 'Many have a library of Sikh literature and history, and a shop for gutkas, books and the five Ks.',
    tip: 'Some lend books to the sangat; ask at the library.',
    icon: <FaBook size={40} />,
  },
];

const GurdwaraServices = ({ isDarkMode }) => {
  const getImagePath = useProductionImagePath();
  const { id } = useParams();
  const place = useGurdwara(id, { contact: true });
  const gurdwara = place.gurdwara;

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

  const name = gurdwara?.name || 'the Gurdwara';
  const website = safeExternalUrl(gurdwara?.website);
  const phone = gurdwara?.phone || '';
  const where = placeLabel(gurdwara);
  const googleUrl = safeExternalUrl(gurdwara?.google_url);

  // How to ask about a service: call, the website, or go there
  const contactFor = (service) => {
    if (phone) {
      return <a className={styles.contactButton} href={`tel:${phone.replace(/[^\d+]/g, '')}`}><FaPhoneAlt aria-hidden="true" /> Call to ask</a>;
    }
    if (website) {
      return <a className={styles.contactButton} href={website} target="_blank" rel="noopener noreferrer"><FaGlobe aria-hidden="true" /> Ask on its website</a>;
    }
    return gurdwara ? (
      <Link className={styles.contactButton} to={gurdwaraLink('locate', gurdwara, place.origin)} aria-label={`Directions to ask about ${service.name}`}>
        <FaMapMarkedAlt aria-hidden="true" /> Visit to ask
      </Link>
    ) : null;
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
          <h1>SERVICES AT {name.toUpperCase()}</h1>
          <p>What you’ll usually find, and how to ask</p>
        </div>
      </div>

      {/* Breadcrumb */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link to="/"><span>Home</span></Link> /
        <Link to="/gurdwara-access"><span> Gurdwara Access</span></Link> /
        <span aria-current="page"> Services at {name}</span>
      </nav>

      <div className={styles.mainContainer}>
        {/* Which Gurdwara, and how to reach it */}
        <div className={styles.gurdwaraInfo}>
          {place.status === 'loading' && <p role="status">Loading the Gurdwara…</p>}
          {place.status === 'missing' && (
            <>
              <h2>Gurdwara not found</h2>
              <p>The link may be out of date. <Link to="/gurdwara-access">Find a Gurdwara</Link></p>
            </>
          )}
          {place.status === 'error' && (
            <>
              <p role="alert">{place.error}</p>
              <button type="button" className={styles.contactButton} onClick={place.retry}>
                <FaRedo aria-hidden="true" /> Try again
              </button>
            </>
          )}
          {gurdwara && (
            <>
              <h2>{gurdwara.name}</h2>
              {where && <p>{where}</p>}
              {gurdwara.opening_hours && <p><FaClock aria-hidden="true" /> Open: {gurdwara.opening_hours}</p>}
              {!gurdwara.opening_hours && Array.isArray(gurdwara.hours_week) && gurdwara.hours_week.length > 0 && (
                <p><FaClock aria-hidden="true" /> Opening hours differ by day; {googleUrl ? <a href={googleUrl} target="_blank" rel="noopener noreferrer">see them on Google Maps</a> : 'check before you go'}.</p>
              )}
              <p className={styles.infoNote}>
                Services and times differ from one Gurdwara to another, so check with {gurdwara.name} before you go.
              </p>
              <div className={styles.infoActions}>
                {phone && <a href={`tel:${phone.replace(/[^\d+]/g, '')}`}><FaPhoneAlt aria-hidden="true" /> {phone}</a>}
                {website && <a href={website} target="_blank" rel="noopener noreferrer"><FaGlobe aria-hidden="true" /> Website</a>}
                <Link to={gurdwaraLink('locate', gurdwara, place.origin)}><FaMapMarkedAlt aria-hidden="true" /> Directions</Link>
              </div>
              <p className={styles.credit}>
                Details from {googleUrl
                  ? <a href={googleUrl} target="_blank" rel="noopener noreferrer">Google Maps</a>
                  : 'Google Maps'}.
              </p>
            </>
          )}
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
                  <p><strong>Good to know:</strong> {service.tip}</p>
                </div>
                {contactFor(service)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GurdwaraServices;
