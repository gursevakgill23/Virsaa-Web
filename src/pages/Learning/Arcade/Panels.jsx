/**
 * pages/Learning/Arcade/Panels.jsx
 * -----------------------------------------------------------------------------
 * The side panel next to a game's map, with three tabs:
 *   How to play   the game's steps and how stars are won
 *   Badges        this game's badges, with the player's progress
 *   Leaderboard   who has the most stars this week, this month or ever
 * -----------------------------------------------------------------------------
 */
import React, { useEffect, useState } from 'react';
import { FaCheck, FaCrown, FaMedal, FaStar, FaTrophy } from 'react-icons/fa';
import Avatar from '../../../components/Avatar/Avatar';
import BadgeIcon from '../../../components/BadgeIcon/BadgeIcon';
import styles from './Arcade.module.css';
import { HOW_TO_PLAY } from './arcadeText';

const HowTo = ({ gameKey, t, language }) => (
  <div className={styles.panelBody}>
    <ol className={styles.howList}>
      {(HOW_TO_PLAY[gameKey]?.[language] || []).map((step) => <li key={step}>{step}</li>)}
    </ol>
    <p className={styles.starRule}><FaStar aria-hidden="true" /> {t.starRule}</p>
  </div>
);

const Badges = ({ load, t, signedIn, onSignIn }) => {
  const [rows, setRows] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    load().then((data) => { if (live) setRows(data || []); }).catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [load]);
  if (failed) return <p className={styles.panelEmpty}>{t.couldNotLoad}</p>;
  if (!rows) return <p className={styles.panelEmpty}>{t.loading}</p>;
  return (
    <div className={styles.panelBody}>
      {!signedIn && (
        <div className={styles.guestBox}>
          <p>{t.signInToSave}</p>
          <button type="button" className={styles.btnGhost} onClick={onSignIn}>{t.signIn}</button>
        </div>
      )}
      <ul className={styles.badgeList}>
        {rows.map((b) => (
          <li key={b.key} className={b.earned ? styles.badgeEarned : ''}>
            <span className={styles.badgeMedal}><BadgeIcon name={b.icon} image={b.image} /></span>
            <span className={styles.badgeText}>
              <b>{b.name}</b>
              <small>{b.description}</small>
              {!b.earned && signedIn && (
                <span className={styles.badgeBar} role="progressbar" aria-valuenow={b.progress || 0} aria-valuemin={0} aria-valuemax={100}>
                  <span style={{ width: `${b.progress || 0}%` }} />
                </span>
              )}
            </span>
            {b.earned ? <FaCheck className={styles.badgeTick} aria-label={t.earned} /> : (
              <span className={styles.badgeReward}>+{b.coin_reward}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

const PERIODS = ['week', 'month', 'all'];
const RANK_ICONS = [FaCrown, FaTrophy, FaMedal];

const Leaderboard = ({ load, t }) => {
  const [period, setPeriod] = useState('week');
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    setData(null);
    setFailed(false);
    load(period).then((d) => { if (live) setData(d); }).catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [load, period]);
  return (
    <div className={styles.panelBody}>
      <div className={styles.periodTabs} role="tablist">
        {PERIODS.map((p) => (
          <button key={p} type="button" role="tab" aria-selected={period === p}
            className={period === p ? styles.periodOn : ''} onClick={() => setPeriod(p)}
          >
            {p === 'week' ? t.week : p === 'month' ? t.month : t.allTime}
          </button>
        ))}
      </div>
      {failed && <p className={styles.panelEmpty}>{t.couldNotLoad}</p>}
      {!failed && !data && <p className={styles.panelEmpty}>{t.loading}</p>}
      {data && !data.results?.length && <p className={styles.panelEmpty}>{t.noScores}</p>}
      {data?.results?.length > 0 && (
        <ol className={styles.board}>
          {data.results.map((row) => {
            const Icon = RANK_ICONS[row.rank - 1];
            return (
              <li key={row.user_id}>
                <span className={styles.boardRank}>{Icon ? <Icon aria-label={`#${row.rank}`} /> : row.rank}</span>
                <Avatar src={row.avatar} name={row.name} className={styles.boardAvatar} />
                <span className={styles.boardName}>{row.name}</span>
                <span className={styles.boardStars}><FaStar aria-hidden="true" /> {row.stars}</span>
                <span className={styles.boardScore}>{row.score}</span>
              </li>
            );
          })}
        </ol>
      )}
      {data?.me && !data.results?.some((r) => r.rank === data.me.rank) && (
        <p className={styles.boardMe}>{t.you}: #{data.me.rank}, {data.me.stars} {t.stars}</p>
      )}
    </div>
  );
};

export default function Panels({ gameKey, t, language, signedIn, onSignIn, loadBadges, loadLeaderboard }) {
  const [tab, setTab] = useState('how');
  const tabs = [['how', t.howToPlay], ['badges', t.badges], ['board', t.leaderboard]];
  return (
    <aside className={styles.panel}>
      <div className={styles.panelTabs} role="tablist">
        {tabs.map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id}
            className={tab === id ? styles.panelTabOn : ''} onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'how' && <HowTo gameKey={gameKey} t={t} language={language} />}
      {tab === 'badges' && <Badges load={loadBadges} t={t} signedIn={signedIn} onSignIn={onSignIn} />}
      {tab === 'board' && <Leaderboard load={loadLeaderboard} t={t} />}
    </aside>
  );
}
