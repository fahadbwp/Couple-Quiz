import test from "node:test";
import assert from "node:assert/strict";
import { levelAt } from "../lib/jelloo/endless";
import { generateTwoJellyPuzzle, generateThreeJellyPuzzle, solveMultiJelly } from "../lib/jelloo/multi-jelly";
import { solvePowerLevel } from "../lib/jelloo/power-solver";
import { decodeJourney, encodeJourney, newJourney } from "../lib/jelloo/progress";

test("Task 1 & 2: Level 71 and Level 91 seed-42 difficulty target improvements", () => {
  // Revision 1 (Legacy baseline): par 2
  const l71_rev1 = generateTwoJellyPuzzle(71, 42, 1);
  assert.equal(l71_rev1.proof.par, 2, "Rev 1 Level 71 was par 2");

  const l91_rev1 = generateThreeJellyPuzzle(91, 42, 1);
  assert.equal(l91_rev1.proof.par, 2, "Rev 1 Level 91 was par 2");

  // Revision 2 (Phase 8.2 improved):
  // Level 71 target: 3–5 meaningful rotations
  const l71_rev2 = generateTwoJellyPuzzle(71, 42, 2);
  assert.ok(l71_rev2.proof.solvable, "Rev 2 Level 71 must be solvable");
  assert.ok(l71_rev2.proof.par >= 3 && l71_rev2.proof.par <= 5, `Level 71 par was ${l71_rev2.proof.par}, expected 3..5`);
  assert.equal(l71_rev2.proof.par, 4);

  // Level 91 target: 5–8 meaningful rotations
  const l91_rev2 = generateThreeJellyPuzzle(91, 42, 2);
  assert.ok(l91_rev2.proof.solvable, "Rev 2 Level 91 must be solvable");
  assert.ok(l91_rev2.proof.par >= 5 && l91_rev2.proof.par <= 8, `Level 91 par was ${l91_rev2.proof.par}, expected 5..8`);
  assert.equal(l91_rev2.proof.par, 6);
});

test("Task 3: MultiRevision backward compatibility and save preservation", () => {
  // 1. Existing save with multiRevision 1 (or omitted) decodes under revision 1 rules
  const rev1Save = JSON.stringify({
    version: 1,
    generator: 1,
    multiRevision: 1,
    rules: 4,
    seed: 42,
    completed: 70,
    id: 71,
    moves: 0,
    motion: true,
    won: false,
    rotations: Array(16).fill(0),
    jellies: [
      { character: "bunny", start: 0, home: 15 },
      { character: "panda", start: 3, home: 2 },
    ],
  });

  const decodedRev1 = decodeJourney(rev1Save);
  assert.ok(decodedRev1, "Rev 1 save must decode successfully");
  assert.equal(decodedRev1.multiRevision, 1);
  assert.equal(decodedRev1.game.level.id, 71);

  // 2. New journey uses multiRevision 3
  const newJ = newJourney(42);
  assert.equal(newJ.multiRevision, 3);

  // 3. New save encodes multiRevision 3 and roundtrips
  const encoded = encodeJourney(newJ);
  const decodedNew = decodeJourney(encoded);
  assert.ok(decodedNew);
  assert.equal(decodedNew.multiRevision, 3);
});

test("Task 4: Endless Mode quality & 100 consecutive level solvability audit", () => {
  let powerCount = 0;
  let multi2Count = 0;
  let multi3Count = 0;

  for (let id = 101; id <= 200; id++) {
    const level = levelAt(id, 42);
    assert.equal(level.id, id);
    assert.ok(level.world !== undefined);

    if (level.jellies && level.jellies.length === 3) {
      multi3Count++;
      const s = solveMultiJelly(level);
      assert.ok(s.solvable, `Endless level ${id} (3-jelly) must be solvable`);
    } else if (level.jellies && level.jellies.length === 2) {
      multi2Count++;
      const s = solveMultiJelly(level);
      assert.ok(s.solvable, `Endless level ${id} (2-jelly) must be solvable`);
    } else {
      powerCount++;
      const s = solvePowerLevel(level);
      assert.ok(s.solvable, `Endless level ${id} (${level.character ?? "standard"}) must be solvable`);
      assert.ok(Number.isFinite(s.par) && s.par >= 0);
    }
  }

  // Verify healthy mixture across 100 endless levels
  assert.ok(powerCount > 50, "Should feature regular single-pal levels");
  assert.ok(multi2Count === 10, "Should feature Two-Jelly levels on *7 levels");
  assert.ok(multi3Count === 10, "Should feature Three-Jelly levels on *9 levels");
});

test("Task 5: Move cost fairness & single-rotation accounting", () => {
  // Test Level 71 rotation accounting
  const l71 = levelAt(71, 42, 4, 2);
  const rotatables = l71.tiles.filter(t => !t.locked && ["straight", "corner"].includes(t.kind));
  assert.ok(rotatables.length >= 4, "Must have at least 4 rotatable tiles on Level 71");
});
