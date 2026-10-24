# Phase 8.3 final acceptance corrections — 2026-10-24

Starting branch: `feature/jelloo-phase-8-3`, HEAD `1315228`. Working tree was clean. All existing commits, including the previous six Phase 8.3 commits and the existing acceptance-corrections commit, remain ancestors. No phase restarted.

## Acceptance results

| Issue | Result | Evidence |
|---|---|---|
| Power Trial Back | PASS | Actual Panda Trial → header Meet Your Pals link → selection; browser Back restored Panda trial, Forward restored selection. Refresh retained selection. Cat trial, refresh and second visible Meet Your Pals button also returned correctly. Existing callback fixed the originally reported Back issue before this run. Additional Next Trial refresh defect reproduced and fixed below. |
| Top game-mode cards | PASS | Existing three cards were already above the Adventure puzzle. Real navigation to Daily, keyboard Enter to Zen and Meet Pals worked. All three cards fit at 320, 390 and desktop widths; minimum 48px touch height and visible keyboard focus added. No bottom-only duplicates or artwork replacement added. |
| Favourite Pal visible result | PASS | Equipped Panda through actual selection UI using isolated unlocked save. Level 1 displayed actual Panda sprite, favourite subtitle/badge and retained Panda after refresh. Level 27 displayed actual Cat and Required: Cat. Levels 71/91 retained Bunny/Panda and Bunny/Panda/Cat teams. |
| Share-card truthfulness | PASS | Existing renderer consumes actual trace paths. Actual Adventure Level 71 result: Bunny/Panda, three stars, four moves, 2/2 collectibles, limit 7. Actual Adventure Level 91: Bunny/Panda/Cat, three stars, six moves, 3/3 collectibles, limit 9. Both visible cards show correct identities and real path legends. Incomplete-path fallback defect fixed and tested. |

## Reproduced bugs and fixes

1. **Trial state/URL mismatch:** after completing actual Panda Trial 1 and pressing Next trial, UI displayed Trial 2 while URL still said `pal=panda&trial=1`; refresh returned to Trial 1. Trial tabs updated the URL, but the result button's load path did not. Centralized `load()` URL replacement and shared route serialization/decoding between initial restore, history navigation and selection return. Replayed Panda Trial 1 after the fix; Next trial updated URL to Trial 2 and refresh restored Panda Trial 2. Screenshot `panda-trial2-refreshed.jpg`.
2. **Partial team graphic inconsistency:** generator accepted *any* Pal path while legend required *every* Pal path. Missing one path could produce a partial colored grid labeled as a celebration. A failing regression captured that behavior. Generator and legend now share complete, in-bounds integer-path validation. Missing/invalid data produces only the explicitly labeled `[Team Celebration Graphic]` banner. Actual complete engine paths remain factual route records. No decorative solution paths are synthesized.
3. **Card accessibility/polish:** top cards existed, so no duplicate cards were built. Browser measured narrow cards at approximately 43px high; added 48px minimum height, visible focus, and disabled hover translation/transitions when game motion is off or OS reduced motion is requested.

## Actual browser evidence

In-app Chromium browser, isolated fresh origin `http://127.0.0.1:3026`. Standalone QA script clears backend credentials and blocks `/api/`. Fixture: seed 42, 90 completed Adventure levels, current Level 1, motion off, muted, generator revision 2. Explicit fixture button installs this save only on the QA origin. Favourite Panda equipped by clicking actual UI, not by editing storage. Owner's ordinary localhost and production saves were not used.

- Responsive testing used actual browser viewport overrides: 320×844, 390×844, 1280×900. Override reset afterward.
- At 320px, client/scroll width both 305 (15px scrollbar), three cards each 48px tall, all inside screen and above puzzle panel.
- At 390px, cards 61.33/61.33/48px tall, all inside screen and above puzzle panel. At desktop all cards were above panel and readable.
- Fixture's real motion-off setting produced computed card transition duration `0s`; CSS also handles `prefers-reduced-motion`. OS-level preference itself was not toggled in this run.
- Daily card click opened actual UTC Daily page; keyboard Enter opened Zen and Meet Pals. No external social message was sent.
- Original visible Back regression was **not reproduced** on starting HEAD: both controls already worked. Browser history/refresh interactions confirm that implementation. A separate Next Trial refresh mismatch was reproduced in real gameplay and fixed.
- Actual Level 71 quarter-turn indices: 4, 7, 8, 10. Actual Level 91: 1, 6, 7, 9, 12, 14. All manual UI clicks; normal Adventure results, not static mock cards.
- The development-only reducer QA route was briefly used for a Two-Jelly run, but verification mode omits share cards. Final result screenshots and share evidence therefore come from actual Adventure routes, not that QA route.

Screenshots in `phase83-final-evidence/`:

- `pals-back-selection.jpg`: actual character-selection screen after Panda Trial Back.
- `panda-trial2-refreshed.jpg`: corrected Trial 2 after Next Trial and refresh.
- `favourite-panda-390.jpg`: Panda physically displayed on compatible Adventure board.
- `required-cat-320.jpg`: Cat-required Level 27 despite Panda equipped.
- `mode-cards-320.jpg`, `mode-cards-390.jpg`, `mode-cards-desktop.jpg`: above-board mode cards.
- `two-jelly-result.jpg`, `three-jelly-result.jpg`: actual Adventure win and share cards.

## Changed files

- `app/jelloo/pals/PowerGame.tsx`: synchronize every trial load with URL; reuse route parser for refresh/history.
- `lib/jelloo/trial-navigation.ts`: shared trial/selection route contract with unlock validation.
- `app/jelloo/game.module.css`: card focus, motion handling and minimum touch height.
- `lib/jelloo/share.ts`: one complete-path validator for graphic and legend.
- `tests/jelloo-phase83-acceptance.test.ts`: three behavioral tests for trial route round trips/locks, incomplete-path fallback, and two-/three-Jelly result identity/statistics.
- `scripts/jelloo-phase83-qa.ts`: isolated fixture/viewport harness, never a production route.
- This report and evidence directory.

## Verification

- Focused Phase 8.3 + navigation + acceptance: **17 total, 17 passed, 0 failed, 0 skipped**.
- Full npm test: **267 total, 262 passed, 0 failed, 5 skipped** (existing external Supabase cases).
- TypeScript: **PASS, zero errors**.
- ESLint: **PASS, zero errors, 15 pre-existing unused-variable warnings**. No warning in new acceptance files.
- Production build: **PASS, Next.js 15.5.28**; raw output in `build.log`.
- Existing assertions not weakened. Tutorials, approved artwork, save schemas, unlock thresholds, Multi-Jelly mechanics and disabled Invite Friends gate unchanged.

Limits: no physical-device or Safari/Firefox run, no native share-sheet delivery, no OS-level reduced-motion preference toggle. No Supabase validation claimed. No push, merge, deployment or Netlify changes. Stop for owner review.
