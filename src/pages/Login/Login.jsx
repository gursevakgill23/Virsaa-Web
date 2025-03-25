import React from 'react';
import { Link } from 'react-router-dom'; // Import Link from react-router-dom
import styles from './Login.module.css';
import { FaGoogle, FaFacebook, FaGamepad, FaCoins } from 'react-icons/fa'; // React Icons
import latest_content from '../../images/Login/latest_content.jpg';
import games from '../../images/Login/games.jpg';
import formSideImage from '../../images/Login/right_section.png'; // Image for the right section of the form
import headerImageLight from '../../images/Login/background.jpeg'; // Light mode header image
import headerImageDark from '../../images/Login/background-dark.jpeg'; // Dark mode header image

const Login = ({ isDarkMode }) => {
  // Dynamically set the header image based on the theme
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

  return (
    <div className={styles.container} data-theme={isDarkMode ? 'dark' : 'light'}>
      {/* Header Section */}
      <div className={styles.header}>
        <div
          className={styles.headerImage}
          style={{ backgroundImage: `url(${headerImage})` }}
        ></div>
        <div className={styles.headerContent}>
          <div className={styles.headerText}>
            <h1>LOGIN HERE</h1>
            <p></p>
          </div>
        </div>
      </div>

      {/* Form Container with Left and Right Sections */}
      <div className={styles.formContainer}>
        {/* Left Section - Login Form */}
        <div className={styles.leftSection}>
          <h2 className={styles.formTitle}>Login</h2>
          <form className={styles.form}>
            {/* Username or Email Input */}
            <div className={styles.inputGroup}>
              <label htmlFor="username" className={styles.label}>
                Username or Email
              </label>
              <input
                type="text"
                id="username"
                className={styles.input}
                placeholder="Enter your username or email"
              />
            </div>

            {/* Password Input */}
            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.label}>
                Password
              </label>
              <input
                type="password"
                id="password"
                className={styles.input}
                placeholder="Enter your password"
              />
            </div>

            {/* Forget Password Link */}
            <div className={styles.forgotPassword}>
              <Link to="/forgot-password" className={styles.link}>
                Forgot Password?
              </Link>
            </div>

            {/* Login Button */}
            <button type="submit" className={styles.loginButton}>
              Login
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

        {/* Right Section - Signup Prompt */}
        <div className={styles.rightSection}>
          <div className={styles.rightContent}>
            <img src={formSideImage} alt="Side" className={styles.rightImage} />
            <p className={styles.rightText}>
              Join our community and explore the latest content and games tailored just for you. If
              you don't have an account
            </p>
            <Link to="/signup" className={styles.signupButton}>
              Signup
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
              <img src={content.image} alt={content.title} className={styles.cardImage} />
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