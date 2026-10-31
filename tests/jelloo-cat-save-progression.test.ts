import test from "node:test";
import assert from "node:assert/strict";
import {
  CAT_SAVE_KEY,
  initializeCatSave,
  persistCatAttempt,
  readCatSave,
  restoreCatGame,
  isCatQualified,
  evaluateCatAccess,
  type CatSave,
} from "../lib/jelloo/campaign-v2/cat-save";
import { PANDA_SAVE_KEY, type PandaSave } from "../lib/jelloo/campaign-v2/panda-save";
import { BUNNY_SAVE_KEY, type BunnySave } from "../lib/jelloo/campaign-v2/bunny-save";
import { catResume, catScreen } from "../lib/jelloo/campaign-v2/cat-entry";
import { catLevel, catScore } from "../lib/jelloo/campaign-v2/cat-provider";
import { CAT_PLANS } from "../lib/jelloo/campaign-v2/cat-specs";
import { initialGame, gameReducer } from "../lib/jelloo/engine";
import { evaluateWorldAccess } from "../lib/jelloo/campaign";

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

function createQualifiedStore(pandaCompleted = 100, pandaStarsCount = 120) {
  const store = new MemoryStore();

  // 1. Bunny save: completed 50, 120 stars
  const bunnyBest: Record<string, number> = {};
  for (let id = 1; id <= 40; id++) bunnyBest[String(id)] = 3;
  for (let id = 41; id <= 50; id++) bunnyBest[String(id)] = 1;
  const bunnySave: BunnySave = {
    version: 2,
    campaignId: "character_worlds_v2",
    contentRevision: "bunny-4x4-v1",
    completed: 50,
    currentLevelId: 50,
    best: bunnyBest,
    motion: true,
    muted: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.setItem(BUNNY_SAVE_KEY, JSON.stringify(bunnySave));

  // 2. Panda save: configurable completion & stars
  const pandaBest: Record<string, number> = {};
  let starsRemaining = pandaStarsCount;
  for (let id = 51; id <= pandaCompleted; id++) {
    const award = Math.min(3, starsRemaining);
    if (award > 0) {
      pandaBest[String(id)] = award;
      starsRemaining -= award;
    } else {
      pandaBest[String(id)] = 1;
    }
  }

  const pandaSave: PandaSave = {
    version: 2,
    campaignId: "character_worlds_v2",
    contentRevision: "panda-5x4-v1",
    completed: pandaCompleted,
    currentLevelId: Math.min(pandaCompleted + 1, 100),
    best: pandaBest,
    motion: true,
    muted: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.setItem(PANDA_SAVE_KEY, JSON.stringify(pandaSave));
  return store;
}

test("1. Cat unlock gate: Panda Level 100 and 120 stars strictly enforced", () => {
  // Case A: Missing Panda save
  const emptyStore = new MemoryStore();
  assert.equal(isCatQualified(emptyStore).qualified, false);
  const initFail1 = initializeCatSave(emptyStore);
  assert.equal(initFail1.success, false);

  // Case B: Incomplete Panda world (e.g. 99/100)
  const incStore = createQualifiedStore(99, 120);
  assert.equal(isCatQualified(incStore).qualified, false);
  assert.equal(initializeCatSave(incStore).success, false);

  // Case C: Level 100 complete but insufficient stars (< 120)
  const lowStarStore = createQualifiedStore(100, 100);
  assert.equal(isCatQualified(lowStarStore).qualified, false);
  assert.equal(initializeCatSave(lowStarStore).success, false);

  // Case D: Qualified (100 complete, >= 120 stars)
  const validStore = createQualifiedStore(100, 120);
  const gate = isCatQualified(validStore);
  assert.equal(gate.qualified, true);
  assert.equal(gate.pandaCompleted, 100);
  assert.equal(gate.pandaStars >= 120, true);

  const init = initializeCatSave(validStore);
  assert.equal(init.success, true);
  if (init.success) {
    assert.equal(init.save.completed, 100);
    assert.equal(init.save.currentLevelId, 101);
    assert.deepEqual(init.save.best, {});
  }
});

test("2. Fresh Cat player: opens Level 101 directly without a welcome gate", () => {
  const store = createQualifiedStore(100, 120);
  const init = initializeCatSave(store);
  assert(init.success);
  const { save } = init;

  assert.equal(save.completed, 100);
  assert.equal(save.currentLevelId, 101);
  assert.deepEqual(save.best, {});
  assert.equal(save.journey, undefined);

  const resume = catResume(save);
  assert.deepEqual(resume, { view: "play", level: 101 });

  const screen = catScreen(resume, null, null);
  assert.equal(screen.view, "play");
  assert.equal(screen.level, 101);
  assert.equal(screen.canonicalize, true);
});

test("3. Partial level reload: restores exact in-progress rotations, moves, and board on 6x4", () => {
  const store = createQualifiedStore(100, 120);
  const init = initializeCatSave(store);
  assert(init.success);
  const { save, raw } = init;

  const levelId = 101;
  let game = initialGame(catLevel(levelId));

  // Rotate first 3 clicks of plan
  const clicks = CAT_PLANS[levelId].stars.slice(0, 3);
  for (const idx of clicks) {
    game = gameReducer(game, { type: "rotate", index: idx });
  }
  assert.equal(game.moves, 3);
  assert.equal(game.status, "editing");

  const written = persistCatAttempt(store, save, raw, game);
  assert(written.success);

  // Reload save
  const reloaded = readCatSave(store);
  assert.equal(reloaded.status, "ready");
  assert.equal(reloaded.save.currentLevelId, 101);
  assert.equal(reloaded.save.completed, 100);
  assert(reloaded.save.journey);
  assert.equal(reloaded.save.journey.moves, 3);
  assert.equal(reloaded.save.journey.rotations.length, 24); // 6x4 board = 24 tiles

  const restored = restoreCatGame(reloaded.save, store);
  assert(restored);
  assert.equal(restored.moves, 3);
  assert.equal(restored.status, "editing");
  assert.equal(restored.level.id, 101);
  assert.equal(restored.tiles.length, 24);
});

test("4. Win reload: preserves victory state, tile layout, moves, and earned stars", () => {
  const store = createQualifiedStore(100, 120);
  const init = initializeCatSave(store);
  assert(init.success);
  const { save, raw } = init;

  const levelId = 101;
  let game = initialGame(catLevel(levelId));
  for (const idx of CAT_PLANS[levelId].stars) {
    game = gameReducer(game, { type: "rotate", index: idx });
  }
  game = gameReducer(game, { type: "auto", runId: game.runId, moves: game.moves });
  while (game.status === "running") {
    game = gameReducer(game, { type: "tick", runId: game.runId });
  }
  assert.equal(game.status, "won");
  assert.equal(catScore(game).stars, 3);

  const written = persistCatAttempt(store, save, raw, game);
  assert(written.success);
  assert.equal(written.save.completed, 101);
  assert.equal(written.save.best["101"], 3);

  const reloaded = readCatSave(store);
  assert.equal(reloaded.status, "ready");
  assert.equal(reloaded.save.completed, 101);
  assert.equal(reloaded.save.best["101"], 3);

  const restored = restoreCatGame(reloaded.save, store);
  assert(restored);
  assert.equal(restored.status, "won");
  assert.equal(catScore(restored).stars, 3);
});

test("5. Loss reload: preserves loss state and move count without awarding progress", () => {
  const store = createQualifiedStore(100, 120);
  const init = initializeCatSave(store);
  assert(init.success);
  const { save, raw } = init;

  const level = catLevel(101);
  let game = initialGame(level);
  const editableIndex = level.tiles.findIndex(
    (t, idx) => !t.locked && ["straight", "corner", "tee"].includes(t.kind) && !CAT_PLANS[101].stars.includes(idx)
  );
  assert(editableIndex >= 0);
  // Exhaust moves on an editable non-solution tile to trigger loss
  for (let m = 0; m < level.moveLimit; m++) {
    game = gameReducer(game, { type: "rotate", index: editableIndex });
  }
  assert.equal(game.moves, level.moveLimit);
  assert.equal(game.status, "lost");

  const written = persistCatAttempt(store, save, raw, game);
  assert(written.success);
  assert.equal(written.save.completed, 100); // Did not advance
  assert.equal(written.save.best["101"], undefined);

  const restored = restoreCatGame(written.save, store);
  assert(restored);
  assert.equal(restored.status, "lost");
  assert.equal(restored.moves, level.moveLimit);
});

test("6. Replay: never lowers earned best stars", () => {
  const store = createQualifiedStore(100, 120);
  const init = initializeCatSave(store);
  assert(init.success);

  // Complete 101..104 so 105 is accessible
  let currentSave = init.save;
  let currentRaw = init.raw;
  for (let id = 101; id <= 104; id++) {
    let g = initialGame(catLevel(id));
    for (const idx of CAT_PLANS[id].stars) g = gameReducer(g, { type: "rotate", index: idx });
    g = gameReducer(g, { type: "auto", runId: g.runId, moves: g.moves });
    while (g.status === "running") g = gameReducer(g, { type: "tick", runId: g.runId });
    const p = persistCatAttempt(store, currentSave, currentRaw, g);
    assert(p.success);
    currentSave = p.save;
    currentRaw = p.raw;
  }
  assert.equal(currentSave.completed, 104);

  // Win Level 105 with 3 stars
  let g105 = initialGame(catLevel(105));
  for (const idx of CAT_PLANS[105].stars) g105 = gameReducer(g105, { type: "rotate", index: idx });
  g105 = gameReducer(g105, { type: "auto", runId: g105.runId, moves: g105.moves });
  while (g105.status === "running") g105 = gameReducer(g105, { type: "tick", runId: g105.runId });
  assert.equal(catScore(g105).stars, 3);
  const p105 = persistCatAttempt(store, currentSave, currentRaw, g105);
  assert(p105.success);
  assert.equal(p105.save.best["105"], 3);

  // Replay Level 105 with 1 star (short route)
  let replayG105 = initialGame(catLevel(105));
  for (const idx of CAT_PLANS[105].short) replayG105 = gameReducer(replayG105, { type: "rotate", index: idx });
  replayG105 = gameReducer(replayG105, { type: "auto", runId: replayG105.runId, moves: replayG105.moves });
  while (replayG105.status === "running") replayG105 = gameReducer(replayG105, { type: "tick", runId: replayG105.runId });
  assert.equal(catScore(replayG105).stars, 1);

  const replayP = persistCatAttempt(store, p105.save, p105.raw, replayG105);
  assert(replayP.success);
  assert.equal(replayP.save.best["105"], 3, "Replay must NOT lower best stars from 3 to 1");
});

test("7. Corrupted save handling: corrupt bytes preserved without wipe or overwrite", () => {
  const store = new MemoryStore();
  const corruptPayload = "{ corrupt json payload: 98765 }";
  store.setItem(CAT_SAVE_KEY, corruptPayload);

  const read = readCatSave(store);
  assert.equal(read.status, "corrupt");
  assert.equal(store.getItem(CAT_SAVE_KEY), corruptPayload, "Corrupt bytes must remain untouched");

  // Attempting to initialize when corrupt must fail closed to protect data
  const init = initializeCatSave(store);
  assert.equal(init.success, false);
  assert.equal(store.getItem(CAT_SAVE_KEY), corruptPayload);
});

test("8. Milestone star gates inside Cat World enforce star requirements", () => {
  // Gate 110 requires 15 stars from 101–109
  // If completed is 109 but player only earned 9 stars (1 star each):
  const lowBest: Record<string, number> = {};
  for (let id = 101; id <= 109; id++) lowBest[String(id)] = 1;

  const accessLocked = evaluateCatAccess(110, 109, lowBest);
  assert.equal(accessLocked.accessible, false);
  if (!accessLocked.accessible) {
    assert.equal(accessLocked.reason, "star_gate_locked");
    assert.equal(accessLocked.requiredStars, 15);
    assert.equal(accessLocked.currentStars, 9);
  }

  // With 15 stars, Gate 110 opens
  for (let id = 101; id <= 105; id++) lowBest[String(id)] = 3;
  const accessOpen = evaluateCatAccess(110, 109, lowBest);
  assert.equal(accessOpen.accessible, true);
});

test("9. Level 150 completion routes to Worlds view and keeps Worlds 4-5 locked", () => {
  const store = createQualifiedStore(100, 120);
  const init = initializeCatSave(store);
  assert(init.success);

  // Complete level 150 save
  const best: Record<string, number> = {};
  for (let id = 101; id <= 150; id++) best[String(id)] = 3;

  const completedSave: CatSave = {
    ...init.save,
    completed: 150,
    currentLevelId: 150,
    best,
    updatedAt: new Date().toISOString(),
  };

  const resume = catResume(completedSave);
  assert.deepEqual(resume, { view: "worlds" });

  const screen = catScreen(resume, null, null);
  assert.equal(screen.view, "worlds");

  // Verify Worlds 4 and 5 are strictly locked ("Soon")
  const octopusAccess = evaluateWorldAccess(4, completedSave.completed, completedSave.best);
  assert.notEqual(octopusAccess.status, "available");

  const foxAccess = evaluateWorldAccess(5, completedSave.completed, completedSave.best);
  assert.notEqual(foxAccess.status, "available");
});
