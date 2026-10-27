import {tracePath, type Level} from "../engine";
import { CAMPAIGN_V2_ID, GENERATOR_VERSION, WORLD_1_ID, getTargetBandForLevel } from "./constants";
import { WORLD_1_SPECS, buildAuthoredLevel } from "./world1-specs";
import { solvePowerLevel } from "../power-solver";

export interface ResolvedWorld1Level extends Level {
  campaignId: typeof CAMPAIGN_V2_ID;
  generatorVersion: typeof GENERATOR_VERSION;
  characterWorldId: typeof WORLD_1_ID;
  solverPar: number;
  solverStarPar: number;
  moveLimit: number;
  targetBand: { band: number; minPar: number; maxPar: number };
}

const resolvedLevelCache = new Map<number, ResolvedWorld1Level>();

/** Fixed authored content. Seed is a validated uint32 compatibility parameter,
 * not a request for a different puzzle. Unsupported identities fail closed. */
export function resolveWorld1Level(levelId: number, seed = 0,
  identity: {campaignId?: string; generatorVersion?: string} = {}): ResolvedWorld1Level {
  if ((identity.campaignId ?? CAMPAIGN_V2_ID) !== CAMPAIGN_V2_ID) throw new Error("Unsupported campaign ID");
  if ((identity.generatorVersion ?? GENERATOR_VERSION) !== GENERATOR_VERSION) throw new Error("Unsupported generator version");
  if (!Number.isSafeInteger(levelId) || levelId < 1 || levelId > 50) throw new Error(`Invalid level ID ${levelId}`);
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff) throw new Error(`Invalid seed ${seed}: expected uint32`);
  const cached = resolvedLevelCache.get(levelId);
  if (cached) return structuredClone(cached);
  const spec = WORLD_1_SPECS.find(s => s.id === levelId);
  if (!spec) throw new Error(`Authored specification for level ${levelId} not found`);
  const level = validateWorld1Content(buildAuthoredLevel(spec));
  resolvedLevelCache.set(levelId, structuredClone(level));
  return level;
}

/** The same acceptance gate is used by the resolver and negative-content tests. */
export function validateWorld1Content(level: Level, budget = 100000): ResolvedWorld1Level {
  const sol = solvePowerLevel(level, "bunny", budget);
  if (sol.exhausted || !sol.solvable || !Number.isFinite(sol.par) || !Number.isFinite(sol.starPar) || !sol.solution) {
    throw new Error(`Level ${level.id}: completion and all-star proof required`);
  }
  const walk = tracePath(level, sol.solution);
  if (walk.outcome !== "home" || !(level.collectibles ?? []).every(i => walk.path.includes(i))) {
    throw new Error(`Level ${level.id}: all-star engine replay failed`);
  }
  const targetBand = getTargetBandForLevel(level.id);
  if (sol.par < targetBand.minPar || sol.par > targetBand.maxPar) throw new Error(`Level ${level.id}: par outside difficulty band`);
  const moveLimit = sol.starPar + 3;
  if (!Number.isSafeInteger(moveLimit) || moveLimit < sol.starPar) throw new Error("Invalid move budget");
  return structuredClone({...level, campaignId: CAMPAIGN_V2_ID, generatorVersion: GENERATOR_VERSION,
    characterWorldId: WORLD_1_ID, par: sol.par, solverPar: sol.par, solverStarPar: sol.starPar,
    moveLimit, targetBand});
}

export function getAllWorld1Levels(): ResolvedWorld1Level[] {
  return Array.from({length: 50}, (_,i) => resolveWorld1Level(i+1));
}
export { CAMPAIGN_V2_ID, GENERATOR_VERSION };
