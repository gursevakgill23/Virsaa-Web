/**
 * pages/Rewards/MyRewards.jsx
 * -----------------------------------------------------------------------------
 * My Rewards (/my-rewards, linked from the account panel): the reward coins
 * people earn when a book they shared passes review.
 *   - the balance, with what was earned, used and is on the way
 *   - use your coins: game coins, a membership, or Virsaa books and products
 *     sent by post (a dialog confirms; products ask for an address)
 *   - earn more: coins for each passed ebook / audiobook and the milestones,
 *     on a trail like the games' maps
 *   - your uploads with their review status, your orders, and the coin history
 * Data: /api/rewards/ (api/rewardsApi.js).
 * -----------------------------------------------------------------------------
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FaBook, FaHeadphones, FaCrown, FaCoins, FaGem, FaStar, FaSeedling, FaCheck, FaGift, FaExchangeAlt, FaUndo,
  FaPen, FaTruck, FaTimes, FaPlus, FaBookOpen, FaGamepad, FaBoxOpen, FaExternalLinkAlt, FaTrash, FaRedo,
} from 'react-icons/fa';
import PageHero from '../../components/PageHero/PageHero';
import RewardCoin from '../../components/RewardCoin/RewardCoin';
import { useAuth } from '../../context/AuthContext';
import rewardsApi, { EXCHANGE_STATUS, UPLOAD_STATUS, formatCoins, formatDate } from '../../api/rewardsApi';
import useMembership, { announceMembershipChange } from '../../hooks/useMembership';
import { describeApiError } from '../../utils/apiError';
import { toast } from '../../utils/notify';
import styles from './MyRewards.module.css';

// Converts image paths for the production build (same helper used across pages)
const getImagePath = (imagePath) => {
  if (process.env.NODE_ENV === 'production' && typeof imagePath === 'string') {
    return (imagePath.startsWith('/') || /^(https?:|blob:|data:)/i.test(imagePath)) ? imagePath : `/${imagePath.replace(/.*static\/media/, 'static/media')}`;
  }
  return imagePath;
};

const WAYS = [
  { key: 'all', label: 'Everything' },
  { key: 'game_coins', label: 'Game coins', icon: <FaGamepad />, note: 'Added to your game wallet at once' },
  { key: 'membership', label: 'Membership', icon: <FaCrown />, note: 'Starts straight away' },
  { key: 'product', label: 'Books and products', icon: <FaBoxOpen />, note: 'Sent to you by post' },
];

const MILESTONE_ICONS = {
  seedling: <FaSeedling />, book: <FaBook />, headphones: <FaHeadphones />, star: <FaStar />, gem: <FaGem />, crown: <FaCrown />,
};

const HISTORY_ICONS = {
  upload: <FaCheck />, milestone: <FaStar />, bonus: <FaGift />, redeem: <FaExchangeAlt />, refund: <FaUndo />, admin: <FaPen />,
};

const COUNTRIES = [['CA', 'Canada'], ['US', 'United States'], ['GB', 'United Kingdom'], ['IN', 'India'], ['AU', 'Australia'], ['NZ', 'New Zealand']];

const EMPTY_ADDRESS = {
  ship_name: '', ship_phone: '', ship_line1: '', ship_line2: '', ship_city: '', ship_region: '', ship_postal_code: '', ship_country: 'CA',
};

/** "3 ebooks and 2 audiobooks" for a milestone's needs */
const needsText = (m) => {
  const parts = [];
  if (m.needs_ebooks) parts.push(`${m.needs_ebooks} ${m.needs_ebooks === 1 ? 'ebook' : 'ebooks'}`);
  if (m.needs_audiobooks) parts.push(`${m.needs_audiobooks} ${m.needs_audiobooks === 1 ? 'audiobook' : 'audiobooks'}`);
  if (m.needs_total) parts.push(`${m.needs_total} ${m.needs_total === 1 ? 'book' : 'books'} of any kind`);
  return parts.join(' and ');
};

const MyRewards = ({ isDarkMode, apiString }) => {
  const headerImage = getImagePath(isDarkMode ? '/images/header-image-dark.png' : '/images/header-image.png');
  const { isLoggedIn, accessToken } = useAuth();
  const membership = useMembership(apiString);
  const { hash } = useLocation();

  const [summary, setSummary] = useState(null);
  const [options, setOptions] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [exchanges, setExchanges] = useState([]);
  const [history, setHistory] = useState({ results: [], next: null, page: 1, count: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [way, setWay] = useState('all');
  const [picked, setPicked] = useState(null);           // the reward being exchanged (dialog)
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [dialogError, setDialogError] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [done, setDone] = useState(null);               // the finished exchange, shown in the dialog
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [moreLoading, setMoreLoading] = useState(false);
  const dialogRef = useRef(null);
  const lastFocus = useRef(null);

  const balance = summary?.balance ?? 0;

  // ---------------------------------------------------------------- loading
  const load = useCallback(async () => {
    if (!isLoggedIn || !accessToken) { setLoading(false); return; }
    setLoading(true);
    const [s, o, u, e, h] = await Promise.allSettled([
      rewardsApi.summary(apiString, accessToken),
      rewardsApi.options(apiString),
      rewardsApi.uploads(apiString, accessToken),
      rewardsApi.exchanges(apiString, accessToken),
      rewardsApi.history(apiString, accessToken, 1),
    ]);
    const list = (r) => {
      if (r.status !== 'fulfilled') return [];
      const body = r.value;
      return Array.isArray(body) ? body : (Array.isArray(body?.results) ? body.results : []);
    };
    if (s.status === 'fulfilled') {
      setSummary(s.value);
      setLoadError('');
    } else {
      setLoadError(describeApiError(s.reason, 'Your rewards couldn’t be loaded right now.'));
    }
    setOptions(o.status === 'fulfilled' ? o.value.options || [] : []);
    setUploads(list(u));
    setExchanges(list(e));
    if (h.status === 'fulfilled') setHistory({ results: h.value.results || [], next: h.value.next, page: 1, count: h.value.count || 0 });
    setLoading(false);
  }, [apiString, accessToken, isLoggedIn]);

  useEffect(() => { load(); }, [load]);

  // Links like /my-rewards#uploads (from notifications) scroll to that part once it's there
  useEffect(() => {
    if (!loading && hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [loading, hash]);

  const loadMoreHistory = async () => {
    setMoreLoading(true);
    try {
      const page = history.page + 1;
      const data = await rewardsApi.history(apiString, accessToken, page);
      setHistory((h) => ({ results: [...h.results, ...(data.results || [])], next: data.next, page, count: data.count }));
    } catch (err) {
      toast.error(describeApiError(err, 'More history couldn’t be loaded.'));
    } finally {
      setMoreLoading(false);
    }
  };

  // ---------------------------------------------------------------- exchanging
  const openDialog = (option) => {
    lastFocus.current = document.activeElement;
    setPicked(option);
    setDone(null);
    setDialogError('');
  };

  const closeDialog = useCallback(() => {
    setPicked(null);
    setDone(null);
    setDialogError('');
    lastFocus.current?.focus?.();
  }, []);

  // The dialog: focus inside it, Escape closes it, Tab stays inside it
  useEffect(() => {
    if (!picked) return undefined;
    const node = dialogRef.current;
    node?.querySelector('input, button:not([data-close])')?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape' && !redeeming) closeDialog();
      if (e.key === 'Tab' && node) {
        const items = [...node.querySelectorAll('button, input, select, textarea, a[href]')].filter((el) => !el.disabled);
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('no-scroll');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('no-scroll');
    };
  }, [picked, done, redeeming, closeDialog]);

  const redeem = async () => {
    if (!picked) return;
    if (picked.needs_shipping) {
      const missing = ['ship_name', 'ship_line1', 'ship_city', 'ship_postal_code'].filter((f) => !address[f].trim());
      if (missing.length) { setDialogError('Add your name and full address so we can send it.'); return; }
    }
    setRedeeming(true);
    setDialogError('');
    try {
      const data = await rewardsApi.redeem(apiString, accessToken, {
        option: picked.id, ...(picked.needs_shipping ? address : {}),
      });
      setDone(data.exchange);
      setSummary((s) => (s ? { ...s, balance: data.balance, spent_total: (s.spent_total || 0) + picked.cost } : s));
      setExchanges((list) => [data.exchange, ...list]);
      if (data.exchange.kind === 'membership') {
        announceMembershipChange();
        membership.refresh?.();
      }
      rewardsApi.history(apiString, accessToken, 1)
        .then((h) => setHistory({ results: h.results || [], next: h.next, page: 1, count: h.count || 0 }))
        .catch(() => {});
    } catch (err) {
      setDialogError(describeApiError(err, 'That didn’t work. No coins were used.'));
    } finally {
      setRedeeming(false);
    }
  };

  const cancelExchange = async (reference) => {
    setConfirmCancel(null);
    try {
      const data = await rewardsApi.cancelExchange(apiString, accessToken, reference);
      setExchanges((list) => list.map((x) => (x.reference === reference ? data.exchange : x)));
      setSummary((s) => (s ? { ...s, balance: data.balance } : s));
      toast.success('Order cancelled. Your coins are back.');
      rewardsApi.history(apiString, accessToken, 1)
        .then((h) => setHistory({ results: h.results || [], next: h.next, page: 1, count: h.count || 0 }))
        .catch(() => {});
    } catch (err) {
      toast.error(describeApiError(err, 'The order couldn’t be cancelled.'));
    }
  };

  const deleteUpload = async (id) => {
    setConfirmDelete(null);
    try {
      await rewardsApi.deleteUpload(apiString, accessToken, id);
      setUploads((list) => list.filter((u) => u.id !== id));
      toast.success('Upload deleted.');
    } catch (err) {
      toast.error(describeApiError(err, 'It couldn’t be deleted.'));
    }
  };

  // ---------------------------------------------------------------- derived
  const shown = useMemo(() => (way === 'all' ? options : options.filter((o) => o.kind === way)), [options, way]);
  const counts = useMemo(() => Object.fromEntries(WAYS.map((w) => [w.key, w.key === 'all' ? options.length : options.filter((o) => o.kind === w.key).length])), [options]);
  const milestones = summary?.milestones || [];
  const next = summary?.next_milestone;
  const rates = summary?.rates || [];

  const hero = (
    <PageHero
      image={headerImage}
      title="My Rewards"
      subtitle="Share books with Virsaa and earn reward coins. Use them for game coins, a membership, or books sent to your door."
      crumbs={[{ label: 'Home', to: '/' }, { label: 'My profile', to: '/my-profile' }, { label: 'My Rewards' }]}
    >
      {isLoggedIn && (
        <div className={styles.treasury}>
          <div className={styles.coinWrap}>
            <RewardCoin size={92} shine className={styles.bigCoin} />
          </div>
          <div className={styles.balanceBlock} aria-live="polite">
            <span className={styles.balanceLabel}>Your balance</span>
            <span className={styles.balance}>{loading && !summary ? '…' : formatCoins(balance)}</span>
            <span className={styles.balanceUnit}>reward coins</span>
          </div>
          <dl className={styles.stats}>
            <div><dt>Earned</dt><dd>{formatCoins(summary?.earned_total)}</dd></div>
            <div><dt>Used</dt><dd>{formatCoins(summary?.spent_total)}</dd></div>
            <div>
              <dt>On the way</dt>
              <dd>{formatCoins(summary?.waiting?.coins)}</dd>
              {summary?.waiting?.count > 0 && <small>{summary.waiting.count} in review</small>}
            </div>
          </dl>
          <div className={styles.heroActions}>
            <Link to="/share-a-book" className={styles.heroPrimary}><FaPlus aria-hidden="true" /> Share a book</Link>
            <a href="#use" className={styles.heroGhost}>Use your coins</a>
          </div>
        </div>
      )}
    </PageHero>
  );

  if (!isLoggedIn) {
    return (
      <div className={styles.page}>
        {hero}
        <section className={styles.section}>
          <div className={styles.empty}>
            <RewardCoin size={64} shine />
            <h2>Log in to see your rewards</h2>
            <p>Share Punjabi ebooks and audiobooks with Virsaa and earn reward coins for every one that passes.</p>
            <Link to="/login" className={styles.primaryButton}>Log in</Link>
          </div>
        </section>
      </div>
    );
  }

  if (!loading && loadError && !summary) {
    return (
      <div className={styles.page}>
        {hero}
        <section className={styles.section}>
          <div className={styles.empty} role="alert">
            <h2>Your rewards couldn’t be loaded</h2>
            <p>{loadError}</p>
            <button type="button" className={styles.primaryButton} onClick={load}><FaRedo aria-hidden="true" /> Try again</button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {hero}

      {/* ---------------------------------------------------------------- use your coins */}
      <section className={styles.section} id="use" aria-labelledby="use-title">
        <div className={styles.sectionHead}>
          <div>
            <h2 id="use-title" className={styles.sectionTitle}>Use your coins</h2>
            <p className={styles.lede}>Three ways to spend them. Game coins and memberships are yours at once; books and products come by post.</p>
          </div>
        </div>

        <div className={styles.ways} role="tablist" aria-label="Show">
          {WAYS.map((w) => (
            <button
              key={w.key}
              type="button"
              role="tab"
              aria-selected={way === w.key}
              className={`${styles.way} ${way === w.key ? styles.wayOn : ''} ${w.key === 'all' ? styles.wayAll : ''}`}
              onClick={() => setWay(w.key)}
            >
              {w.icon && <span className={styles.wayIcon} aria-hidden="true">{w.icon}</span>}
              <span className={styles.wayText}>
                <strong>{w.label} <em>{counts[w.key]}</em></strong>
                {w.note && <small>{w.note}</small>}
              </span>
            </button>
          ))}
        </div>

        {loading && !options.length ? (
          <div className={styles.optionGrid} aria-hidden="true">
            {[0, 1, 2, 3].map((i) => <div key={i} className={`${styles.optionCard} ${styles.skeleton}`} />)}
          </div>
        ) : shown.length === 0 ? (
          <div className={styles.emptyInline}>
            <FaBoxOpen aria-hidden="true" />
            <p>{way === 'product' ? 'Books and products are coming soon. Keep collecting coins!' : 'Nothing here yet.'}</p>
          </div>
        ) : (
          <div className={styles.optionGrid}>
            {shown.map((o) => {
              const short = Math.max(0, o.cost - balance);
              const lowerPlan = o.kind === 'membership' && membership.isMember && (o.plan_rank || 0) < (membership.rank || 0);
              return (
                <article key={o.id} className={`${styles.optionCard} ${styles[`art_${o.kind}`] || ''}`}>
                  <div className={styles.optionArt} aria-hidden="true">
                    {o.kind === 'game_coins' && (
                      <><FaCoins className={styles.artIcon} /><span className={styles.artBig}>{formatCoins(o.game_coins)}</span><span className={styles.artSmall}>game coins</span></>
                    )}
                    {o.kind === 'membership' && (
                      <><FaCrown className={styles.artIcon} /><span className={styles.artBig}>{o.plan_label}</span><span className={styles.artSmall}>{o.billing_label}</span></>
                    )}
                    {o.kind === 'product' && (o.image
                      ? <img src={o.image} alt="" loading="lazy" />
                      : <><FaBookOpen className={styles.artIcon} /><span className={styles.artSmall}>Sent by post</span></>)}
                  </div>
                  <div className={styles.optionBody}>
                    <h3>{o.title}</h3>
                    {o.title_pa && <p className={styles.optionPa} lang="pa">{o.title_pa}</p>}
                    {o.description && <p className={styles.optionText}>{o.description}</p>}
                    {o.stock_left !== null && o.stock_left !== undefined && o.in_stock && <p className={styles.stock}>Only {o.stock_left} left</p>}
                    <div className={styles.optionFoot}>
                      <span className={styles.cost}><RewardCoin size={22} /> {formatCoins(o.cost)}</span>
                      {!o.in_stock ? (
                        <span className={styles.soldOut}>Out of stock</span>
                      ) : lowerPlan ? (
                        <span className={styles.need} title={`You have ${membership.planName} now`}>You have {membership.planName}</span>
                      ) : short > 0 ? (
                        <span className={styles.need}>{formatCoins(short)} more needed</span>
                      ) : (
                        <button type="button" className={styles.useButton} onClick={() => openDialog(o)}>Use coins</button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ---------------------------------------------------------------- earn more */}
      <section className={styles.section} id="earn" aria-labelledby="earn-title">
        <div className={styles.sectionHead}>
          <div>
            <h2 id="earn-title" className={styles.sectionTitle}>Earn more</h2>
            <p className={styles.lede}>Every book we accept earns coins, and reaching a milestone adds a bonus once.</p>
          </div>
          <Link to="/share-a-book" className={styles.primaryButton}><FaPlus aria-hidden="true" /> Share a book</Link>
        </div>

        <div className={styles.rates}>
          {rates.map((r) => (
            <div key={r.kind} className={styles.rate}>
              <span className={styles.rateIcon} aria-hidden="true">{r.kind === 'audiobook' ? <FaHeadphones /> : <FaBook />}</span>
              <div>
                <strong><RewardCoin size={20} /> {formatCoins(r.coins)}</strong>
                <span>for each {r.label.toLowerCase()} that passes</span>
              </div>
            </div>
          ))}
          <div className={`${styles.rate} ${styles.rateNote}`}>
            <span className={styles.rateIcon} aria-hidden="true"><FaStar /></span>
            <div>
              <strong>Bonuses</strong>
              <span>for rare or beautifully made books, chosen by our reviewers</span>
            </div>
          </div>
        </div>

        {milestones.length > 0 && (
          <div className={styles.trailWrap}>
            {next && (
              <p className={styles.nextLine}>
                Next: <strong>{next.name}</strong>, {needsText(next)} <span className={styles.bonusTag}>+{formatCoins(next.bonus_coins)}</span>
              </p>
            )}
            <ol className={styles.trail}>
              {milestones.map((m) => (
                <li key={m.key} className={`${styles.stop} ${m.reached ? styles.stopReached : ''}`} style={{ '--progress': m.progress }}>
                  <span className={styles.stopRing} aria-hidden="true">
                    <span className={styles.stopIcon}>{m.reached ? <FaCheck /> : MILESTONE_ICONS[m.icon] || <FaStar />}</span>
                  </span>
                  <span className={styles.stopName}>{m.name}</span>
                  {m.name_pa && <span className={styles.stopPa} lang="pa">{m.name_pa}</span>}
                  <span className={styles.stopNeeds}>{needsText(m)}</span>
                  <span className={styles.stopBonus}>+{formatCoins(m.bonus_coins)}</span>
                  <span className={styles.srOnly}>{m.reached ? 'Reached' : `${Math.round(m.progress * 100)}% of the way`}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </section>

      {/* ---------------------------------------------------------------- uploads */}
      <section className={styles.section} id="uploads" aria-labelledby="uploads-title">
        <div className={styles.sectionHead}>
          <div>
            <h2 id="uploads-title" className={styles.sectionTitle}>Your uploads</h2>
            <p className={styles.lede}>
              {summary ? `${summary.passed?.total || 0} in the library · ${summary.open_uploads || 0} of ${summary.max_open_uploads || 10} open` : 'Books you have shared and where they are.'}
            </p>
          </div>
        </div>
        {uploads.length === 0 ? (
          <div className={styles.emptyInline}>
            <FaBookOpen aria-hidden="true" />
            <p>You haven’t shared a book yet. <Link to="/share-a-book">Share your first one</Link> and earn {formatCoins(rates[0]?.coins || 250)} coins.</p>
          </div>
        ) : (
          <ul className={styles.uploads}>
            {uploads.map((u) => {
              const status = UPLOAD_STATUS[u.status] || UPLOAD_STATUS.pending;
              return (
                <li key={u.id} className={styles.uploadRow}>
                  <span className={styles.uploadCover}>
                    {u.cover_url ? <img src={u.cover_url} alt="" loading="lazy" /> : (u.kind === 'audiobook' ? <FaHeadphones aria-hidden="true" /> : <FaBook aria-hidden="true" />)}
                  </span>
                  <div className={styles.uploadMain}>
                    <div className={styles.uploadTop}>
                      <h3>{u.title}</h3>
                      <span className={`${styles.status} ${styles[`tone_${status.tone}`]}`}>{status.label}</span>
                    </div>
                    <p className={styles.uploadMeta}>
                      {u.kind_label} · {u.author_name}
                      {u.submitted_at ? ` · sent ${formatDate(u.submitted_at)}` : ` · started ${formatDate(u.created_at)}`}
                    </p>
                    {u.review_note && (u.status === 'changes' || u.status === 'rejected') && (
                      <p className={`${styles.note} ${u.status === 'rejected' ? styles.noteRejected : ''}`}><strong>From our reviewers:</strong> {u.review_note}</p>
                    )}
                    {u.status === 'passed' && u.review_note && <p className={styles.note}><strong>From our reviewers:</strong> {u.review_note}</p>}
                  </div>
                  <div className={styles.uploadSide}>
                    <span className={`${styles.uploadCoins} ${u.status === 'passed' ? styles.earned : ''}`}>
                      <RewardCoin size={18} /> {u.status === 'passed' ? `+${formatCoins(u.coins_awarded)}` : formatCoins(u.expected_coins)}
                    </span>
                    <div className={styles.uploadActions}>
                      {u.status === 'passed' && u.link && <Link to={u.link} className={styles.smallButton}><FaExternalLinkAlt aria-hidden="true" /> In the library</Link>}
                      {u.status === 'draft' && <Link to={`/share-a-book?edit=${u.id}`} className={styles.smallButton}>Finish and send</Link>}
                      {u.status === 'changes' && <Link to={`/share-a-book?edit=${u.id}`} className={styles.smallButton}><FaPen aria-hidden="true" /> Make changes</Link>}
                      {u.can_delete && (confirmDelete === u.id ? (
                        <span className={styles.confirmInline}>
                          Delete it?
                          <button type="button" onClick={() => deleteUpload(u.id)}>Yes</button>
                          <button type="button" onClick={() => setConfirmDelete(null)}>No</button>
                        </span>
                      ) : (
                        <button type="button" className={styles.iconButton} onClick={() => setConfirmDelete(u.id)} aria-label={`Delete ${u.title}`} title="Delete"><FaTrash /></button>
                      ))}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ---------------------------------------------------------------- orders */}
      {exchanges.length > 0 && (
        <section className={styles.section} id="orders" aria-labelledby="orders-title">
          <h2 id="orders-title" className={styles.sectionTitle}>Your exchanges</h2>
          <ul className={styles.orders}>
            {exchanges.map((x) => {
              const status = EXCHANGE_STATUS[x.status] || EXCHANGE_STATUS.pending;
              return (
                <li key={x.reference} className={styles.orderRow}>
                  <span className={styles.orderIcon} aria-hidden="true">
                    {x.kind === 'game_coins' ? <FaCoins /> : x.kind === 'membership' ? <FaCrown /> : <FaTruck />}
                  </span>
                  <div className={styles.orderMain}>
                    <strong>{x.title}</strong>
                    <span className={styles.uploadMeta}>{x.reference} · {formatDate(x.created_at)} · {formatCoins(x.cost)} coins</span>
                    {x.kind === 'membership' && x.details?.until && <span className={styles.uploadMeta}>Until {formatDate(x.details.until)}</span>}
                    {x.tracking_number && <span className={styles.uploadMeta}>Tracking: {x.carrier} {x.tracking_number}</span>}
                    {x.message && <span className={styles.uploadMeta}>{x.message}</span>}
                  </div>
                  <span className={`${styles.status} ${styles[`tone_${status.tone}`]}`}>{status.label}</span>
                  {x.can_cancel && (confirmCancel === x.reference ? (
                    <span className={styles.confirmInline}>
                      Cancel it?
                      <button type="button" onClick={() => cancelExchange(x.reference)}>Yes</button>
                      <button type="button" onClick={() => setConfirmCancel(null)}>No</button>
                    </span>
                  ) : (
                    <button type="button" className={styles.smallButton} onClick={() => setConfirmCancel(x.reference)}>Cancel</button>
                  ))}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* ---------------------------------------------------------------- history */}
      <section className={`${styles.section} ${styles.lastSection}`} id="history" aria-labelledby="history-title">
        <h2 id="history-title" className={styles.sectionTitle}>Coin history</h2>
        {history.results.length === 0 ? (
          <div className={styles.emptyInline}><RewardCoin size={28} /><p>Your coins will show up here once your first book passes.</p></div>
        ) : (
          <>
            <ul className={styles.history}>
              {history.results.map((t) => (
                <li key={t.id} className={styles.historyRow}>
                  <span className={`${styles.historyIcon} ${t.amount < 0 ? styles.historyOut : ''}`} aria-hidden="true">{HISTORY_ICONS[t.kind] || <FaCoins />}</span>
                  <div className={styles.historyMain}>
                    <strong>{t.link ? <Link to={t.link}>{t.note || t.kind_label}</Link> : (t.note || t.kind_label)}</strong>
                    <span>{t.kind_label} · {formatDate(t.created_at)}</span>
                  </div>
                  <span className={`${styles.amount} ${t.amount < 0 ? styles.amountOut : styles.amountIn}`}>
                    {t.amount > 0 ? '+' : '−'}{formatCoins(Math.abs(t.amount))}
                  </span>
                  <span className={styles.after}>{formatCoins(t.balance_after)}</span>
                </li>
              ))}
            </ul>
            {history.next && (
              <button type="button" className={styles.moreButton} onClick={loadMoreHistory} disabled={moreLoading}>
                {moreLoading ? 'Loading…' : `Show more (${history.count - history.results.length} more)`}
              </button>
            )}
          </>
        )}
      </section>

      {/* ---------------------------------------------------------------- the exchange dialog */}
      {picked && (
        <div className={styles.backdrop} onClick={() => !redeeming && closeDialog()} role="presentation">
          <div
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="exchange-title"
            ref={dialogRef}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className={styles.dialogClose} onClick={closeDialog} aria-label="Close" data-close disabled={redeeming}><FaTimes /></button>
            {done ? (
              <div className={styles.doneBox}>
                <span className={styles.doneMark} aria-hidden="true"><FaCheck /></span>
                <h2 id="exchange-title">{done.kind === 'product' ? 'Order received' : 'Done!'}</h2>
                <p>
                  {done.kind === 'game_coins' && <>{formatCoins(done.details?.game_coins)} game coins are in your game wallet.</>}
                  {done.kind === 'membership' && <>{done.details?.plan} membership is on{done.details?.until ? `, until ${formatDate(done.details.until)}` : ''}.</>}
                  {done.kind === 'product' && <>Order {done.reference}. We’ll tell you when it ships.</>}
                </p>
                <p className={styles.dialogBalance}>Balance: <RewardCoin size={18} /> <strong>{formatCoins(balance)}</strong></p>
                <div className={styles.dialogActions}>
                  {done.kind === 'game_coins' && <Link to="/learning/games" className={styles.primaryButton}>Play the games</Link>}
                  <button type="button" className={styles.secondaryButton} onClick={closeDialog}>Close</button>
                </div>
              </div>
            ) : (
              <>
                <h2 id="exchange-title" className={styles.dialogTitle}>{picked.title}</h2>
                <p className={styles.dialogText}>
                  {picked.kind === 'game_coins' && `${formatCoins(picked.game_coins)} game coins go straight into your game wallet.`}
                  {picked.kind === 'membership' && `Your ${picked.plan_label} membership starts today for ${picked.billing_label}. If you already have ${picked.plan_label}, the time is added on.`}
                  {picked.kind === 'product' && 'We’ll post it to you. Where should it go?'}
                </p>
                {picked.needs_shipping && (
                  <div className={styles.addressGrid}>
                    {[
                      ['ship_name', 'Name', 'name', true],
                      ['ship_phone', 'Phone (for the courier)', 'tel', false],
                      ['ship_line1', 'Address', 'address-line1', true],
                      ['ship_line2', 'Apartment, unit (optional)', 'address-line2', false],
                      ['ship_city', 'City', 'address-level2', true],
                      ['ship_region', 'Province / state', 'address-level1', false],
                      ['ship_postal_code', 'Postal code', 'postal-code', true],
                    ].map(([name, label, auto, required]) => (
                      <label key={name} className={`${styles.addressField} ${name === 'ship_line1' || name === 'ship_line2' ? styles.wide : ''}`}>
                        <span>{label}</span>
                        <input
                          value={address[name]}
                          onChange={(e) => { setAddress((a) => ({ ...a, [name]: e.target.value })); setDialogError(''); }}
                          autoComplete={auto}
                          required={required}
                          maxLength={name === 'ship_postal_code' ? 20 : 200}
                        />
                      </label>
                    ))}
                    <label className={styles.addressField}>
                      <span>Country</span>
                      <select value={address.ship_country} onChange={(e) => setAddress((a) => ({ ...a, ship_country: e.target.value }))} autoComplete="country">
                        {COUNTRIES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                      </select>
                    </label>
                  </div>
                )}
                <div className={styles.dialogSum}>
                  <span>Uses</span><strong><RewardCoin size={18} /> {formatCoins(picked.cost)}</strong>
                  <span>Left after</span><strong>{formatCoins(balance - picked.cost)}</strong>
                </div>
                {dialogError && <p className={styles.dialogError} role="alert">{dialogError}</p>}
                <div className={styles.dialogActions}>
                  <button type="button" className={styles.secondaryButton} onClick={closeDialog} disabled={redeeming}>Not now</button>
                  <button type="button" className={styles.primaryButton} onClick={redeem} disabled={redeeming}>
                    {redeeming ? 'One moment…' : `Use ${formatCoins(picked.cost)} coins`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyRewards;
