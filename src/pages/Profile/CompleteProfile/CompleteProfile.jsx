import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaCamera, FaUser, FaPen, FaCalendarAlt, FaVenusMars, FaHeart, FaCheck } from 'react-icons/fa';
import axios from 'axios';
import PageHero from '../../../components/PageHero/PageHero';
import { useAuth } from '../../../context/AuthContext';
import styles from './CompleteProfile.module.css';

const getImagePath = (imagePath) => {
  if (process.env.NODE_ENV === 'production') {
    if (typeof imagePath === 'string') {
      return imagePath.startsWith('/')
        ? imagePath
        : `/${imagePath.replace(/.*static\/media/, 'static/media')}`;
    }
    return imagePath.default || imagePath;
  }
  return imagePath;
};

const PLACEHOLDER_PHOTO = '/images/Login/user-placeholder.jpg';
const CONTENT_OPTIONS = ['fiction', 'sikh_history', 'punjabi_culture', 'spirituality', 'non_fiction', 'poetry', 'audiobook', 'ebook'];

const prettify = (value = '') => {
  const text = String(value).replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
};

// "prefer_not_to_say" is the backend default, so it means "not chosen yet"
const initialGender = (value) => (value && value !== 'prefer_not_to_say' ? value : '');

const CompleteProfile = ({ isDarkMode, apiString, profile, onCompleted }) => {
  const { userData: authUser, accessToken, updateUserData } = useAuth();
  // Prefer the fresh profile from ProfileRoute; fall back to what login stored
  const userData = profile || authUser;
  const navigate = useNavigate();
  const headerImage = getImagePath(isDarkMode ? '/images/header-image-dark.png' : '/images/header-image.png');
  const toastTheme = isDarkMode ? 'dark' : 'light';

  const [formData, setFormData] = useState({
    first_name: userData?.first_name || '',
    last_name: userData?.last_name || '',
    profile_photo: null,
    about_me: userData?.about_me || '',
    preferred_content: userData?.preferred_content || [],
    dob: userData?.dob || '',
    gender: initialGender(userData?.gender),
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(userData?.profile_photo || null);

  // Signed-out visitors can't complete a profile
  useEffect(() => {
    if (!accessToken) {
      toast.error('Sign in to complete your profile', { position: 'top-center', autoClose: 3000, theme: toastTheme });
      navigate('/login');
    }
  }, [accessToken, navigate, toastTheme]);

  // Free the temporary preview URL when it changes
  useEffect(() => () => {
    if (previewPhoto && previewPhoto.startsWith('blob:')) URL.revokeObjectURL(previewPhoto);
  }, [previewPhoto]);

  const clearError = (key) => {
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const handleChange = (e) => {
    const { id, value, type, files } = e.target;
    if (type === 'file') {
      const file = files[0];
      if (file && !file.type.startsWith('image/')) {
        setErrors((prev) => ({ ...prev, profile_photo: 'Choose a JPG, PNG or WebP image.' }));
        return;
      }
      setFormData((prev) => ({ ...prev, profile_photo: file || null }));
      setPreviewPhoto(file ? URL.createObjectURL(file) : userData?.profile_photo || null);
    } else {
      setFormData((prev) => ({ ...prev, [id]: value }));
    }
    clearError(id);
  };

  const handleContentToggle = (content) => {
    setFormData((prev) => ({
      ...prev,
      preferred_content: prev.preferred_content.includes(content)
        ? prev.preferred_content.filter((item) => item !== content)
        : [...prev.preferred_content, content],
    }));
    clearError('preferred_content');
  };

  const validateForm = () => {
    const next = {};
    if (!formData.first_name.trim()) next.first_name = 'Add your first name.';
    if (!formData.last_name.trim()) next.last_name = 'Add your last name.';
    if (!formData.profile_photo && !userData?.profile_photo) next.profile_photo = 'Add a profile photo.';
    if (!formData.about_me.trim()) next.about_me = 'Write a line or two about yourself.';
    if (formData.preferred_content.length === 0) next.preferred_content = 'Pick at least one.';
    if (!formData.dob) next.dob = 'Add your date of birth.';
    if (!formData.gender) next.gender = 'Choose an option.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Some details are missing. Check the highlighted fields.', { position: 'top-center', autoClose: 3000, theme: toastTheme });
      return;
    }
    if (!accessToken) {
      navigate('/login');
      return;
    }

    setIsSubmitting(true);
    const body = new FormData();
    body.append('first_name', formData.first_name);
    body.append('last_name', formData.last_name);
    if (formData.profile_photo) body.append('profile_photo', formData.profile_photo);
    body.append('about_me', formData.about_me);
    body.append('preferred_content', JSON.stringify(formData.preferred_content));
    body.append('dob', formData.dob);
    body.append('gender', formData.gender);

    try {
      const response = await axios.put(`${apiString}/api/auth/complete-profile/`, body, {
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'multipart/form-data' },
      });
      updateUserData(response.data);
      toast.success('Profile saved', { position: 'top-center', autoClose: 2000, theme: toastTheme });
      if (onCompleted) {
        setTimeout(() => onCompleted(response.data), 900); // ProfileRoute switches to MyProfile
      } else {
        setTimeout(() => navigate('/my-profile'), 1200);
      }
    } catch (error) {
      let message = 'Your profile couldn’t be saved. Try again.';
      if (error.response?.status === 401) {
        toast.error('Your session expired. Sign in again.', { position: 'top-center', autoClose: 3000, theme: toastTheme });
        navigate('/login');
        return;
      }
      if (error.response?.data && typeof error.response.data === 'object') {
        const fieldErrors = Object.entries(error.response.data)
          .map(([key, value]) => `${prettify(key)}: ${value}`)
          .join('; ');
        message = fieldErrors || message;
      } else if (error.request && !error.response) {
        message = 'The server didn’t respond. Check your connection.';
      }
      toast.error(message, { position: 'top-center', autoClose: 5000, theme: toastTheme });
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayName = `${formData.first_name} ${formData.last_name}`.trim();
  const required = ['first_name', 'last_name', 'about_me', 'dob', 'gender'];
  const doneCount = required.filter((k) => String(formData[k]).trim()).length
    + (formData.preferred_content.length ? 1 : 0)
    + (previewPhoto ? 1 : 0);
  const totalCount = required.length + 2;

  return (
    <div className={styles.page}>
      <PageHero
        compact
        image={headerImage}
        title="Complete your profile"
        subtitle="A few details so Virsaa can show you what you love first."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'My profile', to: '/my-profile' }, { label: 'Complete profile' }]}
      />

      <form className={`${styles.section} ${styles.layout}`} onSubmit={handleSubmit} noValidate>
        {/* ---------- Photo + progress ---------- */}
        <aside className={`${styles.panel} ${styles.photoCard}`}>
          <div className={`${styles.avatarFrame} ${errors.profile_photo ? styles.avatarError : ''}`}>
            <img src={previewPhoto || getImagePath(PLACEHOLDER_PHOTO)} alt="" className={styles.avatar} />
            <label htmlFor="profile_photo" className={styles.cameraButton}>
              <FaCamera aria-hidden="true" />
              <span className={styles.srOnly}>Choose profile photo</span>
              <input type="file" id="profile_photo" accept="image/*" onChange={handleChange} className={styles.fileInput} />
            </label>
          </div>
          <h2 className={styles.previewName}>{displayName || 'Your name'}</h2>
          {errors.profile_photo
            ? <p className={styles.errorText}>{errors.profile_photo}</p>
            : <p className={styles.hint}>Tap the camera to add a photo.</p>}

          <div className={styles.progressBlock}>
            <div className={styles.progressHead}>
              <span>Profile progress</span>
              <span>{doneCount}/{totalCount}</span>
            </div>
            <div className={styles.progress} role="progressbar" aria-valuenow={doneCount} aria-valuemin={0} aria-valuemax={totalCount} aria-label="Profile progress">
              <div className={styles.progressFill} style={{ width: `${(doneCount / totalCount) * 100}%` }} />
            </div>
          </div>
        </aside>

        {/* ---------- Details ---------- */}
        <div className={`${styles.panel} ${styles.formPanel}`}>
          <h2 className={styles.panelTitle}>Your details</h2>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="first_name" className={styles.fieldLabel}><FaUser aria-hidden="true" /> First name</label>
              <input type="text" id="first_name" autoComplete="given-name"
                className={`${styles.input} ${errors.first_name ? styles.inputError : ''}`}
                value={formData.first_name} onChange={handleChange} placeholder="e.g. Harpreet" />
              {errors.first_name && <p className={styles.errorText}>{errors.first_name}</p>}
            </div>
            <div className={styles.field}>
              <label htmlFor="last_name" className={styles.fieldLabel}><FaUser aria-hidden="true" /> Last name</label>
              <input type="text" id="last_name" autoComplete="family-name"
                className={`${styles.input} ${errors.last_name ? styles.inputError : ''}`}
                value={formData.last_name} onChange={handleChange} placeholder="e.g. Kaur" />
              {errors.last_name && <p className={styles.errorText}>{errors.last_name}</p>}
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="about_me" className={styles.fieldLabel}><FaPen aria-hidden="true" /> About me</label>
            <textarea id="about_me" rows="4" maxLength={500}
              className={`${styles.textarea} ${errors.about_me ? styles.inputError : ''}`}
              value={formData.about_me} onChange={handleChange}
              placeholder="What brings you to Virsaa? What do you like to read or learn?" />
            <div className={styles.fieldFoot}>
              {errors.about_me ? <p className={styles.errorText}>{errors.about_me}</p> : <span />}
              <span className={styles.hint}>{formData.about_me.length}/500</span>
            </div>
          </div>

          <fieldset className={styles.fieldset}>
            <legend className={styles.fieldLabel}><FaHeart aria-hidden="true" /> What do you enjoy?</legend>
            <div className={styles.chips}>
              {CONTENT_OPTIONS.map((content) => {
                const on = formData.preferred_content.includes(content);
                return (
                  <button
                    key={content}
                    type="button"
                    className={`${styles.chip} ${on ? styles.chipOn : ''}`}
                    aria-pressed={on}
                    onClick={() => handleContentToggle(content)}
                  >
                    {on && <FaCheck aria-hidden="true" />} {prettify(content)}
                  </button>
                );
              })}
            </div>
            {errors.preferred_content && <p className={styles.errorText}>{errors.preferred_content}</p>}
          </fieldset>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="dob" className={styles.fieldLabel}><FaCalendarAlt aria-hidden="true" /> Date of birth</label>
              <input type="date" id="dob" autoComplete="bday"
                className={`${styles.input} ${errors.dob ? styles.inputError : ''}`}
                value={formData.dob} onChange={handleChange} />
              {errors.dob && <p className={styles.errorText}>{errors.dob}</p>}
            </div>
            <div className={styles.field}>
              <label htmlFor="gender" className={styles.fieldLabel}><FaVenusMars aria-hidden="true" /> Gender</label>
              <select id="gender"
                className={`${styles.select} ${errors.gender ? styles.inputError : ''}`}
                value={formData.gender} onChange={handleChange}>
                <option value="">Select…</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {errors.gender && <p className={styles.errorText}>{errors.gender}</p>}
            </div>
          </div>

          <div className={styles.actions}>
            <button type="submit" className={styles.primaryButton} disabled={isSubmitting}>
              {isSubmitting ? <><span className={styles.spinner} aria-hidden="true" /> Saving…</> : 'Save profile'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CompleteProfile;
