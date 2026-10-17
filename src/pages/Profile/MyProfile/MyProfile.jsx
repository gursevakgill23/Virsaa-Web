/**
 * pages/Profile/MyProfile/MyProfile.jsx
 * -----------------------------------------------------------------------------
 * My Profile (shown at /my-profile once the profile is complete):
 *   - identity (photo, name, membership) with inline editing
 *   - about me, personal details and content preferences (each editable)
 *   - learning journey: XP, level, streak, lessons and games
 *   - coins, badges and achievements (from the learning API)
 * Profile edits are checked with the same rules as Complete profile.
 * If the learning API is down, the rest of the profile still shows.
 * -----------------------------------------------------------------------------
 */
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from '../../../utils/notify';
import {
  FaCrown, FaBook, FaFire, FaGamepad, FaQuestionCircle, FaCoins, FaStar,
  FaEdit, FaSave, FaTimes, FaVenusMars,
  FaCalendarAlt, FaHeart, FaPen, FaUser, FaMedal, FaShoppingCart, FaArrowUp, FaArrowDown,
} from 'react-icons/fa';
import PageHero from '../../../components/PageHero/PageHero';
import AccountTabs from '../AccountTabs/AccountTabs';
import Avatar from '../../../components/Avatar/Avatar';
import styles from './MyProfile.module.css';
import { useAuth } from '../../../context/AuthContext';
import learningApi from '../../../api/learningApi';
import BadgeIcon from '../../../components/BadgeIcon/BadgeIcon';
import useMembership from '../../../hooks/useMembership';

// Converts image paths for the production build (same helper used across pages)
const getImagePath = (imagePath) => {
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

// Defaults and labels
const CONTENT_OPTIONS = ['fiction', 'sikh_history', 'punjabi_culture', 'spirituality', 'non_fiction', 'poetry', 'audiobook', 'ebook'];
const GENDER_LABELS = { male: 'Male', female: 'Female', other: 'Other', prefer_not_to_say: 'Prefer not to say' };

// "sikh_history" -> "Sikh history"
// "sikh_history" → "Sikh history"
const prettify = (value = '') => {
  const text = String(value).replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
};

// "1998-04-13" → "13 April 1998"
const formatDob = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
};

// How many achievements show before "Show all"
const ACHIEVEMENTS_SHOWN = 8;

// Number and date formatting
const formatNumber = (n) => Number(n || 0).toLocaleString();
const formatShortDate = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '');

const MyProfile = ({ isDarkMode, apiString }) => {
  const { accessToken, logout } = useAuth();
  const membership = useMembership(apiString);
  const navigate = useNavigate();
  // Kept in refs so the profile fetch only re-runs when the token or API address changes
  const logoutRef = useRef(logout);
  const navigateRef = useRef(navigate);
  logoutRef.current = logout;
  navigateRef.current = navigate;
  const headerImage = getImagePath(isDarkMode ? '/images/header-image-dark.png' : '/images/header-image.png');

  // Profile, loading/error, which section is being edited and its values
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [editSection, setEditSection] = useState(null);
  const [editData, setEditData] = useState({
    first_name: '', last_name: '', bio: '', dob: '', gender: '', preferredContent: [],
  });
  const [saveError, setSaveError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [profileReload, setProfileReload] = useState(0); // bumped by "Try again"

  useEffect(() => {
    if (!accessToken) {
      navigateRef.current('/login');
      return;
    }

    const fetchProfile = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const response = await fetch(`${apiString}/api/auth/profile/`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        });

        if (response.status === 401) {
          logoutRef.current();
          navigateRef.current('/login');
          return;
        }
        if (!response.ok) throw new Error('Your profile couldn’t be loaded.');
        // preferred_content may arrive as a list or as a JSON string
        const toList = (value) => {
          if (Array.isArray(value)) return value;
          try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
        };

        const data = await response.json();
        setUserData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          joinDate: data.joined_date,
          status: data.membership_level,
          bio: data.about_me || '',
          dob: data.dob || '',
          gender: data.gender || '',
          preferredContent: toList(data.preferred_content),
          profile_photo: data.profile_photo,
        });
      } catch (err) {
        // A network failure throws a TypeError ("Failed to fetch"); explain it in plain words
        setLoadError(err instanceof TypeError ? 'Virsaa couldn’t be reached. Check your internet connection.' : (err.message || 'Your profile couldn’t be loaded.'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [accessToken, apiString, profileReload]);

  // Learning progress, XP and achievements come from the learning API.
  // If it can't be reached, the rest of the profile still shows.
  const [journey, setJourney] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [badges, setBadges] = useState([]);
  const [learningState, setLearningState] = useState('loading'); // loading | ready | error
  const [showAllAchievements, setShowAllAchievements] = useState(false);
  const [learningReload, setLearningReload] = useState(0);
  const stat = (value) => (learningState === 'loading' && !journey ? '—' : formatNumber(value));

  useEffect(() => {
    if (!accessToken) return undefined;
    let cancelled = false;
    setLearningState('loading');
    // Each request shows what it can on its own, so one failure doesn't blank the whole section
    Promise.allSettled([
      learningApi.summary(apiString, accessToken),
      learningApi.achievements(apiString, accessToken),
      learningApi.myBadges(apiString, accessToken),
    ]).then(([summaryRes, achRes, badgeRes]) => {
      if (cancelled) return;
      if (summaryRes.status === 'fulfilled') {
        const summary = summaryRes.value;
        setJourney({ ...summary.stats, wallet: summary.wallet });
      }
      const ach = achRes.status === 'fulfilled' ? achRes.value : null;
      if (ach) {
        // Earned first (newest first), then the closest to being earned
        const rows = [...(ach.achievements || [])].sort((a, b) =>
          (b.earned - a.earned)
          || (a.earned ? new Date(b.earned_at) - new Date(a.earned_at) : b.progress - a.progress));
        setAchievements(rows);
        if (summaryRes.status !== 'fulfilled' && ach.stats) setJourney({ ...ach.stats });
      }
      if (badgeRes.status === 'fulfilled') {
        setBadges(Array.isArray(badgeRes.value) ? badgeRes.value : []);
      } else if (summaryRes.status === 'fulfilled') {
        setBadges(summaryRes.value.badges || []);
      }
      const allFailed = [summaryRes, achRes, badgeRes].every((r) => r.status === 'rejected');
      if (allFailed) console.error('Learning summary failed:', summaryRes.reason?.response?.status || summaryRes.reason?.message);
      setLearningState(allFailed ? 'error' : 'ready');
    });
    return () => { cancelled = true; };
  }, [accessToken, apiString, learningReload]);

  // Open a section for editing with the current values
  const startEditing = (section) => {
    setEditSection(section);
    setEditData({
      first_name: userData.first_name || '',
      last_name: userData.last_name || '',
      bio: userData.bio || '',
      dob: userData.dob || '',
      gender: userData.gender || '',
      preferredContent: Array.isArray(userData.preferredContent) ? [...userData.preferredContent] : [],
    });
    setSaveError(null);
  };

  const cancelEditing = () => {
    setEditSection(null);
    setSaveError(null);
  };

  // The same rules as Complete profile, so a saved profile always stays complete
  const validateEdit = () => {
    if (!editData.first_name.trim() || !editData.last_name.trim()) return 'Enter your first and last name.';
    if (!editData.bio.trim()) return 'Write a line or two about yourself.';
    if (!editData.dob) return 'Add your date of birth.';
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (editData.dob > todayStr) return 'The date of birth can’t be in the future.';
    if (editData.dob < '1900-01-01') return 'Check the year of your date of birth.';
    if (!editData.gender || editData.gender === 'prefer_not_to_say') return 'Choose a gender option.';
    if (!editData.preferredContent.length) return 'Pick at least one kind of content you like.';
    return null;
  };

  const saveChanges = async () => {
    const problem = validateEdit();
    if (problem) {
      setSaveError(problem);
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      const formData = new FormData();
      formData.append('first_name', editData.first_name.trim());
      formData.append('last_name', editData.last_name.trim());
      formData.append('about_me', editData.bio.trim());
      formData.append('dob', editData.dob);
      formData.append('gender', editData.gender);
      formData.append('preferred_content', JSON.stringify(editData.preferredContent));

      let response;
      try {
        response = await fetch(`${apiString}/api/auth/complete-profile/`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${accessToken}` },
          body: formData,
          signal: typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(30000) : undefined,
        });
      } catch {
        throw new Error('Virsaa couldn’t be reached. Check your internet connection and try again.');
      }

      if (response.status === 401) {
        logout();
        navigate('/login');
        return;
      }
      if (response.status >= 500) throw new Error('Something went wrong on our side. Try again in a moment.');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // DRF sends { field: ['message'] }; show the first one if there's no general error
        const firstField = Object.values(errorData || {}).find((v) => Array.isArray(v) ? v.length : typeof v === 'string');
        throw new Error(errorData.error || (Array.isArray(firstField) ? firstField[0] : firstField) || 'Your changes couldn’t be saved. Try again.');
      }

      setUserData((prev) => ({
        ...prev,
        first_name: editData.first_name,
        last_name: editData.last_name,
        bio: editData.bio,
        dob: editData.dob,
        gender: editData.gender,
        preferredContent: [...editData.preferredContent],
      }));
      toast.success('Changes saved', { position: 'top-center', autoClose: 2000, theme: isDarkMode ? 'dark' : 'light' });
      setEditSection(null);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
    if (saveError) setSaveError(null);
  };

  // Pick / unpick a content type while editing
  const handleContentToggle = (content) => {
    setEditData((prev) => ({
      ...prev,
      preferredContent: prev.preferredContent.includes(content)
        ? prev.preferredContent.filter((item) => item !== content)
        : [...prev.preferredContent, content],
    }));
  };

  // Save / Cancel buttons (with any error) shown under the section being edited
  const editActions = (
    <>
      {saveError && <p className={styles.errorText} role="alert">{saveError}</p>}
      <div className={styles.actions}>
        <button type="button" className={styles.secondaryButton} onClick={cancelEditing}>
          <FaTimes aria-hidden="true" /> Cancel
        </button>
        <button type="button" className={styles.primaryButton} onClick={saveChanges} disabled={isSaving}>
          {isSaving ? <span className={styles.spinner} aria-label="Saving" /> : <><FaSave aria-hidden="true" /> Save</>}
        </button>
      </div>
    </>
  );

  const hero = (
    <PageHero
      compact
      image={headerImage}
      title="Your profile"
      subtitle="Manage your details and follow your journey through Virsaa."
      crumbs={[{ label: 'Home', to: '/' }, { label: 'My profile' }]}
    >
      <AccountTabs />
    </PageHero>
  );

  if (isLoading) {
    return (
      <div className={styles.page}>
        {hero}
        <section className={styles.section} aria-busy="true" aria-label="Loading profile">
          <div className={`${styles.identity} ${styles.panel}`}>
            <div className={`${styles.skeleton} ${styles.skeletonAvatar}`} />
            <div className={styles.identityText}>
              <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ width: '50%', height: 30 }} />
              <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ width: '30%' }} />
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (loadError || !userData) {
    return (
      <div className={styles.page}>
        {hero}
        <div className={styles.stateBox}>
          <h2>{loadError || 'Profile not found'}</h2>
          <p>Check your connection and try again.</p>
          <button type="button" className={styles.primaryButton} onClick={() => setProfileReload((n) => n + 1)}>Try again</button>
        </div>
      </div>
    );
  }

  const fullName = `${userData.first_name} ${userData.last_name}`.trim() || 'Your name';

  return (
    <div className={styles.page}>
      {hero}

      {/* ---------- Identity ---------- */}
      <section className={styles.section}>
        <div className={`${styles.identity} ${styles.panel}`}>
          <div className={styles.avatarFrame}>
            <Avatar src={userData.profile_photo} name={[userData.first_name, userData.last_name].filter(Boolean).join(' ') || userData.username} className={styles.avatar} />
          </div>

          <div className={styles.identityText}>
            {editSection === 'profile' ? (
              <div className={styles.nameEdit}>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}><FaUser aria-hidden="true" /> First name</span>
                  <input type="text" name="first_name" value={editData.first_name} onChange={handleInputChange} className={styles.input} maxLength={50} autoComplete="given-name" />
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}><FaUser aria-hidden="true" /> Last name</span>
                  <input type="text" name="last_name" value={editData.last_name} onChange={handleInputChange} className={styles.input} maxLength={50} autoComplete="family-name" />
                </label>
              </div>
            ) : (
              <h2 className={styles.name}>{fullName}</h2>
            )}

            <div className={styles.identityMeta}>
              <Link to="/premium" className={styles.membershipBadge}>
                <FaCrown aria-hidden="true" /> {membership.isMember ? `${membership.planName} member` : 'Free plan'}
              </Link>
              {userData.joinDate && <span className={styles.joined}>Joined {userData.joinDate}</span>}
            </div>

            {editSection === 'profile' && editActions}
          </div>

          {editSection !== 'profile' && (
            <button type="button" className={styles.editLink} onClick={() => startEditing('profile')}>
              <FaEdit aria-hidden="true" /> Edit name
            </button>
          )}
        </div>
      </section>

      {/* ---------- About / details / preferences ---------- */}
      <section className={`${styles.section} ${styles.grid}`}>
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h3 className={styles.panelTitle}><FaPen aria-hidden="true" /> About me</h3>
            {editSection !== 'bio' && (
              <button type="button" className={styles.editLink} onClick={() => startEditing('bio')}>
                <FaEdit aria-hidden="true" /> Edit
              </button>
            )}
          </div>
          {editSection === 'bio' ? (
            <>
              <label className={styles.srOnly} htmlFor="bio">About me</label>
              <textarea id="bio" name="bio" value={editData.bio} onChange={handleInputChange} className={styles.textarea} rows="4" maxLength={500} />
              <p className={styles.hint}>{editData.bio.length}/500 characters</p>
              {editActions}
            </>
          ) : (
            <p className={styles.bio}>{userData.bio || 'Add a few lines about yourself so others know what you’re exploring.'}</p>
          )}
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h3 className={styles.panelTitle}><FaUser aria-hidden="true" /> Personal details</h3>
            {editSection !== 'details' && (
              <button type="button" className={styles.editLink} onClick={() => startEditing('details')}>
                <FaEdit aria-hidden="true" /> Edit
              </button>
            )}
          </div>
          {editSection === 'details' ? (
            <div className={styles.detailForm}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}><FaCalendarAlt aria-hidden="true" /> Date of birth</span>
                <input type="date" name="dob" value={editData.dob} onChange={handleInputChange} className={styles.input} min="1900-01-01" />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}><FaVenusMars aria-hidden="true" /> Gender</span>
                <select name="gender" value={editData.gender} onChange={handleInputChange} className={styles.select}>
                  <option value="">Select…</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </label>
              {editActions}
            </div>
          ) : (
            <dl className={styles.details}>
              <div>
                <dt><FaCalendarAlt aria-hidden="true" /> Date of birth</dt>
                <dd>{formatDob(userData.dob) || 'Not added'}</dd>
              </div>
              <div>
                <dt><FaVenusMars aria-hidden="true" /> Gender</dt>
                <dd>{GENDER_LABELS[userData.gender] || 'Not added'}</dd>
              </div>
            </dl>
          )}
        </div>

        <div className={`${styles.panel} ${styles.contentPanel}`}>
          <div className={styles.panelHead}>
            <h3 className={styles.panelTitle}><FaHeart aria-hidden="true" /> Preferred content</h3>
            {editSection !== 'content' && (
              <button type="button" className={styles.editLink} onClick={() => startEditing('content')}>
                <FaEdit aria-hidden="true" /> Edit
              </button>
            )}
          </div>
          {editSection === 'content' ? (
            <>
              <div className={styles.chips} role="group" aria-label="Preferred content">
                {CONTENT_OPTIONS.map((content) => {
                  const on = editData.preferredContent.includes(content);
                  return (
                    <button
                      key={content}
                      type="button"
                      className={`${styles.chip} ${on ? styles.chipOn : ''}`}
                      aria-pressed={on}
                      onClick={() => handleContentToggle(content)}
                    >
                      {prettify(content)}
                    </button>
                  );
                })}
              </div>
              {editActions}
            </>
          ) : userData.preferredContent.length > 0 ? (
            <div className={styles.chips}>
              {userData.preferredContent.map((content) => (
                <span key={content} className={styles.tag}>{prettify(content)}</span>
              ))}
            </div>
          ) : (
            <p className={styles.bio}>Pick what you like to read and listen to, and we’ll show it first.</p>
          )}
        </div>
      </section>

      {/* ---------- Journey ---------- */}
      <section className={styles.section} aria-labelledby="journey-title">
        <h2 id="journey-title" className={styles.sectionTitle}>Your journey</h2>
        <p className={styles.lede}>
          {journey
            ? `Level ${journey.level} · ${journey.wallet?.xp_into_level ?? 0} of ${journey.wallet?.xp_per_level ?? 500} XP to the next level`
            : 'Your lessons, quizzes and games on Virsaa.'}
        </p>
        {learningState === 'error' && (
          <p className={styles.emptyNote} role="alert">
            Your progress couldn’t be loaded right now.{' '}
            <button type="button" className={styles.inlineButton} onClick={() => setLearningReload((n) => n + 1)}>Try again</button>
          </p>
        )}
        <div className={styles.stats} aria-busy={learningState === 'loading'}>
          <StatBox icon={<FaBook />} title="Lessons completed" value={stat(journey?.lessons_completed)} />
          <StatBox icon={<FaQuestionCircle />} title="Quizzes completed" value={stat(journey?.quizzes_completed)} />
          <StatBox icon={<FaGamepad />} title="Games played" value={stat(journey?.games_played)} />
          <StatBox icon={<FaFire />} title="Day streak" value={stat(journey?.current_streak)} />
          <StatBox icon={<FaStar />} title="XP" value={stat(journey?.xp)} />
          <StatBox icon={<FaMedal />} title="Badges" value={learningState === 'loading' ? '—' : formatNumber(badges.length)} />
        </div>
      </section>

      {/* ---------- Coins ---------- */}
      <section className={styles.section} aria-labelledby="coins-title">
        <h2 id="coins-title" className={styles.sectionTitle}>Coins</h2>
        <div className={styles.coinPanel}>
          <div className={styles.coinBalance}>
            <span className={styles.coinIcon} aria-hidden="true"><FaCoins /></span>
            <div>
              <span className={styles.coinValue}>{stat(journey?.coins)}</span>
              <span className={styles.coinLabel}>coins to spend on hints and extra time in games</span>
            </div>
          </div>
          <dl className={styles.coinTotals}>
            <div>
              <dt><FaArrowUp aria-hidden="true" /> Earned</dt>
              <dd>{stat(journey?.coins_earned_total)}</dd>
            </div>
            <div>
              <dt><FaArrowDown aria-hidden="true" /> Spent</dt>
              <dd>{stat(journey?.coins_spent_total)}</dd>
            </div>
          </dl>
          <Link to="/checkout?product=coins_250&return=/my-profile" className={styles.coinButton}>
            <FaShoppingCart aria-hidden="true" /> Buy coins
          </Link>
        </div>
      </section>

      {/* ---------- Badges ---------- */}
      <section className={styles.section} aria-labelledby="badges-title">
        <h2 id="badges-title" className={styles.sectionTitle}>Badges</h2>
        {learningState === 'loading' ? (
          <p className={styles.lede}>Loading your badges…</p>
        ) : badges.length > 0 ? (
          <ul className={styles.badgeShelf}>
            {badges.map((b) => (
              <li key={b.id} className={styles.badgeItem}>
                <span className={styles.badgeMedal} aria-hidden="true">
                  <BadgeIcon name={b.badge?.icon} image={b.badge?.image} />
                </span>
                <span className={styles.badgeName}>{b.badge?.name || b.display_name || b.badge_type}</span>
                <span className={styles.badgeDate}>{formatShortDate(b.earned_at)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.emptyNote}>
            No badges yet. Badges appear here when you finish an achievement below.
          </p>
        )}
      </section>

      <section className={styles.section} aria-labelledby="achievements-title">
        <h2 id="achievements-title" className={styles.sectionTitle}>Achievements</h2>
        {achievements.length > 0 ? (
          <>
          <p className={styles.lede}>
            {achievements.filter((a) => a.earned).length} of {achievements.length} earned
          </p>
          <ul className={styles.achievements}>
            {(showAllAchievements ? achievements : achievements.slice(0, ACHIEVEMENTS_SHOWN)).map((item) => (
              <li key={item.key} className={`${styles.achievement} ${item.earned ? styles.achievementDone : ''}`}>
                <span className={styles.achievementIcon} aria-hidden="true"><BadgeIcon name={item.icon} image={item.image} /></span>
                <div className={styles.achievementBody}>
                  <h4>{item.name}</h4>
                  <p>{item.description}{!item.earned && item.target > 1 ? ` (${formatNumber(item.current)}/${formatNumber(item.target)})` : ''}</p>
                  {(item.earned || item.coin_reward > 0 || item.xp_reward > 0) && (
                    <p className={styles.achievementMeta}>
                      {item.earned ? `Earned ${formatShortDate(item.earned_at)}` : 'Reward:'}
                      {!item.earned && item.coin_reward > 0 && <span className={styles.rewardChip}><FaCoins aria-hidden="true" /> {item.coin_reward}</span>}
                      {!item.earned && item.xp_reward > 0 && <span className={styles.rewardChip}><FaStar aria-hidden="true" /> {item.xp_reward} XP</span>}
                    </p>
                  )}
                  <div className={styles.progress} role="progressbar" aria-valuenow={item.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`${item.name} progress`}>
                    <div className={styles.progressFill} style={{ width: `${Math.min(100, item.progress)}%` }} />
                  </div>
                  <span className={styles.progressText}>{item.progress}%</span>
                </div>
              </li>
            ))}
          </ul>
          {achievements.length > ACHIEVEMENTS_SHOWN && (
            <button type="button" className={styles.secondaryButton} onClick={() => setShowAllAchievements((v) => !v)}>
              {showAllAchievements ? 'Show fewer' : `Show all ${achievements.length}`}
            </button>
          )}
          </>
        ) : learningState === 'loading' ? (
          <p className={styles.lede}>Loading achievements…</p>
        ) : (
          <p className={styles.emptyNote}>
            No achievements yet. Finish a <Link to="/learning">lesson</Link>, take a quiz or play a game to earn your first one.
          </p>
        )}
      </section>
    </div>
  );
};

// A small statistic tile
const StatBox = ({ icon, title, value }) => (
  <div className={styles.stat}>
    <span className={styles.statIcon} aria-hidden="true">{icon}</span>
    <span className={styles.statValue}>{value}</span>
    <span className={styles.statLabel}>{title}</span>
  </div>
);

export default MyProfile;
