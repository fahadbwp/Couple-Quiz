# Jelloo Phase 2.1: Campaign Foundation Defect Corrections & Hardening

**Document Path:** `docs/jelloo/character-worlds/phase-2-1-corrections.md`  
**Date:** 27 October 2026  
**Status:** Complete — All 5 Foundation Defects Corrected, Regression-Tested & Verified  
**Branch:** `feature/character-worlds-phase2`  
**Authoritative Worktree:** `C:/Users/Fahad Saleem/.codex/worktrees/jelloo-victory-release/Couple quiz`  
**Base Release Commit:** `d5c7762fc61c64f79c34ea9e5b33617066d4d105`  

---

## 1. Executive Summary & Authoritative Location Confirmation

Following the Phase 2 foundation implementation, an independent audit identified five critical edge cases where foundation rules permitted unbuilt content access, inconsistent save state, premature in-progress board claims, bypass of gates during score recording, and destructive save overwrites.

All five defects have been systematically corrected, hardened, and verified with dedicated regression tests. No gameplay generation or visual UI redesign was introduced.

### Working Location Boundaries
- **Active Checkout:** `C:/Users/Fahad Saleem/.codex/worktrees/jelloo-victory-release/Couple quiz`
- **Active Branch:** `feature/character-worlds-phase2`
- **Protected Checkouts:**
  - `C:/Users/Fahad Saleem/Downloads/Couple quiz` remains untouched with its existing uncommitted changes and SEO history intact.
  - `C:/Users/Fahad Saleem/Documents/jellypals` is verified non-repository storage; no code was written there.
- **Remote Operations:** Strictly local. Zero pushes, merges, or remote deployments.

---

## 2. Independent Reproduction & Exact Defect Corrections

### Defect 1: Unbuilt Content Must Not Be Available
- **Symptom:** In Phase 2, `CHARACTER_WORLDS[0]` (Pink Candy Land) was labeled `availability: "available"`. Calling `evaluateLevelAccess(1, 0, {})` returned `accessible: true`, falsely advertising to callers that World 1 puzzles were ready to play before any Phase 3 generator existed.
- **Root Cause:** Conflating future campaign eligibility with actual puzzle content existence in production metadata.
- **Exact Fix in [`lib/jelloo/campaign.ts`](file:///C:/Users/Fahad%20Saleem/.codex/worktrees/jelloo-victory-release/Couple%20quiz/lib/jelloo/campaign.ts):**
  - All five worlds in `CHARACTER_WORLDS` are now strictly defined with `availability: "planned"`.
  - In production, `evaluateLevelAccess(1, 0, {})` returns `{ accessible: false, reason: "world_unimplemented" }`.
  - Content availability is decoupled from player progression: a player can be eligible for a world while the content remains unimplemented.
  - Tests explicitly inject a disposable predicate (`overrideAvailability = () => "available"`) when testing progression logic without modifying production constants.

### Defect 2: Reject Inconsistent Save Achievements
- **Symptom:** `validateCampaignV2Schema` accepted saves with future achievements (`completed: 0`, `currentLevelId: 1`, `best: { "50": 3 }`), accepted unknown object keys, and accepted non-standard timestamps.
- **Root Cause:** Loose object validation and missing correlation checks between `completed` and keys in `best`.
- **Exact Fix in [`lib/jelloo/campaign-save.ts`](file:///C:/Users/Fahad%20Saleem/.codex/worktrees/jelloo-victory-release/Couple%20quiz/lib/jelloo/campaign-save.ts):**
  - Strict key-whitelist checking: only approved keys (`version`, `campaignId`, `completed`, `currentLevelId`, `best`, `inProgressBoard`, `motion`, `muted`, `createdAt`, `updatedAt`) are accepted. Any unknown field immediately fails validation.
  - Forward-award rejection: every level ID in `best` must satisfy `Number(id) <= completed`. Stars cannot be awarded for levels higher than the recorded `completed` count.
  - Integer bounds: `completed` must be an integer in `[0, 250]`; `currentLevelId` must be in `[1, 250]`; star values must be safe integers in `[1, 3]`.
  - Strict ISO 8601 timestamp validation: verified via `new Date(ts).toISOString() === ts`.

### Defect 3: Do Not Accept Unvalidated In-Progress Boards
- **Symptom:** Saves containing an `inProgressBoard` object (e.g. `levelId: 250`, `moves: 999` while `currentLevelId: 1`) were accepted as valid and returned `status: "ready"`.
- **Root Cause:** Premature acceptance of arbitrary board states without generator-backed geometric and rotational validation.
- **Exact Fix in [`lib/jelloo/campaign-save.ts`](file:///C:/Users/Fahad%20Saleem/.codex/worktrees/jelloo-victory-release/Couple%20quiz/lib/jelloo/campaign-save.ts):**
  - Schema consistency: if `inProgressBoard` is present, `inProgressBoard.levelId` MUST strictly equal `save.currentLevelId`. Mismatched boards fail validation.
  - Board isolation status: `readCampaignV2Save` returns `status: "unsupported_in_progress_board"` whenever `inProgressBoard` is present.
  - Raw byte preservation: raw save bytes are preserved completely; bytes are NEVER silently discarded or reset to a fresh board.
  - Documented Future Contract: Full board validation is explicitly deferred to the Phase 3 generator, where deterministic board seeds, rotation validity, and tile geometry can be verified against the level rules.

### Defect 4: Score Recording Must Respect Central Access Policy
- **Symptom:** `recordLevelResult(10, 3, 9, {})` advanced `completed` to 10 and awarded 3 stars, completely bypassing the Level 10 star gate (15 stars required).
- **Root Cause:** `recordLevelResult` did its own naive boundary check without consulting `evaluateLevelAccess`.
- **Exact Fix in [`lib/jelloo/campaign.ts`](file:///C:/Users/Fahad%20Saleem/.codex/worktrees/jelloo-victory-release/Couple%20quiz/lib/jelloo/campaign.ts):**
  - Integrated central policy: `recordLevelResult` delegates access evaluation directly to `evaluateLevelAccess`.
  - Gate & sequence enforcement: a player cannot record completion for Level 10 unless earlier levels yielded at least 15 stars. Direct calls for non-accessible levels fail with `{ success: false, reason: "level_not_accessible", accessFailureReason: ... }`.
  - Input validation: stars must be safe integers in `[1, 3]`; non-integers, `NaN`, `Infinity`, or negative values are rejected immediately with no state changes. No clamping is applied.
  - Score preservation: replays never decrease existing best star awards or duplicate completion counters.
  - Integration Boundary: Validating stars here confirms campaign rule eligibility. Engine-level puzzle victory verification remains a separate gameplay-runner integration requirement when the Phase 3 generator is wired.

### Defect 5: Prevent Corrupt / Conflicting Save Overwrites
- **Symptom:** `writeCampaignV2Save` overwrote corrupted destination data. `initializeCampaignV2(store, { force: true })` blindly blew away existing data. Empty strings were not distinguished from absent storage keys.
- **Root Cause:** Lack of optimistic concurrency checking and dangerous force-reset functionality.
- **Exact Fix in [`lib/jelloo/campaign-save.ts`](file:///C:/Users/Fahad%20Saleem/.codex/worktrees/jelloo-victory-release/Couple%20quiz/lib/jelloo/campaign-save.ts):**
  - Removal of force reset: deleted `{ force?: boolean }` completely. No reset workflow is permitted without explicit product approval.
  - Absence distinction: `store.getItem(CAMPAIGN_V2_SAVE_KEY) === null` strictly represents an absent key. An empty string `""` is treated as an existing corrupt payload and is preserved untouched.
  - Conflict protection: `writeCampaignV2Save` requires `expectedPreviousRaw`. If the current value in storage does not strictly match `expectedPreviousRaw`, the write is rejected with `{ success: false, reason: "conflict_detected" }`.
  - Size limit: payloads exceeding 32 KB (`MAX_SAVE_PAYLOAD_BYTES = 32768`) are rejected before attempting storage operations.
  - Read-back verification: every write is verified immediately after execution; if `store.getItem(...) !== payload`, write returns `verification_failed`.
  - Concurrency Documentation: Documented multi-tab limitations inherent to web storage and the requirement for storage event synchronization.

---

## 3. Regression Test Coverage

The test suite in [`tests/jelloo-campaign-v2.test.ts`](file:///C:/Users/Fahad%20Saleem/.codex/worktrees/jelloo-victory-release/Couple%20quiz/tests/jelloo-campaign-v2.test.ts) was expanded to 11 comprehensive suites:

1. **Defect 1 Reproduction & Fix:** Verifies all 5 worlds in production metadata are `"planned"`, and Level 1 access is rejected as `world_unimplemented` unless an explicit test fixture is provided.
2. **World Boundaries & Mascots:** Verifies exact 50-level chunks and mascots across all 250 levels.
3. **Defect 2 Reproduction & Fix:** Validates rejection of forward awards (`best: { "50": 3 }` on `completed: 0`), unknown object keys, and non-ISO timestamps.
4. **Defect 3 Reproduction & Fix:** Validates rejection of board level mismatch and reports `unsupported_in_progress_board` while preserving raw bytes.
5. **Defect 4 Reproduction & Fix:** Validates rejection of Level 10 recording when 15-star gate is unmet; verifies rejection of `NaN`, `Infinity`, and floats.
6. **Defect 5 Reproduction & Fix (Init):** Verifies initialization writes only to `null` keys and preserves empty string `""` and corrupt bytes.
7. **Defect 5 Reproduction & Fix (Write):** Verifies `expectedPreviousRaw` conflict detection, 32 KB payload bounds, read-back verification tampering detection, and quota handling.
8. **Legacy Save Preservation:** Confirms `jelloo.progress.v1` bytes remain completely untouched through all valid and rejected operations.
9. **Star Gates Exact Boundaries:** Tests exact threshold, threshold - 1, and threshold + 1 for gates at levels 10, 20, 30, 40, and 50.
10. **Replay Access:** Confirms completed levels remain replayable even when subsequent milestone gates are locked.
11. **World Unlock Invariant:** Verifies World 2 unlock requires BOTH Level 50 completion AND >= 120 earned stars in World 1.

---

## 4. Verification Quality Gates Results

All five verification gates were executed locally in `C:/Users/Fahad Saleem/.codex/worktrees/jelloo-victory-release/Couple quiz`:

| Quality Gate | Command | Result | Notes |
| :--- | :--- | :--- | :--- |
| **1. Focused Campaign Test** | `node --import ./tests/setup.mjs --import tsx --test "tests/jelloo-campaign-v2.test.ts"` | **PASS** | 11 tests passed, 0 failed, duration ~693ms |
| **2. TypeScript Typecheck** | `npx tsc --noEmit` | **PASS** | Exit code 0, 0 type errors |
| **3. ESLint Verification** | `npx eslint lib/jelloo/campaign.ts lib/jelloo/campaign-save.ts tests/jelloo-campaign-v2.test.ts` | **PASS** | Exit code 0, 0 errors, 0 warnings in campaign files |
| **4. Full Test Suite** | `npm test` | **PASS** | 356 tests total: 351 passed, 0 failed, 5 skipped (remote Supabase credentials) |
| **5. Production Build** | `npm run build` | **PASS** | Next.js 15.5.28 compiled successfully in 14.9s; 22 static pages generated |

---

## 5. Strict Integration Boundaries

- **Puzzles Not Generated:** No World 1 puzzles were generated. All production metadata indicates `planned`.
- **UI Preserved:** No gameplay boards, character selection screen, or world map visual components were modified.
- **Legacy Compatibility:** All legacy Campaign v1 tests pass and historical progress keys remain isolated.
- **Phase 3 Readiness:** Campaign v2 foundation is fully hardened and verified. Further save-write and initialization protections were subsequently added in Phase 2.2 (see `phase-2-2-final-save-review.md`). Ready for Phase 3 (World 1 procedural puzzle generation & solver integration).
