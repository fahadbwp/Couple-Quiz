# Rectangular Foundation + Bunny 1-50: Local Results

Date: 28 October 2026
Workspace: C:/Users/Fahad Saleem/Documents/jellypals
Branch: codex/character-worlds-phase3
Decision: GO for local owner playtesting. No production release is authorized or performed.

## Delivered

- [CODE] Compatible columns/rows geometry for 4x4, 5x4, 6x4, 7x4 and 8x4. Legacy square size callers retain their behavior. Engine, power solver, Multi-Jelly traversal, analysis and structural transforms use the appropriate dimensions. Cell 31 is covered without a 32-bit visited-mask alias.
- [SOLVER/ENGINE] Fifty static 4x4 Bunny levels, revision bunny-4x4-v1. Two collectibles each; campaign-only score = one completion star + actual pickups. Failed runs award zero. All-star par +3 budget, one quarter-turn per move, no hidden refund.
- [SOLVER/ENGINE] Both direct and all-star routes certified with auto-start checked after every individual click. Levels 1-5 are teaching exceptions; 6-50 have a real optional longer detour. Ten single-jump levels are impossible without Bunny. No unknown/exhausted proof accepted.
- [SOLVER] 1,225 pair comparisons: zero duplicate topologies or sampled same-core/high-overlap routes at the unchanged 0.85 threshold. This is not an exhaustive guarantee about every possible equal-cost solution.
- [CODE/TEST] Separate new save key jelloo.campaign.bunny4.v1 and explicit new-journey start. Previous v2 and legacy v1 bytes are never overwritten. Previous campaign remains readable/replayable at /jelloo/character-worlds. Original source specifications and legacy tutorials are unchanged.
- [CODE/TEST/BROWSER] Strict validated editing/running/win/loss restoration, move/rotation consistency, content identity, safe corrupt-data handling, best-result retention and cross-tab stale-write protection. Browser writes serialize under Web Locks; unsupported browsers receive an explicit safe-saving error.
- [CODE/BROWSER] Approved glossy pink board, blush scenery, source Bunny artwork, top-right stars, auto-start, result mascot and native win/loss dialogs retained. No Go, Undo or Restart added to active play. Result Replay/Try Again remains.
- [CODE] Existing local star gates remain 10=15, 20=36, 30=60, 40=84, 50=110. Panda qualification remains completion of 50 plus 120 stars; Panda content is not built/unlocked here.

## Measured difficulty

| Levels | Mean minimum moves | Mean all-star moves |
|---|---:|---:|
| 1-10 | 6.3 | 9.0 |
| 11-20 | 7.9 | 13.4 |
| 21-30 | 9.4 | 13.9 |
| 31-40 | 11.4 | 16.0 |
| 41-50 | 12.3 | 16.5 |

Level 50: minimum 11 / all-star 16, route lengths 8 / 10 cells, single Bunny jump required. Difficulty rises by band rather than imposing one extra click on every consecutive level. Turns, branch/rejoin and power decisions are recorded in bunny4-inventory.md/json. More clicks alone do not prove more thinking.

Two-star outcomes are tested honestly: Level 23 has a real one-pickup route (15 moves). The other 49 layouts do not admit an exactly-one-pickup home route under the supported rules; their outcomes are predominantly 1 or 3. This follows the approved 'where route structure permits' exception; no invented partial trace is presented as gameplay evidence.

## Actual browser evidence

[BROWSER] CUA real browser, isolated origin http://127.0.0.1:3057, static revision above (no runtime seeds). Owner's localhost:3055 progress was not written or imported.

- All-star routes for Levels 1-50 in sequence using actual tile buttons, Next Level and ordinary gate unlocks: 50/50 pass; 3 stars, two pickups and saved confirmation checked on every win.
- Short routes for Levels 1-50 using actual tile buttons: 50/50 pass; teaching Levels 1-5 yield 3, Levels 6-50 yield 1. Map remains 50 completed and 150 earned stars after lower-score replays.
- Additional actual Level 23 one-pickup run: 2 stars, 15 moves, saved.
- Level 1 unfinished refresh restores the rotated tile and 1/6 moves. Last-budget win at 6/6 survives refresh. Finale result restores after refresh.
- Level 1 exhaustion at 6/6 shows loss dialog. Escape closes it; Show result reopens it; keyboard Enter activates Try again and resets attempt to zero. Tile inputs are disabled while moving/results.
- Level 6 all-star detour played through real controls inside a 320px viewport, including win and Replay.
- Stale tab after another tab saves shows Progress needs attention and requires reload instead of overwriting newer progress.
- Disposable low-star fixture (19 completed, 29 stars): Level 20 map button and direct URL blocked at 29/36. Replay guidance visible. Back/Forward restores locked/map views correctly.

The 100 certified-route runs are automated browser replays, not a human playtest or a measured enjoyment study. Additional interactions above inspect actual UI behavior; the owner's untimed enjoyment/pacing feedback is still needed.

### Browser sizes

Real iframe browsing contexts were used for narrow/tablet sizes; this is responsive browser QA, not a physical-device test. The scrollbar occupies 15px of the frame. All map and puzzle document scroll widths equal client widths.

| CSS viewport | Document client/scroll width | Smallest map target width | Puzzle target size |
|---:|---:|---:|---:|
| 320 | 305 / 305 | 57.83 | 56.25 x 56.25 |
| 390 | 375 / 375 | 58.67 | 73.75 x 73.75 |
| 768 | 753 / 753 | 127.06 | 127.33 x 127.33 |
| 1280 | 1265 / 1265 | 86.46 | 127.33 x 127.33 |

All 50 map links remained present. Header and map navigation worked at narrow width. Star slots remain 25% of the tile, fixed top-right with overflow hidden; approved star/board CSS was not altered. Screenshot references:

- jelloo-bunny-board-320.png: narrow board and fixed corner pickups.
- jelloo-bunny-mobile-win-320.png: narrow result dialog controls.
- jelloo-bunny-finale.png: Level 50 result and Bunny mascot.
- Other captures/measurements: bunny4-browser-metrics.json.

[CODE] Reduced-motion media rules and 40ms reduced movement branch remain. [NOT TESTED] Actual OS reduced-motion preference could not be emulated by the available browser tooling. Physical Android/iOS touch, orientation changes and future-world 5x4-8x4 mobile controls are not certified here; only their geometry/engine fixtures are covered. No later-world layout is released by this work.

## Engineering gates

| Gate | Result |
|---|---|
| Baseline npm test | 384 total; 379 pass; 0 fail; 5 skipped |
| Focused Bunny/save/rectangular tests | 13 total; 13 pass; 0 fail; 0 skipped |
| Final npm test | 397 total; 392 pass; 0 fail; 5 skipped |
| npm run typecheck | PASS; zero errors |
| Scoped ESLint | PASS; zero errors/warnings |
| Repository npm run lint | Zero errors; same 15 pre-existing warnings |
| npm run build | PASS; Next.js 15.5.28 optimized production build |
| Production-mode preview isolation | Both Character Worlds routes and /_worlds-qa return 404 |
| Production-mode core route smoke | /quiz and /jelloo return 200 |
| Square/power/Multi-Jelly regression | Full suite passes, including existing 200 Two-Jelly +100 Three-Jelly cases |

Five skipped tests are opt-in real Supabase integration tests. No staging credentials or production access were used. Temporary failures were confined to incomplete test-double types and browser waits that expired before movement completed; they were resolved/re-observed, not converted into false passes. No assertions were weakened.

Logs: foundation-final-tests.log, foundation-focused-tests.log, foundation-final-typecheck.log, foundation-final-scoped-lint.log, foundation-final-lint.log, foundation-final-build.log, foundation-production-routes.log.

## Files and local milestones

- Foundation: lib/jelloo/grid.ts, engine.ts, power-solver.ts, multi-jelly.ts, scoring.ts; campaign-v2/rectangular-authoring.ts and structural-comparator.ts; tests/jelloo-rectangular.test.ts.
- New content/save: campaign-v2/bunny-provider.ts, bunny-specs.ts, bunny-save.ts; provenance copy archive-1-0-2; tests/jelloo-bunny4.test.ts and jelloo-bunny-save.test.ts.
- UI: app/jelloo/character-worlds/CharacterWorlds.tsx, BunnyCampaign.tsx, bunny/page.tsx.
- Offline verification: scripts/jelloo-build-bunny4.ts, jelloo-certify-bunny4.ts and loopback-only jelloo-worlds-preview-qa.ts. No production QA bypass.
- Evidence: this directory's inventories, browser records, screenshots and gate logs.

Local history preserved:

1. e3f7445 - Preserve owner-approved baseline/assets.
2. b45bbf8 - Compatible rectangular foundation.
3. 80e40db - Fifty certified puzzles and revision-safe progress.
4. d6f3b09 - Saved-attempt UI and complete player flow.
5. Final documentation/evidence commit follows these milestones.

Reproduce: npm ci (only if dependencies missing), npm test, npm run typecheck, npm run lint, npm run build. Local preview: set JELLOO_QA_PORT=3055 and run npx tsx scripts/jelloo-worlds-preview-qa.ts. New journey: /jelloo/character-worlds/bunny. Previous journey: /jelloo/character-worlds. Offline certification: npx tsx scripts/jelloo-certify-bunny4.ts. The authoring script emits candidate evidence; it does not automatically replace frozen application content.

## Boundaries and remaining limits

No push, merge, deployment, remote migration, production save modification, ads/referrals activation, Quiz change, artwork replacement or other-world implementation. No source artwork/CSS differences from e3f7445. Production modes continue using the existing game; the new route is development-only.

No known failing in-scope engineering gate. Reduced-motion OS emulation, physical-device QA and human enjoyment testing remain explicitly unverified. This is not a claim that software can never contain an error. Future worlds and production release need later approval.

Tracked implementation is committed. The unused pre-existing root file ChatGPT Image Oct 27, 2026, 04_18_57 PM.png remains untracked and untouched; it is not required by the app. No history was reset or discarded.
