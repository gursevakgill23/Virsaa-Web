/**
 * pages/Checkout/Checkout.jsx
 * -----------------------------------------------------------------------------
 * Checkout (/checkout?product=<code>&return=<path>): step 1 of 3.
 * Shows the chosen membership or coin pack (with the billing options of the
 * same plan), then sends the person to Stripe's own secure payment page
 * (card, Apple Pay, Google Pay). Stripe collects the card and billing details:
 * they never pass through Virsaa. Afterwards Stripe brings them back to
 * /payment/<order> (the Payment page), or here with ?cancelled=1.
 * Someone who already has a Stripe membership changes it in Manage billing.
 * `return` (a path inside Virsaa only) is where to go back to after paying.
 * Also exports Steps and Summary, which the Payment page reuses.
 * -----------------------------------------------------------------------------
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaCoins, FaCrown, FaLock, FaArrowRight, FaShoppingBag, FaCreditCard } from 'react-icons/fa';
import PageHero from '../../components/PageHero/PageHero';
import { useAuth } from '../../context/AuthContext';
import paymentsApi, { formatMoney, saveReturnTo, isStripeUrl, openBillingPortal } from '../../api/paymentsApi';
import { describeApiError } from '../../utils/apiError';
import Loader from '../../components/VirsaaLoader/Loader';
import styles from './Checkout.module.css';

// Header pictures
const headerLight = '/images/header-image.png';
const headerDark = '/images/header-image-dark.png';

// The three steps, shown at the top of checkout and payment
// The "Details → Payment" progress indicator
export const Steps = ({ current }) => (
  <ol className={styles.steps} aria-label="Checkout steps">
    {['Your order', 'Payment', 'Done'].map((label, i) => (
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
export const Summary = ({ product, trialDays = 0, children }) => {
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
        {!coins && trialDays > 0 && <div><dt>Free trial</dt><dd>{trialDays} days, for first-time members</dd></div>}
        <div className={styles.ticketTotal}><dt>Total</dt><dd>{formatMoney(product.price, product.currency)}</dd></div>
      </dl>
      <p className={styles.ticketNote}>
        <FaLock aria-hidden="true" /> Payments are handled by Stripe. Virsaa never sees or stores your card details.
      </p>
    </aside>
  );
};

/**
 * /checkout?product=coins_250&return=/learning/games/shabd-khoj
 * /checkout?product=standard_monthly&return=/premium
 * /checkout?product=standard_monthly&cancelled=1      (back from Stripe without paying)
 */
const Checkout = ({ isDarkMode, apiString }) => {
  const { isLoggedIn, accessToken } = useAuth();
  const location = useLocation();
  // ?product=…, ?return=… and ?cancelled=1 from the address bar
  const params = useMemo(() => new URLSearchParams(location.search || window.location.search), [location.search]);
  const cancelled = params.get('cancelled') === '1';
  const headerImage = isDarkMode ? headerDark : headerLight;

  // Products, loading error, chosen product, sending state and errors
  const [catalog, setCatalog] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [productCode, setProductCode] = useState(params.get('product') || '');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [alreadyMember, setAlreadyMember] = useState(false);   // has a Stripe membership: change it in billing
  const [reloadKey, setReloadKey] = useState(0); // bumped by "Try again"

  useEffect(() => {
    // Remember where to come back to after paying (inside Virsaa only)
    saveReturnTo(params.get('return'));
  }, [params]);

  useEffect(() => {
    let isCancelled = false;
    setLoadError(null);
    paymentsApi.products(apiString)
      .then((data) => {
        if (isCancelled) return;
        // Expect { products: [...] }; anything else is treated as a failed load
        if (!data || !Array.isArray(data.products)) throw new Error('Unexpected products reply');
        setCatalog(data);
      })
      .catch((err) => {
        if (isCancelled) return;
        console.error('Products failed:', err.response?.status || err.message);
        setLoadError('Checkout couldn’t be loaded. Check your connection and try again.');
      });
    return () => { isCancelled = true; };
  }, [apiString, reloadKey]);

  // The chosen product and the other billing periods of the same plan
  const product = catalog?.products?.find((p) => p.code === productCode);
  const siblings = product?.kind === 'membership'
    ? (catalog?.products || []).filter((p) => p.kind === 'membership' && p.plan === product.plan)
    : [];

  // Make the order on the server and go to Stripe's payment page
  const goToPayment = async () => {
    if (submitting) return;
    setSubmitError(null);
    if (!product) { setSubmitError('Choose a plan or coin pack first.'); return; }
    setSubmitting(true);
    try {
      const data = await paymentsApi.stripeCheckout(apiString, accessToken, product.code);
      if (!isStripeUrl(data?.url)) throw new Error('No payment page address');
      window.location.assign(data.url);   // leaves Virsaa for Stripe; the button stays locked
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) setAlreadyMember(true);
      setSubmitError(
        status === 401
          ? 'Your sign-in has expired. Sign in again to continue.'
          : describeApiError(err, 'The payment page couldn’t be opened. No money was taken. Try again.')
      );
      setSubmitting(false);
    }
  };

  // Stripe's billing page, for someone who already has a membership
  const manageBilling = async () => {
    setSubmitting(true);
    try {
      await openBillingPortal(apiString, accessToken);
    } catch (err) {
      setSubmitError(describeApiError(err, 'Billing couldn’t be opened. Try again.'));
      setSubmitting(false);
    }
  };

  const hero = (
    <PageHero
      compact
      image={headerImage}
      title="Checkout"
      subtitle="Check your order, then pay securely with Stripe."
      crumbs={[{ label: 'Home', to: '/' }, { label: 'Checkout' }]}
    />
  );

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

  const membership = product?.kind === 'membership';
  const trialDays = membership ? Number(catalog?.trial_days || 0) : 0;

  return (
    <div className={styles.page}>
      {hero}
      <div className={styles.section}>
        <Steps current={0} />
        {cancelled && (
          <p className={styles.testBanner} role="status">Payment cancelled. You weren’t charged.</p>
        )}
        {catalog?.stripe_test_keys && (
          <p className={styles.testBanner} role="note">
            Test mode: no real money is taken. On Stripe’s page use the card 4242 4242 4242 4242, any future date and any 3-digit code.
          </p>
        )}

        {!catalog ? (
          <Loader />
        ) : (
          <div className={styles.layout}>
            <div className={`${styles.panel} ${styles.glass}`}>
              <h2 className={styles.panelTitle}>Pay securely</h2>
              <p className={styles.panelText}>
                You’ll pay on Stripe’s secure page with a credit or debit card, Apple Pay or Google Pay.
                Stripe emails your receipt.
              </p>
              {membership && (
                <p className={styles.panelText}>
                  {trialDays > 0
                    ? `First-time members pay nothing for ${trialDays} days. After that it renews ${product.billing === 'yearly' ? 'every year' : 'every month'} until you cancel. Cancel anytime from Manage billing.`
                    : `It renews ${product.billing === 'yearly' ? 'every year' : 'every month'} until you cancel. Cancel anytime from Manage billing.`}
                </p>
              )}

              {submitError && <p className={styles.formError} role="alert">{submitError}</p>}

              {alreadyMember ? (
                <button type="button" className={`${styles.primaryButton} ${styles.wide}`} onClick={manageBilling} disabled={submitting}>
                  {submitting ? 'Opening billing…' : <>Manage billing <FaArrowRight aria-hidden="true" /></>}
                </button>
              ) : (
                <button type="button" className={`${styles.primaryButton} ${styles.wide}`} onClick={goToPayment} disabled={submitting || !catalog.stripe}>
                  {submitting
                    ? 'Opening the payment page…'
                    : <><FaCreditCard aria-hidden="true" /> Continue to payment <FaArrowRight aria-hidden="true" /></>}
                </button>
              )}
              {!catalog.stripe && (
                <p className={styles.smallPrint}>Online payments aren’t switched on yet.</p>
              )}
              <p className={styles.smallPrint}>
                By paying you agree to Virsaa’s terms.
              </p>
            </div>

            <Summary product={product} trialDays={trialDays}>
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
