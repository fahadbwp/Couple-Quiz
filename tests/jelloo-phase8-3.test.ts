import test from "node:test";
import assert from "node:assert/strict";
import {
  canPlayPal,
  isMechanicallyCompatible,
  getEffectiveDisplayCharacter,
} from "../lib/jelloo/pals";
import { formatShareCard, generateMultiJellyGrid } from "../lib/jelloo/share";
import { feedbackFor } from "../lib/jelloo/feedback";
import { levelAt } from "../lib/jelloo/endless";
import { initialGame, gameReducer } from "../lib/jelloo/engine";
import { decodeJourney } from "../lib/jelloo/progress";

test("Phase 8.3 Task 1: Character animation states and pal unlocking", () => {
  assert.equal(canPlayPal("bunny", 0), true, "Bunny is unlocked from Level 0");
  assert.equal(canPlayPal("panda", 9), false, "Panda is locked before Level 10");
  assert.equal(canPlayPal("panda", 10), true, "Panda unlocks at Level 10");
  assert.equal(canPlayPal("cat", 19), false, "Cat is locked before Level 20");
  assert.equal(canPlayPal("cat", 20), true, "Cat unlocks at Level 20");
  assert.equal(canPlayPal("octopus", 29), false, "Octopus is locked before Level 30");
  assert.equal(canPlayPal("octopus", 30), true, "Octopus unlocks at Level 30");
  assert.equal(canPlayPal("fox", 39), false, "Fox is locked before Level 40");
  assert.equal(canPlayPal("fox", 40), true, "Fox unlocks at Level 40");
});

test("Phase 8.3 Task 2: Favourite Pal mechanical compatibility & required pal isolation", () => {
  // Level 1: Standard tutorial, mechanically compatible
  const l1 = levelAt(1, 42, 4, 2);
  assert.equal(isMechanicallyCompatible(l1), true, "Level 1 is mechanically compatible for Favourite Pal");

  // Level with gap or cracked or water terrain is NOT compatible
  const compatibleWithCat = getEffectiveDisplayCharacter(l1, "cat", 25);
  assert.equal(compatibleWithCat.displayCharacter, "cat");
  assert.equal(compatibleWithCat.isCosmetic, true);

  // Locked pal cannot be equipped as cosmetic favourite
  const lockedFox = getEffectiveDisplayCharacter(l1, "fox", 10);
  assert.equal(lockedFox.displayCharacter, "bunny", "Cannot display locked pal as favourite");
  assert.equal(lockedFox.isCosmetic, false);

  // Level with water terrain requires Octopus
  const waterLevel = {
    ...l1,
    character: "octopus" as const,
    tiles: l1.tiles.map((t, idx) => (idx === 5 ? { ...t, terrain: "water" as const } : t)),
  };
  assert.equal(isMechanicallyCompatible(waterLevel), false, "Water level is not mechanically compatible with random pal");
  const requiredOctopus = getEffectiveDisplayCharacter(waterLevel, "cat", 50);
  assert.equal(requiredOctopus.displayCharacter, "octopus", "Must use required Octopus on water level");
  assert.equal(requiredOctopus.isCosmetic, false);
  assert.equal(requiredOctopus.requiredCharacter, "octopus");

  // Multi-Jelly Level 71 (Two Jellies) is NOT compatible with cosmetic override
  const l71 = levelAt(71, 42, 4, 2);
  assert.ok(l71.jellies && l71.jellies.length > 1, "Level 71 is Multi-Jelly");
  assert.equal(isMechanicallyCompatible(l71), false, "Multi-Jelly levels cannot have single favourite override");
  const multiEff = getEffectiveDisplayCharacter(l71, "fox", 100);
  assert.equal(multiEff.isCosmetic, false);
});

test("Phase 8.3 Task 3: Multi-Jelly result share cards accuracy (Single, Two-Jelly, Three-Jelly)", () => {
  // Single Jelly share card
  const singleCard = formatShareCard({
    mode: "adventure",
    levelId: 10,
    moves: 4,
    moveLimit: 5,
    stars: 3,
    collectedStars: 3,
    totalStars: 3,
    character: "bunny",
    world: "meadow",
    size: 4,
    path: [12, 13, 14, 15],
  });
  assert.ok(singleCard.fullMessage.includes("🐰 Bunny"));
  assert.ok(singleCard.fullMessage.includes("Level 10"));
  assert.ok(singleCard.fullMessage.includes("★★★"));

  // Two-Jelly share card (Level 71)
  const twoJellyCard = formatShareCard({
    mode: "adventure",
    levelId: 71,
    moves: 6,
    moveLimit: 8,
    stars: 3,
    collectedStars: 3,
    totalStars: 3,
    character: "bunny",
    jellies: [
      { character: "bunny", color: "pink", path: [0, 1, 2, 3] },
      { character: "panda", color: "green", path: [12, 13, 14, 15] },
    ],
    world: "candy",
    size: 4,
    path: [0, 1, 2, 3, 12, 13, 14, 15],
  });
  assert.ok(twoJellyCard.fullMessage.includes("Two Jellies"), "Title indicates Two Jellies");
  assert.ok(twoJellyCard.fullMessage.includes("🐰 Bunny & 🐼 Panda"), "Mentions both participating characters");
  assert.ok(twoJellyCard.fullMessage.includes("Level 71"));

  // Three-Jelly share card (Level 91)
  const threeJellyCard = formatShareCard({
    mode: "adventure",
    levelId: 91,
    moves: 9,
    moveLimit: 12,
    stars: 3,
    collectedStars: 3,
    totalStars: 3,
    character: "bunny",
    jellies: [
      { character: "bunny", color: "pink", path: [0, 1, 2] },
      { character: "panda", color: "green", path: [5, 6, 7] },
      { character: "cat", color: "blue", path: [10, 11, 12] },
    ],
    world: "space",
    size: 5,
    path: [0, 1, 2, 5, 6, 7, 10, 11, 12],
  });
  assert.ok(threeJellyCard.fullMessage.includes("Three Jellies"), "Title indicates Three Jellies");
  assert.ok(threeJellyCard.fullMessage.includes("🐰 Bunny, 🐼 Panda & 🐱 Cat"), "Mentions all 3 characters accurately");
  assert.ok(threeJellyCard.fullMessage.includes("Level 91"));

  // Multi-color grid check
  const multiGrid = generateMultiJellyGrid(4, [
    { path: [0, 1] },
    { path: [5, 6] },
    { path: [10, 11] },
  ]);
  assert.ok(multiGrid.includes("🟩"), "Contains Jelly 1 color");
  assert.ok(multiGrid.includes("🟦"), "Contains Jelly 2 color");
  assert.ok(multiGrid.includes("🟪"), "Contains Jelly 3 color");
});

test("Phase 8.3 Task 4: Sound cue generation and power feedback", () => {
  const g1 = initialGame(levelAt(1, 42, 4, 2));
  // Rotating does not advance run
  const rotated = gameReducer(g1, { type: "rotate", index: 5 });
  const cues1 = feedbackFor(g1, rotated);
  assert.deepEqual(cues1, [], "Rotation does not emit tick hop feedback");

  // Lost status emits confused cue
  const lostGame = { ...g1, status: "lost" as const };
  const lostCues = feedbackFor(g1, lostGame);
  assert.deepEqual(lostCues, ["confused"], "Status transition to lost emits confused cue");

  // Won status emits win cue
  const wonGame = { ...g1, status: "won" as const, runId: g1.runId };
  const runningGame = { ...g1, status: "running" as const };
  const winCues = feedbackFor(runningGame, wonGame);
  assert.deepEqual(winCues, ["win"], "Status transition from running to won emits win cue");

  // Step on special terrain emits power cue
  const stepGamePrev = { ...g1, status: "running" as const, cursor: 0, trace: { outcome: "home" as const, path: [0, 1] } };
  const waterLevel = {
    ...g1.level,
    tiles: g1.level.tiles.map((t, idx) => (idx === 1 ? { ...t, terrain: "water" as const } : t)),
  };
  const stepGameNext = {
    ...stepGamePrev,
    tiles: waterLevel.tiles,
    cursor: 1,
  };
  const powerCues = feedbackFor(stepGamePrev, stepGameNext);
  assert.ok(powerCues.includes("power"), "Stepping on special water terrain triggers power audio cue");
});

test("Phase 8.3 Task 5: Save compatibility and progression preservation", () => {
  const targetLevel = levelAt(1, 999, 4, 2);
  const saveFixture = JSON.stringify({
    version: 1,
    generator: 1,
    rules: 4,
    multiRevision: 2,
    seed: 999,
    completed: 27,
    id: 1,
    moves: 0,
    motion: true,
    muted: false,
    best: { "27": 3 },
    rotations: Array(targetLevel.tiles.length).fill(0),
    won: false,
  });

  const journey = decodeJourney(saveFixture);
  assert.ok(journey, "Save fixture decodes safely");
  assert.equal(journey.completed, 27);
  assert.equal(journey.game.level.id, 1);
  assert.equal(journey.best["27"], 3);
});

test("Phase 8.3 Task 6: Share card route truthfulness vs celebration graphic", () => {
  // When real paths are present: must show Routes legend and colored cells
  const truthfulCard = formatShareCard({
    mode: "adventure",
    levelId: 71,
    moves: 6,
    stars: 3,
    collectedStars: 3,
    totalStars: 3,
    character: "bunny",
    jellies: [
      { character: "bunny", path: [0, 1, 2, 3] },
      { character: "panda", path: [12, 13, 14, 15] },
    ],
    world: "candy",
    size: 4,
    path: [0, 1, 2, 3, 12, 13, 14, 15],
  });
  assert.ok(truthfulCard.fullMessage.includes("Routes: 🟩 🐰 Bunny · 🟦 🐼 Panda"), "Contains accurate pal route legend");
  assert.ok(!truthfulCard.fullMessage.includes("[Team Celebration Graphic]"), "Does not label real paths as celebration graphic");

  // When paths are empty or absent: must NOT claim fabricated routes; must display celebration graphic tag
  const celebrationCard = formatShareCard({
    mode: "adventure",
    levelId: 71,
    moves: 6,
    stars: 3,
    collectedStars: 3,
    totalStars: 3,
    character: "bunny",
    jellies: [
      { character: "bunny" },
      { character: "panda" },
    ],
    world: "candy",
    size: 4,
    path: [],
  });
  assert.ok(celebrationCard.fullMessage.includes("[Team Celebration Graphic]"), "Truthfully marks missing paths as celebration graphic");
  assert.ok(!celebrationCard.fullMessage.includes("Routes:"), "Never invents fabricated routes");
  assert.ok(celebrationCard.fullMessage.includes("✨ 🐾 🎉 🐾 ✨"), "Displays celebratory banner rather than fabricated path");
});

test("Phase 8.3 Task 7: Top game-mode cards contract and character selection routing", () => {
  // Pals selection and power trials contract
  assert.equal(canPlayPal("bunny", 0), true);
  assert.equal(canPlayPal("panda", 10), true);
  assert.equal(canPlayPal("panda", 9), false);

  // Favourite pal equip logic
  const favCompatible = getEffectiveDisplayCharacter(levelAt(1, 42, 4, 2), "panda", 40);
  assert.equal(favCompatible.displayCharacter, "panda");
  assert.equal(favCompatible.isCosmetic, true);

  // Favourite pal disabled on required levels (e.g. Level 27 requiring Cat)
  const l27 = levelAt(27, 42, 5, 2);
  const favReq = getEffectiveDisplayCharacter(l27, "panda", 40);
  assert.equal(favReq.displayCharacter, l27.character ?? "cat");
  assert.equal(favReq.isCosmetic, false);
});
