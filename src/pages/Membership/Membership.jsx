/**
 * pages/Membership/Membership.jsx
 * -----------------------------------------------------------------------------
 * The membership page (/premium): plan cards with a monthly/yearly switch,
 * a comparison table, FAQs and a closing call to action.
 * The user's current plan is marked "Current", and other plans read as
 * Upgrade or Downgrade (useMembership). Choosing a plan opens Checkout; a
 * member who pays through Stripe changes plan, card or cancels on Stripe's
 * billing page instead (Manage billing).
 * Plans that can also be taken with reward coins say how many and link to
 * My Rewards (reward_cost from /api/payments/products/).
 * -----------------------------------------------------------------------------
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaCheck, FaTimes, FaStar, FaDownload, FaAd, FaHeadset, FaBookOpen, FaChevronDown, FaCrown } from 'react-icons/fa';
import { toast } from '../../utils/notify';
import PageHero from '../../components/PageHero/PageHero';
import useMembership, { PLAN_RANK } from '../../hooks/useMembership';
import paymentsApi, { openBillingPortal } from '../../api/paymentsApi';
import { useAuth } from '../../context/AuthContext';
import { describeApiError } from '../../utils/apiError';
import { formatCoins } from '../../api/rewardsApi';
import RewardCoin from '../../components/RewardCoin/RewardCoin';
import styles from './Membership.module.css';

// Header pictures
const headerLight = '/images/header-image.png';
const headerDark = '/images/header-image-dark.png';

// Converts image paths for the production build (same helper used across pages)
const getImagePath = (imagePath) => {
  if (process.env.NODE_ENV === 'production') {
    if (typeof imagePath === 'string') {
      return (imagePath.startsWith('/') || /^(https?:|blob:|data:)/i.test(imagePath))
        ? imagePath
        : `/${imagePath.replace(/.*static\/media/, 'static/media')}`;
    }
    return imagePath.default || imagePath;
  }
  return imagePath;
};

const ANNUAL_DISCOUNT = 0.2; // matches the FAQ: 20% off yearly plans

// The plans: prices, features and their rank (to compare with the current plan)
const plans = [
  {
    id: 1,
    key: 'basic',
    title: 'Basic',
    monthly: 4.99,
    blurb: 'For getting started with Virsaa.',
    features: [
      { icon: <FaBookOpen />, text: 'Access to basic content' },
      { icon: <FaAd />, text: 'Limited ads' },
      { icon: <FaDownload />, text: 'Download 5 items a month' },
    ],
    isPopular: false,
  },
  {
    id: 2,
    key: 'standard',
    title: 'Standard',
    monthly: 9.99,
    blurb: 'Everything in the library, without ads.',
    features: [
      { icon: <FaBookOpen />, text: 'All books and audiobooks' },
      { icon: <FaBookOpen />, text: 'Standard Gurbani: Sukhmani Sahib, Asa Di Var and more' },
      { icon: <FaAd />, text: 'Ad-free experience' },
      { icon: <FaDownload />, text: 'Download 20 items a month' },
      { icon: <FaStar />, text: 'Early access to new releases' },
    ],
    isPopular: true,
  },
  {
    id: 3,
    key: 'premium',
    title: 'Premium',
    monthly: 14.99,
    blurb: 'Unlimited, with priority help.',
    features: [
      { icon: <FaBookOpen />, text: 'Access to all content' },
      { icon: <FaBookOpen />, text: 'All Gurbani, including Premium shabads and katha' },
      { icon: <FaAd />, text: 'Ad-free experience' },
      { icon: <FaDownload />, text: 'Unlimited downloads' },
      { icon: <FaStar />, text: 'Early access to new releases' },
      { icon: <FaHeadset />, text: 'Priority customer support' },
    ],
    isPopular: false,
  },
];

// true = included, false = not included, string = shown as text
// Rows of the comparison table
const comparison = [
  { feature: 'All books and audiobooks', values: [false, true, true] },
  { feature: 'Gurbani', values: ['Free collection', 'Free + Standard', 'Everything'] },
  { feature: 'Ad-free experience', values: [false, true, true] },
  { feature: 'Downloads', values: ['5 / month', '20 / month', 'Unlimited'] },
  { feature: 'Early access', values: [false, true, true] },
  { feature: 'Priority support', values: [false, false, true] },
];

// Questions and answers
const faqs = [
  { question: 'What payment methods do you accept?', answer: 'Credit and debit cards (Visa, Mastercard, American Express), Apple Pay and Google Pay. Payments are handled by Stripe: Virsaa never sees or stores your card details.' },
  { question: 'Can I cancel my subscription anytime?', answer: 'Yes. Open Manage billing on this page and cancel. You keep your plan until the end of the time you’ve paid for, and you won’t be charged again.' },
  { question: 'Is there a free trial available?', answer: 'Yes. Your first membership starts with a 7-day free trial on any plan.' },
  { question: 'How do I change my subscription plan?', answer: 'Open Manage billing on this page to upgrade, downgrade or switch between monthly and yearly. Stripe adjusts the price for the time left.' },
  { question: 'Will I be charged immediately after the free trial?', answer: 'You’re charged when the 7 days end, unless you cancel before then in Manage billing.' },
  { question: 'Do you offer discounts for annual subscriptions?', answer: 'Yes, yearly plans are 20% cheaper than paying monthly.' },
  { question: 'Where are my receipts?', answer: 'Stripe emails a receipt for every payment. Past invoices are in Manage billing.' },
];

// A comparison table cell: tick, cross or text
const Cell = ({ value }) => {
  if (value === true) return <span className={styles.yes}><FaCheck aria-hidden="true" /><span className={styles.srOnly}>Included</span></span>;
  if (value === false) return <span className={styles.no}><FaTimes aria-hidden="true" /><span className={styles.srOnly}>Not included</span></span>;
  return <span className={styles.cellText}>{value}</span>;
};

// "October 12, 2026"
const formatDate = (date) =>
  date ? date.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

const Membership = ({ isDarkMode, apiString }) => {
  // The user's plan, the billing switch
  const membership = useMembership(apiString);
  const currentRank = membership.rank;
  const headerImage = useMemo(() => getImagePath(isDarkMode ? headerDark : headerLight), [isDarkMode]);
  const [billing, setBilling] = useState('monthly');
  const yearly = billing === 'yearly';
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [openingBilling, setOpeningBilling] = useState(false);
  // Memberships paid through Stripe are changed on Stripe's billing page
  const billedByStripe = membership.isMember && membership.provider === 'stripe';

  // Stripe's billing page: change plan, update the card, cancel, invoices
  const manageBilling = async () => {
    if (openingBilling) return;
    setOpeningBilling(true);
    try {
      await openBillingPortal(apiString, accessToken);
    } catch (err) {
      toast.error(describeApiError(err, 'Billing couldn’t be opened. Try again.'), {
        position: 'top-center', autoClose: 4000, theme: isDarkMode ? 'dark' : 'light',
      });
      setOpeningBilling(false);
    }
  };

  // Plans that can also be taken with reward coins (My Rewards): { 'standard_monthly': 1000 }
  const [rewardCosts, setRewardCosts] = useState({});
  useEffect(() => {
    let cancelled = false;
    paymentsApi.products(apiString, 'membership')
      .then((data) => {
        if (cancelled) return;
        const costs = {};
        (data?.products || []).forEach((p) => { if (p.reward_cost) costs[`${p.plan}_${p.billing}`] = p.reward_cost; });
        setRewardCosts(costs);
      })
      .catch(() => {});   // the plans still show without it
    return () => { cancelled = true; };
  }, [apiString]);

  // Choosing a plan opens checkout with that plan and the selected billing period
  const handleChoosePlan = (planTitle) => {
    if (!planTitle) {
      toast.info('Pick a plan below: your first 7 days are free.', {
        position: 'top-center', autoClose: 3000, theme: isDarkMode ? 'dark' : 'light',
      });
      document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (billedByStripe) {
      manageBilling();   // switching plans happens on Stripe's billing page
      return;
    }
    navigate(`/checkout?product=${planTitle.toLowerCase()}_${billing}&return=/premium`);
  };

  // "Compare plans" button
  const scrollToPlans = () => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className={styles.page}>
      <PageHero
        image={headerImage}
        title="Choose your plan"
        subtitle="Unlock exclusive content, features, and benefits with our premium plans."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Premium' }]}
      >
        <div className={styles.heroActions}>
          <button type="button" className={styles.heroButton} onClick={scrollToPlans}>Compare plans</button>
          <span className={styles.heroNote}>
            {membership.isMember ? `You're on the ${membership.planName} plan` : '7-day free trial on every plan'}
          </span>
        </div>
      </PageHero>

      {/* ---------- Plans ---------- */}
      <section className={styles.section} id="plans" aria-labelledby="plans-title">
        <div className={styles.plansHead}>
          <div>
            <h2 id="plans-title" className={styles.sectionTitle}>Plans</h2>
            <p className={styles.lede}>Cancel anytime. Prices in CAD.</p>
          </div>
          <div className={styles.billing} role="group" aria-label="Billing period">
            <button
              type="button"
              className={`${styles.billingOption} ${!yearly ? styles.billingOn : ''}`}
              aria-pressed={!yearly}
              onClick={() => setBilling('monthly')}
            >
              Monthly
            </button>
            <button
              type="button"
              className={`${styles.billingOption} ${yearly ? styles.billingOn : ''}`}
              aria-pressed={yearly}
              onClick={() => setBilling('yearly')}
            >
              Yearly <span className={styles.save}>Save 20%</span>
            </button>
          </div>
        </div>

        {membership.isMember && (
          <div className={styles.currentStrip} role="status">
            <span className={styles.currentIcon} aria-hidden="true"><FaCrown /></span>
            <p>
              You're on the <strong>{membership.planName}</strong> plan
              {membership.billing ? ` (${membership.billing})` : ''}.
              {membership.periodEnd && (
                membership.status === 'cancelled'
                  ? ` It ends on ${formatDate(membership.periodEnd)}.`
                  : ` Active until ${formatDate(membership.periodEnd)}.`
              )}
              {' '}{billedByStripe ? 'Change plan, update your card or cancel in Manage billing.' : 'Upgrade or downgrade below.'}
            </p>
            {billedByStripe && (
              <button type="button" className={styles.secondaryButton} onClick={manageBilling} disabled={openingBilling}>
                {openingBilling ? 'Opening…' : 'Manage billing'}
              </button>
            )}
          </div>
        )}

        <div className={styles.plansGrid}>
          {plans.map((plan) => {
            const price = yearly ? plan.monthly * 12 * (1 - ANNUAL_DISCOUNT) : plan.monthly;
            const isCurrent = membership.plan === plan.key;
            const sameBilling = !membership.billing || membership.billing === billing;
            const rank = PLAN_RANK[plan.key];
            let action = `Choose ${plan.title}`;
            if (isCurrent) action = sameBilling ? 'Current plan' : `Switch to ${billing}`;
            else if (currentRank > 0) action = rank > currentRank ? `Upgrade to ${plan.title}` : `Downgrade to ${plan.title}`;
            return (
              <article
                key={plan.id}
                className={`${styles.planCard} ${plan.isPopular ? styles.popular : ''} ${isCurrent ? styles.currentCard : ''}`}
                aria-current={isCurrent ? 'true' : undefined}
              >
                {isCurrent ? (
                  <span className={`${styles.popularBadge} ${styles.currentBadge}`}><FaCrown aria-hidden="true" /> Current plan</span>
                ) : plan.isPopular && (
                  <span className={styles.popularBadge}><FaStar aria-hidden="true" /> Most popular</span>
                )}
                <h3 className={styles.planTitle}>{plan.title}</h3>
                <p className={styles.planBlurb}>{plan.blurb}</p>
                <p className={styles.planPrice}>
                  <span className={styles.amount}>${price.toFixed(2)}</span>
                  <span className={styles.per}>/{yearly ? 'year' : 'month'}</span>
                </p>
                {yearly && <p className={styles.planSub}>${(price / 12).toFixed(2)} a month, billed yearly</p>}
                {rewardCosts[`${plan.key}_${billing}`] && (
                  <Link to="/my-rewards#use" className={styles.rewardAlt}>
                    <RewardCoin size={16} /> or {formatCoins(rewardCosts[`${plan.key}_${billing}`])} reward coins
                  </Link>
                )}
                <ul className={styles.featuresList}>
                  {plan.features.map((feature) => (
                    <li key={feature.text} className={styles.featureItem}>
                      <span className={styles.featureIcon} aria-hidden="true">{feature.icon}</span>
                      <span>{feature.text}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className={plan.isPopular || (currentRank > 0 && rank > currentRank) ? styles.primaryButton : styles.secondaryButton}
                  onClick={() => handleChoosePlan(plan.title)}
                  disabled={isCurrent && sameBilling}
                >
                  {action}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      {/* ---------- Comparison ---------- */}
      <section className={styles.section} aria-labelledby="compare-title">
        <h2 id="compare-title" className={styles.sectionTitle}>Compare plans</h2>
        <p className={styles.lede}>What each plan includes, side by side.</p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Feature</th>
                {plans.map((p) => (
                  <th scope="col" key={p.id} className={p.isPopular ? styles.colPopular : ''}>
                    {p.title}
                    {membership.plan === p.key && <span className={styles.currentTag}>Current</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparison.map((row) => (
                <tr key={row.feature}>
                  <th scope="row">{row.feature}</th>
                  {row.values.map((v, i) => (
                    <td key={plans[i].id} className={plans[i].isPopular ? styles.colPopular : ''}><Cell value={v} /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className={styles.section} aria-labelledby="faq-title">
        <div className={styles.faqLayout}>
          <div>
            <h2 id="faq-title" className={styles.sectionTitle}>Questions</h2>
            <p className={styles.lede}>Billing, trials and changing plans.</p>
          </div>
          <div className={styles.faqList}>
            {faqs.map((faq) => (
              <details key={faq.question} className={styles.faqItem}>
                <summary>
                  <span>{faq.question}</span>
                  <FaChevronDown className={styles.faqChevron} aria-hidden="true" />
                </summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Closing call to action ---------- */}
      <section className={styles.section}>
        {membership.isMember ? (
          <div className={styles.ctaBand}>
            <div>
              <h2>Need a different plan?</h2>
              <p>You're on {membership.planName}. Upgrade or downgrade anytime.</p>
            </div>
            <button type="button" className={styles.ctaButton} onClick={scrollToPlans}>
              Compare plans
            </button>
          </div>
        ) : (
          <div className={styles.ctaBand}>
            <div>
              <h2>Ready to get started?</h2>
              <p>Try any plan free for 7 days.</p>
            </div>
            <button type="button" className={styles.ctaButton} onClick={() => handleChoosePlan()}>
              Start free trial
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default Membership;
