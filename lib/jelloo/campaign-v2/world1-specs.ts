import type { TileKind, Direction, Tile, Level } from "../engine";
import { ports } from "../engine";

export function directionTo(from: number, to: number, size: number): Direction {
  const r1 = Math.floor(from / size), c1 = from % size;
  const r2 = Math.floor(to / size), c2 = to % size;
  if (r2 === r1 - 1 && c2 === c1) return 0;
  if (r2 === r1 && c2 === c1 + 1) return 1;
  if (r2 === r1 + 1 && c2 === c1) return 2;
  if (r2 === r1 && c2 === c1 - 1) return 3;
  throw new Error(`Non-adjacent cells: ${from} (${r1},${c1}) and ${to} (${r2},${c2}) on grid size ${size}`);
}

export interface AuthoredDecoy {
  index: number;
  kind: TileKind;
  rotation: number;
}

export interface AuthoredDetour {
  branchTile: number;
  detourRoute: number[];
  rejoinTile: number;
  collectible: number;
  scramble?: Record<number, number>;
}

export interface AuthoredLevelSpec {
  id: number;
  title: string;
  hint: string;
  size: number;
  route: number[];
  gaps?: number[];
  collectibles?: number[];
  scramble?: Record<number, number>;
  decoys?: AuthoredDecoy[];
  detour?: AuthoredDetour;
}

export function buildAuthoredLevel(spec: AuthoredLevelSpec): Level {
  const { size, route, gaps = [] } = spec;
  const start = route[0];
  const home = route[route.length - 1];

  const tiles: Tile[] = Array.from({ length: size * size }, () => ({
    kind: "blank",
    rotation: 0,
  }));

  // Start tile
  const startNext = route[1];
  const startExit = directionTo(start, startNext, size);
  tiles[start] = { kind: "start", rotation: 0, port: startExit };

  // Home tile
  const homePrev = route[route.length - 2];
  const homeEntry = (directionTo(homePrev, home, size) + 2) % 4 as Direction;
  tiles[home] = { kind: "home", rotation: 0, port: homeEntry };

  // Place gaps
  for (const g of gaps) {
    tiles[g] = { kind: "blank", rotation: 0, terrain: "gap" };
  }

  // Place path tiles
  for (let i = 1; i < route.length - 1; i++) {
    const curr = route[i];
    if (gaps.includes(curr)) continue;

    const prev = route[i - 1];
    const next = route[i + 1];

    const inDir = directionTo(prev, curr, size);
    const entry = (inDir + 2) % 4 as Direction;
    const exit = directionTo(curr, next, size);

    let kind: TileKind = "corner";
    if ((entry + 2) % 4 === exit) {
      kind = "straight";
    }

    const solvedRot = [0, 1, 2, 3].find(r => {
      const p = ports({ kind, rotation: r });
      return p.includes(entry) && p.includes(exit);
    });

    if (solvedRot === undefined) {
      throw new Error(`Level ${spec.id}: no rotation connects entry ${entry} to exit ${exit} for kind ${kind} at cell ${curr}`);
    }

    const scrambleTurns = spec.scramble?.[curr] ?? 1;
    const rotation = (solvedRot + scrambleTurns) % 4;
    tiles[curr] = { kind, rotation };
  }

  // Handle detour if specified
  if (spec.detour) {
    const { branchTile, detourRoute, rejoinTile, scramble = {} } = spec.detour;
    const fullDetour = [branchTile, ...detourRoute, rejoinTile];
    for (let i = 1; i < fullDetour.length - 1; i++) {
      const curr = fullDetour[i];
      const prev = fullDetour[i - 1];
      const next = fullDetour[i + 1];

      const inDir = directionTo(prev, curr, size);
      const entry = (inDir + 2) % 4 as Direction;
      const exit = directionTo(curr, next, size);

      let kind: TileKind = "corner";
      if ((entry + 2) % 4 === exit) kind = "straight";

      const solvedRot = [0, 1, 2, 3].find(r => {
        const p = ports({ kind, rotation: r });
        return p.includes(entry) && p.includes(exit);
      });
      if (solvedRot === undefined) {
        throw new Error(`Level ${spec.id} detour: no rotation connects entry ${entry} to exit ${exit} at cell ${curr}`);
      }
      const scrambleTurns = scramble[curr] ?? 1;
      tiles[curr] = { kind, rotation: (solvedRot + scrambleTurns) % 4 };
    }

    // Branch tile and Rejoin tile become tees
    const configureTee = (tileIdx: number, p1: Direction, p2: Direction, p3: Direction) => {
      const solvedRot = [0, 1, 2, 3].find(r => {
        const p = ports({ kind: "tee", rotation: r });
        return p.includes(p1) && p.includes(p2) && p.includes(p3);
      });
      if (solvedRot === undefined) {
        throw new Error(`Level ${spec.id}: no tee rotation connects ports [${p1}, ${p2}, ${p3}] at tile ${tileIdx}`);
      }
      const scrambleTurns = spec.scramble?.[tileIdx] ?? 0;
      tiles[tileIdx] = { kind: "tee", rotation: (solvedRot + scrambleTurns) % 4 };
    };

    // Calculate ports for branchTile
    const branchIdxInRoute = route.indexOf(branchTile);
    const branchPrev = route[branchIdxInRoute - 1];
    const branchNextMain = route[branchIdxInRoute + 1];
    const branchNextDetour = detourRoute[0];

    const branchEntry = (directionTo(branchPrev, branchTile, size) + 2) % 4 as Direction;
    const branchExitMain = directionTo(branchTile, branchNextMain, size);
    const branchExitDetour = directionTo(branchTile, branchNextDetour, size);
    configureTee(branchTile, branchEntry, branchExitMain, branchExitDetour);

    // Calculate ports for rejoinTile
    const rejoinIdxInRoute = route.indexOf(rejoinTile);
    const rejoinPrevMain = route[rejoinIdxInRoute - 1];
    const rejoinPrevDetour = detourRoute[detourRoute.length - 1];
    const rejoinNext = route[rejoinIdxInRoute + 1];

    const rejoinEntryMain = (directionTo(rejoinPrevMain, rejoinTile, size) + 2) % 4 as Direction;
    const rejoinEntryDetour = (directionTo(rejoinPrevDetour, rejoinTile, size) + 2) % 4 as Direction;
    const rejoinExit = directionTo(rejoinTile, rejoinNext, size);
    configureTee(rejoinTile, rejoinEntryMain, rejoinEntryDetour, rejoinExit);
  }

  // Place decoys
  for (const decoy of spec.decoys ?? []) {
    if (tiles[decoy.index].kind === "blank" && tiles[decoy.index].terrain !== "gap") {
      tiles[decoy.index] = { kind: decoy.kind, rotation: decoy.rotation };
    }
  }

  const collectibles = spec.collectibles ?? (spec.detour ? [spec.detour.collectible] : [route[Math.floor(route.length / 2)]]);

  return {
    id: spec.id,
    title: spec.title,
    hint: spec.hint,
    size,
    start,
    home,
    tiles,
    character: "bunny",
    powerVersion: 4,
    collectibles,
  };
}

export const WORLD_1_SPECS: AuthoredLevelSpec[] = [
  // --- BAND 1: Levels 1–10 (Size 4, Par Target: 3–8) ---
  { id: 1, title: "Sugar Hop", hint: "Turn the candy road toward home.", size: 4, route: [0, 1, 2, 6, 10], scramble: { 1: 1, 2: 1, 6: 1 }, decoys: [{ index: 5, kind: "corner", rotation: 0 }, { index: 9, kind: "straight", rotation: 1 }] },
  { id: 2, title: "Peppermint Bend", hint: "Curve past the peppermint swirl.", size: 4, route: [12, 13, 9, 5, 6, 7], scramble: { 13: 1, 9: 2, 5: 1, 6: 2 }, decoys: [{ index: 1, kind: "corner", rotation: 2 }, { index: 14, kind: "straight", rotation: 0 }] },
  { id: 3, title: "Lollipop Lane", hint: "Spiral through the lollipop trees.", size: 4, route: [3, 7, 6, 5, 9, 10, 14], scramble: { 7: 3, 6: 1, 5: 3, 9: 3, 10: 3 }, decoys: [{ index: 0, kind: "corner", rotation: 3 }, { index: 13, kind: "straight", rotation: 1 }] },
  { id: 4, title: "Marshmallow Crossing", hint: "Zig-zag along soft marshmallow blocks.", size: 4, route: [0, 4, 5, 9, 10, 14, 15], scramble: { 4: 3, 5: 3, 9: 2, 10: 3, 14: 2 }, decoys: [{ index: 1, kind: "corner", rotation: 1 }, { index: 6, kind: "straight", rotation: 0 }] },
  { id: 5, title: "Cotton Candy Chasm", hint: "Use Bunny's single hop to cross the candy gap!", size: 4, route: [0, 1, 5, 9, 13, 14], gaps: [5], collectibles: [9], scramble: { 1: 2, 9: 1, 13: 2 }, decoys: [{ index: 2, kind: "corner", rotation: 0 }, { index: 6, kind: "straight", rotation: 1 }] }, // Power 1
  { id: 6, title: "Caramel Twist", hint: "Loop around the caramel pool.", size: 4, route: [15, 11, 7, 6, 5, 9, 13], scramble: { 11: 3, 7: 2, 6: 3, 5: 3, 9: 2 }, decoys: [{ index: 10, kind: "corner", rotation: 3 }, { index: 2, kind: "straight", rotation: 0 }] },
  { id: 7, title: "Jellybean Jive", hint: "Guide Bunny through the colorful jellybean bends.", size: 4, route: [12, 8, 9, 10, 6, 2, 3], scramble: { 8: 2, 9: 1, 10: 2, 6: 1, 2: 2 }, decoys: [{ index: 13, kind: "corner", rotation: 1 }, { index: 1, kind: "straight", rotation: 1 }] },
  { id: 8, title: "Licorice Leap", hint: "Jump the sticky licorice gap to reach home.", size: 4, route: [3, 7, 11, 15, 14, 13], gaps: [11], collectibles: [14], scramble: { 7: 2, 14: 1 }, decoys: [{ index: 2, kind: "corner", rotation: 2 }, { index: 10, kind: "straight", rotation: 0 }] }, // Power 2
  { id: 9, title: "Taffy Trail", hint: "Stretch around every candy obstacle.", size: 4, route: [15, 14, 13, 9, 5, 6, 2, 1, 0], scramble: { 14: 1, 13: 3, 9: 1, 5: 3, 6: 3, 2: 3, 1: 1 }, decoys: [{ index: 10, kind: "corner", rotation: 0 }, { index: 4, kind: "straight", rotation: 1 }] },
  { id: 10, title: "Gumdrop Gate", hint: "Band 1 finale: trace the long candy perimeter.", size: 4, route: [12, 13, 14, 10, 9, 5, 4, 0, 1], scramble: { 13: 3, 14: 3, 10: 2, 9: 3, 5: 3, 4: 3, 0: 3 }, decoys: [{ index: 8, kind: "corner", rotation: 3 }, { index: 6, kind: "straight", rotation: 0 }] },

  // --- BAND 2: Levels 11–20 (Par Target: 9–14) ---
  { id: 11, title: "Butterscotch Breeze", hint: "Navigate the winding butterscotch path.", size: 4, route: [15, 14, 13, 9, 10, 6, 5, 1, 0, 4], scramble: { 14: 1, 13: 3, 9: 1, 10: 3, 6: 1, 5: 3, 1: 1, 0: 3 }, decoys: [{ index: 8, kind: "corner", rotation: 1 }] },
  {
    id: 12, // Detour 1
    title: "Gummy Bear Fork",
    hint: "Detour Challenge: collect the golden star off the main path!",
    size: 4,
    route: [0, 1, 2, 6, 5, 4, 8, 9, 13, 14, 15],
    detour: { branchTile: 9, detourRoute: [10], rejoinTile: 14, collectible: 10, scramble: { 10: 1 } },
    scramble: { 1: 3, 2: 2, 6: 2, 5: 2, 4: 2, 8: 2, 9: 0, 13: 3, 14: 0 },
    decoys: [{ index: 7, kind: "corner", rotation: 1 }, { index: 11, kind: "straight", rotation: 0 }]
  },
  {
    id: 13, // Power 3
    title: "Bubblegum Bounce",
    hint: "Hop across the bubbly gum gap.",
    size: 4,
    route: [12, 13, 14, 10, 6, 2, 3, 7, 11, 15],
    gaps: [10], // jump 14 over 10 to 6
    collectibles: [6],
    scramble: { 13: 1, 14: 2, 6: 2, 2: 2, 3: 2, 7: 1, 11: 1 },
    decoys: [{ index: 8, kind: "corner", rotation: 0 }, { index: 5, kind: "straight", rotation: 1 }]
  },
  { id: 14, title: "Sugarplum Slalom", hint: "Weave between the sugarplum trees.", size: 4, route: [3, 2, 1, 5, 6, 7, 11, 10, 9, 13, 14], scramble: { 2: 3, 1: 3, 5: 3, 6: 1, 7: 3, 11: 1, 10: 3, 9: 1, 13: 3 }, decoys: [{ index: 0, kind: "corner", rotation: 2 }, { index: 15, kind: "corner", rotation: 3 }] },
  { id: 15, title: "Macaron Maze", hint: "Find your way through delicate macaron layers.", size: 4, route: [0, 1, 2, 3, 7, 6, 5, 4, 8, 9, 10, 14, 15], scramble: { 1: 1, 2: 2, 3: 3, 4: 0, 5: 1, 6: 3, 7: 1, 8: 1, 9: 3, 10: 1, 14: 0 }, decoys: [{ index: 11, kind: "straight", rotation: 0 }, { index: 13, kind: "straight", rotation: 1 }] },
  {
    id: 16, // Detour 2
    title: "Fudge Fall",
    hint: "Detour Challenge: sweet fudge branch costs extra moves.",
    size: 5,
    route: [0, 5, 10, 15, 16, 17, 12, 13, 14, 19, 24],
    detour: { branchTile: 16, detourRoute: [21, 22], rejoinTile: 17, collectible: 21, scramble: { 21: 2, 22: 2 } },
    scramble: { 5: 3, 10: 3, 15: 2, 16: 0, 17: 0, 12: 2, 13: 3, 14: 2, 19: 3 },
    decoys: [{ index: 6, kind: "corner", rotation: 1 }, { index: 11, kind: "straight", rotation: 0 }]
  },
  { id: 17, title: "Nougat Nook", hint: "Turn through dense nougat corridors.", size: 5, route: [20, 21, 16, 11, 12, 13, 8, 3, 4], scramble: { 21: 2, 16: 2, 11: 2, 12: 1, 13: 2, 8: 2, 3: 2 }, decoys: [{ index: 17, kind: "corner", rotation: 2 }, { index: 7, kind: "straight", rotation: 1 }, { index: 9, kind: "corner", rotation: 0 }] },
  {
    id: 18, // Power 4
    title: "Toffee Traverse",
    hint: "Leap over the sticky toffee canyon.",
    size: 5,
    route: [4, 9, 14, 19, 24, 23, 22, 21, 16, 11, 12],
    gaps: [14], // jump 9 across 14 to 19
    collectibles: [23],
    scramble: { 9: 2, 19: 2, 24: 1, 23: 2, 22: 1, 21: 2, 16: 1, 11: 2 },
    decoys: [{ index: 3, kind: "corner", rotation: 1 }, { index: 18, kind: "straight", rotation: 0 }]
  },
  { id: 19, title: "Bonbon Bends", hint: "Twelve turns among glittering bonbons.", size: 5, route: [0, 5, 6, 7, 2, 3, 8, 13, 18, 17, 16, 21], scramble: { 5: 3, 6: 1, 7: 3, 2: 3, 3: 1, 8: 3, 13: 1, 18: 3, 17: 1, 16: 3 }, decoys: [{ index: 1, kind: "straight", rotation: 0 }, { index: 12, kind: "corner", rotation: 3 }, { index: 22, kind: "straight", rotation: 1 }] },
  {
    id: 20, // Detour 3
    title: "Candy Cane Crest",
    hint: "Detour Challenge: climb the high ridge for the bonus star.",
    size: 5,
    route: [20, 21, 22, 17, 12, 11, 6, 7, 8, 3, 4],
    detour: { branchTile: 22, detourRoute: [23, 18], rejoinTile: 17, collectible: 23, scramble: { 23: 2, 18: 2 } },
    scramble: { 21: 3, 22: 0, 17: 0, 12: 3, 11: 2, 6: 2, 7: 3, 8: 2, 3: 3 },
    decoys: [{ index: 16, kind: "corner", rotation: 0 }, { index: 2, kind: "straight", rotation: 1 }]
  },

  // --- BAND 3: Levels 21–30 (Size 5, Par Target: 15–20) ---
  { id: 21, title: "Glazed Garden", hint: "Thirteen tiles of winding sweet paths.", size: 5, route: [0, 1, 6, 11, 16, 17, 18, 13, 8, 9, 14, 19, 24], scramble: { 1: 1, 6: 1, 11: 1, 16: 2, 17: 1, 18: 2, 13: 2, 8: 1, 9: 2, 14: 2, 19: 1 }, decoys: [{ index: 2, kind: "corner", rotation: 1 }, { index: 12, kind: "straight", rotation: 0 }, { index: 23, kind: "corner", rotation: 2 }] },
  { id: 22, title: "Rock Candy Ridge", hint: "Climb sharp rock candy peaks.", size: 5, route: [20, 15, 10, 11, 12, 7, 2, 3, 8, 13, 14, 19, 18], scramble: { 15: 2, 10: 2, 11: 1, 12: 2, 7: 1, 2: 2, 3: 2, 8: 1, 13: 2, 14: 2, 19: 2 }, decoys: [{ index: 1, kind: "corner", rotation: 3 }, { index: 6, kind: "straight", rotation: 1 }, { index: 23, kind: "corner", rotation: 0 }] },
  {
    id: 23, // Power 5
    title: "Wafer Way",
    hint: "Hop across the crispy wafer void.",
    size: 5,
    route: [0, 5, 10, 15, 20, 21, 22, 17, 12, 7, 8, 9],
    gaps: [10], // jump 5 over 10 to 15
    collectibles: [21],
    scramble: { 5: 1, 15: 1, 20: 1, 21: 1, 22: 1, 17: 1, 12: 1, 7: 1, 8: 1 },
    decoys: [{ index: 1, kind: "straight", rotation: 1 }, { index: 11, kind: "corner", rotation: 2 }, { index: 18, kind: "straight", rotation: 0 }]
  },
  {
    id: 24, // Detour 4
    title: "Sherbet Shimmer",
    hint: "Detour Challenge: the sherbet loop hides a golden prize.",
    size: 5,
    route: [0, 1, 6, 11, 12, 17, 18, 13, 8, 9, 14, 19, 24],
    detour: { branchTile: 11, detourRoute: [16, 21, 22], rejoinTile: 17, collectible: 21, scramble: { 16: 1, 21: 1, 22: 1 } },
    scramble: { 1: 1, 6: 1, 11: 0, 12: 1, 17: 0, 18: 1, 13: 1, 8: 1, 9: 1, 14: 1, 19: 1 },
    decoys: [{ index: 7, kind: "corner", rotation: 1 }, { index: 23, kind: "straight", rotation: 0 }]
  },
  { id: 25, title: "Praline Pass", hint: "Complex praline corridor navigation.", size: 5, route: [24, 19, 14, 13, 12, 17, 22, 21, 20, 15, 16, 11, 6], scramble: { 19: 2, 14: 2, 13: 1, 12: 2, 17: 1, 22: 2, 21: 1, 20: 2, 15: 1, 16: 2, 11: 2 }, decoys: [{ index: 18, kind: "corner", rotation: 2 }, { index: 7, kind: "straight", rotation: 0 }, { index: 10, kind: "corner", rotation: 0 }] },
  { id: 26, title: "Marzipan Meadow", hint: "Winding marzipan meadow route.", size: 5, route: [0, 1, 2, 7, 8, 13, 18, 23, 22, 21, 16, 11, 10], scramble: { 1: 2, 2: 2, 7: 1, 8: 2, 13: 2, 18: 1, 23: 2, 22: 2, 21: 1, 16: 2, 11: 2 }, decoys: [{ index: 3, kind: "straight", rotation: 1 }, { index: 12, kind: "corner", rotation: 1 }, { index: 17, kind: "straight", rotation: 0 }] },
  {
    id: 27, // Power 6
    title: "Frosting Fissure",
    hint: "Bunny's single leap over the deep frosting split.",
    size: 5,
    route: [20, 21, 22, 23, 24, 19, 14, 9, 4, 3, 8, 13, 18],
    gaps: [14], // jump 19 across 14 to 9
    collectibles: [24],
    scramble: { 21: 1, 22: 1, 23: 1, 24: 1, 19: 1, 9: 1, 4: 1, 3: 1, 8: 1, 13: 1 },
    decoys: [{ index: 16, kind: "corner", rotation: 3 }, { index: 7, kind: "straight", rotation: 1 }, { index: 2, kind: "corner", rotation: 0 }]
  },
  {
    id: 28, // Detour 5
    title: "Sprinkle Spiral",
    hint: "Detour Challenge: the inner swirl yields all stars.",
    size: 5,
    route: [10, 5, 0, 1, 2, 3, 4, 9, 14, 19, 24, 23, 22, 21, 20],
    detour: { branchTile: 2, detourRoute: [7, 12, 13], rejoinTile: 14, collectible: 12, scramble: { 7: 1, 12: 1, 13: 1 } },
    scramble: { 5: 1, 0: 1, 1: 1, 2: 0, 3: 1, 4: 3, 9: 1, 14: 0, 19: 1, 24: 1, 23: 1, 22: 1, 21: 1 },
    decoys: [{ index: 6, kind: "corner", rotation: 1 }, { index: 11, kind: "straight", rotation: 0 }]
  },
  { id: 29, title: "Choco Chip Chase", hint: "Dodge chocolate drops in a winding run.", size: 5, route: [4, 3, 8, 13, 12, 11, 16, 21, 22, 23, 18, 19, 24], scramble: { 3: 2, 8: 2, 13: 1, 12: 2, 11: 2, 16: 2, 21: 2, 22: 1, 23: 2, 18: 2, 19: 1 }, decoys: [{ index: 2, kind: "straight", rotation: 0 }, { index: 7, kind: "corner", rotation: 1 }, { index: 17, kind: "straight", rotation: 1 }] },
  { id: 30, title: "Custard Corner", hint: "Band 3 finale: complex custard labyrinth.", size: 5, route: [20, 21, 22, 23, 18, 13, 8, 7, 6, 11, 16, 17, 12], scramble: { 6: 2, 7: 1, 8: 2, 11: 1, 13: 1, 16: 2, 17: 2, 18: 2, 21: 1, 22: 1, 23: 2 }, decoys: [{ index: 14, kind: "corner", rotation: 2 }, { index: 2, kind: "straight", rotation: 0 }, { index: 10, kind: "corner", rotation: 3 }] },

  // --- BAND 4: Levels 31–40 (Size 5, Par Target: 21–26) ---
  { id: 31, title: "Truffle Track", hint: "Fifteen intricate tile turns across the truffle forest.", size: 5, route: [0, 5, 10, 11, 6, 1, 2, 7, 12, 17, 16, 21, 22, 23, 24], scramble: { 1: 1, 2: 1, 5: 1, 6: 1, 7: 1, 10: 2, 11: 1, 12: 1, 16: 1, 17: 1, 21: 1, 22: 1, 23: 1 }, decoys: [{ index: 8, kind: "corner", rotation: 0 }, { index: 13, kind: "straight", rotation: 1 }, { index: 18, kind: "corner", rotation: 2 }] },
  {
    id: 32, // Detour 6
    title: "Spun Sugar Spire",
    hint: "Detour Challenge: detour around the spire base for bonus stars.",
    size: 5,
    route: [24, 19, 14, 9, 4, 3, 2, 1, 6, 11, 16, 17, 18, 23, 22],
    detour: { branchTile: 9, detourRoute: [8, 13], rejoinTile: 14, collectible: 13, scramble: { 8: 2, 13: 2 } },
    scramble: { 1: 1, 2: 1, 3: 1, 4: 1, 6: 1, 9: 0, 11: 1, 14: 0, 16: 1, 17: 1, 18: 1, 19: 1, 23: 1 },
    decoys: [{ index: 7, kind: "corner", rotation: 1 }, { index: 12, kind: "straight", rotation: 0 }]
  },
  {
    id: 33, // Power 7
    title: "Molasses Moat",
    hint: "Jump Bunny across the wide molasses moat.",
    size: 5,
    route: [20, 15, 10, 5, 0, 1, 2, 3, 8, 13, 18, 23, 22, 21, 16, 11, 12],
    gaps: [10], // jump 15 over 10 to 5
    collectibles: [2],
    scramble: { 15: 1, 5: 1, 0: 1, 1: 1, 2: 1, 3: 1, 8: 1, 13: 1, 18: 1, 23: 1, 22: 1, 21: 1, 16: 1, 11: 1 },
    decoys: [{ index: 6, kind: "corner", rotation: 2 }, { index: 7, kind: "straight", rotation: 1 }, { index: 17, kind: "corner", rotation: 0 }]
  },
  { id: 34, title: "Fondant Forest", hint: "Dense fondant maze requiring forward planning.", size: 5, route: [4, 9, 14, 13, 8, 3, 2, 1, 6, 11, 16, 17, 18, 23, 22], scramble: { 1: 1, 2: 1, 3: 1, 6: 1, 8: 1, 9: 1, 11: 1, 13: 1, 14: 1, 16: 1, 17: 1, 18: 2, 23: 1 }, decoys: [{ index: 0, kind: "straight", rotation: 0 }, { index: 7, kind: "corner", rotation: 3 }, { index: 21, kind: "straight", rotation: 1 }] },
  { id: 35, title: "Peanut Brittle Path", hint: "Fragile path twists across the whole board.", size: 5, route: [0, 1, 2, 7, 12, 13, 14, 19, 18, 17, 22, 21, 20, 15, 10], scramble: { 1: 1, 2: 1, 7: 1, 12: 1, 13: 1, 14: 1, 15: 1, 17: 1, 18: 1, 19: 2, 20: 1, 21: 1, 22: 1 }, decoys: [{ index: 5, kind: "corner", rotation: 1 }, { index: 8, kind: "straight", rotation: 0 }, { index: 23, kind: "corner", rotation: 2 }] },
  {
    id: 36, // Detour 7
    title: "Syrup Circuit",
    hint: "Detour Challenge: loop around the bubbling cauldron for the star.",
    size: 5,
    route: [20, 15, 10, 5, 0, 1, 2, 3, 4, 9, 14, 19, 18, 17, 22, 23, 24],
    detour: { branchTile: 9, detourRoute: [8, 13], rejoinTile: 14, collectible: 8, scramble: { 8: 1, 13: 1 } },
    scramble: { 15: 1, 10: 1, 5: 1, 0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 9: 0, 14: 0, 19: 1, 18: 1, 17: 1, 22: 1, 23: 1 },
    decoys: [{ index: 6, kind: "corner", rotation: 1 }, { index: 11, kind: "straight", rotation: 0 }]
  },
  { id: 37, title: "Honeycomb Hill", hint: "Long honey path with multiple decoy connections.", size: 5, route: [4, 3, 2, 1, 6, 11, 12, 13, 14, 19, 24, 23, 22, 21, 20], scramble: { 3: 1, 2: 1, 1: 1, 6: 1, 11: 1, 12: 1, 13: 1, 14: 1, 19: 1, 24: 1, 23: 1, 22: 1, 21: 1 }, decoys: [{ index: 7, kind: "corner", rotation: 3 }, { index: 8, kind: "straight", rotation: 0 }, { index: 17, kind: "corner", rotation: 1 }] },
  {
    id: 38, // Power 8
    title: "Marmalade Mountain",
    hint: "Precise gap jump required high up the mountain.",
    size: 5,
    route: [4, 9, 14, 19, 24, 23, 22, 17, 12, 7, 2, 1, 6, 11, 16, 15, 10],
    gaps: [12], // jump 17 over 12 to 7
    collectibles: [22],
    scramble: { 9: 1, 14: 1, 19: 1, 24: 1, 23: 1, 22: 1, 17: 1, 7: 1, 2: 1, 1: 1, 6: 1, 11: 1, 16: 1, 15: 1 },
    decoys: [{ index: 8, kind: "straight", rotation: 1 }, { index: 18, kind: "corner", rotation: 2 }, { index: 21, kind: "straight", rotation: 0 }]
  },
  { id: 39, title: "Icing Incline", hint: "Sixteen turns along steep frosted slopes.", size: 5, route: [24, 19, 18, 17, 16, 15, 10, 5, 0, 1, 6, 11, 12, 13, 14, 9, 8, 7, 2], scramble: { 0: 2, 1: 1, 5: 1, 6: 2, 7: 2, 8: 1, 9: 1, 10: 1, 11: 1, 12: 1, 13: 1, 14: 2, 15: 2, 16: 2, 17: 2, 18: 1, 19: 1 }, decoys: [{ index: 3, kind: "corner", rotation: 1 }, { index: 4, kind: "straight", rotation: 0 }] },
  {
    id: 40, // Detour 8
    title: "Confectionery Cascade",
    hint: "Detour Challenge: cascade loop demands thoughtful rotations.",
    size: 5,
    route: [0, 5, 10, 15, 20, 21, 22, 23, 24, 19, 14, 13, 12, 7, 2, 1],
    detour: { branchTile: 21, detourRoute: [16, 17, 18], rejoinTile: 23, collectible: 17, scramble: { 16: 1, 17: 1, 18: 1 } },
    scramble: { 5: 1, 10: 1, 15: 1, 20: 1, 21: 0, 22: 1, 23: 0, 24: 1, 19: 1, 14: 1, 13: 1, 12: 1, 7: 1, 2: 1 },
    decoys: [{ index: 6, kind: "corner", rotation: 1 }, { index: 11, kind: "straight", rotation: 0 }]
  },

  // --- BAND 5: Levels 41–49 (Size 5, Par Target: 27–32) ---
  { id: 41, title: "Candy Corn Cavern", hint: "Seventeen turns through crystalline sugar caves.", size: 5, route: [20, 15, 16, 17, 12, 7, 8, 13, 18, 19, 14, 9, 4, 3, 2, 1, 0], scramble: { 15: 1, 16: 1, 17: 1, 12: 1, 7: 1, 8: 1, 13: 1, 18: 1, 19: 1, 14: 1, 9: 1, 4: 1, 3: 1, 2: 1, 1: 1 }, decoys: [{ index: 5, kind: "straight", rotation: 1 }, { index: 11, kind: "corner", rotation: 0 }] },
  { id: 42, title: "Sugar Crystal Spires", hint: "High-altitude path weaving between sugar pillars.", size: 5, route: [4, 9, 8, 7, 6, 11, 16, 17, 12, 13, 14, 19, 24, 23, 22, 21, 20], scramble: { 9: 1, 8: 1, 7: 1, 6: 1, 11: 1, 16: 1, 17: 1, 12: 1, 13: 1, 14: 1, 19: 1, 24: 1, 23: 1, 22: 1, 21: 1 }, decoys: [{ index: 2, kind: "corner", rotation: 1 }, { index: 18, kind: "straight", rotation: 0 }] },
  {
    "id": 43,
    "size": 5,
    "title": "Glaze Garden Crossing",
    "hint": "Choose the garden loop to collect the golden star.",
    "route": [
      14,
      9,
      8,
      3,
      2,
      7,
      6,
      5,
      10,
      11,
      12,
      13,
      18,
      19,
      24,
      23,
      22,
      21,
      16
    ],
    "detour": {
      "branchTile": 6,
      "detourRoute": [
        1,
        0
      ],
      "rejoinTile": 5,
      "collectible": 1,
      "scramble": {
        "0": 2,
        "1": 2
      }
    },
    "scramble": {
      "2": 1,
      "3": 1,
      "5": 0,
      "6": 0,
      "7": 3,
      "8": 1,
      "9": 1,
      "10": 1,
      "11": 1,
      "12": 1,
      "13": 1,
      "18": 2,
      "19": 1,
      "21": 2,
      "22": 1,
      "23": 1,
      "24": 3
    }
  },
  {
    id: 44, // Power 9
    title: "Pastel Precipice",
    hint: "A dizzying gap jump over the pastel canyon.",
    size: 5,
    route: [19, 24, 23, 22, 21, 20, 15, 16, 17, 18, 13, 8, 3, 2, 1, 6, 11, 12],
    gaps: [8], // jump 13 over 8 to 3
    collectibles: [18],
    scramble: { 24: 1, 23: 1, 22: 1, 21: 1, 20: 1, 15: 1, 16: 1, 17: 1, 18: 1, 13: 1, 3: 1, 2: 1, 1: 1, 6: 1, 11: 1 },
    decoys: [{ index: 14, kind: "corner", rotation: 2 }, { index: 7, kind: "straight", rotation: 0 }, { index: 9, kind: "corner", rotation: 1 }]
  },
  {
    "id": 45,
    "size": 5,
    "title": "Truffle Switchback",
    "hint": "Plan the turns through the winding truffle trail.",
    "route": [
      6,
      7,
      8,
      3,
      2,
      1,
      0,
      5,
      10,
      11,
      12,
      13,
      14,
      19,
      24,
      23,
      18
    ],
    "scramble": {
      "0": 1,
      "1": 1,
      "2": 1,
      "3": 1,
      "5": 1,
      "7": 1,
      "8": 2,
      "10": 1,
      "11": 1,
      "12": 1,
      "13": 1,
      "14": 2,
      "19": 1,
      "23": 1,
      "24": 1
    }
  },
  { id: 46, title: "Frosted Fortress", hint: "Nineteen-tile fortification labyrinth.", size: 5, route: [20, 21, 22, 17, 16, 11, 12, 13, 8, 7, 6, 1, 2, 3, 4, 9, 14, 19, 24], scramble: { 1: 1, 2: 1, 3: 1, 4: 1, 6: 1, 7: 1, 8: 1, 9: 2, 11: 1, 12: 1, 13: 1, 14: 2, 16: 2, 17: 1, 19: 1, 21: 1, 22: 1 }, decoys: [{ index: 15, kind: "corner", rotation: 3 }, { index: 18, kind: "straight", rotation: 0 }] },
  {
    id: 47, // Detour 10
    title: "Raspberry Labyrinth",
    hint: "Detour Challenge: navigate the berry hedge for the star.",
    size: 5,
    route: [0, 1, 2, 3, 4, 9, 8, 7, 6, 5, 10, 11, 12, 13, 14, 19, 18, 17, 16, 15, 20],
    detour: { branchTile: 18, detourRoute: [23, 22, 21], rejoinTile: 16, collectible: 22, scramble: { 23: 1, 22: 1, 21: 1 } },
    scramble: { 1: 1, 2: 1, 3: 1, 4: 1, 9: 1, 8: 1, 7: 1, 6: 1, 5: 1, 10: 1, 11: 1, 12: 1, 13: 1, 14: 1, 19: 1, 18: 0, 17: 1, 16: 0, 15: 1 },
    decoys: [{ index: 24, kind: "corner", rotation: 1 }]
  },
  {
    id: 48, // Power 10
    title: "Sugar Vault",
    hint: "Master gap jump inside the locked candy treasury.",
    size: 5,
    route: [20, 15, 10, 5, 0, 1, 2, 3, 4, 9, 14, 19, 24, 23, 22, 17, 16, 11, 12],
    gaps: [10], // jump 15 over 10 to 5
    collectibles: [2],
    scramble: { 15: 1, 5: 1, 0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 9: 1, 14: 1, 19: 1, 24: 1, 23: 1, 22: 1, 17: 1, 16: 1, 11: 1 },
    decoys: [{ index: 6, kind: "corner", rotation: 2 }, { index: 7, kind: "straight", rotation: 0 }, { index: 8, kind: "corner", rotation: 1 }]
  },
  { id: 49, title: "Pink Panache", hint: "Twenty-one tiles: the ultimate winding confection.", size: 5, route: [0, 5, 6, 1, 2, 7, 8, 3, 4, 9, 14, 13, 18, 19, 24, 23, 22, 17, 16, 21, 20], collectibles: [13], scramble: { 1: 1, 2: 3, 3: 1, 4: 1, 5: 3, 6: 1, 7: 1, 8: 2, 9: 1, 13: 2, 14: 0, 16: 1, 17: 2, 18: 2, 19: 3, 21: 0, 22: 0, 23: 1, 24: 3 } },

  // --- FINALE: Level 50 (Strawberry Cottage Finale) ---
  {
    id: 50, // Power 11 & Detour 11
    title: "Strawberry Cottage Finale",
    hint: "Capstone Finale: Hop the moat, detour the garden, and reach Bunny's Strawberry Cottage!",
    size: 5,
    route: [4, 9, 14, 19, 24, 23, 18, 13, 8, 3, 2, 1, 0, 5, 10, 15, 20, 21, 22, 17, 12],
    gaps: [17], // jump 22 across 17 to 12 (Strawberry Cottage!)
    detour: {
      branchTile: 8,
      detourRoute: [7],
      rejoinTile: 2,
      collectible: 7,
      scramble: { 7: 2 }
    },
    scramble: {
      9: 1, 14: 1, 19: 1, 24: 1, 23: 1, 18: 1, 13: 1, 8: 0, 3: 0, 2: 0, 1: 1, 0: 1, 5: 1, 10: 1, 15: 1, 20: 1, 21: 1, 22: 0
    }
  }
];
