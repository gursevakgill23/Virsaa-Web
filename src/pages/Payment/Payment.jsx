import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaCreditCard, FaApple, FaPaypal, FaLock, FaCheckCircle, FaCoins, FaCrown, FaUniversity } from 'react-icons/fa';
import PageHero from '../../components/PageHero/PageHero';
import { useAuth } from '../../context/AuthContext';
import paymentsApi, { formatMoney, readReturnTo } from '../../api/paymentsApi';
import { Steps, Summary } from '../Checkout/Checkout';
import { announceMembershipChange } from '../../hooks/useMembership';
import styles from '../Checkout/Checkout.module.css';

const headerLight = '/images/header-image.png';
const headerDark = '/images/header-image-dark.png';

const METHODS = [
  { key: 'credit_card', label: 'Credit card', icon: <FaCreditCard /> },
  { key: 'debit_card', label: 'Debit card', icon: <FaUniversity /> },
  { key: 'apple_pay', label: 'Apple Pay', icon: <FaApple /> },
  { key: 'paypal', label: 'PayPal', icon: <FaPaypal /> },
];

// ---------- Card helpers (nothing here leaves the browser except brand + last 4) ----------
const digitsOnly = (v) => v.replace(/\D/g, '');

export const cardBrand = (number) => {
  const n = digitsOnly(number);
  if (/^4/.test(n)) return 'Visa';
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(n)) return 'Mastercard';
  if (/^3[47]/.test(n)) return 'Amex';
  if (/^(6011|65|64[4-9])/.test(n)) return 'Discover';
  return '';
};

export const luhnValid = (number) => {
  const n = digitsOnly(number);
  if (n.length < 12 || n.length > 19) return false;
  let sum = 0;
  let double = false;
  for (let i = n.length - 1; i >= 0; i -= 1) {
    let d = Number(n[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
};

const formatCardNumber = (value) => {
  const n = digitsOnly(value).slice(0, 19);
  if (cardBrand(n) === 'Amex') return n.replace(/^(\d{0,4})(\d{0,6})(\d{0,5}).*/, (m, a, b, c) => [a, b, c].filter(Boolean).join(' '));
  return n.replace(/(\d{4})(?=\d)/g, '$1 ');
};

const formatExpiry = (value) => {
  const n = digitsOnly(value).slice(0, 4);
  return n.length > 2 ? `${n.slice(0, 2)}/${n.slice(2)}` : n;
};

const expiryValid = (value) => {
  const m = value.match(/^(\d{2})\/(\d{2})$/);
  if (!m) return false;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return false;
  const now = new Date();
  return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
};

const appleSupported = () => {
  try {
    return Boolean(window.ApplePaySession && window.ApplePaySession.canMakePayments());
  } catch {
    return false;
  }
};

/** /payment/:reference  (the order created on the checkout page) */
const Payment = ({ isDarkMode, apiString }) => {
  const { reference } = useParams();
  const { isLoggedIn, accessToken, userData, updateUserData } = useAuth();
  const headerImage = isDarkMode ? headerDark : headerLight;

  const [order, setOrder] = useState(null);
  const [testMode, setTestMode] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [method, setMethod] = useState('credit_card');
  const [card, setCard] = useState({ name: '', number: '', expiry: '', cvc: '' });
  const [paypalEmail, setPaypalEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState(null);
  const [result, setResult] = useState(null);
  const returnTo = readReturnTo();

  useEffect(() => {
    if (!isLoggedIn || !accessToken) return;
    Promise.all([paymentsApi.order(apiString, accessToken, reference), paymentsApi.products(apiString)])
      .then(([o, catalog]) => {
        setOrder(o);
        setTestMode(Boolean(catalog.test_mode));
        setCard((c) => ({ ...c, name: c.name || o.billing_name || '' }));
        setPaypalEmail((e) => e || o.billing_email || '');
        if (o.status === 'paid') setResult({ order: o });
      })
      .catch((err) => {
        setLoadError(err.response?.status === 404 ? 'This order wasn’t found.' : 'Your order couldn’t be loaded. Refresh to try again.');
      });
  }, [apiString, accessToken, isLoggedIn, reference]);

  const changeCard = (e) => {
    const { name, value } = e.target;
    let v = value;
    if (name === 'number') v = formatCardNumber(value);
    if (name === 'expiry') v = formatExpiry(value);
    if (name === 'cvc') v = digitsOnly(value).slice(0, 4);
    setCard((c) => ({ ...c, [name]: v }));
    setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const validateCard = () => {
    const next = {};
    if (!card.name.trim()) next.name = 'Enter the name on the card.';
    if (!luhnValid(card.number)) next.number = 'Check the card number.';
    if (!expiryValid(card.expiry)) next.expiry = 'Enter a valid expiry date (MM/YY).';
    const cvcLength = cardBrand(card.number) === 'Amex' ? 4 : 3;
    if (card.cvc.length !== cvcLength) next.cvc = `Enter the ${cvcLength}-digit security code.`;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const pay = async (e) => {
    e?.preventDefault();
    setPayError(null);
    let body = { payment_method: method };
    if (method === 'credit_card' || method === 'debit_card') {
      if (!validateCard()) return;
      body = { ...body, card_brand: cardBrand(card.number) || 'Card', card_last4: digitsOnly(card.number).slice(-4) };
    } else if (method === 'paypal') {
      if (!/^\S+@\S+\.\S+$/.test(paypalEmail)) {
        setErrors({ paypal: 'Enter the email of your PayPal account.' });
        return;
      }
      body = { ...body, payer_email: paypalEmail };
    } else if (method === 'apple_pay' && !testMode && !appleSupported()) {
      setPayError('Apple Pay isn’t available in this browser. Use Safari on an Apple device, or choose another method.');
      return;
    }

    setPaying(true);
    try {
      const data = await paymentsApi.pay(apiString, accessToken, reference, body);
      setResult(data);
      setOrder(data.order);
      // A new membership changes what the user can open straight away
      if (data.membership_level && updateUserData && userData) {
        updateUserData({ ...userData, membership_level: data.membership_level });
      }
      if (data.membership_level) announceMembershipChange();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;
      setPayError(
        data?.error
          || (status === 401 ? 'Your sign-in has expired. Sign in again to pay.' : null)
          || (data && typeof data === 'object' ? Object.values(data).flat().join(' ') : null)
          || 'The payment didn’t go through. No money was taken. Try again.'
      );
    } finally {
      setPaying(false);
    }
  };

  const hero = (
    <PageHero
      compact
      image={headerImage}
      title={result ? 'Payment complete' : 'Payment'}
      subtitle={result ? 'Thank you for supporting Virsaa.' : 'Choose how you’d like to pay.'}
      crumbs={[{ label: 'Home', to: '/' }, { label: 'Checkout', to: '/checkout' }, { label: 'Payment' }]}
    />
  );

  if (!isLoggedIn) {
    return (
      <div className={styles.page}>
        {hero}
        <div className={styles.stateBox}>
          <FaLock aria-hidden="true" className={styles.stateIcon} />
          <h2>Sign in to pay</h2>
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
        <p className={styles.loading} role="status">Loading your order…</p>
      </div>
    );
  }

  const product = order.product;

  // ---------- Done ----------
  if (result) {
    const o = result.order || order;
    const coins = o.kind === 'coins';
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
              {result.wallet && ` You now have ${result.wallet.coins.toLocaleString()} coins.`}
            </p>
            <dl className={styles.ticketLines}>
              <div><dt>Order</dt><dd>{o.reference}</dd></div>
              <div><dt>Item</dt><dd>{o.description}</dd></div>
              <div><dt>Paid with</dt><dd>{o.payment_method_label}{o.card_last4 ? ` •••• ${o.card_last4}` : ''}</dd></div>
              <div className={styles.ticketTotal}><dt>Total</dt><dd>{formatMoney(o.amount, o.currency)}</dd></div>
            </dl>
            {result.test_mode && <p className={styles.testBanner}>Test mode: no real money was taken.</p>}
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

  // ---------- Pay ----------
  const amount = formatMoney(order.amount, order.currency);
  const isCard = method === 'credit_card' || method === 'debit_card';
  const brand = cardBrand(card.number);

  return (
    <div className={styles.page}>
      {hero}
      <div className={styles.section}>
        <Steps current={1} />
        {testMode && (
          <p className={styles.testBanner} role="note">
            Test mode: no real money is taken. Use a test card such as 4242 4242 4242 4242, any future date and any 3-digit code.
          </p>
        )}

        <div className={styles.layout}>
          <form className={`${styles.panel} ${styles.glass}`} onSubmit={pay} noValidate>
            <h2 className={styles.panelTitle}>Payment method</h2>

            <div className={styles.methods} role="radiogroup" aria-label="Payment method">
              {METHODS.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  role="radio"
                  aria-checked={method === m.key}
                  className={`${styles.method} ${method === m.key ? styles.methodOn : ''}`}
                  onClick={() => { setMethod(m.key); setPayError(null); setErrors({}); }}
                >
                  <span className={styles.methodIcon} aria-hidden="true">{m.icon}</span>
                  {m.label}
                </button>
              ))}
            </div>

            {isCard && (
              <div className={styles.cardForm}>
                {method === 'debit_card' && (
                  <p className={styles.panelText}>Use a Visa Debit or Debit Mastercard. The amount comes straight from your bank account.</p>
                )}
                <div className={styles.field}>
                  <label htmlFor="card-name">Name on card</label>
                  <input id="card-name" name="name" autoComplete="cc-name" value={card.name} onChange={changeCard}
                    className={errors.name ? styles.inputError : ''} aria-invalid={!!errors.name} />
                  {errors.name && <p className={styles.errorText}>{errors.name}</p>}
                </div>
                <div className={styles.field}>
                  <label htmlFor="card-number">Card number {brand && <span className={styles.brand}>{brand}</span>}</label>
                  <input id="card-number" name="number" inputMode="numeric" autoComplete="cc-number" placeholder="1234 5678 9012 3456"
                    value={card.number} onChange={changeCard} className={errors.number ? styles.inputError : ''} aria-invalid={!!errors.number} />
                  {errors.number && <p className={styles.errorText}>{errors.number}</p>}
                </div>
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label htmlFor="card-expiry">Expiry</label>
                    <input id="card-expiry" name="expiry" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY"
                      value={card.expiry} onChange={changeCard} className={errors.expiry ? styles.inputError : ''} aria-invalid={!!errors.expiry} />
                    {errors.expiry && <p className={styles.errorText}>{errors.expiry}</p>}
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="card-cvc">Security code</label>
                    <input id="card-cvc" name="cvc" inputMode="numeric" autoComplete="cc-csc" placeholder={brand === 'Amex' ? '4 digits' : '3 digits'}
                      value={card.cvc} onChange={changeCard} className={errors.cvc ? styles.inputError : ''} aria-invalid={!!errors.cvc} />
                    {errors.cvc && <p className={styles.errorText}>{errors.cvc}</p>}
                  </div>
                </div>
              </div>
            )}

            {method === 'apple_pay' && (
              <div className={styles.walletBox}>
                <p className={styles.panelText}>
                  {appleSupported()
                    ? 'Pay with the card in your Apple Wallet. You’ll confirm with Face ID or Touch ID.'
                    : 'Apple Pay works in Safari on iPhone, iPad and Mac.'}
                  {testMode && !appleSupported() && ' In test mode you can still try it here.'}
                </p>
                <button type="button" className={styles.appleButton} onClick={pay} disabled={paying}>
                  <FaApple aria-hidden="true" /> {paying ? 'Processing…' : 'Pay'}
                </button>
              </div>
            )}

            {method === 'paypal' && (
              <div className={styles.walletBox}>
                <div className={styles.field}>
                  <label htmlFor="paypal-email">PayPal email</label>
                  <input id="paypal-email" type="email" autoComplete="email" value={paypalEmail}
                    onChange={(e) => { setPaypalEmail(e.target.value); setErrors({}); }}
                    className={errors.paypal ? styles.inputError : ''} aria-invalid={!!errors.paypal} />
                  {errors.paypal && <p className={styles.errorText}>{errors.paypal}</p>}
                </div>
                <button type="button" className={styles.paypalButton} onClick={pay} disabled={paying}>
                  <FaPaypal aria-hidden="true" /> {paying ? 'Processing…' : 'Pay with PayPal'}
                </button>
              </div>
            )}

            {payError && <p className={styles.formError} role="alert">{payError}</p>}

            {isCard && (
              <button type="submit" className={`${styles.primaryButton} ${styles.wide}`} disabled={paying}>
                <FaLock aria-hidden="true" /> {paying ? 'Processing…' : `Pay ${amount}`}
              </button>
            )}
            <p className={styles.smallPrint}>
              By paying you agree to Virsaa’s terms. {order.kind === 'membership' && 'Memberships last for the period you pay for.'}
            </p>
          </form>

          <Summary product={product} />
        </div>
      </div>
    </div>
  );
};

export default Payment;
