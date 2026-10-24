# Phase 8.1 final UX fixes — 2026-10-24

Branch: feature/jelloo-phase-8-1. Starting HEAD: 67673d6. All five existing Phase 8.1 commits preserved. No push, merge, deployment, production database access or Netlify changes.

## Findings and changes

1. Map columns were viewport-breakpoint based (five columns, abruptly ten at 480px), without a minimum touch width. The actual 320px baseline had roughly 38px cells and cramped header/text; the precise owner's missing-column screenshot was **not reproduced** at 320/390 in this checkout. It must not be claimed as reproduced. Replaced fixed counts with available-width auto-fit columns, minimum 48px width/56px height, larger numbers/stars, wrapping header/title, visible keyboard focus and reduced-motion support. All 100 levels and five groups remain. Removed listitem role from playable buttons, which previously hid button semantics.
2. Trials copy did not explicitly say optional or explain separate advancement. It now explains training, Adventure's automatic character choice, separate stars, no progression requirement, and dynamic character/trial number. No unlock or reward rules changed.
3. A real failing engine regression proved pressure state became visible one step late. Updated the current trace state on plate arrival, preserving all puzzle topology and route rules. Added an explicit live text explanation of the linked door's state.
4. Browser QA reproduced a clipped Level Map action in the narrow Out-of-Moves dialog. Result actions now wrap with adequate flex basis instead of squeezing the secondary action.

## Important pressure-trial distinction

There is **no pressure plate/door in any actual Panda Trial** in the existing approved implementation. Panda Trials use a cracked tile linked to a gate. The prior screenshot script rendered switchFixture separately; it was not evidence of a Panda trial. No new plate was inserted into Panda's authored puzzles, because that would change their design.

- [BROWSER] Actual Panda Trial 1: selected Panda after unlocking through isolated progress, performed seven real quarter-turn clicks, won three stars, observed Gate opened and crumbled tile. Adventure progress remained at 27 completed; trial stars stayed separate.
- [BROWSER] Existing switchFixture mounted in development-only QA using actual gameReducer/GameView (not static HTML). Rotated tiles, Undo restored the rotation, completed the route, observed Pressure plate pressed / Door opened by switch; Restart reset moves and closed the door. Captured both states at 320px.
- [SOLVER/TEST] An otherwise solved board with the plate removed, or a link to an unvisited plate, cannot finish. All three actual Panda trials remain solvable and cannot open their cracked gate as Cat. Restart/retry clear trace/activation; Undo preserves the original tiles. Arrival-state test failed before the fix and passed afterward.
- Limitation: a pressure-plate-containing Panda Trial cannot be browser-tested because none exists. Adding one needs an explicit puzzle-content decision. Invalid-route and lost-state retry for the switch fixture were covered by engine tests, not a separate browser run.

## Browser evidence

Real in-app browser, standalone credential-cleared server at 127.0.0.1:3024. All /api requests blocked. Owner's localhost:3010 and deployed-origin progress untouched. Explicit fixture button installed seed 42, completed 26, Level 27, three stars for previous levels. No production unlock bypass added.

Widths are real iframe layout viewports; 15px desktop scrollbar reduces document client width. This is responsive browser QA, not physical-device testing.

| Viewport | Client / scroll width | Cells / worlds | Smallest cell | Outside screen |
|---|---|---|---|---|
| 320 | 305 / 305 | 100 / 5 | 55.44 × 56 | 0 |
| 390 | 375 / 375 | 100 / 5 | 55.63 × 56 | 0 |
| 1280 | 1265 / 1265 | 100 / 5 | 49.46 × 56 | 0 |

At 320px there are four columns; 390px five; desktop ten. The outer desktop QA wrapper can scroll because it contains a 1280px frame; measured game document itself does not overflow.

- Level 27 marked current with Level 28 locked; Enter activated Level 27.
- 29 repeated wrong turns triggered Out-of-Moves. Tab reached Level Map, Shift+Tab returned to Try Again; Enter reset to zero moves.
- 25 solver-reference quarter-turn clicks solved actual Level 27 (Cat); Next Level opened 28. Reloaded map restored Level 27 three stars and current Level 28. Replayed 27 without reducing highest completion.
- Adventure link restored selected replay. PlayNudge Home reached the actual homepage. Header links remained readable in both mobile screenshots.
- Screenshots: phase81-final-evidence/map-before-320.jpg, map-before-390.jpg, map-after-320.jpg, map-after-390.jpg, map-desktop.jpg; pressure-restarted-locked-320.jpg and pressure-open-320.jpg; panda-open-320.jpg; out-of-moves-fixed-320.jpg. The older level27-out-of-moves.jpg is before the dialog fix.
- Native screen-reader output, physical touch devices and separate Safari/Firefox runs: NOT TESTED.

## Files

- app/jelloo/map/LevelMap.tsx, map.module.css: responsive and semantic map fixes.
- app/jelloo/pals/PowerGame.tsx: optional-training copy and current selection.
- app/jelloo/GameView.tsx, game.module.css: linked-door text and dialog action layout.
- lib/jelloo/power-solver.ts: immediate plate arrival trace state.
- app/jelloo/qa/page.tsx: existing fixture in guarded development-only real-engine surface.
- scripts/jelloo-phase81-qa.ts: isolated fixture/viewport harness.
- tests/jelloo-phase81-final.test.ts: three behavioral regressions.
- This report and phase81-final-evidence/: screenshots and validation logs.

## Verification

- Focused: 8 total, 8 passed, 0 failed, 0 skipped.
- Full npm test: 240 total, 235 passed, 0 failed, 5 skipped (real Supabase cases).
- TypeScript: zero errors.
- ESLint: zero errors, 12 pre-existing unused-variable warnings, none in the new harness/test/fixes.
- Production build: PASS (Next.js 15.5.28), recorded in build.log after shutting down the development server.
- Protected files: tutorials, artwork, progress serialization, character unlock thresholds and disabled referral release gate unchanged.

No Phase 8.2 work. Pressure training content decision and physical-device coverage remain open.
