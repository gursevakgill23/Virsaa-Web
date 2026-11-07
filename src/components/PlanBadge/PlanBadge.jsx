/**
 * components/PlanBadge/PlanBadge.jsx
 * -----------------------------------------------------------------------------
 *   <PlanBadge item={book} />           "Standard" / "Premium" (nothing for Free),
 *                                       with a lock when the visitor's plan doesn't open it
 *   <LockedPanel item={book} what="This book" />
 *                                       in place of a locked item's content: which plan
 *                                       opens it, and the way to the plans (and to sign in)
 * -----------------------------------------------------------------------------
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { FaCrown, FaLock, FaStar } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import usePlanAccess, { PLAN_LABELS } from '../../hooks/usePlanAccess';
import styles from './PlanBadge.module.css';

const PlanBadge = ({ item, className = '' }) => {
  const { isLocked, levelOf } = usePlanAccess();
  const level = levelOf(item);
  if (level === 'free') return null;
  const locked = isLocked(item);
  const Icon = locked ? FaLock : level === 'premium' ? FaCrown : FaStar;
  return (
    <span className={`${styles.badge} ${styles[level]} ${className}`}
          title={locked ? `${PLAN_LABELS[level]} plan: locked` : `${PLAN_LABELS[level]} plan`}>
      <Icon aria-hidden="true" /> {PLAN_LABELS[level]}
    </span>
  );
};

export const LockedPanel = ({ item, what = 'This' }) => {
  const { isLoggedIn } = useAuth();
  const { levelOf, planMessage } = usePlanAccess();
  return (
    <div className={styles.panel} role="note">
      <FaLock className={styles.panelIcon} aria-hidden="true" />
      <h3>Part of the {PLAN_LABELS[levelOf(item)]} plan</h3>
      <p>{planMessage(item, what)}</p>
      <div className={styles.panelActions}>
        <Link to="/premium" className={styles.primary}><FaCrown aria-hidden="true" /> See the plans</Link>
        {!isLoggedIn && <Link to="/login" className={styles.secondary}>Already a member? Sign in</Link>}
      </div>
    </div>
  );
};

export default PlanBadge;
