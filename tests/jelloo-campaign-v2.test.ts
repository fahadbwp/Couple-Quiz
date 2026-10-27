import test from "node:test";
import assert from "node:assert/strict";
import {
  CHARACTER_WORLDS,
  LOCAL_STAR_GATES,
  NEXT_WORLD_STAR_THRESHOLD,
  TOTAL_CAMPAIGN_LEVELS,
  WORLD_LEVEL_COUNT,
  worldForCampaignLevel,
  toLocalLevel,
  toGlobalLevel,
  getEarnedStarsForWorld,
  getEarnedStarsBeforeLocalLevel,
  evaluateWorldAccess,
  evaluateLevelAccess,
  recordLevelResult,
} from "../lib/jelloo/campaign";
import {
  CAMPAIGN_V2_SAVE_KEY,
  LEGACY_SAVE_KEY,
  MAX_SAVE_PAYLOAD_BYTES,
  validateCampaignV2Schema,
  readCampaignV2Save,
  readLegacySaveBytes,
  writeCampaignV2Save,
  initializeCampaignV2,
  isValidIsoTimestamp,
  type CharacterWorldsSave,
  type StorageWriter,
} from "../lib/jelloo/campaign-save";

class MemoryStorage implements StorageWriter {
  public data = new Map<string, string>();
  public writes: string[] = [];
  public throwOnSet = false;
  public throwOnGet = false;
  public tamperOnWrite: string | null = null;

  getItem(key: string): string | null {
    if (this.throwOnGet) throw new Error("SecurityError: Storage access denied");
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    if (this.throwOnSet) throw new Error("QuotaExceededError: storage full");
    this.writes.push(key);
    this.data.set(key, this.tamperOnWrite ?? value);
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
}

// Helper: disposable availability predicate for tests needing unlocked content
const allAvailableFixture = () => "available" as const;

function buildBestStars(startId: number, count: number, starsPerLevel = 3): Record<string, number> {
  const result: Record<string, number> = {};
  for (let i = 0; i < count; i++) {
    result[String(startId + i)] = starsPerLevel;
  }
  return result;
}

// -----------------------------------------------------------------------------
// 1. Defect 1: Unbuilt Content Must Be Planned / Unavailable
// -----------------------------------------------------------------------------

test("Defect 1 Fix: Production metadata marks all unbuilt worlds as planned; Level 1 access is rejected without content", () => {
  assert.equal(CHARACTER_WORLDS.length, 5);
  assert.equal(TOTAL_CAMPAIGN_LEVELS, 250);
  assert.equal(WORLD_LEVEL_COUNT, 50);
  assert.equal(NEXT_WORLD_STAR_THRESHOLD, 120);
  assert.equal(MAX_SAVE_PAYLOAD_BYTES, 32 * 1024);
  assert.equal(LOCAL_STAR_GATES[10], 15);
  assert.equal(toGlobalLevel(1, 1), 1);
  assert.equal(toGlobalLevel(2, 1), 51);
  assert.equal(getEarnedStarsForWorld(CHARACTER_WORLDS[0], { "1": 3, "2": 2 }), 5);

  // Invariant: Production metadata must NOT claim World 1 exists before generator is built
  for (const world of CHARACTER_WORLDS) {
    assert.equal(
      world.availability,
      "planned",
      `World ${world.name} must be 'planned' in production metadata until its generator is built.`
    );
  }

  // Reproduction of Defect 1: evaluateLevelAccess(1, 0, {}) must return world_unimplemented by default
  const defaultAccess = evaluateLevelAccess(1, 0, {});
  assert.equal(defaultAccess.accessible, false);
  if (!defaultAccess.accessible) {
    assert.equal(defaultAccess.reason, "world_unimplemented");
    assert.ok(defaultAccess.details.includes("planned and not yet available"));
  }

  // With an explicit disposable available fixture, Level 1 becomes accessible
  const fixtureAccess = evaluateLevelAccess(1, 0, {}, allAvailableFixture);
  assert.equal(fixtureAccess.accessible, true);
  if (fixtureAccess.accessible) {
    assert.equal(fixtureAccess.world.id, "candy_land");
    assert.equal(fixtureAccess.isReplay, false);
    assert.equal(fixtureAccess.localLevel, 1);
  }
});

test("World Boundaries: exact 50-level chunks and mascots across all 250 levels", () => {
  const boundaries = [
    { id: 1, world: "candy_land", local: 1 },
    { id: 50, world: "candy_land", local: 50 },
    { id: 51, world: "bamboo_jungle", local: 1 },
    { id: 100, world: "bamboo_jungle", local: 50 },
    { id: 101, world: "cozy_rooftops", local: 1 },
    { id: 150, world: "cozy_rooftops", local: 50 },
    { id: 151, world: "ocean_paradise", local: 1 },
    { id: 200, world: "ocean_paradise", local: 50 },
    { id: 201, world: "enchanted_forest", local: 1 },
    { id: 250, world: "enchanted_forest", local: 50 },
  ];

  for (const b of boundaries) {
    const w = worldForCampaignLevel(b.id);
    assert.ok(w, `Level ${b.id} must map to a world`);
    assert.equal(w.id, b.world);
    assert.equal(toLocalLevel(b.id), b.local);
  }

  for (const invalid of [0, 251, -5, 999, NaN, 1.5]) {
    assert.equal(worldForCampaignLevel(invalid), null);
    assert.equal(toLocalLevel(invalid), null);
  }
});

// -----------------------------------------------------------------------------
// 2. Defect 2: Reject Inconsistent Save Achievements & Schema
// -----------------------------------------------------------------------------

test("Defect 2 Fix: validateCampaignV2Schema rejects forward awards, unknown fields, and malformed timestamps", () => {
  const validSave: CharacterWorldsSave = {
    version: 2,
    campaignId: "character_worlds_v2",
    completed: 10,
    currentLevelId: 11,
    best: { "1": 3, "5": 2, "10": 3 },
    motion: true,
    muted: false,
    createdAt: "2026-10-27T12:00:00.000Z",
    updatedAt: "2026-10-27T12:00:00.000Z",
  };
  assert.equal(validateCampaignV2Schema(validSave), true);

  // Reproduction of Defect 2: completed: 0, currentLevelId: 1, best: { "50": 3 } must be REJECTED
  const defect2Payload = {
    ...validSave,
    completed: 0,
    currentLevelId: 1,
    best: { "50": 3 },
  };
  assert.equal(
    validateCampaignV2Schema(defect2Payload),
    false,
    "Must reject award for Level 50 when completed is 0"
  );

  // Award for level above completed (e.g. completed: 10, best includes level 11)
  const forwardAward = {
    ...validSave,
    completed: 10,
    currentLevelId: 11,
    best: { "1": 3, "11": 3 },
  };
  assert.equal(validateCampaignV2Schema(forwardAward), false);

  // Unknown fields rejected
  const unknownField = { ...validSave, unexpectedProperty: "malicious" };
  assert.equal(validateCampaignV2Schema(unknownField), false);

  // Malformed / non-ISO timestamps rejected
  assert.equal(validateCampaignV2Schema({ ...validSave, createdAt: "not a date" }), false);
  assert.equal(validateCampaignV2Schema({ ...validSave, updatedAt: "" }), false);
  assert.equal(validateCampaignV2Schema({ ...validSave, createdAt: 1234567 }), false);

  // Invalid star values: non-integer, <= 0, > 3
  assert.equal(validateCampaignV2Schema({ ...validSave, best: { "1": 2.5 } }), false);
  assert.equal(validateCampaignV2Schema({ ...validSave, best: { "1": 0 } }), false);
  assert.equal(validateCampaignV2Schema({ ...validSave, best: { "1": 4 } }), false);
  assert.equal(validateCampaignV2Schema({ ...validSave, best: { "1": NaN } }), false);

  // Invalid level IDs in best
  assert.equal(validateCampaignV2Schema({ ...validSave, best: { "0": 3 } }), false);
  assert.equal(validateCampaignV2Schema({ ...validSave, best: { "-1": 3 } }), false);
  assert.equal(validateCampaignV2Schema({ ...validSave, best: { "251": 3 } }), false);
  assert.equal(validateCampaignV2Schema({ ...validSave, best: { "abc": 3 } }), false);

  // currentLevelId cannot be ahead of completed + 1
  assert.equal(validateCampaignV2Schema({ ...validSave, completed: 5, currentLevelId: 8 }), false);
});

// -----------------------------------------------------------------------------
// 3. Defect 3: Do Not Accept Unvalidated In-Progress Boards
// -----------------------------------------------------------------------------

test("Defect 3 Fix: Mismatched in-progress boards are rejected; valid boards report unsupported_in_progress_board", () => {
  const baseSave: CharacterWorldsSave = {
    version: 2,
    campaignId: "character_worlds_v2",
    completed: 0,
    currentLevelId: 1,
    best: {},
    motion: true,
    muted: false,
    createdAt: "2026-10-27T12:00:00.000Z",
    updatedAt: "2026-10-27T12:00:00.000Z",
  };

  // Reproduction of Defect 3: board levelId mismatch (levelId: 250 on currentLevelId: 1)
  const mismatchedBoard = {
    ...baseSave,
    inProgressBoard: {
      levelId: 250,
      moves: 999,
      rotations: [],
    },
  };
  assert.equal(
    validateCampaignV2Schema(mismatchedBoard),
    false,
    "Schema must reject in-progress board whose levelId does not match currentLevelId"
  );

  // Board with unknown properties rejected
  const unknownBoardProp = {
    ...baseSave,
    inProgressBoard: {
      levelId: 1,
      moves: 5,
      rotations: [0, 1, 2],
      hackedState: true,
    },
  };
  assert.equal(validateCampaignV2Schema(unknownBoardProp), false);

  // Schema-valid board structure:
  const validBoardSave: CharacterWorldsSave = {
    ...baseSave,
    inProgressBoard: {
      levelId: 1,
      moves: 3,
      rotations: [1, 2, 0, 3],
    },
  };
  assert.equal(validateCampaignV2Schema(validBoardSave), true);

  // Invariant: readCampaignV2Save MUST NOT return a board-bearing save as ready!
  const store = new MemoryStorage();
  store.setItem(CAMPAIGN_V2_SAVE_KEY, JSON.stringify(validBoardSave));

  const readResult = readCampaignV2Save(store);
  assert.equal(
    readResult.status,
    "unsupported_in_progress_board",
    "Must return unsupported_in_progress_board state until Phase 3 generator exists"
  );
  if (readResult.status === "unsupported_in_progress_board") {
    // Invariant: raw bytes and save data are preserved, NOT discarded or reset!
    assert.equal(readResult.save.inProgressBoard?.levelId, 1);
    assert.equal(readResult.save.inProgressBoard?.moves, 3);
    assert.ok(readResult.raw.includes('"rotations":[1,2,0,3]'));
    assert.ok(readResult.error.includes("Phase 3 generator"));
  }
});

// -----------------------------------------------------------------------------
// 4. Defect 4: Score Recording Must Respect the Access Policy
// -----------------------------------------------------------------------------

test("Defect 4 Fix: recordLevelResult strictly enforces gates, availability, sequential access, and valid inputs", () => {
  // Reproduction of Defect 4: recordLevelResult(10, 3, 9, {}) must be REJECTED because Gate 10 is unmet
  const defect4Run = recordLevelResult(10, 3, 9, {}, allAvailableFixture);
  assert.equal(
    defect4Run.success,
    false,
    "Must reject recording result on Level 10 when 15-star gate is not met"
  );
  if (!defect4Run.success) {
    assert.equal(defect4Run.reason, "level_not_accessible");
    assert.equal(defect4Run.accessFailureReason, "star_gate_locked");
  }

  // Rejection of invalid star numbers (no clamping!)
  for (const badStar of [NaN, Infinity, -1, 0, 2.5, 4, 100]) {
    const res = recordLevelResult(1, badStar, 0, {}, allAvailableFixture);
    assert.equal(res.success, false, `Must reject invalid star value: ${badStar}`);
    if (!res.success) {
      assert.equal(res.reason, "invalid_stars");
    }
  }

  // Rejection of invalid level IDs and completed counts
  assert.equal(recordLevelResult(0, 3, 0, {}, allAvailableFixture).success, false);
  assert.equal(recordLevelResult(251, 3, 0, {}, allAvailableFixture).success, false);
  assert.equal(recordLevelResult(1, 3, -1, {}, allAvailableFixture).success, false);
  assert.equal(recordLevelResult(1, 3, 251, {}, allAvailableFixture).success, false);

  // Rejection of skipped / non-sequential levels
  const skippedRes = recordLevelResult(5, 3, 2, {}, allAvailableFixture);
  assert.equal(skippedRes.success, false);
  if (!skippedRes.success) {
    assert.equal(skippedRes.accessFailureReason, "sequential_progression_locked");
  }

  // Rejection when world content is unbuilt (production default)
  const unbuiltRun = recordLevelResult(1, 3, 0, {});
  assert.equal(unbuiltRun.success, false);
  if (!unbuiltRun.success) {
    assert.equal(unbuiltRun.accessFailureReason, "world_unimplemented");
  }

  // Valid first completion with available fixture
  const validFirst = recordLevelResult(1, 3, 0, {}, allAvailableFixture);
  assert.equal(validFirst.success, true);
  if (validFirst.success) {
    assert.equal(validFirst.newCompleted, 1);
    assert.equal(validFirst.newBest["1"], 3);
    assert.equal(validFirst.starsImproved, 3);
    assert.equal(validFirst.isFirstCompletion, true);
  }

  // Valid replay with worse score: score does NOT drop
  const replayWorse = recordLevelResult(1, 1, 1, { "1": 3 }, allAvailableFixture);
  assert.equal(replayWorse.success, true);
  if (replayWorse.success) {
    assert.equal(replayWorse.newCompleted, 1);
    assert.equal(replayWorse.newBest["1"], 3);
    assert.equal(replayWorse.starsImproved, 0);
    assert.equal(replayWorse.isFirstCompletion, false);
  }

  // Valid replay with improved score: updates best
  const replayBetter = recordLevelResult(1, 3, 1, { "1": 2 }, allAvailableFixture);
  assert.equal(replayBetter.success, true);
  if (replayBetter.success) {
    assert.equal(replayBetter.newBest["1"], 3);
    assert.equal(replayBetter.starsImproved, 1);
  }
});

// -----------------------------------------------------------------------------
// 5. Defect 5: Prevent Corrupt / Conflicting Save Overwrites
// -----------------------------------------------------------------------------

test("Defect 5 Fix: initializeCampaignV2 writes only to absent keys; rejects empty string, corrupt data, and occupied keys", () => {
  const store = new MemoryStorage();

  // A. Absent destination: successfully initializes fresh save
  const initSuccess = initializeCampaignV2(store);
  assert.equal(initSuccess.success, true);
  if (initSuccess.success) {
    assert.equal(initSuccess.save.completed, 0);
    assert.equal(initSuccess.save.currentLevelId, 1);
    assert.ok(initSuccess.raw.includes('"campaignId":"character_worlds_v2"'));
  }

  // B. Destination already occupied with valid save: rejected!
  const initOccupied = initializeCampaignV2(store);
  assert.equal(initOccupied.success, false);
  if (!initOccupied.success) {
    assert.equal(initOccupied.reason, "destination_occupied");
  }

  // C. Destination contains empty string (""): distinguishable from absent (null) and rejected!
  const storeEmpty = new MemoryStorage();
  storeEmpty.data.set(CAMPAIGN_V2_SAVE_KEY, "");
  const initEmpty = initializeCampaignV2(storeEmpty);
  assert.equal(initEmpty.success, false);
  if (!initEmpty.success) {
    assert.equal(initEmpty.reason, "destination_occupied");
    assert.ok(initEmpty.error.includes("empty content"));
  }

  // D. Destination contains corrupt bytes: preserved untouched and rejected!
  const storeCorrupt = new MemoryStorage();
  const corruptPayload = "{ broken json content";
  storeCorrupt.data.set(CAMPAIGN_V2_SAVE_KEY, corruptPayload);

  const initCorrupt = initializeCampaignV2(storeCorrupt);
  assert.equal(initCorrupt.success, false);
  if (!initCorrupt.success) {
    assert.equal(initCorrupt.reason, "destination_occupied");
  }
  // Invariant: corrupted bytes remain untouched
  assert.equal(storeCorrupt.getItem(CAMPAIGN_V2_SAVE_KEY), corruptPayload);
});

test("Defect 5 Fix: writeCampaignV2Save enforces expectedPreviousRaw, detects conflicts, verifies read-back, and respects limits", () => {
  const store = new MemoryStorage();
  const initRes = initializeCampaignV2(store);
  assert.equal(initRes.success, true);
  const initialRaw = (initRes as { raw: string }).raw;

  const validSave: CharacterWorldsSave = {
    version: 2,
    campaignId: "character_worlds_v2",
    completed: 1,
    currentLevelId: 2,
    best: { "1": 3 },
    motion: true,
    muted: false,
    createdAt: "2026-10-27T12:00:00.000Z",
    updatedAt: "2026-10-27T12:00:00.000Z",
  };

  // A. Successful update when expectedPreviousRaw matches
  const writeRes = writeCampaignV2Save(store, validSave, initialRaw);
  assert.equal(writeRes.success, true);
  const updatedRaw = (writeRes as { raw: string }).raw;

  // B. Conflict detection: attempting to write using stale snapshot is rejected!
  const staleSave = { ...validSave, completed: 2, currentLevelId: 3, best: { "1": 3, "2": 3 } };
  const conflictRes = writeCampaignV2Save(store, staleSave, initialRaw); // using old initialRaw
  assert.equal(conflictRes.success, false);
  if (!conflictRes.success) {
    assert.equal(conflictRes.reason, "conflict_detected");
    assert.ok(conflictRes.error.toLowerCase().includes("conflict"));
  }

  // C. Read-back verification failure: mock storage tampering
  store.tamperOnWrite = '{"hacked": true}';
  const tamperRes = writeCampaignV2Save(store, staleSave, updatedRaw);
  assert.equal(tamperRes.success, false);
  if (!tamperRes.success) {
    assert.equal(tamperRes.reason, "verification_failed");
  }
  store.tamperOnWrite = null;
  // Restore store to updatedRaw so subsequent tests have matching snapshot
  store.data.set(CAMPAIGN_V2_SAVE_KEY, updatedRaw);

  // D. Quota failure
  store.throwOnSet = true;
  const quotaRes = writeCampaignV2Save(store, staleSave, updatedRaw);
  assert.equal(quotaRes.success, false);
  if (!quotaRes.success) {
    assert.equal(quotaRes.reason, "storage_error");
  }
  store.throwOnSet = false;

  // E. Oversized payload (> 32 KB) rejected before write
  const hugeSave: CharacterWorldsSave = {
    ...validSave,
    createdAt: "x".repeat(33000), // exceeds 32 KB
  };
  const hugeRes = writeCampaignV2Save(store, hugeSave, updatedRaw);
  assert.equal(hugeRes.success, false);
  if (!hugeRes.success) {
    // Rejected either at schema date-parse or payload_too_large
    assert.ok(
      hugeRes.reason === "payload_too_large" || hugeRes.reason === "validation_failed"
    );
  }
});

// -----------------------------------------------------------------------------
// 6. Legacy Preservation & Storage Error Resilience
// -----------------------------------------------------------------------------

test("Legacy Preservation: jelloo.progress.v1 bytes remain unchanged through all rejected and valid operations", () => {
  const store = new MemoryStorage();
  const legacyRaw = JSON.stringify({
    version: 1,
    generator: 1,
    rules: 4,
    multiRevision: 3,
    seed: 42,
    completed: 75,
    id: 76,
    moves: 4,
    motion: true,
    won: false,
    rotations: [0, 1, 2, 3],
    best: { "1": 3, "2": 3, "75": 2 },
  });
  store.setItem(LEGACY_SAVE_KEY, legacyRaw);

  // Read legacy
  const legacyRead = readLegacySaveBytes(store);
  assert.equal(legacyRead.status, "present");
  assert.equal(legacyRead.raw, legacyRaw);

  // Initialize Campaign v2
  const init = initializeCampaignV2(store);
  assert.equal(init.success, true);
  assert.equal(store.getItem(LEGACY_SAVE_KEY), legacyRaw);

  // Failed Campaign v2 write (conflict)
  writeCampaignV2Save(
    store,
    {
      version: 2,
      campaignId: "character_worlds_v2",
      completed: 1,
      currentLevelId: 2,
      best: { "1": 3 },
      motion: true,
      muted: false,
      createdAt: "2026-10-27T12:00:00.000Z",
      updatedAt: "2026-10-27T12:00:00.000Z",
    },
    "wrong_snapshot"
  );
  assert.equal(store.getItem(LEGACY_SAVE_KEY), legacyRaw);

  // Storage access denied
  store.throwOnGet = true;
  assert.equal(readLegacySaveBytes(store).status, "storage_unavailable");
  assert.equal(readCampaignV2Save(store).status, "storage_unavailable");
  store.throwOnGet = false;

  assert.equal(store.getItem(LEGACY_SAVE_KEY), legacyRaw);
});

// -----------------------------------------------------------------------------
// 7. Star Gates & Replay Progression (with Available Content Fixture)
// -----------------------------------------------------------------------------

test("Star Gates: exact, one below, and above threshold for all world-local gates", () => {
  // Test helper: getEarnedStarsBeforeLocalLevel
  assert.equal(getEarnedStarsBeforeLocalLevel(CHARACTER_WORLDS[0], 1, {}), 0);
  assert.equal(getEarnedStarsBeforeLocalLevel(CHARACTER_WORLDS[0], 10, { "1": 3, "2": 2 }), 5);

  // Gate 10: requires 15 stars from local 1..9
  {
    const best14 = { "1": 3, "2": 3, "3": 3, "4": 3, "5": 2 };
    const resBelow = evaluateLevelAccess(10, 9, best14, allAvailableFixture);
    assert.equal(resBelow.accessible, false);
    if (!resBelow.accessible) {
      assert.equal(resBelow.reason, "star_gate_locked");
      assert.equal(resBelow.currentStars, 14);
      assert.equal(resBelow.requiredStars, 15);
      assert.equal(resBelow.lockedGateLocalLevel, 10);
    }

    const best15 = { "1": 3, "2": 3, "3": 3, "4": 3, "5": 3 };
    const resExact = evaluateLevelAccess(10, 9, best15, allAvailableFixture);
    assert.equal(resExact.accessible, true);
    if (resExact.accessible) assert.equal(resExact.isReplay, false);

    const best16 = { ...best15, "6": 1 };
    const resAbove = evaluateLevelAccess(10, 9, best16, allAvailableFixture);
    assert.equal(resAbove.accessible, true);
  }

  // Gate 20: requires 36 stars from local 1..19
  {
    const best35 = { ...buildBestStars(1, 11, 3), "12": 2 };
    const resBelow = evaluateLevelAccess(20, 19, best35, allAvailableFixture);
    assert.equal(resBelow.accessible, false);
    if (!resBelow.accessible) {
      assert.equal(resBelow.reason, "star_gate_locked");
      assert.equal(resBelow.currentStars, 35);
      assert.equal(resBelow.requiredStars, 36);
    }

    const best36 = buildBestStars(1, 12, 3);
    const resExact = evaluateLevelAccess(20, 19, best36, allAvailableFixture);
    assert.equal(resExact.accessible, true);

    const best37 = { ...best36, "13": 1 };
    const resAbove = evaluateLevelAccess(20, 19, best37, allAvailableFixture);
    assert.equal(resAbove.accessible, true);
  }

  // Gate 30: requires 60 stars from local 1..29
  {
    const best59 = { ...buildBestStars(1, 19, 3), "20": 2 };
    const resBelow = evaluateLevelAccess(30, 29, best59, allAvailableFixture);
    assert.equal(resBelow.accessible, false);
    if (!resBelow.accessible) {
      assert.equal(resBelow.reason, "star_gate_locked");
      assert.equal(resBelow.currentStars, 59);
      assert.equal(resBelow.requiredStars, 60);
    }

    const best60 = buildBestStars(1, 20, 3);
    const resExact = evaluateLevelAccess(30, 29, best60, allAvailableFixture);
    assert.equal(resExact.accessible, true);
  }

  // Gate 40: requires 84 stars from local 1..39
  {
    const best83 = { ...buildBestStars(1, 27, 3), "28": 2 };
    const resBelow = evaluateLevelAccess(40, 39, best83, allAvailableFixture);
    assert.equal(resBelow.accessible, false);
    if (!resBelow.accessible) {
      assert.equal(resBelow.reason, "star_gate_locked");
      assert.equal(resBelow.currentStars, 83);
      assert.equal(resBelow.requiredStars, 84);
    }

    const best84 = buildBestStars(1, 28, 3);
    const resExact = evaluateLevelAccess(40, 39, best84, allAvailableFixture);
    assert.equal(resExact.accessible, true);
  }

  // Gate 50: requires 110 stars from local 1..49
  {
    const best109 = { ...buildBestStars(1, 36, 3), "37": 1 };
    const resBelow = evaluateLevelAccess(50, 49, best109, allAvailableFixture);
    assert.equal(resBelow.accessible, false);
    if (!resBelow.accessible) {
      assert.equal(resBelow.reason, "star_gate_locked");
      assert.equal(resBelow.currentStars, 109);
      assert.equal(resBelow.requiredStars, 110);
    }

    const best110 = { ...buildBestStars(1, 36, 3), "37": 2 };
    const resExact = evaluateLevelAccess(50, 49, best110, allAvailableFixture);
    assert.equal(resExact.accessible, true);
  }
});

test("Replay access remains available for earlier completed levels when a later gate is locked", () => {
  const best = { "1": 2, "2": 2, "3": 2, "4": 2, "5": 2, "6": 2 }; // 12 stars
  const gate10 = evaluateLevelAccess(10, 9, best, allAvailableFixture);
  assert.equal(gate10.accessible, false);

  for (let l = 1; l <= 9; l++) {
    const replay = evaluateLevelAccess(l, 9, best, allAvailableFixture);
    assert.equal(replay.accessible, true, `Level ${l} must remain replayable`);
    if (replay.accessible) {
      assert.equal(replay.isReplay, true);
      assert.equal(replay.localLevel, l);
    }
  }
});

test("World Unlock: requires BOTH Level 50 completion AND >= 120 stars in World 1", () => {
  const best119 = { ...buildBestStars(1, 39, 3), "40": 2 }; // 119 stars
  const world2UnderStars = evaluateWorldAccess(2, 50, best119);
  assert.equal(world2UnderStars.status, "locked");
  if (world2UnderStars.status === "locked") {
    assert.equal(world2UnderStars.reason, "previous_world_stars_insufficient");
    assert.equal(world2UnderStars.requiredStars, 120);
    assert.equal(world2UnderStars.currentWorldStars, 119);
  }

  const exact120 = { ...buildBestStars(1, 20, 3), ...buildBestStars(21, 30, 2) }; // 120 stars
  const world2IncompleteFinale = evaluateWorldAccess(2, 49, exact120);
  assert.equal(world2IncompleteFinale.status, "locked");
  if (world2IncompleteFinale.status === "locked") {
    assert.equal(world2IncompleteFinale.reason, "previous_world_incomplete");
    assert.equal(world2IncompleteFinale.requiredLevel, 50);
  }

  // Both satisfied: reports eligible_but_unimplemented because World 2 is planned
  const world2Eligible = evaluateWorldAccess(2, 50, exact120);
  assert.equal(world2Eligible.status, "eligible_but_unimplemented");

  // With override fixture: reports available
  const world2Available = evaluateWorldAccess(2, 50, exact120, allAvailableFixture);
  assert.equal(world2Available.status, "available");

  const level51 = evaluateLevelAccess(51, 50, exact120, allAvailableFixture);
  assert.equal(level51.accessible, true);
});

// -----------------------------------------------------------------------------
// 12. Phase 2.2 Task 1: Protect Corrupt and Unsupported Destinations
// -----------------------------------------------------------------------------

test("Phase 2.2 Task 1: writeCampaignV2Save rejects corrupt, empty, unsupported and absent destinations even with exact matching snapshots", () => {
  const validSave: CharacterWorldsSave = {
    version: 2,
    campaignId: "character_worlds_v2",
    completed: 1,
    currentLevelId: 2,
    best: { "1": 3 },
    motion: true,
    muted: false,
    createdAt: "2026-10-27T12:00:00.000Z",
    updatedAt: "2026-10-27T12:00:00.000Z",
  };

  // Case A: Corrupt sentinel string with exact matching snapshot passed by caller
  const storeCorrupt = new MemoryStorage();
  const corruptSentinel = "corrupt-sentinel";
  storeCorrupt.data.set(CAMPAIGN_V2_SAVE_KEY, corruptSentinel);

  const resCorrupt = writeCampaignV2Save(storeCorrupt, validSave, corruptSentinel);
  assert.equal(resCorrupt.success, false);
  if (!resCorrupt.success) {
    assert.equal(resCorrupt.reason, "destination_corrupt");
    assert.equal(resCorrupt.currentRaw, corruptSentinel);
  }
  // Invariant: original bytes preserved untouched, zero writes performed
  assert.equal(storeCorrupt.getItem(CAMPAIGN_V2_SAVE_KEY), corruptSentinel);
  assert.equal(storeCorrupt.writes.length, 0);

  // Case B: Empty string ("") destination with exact matching snapshot
  const storeEmpty = new MemoryStorage();
  storeEmpty.data.set(CAMPAIGN_V2_SAVE_KEY, "");

  const resEmpty = writeCampaignV2Save(storeEmpty, validSave, "");
  assert.equal(resEmpty.success, false);
  if (!resEmpty.success) {
    assert.equal(resEmpty.reason, "destination_corrupt");
    assert.equal(resEmpty.currentRaw, "");
  }
  assert.equal(storeEmpty.getItem(CAMPAIGN_V2_SAVE_KEY), "");
  assert.equal(storeEmpty.writes.length, 0);

  // Case C: Structurally valid save containing unsupported inProgressBoard with exact matching snapshot
  const storeBoard = new MemoryStorage();
  const boardSave: CharacterWorldsSave = {
    version: 2,
    campaignId: "character_worlds_v2",
    completed: 0,
    currentLevelId: 1,
    best: {},
    motion: true,
    muted: false,
    createdAt: "2026-10-27T12:00:00.000Z",
    updatedAt: "2026-10-27T12:00:00.000Z",
    inProgressBoard: { levelId: 1, moves: 5, rotations: [0, 1] },
  };
  const boardRaw = JSON.stringify(boardSave);
  storeBoard.data.set(CAMPAIGN_V2_SAVE_KEY, boardRaw);

  const resBoard = writeCampaignV2Save(storeBoard, validSave, boardRaw);
  assert.equal(resBoard.success, false);
  if (!resBoard.success) {
    assert.equal(resBoard.reason, "destination_unsupported");
    assert.equal(resBoard.currentRaw, boardRaw);
  }
  // Invariant: board bytes preserved untouched, zero writes performed
  assert.equal(storeBoard.getItem(CAMPAIGN_V2_SAVE_KEY), boardRaw);
  assert.equal(storeBoard.writes.length, 0);

  // Case D: Absent destination (null) - normal update rejected, must use initializeCampaignV2
  const storeAbsent = new MemoryStorage();
  const resAbsent = writeCampaignV2Save(storeAbsent, validSave, "");
  assert.equal(resAbsent.success, false);
  if (!resAbsent.success) {
    assert.equal(resAbsent.reason, "destination_missing");
    assert.equal(resAbsent.currentRaw, null);
  }
  assert.equal(storeAbsent.getItem(CAMPAIGN_V2_SAVE_KEY), null);
  assert.equal(storeAbsent.writes.length, 0);

  // Case E: Ready destination with matching snapshot succeeds and verifies read-back
  const storeReady = new MemoryStorage();
  const initRes = initializeCampaignV2(storeReady);
  assert.equal(initRes.success, true);
  const initialRaw = (initRes as { raw: string }).raw;

  const resReady = writeCampaignV2Save(storeReady, validSave, initialRaw);
  assert.equal(resReady.success, true);
  assert.equal(storeReady.getItem(CAMPAIGN_V2_SAVE_KEY), JSON.stringify(validSave));
});

// -----------------------------------------------------------------------------
// 13. Phase 2.2 Task 2: Validate Initialization Before Writing & Strict ISO Calendar Timestamps
// -----------------------------------------------------------------------------

test("Phase 2.2 Task 2: initializeCampaignV2 validates complete save before write; rejects malformed and impossible dates with zero writes", () => {
  // Case A: Direct isValidIsoTimestamp unit tests
  assert.equal(isValidIsoTimestamp("2026-10-27T12:00:00.000Z"), true);
  assert.equal(isValidIsoTimestamp("2026-10-27T12:00:00Z"), true);
  assert.equal(isValidIsoTimestamp("2026-10-27T12:00:00+05:00"), true);
  assert.equal(isValidIsoTimestamp("2024-02-29T12:00:00.000Z"), true); // 2024 is leap year

  assert.equal(isValidIsoTimestamp("not-a-date"), false);
  assert.equal(isValidIsoTimestamp("October 27, 2026"), false);
  assert.equal(isValidIsoTimestamp("2026-02-29T12:00:00.000Z"), false); // 2026 is non-leap
  assert.equal(isValidIsoTimestamp("2026-04-31T00:00:00.000Z"), false); // April has 30 days
  assert.equal(isValidIsoTimestamp("2026-13-01T00:00:00.000Z"), false); // month 13
  assert.equal(isValidIsoTimestamp("2026-00-10T00:00:00.000Z"), false); // month 0
  assert.equal(isValidIsoTimestamp("2026-10-27T24:00:00.000Z"), false); // hour 24
  assert.equal(isValidIsoTimestamp(""), false);
  assert.equal(isValidIsoTimestamp(null), false);

  // Case B: initializeCampaignV2 with "not-a-date" is rejected with zero writes
  const storeNotDate = new MemoryStorage();
  const resNotDate = initializeCampaignV2(storeNotDate, { now: "not-a-date" });
  assert.equal(resNotDate.success, false);
  if (!resNotDate.success) {
    assert.equal(resNotDate.reason, "validation_failed");
    assert.ok(resNotDate.error.includes("Invalid ISO timestamp"));
  }
  assert.equal(storeNotDate.getItem(CAMPAIGN_V2_SAVE_KEY), null);
  assert.equal(storeNotDate.writes.length, 0);
  // Read confirms missing
  assert.equal(readCampaignV2Save(storeNotDate).status, "missing");

  // Case C: initializeCampaignV2 with "October 27, 2026" (accepted by Date.parse but NOT ISO) is rejected with zero writes
  const storeHumanDate = new MemoryStorage();
  const resHumanDate = initializeCampaignV2(storeHumanDate, { now: "October 27, 2026" });
  assert.equal(resHumanDate.success, false);
  if (!resHumanDate.success) {
    assert.equal(resHumanDate.reason, "validation_failed");
  }
  assert.equal(storeHumanDate.getItem(CAMPAIGN_V2_SAVE_KEY), null);
  assert.equal(storeHumanDate.writes.length, 0);

  // Case D: initializeCampaignV2 with impossible calendar dates rejected with zero writes
  const impossibleDates = [
    "2026-02-29T12:00:00.000Z", // 2026 is non-leap
    "2026-04-31T00:00:00.000Z", // April has 30 days
    "2026-13-01T00:00:00.000Z", // month 13
    "2026-00-10T00:00:00.000Z", // month 0
  ];
  for (const imp of impossibleDates) {
    const storeImp = new MemoryStorage();
    const resImp = initializeCampaignV2(storeImp, { now: imp });
    assert.equal(resImp.success, false, `Expected ${imp} to be rejected`);
    if (!resImp.success) {
      assert.equal(resImp.reason, "validation_failed");
    }
    assert.equal(storeImp.getItem(CAMPAIGN_V2_SAVE_KEY), null);
    assert.equal(storeImp.writes.length, 0);
  }

  // Case E: Occupied destination remains unchanged even if invalid options passed
  const storeOccupied = new MemoryStorage();
  storeOccupied.data.set(CAMPAIGN_V2_SAVE_KEY, '{"existing":"payload"}');
  const resOcc = initializeCampaignV2(storeOccupied, { now: "not-a-date" });
  assert.equal(resOcc.success, false);
  // Rejection happens before storage check or at validation_failed
  assert.equal(storeOccupied.getItem(CAMPAIGN_V2_SAVE_KEY), '{"existing":"payload"}');
  assert.equal(storeOccupied.writes.length, 0);

  // Case F: Valid ISO timestamp succeeds and round-trip read immediately reports ready
  const storeValid = new MemoryStorage();
  const validIso = "2026-10-27T12:30:00.000Z";
  const resValid = initializeCampaignV2(storeValid, { now: validIso });
  assert.equal(resValid.success, true);
  if (resValid.success) {
    assert.equal(resValid.save.createdAt, validIso);
    assert.equal(resValid.save.updatedAt, validIso);
  }
  const readBack = readCampaignV2Save(storeValid);
  assert.equal(readBack.status, "ready");
  if (readBack.status === "ready") {
    assert.equal(readBack.save.createdAt, validIso);
    assert.equal(readBack.save.completed, 0);
    assert.equal(readBack.save.currentLevelId, 1);
  }
});
