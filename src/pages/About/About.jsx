import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './About.module.css';
const useProductionImagePath = () => {
  
  return (imagePath) => {
    // Only modify in production
    if (process.env.NODE_ENV === 'production') {
      // Handle both imported images and public folder images
      if (typeof imagePath === 'string') {
        // For public folder images
        return imagePath.startsWith('/') 
          ? imagePath 
          : `/${imagePath.replace(/.*static\/media/, 'static/media')}`;
      } else {
        // For imported images
        return imagePath.default || imagePath;
      }
    }
    return imagePath;
  };
};
const About = ({ isDarkMode }) => {
  const getImagePath = useProductionImagePath();
  const teamMember = '../../images/About/team-member.jpg';
  const headerDark = '../../images/header-image-dark.png';
  const headerLight = '../../images/header-image.jpg';
  const heritageImage = '../../images/About/heritage.jpg';
  const communityImage = '../../images/About/community.jpg';
  const digitizationImage = '../../images/About/digitization.jpg';

  const navigate = useNavigate();

  // Dynamic header image based on theme
  const headerImage = isDarkMode
    ? headerDark
    : headerLight;

  // Function to navigate to collections
  const goToCollections = () => {
    navigate('/collections/ebooks');
  };

  return (
    <div className={styles.aboutContainer}>
      {/* Hero Section */}
      <section
        className={styles.heroSection}
        style={{ backgroundImage: `url(${headerImage})` }}
      >
        <div className={styles.heroOverlay}>
          <h1 className={styles.heroTagline}>Preserving Heritage, Inspiring Futures</h1>
          <p className={styles.heroDescription}>
            Discover the story behind our mission to preserve and share the rich heritage of Sikhism and Punjab.
          </p>
        </div>
      </section>
      {/* Breadcrumb Section */}
      <div className={styles.breadcrumb}>
        <Link to={'/'}><span>Home</span></Link> / 
        <Link to={'/about'}><span> About</span></Link>
      </div>


      {/* Story Section */}
      <section className={`${styles.storySection} ${styles.appearAnimation}`}>
        <h2 className={styles.sectionTitle}>Our Story</h2>
        <div className={styles.timeline}>
          <div className={styles.timelineItem}>
            <div className={styles.timelineIcon}>📅</div>
            <div className={styles.timelineContent}>
              <h3>2015</h3>
              <p>Founded with a vision to digitize Punjabi literature and history, we began our journey with a small team of passionate individuals.</p>
            </div>
          </div>
          <div className={styles.timelineItem}>
            <div className={styles.timelineIcon}>🚀</div>
            <div className={styles.timelineContent}>
              <h3>2018</h3>
              <p>Launched our first collection of ebooks and audiobooks, making Punjabi literature accessible to a global audience.</p>
            </div>
          </div>
          <div className={styles.timelineItem}>
            <div className={styles.timelineIcon}>🌟</div>
            <div className={styles.timelineContent}>
              <h3>2023</h3>
              <p>Reached over 1 million users worldwide, and expanded our collection to include rare manuscripts, historical documents, and multimedia resources.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission and Community Sections Side by Side */}
      <section className={styles.missionCommunityContainer}>
        {/* Mission Section */}
        <div className={`${styles.missionSection} ${styles.appearAnimation}`}>
          <h2 className={styles.sectionTitle}>Our Mission</h2>
          <div className={styles.missionContent}>
            <img src={getImagePath(heritageImage)} alt="Heritage" className={styles.missionImage} />
            <div className={styles.missionText}>
              <p>
                Our mission is to preserve the rich cultural and historical heritage of Sikhism and Punjab by digitizing rare texts, manuscripts, and artifacts. We aim to make these resources accessible to everyone, ensuring that future generations can learn from and appreciate this invaluable legacy.
              </p>
            </div>
          </div>
        </div>

        {/* Community Section */}
        <div className={`${styles.communitySection} ${styles.appearAnimation}`}>
          <h2 className={styles.sectionTitle}>Our Community</h2>
          <div className={styles.communityContent}>
            <img src={getImagePath(communityImage)} alt="Community" className={styles.communityImage} />
            <div className={styles.communityText}>
              <p>
                Our community is at the heart of everything we do. From scholars and researchers to casual readers and history enthusiasts, we bring together people from all walks of life who share a common love for Punjabi and Sikh heritage. Join us in our mission to preserve and celebrate this rich cultural legacy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      {/* Values Section */}
      <section className={`${styles.valuesSection} ${styles.appearAnimation}`}>
        <h2 className={styles.sectionTitle}>Our Values</h2>
        <div className={styles.valuesGrid}>
          {[
            { icon: '📚', title: 'Preservation', description: 'We are committed to preserving Punjabi and Sikh heritage through digitization and archiving.' },
            { icon: '🌍', title: 'Accessibility', description: 'Making heritage accessible to everyone, everywhere, regardless of language or location.' },
            { icon: '❤️', title: 'Community', description: 'Building a global community of heritage enthusiasts who share our passion for cultural preservation.' },
            { icon: '🔍', title: 'Research', description: 'Conducting in-depth research to uncover and document rare and forgotten aspects of Punjabi history.' },
            { icon: '🤝', title: 'Collaboration', description: 'Partnering with institutions, scholars, and communities to achieve our goals.' },
            { icon: '💡', title: 'Innovation', description: 'Using cutting-edge technology to enhance the accessibility and preservation of heritage.' },
            { icon: '📖', title: 'Education', description: 'Promoting education and awareness about Punjabi and Sikh heritage through workshops and resources.' },
            { icon: '🌱', title: 'Sustainability', description: 'Ensuring our efforts are sustainable and benefit future generations.' },
            { icon: '🎨', title: 'Creativity', description: 'Encouraging creative expression to celebrate and share our cultural heritage.' },
            { icon: '🔒', title: 'Integrity', description: 'Maintaining the highest standards of integrity in all our work.' },
          ].map((value, index) => (
            <div key={index} className={styles.valueItem}>
              <div className={styles.valueIcon}>{value.icon}</div>
              <h3 className={styles.valueTitle}>{value.title}</h3>
              <p className={styles.valueDescription}>{value.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team Section */}
      <section className={`${styles.teamSection} ${styles.appearAnimation}`}>
        <h2 className={styles.sectionTitle}>Meet the Team</h2>
        <div className={styles.teamGrid}>
          {[
            { name: 'John Doe', role: 'Founder & CEO', image: teamMember },
            { name: 'Jane Smith', role: 'Content Curator', image: teamMember },
            { name: 'Gursevak Singh', role: 'Developer', image: teamMember },
            { name: 'Navjot Singh', role: 'Community Manager', image: teamMember },
          ].map((member, index) => (
            <div key={index} className={styles.teamMember}>
              <img src={getImagePath(member.image)} alt={member.name} className={styles.memberImage} />
              <h3 className={styles.memberName}>{member.name}</h3>
              <p className={styles.memberRole}>{member.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Digitization Section */}
      <section className={`${styles.digitizationSection} ${styles.appearAnimation}`}>
        <h2 className={styles.sectionTitle}>Our Digitization Process</h2>
        <div className={styles.digitizationContent}>
          <img src={getImagePath(digitizationImage)} alt="Digitization" className={styles.digitizationImage} />
          <div className={styles.digitizationText}>
            <p>
              Our digitization process involves scanning, transcribing, and archiving rare manuscripts, books, and documents. We use state-of-the-art technology to ensure that these resources are preserved in high quality and made accessible to the public. Our team works tirelessly to ensure that every detail is captured accurately.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`${styles.ctaSection} ${styles.appearAnimation}`}>
        <h2 className={styles.ctaTitle}>Join Us in Preserving Heritage</h2>
        <button className={styles.ctaButton} onClick={goToCollections}>
          Explore Collections
        </button>
      </section>
    </div>
  );
};

export default About;