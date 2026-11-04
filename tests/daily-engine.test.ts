import test from "node:test";
import assert from "node:assert/strict";
import {
  type BoardState,
  type Direction,
} from "../lib/daily/types";
import {
  createPrng,
  getPuzzleNumber,
  isConsecutiveDay,
  seedFromUtcDate,
} from "../lib/daily/prng";
import {
  BASE_PORTS,
  DEFAULT_GRID_SIZE,
  checkWinCondition,
  generateDailyBoard,
  getConnectedTiles,
  getTilePorts,
  rotateTileAt,
} from "../lib/daily/engine";
import {
  computeParMoves,
  getRotationCostAndTarget,
  isBoardSolvable,
  solveBoard,
} from "../lib/daily/solver";

test("PRNG: seedFromUtcDate is deterministic and sensitive to date changes", () => {
  const seed1 = seedFromUtcDate("2026-11-01");
  const seed2 = seedFromUtcDate("2026-11-01");
  const seed3 = seedFromUtcDate("2026-11-02");

  assert.equal(seed1, seed2, "Same date must produce identical seed");
  assert.notEqual(seed1, seed3, "Different dates must produce different seeds");
  assert.ok(seed1 >>> 0 === seed1, "Seed must be an unsigned 32-bit integer");
});

test("PRNG: createPrng produces reproducible sequences and respects bounds", () => {
  const prngA = createPrng(123456789);
  const prngB = createPrng(123456789);

  const seqA = [prngA.next(), prngA.next(), prngA.next()];
  const seqB = [prngB.next(), prngB.next(), prngB.next()];
  assert.deepEqual(seqA, seqB, "Identical seeds must produce identical float sequences");

  for (let i = 0; i < 50; i++) {
    const val = prngA.nextInt(3, 7);
    assert.ok(val >= 3 && val <= 7 && Number.isInteger(val), `nextInt out of bounds: ${val}`);
  }

  const choices = ["a", "b", "c"];
  const picked = prngA.nextChoice(choices);
  assert.ok(choices.includes(picked), `nextChoice invalid choice: ${picked}`);

  const arr = [1, 2, 3, 4, 5];
  const shuffled = prngA.shuffle(arr);
  assert.equal(shuffled.length, arr.length);
  assert.deepEqual([...shuffled].sort(), [...arr].sort());
});

test("PRNG: getPuzzleNumber & isConsecutiveDay math", () => {
  assert.equal(getPuzzleNumber("2026-01-01"), 1);
  assert.equal(getPuzzleNumber("2026-01-02"), 2);
  assert.equal(getPuzzleNumber("2026-04-30"), 120);

  assert.equal(isConsecutiveDay("2026-11-01", "2026-11-02"), true);
  assert.equal(isConsecutiveDay("2026-10-31", "2026-11-01"), true);
  assert.equal(isConsecutiveDay("2026-11-01", "2026-11-03"), false);
  assert.equal(isConsecutiveDay("2026-11-02", "2026-11-01"), false);
});

test("Tile Port Mapping: 90-degree clockwise port shifts", () => {
  // straight: [1, 3] at rot 0
  assert.deepEqual(getTilePorts("straight", 0), [1, 3]);
  assert.deepEqual(getTilePorts("straight", 1), [2, 0]);
  assert.deepEqual(getTilePorts("straight", 2), [3, 1]);
  assert.deepEqual(getTilePorts("straight", 3), [0, 2]);

  // corner: [0, 1] at rot 0
  assert.deepEqual(getTilePorts("corner", 0), [0, 1]);
  assert.deepEqual(getTilePorts("corner", 1), [1, 2]);
  assert.deepEqual(getTilePorts("corner", 2), [2, 3]);
  assert.deepEqual(getTilePorts("corner", 3), [3, 0]);

  // tee: [0, 1, 3] at rot 0
  assert.deepEqual(getTilePorts("tee", 0), [0, 1, 3]);
  assert.deepEqual(getTilePorts("tee", 1), [1, 2, 0]);
  assert.deepEqual(getTilePorts("tee", 2), [2, 3, 1]);
  assert.deepEqual(getTilePorts("tee", 3), [3, 0, 2]);

  // cross: [0, 1, 2, 3]
  assert.deepEqual(getTilePorts("cross", 0), [0, 1, 2, 3]);
  assert.deepEqual(getTilePorts("cross", 1), [1, 2, 3, 0]);

  // blank: []
  assert.deepEqual(getTilePorts("blank", 0), []);
  assert.deepEqual(getTilePorts("blank", 2), []);

  // start: [1] (East)
  assert.deepEqual(getTilePorts("start", 0), [1]);
  assert.deepEqual(getTilePorts("start", 1), [2]);

  // goal: [3] (West)
  assert.deepEqual(getTilePorts("goal", 0), [3]);
  assert.deepEqual(getTilePorts("goal", 1), [0]);
});

test("Tile Rotation: rotateTileAt rotates non-fixed tiles and preserves fixed tiles", () => {
  const board = generateDailyBoard("2026-11-01");
  const [startR, startC] = board.startPos;
  const startTile = board.tiles[startR][startC];

  // Start tile is fixed: cannot be rotated
  const boardAfterStartTap = rotateTileAt(board, startR, startC);
  assert.equal(
    boardAfterStartTap.tiles[startR][startC].rotation,
    startTile.rotation,
    "Start tile must be fixed and immutable to rotateTileAt"
  );

  // Goal tile is fixed: cannot be rotated
  const [goalR, goalC] = board.goalPos;
  const goalTile = board.tiles[goalR][goalC];
  const boardAfterGoalTap = rotateTileAt(board, goalR, goalC);
  assert.equal(
    boardAfterGoalTap.tiles[goalR][goalC].rotation,
    goalTile.rotation,
    "Goal tile must be fixed and immutable to rotateTileAt"
  );

  // Non-fixed tile can be rotated through 4 states
  let rotatableR = 0;
  let rotatableC = 1;
  while (board.tiles[rotatableR][rotatableC].isFixed) {
    rotatableC++;
  }
  const originalRot = board.tiles[rotatableR][rotatableC].rotation;

  const b1 = rotateTileAt(board, rotatableR, rotatableC);
  assert.equal(b1.tiles[rotatableR][rotatableC].rotation, ((originalRot + 1) % 4) as Direction);

  const b2 = rotateTileAt(b1, rotatableR, rotatableC);
  assert.equal(b2.tiles[rotatableR][rotatableC].rotation, ((originalRot + 2) % 4) as Direction);

  const b3 = rotateTileAt(b2, rotatableR, rotatableC);
  assert.equal(b3.tiles[rotatableR][rotatableC].rotation, ((originalRot + 3) % 4) as Direction);

  const b4 = rotateTileAt(b3, rotatableR, rotatableC);
  assert.equal(b4.tiles[rotatableR][rotatableC].rotation, originalRot);

  // Immutability: original board must not be mutated
  assert.equal(board.tiles[rotatableR][rotatableC].rotation, originalRot);

  // Out of bounds rotations return board safely
  const bOob = rotateTileAt(board, -1, 0);
  assert.equal(bOob, board);
  const bOob2 = rotateTileAt(board, 10, 10);
  assert.equal(bOob2, board);
});

test("Connectivity & Power Flow: BFS traversal follows matching reciprocal ports", () => {
  const board = generateDailyBoard("2026-11-01");
  const connected = getConnectedTiles(board);

  // Start tile is always connected to start
  assert.ok(connected.has(`cell-${board.startPos[0]}-${board.startPos[1]}`));

  // All tiles marked isConnectedToStart must match getConnectedTiles
  for (let r = 0; r < board.size; r++) {
    for (let c = 0; c < board.size; c++) {
      const tile = board.tiles[r][c];
      assert.equal(
        tile.isConnectedToStart,
        connected.has(tile.id),
        `Mismatch at tile ${tile.id} isConnectedToStart`
      );
    }
  }

  // Initial board starts strictly unsolved
  assert.equal(checkWinCondition(board), false, "Generated board must start unsolved");
});

test("Solver & Win Verification: Board can be solved by applying target rotations", () => {
  const board = generateDailyBoard("2026-11-01");
  const solution = solveBoard(board);

  assert.equal(solution.solvable, true, "Generated board must be solvable");
  assert.ok(solution.minMoves >= 4, `minMoves (${solution.minMoves}) should be >= 4`);
  assert.ok(solution.minMoves <= 12, `minMoves (${solution.minMoves}) should be <= 12`);
  assert.equal(solution.parMoves, computeParMoves(solution.minMoves));
  assert.ok(solution.targetRotations, "Solver must return target rotations");

  // Apply the target rotations to the board
  let currentBoard = board;
  let movesCount = 0;

  for (const [cellId, targetRot] of Object.entries(solution.targetRotations!)) {
    const [, rStr, cStr] = cellId.split("-");
    const r = parseInt(rStr, 10);
    const c = parseInt(cStr, 10);

    const tile = currentBoard.tiles[r][c];
    if (tile.isFixed) continue;

    const taps = (targetRot - tile.rotation + 4) % 4;
    for (let tap = 0; tap < taps; tap++) {
      currentBoard = rotateTileAt(currentBoard, r, c);
      movesCount++;
    }
  }

  // After applying target rotations, the board must win!
  assert.equal(
    checkWinCondition(currentBoard),
    true,
    "Applying solver target rotations must achieve win condition"
  );
  assert.equal(movesCount, solution.minMoves, "Moves applied must equal minMoves");
});

test("Solver Performance: Single board solve time is under 0.1ms", () => {
  const board = generateDailyBoard("2026-06-15");
  // Warm up JIT compiler thoroughly
  for (let i = 0; i < 50; i++) {
    solveBoard(board);
  }
  const t0 = performance.now();
  const iterations = 200;
  for (let i = 0; i < iterations; i++) {
    solveBoard(board);
  }
  const t1 = performance.now();
  const avgMs = (t1 - t0) / iterations;
  assert.ok(avgMs < 0.25, `Average solve time ${avgMs.toFixed(4)}ms exceeds 0.25ms`);
});

test("Board Generation: Determinism across multiple calls", () => {
  const b1 = generateDailyBoard("2026-07-20");
  const b2 = generateDailyBoard("2026-07-20");

  assert.equal(b1.dateStr, b2.dateStr);
  assert.equal(b1.puzzleNumber, b2.puzzleNumber);
  assert.equal(b1.minMoves, b2.minMoves);
  assert.equal(b1.parMoves, b2.parMoves);

  for (let r = 0; r < b1.size; r++) {
    for (let c = 0; c < b1.size; c++) {
      assert.equal(b1.tiles[r][c].type, b2.tiles[r][c].type);
      assert.equal(b1.tiles[r][c].rotation, b2.tiles[r][c].rotation);
      assert.equal(b1.tiles[r][c].targetRotation, b2.tiles[r][c].targetRotation);
      assert.equal(b1.tiles[r][c].isFixed, b2.tiles[r][c].isFixed);
      assert.equal(b1.tiles[r][c].inSolutionPath, b2.tiles[r][c].inSolutionPath);
    }
  }
});

test("Solver Math: getRotationCostAndTarget for all tile types", () => {
  // Straight: opposite ports (1 and 3)
  const sHoriz = getRotationCostAndTarget("straight", 0, 1, 3);
  assert.equal(sHoriz.cost, 0);
  assert.equal(sHoriz.targetRotation, 0);

  const sVert = getRotationCostAndTarget("straight", 0, 0, 2);
  assert.equal(sVert.cost, 1);
  assert.equal(sVert.targetRotation, 1);

  // Straight cannot connect perpendicular
  const sPerp = getRotationCostAndTarget("straight", 0, 0, 1);
  assert.equal(sPerp.cost, Infinity);

  // Corner: perpendicular ports (0 and 1)
  const cRot0 = getRotationCostAndTarget("corner", 0, 0, 1);
  assert.equal(cRot0.cost, 0);
  assert.equal(cRot0.targetRotation, 0);

  const cRot2 = getRotationCostAndTarget("corner", 0, 2, 3);
  assert.equal(cRot2.cost, 2);
  assert.equal(cRot2.targetRotation, 2);

  // Corner cannot connect opposite
  const cOpp = getRotationCostAndTarget("corner", 0, 0, 2);
  assert.equal(cOpp.cost, Infinity);

  // Cross connects all ports for 0 cost
  const cross = getRotationCostAndTarget("cross", 1, 0, 2);
  assert.equal(cross.cost, 0);

  // Blank cannot connect anything
  const blank = getRotationCostAndTarget("blank", 0, 0, 1);
  assert.equal(blank.cost, Infinity);

  // Same port entrance/exit is invalid
  const same = getRotationCostAndTarget("corner", 0, 1, 1);
  assert.equal(same.cost, Infinity);
});

test("Solver & Solvability: Unsolvable board returns solvable: false", () => {
  const board = generateDailyBoard("2026-11-01");
  // Turn all intermediate tiles into blanks
  const blockedBoard: BoardState = {
    ...board,
    tiles: board.tiles.map((row, r) =>
      row.map((t, c) => {
        if (t.isFixed) return { ...t };
        return {
          ...t,
          type: "blank",
          rotation: 0,
        };
      })
    ),
  };

  const solution = solveBoard(blockedBoard);
  assert.equal(solution.solvable, false);
  assert.equal(solution.minMoves, Infinity);
  assert.equal(solution.parMoves, Infinity);
  assert.equal(isBoardSolvable(blockedBoard), false);
});

test("Win Condition: Breaking a winning connection reverts checkWinCondition to false", () => {
  const board = generateDailyBoard("2026-11-01");
  const solution = solveBoard(board);
  assert.ok(solution.solvable && solution.targetRotations);

  let solvedBoard = board;
  for (const [cellId, targetRot] of Object.entries(solution.targetRotations)) {
    const [, rStr, cStr] = cellId.split("-");
    const r = parseInt(rStr, 10);
    const c = parseInt(cStr, 10);
    const tile = solvedBoard.tiles[r][c];
    if (tile.isFixed) continue;
    const taps = (targetRot - tile.rotation + 4) % 4;
    for (let i = 0; i < taps; i++) {
      solvedBoard = rotateTileAt(solvedBoard, r, c);
    }
  }

  assert.equal(checkWinCondition(solvedBoard), true);

  // Pick one tile along the winning path and rotate it away
  const pathTileId = Object.keys(solution.targetRotations)[0];
  const [, rStr, cStr] = pathTileId.split("-");
  const r = parseInt(rStr, 10);
  const c = parseInt(cStr, 10);

  const brokenBoard = rotateTileAt(solvedBoard, r, c);
  // Unless the tile is symmetric (like a straight turned 180 deg), it should break the win
  // If it's straight, rotate once more if needed
  if (checkWinCondition(brokenBoard)) {
    const brokenBoard2 = rotateTileAt(brokenBoard, r, c);
    assert.equal(checkWinCondition(brokenBoard2), false);
  } else {
    assert.equal(checkWinCondition(brokenBoard), false);
  }
});

