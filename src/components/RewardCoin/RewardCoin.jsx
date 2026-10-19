/**
 * components/RewardCoin/RewardCoin.jsx
 * -----------------------------------------------------------------------------
 * The reward coin: a gold coin stamped with ਵ (for Virsaa), so it never looks
 * like the game coins. Used on My Rewards, Share a book and in the account
 * panel. Decorative: give the number next to it in text.
 *
 *   <RewardCoin size={20} />            inline, next to a number
 *   <RewardCoin size={120} shine />     the big coin on My Rewards
 * -----------------------------------------------------------------------------
 */
import React, { useId } from 'react';

const RewardCoin = ({ size = 18, shine = false, className = '' }) => {
  const id = useId().replace(/:/g, '');
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      style={{ flex: 'none', display: 'inline-block', verticalAlign: 'middle' }}
    >
      <defs>
        <linearGradient id={`${id}rim`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f8d77b" />
          <stop offset="0.55" stopColor="#d79a22" />
          <stop offset="1" stopColor="#9a6410" />
        </linearGradient>
        <radialGradient id={`${id}face`} cx="0.38" cy="0.32" r="0.75">
          <stop offset="0" stopColor="#fff0b8" />
          <stop offset="0.45" stopColor="#f5c85a" />
          <stop offset="1" stopColor="#d8981f" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="33.5" r="29" fill="#7a4a06" opacity="0.35" />
      <circle cx="32" cy="32" r="29" fill={`url(#${id}rim)`} />
      <circle cx="32" cy="32" r="23.5" fill={`url(#${id}face)`} />
      <circle cx="32" cy="32" r="20.5" fill="none" stroke="#a86d0e" strokeOpacity="0.45" strokeWidth="1.2"
        strokeDasharray="1.6 2.6" />
      <text
        x="32"
        y="42.5"
        textAnchor="middle"
        fontSize="27"
        fontWeight="700"
        fill="#7a4806"
        style={{ fontFamily: "'Mukta Mahee', 'Noto Sans Gurmukhi', sans-serif" }}
      >
        ਵ
      </text>
      {shine && (
        <path d="M14 22c4-8 12-12 20-12" fill="none" stroke="#fffbe8" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
      )}
    </svg>
  );
};

export default RewardCoin;
