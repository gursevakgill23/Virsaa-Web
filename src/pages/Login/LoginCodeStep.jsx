/**
 * pages/Login/LoginCodeStep.jsx
 * -----------------------------------------------------------------------------
 * The second step of signing in, for accounts with sign-in codes switched on
 * (admin accounts always have them): the 6-digit code we emailed.
 *   - says where the code went (ha•••@gmail.com) and checks it with
 *     /api/auth/login/verify/ (as soon as 6 digits are typed or pasted)
 *   - "Send a new code" after a minute (/api/auth/login/resend/)
 *   - a wrong code says how many tries are left; after 5, or once the code
 *     has expired (10 minutes), only "Sign in again" helps
 *   - "Use a different account" goes back to the password form
 * The parent (Login.jsx) finishes the sign-in with onSignedIn(data).
 * -----------------------------------------------------------------------------
 */
import React, { useEffect, useRef, useState } from 'react';
import accountApi from '../../api/accountApi';
import useCountdown from '../../hooks/useCountdown';
import { describeApiError } from '../../utils/apiError';
import styles from './Login.module.css';

const first = (value) => (Array.isArray(value) ? value[0] : value);

const LoginCodeStep = ({ apiString, step, onSignedIn, onStartAgain }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [ended, setEnded] = useState(''); // expired or locked: start again
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [hint, setHint] = useState(step.emailHint || 'your email');
  const { left: resendIn, restart } = useCountdown(step.resendIn ?? 60);
  const inputRef = useRef(null);
  const sentRef = useRef(''); // the last code sent, so the same digits aren't checked twice

  useEffect(() => { inputRef.current?.focus(); }, []);

  const check = async (digits) => {
    if (busy || digits === sentRef.current) return;
    sentRef.current = digits;
    setBusy(true);
    setError('');
    try {
      const data = await accountApi.verifyLoginCode(apiString, step.challenge, digits);
      if (!data?.access || !data?.user) throw new Error('Unexpected sign-in reply');
      onSignedIn(data); // the page moves on; stay "busy" so nothing is sent twice
    } catch (err) {
      const d = err.response?.data || {};
      if (d.reason === 'expired' || d.reason === 'locked') {
        setEnded(first(d.code) || d.error);
      } else {
        setError(first(d.code) || d.error || describeApiError(err, 'The code couldn’t be checked. Try again.'));
        inputRef.current?.select();
      }
      setBusy(false);
    }
  };

  const onChange = (e) => {
    const value = e.target.value.replace(/[^\d ]/g, '').slice(0, 7);
    setCode(value);
    if (error) setError('');
    const digits = value.replace(/\D/g, '');
    if (digits.length === 6) check(digits);
    else sentRef.current = '';
  };

  const submit = (e) => {
    e.preventDefault();
    const digits = code.replace(/\D/g, '');
    if (digits.length !== 6) {
      setError('Enter the 6-digit code from the email.');
      return;
    }
    sentRef.current = '';
    check(digits);
  };

  const resend = async () => {
    if (resendIn > 0 || busy) return;
    setError('');
    setNotice('');
    try {
      const data = await accountApi.resendLoginCode(apiString, step.challenge);
      if (data.email_hint) setHint(data.email_hint);
      setNotice(data.message || 'We sent a new code.');
      restart(data.resend_in ?? 60);
      setCode('');
      sentRef.current = '';
      inputRef.current?.focus();
    } catch (err) {
      const d = err.response?.data || {};
      if (d.reason === 'expired') {
        setEnded(d.error);
        return;
      }
      if (d.reason === 'wait') restart(d.resend_in ?? 30);
      setError(d.error || describeApiError(err, 'A new code couldn’t be sent. Try again.'));
    }
  };

  return (
    <div className={styles.codeStep}>
      <p className={styles.gurmukhi} lang="pa">ਬੱਸ ਇੱਕ ਕਦਮ ਹੋਰ</p>
      <h1 className={styles.formTitle}>Check your email</h1>
      <p className={styles.formLede}>
        We sent a 6-digit code to <strong className={styles.codeHint}>{hint}</strong>. Enter it to finish signing in.
      </p>

      {ended ? (
        <div className={styles.codeEnded} role="alert">
          <p>{ended}</p>
          <button type="button" className={styles.primaryButton} onClick={onStartAgain}>Sign in again</button>
        </div>
      ) : (
        <form className={styles.form} onSubmit={submit} noValidate>
          <div className={styles.inputGroup}>
            <label htmlFor="signin-code" className={styles.label}>Sign-in code</label>
            <input
              ref={inputRef}
              id="signin-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123 456"
              maxLength={7}
              value={code}
              onChange={onChange}
              className={`${styles.input} ${styles.codeInput} ${error ? styles.errorInput : ''}`}
              aria-invalid={!!error}
              aria-describedby={error ? 'signin-code-error signin-code-help' : 'signin-code-help'}
            />
            {error && <div id="signin-code-error" className={styles.errorMessage} role="alert">{error}</div>}
            <p id="signin-code-help" className={styles.codeHelp}>
              The code works for 10 minutes. Can’t find the email? Check your spam folder.
            </p>
          </div>

          <button type="submit" className={styles.primaryButton} disabled={busy}>
            {busy ? <span className={styles.spinner} aria-label="Checking the code" /> : 'Verify and sign in'}
          </button>

          {notice && <p className={styles.codeNotice} role="status">{notice}</p>}

          <div className={styles.codeLinks}>
            <button type="button" className={styles.linkButton} onClick={resend} disabled={resendIn > 0 || busy}>
              {resendIn > 0 ? `Send a new code in ${resendIn}s` : 'Send a new code'}
            </button>
            <button type="button" className={styles.linkButton} onClick={onStartAgain}>
              Use a different account
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default LoginCodeStep;
