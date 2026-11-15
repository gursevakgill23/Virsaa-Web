/**
 * pages/Help/Help.jsx
 * -----------------------------------------------------------------------------
 * Help Center (/help, linked as "FAQs" in the footer):
 *   - the questions and answers, from the database (Django admin > Help
 *     articles), with a search box and topic filters
 *   - "Send us a message": a form for anything the answers don't cover. The
 *     team gets an email, and so does the sender (with a reference)
 *   - "Request a refund": the person's paid orders; website payments are sent
 *     to the team to refund in Stripe, App Store ones point to Apple
 *   - the person's earlier messages and their status
 * Open a panel straight away with /help#contact or /help#refund.
 * -----------------------------------------------------------------------------
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaSearch, FaEnvelope, FaUndoAlt, FaChevronDown, FaCheckCircle } from 'react-icons/fa';
import PageHero from '../../components/PageHero/PageHero';
import RichText from '../../components/RichText/RichText';
import Loader from '../../components/VirsaaLoader/Loader';
import { useAuth } from '../../context/AuthContext';
import siteApi, { POLICY_LINKS } from '../../api/siteApi';
import { formatMoney } from '../../api/paymentsApi';
import { describeApiError } from '../../utils/apiError';
import { devError } from '../../utils/devLog';
import styles from './Help.module.css';

const APPLE_REFUNDS = 'https://reportaproblem.apple.com';
const SUBJECT_MAX = 150;
const MESSAGE_MAX = 5000;

const formatDate = (iso) => {
  const date = iso ? new Date(iso) : null;
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
};

const Help = ({ isDarkMode, apiString }) => {
  const { isLoggedIn, accessToken, userData } = useAuth();
  const { hash } = useLocation();
  const headerImage = isDarkMode ? '/images/header-image-dark.png' : '/images/header-image.png';

  const [help, setHelp] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('all');
  const [panel, setPanel] = useState(hash === '#refund' ? 'refund' : hash === '#contact' ? 'contact' : '');
  const [myRequests, setMyRequests] = useState([]);

  useEffect(() => { document.title = 'Help Center | Virsaa'; }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadFailed(false);
    siteApi.help(apiString)
      .then((data) => { if (!cancelled) setHelp(data); })
      .catch((err) => {
        devError('Help Center failed to load:', err.response?.status || err.message);
        if (!cancelled) setLoadFailed(true);
      });
    return () => { cancelled = true; };
  }, [apiString, reloadKey]);

  const loadMyRequests = React.useCallback(() => {
    if (!isLoggedIn || !accessToken) { setMyRequests([]); return; }
    siteApi.myRequests(apiString, accessToken).then(setMyRequests).catch(() => setMyRequests([]));
  }, [apiString, accessToken, isLoggedIn]);
  useEffect(() => { loadMyRequests(); }, [loadMyRequests]);

  // A link to /help#refund or #contact opens that panel and scrolls to it
  useEffect(() => {
    if (hash === '#refund' || hash === '#contact') {
      setPanel(hash.slice(1));
      setTimeout(() => document.getElementById('get-help')?.scrollIntoView({ block: 'start' }), 50);
    }
  }, [hash]);

  // The answers that match the search and the chosen topic
  const visible = useMemo(() => {
    if (!help) return [];
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return help.categories
      .filter((c) => topic === 'all' || c.key === topic)
      .map((c) => ({
        ...c,
        articles: c.articles.filter((a) => {
          const haystack = `${a.question} ${a.answer}`.toLowerCase();
          return words.every((w) => haystack.includes(w));
        }),
      }))
      .filter((c) => c.articles.length);
  }, [help, query, topic]);

  const openPanel = (name) => {
    setPanel((current) => (current === name ? '' : name));
    setTimeout(() => document.getElementById('get-help')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  return (
    <div className={styles.page}>
      <PageHero
        image={headerImage}
        title="Help Center"
        subtitle="Answers to common questions, and a way to reach us when they don’t cover yours."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Help Center' }]}
        compact
      />

      <div className={styles.wrap}>
        {/* ---------- Search and topics ---------- */}
        <div className={styles.searchRow}>
          <label className={styles.search}>
            <FaSearch aria-hidden="true" />
            <span className={styles.srOnly}>Search the questions</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search, e.g. cancel, refund, password"
            />
          </label>
        </div>

        {help && (
          <div className={styles.topics} role="group" aria-label="Topics">
            {[{ key: 'all', label: 'All topics' }, ...help.categories].map((c) => (
              <button
                key={c.key}
                type="button"
                className={`${styles.topic} ${topic === c.key ? styles.topicOn : ''}`}
                aria-pressed={topic === c.key}
                onClick={() => setTopic(c.key)}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}

        {/* ---------- Questions and answers ---------- */}
        {loadFailed && (
          <div className={styles.notice} role="alert">
            <p>The answers couldn’t be loaded. Check your connection and try again.</p>
            <button type="button" className={styles.secondaryButton} onClick={() => setReloadKey((k) => k + 1)}>Try again</button>
          </div>
        )}
        {!help && !loadFailed && <Loader />}
        {help && visible.length === 0 && (
          <p className={styles.empty}>No answers match “{query}”. Send us a message below and we’ll help.</p>
        )}
        {visible.map((category) => (
          <section key={category.key} className={styles.category} aria-labelledby={`faq-${category.key}`}>
            <h2 id={`faq-${category.key}`} className={styles.categoryTitle}>{category.label}</h2>
            <div className={styles.faqList}>
              {category.articles.map((article) => (
                <details key={article.id} className={styles.faq}>
                  <summary>
                    <span>{article.question}</span>
                    <FaChevronDown aria-hidden="true" className={styles.chevron} />
                  </summary>
                  <RichText text={article.answer} className={styles.answer} />
                </details>
              ))}
            </div>
          </section>
        ))}

        {/* ---------- Still need help ---------- */}
        <section id="get-help" className={styles.getHelp} aria-labelledby="get-help-title">
          <h2 id="get-help-title" className={styles.getHelpTitle}>Didn’t find your answer?</h2>
          <p className={styles.getHelpLede}>
            Send us a message and we’ll reply by email, usually within 2 business days.
          </p>
          <div className={styles.actions}>
            <button
              type="button"
              className={`${styles.action} ${panel === 'contact' ? styles.actionOn : ''}`}
              aria-expanded={panel === 'contact'}
              onClick={() => openPanel('contact')}
            >
              <FaEnvelope aria-hidden="true" />
              <span><strong>Send us a message</strong>A question, a problem or an idea</span>
            </button>
            <button
              type="button"
              className={`${styles.action} ${panel === 'refund' ? styles.actionOn : ''}`}
              aria-expanded={panel === 'refund'}
              onClick={() => openPanel('refund')}
            >
              <FaUndoAlt aria-hidden="true" />
              <span><strong>Request a refund</strong>For a membership or coins you paid for</span>
            </button>
          </div>

          {panel === 'contact' && help && (
            <ContactForm
              apiString={apiString}
              accessToken={accessToken}
              isLoggedIn={isLoggedIn}
              userData={userData}
              categories={help.request_categories.filter((c) => c.key !== 'refund')}
              onSent={loadMyRequests}
            />
          )}
          {panel === 'refund' && (
            <RefundForm
              apiString={apiString}
              accessToken={accessToken}
              isLoggedIn={isLoggedIn}
              windowDays={help?.refund_window_days || 14}
              onSent={loadMyRequests}
            />
          )}
          {help?.contact_email && (
            <p className={styles.smallPrint}>
              You can also email <a href={`mailto:${help.contact_email}`}>{help.contact_email}</a>.
            </p>
          )}
        </section>

        {/* ---------- Your messages ---------- */}
        {myRequests.length > 0 && (
          <section className={styles.mine} aria-labelledby="mine-title">
            <h2 id="mine-title" className={styles.categoryTitle}>Your messages</h2>
            <ul className={styles.mineList}>
              {myRequests.map((r) => (
                <li key={r.reference}>
                  <span className={styles.mineSubject}>{r.subject}</span>
                  <span className={styles.mineMeta}>{r.reference} · {r.category_label} · {formatDate(r.created_at)}</span>
                  <span className={`${styles.status} ${styles[`status_${r.status}`] || ''}`}>{r.status_label}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <nav className={styles.policies} aria-label="Policies">
          {POLICY_LINKS.map((p) => <Link key={p.slug} to={p.to}>{p.label}</Link>)}
        </nav>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- the message form
const ContactForm = ({ apiString, accessToken, isLoggedIn, userData, categories, onSent }) => {
  const [form, setForm] = useState({ name: '', email: '', category: 'question', subject: '', message: '', website: '' });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(null);
  const set = (name) => (e) => { setForm((f) => ({ ...f, [name]: e.target.value })); if (error) setError(''); };

  const submit = async (e) => {
    e.preventDefault();
    if (!isLoggedIn && (!form.name.trim() || !form.email.trim())) { setError('Enter your name and email so we can reply.'); return; }
    if (form.subject.trim().length < 3) { setError('Add a short subject.'); return; }
    if (form.message.trim().length < 10) { setError('Tell us a little more (at least 10 characters).'); return; }
    setSending(true);
    try {
      const body = { category: form.category, subject: form.subject.trim(), message: form.message.trim(), website: form.website };
      if (!isLoggedIn) Object.assign(body, { name: form.name.trim(), email: form.email.trim() });
      setSent(await siteApi.sendRequest(apiString, isLoggedIn ? accessToken : null, body));
      onSent?.();
    } catch (err) {
      setError(err.response?.data?.error || describeApiError(err, 'Your message couldn’t be sent. Try again.'));
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className={styles.done} role="status">
        <FaCheckCircle aria-hidden="true" />
        <p>{sent.message}</p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      {isLoggedIn ? (
        <p className={styles.formNote}>We’ll reply to {userData?.email || 'your account’s email'}.</p>
      ) : (
        <div className={styles.twoCols}>
          <label className={styles.field}>
            <span>Your name</span>
            <input value={form.name} onChange={set('name')} maxLength={100} autoComplete="name" required />
          </label>
          <label className={styles.field}>
            <span>Email</span>
            <input type="email" value={form.email} onChange={set('email')} maxLength={254} autoComplete="email" required />
          </label>
        </div>
      )}
      <label className={styles.field}>
        <span>What is it about?</span>
        <select value={form.category} onChange={set('category')}>
          {categories.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
      </label>
      <label className={styles.field}>
        <span>Subject</span>
        <input value={form.subject} onChange={set('subject')} maxLength={SUBJECT_MAX} required />
      </label>
      <label className={styles.field}>
        <span>Your message</span>
        <textarea rows={6} value={form.message} onChange={set('message')} maxLength={MESSAGE_MAX} required />
      </label>
      {/* Hidden from people; bots fill it in and their message is dropped */}
      <div className={styles.trap} aria-hidden="true">
        <label htmlFor="help-website">Website</label>
        <input id="help-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} name="website" />
      </div>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <button type="submit" className={styles.primaryButton} disabled={sending}>
        {sending ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
};

// ---------------------------------------------------------------- the refund form
const RefundForm = ({ apiString, accessToken, isLoggedIn, windowDays, onSent }) => {
  const [orders, setOrders] = useState(null);
  const [failed, setFailed] = useState(false);
  const [chosen, setChosen] = useState('');
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(null);

  useEffect(() => {
    if (!isLoggedIn || !accessToken) return;
    siteApi.orders(apiString, accessToken)
      .then((list) => {
        setOrders(list);
        const first = list.find((o) => o.refund === 'form' && !o.open_request);
        if (first) setChosen(first.reference);
      })
      .catch(() => setFailed(true));
  }, [apiString, accessToken, isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div className={styles.panelNote}>
        <p>Sign in so we can find your order.</p>
        <Link to="/login" className={styles.primaryButton}>Sign in</Link>
      </div>
    );
  }
  if (failed) return <p className={styles.error} role="alert">Your orders couldn’t be loaded. Try again later.</p>;
  if (!orders) return <Loader />;
  if (sent) {
    return (
      <div className={styles.done} role="status">
        <FaCheckCircle aria-hidden="true" />
        <p>{sent.message}</p>
      </div>
    );
  }
  if (orders.length === 0) {
    return <p className={styles.panelNote}>There are no paid orders in your account from the last year.</p>;
  }

  const order = orders.find((o) => o.reference === chosen);

  const submit = async (e) => {
    e.preventDefault();
    if (!order) { setError('Choose the order you’d like refunded.'); return; }
    if (reason.trim().length < 10) { setError('Tell us why (at least 10 characters).'); return; }
    setSending(true);
    try {
      setSent(await siteApi.sendRequest(apiString, accessToken, {
        category: 'refund', order_reference: order.reference,
        subject: `Refund for ${order.description}`, message: reason.trim(),
      }));
      onSent?.();
    } catch (err) {
      setError(err.response?.data?.error || describeApiError(err, 'Your request couldn’t be sent. Try again.'));
    } finally {
      setSending(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <fieldset className={styles.orders}>
        <legend>Which order?</legend>
        {orders.map((o) => {
          const disabled = o.refund !== 'form' || o.open_request;
          let note = '';
          if (o.refund === 'none') note = 'Refunded';
          else if (o.refund === 'apple') note = 'Bought in the iPhone app: Apple handles this refund';
          else if (o.open_request) note = 'Refund requested';
          else if (!o.within_window) note = `More than ${windowDays} days ago: we’ll still take a look`;
          return (
            <label key={o.reference} className={`${styles.orderRow} ${disabled ? styles.orderOff : ''} ${chosen === o.reference ? styles.orderOn : ''}`}>
              <input
                type="radio"
                name="order"
                value={o.reference}
                checked={chosen === o.reference}
                disabled={disabled}
                onChange={() => { setChosen(o.reference); setError(''); }}
              />
              <span className={styles.orderText}>
                <strong>{o.description}</strong>
                <span>{formatDate(o.paid_at)} · {formatMoney(o.amount, o.currency)} · {o.reference}</span>
                {note && <em>{note}</em>}
              </span>
            </label>
          );
        })}
      </fieldset>
      {orders.some((o) => o.refund === 'apple') && (
        <p className={styles.formNote}>
          App Store purchases are refunded by Apple: open Help Center in the Virsaa app and tap Request a refund, or
          visit <a href={APPLE_REFUNDS} target="_blank" rel="noopener noreferrer">reportaproblem.apple.com</a>.
        </p>
      )}
      <label className={styles.field}>
        <span>Why would you like a refund?</span>
        <textarea rows={4} value={reason} onChange={(e) => { setReason(e.target.value); setError(''); }} maxLength={MESSAGE_MAX} />
      </label>
      <p className={styles.formNote}>
        See the <Link to="/refund-policy">Refund Policy</Link>. Approved refunds go back to the card or wallet you paid with.
      </p>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <button type="submit" className={styles.primaryButton} disabled={sending || !order}>
        {sending ? 'Sending…' : 'Request refund'}
      </button>
    </form>
  );
};

export default Help;
