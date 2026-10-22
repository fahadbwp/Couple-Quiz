import test from "node:test";
import assert from "node:assert/strict";
import { type Level, type Tile, gameReducer, initialGame } from "../lib/jelloo/engine";
import { solvePowerLevel, walkPowerLevel } from "../lib/jelloo/power-solver";
import { powerStepDuration, slipperyFixture, switchFixture } from "../lib/jelloo/pals";
import { generateMechanicPuzzle } from "../lib/jelloo/power-generator";

test("Switch Tile: stepping on switch activates it and opens linked door", () => {
  // 3x3 board:
  // 0(start) -> 1(switch) -> 2(corner W-S)
  //                          |
  //                          5(straight N-S)
  //                          |
  // 6(home) <- 7(door W-E) <- 8(corner N-W)
  const tiles: Tile[] = [
    { kind: "start", rotation: 0, port: 1 },              // 0: exits East
    { kind: "straight", rotation: 0, terrain: "switch" }, // 1: connects W-E (ports 1, 3)
    { kind: "corner", rotation: 2 },                      // 2: connects W-S (ports 2, 3)
    { kind: "blank", rotation: 0 },                       // 3
    { kind: "blank", rotation: 0 },                       // 4
    { kind: "straight", rotation: 1 },                    // 5: connects N-S (ports 0, 2)
    { kind: "home", rotation: 0, port: 1 },               // 6: enters from East (port 1)
    { kind: "straight", rotation: 0 },                    // 7: connects E-W (door tile)
    { kind: "corner", rotation: 3 },                      // 8: connects N-W (ports 0, 3)
  ];
  const level: Level = {
    id: 901,
    title: "Switch Test",
    hint: "Step on the switch to unlock the door",
    size: 3,
    start: 0,
    home: 6,
    tiles,
    door: { tile: 7, switch: 1 },
    powerVersion: 4,
  };

  // Trace with switch on the path:
  const trace = walkPowerLevel(level, tiles);
  assert.equal(trace.outcome, "home");
  assert.deepEqual(trace.path, [0, 1, 2, 5, 8, 7, 6]);

  // Check state progression:
  // At step 0 (index 0): switches is empty
  assert.equal(trace.states![0].switches.length, 0);
  // After stepping through switch tile 1, subsequent steps include 1 in switches:
  assert.ok(trace.states![2].switches.includes(1));
  // At step 5 (index 7, door tile): switches still includes 1, so door is passed
  assert.ok(trace.states![5].switches.includes(1));
});

test("Switch Tile: linked door is impassable if switch is bypassed or not yet reached", () => {
  // Layout where a direct route to door exists without stepping on switch:
  // 0(start) -> 3(door) -> 6(home)
  const tiles: Tile[] = [
    { kind: "start", rotation: 0, port: 2 },              // 0: exits South directly toward door 3
    { kind: "straight", rotation: 0, terrain: "switch" }, // 1: switch sitting unused
    { kind: "blank", rotation: 0 },                       // 2
    { kind: "straight", rotation: 1 },                    // 3: door tile (N-S)
    { kind: "blank", rotation: 0 },                       // 4
    { kind: "blank", rotation: 0 },                       // 5
    { kind: "home", rotation: 0, port: 0 },               // 6: enters from North
    { kind: "blank", rotation: 0 },                       // 7
    { kind: "blank", rotation: 0 },                       // 8
  ];
  const level: Level = {
    id: 902,
    title: "Locked Door Test",
    hint: "Cannot pass through closed door",
    size: 3,
    start: 0,
    home: 6,
    tiles,
    door: { tile: 3, switch: 1 },
    powerVersion: 4,
  };

  // Direct trace tries to pass through door 3 without switch 1:
  const trace = walkPowerLevel(level, tiles);
  assert.notEqual(trace.outcome, "home");
  // The path reaches closed door 3 and stops there:
  assert.deepEqual(trace.path, [0, 3]);
  assert.equal(trace.outcome, "disconnected");
});

test("Switch Tile: level.gate also supports switch triggers", () => {
  const tiles: Tile[] = [
    { kind: "start", rotation: 0, port: 1 },
    { kind: "straight", rotation: 0, terrain: "switch" }, // 1: switch
    { kind: "corner", rotation: 2 },                      // 2: W-S
    { kind: "blank", rotation: 0 },
    { kind: "blank", rotation: 0 },
    { kind: "straight", rotation: 1 },                    // 5: N-S
    { kind: "home", rotation: 0, port: 1 },               // 6: from E
    { kind: "straight", rotation: 0 },                    // 7: gate W-E
    { kind: "corner", rotation: 3 },                      // 8: N-W
  ];
  const level: Level = {
    id: 903,
    title: "Switch Gate Test",
    hint: "Switch triggers gate",
    size: 3,
    start: 0,
    home: 6,
    tiles,
    gate: { tile: 7, trigger: 1 }, // trigger 1 is a switch!
    powerVersion: 4,
  };

  const proof = solvePowerLevel(level);
  assert.equal(proof.solvable, true);
  const trace = walkPowerLevel(level, proof.solution!);
  assert.equal(trace.outcome, "home");
});

test("Switch Tile: undo and reset cleanly revert switch activation", () => {
  const level = switchFixture();
  let game = initialGame(level);

  // Rotate tile 1:
  game = gameReducer(game, { type: "rotate", index: 1 });
  assert.equal(game.moves, 1);
  assert.equal(game.history.length, 1);

  // Undo restores initial tiles:
  game = gameReducer(game, { type: "undo" });
  assert.equal(game.moves, 1);
  assert.equal(game.history.length, 0);

  // Reset resets game completely:
  game = gameReducer(game, { type: "reset" });
  assert.equal(game.moves, 0);
  assert.equal(game.status, "editing");
});

test("Slippery Tile: character is forced straight and cannot turn while sliding", () => {
  // 3x3 board:
  // 0(start, East) -> 1(straight slippery, W-E) -> 2(corner, W-S)
  //                                                 |
  //                                                 5(home, enters N)
  const tiles: Tile[] = [
    { kind: "start", rotation: 0, port: 1 },                // 0: exits East
    { kind: "straight", rotation: 0, terrain: "slippery" }, // 1: slippery straight W-E
    { kind: "corner", rotation: 2 },                        // 2: corner W-S (ports 2, 3)
    { kind: "blank", rotation: 0 },
    { kind: "blank", rotation: 0 },
    { kind: "home", rotation: 0, port: 0 },                 // 5: home from North
    { kind: "blank", rotation: 0 },
    { kind: "blank", rotation: 0 },
    { kind: "blank", rotation: 0 },
  ];
  const level: Level = {
    id: 904,
    title: "Slippery Straight Test",
    hint: "Sliding straight",
    size: 3,
    start: 0,
    home: 5,
    tiles,
    powerVersion: 4,
  };

  // Character enters 1 going East. Slippery forces straight exit East into 2:
  const trace = walkPowerLevel(level, tiles);
  assert.equal(trace.outcome, "home");
  assert.deepEqual(trace.path, [0, 1, 2, 5]);

  // Now test: if tile 1 is replaced by a corner attempting to turn South:
  // rotation 2 connects West (3) and South (2).
  const turningTiles: Tile[] = [
    tiles[0],
    { kind: "corner", rotation: 2, terrain: "slippery" }, // attempting to turn South on ice
    ...tiles.slice(2),
  ];
  // Entering 1 from West (port 3): straight exit would be East (1).
  // A corner tile DOES NOT have straight exit (1).
  // Slippery rule disallows turning on ice:
  const turnTrace = walkPowerLevel(level, turningTiles);
  assert.notEqual(turnTrace.outcome, "home");
  assert.equal(turnTrace.outcome, "disconnected");
});

test("Slippery Tile: handles blocked exits and boundary collisions safely", () => {
  // Sliding into a board boundary (edge):
  // 0(start, East) -> 1(slippery, W-E) -> 2(slippery, W-E) -> [edge of grid!]
  const tiles: Tile[] = [
    { kind: "start", rotation: 0, port: 1 },
    { kind: "straight", rotation: 0, terrain: "slippery" },
    { kind: "straight", rotation: 0, terrain: "slippery" },
    { kind: "blank", rotation: 0 },
    { kind: "blank", rotation: 0 },
    { kind: "blank", rotation: 0 },
    { kind: "home", rotation: 0, port: 0 },
    { kind: "blank", rotation: 0 },
    { kind: "blank", rotation: 0 },
  ];
  const level: Level = {
    id: 905,
    title: "Slippery Boundary Test",
    hint: "Slide off edge",
    size: 3,
    start: 0,
    home: 6,
    tiles,
    powerVersion: 4,
  };

  const trace = walkPowerLevel(level, tiles);
  // Slipping off cell 2 East hits the edge of grid:
  assert.notEqual(trace.outcome, "home");
  assert.equal(trace.outcome, "edge");
  assert.deepEqual(trace.path, [0, 1, 2]);
});

test("Slippery Tile: multi-tile consecutive slide across ice", () => {
  // 4x4 board:
  // 0 -> 1(ice) -> 2(ice) -> 3(corner W-S)
  //                          |
  //                          7(home)
  const tiles: Tile[] = Array.from({ length: 16 }, () => ({ kind: "blank" as const, rotation: 0 }));
  tiles[0] = { kind: "start", rotation: 0, port: 1 };
  tiles[1] = { kind: "straight", rotation: 0, terrain: "slippery" };
  tiles[2] = { kind: "straight", rotation: 0, terrain: "slippery" };
  tiles[3] = { kind: "corner", rotation: 2 }; // W-S (ports 2, 3)
  tiles[7] = { kind: "home", rotation: 0, port: 0 }; // enters N

  const level: Level = {
    id: 906,
    title: "Multi-Ice Slide",
    hint: "Slide across two ice tiles",
    size: 4,
    start: 0,
    home: 7,
    tiles,
    powerVersion: 4,
  };

  const trace = walkPowerLevel(level, tiles);
  assert.equal(trace.outcome, "home");
  assert.deepEqual(trace.path, [0, 1, 2, 3, 7]);
});

test("Slippery Tile: step duration is 210ms for swift sliding on ice", () => {
  const game = initialGame(slipperyFixture());
  // Test powerStepDuration:
  const duration = powerStepDuration({
    ...game,
    cursor: 2,
    trace: { path: [0, 1, 4, 7, 8], outcome: "home" },
  }, true);
  // Tile 4 has terrain: "slippery", so duration should be 210ms
  assert.equal(duration, 210);
});

test("Fixtures: switchFixture and slipperyFixture are valid and solvable", () => {
  const sf = switchFixture();
  const sfProof = solvePowerLevel(sf);
  assert.equal(sfProof.solvable, true);
  assert.ok(sfProof.par >= 0);
  const sfTrace = walkPowerLevel(sf, sfProof.solution!);
  assert.equal(sfTrace.outcome, "home");
  assert.ok(sf.collectibles!.every(c => sfTrace.path.includes(c)));

  const slipF = slipperyFixture();
  const slipProof = solvePowerLevel(slipF);
  assert.equal(slipProof.solvable, true);
  assert.ok(slipProof.par >= 0);
  const slipTrace = walkPowerLevel(slipF, slipProof.solution!);
  assert.equal(slipTrace.outcome, "home");
  assert.ok(slipF.collectibles!.every(c => slipTrace.path.includes(c)));
});

test("Generator: generateMechanicPuzzle generates solvable puzzles for both mechanics", () => {
  for (const seed of [1, 42, 99]) {
    const sw = generateMechanicPuzzle(91, seed, "switch");
    assert.equal(sw.proof.solvable, true);
    assert.ok(sw.proof.par >= 0);
    const swTrace = walkPowerLevel(sw.level, sw.proof.solution!);
    assert.equal(swTrace.outcome, "home");
    assert.ok(sw.level.collectibles!.every(c => swTrace.path.includes(c)));

    const sl = generateMechanicPuzzle(92, seed, "slippery");
    assert.equal(sl.proof.solvable, true);
    assert.ok(sl.proof.par >= 0);
    const slTrace = walkPowerLevel(sl.level, sl.proof.solution!);
    assert.equal(slTrace.outcome, "home");
    assert.ok(sl.level.collectibles!.every(c => slTrace.path.includes(c)));
  }
});
