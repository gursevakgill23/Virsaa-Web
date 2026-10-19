/**
 * pages/Learning/Arcade/arcadeText.js
 * -----------------------------------------------------------------------------
 * The words on the game screens, in English and Punjabi, and the
 * "how to play" steps of each game. The language is the site's own (gameLanguage).
 * -----------------------------------------------------------------------------
 */
import { getLanguage } from '../../../i18n/siteLanguage';

export const TEXT = {
  english: {
    hub: 'Khed Mela', allGames: 'All games', map: 'Map', play: 'Play', playAgain: 'Play again', next: 'Next stage',
    backToMap: 'Back to the map', stage: 'Stage', easy: 'Easy', medium: 'Medium', hard: 'Hard',
    locked: 'Locked', lockedHint: 'Win a star on the stage before to open this one.',
    best: 'Best', stars: 'stars', score: 'Score', coins: 'coins', xp: 'XP', level: 'Level',
    upTo: 'Up to', firstClear: 'first-time bonus', newBest: 'New best!', newBadge: 'New badge!',
    soundOn: 'Sound on', soundOff: 'Sound off', howToPlay: 'How to play', settings: 'Settings', sound: 'Sound',
    login: 'Login', coinShop: 'Coin shop', player: 'Virsaa Player',
    languageNote: 'The games use the language you pick with the globe button at the top of the site.',
    leaderboard: 'Leaderboard', badges: 'Badges', week: 'This week', month: 'This month', allTime: 'All time',
    you: 'You', noScores: 'No scores yet. Be the first on the board!', loading: 'Loading…',
    signInToSave: 'Sign in to save your stars, earn badges and join the leaderboard.', signIn: 'Sign in',
    guestNote: 'Playing as a guest: your stars are kept on this device.',
    offline: 'Playing offline: your result is kept on this device.',
    tooFast: 'That was too quick to count. Play the stage again.',
    results: ['Keep trying!', 'Good try!', 'Well done!', 'Shabash!'],
    resultsSub: ['Score 300 points for a star.', 'You earned a star.', 'Two stars!', 'Three stars! Amazing!'],
    starRule: 'Score 300 for ★, 600 for ★★ and 850 for ★★★.', earn: 'Earn badges', pause: 'Pause',
    resume: 'Keep playing', quit: 'Leave this stage', paused: 'Paused', time: 'Time', lives: 'Lives',
    round: 'Round', of: 'of', hint: 'Hint', correct: 'Correct!', tryAgain: 'Not quite, try again',
    profile: 'Your game profile', daily: 'Word of the day', starsWon: 'stars won',
    zone: { easy: 'Easy trail', medium: 'Medium trail', hard: 'Hard trail' },
    progressLabel: (n, max) => `${n} of ${max} stars`,
    stageLabel: (n) => `Stage ${n}`,
    couldNotLoad: 'This stage couldn’t be loaded. Check your connection and try again.',
    tryAgainButton: 'Try again', earned: 'Earned', progress: 'Progress',
  },
  punjabi: {
    hub: 'ਖੇਡ ਮੇਲਾ', allGames: 'ਸਾਰੀਆਂ ਖੇਡਾਂ', map: 'ਨਕਸ਼ਾ', play: 'ਖੇਡੋ', playAgain: 'ਫਿਰ ਖੇਡੋ', next: 'ਅਗਲਾ ਪੜਾਅ',
    backToMap: 'ਨਕਸ਼ੇ ਤੇ ਵਾਪਸ', stage: 'ਪੜਾਅ', easy: 'ਸੌਖਾ', medium: 'ਦਰਮਿਆਨਾ', hard: 'ਔਖਾ',
    locked: 'ਬੰਦ', lockedHint: 'ਇਸ ਨੂੰ ਖੋਲ੍ਹਣ ਲਈ ਪਿਛਲੇ ਪੜਾਅ ਵਿੱਚ ਇੱਕ ਤਾਰਾ ਜਿੱਤੋ।',
    best: 'ਸਭ ਤੋਂ ਵਧੀਆ', stars: 'ਤਾਰੇ', score: 'ਅੰਕ', coins: 'ਸਿੱਕੇ', xp: 'XP', level: 'ਪੱਧਰ',
    upTo: 'ਵੱਧ ਤੋਂ ਵੱਧ', firstClear: 'ਪਹਿਲੀ ਵਾਰ ਦਾ ਇਨਾਮ', newBest: 'ਨਵਾਂ ਰਿਕਾਰਡ!', newBadge: 'ਨਵਾਂ ਬੈਜ!',
    soundOn: 'ਆਵਾਜ਼ ਚਾਲੂ', soundOff: 'ਆਵਾਜ਼ ਬੰਦ', howToPlay: 'ਕਿਵੇਂ ਖੇਡਣਾ ਹੈ', settings: 'ਸੈਟਿੰਗਾਂ', sound: 'ਆਵਾਜ਼',
    login: 'ਲੌਗਇਨ', coinShop: 'ਸਿੱਕਿਆਂ ਦੀ ਦੁਕਾਨ', player: 'ਵਿਰਸਾ ਖਿਡਾਰੀ',
    languageNote: 'ਖੇਡਾਂ ਦੀ ਭਾਸ਼ਾ ਸਾਈਟ ਦੇ ਉੱਪਰ ਗਲੋਬ ਵਾਲੇ ਬਟਨ ਨਾਲ ਬਦਲੋ।',
    leaderboard: 'ਲੀਡਰਬੋਰਡ', badges: 'ਬੈਜ', week: 'ਇਹ ਹਫ਼ਤਾ', month: 'ਇਹ ਮਹੀਨਾ', allTime: 'ਹੁਣ ਤੱਕ',
    you: 'ਤੁਸੀਂ', noScores: 'ਅਜੇ ਕੋਈ ਅੰਕ ਨਹੀਂ। ਸਭ ਤੋਂ ਪਹਿਲਾਂ ਤੁਸੀਂ ਆਓ!', loading: 'ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ…',
    signInToSave: 'ਆਪਣੇ ਤਾਰੇ ਸੰਭਾਲਣ, ਬੈਜ ਜਿੱਤਣ ਤੇ ਲੀਡਰਬੋਰਡ ਤੇ ਆਉਣ ਲਈ ਲੌਗਇਨ ਕਰੋ।', signIn: 'ਲੌਗਇਨ',
    guestNote: 'ਤੁਸੀਂ ਮਹਿਮਾਨ ਵਜੋਂ ਖੇਡ ਰਹੇ ਹੋ: ਤਾਰੇ ਇਸੇ ਡਿਵਾਈਸ ਤੇ ਰਹਿਣਗੇ।',
    offline: 'ਇੰਟਰਨੈੱਟ ਤੋਂ ਬਿਨਾਂ ਖੇਡ ਰਹੇ ਹੋ: ਨਤੀਜਾ ਇਸੇ ਡਿਵਾਈਸ ਤੇ ਰਹੇਗਾ।',
    tooFast: 'ਇਹ ਗਿਣਨ ਲਈ ਬਹੁਤ ਤੇਜ਼ ਸੀ। ਪੜਾਅ ਫਿਰ ਖੇਡੋ।',
    results: ['ਕੋਸ਼ਿਸ਼ ਕਰਦੇ ਰਹੋ!', 'ਵਧੀਆ ਕੋਸ਼ਿਸ਼!', 'ਬਹੁਤ ਵਧੀਆ!', 'ਸ਼ਾਬਾਸ਼!'],
    resultsSub: ['ਤਾਰੇ ਲਈ 300 ਅੰਕ ਬਣਾਓ।', 'ਤੁਸੀਂ ਇੱਕ ਤਾਰਾ ਜਿੱਤਿਆ।', 'ਦੋ ਤਾਰੇ!', 'ਤਿੰਨ ਤਾਰੇ! ਕਮਾਲ!'],
    starRule: '★ ਲਈ 300, ★★ ਲਈ 600 ਅਤੇ ★★★ ਲਈ 850 ਅੰਕ।', earn: 'ਬੈਜ ਜਿੱਤੋ', pause: 'ਰੋਕੋ',
    resume: 'ਖੇਡਦੇ ਰਹੋ', quit: 'ਇਹ ਪੜਾਅ ਛੱਡੋ', paused: 'ਰੁਕੀ ਹੋਈ', time: 'ਸਮਾਂ', lives: 'ਜਾਨਾਂ',
    round: 'ਵਾਰੀ', of: 'ਵਿੱਚੋਂ', hint: 'ਇਸ਼ਾਰਾ', correct: 'ਸਹੀ!', tryAgain: 'ਥੋੜ੍ਹਾ ਫ਼ਰਕ ਹੈ, ਫਿਰ ਕੋਸ਼ਿਸ਼ ਕਰੋ',
    profile: 'ਤੁਹਾਡੀ ਖੇਡ ਪ੍ਰੋਫਾਈਲ', daily: 'ਅੱਜ ਦਾ ਸ਼ਬਦ', starsWon: 'ਤਾਰੇ ਜਿੱਤੇ',
    zone: { easy: 'ਸੌਖਾ ਰਾਹ', medium: 'ਦਰਮਿਆਨਾ ਰਾਹ', hard: 'ਔਖਾ ਰਾਹ' },
    progressLabel: (n, max) => `${max} ਵਿੱਚੋਂ ${n} ਤਾਰੇ`,
    stageLabel: (n) => `ਪੜਾਅ ${n}`,
    couldNotLoad: 'ਇਹ ਪੜਾਅ ਲੋਡ ਨਹੀਂ ਹੋ ਸਕਿਆ। ਇੰਟਰਨੈੱਟ ਦੇਖੋ ਤੇ ਫਿਰ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
    tryAgainButton: 'ਫਿਰ ਕੋਸ਼ਿਸ਼ ਕਰੋ', earned: 'ਜਿੱਤਿਆ', progress: 'ਤਰੱਕੀ',
  },
};

// The steps under "How to play", per game
export const HOW_TO_PLAY = {
  akhar_sikho: {
    english: ['Read the name of a letter, like ਊੜਾ (ūṛā).', 'Tap the letter it belongs to.',
      'Then trace the letter with your finger or mouse, staying on the shape.',
      'Right first time and neat tracing score the most.'],
    punjabi: ['ਅੱਖਰ ਦਾ ਨਾਂ ਪੜ੍ਹੋ, ਜਿਵੇਂ ਊੜਾ।', 'ਉਸ ਨਾਂ ਵਾਲੇ ਅੱਖਰ ਨੂੰ ਛੂਹੋ।', 'ਫਿਰ ਉਂਗਲ ਜਾਂ ਮਾਊਸ ਨਾਲ ਅੱਖਰ ਉੱਤੇ ਲਿਖੋ।',
      'ਪਹਿਲੀ ਵਾਰੀ ਸਹੀ ਤੇ ਸੋਹਣਾ ਲਿਖਣ ਤੇ ਸਭ ਤੋਂ ਵੱਧ ਅੰਕ ਮਿਲਦੇ ਹਨ।'],
  },
  shabad_le: {
    english: ['Guess the Punjabi word in six tries, using the keyboard.', 'A letter with its vowel sign is one tile.',
      'Green: right tile, right place. Orange: right letter, different vowel sign.',
      'Yellow: in the word, somewhere else. Grey: not in the word.', 'Stuck? A hint shows one tile.'],
    punjabi: ['ਛੇ ਵਾਰੀਆਂ ਵਿੱਚ ਸ਼ਬਦ ਬੁੱਝੋ।', 'ਅੱਖਰ ਅਤੇ ਉਸ ਦੀ ਲਗ ਇੱਕ ਖਾਨਾ ਹੈ।', 'ਹਰਾ: ਸਹੀ ਖਾਨਾ, ਸਹੀ ਥਾਂ। ਸੰਤਰੀ: ਅੱਖਰ ਸਹੀ, ਲਗ ਵੱਖਰੀ।',
      'ਪੀਲਾ: ਸ਼ਬਦ ਵਿੱਚ ਹੈ, ਹੋਰ ਥਾਂ। ਸਲੇਟੀ: ਸ਼ਬਦ ਵਿੱਚ ਨਹੀਂ।', 'ਫਸ ਗਏ? ਇਸ਼ਾਰਾ ਇੱਕ ਖਾਨਾ ਦਿਖਾਉਂਦਾ ਹੈ।'],
  },
  akhaan_jor: {
    english: ['Each card on the left starts a Punjabi proverb.', 'Tap a beginning, then tap its ending on the right.',
      'Matched pairs are tied together with a parandi ribbon.', 'Read what each proverb means at the end of the board.'],
    punjabi: ['ਖੱਬੇ ਪਾਸੇ ਅਖਾਣਾਂ ਦੇ ਸ਼ੁਰੂ ਹਨ।', 'ਇੱਕ ਸ਼ੁਰੂ ਛੂਹੋ, ਫਿਰ ਸੱਜੇ ਪਾਸੇ ਉਸ ਦਾ ਅੰਤ।', 'ਸਹੀ ਜੋੜੇ ਪਰਾਂਦੇ ਨਾਲ ਬੱਝ ਜਾਂਦੇ ਹਨ।',
      'ਅਖੀਰ ਵਿੱਚ ਹਰ ਅਖਾਣ ਦਾ ਅਰਥ ਪੜ੍ਹੋ।'],
  },
  akhar_barsat: {
    english: ['Letters and words fall from the monsoon clouds.', 'Type each one on the keyboard before it reaches the ground.',
      'A word is typed tile by tile: letter first, then its vowel sign.', 'Every drop that lands takes a life. Catch them all!'],
    punjabi: ['ਬੱਦਲਾਂ ਵਿੱਚੋਂ ਅੱਖਰ ਤੇ ਸ਼ਬਦ ਡਿੱਗਦੇ ਹਨ।', 'ਧਰਤੀ ਤੇ ਪਹੁੰਚਣ ਤੋਂ ਪਹਿਲਾਂ ਕੀਬੋਰਡ ਤੇ ਲਿਖੋ।', 'ਪਹਿਲਾਂ ਅੱਖਰ, ਫਿਰ ਉਸ ਦੀ ਲਗ।',
      'ਹਰ ਡਿੱਗੀ ਬੂੰਦ ਇੱਕ ਜਾਨ ਲੈਂਦੀ ਹੈ।'],
  },
  itihaas_timeline: {
    english: ['Each carriage carries an event from history.', 'Tap two carriages to swap them (or use the arrows) until they run from Oldest to Newest.',
      'Press Check to see the years.', 'Get them right first time for full points.'],
    punjabi: ['ਹਰ ਡੱਬੇ ਵਿੱਚ ਇਤਿਹਾਸ ਦੀ ਇੱਕ ਘਟਨਾ ਹੈ।', 'ਦੋ ਡੱਬਿਆਂ ਨੂੰ ਛੂਹ ਕੇ ਥਾਂ ਬਦਲੋ (ਜਾਂ ਤੀਰ ਵਰਤੋ), ਸਭ ਤੋਂ ਪੁਰਾਣੇ ਤੋਂ ਸਭ ਤੋਂ ਨਵੇਂ ਤੱਕ।', 'ਸਾਲ ਦੇਖਣ ਲਈ "ਜਾਂਚੋ" ਦਬਾਓ।',
      'ਪਹਿਲੀ ਵਾਰੀ ਸਹੀ ਤੇ ਪੂਰੇ ਅੰਕ।'],
  },
  kaun_hai: {
    english: ['Light a diya to see a clue about someone from Sikh and Punjabi history.', 'Guess who it is whenever you are ready.',
      'The fewer diyas you light, the more points you get.', 'A wrong guess costs points, so think first!'],
    punjabi: ['ਦੀਵਾ ਜਗਾਓ ਤੇ ਇੱਕ ਇਸ਼ਾਰਾ ਪੜ੍ਹੋ।', 'ਜਦੋਂ ਤਿਆਰ ਹੋਵੋ, ਦੱਸੋ ਕੌਣ ਹੈ।', 'ਜਿੰਨੇ ਘੱਟ ਦੀਵੇ, ਓਨੇ ਵੱਧ ਅੰਕ।',
      'ਗ਼ਲਤ ਜਵਾਬ ਤੇ ਅੰਕ ਘਟਦੇ ਹਨ, ਸੋਚ ਕੇ ਜਵਾਬ ਦਿਓ!'],
  },
  map_quest: {
    english: ['Read the name of a place.', 'Tap where you think it is on the map, then press Guess.',
      'The closer your pin, the more points.', 'Zoom and drag the map to look around.'],
    punjabi: ['ਥਾਂ ਦਾ ਨਾਂ ਪੜ੍ਹੋ।', 'ਨਕਸ਼ੇ ਤੇ ਉਸ ਥਾਂ ਨੂੰ ਛੂਹੋ, ਫਿਰ "ਅੰਦਾਜ਼ਾ" ਦਬਾਓ।', 'ਜਿੰਨਾ ਨੇੜੇ, ਓਨੇ ਵੱਧ ਅੰਕ।',
      'ਨਕਸ਼ੇ ਨੂੰ ਵੱਡਾ ਕਰੋ ਤੇ ਖਿੱਚੋ।'],
  },
  gurdwara_jigsaw: {
    english: ['Drag each piece to its place in the frame.', 'Pieces snap in when they are close.',
      'Finish quickly for three stars.', 'Then read the story of the Gurdwara.'],
    punjabi: ['ਹਰ ਟੁਕੜੇ ਨੂੰ ਖਿੱਚ ਕੇ ਉਸ ਦੀ ਥਾਂ ਤੇ ਰੱਖੋ।', 'ਨੇੜੇ ਆਉਣ ਤੇ ਟੁਕੜਾ ਆਪੇ ਜੁੜ ਜਾਂਦਾ ਹੈ।', 'ਤਿੰਨ ਤਾਰਿਆਂ ਲਈ ਛੇਤੀ ਪੂਰਾ ਕਰੋ।',
      'ਫਿਰ ਗੁਰਦੁਆਰਾ ਸਾਹਿਬ ਦਾ ਇਤਿਹਾਸ ਪੜ੍ਹੋ।'],
  },
  patang_baazi: {
    english: ['Move your finger or mouse across the sky to steer your kite (or use the arrow keys).',
      'Fly your kite across another kite’s string to cut it.', 'Keep other kites away from your own string!',
      'Catch the yellow stars for extra points.', 'We fly with cotton thread to keep birds safe.'],
    punjabi: ['ਉਂਗਲ ਜਾਂ ਮਾਊਸ ਨਾਲ ਪਤੰਗ ਚਲਾਓ (ਜਾਂ ਤੀਰ ਵਾਲੇ ਬਟਨ)।', 'ਦੂਜੇ ਪਤੰਗ ਦੀ ਡੋਰ ਉੱਤੋਂ ਲੰਘ ਕੇ ਉਸ ਨੂੰ ਕੱਟੋ।',
      'ਦੂਜੇ ਪਤੰਗਾਂ ਨੂੰ ਆਪਣੀ ਡੋਰ ਤੋਂ ਦੂਰ ਰੱਖੋ!', 'ਵੱਧ ਅੰਕਾਂ ਲਈ ਪੀਲੇ ਤਾਰੇ ਫੜੋ।', 'ਅਸੀਂ ਪੰਛੀਆਂ ਦੀ ਸੁਰੱਖਿਆ ਲਈ ਸੂਤੀ ਡੋਰ ਵਰਤਦੇ ਹਾਂ।'],
  },
  langar_seva: {
    english: ['Everyone sitting in the pangat shows what they would like.', 'Tap a station (rotis, dal, water…) to pick something up.',
      'Then tap the person who asked for it.', 'Rotis cook on the tawa first: tap the dough, wait for it to puff, then pick it up.',
      'Nobody loses here: serve everyone, faster for more stars.'],
    punjabi: ['ਪੰਗਤ ਵਿੱਚ ਬੈਠੀ ਸੰਗਤ ਦੱਸਦੀ ਹੈ ਕਿ ਉਨ੍ਹਾਂ ਨੂੰ ਕੀ ਚਾਹੀਦਾ ਹੈ।', 'ਪ੍ਰਸ਼ਾਦੇ, ਦਾਲ, ਪਾਣੀ ਵਿੱਚੋਂ ਕੁਝ ਚੁੱਕਣ ਲਈ ਛੂਹੋ।',
      'ਫਿਰ ਮੰਗਣ ਵਾਲੇ ਨੂੰ ਛੂਹੋ।', 'ਪ੍ਰਸ਼ਾਦਾ ਪਹਿਲਾਂ ਤਵੇ ਤੇ ਪੱਕਦਾ ਹੈ: ਪੇੜਾ ਛੂਹੋ, ਫੁੱਲਣ ਦਿਓ, ਫਿਰ ਚੁੱਕੋ।',
      'ਇੱਥੇ ਕੋਈ ਨਹੀਂ ਹਾਰਦਾ: ਸਭ ਨੂੰ ਲੰਗਰ ਛਕਾਓ, ਛੇਤੀ ਤੇ ਵੱਧ ਤਾਰੇ।'],
  },
};

// The games follow the language chosen with the globe button in the site's navbar
// (i18n/siteLanguage.js): Punjabi, or English for English and French.
export const gameLanguage = () => (getLanguage() === 'pa' ? 'punjabi' : 'english');
