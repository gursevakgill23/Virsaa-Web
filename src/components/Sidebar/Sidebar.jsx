import React, { useState, useEffect, useRef,useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaTimes, FaHome, FaBook, FaHistory, FaGraduationCap, FaNewspaper, FaRegFileAudio, FaUsers } from 'react-icons/fa';
import { FaHandsPraying, FaHouseFlag } from "react-icons/fa6";
import { MdChevronRight } from 'react-icons/md';
import styles from './Sidebar.module.css';
import { BsCollectionFill } from "react-icons/bs";
import { IoIosPeople } from "react-icons/io";
import sidebar_header from '../../images/sidebar-header.png';

const Sidebar = ({ open, closeSidebar }) => {
  const [activeMenu, setActiveMenu] = useState(null);
  const sidebarRef = useRef(null);
  const location = useLocation();

    // Memoize mainTabs to prevent unnecessary recreations
    const mainTabs = useMemo(() => [
      { id: 'home', icon: <FaHome />, label: 'Home', path: '/home' },
      { 
        id: 'collections', 
        icon: <BsCollectionFill />, 
        label: 'Collections',
        subItems: [
          { id: 'ebooks', icon: <FaBook />, label: 'Ebooks', path: '/collections/ebooks' },
          { id: 'audiobooks', icon: <FaRegFileAudio />, label: 'Audiobooks', path: '/collections/audiobooks' },
          { id: 'authors', icon: <IoIosPeople />, label: 'Authors', path: '/collections/authors' }
        ]
      },
      { 
        id: 'sikhism', 
        icon: <FaHistory />, 
        label: 'Sikhism',
        subItems: [
          { id: 'history', icon: <FaHistory />, label: 'History', path: '/sikh-history' },
          { id: 'gurbani', icon: <FaHandsPraying />, label: 'Gurbani', path: '/gurbani' },
          { id: 'gurdwara-access', icon: <FaHouseFlag />, label: 'Gurdwara Access', path: '/gurdwara-access' }
        ]
      },
      { id: 'learning', icon: <FaGraduationCap />, label: 'Learning', path: '/learning' },
      { id: 'news', icon: <FaNewspaper />, label: 'News', path: '/news' },
      { id: 'about', icon: <FaUsers />, label: 'About', path: '/about' }
    ], []);
   // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (open) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }

    // Cleanup function
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [open]);

  // Track active menu based on current route
  useEffect(() => {
    const currentTab = mainTabs.find(tab => 
      tab.path === location.pathname || 
      (tab.subItems && tab.subItems.some(sub => sub.path === location.pathname))
    );
    
    if (currentTab?.subItems) {
      setActiveMenu(currentTab.id);
    } else {
      setActiveMenu(null);
    }
  }, [location.pathname, mainTabs]);

  const handleMainTabClick = (tab) => {
    if (!tab.subItems) {
      closeSidebar();
    }
    setActiveMenu(tab.subItems ? tab.id : null);
  };

  const handleBackClick = () => {
    setActiveMenu(null);
  };

  return (
    <>
      <div className={`${styles.sidebar} ${open ? styles.open : ''}`} ref={sidebarRef}>
        <button className={styles.closeButton} onClick={() => {
          closeSidebar();
          setActiveMenu(null);
        }}>
          <FaTimes />
        </button>
        
        <div className={styles.sidebarContent}>
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
      </div>

      <div className={styles.tabNavigation}>
        {!activeMenu ? (
          mainTabs.map((tab) => (
            tab.path ? (
              <Link
                key={tab.id}
                to={tab.path}
                className={styles.tabItem}
                onClick={() => handleMainTabClick(tab)}
              >
                <div className={styles.tabIcon}>{tab.icon}</div>
                <div className={styles.tabLabel}>{tab.label}</div>
              </Link>
            ) : (
              <div
                key={tab.id}
                className={styles.tabItem}
                onClick={() => handleMainTabClick(tab)}
              >
                <div className={styles.tabIcon}>{tab.icon}</div>
                <div className={styles.tabLabel}>{tab.label}</div>
              </div>
            )
          ))
        ) : (
          <>
            <div className={styles.tabItem} onClick={handleBackClick}>
              <div className={styles.tabIcon}><MdChevronRight style={{ transform: 'rotate(180deg)' }} /></div>
              <div className={styles.tabLabel}>Back</div>
            </div>
            
            {mainTabs.find(tab => tab.id === activeMenu)?.subItems?.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                className={styles.tabItem}
                onClick={closeSidebar}
              >
                <div className={styles.tabIcon}>{item.icon}</div>
                <div className={styles.tabLabel}>{item.label}</div>
              </Link>
            ))}
          </>
        )}
      </div>
    </>
  );
};

export default Sidebar;