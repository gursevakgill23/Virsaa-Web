/**
 * pages/NotFound/NotFound.jsx
 * -----------------------------------------------------------------------------
 * Shown for any address that doesn't match a page (the catch-all route "*" in
 * App.js), e.g. a mistyped URL or an old bookmark. Instead of an empty screen,
 * it explains what happened and links to the main sections.
 * -----------------------------------------------------------------------------
 */
import React from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../../components/PageHero/PageHero';
import styles from './NotFound.module.css';

// Same header images as the other pages
const headerLight = '/images/header-image.png';
const headerDark = '/images/header-image-dark.png';

// Main sections people are most likely looking for
const SUGGESTIONS = [
  { to: '/collections/ebooks', label: 'Ebooks' },
  { to: '/collections/audiobooks', label: 'Audiobooks' },
  { to: '/learning', label: 'Learning' },
  { to: '/gurbani', label: 'Gurbani' },
  { to: '/news', label: 'News & Events' },
];

const NotFound = ({ isDarkMode }) => (
  <div className={styles.page}>
    <PageHero
      compact
      image={isDarkMode ? headerDark : headerLight}
      title="Page not found"
      subtitle="This address doesn’t lead to a page on Virsaa. It may have moved, or the link may be mistyped."
      crumbs={[{ label: 'Home', to: '/' }, { label: 'Page not found' }]}
    />

    <section className={styles.section}>
      <Link to="/" className={styles.homeButton}>Go to the home page</Link>
      <p className={styles.lede}>Or pick a section:</p>
      <nav className={styles.links} aria-label="Sections">
        {SUGGESTIONS.map((item) => (
          <Link key={item.to} to={item.to} className={styles.link}>{item.label}</Link>
        ))}
      </nav>
    </section>
  </div>
);

export default NotFound;
