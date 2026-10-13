/**
 * pages/Learning/Games/GameProfileCard.jsx
 * -----------------------------------------------------------------------------
 * The "Game Profile" card shared by Shabd Khoj and Memory Match: player
 * picture and name (editable), level, coins, XP bar, game stats, Buy coins
 * and Log out. All data and actions come in as props from the game.
 * -----------------------------------------------------------------------------
 */
import React, { forwardRef } from 'react';
import { FaCoins, FaEdit, FaSignOutAlt, FaShoppingCart, FaCamera, FaTimes } from 'react-icons/fa';
import styles from './GameProfileCard.module.css';

// Text in English and Punjabi
const T = {
  english: {
    title: 'Game Profile', close: 'Close', level: 'Level', xp: 'XP', toNext: 'to next level',
    edit: 'Edit profile', changePhoto: 'Change photo', name: 'Player name', namePlaceholder: 'Your player name',
    save: 'Save', saving: 'Saving…', cancel: 'Cancel', stats: 'Game stats', loading: 'Loading stats…',
    played: 'Games played', wins: 'Wins', losses: 'Losses', earned: 'Coins earned', spent: 'Coins spent',
    buy: 'Buy coins', logout: 'Log out',
  },
  punjabi: {
    title: 'ਖੇਡ ਪ੍ਰੋਫਾਈਲ', close: 'ਬੰਦ ਕਰੋ', level: 'ਪੱਧਰ', xp: 'XP', toNext: 'ਅਗਲੇ ਪੱਧਰ ਤੱਕ',
    edit: 'ਪ੍ਰੋਫਾਈਲ ਸੋਧੋ', changePhoto: 'ਫੋਟੋ ਬਦਲੋ', name: 'ਖਿਡਾਰੀ ਦਾ ਨਾਮ', namePlaceholder: 'ਤੁਹਾਡਾ ਨਾਮ',
    save: 'ਸੰਭਾਲੋ', saving: 'ਸੰਭਾਲ ਰਹੇ ਹਾਂ…', cancel: 'ਰੱਦ ਕਰੋ', stats: 'ਖੇਡ ਦੇ ਅੰਕੜੇ', loading: 'ਅੰਕੜੇ ਲੋਡ ਹੋ ਰਹੇ ਹਨ…',
    played: 'ਖੇਡੇ ਗਏ', wins: 'ਜਿੱਤਾਂ', losses: 'ਹਾਰਾਂ', earned: 'ਕਮਾਏ ਸਿੱਕੇ', spent: 'ਖਰਚੇ ਸਿੱਕੇ',
    buy: 'ਸਿੱਕੇ ਖਰੀਦੋ', logout: 'ਲੌਗਆਉਟ',
  },
};

/**
 * The "Game Profile" card that opens from the player's picture.
 * Shared by Word Search and Memory Match so both look and behave the same.
 */
const GameProfileCard = forwardRef(({
  language = 'english',
  name,
  avatar,
  coins = 0,
  level = 1,
  xpIntoLevel = 0,
  xpPerLevel = 500,
  stats,              // { played, wins, losses, earned, spent } or null while loading
  editing,
  saving,
  newName,
  newAvatar,
  onNameChange,
  onAvatarChange,
  onStartEdit,
  onSave,
  onCancelEdit,
  onBuyCoins,
  onLogout,
  onClose,
  idPrefix = 'game',
}, ref) => {
  // Text for the chosen language, XP progress and the stats rows
  const t = T[language] || T.english;
  const progress = Math.min(100, Math.round((xpIntoLevel / (xpPerLevel || 500)) * 100));
  const rows = stats ? [
    [t.played, stats.played],
    [t.wins, stats.wins],
    [t.losses, stats.losses],
    [t.earned, stats.earned, true],
    [t.spent, stats.spent, true],
  ] : [];

  return (
    <div className={styles.card} ref={ref} role="dialog" aria-label={t.title}>
      <div className={styles.header}>
        <h3 className={styles.title}>{t.title}</h3>
        <button type="button" className={styles.iconButton} onClick={onClose} aria-label={t.close}>
          <FaTimes aria-hidden="true" />
        </button>
      </div>

      {/* Editing: change picture and name */}
      {editing ? (
        <div className={styles.identity}>
          <div className={styles.avatarWrap}>
            <img src={newAvatar} alt="" className={styles.avatar} />
            <label htmlFor={`${idPrefix}-avatar-upload`} className={styles.cameraButton} title={t.changePhoto}>
              <FaCamera aria-hidden="true" />
              <span className={styles.srOnly}>{t.changePhoto}</span>
            </label>
            <input id={`${idPrefix}-avatar-upload`} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={onAvatarChange} className={styles.fileInput} />
          </div>
          <label htmlFor={`${idPrefix}-player-name`} className={styles.fieldLabel}>{t.name}</label>
          <input
            id={`${idPrefix}-player-name`}
            type="text"
            value={newName}
            maxLength={60}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder={t.namePlaceholder}
            className={styles.input}
          />
          <div className={styles.rowButtons}>
            <button type="button" className={styles.primaryButton} onClick={onSave} disabled={saving}>
              {saving ? t.saving : t.save}
            </button>
            <button type="button" className={styles.secondaryButton} onClick={onCancelEdit}>{t.cancel}</button>
          </div>
        </div>
      ) : (
        <div className={styles.identity}>
          <div className={styles.avatarWrap}>
            <img src={avatar} alt="" className={styles.avatar} />
          </div>
          <p className={styles.name}>{name}</p>
          <div className={styles.chips}>
            <span className={styles.levelChip}>{t.level} {level}</span>
            <span className={styles.coinChip}><FaCoins aria-hidden="true" /> {Number(coins).toLocaleString()}</span>
          </div>
          <div className={styles.xp} aria-label={`${xpIntoLevel} / ${xpPerLevel} ${t.xp}`}>
            <div className={styles.xpTrack}><div className={styles.xpFill} style={{ width: `${progress}%` }} /></div>
            <span className={styles.xpText}>{xpIntoLevel} / {xpPerLevel} {t.xp} {t.toNext}</span>
          </div>
          <button type="button" className={styles.ghostButton} onClick={onStartEdit}>
            <FaEdit aria-hidden="true" /> {t.edit}
          </button>
        </div>
      )}

      {/* Game stats */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>{t.stats}</h4>
        {stats ? (
          <dl className={styles.stats}>
            {rows.map(([label, value, coin]) => (
              <div key={label} className={styles.statRow}>
                <dt>{label}</dt>
                <dd>{Number(value || 0).toLocaleString()} {coin && <FaCoins aria-hidden="true" className={styles.coinIcon} />}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className={styles.muted}>{t.loading}</p>
        )}
      </div>

      {/* Buy coins / Log out */}
      <div className={styles.actions}>
        <button type="button" className={styles.primaryButton} onClick={onBuyCoins}>
          <FaShoppingCart aria-hidden="true" /> {t.buy}
        </button>
        <button type="button" className={styles.dangerButton} onClick={onLogout}>
          <FaSignOutAlt aria-hidden="true" /> {t.logout}
        </button>
      </div>
    </div>
  );
});

GameProfileCard.displayName = 'GameProfileCard';

export default GameProfileCard;
