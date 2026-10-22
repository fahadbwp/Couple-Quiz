import test from "node:test";
import assert from "node:assert/strict";
import {
  seedFromUtcDate,
  getDailyMeta,
  generateDailyLevel,
  calculateNewStreak,
  newDailyStore,
  decodeDailyStore,
  encodeDailyStore,
} from "../lib/jelloo/daily";
import { solvePowerLevel } from "../lib/jelloo/power-solver";

test("Daily Puzzle: Seed derivation is deterministic and distinct per date", () => {
  const seed1 = seedFromUtcDate("2026-10-22");
  const seed2 = seedFromUtcDate("2026-10-22");
  const seed3 = seedFromUtcDate("2026-10-23");

  assert.equal(seed1, seed2, "Same date produces identical seed");
  assert.notEqual(seed1, seed3, "Different dates produce different seeds");
  assert.ok(typeof seed1 === "number" && Number.isSafeInteger(seed1) && seed1 >= 0);
});

test("Daily Puzzle: Weekday tiers match specification", () => {
  // 2026-10-19 is Monday (Easy)
  // 2026-10-20 is Tuesday (Easy)
  // 2026-10-21 is Wednesday (Easy)
  // 2026-10-22 is Thursday (Medium)
  // 2026-10-23 is Friday (Medium)
  // 2026-10-24 is Saturday (Advanced)
  // 2026-10-25 is Sunday (Advanced)
  const metaMon = getDailyMeta("2026-10-19");
  assert.equal(metaMon.dayOfWeek, 1);
  assert.equal(metaMon.tier, "easy");
  assert.equal(metaMon.character, "bunny");

  const metaTue = getDailyMeta("2026-10-20");
  assert.equal(metaTue.dayOfWeek, 2);
  assert.equal(metaTue.tier, "easy");
  assert.equal(metaTue.character, "bunny");

  const metaWed = getDailyMeta("2026-10-21");
  assert.equal(metaWed.dayOfWeek, 3);
  assert.equal(metaWed.tier, "easy");
  assert.equal(metaWed.character, "bunny");

  const metaThu = getDailyMeta("2026-10-22");
  assert.equal(metaThu.dayOfWeek, 4);
  assert.equal(metaThu.tier, "medium");
  assert.equal(metaThu.character, "panda");

  const metaFri = getDailyMeta("2026-10-23");
  assert.equal(metaFri.dayOfWeek, 5);
  assert.equal(metaFri.tier, "medium");
  assert.equal(metaFri.character, "cat");

  const metaSat = getDailyMeta("2026-10-24");
  assert.equal(metaSat.dayOfWeek, 6);
  assert.equal(metaSat.tier, "advanced");
  assert.equal(metaSat.character, "octopus");

  const metaSun = getDailyMeta("2026-10-25");
  assert.equal(metaSun.dayOfWeek, 0);
  assert.equal(metaSun.tier, "advanced");
  assert.equal(metaSun.character, "fox");
});

test("Daily Puzzle: 100 consecutive UTC dates are deterministic and 100% solvable", () => {
  // Generate 100 dates starting from 2026-01-01
  const startDate = new Date("2026-01-01T00:00:00Z");
  for (let i = 0; i < 100; i++) {
    const cur = new Date(startDate.getTime() + i * 86400 * 1000);
    const dateStr = cur.toISOString().slice(0, 10);

    // Call twice to verify pure determinism
    const level1 = generateDailyLevel(dateStr);
    const level2 = generateDailyLevel(dateStr);

    assert.equal(level1.size, level2.size, `Level size match for ${dateStr}`);
    assert.deepEqual(level1.tiles, level2.tiles, `Tiles match for ${dateStr}`);
    assert.equal(level1.character, level2.character, `Character match for ${dateStr}`);
    assert.equal(level1.world, level2.world, `World match for ${dateStr}`);
    assert.deepEqual(level1.collectibles, level2.collectibles, `Collectibles match for ${dateStr}`);
    assert.equal(level1.moveLimit, level2.moveLimit, `MoveLimit match for ${dateStr}`);

    // Solvability audit
    const proof = solvePowerLevel(level1);
    assert.equal(proof.solvable, true, `Date ${dateStr} must be solvable`);
    assert.ok((proof.par ?? 0) > 0, `Date ${dateStr} must have positive par`);
  }
});

test("Daily Streaks: Consecutive wins increment, missed days reset, replays are protected", () => {
  // 1. First win
  const win1 = calculateNewStreak(0, undefined, "2026-10-20");
  assert.equal(win1.currentStreak, 1);
  assert.equal(win1.isNewWin, true);

  // 2. Replay same day (replay protection)
  const replaySameDay = calculateNewStreak(win1.currentStreak, "2026-10-20", "2026-10-20");
  assert.equal(replaySameDay.currentStreak, 1, "Replay cannot increment streak");
  assert.equal(replaySameDay.isNewWin, false, "Replay must not be flagged as new win");

  // 3. Consecutive day win
  const win2 = calculateNewStreak(win1.currentStreak, "2026-10-20", "2026-10-21");
  assert.equal(win2.currentStreak, 2);
  assert.equal(win2.isNewWin, true);

  // 4. Consecutive day win (3 days in a row)
  const win3 = calculateNewStreak(win2.currentStreak, "2026-10-21", "2026-10-22");
  assert.equal(win3.currentStreak, 3);
  assert.equal(win3.isNewWin, true);

  // 5. Missed a day (jumped from 2026-10-22 to 2026-10-24, missed 2026-10-23)
  const winAfterMiss = calculateNewStreak(win3.currentStreak, "2026-10-22", "2026-10-24");
  assert.equal(winAfterMiss.currentStreak, 1, "Missed day must reset current streak to 1");
  assert.equal(winAfterMiss.isNewWin, true);
});

test("Daily Storage: Roundtrip encoding, decoding and corruption recovery", () => {
  const store = newDailyStore("2026-10-22");
  store.currentStreak = 4;
  store.maxStreak = 7;
  store.lastCompletedDate = "2026-10-22";
  store.activeMoves = 5;
  store.activeRotations = [1, 2, 0, 3];
  store.history["2026-10-22"] = {
    date: "2026-10-22",
    won: true,
    moves: 12,
    stars: 3,
    rotations: [1, 2, 0, 3],
    completedAt: "2026-10-22T10:00:00Z",
  };

  const raw = encodeDailyStore(store);
  const restored = decodeDailyStore(raw, "2026-10-22");

  assert.equal(restored.currentStreak, 4);
  assert.equal(restored.maxStreak, 7);
  assert.equal(restored.lastCompletedDate, "2026-10-22");
  assert.equal(restored.activeMoves, 5);
  assert.deepEqual(restored.activeRotations, [1, 2, 0, 3]);
  assert.equal(restored.history["2026-10-22"]?.won, true);

  // Future-dated manipulation protection
  const futureRaw = JSON.stringify({
    version: 1,
    currentStreak: 10,
    maxStreak: 10,
    lastCompletedDate: "2099-01-01", // Future date
    history: {},
  });
  const sanitizedFuture = decodeDailyStore(futureRaw, "2026-10-22");
  assert.equal(sanitizedFuture.lastCompletedDate, undefined, "Future date must be rejected");

  // Corrupted data recovery
  const corrupted = decodeDailyStore("not a json at all {{", "2026-10-22");
  assert.equal(corrupted.version, 1);
  assert.equal(corrupted.currentStreak, 0);
  assert.equal(corrupted.maxStreak, 0);

  // Oversized data recovery
  const oversized = decodeDailyStore("x".repeat(40000), "2026-10-22");
  assert.equal(oversized.currentStreak, 0);
});
