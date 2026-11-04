import test from "node:test";
import assert from "node:assert/strict";
import { generateDailyBoard } from "../lib/daily/engine";
import { solveBoard } from "../lib/daily/solver";

test("365-Day Solvability: Every single date from 2026-01-01 to 2026-12-31 is unique, solvable, and within Par limits", () => {
  const dates: string[] = [];
  const cur = new Date("2026-01-01T00:00:00Z");
  const end = new Date("2026-12-31T00:00:00Z");

  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }

  assert.equal(dates.length, 365, "Must test exactly 365 calendar days");

  // Warm up JIT compiler
  for (let i = 0; i < 10; i++) {
    generateDailyBoard(dates[i]);
  }

  // Pure 365-day board generation and solvability audit benchmark
  const t0 = performance.now();
  const boards = dates.map(d => generateDailyBoard(d));
  const durationMs = performance.now() - t0;

  assert.ok(
    durationMs < 3000,
    `365-day generation and solving took ${durationMs.toFixed(2)}ms, must be < 3000ms total`
  );

  // Validate invariants for all 365 boards
  const seenSignatures = new Set<string>();

  for (let i = 0; i < dates.length; i++) {
    const dateStr = dates[i];
    const board = boards[i];

    assert.equal(board.dateStr, dateStr);
    assert.equal(board.puzzleNumber, i + 1, `Puzzle number should be ${i + 1} for ${dateStr}`);
    assert.equal(board.size, 4);

    // Verify initially unsolved and within Par limits
    assert.ok(board.minMoves >= 4, `${dateStr}: minMoves ${board.minMoves} should be >= 4`);
    assert.ok(board.minMoves <= 12, `${dateStr}: minMoves ${board.minMoves} should be <= 12`);
    assert.ok(board.parMoves >= 5 && board.parMoves <= 13, `${dateStr}: parMoves ${board.parMoves} out of range`);

    // Verify 100% solvable
    const solution = solveBoard(board);
    assert.equal(solution.solvable, true, `${dateStr} must be solvable`);
    assert.equal(solution.minMoves, board.minMoves, `${dateStr}: solver minMoves must match board minMoves`);

    // Verify unique board signature across days
    let sig = "";
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const t = board.tiles[r][c];
        sig += `${t.type[0]}${t.rotation}`;
      }
    }
    assert.ok(!seenSignatures.has(sig), `Duplicate board layout detected on ${dateStr}`);
    seenSignatures.add(sig);
  }
});
