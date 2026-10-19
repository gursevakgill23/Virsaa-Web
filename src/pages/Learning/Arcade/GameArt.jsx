/**
 * pages/Learning/Arcade/GameArt.jsx
 * -----------------------------------------------------------------------------
 * A small drawing for each map game (the banner on its map and its card in
 * the Khed Mela): a phulkari letter, a takhti, proverb cards tied with a
 * parandi, monsoon rain, the history train, diyas, a folded map, a Gurdwara
 * jigsaw, Basant kites and a langar thali. Drawn with SVG in the game's own
 * colours (the CSS custom properties from themes.js).
 * -----------------------------------------------------------------------------
 */
import React from 'react';

const T = { fontFamily: "'Baloo Paaji 2', 'Mukta Mahee', sans-serif", fontWeight: 800 };

const Phulkari = () => (
  <>
    <rect x="18" y="12" width="204" height="156" rx="28" fill="var(--accent)" />
    {Array.from({ length: 6 }).flatMap((_, r) => Array.from({ length: 9 }).map((__, c) => {
      const x = 34 + c * 22 + (r % 2) * 11;
      const y = 26 + r * 26;
      return <path key={`${r}-${c}`} d={`M${x} ${y - 7}l7 7-7 7-7-7z`} fill={(r + c) % 3 ? 'var(--accent-2)' : '#ffe9a8'} opacity=".9" />;
    }))}
    <circle cx="120" cy="90" r="58" fill="var(--paper)" />
    <circle cx="120" cy="90" r="58" fill="none" stroke="var(--accent-3)" strokeWidth="5" strokeDasharray="3 7" strokeLinecap="round" />
    <text x="120" y="120" textAnchor="middle" fontSize="86" fill="var(--ink)" style={T}>ੳ</text>
    <g transform="rotate(32 190 142)">
      <rect x="150" y="135" width="64" height="15" rx="3" fill="#FFC93C" />
      <rect x="142" y="135" width="11" height="15" rx="2" fill="#E76F51" />
      <path d="M214 135l15 7.5-15 7.5z" fill="#F6D9B4" />
      <path d="M224 140l5 2.5-5 2.5z" fill="var(--ink)" />
    </g>
  </>
);

const Takhti = () => (
  <>
    <rect x="104" y="2" width="32" height="30" rx="10" fill="#9C6634" />
    <circle cx="120" cy="14" r="5" fill="var(--sky-1)" />
    <rect x="26" y="22" width="188" height="146" rx="20" fill="#9C6634" />
    <rect x="37" y="33" width="166" height="124" rx="13" fill="#EADBB4" />
    <path d="M45 60h150M45 130h150" stroke="#d5c193" strokeWidth="2" />
    {[['ਸ਼', '#3E8E41'], ['ਬ', '#E0861E'], ['ਦ', '#E9B824'], ['ਲੇ', '#9C8F7A']].map(([letter, colour], i) => (
      <g key={letter} transform={`translate(${49 + i * 37} 74)`}>
        <rect width="32" height="34" rx="7" fill={colour} />
        <text x="16" y="25" textAnchor="middle" fontSize="20" fill="#fff" style={T}>{letter}</text>
      </g>
    ))}
    <g transform="rotate(-38 196 150)">
      <rect x="150" y="146" width="78" height="7" rx="3" fill="#C9A26A" />
      <path d="M228 146l10 3.5-10 3.5z" fill="#2A1E14" />
    </g>
    <path d="M22 150c0-14 30-14 30 0v12H22z" fill="#2A1E14" />
    <ellipse cx="37" cy="150" rx="15" ry="4" fill="#3f3022" />
  </>
);

const ProverbCards = () => (
  <>
    <g transform="rotate(-7 56 86)">
      <rect x="6" y="52" width="100" height="68" rx="16" fill="var(--paper)" stroke="var(--accent-3)" strokeWidth="4" />
      <text x="56" y="94" textAnchor="middle" fontSize="16" fill="var(--ink)" style={T}>ਉੱਚੀ ਦੁਕਾਨ</text>
    </g>
    <g transform="rotate(6 186 92)">
      <rect x="136" y="58" width="100" height="68" rx="16" fill="var(--paper)" stroke="var(--accent-3)" strokeWidth="4" />
      <text x="186" y="100" textAnchor="middle" fontSize="15" fill="var(--ink)" style={T}>ਫਿੱਕਾ ਪਕਵਾਨ</text>
    </g>
    <path d="M104 86c6-14 14 12 16 0s10-14 18 2" stroke="var(--accent)" strokeWidth="8" fill="none" strokeLinecap="round" />
    <circle cx="121" cy="86" r="9" fill="var(--accent)" />
    {[[-10, '#F2B134'], [0, 'var(--accent)'], [10, '#3A4BA8']].map(([dx, colour]) => (
      <g key={dx}>
        <path d={`M121 92q${dx / 2} 22 ${dx} 44`} stroke={colour} strokeWidth="3" fill="none" />
        <circle cx={121 + dx} cy="140" r="7" fill={colour} />
      </g>
    ))}
  </>
);

const Monsoon = () => (
  <>
    <g fill="#dfe8f2">
      <circle cx="78" cy="58" r="30" /><circle cx="118" cy="44" r="38" /><circle cx="162" cy="60" r="28" />
      <rect x="48" y="56" width="144" height="32" rx="16" />
    </g>
    <path d="M52 86h136" stroke="#bccfe3" strokeWidth="6" strokeLinecap="round" />
    {[['ਕ', 74, 112], ['ਖ', 120, 132], ['ਗ', 166, 104]].map(([letter, x, y]) => (
      <g key={letter}>
        <path d={`M${x} ${y - 30}c12 14 18 22 18 30a18 18 0 0 1-36 0c0-8 6-16 18-30z`} fill="var(--accent-2)" />
        <text x={x} y={y + 9} textAnchor="middle" fontSize="20" fill="#fff" style={T}>{letter}</text>
      </g>
    ))}
    <ellipse cx="120" cy="168" rx="80" ry="7" fill="var(--accent)" opacity=".35" />
    <path d="M40 170q5-16 10 0M60 170q5-12 10 0M170 170q5-16 10 0M190 170q5-12 10 0" stroke="var(--accent-3)" strokeWidth="4" fill="none" strokeLinecap="round" />
  </>
);

const Train = () => (
  <>
    <circle cx="186" cy="34" r="12" fill="#e3e7ee" opacity=".95" /><circle cx="168" cy="24" r="9" fill="#e3e7ee" opacity=".85" />
    <circle cx="200" cy="18" r="7" fill="#e3e7ee" opacity=".75" />
    <path d="M6 150h228" stroke="#4b3a2c" strokeWidth="5" />
    {Array.from({ length: 12 }).map((_, i) => <rect key={i} x={10 + i * 19} y="150" width="9" height="8" fill="#8b6a4a" />)}
    {[['1469', 10], ['1699', 70]].map(([year, x]) => (
      <g key={year}>
        <rect x={x} y="88" width="54" height="50" rx="8" fill="var(--accent-3)" />
        <rect x={x + 7} y="96" width="40" height="18" rx="4" fill="#fff8e1" />
        <text x={x + 27} y="110" textAnchor="middle" fontSize="13" fill="var(--ink)" style={T}>{year}</text>
        <circle cx={x + 14} cy="142" r="8" fill="#2b2b2b" /><circle cx={x + 40} cy="142" r="8" fill="#2b2b2b" />
      </g>
    ))}
    <rect x="130" y="76" width="44" height="62" rx="8" fill="var(--accent)" />
    <rect x="138" y="84" width="28" height="20" rx="4" fill="#fff8e1" />
    <rect x="170" y="98" width="52" height="40" rx="10" fill="var(--accent)" />
    <rect x="196" y="62" width="14" height="38" rx="3" fill="#2f2f2f" />
    <rect x="190" y="58" width="26" height="9" rx="3" fill="#2f2f2f" />
    <circle cx="222" cy="118" r="7" fill="var(--accent-2)" />
    <circle cx="150" cy="142" r="11" fill="#2b2b2b" /><circle cx="188" cy="142" r="11" fill="#2b2b2b" />
    <circle cx="150" cy="142" r="4" fill="var(--accent-2)" /><circle cx="188" cy="142" r="4" fill="var(--accent-2)" />
    <path d="M64 120h8M124 120h8" stroke="#2b2b2b" strokeWidth="4" />
  </>
);

const Diyas = () => (
  <>
    <rect x="10" y="4" width="220" height="168" rx="28" fill="#4a0d24" />
    <path d="M10 120h220v24a28 28 0 0 1-28 28H38a28 28 0 0 1-28-28z" fill="#2a0612" opacity=".55" />
    <circle cx="44" cy="36" r="13" fill="#fff3c4" opacity=".9" />
    {[[86, 26], [160, 22], [62, 78], [100, 56], [196, 40], [26, 98], [214, 84], [150, 60]].map(([x, y]) => (
      <circle key={`${x}${y}`} cx={x} cy={y} r="2.5" fill="#fff3dc" opacity=".8" />
    ))}
    {[[56, 126, 0.85], [120, 116, 1.15], [184, 126, 0.85]].map(([x, y, s]) => (
      <g key={x} transform={`translate(${x} ${y}) scale(${s})`}>
        <ellipse cx="0" cy="-34" rx="22" ry="30" fill="var(--accent)" opacity=".25" />
        <path d="M0-56c9 12 13 19 13 26a13 13 0 0 1-26 0c0-7 4-14 13-26z" fill="var(--accent)" />
        <path d="M0-44c4 6 6 10 6 14a6 6 0 0 1-12 0c0-4 2-8 6-14z" fill="#fff3c4" />
        <path d="M-38-8h76c-4 22-20 32-38 32s-34-10-38-32z" fill="#C8642E" />
        <path d="M-38-8h76" stroke="#E8955A" strokeWidth="5" strokeLinecap="round" />
        <path d="M38-8l14-6-6 12z" fill="#C8642E" />
      </g>
    ))}
    <text x="120" y="44" textAnchor="middle" fontSize="34" fill="#fff3dc" style={T}>?</text>
  </>
);

const FoldedMap = () => (
  <>
    <path d="M20 30l66-14 68 14 66-14v136l-66 14-68-14-66 14z" fill="#E9F5DF" />
    <path d="M86 16v136M154 30v136" stroke="#c4dcb7" strokeWidth="3" />
    <path d="M20 30l66-14v136l-66 14z" fill="#dcefcf" />
    {[0, 1, 2, 3, 4].map((i) => (
      <path key={i} d={`M${46 + i * 30} 22c-10 30 22 46 4 76s14 40 2 70`} stroke="var(--accent)" strokeWidth="4.5" fill="none" strokeLinecap="round" opacity={0.9 - i * 0.08} />
    ))}
    <g transform="translate(150 70)">
      <ellipse cx="0" cy="44" rx="12" ry="4" fill="#000" opacity=".2" />
      <path d="M0 44C-6 30-22 16-22 0a22 22 0 0 1 44 0C22 16 6 30 0 44z" fill="var(--accent-2)" />
      <circle cx="0" cy="0" r="9" fill="#fff" />
    </g>
    <g transform="translate(46 132)">
      <circle r="16" fill="#fff" stroke="var(--ink)" strokeWidth="2" />
      <path d="M0-12l5 12-5 12-5-12z" fill="var(--accent-2)" />
      <path d="M0 0l5 0-5 12-5-12z" fill="var(--ink)" opacity=".6" />
    </g>
  </>
);

const Jigsaw = () => (
  <>
    <rect x="22" y="14" width="196" height="152" rx="14" fill="#fff" stroke="var(--accent)" strokeWidth="5" />
    <rect x="22" y="120" width="196" height="46" rx="0" fill="#bcd8f0" />
    <path d="M22 120h196" stroke="#8fb7dd" strokeWidth="3" />
    <g fill="#f5d27a" stroke="var(--accent)" strokeWidth="2.5">
      <rect x="70" y="78" width="100" height="44" rx="4" />
      <path d="M92 78c0-26 56-26 56 0z" />
      <path d="M120 36v14" />
      <circle cx="120" cy="36" r="4" />
      <path d="M72 78c0-14 22-14 22 0zM146 78c0-14 22-14 22 0z" />
    </g>
    <path d="M100 122v-24a20 20 0 0 1 40 0v24" fill="#fffaf0" stroke="var(--accent)" strokeWidth="2.5" />
    <path d="M196 42v78" stroke="var(--accent-3)" strokeWidth="3" />
    <path d="M196 44l-20 8 20 8z" fill="var(--accent-3)" />
    <path d="M120 14v152M22 70h196" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="5 5" opacity=".6" />
    <g transform="translate(150 132) rotate(12)">
      <path d="M0 0h18a7 7 0 1 1 14 0h18v18a7 7 0 1 0 0 14v18H0V32a7 7 0 1 1 0-14z" fill="var(--accent-2)" stroke="#fff" strokeWidth="3" />
    </g>
  </>
);

const Kites = () => (
  <>
    <circle cx="200" cy="34" r="22" fill="#FFD23F" />
    <circle cx="200" cy="34" r="30" fill="#FFD23F" opacity=".3" />
    {[[78, 70, 'var(--accent)', 'var(--accent-2)', -12], [150, 58, 'var(--accent-3)', '#FFD23F', 14]].map(([x, y, a, b, r]) => (
      <g key={x} transform={`rotate(${r} ${x} ${y})`}>
        <path d={`M${x} ${y - 38}L${x + 30} ${y}L${x} ${y + 38}L${x - 30} ${y}z`} fill={a} />
        <path d={`M${x} ${y - 38}L${x + 30} ${y}L${x} ${y}z`} fill={b} />
        <path d={`M${x} ${y - 38}v76M${x - 30} ${y}h60`} stroke="#5b4a2a" strokeWidth="2" />
        <path d={`M${x} ${y + 38}q-8 14 4 24t-4 26`} stroke="#5b4a2a" strokeWidth="2" fill="none" />
        <path d={`M${x - 6} ${y + 56}l6 4 6-4-6-4z`} fill={b} />
      </g>
    ))}
    <path d="M70 108C60 140 40 160 10 178M156 96c10 40 30 60 70 82" stroke="#5b4a2a" strokeWidth="1.6" fill="none" strokeDasharray="4 3" />
  </>
);

const Thali = () => (
  <>
    <ellipse cx="120" cy="96" rx="104" ry="62" fill="#C7CED6" />
    <ellipse cx="120" cy="92" rx="96" ry="56" fill="#E6EBF0" />
    <ellipse cx="120" cy="92" rx="80" ry="44" fill="#F3F6F8" />
    <ellipse cx="94" cy="96" rx="40" ry="24" fill="#E9C38B" />
    {[[80, 90], [100, 102], [108, 88], [86, 104]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="3.5" fill="#B9844B" />)}
    <ellipse cx="158" cy="82" rx="26" ry="15" fill="#AEB7C1" />
    <ellipse cx="158" cy="80" rx="22" ry="12" fill="#F2B33D" />
    <circle cx="152" cy="78" r="2.5" fill="#d18a1c" /><circle cx="163" cy="82" r="2" fill="#d18a1c" />
    <g transform="translate(196 22)">
      <path d="M0 0h30l-4 52H4z" fill="#D9E7F2" stroke="#AEB7C1" strokeWidth="3" />
      <path d="M2 18h26l-3 32H5z" fill="#7FB8E6" opacity=".8" />
    </g>
    <path d="M150 116c20 0 40 4 50 10" stroke="#9AA4AE" strokeWidth="5" strokeLinecap="round" />
  </>
);

const ART = {
  akhar_sikho: Phulkari,
  shabad_le: Takhti,
  akhaan_jor: ProverbCards,
  akhar_barsat: Monsoon,
  itihaas_timeline: Train,
  kaun_hai: Diyas,
  map_quest: FoldedMap,
  gurdwara_jigsaw: Jigsaw,
  patang_baazi: Kites,
  langar_seva: Thali,
};

export default function GameArt({ gameKey, className }) {
  const Art = ART[gameKey];
  if (!Art) return null;
  return (
    <svg className={className} viewBox="0 0 240 180" role="img" aria-hidden="true" focusable="false">
      <Art />
    </svg>
  );
}
