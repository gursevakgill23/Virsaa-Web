/**
 * pages/GurdwaraAccess/GurdwaraHistory/GurdwaraHistory.jsx
 * -----------------------------------------------------------------------------
 * History of one Gurdwara (/gurdwara-access/history/:id), opened from the
 * Gurdwara finder and the directions page.
 *
 * The history is loaded live from Wikipedia through our server
 * (hooks/useGurdwaraHistory → /collections/gurdwara-history/), so it comes
 * from a public article that cites its sources:
 *   - Wikipedia's photo of the Gurdwara (linked to the photo's own page,
 *     which names its author and licence)
 *   - the article's introduction and main sections
 *   - the credit the CC BY-SA licence asks for, and a link to the full article
 * Beside it: address, phone, website, directions and services.
 *
 * While loading, grey lines stand in for the text. When Wikipedia has no
 * article, the page says so and links to the Gurdwara's website and a
 * Wikipedia search; when it can't be reached, there's a "Try again" button.
 * An unknown id shows "not found" with a way back to the finder.
 * -----------------------------------------------------------------------------
 */
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FaMapMarkerAlt, FaPhoneAlt, FaGlobe, FaMapMarkedAlt, FaHandsHelping, FaExternalLinkAlt, FaRedo, FaArrowLeft,
} from 'react-icons/fa';
import PageHero from '../../../components/PageHero/PageHero';
import useGurdwaraHistory from '../../../hooks/useGurdwaraHistory';
import { safeExternalUrl } from '../../../utils/safeUrl';
import { findGurdwara } from '../gurdwaras';
import WikipediaCredit from '../WikipediaCredit';
import styles from './GurdwaraHistory.module.css';

const HEADER_LIGHT = '/images/header-image.png';
const HEADER_DARK = '/images/header-image-dark.png';

// Section headings become anchors: "Early history" -> "early-history-0"
const anchor = (text, index) => `${String(text || 'section').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${index}`;

// Only lists of non-empty strings are shown
const textList = (value) => (Array.isArray(value) ? value.filter((p) => typeof p === 'string' && p.trim()) : []);

// Props: isDarkMode, apiString (API base URL)
const GurdwaraHistory = ({ isDarkMode, apiString }) => {
  const { id } = useParams();
  const gurdwara = findGurdwara(id);
  const history = useGurdwaraHistory(apiString, gurdwara);
  const headerImage = isDarkMode ? HEADER_DARK : HEADER_LIGHT;
  const finderCrumbs = [{ label: 'Home', to: '/' }, { label: 'Gurdwara Access', to: '/gurdwara-access' }];

  // ---------------------------------------------------------------- unknown Gurdwara
  if (!gurdwara) {
    return (
      <div className={styles.page}>
        <PageHero compact image={headerImage} title="Gurdwara not found" crumbs={[...finderCrumbs, { label: 'History' }]} />
        <section className={styles.section}>
          <div className={styles.notice}>
            <p>We couldn’t find that Gurdwara. The link may be out of date.</p>
            <Link to="/gurdwara-access" className={styles.primaryButton}>
              <FaArrowLeft aria-hidden="true" /> Find a Gurdwara
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const data = history.status === 'found' ? history.data : null;
  const summary = textList(data?.summary);
  const sections = (Array.isArray(data?.sections) ? data.sections : [])
    .map((s) => ({ heading: String(s?.heading || ''), paragraphs: textList(s?.paragraphs) }))
    .filter((s) => s.paragraphs.length);
  const photo = safeExternalUrl(data?.image);
  const photoPage = safeExternalUrl(data?.image_page);
  const articleUrl = safeExternalUrl(data?.url);
  const website = safeExternalUrl(gurdwara.website);
  const searchUrl = safeExternalUrl(history.data?.search_url);

  return (
    <div className={styles.page}>
      <PageHero
        compact
        image={headerImage}
        title={`History of ${gurdwara.name}`}
        subtitle={gurdwara.address}
        crumbs={[...finderCrumbs, { label: `History of ${gurdwara.name}` }]}
      />

      <section className={styles.section}>
        <div className={styles.layout}>
          {/* ---------- The history ---------- */}
          <article className={styles.article} aria-busy={history.status === 'loading'} aria-labelledby="history-heading">
            <h2 id="history-heading" className={styles.srOnly}>History</h2>

            {history.status === 'loading' && (
              <div className={styles.skeleton} role="status" aria-label="Loading the history from Wikipedia">
                <span className={styles.skeletonPhoto} />
                <span /><span /><span /><span className={styles.skeletonShort} />
              </div>
            )}

            {data && (
              <>
                {photo && (
                  <figure className={styles.photo}>
                    <img src={photo} alt={data.title || gurdwara.name} />
                    {photoPage && (
                      <figcaption>
                        <a href={photoPage} target="_blank" rel="noopener noreferrer">Photo: Wikipedia</a>
                      </figcaption>
                    )}
                  </figure>
                )}

                {summary.map((p, i) => (
                  <p key={`intro-${i}`} className={i === 0 ? styles.lead : undefined}>{p}</p>
                ))}

                {sections.map((s, i) => (
                  <section key={anchor(s.heading, i)} id={anchor(s.heading, i)} className={styles.articleSection}>
                    {s.heading && <h3>{s.heading}</h3>}
                    {s.paragraphs.map((p, j) => <p key={j}>{p}</p>)}
                  </section>
                ))}

                <footer className={styles.articleFoot}>
                  <WikipediaCredit data={data} className={styles.credit} />
                  {articleUrl && (
                    <a href={articleUrl} className={styles.secondaryButton} target="_blank" rel="noopener noreferrer">
                      Read the full article on Wikipedia <FaExternalLinkAlt aria-hidden="true" />
                    </a>
                  )}
                </footer>
              </>
            )}

            {history.status === 'missing' && (
              <div className={styles.notice}>
                <p>
                  Wikipedia doesn’t have an article about {gurdwara.name} yet, so there’s no history to show here.
                  The Gurdwara’s own website is the best place to learn about it.
                </p>
                <div className={styles.actions}>
                  {website && (
                    <a href={website} className={styles.primaryButton} target="_blank" rel="noopener noreferrer">
                      <FaGlobe aria-hidden="true" /> Visit its website
                    </a>
                  )}
                  {searchUrl && (
                    <a href={searchUrl} className={styles.secondaryButton} target="_blank" rel="noopener noreferrer">
                      Search Wikipedia
                    </a>
                  )}
                </div>
              </div>
            )}

            {history.status === 'error' && (
              <div className={styles.notice} role="alert">
                <p>{history.error}</p>
                <button type="button" className={styles.secondaryButton} onClick={history.retry}>
                  <FaRedo aria-hidden="true" /> Try again
                </button>
              </div>
            )}
          </article>

          {/* ---------- Visiting details ---------- */}
          <aside className={styles.infoCard} aria-label="Visit">
            <h2 className={styles.infoTitle}>{gurdwara.name}</h2>
            <dl className={styles.facts}>
              <div className={styles.fact}>
                <dt><FaMapMarkerAlt aria-hidden="true" /> Address</dt>
                <dd>{gurdwara.address}</dd>
              </div>
              {gurdwara.phone && (
                <div className={styles.fact}>
                  <dt><FaPhoneAlt aria-hidden="true" /> Phone</dt>
                  <dd><a href={`tel:${gurdwara.phone.replace(/[^\d+]/g, '')}`}>{gurdwara.phone}</a></dd>
                </div>
              )}
              {website && (
                <div className={styles.fact}>
                  <dt><FaGlobe aria-hidden="true" /> Website</dt>
                  <dd><a href={website} target="_blank" rel="noopener noreferrer">{website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</a></dd>
                </div>
              )}
            </dl>
            <div className={styles.infoActions}>
              <Link to={`/gurdwara-access/locate/${gurdwara.id}`} className={styles.primaryButton}>
                <FaMapMarkedAlt aria-hidden="true" /> Get directions
              </Link>
              <Link to={`/gurdwara-access/services/${gurdwara.id}`} className={styles.secondaryButton}>
                <FaHandsHelping aria-hidden="true" /> Services
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
};

export default GurdwaraHistory;
