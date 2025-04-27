import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './Notifications.module.css';
import { FaTrash, FaEnvelopeOpen, FaBell } from 'react-icons/fa';

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
const Notifications = ({ isDarkMode }) => {
  const getImagePath = useProductionImagePath();
  const header_image_light = '../../../images/Gurbani/header-image.png';
  const header_image_dark = '../../../images/Gurbani/header-image-dark.png';

  const [userData] = useState({
    username: 'Jaspreet Singh',
    image: 'https://randomuser.me/api/portraits/men/32.jpg',
    bio: 'Spiritual seeker and Gurbani enthusiast',
    membership: 'Gold Member'
  });

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      time: '6:30PM',
      icon: 'message',
      title: 'New message from Virsaa Web',
      description: 'You have a new message regarding your recent activity on Virsaa Web. Check it out now!',
      url: 'localhost:3000',
      read: false,
      date: 'TODAY - SATURDAY, April 26, 2025'
    },
    {
      id: 2,
      time: '6:27PM',
      icon: 'update',
      title: 'YouTube Update',
      description: 'Mann Mast Malang Episode 29 Teaser is now available! Watch it on YouTube.',
      url: 'youtube.com',
      read: false,
      date: 'TODAY - SATURDAY, April 26, 2025'
    },
    {
      id: 3,
      time: '5:50PM',
      icon: 'alert',
      title: 'Stocksify Alert',
      description: 'Farmers will get ₹ 2000 today under Kisan Samman Nidhi Yojana. Read more on Stocksify.',
      url: 'stocksify.com',
      read: true,
      date: 'YESTERDAY - FRIDAY, April 25, 2025'
    },
    {
      id: 4,
      time: '5:45PM',
      icon: 'update',
      title: 'Google Update',
      description: 'New meditation techniques have been added to your search results. Explore them on Google.',
      url: 'google.com',
      read: false,
      date: 'YESTERDAY - FRIDAY, April 25, 2025'
    },
    {
      id: 5,
      time: '10:42AM',
      icon: 'message',
      title: 'Google Notification',
      description: 'Your search for "credit card hacks" has new results. Check them out on Google.',
      url: 'google.com',
      read: false,
      date: 'THURSDAY, April 24, 2025'
    },
    {
      id: 6,
      time: '10:40AM',
      icon: 'alert',
      title: 'NewsMagics Alert',
      description: 'New article on money, expense, and market dividends is available. Read more on NewsMagics.',
      url: 'newsmagics.com',
      read: true,
      date: 'THURSDAY, April 24, 2025'
    },
    {
      id: 7,
      time: '10:38AM',
      icon: 'update',
      title: 'WatchApe Update',
      description: 'A new feature has been added to WatchApe. Check it out now!',
      url: 'watchape.biz',
      read: false,
      date: 'THURSDAY, April 24, 2025'
    },
    {
      id: 8,
      time: '10:24AM',
      icon: 'message',
      title: 'Virsaa Web Reminder',
      description: 'Don’t forget to check your recent activity on Virsaa Web. You have pending actions!',
      url: 'localhost:3000',
      read: false,
      date: 'WEDNESDAY, April 23, 2025'
    },
    {
      id: 9,
      time: '10:23AM',
      icon: 'alert',
      title: 'Stocksify News',
      description: 'A new financial update is available on Stocksify. Read about the latest market trends.',
      url: 'stocksify.com',
      read: true,
      date: 'WEDNESDAY, April 23, 2025'
    },
    {
      id: 10,
      time: '10:20AM',
      icon: 'update',
      title: 'CashPrice Update',
      description: 'New insights on financial flexibility during economic downturns are available on CashPrice.',
      url: 'cashprice.com',
      read: false,
      date: 'WEDNESDAY, April 23, 2025'
    },
    {
      id: 11,
      time: '9:15AM',
      icon: 'message',
      title: 'DeepSeek Notification',
      description: 'Your query "Into the Unknown" has new responses on DeepSeek. Check them out!',
      url: 'chat.deepseek.com',
      read: false,
      date: 'TUESDAY, April 22, 2025'
    },
    {
      id: 12,
      time: '8:30AM',
      icon: 'alert',
      title: 'Grok Alert',
      description: 'Grok has a new update for you. Visit grok.com to learn more!',
      url: 'grok.com',
      read: true,
      date: 'TUESDAY, April 22, 2025'
    }
  ]);

  const markAsRead = (id) => {
    setNotifications(notifications.map(notif =>
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter(notif => notif.id !== id));
  };

  return (
    <div className={styles.container}>
      {/* Header - Matches Gurbani page */}
      <div className={styles.header}>
        <img
          src={getImagePath(isDarkMode ? header_image_dark : header_image_light)}
          alt="Notifications Header"
          className={styles.headerImage}
        />
        <div className={styles.headerText}>
          <h1>NOTIFICATIONS</h1>
          <p>Stay updated with your latest alerts</p>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* User Profile Section */}
        <div className={styles.profileSection}>
          <img src={getImagePath(userData.image)} alt="User" className={styles.profileImage} />
          <h2 className={styles.username}>{userData.username}</h2>
          <span className={styles.membership}>{userData.membership}</span>
          <p className={styles.bio}>{userData.bio}</p>
        </div>

        {/* Notifications Section */}
        <div className={styles.notificationsSection}>
          {/* Breadcrumb - Matches standard */}
          <div className={styles.breadcrumb}>
            <Link to="/"><span>Home</span></Link> / 
            <Link to="/account"><span> My Account</span></Link> / 
            <span>Notifications</span>
          </div>

          {/* Notifications List */}
          <div className={styles.notificationsList}>
            {notifications.length === 0 ? (
              <div className={styles.emptyState}>
                <FaBell className={styles.emptyIcon} />
                <p>No notifications yet.</p>
              </div>
            ) : (
              notifications.reduce((acc, notif, index) => {
                const showDateHeader = index === 0 || notif.date !== notifications[index - 1].date;
                return [
                  ...acc,
                  showDateHeader && (
                    <h3 key={`date-${notif.date}`} className={styles.dateHeader}>
                      {notif.date}
                    </h3>
                  ),
                  <div
                    key={notif.id}
                    className={`${styles.notificationItem} ${notif.read ? styles.read : ''}`}
                  >
                    <div className={styles.notificationHeader}>
                      <span className={styles.time}>{notif.time}</span>
                      <div className={`${styles.icon} ${styles[notif.icon]}`}></div>
                      <div className={styles.notificationDetails}>
                        <a href={`https://${notif.url}`} target="_blank" rel="noopener noreferrer">
                          {notif.title}
                        </a>
                        <p className={styles.description}>{notif.description}</p>
                        <span className={styles.url}>{notif.url}</span>
                      </div>
                    </div>
                    <div className={styles.actions}>
                      {!notif.read && (
                        <button
                          className={styles.actionButton}
                          onClick={() => markAsRead(notif.id)}
                          title="Mark as read"
                        >
                          <FaEnvelopeOpen />
                        </button>
                      )}
                      <button
                        className={styles.actionButton}
                        onClick={() => deleteNotification(notif.id)}
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ];
              }, [])
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;