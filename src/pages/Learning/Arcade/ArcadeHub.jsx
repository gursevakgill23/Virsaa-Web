/**
 * pages/Learning/Arcade/ArcadeHub.jsx
 * -----------------------------------------------------------------------------
 * /learning/games: the Khed Mela, every Virsaa game on one page, grouped by
 * what it teaches, with the player's stars on each map game.
 * -----------------------------------------------------------------------------
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaStar } from 'react-icons/fa';
import { useAuth } from '../../../context/AuthContext';
import { SitePicture } from '../../../components/SitePicture/SitePicture';
import learningApi from '../../../api/learningApi';
import GameArt from './GameArt';
import styles from './Arcade.module.css';
import { TEXT, gameLanguage } from './arcadeText';
import { GAMES, readGuestProgress } from './localGames';

const SECTIONS = [
  { title: 'Letters and words', title_pa: 'ਅੱਖਰ ਤੇ ਸ਼ਬਦ', games: ['akhar_sikho', 'shabad_le', 'akhar_barsat', 'akhaan_jor', 'word_search'] },
  { title: 'History and places', title_pa: 'ਇਤਿਹਾਸ ਤੇ ਥਾਵਾਂ', games: ['itihaas_timeline', 'kaun_hai', 'gurdwara_jigsaw', 'map_quest'] },
  { title: 'Play and seva', title_pa: 'ਖੇਡ ਤੇ ਸੇਵਾ', games: ['patang_baazi', 'langar_seva', 'memory_match'] },
];

// The two older games have their own pages
const OTHER_GAMES = {
  word_search: {
    title: 'Shabad Khoj', title_pa: 'ਸ਼ਬਦ ਖੋਜ', link: '/learning/games/shabd-khoj', picture: 'learn-alphabet',
    tagline: 'Find hidden Punjabi and English words on themed maps.', tagline_pa: 'ਨਕਸ਼ਿਆਂ ਵਿੱਚ ਲੁਕੇ ਸ਼ਬਦ ਲੱਭੋ।',
  },
  memory_match: {
    title: 'Virsaa Vich Yaad', title_pa: 'ਵਿਰਸਾ ਵਿੱਚ ਯਾਦ', link: '/learning/games/memory-match', picture: 'game-lohri',
    tagline: 'Match Punjabi festivals and Sikh symbols from memory.', tagline_pa: 'ਤਿਉਹਾਰਾਂ ਤੇ ਚਿੰਨ੍ਹਾਂ ਦੇ ਜੋੜੇ ਲੱਭੋ।',
  },
};

export default function ArcadeHub({ apiString }) {
  const { isLoggedIn, accessToken, API_STRING } = useAuth();
  const api = apiString || API_STRING;
  // The site's language (globe button in the site navbar); changing it reloads the page
  const [language] = useState(gameLanguage);
  const t = TEXT[language];
  const [stars, setStars] = useState(() => {
    const guest = readGuestProgress();
    return Object.fromEntries(Object.keys(GAMES).map((key) => [key, Object.entries(guest[key] || {})
      .filter(([n]) => Number(n) > 0).reduce((sum, [, p]) => sum + (p.stars || 0), 0)]));
  });

  useEffect(() => {
    document.title = 'Khed Mela: Virsaa games';
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !accessToken) return undefined;
    let live = true;
    learningApi.arcadeGames(api, accessToken)
      .then((data) => {
        if (live) setStars(Object.fromEntries((data.games || []).map((g) => [g.key, g.my_stars || 0])));
      })
      .catch(() => {});
    return () => { live = false; };
  }, [api, accessToken, isLoggedIn]);

  const total = Object.values(stars).reduce((a, b) => a + b, 0);
  const max = Object.keys(GAMES).length * 27;
  return (
    <div className={`${styles.hub} notranslate`} translate="no">
      <div className={styles.hubTop}>
        <Link to="/learning" className={styles.crumbButton}>
          <FaArrowLeft aria-hidden="true" /> {language === 'punjabi' ? 'ਸਿੱਖਿਆ' : 'Learning'}
        </Link>
      </div>
      <section className={styles.hubBanner}>
        <div className={styles.bunting} aria-hidden="true">
          {Array.from({ length: 18 }).map((_, i) => <span key={i} />)}
        </div>
        <h1 className={styles.hubTitle}>
          <span>{language === 'punjabi' ? 'ਖੇਡ ਮੇਲਾ' : 'Khed Mela'}</span>
          <small>{language === 'punjabi' ? 'Khed Mela' : 'ਖੇਡ ਮੇਲਾ'}</small>
        </h1>
        <p className={styles.hubLead}>
          {language === 'punjabi'
            ? 'ਪੰਜਾਬੀ, ਗੁਰਮੁਖੀ ਤੇ ਸਿੱਖ ਇਤਿਹਾਸ ਦੀਆਂ ਖੇਡਾਂ। ਹਰ ਖੇਡ ਵਿੱਚ 9 ਪੜਾਅ: ਸੌਖੇ, ਦਰਮਿਆਨੇ ਤੇ ਔਖੇ।'
            : 'Games about Punjabi, Gurmukhi and Sikh history. Every map game has 9 stages: easy, medium and hard.'}
        </p>
        <p className={styles.hubStars}><FaStar aria-hidden="true" /> {t.progressLabel(total, max)}</p>
      </section>

      {SECTIONS.map((section) => (
        <section key={section.title} className={styles.hubSection}>
          <h2 className={styles.hubSectionTitle}>{language === 'punjabi' ? section.title_pa : section.title}</h2>
          <div className={styles.hubGrid}>
            {section.games.map((key) => {
              const other = OTHER_GAMES[key];
              if (other) {
                return (
                  <Link key={key} to={other.link} className={`${styles.hubCard} ${styles.hubCardPhoto}`}>
                    <SitePicture name={other.picture} className={styles.hubPhoto} alt="" />
                    <span className={styles.hubCardText}>
                      <b>{language === 'punjabi' ? other.title_pa : other.title}</b>
                      <small lang="pa">{language === 'punjabi' ? other.title : other.title_pa}</small>
                      <span>{language === 'punjabi' ? other.tagline_pa : other.tagline}</span>
                    </span>
                  </Link>
                );
              }
              const game = GAMES[key];
              const mine = stars[key] || 0;
              return (
                <Link key={key} to={`/learning/games/${game.slug}`} className={`${styles.hubCard} ${styles[`theme_${key}`] || ''}`}>
                  <GameArt gameKey={key} className={styles.hubArt} />
                  <span className={styles.hubCardText}>
                    <b>{language === 'punjabi' ? game.title_pa : game.title}</b>
                    <small lang="pa">{language === 'punjabi' ? game.title : game.title_pa}</small>
                    <span>{language === 'punjabi' ? game.tagline_pa : game.tagline}</span>
                  </span>
                  <span className={styles.hubCardStars} aria-label={t.progressLabel(mine, 27)}>
                    <FaStar aria-hidden="true" /> {mine}/27
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
