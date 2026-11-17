/**
 * pages/Newsletter/Unsubscribe.jsx
 * -----------------------------------------------------------------------------
 * /newsletter/unsubscribe?token=...  -  opened from "Unsubscribe" at the bottom of
 * every Virsaa newsletter. It shows which address the link is for (partly
 * hidden), and unsubscribes it with one button. The button, not just opening
 * the page, does it, because some mail apps open links by themselves to check
 * them. Afterwards a "Subscribe again" button undoes it.
 * (Mail apps' own one-click "Unsubscribe" goes straight to the API.)
 * -----------------------------------------------------------------------------
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FaCheckCircle, FaEnvelopeOpenText, FaExclamationCircle, FaRedo } from 'react-icons/fa';
import siteApi from '../../api/siteApi';
import { describeApiError } from '../../utils/apiError';
import styles from './Unsubscribe.module.css';

const Unsubscribe = ({ isDarkMode, apiString }) => {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  // loading | subscribed | unsubscribed | invalid | error
  const [status, setStatus] = useState(token ? 'loading' : 'invalid');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const headerImage = isDarkMode ? '/images/Login/background-dark.jpeg' : '/images/Login/background.jpeg';

  const load = useCallback(async () => {
    if (!token) return;
    setStatus('loading');
    try {
      const data = await siteApi.newsletterLink(apiString, token);
      setEmail(data.email);
      setStatus(data.subscribed ? 'subscribed' : 'unsubscribed');
    } catch (error) {
      if (error.response?.status === 404) { setStatus('invalid'); return; }
      setMessage(describeApiError(error, 'This page couldn’t be loaded. Try again.'));
      setStatus('error');
    }
  }, [apiString, token]);

  useEffect(() => { load(); }, [load]);

  const change = async (resubscribe) => {
    setBusy(true);
    setMessage('');
    try {
      const data = await siteApi.unsubscribe(apiString, token, resubscribe);
      setEmail(data.email);
      setStatus(data.subscribed ? 'subscribed' : 'unsubscribed');
    } catch (error) {
      setMessage(describeApiError(error, 'That didn’t work. Try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <div className={styles.heroImage} style={{ backgroundImage: `url(${headerImage})` }} aria-hidden="true" />
        <div className={styles.heroShade} aria-hidden="true" />

        <div className={styles.card} role="status" aria-live="polite" aria-busy={status === 'loading'}>
          {status === 'loading' && (
            <>
              <span className={styles.spinner} aria-hidden="true" />
              <h1 className={styles.title}>One moment…</h1>
            </>
          )}

          {status === 'subscribed' && (
            <>
              <FaEnvelopeOpenText className={`${styles.icon} ${styles.iconMuted}`} aria-hidden="true" />
              <h1 className={styles.title}>Unsubscribe from the newsletter?</h1>
              <p className={styles.lede}>
                <strong>{email}</strong> will stop getting the Virsaa newsletter. Emails about your account,
                like sign-in codes and receipts, still arrive.
              </p>
              <div className={styles.actions}>
                <button type="button" className={styles.primaryButton} onClick={() => change(false)} disabled={busy}>
                  {busy ? 'Unsubscribing…' : 'Unsubscribe'}
                </button>
                <Link to="/" className={styles.secondaryButton}>Stay subscribed</Link>
              </div>
            </>
          )}

          {status === 'unsubscribed' && (
            <>
              <FaCheckCircle className={`${styles.icon} ${styles.iconOk}`} aria-hidden="true" />
              <h1 className={styles.title}>You’re unsubscribed</h1>
              <p className={styles.lede}>
                <strong>{email}</strong> won’t get the Virsaa newsletter any more. Changed your mind?
              </p>
              <div className={styles.actions}>
                <button type="button" className={styles.secondaryButton} onClick={() => change(true)} disabled={busy}>
                  {busy ? 'Subscribing…' : 'Subscribe again'}
                </button>
                <Link to="/" className={styles.primaryButton}>Go to Virsaa</Link>
              </div>
            </>
          )}

          {status === 'invalid' && (
            <>
              <FaExclamationCircle className={`${styles.icon} ${styles.iconProblem}`} aria-hidden="true" />
              <h1 className={styles.title}>This link doesn’t work</h1>
              <p className={styles.lede}>
                Use the Unsubscribe link at the bottom of your latest Virsaa newsletter, or write to
                {' '}<a href="mailto:support@virsaa.org">support@virsaa.org</a> and we’ll take you off the list.
              </p>
              <Link to="/" className={styles.primaryButton}>Go to Virsaa</Link>
            </>
          )}

          {status === 'error' && (
            <>
              <FaExclamationCircle className={`${styles.icon} ${styles.iconProblem}`} aria-hidden="true" />
              <h1 className={styles.title}>Something went wrong</h1>
              <p className={styles.lede}>{message}</p>
              <button type="button" className={styles.primaryButton} onClick={load}>
                <FaRedo aria-hidden="true" /> Try again
              </button>
            </>
          )}

          {message && status !== 'error' && <p className={styles.error} role="alert">{message}</p>}
        </div>
      </section>
    </div>
  );
};

export default Unsubscribe;
