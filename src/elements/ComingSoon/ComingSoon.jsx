import React, { useState, useEffect } from 'react';
import styles from './ComingSoon.module.css'; // Import CSS Module

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


const ComingSoon = ({ isDarkMode }) => {
  const getImagePath = useProductionImagePath();
    const comingsoon1 = '/images/comingsoon1.jpeg';
    const comingsoon2 = '/images/comingsoon2.jpg';
    const comingsoon3 = '/images/comingsoon3.png';
    const comingsoon4 = '/images/comingsoon4.jpg';
  // Data for text and images
  const contentArray = [
    { text: 'Content Coming Soon', image: comingsoon1 },
    { text: 'New Features Arriving', image: comingsoon2 },
    { text: 'Stay Tuned for Updates', image: comingsoon3 },
    { text: 'Exciting News Ahead', image: comingsoon4 },
  ];

  // State for currently active index
  const [activeIndex, setActiveIndex] = useState(0);

  // Change active index every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % contentArray.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [contentArray.length]);

  return (
    <div className={styles.comingSoonContainer}>
      <h1 className={styles.comingSoonHeading}>Stay Tuned For Latest Updates</h1>
      <div className={styles.comingSoonSection}>
        {/* Left Side - Text List */}
        <div className={styles.leftSide}>
          <div className={styles.textList}>
            {contentArray.map((item, index) => (
              <div
                key={index}
                className={`${styles.textItem} ${index === activeIndex ? styles.active : ''}`}
              >
                {item.text}
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Image */}
        <div className={styles.rightSide}>
          <img
            src={getImagePath(contentArray[activeIndex].image)}
            alt="Coming Soon"
            className={styles.horizontalImage}
          />
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;