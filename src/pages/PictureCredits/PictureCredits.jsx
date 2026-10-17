/**
 * pages/PictureCredits/PictureCredits.jsx
 * -----------------------------------------------------------------------------
 * Picture credits (/picture-credits, linked from the footer).
 *
 * The website's photos and paintings, audiobook covers and author photos are
 * real, freely licensed pictures from Wikimedia Commons, stored in our S3
 * bucket. Their licences (Creative Commons, public domain) ask for a credit:
 * who made the picture, the licence, and a link to its page. This page lists
 * them all, from /collections/picture-credits/ (kept up to date by the
 * loader and Django admin). Audiobook recordings are credited on each
 * audiobook's own page.
 * -----------------------------------------------------------------------------
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaExternalLinkAlt, FaRedo } from 'react-icons/fa';
import PageHero from '../../components/PageHero/PageHero';
import { picturesApi } from '../../api/picturesApi';
import { safeExternalUrl } from '../../utils/safeUrl';
import styles from './PictureCredits.module.css';

// The API lists website pictures first, then audiobook covers, then author photos
const GROUPS = [
  { id: 'site', title: 'Pictures on the website', test: (p) => !['Audiobooks', 'Authors'].includes(p.used_on) },
  { id: 'covers', title: 'Audiobook covers', test: (p) => p.used_on === 'Audiobooks' },
  { id: 'authors', title: 'Author photos', test: (p) => p.used_on === 'Authors' },
];

const Credit = ({ picture }) => {
  const image = safeExternalUrl(picture.image);
  const source = safeExternalUrl(picture.source_url);
  const licence = safeExternalUrl(picture.license_url);
  const credit = String(picture.credit || 'Unknown author');
  return (
    <li className={styles.item}>
      {image ? <img src={image} alt="" className={styles.thumb} loading="lazy" /> : <span className={styles.thumb} aria-hidden="true" />}
      <div className={styles.text}>
        <h3 className={styles.itemTitle}>{picture.title}</h3>
        {picture.used_on && <p className={styles.usedOn}>{picture.used_on}</p>}
        <p className={styles.credit}>
          {licence ? (
            <>
              {credit.replace(/, via Wikimedia Commons$/, '')}
              {' '}(<a href={licence} target="_blank" rel="noopener noreferrer">licence</a>)
            </>
          ) : credit}
        </p>
        {source && (
          <a className={styles.sourceLink} href={source} target="_blank" rel="noopener noreferrer">
            View on Wikimedia Commons <FaExternalLinkAlt aria-hidden="true" />
          </a>
        )}
      </div>
    </li>
  );
};

const PictureCredits = ({ isDarkMode, apiString }) => {
  const headerImage = isDarkMode ? '/images/header-image-dark.png' : '/images/header-image.png';
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [pictures, setPictures] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    picturesApi.credits(apiString)
      .then((list) => { if (!cancelled) { setPictures(list); setStatus('ready'); } })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, [apiString, reloadKey]);

  const groups = useMemo(
    () => GROUPS.map((g) => ({ ...g, items: pictures.filter(g.test) })).filter((g) => g.items.length),
    [pictures]
  );

  return (
    <div className={styles.page}>
      <PageHero
        image={headerImage}
        title="Picture credits"
        subtitle="The photographers and artists whose work you see on Virsaa."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Picture credits' }]}
      />

      <main className={styles.layout}>
        <section className={styles.intro} aria-label="About these pictures">
          <p>
            The photos and paintings on Virsaa come from{' '}
            <a href="https://commons.wikimedia.org/" target="_blank" rel="noopener noreferrer">Wikimedia Commons</a>,
            where photographers, museums and libraries share their work under free licences. Each picture below
            names who made it, its licence and its page on Commons. Thank you to all of them.
          </p>
          <p>
            Audiobooks play from YouTube in YouTube’s own player; each audiobook page names the channel that
            published the recording. Questions about a picture? <Link to="/about">Contact us</Link>.
          </p>
        </section>

        {status === 'loading' && (
          <ul className={styles.list} aria-hidden="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className={styles.item}>
                <span className={`${styles.thumb} ${styles.skeleton}`} />
                <div className={styles.text}>
                  <span className={`${styles.skeleton} ${styles.skeletonLine}`} />
                  <span className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonShort}`} />
                </div>
              </li>
            ))}
          </ul>
        )}

        {status === 'error' && (
          <div className={styles.notice} role="alert">
            <p>The credits couldn’t be loaded right now.</p>
            <button type="button" className={styles.retry} onClick={() => setReloadKey((k) => k + 1)}>
              <FaRedo aria-hidden="true" /> Try again
            </button>
          </div>
        )}

        {status === 'ready' && groups.length === 0 && (
          <p className={styles.notice}>The pictures haven’t been added yet.</p>
        )}

        {status === 'ready' && groups.map((group) => (
          <section key={group.id} className={styles.group} aria-labelledby={`credits-${group.id}`}>
            <h2 id={`credits-${group.id}`} className={styles.groupTitle}>
              {group.title} <span className={styles.count}>{group.items.length}</span>
            </h2>
            <ul className={styles.list}>
              {group.items.map((picture, i) => <Credit key={`${picture.source_url}-${i}`} picture={picture} />)}
            </ul>
          </section>
        ))}
      </main>
    </div>
  );
};

export default PictureCredits;
