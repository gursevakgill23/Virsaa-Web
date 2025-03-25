import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './GurdwaraAccessButton.module.css';

const GurdwaraAccessButton = ({ isDarkMode }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleButtonClick = () => {
    navigate('/gurdwara-access'); // Navigate to the Gurdwara Access page
  };

  // Hide the button if the current route is "/gurdwara-access"
  if (location.pathname === '/gurdwara-access') {
    return null;
  }

  return (
    <div className={styles.container} data-theme={isDarkMode ? 'dark' : 'light'}>
      <button className={styles.button} onClick={handleButtonClick}>
        Gurdwara Access
      </button>
    </div>
  );
};

export default GurdwaraAccessButton;