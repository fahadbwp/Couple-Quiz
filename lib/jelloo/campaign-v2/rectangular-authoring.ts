import {dimensions} from "../grid";
import type { TileKind, Direction, Tile, Level, Character } from "../engine";
import type { CharacterWorldId } from "../campaign";
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
  columns?: number; rows?: number;
  route: number[];
  gaps?: number[];
  collectibles?: number[];
  scramble?: Record<number, number>;
  decoys?: AuthoredDecoy[];
  detour?: AuthoredDetour;
  character?: Character;
  characterWorldId?: CharacterWorldId;
  cracked?: number[];
  gate?: { tile: number; trigger: number };
}

export function buildAuthoredLevel(spec: AuthoredLevelSpec): Level {
  const {columns,rows,count}=dimensions(spec);
  if(spec.size!==columns) throw new Error("Authored stride must equal columns");
  const {route,gaps=[]}=spec;const size=columns;
  if(route.length<3||new Set(route).size!==route.length||route.some(i=>!Number.isInteger(i)||i<0||i>=count)) throw new Error("Invalid authored route");
  const start = route[0];
  const home = route[route.length - 1];

  const tiles: Tile[] = Array.from({ length: count }, () => ({
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

  // Place cracked tiles
  for (const c of spec.cracked ?? []) {
    tiles[c] = { ...tiles[c], terrain: "cracked" };
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
    size, columns, rows,
    start,
    home,
    tiles,
    character: spec.character ?? "bunny",
    characterWorldId: spec.characterWorldId,
    powerVersion: 4,
    gate: spec.gate,
    collectibles,
  };
}

