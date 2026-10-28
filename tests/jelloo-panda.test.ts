import test from "node:test";
import assert from "node:assert/strict";
import { pandaLevel, allPandaLevels, pandaScore } from "../lib/jelloo/campaign-v2/panda-provider";
import { PANDA_PLANS, PANDA_SPECS } from "../lib/jelloo/campaign-v2/panda-specs";
import { initialGame, gameReducer, tracePath } from "../lib/jelloo/engine";
import { solvePowerLevel } from "../lib/jelloo/power-solver";
import { auditBatchUniqueness } from "../lib/jelloo/campaign-v2/structural-comparator";

function play(id: number, kind: "short" | "stars") {
  let game = initialGame(pandaLevel(id));
  const clicks = PANDA_PLANS[id][kind];
  clicks.forEach((index, n) => {
    assert.equal(game.status, "editing", `Level ${id}: premature auto-start at step ${n}`);
    game = gameReducer(game, { type: "rotate", index });
    assert.equal(game.moves, n + 1);
    game = gameReducer(game, { type: "auto", runId: game.runId, moves: game.moves });
    if (n < clicks.length - 1) {
      assert.equal(game.status, "editing", `Level ${id}: star route unavailable with normal 250ms pauses`);
    }
  });
  while (game.status === "running") {
    game = gameReducer(game, { type: "tick", runId: game.runId });
  }
  assert.equal(game.status, "won", `Level ${id} (${kind}) failed to win. Ended with status ${game.status}`);
  return game;
}

test("Panda revision contains all fifty 5x4 levels and both certified click journeys", () => {
  const levels = allPandaLevels();
  assert.equal(levels.length, 50);

  for (const level of levels) {
    assert.equal(level.columns, 5, `Level ${level.id} columns must be 5`);
    assert.equal(level.rows, 4, `Level ${level.id} rows must be 4`);
    assert.equal(level.tiles.length, 20, `Level ${level.id} tiles count must be 20`);
    assert.equal(level.collectibles!.length, 2, `Level ${level.id} must have 2 collectibles`);
    assert.equal(
      level.moveLimit,
      level.solverStarPar + 3,
      `Level ${level.id} moveLimit must have +3 recovery margin`
    );

    const starGame = play(level.id, "stars");
    assert.equal(pandaScore(starGame).stars, 3, `Level ${level.id} star journey must earn 3 stars`);

    const shortGame = play(level.id, "short");
    assert.equal(
      pandaScore(shortGame).stars,
      level.id <= 54 ? 3 : 1,
      `Level ${level.id} short journey stars mismatch`
    );

    if (level.id > 54) {
      assert(
        level.solverStarPar > level.solverPar,
        `Level ${level.id} starPar (${level.solverStarPar}) must exceed short par (${level.solverPar})`
      );
      assert(
        PANDA_PLANS[level.id].stars.length > PANDA_PLANS[level.id].short.length,
        `Level ${level.id} star clicks must exceed short clicks`
      );
    }
    if (level.id >= 91) {
      assert(
        level.solverPar >= 11,
        `Level ${level.id} in Band 5 must have short par >= 11 (was ${level.solverPar})`
      );
    }
  }
});

test("Panda power levels strictly require Panda and break cracked bridge to open gate", () => {
  const powerSpecs = PANDA_SPECS.filter(s => s.cracked?.length);
  assert.equal(powerSpecs.length, 11, "Must have exactly 11 power levels (51, 55, 60, ... 100)");

  for (const spec of powerSpecs) {
    const level = pandaLevel(spec.id);
    assert(level.gate, `Power level ${spec.id} must specify gate`);

    // Solvable with Panda
    const pandaSolve = solvePowerLevel(level, "panda");
    assert(pandaSolve.solvable, `Level ${spec.id} must be solvable with Panda`);

    // Strictly unsolvable without Panda (null or bunny)
    const nullSolve = solvePowerLevel(level, null);
    assert(!nullSolve.solvable, `Level ${spec.id} must NOT be solvable without character`);

    const bunnySolve = solvePowerLevel(level, "bunny");
    assert(!bunnySolve.solvable, `Level ${spec.id} must NOT be solvable with Bunny`);

    // Trace execution verifies cracked tile crumbled and gate opened
    const game = play(spec.id, "stars");
    assert.equal(game.status, "won");
    const lastState = game.trace?.states?.at(-1);
    assert(lastState, `Level ${spec.id} must record power states in trace`);
    assert(
      lastState.broken.includes(level.gate.trigger),
      `Level ${spec.id} trigger ${level.gate.trigger} must be broken by Panda`
    );
  }
});

test("all 1225 Panda level pairs reject repeated canonical signatures and high-overlap detours", () => {
  const report = auditBatchUniqueness(allPandaLevels().map(level => ({ level })));
  assert.deepEqual(report.duplicates, [], `Found duplicate layouts: ${JSON.stringify(report.duplicates)}`);
  assert.deepEqual(
    report.nearDuplicates,
    [],
    `Found near-duplicate layouts: ${JSON.stringify(report.nearDuplicates)}`
  );
});

test("Panda difficulty ramp increases across all 5 progression bands", () => {
  const levels = allPandaLevels();
  const bands = [
    levels.slice(0, 10), // 51-60
    levels.slice(10, 20), // 61-70
    levels.slice(20, 30), // 71-80
    levels.slice(30, 40), // 81-90
    levels.slice(40, 50), // 91-100
  ];

  const shortAverages = bands.map(b => b.reduce((sum, l) => sum + l.solverPar, 0) / b.length);
  for (let i = 1; i < shortAverages.length; i++) {
    assert(
      shortAverages[i] >= shortAverages[i - 1] - 0.2,
      `Band ${i + 1} average par (${shortAverages[i]}) should generally increase over Band ${i} (${shortAverages[i - 1]})`
    );
  }

  // Band 1 vs Band 5 must show clear progression
  assert(
    shortAverages[4] > shortAverages[0] + 3,
    `Band 5 average (${shortAverages[4]}) must substantially exceed Band 1 (${shortAverages[0]})`
  );

  // Late band minimum move count rule: zero 1-2 move solutions
  const band5MinPar = Math.min(...bands[4].map(l => l.solverPar));
  assert(band5MinPar >= 11, `Band 5 minimum par must be >= 11 (was ${band5MinPar})`);
});

test("Panda rewards reflect reached collectibles and reject incomplete or lost states", () => {
  const game = play(56, "stars");
  assert.equal(pandaScore(game).stars, 3);
  assert.equal(pandaScore(game).collected, 2);

  const short = play(56, "short");
  assert.equal(pandaScore(short).stars, 1);
  assert.equal(pandaScore(short).collected, 0);

  // Lost or fresh states award 0 stars
  assert.equal(pandaScore({ ...game, status: "lost" }).stars, 0);
  assert.equal(pandaScore(initialGame(pandaLevel(51))).stars, 0);
  assert.equal(tracePath(game.level, game.tiles).outcome, "home");
});

test("Panda auto-starts on connection and preserves deterministic moves and rewards", () => {
  let game = initialGame(pandaLevel(51));
  const plan = PANDA_PLANS[51].stars;

  for (let i = 0; i < plan.length; i++) {
    const idx = plan[i];
    const before = game.moves;
    game = gameReducer(game, { type: "rotate", index: idx });
    assert.equal(game.moves, before + 1);
  }

  // Auto start connects and runs home
  game = gameReducer(game, { type: "auto", runId: game.runId, moves: game.moves });
  assert.equal(game.status, "running");

  // Rotating during running is safely ignored
  const running = game;
  assert.deepEqual(gameReducer(game, { type: "rotate", index: 0 }), running);

  while (game.status === "running") {
    game = gameReducer(game, { type: "tick", runId: game.runId });
  }

  assert.equal(game.status, "won");
  assert.equal(pandaScore(game).stars, 3);

  // Repeated ticks or auto actions in won state are idempotent
  assert.deepEqual(gameReducer(game, { type: "tick", runId: game.runId }), game);
  assert.deepEqual(gameReducer(game, { type: "auto", runId: game.runId, moves: game.moves }), game);
});
