# Jelloo — Phase 2 playable core

## Scope

The game is now named **Jelloo**. `/jelloo` hosts the playable core, `/jelloo/art` preserves the reference studies, and `/jelly-pals` redirects to `/jelloo`. The original approved reference and existing derivative asset paths remain unchanged for provenance and compatibility. No new art was generated in this phase.

Included: 10 handcrafted JSON tutorial definitions, 4×4 and 5×5 boards, clockwise quarter-turns, fixed start/home, Go, deterministic traversal, confused reaction, completion, Undo, Reset, tutorial selection, keyboard controls, and optional movement animation. The existing quiz homepage, backend and database are untouched. No deployment or push.

## Game logic

- Rendering is separate from the pure TypeScript engine in `lib/jelloo`.
- Each route advances only through matching opposing ports. Grid boundaries cannot wrap.
- Straight and corner tiles only; ambiguous exits are rejected and traversal is bounded with visited-cell detection.
- Go snapshots the route and disables rotations/Undo until traversal finishes.
- An incomplete path stops at the last reachable tile. Editing returns Bunny to start while keeping rotations and move count.
- Undo restores the prior board but does not refund moves. Reset restores the initial scramble and zero moves.
- Reset and tutorial selection cancel a run. Run IDs reject stale timer callbacks.
- The animation timer pauses while the page is hidden; reduced motion and the motion toggle disable character movement effects. Results never depend on CSS animation events.
- All tutorials are selectable for preview/testing. There is no completion-based unlocking or claim that every preceding tutorial was completed.

## Verification

- `node --import ./tests/setup.mjs --import tsx --test tests/jelloo.test.ts`: **9 passed**. Sandbox subprocess restrictions required an approved outside-sandbox run. The suite remains isolated from production credentials via existing test setup.
- All 10 intended solutions validated; initial scrambles are unsolved.
- 1,000 deterministic rotated-board cases terminate with adjacent, non-repeated visited cells.
- Tests cover boundary handling, invalid home entry, fixed endpoints, immutability, Undo/Reset, retries, double Go and stale callbacks.
- TypeScript and targeted ESLint passed; `git diff --check` passed.
- Browser: first tutorial solved, failed path shown, Undo restored orientation, keyboard Enter rotated/started play, Reset cancelled a running journey, Next advanced to tutorial 2.
- Tutorial 10 solved through UI with 26 rotations. Its win message and final replay button were confirmed; an initial browser wait expired shortly before completion, then actual completion was inspected.
- Motion off verified: Bunny animation `none`, tile transition `0s`.
- Layout inspected at 320px, 390px and 1440px. At 320px the narrowest path button measured 47.06px (58.26px at 390px); no horizontal overflow was present. Browser error log was empty at final inspection.
- Screenshot evidence: `phase-2-desktop.png` and `phase-2-mobile.png` in this directory.
- `/jelloo` and `/jelloo/art`: HTTP 200. `/jelly-pals`: HTTP 307 to `/jelloo`.

## Limits / next phase

- No endless generator, scoring/stars, persistent saves, unlocks, sound, special powers or PixiJS renderer yet.
- Current movement uses the approved-derived two-frame Bunny with CSS transforms, not a full running sprite set.
- This low-complexity core uses HTML buttons/CSS so it is keyboard-operable. A canvas renderer can consume the same pure engine later.
- Production build/deployment and physical mobile devices were not tested. Browser checks use the in-app Chromium browser; OS-level reduced-motion emulation not exercised.
- Preview progress is session-only and resets on refresh; UI discloses this.

Next planned phase: seeded endless generation, validated difficulty and versioned local saves. User review comes first.
