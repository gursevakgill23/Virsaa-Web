/**
 * pages/Legal/LegalPage.jsx
 * -----------------------------------------------------------------------------
 * One policy page, with its text from the database (edited in the Django
 * admin, served by /api/site/pages/<slug>/):
 *   /privacy-policy  /terms  /subscription-policy  /refund-policy
 *   /copyright  /cookie-policy
 * A sticky "On this page" list highlights the section being read and jumps
 * to a section when clicked; the other policies are linked at the end.
 *   <LegalPage slug="terms" {...pageProps} />
 * -----------------------------------------------------------------------------
 */
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import PageHero from '../../components/PageHero/PageHero';
import RichText from '../../components/RichText/RichText';
import Loader from '../../components/VirsaaLoader/Loader';
import siteApi, { POLICY_LINKS } from '../../api/siteApi';
import { devError } from '../../utils/devLog';
import base from '../PrivacyPolicy/PrivacyPolicy.module.css';
import styles from './LegalPage.module.css';

const formatDate = (iso) => {
  if (!iso) return '';
  const date = new Date(`${iso}T12:00:00`);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
};

const LegalPage = ({ slug, isDarkMode, apiString }) => {
  const [page, setPage] = useState(null);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [active, setActive] = useState('');
  const { hash } = useLocation();
  const headerImage = isDarkMode ? '/images/header-image-dark.png' : '/images/header-image.png';
  const fallbackTitle = POLICY_LINKS.find((p) => p.slug === slug)?.label || 'Policy';

  // Load the page (again when the address changes to another policy)
  useEffect(() => {
    let cancelled = false;
    setPage(null);
    setFailed(false);
    siteApi.page(apiString, slug)
      .then((data) => {
        if (cancelled) return;
        setPage(data);
        setActive(data.sections?.[0]?.key || '');
      })
      .catch((err) => {
        if (cancelled) return;
        devError('Policy page failed to load:', err.response?.status || err.message);
        setFailed(true);
      });
    return () => { cancelled = true; };
  }, [apiString, slug, reloadKey]);

  useEffect(() => {
    document.title = `${page?.title || fallbackTitle} | Virsaa`;
  }, [page, fallbackTitle]);

  // Start at the top, or at the section in the address (#cookies)
  useEffect(() => {
    if (!page) return;
    const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
    if (target) target.scrollIntoView({ block: 'start' });
    else window.scrollTo({ top: 0 });
  }, [page, hash]);

  // Highlight the section on screen in the contents list
  useEffect(() => {
    if (!page || !('IntersectionObserver' in window)) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-20% 0px -65% 0px' },
    );
    page.sections.forEach((s) => {
      const el = document.getElementById(s.key);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [page]);

  const jumpTo = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    window.history.replaceState(null, '', `#${id}`);
    setActive(id);
  };

  const title = page?.title || fallbackTitle;
  const others = POLICY_LINKS.filter((p) => p.slug !== slug);

  return (
    <div className={base.page}>
      <PageHero
        image={headerImage}
        title={title}
        subtitle={page?.summary || ''}
        crumbs={[{ label: 'Home', to: '/' }, { label: title }]}
        compact
      />

      {failed && (
        <div className={styles.state} role="alert">
          <p>This page couldn’t be loaded. Check your connection and try again.</p>
          <button type="button" className={styles.retry} onClick={() => setReloadKey((k) => k + 1)}>Try again</button>
        </div>
      )}
      {!failed && !page && <Loader />}

      {page && (
        <div className={base.layout}>
          <aside className={base.toc}>
            <nav className={base.tocPanel} aria-label="On this page">
              <p className={base.tocTitle}>On this page</p>
              <ol className={base.tocList}>
                {page.sections.map((s) => (
                  <li key={s.key}>
                    <a
                      href={`#${s.key}`}
                      onClick={(e) => jumpTo(e, s.key)}
                      className={`${base.tocLink} ${active === s.key ? base.tocActive : ''}`}
                      aria-current={active === s.key ? 'true' : undefined}
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>

          <article className={base.article}>
            {page.effective_date && <p className={base.updated}>Last updated {formatDate(page.effective_date)}</p>}
            {page.sections.map((s) => (
              <section key={s.key} id={s.key} className={base.section} aria-labelledby={`${s.key}-title`}>
                <h2 id={`${s.key}-title`} className={base.sectionTitle}>{s.title}</h2>
                <RichText text={s.body} className={base.prose} />
              </section>
            ))}

            <nav className={styles.others} aria-label="Other policies">
              <h2 className={styles.othersTitle}>Other policies</h2>
              <ul className={styles.othersList}>
                {others.map((p) => <li key={p.slug}><Link to={p.to}>{p.label}</Link></li>)}
                <li><Link to="/help">Help Center (FAQs)</Link></li>
              </ul>
            </nav>
          </article>
        </div>
      )}
    </div>
  );
};

export default LegalPage;
