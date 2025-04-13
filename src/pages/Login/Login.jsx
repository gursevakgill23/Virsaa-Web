import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// import HCaptcha from '@hcaptcha/react-hcaptcha';
import styles from './Login.module.css';
import { FaGoogle, FaFacebook, FaGamepad, FaCoins } from 'react-icons/fa';
import latest_content from '../../images/Login/latest_content.jpg';
import games from '../../images/Login/games.jpg';
import formSideImage from '../../images/Login/right_section.png';
import headerImageLight from '../../images/Login/background.jpeg';
import headerImageDark from '../../images/Login/background-dark.jpeg';
import { useAuth } from '../../context/AuthContext';

const Login = ({ isDarkMode, apiString }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  // const [captchaToken, setCaptchaToken] = useState(null);
  // const captchaRef = useRef(null);

  const headerImage = isDarkMode ? headerImageDark : headerImageLight;

  // Dummy data for Latest Content
  const latestContent = [
    { id: 1, image: latest_content, title: 'Content 1', description: 'Description for Content 1' },
    { id: 2, image: latest_content, title: 'Content 2', description: 'Description for Content 2' },
    { id: 3, image: latest_content, title: 'Content 3', description: 'Description for Content 3' },
    { id: 4, image: latest_content, title: 'Content 4', description: 'Description for Content 4' },
    { id: 5, image: latest_content, title: 'Content 3', description: 'Description for Content 3' },
  ];

  // Dummy data for Popular in Kids
  const popularInKids = [
    { id: 1, image: games, title: 'Game 1', level: 'Beginner', fees: 50 },
    { id: 2, image: games, title: 'Game 2', level: 'Intermediate', fees: 100 },
    { id: 3, image: games, title: 'Game 3', level: 'Advanced', fees: 150 },
    { id: 4, image: games, title: 'Game 4', level: 'Expert', fees: 200 },
    { id: 5, image: games, title: 'Game 3', level: 'Advanced', fees: 150 },
  ];

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[id]) {
      setErrors(prev => ({ ...prev, [id]: '' }));
    }
  };

  // const onCaptchaVerify = (token) => {
  //   setCaptchaToken(token);
  //   if (errors.captcha) {
  //     setErrors(prev => ({ ...prev, captcha: '' }));
  //   }
  // };

  // const onCaptchaError = (error) => {
  //   console.error("hCaptcha Error:", error);
  //   setErrors(prev => ({ ...prev, captcha: 'Please complete the captcha' }));
  // };

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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${apiString}/api/Auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'captchaValidated': 'true' // Bypassing captcha validation
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          rememberMe: formData.rememberMe
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      login(data.data.accessToken, data.data.user, formData.rememberMe);
      
      toast.success('Login Successful! Redirecting...', {
        position: "top-center",
        autoClose: 2000,
        theme: isDarkMode ? "dark" : "light",
      });
      
      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      toast.error(error.message || 'An error occurred during login', {
        position: "top-center",
        autoClose: 5000,
        theme: isDarkMode ? "dark" : "light",
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
              <input
                type="password"
                id="password"
                className={`${styles.input} ${errors.password ? styles.errorInput : ''}`}
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && <div className={styles.errorMessage}>{errors.password}</div>}
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
            <img src={formSideImage} alt="Side" className={styles.rightImage} />
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
              <img src={content.image} alt={content.title} className={styles.cardImage} />
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
              <img src={game.image} alt={game.title} className={styles.cardImage} />
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