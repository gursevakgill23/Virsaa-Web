import React from 'react';
import { useParams, Link } from 'react-router-dom';
import styles from './GurdwaraServices.module.css';
import { FaUtensils, FaBed, FaBook, FaClinicMedical, FaMusic } from 'react-icons/fa';

// Utility function to handle production image paths
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

const GurdwaraServices = ({ isDarkMode }) => {
  const getImagePath = useProductionImagePath();
  const { id } = useParams();
  
  // Image paths - now using public folder
  const header_image_light = "/images/header-image.jpg";
  const header_image_dark = "/images/header-image-dark.png";

  // Mock data - in a real app, you would fetch this based on the id
  const gurdwaras = [
    {
      id: 1,
      name: 'Gurdwara Sikh Sangat Brampton',
      address: '32 Regan Rd, Brampton, ON, Canada',
    },
    {
      id: 2,
      name: 'Gurudwara Nanaksar-Brampton',
      address: '64 Timberlane Dr, Brampton, ON, Canada',
    },
    {
      id: 3,
      name: 'Sri Guru Nanak Sikh Centre Brampton',
      address: '99 Glidden Rd, Brampton, ON, Canada',
    },
  ];
  
  const selectedGurdwara = gurdwaras.find(g => g.id === parseInt(id)) || gurdwaras[0];
  
  // Services data
  const services = [
    {
      id: 1,
      name: 'Langar (Free Community Kitchen)',
      description: 'Experience the warmth of community through our free langar service. Everyone is welcome to join and share a meal regardless of background, religion, or social status. The langar is served daily from 7:00 AM to 9:00 PM.',
      icon: <FaUtensils size={40} />,
      timing: 'Daily: 7:00 AM - 9:00 PM',
      capacity: 'Serves 500+ people daily'
    },
    {
      id: 2,
      name: 'Accommodation (Stay Facilities)',
      description: 'We provide comfortable accommodation facilities for visitors with separate dormitories for men and women. The rooms are clean, well-maintained and available for short-term stays (up to 3 nights).',
      icon: <FaBed size={40} />,
      timing: 'Check-in: 2:00 PM, Check-out: 11:00 AM',
      capacity: '20 rooms available'
    },
    {
      id: 3,
      name: 'Religious Classes',
      description: 'Join our religious classes to learn Gurbani, Kirtan, and Sikh history. We offer classes for all age groups with experienced teachers. Children\'s classes are held on weekends while adult classes are available on weekday evenings.',
      icon: <FaMusic size={40} />,
      timing: 'Children: Sat-Sun 10AM-12PM, Adults: Mon-Fri 7PM-9PM',
      capacity: '50 students per session'
    },
    {
      id: 4,
      name: 'Medical Camps',
      description: 'Free health checkups and medical camps are organized monthly with volunteer doctors providing general checkups, blood pressure monitoring, and basic consultations. Specialized camps (eye checkups, diabetes screening) are held quarterly.',
      icon: <FaClinicMedical size={40} />,
      timing: 'Monthly: First Sunday 10AM-4PM',
      capacity: '100 patients per camp'
    },
    {
      id: 5,
      name: 'Library & Resource Center',
      description: 'Our library contains an extensive collection of Sikh literature, history books, and religious texts in multiple languages. Members can borrow books for 2 weeks at a time. We also have a digital archive with rare manuscripts.',
      icon: <FaBook size={40} />,
      timing: 'Tue-Sun: 9:00 AM - 7:00 PM',
      capacity: '1000+ books available'
    }
  ];

  return (
    <div className={styles.page} data-theme={isDarkMode ? 'dark' : 'light'}>
      {/* Header with image and text */}
      <div className={styles.header}>
        <img
          src={getImagePath(isDarkMode ? header_image_dark : header_image_light)}
          alt="Gurdwara Services"
          className={styles.headerImage}
        />
        <div className={styles.headerText}>
          <h1>SERVICES AT {selectedGurdwara.name.toUpperCase()}</h1>
          <p>Explore the spiritual and community services we offer</p>
        </div>
      </div>

      {/* Breadcrumb Section */}
      <div className={styles.breadcrumb}>
        <Link to={'/'}><span>Home</span></Link> / 
        <Link to={'/gurdwara-access'}><span> Gurdwara Access</span></Link> / 
        <span> Services at {selectedGurdwara.name}</span>
      </div>

      <div className={styles.mainContainer}>
        <div className={styles.gurdwaraInfo}>
          <h2>{selectedGurdwara.name}</h2>
          <p>{selectedGurdwara.address}</p>
        </div>

        <div className={styles.servicesGrid}>
          {services.map(service => (
            <div key={service.id} className={styles.serviceCard}>
              <div className={styles.serviceIcon}>
                {service.icon}
              </div>
              <div className={styles.serviceContent}>
                <h3>{service.name}</h3>
                <p className={styles.serviceDescription}>{service.description}</p>
                <div className={styles.serviceDetails}>
                  <p><strong>Timing:</strong> {service.timing}</p>
                  <p><strong>Capacity:</strong> {service.capacity}</p>
                </div>
                <button className={styles.contactButton}>Contact for More Info</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GurdwaraServices;