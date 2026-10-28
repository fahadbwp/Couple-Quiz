import test from "node:test";
import assert from "node:assert/strict";
import {
  BUNNY_SAVE_KEY,
  initializeBunnySave,
  persistBunnyAttempt,
  readBunnySave,
  restoreBunnyGame,
  type BunnySave,
} from "../lib/jelloo/campaign-v2/bunny-save";
import { bunnyResume, bunnyScreen } from "../lib/jelloo/campaign-v2/bunny-entry";
import { bunnyLevel, bunnyScore } from "../lib/jelloo/campaign-v2/bunny-provider";
import { BUNNY_PLANS } from "../lib/jelloo/campaign-v2/bunny-specs";
import { initialGame, gameReducer } from "../lib/jelloo/engine";
import {
  evaluateWorldAccess,
  getEarnedStarsForWorld,
  CHARACTER_WORLDS,
} from "../lib/jelloo/campaign";

class MemoryStore {
  private data = new Map<string, string>();
  getItem(k: string): string | null {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string): void {
    this.data.set(k, v);
  }
  removeItem(k: string): void {
    this.data.delete(k);
  }
}

function createSetup() {
  const store = new MemoryStore();
  const init = initializeBunnySave(store);
  assert(init.success);
  return { store, save: init.save, raw: init.raw };
}

test("1. Fresh player: opens Level 1 directly without a welcome gate", () => {
  const { save } = createSetup();
  assert.equal(save.completed, 0);
  assert.equal(save.currentLevelId, 1);
  assert.deepEqual(save.best, {});
  assert.equal(save.journey, undefined);

  const resume = bunnyResume(save);
  assert.deepEqual(resume, { view: "play", level: 1 });

  const screen = bunnyScreen(resume, null, null);
  assert.equal(screen.view, "play");
  assert.equal(screen.level, 1);
  assert.equal(screen.canonicalize, true);
});

test("2. Partial level reload: restores exact in-progress rotations and move count", () => {
  const { store, save, raw } = createSetup();
  const levelId = 1; // Unlocked for fresh player
  let game = initialGame(bunnyLevel(levelId));

  // Perform partial rotations (first 2 clicks of plan)
  const clicks = BUNNY_PLANS[levelId].stars.slice(0, 2);
  for (const idx of clicks) {
    game = gameReducer(game, { type: "rotate", index: idx });
  }
  assert.equal(game.moves, 2);
  assert.equal(game.status, "editing");

  const written = persistBunnyAttempt(store, save, raw, game);
  assert(written.success);

  // Reload from store
  const read = readBunnySave(store);
  assert.equal(read.status, "ready");
  const restored = restoreBunnyGame(read.save);
  assert(restored !== null);
  assert.equal(restored.level.id, levelId);
  assert.equal(restored.moves, 2);
  assert.equal(restored.status, "editing");
  assert.deepEqual(restored.tiles, game.tiles);

  const resume = bunnyResume(read.save);
  assert.deepEqual(resume, { view: "play", level: levelId });
});

test("3. Win reload: preserves victory state, tile layout, moves, and earned stars", () => {
  const { store, save, raw } = createSetup();
  const levelId = 1;
  let game = initialGame(bunnyLevel(levelId));

  for (const idx of BUNNY_PLANS[levelId].stars) {
    game = gameReducer(game, { type: "rotate", index: idx });
  }
  game = gameReducer(game, { type: "auto", runId: game.runId, moves: game.moves });
  while (game.status === "running") {
    game = gameReducer(game, { type: "tick", runId: game.runId });
  }
  assert.equal(game.status, "won");
  const score = bunnyScore(game);
  assert.equal(score.stars, 3);

  const written = persistBunnyAttempt(store, save, raw, game);
  assert(written.success);
  assert.equal(written.save.completed, 1);
  assert.equal(written.save.best[1], 3);

  // Reload
  const read = readBunnySave(store);
  assert.equal(read.status, "ready");
  const restored = restoreBunnyGame(read.save);
  assert(restored !== null);
  assert.equal(restored.status, "won");
  assert.equal(restored.moves, game.moves);
  assert.deepEqual(restored.tiles, game.tiles);
  assert.equal(bunnyScore(restored).stars, 3);
});

test("4. Loss reload: preserves loss state and move count without awarding progress", () => {
  const { store, save, raw } = createSetup();
  const levelId = 1;
  let game = initialGame(bunnyLevel(levelId));
  const limit = game.level.moveLimit!;
  const editableTileIndex = BUNNY_PLANS[levelId].stars[0];

  // Exhaust all moves on an editable tile without connecting path
  for (let i = 0; i < limit; i++) {
    game = gameReducer(game, { type: "rotate", index: editableTileIndex });
  }
  assert.equal(game.status, "lost");
  assert.equal(game.moves, limit);

  const written = persistBunnyAttempt(store, save, raw, game);
  assert(written.success);
  assert.equal(written.save.completed, 0);
  assert.deepEqual(written.save.best, {});

  // Reload
  const read = readBunnySave(store);
  assert.equal(read.status, "ready");
  const restored = restoreBunnyGame(read.save);
  assert(restored !== null);
  assert.equal(restored.status, "lost");
  assert.equal(restored.moves, limit);
  assert.equal(bunnyScore(restored).stars, 0);

  // Resume stays on level 1
  const resume = bunnyResume(read.save);
  assert.deepEqual(resume, { view: "play", level: levelId });
});

test("5. Replaying earlier level and earning additional stars never lowers best score", () => {
  const setup = createSetup();
  let { save, raw } = setup;
  const { store } = setup;

  // Advance sequentially through levels 1..5 with 3 stars to unlock level 6
  for (let id = 1; id <= 5; id++) {
    let g = initialGame(bunnyLevel(id));
    for (const idx of BUNNY_PLANS[id].stars) g = gameReducer(g, { type: "rotate", index: idx });
    g = gameReducer(g, { type: "auto", runId: g.runId, moves: g.moves });
    while (g.status === "running") g = gameReducer(g, { type: "tick", runId: g.runId });
    const res = persistBunnyAttempt(store, save, raw, g);
    assert(res.success);
    save = res.save;
    raw = res.raw;
  }
  assert.equal(save.completed, 5);

  // Level 6 has separate short (1 star) and star (3 star) paths
  const levelId = 6;

  // Step 1: Win Level 6 with short path (1 star)
  let shortGame = initialGame(bunnyLevel(levelId));
  for (const idx of BUNNY_PLANS[levelId].short) {
    shortGame = gameReducer(shortGame, { type: "rotate", index: idx });
  }
  shortGame = gameReducer(shortGame, { type: "auto", runId: shortGame.runId, moves: shortGame.moves });
  while (shortGame.status === "running") {
    shortGame = gameReducer(shortGame, { type: "tick", runId: shortGame.runId });
  }
  assert.equal(shortGame.status, "won");
  assert.equal(bunnyScore(shortGame).stars, 1);

  const w1 = persistBunnyAttempt(store, save, raw, shortGame);
  assert(w1.success);
  assert.equal(w1.save.completed, 6);
  assert.equal(w1.save.best[levelId], 1);

  // Step 2: Replay Level 6 with star path (3 stars)
  let starGame = initialGame(bunnyLevel(levelId));
  for (const idx of BUNNY_PLANS[levelId].stars) {
    starGame = gameReducer(starGame, { type: "rotate", index: idx });
  }
  starGame = gameReducer(starGame, { type: "auto", runId: starGame.runId, moves: starGame.moves });
  while (starGame.status === "running") {
    starGame = gameReducer(starGame, { type: "tick", runId: starGame.runId });
  }
  assert.equal(starGame.status, "won");
  assert.equal(bunnyScore(starGame).stars, 3);

  const w2 = persistBunnyAttempt(store, w1.save, w1.raw, starGame);
  assert(w2.success);
  assert.equal(w2.save.best[levelId], 3);

  // Step 3: Replay again with short path (1 star) - best must stay 3
  let replayShort = initialGame(bunnyLevel(levelId));
  for (const idx of BUNNY_PLANS[levelId].short) {
    replayShort = gameReducer(replayShort, { type: "rotate", index: idx });
  }
  replayShort = gameReducer(replayShort, { type: "auto", runId: replayShort.runId, moves: replayShort.moves });
  while (replayShort.status === "running") {
    replayShort = gameReducer(replayShort, { type: "tick", runId: replayShort.runId });
  }
  const w3 = persistBunnyAttempt(store, w2.save, w2.raw, replayShort);
  assert(w3.success);
  assert.equal(w3.save.best[levelId], 3, "Best stars must never degrade from 3 to 1");

  // Step 4: Replay with lost game - best must still stay 3
  let lostGame = initialGame(bunnyLevel(levelId));
  const editableTile = BUNNY_PLANS[levelId].stars[0];
  for (let i = 0; i < lostGame.level.moveLimit!; i++) {
    lostGame = gameReducer(lostGame, { type: "rotate", index: editableTile });
  }
  assert.equal(lostGame.status, "lost");
  const w4 = persistBunnyAttempt(store, w3.save, w3.raw, lostGame);
  assert(w4.success);
  assert.equal(w4.save.best[levelId], 3, "Lost replay must not erase earned stars");
});

test("6. Corrupted save handling: held safely without reset or overwrite", () => {
  const store = new MemoryStore();
  const corruptPayload = '{"contentRevision":"bunny-4x4-v1","malformed":true,truncated...';
  store.setItem(BUNNY_SAVE_KEY, corruptPayload);

  // Read reports corrupt
  const readResult = readBunnySave(store);
  assert.equal(readResult.status, "corrupt");

  // Initialization refuses to wipe or overwrite
  const initResult = initializeBunnySave(store);
  assert.equal(initResult.success, false);

  // Bytes in store are untouched
  assert.equal(store.getItem(BUNNY_SAVE_KEY), corruptPayload);

  // Attempting to persist with a fresh snapshot fails closed
  const dummySave: BunnySave = {
    version: 2,
    campaignId: "character_worlds_v2",
    contentRevision: "bunny-4x4-v1",
    completed: 0,
    currentLevelId: 1,
    best: {},
    motion: true,
    muted: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const writeResult = persistBunnyAttempt(
    store,
    dummySave,
    JSON.stringify(dummySave),
    initialGame(bunnyLevel(1))
  );
  assert.equal(writeResult.success, false);
  assert.equal(store.getItem(BUNNY_SAVE_KEY), corruptPayload);
});

test("7. Level 50 completion with >= 120 stars vs < 120 stars", () => {
  const world1 = CHARACTER_WORLDS[0];

  // Sub-case A: 50 levels completed, but only 1 star each = 50 stars (< 120 stars)
  const lowBest: Record<string, number> = {};
  for (let id = 1; id <= 50; id++) lowBest[id] = 1;
  const lowStars = getEarnedStarsForWorld(world1, lowBest);
  assert.equal(lowStars, 50);

  const lowAccess = evaluateWorldAccess(2, 50, lowBest);
  assert.equal(lowAccess.status, "locked");
  assert.equal(lowAccess.reason, "previous_world_stars_insufficient");
  assert.equal(lowAccess.currentWorldStars, 50);
  assert.equal(lowAccess.requiredStars, 120);

  // UI qualified check: save.completed === 50 && stars >= 120
  const lowQualified = 50 === 50 && lowStars >= 120;
  assert.equal(lowQualified, false);

  // Sub-case B: 50 levels completed with 120 stars (e.g. 35 with 3 stars, 15 with 1 star = 105 + 15 = 120 stars)
  const qualifiedBest: Record<string, number> = {};
  for (let id = 1; id <= 35; id++) qualifiedBest[id] = 3;
  for (let id = 36; id <= 50; id++) qualifiedBest[id] = 1;
  const qualifiedStars = getEarnedStarsForWorld(world1, qualifiedBest);
  assert.equal(qualifiedStars, 120);

  const qualifiedAccess = evaluateWorldAccess(2, 50, qualifiedBest);
  // Qualified! But World 2 content is unbuilt, so status is "eligible_but_unimplemented"
  assert.equal(qualifiedAccess.status, "eligible_but_unimplemented");

  const highQualified = 50 === 50 && qualifiedStars >= 120;
  assert.equal(highQualified, true);

  // Sub-case C: 50 levels completed with 150 stars (all 3 stars)
  const maxBest: Record<string, number> = {};
  for (let id = 1; id <= 50; id++) maxBest[id] = 3;
  const maxStars = getEarnedStarsForWorld(world1, maxBest);
  assert.equal(maxStars, 150);

  const maxAccess = evaluateWorldAccess(2, 50, maxBest);
  assert.equal(maxAccess.status, "eligible_but_unimplemented");
});
