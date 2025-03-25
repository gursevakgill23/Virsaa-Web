import React from 'react';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa'; // React Icons
import styles from './Footer.module.css'; // Import CSS Module
import logo from "../../images/logo.png"
const Footer = () => {
  return (
    <div className={styles.footerContainer}>
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        {/* Column 1: Logo and Description */}
        <div className={styles.footerColumn}>
          <div className={styles.logo}>
            <img src={logo} alt="Virsa Logo" />
          </div>
          <p className={styles.description}>
            Virsaa is a modern platform dedicated to preserving and promoting cultural heritage through innovative solutions.
          </p>
        </div>

        {/* Column 2: Join Newsletter */}
        <div className={styles.footerColumn}>
          <h3>Join Our Newsletter</h3>
          <form className={styles.newsletterForm}>
            <input type="email" placeholder="Enter your email" required />
            <button type="submit">Subscribe</button>
          </form>
        </div>

        {/* Column 3: Feedback */}
        <div className={styles.footerColumn}>
          <h3>Your Feedback</h3>
          <form className={styles.feedbackForm}>
            <textarea placeholder="Share your feedback..." rows="3" required></textarea>
            <button type="submit">Submit</button>
          </form>
        </div>

        {/* Column 4: Social Links */}
        <div className={styles.footerColumn}>
          <h3>Follow Us</h3>
          <div className={styles.socialLinks}>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
              <FaFacebook className={styles.socialIcon} />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
              <FaTwitter className={styles.socialIcon} />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
              <FaInstagram className={styles.socialIcon} />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
              <FaLinkedin className={styles.socialIcon} />
            </a>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      
    </footer>
    <div className={styles.footerBottom}>
    <p>&copy; {new Date().getFullYear()} Virsa. All rights reserved.</p>
  </div>
  </div>
  );
};

export default Footer;