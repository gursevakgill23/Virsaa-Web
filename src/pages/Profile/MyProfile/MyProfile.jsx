import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaCrown, FaAward, FaBook, FaClock, 
  FaCloud, FaEdit, FaSave, FaTimes, FaVenusMars,
  FaCalendarAlt, FaHeart, FaPen 
} from 'react-icons/fa';
import styles from './MyProfile.module.css';

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
const MyProfile = ({ isDarkMode }) => {
  const header_image_light = '../../../images/Gurbani/header-image.png';
  const header_image_dark = '../../../images/Gurbani/header-image-dark.png';
  const getImagePath = useProductionImagePath();
  const [userData, setUserData] = useState({
    name: 'Jaspreet Singh',
    joinDate: 'Member since March 2021',
    status: 'Gold Member',
    bio: 'Spiritual seeker and Gurbani enthusiast',
    dob: '1990-05-15',
    sex: 'Male',
    preferredContent: ['Shabad', 'Kirtan', 'History'],
    stats: {
      sessions: 142,
      completed: 87,
      streak: 15,
      storage: '4.7/10GB'
    },
    achievements: [
      { name: 'Nitnem Master', icon: <FaBook />, progress: 100 },
      { name: 'Early Riser', icon: <FaClock />, progress: 75 },
      { name: 'Scholar', icon: <FaAward />, progress: 60 }
    ]
  });

  const [isLoading, setIsLoading] = useState(true);
  const [editSection, setEditSection] = useState(null);
  const [editData, setEditData] = useState({
    name: '',
    bio: '',
    dob: '',
    sex: '',
    preferredContent: []
  });

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const startEditing = (section) => {
    setEditSection(section);
    setEditData({
      name: userData.name,
      bio: userData.bio,
      dob: userData.dob,
      sex: userData.sex,
      preferredContent: [...userData.preferredContent]
    });
  };

  const cancelEditing = () => {
    setEditSection(null);
  };

  const saveChanges = () => {
    setUserData(prev => ({
      ...prev,
      name: editData.name,
      bio: editData.bio,
      dob: editData.dob,
      sex: editData.sex,
      preferredContent: [...editData.preferredContent]
    }));
    setEditSection(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleContentToggle = (content) => {
    setEditData(prev => {
      const newContent = prev.preferredContent.includes(content)
        ? prev.preferredContent.filter(item => item !== content)
        : [...prev.preferredContent, content];
      return { ...prev, preferredContent: newContent };
    });
  };

  const contentOptions = ['Shabad', 'Kirtan', 'History', 'Philosophy', 'Language', 'Children'];

  return (
    <div className={styles.container}>
      {/* Header - Matches Gurbani page */}
      <div className={styles.header}>
        <img
          src={getImagePath(isDarkMode ? header_image_dark : header_image_light)}
          alt="Account Header"
          className={styles.headerImage}
        />
        <div className={styles.headerText}>
          <h1>YOUR PROFILE</h1>
          <p>Manage your spiritual journey</p>
        </div>
      </div>

      {/* Breadcrumb - Matches standard */}
      <div className={styles.breadcrumb}>
        <Link to="/"><span>Home</span></Link> / 
        <Link to="/account"><span> My Account</span></Link>
      </div>

      {/* Profile Section */}
      <div className={styles.profileSection}>
        {isLoading ? (
          <div className={styles.avatarSkeleton}></div>
        ) : (
          <div className={styles.avatarWrapper}>
            <img 
              src={getImagePath("https://randomuser.me/api/portraits/men/32.jpg")} 
              alt="User" 
              className={styles.avatar}
            />
            {editSection !== 'profile' && (
              <button 
                className={styles.editButton} 
                onClick={() => startEditing('profile')}
              >
                <FaEdit />
              </button>
            )}
          </div>
        )}
        
        <div className={styles.profileInfo}>
          {isLoading ? (
            <>
              <div className={styles.skeletonName}></div>
              <div className={styles.skeletonStatus}></div>
            </>
          ) : editSection === 'profile' ? (
            <>
              <input
                type="text"
                name="name"
                value={editData.name}
                onChange={handleInputChange}
                className={styles.editInput}
              />
              <div className={styles.membershipBadge}>
                <FaCrown /> {userData.status}
              </div>
              <div className={styles.editControls}>
                <button className={styles.cancelButton} onClick={cancelEditing}>
                  <FaTimes /> Cancel
                </button>
                <button className={styles.saveButton} onClick={saveChanges}>
                  <FaSave /> Save
                </button>
              </div>
            </>
          ) : (
            <>
              <h2>{userData.name}</h2>
              <div className={styles.membershipBadge}>
                <FaCrown /> {userData.status}
              </div>
              <p>{userData.joinDate}</p>
            </>
          )}
        </div>
      </div>

      {/* Bio Section */}
      <div className={styles.bioSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            <FaPen /> About Me
          </h3>
          {editSection !== 'bio' && (
            <button 
              className={styles.sectionEditButton}
              onClick={() => startEditing('bio')}
            >
              <FaEdit /> Edit
            </button>
          )}
        </div>
        
        {isLoading ? (
          <div className={styles.skeletonBio}></div>
        ) : editSection === 'bio' ? (
          <>
            <textarea
              name="bio"
              value={editData.bio}
              onChange={handleInputChange}
              className={styles.editTextarea}
              rows="3"
            />
            <div className={styles.editControls}>
              <button className={styles.cancelButton} onClick={cancelEditing}>
                <FaTimes /> Cancel
              </button>
              <button className={styles.saveButton} onClick={saveChanges}>
                <FaSave /> Save
              </button>
            </div>
          </>
        ) : (
          <p>{userData.bio || "No bio provided"}</p>
        )}
      </div>

      {/* Personal Details Section */}
      <div className={styles.detailsSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Personal Details</h3>
          {editSection !== 'details' && (
            <button 
              className={styles.sectionEditButton}
              onClick={() => startEditing('details')}
            >
              <FaEdit /> Edit
            </button>
          )}
        </div>
        
        {isLoading ? (
          <>
            <div className={styles.skeletonDetail}></div>
            <div className={styles.skeletonDetail}></div>
          </>
        ) : editSection === 'details' ? (
          <>
            <div className={styles.detailRow}>
              <span className={styles.detailIcon}><FaCalendarAlt /></span>
              <input
                type="date"
                name="dob"
                value={editData.dob}
                onChange={handleInputChange}
                className={styles.editInput}
              />
            </div>
            
            <div className={styles.detailRow}>
              <span className={styles.detailIcon}><FaVenusMars /></span>
              <select
                name="sex"
                value={editData.sex}
                onChange={handleInputChange}
                className={styles.editSelect}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="">Prefer not to say</option>
              </select>
            </div>
            
            <div className={styles.editControls}>
              <button className={styles.cancelButton} onClick={cancelEditing}>
                <FaTimes /> Cancel
              </button>
              <button className={styles.saveButton} onClick={saveChanges}>
                <FaSave /> Save
              </button>
            </div>
          </>
        ) : (
          <>
            <div className={styles.detailRow}>
              <span className={styles.detailIcon}><FaCalendarAlt /></span>
              <span>Date of Birth: {userData.dob || "Not specified"}</span>
            </div>
            
            <div className={styles.detailRow}>
              <span className={styles.detailIcon}><FaVenusMars /></span>
              <span>Sex: {userData.sex || "Not specified"}</span>
            </div>
          </>
        )}
      </div>

      {/* Preferred Content Section */}
      <div className={styles.contentSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            <FaHeart /> Preferred Content
          </h3>
          {editSection !== 'content' && (
            <button 
              className={styles.sectionEditButton}
              onClick={() => startEditing('content')}
            >
              <FaEdit /> Edit
            </button>
          )}
        </div>
        
        {isLoading ? (
          <div className={styles.skeletonContent}></div>
        ) : editSection === 'content' ? (
          <>
            <div className={styles.contentGrid}>
              {contentOptions.map(content => (
                <button
                  key={content}
                  className={`${styles.contentButton} ${
                    editData.preferredContent.includes(content) ? styles.selected : ''
                  }`}
                  onClick={() => handleContentToggle(content)}
                >
                  {content}
                </button>
              ))}
            </div>
            <div className={styles.editControls}>
              <button className={styles.cancelButton} onClick={cancelEditing}>
                <FaTimes /> Cancel
              </button>
              <button className={styles.saveButton} onClick={saveChanges}>
                <FaSave /> Save
              </button>
            </div>
          </>
        ) : (
          <div className={styles.contentTags}>
            {userData.preferredContent.length > 0 ? (
              userData.preferredContent.map(content => (
                <span key={content} className={styles.contentTag}>{content}</span>
              ))
            ) : (
              <p>No preferences selected</p>
            )}
          </div>
        )}
      </div>

      {/* Stats Overview */}
      <div className={styles.statsSection}>
        <h3 className={styles.sectionTitle}>Your Spiritual Journey</h3>
        <div className={styles.statsGrid}>
          <StatBox 
            icon={<FaClock />}
            title="Total Sessions"
            value={userData.stats.sessions}
            loading={isLoading}
          />
          <StatBox 
            icon={<FaBook />}
            title="Completed"
            value={userData.stats.completed}
            loading={isLoading}
          />
          <StatBox 
            icon={<FaAward />}
            title="Day Streak"
            value={userData.stats.streak}
            loading={isLoading}
          />
          <StatBox 
            icon={<FaCloud />}
            title="Storage"
            value={userData.stats.storage}
            loading={isLoading}
          />
        </div>
      </div>

      {/* Achievements Section */}
      <div className={styles.achievementsSection}>
        <h3 className={styles.sectionTitle}>Your Achievements</h3>
        {isLoading ? (
          <div className={styles.achievementsSkeleton}>
            {[1, 2, 3].map(i => (
              <div key={i} className={styles.skeletonAchievement}></div>
            ))}
          </div>
        ) : (
          <div className={styles.achievementsGrid}>
            {userData.achievements.map((item, index) => (
              <div key={index} className={styles.achievementCard}>
                <div className={styles.achievementIcon}>{item.icon}</div>
                <h4>{item.name}</h4>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill} 
                    style={{ width: `${item.progress}%` }}
                  ></div>
                </div>
                <span>{item.progress}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Reusable Stat Box Component
const StatBox = ({ icon, title, value, loading }) => {
  if (loading) {
    return (
      <div className={styles.statBox}>
        <div className={styles.skeletonStatIcon}></div>
        <div className={styles.skeletonStatTitle}></div>
        <div className={styles.skeletonStatValue}></div>
      </div>
    );
  }

  return (
    <div className={styles.statBox}>
      <div className={styles.statIcon}>{icon}</div>
      <h4>{title}</h4>
      <p>{value}</p>
    </div>
  );
};

export default MyProfile;