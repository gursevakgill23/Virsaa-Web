import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import styles from './GurdwaraAccess.module.css';
import header_image_light from '../../images/gurdwaraAccess/header-image.jpg'; // Light mode image
import header_image_dark from '../../images/gurdwaraAccess/header-image-dark.png'; // Dark mode image
import iconRetinaUrl from '../../images/gurdwaraAccess/marker-icon-2x.png';
import iconUrl from '../../images/gurdwaraAccess/marker-icon.png';
import iconShadowUrl from '../../images/gurdwaraAccess/marker-shadow.png';
import { FaCaretRight } from 'react-icons/fa'; // Triangle icon from react-icons
import gurdwaraHistoryImage from '../../images/gurdwaraAccess/gurdwara-history.jpg'; // History section image

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetinaUrl,
  iconUrl: iconUrl,
  shadowUrl: iconShadowUrl,
});

const GurdwaraAccess = ({ isDarkMode }) => {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedService, setSelectedService] = useState(null); // Track selected service

  // Static list of Gurdwaras
  const gurdwaras = [
    {
      id: 1,
      name: 'Gurdwara Sikh Sangat Brampton',
      address: '32 Regan Rd, Brampton, ON, Canada',
      distance: '3.5 km',
      timeByBus: '25 mins',
      timeByWalk: '45 mins',
      timeByCar: '10 mins',
      coordinates: [43.7156, -79.7607], // Coordinates for Brampton
      website: 'https://www.gssbrampton.com',
      phone: '(905) 495-1200',
    },
    {
      id: 2,
      name: 'Gurudwara Nanaksar-Brampton',
      address: '64 Timberlane Dr, Brampton, ON, Canada',
      distance: '5.2 km',
      timeByBus: '30 mins',
      timeByWalk: '1 hour',
      timeByCar: '15 mins',
      coordinates: [43.7089, -79.7631], // Coordinates for Brampton
      website: 'https://www.nanaksar.com',
      phone: '(905) 452-1313',
    },
    {
      id: 3,
      name: 'Sri Guru Nanak Sikh Centre Brampton',
      address: '99 Glidden Rd, Brampton, ON, Canada',
      distance: '6.8 km',
      timeByBus: '35 mins',
      timeByWalk: '1 hour 15 mins',
      timeByCar: '20 mins',
      coordinates: [43.7023, -79.7665], // Coordinates for Brampton
      website: 'https://www.sgnsc.com',
      phone: '(905) 457-5757',
    },
  ];

  // Services list with descriptions
  const servicesList = [
    {
      id: 1,
      name: 'Langar (Free Community Kitchen)',
      description: 'Experience the warmth of community through our free langar service. Everyone is welcome to join and share a meal.',
    },
    {
      id: 2,
      name: 'Accommodation (Stay Facilities)',
      description: 'We provide comfortable accommodation facilities for visitors. Stay with us and feel at home.',
    },
    {
      id: 3,
      name: 'Religious Classes (Gurbani and Kirtan)',
      description: 'Join our religious classes to learn Gurbani and Kirtan. Enhance your spiritual journey with us.',
    },
    {
      id: 4,
      name: 'Medical Camps (Free Health Checkups)',
      description: 'Free health checkups and medical camps are organized regularly. Stay healthy with our medical services.',
    },
    {
      id: 5,
      name: 'Library (Sikh Literature and History)',
      description: 'Explore our library filled with Sikh literature and history. Learn about our rich heritage.',
    },
  ];

  const toggleDropdown = (id) => {
    setActiveDropdown(activeDropdown === id ? null : id);
  };

  const handleServiceClick = (id) => {
    setSelectedService(selectedService === id ? null : id); // Toggle selected service
  };

  return (
    <div className={styles.page} data-theme={isDarkMode ? 'dark' : 'light'}>
      {/* Header with image and text */}
      <div className={styles.header}>
        <img
          src={isDarkMode ? header_image_dark : header_image_light} // Conditionally render image
          alt="Gurdwara Header"
          className={styles.headerImage}
        />
        <div className={styles.headerText}>
          <h1>DISCOVER GURDWARAS NEAR YOU</h1>
          <p>Your Gateway to Peace and Community</p>
        </div>
      </div>

      {/* Breadcrumb Section */}
      <div className={styles.breadcrumb}>
        <Link to={'/'}><span>Home</span></Link> / 
        <Link to={'/gurdwara-access'}><span> Gurdwara Access</span></Link>
      </div>

      {/* Main content container */}
      <div className={styles.mainContainer}>
        {/* Left section (70% width) */}
        <div className={styles.leftSection}>
          {/* Search bar */}
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Enter your location"
              className={styles.input}
            />
            <button className={styles.searchButton}>Search</button>
          </div>

          {/* Random content list */}
          <div className={styles.list}>
            {gurdwaras.map((gurdwara) => (
              <div key={gurdwara.id} className={styles.listItem}>
                <div className={styles.itemHeader}>
                  <h3>{gurdwara.name}</h3>
                  <div className={styles.dropdown}>
                    <button
                      className={styles.dots}
                      onClick={() => toggleDropdown(gurdwara.id)}
                    >
                      •••
                    </button>
                    {activeDropdown === gurdwara.id && (
                      <div className={styles.dropdownContent}>
                        <button>Locate</button>
                        <button>Services</button>
                        <button>History</button>
                      </div>
                    )}
                  </div>
                </div>
                <p>{gurdwara.address}</p>
                <div className={styles.details}>
                  <p>
                    <strong>Distance:</strong> {gurdwara.distance}
                  </p>
                  <p>
                    <strong>Time by Bus:</strong> {gurdwara.timeByBus}
                  </p>
                  <p>
                    <strong>Time by Walk:</strong> {gurdwara.timeByWalk}
                  </p>
                  <p>
                    <strong>Time by Car:</strong> {gurdwara.timeByCar}
                  </p>
                </div>
                <div className={styles.contact}>
                  <a href={gurdwara.website} target="_blank" rel="noopener noreferrer">
                    Website
                  </a>
                  <span> | </span>
                  <a href={`tel:${gurdwara.phone}`}>{gurdwara.phone}</a>
                </div>
              </div>
            ))}
          </div>

          {/* Map with pinned locations */}
          <div className={styles.mapContainer}>
            <MapContainer
              center={[43.7156, -79.7607]}
              zoom={12}
              style={{ height: '400px', width: '100%' }}
              whenCreated={(map) => console.log('Map instance:', map)}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <Marker position={[43.7156, -79.7607]}>
                <Popup>
                  Gurdwara Sikh Sangat Brampton
                </Popup>
              </Marker>
            </MapContainer>
          </div>

          {/* History of Nearest Gurdwara Section */}
          <div className={styles.historySection}>
            <h2>History of Nearest Gurdwara</h2>
            <div className={styles.historyContent}>
              <img
                src={gurdwaraHistoryImage}
                alt="Gurdwara History"
                className={styles.historyImage}
              />
              <div className={styles.historyText}>
                <p>
                  The nearest Gurdwara, Gurdwara Sikh Sangat, has a rich history
                  rooted in the Sikh community of Brampton. Established in 1995, it
                  has served as a spiritual and cultural hub for thousands of
                  devotees.
                </p>
                <button className={styles.readMoreButton}>Read More</button>
              </div>
            </div>
          </div>
        </div>

        {/* Right section (30% width) */}
        <div className={styles.rightSection}>
          <h2>Services in Gurdwara</h2>
          <ul className={styles.servicesList}>
            {servicesList.map((service) => (
              <li key={service.id} onClick={() => handleServiceClick(service.id)}>
                <div className={styles.serviceItem}>
                  <FaCaretRight
                    className={`${styles.triangleIcon} ${
                      selectedService === service.id ? styles.rotateIcon : ''
                    }`}
                  />
                  <span>{service.name}</span>
                </div>
                {selectedService === service.id && (
                  <div className={styles.serviceDescription}>
                    <p>{service.description}</p>
                    <button className={styles.availButton}>Avail Service</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GurdwaraAccess;