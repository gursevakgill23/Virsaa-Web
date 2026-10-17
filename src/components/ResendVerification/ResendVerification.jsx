/**
 * components/ResendVerification/ResendVerification.jsx
 * -----------------------------------------------------------------------------
 * "Send me a new verification link": an email box and a button. Used where a
 * person may need a fresh link: the verify-email page (old or broken link),
 * the login page ("Email not verified") and after signing up.
 *
 *   <ResendVerification apiString={apiString} initialEmail={email} />
 *
 * The server answers the same way whether or not an account uses the address,
 * so the message after sending never says whether one does. After sending,
 * the button waits a minute (the server sends at most one email a minute).
 * -----------------------------------------------------------------------------
 */
import React, { useEffect, useId, useState } from 'react';
import { FaPaperPlane } from 'react-icons/fa';
import accountApi from '../../api/accountApi';
import { describeApiError } from '../../utils/apiError';
import styles from './ResendVerification.module.css';

const WAIT_SECONDS = 60;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ResendVerification = ({ apiString, initialEmail = '', hideEmail = false, label = 'Send a new link' }) => {
  const inputId = useId();
  const [email, setEmail] = useState(initialEmail);
  const [state, setState] = useState('idle'); // idle | sending | sent | error
  const [message, setMessage] = useState('');
  const [wait, setWait] = useState(0);

  useEffect(() => { if (initialEmail) setEmail(initialEmail); }, [initialEmail]);

  // Count the minute down after sending
  useEffect(() => {
    if (wait <= 0) return undefined;
    const timer = setTimeout(() => setWait((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  const send = async (e) => {
    e.preventDefault();
    const address = email.trim();
    if (!EMAIL.test(address)) {
      setState('error');
      setMessage('Enter the email address you signed up with.');
      return;
    }
    setState('sending');
    try {
      const data = await accountApi.resendVerification(apiString, address);
      setState('sent');
      setMessage(data?.message || 'If that account is waiting to be verified, a new link is on its way.');
      setWait(WAIT_SECONDS);
    } catch (error) {
      setState('error');
      setMessage(describeApiError(error, 'The link couldn’t be sent right now. Try again in a minute.'));
    }
  };

  return (
    <form className={styles.form} onSubmit={send} noValidate>
      {!hideEmail && (
        <>
          <label htmlFor={inputId} className={styles.label}>Your email address</label>
          <input
            id={inputId}
            type="email"
            className={styles.input}
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (state === 'error') setState('idle'); }}
            autoComplete="email"
            maxLength={254}
            placeholder="name@example.com"
            aria-invalid={state === 'error' && !EMAIL.test(email.trim())}
          />
        </>
      )}
      <button type="submit" className={styles.button} disabled={state === 'sending' || wait > 0}>
        <FaPaperPlane aria-hidden="true" />
        {state === 'sending' ? 'Sending…' : wait > 0 ? `Sent. Send again in ${wait}s` : label}
      </button>
      {message && (
        <p className={state === 'error' ? styles.error : styles.note} role={state === 'error' ? 'alert' : 'status'}>
          {message}
        </p>
      )}
    </form>
  );
};

export default ResendVerification;
