import type { Character } from "./engine";

/**
 * Jelloo Character Worlds Campaign Definition & Pure Star-Gate Progression Rules
 *
 * Architecture Invariants:
 * - Campaign v2 is strictly separate from the legacy campaign (lib/jelloo/worlds.ts).
 * - All 5 worlds in production metadata are "planned" until their puzzles and generators
 *   are built and validated in subsequent phases.
 * - Star gates are calculated on WORLD-LOCAL level numbers (1–50 per world).
 * - Zero UI dependencies: all progression calculations are pure functions.
 * - Game-engine victory verification is a separate integration requirement: receiving a star
 *   number here verifies progression eligibility, but engine-level win verification
 *   occurs in the gameplay runner when the generator is implemented.
 */

export type CampaignVersion = "v1_legacy" | "v2_character_worlds";

export type CharacterWorldId =
  | "candy_land"
  | "bamboo_jungle"
  | "cozy_rooftops"
  | "ocean_paradise"
  | "enchanted_forest";

export type WorldAvailability = "available" | "planned";

export interface CharacterWorldDefinition {
  id: CharacterWorldId;
  worldNumber: 1 | 2 | 3 | 4 | 5;
  name: string;
  tagline: string;
  mascot: Character;
  startLevel: number;
  endLevel: number;
  levelCount: 50;
  availability: WorldAvailability;
  theme: {
    pageBg: string;
    boardFrame: string;
    boardBorder: string;
    pipeEdge: string;
    pipeFill: string;
    connectedEdge: string;
    connectedFill: string;
    text: string;
    accent: string;
    homeName: string;
    badge: string;
    icon: string;
  };
}

/**
 * Approved Character Worlds specification: 5 worlds × 50 levels = 250 levels.
 *
 * Invariant: All 5 worlds are marked as "planned" in production metadata because
 * Campaign v2 puzzles are not yet built. Production metadata must not claim that
 * World 1 content exists before the generator is implemented. Tests may explicitly
 * inject disposable availability fixtures.
 */
export const CHARACTER_WORLDS: readonly CharacterWorldDefinition[] = [
  {
    id: "candy_land",
    worldNumber: 1,
    name: "Pink Candy Land",
    tagline: "Sweet frosting paths and strawberry cottages",
    mascot: "bunny",
    startLevel: 1,
    endLevel: 50,
    levelCount: 50,
    availability: "planned", // Unbuilt: marked planned until Phase 3 generator
    theme: {
      pageBg: "#fff5f8",
      boardFrame: "#702e52",
      boardBorder: "#f67280",
      pipeEdge: "#ff9a9e",
      pipeFill: "#fecfef",
      connectedEdge: "#20c997",
      connectedFill: "#a7ecc8",
      text: "#59253e",
      accent: "#d94f70",
      homeName: "Strawberry Cottage",
      badge: "🍬 Pink Candy Land",
      icon: "🐰",
    },
  },
  {
    id: "bamboo_jungle",
    worldNumber: 2,
    name: "Bamboo Jungle",
    tagline: "Verdant bamboo chutes and peaceful streams",
    mascot: "panda",
    startLevel: 51,
    endLevel: 100,
    levelCount: 50,
    availability: "planned",
    theme: {
      pageBg: "#f4f9f2",
      boardFrame: "#2d5a27",
      boardBorder: "#52b788",
      pipeEdge: "#74c69d",
      pipeFill: "#d8f3dc",
      connectedEdge: "#40916c",
      connectedFill: "#b7e4c7",
      text: "#1b4332",
      accent: "#2d6a4f",
      homeName: "Bamboo Pagoda",
      badge: "🎋 Bamboo Jungle",
      icon: "🐼",
    },
  },
  {
    id: "cozy_rooftops",
    worldNumber: 3,
    name: "Cozy Rooftops",
    tagline: "Sun-warmed terracotta tiles and flowerpot vistas",
    mascot: "cat",
    startLevel: 101,
    endLevel: 150,
    levelCount: 50,
    availability: "planned",
    theme: {
      pageBg: "#fdf8f4",
      boardFrame: "#7f4f24",
      boardBorder: "#ddb892",
      pipeEdge: "#e07a5f",
      pipeFill: "#f4a261",
      connectedEdge: "#2a9d8f",
      connectedFill: "#e9c46a",
      text: "#4a3525",
      accent: "#e76f51",
      homeName: "Rooftop Villa",
      badge: "🏘️ Cozy Rooftops",
      icon: "🐱",
    },
  },
  {
    id: "ocean_paradise",
    worldNumber: 4,
    name: "Ocean Paradise",
    tagline: "Crystal tidepools and glowing coral pathways",
    mascot: "octopus",
    startLevel: 151,
    endLevel: 200,
    levelCount: 50,
    availability: "planned",
    theme: {
      pageBg: "#f0f8ff",
      boardFrame: "#1a4971",
      boardBorder: "#4ea8de",
      pipeEdge: "#7209b7",
      pipeFill: "#b5e2fa",
      connectedEdge: "#00b4d8",
      connectedFill: "#90e0ef",
      text: "#03045e",
      accent: "#4361ee",
      homeName: "Giant Seashell",
      badge: "🌊 Ocean Paradise",
      icon: "🐙",
    },
  },
  {
    id: "enchanted_forest",
    worldNumber: 5,
    name: "Enchanted Forest",
    tagline: "Golden autumn groves and mystical mushroom trails",
    mascot: "fox",
    startLevel: 201,
    endLevel: 250,
    levelCount: 50,
    availability: "planned",
    theme: {
      pageBg: "#fff9f0",
      boardFrame: "#6a381f",
      boardBorder: "#d48c46",
      pipeEdge: "#e36414",
      pipeFill: "#f8d5a3",
      connectedEdge: "#588157",
      connectedFill: "#a3b18a",
      text: "#3d1308",
      accent: "#fb8500",
      homeName: "Forest Den",
      badge: "🍂 Enchanted Forest",
      icon: "🦊",
    },
  },
];

export const TOTAL_CAMPAIGN_LEVELS = 250;
export const WORLD_LEVEL_COUNT = 50;

/**
 * Star Gate requirements mapped to WORLD-LOCAL level numbers (1–50).
 * Preceding levels in the current world must yield at least this many stars.
 */
export const LOCAL_STAR_GATES: Readonly<Record<number, number>> = {
  10: 15,  // requires 15 stars from local levels 1–9 (max 27)
  20: 36,  // requires 36 stars from local levels 1–19 (max 57)
  30: 60,  // requires 60 stars from local levels 1–29 (max 87)
  40: 84,  // requires 84 stars from local levels 1–39 (max 117)
  50: 110, // requires 110 stars from local levels 1–49 (max 147)
};

/**
 * Star threshold in current world required to unlock the subsequent world.
 */
export const NEXT_WORLD_STAR_THRESHOLD = 120; // 120 / 150 stars (80%)

/**
 * Resolves the CharacterWorldDefinition for a given global level (1–250).
 */
export function worldForCampaignLevel(levelId: number): CharacterWorldDefinition | null {
  if (!Number.isSafeInteger(levelId) || levelId < 1 || levelId > TOTAL_CAMPAIGN_LEVELS) {
    return null;
  }
  const index = Math.floor((levelId - 1) / WORLD_LEVEL_COUNT);
  return CHARACTER_WORLDS[index] ?? null;
}

/**
 * Converts a global level ID (1–250) to a world-local level number (1–50).
 */
export function toLocalLevel(levelId: number): number | null {
  if (!Number.isSafeInteger(levelId) || levelId < 1 || levelId > TOTAL_CAMPAIGN_LEVELS) {
    return null;
  }
  return ((levelId - 1) % WORLD_LEVEL_COUNT) + 1;
}

/**
 * Converts a world number (1–5) and local level (1–50) to global level ID (1–250).
 */
export function toGlobalLevel(worldNumber: number, localLevel: number): number | null {
  if (!Number.isSafeInteger(worldNumber) || worldNumber < 1 || worldNumber > 5) return null;
  if (!Number.isSafeInteger(localLevel) || localLevel < 1 || localLevel > WORLD_LEVEL_COUNT) return null;
  return (worldNumber - 1) * WORLD_LEVEL_COUNT + localLevel;
}

/**
 * Sums earned best stars strictly within the specified world.
 * - Maximum 3 stars per level.
 * - Replays never duplicate rewards.
 * - Unearned, non-positive or corrupted values are filtered out.
 * - Other worlds or legacy achievements do NOT count.
 */
export function getEarnedStarsForWorld(
  world: CharacterWorldDefinition,
  best: Record<string, number> | undefined | null
): number {
  if (!best || typeof best !== "object") return 0;
  let total = 0;
  for (let id = world.startLevel; id <= world.endLevel; id++) {
    const raw = best[String(id)];
    if (typeof raw === "number" && Number.isSafeInteger(raw) && raw > 0) {
      total += Math.min(3, raw);
    }
  }
  return total;
}

/**
 * Sums earned best stars in the specified world up to a specific local level (exclusive).
 * E.g. localLevel 10 sums levels 1..9 of that world.
 */
export function getEarnedStarsBeforeLocalLevel(
  world: CharacterWorldDefinition,
  localLevel: number,
  best: Record<string, number> | undefined | null
): number {
  if (!best || typeof best !== "object") return 0;
  let total = 0;
  for (let l = 1; l < localLevel && l <= WORLD_LEVEL_COUNT; l++) {
    const globalId = world.startLevel + (l - 1);
    const raw = best[String(globalId)];
    if (typeof raw === "number" && Number.isSafeInteger(raw) && raw > 0) {
      total += Math.min(3, raw);
    }
  }
  return total;
}

export type WorldAccessResult =
  | { status: "available"; world: CharacterWorldDefinition; worldStars: number }
  | {
      status: "locked";
      world: CharacterWorldDefinition;
      reason: "previous_world_incomplete" | "previous_world_stars_insufficient";
      requiredLevel: number;
      currentWorldStars: number;
      requiredStars: number;
    }
  | {
      status: "eligible_but_unimplemented";
      world: CharacterWorldDefinition;
      currentWorldStars: number;
    };

/**
 * Pure evaluation of a world's eligibility and availability.
 * - World 1 is always unlocked progression-wise, but subject to content availability.
 * - Worlds 2–5 require previous world finale completed AND >= 120 stars earned in that world.
 * - Strictly distinguishes between progression eligibility and actual content availability.
 */
export function evaluateWorldAccess(
  worldNumber: 1 | 2 | 3 | 4 | 5,
  completed: number,
  best: Record<string, number> | undefined | null,
  overrideAvailability?: (worldId: CharacterWorldId) => WorldAvailability
): WorldAccessResult {
  const worldIndex = worldNumber - 1;
  const world = CHARACTER_WORLDS[worldIndex];
  if (!world) throw new Error(`Unknown world number: ${worldNumber}`);

  const availability = overrideAvailability ? overrideAvailability(world.id) : world.availability;

  if (worldNumber === 1) {
    const worldStars = getEarnedStarsForWorld(world, best);
    return availability === "available"
      ? { status: "available", world, worldStars }
      : { status: "eligible_but_unimplemented", world, currentWorldStars: worldStars };
  }

  const prevWorld = CHARACTER_WORLDS[worldIndex - 1];
  const prevWorldFinale = prevWorld.endLevel;
  const prevWorldStars = getEarnedStarsForWorld(prevWorld, best);

  // Check 1: Finale completed
  if (completed < prevWorldFinale) {
    return {
      status: "locked",
      world,
      reason: "previous_world_incomplete",
      requiredLevel: prevWorldFinale,
      currentWorldStars: prevWorldStars,
      requiredStars: NEXT_WORLD_STAR_THRESHOLD,
    };
  }

  // Check 2: Minimum 120 earned stars in that world
  if (prevWorldStars < NEXT_WORLD_STAR_THRESHOLD) {
    return {
      status: "locked",
      world,
      reason: "previous_world_stars_insufficient",
      requiredLevel: prevWorldFinale,
      currentWorldStars: prevWorldStars,
      requiredStars: NEXT_WORLD_STAR_THRESHOLD,
    };
  }

  // Eligible! Now check if content is actually implemented
  const worldStars = getEarnedStarsForWorld(world, best);
  if (availability !== "available") {
    return {
      status: "eligible_but_unimplemented",
      world,
      currentWorldStars: worldStars,
    };
  }

  return {
    status: "available",
    world,
    worldStars,
  };
}

export type LevelAccessFailureReason =
  | "invalid_level_id"
  | "world_locked"
  | "world_unimplemented"
  | "sequential_progression_locked"
  | "star_gate_locked";

export type LevelAccessResult =
  | {
      accessible: true;
      isReplay: boolean;
      world: CharacterWorldDefinition;
      localLevel: number;
    }
  | {
      accessible: false;
      world: CharacterWorldDefinition | null;
      localLevel: number | null;
      reason: LevelAccessFailureReason;
      details: string;
      currentStars?: number;
      requiredStars?: number;
      lockedGateLocalLevel?: number;
    };

/**
 * Pure evaluation of whether a specific level can be played or replayed.
 *
 * Invariants:
 * - Content must be available (unimplemented content returns accessible: false with world_unimplemented).
 * - Completed levels are ALWAYS replayable, even if a subsequent gate is locked.
 * - Replays improve recorded best scores without duplicate rewards.
 * - Next uncompleted level requires sequential progression (`id === completed + 1`).
 * - Star gates at local levels 10, 20, 30, 40, 50 require earned stars from earlier
 *   levels in that world.
 * - Direct jumping/URL manipulation past locked gates is rejected with the same policy.
 */
export function evaluateLevelAccess(
  levelId: number,
  completed: number,
  best: Record<string, number> | undefined | null,
  overrideAvailability?: (worldId: CharacterWorldId) => WorldAvailability
): LevelAccessResult {
  if (!Number.isSafeInteger(levelId) || levelId < 1 || levelId > TOTAL_CAMPAIGN_LEVELS) {
    return {
      accessible: false,
      world: null,
      localLevel: null,
      reason: "invalid_level_id",
      details: `Level ${levelId} is outside valid campaign range (1–${TOTAL_CAMPAIGN_LEVELS}).`,
    };
  }

  const world = worldForCampaignLevel(levelId)!;
  const localLevel = toLocalLevel(levelId)!;

  // 1. Evaluate world access first (checks previous world requirements & content availability)
  const worldAccess = evaluateWorldAccess(world.worldNumber, completed, best, overrideAvailability);
  if (worldAccess.status === "locked") {
    return {
      accessible: false,
      world,
      localLevel,
      reason: "world_locked",
      details: `${world.name} is locked. Complete ${worldAccess.requiredLevel} with at least ${worldAccess.requiredStars} stars in the previous world.`,
      currentStars: worldAccess.currentWorldStars,
      requiredStars: worldAccess.requiredStars,
    };
  }
  if (worldAccess.status === "eligible_but_unimplemented") {
    return {
      accessible: false,
      world,
      localLevel,
      reason: "world_unimplemented",
      details: `${world.name} (Levels ${world.startLevel}–${world.endLevel}) is planned and not yet available.`,
      currentStars: worldAccess.currentWorldStars,
    };
  }

  // 2. Completed levels are replayable
  if (levelId <= completed) {
    return {
      accessible: true,
      isReplay: true,
      world,
      localLevel,
    };
  }

  // 3. Sequential progression: cannot skip ahead past next unsolved level
  if (levelId > completed + 1) {
    return {
      accessible: false,
      world,
      localLevel,
      reason: "sequential_progression_locked",
      details: `Level ${levelId} is locked. Complete Level ${completed + 1} first.`,
    };
  }

  // 4. At this point, levelId === completed + 1. Check all star gates up to this local level!
  const gates = [10, 20, 30, 40, 50];
  for (const gateLocal of gates) {
    if (localLevel >= gateLocal) {
      const required = LOCAL_STAR_GATES[gateLocal];
      const earned = getEarnedStarsBeforeLocalLevel(world, gateLocal, best);
      if (earned < required) {
        return {
          accessible: false,
          world,
          localLevel,
          reason: "star_gate_locked",
          details: `Star Gate at Level ${toGlobalLevel(world.worldNumber, gateLocal)} requires ${required} stars from earlier levels in ${world.name} (currently ${earned}).`,
          currentStars: earned,
          requiredStars: required,
          lockedGateLocalLevel: gateLocal,
        };
      }
    }
  }

  // All gates passed, sequential check passed!
  return {
    accessible: true,
    isReplay: false,
    world,
    localLevel,
  };
}

export type RecordResultOutcome =
  | {
      success: true;
      newCompleted: number;
      newBest: Record<string, number>;
      starsImproved: number;
      isFirstCompletion: boolean;
    }
  | {
      success: false;
      reason:
        | "invalid_level_id"
        | "invalid_completed_count"
        | "invalid_stars"
        | "level_not_accessible";
      error: string;
      accessFailureReason?: LevelAccessFailureReason;
    };

/**
 * Pure authoritative function to record a level completion or replay result.
 *
 * Invariants:
 * - Enforces valid level ID (1..250), completed count (0..250), and finite integer stars (1..3).
 * - Enforces the central level access policy (sequential progression, star gates, content availability).
 * - Replays improve recorded best scores (maximum 3 stars).
 * - Replays never duplicate completion rewards or lower the recorded best score.
 * - Advances `completed` strictly when completing the next uncompleted level with valid access.
 * - Reject invalid input without modifying progress; does NOT clamp NaN, Infinity, or invalid IDs.
 *
 * Integration Boundary:
 * - Validating stars here confirms campaign rule eligibility. Engine-level puzzle victory
 *   verification remains a separate gameplay-runner integration requirement when the Phase 3
 *   generator is connected.
 */
export function recordLevelResult(
  levelId: number,
  earnedStars: number,
  currentCompleted: number,
  currentBest: Record<string, number> = {},
  overrideAvailability?: (worldId: CharacterWorldId) => WorldAvailability
): RecordResultOutcome {
  // 1. Validate campaign level ID: must be safe integer in 1..TOTAL_CAMPAIGN_LEVELS
  if (!Number.isSafeInteger(levelId) || levelId < 1 || levelId > TOTAL_CAMPAIGN_LEVELS) {
    return {
      success: false,
      reason: "invalid_level_id",
      error: `Level ID ${levelId} is invalid. Must be an integer between 1 and ${TOTAL_CAMPAIGN_LEVELS}.`,
    };
  }

  // 2. Validate current completed count: must be safe integer in 0..TOTAL_CAMPAIGN_LEVELS
  if (
    !Number.isSafeInteger(currentCompleted) ||
    currentCompleted < 0 ||
    currentCompleted > TOTAL_CAMPAIGN_LEVELS
  ) {
    return {
      success: false,
      reason: "invalid_completed_count",
      error: `Current completed count ${currentCompleted} is invalid. Must be an integer between 0 and ${TOTAL_CAMPAIGN_LEVELS}.`,
    };
  }

  // 3. Validate earned stars: must be strict finite safe integer between 1 and 3 (no NaN, Infinity, floats, <=0, >3)
  if (
    typeof earnedStars !== "number" ||
    !Number.isSafeInteger(earnedStars) ||
    earnedStars < 1 ||
    earnedStars > 3
  ) {
    return {
      success: false,
      reason: "invalid_stars",
      error: `Earned stars value ${earnedStars} is invalid. Must be a finite safe integer between 1 and 3.`,
    };
  }

  // 4. Central access policy enforcement: verify the level is legally accessible to play or replay
  const access = evaluateLevelAccess(levelId, currentCompleted, currentBest, overrideAvailability);
  if (!access.accessible) {
    return {
      success: false,
      reason: "level_not_accessible",
      accessFailureReason: access.reason,
      error: access.details,
    };
  }

  // 5. Apply progression or replay update
  const prevBest = currentBest[String(levelId)] ?? 0;
  const newBestStar = Math.max(prevBest, earnedStars);
  const starsImproved = newBestStar - prevBest;

  const newBest: Record<string, number> = {
    ...currentBest,
    [String(levelId)]: newBestStar,
  };

  const isFirstCompletion = !access.isReplay && levelId === currentCompleted + 1;
  const newCompleted = isFirstCompletion ? currentCompleted + 1 : currentCompleted;

  return {
    success: true,
    newCompleted,
    newBest,
    starsImproved,
    isFirstCompletion,
  };
}
