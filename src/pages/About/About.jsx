/**
 * pages/About/About.jsx
 * -----------------------------------------------------------------------------
 * The About page (/about): Virsaa's story and timeline, mission and community,
 * values, team, digitisation work and a call to action.
 *
 * The words come from the database (Django admin > Site pages > About, served
 * by /api/site/pages/about/); each section's key says where it goes: story,
 * mission, community, values, team, digitization, join. Timeline, values and
 * team are bullet points written "**Title**: text". The design stays here.
 * -----------------------------------------------------------------------------
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
 FaRocket, FaCode, FaBook, FaGlobeAmericas, FaHeart, FaSearch, FaHandshake,
  FaLightbulb, FaBookOpen, FaSeedling, FaPalette, FaLock,
} from 'react-icons/fa';
import PageHero from '../../components/PageHero/PageHero';
import { SitePicture } from '../../components/SitePicture/SitePicture';
import Avatar from '../../components/Avatar/Avatar';
import RichText, { parseBlocks, renderInline, titledItem } from '../../components/RichText/RichText';
import Loader from '../../components/VirsaaLoader/Loader';
import siteApi from '../../api/siteApi';
import { devError } from '../../utils/devLog';
import styles from './About.module.css';

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


// Icons for the timeline and the values, in order (they repeat if more are added in the admin)
const TIMELINE_ICONS = [<FaLightbulb />, <FaCode />, <FaRocket />];
const VALUE_ICONS = [
  <FaBook />, <FaGlobeAmericas />, <FaHeart />, <FaSearch />, <FaHandshake />,
  <FaLightbulb />, <FaBookOpen />, <FaSeedling />, <FaPalette />, <FaLock />,
];

/** A section's opening paragraph (its lede) and its bullet points as {title, text}. */
const splitSection = (section) => {
  const blocks = parseBlocks(section?.body);
  const lede = blocks.find((b) => b.type === 'p')?.text || '';
  const items = blocks.filter((b) => b.type === 'ul').flatMap((b) => b.items).map(titledItem);
  return { lede, items };
};

const About = ({ isDarkMode, apiString }) => {
  // The header picture is in public/images; the others are real photos from S3 (SitePicture)
  const getImagePath = useProductionImagePath();
  const headerDark = '/images/header-image-dark.png';
  const headerLight = '/images/header-image.png';

  const navigate = useNavigate();
  const headerImage = isDarkMode ? headerDark : headerLight;

  // The words, from the database
  const [page, setPage] = useState(null);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    siteApi.page(apiString, 'about')
      .then((data) => { if (!cancelled) setPage(data); })
      .catch((err) => {
        devError('About page failed to load:', err.response?.status || err.message);
        if (!cancelled) setFailed(true);
      });
    return () => { cancelled = true; };
  }, [apiString, reloadKey]);

  const section = useMemo(() => {
    const byKey = {};
    (page?.sections || []).forEach((s) => { byKey[s.key] = s; });
    return byKey;
  }, [page]);
  const story = splitSection(section.story);
  const values = splitSection(section.values);
  const team = splitSection(section.team);

  return (
    <div className={styles.page}>
      <PageHero
        image={getImagePath(headerImage)}
        title={page?.title || 'About Virsaa'}
        subtitle={page?.summary || ''}
        crumbs={[{ label: 'Home', to: '/' }, { label: 'About' }]}
      />

      {failed && (
        <section className={styles.section} role="alert">
          <p className={styles.lede}>This page couldn’t be loaded. Check your connection and try again.</p>
          <button type="button" className={styles.ctaButton} onClick={() => setReloadKey((k) => k + 1)}>Try again</button>
        </section>
      )}
      {!page && !failed && <Loader />}

      {page && (
        <>
          {/* ---------- Story ---------- */}
          {section.story && (
            <section className={styles.section} aria-labelledby="story-title">
              <div className={styles.storyLayout}>
                <div className={styles.storyIntro}>
                  <h2 id="story-title" className={styles.sectionTitle}>{section.story.title}</h2>
                  {story.lede && <p className={styles.lede}>{renderInline(story.lede, 'story')}</p>}
                </div>
                <ol className={styles.timeline}>
                  {story.items.map((item, index) => (
                    <li key={`${item.title}-${index}`} className={styles.timelineItem}>
                      <span className={styles.timelineIcon} aria-hidden="true">{TIMELINE_ICONS[index % TIMELINE_ICONS.length]}</span>
                      <div className={styles.timelineCard}>
                        {item.title && <h3 className={styles.timelineYear}>{item.title}</h3>}
                        <p>{renderInline(item.text, `t${index}`)}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </section>
          )}

          {/* ---------- Mission + Community ---------- */}
          {(section.mission || section.community) && (
            <section className={styles.section} aria-label={[section.mission?.title, section.community?.title].filter(Boolean).join(' and ')}>
              <div className={styles.pillars}>
                {['mission', 'community'].filter((key) => section[key]).map((key) => (
                  <article key={key} className={styles.pillar}>
                    <SitePicture name={`about-${key}`} alt="" className={styles.pillarImage} />
                    <div className={styles.pillarGlass}>
                      <h2 className={styles.pillarTitle}>{section[key].title}</h2>
                      <RichText text={section[key].body} />
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* ---------- Values ---------- */}
          {section.values && (
            <section className={styles.section} aria-labelledby="values-title">
              <h2 id="values-title" className={styles.sectionTitle}>{section.values.title}</h2>
              {values.lede && <p className={styles.lede}>{renderInline(values.lede, 'values')}</p>}
              <ul className={styles.valuesGrid}>
                {values.items.map((value, index) => (
                  <li key={`${value.title}-${index}`} className={styles.valueItem}>
                    <span className={styles.valueIcon} aria-hidden="true">{VALUE_ICONS[index % VALUE_ICONS.length]}</span>
                    {value.title && <h3 className={styles.valueTitle}>{value.title}</h3>}
                    <p className={styles.valueDescription}>{renderInline(value.text, `v${index}`)}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ---------- Team ---------- */}
          {section.team && (
            <section className={styles.section} aria-labelledby="team-title">
              <h2 id="team-title" className={styles.sectionTitle}>{section.team.title}</h2>
              {team.lede && <p className={styles.lede}>{renderInline(team.lede, 'team')}</p>}
              <ul className={styles.teamGrid}>
                {team.items.map((member, index) => {
                  // "Founder and developer. Designed and built…": the first sentence is the role
                  const match = member.text.match(/^([^.]+)\.\s+(.+)$/);
                  const role = match ? match[1] : member.text.replace(/\.$/, '');
                  const bio = match ? match[2] : '';
                  return (
                    <li key={`${member.title}-${index}`} className={styles.teamMember}>
                      <span className={styles.memberFrame}>
                        <Avatar name={member.title} className={styles.memberImage} loading="lazy" />
                      </span>
                      <h3 className={styles.memberName}>{member.title}</h3>
                      <p className={styles.memberRole}>{role}</p>
                      {bio && <p className={styles.memberBio}>{renderInline(bio, `m${index}`)}</p>}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* ---------- Digitization ---------- */}
          {section.digitization && (
            <section className={styles.section} aria-labelledby="digit-title">
              <div className={styles.digitization}>
                <div className={styles.digitImageWrap}>
                  <SitePicture name="about-digitization" className={styles.digitImage} />
                </div>
                <div className={styles.digitText}>
                  <h2 id="digit-title" className={styles.sectionTitle}>{section.digitization.title}</h2>
                  <RichText text={section.digitization.body} />
                </div>
              </div>
            </section>
          )}

          {/* ---------- CTA ---------- */}
          <section className={styles.section}>
            <div className={styles.cta}>
              <div>
                <h2 className={styles.ctaTitle}>{section.join?.title || 'Join us in preserving heritage'}</h2>
                {section.join?.body && <RichText text={section.join.body} className={styles.ctaText} />}
              </div>
              <button type="button" className={styles.ctaButton} onClick={() => navigate('/collections/ebooks')}>
                Explore collections
              </button>
            </div>
            {/* The photos' licences ask for credit */}
            <p className={styles.credits}><Link to="/picture-credits">Picture credits</Link></p>
          </section>
        </>
      )}
    </div>
  );
};

export default About;
