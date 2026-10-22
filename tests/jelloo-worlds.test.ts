import test from "node:test";
import assert from "node:assert/strict";
import {
  worlds,
  worldForLevel,
  isWorldUnlocked,
  getUnlockedWorlds,
  milestoneRewardFor,
} from "../lib/jelloo/worlds";
import { levelAt } from "../lib/jelloo/endless";
import { solvePowerLevel } from "../lib/jelloo/power-solver";
import {
  decodeJourney,
  encodeJourney,
  journeyReducer,
  newJourney,
} from "../lib/jelloo/progress";
import { pals } from "../lib/jelloo/pals";

test("World Definitions: 5 worlds with correct ranges, names and metadata", () => {
  assert.equal(worlds.length, 5);
  const ids = worlds.map(w => w.id);
  assert.deepEqual(ids, ["meadow", "beach", "snow", "candy", "space"]);

  // Meadow
  assert.equal(worlds[0].startLevel, 1);
  assert.equal(worlds[0].endLevel, 20);
  assert.equal(worlds[0].unlockLevel, 0);

  // Beach
  assert.equal(worlds[1].startLevel, 21);
  assert.equal(worlds[1].endLevel, 40);
  assert.equal(worlds[1].unlockLevel, 20);

  // Snow
  assert.equal(worlds[2].startLevel, 41);
  assert.equal(worlds[2].endLevel, 60);
  assert.equal(worlds[2].unlockLevel, 40);

  // Candy Land
  assert.equal(worlds[3].startLevel, 61);
  assert.equal(worlds[3].endLevel, 80);
  assert.equal(worlds[3].unlockLevel, 60);

  // Space
  assert.equal(worlds[4].startLevel, 81);
  assert.equal(worlds[4].endLevel, 100);
  assert.equal(worlds[4].unlockLevel, 80);
});

test("Level to World Mapping: 1-100 and endless continuation (101+)", () => {
  // Meadow: 1 to 20
  for (const id of [1, 5, 10, 15, 20]) {
    assert.equal(worldForLevel(id).id, "meadow", `Level ${id} must be Meadow`);
  }

  // Beach: 21 to 40
  for (const id of [21, 25, 30, 35, 40]) {
    assert.equal(worldForLevel(id).id, "beach", `Level ${id} must be Beach`);
  }

  // Snow: 41 to 60
  for (const id of [41, 45, 50, 55, 60]) {
    assert.equal(worldForLevel(id).id, "snow", `Level ${id} must be Snow`);
  }

  // Candy: 61 to 80
  for (const id of [61, 65, 70, 75, 80]) {
    assert.equal(worldForLevel(id).id, "candy", `Level ${id} must be Candy`);
  }

  // Space: 81 to 100
  for (const id of [81, 85, 90, 95, 100]) {
    assert.equal(worldForLevel(id).id, "space", `Level ${id} must be Space`);
  }

  // Endless continuation: 101+ cycles every 20 levels
  assert.equal(worldForLevel(101).id, "meadow");
  assert.equal(worldForLevel(121).id, "beach");
  assert.equal(worldForLevel(141).id, "snow");
  assert.equal(worldForLevel(161).id, "candy");
  assert.equal(worldForLevel(181).id, "space");
  assert.equal(worldForLevel(201).id, "meadow");
});

test("World Unlock Thresholds & Helpers", () => {
  // Meadow: always unlocked
  assert.equal(isWorldUnlocked("meadow", 0), true);

  // Beach: unlocks at 20 completed levels
  assert.equal(isWorldUnlocked("beach", 19), false);
  assert.equal(isWorldUnlocked("beach", 20), true);
  assert.equal(isWorldUnlocked("beach", 25), true);

  // Snow: unlocks at 40 completed levels
  assert.equal(isWorldUnlocked("snow", 39), false);
  assert.equal(isWorldUnlocked("snow", 40), true);
  assert.equal(isWorldUnlocked("snow", 50), true);

  // Candy: unlocks at 60 completed levels
  assert.equal(isWorldUnlocked("candy", 59), false);
  assert.equal(isWorldUnlocked("candy", 60), true);

  // Space: unlocks at 80 completed levels
  assert.equal(isWorldUnlocked("space", 79), false);
  assert.equal(isWorldUnlocked("space", 80), true);

  // getUnlockedWorlds count
  assert.equal(getUnlockedWorlds(0).length, 1);
  assert.equal(getUnlockedWorlds(20).length, 2);
  assert.equal(getUnlockedWorlds(40).length, 3);
  assert.equal(getUnlockedWorlds(60).length, 4);
  assert.equal(getUnlockedWorlds(80).length, 5);
  assert.equal(getUnlockedWorlds(100).length, 5);
});

test("Milestone Rewards: defined for 10, 20, 30, 40, 60, 80, 100", () => {
  assert.ok(milestoneRewardFor(10)?.includes("Panda"));
  assert.ok(milestoneRewardFor(20)?.includes("Beach") && milestoneRewardFor(20)?.includes("Cat"));
  assert.ok(milestoneRewardFor(30)?.includes("Octopus"));
  assert.ok(milestoneRewardFor(40)?.includes("Snow") && milestoneRewardFor(40)?.includes("Fox"));
  assert.ok(milestoneRewardFor(60)?.includes("Candy Land"));
  assert.ok(milestoneRewardFor(80)?.includes("Space"));
  assert.ok(milestoneRewardFor(100)?.includes("Crown"));

  // Non-milestones return null
  assert.equal(milestoneRewardFor(1), null);
  assert.equal(milestoneRewardFor(15), null);
  assert.equal(milestoneRewardFor(50), null);
  assert.equal(milestoneRewardFor(99), null);
});

test("Character Unlock Thresholds: 0, 10, 20, 30, 40 strictly preserved", () => {
  assert.equal(pals.find(p => p.id === "bunny")!.unlock, 0);
  assert.equal(pals.find(p => p.id === "panda")!.unlock, 10);
  assert.equal(pals.find(p => p.id === "cat")!.unlock, 20);
  assert.equal(pals.find(p => p.id === "octopus")!.unlock, 30);
  assert.equal(pals.find(p => p.id === "fox")!.unlock, 40);
});

test("Level Generator Integration: levelAt attaches world across all 5 worlds and endless", () => {
  for (const id of [1, 10, 21, 35, 41, 55, 61, 75, 81, 95, 101]) {
    const level = levelAt(id, 42);
    assert.ok(level.world !== undefined, `Level ${id} must have world`);
    assert.equal(level.world, worldForLevel(id).id);
  }
});

test("Endless Generator Solvability across Worlds: representative seeds in each world", () => {
  // Test a level in each world with the solver:
  const testLevels = [11, 23, 43, 63, 83];
  for (const id of testLevels) {
    const level = levelAt(id, 99);
    assert.ok(level.world);
    const proof = solvePowerLevel(level);
    assert.equal(proof.solvable, true, `Level ${id} in world ${level.world} must be solvable`);
    assert.ok(proof.par >= 0);
  }
});

test("Save Compatibility: rules 1 through 5 decode cleanly and preserve world state", () => {
  // Standard journey
  const journey = newJourney(123);
  const encoded = encodeJourney(journey);
  const decoded = decodeJourney(encoded);
  assert.ok(decoded);
  assert.equal(decoded.game.level.world, "meadow");

  // Replay into Beach world at level 25 with 25 completed levels
  let beachJourney = { ...journey, completed: 25 };
  beachJourney = journeyReducer(beachJourney, { type: "visit", id: 25 });
  assert.equal(beachJourney.game.level.world, "beach");
  const beachEncoded = encodeJourney(beachJourney);
  const beachDecoded = decodeJourney(beachEncoded);
  assert.ok(beachDecoded);
  assert.equal(beachDecoded.game.level.world, "beach");

  // Replay into Snow world at level 45 with 45 completed levels
  let snowJourney = { ...journey, completed: 45 };
  snowJourney = journeyReducer(snowJourney, { type: "visit", id: 45 });
  assert.equal(snowJourney.game.level.world, "snow");
});

test("Dev Jump Actions: can navigate directly to all 5 worlds and endless continuation", () => {
  const journey = newJourney(123);
  const targets = [
    { id: 1, world: "meadow" },
    { id: 21, world: "beach" },
    { id: 41, world: "snow" },
    { id: 61, world: "candy" },
    { id: 81, world: "space" },
    { id: 101, world: "meadow" },
  ];
  for (const { id, world } of targets) {
    const jumped = journeyReducer(journey, { type: "jump", id });
    assert.equal(jumped.game.level.id, id);
    assert.equal(jumped.game.level.world, world);
    assert.ok(jumped.completed >= id - 1);
  }
});
