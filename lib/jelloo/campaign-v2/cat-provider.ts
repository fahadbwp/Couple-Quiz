import { buildAuthoredLevel } from "./rectangular-authoring";
import { CAT_SPECS, CAT_PLANS } from "./cat-specs";
import { solvePowerLevel } from "../power-solver";
import { tracePath, type GameState, type Level } from "../engine";
import { collectedStars } from "../scoring";

export const CAT_REVISION = "cat-6x4-v1" as const;

export interface CatLevel extends Level {
  campaignId: "character_worlds_v2";
  generatorVersion: string;
  characterWorldId: "cozy_rooftops";
  solverPar: number;
  solverStarPar: number;
  moveLimit: number;
  targetBand: { band: number; minPar: number; maxPar: number };
  contentRevision: typeof CAT_REVISION;
}

const cache = new Map<number, CatLevel>();

export function catLevel(id: number): CatLevel {
  if (!Number.isInteger(id) || id < 101 || id > 150) {
    throw new Error("Invalid Cat level: must be 101 to 150");
  }
  const cached = cache.get(id);
  if (cached) return structuredClone(cached);

  const spec = CAT_SPECS[id - 101];
  const level = buildAuthoredLevel(spec);
  const proof = solvePowerLevel(level, "cat");

  if (
    !proof.solvable ||
    proof.exhausted ||
    !proof.solution ||
    !Number.isFinite(proof.starPar) ||
    proof.par !== CAT_PLANS[id].par ||
    proof.starPar !== CAT_PLANS[id].starPar ||
    level.collectibles?.length !== 2 ||
    new Set(level.collectibles).size !== 2
  ) {
    throw new Error(`Unverified Cat level ${id}`);
  }

  const walk = tracePath(level, proof.solution);
  if (walk.outcome !== "home" || !level.collectibles.every(i => walk.path.includes(i))) {
    throw new Error(`Unreachable pickup in Cat level ${id}`);
  }

  const band = Math.floor((id - 101) / 10) + 1; // 1 to 5
  const result: CatLevel = {
    ...level,
    campaignId: "character_worlds_v2",
    generatorVersion: "2.0.0",
    characterWorldId: "cozy_rooftops",
    contentRevision: CAT_REVISION,
    par: proof.par,
    solverPar: proof.par,
    solverStarPar: proof.starPar,
    moveLimit: proof.starPar + 3,
    targetBand: { band, minPar: band === 5 ? 11 : id <= 104 ? 3 : 4 + (band - 1) * 2, maxPar: 30 },
  };

  cache.set(id, result);
  return structuredClone(result);
}

export const allCatLevels = () => Array.from({ length: 50 }, (_, i) => catLevel(i + 101));

export function catScore(game: GameState) {
  const collected = collectedStars(game).length;
  const total = game.level.collectibles?.length ?? 0;
  return {
    stars: game.status === "won" ? 1 + Math.min(2, collected) : 0,
    collected,
    total,
    withinLimit: game.moves <= (game.level.moveLimit ?? Infinity),
  };
}
