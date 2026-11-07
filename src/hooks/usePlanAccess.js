/**
 * hooks/usePlanAccess.js
 * -----------------------------------------------------------------------------
 * Free, Standard and Premium for ebooks, audiobooks, lessons, quizzes, games
 * and Sikh history articles (the server's library_api/access.py). Every item
 * the API sends has:
 *
 *   access          'free' | 'standard' | 'premium'
 *   access_label    'Free' | 'Standard' | 'Premium'
 *   locked          true when the person who asked can't open it
 *   required_plan   null | 'standard' | 'premium'
 *
 *   const { isLocked, levelOf, planMessage } = usePlanAccess();
 *   if (isLocked(book)) navigate('/premium');
 *
 * Free opens for everyone, Standard for the Standard and Premium plans,
 * Premium for Premium only, for staff accounts too. A locked item's content
 * answers 403 with code 'premium_required' (isPlanRequired(error)).
 * -----------------------------------------------------------------------------
 */
import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { PLAN_RANK, normalizePlan } from './useMembership';

export const PLAN_LEVELS = ['free', 'standard', 'premium'];
export const PLAN_LABELS = { free: 'Free', standard: 'Standard', premium: 'Premium' };

/** An item's level ('free' when it says nothing; older servers only sent is_premium). */
export const levelOf = (item) => {
  if (PLAN_LEVELS.includes(item?.access)) return item.access;
  return item?.is_premium ? 'premium' : 'free';
};

/** "This book is part of the Standard plan. Choose Standard or Premium to open it." */
export const planMessage = (item, what = 'This') => (levelOf(item) === 'premium'
  ? `${what} is part of the Premium plan. Choose Premium to open it.`
  : `${what} is part of the Standard plan. Choose Standard or Premium to open it.`);

/** Did the server refuse because a (better) plan is needed? */
export const isPlanRequired = (error) => error?.response?.status === 403
  && ['premium_required', 'membership_required'].includes(error?.response?.data?.code);

const usePlanAccess = () => {
  const { isLoggedIn, userData } = useAuth();
  const rank = PLAN_RANK[normalizePlan(userData?.membership_level)] || 0;

  // Paid items are locked for guests, and for anyone whose plan is below the item's level
  // (the plan on the account, as the server counts it)
  const isLocked = useCallback((item) => {
    const level = levelOf(item);
    if (level === 'free') return false;
    if (!isLoggedIn) return true;
    return rank < PLAN_RANK[level];
  }, [isLoggedIn, rank]);

  return { isLocked, levelOf, planMessage };
};

export default usePlanAccess;
