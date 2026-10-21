# Jelloo — Phase 3

Implemented locally on 2026-10-21. No deployment or push.

- Ten authored tutorials unlock sequentially, followed by generated Meadow levels starting at 11.
- Versioned deterministic generator: 4×4 gentle boards alternate with 5×5 medium and winding boards. Route lengths, endpoints, bends, rotations and decoys vary. Generation uses bounded attempts and a valid fallback. Every generated solution is checked; starting boards must be unsolved.
- No terminal level in normal play. Finite tile configurations can eventually repeat; this is not a guarantee of infinitely unique boards. Difficulty cycles rather than growing without limit.
- Every ten sequential completions earns a meadow milestone count. Replays do not increase it. Characters, powers, worlds, stars and audio are not implemented in this phase.
- A compact versioned local save stores seed, current board rotations, moves, highest sequential completion, win state and animation preference. Reloading mid-run returns Bunny to the start with the edited board intact. Undo history is session-only and capped at 100 turns.
- Invalid/future saves are preserved without overwriting; the UI explains that the visit is not saving. Storage read/write exceptions show a session-only warning. Saves are per browser, not account synced; clearing browser data removes them. Concurrent tabs are not synchronized (last writer wins).

## Verification

- 13 targeted automated tests passed, including 1,500 deterministic generated puzzles across five seeds, solvability, initially unsolved boards, variety, tutorial-to-endless transition, replay-safe milestone counts, save round trips, interrupted runs, and malformed/future saves.
- TypeScript and targeted ESLint passed.
- Browser: keyboard tile rotation, animation toggle, refresh restoration of rotations/moves/preference, completion persistence, and next-level unlocking passed.
- Responsive DOM checks at 320, 390 and 1440px: no horizontal overflow. Full-page screenshots saved beside this document. No browser console errors observed.
- Endless transition and corrupt-save behavior covered by unit tests; not driven through all ten tutorials in the browser this phase. Storage-denied/quota behavior is handled but not simulated in browser.
- Production build and cross-browser/device testing were not run. Existing dev server remains available on port 3010.

Next phase: scoring, result presentation and animation/sound polish. Keep the approved reference as the visual source.
