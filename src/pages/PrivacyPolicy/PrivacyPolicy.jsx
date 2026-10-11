import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../../components/PageHero/PageHero';
import styles from './PrivacyPolicy.module.css';

// TODO: set these before going live
const CONTACT_EMAIL = 'privacy@virsaa.com';
const LAST_UPDATED = 'October 11, 2026';

const SECTIONS = [
  {
    id: 'overview',
    title: 'Overview',
    body: (
      <>
        <p>
          Virsaa ("we", "us") runs a platform for reading, listening to and learning about Punjabi and Sikh
          heritage. This policy explains what information we collect when you use the Virsaa website and apps,
          why we collect it, and the choices you have.
        </p>
        <p>
          By creating an account or using Virsaa, you agree to the practices described here. If you do not agree,
          please do not use the service.
        </p>
      </>
    ),
  },
  {
    id: 'collect',
    title: 'Information we collect',
    body: (
      <>
        <h3>Information you give us</h3>
        <ul>
          <li><strong>Account details:</strong> your name, email address and password when you sign up.</li>
          <li><strong>Profile details:</strong> optional information such as your profile photo, date of birth, gender and an about-me note.</li>
          <li><strong>Game profile:</strong> the player name and picture you choose for Learning games.</li>
          <li><strong>Messages:</strong> feedback, newsletter sign-ups and anything you send us through chat or email.</li>
        </ul>
        <h3>Information created as you use Virsaa</h3>
        <ul>
          <li><strong>Learning activity:</strong> quiz and game scores, attempts, progress, coins, badges and achievements.</li>
          <li><strong>Library activity:</strong> favourites, reading and listening history, and reviews you post.</li>
          <li><strong>Technical data:</strong> device and browser type, pages visited and basic server logs used to keep the service running and secure.</li>
        </ul>
        <h3>Payments</h3>
        <p>
          When you buy coins or a membership, your card or wallet details go to our payment provider. We never
          store full card numbers. We keep only the order details, the card brand and the last four digits so we
          can show your receipts.
        </p>
      </>
    ),
  },
  {
    id: 'use',
    title: 'How we use your information',
    body: (
      <ul>
        <li>To create and manage your account and keep you signed in.</li>
        <li>To save your learning progress, coins, badges and leaderboard positions.</li>
        <li>To process purchases and memberships, and send receipts.</li>
        <li>To send account emails such as password resets and, if you opt in, our newsletter.</li>
        <li>To recommend books, lessons and history articles you may enjoy.</li>
        <li>To protect Virsaa from spam, fraud and abuse.</li>
        <li>To understand how the service is used so we can improve it.</li>
      </ul>
    ),
  },
  {
    id: 'sharing',
    title: 'When we share information',
    body: (
      <>
        <p>We do not sell your personal information. We share it only in these cases:</p>
        <ul>
          <li><strong>Service providers</strong> who host our website and data (such as Amazon Web Services and Vercel), send email, or process payments, under agreements that limit how they use it.</li>
          <li><strong>Spam protection:</strong> our sign-up and login forms use Google reCAPTCHA, which is subject to Google's Privacy Policy and Terms of Service.</li>
          <li><strong>Public features:</strong> your player name, picture and scores may appear on leaderboards, and reviews you post are visible to other users.</li>
          <li><strong>Legal reasons:</strong> when required by law, or to protect the rights and safety of our users and of Virsaa.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'storage',
    title: 'Cookies and local storage',
    body: (
      <p>
        Virsaa stores a small amount of information in your browser, such as your sign-in token, your light or
        dark theme choice and your recent searches. This keeps you signed in and remembers your settings. You can
        clear it at any time in your browser settings, though you will then need to sign in again.
      </p>
    ),
  },
  {
    id: 'retention',
    title: 'How long we keep information',
    body: (
      <p>
        We keep your account information for as long as your account is open. If you delete your account, we
        delete or anonymise your personal information within a reasonable period, except for records we must keep
        for legal, tax or accounting reasons, such as payment records.
      </p>
    ),
  },
  {
    id: 'security',
    title: 'Security',
    body: (
      <p>
        We protect your information with encrypted connections (HTTPS), hashed passwords and restricted access to
        our servers and database. No online service can be completely secure, so please use a strong, unique
        password and tell us straight away if you think your account has been accessed without permission.
      </p>
    ),
  },
  {
    id: 'rights',
    title: 'Your choices and rights',
    body: (
      <>
        <p>Depending on where you live, you may have the right to:</p>
        <ul>
          <li>See the personal information we hold about you.</li>
          <li>Correct information that is wrong or out of date.</li>
          <li>Delete your account and personal information.</li>
          <li>Withdraw consent, for example by unsubscribing from the newsletter.</li>
          <li>Make a complaint to your local privacy regulator.</li>
        </ul>
        <p>
          You can update most details yourself on your <Link to="/my-profile">profile</Link> and in{' '}
          <Link to="/account-settings">account settings</Link>. For anything else, email us at{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </>
    ),
  },
  {
    id: 'children',
    title: 'Children',
    body: (
      <p>
        Many of our learning resources are suitable for young learners, but accounts should be created and
        managed by a parent or guardian for children under the age of digital consent in their country. If you
        believe a child has given us personal information without a parent's permission, contact us and we will
        delete it.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    body: (
      <p>
        We may update this policy as Virsaa grows. When we make important changes, we will update the date at the
        top of this page and, where appropriate, let you know by email or in the app.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Contact us',
    body: (
      <p>
        Questions about this policy or your information? Email{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and we will reply as soon as we can.
      </p>
    ),
  },
];

const PrivacyPolicy = ({ isDarkMode }) => {
  const [active, setActive] = useState(SECTIONS[0].id);
  const headerImage = isDarkMode ? '/images/header-image-dark.png' : '/images/header-image.png';

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  // Highlight the section currently on screen in the contents list
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-20% 0px -65% 0px' }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const jumpTo = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    setActive(id);
  };

  return (
    <div className={styles.page}>
      <PageHero
        image={headerImage}
        title="Privacy Policy"
        subtitle="How Virsaa collects, uses and protects your information."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Privacy Policy' }]}
        compact
      />

      <div className={styles.layout}>
        <aside className={styles.toc}>
          <nav className={styles.tocPanel} aria-label="On this page">
            <p className={styles.tocTitle}>On this page</p>
            <ol className={styles.tocList}>
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    onClick={(e) => jumpTo(e, s.id)}
                    className={`${styles.tocLink} ${active === s.id ? styles.tocActive : ''}`}
                    aria-current={active === s.id ? 'true' : undefined}
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <article className={styles.article}>
          <p className={styles.updated}>Last updated {LAST_UPDATED}</p>
          {SECTIONS.map((s) => (
            <section key={s.id} id={s.id} className={styles.section} aria-labelledby={`${s.id}-title`}>
              <h2 id={`${s.id}-title`} className={styles.sectionTitle}>{s.title}</h2>
              <div className={styles.prose}>{s.body}</div>
            </section>
          ))}
        </article>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
