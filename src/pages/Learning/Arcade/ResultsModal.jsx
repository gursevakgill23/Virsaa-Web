/**
 * pages/Learning/Arcade/ResultsModal.jsx
 * -----------------------------------------------------------------------------
 * The card at the end of a stage: the stars landing one by one, the score,
 * the coins and XP earned, any new badges, and Play again / Next stage /
 * Map. Guests are told how to keep their stars. A game can add its own
 * section (Shabad-le's share button, a Gurdwara's story...) as children.
 * -----------------------------------------------------------------------------
 */
import React, { useEffect, useRef } from 'react';
import { FaCoins, FaRedo, FaStar, FaMap, FaArrowRight, FaBolt } from 'react-icons/fa';
import BadgeIcon from '../../../components/BadgeIcon/BadgeIcon';
import styles from './Arcade.module.css';
import { sfx } from './arcadeSound';
import confetti from './confetti';

/**
 * Props: result (from useArcade.submitStage), t, language, hasNext, signedIn,
 *        onReplay, onNext, onMap, onSignIn, children (extra content)
 */
export default function ResultsModal({ result, t, hasNext, signedIn, onReplay, onNext, onMap, onSignIn, children }) {
  const stars = result.stars || 0;
  const firstButton = useRef(null);

  // One orchestrated moment: the stars land one after another, then confetti for three
  useEffect(() => {
    const timers = [];
    for (let i = 0; i < stars; i += 1) timers.push(setTimeout(() => sfx.star(i), 350 + i * 320));
    timers.push(setTimeout(() => {
      if (stars === 3) { sfx.win(); confetti(); } else if (stars === 0) sfx.sad();
      if (result.coins) sfx.coin();
    }, 350 + stars * 320));
    firstButton.current?.focus();
    return () => timers.forEach(clearTimeout);
  }, [stars, result.coins]);

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="arcade-result-title">
      <div className={styles.resultsCard}>
        <div className={styles.resultStars} aria-label={t.progressLabel(stars, 3)}>
          {[0, 1, 2].map((i) => (
            <FaStar key={i} className={i < stars ? styles.resultStarOn : styles.resultStarOff}
              style={{ animationDelay: `${0.35 + i * 0.32}s` }} />
          ))}
        </div>
        <h2 id="arcade-result-title" className={styles.resultTitle}>{t.results[stars]}</h2>
        <p className={styles.resultSub}>{result.tooFast ? t.tooFast : t.resultsSub[stars]}</p>

        <div className={styles.resultScore}>
          <span className={styles.resultScoreNumber}>{result.score}</span>
          <span className={styles.resultScoreLabel}>{t.score}{result.isNewBest && <b className={styles.newBest}>{t.newBest}</b>}</span>
        </div>

        <div className={styles.rewardRow}>
          <span className={styles.rewardPill}><FaCoins aria-hidden="true" /> +{result.coins || 0} {t.coins}</span>
          <span className={styles.rewardPill}><FaBolt aria-hidden="true" /> +{result.xp || 0} {t.xp}</span>
        </div>
        {result.firstClearCoins > 0 && <p className={styles.resultNote}>+{result.firstClearCoins} {t.coins}: {t.firstClear}</p>}

        {result.newBadges?.length > 0 && (
          <div className={styles.newBadges}>
            <p className={styles.newBadgesTitle}>{t.newBadge}</p>
            <ul>
              {result.newBadges.map((badge) => (
                <li key={badge.key}>
                  <span className={styles.badgeMedal}><BadgeIcon name={badge.icon} image={badge.image} /></span>
                  <span><b>{badge.name}</b><small>{badge.description}</small></span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {children}

        {(!signedIn || result.saveFailed) && (
          <div className={styles.guestBox}>
            <p>{result.saveFailed ? t.offline : t.signInToSave}</p>
            {!signedIn && <button type="button" className={styles.btnGhost} onClick={onSignIn}>{t.signIn}</button>}
          </div>
        )}

        <div className={styles.resultActions}>
          {hasNext && stars > 0 ? (
            <button ref={firstButton} type="button" className={styles.btn} onClick={onNext}>
              {t.next} <FaArrowRight aria-hidden="true" />
            </button>
          ) : null}
          <button ref={hasNext && stars > 0 ? undefined : firstButton} type="button"
            className={hasNext && stars > 0 ? styles.btnSecondary : styles.btn} onClick={onReplay}
          >
            <FaRedo aria-hidden="true" /> {t.playAgain}
          </button>
          <button type="button" className={styles.btnGhost} onClick={onMap}><FaMap aria-hidden="true" /> {t.map}</button>
        </div>
      </div>
    </div>
  );
}
