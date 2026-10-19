/**
 * pages/Learning/Arcade/arcadeData.js
 * -----------------------------------------------------------------------------
 * A copy of the server's game list and built-in content (learning_api/games.py
 * and learning_api/game_data/ in the backend). The games use the server's
 * version; this copy is only used when the server can't be reached, so the
 * games still work offline. Made by a script: change the backend's files and
 * copy them over again rather than editing this one by hand.
 * -----------------------------------------------------------------------------
 */
/* eslint-disable quotes, quote-props */

export const MAX_SCORE = 1000;

export const STAR_SCORES = [300, 600, 850];

export const REWARDS = {
 "easy": {
  "coins_per_star": 10,
  "xp_per_star": 20,
  "replay_coins_per_star": 1,
  "replay_xp": 5,
  "first_clear_coins": 10,
  "first_clear_xp": 20
 },
 "medium": {
  "coins_per_star": 15,
  "xp_per_star": 30,
  "replay_coins_per_star": 2,
  "replay_xp": 8,
  "first_clear_coins": 20,
  "first_clear_xp": 40
 },
 "hard": {
  "coins_per_star": 25,
  "xp_per_star": 50,
  "replay_coins_per_star": 3,
  "replay_xp": 12,
  "first_clear_coins": 30,
  "first_clear_xp": 60
 }
};

export const MAP_REGIONS = {"punjab": [[29.5, 73.8], [32.6, 77.0]], "greater": [[29.2, 71.6], [34.3, 77.6]], "india": [[16.5, 68.5], [35.5, 90.0]]};

export const GAMES = {
 "akhar_sikho": {
  "key": "akhar_sikho",
  "slug": "akhar-sikho",
  "title": "Akhar Sikho",
  "title_pa": "ਅੱਖਰ ਸਿੱਖੋ",
  "tagline": "Find each Gurmukhi letter from its name, then trace it with your finger.",
  "tagline_pa": "ਨਾਂ ਪੜ੍ਹ ਕੇ ਅੱਖਰ ਲੱਭੋ, ਫਿਰ ਉਂਗਲ ਨਾਲ ਲਿਖੋ।",
  "category": "Gurmukhi",
  "stage_count": 9,
  "max_stars": 27,
  "has_daily": false,
  "min_seconds": 8,
  "stages": [
   {
    "stage": 1,
    "difficulty": "easy",
    "name": "Ura, Aira, Iri",
    "name_pa": "ੳ ਅ ੲ ਸ ਹ",
    "settings": {
     "groups": [
      "mool"
     ],
     "options": 3,
     "trace": "guided"
    }
   },
   {
    "stage": 2,
    "difficulty": "easy",
    "name": "The Kakka row",
    "name_pa": "ਕ ਖ ਗ ਘ ਙ",
    "settings": {
     "groups": [
      "ka"
     ],
     "options": 3,
     "trace": "guided"
    }
   },
   {
    "stage": 3,
    "difficulty": "easy",
    "name": "The Chachcha row",
    "name_pa": "ਚ ਛ ਜ ਝ ਞ",
    "settings": {
     "groups": [
      "cha"
     ],
     "options": 3,
     "trace": "guided"
    }
   },
   {
    "stage": 4,
    "difficulty": "medium",
    "name": "The Tainka row",
    "name_pa": "ਟ ਠ ਡ ਢ ਣ",
    "settings": {
     "groups": [
      "tta"
     ],
     "options": 4,
     "trace": "outline"
    }
   },
   {
    "stage": 5,
    "difficulty": "medium",
    "name": "The Tatta row",
    "name_pa": "ਤ ਥ ਦ ਧ ਨ",
    "settings": {
     "groups": [
      "ta"
     ],
     "options": 4,
     "trace": "outline"
    }
   },
   {
    "stage": 6,
    "difficulty": "medium",
    "name": "The Pappa row",
    "name_pa": "ਪ ਫ ਬ ਭ ਮ",
    "settings": {
     "groups": [
      "pa"
     ],
     "options": 4,
     "trace": "outline"
    }
   },
   {
    "stage": 7,
    "difficulty": "hard",
    "name": "The last row",
    "name_pa": "ਯ ਰ ਲ ਵ ੜ",
    "settings": {
     "groups": [
      "ya"
     ],
     "options": 6,
     "trace": "faint",
     "lookalikes": true
    }
   },
   {
    "stage": 8,
    "difficulty": "hard",
    "name": "Vowel signs",
    "name_pa": "ਲਗਾਂ ਮਾਤਰਾਂ",
    "settings": {
     "groups": [
      "matra"
     ],
     "options": 6,
     "trace": "faint",
     "count": 8
    }
   },
   {
    "stage": 9,
    "difficulty": "hard",
    "name": "Dots and look-alikes",
    "name_pa": "ਪੈਰ ਬਿੰਦੀ",
    "settings": {
     "groups": [
      "nukta",
      "mool",
      "ka",
      "cha",
      "tta",
      "ta",
      "pa",
      "ya"
     ],
     "options": 6,
     "trace": "faint",
     "lookalikes": true,
     "count": 8,
     "first": [
      "nukta"
     ]
    }
   }
  ]
 },
 "shabad_le": {
  "key": "shabad_le",
  "slug": "shabad-le",
  "title": "Shabad-le",
  "title_pa": "ਸ਼ਬਦ-ਲੇ",
  "tagline": "Guess the Punjabi word in six tries. A new word of the day for everyone, every day.",
  "tagline_pa": "ਛੇ ਵਾਰੀਆਂ ਵਿੱਚ ਪੰਜਾਬੀ ਸ਼ਬਦ ਬੁੱਝੋ। ਹਰ ਰੋਜ਼ ਨਵਾਂ ਸ਼ਬਦ।",
  "category": "Gurmukhi",
  "stage_count": 9,
  "max_stars": 27,
  "has_daily": true,
  "min_seconds": 0,
  "stages": [
   {
    "stage": 1,
    "difficulty": "easy",
    "name": "Food and animals",
    "name_pa": "ਖਾਣਾ ਤੇ ਜਾਨਵਰ",
    "settings": {
     "tiles": 3,
     "topics": [
      "Food",
      "Animal"
     ],
     "hint": "always"
    }
   },
   {
    "stage": 2,
    "difficulty": "easy",
    "name": "Nature and weather",
    "name_pa": "ਕੁਦਰਤ",
    "settings": {
     "tiles": 3,
     "topics": [
      "Nature",
      "Weather",
      "Sky",
      "Village"
     ],
     "hint": "always"
    }
   },
   {
    "stage": 3,
    "difficulty": "easy",
    "name": "Sikhi and festivals",
    "name_pa": "ਸਿੱਖੀ ਤੇ ਤਿਉਹਾਰ",
    "settings": {
     "tiles": 3,
     "topics": [
      "Sikhi",
      "Festival",
      "Culture",
      "Music"
     ],
     "hint": "always"
    }
   },
   {
    "stage": 4,
    "difficulty": "medium",
    "name": "Around the home",
    "name_pa": "ਘਰ ਦੇ ਆਲੇ-ਦੁਆਲੇ",
    "settings": {
     "tiles": 4,
     "topics": [
      "Food",
      "Animal",
      "Home",
      "People",
      "Play"
     ],
     "hint": "after:2"
    }
   },
   {
    "stage": 5,
    "difficulty": "medium",
    "name": "Places of Punjab",
    "name_pa": "ਪੰਜਾਬ ਦੀਆਂ ਥਾਵਾਂ",
    "settings": {
     "tiles": 4,
     "topics": [
      "Place"
     ],
     "hint": "after:2"
    }
   },
   {
    "stage": 6,
    "difficulty": "medium",
    "name": "Words of Sikhi",
    "name_pa": "ਸਿੱਖੀ ਦੇ ਸ਼ਬਦ",
    "settings": {
     "tiles": 4,
     "topics": [
      "Sikhi"
     ],
     "hint": "after:3"
    }
   },
   {
    "stage": 7,
    "difficulty": "hard",
    "name": "Long words",
    "name_pa": "ਲੰਮੇ ਸ਼ਬਦ",
    "settings": {
     "tiles": 5,
     "hint": "after:3"
    }
   },
   {
    "stage": 8,
    "difficulty": "hard",
    "name": "Longer still",
    "name_pa": "ਹੋਰ ਲੰਮੇ",
    "settings": {
     "tiles": 5,
     "hint": "after:4"
    }
   },
   {
    "stage": 9,
    "difficulty": "hard",
    "name": "No clues",
    "name_pa": "ਬਿਨਾਂ ਇਸ਼ਾਰੇ",
    "settings": {
     "tiles": 5,
     "hint": "never"
    }
   }
  ]
 },
 "akhaan_jor": {
  "key": "akhaan_jor",
  "slug": "akhaan-jor",
  "title": "Akhaan Jor",
  "title_pa": "ਅਖਾਣ ਜੋੜ",
  "tagline": "Join the two halves of each Punjabi proverb, then find out what it means.",
  "tagline_pa": "ਅਖਾਣਾਂ ਦੇ ਦੋਵੇਂ ਹਿੱਸੇ ਜੋੜੋ ਤੇ ਉਨ੍ਹਾਂ ਦਾ ਅਰਥ ਜਾਣੋ।",
  "category": "Punjabi",
  "stage_count": 9,
  "max_stars": 27,
  "has_daily": false,
  "min_seconds": 6,
  "stages": [
   {
    "stage": 1,
    "difficulty": "easy",
    "name": "Grandma’s sayings",
    "name_pa": "ਦਾਦੀ ਦੀਆਂ ਗੱਲਾਂ",
    "settings": {
     "pairs": 3,
     "boards": 2,
     "pools": [
      "easy"
     ]
    }
   },
   {
    "stage": 2,
    "difficulty": "easy",
    "name": "In the courtyard",
    "name_pa": "ਵਿਹੜੇ ਵਿੱਚ",
    "settings": {
     "pairs": 4,
     "boards": 2,
     "pools": [
      "easy"
     ]
    }
   },
   {
    "stage": 3,
    "difficulty": "easy",
    "name": "Under the peepal tree",
    "name_pa": "ਪਿੱਪਲ ਹੇਠਾਂ",
    "settings": {
     "pairs": 4,
     "boards": 3,
     "pools": [
      "easy"
     ]
    }
   },
   {
    "stage": 4,
    "difficulty": "medium",
    "name": "At the well",
    "name_pa": "ਖੂਹ ਤੇ",
    "settings": {
     "pairs": 4,
     "boards": 2,
     "pools": [
      "easy",
      "medium"
     ]
    }
   },
   {
    "stage": 5,
    "difficulty": "medium",
    "name": "Village chaupal",
    "name_pa": "ਪਿੰਡ ਦੀ ਸੱਥ",
    "settings": {
     "pairs": 5,
     "boards": 2,
     "pools": [
      "medium"
     ]
    }
   },
   {
    "stage": 6,
    "difficulty": "medium",
    "name": "Mela day",
    "name_pa": "ਮੇਲੇ ਦਾ ਦਿਨ",
    "settings": {
     "pairs": 5,
     "boards": 3,
     "pools": [
      "medium"
     ]
    }
   },
   {
    "stage": 7,
    "difficulty": "hard",
    "name": "Wise elders",
    "name_pa": "ਸਿਆਣੇ ਬਜ਼ੁਰਗ",
    "settings": {
     "pairs": 5,
     "boards": 2,
     "pools": [
      "medium",
      "hard"
     ],
     "timer": 120
    }
   },
   {
    "stage": 8,
    "difficulty": "hard",
    "name": "Proverb pro",
    "name_pa": "ਅਖਾਣਾਂ ਦਾ ਮਾਹਰ",
    "settings": {
     "pairs": 6,
     "boards": 2,
     "pools": [
      "hard"
     ],
     "timer": 120
    }
   },
   {
    "stage": 9,
    "difficulty": "hard",
    "name": "Master of akhaan",
    "name_pa": "ਅਖਾਣਾਂ ਦਾ ਉਸਤਾਦ",
    "settings": {
     "pairs": 6,
     "boards": 3,
     "pools": [
      "hard",
      "medium"
     ],
     "timer": 100
    }
   }
  ]
 },
 "akhar_barsat": {
  "key": "akhar_barsat",
  "slug": "akhar-barsat",
  "title": "Akhar Barsat",
  "title_pa": "ਅੱਖਰ ਬਰਸਾਤ",
  "tagline": "Letters and words fall like monsoon rain. Type them before they land!",
  "tagline_pa": "ਅੱਖਰ ਮੀਂਹ ਵਾਂਗ ਡਿੱਗਦੇ ਹਨ। ਧਰਤੀ ਤੇ ਪਹੁੰਚਣ ਤੋਂ ਪਹਿਲਾਂ ਲਿਖੋ!",
  "category": "Gurmukhi",
  "stage_count": 9,
  "max_stars": 27,
  "has_daily": false,
  "min_seconds": 15,
  "stages": [
   {
    "stage": 1,
    "difficulty": "easy",
    "name": "First drops",
    "name_pa": "ਪਹਿਲੀਆਂ ਬੂੰਦਾਂ",
    "settings": {
     "source": "letters",
     "groups": [
      "mool",
      "ka"
     ],
     "drops": 12,
     "fall_seconds": 10,
     "spawn_seconds": 2.6,
     "lives": 5,
     "keyboard": "small"
    }
   },
   {
    "stage": 2,
    "difficulty": "easy",
    "name": "Light shower",
    "name_pa": "ਹਲਕੀ ਫੁਹਾਰ",
    "settings": {
     "source": "letters",
     "groups": [
      "cha",
      "tta"
     ],
     "drops": 14,
     "fall_seconds": 9.5,
     "spawn_seconds": 2.4,
     "lives": 5,
     "keyboard": "small"
    }
   },
   {
    "stage": 3,
    "difficulty": "easy",
    "name": "Rain on the roof",
    "name_pa": "ਛੱਤ ਤੇ ਮੀਂਹ",
    "settings": {
     "source": "letters",
     "groups": [
      "ta",
      "pa",
      "ya"
     ],
     "drops": 16,
     "fall_seconds": 9,
     "spawn_seconds": 2.2,
     "lives": 5,
     "keyboard": "small"
    }
   },
   {
    "stage": 4,
    "difficulty": "medium",
    "name": "Monsoon clouds",
    "name_pa": "ਸਾਉਣ ਦੇ ਬੱਦਲ",
    "settings": {
     "source": "letters",
     "groups": [
      "mool",
      "ka",
      "cha",
      "tta",
      "ta",
      "pa",
      "ya"
     ],
     "drops": 18,
     "fall_seconds": 8.5,
     "spawn_seconds": 2.0,
     "lives": 5,
     "keyboard": "full"
    }
   },
   {
    "stage": 5,
    "difficulty": "medium",
    "name": "Kanna, sihari, bihari",
    "name_pa": "ਕੰਨਾ, ਸਿਹਾਰੀ, ਬਿਹਾਰੀ",
    "settings": {
     "source": "syllables",
     "matras": [
      "ਾ",
      "ਿ",
      "ੀ"
     ],
     "drops": 16,
     "fall_seconds": 9.5,
     "spawn_seconds": 2.6,
     "lives": 5,
     "keyboard": "full"
    }
   },
   {
    "stage": 6,
    "difficulty": "medium",
    "name": "All the vowel signs",
    "name_pa": "ਸਾਰੀਆਂ ਲਗਾਂ",
    "settings": {
     "source": "syllables",
     "matras": [
      "ਾ",
      "ਿ",
      "ੀ",
      "ੁ",
      "ੂ",
      "ੇ",
      "ੈ",
      "ੋ",
      "ੌ"
     ],
     "drops": 18,
     "fall_seconds": 9,
     "spawn_seconds": 2.4,
     "lives": 5,
     "keyboard": "full"
    }
   },
   {
    "stage": 7,
    "difficulty": "hard",
    "name": "Word drizzle",
    "name_pa": "ਸ਼ਬਦਾਂ ਦੀ ਕਿਣਮਿਣ",
    "settings": {
     "source": "words",
     "pools": [
      "medium"
     ],
     "drops": 14,
     "fall_seconds": 11,
     "spawn_seconds": 3.2,
     "lives": 4,
     "keyboard": "full"
    }
   },
   {
    "stage": 8,
    "difficulty": "hard",
    "name": "Word storm",
    "name_pa": "ਸ਼ਬਦਾਂ ਦਾ ਤੂਫ਼ਾਨ",
    "settings": {
     "source": "words",
     "pools": [
      "medium",
      "hard"
     ],
     "drops": 15,
     "fall_seconds": 10.5,
     "spawn_seconds": 3.0,
     "lives": 4,
     "keyboard": "full"
    }
   },
   {
    "stage": 9,
    "difficulty": "hard",
    "name": "Cloudburst",
    "name_pa": "ਬੱਦਲ ਫਟਿਆ",
    "settings": {
     "source": "words",
     "pools": [
      "hard"
     ],
     "drops": 16,
     "fall_seconds": 10,
     "spawn_seconds": 2.8,
     "lives": 3,
     "keyboard": "full"
    }
   }
  ]
 },
 "itihaas_timeline": {
  "key": "itihaas_timeline",
  "slug": "itihaas-timeline",
  "title": "Itihaas Timeline",
  "title_pa": "ਇਤਿਹਾਸ ਟਾਈਮਲਾਈਨ",
  "tagline": "Load the history train: put each event from Sikh history in the right order.",
  "tagline_pa": "ਇਤਿਹਾਸ ਦੀ ਰੇਲ ਗੱਡੀ ਭਰੋ: ਘਟਨਾਵਾਂ ਨੂੰ ਸਹੀ ਤਰਤੀਬ ਵਿੱਚ ਲਗਾਓ।",
  "category": "Sikh History",
  "stage_count": 9,
  "max_stars": 27,
  "has_daily": false,
  "min_seconds": 6,
  "stages": [
   {
    "stage": 1,
    "difficulty": "easy",
    "name": "All aboard",
    "name_pa": "ਸਵਾਰ ਹੋ ਜਾਓ",
    "settings": {
     "pools": [
      "easy"
     ],
     "per_round": 3,
     "rounds": 3,
     "min_gap": 30
    }
   },
   {
    "stage": 2,
    "difficulty": "easy",
    "name": "Five hundred years",
    "name_pa": "ਪੰਜ ਸੌ ਸਾਲ",
    "settings": {
     "pools": [
      "easy"
     ],
     "per_round": 3,
     "rounds": 4,
     "min_gap": 20
    }
   },
   {
    "stage": 3,
    "difficulty": "easy",
    "name": "Four in a row",
    "name_pa": "ਚਾਰ ਇੱਕ ਲਾਈਨ ਵਿੱਚ",
    "settings": {
     "pools": [
      "easy"
     ],
     "per_round": 4,
     "rounds": 3,
     "min_gap": 15
    }
   },
   {
    "stage": 4,
    "difficulty": "medium",
    "name": "The time of the Gurus",
    "name_pa": "ਗੁਰੂ ਕਾਲ",
    "settings": {
     "pools": [
      "easy",
      "medium"
     ],
     "eras": [
      "gurus"
     ],
     "per_round": 4,
     "rounds": 3,
     "min_gap": 4
    }
   },
   {
    "stage": 5,
    "difficulty": "medium",
    "name": "Misls and Maharaja",
    "name_pa": "ਮਿਸਲਾਂ ਤੇ ਮਹਾਰਾਜਾ",
    "settings": {
     "pools": [
      "easy",
      "medium",
      "hard"
     ],
     "eras": [
      "empire"
     ],
     "per_round": 4,
     "rounds": 3,
     "min_gap": 2
    }
   },
   {
    "stage": 6,
    "difficulty": "medium",
    "name": "Modern Punjab",
    "name_pa": "ਅੱਜ ਦਾ ਪੰਜਾਬ",
    "settings": {
     "pools": [
      "easy",
      "medium",
      "hard"
     ],
     "eras": [
      "modern"
     ],
     "per_round": 4,
     "rounds": 3,
     "min_gap": 2
    }
   },
   {
    "stage": 7,
    "difficulty": "hard",
    "name": "Birthdays of the Gurus",
    "name_pa": "ਗੁਰੂ ਸਾਹਿਬਾਨ ਦੇ ਜਨਮ",
    "settings": {
     "pools": [
      "easy",
      "medium",
      "hard"
     ],
     "tags": [
      "birth"
     ],
     "per_round": 5,
     "rounds": 2,
     "min_gap": 1
    }
   },
   {
    "stage": 8,
    "difficulty": "hard",
    "name": "Gurus to Maharaja",
    "name_pa": "ਗੁਰੂ ਕਾਲ ਤੋਂ ਮਹਾਰਾਜਾ ਤੱਕ",
    "settings": {
     "pools": [
      "medium",
      "hard"
     ],
     "eras": [
      "gurus",
      "empire"
     ],
     "per_round": 5,
     "rounds": 3,
     "min_gap": 1
    }
   },
   {
    "stage": 9,
    "difficulty": "hard",
    "name": "The whole journey",
    "name_pa": "ਸਾਰਾ ਸਫ਼ਰ",
    "settings": {
     "pools": [
      "easy",
      "medium",
      "hard"
     ],
     "per_round": 6,
     "rounds": 3,
     "min_gap": 1
    }
   }
  ]
 },
 "kaun_hai": {
  "key": "kaun_hai",
  "slug": "kaun-hai",
  "title": "Kaun Hai?",
  "title_pa": "ਕੌਣ ਹੈ?",
  "tagline": "Light the diyas one by one. Each one shows a clue: who is it? Fewer clues, more points.",
  "tagline_pa": "ਦੀਵੇ ਜਗਾਓ, ਹਰ ਦੀਵਾ ਇੱਕ ਇਸ਼ਾਰਾ ਦਿੰਦਾ ਹੈ। ਦੱਸੋ ਕੌਣ ਹੈ?",
  "category": "Sikh History",
  "stage_count": 9,
  "max_stars": 27,
  "has_daily": false,
  "min_seconds": 6,
  "stages": [
   {
    "stage": 1,
    "difficulty": "easy",
    "name": "The Gurus",
    "name_pa": "ਗੁਰੂ ਸਾਹਿਬਾਨ",
    "settings": {
     "pools": [
      "easy"
     ],
     "kinds": [
      "guru"
     ],
     "rounds": 4,
     "options": 3
    }
   },
   {
    "stage": 2,
    "difficulty": "easy",
    "name": "Heroes of Sikhi",
    "name_pa": "ਸਿੱਖੀ ਦੇ ਨਾਇਕ",
    "settings": {
     "pools": [
      "easy"
     ],
     "rounds": 4,
     "options": 3,
     "avoid": [
      "guru"
     ]
    }
   },
   {
    "stage": 3,
    "difficulty": "easy",
    "name": "Guess them all",
    "name_pa": "ਸਾਰਿਆਂ ਨੂੰ ਬੁੱਝੋ",
    "settings": {
     "pools": [
      "easy"
     ],
     "rounds": 5,
     "options": 4
    }
   },
   {
    "stage": 4,
    "difficulty": "medium",
    "name": "Close to the Gurus",
    "name_pa": "ਗੁਰੂ ਦੇ ਪਿਆਰੇ",
    "settings": {
     "pools": [
      "medium"
     ],
     "rounds": 4,
     "options": 3
    }
   },
   {
    "stage": 5,
    "difficulty": "medium",
    "name": "Brave hearts",
    "name_pa": "ਬਹਾਦਰ ਦਿਲ",
    "settings": {
     "pools": [
      "easy",
      "medium"
     ],
     "rounds": 5,
     "options": 4
    }
   },
   {
    "stage": 6,
    "difficulty": "medium",
    "name": "Who did that?",
    "name_pa": "ਇਹ ਕਿਸ ਨੇ ਕੀਤਾ?",
    "settings": {
     "pools": [
      "medium"
     ],
     "rounds": 5,
     "options": 4
    }
   },
   {
    "stage": 7,
    "difficulty": "hard",
    "name": "Poets and rulers",
    "name_pa": "ਕਵੀ ਤੇ ਰਾਜੇ",
    "settings": {
     "pools": [
      "hard"
     ],
     "rounds": 4,
     "options": 4
    }
   },
   {
    "stage": 8,
    "difficulty": "hard",
    "name": "History detective",
    "name_pa": "ਇਤਿਹਾਸ ਦਾ ਜਾਸੂਸ",
    "settings": {
     "pools": [
      "medium",
      "hard"
     ],
     "rounds": 5,
     "options": 4
    }
   },
   {
    "stage": 9,
    "difficulty": "hard",
    "name": "Grand quiz",
    "name_pa": "ਵੱਡਾ ਮੁਕਾਬਲਾ",
    "settings": {
     "pools": [
      "easy",
      "medium",
      "hard"
     ],
     "rounds": 6,
     "options": 5
    }
   }
  ]
 },
 "map_quest": {
  "key": "map_quest",
  "slug": "map-quest",
  "title": "Punjab Map Quest",
  "title_pa": "ਪੰਜਾਬ ਨਕਸ਼ਾ ਖੋਜ",
  "tagline": "Where is it? Tap the map. The closer you get, the more points you score.",
  "tagline_pa": "ਇਹ ਥਾਂ ਕਿੱਥੇ ਹੈ? ਨਕਸ਼ੇ ਤੇ ਛੂਹੋ। ਜਿੰਨਾ ਨੇੜੇ, ਓਨੇ ਵੱਧ ਅੰਕ।",
  "category": "Punjab",
  "stage_count": 9,
  "max_stars": 27,
  "has_daily": false,
  "min_seconds": 8,
  "stages": [
   {
    "stage": 1,
    "difficulty": "easy",
    "name": "Big cities",
    "name_pa": "ਵੱਡੇ ਸ਼ਹਿਰ",
    "settings": {
     "groups": [
      "cities"
     ],
     "rounds": 5,
     "region": "punjab",
     "scale_km": 120
    }
   },
   {
    "stage": 2,
    "difficulty": "easy",
    "name": "More cities",
    "name_pa": "ਹੋਰ ਸ਼ਹਿਰ",
    "settings": {
     "groups": [
      "towns"
     ],
     "rounds": 6,
     "region": "punjab",
     "scale_km": 110
    }
   },
   {
    "stage": 3,
    "difficulty": "easy",
    "name": "Across Punjab",
    "name_pa": "ਸਾਰਾ ਪੰਜਾਬ",
    "settings": {
     "groups": [
      "cities",
      "towns"
     ],
     "rounds": 6,
     "region": "punjab",
     "scale_km": 90
    }
   },
   {
    "stage": 4,
    "difficulty": "medium",
    "name": "Towns of the Gurus",
    "name_pa": "ਗੁਰੂ ਸਾਹਿਬਾਨ ਦੇ ਨਗਰ",
    "settings": {
     "groups": [
      "gurus"
     ],
     "rounds": 6,
     "region": "punjab",
     "scale_km": 70
    }
   },
   {
    "stage": 5,
    "difficulty": "medium",
    "name": "Places of courage",
    "name_pa": "ਬਹਾਦਰੀ ਦੀਆਂ ਥਾਵਾਂ",
    "settings": {
     "groups": [
      "courage"
     ],
     "rounds": 6,
     "region": "punjab",
     "scale_km": 70
    }
   },
   {
    "stage": 6,
    "difficulty": "medium",
    "name": "The five Takhts",
    "name_pa": "ਪੰਜ ਤਖ਼ਤ",
    "settings": {
     "groups": [
      "takhts"
     ],
     "rounds": 5,
     "region": "india",
     "scale_km": 320
    }
   },
   {
    "stage": 7,
    "difficulty": "hard",
    "name": "Across the border",
    "name_pa": "ਸਰਹੱਦ ਤੋਂ ਪਾਰ",
    "settings": {
     "groups": [
      "pakistan"
     ],
     "rounds": 5,
     "region": "greater",
     "scale_km": 90
    }
   },
   {
    "stage": 8,
    "difficulty": "hard",
    "name": "Gurdwaras of India",
    "name_pa": "ਭਾਰਤ ਦੇ ਗੁਰਦੁਆਰੇ",
    "settings": {
     "groups": [
      "india"
     ],
     "rounds": 5,
     "region": "india",
     "scale_km": 260
    }
   },
   {
    "stage": 9,
    "difficulty": "hard",
    "name": "Grand tour",
    "name_pa": "ਵੱਡੀ ਯਾਤਰਾ",
    "settings": {
     "groups": [
      "cities",
      "towns",
      "gurus",
      "courage",
      "pakistan"
     ],
     "rounds": 8,
     "region": "greater",
     "scale_km": 55
    }
   }
  ]
 },
 "gurdwara_jigsaw": {
  "key": "gurdwara_jigsaw",
  "slug": "gurdwara-jigsaw",
  "title": "Gurdwara Jigsaw",
  "title_pa": "ਗੁਰਦੁਆਰਾ ਜਿਗਸਾ",
  "tagline": "Put together photos of historic Gurdwaras and learn the story of each one.",
  "tagline_pa": "ਇਤਿਹਾਸਕ ਗੁਰਦੁਆਰਿਆਂ ਦੀਆਂ ਤਸਵੀਰਾਂ ਜੋੜੋ ਤੇ ਉਨ੍ਹਾਂ ਦੀ ਕਹਾਣੀ ਪੜ੍ਹੋ।",
  "category": "Sikh History",
  "stage_count": 9,
  "max_stars": 27,
  "has_daily": false,
  "min_seconds": 8,
  "stages": [
   {
    "stage": 1,
    "difficulty": "easy",
    "name": "Sri Harmandir Sahib",
    "name_pa": "ਸ੍ਰੀ ਹਰਿਮੰਦਰ ਸਾਹਿਬ",
    "settings": {
     "grid": 3,
     "ghost": "clear",
     "target_seconds": 75
    }
   },
   {
    "stage": 2,
    "difficulty": "easy",
    "name": "Bangla Sahib",
    "name_pa": "ਬੰਗਲਾ ਸਾਹਿਬ",
    "settings": {
     "grid": 3,
     "ghost": "clear",
     "target_seconds": 75
    }
   },
   {
    "stage": 3,
    "difficulty": "easy",
    "name": "Keshgarh Sahib",
    "name_pa": "ਕੇਸਗੜ੍ਹ ਸਾਹਿਬ",
    "settings": {
     "grid": 3,
     "ghost": "faint",
     "target_seconds": 75
    }
   },
   {
    "stage": 4,
    "difficulty": "medium",
    "name": "Akal Takht Sahib",
    "name_pa": "ਅਕਾਲ ਤਖ਼ਤ ਸਾਹਿਬ",
    "settings": {
     "grid": 4,
     "ghost": "faint",
     "target_seconds": 150
    }
   },
   {
    "stage": 5,
    "difficulty": "medium",
    "name": "Fatehgarh Sahib",
    "name_pa": "ਫ਼ਤਿਹਗੜ੍ਹ ਸਾਹਿਬ",
    "settings": {
     "grid": 4,
     "ghost": "faint",
     "target_seconds": 150
    }
   },
   {
    "stage": 6,
    "difficulty": "medium",
    "name": "Damdama Sahib",
    "name_pa": "ਦਮਦਮਾ ਸਾਹਿਬ",
    "settings": {
     "grid": 4,
     "ghost": "none",
     "target_seconds": 160
    }
   },
   {
    "stage": 7,
    "difficulty": "hard",
    "name": "Patna Sahib",
    "name_pa": "ਪਟਨਾ ਸਾਹਿਬ",
    "settings": {
     "grid": 5,
     "ghost": "none",
     "target_seconds": 260
    }
   },
   {
    "stage": 8,
    "difficulty": "hard",
    "name": "Hazur Sahib",
    "name_pa": "ਹਜ਼ੂਰ ਸਾਹਿਬ",
    "settings": {
     "grid": 5,
     "ghost": "none",
     "target_seconds": 260
    }
   },
   {
    "stage": 9,
    "difficulty": "hard",
    "name": "Nankana Sahib",
    "name_pa": "ਨਨਕਾਣਾ ਸਾਹਿਬ",
    "settings": {
     "grid": 6,
     "ghost": "none",
     "target_seconds": 380
    }
   }
  ]
 },
 "patang_baazi": {
  "key": "patang_baazi",
  "slug": "patang-baazi",
  "title": "Patang Baazi",
  "title_pa": "ਪਤੰਗਬਾਜ਼ੀ",
  "tagline": "Basant is here! Fly your kite, cross the other kites’ strings to cut them, and keep yours safe.",
  "tagline_pa": "ਬਸੰਤ ਆਈ! ਆਪਣਾ ਪਤੰਗ ਉਡਾਓ, ਦੂਜਿਆਂ ਦੀਆਂ ਡੋਰਾਂ ਕੱਟੋ ਤੇ ਆਪਣੀ ਬਚਾਓ।",
  "category": "Punjab",
  "stage_count": 9,
  "max_stars": 27,
  "has_daily": false,
  "min_seconds": 20,
  "stages": [
   {
    "stage": 1,
    "difficulty": "easy",
    "name": "Morning breeze",
    "name_pa": "ਸਵੇਰ ਦੀ ਹਵਾ",
    "settings": {
     "duration": 60,
     "rivals": 2,
     "speed": 0.6,
     "attack": 0.0,
     "wind": 0.2,
     "target": 4,
     "lives": 3,
     "sky": "morning"
    }
   },
   {
    "stage": 2,
    "difficulty": "easy",
    "name": "Rooftop friends",
    "name_pa": "ਛੱਤਾਂ ਦੇ ਯਾਰ",
    "settings": {
     "duration": 70,
     "rivals": 3,
     "speed": 0.7,
     "attack": 0.1,
     "wind": 0.25,
     "target": 6,
     "lives": 3,
     "sky": "morning"
    }
   },
   {
    "stage": 3,
    "difficulty": "easy",
    "name": "Yellow skies",
    "name_pa": "ਪੀਲਾ ਅਸਮਾਨ",
    "settings": {
     "duration": 75,
     "rivals": 3,
     "speed": 0.8,
     "attack": 0.2,
     "wind": 0.3,
     "target": 8,
     "lives": 3,
     "sky": "noon"
    }
   },
   {
    "stage": 4,
    "difficulty": "medium",
    "name": "Gusty afternoon",
    "name_pa": "ਹਵਾ ਵਾਲੀ ਦੁਪਹਿਰ",
    "settings": {
     "duration": 80,
     "rivals": 3,
     "speed": 0.95,
     "attack": 0.35,
     "wind": 0.55,
     "target": 9,
     "lives": 3,
     "sky": "noon"
    }
   },
   {
    "stage": 5,
    "difficulty": "medium",
    "name": "Kite fighters",
    "name_pa": "ਪੇਚਾਂ ਦੇ ਖਿਡਾਰੀ",
    "settings": {
     "duration": 85,
     "rivals": 4,
     "speed": 1.05,
     "attack": 0.45,
     "wind": 0.5,
     "target": 10,
     "lives": 3,
     "sky": "noon"
    }
   },
   {
    "stage": 6,
    "difficulty": "medium",
    "name": "Sunset sky",
    "name_pa": "ਢਲਦਾ ਸੂਰਜ",
    "settings": {
     "duration": 90,
     "rivals": 4,
     "speed": 1.15,
     "attack": 0.55,
     "wind": 0.55,
     "target": 12,
     "lives": 3,
     "sky": "evening"
    }
   },
   {
    "stage": 7,
    "difficulty": "hard",
    "name": "Storm clouds",
    "name_pa": "ਕਾਲੀਆਂ ਘਟਾਵਾਂ",
    "settings": {
     "duration": 90,
     "rivals": 4,
     "speed": 1.3,
     "attack": 0.65,
     "wind": 0.85,
     "target": 13,
     "lives": 3,
     "sky": "storm"
    }
   },
   {
    "stage": 8,
    "difficulty": "hard",
    "name": "Pench masters",
    "name_pa": "ਪੇਚਾਂ ਦੇ ਉਸਤਾਦ",
    "settings": {
     "duration": 95,
     "rivals": 5,
     "speed": 1.4,
     "attack": 0.75,
     "wind": 0.7,
     "target": 15,
     "lives": 3,
     "sky": "evening"
    }
   },
   {
    "stage": 9,
    "difficulty": "hard",
    "name": "Basant champion",
    "name_pa": "ਬਸੰਤ ਦਾ ਜੇਤੂ",
    "settings": {
     "duration": 100,
     "rivals": 5,
     "speed": 1.55,
     "attack": 0.85,
     "wind": 0.8,
     "target": 18,
     "lives": 3,
     "sky": "evening"
    }
   }
  ]
 },
 "langar_seva": {
  "key": "langar_seva",
  "slug": "langar-seva",
  "title": "Langar Seva",
  "title_pa": "ਲੰਗਰ ਸੇਵਾ",
  "tagline": "Make rotis and serve dal, water and kheer. Nobody loses: the goal is to serve everyone.",
  "tagline_pa": "ਪ੍ਰਸ਼ਾਦੇ ਬਣਾਓ ਤੇ ਦਾਲ, ਪਾਣੀ ਤੇ ਖੀਰ ਵਰਤਾਓ। ਇੱਥੇ ਕੋਈ ਨਹੀਂ ਹਾਰਦਾ: ਸਭ ਨੂੰ ਲੰਗਰ ਛਕਾਓ।",
  "category": "Sikh Way of Life",
  "stage_count": 9,
  "max_stars": 27,
  "has_daily": false,
  "min_seconds": 8,
  "stages": [
   {
    "stage": 1,
    "difficulty": "easy",
    "name": "Morning langar",
    "name_pa": "ਸਵੇਰ ਦਾ ਲੰਗਰ",
    "settings": {
     "sangat": 6,
     "seats": 3,
     "items": [
      "roti",
      "water"
     ],
     "wants": 1,
     "target_seconds": 80
    }
   },
   {
    "stage": 2,
    "difficulty": "easy",
    "name": "Water seva",
    "name_pa": "ਜਲ ਦੀ ਸੇਵਾ",
    "settings": {
     "sangat": 8,
     "seats": 4,
     "items": [
      "roti",
      "water"
     ],
     "wants": 2,
     "target_seconds": 110
    }
   },
   {
    "stage": 3,
    "difficulty": "easy",
    "name": "Dal is ready",
    "name_pa": "ਦਾਲ ਤਿਆਰ ਹੈ",
    "settings": {
     "sangat": 8,
     "seats": 4,
     "items": [
      "roti",
      "dal",
      "water"
     ],
     "wants": 2,
     "target_seconds": 120
    }
   },
   {
    "stage": 4,
    "difficulty": "medium",
    "name": "Full pangat",
    "name_pa": "ਭਰੀ ਪੰਗਤ",
    "settings": {
     "sangat": 10,
     "seats": 5,
     "items": [
      "roti",
      "dal",
      "water"
     ],
     "wants": 2,
     "target_seconds": 145,
     "cook": true
    }
   },
   {
    "stage": 5,
    "difficulty": "medium",
    "name": "Gurpurab rush",
    "name_pa": "ਗੁਰਪੁਰਬ ਦੀ ਰੌਣਕ",
    "settings": {
     "sangat": 12,
     "seats": 5,
     "items": [
      "roti",
      "dal",
      "sabzi",
      "water"
     ],
     "wants": 2,
     "target_seconds": 170,
     "cook": true
    }
   },
   {
    "stage": 6,
    "difficulty": "medium",
    "name": "Kheer for everyone",
    "name_pa": "ਸਭ ਲਈ ਖੀਰ",
    "settings": {
     "sangat": 12,
     "seats": 5,
     "items": [
      "roti",
      "dal",
      "sabzi",
      "water",
      "kheer"
     ],
     "wants": 3,
     "target_seconds": 200,
     "cook": true
    }
   },
   {
    "stage": 7,
    "difficulty": "hard",
    "name": "Busy Sunday",
    "name_pa": "ਐਤਵਾਰ ਦੀ ਭੀੜ",
    "settings": {
     "sangat": 14,
     "seats": 6,
     "items": [
      "roti",
      "dal",
      "sabzi",
      "water",
      "kheer"
     ],
     "wants": 3,
     "target_seconds": 215,
     "cook": true
    }
   },
   {
    "stage": 8,
    "difficulty": "hard",
    "name": "Vaisakhi langar",
    "name_pa": "ਵਿਸਾਖੀ ਦਾ ਲੰਗਰ",
    "settings": {
     "sangat": 16,
     "seats": 6,
     "items": [
      "roti",
      "dal",
      "sabzi",
      "water",
      "kheer"
     ],
     "wants": 3,
     "target_seconds": 235,
     "cook": true
    }
   },
   {
    "stage": 9,
    "difficulty": "hard",
    "name": "Langar for the whole city",
    "name_pa": "ਸਾਰੇ ਸ਼ਹਿਰ ਦਾ ਲੰਗਰ",
    "settings": {
     "sangat": 18,
     "seats": 6,
     "items": [
      "roti",
      "dal",
      "sabzi",
      "water",
      "kheer"
     ],
     "wants": 3,
     "target_seconds": 255,
     "cook": true
    }
   }
  ]
 }
};

export const CONTENT = {
 "akhar_sikho": [
  {"slug":"letter-01","difficulty":"easy","group":"mool","data":{"kind":"letter","letter":"ੳ","name":"ਊੜਾ","roman":"ūṛā","sound":"carries u, ū and o sounds","example":"ਉੱਲੂ","example_meaning":"owl","inside":"","inside_meaning":"","note":"","looks_like":["ੲ","ਤ"]}},
  {"slug":"letter-02","difficulty":"easy","group":"mool","data":{"kind":"letter","letter":"ਅ","name":"ਐੜਾ","roman":"aiṛā","sound":"carries a, ā, ai and au sounds","example":"ਅੰਬ","example_meaning":"mango","inside":"","inside_meaning":"","note":"","looks_like":["ਮ","ਸ"]}},
  {"slug":"letter-03","difficulty":"easy","group":"mool","data":{"kind":"letter","letter":"ੲ","name":"ਈੜੀ","roman":"īṛī","sound":"carries i, ī and e sounds","example":"ਇੱਟ","example_meaning":"brick","inside":"","inside_meaning":"","note":"","looks_like":["ਣ","ੳ"]}},
  {"slug":"letter-04","difficulty":"easy","group":"mool","data":{"kind":"letter","letter":"ਸ","name":"ਸੱਸਾ","roman":"sassā","sound":"s","example":"ਸੇਬ","example_meaning":"apple","inside":"","inside_meaning":"","note":"","looks_like":["ਮ","ਅ"]}},
  {"slug":"letter-05","difficulty":"easy","group":"mool","data":{"kind":"letter","letter":"ਹ","name":"ਹਾਹਾ","roman":"hāhā","sound":"h","example":"ਹਾਥੀ","example_meaning":"elephant","inside":"","inside_meaning":"","note":"","looks_like":["ਗ","ਕ"]}},
  {"slug":"letter-06","difficulty":"easy","group":"ka","data":{"kind":"letter","letter":"ਕ","name":"ਕੱਕਾ","roman":"kakkā","sound":"k","example":"ਕਬੂਤਰ","example_meaning":"pigeon","inside":"","inside_meaning":"","note":"","looks_like":["ਗ","ਹ"]}},
  {"slug":"letter-07","difficulty":"easy","group":"ka","data":{"kind":"letter","letter":"ਖ","name":"ਖੱਖਾ","roman":"khakkhā","sound":"kh","example":"ਖੀਰਾ","example_meaning":"cucumber","inside":"","inside_meaning":"","note":"","looks_like":["ਪ","ਧ"]}},
  {"slug":"letter-08","difficulty":"easy","group":"ka","data":{"kind":"letter","letter":"ਗ","name":"ਗੱਗਾ","roman":"gaggā","sound":"g","example":"ਗਾਂ","example_meaning":"cow","inside":"","inside_meaning":"","note":"","looks_like":["ਕ","ਹ"]}},
  {"slug":"letter-09","difficulty":"easy","group":"ka","data":{"kind":"letter","letter":"ਘ","name":"ਘੱਗਾ","roman":"ghaggā","sound":"gh","example":"ਘਰ","example_meaning":"house","inside":"","inside_meaning":"","note":"","looks_like":["ਙ","ਖ"]}},
  {"slug":"letter-10","difficulty":"easy","group":"ka","data":{"kind":"letter","letter":"ਙ","name":"ਙੰਙਾ","roman":"ṅaṅṅā","sound":"ng, through the nose","example":"","example_meaning":"","inside":"","inside_meaning":"","note":"Rarely used today: you will mostly meet it in Gurbani.","looks_like":["ਘ","ੲ"]}},
  {"slug":"letter-11","difficulty":"easy","group":"cha","data":{"kind":"letter","letter":"ਚ","name":"ਚੱਚਾ","roman":"chachchā","sound":"ch","example":"ਚਿੜੀ","example_meaning":"sparrow","inside":"","inside_meaning":"","note":"","looks_like":["ਢ","ਰ"]}},
  {"slug":"letter-12","difficulty":"easy","group":"cha","data":{"kind":"letter","letter":"ਛ","name":"ਛੱਛਾ","roman":"chhachchhā","sound":"chh","example":"ਛੱਤਰੀ","example_meaning":"umbrella","inside":"","inside_meaning":"","note":"","looks_like":["ਫ","ਡ"]}},
  {"slug":"letter-13","difficulty":"easy","group":"cha","data":{"kind":"letter","letter":"ਜ","name":"ਜੱਜਾ","roman":"jajjā","sound":"j","example":"ਜੁਰਾਬ","example_meaning":"sock","inside":"","inside_meaning":"","note":"","looks_like":["ਤ","ਝ"]}},
  {"slug":"letter-14","difficulty":"easy","group":"cha","data":{"kind":"letter","letter":"ਝ","name":"ਝੱਜਾ","roman":"jhajjā","sound":"jh","example":"ਝੰਡਾ","example_meaning":"flag","inside":"","inside_meaning":"","note":"","looks_like":["ਞ","ਜ"]}},
  {"slug":"letter-15","difficulty":"easy","group":"cha","data":{"kind":"letter","letter":"ਞ","name":"ਞੰਞਾ","roman":"ñaññā","sound":"ny, through the nose","example":"","example_meaning":"","inside":"","inside_meaning":"","note":"Rarely used today: you will mostly meet it in Gurbani.","looks_like":["ਝ","ਙ"]}},
  {"slug":"letter-16","difficulty":"easy","group":"tta","data":{"kind":"letter","letter":"ਟ","name":"ਟੈਂਕਾ","roman":"ṭaiṅkā","sound":"t (hard)","example":"ਟਮਾਟਰ","example_meaning":"tomato","inside":"","inside_meaning":"","note":"","looks_like":["ਠ","ਨ"]}},
  {"slug":"letter-17","difficulty":"easy","group":"tta","data":{"kind":"letter","letter":"ਠ","name":"ਠੱਠਾ","roman":"ṭhaṭṭhā","sound":"th (hard)","example":"ਠੰਢ","example_meaning":"cold weather","inside":"","inside_meaning":"","note":"","looks_like":["ਟ","ੳ"]}},
  {"slug":"letter-18","difficulty":"easy","group":"tta","data":{"kind":"letter","letter":"ਡ","name":"ਡੱਡਾ","roman":"ḍaḍḍā","sound":"d (hard)","example":"ਡੱਡੂ","example_meaning":"frog","inside":"","inside_meaning":"","note":"","looks_like":["ੜ","ਭ"]}},
  {"slug":"letter-19","difficulty":"easy","group":"tta","data":{"kind":"letter","letter":"ਢ","name":"ਢੱਡਾ","roman":"ḍhaḍḍā","sound":"dh (hard)","example":"ਢੋਲ","example_meaning":"drum","inside":"","inside_meaning":"","note":"","looks_like":["ਚ","ਰ"]}},
  {"slug":"letter-20","difficulty":"easy","group":"tta","data":{"kind":"letter","letter":"ਣ","name":"ਣਾਣਾ","roman":"ṇāṇā","sound":"n (hard)","example":"","example_meaning":"","inside":"ਪਾਣੀ","inside_meaning":"water","note":"","looks_like":["ੲ","ਙ"]}},
  {"slug":"letter-21","difficulty":"easy","group":"ta","data":{"kind":"letter","letter":"ਤ","name":"ਤੱਤਾ","roman":"tattā","sound":"t (soft)","example":"ਤੋਤਾ","example_meaning":"parrot","inside":"","inside_meaning":"","note":"","looks_like":["ਦ","ਜ"]}},
  {"slug":"letter-22","difficulty":"easy","group":"ta","data":{"kind":"letter","letter":"ਥ","name":"ਥੱਥਾ","roman":"thatthā","sound":"th (soft)","example":"ਥਾਲੀ","example_meaning":"plate","inside":"","inside_meaning":"","note":"","looks_like":["ਬ","ਯ"]}},
  {"slug":"letter-23","difficulty":"easy","group":"ta","data":{"kind":"letter","letter":"ਦ","name":"ਦੱਦਾ","roman":"daddā","sound":"d (soft)","example":"ਦੀਵਾ","example_meaning":"oil lamp","inside":"","inside_meaning":"","note":"","looks_like":["ਤ","ਫ"]}},
  {"slug":"letter-24","difficulty":"easy","group":"ta","data":{"kind":"letter","letter":"ਧ","name":"ਧੱਦਾ","roman":"dhaddā","sound":"dh (soft)","example":"ਧੁੱਪ","example_meaning":"sunshine","inside":"","inside_meaning":"","note":"","looks_like":["ਪ","ਖ"]}},
  {"slug":"letter-25","difficulty":"easy","group":"ta","data":{"kind":"letter","letter":"ਨ","name":"ਨੱਨਾ","roman":"nannā","sound":"n","example":"ਨਲਕਾ","example_meaning":"hand pump","inside":"","inside_meaning":"","note":"","looks_like":["ਟ","ਠ"]}},
  {"slug":"letter-26","difficulty":"easy","group":"pa","data":{"kind":"letter","letter":"ਪ","name":"ਪੱਪਾ","roman":"pappā","sound":"p","example":"ਪਤੰਗ","example_meaning":"kite","inside":"","inside_meaning":"","note":"","looks_like":["ਧ","ਖ"]}},
  {"slug":"letter-27","difficulty":"easy","group":"pa","data":{"kind":"letter","letter":"ਫ","name":"ਫੱਫਾ","roman":"phaphphā","sound":"ph","example":"ਫੁੱਲ","example_meaning":"flower","inside":"","inside_meaning":"","note":"","looks_like":["ਦ","ਛ"]}},
  {"slug":"letter-28","difficulty":"easy","group":"pa","data":{"kind":"letter","letter":"ਬ","name":"ਬੱਬਾ","roman":"babbā","sound":"b","example":"ਬੱਕਰੀ","example_meaning":"goat","inside":"","inside_meaning":"","note":"","looks_like":["ਥ","ਯ"]}},
  {"slug":"letter-29","difficulty":"easy","group":"pa","data":{"kind":"letter","letter":"ਭ","name":"ਭੱਬਾ","roman":"bhabbā","sound":"bh","example":"ਭੇਡ","example_meaning":"sheep","inside":"","inside_meaning":"","note":"","looks_like":["ਡ","ੜ"]}},
  {"slug":"letter-30","difficulty":"easy","group":"pa","data":{"kind":"letter","letter":"ਮ","name":"ਮੱਮਾ","roman":"mammā","sound":"m","example":"ਮੋਰ","example_meaning":"peacock","inside":"","inside_meaning":"","note":"","looks_like":["ਸ","ਅ"]}},
  {"slug":"letter-31","difficulty":"easy","group":"ya","data":{"kind":"letter","letter":"ਯ","name":"ਯੱਯਾ","roman":"yayyā","sound":"y","example":"ਯਾਤਰੀ","example_meaning":"traveller","inside":"","inside_meaning":"","note":"","looks_like":["ਬ","ਥ"]}},
  {"slug":"letter-32","difficulty":"easy","group":"ya","data":{"kind":"letter","letter":"ਰ","name":"ਰਾਰਾ","roman":"rārā","sound":"r","example":"ਰੇਲ","example_meaning":"train","inside":"","inside_meaning":"","note":"","looks_like":["ਚ","ਢ"]}},
  {"slug":"letter-33","difficulty":"easy","group":"ya","data":{"kind":"letter","letter":"ਲ","name":"ਲੱਲਾ","roman":"lallā","sound":"l","example":"ਲੱਡੂ","example_meaning":"laddoo (a round sweet)","inside":"","inside_meaning":"","note":"","looks_like":["ਙ","ਘ"]}},
  {"slug":"letter-34","difficulty":"easy","group":"ya","data":{"kind":"letter","letter":"ਵ","name":"ਵਾਵਾ","roman":"vāvā","sound":"v / w","example":"ਵਾਜਾ","example_meaning":"harmonium","inside":"","inside_meaning":"","note":"","looks_like":["ੲ","ਦ"]}},
  {"slug":"letter-35","difficulty":"easy","group":"ya","data":{"kind":"letter","letter":"ੜ","name":"ੜਾੜਾ","roman":"ṛāṛā","sound":"ṛ, a flapped r","example":"","example_meaning":"","inside":"ਘੋੜਾ","inside_meaning":"horse","note":"","looks_like":["ਡ","ਭ"]}},
  {"slug":"nukta-01","difficulty":"hard","group":"nukta","data":{"kind":"letter","letter":"ਸ਼","name":"ਸੱਸੇ ਪੈਰ ਬਿੰਦੀ","roman":"sasse pair bindī","sound":"sh","example":"ਸ਼ੇਰ","example_meaning":"lion","inside":"","inside_meaning":"","note":"","looks_like":["ਸ","ਮ"]}},
  {"slug":"nukta-02","difficulty":"hard","group":"nukta","data":{"kind":"letter","letter":"ਖ਼","name":"ਖੱਖੇ ਪੈਰ ਬਿੰਦੀ","roman":"khakhe pair bindī","sound":"kh, from the throat","example":"ਖ਼ਰਗੋਸ਼","example_meaning":"rabbit","inside":"","inside_meaning":"","note":"","looks_like":["ਖ","ਪ"]}},
  {"slug":"nukta-03","difficulty":"hard","group":"nukta","data":{"kind":"letter","letter":"ਗ਼","name":"ਗੱਗੇ ਪੈਰ ਬਿੰਦੀ","roman":"gagge pair bindī","sound":"gh, from the throat","example":"ਗ਼ੁਬਾਰਾ","example_meaning":"balloon","inside":"","inside_meaning":"","note":"","looks_like":["ਗ","ਕ"]}},
  {"slug":"nukta-04","difficulty":"hard","group":"nukta","data":{"kind":"letter","letter":"ਜ਼","name":"ਜੱਜੇ ਪੈਰ ਬਿੰਦੀ","roman":"jajje pair bindī","sound":"z","example":"ਜ਼ਮੀਨ","example_meaning":"land","inside":"","inside_meaning":"","note":"","looks_like":["ਜ","ਤ"]}},
  {"slug":"nukta-05","difficulty":"hard","group":"nukta","data":{"kind":"letter","letter":"ਫ਼","name":"ਫੱਫੇ ਪੈਰ ਬਿੰਦੀ","roman":"phaphphe pair bindī","sound":"f","example":"ਫ਼ਰਸ਼","example_meaning":"floor","inside":"","inside_meaning":"","note":"","looks_like":["ਫ","ਦ"]}},
  {"slug":"nukta-06","difficulty":"hard","group":"nukta","data":{"kind":"letter","letter":"ਲ਼","name":"ਲੱਲੇ ਪੈਰ ਬਿੰਦੀ","roman":"lalle pair bindī","sound":"l (hard)","example":"","example_meaning":"","inside":"","inside_meaning":"","note":"Many writers use a plain ਲ instead.","looks_like":["ਲ","ਙ"]}},
  {"slug":"matra-01","difficulty":"hard","group":"matra","data":{"kind":"matra","letter":"ਕਾ","sign":"ਾ","name":"ਕੰਨਾ","roman":"kannā","sound":"ā, as in \"father\"","example":"ਰਾਜਾ","example_meaning":"king","looks_like":[]}},
  {"slug":"matra-02","difficulty":"hard","group":"matra","data":{"kind":"matra","letter":"ਕਿ","sign":"ਿ","name":"ਸਿਹਾਰੀ","roman":"sihārī","sound":"i, as in \"sit\"","example":"ਦਿਲ","example_meaning":"heart","looks_like":[]}},
  {"slug":"matra-03","difficulty":"hard","group":"matra","data":{"kind":"matra","letter":"ਕੀ","sign":"ੀ","name":"ਬਿਹਾਰੀ","roman":"bihārī","sound":"ī, as in \"see\"","example":"ਖੀਰ","example_meaning":"rice pudding","looks_like":[]}},
  {"slug":"matra-04","difficulty":"hard","group":"matra","data":{"kind":"matra","letter":"ਕੁ","sign":"ੁ","name":"ਔਂਕੜ","roman":"auṅkaṛ","sound":"u, as in \"put\"","example":"ਫੁੱਲ","example_meaning":"flower","looks_like":[]}},
  {"slug":"matra-05","difficulty":"hard","group":"matra","data":{"kind":"matra","letter":"ਕੂ","sign":"ੂ","name":"ਦੁਲੈਂਕੜ","roman":"dulaiṅkaṛ","sound":"ū, as in \"moon\"","example":"ਸੂਰਜ","example_meaning":"sun","looks_like":[]}},
  {"slug":"matra-06","difficulty":"hard","group":"matra","data":{"kind":"matra","letter":"ਕੇ","sign":"ੇ","name":"ਲਾਂਵ","roman":"lāṅv","sound":"e, as in \"they\"","example":"ਸੇਬ","example_meaning":"apple","looks_like":[]}},
  {"slug":"matra-07","difficulty":"hard","group":"matra","data":{"kind":"matra","letter":"ਕੈ","sign":"ੈ","name":"ਦੁਲਾਂਵਾਂ","roman":"dulāṅvāṅ","sound":"ai, as in \"bat\"","example":"ਪੈਸਾ","example_meaning":"money","looks_like":[]}},
  {"slug":"matra-08","difficulty":"hard","group":"matra","data":{"kind":"matra","letter":"ਕੋ","sign":"ੋ","name":"ਹੋੜਾ","roman":"hoṛā","sound":"o, as in \"go\"","example":"ਮੋਰ","example_meaning":"peacock","looks_like":[]}},
  {"slug":"matra-09","difficulty":"hard","group":"matra","data":{"kind":"matra","letter":"ਕੌ","sign":"ੌ","name":"ਕਨੌੜਾ","roman":"kanauṛā","sound":"au, as in \"saw\"","example":"ਚੌਲ","example_meaning":"rice","looks_like":[]}},
  {"slug":"matra-10","difficulty":"hard","group":"matra","data":{"kind":"matra","letter":"ਕਾਂ","sign":"ਂ","name":"ਬਿੰਦੀ","roman":"bindī","sound":"says the vowel through the nose","example":"ਮਾਂ","example_meaning":"mother","looks_like":[]}},
  {"slug":"matra-11","difficulty":"hard","group":"matra","data":{"kind":"matra","letter":"ਕੰ","sign":"ੰ","name":"ਟਿੱਪੀ","roman":"ṭippī","sound":"an n or m sound through the nose","example":"ਅੰਬ","example_meaning":"mango","looks_like":[]}},
  {"slug":"matra-12","difficulty":"hard","group":"matra","data":{"kind":"matra","letter":"ਕੱ","sign":"ੱ","name":"ਅੱਧਕ","roman":"addhak","sound":"doubles the next letter","example":"ਪੱਤਾ","example_meaning":"leaf","looks_like":[]}},
 ],
 "shabad_le": [
  {"slug":"easy-001","difficulty":"easy","group":"3","data":{"word":"ਪੰਜਾਬ","roman":"Punjāb","meaning":"Punjab, the land of five rivers","hint":"Place"}},
  {"slug":"easy-002","difficulty":"easy","group":"3","data":{"word":"ਕਿਤਾਬ","roman":"kitāb","meaning":"book","hint":"School"}},
  {"slug":"easy-003","difficulty":"easy","group":"3","data":{"word":"ਕਮਲ","roman":"kamal","meaning":"lotus flower","hint":"Nature"}},
  {"slug":"easy-004","difficulty":"easy","group":"3","data":{"word":"ਸ਼ਹਿਰ","roman":"shahir","meaning":"city","hint":"Place"}},
  {"slug":"easy-005","difficulty":"easy","group":"3","data":{"word":"ਦਰਿਆ","roman":"dariā","meaning":"river","hint":"Nature"}},
  {"slug":"easy-006","difficulty":"easy","group":"3","data":{"word":"ਬੱਦਲ","roman":"baddal","meaning":"cloud","hint":"Weather"}},
  {"slug":"easy-007","difficulty":"easy","group":"3","data":{"word":"ਸੂਰਜ","roman":"sūraj","meaning":"sun","hint":"Sky"}},
  {"slug":"easy-008","difficulty":"easy","group":"3","data":{"word":"ਕਿਸਾਨ","roman":"kisān","meaning":"farmer","hint":"People"}},
  {"slug":"easy-009","difficulty":"easy","group":"3","data":{"word":"ਲੰਗਰ","roman":"langar","meaning":"the free kitchen of the Gurdwara","hint":"Sikhi"}},
  {"slug":"easy-010","difficulty":"easy","group":"3","data":{"word":"ਸੰਗਤ","roman":"sangat","meaning":"the congregation, people gathered together","hint":"Sikhi"}},
  {"slug":"easy-011","difficulty":"easy","group":"3","data":{"word":"ਪੰਗਤ","roman":"pangat","meaning":"a row of people sitting together to eat langar","hint":"Sikhi"}},
  {"slug":"easy-012","difficulty":"easy","group":"3","data":{"word":"ਨਿਸ਼ਾਨ","roman":"nishān","meaning":"flag, sign (as in Nishan Sahib)","hint":"Sikhi"}},
  {"slug":"easy-013","difficulty":"easy","group":"3","data":{"word":"ਸ਼ਬਦ","roman":"shabad","meaning":"a hymn from Gurbani; also \"word\"","hint":"Sikhi"}},
  {"slug":"easy-014","difficulty":"easy","group":"3","data":{"word":"ਪਤੰਗ","roman":"patang","meaning":"kite","hint":"Play"}},
  {"slug":"easy-015","difficulty":"easy","group":"3","data":{"word":"ਬਸੰਤ","roman":"basant","meaning":"spring, the kite-flying festival","hint":"Festival"}},
  {"slug":"easy-016","difficulty":"easy","group":"3","data":{"word":"ਭੰਗੜਾ","roman":"bhangṛā","meaning":"bhangra, the lively Punjabi dance","hint":"Culture"}},
  {"slug":"easy-017","difficulty":"easy","group":"3","data":{"word":"ਧਰਤੀ","roman":"dhartī","meaning":"the earth","hint":"Nature"}},
  {"slug":"easy-018","difficulty":"easy","group":"3","data":{"word":"ਜੰਗਲ","roman":"jangal","meaning":"forest","hint":"Nature"}},
  {"slug":"easy-019","difficulty":"easy","group":"3","data":{"word":"ਮਿੱਤਰ","roman":"mittar","meaning":"friend","hint":"People"}},
  {"slug":"easy-020","difficulty":"easy","group":"3","data":{"word":"ਕਲਮ","roman":"kalam","meaning":"pen","hint":"School"}},
  {"slug":"easy-021","difficulty":"easy","group":"3","data":{"word":"ਅੱਖਰ","roman":"akkhar","meaning":"letter (of the alphabet)","hint":"School"}},
  {"slug":"easy-022","difficulty":"easy","group":"3","data":{"word":"ਬਾਂਦਰ","roman":"bāndar","meaning":"monkey","hint":"Animal"}},
  {"slug":"easy-023","difficulty":"easy","group":"3","data":{"word":"ਗਾਜਰ","roman":"gājar","meaning":"carrot","hint":"Food"}},
  {"slug":"easy-024","difficulty":"easy","group":"3","data":{"word":"ਮਟਰ","roman":"maṭar","meaning":"peas","hint":"Food"}},
  {"slug":"easy-025","difficulty":"easy","group":"3","data":{"word":"ਅਨਾਰ","roman":"anār","meaning":"pomegranate","hint":"Food"}},
  {"slug":"easy-026","difficulty":"easy","group":"3","data":{"word":"ਅੰਗੂਰ","roman":"angūr","meaning":"grapes","hint":"Food"}},
  {"slug":"easy-027","difficulty":"easy","group":"3","data":{"word":"ਮੱਖਣ","roman":"makkhaṇ","meaning":"butter","hint":"Food"}},
  {"slug":"easy-028","difficulty":"easy","group":"3","data":{"word":"ਚਰਖਾ","roman":"charkhā","meaning":"spinning wheel","hint":"Village"}},
  {"slug":"easy-029","difficulty":"easy","group":"3","data":{"word":"ਤਬਲਾ","roman":"tablā","meaning":"tabla drums","hint":"Music"}},
  {"slug":"easy-030","difficulty":"easy","group":"3","data":{"word":"ਸਾਰੰਗੀ","roman":"sārangī","meaning":"sarangi, a bowed string instrument","hint":"Music"}},
  {"slug":"easy-031","difficulty":"easy","group":"3","data":{"word":"ਬਸਤਾ","roman":"bastā","meaning":"school bag","hint":"School"}},
  {"slug":"easy-032","difficulty":"easy","group":"3","data":{"word":"ਸੜਕ","roman":"saṛak","meaning":"road","hint":"Place"}},
  {"slug":"easy-033","difficulty":"easy","group":"3","data":{"word":"ਹਿਰਨ","roman":"hiran","meaning":"deer","hint":"Animal"}},
  {"slug":"easy-034","difficulty":"easy","group":"3","data":{"word":"ਬੱਕਰੀ","roman":"bakkrī","meaning":"goat","hint":"Animal"}},
  {"slug":"easy-035","difficulty":"easy","group":"3","data":{"word":"ਸਾਗਰ","roman":"sāgar","meaning":"sea","hint":"Nature"}},
  {"slug":"easy-036","difficulty":"easy","group":"3","data":{"word":"ਗੁਟਕਾ","roman":"guṭkā","meaning":"a small prayer book","hint":"Sikhi"}},
  {"slug":"easy-037","difficulty":"easy","group":"3","data":{"word":"ਪਾਲਕੀ","roman":"pālkī","meaning":"the palanquin that carries Guru Granth Sahib","hint":"Sikhi"}},
  {"slug":"easy-038","difficulty":"easy","group":"3","data":{"word":"ਰੁਮਾਲਾ","roman":"rumālā","meaning":"the cloth that covers Guru Granth Sahib","hint":"Sikhi"}},
  {"slug":"easy-039","difficulty":"easy","group":"3","data":{"word":"ਦੀਵਾਲੀ","roman":"dīvālī","meaning":"Diwali, the festival of lights","hint":"Festival"}},
  {"slug":"easy-040","difficulty":"easy","group":"3","data":{"word":"ਵਿਸਾਖੀ","roman":"visākhī","meaning":"Vaisakhi, the harvest festival and birthday of the Khalsa","hint":"Festival"}},
  {"slug":"easy-041","difficulty":"easy","group":"3","data":{"word":"ਲੋਹੜੀ","roman":"lohṛī","meaning":"Lohri, the winter bonfire festival","hint":"Festival"}},
  {"slug":"easy-042","difficulty":"easy","group":"3","data":{"word":"ਗਤਕਾ","roman":"gatkā","meaning":"gatka, the Sikh martial art","hint":"Culture"}},
  {"slug":"easy-043","difficulty":"easy","group":"3","data":{"word":"ਕਬੱਡੀ","roman":"kabaḍḍī","meaning":"kabaddi, a team sport","hint":"Play"}},
  {"slug":"easy-044","difficulty":"easy","group":"3","data":{"word":"ਖਿਡੌਣਾ","roman":"khiḍauṇā","meaning":"toy","hint":"Play"}},
  {"slug":"easy-045","difficulty":"easy","group":"3","data":{"word":"ਕਹਾਣੀ","roman":"kahāṇī","meaning":"story","hint":"School"}},
  {"slug":"easy-046","difficulty":"easy","group":"3","data":{"word":"ਸੁਪਨਾ","roman":"supnā","meaning":"dream","hint":"Feelings"}},
  {"slug":"easy-047","difficulty":"easy","group":"3","data":{"word":"ਤਿਤਲੀ","roman":"titlī","meaning":"butterfly","hint":"Animal"}},
  {"slug":"easy-048","difficulty":"easy","group":"3","data":{"word":"ਕਣਕ","roman":"kaṇak","meaning":"wheat","hint":"Village"}},
  {"slug":"easy-049","difficulty":"easy","group":"3","data":{"word":"ਕਪਾਹ","roman":"kapāh","meaning":"cotton","hint":"Village"}},
  {"slug":"easy-050","difficulty":"easy","group":"3","data":{"word":"ਨਹਿਰ","roman":"nahir","meaning":"canal","hint":"Village"}},
  {"slug":"easy-051","difficulty":"easy","group":"3","data":{"word":"ਪਿੱਪਲ","roman":"pippal","meaning":"peepal tree","hint":"Nature"}},
  {"slug":"easy-052","difficulty":"easy","group":"3","data":{"word":"ਬੋਹੜ","roman":"bohaṛ","meaning":"banyan tree","hint":"Nature"}},
  {"slug":"easy-053","difficulty":"easy","group":"3","data":{"word":"ਸਬਜ਼ੀ","roman":"sabzī","meaning":"vegetables","hint":"Food"}},
  {"slug":"easy-054","difficulty":"easy","group":"3","data":{"word":"ਤਖ਼ਤ","roman":"takhat","meaning":"throne; one of the five Takhts","hint":"Sikhi"}},
  {"slug":"easy-055","difficulty":"easy","group":"3","data":{"word":"ਕੇਸਰੀ","roman":"kesarī","meaning":"saffron colour","hint":"Colour"}},
  {"slug":"easy-056","difficulty":"easy","group":"3","data":{"word":"ਰਬਾਬ","roman":"rabāb","meaning":"rabab, the instrument Bhai Mardana played","hint":"Music"}},
  {"slug":"easy-057","difficulty":"easy","group":"3","data":{"word":"ਚਿਮਟਾ","roman":"chimṭā","meaning":"chimta, a jingling tong instrument","hint":"Music"}},
  {"slug":"easy-058","difficulty":"easy","group":"3","data":{"word":"ਜੁਗਨੂੰ","roman":"jugnūn","meaning":"firefly","hint":"Animal"}},
  {"slug":"easy-059","difficulty":"easy","group":"3","data":{"word":"ਕਛੂਆ","roman":"kachhūā","meaning":"tortoise","hint":"Animal"}},
  {"slug":"easy-060","difficulty":"easy","group":"3","data":{"word":"ਕੋਇਲ","roman":"koil","meaning":"koel, a singing bird","hint":"Animal"}},
  {"slug":"easy-061","difficulty":"easy","group":"3","data":{"word":"ਬਿਜਲੀ","roman":"bijlī","meaning":"lightning; electricity","hint":"Weather"}},
  {"slug":"easy-062","difficulty":"easy","group":"3","data":{"word":"ਗੁਲਾਬ","roman":"gulāb","meaning":"rose","hint":"Nature"}},
  {"slug":"easy-063","difficulty":"easy","group":"3","data":{"word":"ਜਲੇਬੀ","roman":"jalebī","meaning":"jalebi, a syrupy sweet","hint":"Food"}},
  {"slug":"easy-064","difficulty":"easy","group":"3","data":{"word":"ਸਮੋਸਾ","roman":"samosā","meaning":"samosa","hint":"Food"}},
  {"slug":"easy-065","difficulty":"easy","group":"3","data":{"word":"ਬਰਫ਼ੀ","roman":"barfī","meaning":"barfi, a milk sweet","hint":"Food"}},
  {"slug":"easy-066","difficulty":"easy","group":"3","data":{"word":"ਹਲਦੀ","roman":"haldī","meaning":"turmeric","hint":"Food"}},
  {"slug":"easy-067","difficulty":"easy","group":"3","data":{"word":"ਮਿਰਚ","roman":"mirch","meaning":"chilli; pepper","hint":"Food"}},
  {"slug":"easy-068","difficulty":"easy","group":"3","data":{"word":"ਪਿਆਜ਼","roman":"piāz","meaning":"onion","hint":"Food"}},
  {"slug":"easy-069","difficulty":"easy","group":"3","data":{"word":"ਬਾਦਾਮ","roman":"bādām","meaning":"almond","hint":"Food"}},
  {"slug":"easy-070","difficulty":"easy","group":"3","data":{"word":"ਰਜਾਈ","roman":"rajāī","meaning":"quilt","hint":"Home"}},
  {"slug":"easy-071","difficulty":"easy","group":"3","data":{"word":"ਮਹਿੰਦੀ","roman":"mahindī","meaning":"henna","hint":"Culture"}},
  {"slug":"medium-001","difficulty":"medium","group":"4","data":{"word":"ਗੁਰਮੁਖੀ","roman":"Gurmukhī","meaning":"Gurmukhi, the script Punjabi is written in","hint":"School"}},
  {"slug":"medium-002","difficulty":"medium","group":"4","data":{"word":"ਦਸਤਾਰ","roman":"dastār","meaning":"turban","hint":"Sikhi"}},
  {"slug":"medium-003","difficulty":"medium","group":"4","data":{"word":"ਅਰਦਾਸ","roman":"ardās","meaning":"the Sikh prayer","hint":"Sikhi"}},
  {"slug":"medium-004","difficulty":"medium","group":"4","data":{"word":"ਕੀਰਤਨ","roman":"kīrtan","meaning":"singing Gurbani with music","hint":"Sikhi"}},
  {"slug":"medium-005","difficulty":"medium","group":"4","data":{"word":"ਪਰਿਵਾਰ","roman":"parivār","meaning":"family","hint":"People"}},
  {"slug":"medium-006","difficulty":"medium","group":"4","data":{"word":"ਕਬੂਤਰ","roman":"kabūtar","meaning":"pigeon","hint":"Animal"}},
  {"slug":"medium-007","difficulty":"medium","group":"4","data":{"word":"ਫੁਲਕਾਰੀ","roman":"phulkārī","meaning":"phulkari, Punjabi flower embroidery","hint":"Culture"}},
  {"slug":"medium-008","difficulty":"medium","group":"4","data":{"word":"ਖ਼ਰਗੋਸ਼","roman":"khargosh","meaning":"rabbit","hint":"Animal"}},
  {"slug":"medium-009","difficulty":"medium","group":"4","data":{"word":"ਪਰਬਤ","roman":"parbat","meaning":"mountain","hint":"Nature"}},
  {"slug":"medium-010","difficulty":"medium","group":"4","data":{"word":"ਸਤਲੁਜ","roman":"Satluj","meaning":"the Sutlej, one of the five rivers of Punjab","hint":"Place"}},
  {"slug":"medium-011","difficulty":"medium","group":"4","data":{"word":"ਸਿਮਰਨ","roman":"simran","meaning":"remembering God","hint":"Sikhi"}},
  {"slug":"medium-012","difficulty":"medium","group":"4","data":{"word":"ਕਿਰਪਾਨ","roman":"kirpān","meaning":"kirpan, one of the Five Ks","hint":"Sikhi"}},
  {"slug":"medium-013","difficulty":"medium","group":"4","data":{"word":"ਸਤਿਕਾਰ","roman":"satikār","meaning":"respect","hint":"Feelings"}},
  {"slug":"medium-014","difficulty":"medium","group":"4","data":{"word":"ਦੁਪਹਿਰ","roman":"dupahir","meaning":"afternoon","hint":"Time"}},
  {"slug":"medium-015","difficulty":"medium","group":"4","data":{"word":"ਚੰਦਰਮਾ","roman":"chandarmā","meaning":"the moon","hint":"Sky"}},
  {"slug":"medium-016","difficulty":"medium","group":"4","data":{"word":"ਬਰਸਾਤ","roman":"barsāt","meaning":"the rainy season","hint":"Weather"}},
  {"slug":"medium-017","difficulty":"medium","group":"4","data":{"word":"ਪਤਝੜ","roman":"patjhaṛ","meaning":"autumn","hint":"Weather"}},
  {"slug":"medium-018","difficulty":"medium","group":"4","data":{"word":"ਲੁਧਿਆਣਾ","roman":"Ludhiāṇā","meaning":"Ludhiana, a big city of Punjab","hint":"Place"}},
  {"slug":"medium-019","difficulty":"medium","group":"4","data":{"word":"ਜਲੰਧਰ","roman":"Jalandhar","meaning":"Jalandhar, a city of Punjab","hint":"Place"}},
  {"slug":"medium-020","difficulty":"medium","group":"4","data":{"word":"ਪਟਿਆਲਾ","roman":"Paṭiālā","meaning":"Patiala, a city of Punjab","hint":"Place"}},
  {"slug":"medium-021","difficulty":"medium","group":"4","data":{"word":"ਸੰਗਰੂਰ","roman":"Sangrūr","meaning":"Sangrur, a city of Punjab","hint":"Place"}},
  {"slug":"medium-022","difficulty":"medium","group":"4","data":{"word":"ਤਲਵੰਡੀ","roman":"Talvaṇḍī","meaning":"Talwandi, where Guru Nanak Dev Ji was born","hint":"Place"}},
  {"slug":"medium-023","difficulty":"medium","group":"4","data":{"word":"ਸਰਦਾਰ","roman":"sardār","meaning":"chief; a Sikh man","hint":"People"}},
  {"slug":"medium-024","difficulty":"medium","group":"4","data":{"word":"ਮਹਾਰਾਜਾ","roman":"mahārājā","meaning":"great king","hint":"People"}},
  {"slug":"medium-025","difficulty":"medium","group":"4","data":{"word":"ਬਹਾਦਰ","roman":"bahādar","meaning":"brave","hint":"Feelings"}},
  {"slug":"medium-026","difficulty":"medium","group":"4","data":{"word":"ਤਰਬੂਜ਼","roman":"tarbūz","meaning":"watermelon","hint":"Food"}},
  {"slug":"medium-027","difficulty":"medium","group":"4","data":{"word":"ਅਮਰੂਦ","roman":"amrūd","meaning":"guava","hint":"Food"}},
  {"slug":"medium-028","difficulty":"medium","group":"4","data":{"word":"ਸ਼ਲਗਮ","roman":"shalgam","meaning":"turnip","hint":"Food"}},
  {"slug":"medium-029","difficulty":"medium","group":"4","data":{"word":"ਲਾਲਟੈਣ","roman":"lālṭaiṇ","meaning":"lantern","hint":"Home"}},
  {"slug":"medium-030","difficulty":"medium","group":"4","data":{"word":"ਇਤਿਹਾਸ","roman":"itihās","meaning":"history","hint":"School"}},
  {"slug":"medium-031","difficulty":"medium","group":"4","data":{"word":"ਅਖ਼ਬਾਰ","roman":"akhbār","meaning":"newspaper","hint":"Home"}},
  {"slug":"medium-032","difficulty":"medium","group":"4","data":{"word":"ਸਮੁੰਦਰ","roman":"samundar","meaning":"ocean","hint":"Nature"}},
  {"slug":"medium-033","difficulty":"medium","group":"4","data":{"word":"ਸਾਈਕਲ","roman":"sāīkal","meaning":"bicycle","hint":"Play"}},
  {"slug":"medium-034","difficulty":"medium","group":"4","data":{"word":"ਅਸਮਾਨ","roman":"asmān","meaning":"sky","hint":"Sky"}},
  {"slug":"medium-035","difficulty":"medium","group":"4","data":{"word":"ਦਰਵਾਜ਼ਾ","roman":"darvāzā","meaning":"door","hint":"Home"}},
  {"slug":"medium-036","difficulty":"medium","group":"4","data":{"word":"ਹਲਵਾਈ","roman":"halvāī","meaning":"sweet-maker","hint":"People"}},
  {"slug":"medium-037","difficulty":"medium","group":"4","data":{"word":"ਗੁਰਸਿੱਖ","roman":"gursikkh","meaning":"a Sikh of the Guru","hint":"Sikhi"}},
  {"slug":"medium-038","difficulty":"medium","group":"4","data":{"word":"ਗੁਰਬਾਣੀ","roman":"gurbāṇī","meaning":"the Gurus' words, Gurbani","hint":"Sikhi"}},
  {"slug":"medium-039","difficulty":"medium","group":"4","data":{"word":"ਨਿਤਨੇਮ","roman":"nitnem","meaning":"the daily prayers","hint":"Sikhi"}},
  {"slug":"medium-040","difficulty":"medium","group":"4","data":{"word":"ਸਰੋਵਰ","roman":"sarovar","meaning":"the holy pool at a Gurdwara","hint":"Sikhi"}},
  {"slug":"medium-041","difficulty":"medium","group":"4","data":{"word":"ਦਰਬਾਰ","roman":"darbār","meaning":"court; the main hall of a Gurdwara","hint":"Sikhi"}},
  {"slug":"medium-042","difficulty":"medium","group":"4","data":{"word":"ਦਿਲਰੁਬਾ","roman":"dilrubā","meaning":"dilruba, a bowed instrument used in kirtan","hint":"Music"}},
  {"slug":"medium-043","difficulty":"medium","group":"4","data":{"word":"ਅਲਗੋਜ਼ੇ","roman":"algoze","meaning":"algoze, a pair of folk flutes","hint":"Music"}},
  {"slug":"medium-044","difficulty":"medium","group":"4","data":{"word":"ਬਘਿਆੜ","roman":"baghiāṛ","meaning":"wolf","hint":"Animal"}},
  {"slug":"medium-045","difficulty":"medium","group":"4","data":{"word":"ਗਲਹਿਰੀ","roman":"galahirī","meaning":"squirrel","hint":"Animal"}},
  {"slug":"medium-046","difficulty":"medium","group":"4","data":{"word":"ਮਧੂਮੱਖੀ","roman":"madhūmakkhī","meaning":"honeybee","hint":"Animal"}},
  {"slug":"medium-047","difficulty":"medium","group":"4","data":{"word":"ਸਤਰੰਗੀ","roman":"satrangī","meaning":"seven-coloured, like a rainbow","hint":"Colour"}},
  {"slug":"medium-048","difficulty":"medium","group":"4","data":{"word":"ਵਾਹਿਗੁਰੂ","roman":"Vāhigurū","meaning":"Waheguru, God","hint":"Sikhi"}},
  {"slug":"medium-049","difficulty":"medium","group":"4","data":{"word":"ਦਸਵੰਧ","roman":"dasvandh","meaning":"giving a tenth of what you earn","hint":"Sikhi"}},
  {"slug":"medium-050","difficulty":"medium","group":"4","data":{"word":"ਸਰਬੱਤ","roman":"sarbatt","meaning":"all, everyone (as in sarbat da bhala)","hint":"Sikhi"}},
  {"slug":"medium-051","difficulty":"medium","group":"4","data":{"word":"ਮਰਯਾਦਾ","roman":"maryādā","meaning":"the Sikh code of conduct","hint":"Sikhi"}},
  {"slug":"medium-052","difficulty":"medium","group":"4","data":{"word":"ਸੰਗਰਾਂਦ","roman":"sangrānd","meaning":"the first day of a month in the Sikh calendar","hint":"Time"}},
  {"slug":"medium-053","difficulty":"medium","group":"4","data":{"word":"ਗੁਰਗੱਦੀ","roman":"gurgaddī","meaning":"the throne of Guruship","hint":"Sikhi"}},
  {"slug":"medium-054","difficulty":"medium","group":"4","data":{"word":"ਜਥੇਦਾਰ","roman":"jathedār","meaning":"the leader of a group or of a Takht","hint":"Sikhi"}},
  {"slug":"medium-055","difficulty":"medium","group":"4","data":{"word":"ਸੇਵਾਦਾਰ","roman":"sevādār","meaning":"someone who does seva","hint":"Sikhi"}},
  {"slug":"medium-056","difficulty":"medium","group":"4","data":{"word":"ਮਹਿਮਾਨ","roman":"mahimān","meaning":"guest","hint":"People"}},
  {"slug":"medium-057","difficulty":"medium","group":"4","data":{"word":"ਭਰਜਾਈ","roman":"bharjāī","meaning":"brother's wife","hint":"People"}},
  {"slug":"medium-058","difficulty":"medium","group":"4","data":{"word":"ਕਲਾਕਾਰ","roman":"kalākār","meaning":"artist","hint":"People"}},
  {"slug":"medium-059","difficulty":"medium","group":"4","data":{"word":"ਤਰਖਾਣ","roman":"tarkhāṇ","meaning":"carpenter","hint":"People"}},
  {"slug":"medium-060","difficulty":"medium","group":"4","data":{"word":"ਘੁਮਿਆਰ","roman":"ghumiār","meaning":"potter","hint":"People"}},
  {"slug":"medium-061","difficulty":"medium","group":"4","data":{"word":"ਡਾਕਟਰ","roman":"ḍākṭar","meaning":"doctor","hint":"People"}},
  {"slug":"medium-062","difficulty":"medium","group":"4","data":{"word":"ਖੇਤੀਬਾੜੀ","roman":"khetībāṛī","meaning":"farming","hint":"Village"}},
  {"slug":"medium-063","difficulty":"medium","group":"4","data":{"word":"ਸਿਰਹਾਣਾ","roman":"sirhāṇā","meaning":"pillow","hint":"Home"}},
  {"slug":"medium-064","difficulty":"medium","group":"4","data":{"word":"ਤਿਉਹਾਰ","roman":"tiuhār","meaning":"festival","hint":"Festival"}},
  {"slug":"medium-065","difficulty":"medium","group":"4","data":{"word":"ਬਰਾਬਰੀ","roman":"barābarī","meaning":"equality","hint":"Feelings"}},
  {"slug":"medium-066","difficulty":"medium","group":"4","data":{"word":"ਇਨਸਾਫ਼","roman":"insāf","meaning":"justice","hint":"Feelings"}},
  {"slug":"medium-067","difficulty":"medium","group":"4","data":{"word":"ਮੁਸਾਫ਼ਰ","roman":"musāfar","meaning":"traveller","hint":"People"}},
  {"slug":"medium-068","difficulty":"medium","group":"4","data":{"word":"ਸ਼ਰਬਤ","roman":"sharbat","meaning":"a sweet cold drink","hint":"Food"}},
  {"slug":"medium-069","difficulty":"medium","group":"4","data":{"word":"ਗੁਲਗੁਲੇ","roman":"gulgule","meaning":"sweet fried dough balls","hint":"Food"}},
  {"slug":"medium-070","difficulty":"medium","group":"4","data":{"word":"ਮਠਿਆਈ","roman":"maṭhiāī","meaning":"sweets","hint":"Food"}},
  {"slug":"medium-071","difficulty":"medium","group":"4","data":{"word":"ਟਮਾਟਰ","roman":"ṭamāṭar","meaning":"tomato","hint":"Food"}},
  {"slug":"medium-072","difficulty":"medium","group":"4","data":{"word":"ਅਦਰਕ","roman":"adrak","meaning":"ginger","hint":"Food"}},
  {"slug":"medium-073","difficulty":"medium","group":"4","data":{"word":"ਇਲਾਇਚੀ","roman":"ilāichī","meaning":"cardamom","hint":"Food"}},
  {"slug":"medium-074","difficulty":"medium","group":"4","data":{"word":"ਦਾਲਚੀਨੀ","roman":"dālchīnī","meaning":"cinnamon","hint":"Food"}},
  {"slug":"medium-075","difficulty":"medium","group":"4","data":{"word":"ਅਖਰੋਟ","roman":"akhroṭ","meaning":"walnut","hint":"Food"}},
  {"slug":"medium-076","difficulty":"medium","group":"4","data":{"word":"ਕਿਸ਼ਮਿਸ਼","roman":"kishmish","meaning":"raisin","hint":"Food"}},
  {"slug":"medium-077","difficulty":"medium","group":"4","data":{"word":"ਮੂੰਗਫਲੀ","roman":"mūngphalī","meaning":"peanut","hint":"Food"}},
  {"slug":"medium-078","difficulty":"medium","group":"4","data":{"word":"ਅਨਾਨਾਸ","roman":"anānās","meaning":"pineapple","hint":"Food"}},
  {"slug":"medium-079","difficulty":"medium","group":"4","data":{"word":"ਨਨਕਾਣਾ","roman":"Nankāṇā","meaning":"Nankana, where Guru Nanak Dev Ji was born","hint":"Place"}},
  {"slug":"medium-080","difficulty":"medium","group":"4","data":{"word":"ਦਮਦਮਾ","roman":"Damdamā","meaning":"Damdama Sahib, one of the five Takhts","hint":"Place"}},
  {"slug":"medium-081","difficulty":"medium","group":"4","data":{"word":"ਚਮਕੌਰ","roman":"Chamkaur","meaning":"Chamkaur Sahib, a historic town","hint":"Place"}},
  {"slug":"medium-082","difficulty":"medium","group":"4","data":{"word":"ਸਰਹਿੰਦ","roman":"Sarhind","meaning":"Sirhind, a historic town","hint":"Place"}},
  {"slug":"medium-083","difficulty":"medium","group":"4","data":{"word":"ਪਰਾਹੁਣਾ","roman":"parāhuṇā","meaning":"guest","hint":"People"}},
  {"slug":"hard-001","difficulty":"hard","group":"5","data":{"word":"ਗੁਰਦੁਆਰਾ","roman":"gurduārā","meaning":"Gurdwara, \"the Guru's door\"","hint":"Sikhi"}},
  {"slug":"hard-002","difficulty":"hard","group":"5","data":{"word":"ਟਰੈਕਟਰ","roman":"ṭraikṭar","meaning":"tractor","hint":"Village"}},
  {"slug":"hard-003","difficulty":"hard","group":"5","data":{"word":"ਗੁਰਪੁਰਬ","roman":"gurpurab","meaning":"a Guru's day of celebration","hint":"Festival"}},
  {"slug":"hard-004","difficulty":"hard","group":"5","data":{"word":"ਹਰਿਮੰਦਰ","roman":"Harimandar","meaning":"Harimandar Sahib, the Golden Temple","hint":"Sikhi"}},
  {"slug":"hard-005","difficulty":"hard","group":"5","data":{"word":"ਫ਼ਿਰੋਜ਼ਪੁਰ","roman":"Firozpur","meaning":"Firozpur, a city of Punjab","hint":"Place"}},
  {"slug":"hard-006","difficulty":"hard","group":"5","data":{"word":"ਕਪੂਰਥਲਾ","roman":"Kapūrthalā","meaning":"Kapurthala, a city of Punjab","hint":"Place"}},
  {"slug":"hard-007","difficulty":"hard","group":"5","data":{"word":"ਅਨੰਦਪੁਰ","roman":"Anandpur","meaning":"Anandpur Sahib, where the Khalsa was created","hint":"Place"}},
  {"slug":"hard-008","difficulty":"hard","group":"5","data":{"word":"ਹੁਕਮਨਾਮਾ","roman":"hukamnāmā","meaning":"the Guru's order of the day","hint":"Sikhi"}},
  {"slug":"hard-009","difficulty":"hard","group":"5","data":{"word":"ਪਰਕਰਮਾ","roman":"parkarmā","meaning":"the walkway around a Gurdwara","hint":"Sikhi"}},
  {"slug":"hard-010","difficulty":"hard","group":"5","data":{"word":"ਮਗਰਮੱਛ","roman":"magarmachchh","meaning":"crocodile","hint":"Animal"}},
  {"slug":"hard-011","difficulty":"hard","group":"5","data":{"word":"ਚਮਗਿੱਦੜ","roman":"chamgiddaṛ","meaning":"bat","hint":"Animal"}},
  {"slug":"hard-012","difficulty":"hard","group":"5","data":{"word":"ਪੂਰਨਮਾਸ਼ੀ","roman":"pūranmāshī","meaning":"full-moon day","hint":"Time"}},
  {"slug":"hard-013","difficulty":"hard","group":"5","data":{"word":"ਪਹਿਰੇਦਾਰ","roman":"pahiredār","meaning":"guard","hint":"People"}},
  {"slug":"hard-014","difficulty":"hard","group":"5","data":{"word":"ਘੋੜਸਵਾਰ","roman":"ghoṛsavār","meaning":"horse rider","hint":"People"}},
  {"slug":"hard-015","difficulty":"hard","group":"5","data":{"word":"ਅਧਿਆਪਕ","roman":"adhiāpak","meaning":"teacher","hint":"School"}},
  {"slug":"hard-016","difficulty":"hard","group":"5","data":{"word":"ਵਿਦਿਆਰਥੀ","roman":"vidiārthī","meaning":"student","hint":"School"}},
  {"slug":"hard-017","difficulty":"hard","group":"5","data":{"word":"ਚਿੱਤਰਕਾਰ","roman":"chittarkār","meaning":"painter","hint":"People"}},
  {"slug":"hard-018","difficulty":"hard","group":"5","data":{"word":"ਮੁਕਤਸਰ","roman":"Muktsar","meaning":"Sri Muktsar Sahib, a historic town","hint":"Place"}},
  {"slug":"hard-019","difficulty":"hard","group":"5","data":{"word":"ਪਠਾਨਕੋਟ","roman":"Paṭhānkoṭ","meaning":"Pathankot, a city of Punjab","hint":"Place"}},
  {"slug":"hard-020","difficulty":"hard","group":"5","data":{"word":"ਗੋਇੰਦਵਾਲ","roman":"Goindvāl","meaning":"Goindwal Sahib, the town of Guru Amar Das Ji","hint":"Place"}},
  {"slug":"hard-021","difficulty":"hard","group":"5","data":{"word":"ਕੀਰਤਪੁਰ","roman":"Kīratpur","meaning":"Kiratpur Sahib, a town founded by Guru Hargobind Ji","hint":"Place"}},
  {"slug":"hard-022","difficulty":"hard","group":"5","data":{"word":"ਸੂਰਜਮੁਖੀ","roman":"sūrajmukhī","meaning":"sunflower","hint":"Nature"}},
  {"slug":"hard-023","difficulty":"hard","group":"5","data":{"word":"ਦਿਲਚਸਪ","roman":"dilchasp","meaning":"interesting","hint":"Feelings"}},
  {"slug":"hard-024","difficulty":"hard","group":"5","data":{"word":"ਹਰਿਆਵਲ","roman":"hariāval","meaning":"greenery","hint":"Nature"}},
  {"slug":"hard-025","difficulty":"hard","group":"5","data":{"word":"ਜਨਮਦਿਨ","roman":"janamdin","meaning":"birthday","hint":"Time"}},
  {"slug":"hard-026","difficulty":"hard","group":"5","data":{"word":"ਪਰਮਾਤਮਾ","roman":"parmātmā","meaning":"God","hint":"Sikhi"}},
  {"slug":"hard-027","difficulty":"hard","group":"5","data":{"word":"ਗਲਵੱਕੜੀ","roman":"galvakkaṛī","meaning":"a hug","hint":"Feelings"}},
 ],
 "akhaan_jor": [
  {"slug":"easy-01","difficulty":"easy","group":"","data":{"start":"ਉੱਚੀ ਦੁਕਾਨ","end":"ਫਿੱਕਾ ਪਕਵਾਨ","literal":"A tall shop, a tasteless dish.","meaning":"Something that looks grand can turn out to be poor."}},
  {"slug":"easy-02","difficulty":"easy","group":"","data":{"start":"ਦੂਰ ਦੇ ਢੋਲ","end":"ਸੁਹਾਵਣੇ","literal":"Drums sound sweet from far away.","meaning":"Things far away seem better than they really are."}},
  {"slug":"easy-03","difficulty":"easy","group":"","data":{"start":"ਇੱਕ ਅਨਾਰ","end":"ਸੌ ਬਿਮਾਰ","literal":"One pomegranate, a hundred sick people.","meaning":"Too many people want the same one thing."}},
  {"slug":"easy-04","difficulty":"easy","group":"","data":{"start":"ਕਰ ਭਲਾ","end":"ਹੋ ਭਲਾ","literal":"Do good, and good will come to you.","meaning":"Kindness comes back to the one who is kind."}},
  {"slug":"easy-05","difficulty":"easy","group":"","data":{"start":"ਨੌਂ ਨਕਦ","end":"ਨਾ ਤੇਰਾਂ ਉਧਾਰ","literal":"Nine in cash, not thirteen on credit.","meaning":"Something sure today beats more that is only promised."}},
  {"slug":"easy-06","difficulty":"easy","group":"","data":{"start":"ਖੋਦਿਆ ਪਹਾੜ","end":"ਨਿਕਲਿਆ ਚੂਹਾ","literal":"Dug up a mountain, and out came a mouse.","meaning":"A lot of effort for a tiny result."}},
  {"slug":"easy-07","difficulty":"easy","group":"","data":{"start":"ਜਿੱਥੇ ਚਾਹ","end":"ਉੱਥੇ ਰਾਹ","literal":"Where there's a wish, there's a path.","meaning":"Where there's a will, there's a way."}},
  {"slug":"easy-08","difficulty":"easy","group":"","data":{"start":"ਇੱਕ ਪੰਥ","end":"ਦੋ ਕਾਜ","literal":"One trip, two jobs done.","meaning":"Getting two things done with one effort."}},
  {"slug":"easy-09","difficulty":"easy","group":"","data":{"start":"ਜਾਨ ਹੈ","end":"ਤਾਂ ਜਹਾਨ ਹੈ","literal":"If there is life, there is the world.","meaning":"Your life and health come first."}},
  {"slug":"easy-10","difficulty":"easy","group":"","data":{"start":"ਆਪ ਭਲਾ","end":"ਤਾਂ ਜੱਗ ਭਲਾ","literal":"If you are good, the world is good.","meaning":"Good people find goodness everywhere."}},
  {"slug":"easy-11","difficulty":"easy","group":"","data":{"start":"ਇੱਕ ਅਤੇ ਇੱਕ","end":"ਗਿਆਰਾਂ","literal":"One and one make eleven.","meaning":"Together we are much stronger than alone."}},
  {"slug":"easy-12","difficulty":"easy","group":"","data":{"start":"ਸਬਰ ਦਾ ਫਲ","end":"ਮਿੱਠਾ ਹੁੰਦਾ ਹੈ","literal":"The fruit of patience is sweet.","meaning":"Waiting patiently pays off."}},
  {"slug":"medium-01","difficulty":"medium","group":"","data":{"start":"ਨੱਚਣ ਨਾ ਜਾਣੇ","end":"ਵਿਹੜਾ ਟੇਢਾ","literal":"Can't dance, and says the courtyard is crooked.","meaning":"Blaming something else for what you cannot do."}},
  {"slug":"medium-02","difficulty":"medium","group":"","data":{"start":"ਬੂੰਦ ਬੂੰਦ ਕਰਕੇ","end":"ਘੜਾ ਭਰਦਾ ਹੈ","literal":"Drop by drop, the pot fills up.","meaning":"Small efforts add up to something big."}},
  {"slug":"medium-03","difficulty":"medium","group":"","data":{"start":"ਅੱਗ ਲੱਗਣ ਤੇ","end":"ਖੂਹ ਪੁੱਟਣਾ","literal":"Digging a well once the fire has started.","meaning":"Doing something when it is already too late."}},
  {"slug":"medium-04","difficulty":"medium","group":"","data":{"start":"ਹੱਥ ਕੰਗਣ ਨੂੰ","end":"ਆਰਸੀ ਕੀ","literal":"Who needs a mirror to see the bangle on their own hand?","meaning":"What is plain to see needs no proof."}},
  {"slug":"medium-05","difficulty":"medium","group":"","data":{"start":"ਜੈਸਾ ਦੇਸ","end":"ਤੈਸਾ ਭੇਸ","literal":"As the country, so the clothes.","meaning":"Fit in with the ways of the place you are in."}},
  {"slug":"medium-06","difficulty":"medium","group":"","data":{"start":"ਆਪਣੀ ਗਲੀ ਵਿੱਚ","end":"ਕੁੱਤਾ ਵੀ ਸ਼ੇਰ","literal":"In its own lane, even a dog is a lion.","meaning":"Everyone feels brave on home ground."}},
  {"slug":"medium-07","difficulty":"medium","group":"","data":{"start":"ਬਾਂਦਰ ਕੀ ਜਾਣੇ","end":"ਅਦਰਕ ਦਾ ਸੁਆਦ","literal":"What does a monkey know about the taste of ginger?","meaning":"Someone who cannot see the value of a good thing."}},
  {"slug":"medium-08","difficulty":"medium","group":"","data":{"start":"ਸੌ ਸੁਨਿਆਰ ਦੀ","end":"ਇੱਕ ਲੁਹਾਰ ਦੀ","literal":"A hundred taps of the goldsmith, one blow of the blacksmith.","meaning":"One strong effort can beat many small ones."}},
  {"slug":"medium-09","difficulty":"medium","group":"","data":{"start":"ਜਿੰਨੀ ਚਾਦਰ ਹੋਵੇ","end":"ਓਨੇ ਪੈਰ ਪਸਾਰੋ","literal":"Stretch your legs only as far as your sheet goes.","meaning":"Live within your means."}},
  {"slug":"medium-10","difficulty":"medium","group":"","data":{"start":"ਥੋਥਾ ਚਣਾ","end":"ਬਾਜੇ ਘਣਾ","literal":"The empty chickpea pod rattles the loudest.","meaning":"People who know the least often talk the most."}},
  {"slug":"medium-11","difficulty":"medium","group":"","data":{"start":"ਅਕਲ ਵੱਡੀ","end":"ਕਿ ਮੱਝ","literal":"Which is bigger: brains, or a buffalo?","meaning":"Being clever matters more than being big."}},
  {"slug":"medium-12","difficulty":"medium","group":"","data":{"start":"ਜਿਹੋ ਜਿਹਾ ਬੀਜੋਗੇ","end":"ਉਹੋ ਜਿਹਾ ਵੱਢੋਗੇ","literal":"Whatever you sow, that is what you will reap.","meaning":"What you do comes back to you."}},
  {"slug":"medium-13","difficulty":"medium","group":"","data":{"start":"ਤੇਲ ਦੇਖੋ","end":"ਤੇਲ ਦੀ ਧਾਰ ਦੇਖੋ","literal":"Watch the oil, and watch how it pours.","meaning":"Wait and see how things turn out."}},
  {"slug":"medium-14","difficulty":"medium","group":"","data":{"start":"ਜਿਹੜਾ ਬੋਲੇ","end":"ਉਹੀ ਕੁੰਡਾ ਖੋਲ੍ਹੇ","literal":"Whoever speaks up has to open the door.","meaning":"Whoever suggests a job ends up doing it."}},
  {"slug":"medium-15","difficulty":"medium","group":"","data":{"start":"ਕੰਮ ਪਿਆਰਾ ਹੁੰਦਾ ਹੈ","end":"ਚੰਮ ਨਹੀਂ","literal":"It is work that is loved, not skin.","meaning":"People value what you do, not how you look."}},
  {"slug":"medium-16","difficulty":"medium","group":"","data":{"start":"ਹੱਥ ਨਾ ਅੱਪੜੇ","end":"ਥੂਹ ਕੌੜੀ","literal":"Can't reach it, so: yuck, it's bitter!","meaning":"Pretending not to want what you could not get."}},
  {"slug":"hard-01","difficulty":"hard","group":"","data":{"start":"ਘਰ ਦਾ ਭੇਤੀ","end":"ਲੰਕਾ ਢਾਹੇ","literal":"The one who knows the secrets of the house brings down Lanka.","meaning":"Someone on the inside can do the most harm."}},
  {"slug":"hard-02","difficulty":"hard","group":"","data":{"start":"ਜਿਹਦੀ ਲਾਠੀ","end":"ਉਹਦੀ ਮੱਝ","literal":"Whoever holds the stick owns the buffalo.","meaning":"The strong often get their way."}},
  {"slug":"hard-03","difficulty":"hard","group":"","data":{"start":"ਪੱਲੇ ਨਹੀਂ ਧੇਲਾ","end":"ਕਰਦੀ ਮੇਲਾ ਮੇਲਾ","literal":"Not a penny in her pocket, yet she keeps asking to go to the fair.","meaning":"Wanting things you cannot afford."}},
  {"slug":"hard-04","difficulty":"hard","group":"","data":{"start":"ਸਿਰ ਸਲਾਮਤ","end":"ਤਾਂ ਪਗੜੀਆਂ ਬਥੇਰੀਆਂ","literal":"If the head is safe, there are plenty of turbans.","meaning":"Being safe matters most; things can be replaced."}},
  {"slug":"hard-05","difficulty":"hard","group":"","data":{"start":"ਹੱਥਾਂ ਨਾਲ ਦਿੱਤੀਆਂ ਗੰਢਾਂ","end":"ਦੰਦਾਂ ਨਾਲ ਖੋਲ੍ਹਣੀਆਂ ਪੈਂਦੀਆਂ","literal":"Knots tied by hand have to be undone with the teeth.","meaning":"A careless mistake can be very hard to undo."}},
  {"slug":"hard-06","difficulty":"hard","group":"","data":{"start":"ਸਾਂਝੀ ਹਾਂਡੀ","end":"ਚੌਰਾਹੇ ਵਿੱਚ ਭੱਜਦੀ ਹੈ","literal":"A shared pot breaks at the crossroads.","meaning":"When everyone is in charge, nobody takes care."}},
  {"slug":"hard-07","difficulty":"hard","group":"","data":{"start":"ਅੱਧੀ ਛੱਡ ਸਾਰੀ ਨੂੰ ਧਾਵੇ","end":"ਅੱਧੀ ਰਹੇ ਨਾ ਸਾਰੀ ਪਾਵੇ","literal":"Drop the half to chase the whole, and you keep neither.","meaning":"Greed can make you lose what you already have."}},
  {"slug":"hard-08","difficulty":"hard","group":"","data":{"start":"ਇੱਕ ਮੱਛੀ","end":"ਸਾਰੇ ਛੱਪੜ ਨੂੰ ਗੰਦਾ ਕਰਦੀ ਹੈ","literal":"One fish muddies the whole pond.","meaning":"One bad apple can spoil things for everyone."}},
  {"slug":"hard-09","difficulty":"hard","group":"","data":{"start":"ਬਿੱਲੀ ਨੂੰ ਸੁਪਨੇ ਵਿੱਚ ਵੀ","end":"ਛਿੱਛੜੇ","literal":"Even in her dreams, the cat sees scraps of meat.","meaning":"We dream about what we love most."}},
  {"slug":"hard-10","difficulty":"hard","group":"","data":{"start":"ਰੱਸੀ ਸੜ ਗਈ","end":"ਪਰ ਵੱਟ ਨਾ ਗਿਆ","literal":"The rope burned, but its twist stayed.","meaning":"Pride can stay even after everything else is lost."}},
  {"slug":"hard-11","difficulty":"hard","group":"","data":{"start":"ਡਿੱਗੀ ਖੋਤੇ ਤੋਂ","end":"ਗੁੱਸਾ ਘੁਮਿਆਰ ਤੇ","literal":"She fell off the donkey and got angry with the potter.","meaning":"Blaming someone else for your own mishap."}},
  {"slug":"hard-12","difficulty":"hard","group":"","data":{"start":"ਜੇਹੀ ਕੋਕੋ","end":"ਤੇਹੇ ਬੱਚੇ","literal":"Like the mother bird, so her chicks.","meaning":"Children take after their parents."}},
  {"slug":"hard-13","difficulty":"hard","group":"","data":{"start":"ਘਿਓ ਸੁਆਰੇ ਸਾਲਣਾ","end":"ਵੱਡੀ ਬਹੂ ਦਾ ਨਾਂ","literal":"The ghee makes the curry tasty, but the elder daughter-in-law gets the praise.","meaning":"Someone else gets the credit for the work."}},
 ],
 "akhar_barsat": [
  {"slug":"short-001","difficulty":"medium","group":"2","data":{"kind":"word","word":"ਘਰ","roman":"ghar","meaning":"house"}},
  {"slug":"short-002","difficulty":"medium","group":"2","data":{"kind":"word","word":"ਮੋਰ","roman":"mor","meaning":"peacock"}},
  {"slug":"short-003","difficulty":"medium","group":"2","data":{"kind":"word","word":"ਦਾਲ","roman":"dāl","meaning":"lentils"}},
  {"slug":"short-004","difficulty":"medium","group":"2","data":{"kind":"word","word":"ਰੋਟੀ","roman":"roṭī","meaning":"roti"}},
  {"slug":"short-005","difficulty":"medium","group":"2","data":{"kind":"word","word":"ਪਾਣੀ","roman":"pāṇī","meaning":"water"}},
  {"slug":"short-006","difficulty":"medium","group":"2","data":{"kind":"word","word":"ਫੁੱਲ","roman":"phull","meaning":"flower"}},
  {"slug":"short-007","difficulty":"medium","group":"2","data":{"kind":"word","word":"ਸੇਬ","roman":"seb","meaning":"apple"}},
  {"slug":"short-008","difficulty":"medium","group":"2","data":{"kind":"word","word":"ਅੰਬ","roman":"amb","meaning":"mango"}},
  {"slug":"short-009","difficulty":"medium","group":"2","data":{"kind":"word","word":"ਕੇਲਾ","roman":"kelā","meaning":"banana"}},
  {"slug":"short-010","difficulty":"medium","group":"2","data":{"kind":"word","word":"ਤੋਤਾ","roman":"totā","meaning":"parrot"}},
  {"slug":"short-011","difficulty":"medium","group":"2","data":{"kind":"word","word":"ਸ਼ੇਰ","roman":"sher","meaning":"lion"}},
  {"slug":"short-012","difficulty":"medium","group":"2","data":{"kind":"word","word":"ਹਾਥੀ","roman":"hāthī","meaning":"elephant"}},
  {"slug":"short-013","difficulty":"medium","group":"2","data":{"kind":"word","word":"ਬੱਸ","roman":"bass","meaning":"bus"}},
  {"slug":"short-014","difficulty":"medium","group":"2","data":{"kind":"word","word":"ਰੇਲ","roman":"rel","meaning":"train"}},
  {"slug":"short-015","difficulty":"medium","group":"2","data":{"kind":"word","word":"ਮੇਲਾ","roman":"melā","meaning":"fair"}},
  {"slug":"short-016","difficulty":"medium","group":"2","data":{"kind":"word","word":"ਢੋਲ","roman":"ḍhol","meaning":"drum"}},
  {"slug":"short-017","difficulty":"medium","group":"2","data":{"kind":"word","word":"ਖੇਤ","roman":"khet","meaning":"field"}},
  {"slug":"short-018","difficulty":"medium","group":"2","data":{"kind":"word","word":"ਪਿੰਡ","roman":"piṇḍ","meaning":"village"}},
  {"slug":"short-019","difficulty":"medium","group":"2","data":{"kind":"word","word":"ਦੁੱਧ","roman":"duddh","meaning":"milk"}},
  {"slug":"short-020","difficulty":"medium","group":"2","data":{"kind":"word","word":"ਲੱਸੀ","roman":"lassī","meaning":"lassi"}},
  {"slug":"short-021","difficulty":"medium","group":"2","data":{"kind":"word","word":"ਚਾਹ","roman":"chāh","meaning":"tea"}},
  {"slug":"short-022","difficulty":"medium","group":"2","data":{"kind":"word","word":"ਖੀਰ","roman":"khīr","meaning":"rice pudding"}},
  {"slug":"short-023","difficulty":"medium","group":"2","data":{"kind":"word","word":"ਦੀਵਾ","roman":"dīvā","meaning":"oil lamp"}},
  {"slug":"short-024","difficulty":"medium","group":"2","data":{"kind":"word","word":"ਗੁੱਡੀ","roman":"guḍḍī","meaning":"doll"}},
  {"slug":"short-025","difficulty":"medium","group":"2","data":{"kind":"word","word":"ਪਿਤਾ","roman":"pitā","meaning":"father"}},
  {"slug":"short-026","difficulty":"medium","group":"2","data":{"kind":"word","word":"ਭੈਣ","roman":"bhaiṇ","meaning":"sister"}},
  {"slug":"short-027","difficulty":"medium","group":"2","data":{"kind":"word","word":"ਵੀਰ","roman":"vīr","meaning":"brother"}},
  {"slug":"short-028","difficulty":"medium","group":"2","data":{"kind":"word","word":"ਦਾਦੀ","roman":"dādī","meaning":"grandmother"}},
  {"slug":"short-029","difficulty":"medium","group":"2","data":{"kind":"word","word":"ਨਾਨੀ","roman":"nānī","meaning":"mother's mother"}},
  {"slug":"short-030","difficulty":"medium","group":"2","data":{"kind":"word","word":"ਚੰਦ","roman":"chand","meaning":"moon"}},
  {"slug":"short-031","difficulty":"medium","group":"2","data":{"kind":"word","word":"ਤਾਰਾ","roman":"tārā","meaning":"star"}},
  {"slug":"short-032","difficulty":"medium","group":"2","data":{"kind":"word","word":"ਹਵਾ","roman":"havā","meaning":"wind"}},
  {"slug":"short-033","difficulty":"medium","group":"2","data":{"kind":"word","word":"ਮੀਂਹ","roman":"mīnh","meaning":"rain"}},
  {"slug":"short-034","difficulty":"medium","group":"2","data":{"kind":"word","word":"ਫਲ","roman":"phal","meaning":"fruit"}},
  {"slug":"short-035","difficulty":"medium","group":"2","data":{"kind":"word","word":"ਸੋਨਾ","roman":"sonā","meaning":"gold"}},
  {"slug":"short-036","difficulty":"medium","group":"2","data":{"kind":"word","word":"ਕੜਾ","roman":"kaṛā","meaning":"kara, the steel bracelet"}},
  {"slug":"short-037","difficulty":"medium","group":"2","data":{"kind":"word","word":"ਕੰਘਾ","roman":"kanghā","meaning":"kanga, the wooden comb"}},
  {"slug":"short-038","difficulty":"medium","group":"2","data":{"kind":"word","word":"ਕੇਸ","roman":"kes","meaning":"uncut hair"}},
  {"slug":"short-039","difficulty":"medium","group":"2","data":{"kind":"word","word":"ਸੇਵਾ","roman":"sevā","meaning":"selfless service"}},
  {"slug":"short-040","difficulty":"medium","group":"2","data":{"kind":"word","word":"ਬਾਣੀ","roman":"bāṇī","meaning":"Gurbani"}},
  {"slug":"word-001","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਪੰਜਾਬ","roman":"Punjāb","meaning":"Punjab, the land of five rivers"}},
  {"slug":"word-002","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਕਿਤਾਬ","roman":"kitāb","meaning":"book"}},
  {"slug":"word-003","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਕਮਲ","roman":"kamal","meaning":"lotus flower"}},
  {"slug":"word-004","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਸ਼ਹਿਰ","roman":"shahir","meaning":"city"}},
  {"slug":"word-005","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਦਰਿਆ","roman":"dariā","meaning":"river"}},
  {"slug":"word-006","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਬੱਦਲ","roman":"baddal","meaning":"cloud"}},
  {"slug":"word-007","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਸੂਰਜ","roman":"sūraj","meaning":"sun"}},
  {"slug":"word-008","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਕਿਸਾਨ","roman":"kisān","meaning":"farmer"}},
  {"slug":"word-009","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਲੰਗਰ","roman":"langar","meaning":"the free kitchen of the Gurdwara"}},
  {"slug":"word-010","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਸੰਗਤ","roman":"sangat","meaning":"the congregation, people gathered together"}},
  {"slug":"word-011","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਪੰਗਤ","roman":"pangat","meaning":"a row of people sitting together to eat langar"}},
  {"slug":"word-012","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਨਿਸ਼ਾਨ","roman":"nishān","meaning":"flag, sign (as in Nishan Sahib)"}},
  {"slug":"word-013","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਸ਼ਬਦ","roman":"shabad","meaning":"a hymn from Gurbani; also \"word\""}},
  {"slug":"word-014","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਪਤੰਗ","roman":"patang","meaning":"kite"}},
  {"slug":"word-015","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਬਸੰਤ","roman":"basant","meaning":"spring, the kite-flying festival"}},
  {"slug":"word-016","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਭੰਗੜਾ","roman":"bhangṛā","meaning":"bhangra, the lively Punjabi dance"}},
  {"slug":"word-017","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਧਰਤੀ","roman":"dhartī","meaning":"the earth"}},
  {"slug":"word-018","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਜੰਗਲ","roman":"jangal","meaning":"forest"}},
  {"slug":"word-019","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਮਿੱਤਰ","roman":"mittar","meaning":"friend"}},
  {"slug":"word-020","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਕਲਮ","roman":"kalam","meaning":"pen"}},
  {"slug":"word-021","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਅੱਖਰ","roman":"akkhar","meaning":"letter (of the alphabet)"}},
  {"slug":"word-022","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਬਾਂਦਰ","roman":"bāndar","meaning":"monkey"}},
  {"slug":"word-023","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਗਾਜਰ","roman":"gājar","meaning":"carrot"}},
  {"slug":"word-024","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਮਟਰ","roman":"maṭar","meaning":"peas"}},
  {"slug":"word-025","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਅਨਾਰ","roman":"anār","meaning":"pomegranate"}},
  {"slug":"word-026","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਅੰਗੂਰ","roman":"angūr","meaning":"grapes"}},
  {"slug":"word-027","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਮੱਖਣ","roman":"makkhaṇ","meaning":"butter"}},
  {"slug":"word-028","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਚਰਖਾ","roman":"charkhā","meaning":"spinning wheel"}},
  {"slug":"word-029","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਤਬਲਾ","roman":"tablā","meaning":"tabla drums"}},
  {"slug":"word-030","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਸਾਰੰਗੀ","roman":"sārangī","meaning":"sarangi, a bowed string instrument"}},
  {"slug":"word-031","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਬਸਤਾ","roman":"bastā","meaning":"school bag"}},
  {"slug":"word-032","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਸੜਕ","roman":"saṛak","meaning":"road"}},
  {"slug":"word-033","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਹਿਰਨ","roman":"hiran","meaning":"deer"}},
  {"slug":"word-034","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਬੱਕਰੀ","roman":"bakkrī","meaning":"goat"}},
  {"slug":"word-035","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਸਾਗਰ","roman":"sāgar","meaning":"sea"}},
  {"slug":"word-036","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਗੁਟਕਾ","roman":"guṭkā","meaning":"a small prayer book"}},
  {"slug":"word-037","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਪਾਲਕੀ","roman":"pālkī","meaning":"the palanquin that carries Guru Granth Sahib"}},
  {"slug":"word-038","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਰੁਮਾਲਾ","roman":"rumālā","meaning":"the cloth that covers Guru Granth Sahib"}},
  {"slug":"word-039","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਦੀਵਾਲੀ","roman":"dīvālī","meaning":"Diwali, the festival of lights"}},
  {"slug":"word-040","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਵਿਸਾਖੀ","roman":"visākhī","meaning":"Vaisakhi, the harvest festival and birthday of the Khalsa"}},
  {"slug":"word-041","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਲੋਹੜੀ","roman":"lohṛī","meaning":"Lohri, the winter bonfire festival"}},
  {"slug":"word-042","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਗਤਕਾ","roman":"gatkā","meaning":"gatka, the Sikh martial art"}},
  {"slug":"word-043","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਕਬੱਡੀ","roman":"kabaḍḍī","meaning":"kabaddi, a team sport"}},
  {"slug":"word-044","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਖਿਡੌਣਾ","roman":"khiḍauṇā","meaning":"toy"}},
  {"slug":"word-045","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਕਹਾਣੀ","roman":"kahāṇī","meaning":"story"}},
  {"slug":"word-046","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਸੁਪਨਾ","roman":"supnā","meaning":"dream"}},
  {"slug":"word-047","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਤਿਤਲੀ","roman":"titlī","meaning":"butterfly"}},
  {"slug":"word-048","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਕਣਕ","roman":"kaṇak","meaning":"wheat"}},
  {"slug":"word-049","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਕਪਾਹ","roman":"kapāh","meaning":"cotton"}},
  {"slug":"word-050","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਨਹਿਰ","roman":"nahir","meaning":"canal"}},
  {"slug":"word-051","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਪਿੱਪਲ","roman":"pippal","meaning":"peepal tree"}},
  {"slug":"word-052","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਬੋਹੜ","roman":"bohaṛ","meaning":"banyan tree"}},
  {"slug":"word-053","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਸਬਜ਼ੀ","roman":"sabzī","meaning":"vegetables"}},
  {"slug":"word-054","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਤਖ਼ਤ","roman":"takhat","meaning":"throne; one of the five Takhts"}},
  {"slug":"word-055","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਕੇਸਰੀ","roman":"kesarī","meaning":"saffron colour"}},
  {"slug":"word-056","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਰਬਾਬ","roman":"rabāb","meaning":"rabab, the instrument Bhai Mardana played"}},
  {"slug":"word-057","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਚਿਮਟਾ","roman":"chimṭā","meaning":"chimta, a jingling tong instrument"}},
  {"slug":"word-058","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਜੁਗਨੂੰ","roman":"jugnūn","meaning":"firefly"}},
  {"slug":"word-059","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਕਛੂਆ","roman":"kachhūā","meaning":"tortoise"}},
  {"slug":"word-060","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਕੋਇਲ","roman":"koil","meaning":"koel, a singing bird"}},
  {"slug":"word-061","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਬਿਜਲੀ","roman":"bijlī","meaning":"lightning; electricity"}},
  {"slug":"word-062","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਗੁਲਾਬ","roman":"gulāb","meaning":"rose"}},
  {"slug":"word-063","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਜਲੇਬੀ","roman":"jalebī","meaning":"jalebi, a syrupy sweet"}},
  {"slug":"word-064","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਸਮੋਸਾ","roman":"samosā","meaning":"samosa"}},
  {"slug":"word-065","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਬਰਫ਼ੀ","roman":"barfī","meaning":"barfi, a milk sweet"}},
  {"slug":"word-066","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਹਲਦੀ","roman":"haldī","meaning":"turmeric"}},
  {"slug":"word-067","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਮਿਰਚ","roman":"mirch","meaning":"chilli; pepper"}},
  {"slug":"word-068","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਪਿਆਜ਼","roman":"piāz","meaning":"onion"}},
  {"slug":"word-069","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਬਾਦਾਮ","roman":"bādām","meaning":"almond"}},
  {"slug":"word-070","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਰਜਾਈ","roman":"rajāī","meaning":"quilt"}},
  {"slug":"word-071","difficulty":"hard","group":"3","data":{"kind":"word","word":"ਮਹਿੰਦੀ","roman":"mahindī","meaning":"henna"}},
 ],
 "itihaas_timeline": [
  {"slug":"1469-01","difficulty":"easy","group":"gurus","data":{"year":1469,"title":"Guru Nanak Dev Ji is born","title_pa":"ਗੁਰੂ ਨਾਨਕ ਦੇਵ ਜੀ ਦਾ ਜਨਮ","detail":"At Rai Bhoi di Talwandi, now called Nankana Sahib.","tags":["birth"]}},
  {"slug":"1479-02","difficulty":"hard","group":"gurus","data":{"year":1479,"title":"Guru Amar Das Ji is born","title_pa":"ਗੁਰੂ ਅਮਰਦਾਸ ਜੀ ਦਾ ਜਨਮ","detail":"In the village of Basarke, near Amritsar.","tags":["birth"]}},
  {"slug":"1504-03","difficulty":"medium","group":"gurus","data":{"year":1504,"title":"Guru Angad Dev Ji is born","title_pa":"ਗੁਰੂ ਅੰਗਦ ਦੇਵ ਜੀ ਦਾ ਜਨਮ","detail":"He was named Lehna at birth.","tags":["birth"]}},
  {"slug":"1534-04","difficulty":"hard","group":"gurus","data":{"year":1534,"title":"Guru Ram Das Ji is born","title_pa":"ਗੁਰੂ ਰਾਮਦਾਸ ਜੀ ਦਾ ਜਨਮ","detail":"In Lahore. He was named Jetha at birth.","tags":["birth"]}},
  {"slug":"1539-05","difficulty":"easy","group":"gurus","data":{"year":1539,"title":"Guru Angad Dev Ji becomes the second Guru","title_pa":"ਗੁਰੂ ਅੰਗਦ ਦੇਵ ਜੀ ਦੂਜੇ ਗੁਰੂ ਬਣੇ","detail":"Guru Nanak Dev Ji chose him before leaving this world at Kartarpur.","tags":["guruship"]}},
  {"slug":"1552-06","difficulty":"medium","group":"gurus","data":{"year":1552,"title":"Guru Amar Das Ji becomes the third Guru","title_pa":"ਗੁਰੂ ਅਮਰਦਾਸ ਜੀ ਤੀਜੇ ਗੁਰੂ ਬਣੇ","detail":"He was 73 years old.","tags":["guruship"]}},
  {"slug":"1563-07","difficulty":"hard","group":"gurus","data":{"year":1563,"title":"Guru Arjan Dev Ji is born","title_pa":"ਗੁਰੂ ਅਰਜਨ ਦੇਵ ਜੀ ਦਾ ਜਨਮ","detail":"At Goindwal Sahib.","tags":["birth"]}},
  {"slug":"1574-08","difficulty":"medium","group":"gurus","data":{"year":1574,"title":"Guru Ram Das Ji becomes the fourth Guru","title_pa":"ਗੁਰੂ ਰਾਮਦਾਸ ਜੀ ਚੌਥੇ ਗੁਰੂ ਬਣੇ","detail":"He went on to start the city of Ramdaspur, now Amritsar.","tags":["guruship"]}},
  {"slug":"1581-09","difficulty":"medium","group":"gurus","data":{"year":1581,"title":"Guru Arjan Dev Ji becomes the fifth Guru","title_pa":"ਗੁਰੂ ਅਰਜਨ ਦੇਵ ਜੀ ਪੰਜਵੇਂ ਗੁਰੂ ਬਣੇ","detail":"He was the youngest son of Guru Ram Das Ji.","tags":["guruship"]}},
  {"slug":"1588-10","difficulty":"medium","group":"gurus","data":{"year":1588,"title":"The foundation stone of Harmandir Sahib is laid","title_pa":"ਹਰਿਮੰਦਰ ਸਾਹਿਬ ਦੀ ਨੀਂਹ ਰੱਖੀ ਗਈ","detail":"Guru Arjan Dev Ji had it built with four doors, open to all.","tags":[]}},
  {"slug":"1595-11","difficulty":"hard","group":"gurus","data":{"year":1595,"title":"Guru Hargobind Ji is born","title_pa":"ਗੁਰੂ ਹਰਿਗੋਬਿੰਦ ਜੀ ਦਾ ਜਨਮ","detail":"At Guru ki Wadali, near Amritsar.","tags":["birth"]}},
  {"slug":"1604-12","difficulty":"easy","group":"gurus","data":{"year":1604,"title":"The Adi Granth is installed in Harmandir Sahib","title_pa":"ਹਰਿਮੰਦਰ ਸਾਹਿਬ ਵਿਖੇ ਆਦਿ ਗ੍ਰੰਥ ਦਾ ਪਹਿਲਾ ਪ੍ਰਕਾਸ਼","detail":"Baba Buddha Ji was its first Granthi.","tags":[]}},
  {"slug":"1606-13","difficulty":"medium","group":"gurus","data":{"year":1606,"title":"Guru Hargobind Ji builds the Akal Takht","title_pa":"ਅਕਾਲ ਤਖ਼ਤ ਦੀ ਸਥਾਪਨਾ","detail":"Facing Harmandir Sahib, the throne of the Timeless One.","tags":[]}},
  {"slug":"1621-14","difficulty":"hard","group":"gurus","data":{"year":1621,"title":"Guru Tegh Bahadur Ji is born","title_pa":"ਗੁਰੂ ਤੇਗ਼ ਬਹਾਦਰ ਜੀ ਦਾ ਜਨਮ","detail":"In Amritsar, the youngest son of Guru Hargobind Ji.","tags":["birth"]}},
  {"slug":"1630-15","difficulty":"hard","group":"gurus","data":{"year":1630,"title":"Guru Har Rai Ji is born","title_pa":"ਗੁਰੂ ਹਰਿਰਾਇ ਜੀ ਦਾ ਜਨਮ","detail":"At Kiratpur Sahib.","tags":["birth"]}},
  {"slug":"1644-16","difficulty":"medium","group":"gurus","data":{"year":1644,"title":"Guru Har Rai Ji becomes the seventh Guru","title_pa":"ਗੁਰੂ ਹਰਿਰਾਇ ਜੀ ਸੱਤਵੇਂ ਗੁਰੂ ਬਣੇ","detail":"He was the grandson of Guru Hargobind Ji.","tags":["guruship"]}},
  {"slug":"1656-17","difficulty":"hard","group":"gurus","data":{"year":1656,"title":"Guru Har Krishan Ji is born","title_pa":"ਗੁਰੂ ਹਰਿਕ੍ਰਿਸ਼ਨ ਜੀ ਦਾ ਜਨਮ","detail":"At Kiratpur Sahib.","tags":["birth"]}},
  {"slug":"1661-18","difficulty":"medium","group":"gurus","data":{"year":1661,"title":"Guru Har Krishan Ji becomes the eighth Guru","title_pa":"ਗੁਰੂ ਹਰਿਕ੍ਰਿਸ਼ਨ ਜੀ ਅੱਠਵੇਂ ਗੁਰੂ ਬਣੇ","detail":"He was only five years old.","tags":["guruship"]}},
  {"slug":"1664-19","difficulty":"hard","group":"gurus","data":{"year":1664,"title":"Guru Tegh Bahadur Ji becomes the ninth Guru","title_pa":"ਗੁਰੂ ਤੇਗ਼ ਬਹਾਦਰ ਜੀ ਨੌਵੇਂ ਗੁਰੂ ਬਣੇ","detail":"At Baba Bakala.","tags":["guruship"]}},
  {"slug":"1665-20","difficulty":"medium","group":"gurus","data":{"year":1665,"title":"Guru Tegh Bahadur Ji founds Chakk Nanaki (Anandpur Sahib)","title_pa":"ਚੱਕ ਨਾਨਕੀ (ਅਨੰਦਪੁਰ ਸਾਹਿਬ) ਵਸਾਇਆ ਗਿਆ","detail":"Named after his mother, Mata Nanaki Ji.","tags":[]}},
  {"slug":"1666-21","difficulty":"easy","group":"gurus","data":{"year":1666,"title":"Guru Gobind Singh Ji is born","title_pa":"ਗੁਰੂ ਗੋਬਿੰਦ ਸਿੰਘ ਜੀ ਦਾ ਜਨਮ","detail":"In Patna, where Takht Sri Patna Sahib stands today.","tags":["birth"]}},
  {"slug":"1675-22","difficulty":"easy","group":"gurus","data":{"year":1675,"title":"Guru Tegh Bahadur Ji gives his life in Delhi","title_pa":"ਗੁਰੂ ਤੇਗ਼ ਬਹਾਦਰ ਜੀ ਦੀ ਸ਼ਹੀਦੀ","detail":"He stood up for everyone's freedom to follow their own faith.","tags":[]}},
  {"slug":"1699-23","difficulty":"easy","group":"gurus","data":{"year":1699,"title":"Guru Gobind Singh Ji creates the Khalsa","title_pa":"ਖ਼ਾਲਸਾ ਪੰਥ ਦੀ ਸਾਜਨਾ","detail":"On Vaisakhi at Anandpur Sahib, with the Panj Pyare.","tags":[]}},
  {"slug":"1704-24","difficulty":"hard","group":"gurus","data":{"year":1704,"title":"The battle of Chamkaur","title_pa":"ਚਮਕੌਰ ਦੀ ਜੰਗ","detail":"The two elder Sahibzade gave their lives here.","tags":[]}},
  {"slug":"1708-25","difficulty":"easy","group":"gurus","data":{"year":1708,"title":"Guru Granth Sahib is named the Guru for ever","title_pa":"ਗੁਰੂ ਗ੍ਰੰਥ ਸਾਹਿਬ ਨੂੰ ਗੁਰਗੱਦੀ","detail":"Guru Gobind Singh Ji did this at Nanded.","tags":[]}},
  {"slug":"1710-26","difficulty":"medium","group":"empire","data":{"year":1710,"title":"Banda Singh Bahadur takes Sirhind","title_pa":"ਬਾਬਾ ਬੰਦਾ ਸਿੰਘ ਬਹਾਦਰ ਦੀ ਸਰਹਿੰਦ ਫ਼ਤਹਿ","detail":"After the battle of Chappar Chiri.","tags":[]}},
  {"slug":"1716-27","difficulty":"medium","group":"empire","data":{"year":1716,"title":"Banda Singh Bahadur gives his life in Delhi","title_pa":"ਬਾਬਾ ਬੰਦਾ ਸਿੰਘ ਬਹਾਦਰ ਦੀ ਸ਼ਹੀਦੀ","detail":"He would not give up his faith.","tags":[]}},
  {"slug":"1748-28","difficulty":"hard","group":"empire","data":{"year":1748,"title":"The Dal Khalsa is formed","title_pa":"ਦਲ ਖ਼ਾਲਸਾ ਦੀ ਸਥਾਪਨਾ","detail":"The Sikh bands (misls) joined into one army at Amritsar.","tags":[]}},
  {"slug":"1765-29","difficulty":"hard","group":"empire","data":{"year":1765,"title":"The Sikhs take Lahore","title_pa":"ਸਿੱਖਾਂ ਨੇ ਲਾਹੌਰ ਜਿੱਤਿਆ","detail":"They struck coins in the name of the Gurus.","tags":[]}},
  {"slug":"1780-30","difficulty":"medium","group":"empire","data":{"year":1780,"title":"Ranjit Singh is born","title_pa":"ਮਹਾਰਾਜਾ ਰਣਜੀਤ ਸਿੰਘ ਦਾ ਜਨਮ","detail":"In Gujranwala, now in Pakistan.","tags":[]}},
  {"slug":"1783-31","difficulty":"hard","group":"empire","data":{"year":1783,"title":"Baba Baghel Singh reaches Delhi","title_pa":"ਬਾਬਾ ਬਘੇਲ ਸਿੰਘ ਦਿੱਲੀ ਪਹੁੰਚੇ","detail":"He then had Gurdwaras built at places linked to the Gurus in Delhi.","tags":[]}},
  {"slug":"1799-32","difficulty":"medium","group":"empire","data":{"year":1799,"title":"Ranjit Singh takes Lahore","title_pa":"ਰਣਜੀਤ ਸਿੰਘ ਨੇ ਲਾਹੌਰ ਲਿਆ","detail":"He was still a teenager.","tags":[]}},
  {"slug":"1801-33","difficulty":"easy","group":"empire","data":{"year":1801,"title":"Ranjit Singh is crowned Maharaja of Punjab","title_pa":"ਮਹਾਰਾਜਾ ਰਣਜੀਤ ਸਿੰਘ ਦੀ ਤਾਜਪੋਸ਼ੀ","detail":"On Vaisakhi, in Lahore.","tags":[]}},
  {"slug":"1802-34","difficulty":"hard","group":"empire","data":{"year":1802,"title":"Maharaja Ranjit Singh takes Amritsar","title_pa":"ਮਹਾਰਾਜਾ ਰਣਜੀਤ ਸਿੰਘ ਨੇ ਅੰਮ੍ਰਿਤਸਰ ਲਿਆ","detail":"Amritsar became the spiritual centre of his kingdom.","tags":[]}},
  {"slug":"1813-35","difficulty":"hard","group":"empire","data":{"year":1813,"title":"The Koh-i-Noor diamond comes to Maharaja Ranjit Singh","title_pa":"ਕੋਹਿਨੂਰ ਹੀਰਾ ਮਹਾਰਾਜਾ ਰਣਜੀਤ ਸਿੰਘ ਕੋਲ ਆਇਆ","detail":"Shah Shuja of Afghanistan handed it over in Lahore.","tags":[]}},
  {"slug":"1830-36","difficulty":"hard","group":"empire","data":{"year":1830,"title":"Harmandir Sahib is covered in gold","title_pa":"ਹਰਿਮੰਦਰ ਸਾਹਿਬ ਉੱਤੇ ਸੋਨਾ ਚੜ੍ਹਾਇਆ ਗਿਆ","detail":"Maharaja Ranjit Singh paid for the gold; it is why people call it the Golden Temple.","tags":[]}},
  {"slug":"1837-37","difficulty":"hard","group":"empire","data":{"year":1837,"title":"Hari Singh Nalwa falls at Jamrud","title_pa":"ਹਰੀ ਸਿੰਘ ਨਲੂਆ ਦੀ ਸ਼ਹੀਦੀ","detail":"He was guarding the North-West Frontier.","tags":[]}},
  {"slug":"1839-38","difficulty":"medium","group":"empire","data":{"year":1839,"title":"Maharaja Ranjit Singh dies","title_pa":"ਮਹਾਰਾਜਾ ਰਣਜੀਤ ਸਿੰਘ ਦਾ ਦੇਹਾਂਤ","detail":"His samadhi is in Lahore.","tags":[]}},
  {"slug":"1849-39","difficulty":"easy","group":"modern","data":{"year":1849,"title":"The British take over Punjab","title_pa":"ਅੰਗਰੇਜ਼ਾਂ ਨੇ ਪੰਜਾਬ ਉੱਤੇ ਕਬਜ਼ਾ ਕੀਤਾ","detail":"The Sikh Empire ended after two Anglo-Sikh wars.","tags":[]}},
  {"slug":"1873-40","difficulty":"medium","group":"modern","data":{"year":1873,"title":"The Singh Sabha movement begins","title_pa":"ਸਿੰਘ ਸਭਾ ਲਹਿਰ ਸ਼ੁਰੂ ਹੋਈ","detail":"In Amritsar, to bring Sikhs back to the Gurus’ teachings and to education.","tags":[]}},
  {"slug":"1892-41","difficulty":"hard","group":"modern","data":{"year":1892,"title":"Khalsa College, Amritsar, is founded","title_pa":"ਖ਼ਾਲਸਾ ਕਾਲਜ ਅੰਮ੍ਰਿਤਸਰ ਦੀ ਸਥਾਪਨਾ","detail":"One of the oldest colleges in Punjab.","tags":[]}},
  {"slug":"1897-42","difficulty":"hard","group":"modern","data":{"year":1897,"title":"The battle of Saragarhi","title_pa":"ਸਾਰਾਗੜ੍ਹੀ ਦੀ ਲੜਾਈ","detail":"21 Sikh soldiers held their post to the very end.","tags":[]}},
  {"slug":"1914-43","difficulty":"medium","group":"modern","data":{"year":1914,"title":"The Komagata Maru ship reaches Vancouver","title_pa":"ਕਾਮਾਗਾਟਾ ਮਾਰੂ ਜਹਾਜ਼ ਵੈਨਕੂਵਰ ਪਹੁੰਚਿਆ","detail":"Most of its Punjabi passengers were not allowed into Canada.","tags":[]}},
  {"slug":"1920-44","difficulty":"medium","group":"modern","data":{"year":1920,"title":"The SGPC is formed","title_pa":"ਸ਼੍ਰੋਮਣੀ ਗੁਰਦੁਆਰਾ ਪ੍ਰਬੰਧਕ ਕਮੇਟੀ ਬਣੀ","detail":"To look after the historic Gurdwaras.","tags":[]}},
  {"slug":"1925-45","difficulty":"hard","group":"modern","data":{"year":1925,"title":"The Sikh Gurdwaras Act is passed","title_pa":"ਸਿੱਖ ਗੁਰਦੁਆਰਾ ਐਕਟ ਪਾਸ ਹੋਇਆ","detail":"It handed the historic Gurdwaras over to the Sikh community.","tags":[]}},
  {"slug":"1947-46","difficulty":"easy","group":"modern","data":{"year":1947,"title":"Punjab is divided","title_pa":"ਪੰਜਾਬ ਦੀ ਵੰਡ","detail":"At the Partition of India, between India and Pakistan.","tags":[]}},
  {"slug":"1966-47","difficulty":"medium","group":"modern","data":{"year":1966,"title":"Punjabi Suba: today’s Punjab state is formed","title_pa":"ਪੰਜਾਬੀ ਸੂਬਾ ਬਣਿਆ","detail":"A state where Punjabi is the main language.","tags":[]}},
  {"slug":"1999-48","difficulty":"hard","group":"modern","data":{"year":1999,"title":"300 years of the Khalsa are celebrated","title_pa":"ਖ਼ਾਲਸਾ ਪੰਥ ਦੀ ਤੀਜੀ ਸ਼ਤਾਬਦੀ","detail":"Huge celebrations at Anandpur Sahib.","tags":[]}},
  {"slug":"2019-49","difficulty":"easy","group":"modern","data":{"year":2019,"title":"The Kartarpur Corridor opens","title_pa":"ਕਰਤਾਰਪੁਰ ਲਾਂਘਾ ਖੁੱਲ੍ਹਿਆ","detail":"For the 550th Gurpurab of Guru Nanak Dev Ji, linking Dera Baba Nanak to Kartarpur Sahib.","tags":[]}},
 ],
 "kaun_hai": [
  {"slug":"guru-nanak-dev-ji","difficulty":"easy","group":"guru","data":{"name":"Guru Nanak Dev Ji","name_pa":"ਗੁਰੂ ਨਾਨਕ ਦੇਵ ਜੀ","kind":"guru","clues":["He worked as a storekeeper in Sultanpur Lodhi.","He made long journeys called udasis, travelling with Bhai Mardana.","In his last years he farmed at Kartarpur, a town he started on the river Ravi.","He was born in 1469 and was the first Sikh Guru."],"fact":"His Gurpurab is celebrated on the full-moon day of Katak (October or November).","female":false}},
  {"slug":"guru-angad-dev-ji","difficulty":"easy","group":"guru","data":{"name":"Guru Angad Dev Ji","name_pa":"ਗੁਰੂ ਅੰਗਦ ਦੇਵ ਜੀ","kind":"guru","clues":["He encouraged young people to keep fit, with wrestling at Khadur Sahib.","He made the Gurmukhi script popular, so everyone could learn to read and write it.","Before he became Guru he was called Bhai Lehna.","He was the second Sikh Guru."],"fact":"His wife, Mata Khivi Ji, looked after the langar at Khadur Sahib.","female":false}},
  {"slug":"guru-amar-das-ji","difficulty":"easy","group":"guru","data":{"name":"Guru Amar Das Ji","name_pa":"ਗੁਰੂ ਅਮਰਦਾਸ ਜੀ","kind":"guru","clues":["He became Guru when he was 73 years old.","He had a baoli, a well with steps down to the water, built at Goindwal Sahib.","Everyone who came to see him, even the emperor Akbar, first sat in the pangat and ate langar.","He was the third Sikh Guru."],"fact":"He trained preachers, women among them, to share the Gurus’ teachings.","female":false}},
  {"slug":"guru-ram-das-ji","difficulty":"easy","group":"guru","data":{"name":"Guru Ram Das Ji","name_pa":"ਗੁਰੂ ਰਾਮਦਾਸ ਜੀ","kind":"guru","clues":["Before he became Guru he was called Bhai Jetha.","He wrote the Laavan, the four verses of the Sikh wedding, Anand Karaj.","He started the city of Ramdaspur, which is now called Amritsar.","He was the fourth Sikh Guru."],"fact":"He was married to Bibi Bhani Ji, the daughter of Guru Amar Das Ji.","female":false}},
  {"slug":"guru-arjan-dev-ji","difficulty":"easy","group":"guru","data":{"name":"Guru Arjan Dev Ji","name_pa":"ਗੁਰੂ ਅਰਜਨ ਦੇਵ ਜੀ","kind":"guru","clues":["He wrote Sukhmani Sahib, the prayer of peace.","He had Harmandir Sahib built with four doors, open to people from every direction.","In 1604 he installed the Adi Granth in Harmandir Sahib.","He was the fifth Sikh Guru."],"fact":"He is remembered as Shaheedan de Sirtaj, the crown of the martyrs.","female":false}},
  {"slug":"guru-hargobind-ji","difficulty":"easy","group":"guru","data":{"name":"Guru Hargobind Ji","name_pa":"ਗੁਰੂ ਹਰਿਗੋਬਿੰਦ ਜੀ","kind":"guru","clues":["Bandi Chhor Divas remembers his release from Gwalior fort, together with 52 kings.","He wore two swords, called Miri and Piri.","In 1606 he built the Akal Takht, facing Harmandir Sahib.","He was the sixth Sikh Guru."],"fact":"He kept horses and trained Sikhs to defend the weak.","female":false}},
  {"slug":"guru-har-rai-ji","difficulty":"easy","group":"guru","data":{"name":"Guru Har Rai Ji","name_pa":"ਗੁਰੂ ਹਰਿਰਾਇ ਜੀ","kind":"guru","clues":["He kept a large herb garden and a place for medicines at Kiratpur Sahib.","He was very gentle with plants and animals.","He was the grandson of Guru Hargobind Ji.","He was the seventh Sikh Guru."],"fact":"Medicine from his garden is said to have healed Dara Shikoh, the emperor’s son.","female":false}},
  {"slug":"guru-har-krishan-ji","difficulty":"easy","group":"guru","data":{"name":"Guru Har Krishan Ji","name_pa":"ਗੁਰੂ ਹਰਿਕ੍ਰਿਸ਼ਨ ਜੀ","kind":"guru","clues":["He became Guru when he was only five years old.","In Delhi he looked after people who had smallpox and cholera.","Gurdwara Bangla Sahib in Delhi stands where he stayed.","He was the eighth Sikh Guru, and the youngest of all."],"fact":"People still take water from the sarovar at Bangla Sahib.","female":false}},
  {"slug":"guru-tegh-bahadur-ji","difficulty":"easy","group":"guru","data":{"name":"Guru Tegh Bahadur Ji","name_pa":"ਗੁਰੂ ਤੇਗ਼ ਬਹਾਦਰ ਜੀ","kind":"guru","clues":["As a boy he was called Tyag Mal; his new name means \"brave of the sword\".","He founded the town of Chakk Nanaki, which grew into Anandpur Sahib.","In 1675 he gave his life in Delhi so that people could follow their own faith.","He was the ninth Sikh Guru."],"fact":"Gurdwara Sis Ganj Sahib in Delhi marks the place of his martyrdom.","female":false}},
  {"slug":"guru-gobind-singh-ji","difficulty":"easy","group":"guru","data":{"name":"Guru Gobind Singh Ji","name_pa":"ਗੁਰੂ ਗੋਬਿੰਦ ਸਿੰਘ ਜੀ","kind":"guru","clues":["He was born in Patna in 1666.","He was a great poet and wrote Jaap Sahib.","On Vaisakhi in 1699, at Anandpur Sahib, he created the Khalsa.","He was the tenth Sikh Guru."],"fact":"In 1708 he named Guru Granth Sahib the Guru for ever.","female":false}},
  {"slug":"mai-bhago-ji","difficulty":"easy","group":"hero","data":{"name":"Mai Bhago Ji","name_pa":"ਮਾਈ ਭਾਗੋ ਜੀ","kind":"hero","clues":["She came from the village of Jhabal, near Amritsar.","She persuaded forty Sikhs who had left Guru Gobind Singh Ji to go back and stand by him.","She fought at Khidrana, the place now called Sri Muktsar Sahib.","She is honoured as a brave Sikh woman warrior."],"fact":"Those forty Sikhs are remembered as the Chali Mukte, the forty liberated ones.","female":true}},
  {"slug":"baba-deep-singh-ji","difficulty":"easy","group":"hero","data":{"name":"Baba Deep Singh Ji","name_pa":"ਬਾਬਾ ਦੀਪ ਸਿੰਘ ਜੀ","kind":"hero","clues":["He was a scholar who wrote out copies of Guru Granth Sahib at Damdama Sahib.","He was the leader of the Shaheedan Misl.","In 1757, at about 75 years of age, he set out to free Harmandir Sahib.","He vowed to reach Harmandir Sahib, and he kept his promise even after he was badly wounded."],"fact":"Gurdwara Shaheed Ganj Baba Deep Singh Ji in Amritsar honours him.","female":false}},
  {"slug":"maharaja-ranjit-singh","difficulty":"easy","group":"ruler","data":{"name":"Maharaja Ranjit Singh","name_pa":"ਮਹਾਰਾਜਾ ਰਣਜੀਤ ਸਿੰਘ","kind":"ruler","clues":["As a child he lost the sight of one eye to smallpox.","He took the city of Lahore in 1799.","He had Harmandir Sahib covered in gold.","He was crowned in 1801 and called Sher-e-Punjab, the Lion of Punjab."],"fact":"His kingdom stretched from the Khyber Pass to the river Sutlej.","female":false}},
  {"slug":"bhai-mardana-ji","difficulty":"easy","group":"family","data":{"name":"Bhai Mardana Ji","name_pa":"ਭਾਈ ਮਰਦਾਨਾ ਜੀ","kind":"family","clues":["He was a Muslim musician from Talwandi.","He played the rabab.","He travelled with Guru Nanak Dev Ji on all his long journeys.","He played music while Guru Nanak Dev Ji sang; they were friends for life."],"fact":"Rababi musicians went on singing kirtan in the Gurus’ courts after him.","female":false}},
  {"slug":"baba-buddha-ji","difficulty":"medium","group":"family","data":{"name":"Baba Buddha Ji","name_pa":"ਬਾਬਾ ਬੁੱਢਾ ਜੀ","kind":"family","clues":["He lived for about 125 years, in the time of six Gurus.","He placed the tilak on the forehead of several new Gurus.","Guru Arjan Dev Ji made him the first Granthi of Harmandir Sahib, in 1604.","As a boy he spoke so wisely to Guru Nanak Dev Ji that he was called \"the old one\"."],"fact":"Gurdwara Bir Baba Buddha Sahib, near Amritsar, is named after him.","female":false}},
  {"slug":"mata-gujri-ji","difficulty":"medium","group":"family","data":{"name":"Mata Gujri Ji","name_pa":"ਮਾਤਾ ਗੁਜਰੀ ਜੀ","kind":"family","clues":["She was born in Kartarpur, near Jalandhar.","She was married to Guru Tegh Bahadur Ji.","In the winter of 1704 she looked after her two youngest grandsons in the cold tower at Sirhind.","She was the mother of Guru Gobind Singh Ji."],"fact":"Gurdwara Thanda Burj Sahib at Fatehgarh Sahib honours her.","female":true}},
  {"slug":"bhai-kanhaiya-ji","difficulty":"medium","group":"hero","data":{"name":"Bhai Kanhaiya Ji","name_pa":"ਭਾਈ ਘਨੱਈਆ ਜੀ","kind":"hero","clues":["He was a Sikh of Guru Tegh Bahadur Ji and Guru Gobind Singh Ji.","During the battles at Anandpur he carried water in a leather bag called a mashk.","He gave water to wounded soldiers on both sides.","Guru Gobind Singh Ji praised him and gave him ointment to treat the wounded as well."],"fact":"He is remembered for caring for everyone, long before the Red Cross did the same.","female":false}},
  {"slug":"mata-khivi-ji","difficulty":"medium","group":"family","data":{"name":"Mata Khivi Ji","name_pa":"ਮਾਤਾ ਖੀਵੀ ਜੀ","kind":"family","clues":["She was married to Guru Angad Dev Ji.","She is the only woman named in Guru Granth Sahib, in a vaar by Satta and Balwand.","She looked after the langar at Khadur Sahib.","Her langar was famous for its kheer, and she is remembered as a mother of langar."],"fact":"She made sure everyone who came to Khadur Sahib was fed with love.","female":true}},
  {"slug":"hari-singh-nalwa","difficulty":"medium","group":"hero","data":{"name":"Hari Singh Nalwa","name_pa":"ਹਰੀ ਸਿੰਘ ਨਲੂਆ","kind":"hero","clues":["He was a general in Maharaja Ranjit Singh’s army.","The town of Haripur, in today’s Pakistan, is named after him.","As a young man he is said to have fought a tiger.","He guarded the North-West Frontier and fell at Jamrud in 1837."],"fact":"He served as governor of Kashmir and of Peshawar.","female":false}},
  {"slug":"banda-singh-bahadur","difficulty":"medium","group":"hero","data":{"name":"Banda Singh Bahadur","name_pa":"ਬਾਬਾ ਬੰਦਾ ਸਿੰਘ ਬਹਾਦਰ","kind":"hero","clues":["Before he met Guru Gobind Singh Ji he was a hermit called Madho Das.","He met Guru Gobind Singh Ji at Nanded in 1708.","He set up his capital at Lohgarh and struck coins in the Gurus’ names.","He led the Khalsa to victory at Sirhind in 1710."],"fact":"He gave land to the farmers who worked it.","female":false}},
  {"slug":"bhai-gurdas-ji","difficulty":"medium","group":"writer","data":{"name":"Bhai Gurdas Ji","name_pa":"ਭਾਈ ਗੁਰਦਾਸ ਜੀ","kind":"writer","clues":["Besides Punjabi, he wrote poems in Braj Bhasha.","Guru Arjan Dev Ji called his writings the key to understanding Gurbani.","He wrote 40 vaars, long poems about Sikhi.","He was the scribe who wrote out the Adi Granth in 1604."],"fact":"His vaars may be sung in Gurdwaras alongside Gurbani.","female":false}},
  {"slug":"milkha-singh","difficulty":"medium","group":"hero","data":{"name":"Milkha Singh","name_pa":"ਮਿਲਖਾ ਸਿੰਘ","kind":"hero","clues":["He was born in a village in western Punjab before Partition.","He won gold at the 1958 Commonwealth Games.","He came fourth in the 400 metres at the 1960 Olympics in Rome.","He was called the Flying Sikh."],"fact":"The film \"Bhaag Milkha Bhaag\" tells his story.","female":false}},
  {"slug":"bhagat-puran-singh","difficulty":"medium","group":"hero","data":{"name":"Bhagat Puran Singh","name_pa":"ਭਗਤ ਪੂਰਨ ਸਿੰਘ","kind":"hero","clues":["He was born in 1904.","He spoke up for trees, clean air and the environment long before most people did.","For many years he carried a disabled boy called Piara on his back.","He founded Pingalwara in Amritsar, a home for people nobody else would care for."],"fact":"Pingalwara still cares for hundreds of people today.","female":false}},
  {"slug":"jassa-singh-ahluwalia","difficulty":"hard","group":"ruler","data":{"name":"Jassa Singh Ahluwalia","name_pa":"ਜੱਸਾ ਸਿੰਘ ਆਹਲੂਵਾਲੀਆ","kind":"ruler","clues":["As a boy he was looked after by Mata Sundri Ji, the wife of Guru Gobind Singh Ji.","He was given the title Sultan-ul-Qaum, king of the nation.","In 1764 he laid the foundation stone for rebuilding Harmandir Sahib.","He led the Dal Khalsa, and the Ahluwalia Misl is named after his village."],"fact":"His misl later ruled the state of Kapurthala.","female":false}},
  {"slug":"jassa-singh-ramgarhia","difficulty":"hard","group":"ruler","data":{"name":"Jassa Singh Ramgarhia","name_pa":"ਜੱਸਾ ਸਿੰਘ ਰਾਮਗੜ੍ਹੀਆ","kind":"ruler","clues":["He came from a family of carpenters.","He rebuilt the fort of Ram Rauni at Amritsar, which was renamed Ramgarh.","His misl was named after that fort.","The Ramgarhia Bunga, the tall towers beside Harmandir Sahib, are named after his misl."],"fact":"In 1783 his forces reached Delhi; a stone slab brought back from there is kept at the Ramgarhia Bunga.","female":false}},
  {"slug":"amrita-pritam","difficulty":"hard","group":"writer","data":{"name":"Amrita Pritam","name_pa":"ਅੰਮ੍ਰਿਤਾ ਪ੍ਰੀਤਮ","kind":"writer","clues":["She was born in Gujranwala in 1919.","She was the first woman to win the Sahitya Akademi Award, in 1956.","She wrote the novel \"Pinjar\".","Her poem \"Ajj Aakhaan Waris Shah Nu\" mourns the Partition of Punjab."],"fact":"She wrote more than a hundred books in Punjabi.","female":true}},
  {"slug":"waris-shah","difficulty":"hard","group":"writer","data":{"name":"Waris Shah","name_pa":"ਵਾਰਿਸ ਸ਼ਾਹ","kind":"writer","clues":["He lived in the 1700s.","He studied at Kasur.","His tomb is at Jandiala Sher Khan, near Sheikhupura.","He wrote the best-loved telling of the story of Heer and Ranjha."],"fact":"People still sing his Heer at melas across Punjab.","female":false}},
  {"slug":"baba-farid","difficulty":"hard","group":"writer","data":{"name":"Baba Farid","name_pa":"ਬਾਬਾ ਫ਼ਰੀਦ","kind":"writer","clues":["He was a Sufi saint who lived about 800 years ago.","The city of Faridkot is named after him.","He is called the first great poet of the Punjabi language.","His shaloks are part of Guru Granth Sahib."],"fact":"His shrine is at Pakpattan, in today’s Pakistan.","female":false}},
  {"slug":"bhai-vir-singh","difficulty":"hard","group":"writer","data":{"name":"Bhai Vir Singh","name_pa":"ਭਾਈ ਵੀਰ ਸਿੰਘ","kind":"writer","clues":["He was born in Amritsar in 1872.","He helped start the Khalsa Tract Society.","His novel \"Sundari\" was one of the first Punjabi novels.","He is called the father of modern Punjabi literature."],"fact":"He also wrote the long poem \"Rana Surat Singh\".","female":false}},
  {"slug":"maharani-jind-kaur","difficulty":"hard","group":"ruler","data":{"name":"Maharani Jind Kaur","name_pa":"ਮਹਾਰਾਣੀ ਜਿੰਦ ਕੌਰ","kind":"ruler","clues":["She ruled Punjab for her young son, as regent.","She escaped from Chunar fort in disguise and reached Nepal.","Years later she was together with her son again, and went with him to England.","She was the youngest wife of Maharaja Ranjit Singh and the mother of the last Maharaja."],"fact":"She is remembered for standing up to the British.","female":true}},
  {"slug":"maharaja-duleep-singh","difficulty":"hard","group":"ruler","data":{"name":"Maharaja Duleep Singh","name_pa":"ਮਹਾਰਾਜਾ ਦਲੀਪ ਸਿੰਘ","kind":"ruler","clues":["He became Maharaja when he was five years old.","After the British took Punjab in 1849 he was sent away, and he later lived in England.","He had to hand over the Koh-i-Noor diamond.","He was the last Maharaja of the Sikh Empire."],"fact":"He was the youngest son of Maharaja Ranjit Singh.","female":false}},
  {"slug":"shaheed-bhagat-singh","difficulty":"hard","group":"hero","data":{"name":"Shaheed Bhagat Singh","name_pa":"ਸ਼ਹੀਦ ਭਗਤ ਸਿੰਘ","kind":"hero","clues":["He was born in 1907 in Banga, in Lyallpur district, now in Pakistan.","His family’s village is Khatkar Kalan, in Punjab.","As a young man he joined the fight to free India from British rule.","He gave his life for India’s freedom in 1931, at the age of 23."],"fact":"A district of Punjab, Shaheed Bhagat Singh Nagar, is named after him.","female":false}},
 ],
 "map_quest": [
  {"slug":"amritsar","difficulty":"easy","group":"cities","data":{"name":"Amritsar","name_pa":"ਅੰਮ੍ਰਿਤਸਰ","lat":31.634,"lng":74.872,"fact":"Home of Sri Harmandir Sahib, the Golden Temple."}},
  {"slug":"ludhiana","difficulty":"easy","group":"cities","data":{"name":"Ludhiana","name_pa":"ਲੁਧਿਆਣਾ","lat":30.901,"lng":75.857,"fact":"The biggest city of Punjab, famous for bicycles and woollens."}},
  {"slug":"jalandhar","difficulty":"easy","group":"cities","data":{"name":"Jalandhar","name_pa":"ਜਲੰਧਰ","lat":31.326,"lng":75.576,"fact":"One of the oldest cities of Punjab, known for its sports goods."}},
  {"slug":"patiala","difficulty":"easy","group":"cities","data":{"name":"Patiala","name_pa":"ਪਟਿਆਲਾ","lat":30.34,"lng":76.386,"fact":"A royal city, famous for the Patiala salwar and pagg."}},
  {"slug":"bathinda","difficulty":"easy","group":"cities","data":{"name":"Bathinda","name_pa":"ਬਠਿੰਡਾ","lat":30.211,"lng":74.945,"fact":"It has one of the oldest forts in India, Qila Mubarak."}},
  {"slug":"chandigarh","difficulty":"easy","group":"cities","data":{"name":"Chandigarh","name_pa":"ਚੰਡੀਗੜ੍ਹ","lat":30.733,"lng":76.779,"fact":"The capital of Punjab, a city planned with sectors and gardens."}},
  {"slug":"pathankot","difficulty":"easy","group":"towns","data":{"name":"Pathankot","name_pa":"ਪਠਾਨਕੋਟ","lat":32.264,"lng":75.642,"fact":"Near the hills, where Punjab meets Himachal Pradesh and Jammu and Kashmir."}},
  {"slug":"hoshiarpur","difficulty":"easy","group":"towns","data":{"name":"Hoshiarpur","name_pa":"ਹੁਸ਼ਿਆਰਪੁਰ","lat":31.532,"lng":75.917,"fact":"Known for its wooden inlay work."}},
  {"slug":"firozpur","difficulty":"easy","group":"towns","data":{"name":"Firozpur","name_pa":"ਫ਼ਿਰੋਜ਼ਪੁਰ","lat":30.933,"lng":74.613,"fact":"A border city on the river Sutlej."}},
  {"slug":"moga","difficulty":"easy","group":"towns","data":{"name":"Moga","name_pa":"ਮੋਗਾ","lat":30.817,"lng":75.17,"fact":"A farming town in the middle of the Malwa region."}},
  {"slug":"sangrur","difficulty":"easy","group":"towns","data":{"name":"Sangrur","name_pa":"ਸੰਗਰੂਰ","lat":30.245,"lng":75.842,"fact":"Once the capital of the Jind state."}},
  {"slug":"gurdaspur","difficulty":"easy","group":"towns","data":{"name":"Gurdaspur","name_pa":"ਗੁਰਦਾਸਪੁਰ","lat":32.041,"lng":75.403,"fact":"In the Majha region, between the rivers Ravi and Beas."}},
  {"slug":"kapurthala","difficulty":"easy","group":"towns","data":{"name":"Kapurthala","name_pa":"ਕਪੂਰਥਲਾ","lat":31.38,"lng":75.38,"fact":"Once ruled by the Ahluwalia family; its palace looks French."}},
  {"slug":"rupnagar-ropar","difficulty":"easy","group":"towns","data":{"name":"Rupnagar (Ropar)","name_pa":"ਰੂਪਨਗਰ","lat":30.966,"lng":76.533,"fact":"Where the river Sutlej comes out of the hills into the plains."}},
  {"slug":"sultanpur-lodhi","difficulty":"medium","group":"gurus","data":{"name":"Sultanpur Lodhi","name_pa":"ਸੁਲਤਾਨਪੁਰ ਲੋਧੀ","lat":31.215,"lng":75.199,"fact":"Guru Nanak Dev Ji lived and worked here as a young man."}},
  {"slug":"khadur-sahib","difficulty":"medium","group":"gurus","data":{"name":"Khadur Sahib","name_pa":"ਖਡੂਰ ਸਾਹਿਬ","lat":31.414,"lng":75.097,"fact":"The town of Guru Angad Dev Ji."}},
  {"slug":"goindwal-sahib","difficulty":"medium","group":"gurus","data":{"name":"Goindwal Sahib","name_pa":"ਗੋਇੰਦਵਾਲ ਸਾਹਿਬ","lat":31.364,"lng":75.147,"fact":"Guru Amar Das Ji built the baoli, the step-well, here."}},
  {"slug":"baba-bakala","difficulty":"medium","group":"gurus","data":{"name":"Baba Bakala","name_pa":"ਬਾਬਾ ਬਕਾਲਾ","lat":31.556,"lng":75.255,"fact":"Guru Tegh Bahadur Ji was recognised as the ninth Guru here."}},
  {"slug":"kiratpur-sahib","difficulty":"medium","group":"gurus","data":{"name":"Kiratpur Sahib","name_pa":"ਕੀਰਤਪੁਰ ਸਾਹਿਬ","lat":31.183,"lng":76.574,"fact":"Guru Har Rai Ji kept his herb garden here."}},
  {"slug":"anandpur-sahib","difficulty":"medium","group":"gurus","data":{"name":"Anandpur Sahib","name_pa":"ਅਨੰਦਪੁਰ ਸਾਹਿਬ","lat":31.239,"lng":76.502,"fact":"Guru Gobind Singh Ji created the Khalsa here in 1699."}},
  {"slug":"kartarpur-jalandhar","difficulty":"medium","group":"gurus","data":{"name":"Kartarpur (Jalandhar)","name_pa":"ਕਰਤਾਰਪੁਰ","lat":31.441,"lng":75.498,"fact":"Founded by Guru Arjan Dev Ji; Mata Gujri Ji was born here."}},
  {"slug":"tarn-taran","difficulty":"medium","group":"gurus","data":{"name":"Tarn Taran","name_pa":"ਤਰਨ ਤਾਰਨ","lat":31.451,"lng":74.926,"fact":"Guru Arjan Dev Ji built a Gurdwara with one of the largest sarovars here."}},
  {"slug":"dera-baba-nanak","difficulty":"medium","group":"gurus","data":{"name":"Dera Baba Nanak","name_pa":"ਡੇਰਾ ਬਾਬਾ ਨਾਨਕ","lat":32.034,"lng":75.031,"fact":"The Kartarpur Corridor starts here, on the Indian side of the border."}},
  {"slug":"chamkaur-sahib","difficulty":"medium","group":"courage","data":{"name":"Chamkaur Sahib","name_pa":"ਚਮਕੌਰ ਸਾਹਿਬ","lat":30.89,"lng":76.425,"fact":"The two elder Sahibzade gave their lives here in 1704."}},
  {"slug":"fatehgarh-sahib","difficulty":"medium","group":"courage","data":{"name":"Fatehgarh Sahib","name_pa":"ਫ਼ਤਿਹਗੜ੍ਹ ਸਾਹਿਬ","lat":30.645,"lng":76.39,"fact":"The two younger Sahibzade and Mata Gujri Ji are remembered here."}},
  {"slug":"machhiwara","difficulty":"medium","group":"courage","data":{"name":"Machhiwara","name_pa":"ਮਾਛੀਵਾੜਾ","lat":30.918,"lng":76.2,"fact":"Guru Gobind Singh Ji rested in the forest here after Chamkaur."}},
  {"slug":"sri-muktsar-sahib","difficulty":"medium","group":"courage","data":{"name":"Sri Muktsar Sahib","name_pa":"ਸ੍ਰੀ ਮੁਕਤਸਰ ਸਾਹਿਬ","lat":30.474,"lng":74.516,"fact":"Mai Bhago Ji and the forty liberated ones fought here."}},
  {"slug":"talwandi-sabo","difficulty":"medium","group":"courage","data":{"name":"Talwandi Sabo","name_pa":"ਤਲਵੰਡੀ ਸਾਬੋ","lat":29.987,"lng":75.084,"fact":"Takht Sri Damdama Sahib is here."}},
  {"slug":"faridkot","difficulty":"medium","group":"courage","data":{"name":"Faridkot","name_pa":"ਫ਼ਰੀਦਕੋਟ","lat":30.676,"lng":74.756,"fact":"Named after Baba Farid, the Sufi poet."}},
  {"slug":"sri-akal-takht-sahib-amritsar","difficulty":"medium","group":"takhts","data":{"name":"Sri Akal Takht Sahib, Amritsar","name_pa":"ਸ੍ਰੀ ਅਕਾਲ ਤਖ਼ਤ ਸਾਹਿਬ","lat":31.62,"lng":74.876,"fact":"Built by Guru Hargobind Ji in 1606."}},
  {"slug":"takht-sri-keshgarh-sahib-anandpur-sahib","difficulty":"medium","group":"takhts","data":{"name":"Takht Sri Keshgarh Sahib, Anandpur Sahib","name_pa":"ਤਖ਼ਤ ਸ੍ਰੀ ਕੇਸਗੜ੍ਹ ਸਾਹਿਬ","lat":31.233,"lng":76.5,"fact":"Where the Khalsa was created in 1699."}},
  {"slug":"takht-sri-damdama-sahib-talwandi-sabo","difficulty":"medium","group":"takhts","data":{"name":"Takht Sri Damdama Sahib, Talwandi Sabo","name_pa":"ਤਖ਼ਤ ਸ੍ਰੀ ਦਮਦਮਾ ਸਾਹਿਬ","lat":29.987,"lng":75.084,"fact":"The final version of Guru Granth Sahib was prepared here."}},
  {"slug":"takht-sri-patna-sahib-bihar","difficulty":"hard","group":"takhts","data":{"name":"Takht Sri Patna Sahib, Bihar","name_pa":"ਤਖ਼ਤ ਸ੍ਰੀ ਪਟਨਾ ਸਾਹਿਬ","lat":25.596,"lng":85.23,"fact":"The birthplace of Guru Gobind Singh Ji."}},
  {"slug":"takht-sri-hazur-sahib-nanded","difficulty":"hard","group":"takhts","data":{"name":"Takht Sri Hazur Sahib, Nanded","name_pa":"ਤਖ਼ਤ ਸ੍ਰੀ ਹਜ਼ੂਰ ਸਾਹਿਬ","lat":19.153,"lng":77.312,"fact":"Guru Gobind Singh Ji spent his last days here, by the river Godavari."}},
  {"slug":"nankana-sahib","difficulty":"hard","group":"pakistan","data":{"name":"Nankana Sahib","name_pa":"ਨਨਕਾਣਾ ਸਾਹਿਬ","lat":31.45,"lng":73.708,"fact":"The birthplace of Guru Nanak Dev Ji."}},
  {"slug":"kartarpur-sahib-narowal","difficulty":"hard","group":"pakistan","data":{"name":"Kartarpur Sahib (Narowal)","name_pa":"ਕਰਤਾਰਪੁਰ ਸਾਹਿਬ","lat":32.087,"lng":75.016,"fact":"Guru Nanak Dev Ji farmed here in his last years, by the river Ravi."}},
  {"slug":"panja-sahib-hasan-abdal","difficulty":"hard","group":"pakistan","data":{"name":"Panja Sahib (Hasan Abdal)","name_pa":"ਪੰਜਾ ਸਾਹਿਬ","lat":33.819,"lng":72.689,"fact":"Famous for a rock with a hand-print linked to Guru Nanak Dev Ji."}},
  {"slug":"gurdwara-dera-sahib-lahore","difficulty":"hard","group":"pakistan","data":{"name":"Gurdwara Dera Sahib, Lahore","name_pa":"ਗੁਰਦੁਆਰਾ ਡੇਰਾ ਸਾਹਿਬ, ਲਾਹੌਰ","lat":31.589,"lng":74.311,"fact":"It marks where Guru Arjan Dev Ji gave his life in 1606."}},
  {"slug":"gujranwala","difficulty":"hard","group":"pakistan","data":{"name":"Gujranwala","name_pa":"ਗੁਜਰਾਂਵਾਲਾ","lat":32.155,"lng":74.187,"fact":"The birthplace of Maharaja Ranjit Singh."}},
  {"slug":"gurdwara-bangla-sahib-delhi","difficulty":"hard","group":"india","data":{"name":"Gurdwara Bangla Sahib, Delhi","name_pa":"ਗੁਰਦੁਆਰਾ ਬੰਗਲਾ ਸਾਹਿਬ","lat":28.626,"lng":77.209,"fact":"Guru Har Krishan Ji stayed here in 1664."}},
  {"slug":"gurdwara-sis-ganj-sahib-delhi","difficulty":"hard","group":"india","data":{"name":"Gurdwara Sis Ganj Sahib, Delhi","name_pa":"ਗੁਰਦੁਆਰਾ ਸੀਸ ਗੰਜ ਸਾਹਿਬ","lat":28.656,"lng":77.232,"fact":"It marks where Guru Tegh Bahadur Ji gave his life in 1675."}},
  {"slug":"hemkunt-sahib-uttarakhand","difficulty":"hard","group":"india","data":{"name":"Hemkunt Sahib, Uttarakhand","name_pa":"ਹੇਮਕੁੰਟ ਸਾਹਿਬ","lat":30.698,"lng":79.606,"fact":"A Gurdwara beside a lake high in the Himalayas."}},
  {"slug":"paonta-sahib-himachal-pradesh","difficulty":"hard","group":"india","data":{"name":"Paonta Sahib, Himachal Pradesh","name_pa":"ਪਾਉਂਟਾ ਸਾਹਿਬ","lat":30.437,"lng":77.624,"fact":"Guru Gobind Singh Ji lived here for a few years and wrote poetry by the river Yamuna."}},
  {"slug":"manikaran-sahib-himachal-pradesh","difficulty":"hard","group":"india","data":{"name":"Manikaran Sahib, Himachal Pradesh","name_pa":"ਮਨੀਕਰਨ ਸਾਹਿਬ","lat":32.027,"lng":77.348,"fact":"Famous for its hot springs, where the langar is cooked."}},
 ],
 "gurdwara_jigsaw": [
  {"slug":"sri-harmandir-sahib-amritsar","difficulty":"easy","group":"stage-1","data":{"picture":"home-heritage","title":"Sri Harmandir Sahib, Amritsar","title_pa":"ਸ੍ਰੀ ਹਰਿਮੰਦਰ ਸਾਹਿਬ, ਅੰਮ੍ਰਿਤਸਰ","story":"Guru Arjan Dev Ji built Harmandir Sahib in the middle of the sarovar started by Guru Ram Das Ji. It has four doors, one on each side, to show that people from every direction are welcome. The Adi Granth was first installed here in 1604, and Maharaja Ranjit Singh later covered the building in gold."}},
  {"slug":"gurdwara-bangla-sahib-delhi","difficulty":"easy","group":"stage-2","data":{"picture":"coming-4","title":"Gurdwara Bangla Sahib, Delhi","title_pa":"ਗੁਰਦੁਆਰਾ ਬੰਗਲਾ ਸਾਹਿਬ, ਦਿੱਲੀ","story":"This was once the bungalow of Raja Jai Singh, where Guru Har Krishan Ji stayed in 1664. The young Guru cared for people who were ill with smallpox and cholera. People still take water from its sarovar, and its langar feeds thousands of people every day."}},
  {"slug":"takht-sri-keshgarh-sahib-anandpur-sahib","difficulty":"easy","group":"stage-3","data":{"picture":"learn-khalsa","title":"Takht Sri Keshgarh Sahib, Anandpur Sahib","title_pa":"ਤਖ਼ਤ ਸ੍ਰੀ ਕੇਸਗੜ੍ਹ ਸਾਹਿਬ, ਅਨੰਦਪੁਰ ਸਾਹਿਬ","story":"On Vaisakhi in 1699 Guru Gobind Singh Ji created the Khalsa here and gave Amrit to the Panj Pyare. It is one of the five Takhts, the seats of Sikh authority. Every year Hola Mohalla brings huge crowds to Anandpur Sahib."}},
  {"slug":"sri-akal-takht-sahib-amritsar","difficulty":"medium","group":"stage-4","data":{"picture":"home-history","title":"Sri Akal Takht Sahib, Amritsar","title_pa":"ਸ੍ਰੀ ਅਕਾਲ ਤਖ਼ਤ ਸਾਹਿਬ, ਅੰਮ੍ਰਿਤਸਰ","story":"Guru Hargobind Ji built the Akal Takht in 1606, facing Harmandir Sahib. It was the first of the five Takhts, and decisions for the whole Sikh community are announced here."}},
  {"slug":"gurdwara-sri-fatehgarh-sahib","difficulty":"medium","group":"stage-5","data":{"picture":"learn-sahibzaade","title":"Gurdwara Sri Fatehgarh Sahib","title_pa":"ਗੁਰਦੁਆਰਾ ਸ੍ਰੀ ਫ਼ਤਿਹਗੜ੍ਹ ਸਾਹਿਬ","story":"Here, at Sirhind, the two youngest Sahibzade, Zorawar Singh and Fateh Singh, stood firm in their faith and gave their lives, when they were still young boys. Every December the Shaheedi Jor Mela remembers them and their grandmother, Mata Gujri Ji."}},
  {"slug":"takht-sri-damdama-sahib-talwandi-sabo","difficulty":"medium","group":"stage-6","data":{"picture":"jigsaw-damdama","title":"Takht Sri Damdama Sahib, Talwandi Sabo","title_pa":"ਤਖ਼ਤ ਸ੍ਰੀ ਦਮਦਮਾ ਸਾਹਿਬ, ਤਲਵੰਡੀ ਸਾਬੋ","story":"Guru Gobind Singh Ji stayed here in 1705 and 1706. The final version of Guru Granth Sahib was prepared here, written out by Bhai Mani Singh Ji, so the place is also called Guru ki Kashi, the Guru’s seat of learning."}},
  {"slug":"takht-sri-patna-sahib-bihar","difficulty":"hard","group":"stage-7","data":{"picture":"jigsaw-patna","title":"Takht Sri Patna Sahib, Bihar","title_pa":"ਤਖ਼ਤ ਸ੍ਰੀ ਪਟਨਾ ਸਾਹਿਬ, ਬਿਹਾਰ","story":"Guru Gobind Singh Ji was born here in 1666 and spent his early childhood in Patna. Guru Nanak Dev Ji and Guru Tegh Bahadur Ji also came to the city. It is one of the five Takhts."}},
  {"slug":"takht-sri-hazur-sahib-nanded","difficulty":"hard","group":"stage-8","data":{"picture":"jigsaw-hazur","title":"Takht Sri Hazur Sahib, Nanded","title_pa":"ਤਖ਼ਤ ਸ੍ਰੀ ਹਜ਼ੂਰ ਸਾਹਿਬ, ਨਾਂਦੇੜ","story":"Guru Gobind Singh Ji spent his last days here, on the banks of the river Godavari, in 1708. Before leaving this world he named Guru Granth Sahib the Guru for ever. Maharaja Ranjit Singh had the Gurdwara built in the 1830s."}},
  {"slug":"gurdwara-janam-asthan-nankana-sahib","difficulty":"hard","group":"stage-9","data":{"picture":"jigsaw-nankana","title":"Gurdwara Janam Asthan, Nankana Sahib","title_pa":"ਗੁਰਦੁਆਰਾ ਜਨਮ ਅਸਥਾਨ, ਨਨਕਾਣਾ ਸਾਹਿਬ","story":"This Gurdwara stands where Guru Nanak Dev Ji was born in 1469, in the town then called Rai Bhoi di Talwandi, now in Pakistan. Thousands of pilgrims travel here every year for Guru Nanak Dev Ji’s Gurpurab."}},
  {"slug":"sri-harmandir-sahib-at-night","difficulty":"easy","group":"backup","data":{"picture":"coming-1","title":"Sri Harmandir Sahib at night","title_pa":"ਰਾਤ ਵੇਲੇ ਸ੍ਰੀ ਹਰਿਮੰਦਰ ਸਾਹਿਬ","story":"At night the lights of Harmandir Sahib shine on the sarovar. Kirtan is sung here from the early morning until late at night, and the langar never closes."}},
  {"slug":"the-sarovar-of-sri-harmandir-sahib","difficulty":"easy","group":"backup","data":{"picture":"gurbani-section","title":"The sarovar of Sri Harmandir Sahib","title_pa":"ਸ੍ਰੀ ਹਰਿਮੰਦਰ ਸਾਹਿਬ ਦਾ ਸਰੋਵਰ","story":"The holy pool around Harmandir Sahib was dug in the time of Guru Ram Das Ji. The city of Amritsar takes its name from it: the pool of amrit, or nectar."}},
  {"slug":"the-parkarma-of-sri-harmandir-sahib","difficulty":"easy","group":"backup","data":{"picture":"login-side","title":"The parkarma of Sri Harmandir Sahib","title_pa":"ਸ੍ਰੀ ਹਰਿਮੰਦਰ ਸਾਹਿਬ ਦੀ ਪਰਕਰਮਾ","story":"Pilgrims walk around the sarovar on the parkarma, the marble walkway, before crossing the causeway into Harmandir Sahib."}},
  {"slug":"gurdwara-panja-sahib-hasan-abdal","difficulty":"easy","group":"backup","data":{"picture":"jigsaw-panja","title":"Gurdwara Panja Sahib, Hasan Abdal","title_pa":"ਗੁਰਦੁਆਰਾ ਪੰਜਾ ਸਾਹਿਬ, ਹਸਨ ਅਬਦਾਲ","story":"At Hasan Abdal, in today’s Pakistan, a rock with a hand-print is linked to Guru Nanak Dev Ji. Sikhs from all over the world visit it, especially at Vaisakhi."}},
  {"slug":"gurdwara-darbar-sahib-kartarpur","difficulty":"easy","group":"backup","data":{"picture":"jigsaw-kartarpur","title":"Gurdwara Darbar Sahib, Kartarpur","title_pa":"ਗੁਰਦੁਆਰਾ ਦਰਬਾਰ ਸਾਹਿਬ, ਕਰਤਾਰਪੁਰ","story":"Guru Nanak Dev Ji spent the last years of his life farming here, on the banks of the river Ravi. Since 2019 a corridor lets pilgrims from India visit without a visa."}},
  {"slug":"gurdwara-sis-ganj-sahib-delhi","difficulty":"easy","group":"backup","data":{"picture":"jigsaw-sis-ganj","title":"Gurdwara Sis Ganj Sahib, Delhi","title_pa":"ਗੁਰਦੁਆਰਾ ਸੀਸ ਗੰਜ ਸਾਹਿਬ, ਦਿੱਲੀ","story":"This Gurdwara in Chandni Chowk, Delhi, marks the place where Guru Tegh Bahadur Ji gave his life in 1675, standing up for the freedom of others to follow their faith."}},
  {"slug":"gurdwara-hemkunt-sahib","difficulty":"easy","group":"backup","data":{"picture":"jigsaw-hemkunt","title":"Gurdwara Hemkunt Sahib","title_pa":"ਗੁਰਦੁਆਰਾ ਹੇਮਕੁੰਟ ਸਾਹਿਬ","story":"High in the Himalayas, beside a glacier lake about 4,600 metres up, this Gurdwara is open only in the summer months, when the snow has melted from the path."}},
 ],
};
