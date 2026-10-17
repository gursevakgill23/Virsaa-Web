/**
 * pages/About/About.jsx
 * -----------------------------------------------------------------------------
 * The About page (/about): Virsaa's story and timeline, mission and community,
 * values, team, digitisation work and a call to action. Static content only,
 * no API calls.
 * -----------------------------------------------------------------------------
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaCalendarAlt, FaRocket, FaStar, FaBook, FaGlobeAmericas, FaHeart, FaSearch, FaHandshake,
  FaLightbulb, FaBookOpen, FaSeedling, FaPalette, FaLock,
} from 'react-icons/fa';
import PageHero from '../../components/PageHero/PageHero';
import { SitePicture } from '../../components/SitePicture/SitePicture';
import Avatar from '../../components/Avatar/Avatar';
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

// Milestones shown in the story section
const TIMELINE = [
  {
    icon: <FaCalendarAlt />,
    year: '2015',
    text: 'Founded with a vision to digitize Punjabi literature and history, we began our journey with a small team of passionate individuals.',
  },
  {
    icon: <FaRocket />,
    year: '2018',
    text: 'Launched our first collection of ebooks and audiobooks, making Punjabi literature accessible to a global audience.',
  },
  {
    icon: <FaStar />,
    year: '2023',
    text: 'Reached over 1 million users worldwide, and expanded our collection to include rare manuscripts, historical documents, and multimedia resources.',
  },
];

// Cards in the values grid
const VALUES = [
  { icon: <FaBook />, title: 'Preservation', description: 'We are committed to preserving Punjabi and Sikh heritage through digitization and archiving.' },
  { icon: <FaGlobeAmericas />, title: 'Accessibility', description: 'Making heritage accessible to everyone, everywhere, regardless of language or location.' },
  { icon: <FaHeart />, title: 'Community', description: 'Building a global community of heritage enthusiasts who share our passion for cultural preservation.' },
  { icon: <FaSearch />, title: 'Research', description: 'Conducting in-depth research to uncover and document rare and forgotten aspects of Punjabi history.' },
  { icon: <FaHandshake />, title: 'Collaboration', description: 'Partnering with institutions, scholars, and communities to achieve our goals.' },
  { icon: <FaLightbulb />, title: 'Innovation', description: 'Using cutting-edge technology to enhance the accessibility and preservation of heritage.' },
  { icon: <FaBookOpen />, title: 'Education', description: 'Promoting education and awareness about Punjabi and Sikh heritage through workshops and resources.' },
  { icon: <FaSeedling />, title: 'Sustainability', description: 'Ensuring our efforts are sustainable and benefit future generations.' },
  { icon: <FaPalette />, title: 'Creativity', description: 'Encouraging creative expression to celebrate and share our cultural heritage.' },
  { icon: <FaLock />, title: 'Integrity', description: 'Maintaining the highest standards of integrity in all our work.' },
];

const About = ({ isDarkMode }) => {
  // The header picture is in public/images; the others are real photos from S3 (SitePicture)
  const getImagePath = useProductionImagePath();
  const headerDark = '/images/header-image-dark.png';
  const headerLight = '/images/header-image.png';

  const navigate = useNavigate();
  const headerImage = isDarkMode ? headerDark : headerLight;

  // Team cards (replace with the real team when ready). Add `photo: 'https://…'` to show a
  // photo; without one, the person's initials are shown.
  const team = [
    { name: 'John Doe', role: 'Founder & CEO' },
    { name: 'Jane Smith', role: 'Content Curator' },
    { name: 'Gursevak Singh', role: 'Developer' },
    { name: 'Navjot Singh', role: 'Community Manager' },
  ];

  return (
    <div className={styles.page}>
      <PageHero
        image={getImagePath(headerImage)}
        title="Preserving Heritage, Inspiring Futures"
        subtitle="Discover the story behind our mission to preserve and share the rich heritage of Sikhism and Punjab."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'About' }]}
      />

      {/* ---------- Story ---------- */}
      <section className={styles.section} aria-labelledby="story-title">
        <div className={styles.storyLayout}>
          <div className={styles.storyIntro}>
            <h2 id="story-title" className={styles.sectionTitle}>Our story</h2>
            <p className={styles.lede}>
              From a small team with a big idea to a library read around the world.
            </p>
          </div>
          <ol className={styles.timeline}>
            {TIMELINE.map((item) => (
              <li key={item.year} className={styles.timelineItem}>
                <span className={styles.timelineIcon} aria-hidden="true">{item.icon}</span>
                <div className={styles.timelineCard}>
                  <h3 className={styles.timelineYear}>{item.year}</h3>
                  <p>{item.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Mission + Community ---------- */}
      <section className={styles.section} aria-label="Mission and community">
        <div className={styles.pillars}>
          <article className={styles.pillar}>
            <SitePicture name="about-mission" alt="" className={styles.pillarImage} />
            <div className={styles.pillarGlass}>
              <h2 className={styles.pillarTitle}>Our mission</h2>
              <p>
                Our mission is to preserve the rich cultural and historical heritage of Sikhism and Punjab by digitizing rare texts, manuscripts, and artifacts. We aim to make these resources accessible to everyone, ensuring that future generations can learn from and appreciate this invaluable legacy.
              </p>
            </div>
          </article>
          <article className={styles.pillar}>
            <SitePicture name="about-community" alt="" className={styles.pillarImage} />
            <div className={styles.pillarGlass}>
              <h2 className={styles.pillarTitle}>Our community</h2>
              <p>
                Our community is at the heart of everything we do. From scholars and researchers to casual readers and history enthusiasts, we bring together people from all walks of life who share a common love for Punjabi and Sikh heritage. Join us in our mission to preserve and celebrate this rich cultural legacy.
              </p>
            </div>
          </article>
        </div>
      </section>

      {/* ---------- Values ---------- */}
      <section className={styles.section} aria-labelledby="values-title">
        <h2 id="values-title" className={styles.sectionTitle}>Our values</h2>
        <p className={styles.lede}>The principles behind every book we digitize and every feature we build.</p>
        <ul className={styles.valuesGrid}>
          {VALUES.map((value) => (
            <li key={value.title} className={styles.valueItem}>
              <span className={styles.valueIcon} aria-hidden="true">{value.icon}</span>
              <h3 className={styles.valueTitle}>{value.title}</h3>
              <p className={styles.valueDescription}>{value.description}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- Team ---------- */}
      <section className={styles.section} aria-labelledby="team-title">
        <h2 id="team-title" className={styles.sectionTitle}>Meet the team</h2>
        <ul className={styles.teamGrid}>
          {team.map((member) => (
            <li key={member.name} className={styles.teamMember}>
              <span className={styles.memberFrame}>
                <Avatar src={member.photo} name={member.name} className={styles.memberImage} loading="lazy" />
              </span>
              <h3 className={styles.memberName}>{member.name}</h3>
              <p className={styles.memberRole}>{member.role}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- Digitization ---------- */}
      <section className={styles.section} aria-labelledby="digit-title">
        <div className={styles.digitization}>
          <div className={styles.digitImageWrap}>
            <SitePicture name="about-digitization" className={styles.digitImage} />
          </div>
          <div className={styles.digitText}>
            <h2 id="digit-title" className={styles.sectionTitle}>Our digitization process</h2>
            <p>
              Our digitization process involves scanning, transcribing, and archiving rare manuscripts, books, and documents. We use state-of-the-art technology to ensure that these resources are preserved in high quality and made accessible to the public. Our team works tirelessly to ensure that every detail is captured accurately.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className={styles.section}>
        <div className={styles.cta}>
          <h2 className={styles.ctaTitle}>Join us in preserving heritage</h2>
          <button type="button" className={styles.ctaButton} onClick={() => navigate('/collections/ebooks')}>
            Explore collections
          </button>
        </div>
      </section>
    </div>
  );
};

export default About;
