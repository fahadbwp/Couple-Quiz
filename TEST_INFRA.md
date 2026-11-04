# Daily Path (Pathle) — Test Infrastructure & 4-Tier Methodology

**Target System**: PlayNudge Daily Path (`/daily`)  
**Scope**: Features F1 through F15 across Tiers 1–4  
**Test Suite**: `tests/daily-e2e.test.ts`  
**Execution Command**: `node --import ./tests/setup.mjs --import tsx --test tests/daily-e2e.test.ts`  
**Standard Test Command**: `npm test`  

---

## 1. Test Philosophy & Architecture

### 1.1 Opaque-Box, Requirement-Driven Verification
The Daily Path E2E test suite adopts a strict **opaque-box testing methodology**. Tests are authored against the authoritative contracts defined in `PROJECT.md` and user requirements in `ORIGINAL_REQUEST.md` (R1–R6), rather than matching incidental implementation quirks. Every test case asserts observable behaviors, mathematical invariants, graph connectivity properties, and protocol adherence.

### 1.2 4-Tier Test Hierarchy
Testing is organized into four complementary tiers designed to guarantee both broad feature correctness and deep adversarial resilience:

```
+------------------------------------------------------------------+
|        Tier 4: Real-World Application User Scenarios             |
|   (7-day streak simulation, mobile share, archive lifecycle)     |
+------------------------------------------------------------------+
                                ▲
+------------------------------------------------------------------+
|           Tier 3: Cross-Feature Combinations                     |
|  (Solve->Share, Solve->Streak, Rollover->Preserve, Sponsor->Inv) |
+------------------------------------------------------------------+
                                ▲
+------------------------------------------------------------------+
|           Tier 2: Boundary & Corner Cases                        |
|  (Leap years, year rollovers, fixed tile clicks, corrupt stores)  |
+------------------------------------------------------------------+
                                ▲
+------------------------------------------------------------------+
|           Tier 1: Feature Coverage (F1 to F15)                   |
|  (Determinism, Solvability, Par, Rotation, Share, Storage, SEO)  |
+------------------------------------------------------------------+
```

1. **Tier 1 — Feature Coverage**: Comprehensive unit and functional verification of each feature in isolation (minimum 5 test cases per feature, covering all 15 features: $\ge 75$ tests).
2. **Tier 2 — Boundary & Corner Cases**: Stress-testing edge inputs, mathematical limits, leap years, century rollovers, illegal tile interactions, corrupted storage payloads, and network failures (minimum 5 test cases per feature: $\ge 75$ tests).
3. **Tier 3 — Cross-Feature Combinations**: Pairwise and multi-module integration testing verifying invariants across subsystem boundaries (Solve $\to$ Share Card $\to$ Regex invariant; Solve $\to$ LocalStorage $\to$ Rollover $\to$ Board Refresh $\to$ Streak Preservation; Sponsored Challenge $\to$ Board Determinism Invariant; Archive Replay $\to$ Active Streak Protection).
4. **Tier 4 — Real-World Application Scenarios**: Multi-step realistic user journeys simulating actual player engagement patterns (Full 7-day Monday-to-Sunday progression, multi-channel mobile sharing flows, historical archive discovery and anti-cheat boundaries, offline storage concurrency).

### 1.3 Progressive Testability & Fail-Safe Module Contracts
In a multi-agent parallel development lifecycle, milestone implementations land progressively:
- Milestone 1: Core Path Engine & Solver (`lib/daily/types.ts`, `lib/daily/prng.ts`, `lib/daily/engine.ts`, `lib/daily/solver.ts`)
- Milestone 2: Game UI & Interaction (`components/daily/*`, `app/daily/page.tsx`, `lib/daily/rollover.ts`)
- Milestone 3: Viral Share Card & Social Intents (`lib/daily/share.ts`)
- Milestone 4: Client Storage & Streaks (`lib/daily/storage.ts`)
- Milestone 5: Platform Integration & Monetization (`lib/platform/games.ts`, `lib/daily/sponsor.ts`, `components/daily/DailyAdSlot.tsx`)
- Milestone 6: SEO Archives, OpenGraph & Crawlability (`app/daily/archive/*`, `app/robots.ts`, `lib/platform/site.ts`)

The test suite uses progressive dynamic module resolution:
- When a module is present on disk, its real exported functions and components are directly executed and tested against the specification.
- For modules undergoing active development in upcoming milestones, tests verify file contracts, interface compliance, and fallback reference specifications so `npm test` executes cleanly without crashing on missing files.

### 1.4 Test Integrity & Zero Cheating Standard
- **No Facade Tests**: Tests must execute authentic mathematical, graph traversal, and storage logic. A test never passes via unconditional `assert.ok(true)`.
- **Strict Invariant Checks**: Every test asserts exact state transformations, deterministic outputs, or schema compliance.
- **Fail-Fast Error Handling**: Any unexpected output or contract breach triggers an immediate assertion failure.

---

## 2. Feature Inventory Coverage Matrix (F1–F15)

| # | Feature Name | Milestone | Scope & Interface | Tier 1 Tests | Tier 2 Tests | Tier 3 & 4 Tests |
|---|--------------|-----------|-------------------|--------------|--------------|------------------|
| **F1** | Deterministic PRNG & Board Generator | M1 | `generateDailyBoard(dateStr)` | 5 | 5 | Cross-tested in T3 & T4 |
| **F2** | Dijkstra / A* Solver & Par Calculation | M1 | `solveBoard(board)`, `parMoves` | 5 | 5 | Cross-tested in T3 & T4 |
| **F3** | Automated 365-Day Solvability Test | M1 | Deterministic calendar loop | 5 | 5 | Cross-tested in T3 & T4 |
| **F4** | Minimalist Path Logic UI & Rotation | M2 | `rotateTileAt`, `checkWinCondition` | 5 | 5 | Cross-tested in T3 & T4 |
| **F5** | UTC Midnight Rollover Watcher | M2 | `watchUtcDay`, visibility listener | 5 | 5 | Cross-tested in T3 & T4 |
| **F6** | Spoiler-Free Wordle Share Card | M3 | `generateShareText`, `isSpoilerFree` | 5 | 5 | Cross-tested in T3 & T4 |
| **F7** | Social Share & Clipboard Intents | M3 | Web Share, WhatsApp, Twitter | 5 | 5 | Cross-tested in T3 & T4 |
| **F8** | Offline Storage & Streak Persistence | M4 | `getDailyPathStats`, `saveDailyCompletion` | 5 | 5 | Cross-tested in T3 & T4 |
| **F9** | Optional Supabase Sync Hook | M4 | `syncWithSupabase` fail-safe | 5 | 5 | Cross-tested in T3 & T4 |
| **F10** | Platform Navigation & Games Registry | M5 | `lib/platform/games.ts`, nav links | 5 | 5 | Cross-tested in T3 & T4 |
| **F11** | Homepage & Games Portal Update | M5 | `app/page.tsx`, `app/games/page.tsx` | 5 | 5 | Cross-tested in T3 & T4 |
| **F12** | Monetization & Sponsored Engine | M5 | `daily-after-result`, `sponsor.ts` | 5 | 5 | Cross-tested in T3 & T4 |
| **F13** | Daily SEO Archives & Replay | M6 | `/daily/archive/[date]`, 404 anti-cheat | 5 | 5 | Cross-tested in T3 & T4 |
| **F14** | SEO Metadata, OG & Schema.org JSON-LD | M6 | `GameApplication`, OpenGraph preview | 5 | 5 | Cross-tested in T3 & T4 |
| **F15** | Sitemap & Robots Crawlability | M6 | `app/robots.ts`, `app/sitemap.ts` | 5 | 5 | Cross-tested in T3 & T4 |

**Total Planned Test Cases**:
- Tier 1: 75 tests (15 features $\times$ 5)
- Tier 2: 75 tests (15 features $\times$ 5)
- Tier 3: 10 pairwise combination tests
- Tier 4: 5 realistic application scenario tests
- **Grand Total**: 165+ tests (satisfies minimum threshold $\sim 11 \times 15$).

---

## 3. Test Runner & Environment Architecture

### 3.1 Technology Stack
- **Test Runner**: Node.js built-in `node:test` runner.
- **Assertion Library**: Node.js built-in `node:assert/strict`.
- **TypeScript Loader**: `tsx` (v4.19.3).
- **Environment Isolation**: `tests/setup.mjs` enforces isolated test environment, purging live database URLs and setting `NODE_ENV = "test"`.

### 3.2 Invocation Commands
```bash
# Run exclusively Daily Path E2E test suite
node --import ./tests/setup.mjs --import tsx --test tests/daily-e2e.test.ts

# Run the complete PlayNudge test suite (all games + platform)
npm test
```

### 3.3 Test Execution Budgets & Performance Thresholds
To ensure seamless developer experience and CI/CD throughput:
- **Individual Solver Execution**: $< 0.1 \text{ms}$ per 4x4 board.
- **365-Day Solvability Audit**: $< 100 \text{ms}$ total.
- **Share Card & Regex Invariant Check**: $< 0.05 \text{ms}$ per card.
- **Storage & Web Locks Roundtrip**: $< 1 \text{ms}$ per transaction.
- **Full E2E Suite Run Time**: $< 2.5 \text{seconds}$ across all 165+ test cases.

---

## 4. Verification Gates

1. **Deterministic Solvability**: Every date from `2026-01-01` to `2026-12-31` produces an identical board on repeat calls and is mathematically guaranteed solvable in $\le \text{parMoves}$.
2. **Anti-Leak Invariant**: Scorecards must never leak coordinates `(r, c)`, rotation values (`rot: 1`), or internal tile topologies.
3. **Replay & Streak Protection**: Replaying a puzzle on the same UTC day or replaying historical archive puzzles must NEVER increment the active daily streak.
4. **Anti-Cheat 404**: Requesting archive puzzles for future dates ($>\text{today}$) must return a strict HTTP 404.
5. **No Regressions**: Zero regressions on existing Jelloo, Quiz, or Platform test suites (all 440+ existing tests must continue to pass).
