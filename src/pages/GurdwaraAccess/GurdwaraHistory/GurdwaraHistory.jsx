import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import styles from './GurdwaraHistory.module.css';

// Utility function to handle production image paths
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

const GurdwaraHistory = ({ isDarkMode }) => {
  const getImagePath = useProductionImagePath();
  const { id } = useParams();
  const [mainImage, setMainImage] = useState(0);
  
  // Image paths - now using public folder
  const header_image_light = "/images/gurdwaraAccess/header-image.jpg";
  const header_image_dark = "/images/gurdwaraAccess/header-image-dark.png";
  const history_images = [
    "/images/gurdwaraAccess/history/history1.jpg",
    "/images/gurdwaraAccess/history/history2.jpg",
    "/images/gurdwaraAccess/history/history3.jpg",
    "/images/gurdwaraAccess/history/history4.jpg",
    "/images/gurdwaraAccess/history/history5.jpg"
  ];

  // Mock data - in a real app, you would fetch this based on the id
  const gurdwaras = [
    {
      id: 1,
      name: 'Gurdwara Sikh Sangat Brampton',
      address: '32 Regan Rd, Brampton, ON, Canada',
      established: '1995',
      history: [
        "Founded in 1995 by a small group of Sikh immigrants who wanted to create a spiritual home for the growing Sikh community in Brampton.",
        "Started in a small rented space with just a handful of families attending weekly services.",
        "In 2001, the community purchased the current property and began construction of the main prayer hall.",
        "The current main building was completed in 2005 after years of community fundraising and volunteer work.",
        "Expanded in 2012 with the addition of a community center and langar hall that can serve 500 people.",
        "Today, it serves as one of the largest Sikh places of worship in the Greater Toronto Area with over 5,000 visitors weekly."
      ],
      images: [
        history_images[0],
        history_images[1],
        history_images[2],
        history_images[3],
        history_images[4]
      ]
    },
    {
      id: 2,
      name: 'Gurudwara Nanaksar-Brampton',
      address: '64 Timberlane Dr, Brampton, ON, Canada',
      established: '1988',
      history: [
        "Established in 1988 as the first Nanaksar Thath outside of India.",
        "Founded by followers of Sant Baba Isher Singh Ji who brought the Nanaksar tradition to Canada.",
        "Originally located in a small house before moving to the current location in 1992.",
        "The distinctive white domes were added in 1995 after extensive community fundraising.",
        "Known for its strict adherence to traditional Sikh practices and serene atmosphere.",
        "Hosts an annual Nagar Kirtan that attracts thousands of devotees from across North America."
      ],
      images: [
        history_images[0],
        history_images[1],
        history_images[2]
      ]
    },
    {
      id: 3,
      name: 'Sri Guru Nanak Sikh Centre Brampton',
      address: '99 Glidden Rd, Brampton, ON, Canada',
      established: '2002',
      history: [
        "Founded in 2002 to serve the rapidly growing Sikh population in northwest Brampton.",
        "Started as a small storefront Gurdwara before moving to its current purpose-built facility in 2008.",
        "The current building was designed by renowned Sikh architect Harinder Singh and blends traditional and modern elements.",
        "Known for its educational programs and youth engagement initiatives.",
        "Hosts one of the largest Vaisakhi celebrations in the region with over 10,000 attendees annually.",
        "Added a state-of-the-art community kitchen in 2015 that serves langar to over 1,000 people daily."
      ],
      images: [
        history_images[0],
        history_images[1],
        history_images[2],
        history_images[3]
      ]
    }
  ];
  
  const selectedGurdwara = gurdwaras.find(g => g.id === parseInt(id)) || gurdwaras[0];

  return (
    <div className={styles.page} data-theme={isDarkMode ? 'dark' : 'light'}>
      {/* Header with image and text */}
      <div className={styles.header}>
        <img
          src={getImagePath(isDarkMode ? header_image_dark : header_image_light)}
          alt="Gurdwara History"
          className={styles.headerImage}
        />
        <div className={styles.headerText}>
          <h1>HISTORY OF {selectedGurdwara.name.toUpperCase()}</h1>
          <p>Discover the rich heritage and journey of this sacred place</p>
        </div>
      </div>

      {/* Breadcrumb Section */}
      <div className={styles.breadcrumb}>
        <Link to={'/'}><span>Home</span></Link> / 
        <Link to={'/gurdwara-access'}><span> Gurdwara Access</span></Link> / 
        <span> History of {selectedGurdwara.name}</span>
      </div>

      <div className={styles.mainContainer}>
        <div className={styles.gurdwaraInfo}>
          <h2>{selectedGurdwara.name}</h2>
          <p>{selectedGurdwara.address}</p>
          <p><strong>Established:</strong> {selectedGurdwara.established}</p>
        </div>

        {/* Main image display */}
        <div className={styles.mainImageContainer}>
          <img 
            src={getImagePath(selectedGurdwara.images[mainImage])} 
            alt={`${selectedGurdwara.name} history`} 
            className={styles.mainImage}
          />
        </div>

        {/* Thumbnail gallery */}
        <div className={styles.thumbnailGallery}>
          {selectedGurdwara.images.map((image, index) => (
            <div 
              key={index} 
              className={`${styles.thumbnail} ${mainImage === index ? styles.active : ''}`}
              onClick={() => setMainImage(index)}
            >
              <img 
                src={getImagePath(image)} 
                alt={`${selectedGurdwara.name} thumbnail ${index + 1}`} 
                className={styles.thumbnailImage}
              />
            </div>
          ))}
        </div>

        {/* History timeline */}
        <div className={styles.historyTimeline}>
          <h3>Historical Timeline</h3>
          <div className={styles.timeline}>
            {selectedGurdwara.history.map((event, index) => (
              <div key={index} className={styles.timelineItem}>
                <div className={styles.timelineDot}></div>
                <div className={styles.timelineContent}>
                  <p>{event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notable figures */}
        <div className={styles.notableFigures}>
          <h3>Notable Figures</h3>
          <div className={styles.figuresGrid}>
            <div className={styles.figureCard}>
              <div className={styles.figureImage}></div>
              <h4>Founder Name</h4>
              <p>Description of their contribution to the Gurdwara</p>
            </div>
            <div className={styles.figureCard}>
              <div className={styles.figureImage}></div>
              <h4>Prominent Leader</h4>
              <p>Description of their role in the Gurdwara's development</p>
            </div>
            <div className={styles.figureCard}>
              <div className={styles.figureImage}></div>
              <h4>Community Builder</h4>
              <p>Description of how they helped grow the congregation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GurdwaraHistory;