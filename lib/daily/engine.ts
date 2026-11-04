/**
 * Daily Path (Pathle) - Core Path Engine & Generator
 * 4x4 Grid Solvable-by-Construction Generator, Connectivity & Win Detection
 */

import {
  type BoardState,
  type Direction,
  type Tile,
  type TileType,
  DIRECTION_VECTORS,
  OPPOSITE_DIRECTIONS,
} from "./types";
import {
  createPrng,
  getPuzzleNumber,
  seedFromUtcDate,
} from "./prng";
import {
  BASE_PORTS,
  getTilePorts,
  solveBoard,
} from "./solver";

export { BASE_PORTS, getTilePorts };

export const DEFAULT_GRID_SIZE = 4;
export const DEFAULT_START_POS: [number, number] = [0, 0];
export const DEFAULT_GOAL_POS: [number, number] = [3, 3];

const CELL_IDS: readonly (readonly string[])[] = [
  ["cell-0-0", "cell-0-1", "cell-0-2", "cell-0-3"],
  ["cell-1-0", "cell-1-1", "cell-1-2", "cell-1-3"],
  ["cell-2-0", "cell-2-1", "cell-2-2", "cell-2-3"],
  ["cell-3-0", "cell-3-1", "cell-3-2", "cell-3-3"],
];

// Verified fallback routes from [0, 0] to [3, 3] in a 4x4 grid
const FALLBACK_ROUTES: readonly (readonly [number, number][])[] = [
  // Length 7 (6 steps)
  [
    [0, 0], [0, 1], [0, 2], [0, 3], [1, 3], [2, 3], [3, 3],
  ],
  // Length 9 (8 steps)
  [
    [0, 0], [1, 0], [1, 1], [1, 2], [0, 2], [0, 3], [1, 3], [2, 3], [3, 3],
  ],
  // Length 11 (10 steps)
  [
    [0, 0], [0, 1], [1, 1], [1, 0], [2, 0], [2, 1], [2, 2], [1, 2], [1, 3], [2, 3], [3, 3],
  ],
] as const;

/**
 * Finds direction from cell (r1, c1) to adjacent cell (r2, c2).
 */
function getStepDirection(r1: number, c1: number, r2: number, c2: number): Direction {
  const dr = r2 - r1;
  const dc = c2 - c1;
  if (dr === -1 && dc === 0) return 0; // North
  if (dr === 0 && dc === 1) return 1;  // East
  if (dr === 1 && dc === 0) return 2;  // South
  if (dr === 0 && dc === -1) return 3; // West
  throw new Error(`Cells [${r1},${c1}] and [${r2},${c2}] are not orthogonally adjacent`);
}

/**
 * Determines rotation of corner tile needed to provide ports p1 and p2.
 */
function getCornerRotationForPorts(p1: Direction, p2: Direction): Direction {
  const has0 = p1 === 0 || p2 === 0;
  const has1 = p1 === 1 || p2 === 1;
  const has2 = p1 === 2 || p2 === 2;
  const has3 = p1 === 3 || p2 === 3;

  if (has0 && has1) return 0;
  if (has1 && has2) return 1;
  if (has2 && has3) return 2;
  if (has3 && has0) return 3;

  throw new Error(`Ports ${p1} and ${p2} cannot form a corner`);
}

/**
 * Carves a self-avoiding random walk from startPos to goalPos.
 */
function carvePath(
  size: number,
  startPos: [number, number],
  goalPos: [number, number],
  minLength: number,
  maxLength: number,
  prng: ReturnType<typeof createPrng>
): [number, number][] | null {
  const [startR, startC] = startPos;
  const [goalR, goalC] = goalPos;

  let visitedMask = 1 << (startR * size + startC);
  const path: [number, number][] = [[startR, startC]];

  let searchSteps = 0;
  const maxSearchSteps = 100;

  function dfs(r: number, c: number): boolean {
    searchSteps++;
    if (searchSteps > maxSearchSteps) return false;

    if (r === goalR && c === goalC) {
      return path.length >= minLength && path.length <= maxLength;
    }

    if (path.length >= maxLength) {
      return false;
    }

    // Neighbors with in-place shuffle
    const candidateDirs: Direction[] = [0, 1, 2, 3];
    for (let i = candidateDirs.length - 1; i > 0; i--) {
      const j = Math.floor(prng.next() * (i + 1));
      const tmp = candidateDirs[i];
      candidateDirs[i] = candidateDirs[j];
      candidateDirs[j] = tmp;
    }

    for (const d of candidateDirs) {
      const nr = r + DIRECTION_VECTORS[d][0];
      const nc = c + DIRECTION_VECTORS[d][1];

      if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
      const bit = 1 << (nr * size + nc);
      if ((visitedMask & bit) !== 0) continue;

      // Don't hit goal prematurely if path too short
      if (nr === goalR && nc === goalC && path.length + 1 < minLength) {
        continue;
      }

      visitedMask |= bit;
      path.push([nr, nc]);

      if (dfs(nr, nc)) {
        return true;
      }

      visitedMask &= ~bit;
      path.pop();
    }

    return false;
  }

  if (dfs(startR, startC)) {
    return path;
  }
  return null;
}

/**
 * Generates a deterministic daily board for the given UTC date string (YYYY-MM-DD).
 * Guaranteed to be 100% solvable and strictly start in an unsolved state.
 */
export function generateDailyBoard(dateStr: string): BoardState {
  const baseSeed = seedFromUtcDate(dateStr);
  const puzzleNumber = getPuzzleNumber(dateStr);
  const size = DEFAULT_GRID_SIZE;
  const startPos = DEFAULT_START_POS;
  const goalPos = DEFAULT_GOAL_POS;

  // Rejection sampling attempts to ensure quality criteria:
  // solvable = true, 4 <= minMoves <= 12, initially unsolved
  for (let attempt = 0; attempt < 50; attempt++) {
    const attemptSeed = (baseSeed + attempt * 10007) >>> 0;
    const prng = createPrng(attemptSeed);

    let path = carvePath(size, startPos, goalPos, 7, 11, prng);
    if (!path) {
      // Pick fallback route
      const fallbackIdx = attempt % FALLBACK_ROUTES.length;
      path = FALLBACK_ROUTES[fallbackIdx].map(p => [p[0], p[1]]);
    }

    // Pre-calculate path tiles
    const pathTiles: (Tile | null)[] = new Array(16).fill(null);

    for (let i = 0; i < path.length; i++) {
      const [r, c] = path[i];
      const id = CELL_IDS[r][c];

      if (i === 0) {
        // Start tile: fixed exit pointing towards next cell
        const nextCell = path[i + 1];
        const exitDir = getStepDirection(r, c, nextCell[0], nextCell[1]);
        const rot = ((exitDir - 1 + 4) % 4) as Direction;
        pathTiles[r * size + c] = {
          id,
          row: r,
          col: c,
          type: "start",
          rotation: rot,
          targetRotation: rot,
          isFixed: true,
          inSolutionPath: true,
          isConnectedToStart: false,
        };
      } else if (i === path.length - 1) {
        // Goal tile: fixed entrance receiving from previous cell
        const prevCell = path[i - 1];
        const stepDir = getStepDirection(prevCell[0], prevCell[1], r, c);
        const inDir = OPPOSITE_DIRECTIONS[stepDir];
        const rot = ((inDir - 3 + 4) % 4) as Direction;
        pathTiles[r * size + c] = {
          id,
          row: r,
          col: c,
          type: "goal",
          rotation: rot,
          targetRotation: rot,
          isFixed: true,
          inSolutionPath: true,
          isConnectedToStart: false,
        };
      } else {
        // Intermediate path tile
        const prevCell = path[i - 1];
        const nextCell = path[i + 1];
        const stepIn = getStepDirection(prevCell[0], prevCell[1], r, c);
        const p1 = OPPOSITE_DIRECTIONS[stepIn];
        const p2 = getStepDirection(r, c, nextCell[0], nextCell[1]);

        const isOpposite = (p1 + 2) % 4 === p2;
        if (isOpposite) {
          const targetRot: Direction = p1 === 1 || p1 === 3 ? 0 : 1;
          const scrambleOffset: Direction = prng.next() < 0.5 ? 1 : 3;
          pathTiles[r * size + c] = {
            id,
            row: r,
            col: c,
            type: "straight",
            rotation: ((targetRot + scrambleOffset) % 4) as Direction,
            targetRotation: targetRot,
            isFixed: false,
            inSolutionPath: true,
            isConnectedToStart: false,
          };
        } else {
          const targetRot = getCornerRotationForPorts(p1, p2);
          const scrambleOffset = prng.nextInt(1, 3);
          pathTiles[r * size + c] = {
            id,
            row: r,
            col: c,
            type: "corner",
            rotation: ((targetRot + scrambleOffset) % 4) as Direction,
            targetRotation: targetRot,
            isFixed: false,
            inSolutionPath: true,
            isConnectedToStart: false,
          };
        }
      }
    }

    // Build 4x4 tiles matrix in a single pass
    const decoyTypes: TileType[] = ["corner", "corner", "straight", "straight", "tee"];
    const tiles: Tile[][] = [];
    for (let r = 0; r < size; r++) {
      tiles[r] = [];
      for (let c = 0; c < size; c++) {
        const pt = pathTiles[r * size + c];
        if (pt) {
          tiles[r][c] = pt;
        } else {
          tiles[r][c] = {
            id: CELL_IDS[r][c],
            row: r,
            col: c,
            type: prng.nextChoice(decoyTypes),
            rotation: prng.nextInt(0, 3) as Direction,
            targetRotation: prng.nextInt(0, 3) as Direction,
            isFixed: false,
            inSolutionPath: false,
            isConnectedToStart: false,
          };
        }
      }
    }

    const candidateBoard: BoardState = {
      dateStr,
      puzzleNumber,
      size,
      tiles,
      startPos,
      goalPos,
      parMoves: 0,
      minMoves: 0,
    };

    // Solve to find exact minimal moves
    const solution = solveBoard(candidateBoard);
    if (!solution.solvable || solution.minMoves < 4 || solution.minMoves > 12) {
      continue;
    }

    candidateBoard.minMoves = solution.minMoves;
    candidateBoard.parMoves = solution.parMoves;

    // Calculate initial connectivity once on the accepted board
    const connected = getConnectedTiles(candidateBoard);
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        tiles[r][c].isConnectedToStart = connected.has(tiles[r][c].id);
      }
    }

    return candidateBoard;
  }

  // Fallback board using deterministic fallback route 0 if 50 attempts exceeded
  return createFallbackBoard(dateStr, puzzleNumber, baseSeed);
}

/**
 * Creates guaranteed solvable fallback board.
 */
function createFallbackBoard(dateStr: string, puzzleNumber: number, seed: number): BoardState {
  const prng = createPrng(seed);
  const size = DEFAULT_GRID_SIZE;
  const startPos = DEFAULT_START_POS;
  const goalPos = DEFAULT_GOAL_POS;
  const path = FALLBACK_ROUTES[0].map(p => [p[0], p[1]]);
  const pathSet = new Set(path.map(([r, c]) => `${r},${c}`));

  const tiles: Tile[][] = [];
  for (let r = 0; r < size; r++) {
    tiles[r] = [];
    for (let c = 0; c < size; c++) {
      tiles[r][c] = {
        id: `cell-${r}-${c}`,
        row: r,
        col: c,
        type: "straight",
        rotation: 0,
        targetRotation: 0,
        isFixed: false,
        inSolutionPath: false,
        isConnectedToStart: false,
      };
    }
  }

  // Populate fallback route: (0,0)->(0,1)->(0,2)->(0,3)->(1,3)->(2,3)->(3,3)
  // (0,0): start exiting East (rot 0)
  tiles[0][0] = {
    id: "cell-0-0",
    row: 0,
    col: 0,
    type: "start",
    rotation: 0,
    targetRotation: 0,
    isFixed: true,
    inSolutionPath: true,
    isConnectedToStart: true,
  };
  // (0,1): straight horizontal, target 0, scramble 1
  tiles[0][1] = {
    id: "cell-0-1",
    row: 0,
    col: 1,
    type: "straight",
    rotation: 1,
    targetRotation: 0,
    isFixed: false,
    inSolutionPath: true,
    isConnectedToStart: false,
  };
  // (0,2): straight horizontal, target 0, scramble 1
  tiles[0][2] = {
    id: "cell-0-2",
    row: 0,
    col: 2,
    type: "straight",
    rotation: 1,
    targetRotation: 0,
    isFixed: false,
    inSolutionPath: true,
    isConnectedToStart: false,
  };
  // (0,3): corner connecting West (3) and South (2) -> rot 2, scramble 1 -> rot 3
  tiles[0][3] = {
    id: "cell-0-3",
    row: 0,
    col: 3,
    type: "corner",
    rotation: 3,
    targetRotation: 2,
    isFixed: false,
    inSolutionPath: true,
    isConnectedToStart: false,
  };
  // (1,3): straight vertical, target 1, scramble 1 -> rot 0
  tiles[1][3] = {
    id: "cell-1-3",
    row: 1,
    col: 3,
    type: "straight",
    rotation: 0,
    targetRotation: 1,
    isFixed: false,
    inSolutionPath: true,
    isConnectedToStart: false,
  };
  // (2,3): straight vertical, target 1, scramble 1 -> rot 0
  tiles[2][3] = {
    id: "cell-2-3",
    row: 2,
    col: 3,
    type: "straight",
    rotation: 0,
    targetRotation: 1,
    isFixed: false,
    inSolutionPath: true,
    isConnectedToStart: false,
  };
  // (3,3): goal receiving from North (0) -> rot 1 (base port 3, (3+1)%4=0)
  tiles[3][3] = {
    id: "cell-3-3",
    row: 3,
    col: 3,
    type: "goal",
    rotation: 1,
    targetRotation: 1,
    isFixed: true,
    inSolutionPath: true,
    isConnectedToStart: false,
  };

  // Populate remaining decoys
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!pathSet.has(`${r},${c}`)) {
        tiles[r][c] = {
          id: `cell-${r}-${c}`,
          row: r,
          col: c,
          type: prng.nextChoice(["corner", "straight", "tee"]),
          rotation: prng.nextInt(0, 3) as Direction,
          targetRotation: 0,
          isFixed: false,
          inSolutionPath: false,
          isConnectedToStart: false,
        };
      }
    }
  }

  const board: BoardState = {
    dateStr,
    puzzleNumber,
    size,
    tiles,
    startPos,
    goalPos,
    parMoves: 6,
    minMoves: 5,
  };

  const solution = solveBoard(board);
  board.minMoves = solution.solvable ? solution.minMoves : 5;
  board.parMoves = solution.solvable ? solution.parMoves : 6;

  const connected = getConnectedTiles(board);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      board.tiles[r][c].isConnectedToStart = connected.has(board.tiles[r][c].id);
    }
  }

  return board;
}

/**
 * Returns set of tile IDs connected to the start tile through unbroken ports.
 */
export function getConnectedTiles(board: BoardState): Set<string> {
  const connected = new Set<string>();
  const size = board.size;
  const [startR, startC] = board.startPos;
  const startTile = board.tiles[startR]?.[startC];
  if (!startTile) return connected;

  let connectedMask = 1 << (startR * size + startC);
  const queue: number[] = [startR * size + startC];
  let head = 0;

  while (head < queue.length) {
    const idx = queue[head++];
    const r = Math.floor(idx / size);
    const c = idx % size;
    const tile = board.tiles[r][c];
    const ports = getTilePorts(tile.type, tile.rotation);

    for (const port of ports) {
      const [dr, dc] = DIRECTION_VECTORS[port];
      const nr = r + dr;
      const nc = c + dc;

      if (nr < 0 || nr >= size || nc < 0 || nc >= size) {
        continue;
      }

      const nIdx = nr * size + nc;
      const nBit = 1 << nIdx;
      if ((connectedMask & nBit) !== 0) {
        continue;
      }

      const neighbor = board.tiles[nr][nc];
      const oppositePort = OPPOSITE_DIRECTIONS[port];
      const neighborPorts = getTilePorts(neighbor.type, neighbor.rotation);

      if (neighborPorts.includes(oppositePort)) {
        connectedMask |= nBit;
        queue.push(nIdx);
      }
    }
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if ((connectedMask & (1 << (r * size + c))) !== 0) {
        connected.add(board.tiles[r][c].id);
      }
    }
  }

  return connected;
}

/**
 * Checks whether an unbroken path from start to goal is connected.
 */
export function checkWinCondition(board: BoardState): boolean {
  const [goalR, goalC] = board.goalPos;
  const goalTile = board.tiles[goalR]?.[goalC];
  if (!goalTile) return false;
  const connected = getConnectedTiles(board);
  return connected.has(goalTile.id);
}

/**
 * Rotates tile at (row, col) 90 degrees clockwise.
 * If tile is fixed, returns board unchanged.
 * Recomputes isConnectedToStart for all tiles in returned state.
 */
export function rotateTileAt(board: BoardState, row: number, col: number): BoardState {
  if (row < 0 || row >= board.size || col < 0 || col >= board.size) {
    return board;
  }
  const tile = board.tiles[row][col];
  if (tile.isFixed) {
    return board;
  }

  const newRotation = ((tile.rotation + 1) % 4) as Direction;
  const newTiles = board.tiles.map((rowTiles, r) =>
    rowTiles.map((t, c) => {
      if (r === row && c === col) {
        return { ...t, rotation: newRotation };
      }
      return { ...t };
    })
  );

  const updatedBoard: BoardState = {
    ...board,
    tiles: newTiles,
  };

  const connected = getConnectedTiles(updatedBoard);
  for (let r = 0; r < updatedBoard.size; r++) {
    for (let c = 0; c < updatedBoard.size; c++) {
      updatedBoard.tiles[r][c].isConnectedToStart = connected.has(updatedBoard.tiles[r][c].id);
    }
  }

  return updatedBoard;
}
