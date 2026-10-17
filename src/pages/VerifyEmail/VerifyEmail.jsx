/**
 * pages/VerifyEmail/VerifyEmail.jsx
 * -----------------------------------------------------------------------------
 * Opened from the "Verify your email" message sent after sign-up:
 *   /verify-email/:token          (links sent from now on)
 *   /verify-email/:email/:token   (older links, which also carried the address)
 * It confirms the address with the server (/api/auth/verify-email/) as soon as
 * it opens, and shows:
 *   - "Email verified" with a "Log in now" button
 *   - "Email already verified" (the link was opened before) with "Log in now"
 *   - an expired or broken link: a form that sends a new link
 *   - no connection / server problem: "Try again"
 * Verifying never signs anyone in: logging in still needs the password, so a
 * forwarded link can't open the account.
 * -----------------------------------------------------------------------------
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaCheckCircle, FaExclamationCircle, FaRedo, FaSignInAlt } from 'react-icons/fa';
import accountApi from '../../api/accountApi';
import ResendVerification from '../../components/ResendVerification/ResendVerification';
import { describeApiError } from '../../utils/apiError';
import styles from './VerifyEmail.module.css';

// Older links put the address in the URL; it only pre-fills the "send a new link" box
const decode = (value) => {
  try { return decodeURIComponent(value || ''); } catch { return value || ''; }
};

// Props: isDarkMode, apiString (API base URL)
const VerifyEmail = ({ isDarkMode, apiString }) => {
  const { token = '', email: emailInLink = '' } = useParams();
  const [status, setStatus] = useState('checking'); // checking | verified | already | expired | invalid | error
  const [message, setMessage] = useState('');
  const startedRef = useRef(false); // the link is checked once, even if the page renders twice
  const headerImage = isDarkMode ? '/images/Login/background-dark.jpeg' : '/images/Login/background.jpeg';

  const verify = useCallback(async () => {
    setStatus('checking');
    try {
      const data = await accountApi.verifyEmail(apiString, token);
      setStatus(data?.already_verified ? 'already' : 'verified');
    } catch (error) {
      const reason = error?.response?.data?.reason;
      if (error?.response?.status === 400) {
        setStatus(reason === 'expired' ? 'expired' : 'invalid');
        return;
      }
      setMessage(describeApiError(error, 'Your email couldn’t be verified right now. Try again.'));
      setStatus('error');
    }
  }, [apiString, token]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    verify();
  }, [verify]);

  const loginButton = (
    <Link to="/login" className={styles.primaryButton}>
      <FaSignInAlt aria-hidden="true" /> Log in now
    </Link>
  );

  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <div className={styles.heroImage} style={{ backgroundImage: `url(${headerImage})` }} aria-hidden="true" />
        <div className={styles.heroShade} aria-hidden="true" />

        <div className={styles.card} role="status" aria-live="polite" aria-busy={status === 'checking'}>
          {status === 'checking' && (
            <>
              <span className={styles.spinner} aria-hidden="true" />
              <h1 className={styles.title}>Confirming your email…</h1>
              <p className={styles.lede}>This only takes a moment.</p>
            </>
          )}

          {status === 'verified' && (
            <>
              <FaCheckCircle className={`${styles.icon} ${styles.iconOk}`} aria-hidden="true" />
              <h1 className={styles.title}>Email verified</h1>
              <p className={styles.lede}>
                Your email address is confirmed and your Virsaa account is ready. Log in with your email or
                username and password.
              </p>
              {loginButton}
            </>
          )}

          {status === 'already' && (
            <>
              <FaCheckCircle className={`${styles.icon} ${styles.iconOk}`} aria-hidden="true" />
              <h1 className={styles.title}>Email already verified</h1>
              <p className={styles.lede}>This link was used before, so your email address is already confirmed.</p>
              {loginButton}
            </>
          )}

          {(status === 'expired' || status === 'invalid') && (
            <>
              <FaExclamationCircle className={`${styles.icon} ${styles.iconProblem}`} aria-hidden="true" />
              <h1 className={styles.title}>
                {status === 'expired' ? 'This link has expired' : 'This link doesn’t work'}
              </h1>
              <p className={styles.lede}>
                {status === 'expired'
                  ? 'Verification links work for 24 hours. Enter your email and we’ll send you a new one.'
                  : 'It may be incomplete, or a newer link has replaced it. Enter your email and we’ll send you a new one. Already verified? Just log in.'}
              </p>
              <div className={styles.resend}>
                <ResendVerification apiString={apiString} initialEmail={emailInLink ? decode(emailInLink) : ''} />
              </div>
              <Link to="/login" className={styles.secondaryButton}>Log in</Link>
            </>
          )}

          {status === 'error' && (
            <>
              <FaExclamationCircle className={`${styles.icon} ${styles.iconProblem}`} aria-hidden="true" />
              <h1 className={styles.title}>We couldn’t check your link</h1>
              <p className={styles.lede}>{message}</p>
              <button type="button" className={styles.primaryButton} onClick={verify}>
                <FaRedo aria-hidden="true" /> Try again
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default VerifyEmail;
