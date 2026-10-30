/**
 * pages/GurdwaraAccess/GurdwaraHistory/GurdwaraHistory.jsx
 * -----------------------------------------------------------------------------
 * History of one Gurdwara (/gurdwara-access/history/:id), any Gurdwara in the
 * world, opened from the Gurdwara finder and its directions page. The id is
 * the Gurdwara's Google Maps place ID (hooks/useGurdwara).
 *
 * The history is loaded live from Wikipedia through our server
 * (hooks/useGurdwaraHistory → /collections/gurdwara-history/), so it comes
 * from a public article that cites its sources:
 *   - a photo of the Gurdwara (Wikipedia's, or a freely licensed one from
 *     Wikimedia Commons, linked to the photo's own page, which names its
 *     author and licence; or else one from Google Maps, with its author)
 *   - the article's introduction and main sections
 *   - the credit the CC BY-SA licence asks for, and a link to the full article
 * Beside it: address, phone, website and opening hours from Google Maps
 * (credited, as Google asks when there's no map), directions and services.
 *
 * While loading, grey lines stand in for the text. When Wikipedia has no
 * article, the page says so (with a photo when Commons has one) and links to
 * the Gurdwara's website and a Wikipedia search; when it can't be reached,
 * there's a "Try again" button. An unknown id shows "not found" with a way
 * back to the finder.
 * -----------------------------------------------------------------------------
 */
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FaMapMarkerAlt, FaPhoneAlt, FaGlobe, FaMapMarkedAlt, FaHandsHelping, FaExternalLinkAlt, FaRedo, FaArrowLeft,
  FaClock,
} from 'react-icons/fa';
import PageHero from '../../../components/PageHero/PageHero';
import useGurdwara from '../../../hooks/useGurdwara';
import useGurdwaraHistory from '../../../hooks/useGurdwaraHistory';
import { safeExternalUrl } from '../../../utils/safeUrl';
import { gurdwaraLink, placeLabel } from '../gurdwaras';
import WikipediaCredit from '../WikipediaCredit';
import styles from './GurdwaraHistory.module.css';

const HEADER_LIGHT = '/images/header-image.png';
const HEADER_DARK = '/images/header-image-dark.png';

// Section headings become anchors: "Early history" -> "early-history-0"
const anchor = (text, index) => `${String(text || 'section').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${index}`;

// Only lists of non-empty strings are shown
const textList = (value) => (Array.isArray(value) ? value.filter((p) => typeof p === 'string' && p.trim()) : []);

// "gurdwara in Southall" -> "Gurdwara in Southall."
const sentence = (text) => {
  const t = String(text || '').trim();
  return t ? `${t[0].toUpperCase()}${t.slice(1)}${/[.!?]$/.test(t) ? '' : '.'}` : '';
};

// Props: isDarkMode, apiString (API base URL)
const GurdwaraHistory = ({ isDarkMode, apiString }) => {
  const { id } = useParams();
  const place = useGurdwara(id, { contact: true });
  const gurdwara = place.gurdwara;
  const history = useGurdwaraHistory(apiString, gurdwara);
  const headerImage = isDarkMode ? HEADER_DARK : HEADER_LIGHT;
  const finderCrumbs = [{ label: 'Home', to: '/' }, { label: 'Gurdwara Access', to: '/gurdwara-access' }];

  // ---------------------------------------------------------------- loading / unknown Gurdwara
  if (!gurdwara) {
    const missing = place.status === 'missing';
    return (
      <div className={styles.page}>
        <PageHero
          compact
          image={headerImage}
          title={missing ? 'Gurdwara not found' : 'Gurdwara history'}
          crumbs={[...finderCrumbs, { label: 'History' }]}
        />
        <section className={styles.section}>
          {place.status === 'loading' && (
            <div className={styles.skeleton} role="status" aria-label="Loading the Gurdwara">
              <span className={styles.skeletonPhoto} />
              <span /><span /><span className={styles.skeletonShort} />
            </div>
          )}
          {place.status !== 'loading' && (
            <div className={styles.notice} role={place.status === 'error' ? 'alert' : undefined}>
              <p>{missing ? 'We couldn’t find that Gurdwara. The link may be out of date.' : place.error}</p>
              <div className={styles.actions}>
                {place.status === 'error' && (
                  <button type="button" className={styles.secondaryButton} onClick={place.retry}>
                    <FaRedo aria-hidden="true" /> Try again
                  </button>
                )}
                <Link to="/gurdwara-access" className={styles.primaryButton}>
                  <FaArrowLeft aria-hidden="true" /> Find a Gurdwara
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    );
  }

  const answer = history.status === 'found' || history.status === 'missing' ? history.data : null;
  const data = history.status === 'found' ? history.data : null;
  const summary = textList(data?.summary);
  const sections = (Array.isArray(data?.sections) ? data.sections : [])
    .map((s) => ({ heading: String(s?.heading || ''), paragraphs: textList(s?.paragraphs) }))
    .filter((s) => s.paragraphs.length);
  // The photo: Wikipedia's or Wikimedia Commons' (free), or else Google Maps' (once the history has answered)
  const freePhoto = safeExternalUrl(answer?.image);
  const googlePhoto = !freePhoto && history.status !== 'loading' ? safeExternalUrl(gurdwara.photo?.url) : '';
  const photoPage = safeExternalUrl(answer?.image_page);
  const photoCredit = answer?.image_credit ? `Photo: ${answer.image_credit}` : 'Photo: Wikipedia';
  const googleCredit = String(gurdwara.photo?.credit || '');
  const googleCreditUrl = safeExternalUrl(gurdwara.photo?.credit_url);
  const articleUrl = safeExternalUrl(data?.url);
  const website = safeExternalUrl(gurdwara.website);
  const searchUrl = safeExternalUrl(history.data?.search_url);
  const googleUrl = safeExternalUrl(gurdwara.google_url);
  const where = placeLabel(gurdwara);
  const week = Array.isArray(gurdwara.hours_week) ? gurdwara.hours_week.filter((d) => typeof d === 'string') : [];

  return (
    <div className={styles.page}>
      <PageHero
        compact
        image={headerImage}
        title={`History of ${gurdwara.name}`}
        subtitle={where}
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

            {freePhoto && (
              <figure className={styles.photo}>
                <img src={freePhoto} alt={data?.title || gurdwara.name} />
                {photoPage && (
                  <figcaption>
                    <a href={photoPage} target="_blank" rel="noopener noreferrer">{photoCredit}</a>
                  </figcaption>
                )}
              </figure>
            )}
            {googlePhoto && (
              <figure className={styles.photo}>
                <img src={googlePhoto} alt={gurdwara.name} />
                <figcaption>
                  Photo{googleCredit ? ': ' : ' '}
                  {googleCredit && googleCreditUrl ? (
                    <a href={googleCreditUrl} target="_blank" rel="noopener noreferrer">{googleCredit}</a>
                  ) : googleCredit}
                  {googleCredit ? ', ' : ''}from Google Maps
                </figcaption>
              </figure>
            )}

            {data && (
              <>
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
                {sentence(history.data?.description) && <p>{sentence(history.data.description)}</p>}
                <p>
                  Wikipedia doesn’t have an article about {gurdwara.name} yet, so there’s no history to show here.
                  {website ? ' The Gurdwara’s own website is the best place to learn about it.' : ''}
                </p>
                <div className={styles.actions}>
                  {website && (
                    <a href={website} className={styles.primaryButton} target="_blank" rel="noopener noreferrer">
                      <FaGlobe aria-hidden="true" /> Visit its website
                    </a>
                  )}
                  {!website && googleUrl && (
                    <a href={googleUrl} className={styles.primaryButton} target="_blank" rel="noopener noreferrer">
                      <FaGlobe aria-hidden="true" /> See it on Google Maps
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
              {where && (
                <div className={styles.fact}>
                  <dt><FaMapMarkerAlt aria-hidden="true" /> Address</dt>
                  <dd>{where}</dd>
                </div>
              )}
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
              {(gurdwara.opening_hours || week.length > 0) && (
                <div className={styles.fact}>
                  <dt><FaClock aria-hidden="true" /> Open</dt>
                  {gurdwara.opening_hours
                    ? <dd>{gurdwara.opening_hours}</dd>
                    : <dd><ul className={styles.week}>{week.map((day) => <li key={day}>{day}</li>)}</ul></dd>}
                </div>
              )}
            </dl>
            <div className={styles.infoActions}>
              <Link to={gurdwaraLink('locate', gurdwara, place.origin)} className={styles.primaryButton}>
                <FaMapMarkedAlt aria-hidden="true" /> Get directions
              </Link>
              <Link to={gurdwaraLink('services', gurdwara, place.origin)} className={styles.secondaryButton}>
                <FaHandsHelping aria-hidden="true" /> Services
              </Link>
            </div>
            <p className={styles.credit}>
              Details from {googleUrl
                ? <a href={googleUrl} target="_blank" rel="noopener noreferrer">Google Maps</a>
                : 'Google Maps'}. Something wrong? You can suggest an edit there.
            </p>
          </aside>
        </div>
      </section>
    </div>
  );
};

export default GurdwaraHistory;
