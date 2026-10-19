/**
 * pages/Learning/Arcade/ArcadeRoute.jsx
 * -----------------------------------------------------------------------------
 * /learning/games/:slug  ->  that map game inside the shared shell.
 * Each game's code is loaded only when it is opened (React.lazy), so the
 * other games (and the map library) aren't downloaded with it.
 * -----------------------------------------------------------------------------
 */
import React, { lazy } from 'react';
import { Link, useParams } from 'react-router-dom';
import ArcadeShell from './ArcadeShell';
import { gameBySlug } from './localGames';
import styles from './Arcade.module.css';

const GAME_COMPONENTS = {
  akhar_sikho: lazy(() => import('./games/AkharSikho')),
  shabad_le: lazy(() => import('./games/ShabadLe')),
  akhaan_jor: lazy(() => import('./games/AkhaanJor')),
  akhar_barsat: lazy(() => import('./games/AkharBarsat')),
  itihaas_timeline: lazy(() => import('./games/ItihaasTimeline')),
  kaun_hai: lazy(() => import('./games/KaunHai')),
  map_quest: lazy(() => import('./games/MapQuest')),
  gurdwara_jigsaw: lazy(() => import('./games/GurdwaraJigsaw')),
  patang_baazi: lazy(() => import('./games/PatangBaazi')),
  langar_seva: lazy(() => import('./games/LangarSeva')),
};

export default function ArcadeRoute({ apiString, isDarkMode }) {
  const { slug } = useParams();
  const game = gameBySlug(slug);
  const Game = game && GAME_COMPONENTS[game.key];
  if (!Game) {
    return (
      <div className={`${styles.missing} notranslate`} translate="no">
        <h1>This game isn’t here</h1>
        <p>It may have moved. All the games are in the Khed Mela.</p>
        <Link className={styles.btn} to="/learning/games">Open the Khed Mela</Link>
      </div>
    );
  }
  return <ArcadeShell key={game.key} gameKey={game.key} Game={Game} apiString={apiString} isDarkMode={isDarkMode} />;
}
