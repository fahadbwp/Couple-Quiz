import test from "node:test";
import assert from "node:assert/strict";
import {
  simulateMultiJelly,
  generateTwoJellyPuzzle,
  generateThreeJellyPuzzle,
  twoJellyIntroFixture,
  twoJellyCollisionFixture,
  twoJellySwapFixture,
  twoJellySharedPathFixture,
  threeJellyIntroFixture,
  isMultiJellyLevel,
  multiJellyCountFor,
} from "../lib/jelloo/multi-jelly";
import { milestoneRewardFor } from "../lib/jelloo/worlds";
import { gameReducer, initialGame, tracePath, type Level } from "../lib/jelloo/engine";
import { encodeJourney, decodeJourney, newJourney, journeyReducer } from "../lib/jelloo/progress";
import { collectedStars, scoreRun } from "../lib/jelloo/scoring";

test("Multi-Jelly: Collisions, Swaps, Shared Paths and Mechanics", () => {
  // 1. Same-Cell Collision
  const collLevel = twoJellyCollisionFixture();
  const collSim = simulateMultiJelly(collLevel, collLevel.tiles);
  assert.equal(collSim.multiOutcome, "collision");
  assert.equal(collSim.collisionType, "same_cell");
  assert.equal(collSim.collisionCell, 5);

  // 2. Head-on Swap Collision
  const swapLevel = twoJellySwapFixture();
  const swapSim = simulateMultiJelly(swapLevel, swapLevel.tiles);
  assert.equal(swapSim.multiOutcome, "swap");
  assert.equal(swapSim.collisionType, "swap");

  // 3. Shared Path with Time Offset (both pass safely through cell 5 at different ticks)
  const sharedLevel = twoJellySharedPathFixture();
  const sharedSim = simulateMultiJelly(sharedLevel, sharedLevel.tiles);
  assert.equal(sharedSim.multiOutcome, "home");
  assert.equal(sharedSim.jellies.length, 2);
  assert(sharedSim.jellies.every(j => j.reachedHome));

  // 4. Switch and Door Dependencies
  // Jelly 1 steps on switch, opening door for Jelly 2
  const swLevel: Level = {
    id: 795,
    title: "Switch Door Coordination",
    hint: "Switch unlocks door for pal",
    size: 4,
    start: 0,
    home: 3,
    door: { tile: 14, switch: 5 },
    jellies: [
      { character: "bunny", start: 0, home: 12 },
      { character: "panda", start: 2, home: 15 },
    ],
    tiles: [
      { kind: "start", rotation: 0, port: 2 }, // 0: south to 4
      { kind: "blank", rotation: 0 },
      { kind: "start", rotation: 0, port: 2 }, // 2: south to 6
      { kind: "home", rotation: 0, port: 0 },  // 3
      { kind: "straight", rotation: 1 },       // 4: north-south to 8
      { kind: "corner", rotation: 1, terrain: "switch" }, // 5: switch at 5 (not on path yet)
      { kind: "straight", rotation: 1 },       // 6: north-south to 10
      { kind: "blank", rotation: 0 },
      { kind: "corner", rotation: 0 },        // 8: north & east to 9
      { kind: "corner", rotation: 3 },        // 9: west & south to 13
      { kind: "straight", rotation: 1 },       // 10: north-south to 14
      { kind: "blank", rotation: 0 },
      { kind: "home", rotation: 0, port: 1 },  // 12: Bunny home
      { kind: "corner", rotation: 3 },        // 13: west & north (enter north from 9, exit west to 12)
      { kind: "corner", rotation: 0 },        // 14: door tile — north & east (enters from 10 south, exits east to 15)
      { kind: "home", rotation: 0, port: 3 },  // 15: Panda home (enters from west)
    ],
  };

  // Door is locked because switch 5 was never reached
  const blockedSim = simulateMultiJelly(swLevel, swLevel.tiles);
  assert.notEqual(blockedSim.multiOutcome, "home");

  // Now route Jelly 1 through switch at 4 -> 5 -> 9
  swLevel.tiles[4] = { kind: "corner", rotation: 0 }; // 4: north & east to 5
  swLevel.tiles[5] = { kind: "corner", rotation: 2, terrain: "switch" }; // 5: west & south to 9
  swLevel.tiles[9] = { kind: "straight", rotation: 1 }; // 9: north-south straight to 13
  const openSim = simulateMultiJelly(swLevel, swLevel.tiles);
  assert.equal(openSim.multiOutcome, "home");
  assert(openSim.jellies.every(j => j.reachedHome));

  // 5. Panda Cracked Departure Destruction
  // When Panda departs cracked cell, it breaks. A following jelly cannot use it!
  const crackedLevel: Level = {
    id: 796,
    title: "Panda Cracked Path",
    hint: "Panda crumbles cracked tile",
    size: 4,
    start: 0,
    home: 15,
    jellies: [
      { character: "panda", start: 0, home: 12 },
      { character: "cat", start: 1, home: 13 },
    ],
    tiles: [
      { kind: "start", rotation: 0, port: 2 }, // 0: south to 4
      { kind: "start", rotation: 0, port: 2 }, // 1: south to 5
      { kind: "blank", rotation: 0 },
      { kind: "blank", rotation: 0 },
      { kind: "straight", rotation: 1, terrain: "cracked" }, // 4: cracked path
      { kind: "straight", rotation: 1 }, // 5: normal
      { kind: "blank", rotation: 0 },
      { kind: "blank", rotation: 0 },
      { kind: "straight", rotation: 1 }, // 8
      { kind: "straight", rotation: 1 }, // 9
      { kind: "blank", rotation: 0 },
      { kind: "blank", rotation: 0 },
      { kind: "home", rotation: 0, port: 0 }, // 12
      { kind: "home", rotation: 0, port: 0 }, // 13
      { kind: "blank", rotation: 0 },
      { kind: "blank", rotation: 0 },
    ],
  };

  const pandaSim = simulateMultiJelly(crackedLevel, crackedLevel.tiles);
  assert.equal(pandaSim.multiOutcome, "home");
  // Cracked cell 4 is in broken set after Panda departs
  assert(pandaSim.states.at(-1)?.broken.includes(4));
});

test("Multi-Jelly: Solvability Audit — 200 Two-Jelly Puzzles (100% Solvable & Deterministic)", () => {
  for (let seed = 1; seed <= 200; seed++) {
    const id = 71 + (seed % 10); // Levels 71 through 80
    const { level, proof } = generateTwoJellyPuzzle(id, seed * 19);

    assert(proof.solvable, `Seed ${seed} (Level ${id}) must be solvable`);
    assert(Number.isFinite(proof.par), `Seed ${seed} par must be finite`);
    assert.equal(level.jellies?.length, 2, "Must contain exactly 2 Jellies");
    assert.notEqual(level.jellies[0].start, level.jellies[1].start, "Starts must be distinct");
    assert.notEqual(level.jellies[0].home, level.jellies[1].home, "Homes must be distinct");

    // Determinism test: same id & seed must produce identical board
    const rerun = generateTwoJellyPuzzle(id, seed * 19);
    assert.deepEqual(
      level.tiles.map(t => t.rotation),
      rerun.level.tiles.map(t => t.rotation),
      `Determinism failure at seed ${seed}`
    );
  }
});

test("Multi-Jelly: Solvability Audit — 100 Three-Jelly Puzzles (100% Solvable & Deterministic)", () => {
  for (let seed = 1; seed <= 100; seed++) {
    const id = 91 + (seed % 10); // Levels 91 through 100
    const { level, proof } = generateThreeJellyPuzzle(id, seed * 23);

    assert(proof.solvable, `Seed ${seed} (Level ${id}) must be solvable`);
    assert(Number.isFinite(proof.par), `Seed ${seed} par must be finite`);
    assert.equal(level.jellies?.length, 3, "Must contain exactly 3 Jellies");

    const starts = new Set(level.jellies.map(j => j.start));
    const homes = new Set(level.jellies.map(j => j.home));
    assert.equal(starts.size, 3, "All 3 starts must be distinct");
    assert.equal(homes.size, 3, "All 3 homes must be distinct");

    // Determinism check
    const rerun = generateThreeJellyPuzzle(id, seed * 23);
    assert.deepEqual(
      level.tiles.map(t => t.rotation),
      rerun.level.tiles.map(t => t.rotation)
    );
  }
});

test("Multi-Jelly: Unlock Thresholds at Level 70 and Level 90", () => {
  // Milestone rewards check
  assert.equal(
    milestoneRewardFor(70),
    "👯 Two-Jelly Mode Unlocked! Coordinate two pals simultaneously!"
  );
  assert.equal(
    milestoneRewardFor(90),
    "🌟 Three-Jelly Mode Unlocked! Coordinate three pals at once in Space!"
  );

  // Milestone levels check
  assert.equal(isMultiJellyLevel(70), false);
  assert.equal(isMultiJellyLevel(71), true);
  assert.equal(multiJellyCountFor(71), 2);
  assert.equal(isMultiJellyLevel(80), true);
  assert.equal(multiJellyCountFor(80), 2);
  assert.equal(isMultiJellyLevel(81), false); // Space World single pal
  assert.equal(isMultiJellyLevel(90), false);
  assert.equal(isMultiJellyLevel(91), true);
  assert.equal(multiJellyCountFor(91), 3);
  assert.equal(isMultiJellyLevel(100), true);
  assert.equal(multiJellyCountFor(100), 3);

  // Endless continuation (101+)
  assert.equal(multiJellyCountFor(107), 2);
  assert.equal(multiJellyCountFor(109), 3);

  // Introductory levels have gentle intro moveLimits and clear setups
  const introTwo = twoJellyIntroFixture();
  assert.equal(introTwo.id, 71);
  assert.equal(introTwo.jellies?.length, 2);
  assert(introTwo.par !== undefined && introTwo.par <= 3);

  const introThree = threeJellyIntroFixture();
  assert.equal(introThree.id, 91);
  assert.equal(introThree.jellies?.length, 3);
  assert(introThree.par !== undefined && introThree.par <= 4);
});

test("Multi-Jelly: Game State Reducer, Rotations, Undo, Reset and Star Scoring", () => {
  const intro = twoJellyIntroFixture();
  let state = initialGame(intro);
  assert.equal(state.status, "editing");
  assert.equal(state.moves, 0);

  // Find a rotatable tile on intro
  const rotIdx = intro.tiles.findIndex(
    t => !t.locked && ["straight", "corner"].includes(t.kind)
  );
  assert(rotIdx >= 0);

  // Rotate tile
  const origRot = state.tiles[rotIdx].rotation;
  state = gameReducer(state, { type: "rotate", index: rotIdx });
  assert.equal(state.moves, 1);
  assert.equal(state.tiles[rotIdx].rotation, origRot + 1);

  // Undo rotation
  state = gameReducer(state, { type: "undo" });
  assert.equal(state.tiles[rotIdx].rotation, origRot);
  // Undo preserves moves count according to Jelloo rules
  assert.equal(state.moves, 1);

  // Reset
  state = gameReducer(state, { type: "reset" });
  assert.equal(state.moves, 0);

  // Solve the intro puzzle
  const { proof } = generateTwoJellyPuzzle(71, 42);
  assert(proof.solution);
  const solvedState = { ...state, tiles: proof.solution };
  const trace = tracePath(solvedState.level, solvedState.tiles);
  assert.equal(trace.outcome, "home");

  // Collected stars check on multi-jelly path
  const gameWon = {
    ...solvedState,
    status: "won" as const,
    trace,
    cursor: trace.path.length - 1,
  };
  const stars = collectedStars(gameWon);
  assert(stars.length >= 1, "Should collect at least 1 star on won route");
  const score = scoreRun(gameWon);
  assert(score.stars >= 2, "Won run receives stars");
});

test("Multi-Jelly: Save Persistence & Journey Roundtrip", () => {
  const journey = newJourney(42);
  // Jump to Level 71 (Two-Jelly unlock)
  const jumped = journeyReducer(journey, { type: "jump", id: 71 });
  assert.equal(jumped.completed, 70);
  assert.equal(jumped.game.level.id, 71);
  assert.equal(jumped.game.level.jellies?.length, 2);

  // Encode journey
  const raw = encodeJourney(jumped);
  assert(typeof raw === "string");

  // Decode journey
  const restored = decodeJourney(raw);
  assert(restored !== null);
  assert.equal(restored.completed, 70);
  assert.equal(restored.game.level.id, 71);
  assert.equal(restored.game.level.jellies?.length, 2);
  assert.equal(restored.game.level.jellies[0].character, "bunny");
  assert.equal(restored.game.level.jellies[1].character, "panda");

  // Jump to Level 91 (Three-Jelly unlock)
  const jumped91 = journeyReducer(journey, { type: "jump", id: 91 });
  assert.equal(jumped91.completed, 90);
  assert.equal(jumped91.game.level.id, 91);
  assert.equal(jumped91.game.level.jellies?.length, 3);

  const raw91 = encodeJourney(jumped91);
  const restored91 = decodeJourney(raw91);
  assert(restored91 !== null);
  assert.equal(restored91.completed, 90);
  assert.equal(restored91.game.level.id, 91);
  assert.equal(restored91.game.level.jellies?.length, 3);
});
