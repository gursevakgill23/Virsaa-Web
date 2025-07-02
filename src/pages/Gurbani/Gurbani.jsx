import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link,useNavigate } from 'react-router-dom';
import { FaCrown, FaSearch, FaFilter, FaTimes, FaPlayCircle, FaVideo, FaHeadphones, FaLock, FaMicrophone, FaPlay, FaPause, FaStepBackward, FaStepForward, FaVolumeUp, FaExpand } from 'react-icons/fa';
import styles from './Gurbani.module.css';
import audioFile from "./assets/Nitnem.mp3";
import videoFile from "./assets/Aarti.mp4";

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
const Gurbani = ({ isDarkMode }) => {
  const getImagePath = useProductionImagePath();

  const header_image_light = '/images/header-image.png';
  const header_image_dark = '/images/header-image-dark.png';
  const gurbaniImage = '/images/Gurbani/gurbani.png';
  const audioKirtanImage = '/images/Gurbani/audio-kirtan.jpg';
  const videoKirtanImage = '/images/Gurbani/video-kirtan.jpg';
  const sectionImage = '/images/Gurbani/section-image.jpg';
  const bookImage = '/images/Collections/book-image.jpg';

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  const [cardsPerPage] = useState(10);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [currentMedia, setCurrentMedia] = useState(null);
  const [mediaType, setMediaType] = useState(null); // 'audio' or 'video'
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  
  const recognitionRef = useRef(null);
  const mediaRef = useRef(null);
  const modalRef = useRef(null);
  const navigate = useNavigate();

  const gurbaniData = useMemo(() => {
    return [
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
  }, []);

  // Media player functions
  const togglePlayPause = () => {
    if (isPlaying) {
      mediaRef.current.pause();
    } else {
      mediaRef.current.play().catch(error => {
        console.error("Playback failed:", error);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    setCurrentTime(mediaRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    setDuration(mediaRef.current.duration);
  };

  const handleSeek = (e) => {
    const seekTime = e.target.value;
    mediaRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleVolumeChange = (e) => {
    const newVolume = e.target.value;
    setVolume(newVolume);
    mediaRef.current.volume = newVolume;
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const playMedia = (item, type) => {
    setCurrentMedia(item);
    setMediaType(type);
    setShowMediaModal(true);
    setIsPlaying(false);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setShowMediaModal(false);
    setIsPlaying(false);
    document.body.style.overflow = 'auto';
  };

  const playNext = () => {
    const currentIndex = gurbaniData.findIndex(item => item.id === currentMedia.id);
    const nextIndex = (currentIndex + 1) % gurbaniData.length;
    playMedia(gurbaniData[nextIndex], mediaType);
  };

  const playPrevious = () => {
    const currentIndex = gurbaniData.findIndex(item => item.id === currentMedia.id);
    const prevIndex = (currentIndex - 1 + gurbaniData.length) % gurbaniData.length;
    playMedia(gurbaniData[prevIndex], mediaType);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      modalRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        handleSearch({ target: { value: transcript } });
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => {
      clearTimeout(loadingTimer);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      document.body.style.overflow = 'auto';
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      // Handle fullscreen change if needed
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    let results = gurbaniData;

    if (searchQuery) {
      results = results.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedFilters.length > 0) {
      results = results.filter(item => {
        if (selectedFilters.includes('premium') && !item.isPremium) return false;
        if (selectedFilters.includes('shabad') && item.type !== 'shabad') return false;
        if (selectedFilters.includes('audio') && item.type !== 'audio') return false;
        if (selectedFilters.includes('video') && item.type !== 'video') return false;
        return true;
      });
    }

    setFilteredData(results);
    setCurrentPage(1);
  }, [searchQuery, selectedFilters, gurbaniData]);

  const indexOfLastCard = currentPage * cardsPerPage;
  const indexOfFirstCard = indexOfLastCard - cardsPerPage;
  const currentCards = filteredData.length > 0 ? filteredData.slice(indexOfFirstCard, indexOfLastCard) : gurbaniData.slice(indexOfFirstCard, indexOfLastCard);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const toggleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert("Voice search is not supported in your browser. Please use Chrome or Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
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
      {/* Hidden media elements */}
      {mediaType === 'audio' && (
        <audio
          ref={mediaRef}
          src={audioFile}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          volume={volume}
        />
      )}
      {mediaType === 'video' && (
        <video
          ref={mediaRef}
          src={videoFile}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          volume={volume}
          className={styles.videoElement}
        />
      )}

      <div className={styles.header}>
        <img
          src={getImagePath(isDarkMode ? header_image_dark : header_image_light)}
          alt="Gurbani Header"
          className={styles.headerImage}
        />
        <div className={styles.headerText}>
          <h1>DIVINE WISDOM: GURBANI</h1>
          <p>Sacred Hymns from the Guru Granth Sahib Ji</p>
        </div>
      </div>

      <div className={styles.breadcrumb}>
        <Link to={'/'}><span>Home</span></Link> / 
        <Link to={'/gurbani'}><span> Gurbani</span></Link>
      </div>

      <div className={styles.searchFilterContainer}>
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search Gurbani..."
            value={searchQuery}
            onChange={handleSearch}
          />
          <button 
            className={`${styles.voiceSearchButton} ${isListening ? styles.listening : ''}`}
            onClick={toggleVoiceSearch}
            type="button"
            aria-label="Voice search"
          >
            <FaMicrophone />
          </button>
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

      <div className={styles.mainContent}>
        {searchQuery && (
          <div className={styles.searchResultsHeader}>
            <h3>Search Results for: "{searchQuery}"</h3>
            {filteredData.length === 0 && <p>No results found</p>}
          </div>
        )}
        
        <div className={styles.cardGrid}>
          {isLoading ? (
            Array(cardsPerPage).fill().map((_, index) => (
              <div key={`skeleton-${index}`} className={styles.card}>
                <div className={styles.cardGlass}>
                  <div className={styles.cardImageSkeleton}></div>
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
              <div 
                key={item.id} 
                className={`${styles.card} ${item.isPremium ? styles.premiumCard : ''}`}
                onClick={() => {
                  if (item.isPremium) {
                    navigate('/premium');
                  }
                }}
              >
                <div className={`${styles.cardGlass} ${item.isPremium ? styles.premiumGlass : ''}`}>
                  {item.isPremium && (
                    <>
                      <div className={styles.premiumRibbon}>Premium</div>
                    </>
                  )}
                  <img src={getImagePath(item.image)} alt={item.title} className={styles.cardImage} />
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
                      <button 
                        className={`${styles.actionButton} ${item.isPremium ? styles.premiumButton : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.isPremium) {
                            navigate('/premium');
                          }
                        }}
                      >
                        <FaPlayCircle /> {item.isPremium ? 'Unlock to Read' : 'Read Now'}
                      </button>
                    )}
                    {item.type === 'audio' && (
                      <button 
                        className={`${styles.actionButton} ${item.isPremium ? styles.premiumButton : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.isPremium) {
                            navigate('/premium');
                          } else {
                            playMedia(item, 'audio');
                          }
                        }}
                      >
                        <FaHeadphones /> {item.isPremium ? 'Unlock to Listen' : 'Listen Now'}
                      </button>
                    )}
                    {item.type === 'video' && (
                      <button 
                        className={`${styles.actionButton} ${item.isPremium ? styles.premiumButton : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.isPremium) {
                            navigate('/premium');
                          } else {
                            playMedia(item, 'video');
                          }
                        }}
                      >
                        <FaVideo /> {item.isPremium ? 'Unlock to Watch' : 'Watch Now'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className={styles.pagination}>
          {Array.from({ length: Math.ceil((filteredData.length > 0 ? filteredData.length : gurbaniData.length) / cardsPerPage) }, (_, i) => (
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

      {/* Media Player Modal */}
      {showMediaModal && currentMedia && (
        <div className={styles.mediaModal} ref={modalRef}>
          <div className={styles.mediaModalContent}>
            <button 
              className={styles.closeModalButton}
              onClick={closeModal}
            >
              <FaTimes />
            </button>
            
            <div className={styles.mediaModalHeader}>
              <img 
                src={getImagePath(bookImage)} 
                alt={currentMedia.title} 
                className={styles.mediaModalImage}
              />
              <div className={styles.mediaModalInfo}>
                <h3>{currentMedia.title}</h3>
                <p>{currentMedia.description}</p>
              </div>
            </div>

            {mediaType === 'video' && (
              <div className={styles.videoContainer}>
                <video
                  ref={mediaRef}
                  src={videoFile}
                  className={styles.videoPlayer}
                  onClick={togglePlayPause}
                />
              </div>
            )}

            <div className={styles.mediaPlayerControls}>
              <div className={styles.progressContainer}>
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className={styles.progressBar}
                />
                <div className={styles.timeDisplay}>
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className={styles.mainControls}>
                <button className={styles.controlButton} onClick={playPrevious}>
                  <FaStepBackward />
                </button>
                <button 
                  className={styles.playButton} 
                  onClick={togglePlayPause}
                >
                  {isPlaying ? <FaPause className={styles.icon}/> : <FaPlay className={styles.icon} />}
                </button>
                <button className={styles.controlButton} onClick={playNext}>
                  <FaStepForward />
                </button>
              </div>

              <div className={styles.secondaryControls}>
                <div className={styles.volumeControls}>
                  <FaVolumeUp className={styles.volumeIcon} />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                    className={styles.volumeSlider}
                  />
                </div>
                {mediaType === 'video' && (
                  <button 
                    className={styles.fullscreenButton}
                    onClick={toggleFullscreen}
                  >
                    <FaExpand />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
          </div>
        ) : (
          <div className={styles.sectionImage}>
            <img src={getImagePath(sectionImage)} alt="Section" />
          </div>
        )}
      </div>

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
          onClick={() => {
            if (item.isPremium) {
              // Navigate to premium page
              navigate('/premium');
            }
          }}
        >
          {item.isPremium && <div className={styles.shapePremiumBadge}><FaCrown /></div>}
          <div className={styles.shapeContent}>
  <h3>{item.title}</h3>
  <div className={styles.shapeHoverContent}>
    <p>{item.description}</p>
    <button 
      className={`${styles.shapeButton} ${item.isPremium ? styles.premiumShapeButton : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        if (item.isPremium) {
          navigate('/premium');
        } else {
          if (item.type === 'shabad') {
            // Handle PDF viewing differently
            window.open(item.fileUrl, '_blank'); // or your PDF viewing logic
          } else {
            playMedia(item, item.type); // for audio/video
          }
        }
      }}
    >
      {item.type === 'shabad' ? 
        (item.isPremium ? 'Unlock to Read' : 'Read Now') : 
       item.type === 'audio' ? 
        (item.isPremium ? 'Unlock to Listen' : 'Listen Now') : 
        (item.isPremium ? 'Unlock to Watch' : 'Watch Now')}
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