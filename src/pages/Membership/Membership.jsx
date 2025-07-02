import React, { useMemo } from 'react';
import { FaCheck, FaStar, FaDownload, FaAd } from 'react-icons/fa';
import styles from './Membership.module.css';

// Import header images for light and dark mode
const headerLight = '/images/header-image.jpg'; // Replace with your light mode image
const headerDark = '/images/header-image-dark.png'; // Replace with your dark mode image
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

const Membership = ({ isDarkMode }) => {
  const getImagePath = useProductionImagePath();
  // Memoize the header image based on dark/light mode
  const headerImage = useMemo(() => (isDarkMode ? headerDark : headerLight), [isDarkMode]);


  // Subscription Plans Data
  const plans = [
    {
      id: 1,
      title: 'Basic',
      price: '$4.99/month',
      features: [
        { icon: <FaCheck />, text: 'Access to basic content' },
        { icon: <FaAd />, text: 'Limited ads' },
        { icon: <FaDownload />, text: 'Download 5 items/month' },
      ],
      isPopular: false,
    },
    {
      id: 2,
      title: 'Standard',
      price: '$9.99/month',
      features: [
        { icon: <FaCheck />, text: 'Access to all content' },
        { icon: <FaAd />, text: 'Ad-free experience' },
        { icon: <FaDownload />, text: 'Download 20 items/month' },
        { icon: <FaStar />, text: 'Exclusive early access' },
      ],
      isPopular: true, // Highlight this plan
    },
    {
      id: 3,
      title: 'Premium',
      price: '$14.99/month',
      features: [
        { icon: <FaCheck />, text: 'Access to all content' },
        { icon: <FaAd />, text: 'Ad-free experience' },
        { icon: <FaDownload />, text: 'Unlimited downloads' },
        { icon: <FaStar />, text: 'Exclusive early access' },
        { icon: <FaStar />, text: 'Priority customer support' },
      ],
      isPopular: false,
    },
  ];

  // FAQ Data
  const faqs = [
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, PayPal, and Google Pay.',
    },
    {
      question: 'Can I cancel my subscription anytime?',
      answer: 'Yes, you can cancel your subscription at any time.',
    },
    {
      question: 'Is there a free trial available?',
      answer: 'Yes, we offer a 7-day free trial for all plans.',
    },
    {
      question: 'How do I change my subscription plan?',
      answer: 'You can upgrade or downgrade your plan at any time from your account settings.',
    },
    {
      question: 'Will I be charged immediately after the free trial?',
      answer: 'No, you will only be charged after the free trial ends if you do not cancel.',
    },
    {
      question: 'Do you offer discounts for annual subscriptions?',
      answer: 'Yes, we offer a 20% discount for annual subscriptions.',
    },
  ];

  return (
    <div className={styles.premiumContainer}>
      {/* Header Section */}
      <div
        className={styles.header}
        style={{ backgroundImage: `url(${getImagePath(headerImage)})` }}
      >
        <div className={styles.textOverlay}>
          <h1 className={styles.headline}>Choose Your Plan</h1>
          <p className={styles.description}>
            Unlock exclusive content, features, and benefits with our premium plans.
          </p>
          <button className={styles.ctaButton}>Start A Free Trial</button>
        </div>
      </div>

      {/* Pricing Plans Section */}
      <section className={styles.pricingSection}>
        <div className={styles.plansGrid}>
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`${styles.planCard} ${plan.isPopular ? styles.popular : ''}`}
            >
              {plan.isPopular && <div className={styles.popularBadge}>Most Popular</div>}
              <h2 className={styles.planTitle}>{plan.title}</h2>
              <p className={styles.planPrice}>{plan.price}</p>
              <ul className={styles.featuresList}>
                {plan.features.map((feature, index) => (
                  <li key={index} className={styles.featureItem}>
                    <span className={styles.featureIcon}>{feature.icon}</span>
                    <span>{feature.text}</span>
                  </li>
                ))}
              </ul>
              <button className={styles.subscribeButton}>Get Started</button>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Table Section */}
      <section className={styles.comparisonSection}>
        <h2 className={styles.sectionTitle}>Plan Comparison</h2>
        <div className={styles.comparisonTable}>
          <table>
            <thead>
              <tr>
                <th>Feature</th>
                <th>Basic</th>
                <th>Standard</th>
                <th>Premium</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Access to all content</td>
                <td>❌</td>
                <td>✅</td>
                <td>✅</td>
              </tr>
              <tr>
                <td>Ad-free experience</td>
                <td>❌</td>
                <td>✅</td>
                <td>✅</td>
              </tr>
              <tr>
                <td>Downloads</td>
                <td>5/month</td>
                <td>20/month</td>
                <td>Unlimited</td>
              </tr>
              <tr>
                <td>Priority support</td>
                <td>❌</td>
                <td>❌</td>
                <td>✅</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className={styles.testimonialsSection}>
        <h2 className={styles.sectionTitle}>What Our Users Say</h2>
        <div className={styles.testimonialsGrid}>
          <div className={styles.testimonialCard}>
            <p>"The premium plan is worth every penny! I love the ad-free experience."</p>
            <p className={styles.userName}>— John Doe</p>
          </div>
          <div className={styles.testimonialCard}>
            <p>"Unlimited downloads have made my life so much easier. Highly recommend!"</p>
            <p className={styles.userName}>— Jane Smith</p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className={styles.faqSection}>
        <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
        <div className={styles.faqList}>
          {faqs.map((faq, index) => (
            <div key={index} className={styles.faqItem}>
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer Call-to-Action */}
      <div className={styles.footerCta}>
        <h2>Ready to get started?</h2>
        <button className={styles.ctaButton}>Start your free trial today!</button>
      </div>
    </div>
  );
};

export default Membership;