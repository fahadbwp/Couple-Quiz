import test from "node:test";
import assert from "node:assert/strict";
import { decodeJourney, encodeJourney, newJourney, journeyReducer } from "../lib/jelloo/progress";
import { generateTwoJellyPuzzle } from "../lib/jelloo/multi-jelly";

test("Integration Scenario A: Historical save without multiRevision (implicit rev 0/1)", () => {
  const legacySaved = {
    version: 1,
    generator: 1,
    rules: 4,
    seed: 42,
    completed: 70,
    id: 71,
    moves: 1,
    motion: true,
    won: false,
    rotations: Array(16).fill(0),
    jellies: [
      { character: "bunny", start: 0, home: 15 },
      { character: "panda", start: 3, home: 2 },
    ],
    best: { "70": 3 },
  };

  const decoded = decodeJourney(JSON.stringify(legacySaved));
  assert.ok(decoded, "Legacy save without multiRevision must decode cleanly");
  assert.equal(decoded.multiRevision, 1, "Must default implicit multiRevision to 1");
  assert.equal(decoded.game.level.id, 71);
  assert.equal(decoded.completed, 70);
  assert.equal(decoded.best["70"], 3);

  // Verify reconstruction uses revision 1 board:
  const rev1Board = generateTwoJellyPuzzle(71, 42, 1).level;
  assert.equal(decoded.game.level.par, rev1Board.par);
  assert.equal(decoded.game.level.par, 2);
});

test("Integration Scenario B: Historical save with multiRevision: 0", () => {
  // In multiRevision 0 (before Phase 7 Multi-Jelly was introduced), Level 71 was a 5x5 single-pal puzzle (25 tiles)
  const rev0Saved = {
    version: 1,
    generator: 1,
    multiRevision: 0,
    rules: 4,
    seed: 42,
    completed: 70,
    id: 71,
    moves: 0,
    motion: true,
    won: false,
    rotations: Array(25).fill(0),
  };

  const decoded = decodeJourney(JSON.stringify(rev0Saved));
  assert.ok(decoded, "multiRevision: 0 save must decode cleanly");
  assert.equal(decoded.multiRevision, 0);
  assert.equal(decoded.completed, 70);
  assert.equal(decoded.game.level.tiles.length, 25);
  assert.equal(decoded.game.level.jellies, undefined);
});

test("Integration Scenario C: Existing multiRevision: 1 save (Level 71 and Level 91)", () => {
  // Level 71 rev 1
  const rev1L71 = {
    version: 1,
    generator: 1,
    multiRevision: 1,
    rules: 4,
    seed: 42,
    completed: 70,
    id: 71,
    moves: 1,
    motion: true,
    won: false,
    rotations: Array(16).fill(0),
    jellies: [
      { character: "bunny", start: 0, home: 15 },
      { character: "panda", start: 3, home: 2 },
    ],
    best: { "70": 3 },
  };

  const decoded71 = decodeJourney(JSON.stringify(rev1L71));
  assert.ok(decoded71);
  assert.equal(decoded71.multiRevision, 1);
  assert.equal(decoded71.game.level.par, 2, "Rev 1 puzzle must maintain par 2");

  // Level 91 rev 1
  const rev1L91 = {
    version: 1,
    generator: 1,
    multiRevision: 1,
    rules: 4,
    seed: 42,
    completed: 90,
    id: 91,
    moves: 2,
    motion: true,
    won: false,
    rotations: Array(25).fill(0),
    jellies: [
      { character: "bunny", start: 0, home: 21 },
      { character: "panda", start: 2, home: 22 },
      { character: "cat", start: 4, home: 24 },
    ],
    best: { "90": 3 },
  };

  const decoded91 = decodeJourney(JSON.stringify(rev1L91));
  assert.ok(decoded91);
  assert.equal(decoded91.multiRevision, 1);
  assert.equal(decoded91.game.level.par, 2, "Rev 1 Level 91 puzzle must maintain par 2");
});

test("Integration Scenario D: Newly generated multiRevision: 2 saves and cycle test", () => {
  // New journey at Level 71
  let j = newJourney(42);
  j = { ...j, completed: 70 };
  j = journeyReducer(j, { type: "visit", id: 71 });

  assert.equal(j.multiRevision, 2);
  assert.equal(j.game.level.id, 71);
  assert.equal(j.game.level.par, 4, "Fresh Level 71 must have par 4 in revision 2");

  // Save -> Reload -> Rotate -> Undo -> Restart -> Save -> Reload
  const rotIdx = j.game.tiles.findIndex(t => !t.locked && ["straight", "corner"].includes(t.kind));
  assert(rotIdx >= 0);

  // Rotate tile
  j = journeyReducer(j, { type: "rotate", index: rotIdx });
  assert.equal(j.game.moves, 1);

  // Encode save
  const encoded1 = encodeJourney(j);
  const reloaded1 = decodeJourney(encoded1);
  assert.ok(reloaded1);
  assert.equal(reloaded1.multiRevision, 2);
  assert.equal(reloaded1.game.moves, 1);
  assert.equal(reloaded1.game.tiles[rotIdx].rotation, j.game.tiles[rotIdx].rotation);

  // Undo
  j = journeyReducer(j, { type: "undo" });
  // Restart
  j = journeyReducer(j, { type: "reset" });
  assert.equal(j.game.moves, 0);

  const encoded2 = encodeJourney(j);
  const reloaded2 = decodeJourney(encoded2);
  assert.ok(reloaded2);
  assert.equal(reloaded2.multiRevision, 2);
  assert.equal(reloaded2.game.moves, 0);
  assert.equal(reloaded2.game.level.par, 4);
});

test("Integration Guard: Revision-1 puzzles never silently become Revision-2 mid-attempt", () => {
  const rev1L71 = {
    version: 1,
    generator: 1,
    multiRevision: 1,
    rules: 4,
    seed: 42,
    completed: 70,
    id: 71,
    moves: 1,
    motion: true,
    won: false,
    rotations: Array(16).fill(0),
    jellies: [
      { character: "bunny", start: 0, home: 15 },
      { character: "panda", start: 3, home: 2 },
    ],
  };

  const decoded = decodeJourney(JSON.stringify(rev1L71))!;
  // Player rotates on revision 1 puzzle
  const rotated = journeyReducer(decoded, { type: "rotate", index: 4 });
  const reSaved = encodeJourney(rotated);
  const reDecoded = decodeJourney(reSaved)!;

  assert.equal(reDecoded.multiRevision, 1, "Must remain revision 1 across saves during active attempt");
  assert.equal(reDecoded.game.level.par, 2, "Par must remain 2");
});
