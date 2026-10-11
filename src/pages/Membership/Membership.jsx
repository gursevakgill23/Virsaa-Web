import React, { useMemo, useState } from 'react';
import { FaCheck, FaTimes, FaStar, FaDownload, FaAd, FaHeadset, FaBookOpen, FaChevronDown } from 'react-icons/fa';
import { toast } from 'react-toastify';
import PageHero from '../../components/PageHero/PageHero';
import styles from './Membership.module.css';

const headerLight = '/images/header-image.png';
const headerDark = '/images/header-image-dark.png';

const getImagePath = (imagePath) => {
  if (process.env.NODE_ENV === 'production') {
    if (typeof imagePath === 'string') {
      return imagePath.startsWith('/')
        ? imagePath
        : `/${imagePath.replace(/.*static\/media/, 'static/media')}`;
    }
    return imagePath.default || imagePath;
  }
  return imagePath;
};

const ANNUAL_DISCOUNT = 0.2; // matches the FAQ: 20% off yearly plans

const plans = [
  {
    id: 1,
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
    title: 'Standard',
    monthly: 9.99,
    blurb: 'Everything in the library, without ads.',
    features: [
      { icon: <FaBookOpen />, text: 'Access to all content' },
      { icon: <FaAd />, text: 'Ad-free experience' },
      { icon: <FaDownload />, text: 'Download 20 items a month' },
      { icon: <FaStar />, text: 'Early access to new releases' },
    ],
    isPopular: true,
  },
  {
    id: 3,
    title: 'Premium',
    monthly: 14.99,
    blurb: 'Unlimited, with priority help.',
    features: [
      { icon: <FaBookOpen />, text: 'Access to all content' },
      { icon: <FaAd />, text: 'Ad-free experience' },
      { icon: <FaDownload />, text: 'Unlimited downloads' },
      { icon: <FaStar />, text: 'Early access to new releases' },
      { icon: <FaHeadset />, text: 'Priority customer support' },
    ],
    isPopular: false,
  },
];

// true = included, false = not included, string = shown as text
const comparison = [
  { feature: 'Access to all content', values: [false, true, true] },
  { feature: 'Ad-free experience', values: [false, true, true] },
  { feature: 'Downloads', values: ['5 / month', '20 / month', 'Unlimited'] },
  { feature: 'Early access', values: [false, true, true] },
  { feature: 'Priority support', values: [false, false, true] },
];

const faqs = [
  { question: 'What payment methods do you accept?', answer: 'We accept all major credit cards, PayPal, and Google Pay.' },
  { question: 'Can I cancel my subscription anytime?', answer: 'Yes, you can cancel your subscription at any time.' },
  { question: 'Is there a free trial available?', answer: 'Yes, we offer a 7-day free trial for all plans.' },
  { question: 'How do I change my subscription plan?', answer: 'You can upgrade or downgrade your plan at any time from your account settings.' },
  { question: 'Will I be charged immediately after the free trial?', answer: 'No, you will only be charged after the free trial ends if you do not cancel.' },
  { question: 'Do you offer discounts for annual subscriptions?', answer: 'Yes, we offer a 20% discount for annual subscriptions.' },
];

const Cell = ({ value }) => {
  if (value === true) return <span className={styles.yes}><FaCheck aria-hidden="true" /><span className={styles.srOnly}>Included</span></span>;
  if (value === false) return <span className={styles.no}><FaTimes aria-hidden="true" /><span className={styles.srOnly}>Not included</span></span>;
  return <span className={styles.cellText}>{value}</span>;
};

const Membership = ({ isDarkMode }) => {
  const headerImage = useMemo(() => getImagePath(isDarkMode ? headerDark : headerLight), [isDarkMode]);
  const [billing, setBilling] = useState('monthly');
  const yearly = billing === 'yearly';

  // Checkout isn't built yet; say so instead of a button that silently does nothing
  const handleChoosePlan = (planTitle) => {
    toast.info(
      planTitle ? `Checkout for the ${planTitle} plan is coming soon.` : 'Free trials are coming soon.',
      { position: 'top-center', autoClose: 3000, theme: isDarkMode ? 'dark' : 'light' }
    );
  };

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
          <span className={styles.heroNote}>7-day free trial on every plan</span>
        </div>
      </PageHero>

      {/* ---------- Plans ---------- */}
      <section className={styles.section} id="plans" aria-labelledby="plans-title">
        <div className={styles.plansHead}>
          <div>
            <h2 id="plans-title" className={styles.sectionTitle}>Plans</h2>
            <p className={styles.lede}>Cancel anytime. Prices in USD.</p>
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

        <div className={styles.plansGrid}>
          {plans.map((plan) => {
            const price = yearly ? plan.monthly * 12 * (1 - ANNUAL_DISCOUNT) : plan.monthly;
            return (
              <article key={plan.id} className={`${styles.planCard} ${plan.isPopular ? styles.popular : ''}`}>
                {plan.isPopular && <span className={styles.popularBadge}><FaStar aria-hidden="true" /> Most popular</span>}
                <h3 className={styles.planTitle}>{plan.title}</h3>
                <p className={styles.planBlurb}>{plan.blurb}</p>
                <p className={styles.planPrice}>
                  <span className={styles.amount}>${price.toFixed(2)}</span>
                  <span className={styles.per}>/{yearly ? 'year' : 'month'}</span>
                </p>
                {yearly && <p className={styles.planSub}>${(price / 12).toFixed(2)} a month, billed yearly</p>}
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
                  className={plan.isPopular ? styles.primaryButton : styles.secondaryButton}
                  onClick={() => handleChoosePlan(plan.title)}
                >
                  Choose {plan.title}
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
                  <th scope="col" key={p.id} className={p.isPopular ? styles.colPopular : ''}>{p.title}</th>
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
        <div className={styles.ctaBand}>
          <div>
            <h2>Ready to get started?</h2>
            <p>Try any plan free for 7 days.</p>
          </div>
          <button type="button" className={styles.ctaButton} onClick={() => handleChoosePlan()}>
            Start free trial
          </button>
        </div>
      </section>
    </div>
  );
};

export default Membership;
