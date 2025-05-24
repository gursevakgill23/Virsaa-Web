import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaCamera, FaUser, FaPen, FaCalendarAlt, FaVenusMars, FaHeart } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import styles from './CompleteProfile.module.css';

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

const CompleteProfile = ({ isDarkMode, apiString }) => {
  const { userData, accessToken, updateUserData } = useAuth();
  const navigate = useNavigate();
  const getImagePath = useProductionImagePath();

  const header_image_light = '../../../images/Gurbani/header-image.png';
  const header_image_dark = '../../../images/Gurbani/header-image-dark.png';
  const placeholder_user_image = '../../../images/placeholder-user.png';

  const [formData, setFormData] = useState({
    first_name: userData?.first_name || '',
    last_name: userData?.last_name || '',
    profile_photo: null,
    about_me: userData?.about_me || '',
    preferred_content: userData?.preferred_content || [],
    dob: userData?.dob || '',
    gender: userData?.gender || 'prefer_not_to_say',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(userData?.profile_photo || null);

  const contentOptions = [
    'fiction', 'sikh_history', 'punjabi_culture', 'spirituality',
    'non_fiction', 'poetry', 'audiobook', 'ebook'
  ];

  // Debug accessToken and redirect if missing
  useEffect(() => {
    console.log('Access Token:', accessToken);
    if (!accessToken) {
      toast.error('Please log in to complete your profile', {
        position: 'top-center',
        autoClose: 3000,
        theme: isDarkMode ? 'dark' : 'light',
      });
      navigate('/login');
    }
  }, [accessToken, navigate, isDarkMode]);

  const handleChange = (e) => {
    const { id, value, type, files } = e.target;
    if (type === 'file') {
      const file = files[0];
      setFormData((prev) => ({ ...prev, profile_photo: file }));
      setPreviewPhoto(file ? URL.createObjectURL(file) : userData?.profile_photo);
    } else {
      setFormData((prev) => ({ ...prev, [id]: value }));
    }
    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: '' }));
    }
  };

  const handleContentToggle = (content) => {
    setFormData((prev) => {
      const newContent = prev.preferred_content.includes(content)
        ? prev.preferred_content.filter((item) => item !== content)
        : [...prev.preferred_content, content];
      return { ...prev, preferred_content: newContent };
    });
    if (errors.preferred_content) {
      setErrors((prev) => ({ ...prev, preferred_content: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.profile_photo && !userData?.profile_photo) newErrors.profile_photo = 'Profile photo is required';
    if (!formData.about_me.trim()) newErrors.about_me = 'About me is required';
    if (formData.preferred_content.length === 0) newErrors.preferred_content = 'Select at least one preference';
    if (!formData.dob) newErrors.dob = 'Date of birth is required';
    if (formData.gender === 'prefer_not_to_say') newErrors.gender = 'Please select a gender';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fill in all required fields', {
        position: 'top-center',
        autoClose: 3000,
        theme: isDarkMode ? 'dark' : 'light',
      });
      return;
    }

    if (!accessToken) {
      toast.error('Authentication required. Redirecting to login...', {
        position: 'top-center',
        autoClose: 3000,
        theme: isDarkMode ? 'dark' : 'light',
      });
      navigate('/login');
      return;
    }

    setIsSubmitting(true);
    const formDataToSend = new FormData();
    formDataToSend.append('first_name', formData.first_name);
    formDataToSend.append('last_name', formData.last_name);
    if (formData.profile_photo) {
      formDataToSend.append('profile_photo', formData.profile_photo);
    }
    formDataToSend.append('about_me', formData.about_me);
    formDataToSend.append('preferred_content', JSON.stringify(formData.preferred_content));
    formDataToSend.append('dob', formData.dob);
    formDataToSend.append('gender', formData.gender);

    try {
      const response = await axios.put(
        `${apiString}/api/auth/complete-profile/`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      updateUserData(response.data);
      toast.success('Profile updated successfully!', {
        position: 'top-center',
        autoClose: 2000,
        theme: isDarkMode ? 'dark' : 'light',
      });

      setTimeout(() => navigate('/my-profile'), 2000);
    } catch (error) {
      let errorMessage = 'Failed to update profile';
      if (error.response?.status === 401) {
        errorMessage = 'Session expired. Please log in again.';
        toast.error(errorMessage, {
          position: 'top-center',
          autoClose: 3000,
          theme: isDarkMode ? 'dark' : 'light',
        });
        navigate('/login');
      } else if (error.response?.data) {
        if (typeof error.response.data === 'object') {
          const errorFields = Object.entries(error.response.data)
            .map(([key, value]) => `${key.replace('_', ' ')}: ${value}`)
            .join('; ');
          errorMessage = errorFields || errorMessage;
        } else {
          errorMessage = error.response.data.detail || errorMessage;
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your connection.';
      }

      toast.error(errorMessage, {
        position: 'top-center',
        autoClose: 5000,
        theme: isDarkMode ? 'dark' : 'light',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <img
          src={getImagePath(isDarkMode ? header_image_dark : header_image_light)}
          alt="Profile Header"
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
        <Link to="/account"><span>My Account</span></Link> /
        <span>Complete Profile</span>
      </div>

      {/* Profile Section */}
      <div className={styles.profileSection}>
        <div className={styles.avatarWrapper}>
          <img
            src={previewPhoto || getImagePath(placeholder_user_image)}
            alt="User"
            className={styles.avatar}
          />
          <label htmlFor="profile_photo" className={styles.editButton}>
            <FaCamera />
            <input
              type="file"
              id="profile_photo"
              accept="image/*"
              onChange={handleChange}
              className={styles.fileInput}
            />
          </label>
        </div>
        <div className={styles.profileInfo}>
          <h2>{userData?.first_name && userData?.last_name
            ? `${formData.first_name || userData.first_name} ${formData.last_name || userData.last_name}`
            : 'Complete Your Profile'}</h2>
          <p>Please fill in all details to personalize your experience.</p>
        </div>
      </div>

      {/* Form Section */}
      <div className={styles.formSection}>
        <h3 className={styles.sectionTitle}>Profile Details</h3>
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* First Name */}
          <div className={styles.inputGroup}>
            <label htmlFor="first_name" className={styles.label}>
              <FaUser /> First Name
            </label>
            <input
              type="text"
              id="first_name"
              className={`${styles.input} ${errors.first_name ? styles.errorInput : ''}`}
              value={formData.first_name}
              onChange={handleChange}
              placeholder="Enter your first name"
            />
            {errors.first_name && <div className={styles.error}>{errors.first_name}</div>}
          </div>

          {/* Last Name */}
          <div className={styles.inputGroup}>
            <label htmlFor="last_name" className={styles.label}>
              <FaUser /> Last Name
            </label>
            <input
              type="text"
              id="last_name"
              className={`${styles.input} ${errors.last_name ? styles.errorInput : ''}`}
              value={formData.last_name}
              onChange={handleChange}
              placeholder="Enter your last name"
            />
            {errors.last_name && <div className={styles.error}>{errors.last_name}</div>}
          </div>

          {/* About Me */}
          <div className={styles.inputGroup}>
            <label htmlFor="about_me" className={styles.label}>
              <FaPen /> About Me
            </label>
            <textarea
              id="about_me"
              className={`${styles.textarea} ${errors.about_me ? styles.errorInput : ''}`}
              value={formData.about_me}
              onChange={handleChange}
              placeholder="Tell us about yourself (max 500 characters)"
              maxLength={500}
              rows="4"
            />
            {errors.about_me && <div className={styles.error}>{errors.about_me}</div>}
          </div>

          {/* Preferred Content */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>
              <FaHeart /> Preferred Content
            </label>
            <div className={styles.contentGrid}>
              {contentOptions.map((content) => (
                <button
                  key={content}
                  type="button"
                  className={`${styles.contentButton} ${
                    formData.preferred_content.includes(content) ? styles.selected : ''
                  }`}
                  onClick={() => handleContentToggle(content)}
                >
                  {content.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>
            {errors.preferred_content && (
              <div className={styles.error}>{errors.preferred_content}</div>
            )}
          </div>

          {/* Date of Birth */}
          <div className={styles.inputGroup}>
            <label htmlFor="dob" className={styles.label}>
              <FaCalendarAlt /> Date of Birth
            </label>
            <input
              type="date"
              id="dob"
              className={`${styles.input} ${errors.dob ? styles.errorInput : ''}`}
              value={formData.dob}
              onChange={handleChange}
              placeholder="Select your date of birth"
            />
            {errors.dob && <div className={styles.error}>{errors.dob}</div>}
          </div>

          {/* Gender */}
          <div className={styles.inputGroup}>
            <label htmlFor="gender" className={styles.label}>
              <FaVenusMars /> Gender
            </label>
            <select
              id="gender"
              className={`${styles.select} ${errors.gender ? styles.errorInput : ''}`}
              value={formData.gender}
              onChange={handleChange}
            >
              <option value="prefer_not_to_say">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            {errors.gender && <div className={styles.error}>{errors.gender}</div>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className={styles.spinner}></span>
            ) : (
              'Save Profile'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfile;