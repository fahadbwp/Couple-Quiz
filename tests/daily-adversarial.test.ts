/**
 * Daily Path (Pathle) - Tier 5 Adversarial Coverage Hardening & Fuzz Suite
 * Challenger 1 (challenger_1)
 *
 * Verifies:
 * 1. Mathematical determinism & solvability across 500+ edge and random dates
 * 2. Never starts in winning state invariant
 * 3. 100% solvability invariant
 * 4. Dijkstra solver optimality & parity verification
 * 5. Anti-hang and infinite recursion stress testing on pathological board states
 * 6. Solver execution benchmarking (< 0.1ms per board)
 * 7. Independent oracle verification
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  generateDailyBoard,
  checkWinCondition,
  getConnectedTiles,
  rotateTileAt,
  DEFAULT_GRID_SIZE,
} from "../lib/daily/engine";
import {
  solveBoard,
  computeParMoves,
  getTilePorts,
  getRotationCostAndTarget,
} from "../lib/daily/solver";
import {
  seedFromUtcDate,
  getPuzzleNumber,
} from "../lib/daily/prng";
import type { BoardState, Tile, Direction, TileType } from "../lib/daily/types";

// Helper to construct a custom test board
function makeBoard(
  tilesMap: { type: TileType; rotation: Direction; isFixed?: boolean }[][],
  startPos: [number, number] = [0, 0],
  goalPos: [number, number] = [3, 3]
): BoardState {
  const size = 4;
  const tiles: Tile[][] = [];
  for (let r = 0; r < size; r++) {
    tiles[r] = [];
    for (let c = 0; c < size; c++) {
      const def = tilesMap[r][c];
      tiles[r][c] = {
        id: `cell-${r}-${c}`,
        row: r,
        col: c,
        type: def.type,
        rotation: def.rotation,
        targetRotation: def.rotation,
        isFixed: def.isFixed ?? (def.type === "start" || def.type === "goal"),
        inSolutionPath: false,
        isConnectedToStart: false,
      };
    }
  }

  const board: BoardState = {
    dateStr: "2026-11-01",
    puzzleNumber: 305,
    size,
    tiles,
    startPos,
    goalPos,
    parMoves: 0,
    minMoves: 0,
  };

  const conn = getConnectedTiles(board);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      board.tiles[r][c].isConnectedToStart = conn.has(board.tiles[r][c].id);
    }
  }

  return board;
}

test("Adversarial 1: Fuzz testing across 500+ random and edge date strings", () => {
  const edgeDates = [
    // Leap years
    "2024-02-29",
    "2028-02-29",
    "2032-02-29",
    "2036-02-29",
    // Century leap years
    "2000-02-29",
    "1600-02-29",
    "2400-02-29",
    // Century non-leap year boundary dates
    "1900-02-28",
    "1900-03-01",
    "2100-02-28",
    "2100-03-01",
    // Year-end transitions
    "2025-12-31",
    "2026-01-01",
    "2026-12-31",
    "2027-01-01",
    "2027-12-31",
    "2028-01-01",
    "1999-12-31",
    "2000-01-01",
    // Distant past & future
    "1970-01-01",
    "1980-06-15",
    "2050-07-04",
    "2099-12-31",
    "2150-01-01",
    "2999-12-31",
    // Month boundaries
    "2026-02-28",
    "2026-03-01",
    "2026-04-30",
    "2026-05-01",
  ];

  // Generate 500+ pseudo-random dates spread across 2020-2040
  const datesSet = new Set<string>(edgeDates);
  let d = new Date("2020-01-01T00:00:00Z");
  // Stride by 13 days to get diverse month/year distributions
  while (datesSet.size < 520) {
    datesSet.add(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 13);
  }

  const allDates = Array.from(datesSet);
  assert.ok(allDates.length >= 500, `Must test >= 500 dates, got ${allDates.length}`);

  let totalSolveTimeMs = 0;
  let maxSolveTimeMs = 0;

  for (let i = 0; i < allDates.length; i++) {
    const dateStr = allDates[i];
    const board = generateDailyBoard(dateStr);

    // 1. Invariant: Board must be deterministic on repeat generation
    const boardRepeat = generateDailyBoard(dateStr);
    assert.equal(board.dateStr, boardRepeat.dateStr);
    assert.equal(board.minMoves, boardRepeat.minMoves);
    assert.equal(board.parMoves, boardRepeat.parMoves);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        assert.equal(board.tiles[r][c].type, boardRepeat.tiles[r][c].type);
        assert.equal(board.tiles[r][c].rotation, boardRepeat.tiles[r][c].rotation);
        assert.equal(board.tiles[r][c].targetRotation, boardRepeat.tiles[r][c].targetRotation);
      }
    }

    // 2. Invariant: Must NEVER start in a winning state
    const startsSolved = checkWinCondition(board);
    assert.equal(
      startsSolved,
      false,
      `VIOLATION: Date ${dateStr} generated a board that starts already solved!`
    );

    // 3. Invariant: Must be 100% solvable and within Par limits
    const t0 = performance.now();
    const solution = solveBoard(board);
    const solveDur = performance.now() - t0;
    totalSolveTimeMs += solveDur;
    if (solveDur > maxSolveTimeMs) maxSolveTimeMs = solveDur;

    assert.equal(solution.solvable, true, `VIOLATION: Date ${dateStr} is unsolvable!`);
    assert.ok(
      solution.minMoves >= 4 && solution.minMoves <= 12,
      `VIOLATION: Date ${dateStr} minMoves (${solution.minMoves}) outside [4, 12] range`
    );
    assert.equal(
      board.minMoves,
      solution.minMoves,
      `VIOLATION: Date ${dateStr} board.minMoves (${board.minMoves}) != solver.minMoves (${solution.minMoves})`
    );
    assert.equal(
      board.parMoves,
      solution.parMoves,
      `VIOLATION: Date ${dateStr} board.parMoves (${board.parMoves}) != solver.parMoves (${solution.parMoves})`
    );

    // 4. Par moves formula invariant
    assert.equal(solution.parMoves, solution.minMoves + 1);

    // 5. Verification of solution: Apply target rotations and verify that checkWinCondition becomes true
    if (solution.targetRotations) {
      let testBoard = board;
      for (const [cellId, targetRot] of Object.entries(solution.targetRotations)) {
        const parts = cellId.split("-");
        const r = parseInt(parts[1], 10);
        const c = parseInt(parts[2], 10);
        while (testBoard.tiles[r][c].rotation !== targetRot) {
          testBoard = rotateTileAt(testBoard, r, c);
        }
      }
      const wonAfterSolution = checkWinCondition(testBoard);
      assert.equal(
        wonAfterSolution,
        true,
        `VIOLATION: Applying solver target rotations on ${dateStr} did not connect start to goal!`
      );
    }
  }

  const avgSolveTimeMs = totalSolveTimeMs / allDates.length;
  // Solver benchmarking check
  assert.ok(
    avgSolveTimeMs < 0.1,
    `VIOLATION: Average solver time ${avgSolveTimeMs.toFixed(4)}ms exceeds 0.1ms threshold!`
  );
});

test("Adversarial 2: Solver Anti-Hang & Infinite Recursion on Pathological Boards", () => {
  // Scenario A: 4x4 Grid of 100% CROSS tiles (maximum branching factor, 4 paths at every tile, infinite cycles)
  const allCrossMap: { type: TileType; rotation: Direction }[][] = [];
  for (let r = 0; r < 4; r++) {
    allCrossMap[r] = [];
    for (let c = 0; c < 4; c++) {
      if (r === 0 && c === 0) {
        allCrossMap[r][c] = { type: "start", rotation: 0 }; // exits East (0, 1)
      } else if (r === 3 && c === 3) {
        allCrossMap[r][c] = { type: "goal", rotation: 1 }; // receives from North (2, 3)
      } else {
        allCrossMap[r][c] = { type: "cross", rotation: 0 };
      }
    }
  }
  const crossBoard = makeBoard(allCrossMap);

  const tStart = performance.now();
  const crossSol = solveBoard(crossBoard);
  const dur = performance.now() - tStart;

  assert.ok(dur < 50, `All-cross board solve took too long: ${dur.toFixed(2)}ms`);
  assert.equal(crossSol.solvable, true);
  assert.equal(crossSol.minMoves, 0, "All-cross tiles require 0 rotations");

  // Scenario B: 4x4 Grid of 100% TEE tiles with complex cyclic rotations
  const allTeeMap: { type: TileType; rotation: Direction }[][] = [];
  for (let r = 0; r < 4; r++) {
    allTeeMap[r] = [];
    for (let c = 0; c < 4; c++) {
      if (r === 0 && c === 0) {
        allTeeMap[r][c] = { type: "start", rotation: 0 };
      } else if (r === 3 && c === 3) {
        allTeeMap[r][c] = { type: "goal", rotation: 1 };
      } else {
        // Adversarial rotation pointing away
        allTeeMap[r][c] = { type: "tee", rotation: ((r + c) % 4) as Direction };
      }
    }
  }
  const teeBoard = makeBoard(allTeeMap);
  const teeSol = solveBoard(teeBoard);
  assert.equal(teeSol.solvable, true);
  assert.ok(teeSol.minMoves >= 0);

  // Scenario C: Completely trapped start tile (surrounded by blank tiles)
  const trappedStartMap: { type: TileType; rotation: Direction }[][] = [];
  for (let r = 0; r < 4; r++) {
    trappedStartMap[r] = [];
    for (let c = 0; c < 4; c++) {
      trappedStartMap[r][c] = { type: "blank", rotation: 0 };
    }
  }
  trappedStartMap[0][0] = { type: "start", rotation: 0 }; // exits East to (0, 1)
  trappedStartMap[0][1] = { type: "blank", rotation: 0 }; // impassable
  trappedStartMap[1][0] = { type: "blank", rotation: 0 }; // impassable
  trappedStartMap[3][3] = { type: "goal", rotation: 1 };

  const trappedBoard = makeBoard(trappedStartMap);
  const trappedSol = solveBoard(trappedBoard);
  assert.equal(trappedSol.solvable, false, "Trapped start must be unsolvable");
  assert.equal(trappedSol.minMoves, Infinity);
  assert.equal(trappedSol.parMoves, Infinity);

  // Scenario D: Trapped goal tile (surrounded by blank tiles)
  const trappedGoalMap: { type: TileType; rotation: Direction }[][] = [];
  for (let r = 0; r < 4; r++) {
    trappedGoalMap[r] = [];
    for (let c = 0; c < 4; c++) {
      trappedGoalMap[r][c] = { type: "straight", rotation: 0 };
    }
  }
  trappedGoalMap[0][0] = { type: "start", rotation: 0 };
  trappedGoalMap[3][3] = { type: "goal", rotation: 1 }; // receives from North (2, 3)
  trappedGoalMap[2][3] = { type: "blank", rotation: 0 }; // blocks entrance from North
  trappedGoalMap[3][2] = { type: "blank", rotation: 0 }; // blocks entrance from West

  const trappedGoalBoard = makeBoard(trappedGoalMap);
  const trappedGoalSol = solveBoard(trappedGoalBoard);
  assert.equal(trappedGoalSol.solvable, false, "Trapped goal must be unsolvable");

  // Scenario E: Cyclic deadlock loop (tiles arranged in a 2x2 loop of corners with no exit)
  const loopMap: { type: TileType; rotation: Direction }[][] = [];
  for (let r = 0; r < 4; r++) {
    loopMap[r] = [];
    for (let c = 0; c < 4; c++) {
      loopMap[r][c] = { type: "blank", rotation: 0 };
    }
  }
  loopMap[0][0] = { type: "start", rotation: 0 }; // exits East (0, 1)
  // 2x2 loop at (0,1), (0,2), (1,2), (1,1)
  loopMap[0][1] = { type: "corner", rotation: 1 }; // ports 1, 2
  loopMap[0][2] = { type: "corner", rotation: 2 }; // ports 2, 3
  loopMap[1][2] = { type: "corner", rotation: 3 }; // ports 3, 0
  loopMap[1][1] = { type: "corner", rotation: 0 }; // ports 0, 1
  loopMap[3][3] = { type: "goal", rotation: 1 };

  const loopBoard = makeBoard(loopMap);
  const loopSol = solveBoard(loopBoard);
  assert.equal(loopSol.solvable, false, "Deadlock loop without path to goal must return unsolvable without hanging");
});

test("Adversarial 3: Dijkstra Solver Optimality Proof against Exhaustive Oracle", () => {
  // Oracle: For a small test path from start to goal, independently check all possible rotation combinations
  // to ensure Dijkstra's returned minMoves is strictly minimal and optimal.
  const oracleMap: { type: TileType; rotation: Direction }[][] = [
    [
      { type: "start", rotation: 0 },    // exits East to (0, 1)
      { type: "straight", rotation: 1 }, // target 0, cost 3 or 1
      { type: "corner", rotation: 3 },   // connects West to South -> target 2, cost 3
      { type: "blank", rotation: 0 },
    ],
    [
      { type: "blank", rotation: 0 },
      { type: "blank", rotation: 0 },
      { type: "straight", rotation: 0 }, // vertical -> target 1, cost 1
      { type: "blank", rotation: 0 },
    ],
    [
      { type: "blank", rotation: 0 },
      { type: "blank", rotation: 0 },
      { type: "corner", rotation: 0 },   // connects North to East -> target 1, cost 1
      { type: "corner", rotation: 2 },   // connects West to South -> target 2, cost 0
    ],
    [
      { type: "blank", rotation: 0 },
      { type: "blank", rotation: 0 },
      { type: "blank", rotation: 0 },
      { type: "goal", rotation: 1 },     // receives from North (2, 3)
    ],
  ];

  const oracleBoard = makeBoard(oracleMap);
  const sol = solveBoard(oracleBoard);
  assert.equal(sol.solvable, true);

  // Exhaustive search over all 4^5 = 1024 rotation states of the 5 path tiles:
  // (0,1), (0,2), (1,2), (2,2), (2,3)
  const pathCoords = [
    [0, 1],
    [0, 2],
    [1, 2],
    [2, 2],
    [2, 3],
  ];

  let oracleMinMoves = Infinity;
  const initialRots = pathCoords.map(([r, c]) => oracleBoard.tiles[r][c].rotation);

  for (let r0 = 0; r0 < 4; r0++) {
    for (let r1 = 0; r1 < 4; r1++) {
      for (let r2 = 0; r2 < 4; r2++) {
        for (let r3 = 0; r3 < 4; r3++) {
          for (let r4 = 0; r4 < 4; r4++) {
            const rots = [r0, r1, r2, r3, r4];
            let cost = 0;
            for (let i = 0; i < 5; i++) {
              cost += (rots[i] - initialRots[i] + 4) % 4;
            }
            if (cost >= oracleMinMoves) continue;

            // Test if this rotation assignment connects start to goal
            let testBoard = oracleBoard;
            for (let i = 0; i < 5; i++) {
              const [pr, pc] = pathCoords[i];
              while (testBoard.tiles[pr][pc].rotation !== rots[i]) {
                testBoard = rotateTileAt(testBoard, pr, pc);
              }
            }

            if (checkWinCondition(testBoard)) {
              if (cost < oracleMinMoves) {
                oracleMinMoves = cost;
              }
            }
          }
        }
      }
    }
  }

  assert.equal(
    sol.minMoves,
    oracleMinMoves,
    `Oracle minMoves (${oracleMinMoves}) != Dijkstra minMoves (${sol.minMoves})`
  );
});

test("Adversarial 4: Generation vs Solver Profiling Audit & Population Benchmark", () => {
  // Benchmark pure solveBoard across 100 diverse calendar boards to measure true population average
  const benchmarkDates: string[] = [];
  const cur = new Date("2026-01-01T00:00:00Z");
  for (let i = 0; i < 100; i++) {
    benchmarkDates.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 3); // 3-day stride across all seasons
  }

  // Pre-generate boards to isolate pure solver execution time
  const boards = benchmarkDates.map(d => generateDailyBoard(d));

  // Warm-up JIT
  for (let i = 0; i < 10; i++) {
    solveBoard(boards[i]);
  }

  let totalSolveMs = 0;
  let maxSolveMs = 0;

  for (let i = 0; i < boards.length; i++) {
    const t0 = performance.now();
    solveBoard(boards[i]);
    const dur = performance.now() - t0;
    totalSolveMs += dur;
    if (dur > maxSolveMs) maxSolveMs = dur;
  }

  const avgSolveMs = totalSolveMs / boards.length;

  // Population average solve time must be < 0.1ms
  assert.ok(
    avgSolveMs < 0.1,
    `VIOLATION: Population average solve time ${avgSolveMs.toFixed(4)}ms exceeds 0.1ms threshold!`
  );

  // Maximum single-board solve time must be strictly bounded (< 5ms) to prevent any UI frame hitch
  assert.ok(
    maxSolveMs < 5.0,
    `VIOLATION: Outlier board solve time ${maxSolveMs.toFixed(4)}ms exceeds 5.0ms anti-hitch bound!`
  );
});
