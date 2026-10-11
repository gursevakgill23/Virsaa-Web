import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaMapMarkerAlt } from 'react-icons/fa';
import styles from './GurdwaraAccessButton.module.css';

const GurdwaraAccessButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Not needed on the Gurdwara pages themselves
  if (location.pathname.startsWith('/gurdwara-access')) {
    return null;
  }

  return (
    <div className={styles.container}>
      <button type="button" className={styles.button} onClick={() => navigate('/gurdwara-access')}>
        <span className={styles.icon} aria-hidden="true"><FaMapMarkerAlt /></span>
        Gurdwara Access
      </button>
    </div>
  );
};

export default GurdwaraAccessButton;
