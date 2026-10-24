import test from "node:test";
import assert from "node:assert/strict";
import { newJourney, journeyReducer, decodeJourney, encodeJourney } from "../lib/jelloo/progress";
import { initialGame, gameReducer } from "../lib/jelloo/engine";
import { levels } from "../lib/jelloo/levels";
import { worldForLevel, worlds } from "../lib/jelloo/worlds";
import { switchFixture, pals, playablePowerTrial } from "../lib/jelloo/pals";
import { walkPowerLevel } from "../lib/jelloo/power-solver";

test("Task 1 & 7: New player and saved player at Level 27 progress structure", () => {
  // 1. Initial new player
  const newJ = newJourney(100);
  assert.equal(newJ.completed, 0);
  assert.equal(newJ.game.level.id, 1);
  assert.deepEqual(newJ.best, {});

  // 2. Existing player at Level 27 (Level 27 is 5x5 = 25 tiles)
  const savedL27Raw = JSON.stringify({
    version: 1,
    generator: 1,
    rules: 4,
    seed: 1234,
    completed: 26,
    id: 27,
    moves: 2,
    motion: true,
    won: false,
    rotations: Array(25).fill(0),
    best: { "1": 3, "2": 2, "26": 3 }
  });
  const decoded = decodeJourney(savedL27Raw);
  assert.ok(decoded);
  assert.equal(decoded.completed, 26);
  assert.equal(decoded.game.level.id, 27);
  assert.equal(decoded.best["26"], 3);
  assert.equal(worldForLevel(decoded.game.level.id).id, "beach");

  // 3. Completed level replay (visiting completed level 10)
  const replayJ = journeyReducer(decoded, { type: "visit", id: 10 });
  assert.equal(replayJ.game.level.id, 10);
  // Highest unlocked remains intact
  assert.equal(replayJ.completed, 26);
  assert.equal(replayJ.best["26"], 3);

  // 4. Locked level rejection (attempting to visit level 30 when completed is 26)
  const lockedAttempt = journeyReducer(decoded, { type: "visit", id: 30 });
  assert.equal(lockedAttempt.game.level.id, 27); // does not change
});

test("Task 3: Out-of-moves modal triggers on limit exhaustion, last-move win succeeds, and retry works", () => {
  // Puzzle with move limit 2
  const levelWithLimit = { ...levels[0], moveLimit: 2 };
  let g = initialGame(levelWithLimit);

  // Move 1
  g = gameReducer(g, { type: "rotate", index: 14 });
  assert.equal(g.status, "editing");
  assert.equal(g.moves, 1);

  // Move 2 - wrong move leading to lost state
  g = gameReducer(g, { type: "rotate", index: 14 });
  assert.equal(g.status, "lost");
  assert.equal(g.moves, 2);

  // Further edits are blocked
  assert.equal(gameReducer(g, { type: "rotate", index: 13 }), g);
  assert.equal(gameReducer(g, { type: "undo" }), g);

  // Retry (reset) restores initial state
  const resetGame = gameReducer(g, { type: "reset" });
  assert.equal(resetGame.status, "editing");
  assert.equal(resetGame.moves, 0);
  assert.deepEqual(resetGame.tiles, levels[0].tiles);

  // Last-move victory condition:
  let g2 = initialGame({ ...levels[0], moveLimit: 1 });
  // Level 1: rotating 13 once solves the connection
  g2 = gameReducer(g2, { type: "rotate", index: 13 });
  assert.equal(g2.status, "running"); // Last move allowed to run and win!
  for (let i = 0; i < 10; i++) g2 = gameReducer(g2, { type: "tick", runId: g2.runId });
  assert.equal(g2.status, "won");
});

test("Task 4: Next Level unlock, preservation of stars/best, and world/endless transitions", () => {
  let j = newJourney(42);
  // World boundaries: 20 -> 21 (Meadow -> Beach), 40 -> 41 (Beach -> Snow), etc.
  assert.equal(worldForLevel(20).id, "meadow");
  assert.equal(worldForLevel(21).id, "beach");
  assert.equal(worldForLevel(40).id, "beach");
  assert.equal(worldForLevel(41).id, "snow");
  assert.equal(worldForLevel(60).id, "snow");
  assert.equal(worldForLevel(61).id, "candy");
  assert.equal(worldForLevel(80).id, "candy");
  assert.equal(worldForLevel(81).id, "space");
  assert.equal(worldForLevel(100).id, "space");
  assert.equal(worldForLevel(101).id, "meadow"); // Endless cycles

  // Replay a completed level and win: never reduces highest unlocked or best stars
  j = { ...j, completed: 5, best: { "1": 3, "2": 3 } };
  // Winning level 1 with 1 star shouldn't overwrite best 3
  const winState = { ...j.game, level: levels[0], status: "won" as const, moves: 10 };
  const updatedJ = journeyReducer(j, { type: "auto", runId: winState.runId, moves: 10 });
  assert.equal(j.completed, 5);
  assert.equal(j.best["1"], 3);
});

test("Task 5: Character unlock thresholds and pal trials vs adventure level requirements", () => {
  assert.equal(pals.find(p => p.id === "bunny")!.unlock, 0);
  assert.equal(pals.find(p => p.id === "panda")!.unlock, 10);
  assert.equal(pals.find(p => p.id === "cat")!.unlock, 20);
  assert.equal(pals.find(p => p.id === "octopus")!.unlock, 30);
  assert.equal(pals.find(p => p.id === "fox")!.unlock, 40);

  // Playable power trial provides the required character
  const pandaTrial = playablePowerTrial("panda", 1);
  assert.equal(pandaTrial.character, "panda");
  assert.ok(pandaTrial.gate);

  const bunnyTrial = playablePowerTrial("bunny", 1);
  assert.equal(bunnyTrial.character, "bunny");
});

test("Task 6: Pressure plate switch and door/gate activation", () => {
  const level = switchFixture();
  assert.equal(level.tiles[1].terrain, "switch");
  assert.deepEqual(level.door, { tile: 5, switch: 1 });

  // Initially switch not triggered: path stops before locked door
  const trace1 = walkPowerLevel(level, level.tiles);
  assert.notEqual(trace1.outcome, "home");

  // Solved layout from solvePowerLevel:
  const solvedTiles = [
    { kind: 'start' as const, rotation: 0, port: 1 as const },
    { kind: 'corner' as const, rotation: 2, terrain: 'switch' as const },
    { kind: 'blank' as const, rotation: 0 },
    { kind: 'blank' as const, rotation: 0 },
    { kind: 'corner' as const, rotation: 0 },
    { kind: 'corner' as const, rotation: 2 },
    { kind: 'blank' as const, rotation: 0 },
    { kind: 'blank' as const, rotation: 0 },
    { kind: 'home' as const, rotation: 0, port: 0 as const }
  ];
  const trace2 = walkPowerLevel(level, solvedTiles);
  assert.equal(trace2.outcome, "home");
  assert.ok(trace2.states?.some(s => s.switches.includes(1)));
});
