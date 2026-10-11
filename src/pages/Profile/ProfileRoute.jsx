import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import MyProfile from './MyProfile/MyProfile';
import CompleteProfile from './CompleteProfile/CompleteProfile';
import { isProfileComplete } from './profileStatus';
import styles from './ProfileRoute.module.css';

/**
 * /my-profile
 * Loads the signed-in user's profile from the server, then shows
 *  - CompleteProfile while any required detail is still empty
 *  - MyProfile once everything is filled in.
 * It always asks the server, so a profile saved on another device (or data
 * missing from the login response) is judged correctly.
 */
const ProfileRoute = ({ isDarkMode, apiString }) => {
  const { accessToken, logout, updateUserData } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error

  // Keep the latest functions without re-running the fetch when they change identity
  const latest = useRef({ logout, navigate, updateUserData });
  latest.current = { logout, navigate, updateUserData };

  const loadProfile = useCallback(async () => {
    if (!accessToken) {
      latest.current.navigate('/login', { replace: true });
      return;
    }
    setStatus('loading');
    try {
      const response = await fetch(`${apiString}/api/auth/profile/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.status === 401) {
        latest.current.logout?.();
        latest.current.navigate('/login', { replace: true });
        return;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setProfile(data);
      latest.current.updateUserData?.(data); // keep the navbar etc. in sync
      setStatus('ready');
    } catch (err) {
      console.error('Profile check failed:', err.message);
      setStatus('error');
    }
  }, [accessToken, apiString]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Called by CompleteProfile after a successful save
  const handleCompleted = useCallback((saved) => {
    const merged = { ...profile, ...saved };
    setProfile(merged);
    if (!isProfileComplete(merged)) loadProfile(); // let the server have the final say
  }, [profile, loadProfile]);

  if (status === 'loading') {
    return (
      <div className={styles.state} role="status">
        <span className={styles.spinner} aria-hidden="true" />
        <p>Loading your profile…</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className={styles.state}>
        <h2>Your profile couldn’t be loaded</h2>
        <p>Check your connection and try again.</p>
        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={loadProfile}>Try again</button>
          <Link to="/" className={styles.secondary}>Go home</Link>
        </div>
      </div>
    );
  }

  return isProfileComplete(profile) ? (
    <MyProfile isDarkMode={isDarkMode} apiString={apiString} />
  ) : (
    <CompleteProfile
      isDarkMode={isDarkMode}
      apiString={apiString}
      profile={profile}
      onCompleted={handleCompleted}
    />
  );
};

export default ProfileRoute;
