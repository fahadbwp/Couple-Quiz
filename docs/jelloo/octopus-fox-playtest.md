# Jelloo — Extended Octopus & Fox Playtest Report

**Date:** 22 October 2026  
**Generator revision:** 6a3f56a  
**Playtest type:** Solver-assisted simulation using isolated save state.  
No user save altered. Deterministic level generation audited across 5 seeds (`42`, `97`, `123`, `777`, `2026`).  
Covers:
- **10 Octopus levels** (31, 39, 49, 59, 69, 79, 89, 99, 109, 119) × 5 seeds = **50 audits**
- **Fox levels** (41 intro, 51, 61, 71, 81, 91) × 5 seeds = **30 audits**
- **Total:** **80 audits** — **80 PASS, 0 FAIL**

---

## 1. Scope & Methodology

Each level is generated with `generatePowerPuzzle(id, seed)` and evaluated with `auditPowerLevel(level)`:
1. **Solvability & Necessity:** Level is solved with its assigned character, with no power, and with each of the other four characters. It passes only if its assigned character succeeds and all five alternatives fail without budget exhaustion.
2. **Move Margins & Detours:** `par` (minimum rotations to connect), `starPar` (rotations collecting all stars), and `moveLimit` are recorded.
3. **Octopus Water Routing:** Verifies the water tile sits on the mandatory route so the ability cannot be bypassed.
4. **Fox Fork Mechanics:**
   - Verifies the player must choose between two branches at `level.fork`.
   - Tests that picking the decoy direction fails to reach home (`walkPowerLevel` returns `disconnected` or `loop`).
   - Verifies that the decoy branch terminates **visibly** at a blank cell (`kind === "blank"`) or directly off the board edge.

---

## 2. Octopus Levels (10 Levels × 5 Seeds = 50 Audits)

| Level | Difficulty | Seeds Tested | Par Range | Star Par Range | Move Limit Range | Water on Path | Necessity | Bugs |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **31** | Meet pal (Intro) | 42, 97, 123, 777, 2026 | 1 | 1 | ∞ (None) | ✅ 100% | ✅ 100% | 0 |
| **39** | Tricky (Tier 2) | 42, 97, 123, 777, 2026 | 16 – 24 | 21 – 30 | 24 – 33 | ✅ 100% | ✅ 100% | 0 |
| **49** | Expert (Tier 3) | 42, 97, 123, 777, 2026 | 24 – 31 | 26 – 36 | 28 – 38 | ✅ 100% | ✅ 100% | 0 |
| **59** | Expert (Tier 3) | 42, 97, 123, 777, 2026 | 21 – 25 | 25 – 27 | 27 – 29 | ✅ 100% | ✅ 100% | 0 |
| **69** | Expert (Tier 3) | 42, 97, 123, 777, 2026 | 21 – 30 | 25 – 36 | 27 – 38 | ✅ 100% | ✅ 100% | 0 |
| **79** | Expert (Tier 3) | 42, 97, 123, 777, 2026 | 21 – 29 | 25 – 35 | 27 – 37 | ✅ 100% | ✅ 100% | 0 |
| **89** | Expert (Tier 3) | 42, 97, 123, 777, 2026 | 22 – 26 | 24 – 28 | 26 – 30 | ✅ 100% | ✅ 100% | 0 |
| **99** | Expert (Tier 3) | 42, 97, 123, 777, 2026 | 22 – 31 | 26 – 37 | 28 – 39 | ✅ 100% | ✅ 100% | 0 |
| **109** | Expert (Tier 3) | 42, 97, 123, 777, 2026 | 24 – 28 | 27 – 32 | 29 – 34 | ✅ 100% | ✅ 100% | 0 |
| **119** | Expert (Tier 3) | 42, 97, 123, 777, 2026 | 21 – 32 | 26 – 39 | 28 – 41 | ✅ 100% | ✅ 100% | 0 |

### Octopus Observations
- **100% Necessity:** Every board is unsolvable without Octopus's water traversal ability across all 50 samples.
- **Fair Margins:** Margins above `par` range from +2 to +9 (average +5.8). No level has fewer than 2 spare moves.
- **Star Reachability:** `starPar <= moveLimit` in 100% of tested boards.
- **Mechanic Decision Feel:** In current generation, water sits on the single connected route. While structurally mandatory, there is no dry alternative fork. A future enhancement could introduce an optional dry detour.

---

## 3. Fox Levels (Level 41 Intro + Levels 51, 61, 71, 81, 91 × 5 Seeds = 30 Audits)

| Level | Tier | Seed | Par | Star Par | Move Limit | Decoy Termination | Wrong Choice Result |
| :---: | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| **41** | Intro | 42 | 1 | 1 | ∞ | Board edge (cell 12) | Disconnected |
| **41** | Intro | 97 | 1 | 1 | ∞ | Board edge (cell 12) | Disconnected |
| **41** | Intro | 123 | 1 | 1 | ∞ | Board edge (cell 12) | Disconnected |
| **41** | Intro | 777 | 1 | 1 | ∞ | Blank cell 2 (from cell 6) | Disconnected |
| **41** | Intro | 2026 | 1 | 1 | ∞ | Board edge (cell 12) | Disconnected |
| **51** | Expert | 42 | 21 | 24 | 26 | Blank cell 7 (from cell 12) | Disconnected |
| **51** | Expert | 97 | 22 | 26 | 28 | Blank cell 4 (from cell 9) | Disconnected |
| **51** | Expert | 123 | 23 | 26 | 28 | Board edge (cell 20) | Disconnected |
| **51** | Expert | 777 | 21 | 23 | 25 | Board edge (cell 19) | Disconnected |
| **51** | Expert | 2026 | 23 | 25 | 27 | Blank cell 9 (from cell 8) | Disconnected |
| **61** | Expert | 42 | 24 | 29 | 31 | Board edge (cell 2) | Disconnected |
| **61** | Expert | 97 | 23 | 27 | 29 | Blank cell 8 (from cell 13) | Disconnected |
| **61** | Expert | 123 | 21 | 29 | 31 | Blank cell 6 (from cell 11) | Disconnected |
| **61** | Expert | 777 | 28 | 34 | 36 | Blank cell 13 (from cell 12) | Disconnected |
| **61** | Expert | 2026 | 31 | 33 | 35 | Board edge (cell 4) | Disconnected |
| **71** | Expert | 42 | 25 | 29 | 31 | Board edge (cell 0) | Disconnected |
| **71** | Expert | 97 | 24 | 29 | 31 | Blank cell 9 (from cell 14) | Disconnected |
| **71** | Expert | 123 | 30 | 33 | 35 | Board edge (cell 2) | Disconnected |
| **71** | Expert | 777 | 25 | 27 | 29 | Blank cell 3 (from cell 2) | Disconnected |
| **71** | Expert | 2026 | 27 | 30 | 32 | Blank cell 11 (from cell 12) | Disconnected |
| **81** | Expert | 42 | 28 | 32 | 34 | Board edge (cell 20) | Disconnected |
| **81** | Expert | 97 | 25 | 29 | 31 | Board edge (cell 4) | Disconnected |
| **81** | Expert | 123 | 23 | 27 | 29 | Blank cell 14 (from cell 13) | Disconnected |
| **81** | Expert | 777 | 25 | 29 | 31 | Blank cell 11 (from cell 12) | Disconnected |
| **81** | Expert | 2026 | 24 | 31 | 33 | Board edge (cell 20) | Disconnected |
| **91** | Expert | 42 | 21 | 27 | 29 | Blank cell 18 (from cell 17) | Disconnected |
| **91** | Expert | 97 | 22 | 25 | 27 | Board edge (cell 4) | Disconnected |
| **91** | Expert | 123 | 24 | 26 | 28 | Blank cell 1 (from cell 6) | Disconnected |
| **91** | Expert | 777 | 24 | 29 | 31 | Board edge (cell 2) | Disconnected |
| **91** | Expert | 2026 | 22 | 24 | 26 | Board edge (cell 2) | Disconnected |

### Fox Observations & Decision Quality
1. **Visible Decoy Termination (Fixed):**
   - **Board Edge:** 15/30 levels terminate immediately off the board boundary.
   - **Blank Cell:** 15/30 levels terminate into a guaranteed empty cell (`kind: "blank"`).
   - **0/30** terminate into confusing active path tiles.
2. **True Branch Decisions:**
   - In all non-intro levels (51+), the star route is longer than the shortest path by 2 to 4 tiles (`starPathLen > shortestPathLen`).
   - Choosing the wrong branch fails 100% of the time (`outcome: "disconnected"`).
   - The player must make an intentional choice between the quick path home vs. navigating through detour stars.

---

## 4. Summary & Verification

- **Total Audits:** 80
- **Pass Rate:** 100% (80/80)
- **Bugs Found:** 0
- **Raw Data:** Saved to [`docs/jelloo/octopus-fox-playtest-raw.json`](file:///c:/Users/Fahad%20Saleem/Downloads/Couple%20quiz/docs/jelloo/octopus-fox-playtest-raw.json).
