# Phase 7 Task 4 — engineering fixes

2026-10-23. Local working tree only; no commit, push, merge or deployment.

## Changes in this task

- `lib/jelloo/zen.ts`: decoder accepts unknown input and narrows to string before parsing. The existing null corruption assertion is unchanged.
- `app/jelloo/GameView.tsx`: replaces three any casts with MultiJellyTrace.
- `tests/jelloo-multi.test.ts`: removes unused imports and callback argument; assertions unchanged.
- `lib/jelloo/multi-jelly.ts`: adds solved/impossible/unknown and exhausted to solver results; replaces port-only junction lookahead with path/power-state-aware traversal.
- `lib/jelloo/endless.ts`: adds a separate Multi-Jelly generator revision parameter, retaining the pre-Multi generation path.
- `lib/jelloo/progress.ts`: persists that revision, restores untagged pre-Multi saves with revision 0, retains revision across save/reload, and upgrades only on a newly visited level. Untagged local Multi saves containing canonical Jelly specifications remain readable. Saved Jelly fields must exactly match regenerated specifications; malformed, duplicate, unknown or mismatching data is rejected rather than injected into gameplay.
- `tests/jelloo-task4.test.ts`: four focused regression cases covering historical generation, corrupted Jelly data, solver outcomes/quarter-turn cost, and junction routing.
- This report and `docs/jelloo/task4-browser-win.png`.

Other dirty files existed before this task: engine, feedback, scoring and worlds. They were preserved. Original tutorials, approved assets, quiz functionality and unlock schedules were not edited.

## Reproductions and fixes

Historical saves: the test reads the real `91e4e97:lib/jelloo/endless.ts` using Git, transpiles it in memory and generates levels 71 and 91 at seed 42. Their old single-Jelly boards differ from today's default Multi boards. The test restores edited old rotations, exact initial level structure, move count and completed milestones; it re-encodes/reloads without changing the board. It also verifies that visiting the next level selects the new revision. Comparing restored level data accounts for initialGame's normal empty choices field, not an altered layout.

Compatibility boundary: this reproduces the Phase 7 pre-Multi transition, using unchanged current dependencies of that historical dispatcher. It does not certify every earlier power-generator revision (e.g. before star-detour changes). Those older unversioned histories cannot be identified solely from seed/id/rules. No claim of universal historical-save recovery is made.

Junction: a 4x4 Panda fixture has a tee at cell 9, a water-blocked northern branch through 5/6 and a valid east branch through 10 to home 11. Before the fix the test failed with disconnected instead of home. After the fix it passes. Lookahead now checks visited cells, broken tiles, character terrain restrictions, one-use jumps, switches/doors/gates, slippery exits and the correct home. It does not predict another Jelly's future actions; simultaneous collision/activation behaviour remains governed by the existing simulator.

Solver: a non-solved intro with budget 0 returns unknown/exhausted; an entirely fixed impossible board returns impossible; the normal intro search returns solved. Each clockwise quarter-turn increments the move count by exactly one, including four consecutive rotations. Existing Undo/Reset and 70/90 unlock assertions still pass.

Saved Jelly data: tests cover invalid starts/homes, unknown character/color/fields, null, empty/malformed collections and duplicate definitions. Valid canonical specifications round-trip. Rejection does not overwrite the original browser record; existing UI recovery behaviour is retained.

## Verification

| Check | Result |
| --- | --- |
| Focused Task 4 + existing Multi suite | 10 passed, 0 failed |
| Generated Multi coverage | 200 two-Jelly and 100 three-Jelly puzzles pass |
| Full npm test | 203 tests; 198 passed; 0 failed; 5 skipped; 0 cancelled; 0 todo |
| npm run typecheck | Exit 0, zero errors |
| npx eslint app/jelloo lib/jelloo tests/jelloo*.test.ts | Exit 0, zero errors and warnings |
| npm run build | Exit 0, successful optimized production build |
| git diff --check | Passed |

The five skipped tests require explicit disposable real-Supabase credentials. Build reports one existing unrelated unused `event` warning in `app/quiz/play/[id]/page.tsx:116`; that restricted quiz file was not changed.

## Browser evidence

Production build served locally on port 3010. At fresh origin `http://127.0.0.2:3010/jelloo`, viewport 1264x943, Level 1 was played via browser controls: one tile quarter-turn, one move, 1/1 collectible, 3/3 stars. Reload restored the victory dialog. Screenshot: `task4-browser-win.png`. Level 1 is authored and seed-independent; random journey seed was not captured. This is an AI-operated smoke test, not a human playtest.

The earlier `127.0.0.1` test origin showed an unreadable pre-existing save and explicitly disabled saving to preserve it; its data was not cleared or overwritten. Its precise provenance was not identified. The successful fresh-origin test must not be presented as recovery of that record.

NOT TESTED in browser: Multi-Jelly levels 71/91, mobile/orientation, old-save UI migration and all power variants. Automated fixtures cover the scoped engine regressions, not those visual flows.

## Owner review

The requested handoff/master-plan file remains absent in this checkout; no new mechanics, Invite Friends or Phase 8 work was introduced. Phase 7 engineering checks above pass, but universal historical power-save recovery and broader browser coverage remain limitations. No source fix is claimed for the unidentified pre-existing browser save. Stop here for owner approval.
