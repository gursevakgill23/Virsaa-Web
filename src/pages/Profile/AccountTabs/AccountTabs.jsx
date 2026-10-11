import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaUser, FaHeart, FaHistory, FaBell, FaUserCog } from 'react-icons/fa';
import useUnreadNotifications from '../../../hooks/useUnreadNotifications';
import styles from './AccountTabs.module.css';

// Same five pages as the navbar account panel, so people can move between them
const TABS = [
  { to: '/my-profile', label: 'Profile', icon: <FaUser /> },
  { to: '/my-favorites', label: 'Favorites', icon: <FaHeart /> },
  { to: '/history', label: 'History', icon: <FaHistory /> },
  { to: '/notifications', label: 'Notifications', icon: <FaBell /> },
  { to: '/account-settings', label: 'Settings', icon: <FaUserCog /> },
];

/** Glass tab bar that sits inside the PageHero on every account page. */
const AccountTabs = ({ badge = {} }) => {
  const { pathname } = useLocation();
  const unread = useUnreadNotifications();
  const counts = { '/notifications': unread, ...badge };

  return (
    <nav className={styles.tabs} aria-label="Account sections">
      {TABS.map((tab) => {
        const active = pathname === tab.to;
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={`${styles.tab} ${active ? styles.tabActive : ''}`}
            aria-current={active ? "page" : undefined}
            aria-label={tab.label}
          >
            <span aria-hidden="true">{tab.icon}</span>
            <span>{tab.label}</span>
            {counts[tab.to] > 0 && <span className={styles.badge}>{counts[tab.to] > 99 ? '99+' : counts[tab.to]}</span>}
          </Link>
        );
      })}
    </nav>
  );
};

export default AccountTabs;
