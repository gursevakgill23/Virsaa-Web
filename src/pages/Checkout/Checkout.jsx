/**
 * pages/Checkout/Checkout.jsx
 * -----------------------------------------------------------------------------
 * Checkout (/checkout?product=<code>&return=<path>): step 1 of 2.
 * Shows the chosen membership or coin pack (with the billing options of the
 * same plan) and asks for the billing name, email, country and postal code.
 * Creates an order on the server, then opens the Payment page.
 * `return` (a path inside Virsaa only) is where to go back to after paying.
 * Also exports Steps, Summary and COUNTRIES, which the Payment page reuses.
 * -----------------------------------------------------------------------------
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaCoins, FaCrown, FaLock, FaArrowRight, FaShoppingBag } from 'react-icons/fa';
import PageHero from '../../components/PageHero/PageHero';
import { useAuth } from '../../context/AuthContext';
import paymentsApi, { formatMoney, saveReturnTo } from '../../api/paymentsApi';
import { describeApiError } from '../../utils/apiError';
import Loader from '../../components/VirsaaLoader/Loader';
import styles from './Checkout.module.css';

// Header pictures
const headerLight = '/images/header-image.png';
const headerDark = '/images/header-image-dark.png';

// Countries in the billing form [code, name]
export const COUNTRIES = [
  ['CA', 'Canada'], ['US', 'United States'], ['IN', 'India'], ['GB', 'United Kingdom'],
  ['AU', 'Australia'], ['NZ', 'New Zealand'], ['AE', 'United Arab Emirates'], ['DE', 'Germany'],
  ['IT', 'Italy'], ['NL', 'Netherlands'], ['FR', 'France'], ['MY', 'Malaysia'], ['SG', 'Singapore'],
  ['KE', 'Kenya'], ['PK', 'Pakistan'],
];

// The three steps, shown at the top of checkout and payment
// The "Details → Payment" progress indicator
export const Steps = ({ current }) => (
  <ol className={styles.steps} aria-label="Checkout steps">
    {['Your details', 'Payment', 'Done'].map((label, i) => (
      <li
        key={label}
        className={`${styles.step} ${i < current ? styles.stepDone : ''} ${i === current ? styles.stepNow : ''}`}
        aria-current={i === current ? 'step' : undefined}
      >
        <span className={styles.stepNumber}>{i + 1}</span>
        {label}
      </li>
    ))}
  </ol>
);

// Order summary, shaped like a ticket
// Order summary card (product, price, what's included)
export const Summary = ({ product, children }) => {
  if (!product) return null;
  const coins = product.kind === 'coins';
  return (
    <aside className={styles.ticket} aria-label="Order summary">
      <div className={styles.ticketTop}>
        <span className={styles.ticketIcon} aria-hidden="true">{coins ? <FaCoins /> : <FaCrown />}</span>
        <div>
          <p className={styles.ticketKicker}>{coins ? 'Game coins' : 'Membership'}</p>
          <h2 className={styles.ticketTitle}>{product.name}</h2>
          <p className={styles.ticketText}>{product.description}</p>
        </div>
      </div>
      {children}
      <dl className={styles.ticketLines}>
        {coins ? (
          <>
            <div><dt>Coins</dt><dd>{product.coins.toLocaleString()}</dd></div>
            <div><dt>Bonus</dt><dd>+{product.bonus}</dd></div>
          </>
        ) : (
          <>
            <div><dt>Plan</dt><dd>{product.plan_name}</dd></div>
            <div><dt>Billed</dt><dd>{product.billing === 'yearly' ? 'Once a year' : 'Every month'}</dd></div>
          </>
        )}
        <div className={styles.ticketTotal}><dt>Total</dt><dd>{formatMoney(product.price, product.currency)}</dd></div>
      </dl>
      <p className={styles.ticketNote}><FaLock aria-hidden="true" /> Secure checkout. Virsaa never stores card numbers.</p>
    </aside>
  );
};

/**
 * /checkout?product=coins_250&return=/learning/games/shabd-khoj
 * /checkout?product=standard_monthly&return=/premium
 */
const Checkout = ({ isDarkMode, apiString }) => {
  const { isLoggedIn, accessToken, userData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // ?product=… and ?return=… from the address bar
  const params = useMemo(() => new URLSearchParams(location.search || window.location.search), [location.search]);
  const headerImage = isDarkMode ? headerDark : headerLight;

  // Products, loading error, chosen product, form values and errors, sending state
  const [catalog, setCatalog] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [productCode, setProductCode] = useState(params.get('product') || '');
  const [form, setForm] = useState({
    billing_name: [userData?.first_name, userData?.last_name].filter(Boolean).join(' '),
    billing_email: userData?.email || '',
    billing_country: 'CA',
    billing_postal_code: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0); // bumped by "Try again"

  useEffect(() => {
    // Remember where to come back to after paying (inside Virsaa only)
    saveReturnTo(params.get('return'));
  }, [params]);

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    paymentsApi.products(apiString)
      .then((data) => {
        if (cancelled) return;
        // Expect { products: [...] }; anything else is treated as a failed load
        if (!data || !Array.isArray(data.products)) throw new Error('Unexpected products reply');
        setCatalog(data);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Products failed:', err.response?.status || err.message);
        setLoadError('Checkout couldn’t be loaded. Check your connection and try again.');
      });
    return () => { cancelled = true; };
  }, [apiString, reloadKey]);

  // Fill in name and email once the profile has loaded
  useEffect(() => {
    setForm((f) => ({
      ...f,
      billing_name: f.billing_name || [userData?.first_name, userData?.last_name].filter(Boolean).join(' '),
      billing_email: f.billing_email || userData?.email || '',
    }));
  }, [userData]);

  // The chosen product and the other billing periods of the same plan
  const product = catalog?.products?.find((p) => p.code === productCode);
  const siblings = product?.kind === 'membership'
    ? (catalog?.products || []).filter((p) => p.kind === 'membership' && p.plan === product.plan)
    : [];

  // Keep the typed value and clear that field's error
  const change = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: undefined }));
  };

  // Name, email, country and a postal/ZIP code in the right format
  const validate = () => {
    const next = {};
    if (!form.billing_name.trim()) next.billing_name = 'Enter your name.';
    if (!/^\S+@\S+\.\S+$/.test(form.billing_email)) next.billing_email = 'Enter a valid email address.';
    if (!form.billing_country) next.billing_country = 'Choose a country.';
    const postal = form.billing_postal_code.trim();
    if (['CA', 'US'].includes(form.billing_country) && !postal) {
      next.billing_postal_code = form.billing_country === 'CA' ? 'Enter your postal code.' : 'Enter your ZIP code.';
    } else if (form.billing_country === 'CA' && !/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(postal)) {
      next.billing_postal_code = 'Enter a postal code like A1A 1A1.';
    } else if (form.billing_country === 'US' && !/^\d{5}(-\d{4})?$/.test(postal)) {
      next.billing_postal_code = 'Enter a 5-digit ZIP code.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // Create the order and go to payment
  const submit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;
    if (!product) { setSubmitError('Choose a plan or coin pack first.'); return; }
    setSubmitting(true);
    try {
      const order = await paymentsApi.createOrder(apiString, accessToken, {
        product_code: product.code,
        ...form,
        billing_name: form.billing_name.trim(),
        billing_email: form.billing_email.trim(),
        billing_postal_code: form.billing_postal_code.trim(),
      });
      if (!order?.reference) throw new Error('The order has no reference');
      navigate(`/payment/${encodeURIComponent(order.reference)}`);
    } catch (err) {
      setSubmitError(
        err.response?.status === 401
          ? 'Your sign-in has expired. Sign in again to continue.'
          : describeApiError(err, 'Your order couldn’t be created. Try again.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const hero = (
    <PageHero
      compact
      image={headerImage}
      title="Checkout"
      subtitle="Check your order and add your details."
      crumbs={[{ label: 'Home', to: '/' }, { label: 'Checkout' }]}
    />
  );

  // ---------- States ----------
  // ---------------------------------------------------------------- render
  if (!isLoggedIn) {
    return (
      <div className={styles.page}>
        {hero}
        <div className={styles.stateBox}>
          <FaLock aria-hidden="true" className={styles.stateIcon} />
          <h2>Sign in to check out</h2>
          <p>Your coins and membership are saved to your Virsaa account.</p>
          <Link to="/login" className={styles.primaryButton}>Sign in</Link>
        </div>
      </div>
    );
  }

  if (loadError || (catalog && !product)) {
    return (
      <div className={styles.page}>
        {hero}
        <div className={styles.stateBox}>
          <FaShoppingBag aria-hidden="true" className={styles.stateIcon} />
          <h2>{loadError || 'Choose something to buy first'}</h2>
          {!loadError && <p>Pick a membership plan or a coin pack from a game.</p>}
          <div className={styles.stateActions}>
            {loadError && (
              <button type="button" className={styles.primaryButton} onClick={() => setReloadKey((k) => k + 1)}>Try again</button>
            )}
            <Link to="/premium" className={styles.primaryButton}>See membership plans</Link>
            <Link to="/learning" className={styles.secondaryButton}>Go to games</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {hero}
      <div className={styles.section}>
        <Steps current={0} />
        {catalog?.test_mode && (
          <p className={styles.testBanner} role="note">
            Test mode: no real money is taken. Payments are switched on in the backend settings.
          </p>
        )}

        {!catalog ? (
          <Loader />
        ) : (
          <div className={styles.layout}>
            <form className={`${styles.panel} ${styles.glass}`} onSubmit={submit} noValidate>
              <h2 className={styles.panelTitle}>Your details</h2>
              <p className={styles.panelText}>We’ll send the receipt to this email.</p>

              <div className={styles.field}>
                <label htmlFor="billing_name">Full name</label>
                <input id="billing_name" name="billing_name" autoComplete="name" value={form.billing_name} onChange={change} maxLength={120}
                  className={errors.billing_name ? styles.inputError : ''} aria-invalid={!!errors.billing_name} />
                {errors.billing_name && <p className={styles.errorText} role="alert">{errors.billing_name}</p>}
              </div>

              <div className={styles.field}>
                <label htmlFor="billing_email">Email</label>
                <input id="billing_email" name="billing_email" type="email" autoComplete="email" value={form.billing_email} onChange={change} maxLength={254}
                  className={errors.billing_email ? styles.inputError : ''} aria-invalid={!!errors.billing_email} />
                {errors.billing_email && <p className={styles.errorText} role="alert">{errors.billing_email}</p>}
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label htmlFor="billing_country">Country</label>
                  <select id="billing_country" name="billing_country" autoComplete="country" value={form.billing_country} onChange={change}>
                    {COUNTRIES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label htmlFor="billing_postal_code">{form.billing_country === 'US' ? 'ZIP code' : 'Postal code'}</label>
                  <input id="billing_postal_code" name="billing_postal_code" autoComplete="postal-code" value={form.billing_postal_code} maxLength={12}
                    onChange={change} className={errors.billing_postal_code ? styles.inputError : ''} aria-invalid={!!errors.billing_postal_code} />
                  {errors.billing_postal_code && <p className={styles.errorText} role="alert">{errors.billing_postal_code}</p>}
                </div>
              </div>

              {submitError && <p className={styles.formError} role="alert">{submitError}</p>}

              <button type="submit" className={`${styles.primaryButton} ${styles.wide}`} disabled={submitting}>
                {submitting ? 'Creating your order…' : <>Continue to payment <FaArrowRight aria-hidden="true" /></>}
              </button>
            </form>

            <Summary product={product}>
              {siblings.length > 1 && (
                <div className={styles.billingSwitch} role="group" aria-label="Billing">
                  {siblings.map((p) => (
                    <button key={p.code} type="button" aria-pressed={p.code === product.code}
                      className={`${styles.billingOption} ${p.code === product.code ? styles.billingOn : ''}`}
                      onClick={() => setProductCode(p.code)}>
                      {p.billing === 'yearly' ? 'Yearly (save 20%)' : 'Monthly'}
                    </button>
                  ))}
                </div>
              )}
            </Summary>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;
