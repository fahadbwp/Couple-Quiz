import test from "node:test";
import assert from "node:assert/strict";
import { catLevel, allCatLevels, catScore } from "../lib/jelloo/campaign-v2/cat-provider";
import { CAT_PLANS, CAT_SPECS } from "../lib/jelloo/campaign-v2/cat-specs";
import { initialGame, gameReducer, tracePath } from "../lib/jelloo/engine";
import { solvePowerLevel } from "../lib/jelloo/power-solver";
import { auditBatchUniqueness } from "../lib/jelloo/campaign-v2/structural-comparator";
import { powerStepDuration } from "../lib/jelloo/pals";

function play(id: number, kind: "short" | "stars") {
  let game = initialGame(catLevel(id));
  const clicks = CAT_PLANS[id][kind];
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

test("Cat revision contains all fifty 6x4 levels and both certified click journeys", () => {
  const levels = allCatLevels();
  assert.equal(levels.length, 50);

  for (const level of levels) {
    assert.equal(level.columns, 6, `Level ${level.id} columns must be 6`);
    assert.equal(level.rows, 4, `Level ${level.id} rows must be 4`);
    assert.equal(level.tiles.length, 24, `Level ${level.id} tiles count must be 24`);
    assert.equal(level.collectibles!.length, 2, `Level ${level.id} must have 2 collectibles`);
    assert.equal(
      level.moveLimit,
      level.solverStarPar + 3,
      `Level ${level.id} moveLimit must have +3 recovery margin`
    );

    const starGame = play(level.id, "stars");
    assert.equal(catScore(starGame).stars, 3, `Level ${level.id} star journey must earn 3 stars`);

    const shortGame = play(level.id, "short");
    assert.equal(
      catScore(shortGame).stars,
      level.id <= 104 ? 3 : 1,
      `Level ${level.id} short journey stars mismatch`
    );

    if (level.id > 104) {
      assert(
        level.solverStarPar > level.solverPar,
        `Level ${level.id} starPar (${level.solverStarPar}) must exceed short par (${level.solverPar})`
      );
      assert(
        CAT_PLANS[level.id].stars.length > CAT_PLANS[level.id].short.length,
        `Level ${level.id} star clicks must exceed short clicks`
      );
    }
    if (level.id >= 141) {
      assert(
        level.solverPar >= 11,
        `Level ${level.id} in Band 5 must have short par >= 11 (was ${level.solverPar})`
      );
    }
  }
});

test("Cat power levels strictly require Cat and wall-edge routes are impassable for others", () => {
  const powerSpecs = CAT_SPECS.filter(s => s.walls?.length);
  assert.equal(powerSpecs.length, 11, "Must have exactly 11 power levels (101, 105, 110, ... 150)");

  for (const spec of powerSpecs) {
    const level = catLevel(spec.id);

    // Solvable with Cat
    const catSolve = solvePowerLevel(level, "cat");
    assert(catSolve.solvable, `Level ${spec.id} must be solvable with Cat`);

    // Strictly unsolvable without Cat (null, bunny, panda)
    const nullSolve = solvePowerLevel(level, null);
    assert(!nullSolve.solvable, `Level ${spec.id} must NOT be solvable without character`);

    const bunnySolve = solvePowerLevel(level, "bunny");
    assert(!bunnySolve.solvable, `Level ${spec.id} must NOT be solvable with Bunny`);

    const pandaSolve = solvePowerLevel(level, "panda");
    assert(!pandaSolve.solvable, `Level ${spec.id} must NOT be solvable with Panda`);

    // Trace execution verifies wall tiles are part of the solution
    const game = play(spec.id, "stars");
    assert.equal(game.status, "won");
    const visitedWalls = spec.walls!.filter(w => game.trace?.path.includes(w));
    assert(visitedWalls.length > 0, `Level ${spec.id} solution route must walk on wall tiles`);
  }
});

test("Cat slow tiles meaningfully affect speed and create nimble movement decisions", () => {
  const slowSpecs = CAT_SPECS.filter(s => s.slows?.length || s.slow?.length);
  assert(slowSpecs.length >= 20, "Must have at least 20 levels featuring slow tiles");

  const sample = catLevel(slowSpecs[0].id);
  const slowIndex = (slowSpecs[0].slows ?? slowSpecs[0].slow)![0];
  assert.equal(sample.tiles[slowIndex].terrain, "slow");

  // Step timing on slow tile: Cat moves in 210ms vs 840ms for other characters
  const catMockGame = {
    ...initialGame(sample),
    trace: { path: [slowIndex], outcome: "home" as const },
    cursor: 0,
    tiles: sample.tiles,
    level: { ...sample, character: "cat" as const },
  };
  const otherMockGame = {
    ...catMockGame,
    level: { ...sample, character: "bunny" as const },
  };

  assert.equal(powerStepDuration(catMockGame, true), 210, "Cat steps quickly across slow tiles");
  assert.equal(powerStepDuration(otherMockGame, true), 840, "Other characters are slowed 4x on slow tiles");
});

test("Level 101 silent intro teaches wall-parapet walking without tutorial paragraph", () => {
  const intro = catLevel(101);
  assert.equal(intro.start, 0);
  // Start exits to tile 6, which is an authored wall tile
  assert.equal(intro.tiles[6].terrain, "wall");
  assert(intro.hint.includes("parapet"), "Hint focuses simply on the parapet");
  // The level is solvable by Cat stepping on tile 6
  assert(solvePowerLevel(intro, "cat").solvable);
  assert(!solvePowerLevel(intro, null).solvable);
});

test("all 1225 Cat level pairs reject repeated canonical signatures and high-overlap detours", () => {
  const report = auditBatchUniqueness(allCatLevels().map(level => ({ level })));
  assert.deepEqual(report.duplicates, [], `Found duplicate layouts: ${JSON.stringify(report.duplicates)}`);
  assert.deepEqual(
    report.nearDuplicates,
    [],
    `Found near-duplicate layouts: ${JSON.stringify(report.nearDuplicates)}`
  );
});

test("Cat difficulty ramp increases across all 5 progression bands", () => {
  const levels = allCatLevels();
  const bands = [
    levels.slice(0, 10), // 101-110
    levels.slice(10, 20), // 111-120
    levels.slice(20, 30), // 121-130
    levels.slice(30, 40), // 131-140
    levels.slice(40, 50), // 141-150
  ];

  const shortAverages = bands.map(b => b.reduce((sum, l) => sum + l.solverPar, 0) / b.length);
  // Band 1 vs Band 5 must show clear progression
  assert(
    shortAverages[4] > shortAverages[0] + 3,
    `Band 5 average (${shortAverages[4]}) must substantially exceed Band 1 (${shortAverages[0]})`
  );

  // Late band minimum move count rule: zero 1-2 move solutions in Band 5
  const band5MinPar = Math.min(...bands[4].map(l => l.solverPar));
  assert(band5MinPar >= 11, `Band 5 minimum par must be >= 11 (was ${band5MinPar})`);
});

test("Cat rewards reflect reached collectibles and reject incomplete or lost states", () => {
  const game = play(106, "stars");
  assert.equal(catScore(game).stars, 3);
  assert.equal(catScore(game).collected, 2);

  const short = play(106, "short");
  assert.equal(catScore(short).stars, 1);
  assert.equal(catScore(short).collected, 0);

  // Lost or fresh states award 0 stars
  assert.equal(catScore({ ...game, status: "lost" }).stars, 0);
  assert.equal(catScore(initialGame(catLevel(101))).stars, 0);
  assert.equal(tracePath(game.level, game.tiles).outcome, "home");
});

test("Cat auto-starts on connection and preserves deterministic moves and rewards", () => {
  let game = initialGame(catLevel(101));
  const plan = CAT_PLANS[101].stars;

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
  assert.equal(catScore(game).stars, 3);

  // Repeated ticks or auto actions in won state are idempotent
  assert.deepEqual(gameReducer(game, { type: "tick", runId: game.runId }), game);
  assert.deepEqual(gameReducer(game, { type: "auto", runId: game.runId, moves: game.moves }), game);
});
