/**
 * pages/Learning/Games/gameAssets.js
 * -----------------------------------------------------------------------------
 * File locations for the two games (Shabd Khoj word search and Memory Match).
 * -----------------------------------------------------------------------------
 *
 * Where the game sounds and map pictures live in the `public` folder.
 * Files in `public` are not imported; they're loaded by URL at runtime,
 * so a path here is the file's location with "public" removed.
 *
 *   Map pictures: public/images/games/*.jpg (the same pictures Memory Match uses)
 *   Sounds:       public/sounds/found.mp3, level-up.mp3, complete.mp3, error.mp3
 *   Video:        public/videos/how-to-play.mp4
 *
 * A missing sound or video just doesn't play; nothing breaks.
 * (The Word Search words come from the server: /api/learning/items/games/word_search/words/)
 */
// Base folders inside `public` (PUBLIC_URL is set when the app is served from a sub-path)
const PUBLIC = process.env.PUBLIC_URL || '';
const GAME_IMAGES = `${PUBLIC}/images/games`;
const SOUND_DIR = `${PUBLIC}/sounds`;
const VIDEO_DIR = `${PUBLIC}/videos`;

// Sound effects, by event
export const SOUND_URLS = {
  found: `${SOUND_DIR}/found.mp3`,
  levelUp: `${SOUND_DIR}/level-up.mp3`,
  complete: `${SOUND_DIR}/complete.mp3`,
  error: `${SOUND_DIR}/error.mp3`,
};

// Word Search map themes -> a picture in public/images/games
const THEME_FILES = {
  traditional: 'phulkari.jpg',
  cultural: 'bhangra.jpg',
  gold: 'khanda.jpg',
  nature: 'basant.jpg',
  abstract: 'holi.jpg',
  jungle: 'giddha.jpg',
  mountain: 'kara.jpg',
  cosmic: 'diwali.jpg',
  mystic: 'ik-onkar.jpg',
  poetry: 'vaisakhi.jpg',
  snow: 'kangha.jpg',
  sand: 'lassi.jpg',
};

/** Inline style for a map card or board background, e.g. style={themeBackground('gold')} */
export const themeBackground = (theme) =>
  THEME_FILES[theme] ? { backgroundImage: `url("${GAME_IMAGES}/${THEME_FILES[theme]}")` } : undefined;

// The "How to play" video on the Shabd Khoj start screen
export const HOW_TO_PLAY_VIDEO = `${VIDEO_DIR}/how-to-play.mp4`;
