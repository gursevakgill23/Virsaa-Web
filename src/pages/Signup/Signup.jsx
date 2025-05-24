import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from './Signup.module.css';
import { FaGoogle, FaFacebook, FaGamepad, FaCoins } from 'react-icons/fa';
import ReCAPTCHA from 'react-google-recaptcha';

const latest_content = '../../images/Login/latest_content.jpg';
const games = '../../images/Login/games.jpg';
const formSideImage = '../../images/Login/right_section.png';
const headerImageLight = '../../images/Login/background.jpeg';
const headerImageDark = '../../images/Login/background-dark.jpeg';

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

const Signup = ({ isDarkMode, apiString }) => {
  const getImagePath = useProductionImagePath();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const recaptchaRef = useRef(null);

  const headerImage = isDarkMode ? headerImageDark : headerImageLight;

  const latestContent = [
    { id: 1, image: latest_content, title: 'Content 1', description: 'Description for Content 1' },
    { id: 2, image: latest_content, title: 'Content 2', description: 'Description for Content 2' },
    { id: 3, image: latest_content, title: 'Content 3', description: 'Description for Content 3' },
    { id: 4, image: latest_content, title: 'Content 4', description: 'Description for Content 4' },
    { id: 5, image: latest_content, title: 'Content 3', description: 'Description for Content 3' },
  ];

  const popularInKids = [
    { id: 1, image: games, title: 'Game 1', level: 'Beginner', fees: 50 },
    { id: 2, image: games, title: 'Game 2', level: 'Intermediate', fees: 100 },
    { id: 3, image: games, title: 'Game 3', level: 'Advanced', fees: 150 },
    { id: 4, image: games, title: 'Game 4', level: 'Expert', fees: 200 },
    { id: 5, image: games, title: 'Game 3', level: 'Advanced', fees: 150 },
  ];

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
    if (errors[id]) {
      setErrors(prev => ({
        ...prev,
        [id]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    
    if (formData.email && !emailRegex.test(formData.email)) newErrors.email = 'Invalid email format';
    if (formData.username && !usernameRegex.test(formData.username)) newErrors.username = 'Username must be 3-30 characters and contain only letters, numbers, underscore and dash';
    if (formData.password && !passwordRegex.test(formData.password)) newErrors.password = 'Password must be at least 8 characters and include uppercase, lowercase, and a number';
    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Get reCAPTCHA token
      const captchaToken = recaptchaRef.current.getValue();
      if (!captchaToken) {
        setErrors(prev => ({ ...prev, captcha: 'Please complete the reCAPTCHA challenge' }));
        throw new Error('Please complete the reCAPTCHA challenge');
      }

      const response = await fetch(`${apiString}/api/auth/signup/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          username: formData.username,
          email: formData.email,
          password: formData.password,
          confirm_password: formData.confirmPassword,
          captcha: captchaToken
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      // Skip logging in the user
      // Removed: login(data.access, { id: data.user.id, username: data.user.username, email: data.user.email }, false);

      toast.success('Registration Successful! Redirecting to Login...', {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: isDarkMode ? 'dark' : 'light',
      });
      
      setTimeout(() => {
        navigate('/login');  // Redirect to login page instead of home
      }, 3000);
    } catch (error) {
      toast.error(error.message || 'An error occurred during registration', {
        position: 'top-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: isDarkMode ? 'dark' : 'light',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Debug environment variables
  useEffect(() => {
    console.log('RECAPTCHA Public Key:', process.env.REACT_APP_RECAPTCHA_PUBLIC_KEY);
    console.log('API URL:', apiString);
    console.log('All process.env:', process.env);
  }, [apiString]);

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
            <h1>SIGNUP HERE</h1>
          </div>
        </div>
      </div>

      {/* Form Container with Left and Right Sections */}
      <div className={styles.formContainer}>
        {/* Left Section - Signup Form */}
        <div className={styles.leftSection}>
          <h2 className={styles.formTitle}>Signup</h2>
          <form className={styles.form} onSubmit={handleSubmit}>
            {/* First Name */}
            <div className={styles.inputGroup}>
              <label htmlFor="firstName" className={styles.label}>
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                className={`${styles.input} ${errors.firstName ? styles.errorInput : ''}`}
                placeholder="Enter your first name"
                value={formData.firstName}
                onChange={handleChange}
              />
              {errors.firstName && <div className={styles.errorMessage}>{errors.firstName}</div>}
            </div>
            
            {/* Last Name */}
            <div className={styles.inputGroup}>
              <label htmlFor="lastName" className={styles.label}>
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                className={`${styles.input} ${errors.lastName ? styles.errorInput : ''}`}
                placeholder="Enter your last name"
                value={formData.lastName}
                onChange={handleChange}
              />
              {errors.lastName && <div className={styles.errorMessage}>{errors.lastName}</div>}
            </div>
            
            {/* Username */}
            <div className={styles.inputGroup}>
              <label htmlFor="username" className={styles.label}>
                Username
              </label>
              <input
                type="text"
                id="username"
                className={`${styles.input} ${errors.username ? styles.errorInput : ''}`}
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleChange}
              />
              {errors.username && <div className={styles.errorMessage}>{errors.username}</div>}
            </div>
            
            {/* Email */}
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

            {/* Password */}
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

            {/* Confirm Password */}
            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                className={`${styles.input} ${errors.confirmPassword ? styles.errorInput : ''}`}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              {errors.confirmPassword && <div className={styles.errorMessage}>{errors.confirmPassword}</div>}
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

            {/* Signup Button */}
            <button
              type="submit"
              className={styles.signupButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className={styles.spinner}></span>
              ) : 'Signup'}
            </button>

            {/* Social Signup Buttons */}
            <div className={styles.socialLogin}>
              <button type="button" className={styles.googleButton}>
                <FaGoogle /> Signup with Google
              </button>
              <button type="button" className={styles.facebookButton}>
                <FaFacebook /> Signup with Facebook
              </button>
            </div>
          </form>
        </div>

        {/* Right Section - Login Prompt */}
        <div className={styles.rightSection}>
          <div className={styles.rightContent}>
            <img src={getImagePath(formSideImage)} alt="Side" className={styles.rightImage} />
            <p className={styles.rightText}>
              Login to our community and explore the latest content and games tailored just for you.
              Already have an account?
            </p>
            <Link to="/login" className={styles.loginButton}>
              Login
            </Link>
          </div>
        </div>
      </div>

      {/* Latest Content Section */}
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

      {/* Popular in Kids Section */}
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

export default Signup;