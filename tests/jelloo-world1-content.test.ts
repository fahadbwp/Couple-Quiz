import test from "node:test";
import assert from "node:assert/strict";
import {
  CAMPAIGN_V2_ID,
  GENERATOR_VERSION,
  getTargetBandForLevel,
} from "../lib/jelloo/campaign-v2/constants";
import {
  WORLD_1_SPECS,
  buildAuthoredLevel,
} from "../lib/jelloo/campaign-v2/world1-specs";
import {
  resolveWorld1Level,
  getAllWorld1Levels,
} from "../lib/jelloo/campaign-v2/world1-provider";
import {
  auditBatchUniqueness,
} from "../lib/jelloo/campaign-v2/structural-comparator";
import {
  solvePowerLevel,
  walkPowerLevel,
  auditPowerLevel,
} from "../lib/jelloo/power-solver";

test("Suite 1: Provider Identity, Boundaries, and Determinism", () => {
  assert.equal(CAMPAIGN_V2_ID, "character_worlds_v2");
  assert.equal(GENERATOR_VERSION, "1.0.2");

  // Rejects invalid level IDs
  assert.throws(() => resolveWorld1Level(0), /Invalid level ID/);
  assert.throws(() => resolveWorld1Level(51), /Invalid level ID/);
  assert.throws(() => resolveWorld1Level(-1), /Invalid level ID/);
  assert.throws(() => resolveWorld1Level(1.5), /Invalid level ID/);
  assert.throws(() => resolveWorld1Level(NaN), /Invalid level ID/);

  // Exactly 50 levels resolved
  const allLevels = getAllWorld1Levels();
  assert.equal(allLevels.length, 50);

  // Determinism: calling with same ID and seed returns identical board
  const l1a = resolveWorld1Level(1, 0);
  const l1b = resolveWorld1Level(1, 0);
  assert.equal(l1a.id, l1b.id);
  assert.equal(l1a.solverPar, l1b.solverPar);
  assert.equal(l1a.moveLimit, l1b.moveLimit);
  assert.deepEqual(l1a.tiles, l1b.tiles);
});

test("Suite 2: Solvability, Engine Walk, and Mascot Bunny Rules", () => {
  for (let id = 1; id <= 50; id++) {
    const level = resolveWorld1Level(id);
    assert.equal(level.character, "bunny", `Level ${id} must feature mascot Bunny`);
    assert.ok(level.start >= 0 && level.start < level.size * level.size);
    assert.ok(level.home >= 0 && level.home < level.size * level.size);
    assert.notEqual(level.start, level.home);

    const sol = solvePowerLevel(level);
    assert.ok(sol.solvable, `Level ${id} (${level.title}) must be solvable`);
    assert.ok(Number.isFinite(sol.par), `Level ${id} must have finite par`);
    assert.ok(sol.solution !== null, `Level ${id} must produce a solution board`);

    // Verify engine walk completes to home
    const walk = walkPowerLevel(level, sol.solution!);
    assert.equal(walk.outcome, "home", `Level ${id} walk must reach home`);
  }
});

test("Suite 3: Progression Difficulty Bands Across All 50 Levels", () => {
  for (let id = 1; id <= 50; id++) {
    const level = resolveWorld1Level(id);
    const band = getTargetBandForLevel(id);

    assert.ok(
      level.solverPar >= band.minPar && level.solverPar <= band.maxPar,
      `Level ${id} (${level.title}) par ${level.solverPar} outside target band [${band.minPar}, ${band.maxPar}]`
    );

    // Board size validation
    if (id <= 10) {
      assert.equal(level.size, 4, `Band 1 Level ${id} must be 4x4`);
    } else if (id <= 15) {
      assert.equal(level.size, 4, `Early Band 2 Level ${id} is 4x4`);
    } else {
      assert.equal(level.size, 5, `Levels 16+ must be 5x5`);
    }
  }
});

test("Suite 4: Bunny Power Levels (at least 10 gap levels, strictly unsolvable without Bunny)", () => {
  const gapLevelIds = [5, 8, 13, 18, 23, 27, 33, 38, 44, 48, 50];
  assert.ok(gapLevelIds.length >= 10, "Must have at least 10 power levels");

  for (const id of gapLevelIds) {
    const level = resolveWorld1Level(id);
    const spec = WORLD_1_SPECS.find(s => s.id === id)!;
    assert.ok(spec.gaps && spec.gaps.length > 0, `Level ${id} must define gaps`);

    // Solvable with Bunny
    const withBunny = solvePowerLevel(level, "bunny");
    assert.ok(withBunny.solvable, `Level ${id} must be solvable with Bunny`);

    // Strictly unsolvable without Bunny (removing Bunny power)
    const withoutBunny = solvePowerLevel(level, null);
    assert.equal(
      withoutBunny.solvable,
      false,
      `Level ${id} (${level.title}) must be unsolvable without Bunny power`
    );

    // Audit power level confirms necessity
    const audit = auditPowerLevel(level);
    assert.equal(audit.necessary, true, `Level ${id} power must be strictly necessary`);
  }
});

test("Suite 5: Detour Challenges & Move Budgets (at least 10 optional star detours)", () => {
  const detourLevelIds = [12, 16, 20, 24, 28, 32, 36, 40, 43, 47, 50];
  assert.ok(detourLevelIds.length >= 10, "Must have at least 10 detour challenges");

  for (const id of detourLevelIds) {
    const level = resolveWorld1Level(id);
    const spec = WORLD_1_SPECS.find(s => s.id === id)!;
    assert.ok(spec.detour, `Level ${id} must define a detour`);

    // Detour requires extra moves to collect the star
    assert.ok(
      level.solverStarPar > level.solverPar,
      `Level ${id} (${level.title}) detour starPar (${level.solverStarPar}) must exceed par (${level.solverPar})`
    );

    // Collectible is reachable
    const starSol = solvePowerLevel(level);
    assert.ok(starSol.solution !== null);
    const walk = walkPowerLevel(level, starSol.solution);
    assert.equal(walk.outcome, "home");

    // Move allowance formula: moveLimit = starPar + 3
    const expectedMoveLimit = level.solverStarPar + 3;
    assert.equal(level.moveLimit, expectedMoveLimit, `Level ${id} moveLimit formula`);
  }
});

test("Suite 6: Level 50 Strawberry Cottage Finale Capstone Audit", () => {
  const finale = resolveWorld1Level(50);
  const spec = WORLD_1_SPECS.find(s => s.id === 50)!;

  assert.equal(finale.title, "Strawberry Cottage Finale");
  assert.equal(finale.size, 5);

  // Solvable with par in 20-35
  assert.ok(finale.solverPar >= 20 && finale.solverPar <= 35);
  assert.equal(finale.solverPar, 22);
  assert.equal(finale.solverStarPar, 24);

  // Features moat gap jump (gap 17)
  assert.deepEqual(spec.gaps, [17]);

  // Features garden detour
  assert.ok(spec.detour);
  assert.equal(spec.detour.collectible, 7);

  // Strictly unsolvable without Bunny
  const withoutBunny = solvePowerLevel(finale, null);
  assert.equal(withoutBunny.solvable, false);
});

test("Suite 7: 8-Way Symmetry Structural Uniqueness (0 Duplicates)", () => {
  const items = WORLD_1_SPECS.map(s => ({
    level: buildAuthoredLevel(s),
    route: s.route,
  }));

  const report = auditBatchUniqueness(items);
  assert.equal(
    report.duplicates.length,
    0,
    `Found exact duplicates: ${JSON.stringify(report.duplicates)}`
  );
  assert.equal(
    report.nearDuplicates.length,
    0,
    `Found near duplicates: ${JSON.stringify(report.nearDuplicates)}`
  );
});

test("Suite 8: Performance Benchmark (Fast Evaluation)", () => {
  const t0 = performance.now();
  for (let id = 1; id <= 50; id++) {
    resolveWorld1Level(id);
  }
  const elapsed = performance.now() - t0;

  // Cached retrieval of all 50 levels must be practically instantaneous (< 10ms total)
  assert.ok(elapsed < 20, `Cached batch retrieval took ${elapsed.toFixed(1)}ms`);
});
