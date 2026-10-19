/**
 * pages/Learning/Arcade/localGames.js
 * -----------------------------------------------------------------------------
 * The game rules the browser needs when it can't use the server: stars and
 * rewards for guests (worked out the same way as learning_api/games.py), and
 * picking a stage's content from the offline copy (arcadeData.js).
 * Signed-in players always get both from the server.
 * -----------------------------------------------------------------------------
 */
import { CONTENT, GAMES, MAP_REGIONS, REWARDS, STAR_SCORES } from './arcadeData';
import { tiles } from './gurmukhi';

export { GAMES };

export const gameBySlug = (slug) => Object.values(GAMES).find((g) => g.slug === slug) || null;

export const starsFor = (score, completed = true) =>
  (completed ? STAR_SCORES.filter((needed) => score >= needed).length : 0);

/** The same as games.stage_rewards on the server. */
export const stageRewards = (difficulty, previousStars, stars, firstClear) => {
  const rule = REWARDS[difficulty] || REWARDS.easy;
  const newStars = Math.max(0, stars - previousStars);
  const oldStars = stars - newStars;
  const starCoins = newStars * rule.coins_per_star + oldStars * rule.replay_coins_per_star;
  const starXp = newStars * rule.xp_per_star + (oldStars ? rule.replay_xp : 0);
  return {
    coins: starCoins + (firstClear ? rule.first_clear_coins : 0),
    xp: starXp + (firstClear ? rule.first_clear_xp : 0),
    newStars,
    firstClearCoins: firstClear ? rule.first_clear_coins : 0,
  };
};

export const unlockedUpTo = (progress, stageCount = 9) => {
  let highest = 1;
  for (let n = 1; n < stageCount; n += 1) {
    if ((progress[n]?.stars || 0) >= 1) highest = n + 1;
    else break;
  }
  return highest;
};

// ---------------------------------------------------------------- guest progress
const GUEST_PROGRESS_KEY = 'virsaa_arcade_guest';

export const readGuestProgress = () => {
  try {
    return JSON.parse(localStorage.getItem(GUEST_PROGRESS_KEY)) || {};
  } catch {
    return {};
  }
};

export const writeGuestProgress = (all) => {
  try {
    localStorage.setItem(GUEST_PROGRESS_KEY, JSON.stringify(all));
  } catch {
    /* private mode: progress only lasts this visit */
  }
};

// ---------------------------------------------------------------- picking content
const shuffle = (list) => {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};
const pick = (list, count) => shuffle(list).slice(0, count);

const SYLLABLE_CONSONANTS = [...'ਸਹਕਖਗਘਚਛਜਝਟਠਡਢਤਥਦਧਨਪਫਬਭਮਯਰਲਵ'];

const pickers = {
  akhar_sikho: (s) => {
    const pool = CONTENT.akhar_sikho;
    let chosen = pool.filter((p) => s.groups.includes(p.group));
    if (s.count) {
      const first = chosen.filter((p) => (s.first || []).includes(p.group));
      const rest = chosen.filter((p) => !first.includes(p));
      chosen = shuffle([...pick(first, s.count), ...pick(rest, Math.max(0, s.count - first.length))]);
    }
    const rounds = chosen.map((target) => {
      const d = target.data;
      const kind = d.kind || 'letter';
      const sameKind = pool.filter((p) => (p.data.kind || 'letter') === kind && p.data.letter !== d.letter).map((p) => p.data.letter);
      const sameRow = pool.filter((p) => p.group === target.group && p.data.letter !== d.letter).map((p) => p.data.letter);
      const picks = s.lookalikes ? (d.looks_like || []).filter((x) => sameKind.includes(x)) : [];
      [shuffle(sameRow), shuffle(sameKind)].forEach((group) => group.forEach((x) => { if (!picks.includes(x)) picks.push(x); }));
      return { ...d, slug: target.slug, options: shuffle([...picks.slice(0, (s.options || 3) - 1), d.letter]) };
    });
    return { rounds, trace: s.trace || 'guided' };
  },
  akhaan_jor: (s) => {
    const pool = shuffle(CONTENT.akhaan_jor.filter((p) => s.pools.includes(p.difficulty)));
    const used = new Set();
    const boards = [];
    for (let b = 0; b < s.boards; b += 1) {
      const fresh = [...pool.filter((p) => !used.has(p.slug)), ...pool.filter((p) => used.has(p.slug))];
      const board = [];
      const ends = new Set();
      fresh.forEach((p) => {
        if (board.length >= s.pairs || ends.has(p.data.end)) return;
        board.push({ ...p.data, slug: p.slug });
        ends.add(p.data.end);
        used.add(p.slug);
      });
      if (board.length >= 2) boards.push(board);
    }
    return { boards, timer: s.timer || null };
  },
  akhar_barsat: (s) => {
    let pool;
    if (s.source === 'letters') {
      pool = CONTENT.akhar_sikho.filter((p) => s.groups.includes(p.group) && p.data.kind === 'letter')
        .map((p) => ({ text: p.data.letter, name: p.data.name, roman: p.data.roman }));
    } else if (s.source === 'syllables') {
      pool = SYLLABLE_CONSONANTS.flatMap((c) => s.matras.map((m) => ({ text: c + m })));
    } else {
      pool = CONTENT.akhar_barsat.filter((p) => (s.pools || []).includes(p.difficulty))
        .map((p) => ({ text: p.data.word, roman: p.data.roman, meaning: p.data.meaning }));
    }
    let drops = [];
    while (pool.length && drops.length < s.drops) drops = drops.concat(pick(pool, s.drops - drops.length));
    return { drops: drops.map((d) => ({ ...d, tiles: tiles(d.text) })) };
  },
  itihaas_timeline: (s) => {
    const tags = s.tags || [];
    const events = CONTENT.itihaas_timeline.filter((p) => s.pools.includes(p.difficulty)
      && (!s.eras || s.eras.includes(p.group)) && (!tags.length || tags.some((t) => (p.data.tags || []).includes(t))));
    const used = new Set();
    const rounds = [];
    for (let r = 0; r < s.rounds; r += 1) {
      const candidates = [...shuffle(events.filter((e) => !used.has(e.slug))), ...shuffle(events.filter((e) => used.has(e.slug)))];
      const chosen = [];
      candidates.forEach((e) => {
        if (chosen.length >= s.per_round) return;
        if (chosen.every((c) => Math.abs(c.data.year - e.data.year) >= Math.max(1, s.min_gap || 1))) chosen.push(e);
      });
      if (chosen.length < 2) break;
      chosen.forEach((e) => used.add(e.slug));
      rounds.push(shuffle(chosen).map((e) => ({ ...e.data, slug: e.slug })));
    }
    return { rounds };
  },
  kaun_hai: (s) => {
    const pool = CONTENT.kaun_hai;
    const avoid = s.avoid || [];
    const people = pool.filter((p) => s.pools.includes(p.difficulty) && (!s.kinds || s.kinds.includes(p.group)) && !avoid.includes(p.group));
    const namesPa = Object.fromEntries(pool.map((p) => [p.data.name, p.data.name_pa]));
    const rounds = pick(people, s.rounds).map((target) => {
      const female = Boolean(target.data.female);
      const ranked = shuffle(pool.filter((p) => p.slug !== target.slug)).sort((a, b) => {
        const rank = (p) => [Boolean(p.data.female) !== female, p.group !== target.group, !s.pools.includes(p.difficulty)];
        const [x, y] = [rank(a), rank(b)];
        for (let i = 0; i < x.length; i += 1) if (x[i] !== y[i]) return x[i] ? 1 : -1;
        return 0;
      });
      const names = shuffle([...ranked.slice(0, s.options - 1).map((p) => p.data.name), target.data.name]);
      return { ...target.data, slug: target.slug, options: names.map((name) => ({ name, name_pa: namesPa[name] || '' })) };
    });
    return { rounds, clues: 4 };
  },
  map_quest: (s) => {
    const seen = new Set();
    const places = CONTENT.map_quest.filter((p) => {
      const spot = `${p.data.lat.toFixed(2)},${p.data.lng.toFixed(2)}`;
      if (!s.groups.includes(p.group) || seen.has(spot)) return false;
      seen.add(spot);
      return true;
    }).map((p) => ({ ...p.data, slug: p.slug }));
    const region = s.region || 'punjab';
    return { places: pick(places, s.rounds), region, bounds: MAP_REGIONS[region] || MAP_REGIONS.punjab, scale_km: s.scale_km };
  },
  gurdwara_jigsaw: (s, stage, pictures = {}) => {
    const pool = CONTENT.gurdwara_jigsaw;
    const own = pool.filter((p) => p.group === `stage-${stage}`);
    const spares = pool.filter((p) => p.group === 'backup');
    const rotated = spares.length ? [...spares.slice(stage % spares.length), ...spares.slice(0, stage % spares.length)] : [];
    const others = shuffle(pool.filter((p) => p.group !== `stage-${stage}` && p.group !== 'backup'));
    const found = [...own, ...rotated, ...others].find((p) => pictures[p.data.picture]?.url);
    const item = found || own[0];
    const picture = found ? pictures[item.data.picture] : null;
    return {
      picture: item ? {
        ...item.data, slug: item.slug, image: picture?.url || null, alt: picture?.alt || item.data.title,
        credit: picture?.credit || null, width: picture?.width, height: picture?.height,
      } : null,
    };
  },
};

/** Content for a stage from the offline copy (`pictures`: website pictures, for the jigsaw). */
export const localStageContent = (gameKey, stage, pictures) => {
  const spec = GAMES[gameKey]?.stages.find((s) => s.stage === Number(stage));
  if (!spec) return null;
  const body = { stage: spec.stage, difficulty: spec.difficulty, settings: spec.settings, offline: true };
  const picker = pickers[gameKey];
  return picker ? { ...body, ...picker(spec.settings, spec.stage, pictures) } : body;
};

/** A local Shabad-le word for a stage (used when the server can't be reached). */
export const localShabadWord = (stage, daily = false) => {
  const pool = CONTENT.shabad_le;
  if (daily) {
    const four = pool.filter((p) => tiles(p.data.word).length === 4);
    const day = Math.floor((Date.now() - Date.UTC(2026, 0, 1)) / 86400000);
    return four[((day % four.length) + four.length) % four.length]?.data || null;
  }
  const spec = GAMES.shabad_le.stages.find((s) => s.stage === Number(stage));
  if (!spec) return null;
  const sameLength = pool.filter((p) => tiles(p.data.word).length === spec.settings.tiles);
  const topics = spec.settings.topics;
  const choices = sameLength.filter((p) => !topics || topics.includes(p.data.hint));
  return pick(choices.length ? choices : sameLength, 1)[0]?.data || null;
};
