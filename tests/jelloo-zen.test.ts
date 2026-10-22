import test from "node:test";
import assert from "node:assert/strict";
import {
  generateZenLevel,
  newZenStore,
  decodeZenStore,
  encodeZenStore,
  type ZenSize,
  type ZenStore,
} from "../lib/jelloo/zen";
import { solvePowerLevel } from "../lib/jelloo/power-solver";
import { isWorldUnlocked } from "../lib/jelloo/worlds";

test("Zen Mode: Generates all three board sizes (4x4, 5x5, 6x6) with no move limit", () => {
  const sizes: ZenSize[] = [4, 5, 6];
  for (const size of sizes) {
    const level = generateZenLevel(size, 42, "meadow");
    assert.equal(level.size, size, `Must generate size ${size}`);
    assert.equal(level.tiles.length, size * size, `Must have ${size * size} tiles`);
    assert.equal(level.moveLimit, undefined, "Zen mode must have no move limit");
    assert.equal(level.difficulty, "Zen");
  }
});

test("Zen Mode: 50 puzzles per board size (150 total) are deterministic and 100% solvable", () => {
  const sizes: ZenSize[] = [4, 5, 6];
  for (const size of sizes) {
    for (let seed = 1; seed <= 50; seed++) {
      const lvl1 = generateZenLevel(size, seed, "meadow");
      const lvl2 = generateZenLevel(size, seed, "meadow");

      assert.equal(lvl1.size, lvl2.size);
      assert.deepEqual(lvl1.tiles, lvl2.tiles, `Determinism check failed on size ${size}, seed ${seed}`);
      assert.equal(lvl1.moveLimit, undefined);

      const proof = solvePowerLevel(lvl1);
      assert.equal(proof.solvable, true, `Size ${size}, seed ${seed} must be solvable`);
    }
  }
});

test("Zen Mode: Locked worlds cannot be selected or loaded from storage", () => {
  // If player has only completed 10 levels, Beach (20), Snow (40), Candy (60), Space (80) are locked
  assert.equal(isWorldUnlocked("meadow", 10), true);
  assert.equal(isWorldUnlocked("beach", 10), false);
  assert.equal(isWorldUnlocked("snow", 10), false);
  assert.equal(isWorldUnlocked("candy", 10), false);
  assert.equal(isWorldUnlocked("space", 10), false);

  // Attempt to decode storage with locked world "space" when completed is 10
  const forgedRaw = JSON.stringify({
    version: 1,
    size: 5,
    world: "space",
    solvedCount: 12,
    seed: 55,
  });

  const decoded = decodeZenStore(forgedRaw, 10);
  assert.equal(decoded.world, "meadow", "Locked world must safely fall back to meadow");
  assert.equal(decoded.solvedCount, 12);

  // When player has completed 85 levels, Space is unlocked
  const unlockedDecoded = decodeZenStore(forgedRaw, 85);
  assert.equal(unlockedDecoded.world, "space", "Unlocked world must be permitted");
});

test("Zen Mode: Storage roundtrip encoding, decoding and corruption recovery", () => {
  const store: ZenStore = {
    version: 1,
    size: 6,
    world: "beach",
    solvedCount: 15,
    seed: 999,
    activeMoves: 7,
    activeRotations: [1, 2, 3, 0],
  };

  const raw = encodeZenStore(store);
  // completed = 25 means beach is unlocked
  const restored = decodeZenStore(raw, 25);

  assert.equal(restored.size, 6);
  assert.equal(restored.world, "beach");
  assert.equal(restored.solvedCount, 15);
  assert.equal(restored.seed, 999);
  assert.equal(restored.activeMoves, 7);
  assert.deepEqual(restored.activeRotations, [1, 2, 3, 0]);

  // Null data creates default newZenStore
  assert.deepEqual(decodeZenStore(null, 0), newZenStore());

  // Corrupted data fallback
  const corrupted = decodeZenStore("{{bad json", 25);
  assert.equal(corrupted.version, 1);
  assert.equal(corrupted.size, 5);
  assert.equal(corrupted.world, "meadow");
  assert.equal(corrupted.solvedCount, 0);
});
