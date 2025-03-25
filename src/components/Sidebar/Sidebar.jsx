import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom'; // Import Link
import styles from './Sidebar.module.css';
import sidebar_header from '../../images/sidebar-header.jpg';

const Sidebar = ({ open, closeSidebar }) => {
  // State to manage dropdown visibility
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(false);

  // Reference to the sidebar to detect outside clicks
  const sidebarRef = useRef(null);

  // Toggle dropdown visibility
  const toggleCollections = () => {
    setIsCollectionsOpen(!isCollectionsOpen);
  };

  // Close sidebar and dropdown when a link is clicked
  const handleLinkClick = () => {
    closeSidebar();
    setIsCollectionsOpen(false); // Close the dropdown
  };

  // Close the sidebar if clicked outside
  useEffect(() => {
    // Function to handle click outside of the sidebar
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        // Check if the click is below 50px from the top
        if (event.clientY > 50) {
          closeSidebar();
          setIsCollectionsOpen(false); // Close the dropdown
        }
      }
    };
  
    // Add event listener to the document
    document.addEventListener('mousedown', handleClickOutside);
  
    // Cleanup event listener on component unmount
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [closeSidebar]);
  return (
    <div className={`${styles.sidebar} ${open ? styles.open : ''}`} ref={sidebarRef}>
      <div className={styles.sidebarContent}>
        {/* For screens larger than 992px: Show Image, Did You Know, and Today's Event */}
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

        {/* For screens less than 992px: Show Nav Links */}
        <div className={styles.sidebarSmall}>
          <Link to="/home" onClick={handleLinkClick}>Home</Link> {/* Use Link instead of <a> */}
          <div className={styles.dropdown}>
            <button onClick={toggleCollections} className={styles.dropdownButton}>
              Collections
              <span className={`${styles.arrow} ${isCollectionsOpen ? styles.open : ''}`}></span>
            </button>
            {isCollectionsOpen && (
              <div className={styles.dropdownContent}>
                <Link to="/collections/ebooks" onClick={handleLinkClick}>Ebooks</Link> {/* Use Link instead of <a> */}
                <Link to="/collections/audiobooks" onClick={handleLinkClick}>Audiobooks</Link> {/* Use Link instead of <a> */}
                <Link to="/collections/authors" onClick={handleLinkClick}>Authors</Link> {/* Use Link instead of <a> */}
              </div>
            )}
          </div>
          <Link to="/sikh-history" onClick={handleLinkClick}>Sikh History</Link> {/* Use Link instead of <a> */}
          <Link to="/gurbani" onClick={handleLinkClick}>Gurbani</Link> {/* Use Link instead of <a> */}
          <Link to="/learning" onClick={handleLinkClick}>Learning</Link> {/* Use Link instead of <a> */}
          <Link to="/news" onClick={handleLinkClick}>News</Link> {/* Use Link instead of <a> */}
          <Link to="/about" onClick={handleLinkClick}>About</Link> {/* Use Link instead of <a> */}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
