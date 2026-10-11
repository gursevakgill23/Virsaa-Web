import React from 'react';
import { Link } from 'react-router-dom';
import styles from './PageHero.module.css';

// Used when a page's header image is missing, so the header never shows empty
const FALLBACK_LIGHT = '/images/header-image.png';
const FALLBACK_DARK = '/images/header-image-dark.png';

/**
 * Shared page header: photo, title, subtitle and a glass breadcrumb.
 *
 * image     – background image URL
 * title     – main heading (string or node)
 * subtitle  – line under the heading (optional)
 * crumbs    – [{ label, to }]; the last item is the current page and needs no `to`
 * children  – extra content under the subtitle, e.g. a search bar or buttons (optional)
 * compact   – shorter header for detail pages
 */
const PageHero = ({ image, imageAlt = '', title, subtitle, crumbs = [], children, compact = false }) => {
  const handleError = (e) => {
    const img = e.currentTarget;
    if (img.dataset.fallback) {
      img.style.visibility = 'hidden'; // keep the maroon background instead of a broken icon
      return;
    }
    img.dataset.fallback = '1';
    img.src = (image || '').includes('dark') ? FALLBACK_DARK : FALLBACK_LIGHT;
  };

  return (
    <header className={`${styles.hero} ${compact ? styles.compact : ''}`}>
      <div className={styles.media} aria-hidden={!imageAlt}>
        {image && <img key={image} src={image} alt={imageAlt} className={styles.image} onError={handleError} />}
      </div>
      <div className={styles.scrim} aria-hidden="true" />

      <div className={styles.inner}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        {children}
      </div>

      {crumbs.length > 0 && (
        <nav className={styles.crumbs} aria-label="Breadcrumb">
          <ol>
            {crumbs.map((c, i) => {
              const last = i === crumbs.length - 1;
              return (
                <li key={`${c.label}-${i}`}>
                  {c.to && !last ? (
                    <Link to={c.to}>{c.label}</Link>
                  ) : (
                    <span aria-current={last ? 'page' : undefined}>{c.label}</span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      )}
    </header>
  );
};

export default PageHero;
