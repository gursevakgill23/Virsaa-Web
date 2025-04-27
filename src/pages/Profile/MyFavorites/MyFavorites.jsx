import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { 
  FiSearch, 
  FiX, 
  FiChevronRight,
  FiGrid, 
  FiList,
  FiMoreVertical,
  FiBook,
  FiHeadphones,
  FiUser,
  FiClock
} from 'react-icons/fi';
import styles from './MyFavorites.module.css';
import 'swiper/css';
import 'swiper/css/navigation';

// Import images
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
const MyFavorites = ({ isDarkMode }) => {
  const getImagePath = useProductionImagePath();

  const header_image_light = '/images/Profile/header-image.png';
  const header_image_dark = '/images/Profile/header-image-dark.png';
  const bookImage = '/images/Profile/book-image.jpg';
  const authorImage = '/images/Profile/author-image.jpg';

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [activeTab, setActiveTab] = useState('ebooks');

  // State for each section's data
  const [favoriteEbooks, setFavoriteEbooks] = useState(
    Array(10).fill().map((_, i) => ({
      id: `ebook-${i+1}`,
      title: `Sacred Wisdom Vol. ${i+1}`,
      author: `Author ${String.fromCharCode(65+i)}`,
      image: bookImage,
      progress: Math.floor(Math.random() * 100),
      rating: (Math.random() * 0.5 + 4.5).toFixed(1)
    }))
  );

  const [favoriteAudiobooks, setFavoriteAudiobooks] = useState(
    Array(10).fill().map((_, i) => ({
      id: `audiobook-${i+1}`,
      title: `Divine Listenings Vol. ${i+1}`,
      author: `Narrator ${String.fromCharCode(65+i)}`,
      image: bookImage,
      duration: `${Math.floor(Math.random() * 3) + 1}h ${Math.floor(Math.random() * 60)}m`,
      rating: (Math.random() * 0.5 + 4.5).toFixed(1)
    }))
  );

  const [favoriteAuthors, setFavoriteAuthors] = useState(
    Array(10).fill().map((_, i) => ({
      id: `author-${i+1}`,
      name: `Scholar ${String.fromCharCode(65+i)} Singh`,
      image: authorImage,
      books: Math.floor(Math.random() * 20) + 5,
      followers: `${Math.floor(Math.random() * 50) + 10}k`
    }))
  );

  const [savedForLater, setSavedForLater] = useState(
    Array(10).fill().map((_, i) => ({
      id: `saved-${i+1}`,
      title: `Spiritual Journey ${i+1}`,
      type: ['Ebook', 'Audiobook', 'Article'][Math.floor(Math.random() * 3)],
      image: i % 2 === 0 ? bookImage : authorImage,
      added: `${Math.floor(Math.random() * 30) + 1} days ago`
    }))
  );

  // State for menu visibility
  const [openMenuId, setOpenMenuId] = useState(null);

  const toggleMenu = (id) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  // Remove handlers
  const removeEbook = (id) => {
    setFavoriteEbooks(favoriteEbooks.filter(ebook => ebook.id !== id));
    setOpenMenuId(null);
  };

  const removeAudiobook = (id) => {
    setFavoriteAudiobooks(favoriteAudiobooks.filter(audiobook => audiobook.id !== id));
    setOpenMenuId(null);
  };

  const removeAuthor = (id) => {
    setFavoriteAuthors(favoriteAuthors.filter(author => author.id !== id));
    setOpenMenuId(null);
  };

  const removeSavedItem = (id) => {
    setSavedForLater(savedForLater.filter(item => item.id !== id));
    setOpenMenuId(null);
  };

  const tabs = [
    { id: 'ebooks', label: 'Ebooks', icon: <FiBook /> },
    { id: 'audiobooks', label: 'Audiobooks', icon: <FiHeadphones /> },
    { id: 'authors', label: 'Authors', icon: <FiUser /> }
  ];

  return (
    <div className={styles.container}>
      {/* Header - Matches Gurbani page */}
      <div className={styles.header}>
        <img
          src={getImagePath(isDarkMode ? header_image_dark : header_image_light)}
          alt="Favorites Header"
          className={styles.headerImage}
        />
        <div className={styles.headerText}>
          <h1>MY FAVORITES</h1>
          <p>Your personalized collection of sacred content</p>
        </div>
      </div>

      {/* Breadcrumb - Matches standard */}
      <div className={styles.breadcrumb}>
        <Link to="/"><span>Home</span></Link> / 
        <Link to="/collections"><span>Collections</span></Link> /
        <span>Favorites</span>
      </div>

      {/* Search and View Controls */}
      <div className={styles.controls}>
        <div className={styles.searchContainer}>
          <FiSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search your favorites..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className={styles.clearSearch}>
              <FiX />
            </button>
          )}
        </div>
        
        <div className={styles.viewToggle}>
          <button 
            className={`${styles.viewButton} ${viewMode === 'grid' ? styles.active : ''}`}
            onClick={() => setViewMode('grid')}
          >
            <FiGrid /> Grid
          </button>
          <button 
            className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
            onClick={() => setViewMode('list')}
          >
            <FiList /> List
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabNavigation}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Sections */}
      <div className={styles.content}>
        {/* Favorite Ebooks Section */}
        {activeTab === 'ebooks' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2><FiBook /> Favorite Ebooks</h2>
              <Link to="/collections/ebooks" className={styles.viewAllLink}>
                View all <FiChevronRight />
              </Link>
            </div>
            
            {viewMode === 'grid' ? (
              <div className={styles.swiperContainer}>
                <Swiper
                  modules={[Navigation]}
                  spaceBetween={30}
                  slidesPerView="auto"
                  navigation={{
                    prevEl: `.${styles.ebooksPrev}`,
                    nextEl: `.${styles.ebooksNext}`
                  }}
                  className={styles.swiper}
                >
                  {favoriteEbooks.map(ebook => (
                    <SwiperSlide key={ebook.id} className={styles.slide}>
                      <EbookCard 
                        item={ebook} 
                        onRemove={() => removeEbook(ebook.id)}
                        isMenuOpen={openMenuId === ebook.id}
                        toggleMenu={() => toggleMenu(ebook.id)}
                      />
                    </SwiperSlide>
                  ))}
                </Swiper>
                <button className={`${styles.navButton} ${styles.ebooksPrev}`}>
                  &lt;
                </button>
                <button className={`${styles.navButton} ${styles.ebooksNext}`}>
                  &gt;
                </button>
              </div>
            ) : (
              <div className={styles.listContainer}>
                <div className={styles.listHeader}>
                  <div className={styles.listHeaderItem}>Name</div>
                  <div className={styles.listHeaderItem}>Author</div>
                  <div className={styles.listHeaderItem}>Progress</div>
                  <div className={styles.listHeaderItem}>Rating</div>
                  <div className={styles.listHeaderItem}>Actions</div>
                </div>
                <div className={styles.listBody}>
                  {favoriteEbooks.map(ebook => (
                    <EbookListItem 
                      key={ebook.id} 
                      item={ebook}
                      onRemove={() => removeEbook(ebook.id)}
                      isMenuOpen={openMenuId === ebook.id}
                      toggleMenu={() => toggleMenu(ebook.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Favorite Audiobooks Section */}
        {activeTab === 'audiobooks' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2><FiHeadphones /> Favorite Audiobooks</h2>
              <Link to="/collections/audiobooks" className={styles.viewAllLink}>
                View all <FiChevronRight />
              </Link>
            </div>
            
            {viewMode === 'grid' ? (
              <div className={styles.swiperContainer}>
                <Swiper
                  modules={[Navigation]}
                  spaceBetween={30}
                  slidesPerView="auto"
                  navigation={{
                    prevEl: `.${styles.audiobooksPrev}`,
                    nextEl: `.${styles.audiobooksNext}`
                  }}
                  className={styles.swiper}
                >
                  {favoriteAudiobooks.map(audiobook => (
                    <SwiperSlide key={audiobook.id} className={styles.slide}>
                      <AudiobookCard 
                        item={audiobook}
                        onRemove={() => removeAudiobook(audiobook.id)}
                        isMenuOpen={openMenuId === audiobook.id}
                        toggleMenu={() => toggleMenu(audiobook.id)}
                      />
                    </SwiperSlide>
                  ))}
                </Swiper>
                <button className={`${styles.navButton} ${styles.audiobooksPrev}`}>
                  &lt;
                </button>
                <button className={`${styles.navButton} ${styles.audiobooksNext}`}>
                  &gt;
                </button>
              </div>
            ) : (
              <div className={styles.listContainer}>
                <div className={styles.listHeader}>
                  <div className={styles.listHeaderItem}>Name</div>
                  <div className={styles.listHeaderItem}>Narrator</div>
                  <div className={styles.listHeaderItem}>Duration</div>
                  <div className={styles.listHeaderItem}>Rating</div>
                  <div className={styles.listHeaderItem}>Actions</div>
                </div>
                <div className={styles.listBody}>
                  {favoriteAudiobooks.map(audiobook => (
                    <AudiobookListItem 
                      key={audiobook.id} 
                      item={audiobook}
                      onRemove={() => removeAudiobook(audiobook.id)}
                      isMenuOpen={openMenuId === audiobook.id}
                      toggleMenu={() => toggleMenu(audiobook.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Favorite Authors Section */}
        {activeTab === 'authors' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2><FiUser /> Favorite Authors</h2>
              <Link to="/collections/authors" className={styles.viewAllLink}>
                View all <FiChevronRight />
              </Link>
            </div>
            
            {viewMode === 'grid' ? (
              <div className={styles.swiperContainer}>
                <Swiper
                  modules={[Navigation]}
                  spaceBetween={30}
                  slidesPerView="auto"
                  navigation={{
                    prevEl: `.${styles.authorsPrev}`,
                    nextEl: `.${styles.authorsNext}`
                  }}
                  className={styles.swiper}
                >
                  {favoriteAuthors.map(author => (
                    <SwiperSlide key={author.id} className={styles.slide}>
                      <AuthorCard 
                        item={author}
                        onRemove={() => removeAuthor(author.id)}
                        isMenuOpen={openMenuId === author.id}
                        toggleMenu={() => toggleMenu(author.id)}
                      />
                    </SwiperSlide>
                  ))}
                </Swiper>
                <button className={`${styles.navButton} ${styles.authorsPrev}`}>
                  &lt;
                </button>
                <button className={`${styles.navButton} ${styles.authorsNext}`}>
                  &gt;
                </button>
              </div>
            ) : (
              <div className={styles.listContainer}>
                <div className={styles.listHeader}>
                  <div className={styles.listHeaderItem}>Name</div>
                  <div className={styles.listHeaderItem}>Books</div>
                  <div className={styles.listHeaderItem}>Followers</div>
                  <div className={styles.listHeaderItem}></div>
                  <div className={styles.listHeaderItem}>Actions</div>
                </div>
                <div className={styles.listBody}>
                  {favoriteAuthors.map(author => (
                    <AuthorListItem 
                      key={author.id} 
                      item={author}
                      onRemove={() => removeAuthor(author.id)}
                      isMenuOpen={openMenuId === author.id}
                      toggleMenu={() => toggleMenu(author.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Saved for Later Section (Moved Outside Tabs) */}
      <div className={styles.content}>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2><FiClock /> Saved for Later</h2>
            <Link to="/collections/saved" className={styles.viewAllLink}>
              View all <FiChevronRight />
            </Link>
          </div>
          
          {viewMode === 'grid' ? (
            <div className={styles.swiperContainer}>
              <Swiper
                modules={[Navigation]}
                spaceBetween={30}
                slidesPerView="auto"
                navigation={{
                  prevEl: `.${styles.savedPrev}`,
                  nextEl: `.${styles.savedNext}`
                }}
                className={styles.swiper}
              >
                {savedForLater.map(item => (
                  <SwiperSlide key={item.id} className={styles.slide}>
                    <SavedCard 
                      item={item}
                      onRemove={() => removeSavedItem(item.id)}
                      isMenuOpen={openMenuId === item.id}
                      toggleMenu={() => toggleMenu(item.id)}
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
              <button className={`${styles.navButton} ${styles.savedPrev}`}>
                &lt;
              </button>
              <button className={`${styles.navButton} ${styles.savedNext}`}>
                &gt;
              </button>
            </div>
          ) : (
            <div className={styles.listContainer}>
              <div className={styles.listHeader}>
                <div className={styles.listHeaderItem}>Name</div>
                <div className={styles.listHeaderItem}>Type</div>
                <div className={styles.listHeaderItem}>Added</div>
                <div className={styles.listHeaderItem}></div>
                <div className={styles.listHeaderItem}>Actions</div>
              </div>
              <div className={styles.listBody}>
                {savedForLater.map(item => (
                  <SavedListItem 
                    key={item.id} 
                    item={item}
                    onRemove={() => removeSavedItem(item.id)}
                    isMenuOpen={openMenuId === item.id}
                    toggleMenu={() => toggleMenu(item.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Card Components
const EbookCard = ({ item, onRemove, isMenuOpen, toggleMenu }) => (
  <div className={styles.card}>
    <div className={styles.cardImageContainer}>
      <img src={useProductionImagePath(item.image)} alt={item.title} className={styles.cardImage} />
      <div className={styles.cardBadge}>Ebook</div>
      <div className={styles.cardMenuContainer}>
        <button className={styles.cardMenu} onClick={toggleMenu}>
          <FiMoreVertical />
        </button>
        {isMenuOpen && (
          <div className={styles.menuDropdown}>
            <button onClick={onRemove}>Remove from Favorites</button>
          </div>
        )}
      </div>
    </div>
    <div className={styles.cardContent}>
      <h3 className={styles.cardTitle}>{item.title}</h3>
      <p className={styles.cardAuthor}>{item.author}</p>
      <div className={styles.cardMeta}>
        <div className={styles.rating}>
          <span className={styles.ratingValue}>{item.rating}</span>
          <div className={styles.stars} style={{ '--rating': item.rating }} />
        </div>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${item.progress}%` }}
          />
          <span className={styles.progressText}>{item.progress}%</span>
        </div>
      </div>
    </div>
  </div>
);

const AudiobookCard = ({ item, onRemove, isMenuOpen, toggleMenu }) => (
  <div className={styles.card}>
    <div className={styles.cardImageContainer}>
      <img src={useProductionImagePath(item.image)} alt={item.title} className={styles.cardImage} />
      <div className={styles.cardBadge}>Audiobook</div>
      <div className={styles.cardMenuContainer}>
        <button className={styles.cardMenu} onClick={toggleMenu}>
          <FiMoreVertical />
        </button>
        {isMenuOpen && (
          <div className={styles.menuDropdown}>
            <button onClick={onRemove}>Remove from Favorites</button>
          </div>
        )}
      </div>
    </div>
    <div className={styles.cardContent}>
      <h3 className={styles.cardTitle}>{item.title}</h3>
      <p className={styles.cardAuthor}>{item.author}</p>
      <div className={styles.cardMeta}>
        <div className={styles.rating}>
          <span className={styles.ratingValue}>{item.rating}</span>
          <div className={styles.stars} style={{ '--rating': item.rating }} />
        </div>
        <div className={styles.duration}>{item.duration}</div>
      </div>
    </div>
  </div>
);

const AuthorCard = ({ item, onRemove, isMenuOpen, toggleMenu }) => (
  <div className={styles.authorCard}>
    <div className={styles.authorImageContainer}>
      <img src={useProductionImagePath(item.image)} alt={item.name} className={styles.authorImage} />
      <div className={styles.cardMenuContainer}>
        <button className={styles.cardMenu} onClick={toggleMenu}>
          <FiMoreVertical />
        </button>
        {isMenuOpen && (
          <div className={styles.menuDropdown}>
            <button onClick={onRemove}>Remove from Favorites</button>
          </div>
        )}
      </div>
    </div>
    <div className={styles.authorContent}>
      <h3 className={styles.authorName}>{item.name}</h3>
      <div className={styles.authorMeta}>
        <span>{item.books} books</span>
        <span>{item.followers} followers</span>
      </div>
    </div>
  </div>
);

const SavedCard = ({ item, onRemove, isMenuOpen, toggleMenu }) => (
  <div className={styles.card}>
    <div className={styles.cardImageContainer}>
      <img src={useProductionImagePath(item.image)} alt={item.title} className={styles.cardImage} />
      <div className={styles.cardBadge}>{item.type}</div>
      <div className={styles.cardMenuContainer}>
        <button className={styles.cardMenu} onClick={toggleMenu}>
          <FiMoreVertical />
        </button>
        {isMenuOpen && (
          <div className={styles.menuDropdown}>
            <button onClick={onRemove}>Remove from Saved</button>
          </div>
        )}
      </div>
    </div>
    <div className={styles.cardContent}>
      <h3 className={styles.cardTitle}>{item.title}</h3>
      <div className={styles.savedMeta}>
        <span className={styles.savedType}>{item.type}</span>
        <span className={styles.savedDate}>{item.added}</span>
      </div>
    </div>
  </div>
);

// List Item Components
const EbookListItem = ({ item, onRemove, isMenuOpen, toggleMenu }) => (
  <div className={styles.listRow}>
    <div className={styles.listRowItem}>{item.title}</div>
    <div className={styles.listRowItem}>{item.author}</div>
    <div className={styles.listRowItem}>
      <div className={styles.progressBar}>
        <div 
          className={styles.progressFill} 
          style={{ width: `${item.progress}%` }}
        />
        <span className={styles.progressText}>{item.progress}%</span>
      </div>
    </div>
    <div className={styles.listRowItem}>
      <div className={styles.rating}>
        <span className={styles.ratingValue}>{item.rating}</span>
        <div className={styles.stars} style={{ '--rating': item.rating }} />
      </div>
    </div>
    <div className={styles.listRowItem}>
      <div className={styles.listMenuContainer}>
        <button className={styles.listMenu} onClick={toggleMenu}>
          <FiMoreVertical />
        </button>
        {isMenuOpen && (
          <div className={styles.menuDropdown}>
            <button onClick={onRemove}>Remove from Favorites</button>
          </div>
        )}
      </div>
    </div>
  </div>
);

const AudiobookListItem = ({ item, onRemove, isMenuOpen, toggleMenu }) => (
  <div className={styles.listRow}>
    <div className={styles.listRowItem}>{item.title}</div>
    <div className={styles.listRowItem}>{item.author}</div>
    <div className={styles.listRowItem}>{item.duration}</div>
    <div className={styles.listRowItem}>
      <div className={styles.rating}>
        <span className={styles.ratingValue}>{item.rating}</span>
        <div className={styles.stars} style={{ '--rating': item.rating }} />
      </div>
    </div>
    <div className={styles.listRowItem}>
      <div className={styles.listMenuContainer}>
        <button className={styles.listMenu} onClick={toggleMenu}>
          <FiMoreVertical />
        </button>
        {isMenuOpen && (
          <div className={styles.menuDropdown}>
            <button onClick={onRemove}>Remove from Favorites</button>
          </div>
        )}
      </div>
    </div>
  </div>
);

const AuthorListItem = ({ item, onRemove, isMenuOpen, toggleMenu }) => (
  <div className={styles.listRow}>
    <div className={styles.listRowItem}>{item.name}</div>
    <div className={styles.listRowItem}>{item.books} books</div>
    <div className={styles.listRowItem}>{item.followers} followers</div>
    <div className={styles.listRowItem}></div>
    <div className={styles.listRowItem}>
      <div className={styles.listMenuContainer}>
        <button className={styles.listMenu} onClick={toggleMenu}>
          <FiMoreVertical />
        </button>
        {isMenuOpen && (
          <div className={styles.menuDropdown}>
            <button onClick={onRemove}>Remove from Favorites</button>
          </div>
        )}
      </div>
    </div>
  </div>
);

const SavedListItem = ({ item, onRemove, isMenuOpen, toggleMenu }) => (
  <div className={styles.listRow}>
    <div className={styles.listRowItem}>{item.title}</div>
    <div className={styles.listRowItem}>{item.type}</div>
    <div className={styles.listRowItem}>{item.added}</div>
    <div className={styles.listRowItem}></div>
    <div className={styles.listRowItem}>
      <div className={styles.listMenuContainer}>
        <button className={styles.listMenu} onClick={toggleMenu}>
          <FiMoreVertical />
        </button>
        {isMenuOpen && (
          <div className={styles.menuDropdown}>
            <button onClick={onRemove}>Remove from Saved</button>
          </div>
        )}
      </div>
    </div>
  </div>
);

export default MyFavorites;