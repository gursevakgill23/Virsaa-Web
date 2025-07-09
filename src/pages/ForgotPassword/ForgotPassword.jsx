import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ReCAPTCHA from 'react-google-recaptcha';
import styles from './ForgotPassword.module.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import axios from 'axios';

const ForgotPassword = ({ isDarkMode, apiString = process.env.REACT_APP_API_URL }) => {
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);
  
  // Enhanced API URL sanitization with better error handling
  const getSanitizedApiUrl = () => {
    try {
      let url = apiString?.trim() || '';
      
      // Remove comments, trailing slashes, and whitespace
      url = url.replace(/#.*$/, '')
               .replace(/\/+$/, '')
               .replace(/\s+/g, '');
      
      // Ensure HTTPS if not in development
      if (process.env.NODE_ENV !== 'development' && !url.startsWith('https://')) {
        url = url.replace(/^http:\/\//i, 'https://');
      }
      
      // Fallback URL if still invalid
      if (!url || !/^https?:\/\//i.test(url)) {
        console.warn('Invalid or missing apiString, using fallback URL');
        url = 'https://virsaa-prod.eba-7cc3yk92.us-east-1.elasticbeanstalk.com';
      }
      
      return url;
    } catch (error) {
      console.error('Error sanitizing API URL:', error);
      return 'https://virsaa-prod.eba-7cc3yk92.us-east-1.elasticbeanstalk.com';
    }
  };

  const apiUrl = getSanitizedApiUrl();
  console.log('Sanitized API URL:', apiUrl);

  // State management
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    code: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [emailSent, setEmailSent] = useState('');
  const [recaptchaReady, setRecaptchaReady] = useState(false);

  // Countdown timer for resend code
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Handle reCAPTCHA load
  useEffect(() => {
    const handleRecaptchaLoad = () => {
      setRecaptchaReady(true);
      console.log('reCAPTCHA loaded successfully');
    };

    if (window.grecaptcha) {
      handleRecaptchaLoad();
    } else {
      const script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/api.js';
      script.async = true;
      script.defer = true;
      script.onload = handleRecaptchaLoad;
      script.onerror = () => {
        console.error('Failed to load reCAPTCHA script');
        toast.error('Failed to load security verification. Please refresh the page.', {
          position: 'top-center',
          autoClose: 5000,
          theme: isDarkMode ? 'dark' : 'light',
        });
      };
      document.body.appendChild(script);
    }
  }, [isDarkMode]);

  // Handle form input changes
  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: '' }));
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    if (field === 'newPassword') {
      setShowPassword((prev) => !prev);
    } else {
      setShowConfirmPassword((prev) => !prev);
    }
  };

  // Validation functions
  const validateEmailForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!recaptchaRef.current?.getValue()) {
      newErrors.captcha = 'Please complete the security verification';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCodeForm = () => {
    const newErrors = {};
    if (!formData.code.trim()) {
      newErrors.code = 'Verification code is required';
    } else if (formData.code.length !== 6 || !/^\d{6}$/.test(formData.code)) {
      newErrors.code = 'Code must be a 6-digit number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors = {};
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (!passwordRegex.test(formData.newPassword)) {
      newErrors.newPassword = 'Password must contain at least one uppercase letter, one lowercase letter, one number, and be at least 8 characters long';
    }

    if (!formData.confirmNewPassword) {
      newErrors.confirmNewPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmNewPassword) {
      newErrors.confirmNewPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission handlers
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!validateEmailForm()) return;

    setIsSubmitting(true);
    const requestUrl = `${apiUrl}/api/auth/forget-password/`;
    
    try {
      const recaptchaToken = recaptchaRef.current?.getValue();
      if (!recaptchaToken) {
        throw new Error('Security verification failed. Please try again.');
      }

      const payload = {
        email: formData.email,
        captcha: recaptchaToken,
      };
      console.log('Request Payload:', payload);
      console.log('Submitting forget-password request to:', requestUrl);

      const response = await axios.post(requestUrl, payload, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.data.message) {
        toast.success(response.data.message, {
          position: 'top-center',
          autoClose: 3000,
          theme: isDarkMode ? 'dark' : 'light',
        });
        setEmailSent(formData.email);
        setCountdown(30);
        setStep(2);
        recaptchaRef.current.reset();
      }
    } catch (error) {
      console.error('Request error:', error);
      let errorMessage = 'Failed to send verification code';

      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      } else if (error.response) {
        console.log('Error response data:', error.response.data);
        if (error.response.status === 429) {
          errorMessage = error.response.data?.captcha || 'Too many attempts. Please wait a few minutes and try again.';
        } else {
          errorMessage =
            error.response.data?.captcha?.join(', ') ||
            error.response.data?.email?.join(', ') ||
            error.response.data?.error ||
            error.response.data?.message ||
            'Invalid request. Please check your input and try again.';
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Please try again later.';
      }

      toast.error(errorMessage, {
        position: 'top-center',
        autoClose: 5000,
        theme: isDarkMode ? 'dark' : 'light',
      });
      recaptchaRef.current.reset(); // Reset reCAPTCHA on error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    if (!validateCodeForm()) return;

    setIsSubmitting(true);
    const requestUrl = `${apiUrl}/api/auth/verify-reset-code/`;
    
    try {
      const payload = {
        email: emailSent,
        code: formData.code,
      };
      console.log('Request Payload:', payload);
      console.log('Submitting verify-reset-code request to:', requestUrl);

      const response = await axios.post(requestUrl, payload, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.data.message) {
        toast.success(response.data.message, {
          position: 'top-center',
          autoClose: 3000,
          theme: isDarkMode ? 'dark' : 'light',
        });
        setStep(3);
      }
    } catch (error) {
      console.error('Request error:', error);
      let errorMessage = 'Invalid or expired verification code';

      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      } else if (error.response) {
        console.log('Error response data:', error.response.data);
        errorMessage =
          error.response.data?.error ||
          error.response.data?.message ||
          errorMessage;
      } else if (error.request) {
        errorMessage = 'No response from server. Please try again later.';
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

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;

    setIsSubmitting(true);
    const requestUrl = `${apiUrl}/api/auth/reset-password/`;
    
    try {
      const payload = {
        email: emailSent,
        code: formData.code,
        new_password: formData.newPassword,
        confirm_new_password: formData.confirmNewPassword,
      };
      console.log('Request Payload:', payload);
      console.log('Submitting reset-password request to:', requestUrl);

      const response = await axios.post(requestUrl, payload, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.data.message) {
        toast.success(response.data.message, {
          position: 'top-center',
          autoClose: 3000,
          theme: isDarkMode ? 'dark' : 'light',
        });
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (error) {
      console.error('Request error:', error);
      let errorMessage = 'Failed to reset password';

      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      } else if (error.response) {
        console.log('Error response data:', error.response.data);
        errorMessage =
          error.response.data?.error ||
          error.response.data?.message ||
          errorMessage;
      } else if (error.request) {
        errorMessage = 'No response from server. Please try again later.';
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

  const handleResendCode = async () => {
    if (countdown > 0 || isSubmitting) return;

    setIsSubmitting(true);
    const requestUrl = `${apiUrl}/api/auth/forget-password/`;
    
    try {
      const recaptchaToken = recaptchaRef.current?.getValue();
      if (!recaptchaToken) {
        throw new Error('Security verification failed. Please try again.');
      }

      const payload = {
        email: emailSent,
        captcha: recaptchaToken,
      };
      console.log('Request Payload:', payload);
      console.log('Submitting resend-code request to:', requestUrl);

      const response = await axios.post(requestUrl, payload, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.data.message) {
        toast.success(response.data.message, {
          position: 'top-center',
          autoClose: 3000,
          theme: isDarkMode ? 'dark' : 'light',
        });
        setCountdown(30);
        recaptchaRef.current.reset();
      }
    } catch (error) {
      console.error('Request error:', error);
      let errorMessage = 'Failed to resend code';

      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      } else if (error.response) {
        console.log('Error response data:', error.response.data);
        if (error.response.status === 429) {
          errorMessage = error.response.data?.captcha || 'Too many attempts. Please wait a few minutes and try again.';
        } else {
          errorMessage =
            error.response.data?.captcha?.join(', ') ||
            error.response.data?.email?.join(', ') ||
            error.response.data?.error ||
            error.response.data?.message ||
            'Invalid request. Please check your input and try again.';
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Please try again later.';
      }

      toast.error(errorMessage, {
        position: 'top-center',
        autoClose: 5000,
        theme: isDarkMode ? 'dark' : 'light',
      });
      recaptchaRef.current.reset(); // Reset reCAPTCHA on error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container} data-theme={isDarkMode ? 'dark' : 'light'}>
      <ToastContainer />
      <div className={styles.formContainer}>
        <div className={styles.formSection}>
          <h2 className={styles.formTitle}>
            {step === 1
              ? 'Reset Password'
              : step === 2
              ? 'Verify Code'
              : 'Create New Password'}
          </h2>

          {step === 1 && (
            <form className={styles.form} onSubmit={handleEmailSubmit}>
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
                  disabled={isSubmitting}
                />
                {errors.email && <div className={styles.errorMessage}>{errors.email}</div>}
              </div>

              <div className={styles.inputGroup}>
                {recaptchaReady ? (
                  <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey={process.env.REACT_APP_RECAPTCHA_PUBLIC_KEY}
                    size="normal"
                    theme={isDarkMode ? 'dark' : 'light'}
                    onChange={(token) => console.log('reCAPTCHA verification passed:', token)}
                    onErrored={() => {
                      console.error('reCAPTCHA error');
                      toast.error('Security verification failed. Please refresh the page.', {
                        position: 'top-center',
                        autoClose: 5000,
                        theme: isDarkMode ? 'dark' : 'light',
                      });
                    }}
                    onExpired={() => {
                      console.log('reCAPTCHA expired');
                      toast.warn('Security verification expired. Please verify again.', {
                        position: 'top-center',
                        autoClose: 5000,
                        theme: isDarkMode ? 'dark' : 'light',
                      });
                      recaptchaRef.current.reset();
                    }}
                  />
                ) : (
                  <div className={styles.recaptchaLoading}>
                    Loading security verification...
                  </div>
                )}
                {errors.captcha && <div className={styles.errorMessage}>{errors.captcha}</div>}
              </div>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={isSubmitting || !recaptchaReady}
              >
                {isSubmitting ? (
                  <span className={styles.spinner}></span>
                ) : (
                  'Send Verification Code'
                )}
              </button>

              <div className={styles.bottomLinks}>
                <Link to="/login" className={styles.link}>
                  Back to Login
                </Link>
              </div>
            </form>
          )}

          {step === 2 && (
            <form className={styles.form} onSubmit={handleCodeSubmit}>
              <div className={styles.infoText}>
                We've sent a 6-digit code to <strong>{emailSent}</strong>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="code" className={styles.label}>
                  Verification Code
                </label>
                <input
                  type="text"
                  id="code"
                  maxLength="6"
                  className={`${styles.input} ${errors.code ? styles.errorInput : ''}`}
                  placeholder="Enter 6-digit code"
                  value={formData.code}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                {errors.code && <div className={styles.errorMessage}>{errors.code}</div>}
              </div>

              <div className={styles.resendContainer}>
                <button
                  type="button"
                  className={styles.resendButton}
                  onClick={handleResendCode}
                  disabled={countdown > 0 || isSubmitting}
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                </button>
              </div>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className={styles.spinner}></span>
                ) : (
                  'Verify Code'
                )}
              </button>

              <div className={styles.bottomLinks}>
                <button
                  type="button"
                  className={styles.link}
                  onClick={() => setStep(1)}
                  disabled={isSubmitting}
                >
                  Back
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form className={styles.form} onSubmit={handlePasswordSubmit}>
              <div className={styles.passwordRequirements}>
                <p>Password must contain:</p>
                <ul>
                  <li>At least 8 characters</li>
                  <li>One uppercase letter</li>
                  <li>One lowercase letter</li>
                  <li>One number</li>
                </ul>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="newPassword" className={styles.label}>
                  New Password
                </label>
                <div className={styles.passwordContainer}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="newPassword"
                    className={`${styles.input} ${errors.newPassword ? styles.errorInput : ''}`}
                    placeholder="Enter new password"
                    value={formData.newPassword}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className={styles.togglePassword}
                    onClick={() => togglePasswordVisibility('newPassword')}
                    disabled={isSubmitting}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.newPassword && (
                  <div className={styles.errorMessage}>{errors.newPassword}</div>
                )}
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="confirmNewPassword" className={styles.label}>
                  Confirm Password
                </label>
                <div className={styles.passwordContainer}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmNewPassword"
                    className={`${styles.input} ${errors.confirmNewPassword ? styles.errorInput : ''}`}
                    placeholder="Confirm new password"
                    value={formData.confirmNewPassword}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className={styles.togglePassword}
                    onClick={() => togglePasswordVisibility('confirmNewPassword')}
                    disabled={isSubmitting}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.confirmNewPassword && (
                  <div className={styles.errorMessage}>{errors.confirmNewPassword}</div>
                )}
              </div>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className={styles.spinner}></span>
                ) : (
                  'Reset Password'
                )}
              </button>

              <div className={styles.bottomLinks}>
                <button
                  type="button"
                  className={styles.link}
                  onClick={() => setStep(2)}
                  disabled={isSubmitting}
                >
                  Back
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;