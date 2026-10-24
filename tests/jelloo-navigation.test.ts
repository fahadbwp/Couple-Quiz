import test from "node:test";
import assert from "node:assert/strict";
import { GAMES } from "../lib/platform/games";
import { decodeJourney, encodeJourney, newJourney, journeyReducer } from "../lib/jelloo/progress";
import { initialGame, gameReducer } from "../lib/jelloo/engine";
import { levels } from "../lib/jelloo/levels";
import { worldForLevel } from "../lib/jelloo/worlds";

test("Task 1: Platform and library primary Jelloo action routes to Level Map", () => {
  const jellooGame = GAMES.find(g => g.id === "jelloo");
  assert.ok(jellooGame, "Jelloo game must be defined in platform GAMES library");
  assert.equal(jellooGame.playUrl, "/jelloo/map", "Primary Jelloo entry must route to /jelloo/map");
  assert.equal(jellooGame.action, "Play Jelloo");

  const quizGame = GAMES.find(g => g.id === "friendship-quiz");
  assert.ok(quizGame);
  assert.equal(quizGame.playUrl, "/quiz", "Friendship Quiz entry must remain untouched");
});

test("Task 2: First-time player progression initialization", () => {
  const fresh = newJourney(100);
  assert.equal(fresh.completed, 0, "First-time player has 0 completed levels");
  assert.equal(fresh.game.level.id, 1, "First-time player starts at Level 1");
  assert.deepEqual(fresh.best, {}, "First-time player starts with empty best stars");

  // Level 1 status is current, all others locked
  assert.equal(fresh.completed + 1, 1, "Level 1 is current/unlocked");
  const lockedAttempt = journeyReducer(fresh, { type: "visit", id: 2 });
  assert.equal(lockedAttempt.game.level.id, 1, "Attempting level 2 before completing level 1 is denied");
});

test("Task 3: Existing Level 27 saved player progression preservation", () => {
  const l27SaveRaw = JSON.stringify({
    version: 1,
    generator: 1,
    rules: 4,
    seed: 1234,
    completed: 26,
    id: 27,
    moves: 3,
    motion: true,
    won: false,
    rotations: Array(25).fill(0),
    best: { "1": 3, "10": 3, "26": 2 },
  });

  const decoded = decodeJourney(l27SaveRaw);
  assert.ok(decoded);
  assert.equal(decoded.completed, 26, "Completed level count must be 26");
  assert.equal(decoded.game.level.id, 27, "Active level must be 27");
  assert.equal(worldForLevel(decoded.game.level.id).id, "beach");
  assert.equal(decoded.best["10"], 3);
  assert.equal(decoded.best["26"], 2);

  // Replay Level 10
  const replayed = journeyReducer(decoded, { type: "visit", id: 10 });
  assert.equal(replayed.game.level.id, 10, "Replaying Level 10 must switch active level to 10");
  assert.equal(replayed.completed, 26, "Replaying must never reduce completed progress");
  assert.equal(replayed.best["26"], 2, "Stars must remain intact");

  // Visiting locked Level 28 denied
  const locked = journeyReducer(replayed, { type: "visit", id: 28 });
  assert.equal(locked.game.level.id, 10, "Visiting locked Level 28 must be blocked");

  // Return to current Level 27
  const returned = journeyReducer(replayed, { type: "visit", id: 27 });
  assert.equal(returned.game.level.id, 27, "Can return to active current level");
});

test("Task 4: Existing Level 93 saved player progression preservation", () => {
  const l93SaveRaw = JSON.stringify({
    version: 1,
    generator: 1,
    rules: 4,
    seed: 5678,
    completed: 92,
    id: 93,
    moves: 1,
    motion: true,
    won: false,
    rotations: Array(25).fill(0),
    jellies: [
      { character: "bunny", start: 0, home: 21 },
      { character: "panda", start: 2, home: 22 },
      { character: "cat", start: 4, home: 24 },
    ],
    best: { "90": 3, "92": 3 },
  });

  const decoded = decodeJourney(l93SaveRaw);
  assert.ok(decoded);
  assert.equal(decoded.completed, 92);
  assert.equal(decoded.game.level.id, 93);
  assert.equal(worldForLevel(decoded.game.level.id).id, "space");

  // Locked level 94 denied
  const locked94 = journeyReducer(decoded, { type: "visit", id: 94 });
  assert.equal(locked94.game.level.id, 93);

  // Replay level 71 (Candy world 2-jelly)
  const replay71 = journeyReducer(decoded, { type: "visit", id: 71 });
  assert.equal(replay71.game.level.id, 71);
  assert.equal(replay71.completed, 92);
});

test("Task 5: Victory -> Next Level saves completion and advances level", () => {
  let j = newJourney(42);
  assert.equal(j.completed, 0);

  // Initial Level 1 with moveLimit 1: rotate tile 13
  const levelWithLimit = { ...levels[0], moveLimit: 1 };
  j = { ...j, game: initialGame(levelWithLimit) };
  
  // Rotate tile 13 to connect and trigger running
  j = journeyReducer(j, { type: "rotate", index: 13 });
  assert.equal(j.game.status, "running");

  // Step runner until won
  for (let i = 0; i < 10; i++) {
    j = journeyReducer(j, { type: "tick", runId: j.game.runId });
  }
  assert.equal(j.game.status, "won");
  assert.equal(j.completed, 1, "Completed increments to 1 on win");
  assert.ok(j.best["1"] >= 1, "Stars recorded for Level 1");

  // Click Next Level (visit Level 2)
  const nextLevel = journeyReducer(j, { type: "visit", id: 2 });
  assert.equal(nextLevel.game.level.id, 2, "Active level is now Level 2");
  assert.equal(nextLevel.completed, 1, "Completed remains 1");
});

test("Task 6: Direct legacy /jelloo and save persistence roundtrip", () => {
  const j = newJourney(777);
  const raw = encodeJourney(j);
  const reloaded = decodeJourney(raw);
  assert.ok(reloaded);
  assert.equal(reloaded.seed, 777);
  assert.equal(reloaded.game.level.id, 1);
  assert.equal(reloaded.completed, 0);
});

test("Task 7: Mode-specific visible Back destinations and isolation", () => {
  // Adventure game mode back target: /jelloo/map
  // Daily puzzle mode back target: /jelloo/map
  // Zen garden mode back target: /jelloo/map
  // Power Trials mode back target: /jelloo/pals ("Meet Your Pals")
  // Verification mode back target: /jelloo/invite
  const getBackDestination = (mode: { verificationMode?: boolean; powerMode?: boolean; dailyMode?: boolean; zenMode?: boolean }) => {
    if (mode.verificationMode) return "/jelloo/invite";
    if (mode.powerMode) return "/jelloo/pals";
    return "/jelloo/map";
  };

  assert.equal(getBackDestination({}), "/jelloo/map", "Adventure must return to Level Map");
  assert.equal(getBackDestination({ dailyMode: true }), "/jelloo/map", "Daily must return to Level Map");
  assert.equal(getBackDestination({ zenMode: true }), "/jelloo/map", "Zen must return to Level Map");
  assert.equal(getBackDestination({ powerMode: true }), "/jelloo/pals", "Power Trials must return to Meet Your Pals");
  assert.equal(getBackDestination({ verificationMode: true }), "/jelloo/invite", "Verification must return to Invite");
});
