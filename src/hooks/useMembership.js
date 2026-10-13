/**
 * hooks/useMembership.js
 * -----------------------------------------------------------------------------
 * React hook that tells any page which membership plan the signed-in user has
 * (Free, Basic, Standard or Premium). Used by the navbar plan card, the
 * Membership page, downloads and premium-only content.
 * -----------------------------------------------------------------------------
 */
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import paymentsApi from '../api/paymentsApi';

/*
 * The signed-in user's membership plan.
 *
 * Reads /api/payments/subscription/ first (it knows the billing period and end date).
 * If that has nothing active, it falls back to the user's membership_level.
 *
 * Returns { plan, planName, billing, periodEnd, status, isMember, isPremiumTier, rank, loading, refresh }
 *   plan           'free' | 'basic' | 'standard' | 'premium'
 *   isMember       on any paid plan
 *   isPremiumTier  on Standard or Premium
 */

// Plans in order, so pages can compare them (upgrade vs downgrade)
export const PLAN_RANK = { free: 0, basic: 1, standard: 2, premium: 3 };
export const PLAN_NAMES = { free: 'Free', basic: 'Basic', standard: 'Standard', premium: 'Premium' };

// Pages call this after a membership is bought, so every open screen updates
export const MEMBERSHIP_CHANGED = 'virsaa:membership-changed';
export const announceMembershipChange = () => {
  try { window.dispatchEvent(new Event(MEMBERSHIP_CHANGED)); } catch { /* ignore */ }
};

// Turn any plan label from the server ("premium_member", "Standard"…) into a plan key
export const normalizePlan = (value) => {
  const v = String(value || '').toLowerCase();
  if (v.includes('premium')) return 'premium';
  if (v.includes('standard')) return 'standard';
  if (v.includes('basic')) return 'basic';
  return 'free';
};

// What a signed-out or free user gets
const FREE = { plan: 'free', billing: null, periodEnd: null, status: null };

// Read a subscription from the payments API; null if it isn't usable today
const fromSubscription = (sub) => {
  if (!sub || !sub.plan) return null;
  const end = sub.current_period_end ? new Date(sub.current_period_end) : null;
  const stillRunning = end && end.getTime() > Date.now();
  // A cancelled plan stays usable until its paid period ends
  if (!stillRunning || !['active', 'cancelled'].includes(sub.status)) return null;
  return { plan: normalizePlan(sub.plan), billing: sub.billing || null, periodEnd: end, status: sub.status };
};

const useMembership = (apiString) => {
  const { isLoggedIn, accessToken, userData } = useAuth();
  const levelFromUser = userData?.membership_level;
  const [state, setState] = useState(FREE);
  const [loading, setLoading] = useState(Boolean(isLoggedIn));

  // Load the plan. Any error falls back to the profile's membership level,
  // so the page still works when the payments API is unreachable.
  const refresh = useCallback(async () => {
    if (!isLoggedIn || !accessToken) {
      setState(FREE);
      setLoading(false);
      return;
    }
    setLoading(true);
    let next = null;
    try {
      next = fromSubscription(await paymentsApi.subscription(apiString, accessToken));
    } catch {
      next = null; // fall back to the profile's membership_level below
    }
    setState(next || { ...FREE, plan: normalizePlan(levelFromUser) });
    setLoading(false);
  }, [apiString, accessToken, isLoggedIn, levelFromUser]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    // Re-check when another page says the plan changed (e.g. after paying)
    window.addEventListener(MEMBERSHIP_CHANGED, refresh);
    return () => window.removeEventListener(MEMBERSHIP_CHANGED, refresh);
  }, [refresh]);

  // Values every caller gets back
  const rank = PLAN_RANK[state.plan] || 0;
  return {
    ...state,
    planName: PLAN_NAMES[state.plan],
    rank,
    isMember: rank > 0,
    isPremiumTier: rank >= PLAN_RANK.standard,
    loading,
    refresh,
  };
};

export default useMembership;
