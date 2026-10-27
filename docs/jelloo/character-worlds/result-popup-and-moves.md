# Result popup, corner stars and three spare moves

## Scope
Local workspace Documents/jellypals. Approved pink board/background, Bunny/source artwork, level layouts, scoring, star gates and existing saves are preserved. No push, commit, migration or deployment.

## Changes
- CharacterWorlds.tsx: native modal dialog for win/loss, current world mascot from world metadata (Bunny now), celebration, result stats, Next Level, Replay/Try again and Level Map. Heading receives focus, Escape/close dismisses, Show result reopens. Native modal focus containment and background interaction blocking; body scroll restored on close/navigation. Saved message appears only after successful verified persistence. Failed saves retain existing error path.
- worlds.module.css: modal styling and responsive height handling. Golden star is fixed to top-right, width 25% of tile, top/right inset 3%, no minimum-width overflow, clipped halo/sparkles/pop animation. Collection animates within its bounded slot; root stays fixed. Existing reduced-motion rules remain.
- world1-provider.ts: moveLimit = solverStarPar + 3 for all 50 authored levels. constants.ts content identity bumped 1.0.1 -> 1.0.2 because resolved move budgets changed. Completed levels/best-star schema unaffected; unfinished boards were never persisted.
- world1-content.test.ts: expected content revision and approved exact allowance updated. world1-preview.test.ts: all-50 exact allowance, final-allowed-move success and exhausted-move retry regressions added.
- QA harness: optional loopback-only port 3057 for fresh-origin tests, default preview remains 3055. APIs blocked and database credentials removed as before.

## Evidence
- Full tests: 384 total, 379 passed, 0 failed, 5 skipped. popup-full-tests.log.
- Focused preview tests: 12 passed, zero failures. Existing content/acceptance suites passed; popup-focused.log predates the three extra preview regressions (23 tests at that point).
- TypeScript: zero errors. Scoped ESLint: zero errors/warnings. popup-typecheck.log and popup-lint.log.
- Production build: PASS, exit 0 (popup-build.log). Local preview restored on port 3055.
- Real browser, disposable 127.0.0.1:3057 origin only: Level 1 at 320px, eight decoy rotations -> loss modal; Escape -> Show result -> reopen -> Try again restores 0/8. Three decoy turns then [1,2,2,2,6] -> win at 8/8, 3 stars, Bunny celebration, saved result. Keyboard Tab from heading reached Next Level; Next Level opened Level 2. Native desktop replay -> win at 5 moves. At 390px width=scrollWidth=390, loss modal verified.
- Desktop star measured before/after rotation: same inset ~3.48% top/right, width ~24.74%, height ~27.49%, overflow hidden. Its bottom <31.1% stays above the path rim's nearest 33% boundary. Visual mobile star inspection at 320px; all tile sizes share percentage slot geometry.
- Screenshots: phase4-browser/win-popup-desktop.png, win-popup-320.png, loss-popup-320.png, loss-popup-390.png.

## Limits and exact move arithmetic
Exactly +3 spare moves is implemented as approved. One accidental EXTRA corner rotation followed by three corrective rotations costs FOUR extra moves in total. Therefore +3 does not guarantee recovery from every such mistake when using an otherwise minimum solution. No silent +4 allowance or hidden refunds were introduced. Last-move success and ordinary +3 slack were verified. Physical phones, actual OS reduced-motion preference and other world mascots (not built yet) were not browser-tested. No owner progress at port 3055 was modified by fixtures.
