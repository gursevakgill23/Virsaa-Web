/**
 * pages/Payment/Payment.jsx
 * -----------------------------------------------------------------------------
 * Payment (/payment/:reference): where Stripe brings people back after paying
 * on its own page. Stripe tells the Virsaa server about the payment directly
 * (a signed webhook), usually within a few seconds, so this page waits for the
 * order to show as paid, then shows the confirmation. A new membership takes
 * effect at once (the profile and every open screen are updated).
 * Card details never pass through Virsaa: Stripe handles them.
 * -----------------------------------------------------------------------------
 */
import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaLock, FaCheckCircle, FaCoins, FaCrown, FaClock } from 'react-icons/fa';
import PageHero from '../../components/PageHero/PageHero';
import { useAuth } from '../../context/AuthContext';
import paymentsApi, { formatMoney, readReturnTo } from '../../api/paymentsApi';
import Loader from '../../components/VirsaaLoader/Loader';
import { Steps, Summary } from '../Checkout/Checkout';
import { announceMembershipChange } from '../../hooks/useMembership';
import styles from '../Checkout/Checkout.module.css';

// Header pictures
const headerLight = '/images/header-image.png';
const headerDark = '/images/header-image-dark.png';

// How long to wait for Stripe's confirmation before saying it's taking longer than usual
const POLL_MS = 2000;
const POLL_TRIES = 30;   // one minute

/** /payment/:reference  (the order made at checkout; Stripe sends people back here) */
const Payment = ({ isDarkMode, apiString }) => {
  const { reference } = useParams();
  const { isLoggedIn, accessToken, updateUserData } = useAuth();
  const headerImage = isDarkMode ? headerDark : headerLight;
  const returnTo = readReturnTo();

  // The order, a load error, and whether we gave up waiting for Stripe
  const [order, setOrder] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [slow, setSlow] = useState(false);
  const [reloadKey, setReloadKey] = useState(0); // bumped by "Check again"
  const announced = useRef(false);

  // Load the order; while it's still pending, check again every 2 seconds for up to a minute
  useEffect(() => {
    if (!isLoggedIn || !accessToken) return undefined;
    let cancelled = false;
    let timer = null;
    let tries = 0;
    setLoadError(null);
    setSlow(false);

    const check = () => {
      paymentsApi.order(apiString, accessToken, reference)
        .then((o) => {
          if (cancelled) return;
          if (!o || !o.reference) throw new Error('Unexpected order reply');
          setOrder(o);
          tries += 1;
          if (o.status === 'pending') {
            if (tries < POLL_TRIES) timer = setTimeout(check, POLL_MS);
            else setSlow(true);
          }
        })
        .catch((err) => {
          if (cancelled) return;
          setLoadError(err.response?.status === 404
            ? 'This order wasn’t found.'
            : 'Your order couldn’t be loaded. Check your connection and try again.');
        });
    };
    check();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [apiString, accessToken, isLoggedIn, reference, reloadKey]);

  // Once paid: reload the profile from the server (which sets the plan), so what the person
  // can open changes straight away and always matches the server
  useEffect(() => {
    if (!order || order.status !== 'paid' || order.kind !== 'membership' || announced.current) return;
    announced.current = true;
    Promise.resolve(updateUserData?.()).finally(announceMembershipChange);
  }, [order, updateUserData]);

  const paid = order?.status === 'paid';
  const hero = (
    <PageHero
      compact
      image={headerImage}
      title={paid ? 'Payment complete' : 'Payment'}
      subtitle={paid ? 'Thank you for supporting Virsaa.' : 'Confirming your payment with Stripe.'}
      crumbs={[{ label: 'Home', to: '/' }, { label: 'Checkout', to: '/checkout' }, { label: 'Payment' }]}
    />
  );

  // ---------------------------------------------------------------- render
  if (!isLoggedIn) {
    return (
      <div className={styles.page}>
        {hero}
        <div className={styles.stateBox}>
          <FaLock aria-hidden="true" className={styles.stateIcon} />
          <h2>Sign in to see your order</h2>
          <p>Your order is saved to your account.</p>
          <Link to="/login" className={styles.primaryButton}>Sign in</Link>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={styles.page}>
        {hero}
        <div className={styles.stateBox}>
          <h2>{loadError}</h2>
          <div className={styles.stateActions}>
            {loadError !== 'This order wasn’t found.' && (
              <button type="button" className={styles.primaryButton} onClick={() => setReloadKey((k) => k + 1)}>Try again</button>
            )}
            <Link to="/premium" className={styles.primaryButton}>See membership plans</Link>
            <Link to="/learning" className={styles.secondaryButton}>Go to games</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className={styles.page}>
        {hero}
        {/* The Virsaa loader stays until the order has loaded */}
        <Loader />
      </div>
    );
  }

  const product = order.product;
  const coins = order.kind === 'coins';
  const trial = !coins && Number(order.amount) === 0;
  const receiptUrl = order.details?.receipt_url;

  // ---------- Paid ----------
  if (paid) {
    return (
      <div className={styles.page}>
        {hero}
        <div className={styles.section}>
          <Steps current={2} />
          <div className={`${styles.panel} ${styles.glass} ${styles.receipt}`}>
            <FaCheckCircle aria-hidden="true" className={styles.receiptIcon} />
            <h2 className={styles.panelTitle}>You’re all set</h2>
            <p className={styles.panelText}>
              {coins
                ? `${(product?.coins || 0) + (product?.bonus || 0)} coins were added to your account.`
                : `Your ${product?.plan_name || ''} membership is active.`}
              {trial && ' Your free trial has started: you won’t be charged until it ends, and you can cancel before then in Manage billing.'}
            </p>
            <dl className={styles.ticketLines}>
              <div><dt>Order</dt><dd>{order.reference}</dd></div>
              <div><dt>Item</dt><dd>{order.description}</dd></div>
              <div><dt>Paid with</dt><dd>{order.payment_method_label || 'Stripe'}</dd></div>
              <div className={styles.ticketTotal}><dt>Total</dt><dd>{formatMoney(order.amount, order.currency)}</dd></div>
            </dl>
            <p className={styles.smallPrint}>
              Stripe has emailed your receipt.
              {receiptUrl && /^https:\/\/([a-z0-9-]+\.)*stripe\.com\//i.test(receiptUrl) && (
                <> <a href={receiptUrl} target="_blank" rel="noopener noreferrer">View invoice</a></>
              )}
            </p>
            <div className={styles.stateActions}>
              {returnTo && (
                <Link to={returnTo} className={styles.primaryButton}>
                  {coins ? <><FaCoins aria-hidden="true" /> Back to the game</> : 'Continue'}
                </Link>
              )}
              {!coins && <Link to="/collections" className={returnTo ? styles.secondaryButton : styles.primaryButton}><FaCrown aria-hidden="true" /> Explore the library</Link>}
              {coins && !returnTo && <Link to="/learning" className={styles.primaryButton}>Go to games</Link>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Not paid ----------
  if (order.status !== 'pending') {
    return (
      <div className={styles.page}>
        {hero}
        <div className={styles.stateBox}>
          <h2>{order.status === 'failed' ? 'The payment didn’t go through' : 'This order wasn’t paid'}</h2>
          <p>No money was taken. You can start again from checkout.</p>
          <div className={styles.stateActions}>
            {product && (
              <Link to={`/checkout?product=${encodeURIComponent(product.code)}`} className={styles.primaryButton}>Back to checkout</Link>
            )}
            <Link to="/premium" className={styles.secondaryButton}>See membership plans</Link>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Waiting for Stripe's confirmation ----------
  return (
    <div className={styles.page}>
      {hero}
      <div className={styles.section}>
        <Steps current={1} />
        <div className={styles.layout}>
          <div className={`${styles.panel} ${styles.glass}`} role="status">
            {slow ? (
              <>
                <FaClock aria-hidden="true" className={styles.receiptIcon} />
                <h2 className={styles.panelTitle}>Still confirming your payment</h2>
                <p className={styles.panelText}>
                  This is taking longer than usual. If you paid, your coins or membership will appear shortly and
                  Stripe will email your receipt. If you closed Stripe’s page without paying, no money was taken.
                </p>
                <div className={styles.stateActions}>
                  <button type="button" className={styles.primaryButton} onClick={() => setReloadKey((k) => k + 1)}>Check again</button>
                  {product && (
                    <Link to={`/checkout?product=${encodeURIComponent(product.code)}`} className={styles.secondaryButton}>Back to checkout</Link>
                  )}
                </div>
              </>
            ) : (
              <>
                <h2 className={styles.panelTitle}>Confirming your payment…</h2>
                <p className={styles.panelText}>This usually takes a few seconds. Please keep this page open.</p>
                <Loader />
              </>
            )}
          </div>
          <Summary product={product} />
        </div>
      </div>
    </div>
  );
};

export default Payment;
