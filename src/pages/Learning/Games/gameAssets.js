/**
 * pages/Learning/Games/gameAssets.js
 * -----------------------------------------------------------------------------
 * File locations for the two games (Shabd Khoj word search and Memory Match).
 * -----------------------------------------------------------------------------
 *
 * Sounds and the video live in the `public` folder. Files in `public` are not
 * imported; they're loaded by URL at runtime, so a path here is the file's
 * location with "public" removed. The map pictures are real photos from S3
 * (the same ones Memory Match uses), by name: see hooks/useSiteImages.js.
 *
 *   Map pictures: website pictures 'game-phulkari', 'game-bhangra', …
 *   Sounds:       public/sounds/found.mp3, level-up.mp3, complete.mp3, error.mp3
 *   Video:        public/videos/how-to-play.mp4
 *
 * A missing sound or video just doesn't play; nothing breaks.
 * (The Word Search words come from the server: /api/learning/items/games/word_search/words/)
 */
// Base folders inside `public` (PUBLIC_URL is set when the app is served from a sub-path)
const PUBLIC = process.env.PUBLIC_URL || '';
const SOUND_DIR = `${PUBLIC}/sounds`;
const VIDEO_DIR = `${PUBLIC}/videos`;

// Sound effects, by event
export const SOUND_URLS = {
  found: `${SOUND_DIR}/found.mp3`,
  levelUp: `${SOUND_DIR}/level-up.mp3`,
  complete: `${SOUND_DIR}/complete.mp3`,
  error: `${SOUND_DIR}/error.mp3`,
};

// Word Search map themes -> a website picture (S3)
const THEME_PICTURES = {
  traditional: 'game-phulkari',
  cultural: 'game-bhangra',
  gold: 'game-khanda',
  nature: 'game-basant',
  abstract: 'game-holi',
  jungle: 'game-giddha',
  mountain: 'game-kara',
  cosmic: 'game-diwali',
  mystic: 'game-ik-onkar',
  poetry: 'game-vaisakhi',
  snow: 'game-kangha',
  sand: 'game-lassi',
};

/**
 * Inline style for a map card or board background:
 *   const pictures = useSiteImages();  style={themeBackground('gold', pictures)}
 * Nothing (the card's own colours) until the picture is known.
 */
export const themeBackground = (theme, pictures = {}) => {
  const url = pictures[THEME_PICTURES[theme]]?.url;
  return url ? { backgroundImage: `url("${url.replace(/"/g, '%22')}")` } : undefined;
};

// The "How to play" video on the Shabd Khoj start screen
export const HOW_TO_PLAY_VIDEO = `${VIDEO_DIR}/how-to-play.mp4`;
