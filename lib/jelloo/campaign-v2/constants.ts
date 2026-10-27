/**
 * Campaign v2 World 1 (Pink Candy Land) Constants
 */

export const CAMPAIGN_V2_ID = "character_worlds_v2" as const;
export const GENERATOR_VERSION = "1.0.2" as const;

export const WORLD_1_ID = "candy_land" as const;
export const WORLD_1_NAME = "Pink Candy Land" as const;
export const WORLD_1_MASCOT = "bunny" as const;
export const WORLD_1_LEVEL_COUNT = 50;

export interface ParBandTarget {
  band: number;
  startLevel: number;
  endLevel: number;
  minPar: number;
  maxPar: number;
  label: string;
}

export const WORLD_1_PAR_BANDS: readonly ParBandTarget[] = [
  { band: 1, startLevel: 1, endLevel: 10, minPar: 3, maxPar: 8, label: "Band 1: Tutorial & First Hops" },
  { band: 2, startLevel: 11, endLevel: 20, minPar: 9, maxPar: 14, label: "Band 2: Twisting Sugar Trails" },
  { band: 3, startLevel: 21, endLevel: 30, minPar: 15, maxPar: 20, label: "Band 3: Confectionery Mazes" },
  { band: 4, startLevel: 31, endLevel: 40, minPar: 21, maxPar: 26, label: "Band 4: Intricate Candy Labyrinths" },
  { band: 5, startLevel: 41, endLevel: 49, minPar: 27, maxPar: 32, label: "Band 5: Master Puzzles" },
  { band: 6, startLevel: 50, endLevel: 50, minPar: 20, maxPar: 35, label: "Finale: Strawberry Cottage" },
] as const;

export function getTargetBandForLevel(levelId: number): ParBandTarget {
  const target = WORLD_1_PAR_BANDS.find(b => levelId >= b.startLevel && levelId <= b.endLevel);
  if (!target) {
    throw new Error(`Level ID ${levelId} is outside World 1 range (1–50).`);
  }
  return target;
}
