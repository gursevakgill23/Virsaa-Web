import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ReCAPTCHA from 'react-google-recaptcha';
import styles from './Signup.module.css';
import {
  FaGoogle, FaFacebook, FaEye, FaEyeSlash, FaBook, FaRegFileAudio,
  FaGamepad, FaHeart, FaCheck, FaHistory,
} from 'react-icons/fa';
import { FaHandsPraying } from 'react-icons/fa6';

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

// Backend field names -> form field ids
const FIELD_MAP = {
  first_name: 'firstName',
  last_name: 'lastName',
  username: 'username',
  email: 'email',
  password: 'password',
  confirm_password: 'confirmPassword',
  captcha: 'captcha',
};

const PERKS = [
  { icon: <FaBook />, title: 'A Punjabi library', text: 'Ebooks on Sikh history, poetry and culture.' },
  { icon: <FaRegFileAudio />, title: 'Audiobooks and kirtan', text: 'Listen at home, on the road, anywhere.' },
  { icon: <FaGamepad />, title: 'Learn by playing', text: 'Games and quizzes for children and adults.' },
];

const STEPS = [
  { title: 'Create your account', text: 'Fill in the form above. It takes about a minute.' },
  { title: 'Verify your email', text: 'Open the link we send to your inbox to activate your account.' },
  { title: 'Complete your profile', text: 'Tell us what you like to read and listen to, so we can suggest more.' },
  { title: 'Start exploring', text: 'Read, listen, save favourites and pick up where you left off.' },
];

const FEATURES = [
  { to: '/collections/ebooks', icon: <FaBook />, title: 'Ebooks', text: 'Read Punjabi books in your browser.' },
  { to: '/collections/audiobooks', icon: <FaRegFileAudio />, title: 'Audiobooks', text: 'Narrated books and kirtan.' },
  { to: '/gurbani', icon: <FaHandsPraying />, title: 'Gurbani', text: 'The daily Hukamnama with full translation.' },
  { to: '/learning', icon: <FaGamepad />, title: 'Learning', text: 'Lessons, quizzes and games.' },
  { to: '/my-favorites', icon: <FaHeart />, title: 'Favourites', text: 'Save anything to come back to.' },
  { to: '/sikh-history', icon: <FaHistory />, title: 'Sikh history', text: 'Stories from the Gurus to today.' },
];

const FAQS = [
  {
    q: 'Is a Virsaa account free?',
    a: 'Yes. Creating an account is free and gives you the library, games and Gurbani. Premium is optional.',
  },
  {
    q: 'I didn’t get the verification email.',
    a: 'Check your spam or promotions folder. The email comes from Virsaa and can take a few minutes to arrive.',
  },
  {
    q: 'What can I use as a username?',
    a: 'Between 3 and 30 characters: letters, numbers, underscores and dashes. You can sign in with it instead of your email.',
  },
  {
    q: 'Can children use Virsaa?',
    a: 'Yes. Many families use the games and quizzes together. We suggest a parent creates and manages the account.',
  },
];

// 0–4 score used only for the strength meter; the real rules are in validateForm
const passwordScore = (pw) => {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (pw.length >= 12 || /[^A-Za-z0-9]/.test(pw)) score += 1;
  return score;
};
const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];

const Signup = ({ isDarkMode, apiString }) => {
  const getImagePath = useProductionImagePath();
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);

  const formSideImage = '/images/Login/right_section.png';
  const headerImageLight = '/images/Login/background.jpeg';
  const headerImageDark = '/images/Login/background-dark.jpeg';
  const headerImage = isDarkMode ? headerImageDark : headerImageLight;

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const score = passwordScore(formData.password);

  const passwordRules = [
    { ok: formData.password.length >= 8, label: '8 or more characters' },
    { ok: /[A-Z]/.test(formData.password) && /[a-z]/.test(formData.password), label: 'Upper and lower case' },
    { ok: /\d/.test(formData.password), label: 'At least one number' },
  ];

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

    if (!formData.firstName.trim()) newErrors.firstName = 'Enter your first name';
    if (!formData.lastName.trim()) newErrors.lastName = 'Enter your last name';
    if (!formData.username.trim()) newErrors.username = 'Choose a username';
    if (!formData.email.trim()) newErrors.email = 'Enter your email';
    if (!formData.password) newErrors.password = 'Create a password';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Type your password again';

    if (formData.email && !emailRegex.test(formData.email)) newErrors.email = 'Enter an email like name@example.com';
    if (formData.username && !usernameRegex.test(formData.username)) newErrors.username = 'Use 3–30 letters, numbers, underscores or dashes';
    if (formData.password && !passwordRegex.test(formData.password)) newErrors.password = 'Use 8+ characters with upper case, lower case and a number';
    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords don’t match';

    if (!recaptchaRef.current?.getValue()) newErrors.captcha = 'Tick the reCAPTCHA box to continue';

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
        setErrors((prev) => ({ ...prev, captcha: 'Tick the reCAPTCHA box to continue' }));
        throw new Error('Tick the reCAPTCHA box to continue');
      }

      const response = await fetch(`${apiString}/api/auth/signup/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          username: formData.username.trim(),
          email: formData.email.trim(),
          password: formData.password,
          confirm_password: formData.confirmPassword,
          captcha: captchaToken,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // Show field errors from the API next to the matching input
        const fieldErrors = {};
        Object.entries(data || {}).forEach(([key, value]) => {
          const id = FIELD_MAP[key];
          if (id) fieldErrors[id] = Array.isArray(value) ? value[0] : String(value);
        });
        if (Object.keys(fieldErrors).length) setErrors((prev) => ({ ...prev, ...fieldErrors }));

        throw new Error(
          data.message || data.error || Object.values(fieldErrors)[0] || 'Sign up failed. Check the form and try again.'
        );
      }

      toast.success('Account created. Check your email to verify it, then sign in.', {
        position: 'top-center',
        autoClose: 3000,
        theme: isDarkMode ? 'dark' : 'light',
      });

      setTimeout(() => navigate('/login'), 3000);
    } catch (error) {
      toast.error(error.message || 'Sign up failed. Check the form and try again.', {
        position: 'top-center',
        autoClose: 5000,
        theme: isDarkMode ? 'dark' : 'light',
      });
    } finally {
      setIsSubmitting(false);
      recaptchaRef.current?.reset();
    }
  };

  const field = (id, label, props = {}) => (
    <div className={styles.inputGroup}>
      <label htmlFor={id} className={styles.label}>{label}</label>
      <input
        id={id}
        className={`${styles.input} ${errors[id] ? styles.errorInput : ''}`}
        value={formData[id]}
        onChange={handleChange}
        aria-invalid={!!errors[id]}
        {...props}
      />
      {errors[id] && <div className={styles.errorMessage}>{errors[id]}</div>}
    </div>
  );

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
            <p className={styles.gurmukhi} lang="pa">ਵਿਰਸੇ ਨਾਲ ਜੁੜੋ</p>
            <h1 className={styles.formTitle}>Create your account</h1>
            <p className={styles.formLede}>Join Virsaa to save books, follow your progress and read the full Hukamnama.</p>

            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              <div className={styles.row}>
                {field('firstName', 'First name', { type: 'text', autoComplete: 'given-name', placeholder: 'Gurpreet' })}
                {field('lastName', 'Last name', { type: 'text', autoComplete: 'family-name', placeholder: 'Singh' })}
              </div>
              {field('username', 'Username', { type: 'text', autoComplete: 'username', placeholder: 'gurpreet_singh' })}
              {field('email', 'Email', { type: 'email', autoComplete: 'email', placeholder: 'you@example.com' })}

              <div className={styles.inputGroup}>
                <label htmlFor="password" className={styles.label}>Password</label>
                <div className={styles.passwordContainer}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    autoComplete="new-password"
                    className={`${styles.input} ${errors.password ? styles.errorInput : ''}`}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                    aria-invalid={!!errors.password}
                    aria-describedby="password-rules"
                  />
                  <button
                    type="button"
                    className={styles.togglePassword}
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {formData.password && (
                  <div className={styles.strength} data-score={score}>
                    <div className={styles.strengthBar}><span style={{ width: `${score * 25}%` }} /></div>
                    <span className={styles.strengthLabel}>{STRENGTH_LABELS[score]}</span>
                  </div>
                )}
                <ul id="password-rules" className={styles.rules}>
                  {passwordRules.map((rule) => (
                    <li key={rule.label} className={rule.ok ? styles.ruleOk : ''}>
                      <FaCheck aria-hidden="true" /> {rule.label}
                    </li>
                  ))}
                </ul>
                {errors.password && <div className={styles.errorMessage}>{errors.password}</div>}
              </div>

              {field('confirmPassword', 'Confirm password', {
                type: showPassword ? 'text' : 'password',
                autoComplete: 'new-password',
                placeholder: 'Type it again',
              })}

              <div className={styles.captcha}>
                <ReCAPTCHA
                  ref={recaptchaRef}
                  size="normal"
                  theme={isDarkMode ? 'dark' : 'light'}
                  sitekey={process.env.REACT_APP_RECAPTCHA_PUBLIC_KEY}
                />
                {errors.captcha && <div className={styles.errorMessage}>{errors.captcha}</div>}
              </div>

              <button type="submit" className={styles.primaryButton} disabled={isSubmitting}>
                {isSubmitting ? <span className={styles.spinner} aria-label="Creating account" /> : 'Create account'}
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
              Already have an account? <Link to="/login" className={styles.inlineLink}>Sign in</Link>
            </p>
          </div>

          <aside className={styles.perksPanel}>
            <img src={getImagePath(formSideImage)} alt="" className={styles.perksImage} />
            <h2 className={styles.perksTitle}>Your heritage, in one place</h2>
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

      {/* ---------- How it works (a real sequence) ---------- */}
      <section className={styles.section} aria-labelledby="steps-title">
        <h2 id="steps-title" className={styles.sectionTitle}>How it works</h2>
        <p className={styles.sectionLede}>From sign up to your first book in four steps.</p>
        <ol className={styles.steps}>
          {STEPS.map((step, i) => (
            <li key={step.title} className={styles.step}>
              <span className={styles.stepNumber} aria-hidden="true">{i + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- What you get ---------- */}
      <section className={styles.section} aria-labelledby="features-title">
        <h2 id="features-title" className={styles.sectionTitle}>What’s inside</h2>
        <p className={styles.sectionLede}>Have a look around before you join. Everything here is open to browse.</p>
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
            <h2 id="faq-title" className={styles.sectionTitle}>Questions before you join</h2>
            <p className={styles.sectionLede}>Can’t find your answer? Use “Chat with us” on the home page.</p>
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

export default Signup;
