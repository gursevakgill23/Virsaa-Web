import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaCrown, FaAward, FaBook, FaClock, 
  FaCloud, FaEdit, FaSave, FaTimes, FaVenusMars,
  FaCalendarAlt, FaHeart, FaPen 
} from 'react-icons/fa';
import styles from './MyProfile.module.css';
import { useAuth } from '../../../context/AuthContext';

const useProductionImagePath = () => {
  return (imagePath) => {
    if (process.env.NODE_ENV === 'production') {
      if (typeof imagePath === 'string') {
        return imagePath.startsWith('/') 
          ? imagePath 
          : `/${imagePath.replace(/.*static\/media/, 'static/media')}`;
      } else {
        return imagePath.default || imagePath;
      }
    }
    return imagePath;
  };
};

// Static achievements data as a fallback
const staticAchievements = [
  {
    name: "First Steps",
    icon: <FaBook />,
    progress: 100,
    description: "Completed your first session",
  },
  {
    name: "Spiritual Seeker",
    icon: <FaAward />,
    progress: 50,
    description: "Reached 50% progress in spiritual learning",
  },
  {
    name: "Daily Devotee",
    icon: <FaClock />,
    progress: 25,
    description: "Maintained a 3-day streak",
  },
];

const MyProfile = ({ isDarkMode, apiString }) => {
  const { accessToken, logout } = useAuth();
  const navigate = useNavigate();
  const header_image_light = '../../../images/Gurbani/header-image.png';
  const header_image_dark = '../../../images/Gurbani/header-image-dark.png';
  const getImagePath = useProductionImagePath();

  // State for user data, initialized with API response
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editSection, setEditSection] = useState(null);
  const [editData, setEditData] = useState({
    first_name: '',
    last_name: '',
    bio: '',
    dob: '',
    gender: '',
    preferredContent: []
  });
  const [error, setError] = useState(null);

  // Fetch user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${apiString}/api/auth/profile/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.status === 401) {
          logout();
          navigate('/login');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        // Check if achievements are provided by the backend; if not, use static data
        const achievements = data.achievements && data.achievements.length > 0 
          ? data.achievements.map(achievement => ({
              ...achievement,
              icon: mapIcon(achievement.icon),
            }))
          : staticAchievements;

        setUserData({
          first_name: data.first_name,
          last_name: data.last_name,
          joinDate: data.joined_date,
          status: data.membership_level,
          bio: data.about_me || '',
          dob: data.dob || '',
          gender: data.gender || '',
          preferredContent: data.preferred_content || [],
          profile_photo: data.profile_photo,
          stats: {
            sessions: 0,
            completed: 0,
            streak: 0,
            storage: 0,
          },
          achievements: achievements,
        });
        setEditData({
          first_name: data.first_name,
          last_name: data.last_name,
          bio: data.about_me || '',
          dob: data.dob || '',
          gender: data.gender || '',
          preferredContent: data.preferred_content || [],
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setTimeout(() => setIsLoading(false), 1200);
      }
    };

    if (accessToken) {
      fetchProfile();
    } else {
      navigate('/login');
    }
  }, [accessToken, navigate, logout, apiString]);

  // Map icon strings to React components (used if backend provides achievements)
  const mapIcon = (iconName) => {
    const iconMap = {
      FaBook: <FaBook />,
      FaClock: <FaClock />,
      FaAward: <FaAward />,
    };
    return iconMap[iconName] || <FaAward />;
  };

  const startEditing = (section) => {
    setEditSection(section);
    setEditData({
      first_name: userData.first_name,
      last_name: userData.last_name,
      bio: userData.bio,
      dob: userData.dob,
      gender: userData.gender,
      preferredContent: [...userData.preferredContent],
    });
    setError(null);
  };

  const cancelEditing = () => {
    setEditSection(null);
    setError(null);
  };

  const saveChanges = async () => {
    try {
      const formData = new FormData();
      formData.append('first_name', editData.first_name);
      formData.append('last_name', editData.last_name);
      formData.append('about_me', editData.bio);
      formData.append('dob', editData.dob);
      formData.append('gender', editData.gender);
      formData.append('preferred_content', JSON.stringify(editData.preferredContent));

      const response = await fetch(`${apiString}/api/auth/complete-profile/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (response.status === 401) {
        logout();
        navigate('/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      // Removed unused 'result' variable
      setUserData(prev => ({
        ...prev,
        first_name: editData.first_name,
        last_name: editData.last_name,
        bio: editData.bio,
        dob: editData.dob,
        gender: editData.gender,
        preferredContent: [...editData.preferredContent],
      }));
      toast.success('Changes Saved Successfully!', {
        position: 'top-center',
        autoClose: 2000,
        theme: isDarkMode ? 'dark' : 'light',
      });
      setEditSection(null);
    } catch (err) {
      setError(err.message);
    }
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

  const contentOptions = ['fiction', 'sikh_history', 'punjabi_culture', 'spirituality', 'non_fiction', 'poetry', 'audiobook', 'ebook'];

  if (!userData) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      {/* Toast Notifications */}
      {error && (
        <div className={styles.errorToast}>
          {error}
        </div>
      )}

      {/* Header */}
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

      {/* Breadcrumb */}
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
              src={userData.profile_photo || getImagePath("https://randomuser.me/api/portraits/men/32.jpg")} 
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
                name="first_name"
                value={editData.first_name}
                onChange={handleInputChange}
                className={styles.editInput}
              />
              <input
                type="text"
                name="last_name"
                value={editData.last_name}
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
              <h2>{`${userData.first_name} ${userData.last_name}`}</h2>
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
                name="gender"
                value={editData.gender}
                onChange={handleInputChange}
                className={styles.editSelect}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
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
              <span>Gender: {userData.gender || "Not specified"}</span>
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

      {/* Stats Overview (Placeholder) */}
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
                <p>{item.description}</p>
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