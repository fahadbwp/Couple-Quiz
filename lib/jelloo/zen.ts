import { neighbour, type Direction, type Level } from "./engine";
import { solvePowerLevel } from "./power-solver";
import { buildTutorial, type TutorialSpec } from "./levels";
import { worlds, isWorldUnlocked, type WorldId } from "./worlds";

export const ZEN_SAVE_KEY = "jelloo.zen.v1";
export type ZenSize = 4 | 5 | 6;

export const ZEN_SIZE_LABELS: Record<ZenSize, string> = {
  4: "Cozy (4×4)",
  5: "Classic (5×5)",
  6: "Spacious (6×6)",
};

export interface ZenStore {
  version: 1;
  size: ZenSize;
  world: WorldId;
  solvedCount: number;
  seed: number;
  activeRotations?: number[];
  activeMoves?: number;
}

export function newZenStore(): ZenStore {
  return {
    version: 1,
    size: 5,
    world: "meadow",
    solvedCount: 0,
    seed: 101,
  };
}

export function decodeZenStore(raw: string, completedAdventureLevels: number = 0): ZenStore {
  try {
    if (!raw || raw.length > 8192) return newZenStore();
    const s = JSON.parse(raw);
    if (!s || s.version !== 1) return newZenStore();

    const size: ZenSize = s.size === 4 || s.size === 6 ? s.size : 5;
    let world: WorldId = typeof s.world === "string" && ["meadow", "beach", "snow", "candy", "space"].includes(s.world)
      ? (s.world as WorldId)
      : "meadow";

    // Strictly enforce: locked worlds cannot be selected or loaded
    if (!isWorldUnlocked(world, completedAdventureLevels)) {
      world = "meadow";
    }

    const solvedCount = Math.max(0, Math.min(1000000, Math.floor(typeof s.solvedCount === "number" ? s.solvedCount : 0)));
    const seed = Math.max(1, Math.min(0xffffffff, Math.floor(typeof s.seed === "number" ? s.seed : 101)));

    const activeRotations = Array.isArray(s.activeRotations)
      ? s.activeRotations.map((r: unknown) => (typeof r === "number" ? ((r % 4) + 4) % 4 : 0))
      : undefined;
    const activeMoves = typeof s.activeMoves === "number" ? Math.max(0, Math.floor(s.activeMoves)) : undefined;

    return {
      version: 1,
      size,
      world,
      solvedCount,
      seed,
      activeRotations,
      activeMoves,
    };
  } catch {
    return newZenStore();
  }
}

export function encodeZenStore(store: ZenStore): string {
  return JSON.stringify(store);
}

// Curated fallback templates for each size (4, 5, 6)
const ZEN_FALLBACKS: Record<ZenSize, TutorialSpec> = {
  4: {
    id: 9004,
    size: 4,
    route: [0, 1, 2, 6, 10, 14, 15],
    scramble: { 1: 1, 2: 3, 6: 1, 10: 3, 14: 1 },
    decoys: [[3, "corner", 2], [5, "straight", 1], [9, "corner", 0]],
    title: "Zen Cozy Meadow",
    hint: "No moves limit, no rush. Take your time to connect home. ♡",
  },
  5: {
    id: 9005,
    size: 5,
    route: [0, 1, 6, 11, 12, 13, 18, 23, 24],
    scramble: { 1: 3, 6: 1, 11: 3, 12: 1, 13: 3, 18: 1, 23: 3 },
    decoys: [[2, "corner", 2], [7, "straight", 0], [17, "corner", 1], [22, "straight", 1]],
    title: "Zen Classic Meadow",
    hint: "No moves limit, no rush. Take your time to connect home. ♡",
  },
  6: {
    id: 9006,
    size: 6,
    route: [0, 1, 2, 8, 14, 20, 26, 32, 33, 34, 35],
    scramble: { 1: 1, 2: 3, 8: 1, 14: 3, 20: 1, 26: 3, 32: 1, 33: 3, 34: 1 },
    decoys: [[3, "straight", 0], [7, "corner", 1], [15, "corner", 2], [21, "straight", 1], [27, "corner", 0]],
    title: "Zen Spacious Meadow",
    hint: "No moves limit, no rush. Take your time to connect home. ♡",
  },
};

export function generateZenLevel(size: ZenSize, seed: number, world: WorldId = "meadow"): Level {
  const worldDef = worlds.find(w => w.id === world) || worlds[0];
  let value = seed;
  const random = () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };

  const routeLength = size === 4 ? 7 : size === 5 ? 11 : 15;
  const maxSearchBudget = 250;

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
    const decoyRate = size === 4 ? 0.2 : size === 5 ? 0.3 : 0.4;
    for (let i = 0; i < size * size; i++) {
      if (!route.includes(i) && random() < decoyRate) {
        decoys.push([i, random() < 0.5 ? "straight" : "corner", Math.floor(random() * 4)]);
      }
    }

    const sizeName = size === 4 ? "Cozy" : size === 5 ? "Classic" : "Spacious";
    const spec: TutorialSpec = {
      id: 9000 + size,
      size,
      route,
      scramble,
      decoys,
      title: `Zen ${sizeName} · ${worldDef.name}`,
      hint: "No moves limit, no rush. Rotate the tiles gently to connect home. ♡",
    };

    const level = buildTutorial(spec);
    level.character = "bunny";
    level.powerVersion = 4;
    level.world = world;
    // Core Zen Requirement: No move limits!
    level.moveLimit = undefined;
    level.difficulty = "Zen";
    level.collectibles = [route[Math.floor(route.length / 2)]];

    const proof = solvePowerLevel(level);
    if (!proof.solvable) continue;

    level.par = proof.par;
    return level;
  }

  // Deterministic Fallback Template
  const fallback = ZEN_FALLBACKS[size];
  const sizeName = size === 4 ? "Cozy" : size === 5 ? "Classic" : "Spacious";
  const scrambledSpec: TutorialSpec = {
    ...fallback,
    title: `Zen ${sizeName} · ${worldDef.name}`,
  };

  const level = buildTutorial(scrambledSpec);
  level.character = "bunny";
  level.powerVersion = 4;
  level.world = world;
  level.moveLimit = undefined;
  level.difficulty = "Zen";
  level.collectibles = [fallback.route[Math.floor(fallback.route.length / 2)]];

  const proof = solvePowerLevel(level);
  level.par = proof.par || 8;
  return level;
}
