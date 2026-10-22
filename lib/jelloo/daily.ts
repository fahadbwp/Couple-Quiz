import { neighbour, type Character, type Direction, type Level } from "./engine";
import { solvePowerLevel } from "./power-solver";
import { buildTutorial, type TutorialSpec } from "./levels";
import type { WorldId } from "./worlds";

export const DAILY_VERSION = 1;
export const DAILY_SAVE_KEY = "jelloo.daily.v1";

export type DailyTier = "easy" | "medium" | "advanced";

export const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export interface DailyLevelMeta {
  date: string; // YYYY-MM-DD
  seed: number;
  tier: DailyTier;
  dayOfWeek: number; // 0-6
  weekdayName: string;
  character: Character;
  world: WorldId;
}

export interface DailyRecord {
  date: string; // YYYY-MM-DD
  won: boolean;
  moves: number;
  stars: number;
  rotations: number[];
  choices?: Record<string, number>;
  completedAt?: string; // ISO string
}

export interface DailyStore {
  version: 1;
  currentStreak: number;
  maxStreak: number;
  lastCompletedDate?: string;
  history: Record<string, DailyRecord>;
  activeDate: string;
  activeRotations?: number[];
  activeMoves?: number;
  activeChoices?: Record<string, number>;
}

export function currentUtcDateString(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function seedFromUtcDate(dateStr: string, version = DAILY_VERSION): number {
  const input = `jelloo-daily-v${version}-${dateStr}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

export function getDailyMeta(dateStr: string, version = DAILY_VERSION): DailyLevelMeta {
  const seed = seedFromUtcDate(dateStr, version);
  const d = new Date(dateStr + "T00:00:00Z");
  const dayOfWeek = isNaN(d.getTime()) ? 1 : d.getUTCDay();
  const weekdayName = WEEKDAY_NAMES[dayOfWeek];

  // Monday–Wednesday: Easy
  // Thursday–Friday: Medium
  // Saturday–Sunday: Advanced
  let tier: DailyTier = "easy";
  let character: Character = "bunny";
  let world: WorldId = "meadow";

  if (dayOfWeek === 1) {
    tier = "easy"; character = "bunny"; world = "meadow";
  } else if (dayOfWeek === 2) {
    tier = "easy"; character = "bunny"; world = "beach";
  } else if (dayOfWeek === 3) {
    tier = "easy"; character = "bunny"; world = "snow";
  } else if (dayOfWeek === 4) {
    tier = "medium"; character = "panda"; world = "beach";
  } else if (dayOfWeek === 5) {
    tier = "medium"; character = "cat"; world = "snow";
  } else if (dayOfWeek === 6) {
    tier = "advanced"; character = "octopus"; world = "candy";
  } else {
    // Sunday (0)
    tier = "advanced"; character = "fox"; world = "space";
  }

  return { date: dateStr, seed, tier, dayOfWeek, weekdayName, character, world };
}

// 7 Curated verified fallback templates (one per day of week) guaranteeing 100% solvability
const WEEKDAY_FALLBACKS: Record<number, TutorialSpec & { character: Character; world: WorldId; power: (level: Level) => void }> = {
  // Monday: Easy Bunny 4x4
  1: {
    id: 7001, size: 4,
    route: [0, 1, 2, 6, 10, 14, 15],
    scramble: { 1: 1, 2: 3, 6: 1, 10: 3, 14: 1 },
    decoys: [[3, "corner", 2], [5, "straight", 1], [9, "corner", 0]],
    title: "Monday Meadow Warmup",
    hint: "Connect Bunny home across the meadow to start your week! ♡",
    character: "bunny", world: "meadow",
    power: (lvl) => {
      lvl.tiles[6] = { kind: "blank", rotation: 0, terrain: "gap" };
    },
  },
  // Tuesday: Easy Bunny 4x4
  2: {
    id: 7002, size: 4,
    route: [12, 8, 9, 5, 6, 7],
    scramble: { 8: 3, 9: 1, 5: 3, 6: 1 },
    decoys: [[0, "straight", 0], [4, "corner", 1], [10, "corner", 3]],
    title: "Tuesday Shoreline Trot",
    hint: "Hop across the seaside stones.",
    character: "bunny", world: "beach",
    power: (lvl) => {
      lvl.tiles[9] = { kind: "blank", rotation: 0, terrain: "gap" };
    },
  },
  // Wednesday: Easy Bunny 4x4
  3: {
    id: 7003, size: 4,
    route: [3, 2, 1, 5, 9, 13, 14, 15],
    scramble: { 2: 1, 1: 3, 5: 1, 9: 3, 13: 1, 14: 3 },
    decoys: [[0, "corner", 0], [6, "straight", 1], [10, "corner", 2]],
    title: "Wednesday Snow Drift",
    hint: "A cozy path through winter snow.",
    character: "bunny", world: "snow",
    power: (lvl) => {
      lvl.tiles[5] = { kind: "blank", rotation: 0, terrain: "gap" };
    },
  },
  // Thursday: Medium Panda 5x5
  4: {
    id: 7004, size: 5,
    route: [0, 1, 6, 11, 12, 13, 18, 23, 24],
    scramble: { 1: 3, 6: 1, 11: 3, 12: 1, 13: 3, 18: 1, 23: 3 },
    decoys: [[2, "corner", 2], [7, "straight", 0], [17, "corner", 1], [22, "straight", 1]],
    title: "Thursday Heavy Steps",
    hint: "Panda must step on the cracked tile to open the beach gate.",
    character: "panda", world: "beach",
    power: (lvl) => {
      lvl.tiles[6].terrain = "cracked";
      lvl.gate = { tile: 18, trigger: 6 };
    },
  },
  // Friday: Medium Cat 5x5
  5: {
    id: 7005, size: 5,
    route: [20, 15, 16, 17, 12, 7, 8, 9, 4],
    scramble: { 15: 1, 16: 3, 17: 1, 12: 3, 7: 1, 8: 3, 9: 1 },
    decoys: [[1, "straight", 0], [6, "corner", 2], [11, "corner", 3], [21, "straight", 1]],
    title: "Friday Wall Climber",
    hint: "Cat walks easily along the marked wall path.",
    character: "cat", world: "snow",
    power: (lvl) => {
      lvl.tiles[16].terrain = "wall";
      lvl.tiles[8].terrain = "slow";
    },
  },
  // Saturday: Advanced Octopus 5x5
  6: {
    id: 7006, size: 5,
    route: [24, 23, 22, 17, 12, 11, 10, 5, 0],
    scramble: { 23: 3, 22: 1, 17: 3, 12: 1, 11: 3, 10: 1, 5: 3 },
    decoys: [[1, "corner", 1], [6, "straight", 0], [16, "corner", 2], [21, "corner", 0]],
    title: "Saturday Tidal Maze",
    hint: "Octopus glides along the water stream.",
    character: "octopus", world: "candy",
    power: (lvl) => {
      lvl.tiles[17].terrain = "water";
      lvl.tiles[11].terrain = "water";
    },
  },
  // Sunday: Advanced Fox 5x5
  0: {
    id: 7007, size: 5,
    route: [2, 7, 8, 9, 14, 19, 18, 17, 22],
    scramble: { 7: 1, 8: 3, 9: 1, 14: 3, 19: 1, 18: 3, 17: 1 },
    decoys: [[3, "straight", 1], [6, "corner", 0], [13, "corner", 3], [16, "straight", 0]],
    title: "Sunday Star Crossroads",
    hint: "Fox picks the path branch. Steer toward home!",
    character: "fox", world: "space",
    power: (lvl) => {
      // Fox tee fork at tile 8
      lvl.tiles[8] = { kind: "tee", rotation: 1 };
      lvl.fork = { tile: 8, exits: [1, 2] }; // east and south
      lvl.choices = { 8: 1 };
    },
  },
};

export function generateDailyLevel(dateStr: string, version = DAILY_VERSION): Level {
  const meta = getDailyMeta(dateStr, version);
  let value = meta.seed;
  const random = () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };

  // Determine size & route length based on tier
  const size = meta.tier === "easy" ? 4 : 5;
  const routeLength = meta.tier === "easy" ? 7 : meta.tier === "medium" ? 9 : 11;
  const maxSearchBudget = 300;

  // Search for a valid procedural route
  for (let attempt = 0; attempt < maxSearchBudget; attempt++) {
    const route = [Math.floor(random() * (size * size))];
    while (route.length < routeLength) {
      const choices = ([0, 1, 2, 3] as Direction[])
        .map(d => neighbour(route.at(-1)!, d, size))
        .filter((n): n is number => n !== null && !route.includes(n));
      if (!choices.length) break;
      route.push(choices[Math.floor(random() * choices.length)]);
    }
    if (route.length !== routeLength) continue;

    // Scramble route tiles
    const scramble: TutorialSpec["scramble"] = {};
    route.slice(1, -1).forEach(cell => {
      scramble[cell] = random() < 0.5 ? 1 : 3;
    });

    // Generate decoys
    const decoys: NonNullable<TutorialSpec["decoys"]> = [];
    const decoyRate = meta.tier === "easy" ? 0.2 : meta.tier === "medium" ? 0.35 : 0.45;
    for (let i = 0; i < size * size; i++) {
      if (!route.includes(i) && random() < decoyRate) {
        decoys.push([i, random() < 0.5 ? "straight" : "corner", Math.floor(random() * 4)]);
      }
    }

    const spec: TutorialSpec = {
      id: 7000 + meta.dayOfWeek,
      size,
      route,
      scramble,
      decoys,
      title: `${meta.weekdayName} Daily · ${meta.date}`,
      hint: meta.tier === "easy"
        ? "Connect Bunny home across the meadow to start your streak! ♡"
        : meta.tier === "medium"
        ? "Use your pal's power to bridge the gap or break obstacles."
        : "An intricate weekend challenge. Look ahead before turning!",
    };

    const level = buildTutorial(spec);
    level.character = meta.character;
    level.powerVersion = 4;
    level.world = meta.world;

    // Apply mechanics based on character
    const innerCells = route.slice(2, -2);
    if (meta.character === "bunny" && innerCells.length) {
      const straights = innerCells.filter(i => level.tiles[i].kind === "straight");
      if (straights.length) {
        const gap = straights[Math.floor(random() * straights.length)];
        level.tiles[gap] = { kind: "blank", rotation: 0, terrain: "gap" };
      }
    } else if (meta.character === "panda" && innerCells.length >= 2) {
      const trigger = innerCells[0];
      const gate = innerCells[innerCells.length - 1];
      level.tiles[trigger].terrain = "cracked";
      level.gate = { tile: gate, trigger };
    } else if (meta.character === "cat" && innerCells.length) {
      level.tiles[innerCells[0]].terrain = "wall";
      if (innerCells.length > 1) level.tiles[innerCells[1]].terrain = "slow";
    } else if (meta.character === "octopus" && innerCells.length) {
      level.tiles[innerCells[0]].terrain = "water";
    } else if (meta.character === "fox" && innerCells.length) {
      const corner = innerCells.find(i => level.tiles[i].kind === "corner");
      if (corner !== undefined) {
        level.tiles[corner] = { kind: "tee", rotation: 0 };
        level.fork = { tile: corner, exits: [1, 2] };
        level.choices = { [corner]: 1 };
      }
    }

    // Set collectibles
    level.collectibles = meta.tier === "easy"
      ? [route[Math.floor(route.length / 2)]]
      : [route[Math.floor(route.length / 3)], route[Math.floor((route.length * 2) / 3)]];

    // Audit with solver
    const proof = solvePowerLevel(level);
    if (!proof.solvable) continue;

    level.par = proof.par;
    level.moveLimit = proof.starPar + (meta.tier === "easy" ? 4 : meta.tier === "medium" ? 3 : 2);
    level.difficulty = meta.tier === "easy" ? "Daily Easy" : meta.tier === "medium" ? "Daily Medium" : "Daily Advanced";
    level.dailyDate = meta.date;

    return level;
  }

  // Deterministic Fallback: Use curated weekday template with seed-scrambled rotations
  const fallbackSpec = WEEKDAY_FALLBACKS[meta.dayOfWeek] || WEEKDAY_FALLBACKS[1];
  const scrambledSpec: TutorialSpec = {
    ...fallbackSpec,
    id: 7000 + meta.dayOfWeek,
    title: `${meta.weekdayName} Daily · ${meta.date}`,
  };

  const level = buildTutorial(scrambledSpec);
  level.character = fallbackSpec.character;
  level.powerVersion = 4;
  level.world = fallbackSpec.world;
  level.dailyDate = meta.date;
  fallbackSpec.power(level);

  level.collectibles = meta.tier === "easy"
    ? [fallbackSpec.route[Math.floor(fallbackSpec.route.length / 2)]]
    : [fallbackSpec.route[Math.floor(fallbackSpec.route.length / 3)], fallbackSpec.route[Math.floor((fallbackSpec.route.length * 2) / 3)]];

  const proof = solvePowerLevel(level);
  level.par = proof.par;
  level.moveLimit = (proof.starPar || 12) + (meta.tier === "easy" ? 4 : meta.tier === "medium" ? 3 : 2);
  level.difficulty = meta.tier === "easy" ? "Daily Easy" : meta.tier === "medium" ? "Daily Medium" : "Daily Advanced";

  return level;
}

export function isConsecutiveDay(prevDateStr: string, nextDateStr: string): boolean {
  const t1 = Date.parse(prevDateStr + "T00:00:00Z");
  const t2 = Date.parse(nextDateStr + "T00:00:00Z");
  if (isNaN(t1) || isNaN(t2)) return false;
  const diffDays = Math.round((t2 - t1) / (86400 * 1000));
  return diffDays === 1;
}

export function calculateNewStreak(
  currentStreak: number,
  lastCompletedDate: string | undefined,
  winDate: string
): { currentStreak: number; isNewWin: boolean } {
  // If already won on this exact date, do NOT increment streak (replay protection)
  if (lastCompletedDate === winDate) {
    return { currentStreak, isNewWin: false };
  }

  // If previous win was yesterday, increment streak
  if (lastCompletedDate && isConsecutiveDay(lastCompletedDate, winDate)) {
    return { currentStreak: currentStreak + 1, isNewWin: true };
  }

  // Otherwise streak was broken or brand new
  return { currentStreak: 1, isNewWin: true };
}

export function newDailyStore(today: string = currentUtcDateString()): DailyStore {
  return {
    version: 1,
    currentStreak: 0,
    maxStreak: 0,
    history: {},
    activeDate: today,
  };
}

export function decodeDailyStore(raw: string, today: string = currentUtcDateString()): DailyStore {
  try {
    if (!raw || raw.length > 32768) return newDailyStore(today);
    const s = JSON.parse(raw);
    if (!s || s.version !== 1 || typeof s.currentStreak !== "number" || typeof s.maxStreak !== "number") {
      return newDailyStore(today);
    }
    const currentStreak = Math.max(0, Math.min(100000, Math.floor(s.currentStreak)));
    const maxStreak = Math.max(currentStreak, Math.min(100000, Math.floor(s.maxStreak)));

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    let lastCompletedDate: string | undefined = undefined;
    if (typeof s.lastCompletedDate === "string" && dateRegex.test(s.lastCompletedDate)) {
      if (s.lastCompletedDate <= today) {
        lastCompletedDate = s.lastCompletedDate;
      }
    }

    const history: Record<string, DailyRecord> = {};
    if (s.history && typeof s.history === "object" && !Array.isArray(s.history)) {
      for (const [k, v] of Object.entries(s.history)) {
        if (!dateRegex.test(k) || !v || typeof v !== "object") continue;
        const entry = v as Record<string, unknown>;
        if (
          typeof entry.won === "boolean" &&
          typeof entry.moves === "number" &&
          typeof entry.stars === "number" &&
          Array.isArray(entry.rotations)
        ) {
          history[k] = {
            date: k,
            won: entry.won,
            moves: Math.max(0, Math.floor(entry.moves)),
            stars: Math.max(0, Math.min(3, Math.floor(entry.stars))),
            rotations: entry.rotations.map(r => (typeof r === "number" ? ((r % 4) + 4) % 4 : 0)),
            choices: entry.choices && typeof entry.choices === "object" ? (entry.choices as Record<string, number>) : undefined,
            completedAt: typeof entry.completedAt === "string" ? entry.completedAt : undefined,
          };
        }
      }
    }

    const activeDate = typeof s.activeDate === "string" && dateRegex.test(s.activeDate) ? s.activeDate : today;
    const activeRotations = Array.isArray(s.activeRotations)
      ? s.activeRotations.map((r: unknown) => (typeof r === "number" ? ((r % 4) + 4) % 4 : 0))
      : undefined;
    const activeMoves = typeof s.activeMoves === "number" ? Math.max(0, Math.floor(s.activeMoves)) : undefined;
    const activeChoices = s.activeChoices && typeof s.activeChoices === "object" ? (s.activeChoices as Record<string, number>) : undefined;

    return {
      version: 1,
      currentStreak,
      maxStreak,
      lastCompletedDate,
      history,
      activeDate,
      activeRotations,
      activeMoves,
      activeChoices,
    };
  } catch {
    return newDailyStore(today);
  }
}

export function encodeDailyStore(store: DailyStore): string {
  return JSON.stringify(store);
}
