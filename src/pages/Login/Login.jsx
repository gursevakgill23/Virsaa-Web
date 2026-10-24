/**
 * pages/Login/Login.jsx
 * -----------------------------------------------------------------------------
 * The sign-in page (/login): a glass form over a photo (email or username,
 * password, Remember me, reCAPTCHA), the perks of an account, what an account
 * opens up, and sign-in FAQs.
 * On success the tokens go to AuthContext.login() and the user is sent home.
 * Every problem is explained: field messages under the inputs, and an alert
 * for server/connection errors (see utils/apiError.js). An account whose email
 * isn't verified yet gets a box to send a new verification link; after 10
 * wrong passwords the server pauses sign-in for 15 minutes and says so.
 * Accounts with sign-in codes (and every admin account) get a second step:
 * the 6-digit code we email (LoginCodeStep.jsx).
 * -----------------------------------------------------------------------------
 */
import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from '../../utils/notify';
import ReCAPTCHA from 'react-google-recaptcha';
import styles from './Login.module.css';
import {
  FaGoogle, FaFacebook, FaEye, FaEyeSlash, FaBook, FaRegFileAudio,
  FaHeart, FaHistory, FaGamepad, FaCompass,
} from 'react-icons/fa';
import { FaHandsPraying } from 'react-icons/fa6';
import { useAuth } from '../../context/AuthContext';
import { describeApiError } from '../../utils/apiError';
import ResendVerification from '../../components/ResendVerification/ResendVerification';
import LoginCodeStep from './LoginCodeStep';
import { SitePicture } from '../../components/SitePicture/SitePicture';
import axios from 'axios';

// Content for the side panel and the sections below the form
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
    a: 'Choose “Forgot password?” under the form. We’ll email you a 6-digit code to set a new one.',
  },
  {
    q: 'It says my email isn’t verified. What now?',
    a: 'Open the link in the “Verify your email” message we sent when you signed up. Can’t find it? Sign in once more and use “Send a new link”.',
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
    q: 'Why am I asked for a code after my password?',
    a: 'Your account uses sign-in codes (admin accounts always do). We email a 6-digit code that works for 10 minutes, so nobody can sign in with your password alone. You can switch the codes on or off in Settings, under Security.',
  },
  {
    q: 'Do I need Premium to use Virsaa?',
    a: 'No. A free account gives you the library, games and Gurbani. Premium unlocks extra audiobook chapters and more.',
  },
];

const Login = ({ isDarkMode, apiString = process.env.REACT_APP_API_URL }) => {
  const { login, continueAsGuest } = useAuth();
  const navigate = useNavigate();
  // The reCAPTCHA widget (its token is sent with the form)
  const recaptchaRef = useRef(null);

  // Page header pictures (public/images); the side picture comes from S3 (SitePicture)
  const headerImageLight = '/images/Login/background.jpeg';
  const headerImageDark = '/images/Login/background-dark.jpeg';

  // Form values, field errors, sending state, show/hide password
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Set when the password was right but the email isn't verified yet: the address for a new link
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);
  // Set when the password was right and a sign-in code was emailed: the second step
  const [codeStep, setCodeStep] = useState(null);
  const headerImage = isDarkMode ? headerImageDark : headerImageLight;

  // Keep the typed value and clear that field's error
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

  // Required fields and the reCAPTCHA tick
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

  // Signed in (straight away, or after the emailed code): keep the tokens and go on
  const finishSignIn = (data, rememberMe) => {
    login(
      data.access,
      data.refresh,
      {
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        first_name: data.user.first_name,
        last_name: data.user.last_name,
        profile_photo: data.user.profile_photo,
        membership_level: data.user.membership_level,
        last_logined: data.user.last_logined,
        joined_date: data.user.joined_date,
        theme_preference: data.user.theme_preference,
      },
      rememberMe
    );

    // ?next=/learning/games/akhar-sikho sends the player back to the game they came from
    // (only paths on this site: "/..." but not "//other-site")
    const next = new URLSearchParams(window.location.search).get('next') || '';
    const backTo = /^\/(?!\/)/.test(next) && !next.includes('\\') ? next : '/';
    toast.success(backTo === '/' ? 'Signed in. Taking you home…' : 'Signed in. Taking you back…', {
      position: 'top-center',
      autoClose: 2000,
      theme: isDarkMode ? 'dark' : 'light',
    });

    setTimeout(() => navigate(backTo), 2000);
  };

  // Back from the code step to the password form (the email stays filled in)
  const startAgain = () => {
    setCodeStep(null);
    setFormData((prev) => ({ ...prev, password: '' }));
  };

  // Send the sign-in request. The reCAPTCHA is reset afterwards either way,
  // because each token can only be used once.
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setUnverifiedEmail(null);

    try {
      const captchaToken = recaptchaRef.current.getValue();
      if (!captchaToken) {
        throw new Error('Tick the reCAPTCHA box to continue');
      }

      const payload = {
        login: formData.email.trim(),
        password: formData.password,
        captcha: captchaToken,
        remember_me: formData.rememberMe,
      };

      const response = await axios.post(`${apiString}/api/auth/login/`, payload, { timeout: 20000 });
      // The password was right and the account uses sign-in codes: ask for the emailed code
      if (response.data?.two_factor_required && response.data?.challenge) {
        setCodeStep({
          challenge: response.data.challenge,
          emailHint: response.data.email_hint,
          resendIn: response.data.resend_in,
          rememberMe: formData.rememberMe,
        });
        setFormData((prev) => ({ ...prev, password: '' }));
        return;
      }
      if (!response.data?.access || !response.data?.user) throw new Error('Unexpected sign-in reply');
      finishSignIn(response.data, formData.rememberMe);
    } catch (error) {
      // Right password, but the email address isn't confirmed yet: offer a new link
      if (error.response?.data?.code === 'email_not_verified') {
        const typed = formData.email.trim();
        setUnverifiedEmail(typed.includes('@') ? typed : '');
        toast.info('Your email address isn’t verified yet. Open the link we emailed you, or send a new one.', {
          position: 'top-center',
          autoClose: 6000,
          theme: isDarkMode ? 'dark' : 'light',
        });
        return;
      }
      // Server reasons first (wrong details, paused sign-in, captcha), then a clear general message
      const errorMessage =
        error.response?.data?.login?.[0] ||
        error.response?.data?.error ||
        error.response?.data?.captcha?.[0] ||
        describeApiError(error, 'Sign in failed. Check your details and try again.');
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
            {codeStep ? (
              <LoginCodeStep
                apiString={apiString}
                step={codeStep}
                onSignedIn={(data) => finishSignIn(data, codeStep.rememberMe)}
                onStartAgain={startAgain}
              />
            ) : (
              <>
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
                      maxLength={254}
                      aria-invalid={!!errors.email}
                    />
                    {errors.email && <div className={styles.errorMessage} role="alert">{errors.email}</div>}
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
                    {errors.password && <div className={styles.errorMessage} role="alert">{errors.password}</div>}
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
                      onChange={() => errors.captcha && setErrors((prev) => ({ ...prev, captcha: '' }))}
                      onExpired={() => setErrors((prev) => ({ ...prev, captcha: 'The reCAPTCHA expired. Tick the box again.' }))}
                      onErrored={() => {
                        console.error('reCAPTCHA failed to load');
                        setErrors((prev) => ({ ...prev, captcha: 'The reCAPTCHA couldn’t load. Check your connection and reload the page.' }));
                      }}
                    />
                    {errors.captcha && <div className={styles.errorMessage} role="alert">{errors.captcha}</div>}
                  </div>

                  <button type="submit" className={styles.primaryButton} disabled={isSubmitting}>
                    {isSubmitting ? <span className={styles.spinner} aria-label="Signing in" /> : 'Sign in'}
                  </button>

                  {unverifiedEmail !== null && (
                    <div className={styles.verifyNotice} role="status">
                      <h2 className={styles.verifyTitle}>Confirm your email to sign in</h2>
                      <p className={styles.verifyText}>
                        We emailed you a link when you signed up. Open it, or send a new one here
                        (it works for 24 hours).
                      </p>
                      <ResendVerification apiString={apiString} initialEmail={unverifiedEmail} />
                    </div>
                  )}

                  <div className={styles.divider}><span>or</span></div>

                  <div className={styles.socialLogin}>
                    {/* Social sign-in isn't connected yet; say so instead of doing nothing */}
                    <button type="button" className={styles.socialButton} onClick={() => toast.info('Google sign-in is coming soon. Use your email or username for now.')}>
                      <FaGoogle /> Google
                    </button>
                    <button type="button" className={styles.socialButton} onClick={() => toast.info('Facebook sign-in is coming soon. Use your email or username for now.')}>
                      <FaFacebook /> Facebook
                    </button>
                  </div>
                </form>

                <p className={styles.switchText}>
                  New to Virsaa? <Link to="/signup" className={styles.inlineLink}>Create an account</Link>
                </p>

                {/* Explore as guest: browse the main sections without an account (see AuthContext) */}
                <div className={styles.guestBox}>
                  <button type="button" className={styles.guestButton} onClick={continueAsGuest}>
                    <FaCompass aria-hidden="true" /> Explore as guest
                  </button>
                  <p className={styles.guestHint}>Look around the library, Gurbani and learning. Sign in when you want to open something.</p>
                </div>
              </>
            )}
          </div>

          <aside className={styles.perksPanel}>
            <SitePicture name="login-side" alt="" className={styles.perksImage} />
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
