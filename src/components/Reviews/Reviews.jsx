/**
 * components/Reviews/Reviews.jsx
 * -----------------------------------------------------------------------------
 * Ratings and reviews for one ebook, audiobook or author, shared by the three
 * detail pages:
 *   - summary: average rating, number of reviews and how the stars are spread
 *   - your review: write one (signed in), or edit / delete the one you wrote;
 *     guests get a "Sign in to write a review" link instead
 *   - everyone's reviews, sorted newest / most helpful / highest / lowest,
 *     five at a time, each with a "Helpful" button (one vote per person,
 *     not on your own review)
 * Data: api/reviewsApi.js (/collections/reviews/). The page can show the
 * average and count in its header through `onSummary`.
 * -----------------------------------------------------------------------------
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaStar, FaRegStar, FaThumbsUp, FaRegThumbsUp, FaPen, FaTrashAlt, FaRedo } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import reviewsApi, { REVIEW_MAX, REVIEW_MIN, REVIEW_SORTS } from '../../api/reviewsApi';
import { describeApiError, fieldErrors } from '../../utils/apiError';
import { toast } from '../../utils/notify';
import styles from './Reviews.module.css';

const PAGE = 5; // reviews shown at a time
const STARS = [1, 2, 3, 4, 5];
const STAR_WORDS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];
const EMPTY_SUMMARY = { count: 0, average: null, distribution: {}, mine: null, results: [] };

// Five stars, filled up to `value` (read-only)
const Stars = ({ value, small = false }) => (
  <span className={`${styles.stars} ${small ? styles.starsSmall : ''}`} role="img" aria-label={`${value} out of 5 stars`}>
    {STARS.map((i) => (i <= Math.round(value || 0)
      ? <FaStar key={i} className={styles.starOn} aria-hidden="true" />
      : <FaRegStar key={i} className={styles.starOff} aria-hidden="true" />))}
  </span>
);

// "12 Oct 2026" in the reader's own format
const formatDate = (iso) => {
  const d = iso ? new Date(iso) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '';
};

const Reviews = ({ apiString, type, id, itemTitle, onSummary }) => {
  const { isLoggedIn, accessToken } = useAuth();
  const [data, setData] = useState(EMPTY_SUMMARY);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [loadError, setLoadError] = useState('');
  const [sort, setSort] = useState('newest');
  const [visible, setVisible] = useState(PAGE);

  // The form for your own review
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ rating: 0, review: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [voting, setVoting] = useState(null); // id of the review whose vote is being sent

  const onSummaryRef = useRef(onSummary);
  onSummaryRef.current = onSummary;
  const token = isLoggedIn ? accessToken : null;

  // ---------------------------------------------------------------- loading
  const load = useCallback(async () => {
    if (!id) return;
    setLoadError('');
    try {
      const result = await reviewsApi.list(apiString, token, type, id, sort);
      setData({ ...EMPTY_SUMMARY, ...result });
      setStatus('ready');
      onSummaryRef.current?.({ count: result.count || 0, average: result.average });
    } catch (err) {
      setLoadError(describeApiError(err, 'Reviews couldn’t be loaded. Try again.'));
      setStatus('error');
    }
  }, [apiString, token, type, id, sort]);

  useEffect(() => {
    load();
  }, [load]);

  // Start editing: fill the form with your current review
  const startEdit = () => {
    setForm({ rating: data.mine?.rating || 0, review: data.mine?.review || '' });
    setErrors({});
    setEditing(true);
  };

  // ---------------------------------------------------------------- saving
  const validate = () => {
    const errs = {};
    const text = form.review.trim();
    if (!form.rating) errs.rating = 'Choose a star rating.';
    if (text.length < REVIEW_MIN) errs.review = `Write at least ${REVIEW_MIN} characters.`;
    else if (text.length > REVIEW_MAX) errs.review = `Keep your review under ${REVIEW_MAX} characters.`;
    return errs;
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const body = { rating: form.rating, review: form.review.trim() };
      if (data.mine) await reviewsApi.update(apiString, token, data.mine.id, body);
      else await reviewsApi.save(apiString, token, type, id, body);
      toast.success(data.mine ? 'Your review was updated.' : 'Review posted. Thank you!');
      setEditing(false);
      setForm({ rating: 0, review: '' });
      await load();
    } catch (err) {
      if (err?.response?.status === 401) {
        setErrors({ form: 'Your session has ended. Sign in again to post your review.' });
      } else {
        const fields = fieldErrors(err);
        setErrors({
          rating: fields.rating, review: fields.review,
          form: fields.rating || fields.review ? '' : describeApiError(err, 'Your review couldn’t be posted. Try again.'),
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    try {
      await reviewsApi.remove(apiString, token, data.mine.id);
      toast.success('Your review was deleted.');
      setConfirmDelete(false);
      setEditing(false);
      await load();
    } catch (err) {
      toast.error(describeApiError(err, 'Your review couldn’t be deleted. Try again.'));
    } finally {
      setSaving(false);
    }
  };

  // "Helpful": one vote per person; pressing again takes the vote back
  const toggleHelpful = async (review) => {
    if (!isLoggedIn) {
      toast.info('Sign in to vote for helpful reviews.', { toastId: 'review-vote-login' });
      return;
    }
    setVoting(review.id);
    try {
      const result = await reviewsApi.helpful(apiString, token, review.id);
      setData((prev) => ({
        ...prev,
        results: prev.results.map((r) => (r.id === review.id ? { ...r, helpful: result.helpful, voted: result.voted } : r)),
      }));
    } catch (err) {
      toast.error(describeApiError(err, 'Your vote couldn’t be saved. Try again.'));
    } finally {
      setVoting(null);
    }
  };

  // ---------------------------------------------------------------- pieces
  const total = data.count || 0;
  const spread = STARS.slice().reverse().map((stars) => {
    const n = Number(data.distribution?.[String(stars)] || 0);
    return { stars, n, share: total ? Math.round((n / total) * 100) : 0 };
  });
  const showForm = isLoggedIn && (!data.mine || editing);
  const textLength = form.review.trim().length;

  const formBlock = (
    <form className={styles.form} onSubmit={submit} noValidate>
      <h4 className={styles.formTitle}>{data.mine ? 'Edit your review' : `Review ${itemTitle || 'this'}`}</h4>
      <div className={styles.field}>
        <span className={styles.label} id={`rating-label-${type}`}>Your rating</span>
        <div className={styles.picker} role="radiogroup" aria-labelledby={`rating-label-${type}`}>
          {STARS.map((star) => (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={form.rating === star}
              aria-label={`${star} star${star === 1 ? '' : 's'}`}
              className={styles.pickStar}
              onClick={() => { setForm((f) => ({ ...f, rating: star })); setErrors((x) => ({ ...x, rating: '' })); }}
            >
              {star <= form.rating ? <FaStar className={styles.starOn} /> : <FaRegStar className={styles.starOff} />}
            </button>
          ))}
          <span className={styles.pickHint} aria-live="polite">{form.rating ? STAR_WORDS[form.rating] : 'Tap a star'}</span>
        </div>
        {errors.rating && <small className={styles.fieldError} role="alert">{errors.rating}</small>}
      </div>
      <div className={styles.field}>
        <label htmlFor={`review-text-${type}`} className={styles.label}>Your review</label>
        <textarea
          id={`review-text-${type}`}
          className={styles.textarea}
          value={form.review}
          maxLength={REVIEW_MAX}
          placeholder="What did you find valuable? Who would you recommend it to?"
          onChange={(e) => { setForm((f) => ({ ...f, review: e.target.value })); setErrors((x) => ({ ...x, review: '' })); }}
          aria-invalid={Boolean(errors.review)}
        />
        <div className={styles.fieldFoot}>
          {errors.review ? <small className={styles.fieldError} role="alert">{errors.review}</small> : <span />}
          <small className={styles.counter}>{textLength} / {REVIEW_MAX}</small>
        </div>
      </div>
      {errors.form && <p className={styles.formError} role="alert">{errors.form}</p>}
      <div className={styles.formActions}>
        {editing && (
          <button type="button" className={styles.secondaryButton} onClick={() => setEditing(false)} disabled={saving}>
            Cancel
          </button>
        )}
        <button type="submit" className={styles.primaryButton} disabled={saving}>
          {saving ? 'Saving…' : data.mine ? 'Update review' : 'Post review'}
        </button>
      </div>
    </form>
  );

  return (
    <div className={styles.reviews}>
      {/* Summary */}
      <div className={styles.summary}>
        <div className={styles.average}>
          <span className={styles.averageNumber}>{data.average != null ? Number(data.average).toFixed(1) : '–'}</span>
          <Stars value={data.average || 0} />
          <span className={styles.averageCount}>
            {status === 'loading' ? 'Loading reviews…' : `${total} ${total === 1 ? 'review' : 'reviews'}`}
          </span>
        </div>
        <ul className={styles.spread} aria-label="How people rated it">
          {spread.map((row) => (
            <li key={row.stars}>
              <span className={styles.spreadLabel}>{row.stars}</span>
              <FaStar className={styles.starOn} aria-hidden="true" />
              <span className={styles.bar}><span style={{ width: `${row.share}%` }} /></span>
              <span className={styles.spreadCount}>{row.n}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Your review */}
      {!isLoggedIn && (
        <p className={styles.signIn}>
          <Link to="/login" className={styles.primaryButton}>Sign in to write a review</Link>
        </p>
      )}
      {showForm && formBlock}
      {isLoggedIn && data.mine && !editing && (
        <div className={styles.mine}>
          <div className={styles.mineHead}>
            <h4 className={styles.formTitle}>Your review</h4>
            <div className={styles.mineActions}>
              <button type="button" className={styles.iconButton} onClick={startEdit}>
                <FaPen aria-hidden="true" /> Edit
              </button>
              <button type="button" className={styles.iconButton} onClick={() => setConfirmDelete(true)}>
                <FaTrashAlt aria-hidden="true" /> Delete
              </button>
            </div>
          </div>
          <Stars value={data.mine.rating} small />
          <p className={styles.reviewBody}>{data.mine.review}</p>
          {confirmDelete && (
            <div className={styles.confirm} role="alertdialog" aria-label="Delete your review?">
              <p>Delete your review? This can’t be undone.</p>
              <button type="button" className={styles.secondaryButton} onClick={() => setConfirmDelete(false)} disabled={saving}>
                Keep it
              </button>
              <button type="button" className={styles.dangerButton} onClick={remove} disabled={saving}>
                {saving ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Everyone's reviews */}
      {status === 'error' && (
        <div className={styles.problem} role="alert">
          <p>{loadError}</p>
          <button type="button" className={styles.secondaryButton} onClick={load}>
            <FaRedo aria-hidden="true" /> Try again
          </button>
        </div>
      )}

      {status === 'ready' && total === 0 && (
        <p className={styles.empty}>No reviews yet. {isLoggedIn ? 'Be the first to share what you thought.' : ''}</p>
      )}

      {status === 'ready' && data.results.length > 0 && (
        <>
          <div className={styles.listHead}>
            <p className={styles.listCount}>{total} {total === 1 ? 'review' : 'reviews'}</p>
            <label className={styles.sort}>
              <span className={styles.srOnly}>Sort reviews</span>
              <select value={sort} onChange={(e) => { setSort(e.target.value); setVisible(PAGE); }}>
                {REVIEW_SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </label>
          </div>
          <ul className={styles.list}>
            {data.results.slice(0, visible).map((review) => (
              <li key={review.id} className={`${styles.review} ${review.is_mine ? styles.reviewMine : ''}`}>
                <div className={styles.reviewTop}>
                  <span className={styles.avatar} aria-hidden="true">{String(review.user || '?').charAt(0).toUpperCase()}</span>
                  <div className={styles.reviewWho}>
                    <span className={styles.reviewName}>{review.user}{review.is_mine ? ' (you)' : ''}</span>
                    <span className={styles.reviewDate}>{formatDate(review.date)}{review.edited ? ' · edited' : ''}</span>
                  </div>
                  <Stars value={review.rating} small />
                </div>
                <p className={styles.reviewBody}>{review.review}</p>
                <button
                  type="button"
                  className={`${styles.helpful} ${review.voted ? styles.helpfulOn : ''}`}
                  onClick={() => toggleHelpful(review)}
                  disabled={review.is_mine || voting === review.id}
                  aria-pressed={Boolean(review.voted)}
                  title={review.is_mine ? 'You can’t vote for your own review' : undefined}
                >
                  {review.voted ? <FaThumbsUp aria-hidden="true" /> : <FaRegThumbsUp aria-hidden="true" />}
                  Helpful{review.helpful ? ` (${review.helpful})` : ''}
                </button>
              </li>
            ))}
          </ul>
          {visible < data.results.length && (
            <button type="button" className={`${styles.secondaryButton} ${styles.more}`} onClick={() => setVisible((v) => v + PAGE)}>
              Show more reviews
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default Reviews;
