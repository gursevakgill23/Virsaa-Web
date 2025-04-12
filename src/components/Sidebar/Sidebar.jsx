import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';
import styles from './Sidebar.module.css';
import sidebar_header from '../../images/sidebar-header.jpg';

const Sidebar = ({ open, closeSidebar }) => {
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(false);
  const sidebarRef = useRef(null);

  const toggleCollections = () => {
    setIsCollectionsOpen(!isCollectionsOpen);
  };

  const handleLinkClick = () => {
    closeSidebar();
    setIsCollectionsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        if (event.clientY > 50) {
          closeSidebar();
          setIsCollectionsOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [closeSidebar]);

  return (
    <div className={`${styles.sidebar} ${open ? styles.open : ''} ${styles.mobileSidebar}`} ref={sidebarRef}>
      {/* Close Button (X) - Only visible on mobile */}
      <button className={styles.closeButton} onClick={closeSidebar}>
        <FaTimes />
      </button>
      
      <div className={styles.sidebarContent}>
        {/* Desktop Content */}
        <div className={styles.sidebarLarge}>
          <img src={sidebar_header} alt="Sidebar" className={styles.sidebarImage} />
          <h3>Did You Know?</h3>
          <p>Fun facts about Punjabi culture and Sikhism:</p>
          <ul>
            <li><strong>Punjab</strong> is known as the "Land of Five Rivers" (Jhelum, Chenab, Ravi, Beas, and Sutlej) and is one of the most fertile regions in the world.</li>
          </ul>

          <h3>Today's Event</h3>
          <p><strong>Vaisakhi</strong> - Celebrated on <strong>April 13th or 14th</strong> every year.</p>
          <ul>
            <li>Vaisakhi marks the Punjabi New Year and the harvest festival, celebrating the abundance of crops.</li>
            <li>It is also a significant religious day for Sikhs, as it commemorates the formation of the Khalsa Panth by Guru Gobind Singh Ji in 1699.</li>
            <li>On this day, Sikhs visit Gurdwaras, participate in Nagar Kirtan (processions), and engage in community service.</li>
          </ul>
        </div>

        {/* Mobile Navigation */}
        <div className={styles.sidebarSmall}>
          <Link to="/home" onClick={handleLinkClick} className={styles.navLink}>Home</Link>
          
          <div className={styles.dropdown}>
            <button onClick={toggleCollections} className={styles.dropdownButton}>
              <span className={styles.buttonText}>Collections</span>
              <span className={`${styles.arrow} ${isCollectionsOpen ? styles.open : ''}`}></span>
            </button>
            {isCollectionsOpen && (
              <div className={styles.dropdownContent}>
                <Link to="/collections/ebooks" onClick={handleLinkClick} className={styles.navLink}>Ebooks</Link>
                <Link to="/collections/audiobooks" onClick={handleLinkClick} className={styles.navLink}>Audiobooks</Link>
                <Link to="/collections/authors" onClick={handleLinkClick} className={styles.navLink}>Authors</Link>
              </div>
            )}
          </div>
          
          <Link to="/sikh-history" onClick={handleLinkClick} className={styles.navLink}>Sikh History</Link>
          <Link to="/gurbani" onClick={handleLinkClick} className={styles.navLink}>Gurbani</Link>
          <Link to="/learning" onClick={handleLinkClick} className={styles.navLink}>Learning</Link>
          <Link to="/news" onClick={handleLinkClick} className={styles.navLink}>News</Link>
          <Link to="/about" onClick={handleLinkClick} className={styles.navLink}>About</Link>        </div>
      </div>
    </div>
  );
};

export default Sidebar;