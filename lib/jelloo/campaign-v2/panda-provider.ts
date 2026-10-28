import { buildAuthoredLevel } from "./rectangular-authoring";
import { PANDA_SPECS, PANDA_PLANS } from "./panda-specs";
import { solvePowerLevel } from "../power-solver";
import { tracePath, type GameState, type Level } from "../engine";
import { collectedStars } from "../scoring";

export const PANDA_REVISION = "panda-5x4-v1" as const;

export interface PandaLevel extends Level {
  campaignId: "character_worlds_v2";
  generatorVersion: string;
  characterWorldId: "bamboo_jungle";
  solverPar: number;
  solverStarPar: number;
  moveLimit: number;
  targetBand: { band: number; minPar: number; maxPar: number };
  contentRevision: typeof PANDA_REVISION;
}

const cache = new Map<number, PandaLevel>();

export function pandaLevel(id: number): PandaLevel {
  if (!Number.isInteger(id) || id < 51 || id > 100) {
    throw new Error("Invalid Panda level: must be 51 to 100");
  }
  const cached = cache.get(id);
  if (cached) return structuredClone(cached);

  const spec = PANDA_SPECS[id - 51];
  const level = buildAuthoredLevel(spec);
  const proof = solvePowerLevel(level, "panda");

  if (
    !proof.solvable ||
    proof.exhausted ||
    !proof.solution ||
    !Number.isFinite(proof.starPar) ||
    proof.par !== PANDA_PLANS[id].par ||
    proof.starPar !== PANDA_PLANS[id].starPar ||
    level.collectibles?.length !== 2 ||
    new Set(level.collectibles).size !== 2
  ) {
    throw new Error(`Unverified Panda level ${id}`);
  }

  const walk = tracePath(level, proof.solution);
  if (walk.outcome !== "home" || !level.collectibles.every(i => walk.path.includes(i))) {
    throw new Error(`Unreachable pickup in Panda level ${id}`);
  }

  const band = Math.floor((id - 51) / 10) + 1; // 1 to 5
  const result: PandaLevel = {
    ...level,
    campaignId: "character_worlds_v2",
    generatorVersion: "2.0.0",
    characterWorldId: "bamboo_jungle",
    contentRevision: PANDA_REVISION,
    par: proof.par,
    solverPar: proof.par,
    solverStarPar: proof.starPar,
    moveLimit: proof.starPar + 3,
    targetBand: { band, minPar: band === 5 ? 11 : id <= 54 ? 3 : 4 + (band - 1) * 2, maxPar: 25 },
  };

  cache.set(id, result);
  return structuredClone(result);
}

export const allPandaLevels = () => Array.from({ length: 50 }, (_, i) => pandaLevel(i + 51));

export function pandaScore(game: GameState) {
  const collected = collectedStars(game).length;
  const total = game.level.collectibles?.length ?? 0;
  return {
    stars: game.status === "won" ? 1 + Math.min(2, collected) : 0,
    collected,
    total,
    withinLimit: game.moves <= (game.level.moveLimit ?? Infinity),
  };
}
