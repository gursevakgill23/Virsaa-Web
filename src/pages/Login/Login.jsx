import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ReCAPTCHA from 'react-google-recaptcha';
import styles from './Login.module.css';
import { FaGoogle, FaFacebook, FaGamepad, FaCoins, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

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

const Login = ({ isDarkMode, apiString }) => {
  const getImagePath = useProductionImagePath();
  const { login } = useAuth();
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);

  const formSideImage = '/images/Login/right_section.png';
  const headerImageLight = '/images/Login/background.jpeg';
  const headerImageDark = '/images/Login/background-dark.jpeg';
  const latest_content = '/images/Login/latest_content.jpg';
  const games = '../../images/Login/games.jpg';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const headerImage = isDarkMode ? headerImageDark : headerImageLight;

  const latestContent = [
    { id: 1, image: latest_content, title: 'Content 1', description: 'Description for Content 1' },
    { id: 2, image: latest_content, title: 'Content 2', description: 'Description for Content 2' },
    { id: 3, image: latest_content, title: 'Content 3', description: 'Description for Content 3' },
    { id: 4, image: latest_content, title: 'Content 4', description: 'Description for Content 4' },
    { id: 5, image: latest_content, title: 'Content 5', description: 'Description for Content 5' },
  ];

  const popularInKids = [
    { id: 1, image: games, title: 'Game 1', level: 'Beginner', fees: 50 },
    { id: 2, image: games, title: 'Game 2', level: 'Intermediate', fees: 100 },
    { id: 3, image: games, title: 'Game 3', level: 'Advanced', fees: 150 },
    { id: 4, image: games, title: 'Game 4', level: 'Expert', fees: 200 },
    { id: 5, image: games, title: 'Game 5', level: 'Advanced', fees: 150 },
  ];

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value,
    }));
    if (errors[id]) {
      setErrors(prev => ({ ...prev, [id]: '' }));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    const captchaToken = recaptchaRef.current?.getValue();
    if (!captchaToken) {
      newErrors.captcha = 'Please complete the reCAPTCHA challenge';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const captchaToken = recaptchaRef.current.getValue();
      if (!captchaToken) {
        throw new Error('Please complete the reCAPTCHA challenge');
      }

      console.log('Submitting login request to:', `${apiString}/api/auth/login/`);
      const response = await axios.post(`${apiString}/api/auth/login/`, {
        login: formData.email,
        password: formData.password,
        captcha: captchaToken,
      });

      console.log('Login response:', response.data);
      login(
        response.data.access,
        response.data.refresh,
        {
          id: response.data.user.id,
          username: response.data.user.username,
          email: response.data.user.email,
          first_name: response.data.user.first_name,
          last_name: response.data.user.last_name,
          profile_photo: response.data.user.profile_photo,
          membership_level: response.data.user.membership_level,
          last_logined: response.data.user.last_logined,
          joined_date: response.data.user.joined_date,
          theme_preference: response.data.user.theme_preference,
        },
        formData.rememberMe
      );

      toast.success('Login Successful! Redirecting...', {
        position: 'top-center',
        autoClose: 2000,
        theme: isDarkMode ? 'dark' : 'light',
      });

      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      const errorMessage = error.response?.data?.login?.[0] ||
                          error.response?.data?.error ||
                          error.message ||
                          'An error occurred during login';
      console.error('Login error:', errorMessage);
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
    <div className={styles.container} data-theme={isDarkMode ? 'dark' : 'light'}>
      <ToastContainer />

      {/* Header Section */}
      <div className={styles.header}>
        <div
          className={styles.headerImage}
          style={{ backgroundImage: `url(${headerImage})` }}
        ></div>
        <div className={styles.headerContent}>
          <div className={styles.headerText}>
            <h1>LOGIN HERE</h1>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className={styles.formContainer}>
        <div className={styles.leftSection}>
          <h2 className={styles.formTitle}>Login</h2>
          <form className={styles.form} onSubmit={handleSubmit}>
            {/* Email Input */}
            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.label}>
                Email
              </label>
              <input
                type="email"
                id="email"
                className={`${styles.input} ${errors.email ? styles.errorInput : ''}`}
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && <div className={styles.errorMessage}>{errors.email}</div>}
            </div>

            {/* Password Input */}
            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.label}>
                Password
              </label>
              <div className={styles.passwordContainer}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className={`${styles.input} ${errors.password ? styles.errorInput : ''}`}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && <div className={styles.errorMessage}>{errors.password}</div>}
            </div>

            {/* reCAPTCHA */}
            <div className={styles.inputGroup}>
              <ReCAPTCHA
                ref={recaptchaRef}
                size="normal"
                sitekey={process.env.REACT_APP_RECAPTCHA_PUBLIC_KEY}
              />
              {errors.captcha && <div className={styles.errorMessage}>{errors.captcha}</div>}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className={styles.rememberForgot}>
              <div className={styles.rememberMe}>
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className={styles.checkboxInput}
                />
                <label htmlFor="rememberMe" className={styles.checkboxLabel}>
                  Remember me
                </label>
              </div>
              <Link to="/forgot-password" className={styles.forgotPassword}>
                Forgot Password?
              </Link>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className={styles.loginButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className={styles.spinner}></span>
              ) : 'Login'}
            </button>

            {/* Social Login Buttons */}
            <div className={styles.socialLogin}>
              <button type="button" className={styles.googleButton}>
                <FaGoogle /> Login with Google
              </button>
              <button type="button" className={styles.facebookButton}>
                <FaFacebook /> Login with Facebook
              </button>
            </div>
          </form>
        </div>

        {/* Right Section */}
        <div className={styles.rightSection}>
          <div className={styles.rightContent}>
            <img src={getImagePath(formSideImage)} alt="Side" className={styles.rightImage} />
            <p className={styles.rightText}>
              Join our community and explore the latest content and games tailored just for you.
            </p>
            <Link to="/signup" className={styles.signupButton}>
              Signup
            </Link>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className={styles.latestContent}>
        <h2 className={styles.sectionTitle}>Latest Content</h2>
        <div className={styles.cardGrid}>
          {latestContent.map((content) => (
            <div key={content.id} className={styles.card}>
              <img src={getImagePath(content.image)} alt={content.title} className={styles.cardImage} />
              <h3 className={styles.cardTitle}>{content.title}</h3>
              <p className={styles.cardDescription}>{content.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.popularInKids}>
        <h2 className={styles.sectionTitle}>Popular in Kids</h2>
        <div className={styles.cardGrid}>
          {popularInKids.map((game) => (
            <div key={game.id} className={styles.card}>
              <img src={getImagePath(game.image)} alt={game.title} className={styles.cardImage} />
              <h3 className={styles.cardTitle}>{game.title}</h3>
              <p className={styles.cardInfo}>
                <FaGamepad /> Level: {game.level}
              </p>
              <p className={styles.cardInfo}>
                <FaCoins /> Fees: {game.fees} coins
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Login;