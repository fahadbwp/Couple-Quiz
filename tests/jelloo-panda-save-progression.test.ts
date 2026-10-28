import test from "node:test";
import assert from "node:assert/strict";
import {
  PANDA_SAVE_KEY,
  initializePandaSave,
  persistPandaAttempt,
  readPandaSave,
  restorePandaGame,
  isPandaQualified,
  evaluatePandaAccess,
  type PandaSave,
} from "../lib/jelloo/campaign-v2/panda-save";
import { BUNNY_SAVE_KEY, type BunnySave } from "../lib/jelloo/campaign-v2/bunny-save";
import { pandaResume, pandaScreen } from "../lib/jelloo/campaign-v2/panda-entry";
import { pandaLevel, pandaScore } from "../lib/jelloo/campaign-v2/panda-provider";
import { PANDA_PLANS } from "../lib/jelloo/campaign-v2/panda-specs";
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

function createQualifiedStore(bunnyCompleted = 50, bunnyStarsCount = 120) {
  const store = new MemoryStore();
  const best: Record<string, number> = {};
  // Distribute stars across Bunny levels 1..bunnyCompleted
  let starsRemaining = bunnyStarsCount;
  for (let id = 1; id <= bunnyCompleted; id++) {
    const award = Math.min(3, starsRemaining);
    if (award > 0) {
      best[String(id)] = award;
      starsRemaining -= award;
    } else {
      best[String(id)] = 1; // Completed levels must have at least 1 star
    }
  }

  const bunnySave: BunnySave = {
    version: 2,
    campaignId: "character_worlds_v2",
    contentRevision: "bunny-4x4-v1",
    completed: bunnyCompleted,
    currentLevelId: Math.min(bunnyCompleted + 1, 50),
    best,
    motion: true,
    muted: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.setItem(BUNNY_SAVE_KEY, JSON.stringify(bunnySave));
  return store;
}

test("1. Panda unlock gate: Bunny Level 50 and 120 stars strictly enforced", () => {
  // Case A: Missing Bunny save
  const emptyStore = new MemoryStore();
  assert.equal(isPandaQualified(emptyStore).qualified, false);
  const initFail1 = initializePandaSave(emptyStore);
  assert.equal(initFail1.success, false);

  // Case B: Incomplete Bunny world (e.g. 49/50)
  const incStore = createQualifiedStore(49, 120);
  assert.equal(isPandaQualified(incStore).qualified, false);
  assert.equal(initializePandaSave(incStore).success, false);

  // Case C: Level 50 complete but insufficient stars (< 120)
  const lowStarStore = createQualifiedStore(50, 100);
  assert.equal(isPandaQualified(lowStarStore).qualified, false);
  assert.equal(initializePandaSave(lowStarStore).success, false);

  // Case D: Qualified (50 complete, >= 120 stars)
  const validStore = createQualifiedStore(50, 120);
  const gate = isPandaQualified(validStore);
  assert.equal(gate.qualified, true);
  assert.equal(gate.bunnyCompleted, 50);
  assert.equal(gate.bunnyStars >= 120, true);

  const init = initializePandaSave(validStore);
  assert.equal(init.success, true);
  if (init.success) {
    assert.equal(init.save.completed, 50);
    assert.equal(init.save.currentLevelId, 51);
    assert.deepEqual(init.save.best, {});
  }
});

test("2. Fresh Panda player: opens Level 51 directly without a welcome gate", () => {
  const store = createQualifiedStore(50, 120);
  const init = initializePandaSave(store);
  assert(init.success);
  const { save } = init;

  assert.equal(save.completed, 50);
  assert.equal(save.currentLevelId, 51);
  assert.deepEqual(save.best, {});
  assert.equal(save.journey, undefined);

  const resume = pandaResume(save);
  assert.deepEqual(resume, { view: "play", level: 51 });

  const screen = pandaScreen(resume, null, null);
  assert.equal(screen.view, "play");
  assert.equal(screen.level, 51);
  assert.equal(screen.canonicalize, true);
});

test("3. Partial level reload: restores exact in-progress rotations, moves, and board on 5x4", () => {
  const store = createQualifiedStore(50, 120);
  const init = initializePandaSave(store);
  assert(init.success);
  const { save, raw } = init;

  const levelId = 51;
  let game = initialGame(pandaLevel(levelId));

  // Rotate first 3 clicks of plan
  const clicks = PANDA_PLANS[levelId].stars.slice(0, 3);
  for (const idx of clicks) {
    game = gameReducer(game, { type: "rotate", index: idx });
  }
  assert.equal(game.moves, 3);
  assert.equal(game.status, "editing");

  const written = persistPandaAttempt(store, save, raw, game);
  assert(written.success);

  // Reload save
  const reloaded = readPandaSave(store);
  assert.equal(reloaded.status, "ready");
  assert.equal(reloaded.save.currentLevelId, 51);
  assert.equal(reloaded.save.completed, 50);
  assert(reloaded.save.journey);
  assert.equal(reloaded.save.journey.moves, 3);
  assert.equal(reloaded.save.journey.rotations.length, 20); // 5x4 board

  const restored = restorePandaGame(reloaded.save, store);
  assert(restored);
  assert.equal(restored.moves, 3);
  assert.equal(restored.status, "editing");
  assert.equal(restored.level.id, 51);
  assert.equal(restored.tiles.length, 20);
});

test("4. Win reload: preserves victory state, tile layout, moves, and earned stars", () => {
  const store = createQualifiedStore(50, 120);
  const init = initializePandaSave(store);
  assert(init.success);
  const { save, raw } = init;

  const levelId = 51;
  let game = initialGame(pandaLevel(levelId));
  for (const idx of PANDA_PLANS[levelId].stars) {
    game = gameReducer(game, { type: "rotate", index: idx });
  }
  game = gameReducer(game, { type: "auto", runId: game.runId, moves: game.moves });
  while (game.status === "running") {
    game = gameReducer(game, { type: "tick", runId: game.runId });
  }
  assert.equal(game.status, "won");
  assert.equal(pandaScore(game).stars, 3);

  const written = persistPandaAttempt(store, save, raw, game);
  assert(written.success);
  assert.equal(written.save.completed, 51);
  assert.equal(written.save.best["51"], 3);

  const reloaded = readPandaSave(store);
  assert.equal(reloaded.status, "ready");
  assert.equal(reloaded.save.completed, 51);
  assert.equal(reloaded.save.best["51"], 3);

  const restored = restorePandaGame(reloaded.save, store);
  assert(restored);
  assert.equal(restored.status, "won");
  assert.equal(pandaScore(restored).stars, 3);
});

test("5. Loss reload: preserves loss state and move count without awarding progress", () => {
  const store = createQualifiedStore(50, 120);
  const init = initializePandaSave(store);
  assert(init.success);
  const { save, raw } = init;

  const level = pandaLevel(51);
  let game = initialGame(level);
  // Exhaust moves on an editable non-solution tile to trigger loss
  for (let m = 0; m < level.moveLimit; m++) {
    game = gameReducer(game, { type: "rotate", index: 0 });
  }
  assert.equal(game.moves, level.moveLimit);
  assert.equal(game.status, "lost");

  const written = persistPandaAttempt(store, save, raw, game);
  assert(written.success);
  assert.equal(written.save.completed, 50); // Did not advance
  assert.equal(written.save.best["51"], undefined);

  const restored = restorePandaGame(written.save, store);
  assert(restored);
  assert.equal(restored.status, "lost");
  assert.equal(restored.moves, level.moveLimit);
});

test("6. Replay: never lowers earned best stars", () => {
  const store = createQualifiedStore(50, 120);
  const init = initializePandaSave(store);
  assert(init.success);

  // First complete 51..54 so 55 is accessible
  let currentSave = init.save;
  let currentRaw = init.raw;
  for (let id = 51; id <= 54; id++) {
    let g = initialGame(pandaLevel(id));
    for (const idx of PANDA_PLANS[id].stars) g = gameReducer(g, { type: "rotate", index: idx });
    g = gameReducer(g, { type: "auto", runId: g.runId, moves: g.moves });
    while (g.status === "running") g = gameReducer(g, { type: "tick", runId: g.runId });
    const p = persistPandaAttempt(store, currentSave, currentRaw, g);
    assert(p.success);
    currentSave = p.save;
    currentRaw = p.raw;
  }
  assert.equal(currentSave.completed, 54);

  // Win Level 55 with 3 stars
  let g55 = initialGame(pandaLevel(55));
  for (const idx of PANDA_PLANS[55].stars) g55 = gameReducer(g55, { type: "rotate", index: idx });
  g55 = gameReducer(g55, { type: "auto", runId: g55.runId, moves: g55.moves });
  while (g55.status === "running") g55 = gameReducer(g55, { type: "tick", runId: g55.runId });
  assert.equal(pandaScore(g55).stars, 3);
  const p55 = persistPandaAttempt(store, currentSave, currentRaw, g55);
  assert(p55.success);
  assert.equal(p55.save.best["55"], 3);

  // Replay Level 55 with 1 star (short route)
  let replayG55 = initialGame(pandaLevel(55));
  for (const idx of PANDA_PLANS[55].short) replayG55 = gameReducer(replayG55, { type: "rotate", index: idx });
  replayG55 = gameReducer(replayG55, { type: "auto", runId: replayG55.runId, moves: replayG55.moves });
  while (replayG55.status === "running") replayG55 = gameReducer(replayG55, { type: "tick", runId: replayG55.runId });
  assert.equal(pandaScore(replayG55).stars, 1);

  const replayP = persistPandaAttempt(store, p55.save, p55.raw, replayG55);
  assert(replayP.success);
  assert.equal(replayP.save.best["55"], 3, "Replay must NOT lower best stars from 3 to 1");
});

test("7. Corrupted save handling: corrupt bytes preserved without wipe or overwrite", () => {
  const store = new MemoryStore();
  const corruptPayload = "{ corrupt json payload: 12345 }";
  store.setItem(PANDA_SAVE_KEY, corruptPayload);

  const read = readPandaSave(store);
  assert.equal(read.status, "corrupt");
  assert.equal(store.getItem(PANDA_SAVE_KEY), corruptPayload, "Corrupt bytes must remain untouched");

  // Attempting to initialize when corrupt must fail closed to protect data
  const init = initializePandaSave(store);
  assert.equal(init.success, false);
  assert.equal(store.getItem(PANDA_SAVE_KEY), corruptPayload);
});

test("8. Milestone star gates inside Panda World enforce star requirements", () => {
  // Gate 60 requires 15 stars from 51–59
  // If completed is 59 but player only earned 9 stars (1 star each):
  const lowBest: Record<string, number> = {};
  for (let id = 51; id <= 59; id++) lowBest[String(id)] = 1;

  const accessLocked = evaluatePandaAccess(60, 59, lowBest);
  assert.equal(accessLocked.accessible, false);
  if (!accessLocked.accessible) {
    assert.equal(accessLocked.reason, "star_gate_locked");
    assert.equal(accessLocked.requiredStars, 15);
    assert.equal(accessLocked.currentStars, 9);
  }

  // With 15 stars, Gate 60 opens
  for (let id = 51; id <= 55; id++) lowBest[String(id)] = 3;
  const accessOpen = evaluatePandaAccess(60, 59, lowBest);
  assert.equal(accessOpen.accessible, true);
});

test("9. Level 100 completion routes to Worlds view and keeps Worlds 3-5 locked", () => {
  const store = createQualifiedStore(50, 120);
  const init = initializePandaSave(store);
  assert(init.success);

  // Complete level 100 save
  const best: Record<string, number> = {};
  for (let id = 51; id <= 100; id++) best[String(id)] = 3;

  const completedSave: PandaSave = {
    ...init.save,
    completed: 100,
    currentLevelId: 100,
    best,
    updatedAt: new Date().toISOString(),
  };

  const resume = pandaResume(completedSave);
  assert.deepEqual(resume, { view: "worlds" });

  const screen = pandaScreen(resume, null, null);
  assert.equal(screen.view, "worlds");

  // Verify Worlds 3, 4, 5 are still locked ("Soon")
  const catAccess = evaluateWorldAccess(3, completedSave.completed, completedSave.best);
  assert.notEqual(catAccess.status, "available");

  const octopusAccess = evaluateWorldAccess(4, completedSave.completed, completedSave.best);
  assert.notEqual(octopusAccess.status, "available");

  const foxAccess = evaluateWorldAccess(5, completedSave.completed, completedSave.best);
  assert.notEqual(foxAccess.status, "available");
});
