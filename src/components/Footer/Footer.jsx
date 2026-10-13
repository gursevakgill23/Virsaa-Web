/**
 * components/Footer/Footer.jsx
 * -----------------------------------------------------------------------------
 * The site footer (hidden on the full-screen game pages, see App.js):
 *   - brand blurb with the logo
 *   - "Useful links" to the main pages, including About and Privacy Policy
 *   - newsletter sign-up and a feedback box (checked here; see the TODO below
 *     about connecting them to the backend)
 *   - bottom bar with the copyright and "Follow us" social links
 * -----------------------------------------------------------------------------
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaYoutube, FaPaperPlane } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import styles from './Footer.module.css';

// Converts image paths for the production build (same helper used across pages)
const useProductionImagePath = () => {
  return (imagePath) => {
    if (process.env.NODE_ENV === 'production') {
      if (typeof imagePath === 'string') {
        return (imagePath.startsWith('/') || /^(https?:|blob:|data:)/i.test(imagePath))
          ? imagePath
          : `/${imagePath.replace(/.*static\/media/, 'static/media')}`;
      }
      return imagePath.default || imagePath;
    }
    return imagePath;
  };
};

// Links in the "Useful links" column (all are routes in App.js)
const USEFUL_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Collections', to: '/collections' },
  { label: 'Learning', to: '/learning' },
  { label: 'Gurbani', to: '/gurbani' },
  { label: 'Premium', to: '/premium' },
  { label: 'About', to: '/about' },
  { label: 'Privacy Policy', to: '/privacy-policy' },
];

// "Follow us" links. Replace these with Virsaa's real profile URLs
const SOCIAL_LINKS = [
  { label: 'Facebook', href: 'https://facebook.com', icon: FaFacebookF },
  { label: 'X (Twitter)', href: 'https://twitter.com', icon: FaXTwitter },
  { label: 'Instagram', href: 'https://instagram.com', icon: FaInstagram },
  { label: 'YouTube', href: 'https://youtube.com', icon: FaYoutube },
  { label: 'LinkedIn', href: 'https://linkedin.com', icon: FaLinkedinIn },
];

// Form limits: a simple email shape check (the server should check again) and feedback length
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const EMAIL_MAX = 254;
const FEEDBACK_MIN = 5;
const FEEDBACK_MAX = 1000;

const Footer = () => {
  const getImagePath = useProductionImagePath();
  const logo = '/images/logo.png';

  // Form values, "done" states and validation messages for the two small forms
  const [email, setEmail] = useState('');
  const [feedback, setFeedback] = useState('');
  const [newsletterDone, setNewsletterDone] = useState(false);
  const [feedbackDone, setFeedbackDone] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [feedbackError, setFeedbackError] = useState('');

  // TODO: connect these to backend endpoints when they exist
  const handleSubscribe = (e) => {
    e.preventDefault();
    const value = email.trim();
    if (!value) { setEmailError('Enter your email address.'); return; }
    if (!EMAIL_PATTERN.test(value)) { setEmailError('Enter an email address like name@example.com.'); return; }
    setEmailError('');
    setNewsletterDone(true);
    setEmail('');
  };

  const handleFeedback = (e) => {
    e.preventDefault();
    const value = feedback.trim();
    if (value.length < FEEDBACK_MIN) { setFeedbackError(`Write at least ${FEEDBACK_MIN} characters.`); return; }
    setFeedbackError('');
    setFeedbackDone(true);
    setFeedback('');
  };

  // Footer links jump to the top of the new page
  const scrollTop = () => window.scrollTo({ top: 0 });

  return (
    <footer className={styles.footer}>
      <div className={styles.slab}>
        <div className={styles.aura} aria-hidden="true" />

        <div className={styles.grid}>
          {/* Brand */}
          <div className={styles.brand}>
            <Link to="/" onClick={scrollTop} className={styles.logo} aria-label="Virsaa home">
              <img src={getImagePath(logo)} alt="Virsaa" />
            </Link>
            <p className={styles.description}>
              Virsaa is a modern platform dedicated to preserving and promoting Punjabi and Sikh
              heritage through books, history, Gurbani and learning.
            </p>
          </div>

          {/* Useful links */}
          <nav className={styles.column} aria-labelledby="footer-links-title">
            <h2 id="footer-links-title" className={styles.heading}>Useful links</h2>
            <ul className={styles.linkList}>
              {USEFUL_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} onClick={scrollTop} className={styles.link}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Newsletter */}
          <div className={styles.column}>
            <h2 className={styles.heading}>Join our newsletter</h2>
            <p className={styles.hint}>New books, history articles and learning games, once a month.</p>
            {newsletterDone ? (
              <p className={styles.thanks} role="status">Thanks for subscribing.</p>
            ) : (
              <>
                <form className={styles.inlineForm} onSubmit={handleSubscribe} noValidate>
                  <label htmlFor="footer-email" className={styles.srOnly}>Email address</label>
                  <input
                    id="footer-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(''); }}
                    required
                    maxLength={EMAIL_MAX}
                    autoComplete="email"
                    aria-invalid={Boolean(emailError)}
                    aria-describedby={emailError ? 'footer-email-error' : undefined}
                    className={styles.input}
                  />
                  <button type="submit" className={styles.roundButton} aria-label="Subscribe">
                    <FaPaperPlane aria-hidden="true" />
                  </button>
                </form>
                {emailError && <p id="footer-email-error" className={styles.formError} role="alert">{emailError}</p>}
              </>
            )}
          </div>

          {/* Feedback */}
          <div className={styles.column}>
            <h2 className={styles.heading}>Your feedback</h2>
            {feedbackDone ? (
              <p className={styles.thanks} role="status">Thank you. Your feedback helps us improve Virsaa.</p>
            ) : (
              <form className={styles.stackForm} onSubmit={handleFeedback} noValidate>
                <label htmlFor="footer-feedback" className={styles.srOnly}>Your feedback</label>
                <textarea
                  id="footer-feedback"
                  placeholder="Share your feedback..."
                  rows="3"
                  value={feedback}
                  onChange={(e) => { setFeedback(e.target.value); if (feedbackError) setFeedbackError(''); }}
                  required
                  maxLength={FEEDBACK_MAX}
                  aria-invalid={Boolean(feedbackError)}
                  aria-describedby={feedbackError ? 'footer-feedback-error' : undefined}
                  className={styles.textarea}
                />
                {feedbackError && <p id="footer-feedback-error" className={styles.formError} role="alert">{feedbackError}</p>}
                <button type="submit" className={styles.pillButton}>Send feedback</button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom bar: copyright + Follow us */}
        <div className={styles.bottom}>
          <p className={styles.copyright}>&copy; {new Date().getFullYear()} Virsaa. All rights reserved.</p>
          <div className={styles.follow}>
            <span className={styles.followLabel}>Follow us</span>
            <ul className={styles.socialList}>
              {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                <li key={label}>
                  <a href={href} target="_blank" rel="noopener noreferrer" className={styles.social} aria-label={label}>
                    <Icon aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
