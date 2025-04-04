
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaCrown, FaSearch, FaFilter, FaTimes, FaPlayCircle, FaVideo, FaHeadphones, FaLock } from 'react-icons/fa';
import styles from './Gurbani.module.css';
import header_image_light from '../../images/Gurbani/header-image.png';
import header_image_dark from '../../images/Gurbani/header-image-dark.png';
import gurbaniImage from '../../images/Gurbani/gurbani.png';
import audioKirtanImage from '../../images/Gurbani/audio-kirtan.jpg';
import videoKirtanImage from '../../images/Gurbani/video-kirtan.jpg';
import sectionImage from '../../images/Gurbani/section-image.jpg';
import skeleton_image from '../../images/skelton-image.png';

const Gurbani = ({ isDarkMode }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [cardsPerPage] = useState(10);

  useEffect(() => {
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(loadingTimer);
  }, []);

  const gurbaniData = [
    {
      id: 1,
      type: 'shabad',
      image: gurbaniImage,
      title: 'Shabad 1',
      description: 'This is a description of the first shabad.',
      isPremium: true,
    },
    {
      id: 2,
      type: 'audio',
      image: audioKirtanImage,
      title: 'Anand Sahib',
      description: 'Listen to the divine Anand Sahib by Bhai Harjinder Singh.',
      isPremium: false,
    },
    {
      id: 3,
      type: 'video',
      image: videoKirtanImage,
      title: 'Rehras Sahib',
      description: 'Watch the soulful Rehras Sahib by Bhai Balbir Singh.',
      isPremium: true,
    },
    {
      id: 4,
      type: 'shabad',
      image: gurbaniImage,
      title: 'Shabad 2',
      description: 'This is a description of the second shabad.',
      isPremium: false,
    },
    {
      id: 5,
      type: 'audio',
      image: audioKirtanImage,
      title: 'Japji Sahib',
      description: 'Experience the spiritual Japji Sahib by Bhai Niranjan Singh.',
      isPremium: true,
    },
    {
      id: 6,
      type: 'video',
      image: videoKirtanImage,
      title: 'Kirtan Sohila',
      description: 'Enjoy the peaceful Kirtan Sohila by Bhai Jarnail Singh.',
      isPremium: false,
    },
    {
      id: 7,
      type: 'shabad',
      image: gurbaniImage,
      title: 'Shabad 3',
      description: 'This is a description of the third shabad.',
      isPremium: true,
    },
    {
      id: 8,
      type: 'audio',
      image: audioKirtanImage,
      title: 'Rehras Sahib',
      description: 'Meditate with the soothing Rehras Sahib by Bhai Balbir Singh.',
      isPremium: false,
    },
    {
      id: 9,
      type: 'video',
      image: videoKirtanImage,
      title: 'Asa Di Var',
      description: 'Experience the uplifting Asa Di Var by Bhai Harjinder Singh.',
      isPremium: true,
    },
    {
      id: 10,
      type: 'shabad',
      image: gurbaniImage,
      title: 'Shabad 4',
      description: 'This is a description of the fourth shabad.',
      isPremium: false,
    },
    {
      id: 11,
      type: 'audio',
      image: audioKirtanImage,
      title: 'Sukhmani Sahib',
      description: 'Find peace with Sukhmani Sahib by Bhai Niranjan Singh.',
      isPremium: true,
    },
    {
      id: 12,
      type: 'video',
      image: videoKirtanImage,
      title: 'Japji Sahib',
      description: 'Experience the spiritual Japji Sahib by Bhai Niranjan Singh.',
      isPremium: false,
    },
    {
      id: 13,
      type: 'shabad',
      image: gurbaniImage,
      title: 'Shabad 5',
      description: 'This is a description of the fifth shabad.',
      isPremium: true,
    },
    {
      id: 14,
      type: 'audio',
      image: audioKirtanImage,
      title: 'Anand Sahib',
      description: 'Listen to the divine Anand Sahib by Bhai Harjinder Singh.',
      isPremium: false,
    },
    {
      id: 15,
      type: 'video',
      image: videoKirtanImage,
      title: 'Rehras Sahib',
      description: 'Watch the soulful Rehras Sahib by Bhai Balbir Singh.',
      isPremium: true,
    },
    {
      id: 16,
      type: 'shabad',
      image: gurbaniImage,
      title: 'Shabad 6',
      description: 'This is a description of the sixth shabad.',
      isPremium: false,
    },
    {
      id: 17,
      type: 'audio',
      image: audioKirtanImage,
      title: 'Kirtan Sohila',
      description: 'End your day with the peaceful Kirtan Sohila by Bhai Jarnail Singh.',
      isPremium: true,
    },
    {
      id: 18,
      type: 'video',
      image: videoKirtanImage,
      title: 'Asa Di Var',
      description: 'Experience the uplifting Asa Di Var by Bhai Harjinder Singh.',
      isPremium: false,
    },
    {
      id: 19,
      type: 'shabad',
      image: gurbaniImage,
      title: 'Shabad 7',
      description: 'This is a description of the seventh shabad.',
      isPremium: true,
    },
    {
      id: 20,
      type: 'audio',
      image: audioKirtanImage,
      title: 'Sukhmani Sahib',
      description: 'Find peace with Sukhmani Sahib by Bhai Niranjan Singh.',
      isPremium: false,
    },
  ];

  const indexOfLastCard = currentPage * cardsPerPage;
  const indexOfFirstCard = indexOfLastCard - cardsPerPage;
  const currentCards = gurbaniData.slice(indexOfFirstCard, indexOfLastCard);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleFilterClick = (filter) => {
    if (selectedFilters.includes(filter)) {
      setSelectedFilters(selectedFilters.filter((item) => item !== filter));
    } else {
      setSelectedFilters([...selectedFilters, filter]);
    }
  };

  const clearFilters = () => {
    setSelectedFilters([]);
  };

  return (
    <div className={styles.container}>
      {/* Header Section - remains unchanged */}
      <div className={styles.header}>
        <img
          src={isDarkMode ? header_image_dark : header_image_light}
          alt="Gurbani Header"
          className={styles.headerImage}
        />
        <div className={styles.headerText}>
          <h1>DIVINE WISDOM: GURBANI</h1>
          <p>Sacred Hymns from the Guru Granth Sahib Ji</p>
        </div>
      </div>

      {/* Breadcrumb - remains unchanged */}
      <div className={styles.breadcrumb}>
        <Link to={'/'}><span>Home</span></Link> / 
        <Link to={'/gurbani'}><span> Gurbani</span></Link>
      </div>

      {/* Search and Filter - remains unchanged */}
      <div className={styles.searchFilterContainer}>
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search Gurbani..."
            value={searchQuery}
            onChange={handleSearch}
          />
          <button className={styles.searchButton}>
            <span className={styles.searchText}>Search</span>
            <span className={styles.searchIcon}>
              <FaSearch />
            </span>
          </button>
        </div>
        <button className={styles.filterButton} onClick={toggleFilters}>
          <FaFilter />
        </button>
      </div>

      {/* Filters Sidebar - remains unchanged */}
      {showFilters && (
        <div className={styles.filtersSidebar}>
          <button className={styles.closeButton} onClick={toggleFilters}>
            <FaTimes />
          </button>
          <h3>Filters</h3>
          <div className={styles.filterOptions}>
            <div
              className={`${styles.filterItem} ${selectedFilters.includes('shabad') ? styles.selected : ''}`}
              onClick={() => handleFilterClick('shabad')}
            >
              Shabad
            </div>
            <div
              className={`${styles.filterItem} ${selectedFilters.includes('audio') ? styles.selected : ''}`}
              onClick={() => handleFilterClick('audio')}
            >
              Audio Kirtan
            </div>
            <div
              className={`${styles.filterItem} ${selectedFilters.includes('video') ? styles.selected : ''}`}
              onClick={() => handleFilterClick('video')}
            >
              Video Kirtan
            </div>
            <div
              className={`${styles.filterItem} ${selectedFilters.includes('premium') ? styles.selected : ''}`}
              onClick={() => handleFilterClick('premium')}
            >
              Premium Only
            </div>
            <div
              className={`${styles.filterItem} ${selectedFilters.includes('punjabi') ? styles.selected : ''}`}
              onClick={() => handleFilterClick('punjabi')}
            >
              Punjabi
            </div>
            <div
              className={`${styles.filterItem} ${selectedFilters.includes('english') ? styles.selected : ''}`}
              onClick={() => handleFilterClick('english')}
            >
              English
            </div>
            <div
              className={`${styles.filterItem} ${selectedFilters.includes('raag') ? styles.selected : ''}`}
              onClick={() => handleFilterClick('raag')}
            >
              Raag
            </div>
          </div>
          <div className={styles.filterActions}>
            <button className={styles.saveButton}>Save Changes</button>
            <button className={styles.clearButton} onClick={clearFilters}>Clear Filters</button>
          </div>
        </div>
      )}

      {/* Main Content - Updated card rendering */}
      <div className={styles.mainContent}>
        <div className={styles.cardGrid}>
          {isLoading ? (
            Array(cardsPerPage).fill().map((_, index) => (
              <div key={`skeleton-${index}`} className={styles.card}>
                <div className={styles.cardGlass}>
                  <div className={styles.cardImageSkeleton}>
                    <img src={skeleton_image} alt="Loading" className={styles.skeletonImage} />
                  </div>
                  <div className={styles.skeletonTitle}></div>
                  <div className={styles.skeletonPremium}></div>
                  <div className={styles.skeletonHoverContent}>
                    <div className={styles.skeletonButton}></div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            currentCards.map((item) => (
              <div key={item.id} className={`${styles.card} ${item.isPremium ? styles.premiumCard : ''}`}>
                <div className={`${styles.cardGlass} ${item.isPremium ? styles.premiumGlass : ''}`}>
                  {item.isPremium && (
                    <>
                      <div className={styles.premiumRibbon}>Premium</div>
                    </>
                  )}
                  <img src={item.image} alt={item.title} className={styles.cardImage} />
                  <h3 className={styles.cardTitle}>{item.title}</h3>
                  {item.isPremium && (
                    <div className={styles.premiumBadge}>
                      <FaCrown />
                    </div>
                  )}
                  <div className={styles.cardHoverContent}>
                    {item.isPremium && (
                      <div className={styles.premiumLock}>
                        <FaLock />
                        <span>Premium Content</span>
                      </div>
                    )}
                    {item.type === 'shabad' && (
                      <button className={`${styles.actionButton} ${item.isPremium ? styles.premiumButton : ''}`}>
                        <FaPlayCircle /> {item.isPremium ? 'Unlock to Read' : 'Read Now'}
                      </button>
                    )}
                    {item.type === 'audio' && (
                      <button className={`${styles.actionButton} ${item.isPremium ? styles.premiumButton : ''}`}>
                        <FaHeadphones /> {item.isPremium ? 'Unlock to Listen' : 'Listen Now'}
                      </button>
                    )}
                    {item.type === 'video' && (
                      <button className={`${styles.actionButton} ${item.isPremium ? styles.premiumButton : ''}`}>
                        <FaVideo /> {item.isPremium ? 'Unlock to Watch' : 'Watch Now'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination - remains unchanged */}
        <div className={styles.pagination}>
          {Array.from({ length: Math.ceil(gurbaniData.length / cardsPerPage) }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => paginate(i + 1)}
              className={currentPage === i + 1 ? styles.activePage : ''}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Section with Image - remains unchanged */}
      <div className={styles.sectionWithImage}>
        {isLoading ? (
          <div className={styles.sectionTextSkeleton}>
            <div className={styles.skeletonHeading}></div>
            <div className={styles.skeletonParagraph}></div>
            <div className={styles.skeletonSectionButton}></div>
          </div>
        ) : (
          <div className={styles.sectionText}>
            <h2>Explore the Divine Wisdom</h2>
            <p>Immerse yourself in the sacred hymns and teachings of Guru Granth Sahib Ji. Discover the essence of Gurbani and elevate your spiritual journey.</p>
            <button className={styles.sectionButton}>Start Exploring</button>
          </div>
        )}
        {isLoading ? (
          <div className={styles.sectionImageSkeleton}>
            <img src={skeleton_image} alt="Loading" className={styles.skeletonImage} />
          </div>
        ) : (
          <div className={styles.sectionImage}>
            <img src={sectionImage} alt="Section" />
          </div>
        )}
      </div>

      {/* Because You Watched - remains unchanged */}
      <div className={styles.becauseYouWatched}>
        <h2 className={styles.sectionTitle}>Because You Viewed Rehraas Sahib</h2>
        <div className={styles.shapeContainer}>
          {isLoading ? (
            Array(6).fill().map((_, index) => (
              <div key={`shape-skeleton-${index}`} className={`${styles.shapeSkeleton} ${styles[`shape${index % 6}`]}`}>
                <div className={styles.skeletonShapeContent}></div>
              </div>
            ))
          ) : (
            currentCards.slice(0,6).map((item, index) => (
              <div
                key={item.id}
                className={`${styles.shape} ${styles[`shape${index % 6}`]} ${item.isPremium ? styles.premiumShape : ''}`}
              >
                {item.isPremium && <div className={styles.shapePremiumBadge}><FaCrown /></div>}
                <div className={styles.shapeContent}>
                  <h3>{item.title}</h3>
                  <div className={styles.shapeHoverContent}>
                    <p>{item.description}</p>
                    <button className={`${styles.shapeButton} ${item.isPremium ? styles.premiumShapeButton : ''}`}>
                      {item.type === 'shabad' ? 'Read Now' : item.type === 'audio' ? 'Listen Now' : 'Watch Now'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Gurbani;