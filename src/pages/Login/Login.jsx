import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ReCAPTCHA from 'react-google-recaptcha';
import styles from './Login.module.css';
import {
  FaGoogle, FaFacebook, FaEye, FaEyeSlash, FaBook, FaRegFileAudio,
  FaHeart, FaHistory, FaGamepad,
} from 'react-icons/fa';
import { FaHandsPraying } from 'react-icons/fa6';
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

const PERKS = [
  { icon: <FaBook />, title: 'Your reading, saved', text: 'Pick up any ebook where you left off.' },
  { icon: <FaHeart />, title: 'Favourites in one place', text: 'Save books, audiobooks and shabads to come back to.' },
  { icon: <FaHandsPraying />, title: 'Full Hukamnama', text: 'Read the daily Hukamnama with English translation and arth.' },
];

const FEATURES = [
  { to: '/collections/ebooks', icon: <FaBook />, title: 'Ebooks', text: 'Punjabi books on history, poetry and Sikhi.' },
  { to: '/collections/audiobooks', icon: <FaRegFileAudio />, title: 'Audiobooks', text: 'Narrated books and kirtan to listen anywhere.' },
  { to: '/learning', icon: <FaGamepad />, title: 'Games and quizzes', text: 'Shabd Khoj, Memory Match and topic quizzes.' },
  { to: '/my-favorites', icon: <FaHeart />, title: 'My favourites', text: 'Everything you’ve saved, on every device.' },
  { to: '/history', icon: <FaHistory />, title: 'History', text: 'See what you’ve read and listened to recently.' },
  { to: '/gurbani', icon: <FaHandsPraying />, title: 'Gurbani', text: 'Read and listen with meanings.' },
];

const FAQS = [
  {
    q: 'I forgot my password. What do I do?',
    a: 'Choose “Forgot password?” under the form. We’ll email you a link to set a new one.',
  },
  {
    q: 'Can I sign in with my username?',
    a: 'Yes. Enter either the email address or the username you signed up with.',
  },
  {
    q: 'What does “Remember me” do?',
    a: 'It keeps you signed in on this device after you close the browser. Leave it off on shared computers.',
  },
  {
    q: 'Do I need Premium to use Virsaa?',
    a: 'No. A free account gives you the library, games and Gurbani. Premium unlocks extra audiobook chapters and more.',
  },
];

const Login = ({ isDarkMode, apiString = process.env.REACT_APP_API_URL }) => {
  const getImagePath = useProductionImagePath();
  const { login } = useAuth();
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);

  const formSideImage = '/images/Login/right_section.png';
  const headerImageLight = '/images/Login/background.jpeg';
  const headerImageDark = '/images/Login/background-dark.jpeg';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const headerImage = isDarkMode ? headerImageDark : headerImageLight;

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value,
    }));
    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: '' }));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Enter your email or username';
    }

    if (!formData.password) {
      newErrors.password = 'Enter your password';
    }

    const captchaToken = recaptchaRef.current?.getValue();
    if (!captchaToken) {
      newErrors.captcha = 'Tick the reCAPTCHA box to continue';
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
        throw new Error('Tick the reCAPTCHA box to continue');
      }

      const payload = {
        login: formData.email.trim(),
        password: formData.password,
        captcha: captchaToken,
      };

      const response = await axios.post(`${apiString}/api/auth/login/`, payload);

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

      toast.success('Signed in. Taking you home…', {
        position: 'top-center',
        autoClose: 2000,
        theme: isDarkMode ? 'dark' : 'light',
      });

      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      const errorMessage =
        error.response?.data?.login?.[0] ||
        error.response?.data?.error ||
        error.response?.data?.captcha?.[0] ||
        error.message ||
        'Sign in failed. Check your details and try again.';
      console.error('Login error:', error.response?.status || error.message);
      toast.error(errorMessage, {
        position: 'top-center',
        autoClose: 5000,
        theme: isDarkMode ? 'dark' : 'light',
      });
    } finally {
      setIsSubmitting(false);
      recaptchaRef.current?.reset();
    }
  };

  return (
    <div className={styles.container}>
      {/* ---------- Hero with floating glass form ---------- */}
      <section className={styles.hero}>
        <div
          className={styles.heroImage}
          style={{ backgroundImage: `url(${headerImage})` }}
          aria-hidden="true"
        />
        <div className={styles.heroShade} aria-hidden="true" />

        <div className={styles.heroInner}>
          <div className={styles.formCard}>
            <p className={styles.gurmukhi} lang="pa">ਜੀ ਆਇਆਂ ਨੂੰ</p>
            <h1 className={styles.formTitle}>Welcome back</h1>
            <p className={styles.formLede}>Sign in to continue reading, listening and learning.</p>

            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              <div className={styles.inputGroup}>
                <label htmlFor="email" className={styles.label}>Email or username</label>
                <input
                  type="text"
                  id="email"
                  autoComplete="username"
                  className={`${styles.input} ${errors.email ? styles.errorInput : ''}`}
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  aria-invalid={!!errors.email}
                />
                {errors.email && <div className={styles.errorMessage}>{errors.email}</div>}
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="password" className={styles.label}>Password</label>
                <div className={styles.passwordContainer}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    autoComplete="current-password"
                    className={`${styles.input} ${errors.password ? styles.errorInput : ''}`}
                    placeholder="Your password"
                    value={formData.password}
                    onChange={handleChange}
                    aria-invalid={!!errors.password}
                  />
                  <button
                    type="button"
                    className={styles.togglePassword}
                    onClick={togglePasswordVisibility}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.password && <div className={styles.errorMessage}>{errors.password}</div>}
              </div>

              <div className={styles.rememberForgot}>
                <label htmlFor="rememberMe" className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className={styles.checkboxInput}
                  />
                  Remember me
                </label>
                <Link to="/forgot-password" className={styles.inlineLink}>Forgot password?</Link>
              </div>

              <div className={styles.captcha}>
                <ReCAPTCHA
                  ref={recaptchaRef}
                  size="normal"
                  theme={isDarkMode ? 'dark' : 'light'}
                  sitekey={process.env.REACT_APP_RECAPTCHA_PUBLIC_KEY}
                  onErrored={() => console.error('reCAPTCHA failed to load')}
                />
                {errors.captcha && <div className={styles.errorMessage}>{errors.captcha}</div>}
              </div>

              <button type="submit" className={styles.primaryButton} disabled={isSubmitting}>
                {isSubmitting ? <span className={styles.spinner} aria-label="Signing in" /> : 'Sign in'}
              </button>

              <div className={styles.divider}><span>or</span></div>

              <div className={styles.socialLogin}>
                <button type="button" className={styles.socialButton}>
                  <FaGoogle /> Google
                </button>
                <button type="button" className={styles.socialButton}>
                  <FaFacebook /> Facebook
                </button>
              </div>
            </form>

            <p className={styles.switchText}>
              New to Virsaa? <Link to="/signup" className={styles.inlineLink}>Create an account</Link>
            </p>
          </div>

          <aside className={styles.perksPanel}>
            <img src={getImagePath(formSideImage)} alt="" className={styles.perksImage} />
            <h2 className={styles.perksTitle}>Everything you saved is waiting</h2>
            <ul className={styles.perkList}>
              {PERKS.map((perk) => (
                <li key={perk.title} className={styles.perk}>
                  <span className={styles.perkIcon} aria-hidden="true">{perk.icon}</span>
                  <div>
                    <h3>{perk.title}</h3>
                    <p>{perk.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      {/* ---------- What you can do ---------- */}
      <section className={styles.section} aria-labelledby="features-title">
        <h2 id="features-title" className={styles.sectionTitle}>What your account opens up</h2>
        <p className={styles.sectionLede}>Explore the library now, or sign in to keep your place across devices.</p>
        <div className={styles.featureGrid}>
          {FEATURES.map((f) => (
            <Link key={f.to} to={f.to} className={styles.featureCard}>
              <span className={styles.featureIcon} aria-hidden="true">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className={styles.section} aria-labelledby="faq-title">
        <div className={styles.faqLayout}>
          <div>
            <h2 id="faq-title" className={styles.sectionTitle}>Trouble signing in?</h2>
            <p className={styles.sectionLede}>Quick answers to the questions we hear most.</p>
          </div>
          <div className={styles.faqList}>
            {FAQS.map((item) => (
              <details key={item.q} className={styles.faqItem}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Login;
