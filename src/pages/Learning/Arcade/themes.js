/**
 * pages/Learning/Arcade/themes.js
 * -----------------------------------------------------------------------------
 * Each map game's icon and the way the trail between its stages is drawn on
 * the map. The colours themselves (each game's accents, taken from the thing
 * it is about: phulkari, a wooden takhti, a courtyard, monsoon rain, a history
 * train, diyas at night, the five rivers, marble and gold, Basant kites and
 * the langar hall) are in Arcade.module.css, under .theme_<game key>; the
 * page and, in dark mode, the cards use the site's own colours.
 * -----------------------------------------------------------------------------
 */
import {
  FaCloudRain, FaHandsHelping, FaHistory, FaMapMarkedAlt, FaPenNib, FaPuzzlePiece, FaQuoteLeft, FaSpellCheck,
  FaUserSecret,
} from 'react-icons/fa';
import { GiKite } from 'react-icons/gi';

export const THEMES = {
  akhar_sikho: { icon: FaPenNib, path: 'thread' },
  shabad_le: { icon: FaSpellCheck, path: 'chalk' },
  akhaan_jor: { icon: FaQuoteLeft, path: 'ribbon' },
  akhar_barsat: { icon: FaCloudRain, path: 'stones' },
  itihaas_timeline: { icon: FaHistory, path: 'rail' },
  kaun_hai: { icon: FaUserSecret, path: 'lights' },
  map_quest: { icon: FaMapMarkedAlt, path: 'river' },
  gurdwara_jigsaw: { icon: FaPuzzlePiece, path: 'marble' },
  patang_baazi: { icon: GiKite, path: 'string' },
  langar_seva: { icon: FaHandsHelping, path: 'durrie' },
};
