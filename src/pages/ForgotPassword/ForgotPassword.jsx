/**
 * pages/ForgotPassword/ForgotPassword.jsx
 * -----------------------------------------------------------------------------
 * Password reset (/forgot-password) in three steps:
 *   1. enter your email (+ reCAPTCHA) → a 6-digit code is emailed
 *   2. enter the code (can be re-sent after 30 s)
 *   3. choose a new password → back to the login page
 * Each step validates before sending and explains any server or connection error.
 * -----------------------------------------------------------------------------
 */
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from '../../utils/notify';
import ReCAPTCHA from 'react-google-recaptcha';
import { FaEye, FaEyeSlash, FaEnvelope, FaKey, FaLock, FaCheck, FaArrowLeft } from 'react-icons/fa';
import axios from 'axios';
import styles from './ForgotPassword.module.css';

// The three steps shown in the progress indicator
const STEPS = [
  { title: 'Your email', icon: <FaEnvelope /> },
  { title: 'Enter code', icon: <FaKey /> },
  { title: 'New password', icon: <FaLock /> },
];

const ForgotPassword = ({ isDarkMode, apiString = process.env.REACT_APP_API_URL }) => {
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);

  // Use the API address exactly as the app passes it (it may be a relative proxy path)
  const apiUrl = (apiString || '').trim().replace(/\/+$/, '');

  // Current step, form values, errors, sending state, password visibility,
  // resend countdown and the email the code was sent to
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ email: '', code: '', newPassword: '', confirmNewPassword: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [emailSent, setEmailSent] = useState('');

  const headerImage = isDarkMode ? '/images/Login/background-dark.jpeg' : '/images/Login/background.jpeg';
  const toastTheme = isDarkMode ? 'dark' : 'light';

  // Countdown before the code can be re-sent
  useEffect(() => {
    if (countdown <= 0) return undefined;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Keep the typed value (the code accepts digits only, max 6) and clear its error
  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: id === 'code' ? value.replace(/\D/g, '').slice(0, 6) : value }));
    if (errors[id]) setErrors((prev) => ({ ...prev, [id]: '' }));
  };

  // ---------- Validation ----------
  const validateEmailForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) newErrors.email = 'Enter the email you signed up with';
    else if (!emailRegex.test(formData.email)) newErrors.email = 'Enter an email like name@example.com';
    if (!recaptchaRef.current?.getValue()) newErrors.captcha = 'Tick the reCAPTCHA box to continue';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCodeForm = () => {
    const newErrors = {};
    if (!formData.code.trim()) newErrors.code = 'Enter the 6-digit code from your email';
    else if (!/^\d{6}$/.test(formData.code)) newErrors.code = 'The code is 6 digits';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors = {};
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!formData.newPassword) newErrors.newPassword = 'Create a new password';
    else if (!passwordRegex.test(formData.newPassword)) newErrors.newPassword = 'Use 8+ characters with upper case, lower case and a number';
    if (!formData.confirmNewPassword) newErrors.confirmNewPassword = 'Type your new password again';
    else if (formData.newPassword !== formData.confirmNewPassword) newErrors.confirmNewPassword = 'Passwords don’t match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // A readable message for a failed request
  const errorMessageFrom = (error, fallback) => {
    if (error.code === 'ECONNABORTED') return 'The request timed out. Check your connection and try again.';
    if (error.response) {
      const d = error.response.data || {};
      if (error.response.status === 429) return (Array.isArray(d.captcha) ? d.captcha.join(', ') : d.captcha) || d.error || 'Too many attempts. Wait a few minutes and try again.';
      if (error.response.status >= 500) return 'Something went wrong on our side. Try again in a moment.';
      const text = (value) => (Array.isArray(value) ? value.join(' ') : value);
      return text(d.captcha) || text(d.email)
        || text(d.new_password) || text(d.code)
        || d.error || d.message || fallback;
    }
    if (error.request) return 'The server didn’t respond. Try again later.';
    return error.message || fallback;
  };

  // POST helper with a 10 s timeout
  const post = (path, payload) => axios.post(`${apiUrl}${path}`, payload, {
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
  });

  // ---------- Step 1: send code ----------
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!validateEmailForm()) return;
    setIsSubmitting(true);
    try {
      const response = await post('/api/auth/forget-password/', {
        email: formData.email.trim(),
        captcha: recaptchaRef.current.getValue(),
      });
      // Any 2xx reply means the code was sent; the server's message is shown when it has one
      toast.success(response.data?.message || 'We’ve emailed you a 6-digit code.', { position: 'top-center', autoClose: 3000, theme: toastTheme });
      setEmailSent(formData.email.trim());
      setCountdown(60); // the server sends at most one code a minute
      setStep(2);
    } catch (error) {
      console.error('Forgot password error:', error.response?.status || error.message);
      toast.error(errorMessageFrom(error, 'The code couldn’t be sent'), { position: 'top-center', autoClose: 5000, theme: toastTheme });
    } finally {
      recaptchaRef.current?.reset();
      setIsSubmitting(false);
    }
  };

  // ---------- Step 2: verify code ----------
  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    if (!validateCodeForm()) return;
    setIsSubmitting(true);
    try {
      const response = await post('/api/auth/verify-reset-code/', { email: emailSent, code: formData.code });
      toast.success(response.data?.message || 'Code accepted. Now choose a new password.', { position: 'top-center', autoClose: 3000, theme: toastTheme });
      setStep(3);
    } catch (error) {
      console.error('Verify code error:', error.response?.status || error.message);
      toast.error(errorMessageFrom(error, 'That code is wrong or has expired'), { position: 'top-center', autoClose: 5000, theme: toastTheme });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------- Step 3: new password ----------
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;
    setIsSubmitting(true);
    try {
      await post('/api/auth/reset-password/', {
        email: emailSent,
        code: formData.code,
        new_password: formData.newPassword,
        confirm_new_password: formData.confirmNewPassword,
      });
      toast.success('Your password has been changed and any other devices signed out. You can sign in now.', { position: 'top-center', autoClose: 3000, theme: toastTheme });
      setTimeout(() => navigate('/login'), 3000);
    } catch (error) {
      console.error('Reset password error:', error.response?.status || error.message);
      toast.error(errorMessageFrom(error, 'Your password couldn’t be reset'), { position: 'top-center', autoClose: 5000, theme: toastTheme });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------- Resend (needs a fresh reCAPTCHA tick on step 2) ----------
  const handleResendCode = async () => {
    if (countdown > 0 || isSubmitting) return;
    const token = recaptchaRef.current?.getValue();
    if (!token) {
      setErrors((prev) => ({ ...prev, captcha: 'Tick the reCAPTCHA box, then choose “Resend code”' }));
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await post('/api/auth/forget-password/', { email: emailSent, captcha: token });
      toast.success(response.data?.message || 'A new code is on its way.', { position: 'top-center', autoClose: 3000, theme: toastTheme });
      setCountdown(60); // the server sends at most one code a minute
      setErrors((prev) => ({ ...prev, captcha: '' }));
    } catch (error) {
      console.error('Resend code error:', error.response?.status || error.message);
      toast.error(errorMessageFrom(error, 'The code couldn’t be re-sent'), { position: 'top-center', autoClose: 5000, theme: toastTheme });
    } finally {
      recaptchaRef.current?.reset();
      setIsSubmitting(false);
    }
  };

  // The reCAPTCHA block, reused on steps 1 and 2
  const recaptcha = (
    <div className={styles.captcha}>
      <ReCAPTCHA
        ref={recaptchaRef}
        sitekey={process.env.REACT_APP_RECAPTCHA_PUBLIC_KEY}
        size="normal"
        theme={isDarkMode ? 'dark' : 'light'}
        onErrored={() => toast.error('Security check failed to load. Refresh the page.', { position: 'top-center', autoClose: 5000, theme: toastTheme })}
        onExpired={() => recaptchaRef.current?.reset()}
      />
      {errors.captcha && <div className={styles.errorMessage} role="alert">{errors.captcha}</div>}
    </div>
  );

  const passwordRules = [
    { ok: formData.newPassword.length >= 8, label: '8 or more characters' },
    { ok: /[A-Z]/.test(formData.newPassword) && /[a-z]/.test(formData.newPassword), label: 'Upper and lower case' },
    { ok: /\d/.test(formData.newPassword), label: 'At least one number' },
  ];

  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <div className={styles.heroImage} style={{ backgroundImage: `url(${headerImage})` }} aria-hidden="true" />
        <div className={styles.heroShade} aria-hidden="true" />

        <div className={styles.card}>
          <Link to="/login" className={styles.backLink}><FaArrowLeft aria-hidden="true" /> Back to sign in</Link>

          <h1 className={styles.title}>
            {step === 1 ? 'Reset your password' : step === 2 ? 'Check your email' : 'Create a new password'}
          </h1>
          <p className={styles.lede}>
            {step === 1 && 'Enter the email you signed up with and we’ll send you a 6-digit code.'}
            {step === 2 && <>If an account uses <strong>{emailSent}</strong>, we’ve sent a 6-digit code to it. It may take a minute to arrive.</>}
            {step === 3 && 'Choose a password you haven’t used on Virsaa before.'}
          </p>

          {/* Real 3-step sequence, so it's numbered */}
          <ol className={styles.stepper} aria-label="Progress">
            {STEPS.map((s, i) => {
              const n = i + 1;
              const state = n < step ? 'done' : n === step ? 'current' : 'todo';
              return (
                <li key={s.title} className={`${styles.step} ${styles[state]}`} aria-current={state === 'current' ? 'step' : undefined}>
                  <span className={styles.stepDot}>{state === 'done' ? <FaCheck aria-hidden="true" /> : n}</span>
                  <span className={styles.stepLabel}>{s.title}</span>
                </li>
              );
            })}
          </ol>

          {step === 1 && (
            <form className={styles.form} onSubmit={handleEmailSubmit} noValidate>
              <div className={styles.inputGroup}>
                <label htmlFor="email" className={styles.label}>Email</label>
                <input
                  type="email"
                  id="email"
                  autoComplete="email"
                  className={`${styles.input} ${errors.email ? styles.errorInput : ''}`}
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.email}
                />
                {errors.email && <div className={styles.errorMessage} role="alert">{errors.email}</div>}
              </div>
              {recaptcha}
              <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                {isSubmitting ? <span className={styles.spinner} aria-label="Sending" /> : 'Send code'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form className={styles.form} onSubmit={handleCodeSubmit} noValidate>
              <div className={styles.inputGroup}>
                <label htmlFor="code" className={styles.label}>6-digit code</label>
                <input
                  type="text"
                  id="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength="6"
                  className={`${styles.input} ${styles.codeInput} ${errors.code ? styles.errorInput : ''}`}
                  placeholder="••••••"
                  value={formData.code}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.code}
                />
                {errors.code && <div className={styles.errorMessage} role="alert">{errors.code}</div>}
              </div>

              <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                {isSubmitting ? <span className={styles.spinner} aria-label="Checking" /> : 'Verify code'}
              </button>

              <details className={styles.resendBox}>
                <summary>Didn’t get the code?</summary>
                <p>Check your spam folder first. To get a new code, tick the box below and choose “Resend code”.</p>
                {recaptcha}
                <button
                  type="button"
                  className={styles.resendButton}
                  onClick={handleResendCode}
                  disabled={countdown > 0 || isSubmitting}
                >
                  {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
                </button>
              </details>

              <button type="button" className={styles.textButton} onClick={() => setStep(1)} disabled={isSubmitting}>
                Use a different email
              </button>
            </form>
          )}

          {step === 3 && (
            <form className={styles.form} onSubmit={handlePasswordSubmit} noValidate>
              <div className={styles.inputGroup}>
                <label htmlFor="newPassword" className={styles.label}>New password</label>
                <div className={styles.passwordContainer}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="newPassword"
                    autoComplete="new-password"
                    className={`${styles.input} ${errors.newPassword ? styles.errorInput : ''}`}
                    placeholder="Create a password"
                    value={formData.newPassword}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    aria-invalid={!!errors.newPassword}
                  />
                  <button
                    type="button"
                    className={styles.togglePassword}
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                <ul className={styles.rules}>
                  {passwordRules.map((rule) => (
                    <li key={rule.label} className={rule.ok ? styles.ruleOk : ''}>
                      <FaCheck aria-hidden="true" /> {rule.label}
                    </li>
                  ))}
                </ul>
                {errors.newPassword && <div className={styles.errorMessage} role="alert">{errors.newPassword}</div>}
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="confirmNewPassword" className={styles.label}>Confirm password</label>
                <div className={styles.passwordContainer}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmNewPassword"
                    autoComplete="new-password"
                    className={`${styles.input} ${errors.confirmNewPassword ? styles.errorInput : ''}`}
                    placeholder="Type it again"
                    value={formData.confirmNewPassword}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    aria-invalid={!!errors.confirmNewPassword}
                  />
                  <button
                    type="button"
                    className={styles.togglePassword}
                    onClick={() => setShowConfirmPassword((p) => !p)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.confirmNewPassword && <div className={styles.errorMessage} role="alert">{errors.confirmNewPassword}</div>}
              </div>

              <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                {isSubmitting ? <span className={styles.spinner} aria-label="Saving" /> : 'Reset password'}
              </button>
              <button type="button" className={styles.textButton} onClick={() => setStep(2)} disabled={isSubmitting}>
                Back to the code
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};

export default ForgotPassword;
