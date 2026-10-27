# Phase 4 - Pink Candy Land local map and playable preview

Working folder: `C:/Users/Fahad Saleem/Documents/jellypals`.
Branch: `codex/character-worlds-phase3`; unchanged base HEAD `d5c7762fc61c64f79c34ea9e5b33617066d4d105`.
Local implementation only. No commits, push, merge, deployment or remote data access.

## Implemented

Development-only route `/jelloo/character-worlds` provides an explicit start screen, the 50-level Candy Land map, replay, star-gate explanations and a playable Bunny puzzle runner. It is separate from the existing Adventure entry point. The route returns notFound outside development; public world availability remains planned.

The map uses four columns at the narrowest width, five on mobile/tablet and ten where space permits. Numbers, best stars, current level and locked states remain visible. Five ten-level chapters explain gates 10/20/30/40/50 with the approved 15/36/60/84/110 requirements. Panda's next world is a coming-soon teaser, requiring Level 50 completion and 120 Candy Land stars, never a playable fake unlock.

The visual pass uses pink candy colors, cream frosting paths, a code-drawn cottage and the existing approved CharacterSprite/Bunny textures. No source artwork was edited. Scenery is a first implementation, not a claim that the full reference illustration has been reproduced as production art.

Puzzle interaction uses the existing engine reducer and scoring: quarter-turn movement accounting, Go, Bunny traversal, optional stars, Undo, Restart, move-limit loss, victory feedback and Next Level. Result headings receive focus. Reduced motion follows browser preference; tile controls are native keyboard buttons with connection descriptions.

## Save and access boundaries

The user must explicitly start the new save; mounting a missing save does not create one. Only `jelloo.campaign.v2` is written. Legacy `jelloo.progress.v1` is never imported or rewritten. Completed levels and best stars persist; replay cannot reduce awards. Normal updates use the existing expected-raw snapshot check and verified read-back. Corrupt, unsupported, missing and conflicting destinations stop updates rather than resetting data. Cross-tab changes show a reload notice.

The gameplay adapter validates a reviewed level definition, actual completed trace and final cursor before awarding engine-scored stars. It checks central access policy again when writing a result. Direct URL navigation cannot bypass sequential or star gates. This is local progress integrity, not server-authoritative anti-cheat.

Unfinished rotations are deliberately NOT persisted in this phase. The page clearly states that refresh restarts an unfinished board while retaining completed levels and stars. Versioned mid-board restore and multi-tab atomic transactions remain later work; unsupported existing board-bearing saves remain preserved.

## Actual browser evidence

Tested through an isolated loopback server at `127.0.0.1:3055` using disposable browser-origin saves. Original owner progress was never imported. The harness disables API requests and removes database-related environment credentials. Its fixture controls are standalone Node-server code, not a Next route or production unlock bypass. Only harness responses allow same-origin framing for measurement; production CSP/configuration was not changed.

All content is fixed authored version 1.0.1 (seed does not create alternate boards).

| Browser check | Evidence/result |
| --- | --- |
| Explicit Start | Missing v2 save displays Start; click creates separate progress |
| Level 1 actual play | Five tile rotations, Go, Bunny arrival, 3 stars, 5 moves; stored completed=1/best[1]=3 |
| Next Level | Result button changes URL to level=2 and resets moves |
| Back | Browser Back restores level=1 route; replay starts a fresh board |
| Restoration | Reloading map restores completed=1, three stars and Continue Level 2 |
| Incomplete route | Go on original scramble shows Bunny blocked; editing becomes available again |
| Undo / Restart | Undo restores orientation but move counter stays spent; Restart returns to zero |
| Rapid rotations / loss | Nine rotations on a decoy reach 9/9 and loss; rotation controls disable |
| Keyboard Retry | Enter on Try again returns to editable zero-move board |
| Star gate | Disposable completed=9/best=one-star fixture: Gate 10 shows 9/15 and remains disabled |
| URL bypass | Direct level=10 shows locked explanation; no board |
| Qualified gate | Completed=9/27-star fixture enables Continue Level 10 |
| 320px map | Measured clientWidth=320, scrollWidth=320, all 50 buttons; smallest width 61.67px |
| 390px map | Measured clientWidth=390, scrollWidth=390, all 50 buttons; smallest width 61.73px |
| 1280px map | Measured clientWidth=1280, scrollWidth=1280, all 50 buttons; smallest width 86.46px |
| Level 5 mobile | Actual Bunny gap board opened; clientWidth=scrollWidth=320; gap and home labels present |
| Legacy isolation | Disposable legacy sentinel remains byte-identical during fixture/progress checks |

The 320/390/1280 widths above are measured inner iframe content widths in the real browser, not assumed outer-window settings. Saved screenshots include the visible harness and viewport; the full 1280px layout was measured even when not all of the wider frame fit the tool's screenshot. `phase4-browser/candy-map.png` shows the direct map and a disposable 9-level/27-star fixture. `map-320.png` and `puzzle-320.png` are harness viewport evidence; no claim of a full-page mobile capture.

Reduced-motion CSS and matchMedia handling were code reviewed; a changed OS/browser reduced-motion preference was NOT exercised. No physical device or assistive-technology test was performed. Only Levels 1, 2, 5 and blocked Level 10 were opened in browser; all 50 completed via the real reducer in automated save-flow coverage. No human fun/difficulty approval is claimed.

## Verification

| Check | Exact result | Log |
| --- | --- | --- |
| Focused campaign suite | 33 total, 33 passed, 0 failed, 0 skipped | phase4-focused.log |
| Full npm test | 378 total, 373 passed, 0 failed, 5 skipped | phase4-full-tests.log |
| TypeScript | PASS, exit 0 | phase4-typecheck.log |
| Scoped ESLint | 0 errors, 0 warnings, exit 0 | phase4-scoped-lint.log |
| Full ESLint | 0 errors, 15 preexisting warnings, exit 0 | phase4-lint.log |
| Production build | PASS, exit 0 | phase4-build.log |
| Actual local production HTTP | Preview returns 404 on 127.0.0.1:3056 | phase4-production-route.log |
| Tracked-file whitespace check | git diff --check, exit 0 | Existing tracked files unchanged |

The six new tests account for the increase from 372 to 378 total; five opt-in integration tests remain skipped. The production server was stopped after the 404 check. The development QA server can be started with `node --import tsx scripts/jelloo-worlds-preview-qa.ts`; open `http://127.0.0.1:3055/jelloo/character-worlds`. This dedicated test origin currently contains a disposable nine-level fixture, not owner progress. Normal development can also use `npm run dev -- --port 3057` and `/jelloo/character-worlds` on that fresh origin.

## Files added in this phase

- `app/jelloo/character-worlds/page.tsx` - development-only, noindex route.
- `app/jelloo/character-worlds/CharacterWorlds.tsx` - map, consent-to-start save flow and reducer-driven gameplay.
- `app/jelloo/character-worlds/worlds.module.css` - isolated responsive Candy Land visuals.
- `lib/jelloo/campaign-v2/preview-session.ts` - isolated access/result persistence adapter.
- `tests/jelloo-world1-preview.test.ts` - six new regression tests, including 50 actual reducer wins through persistence.
- `scripts/jelloo-worlds-preview-qa.ts` - disposable loopback QA harness, excluded from Next routes.
- This report, verification logs and screenshot evidence.

No original tutorial, quiz, existing map/GameView, save decoder, mascot artwork, ad/referral gate, dependency manifest or production setting was changed. React review checked hook cleanup, timer/runId protection, synchronous ref-based rapid-tap handling, native controls, focus states and storage errors. No new network service or dependency is required.

## Next boundary

Owner review of the local map/gameplay visuals comes next. Do not activate public campaign routing, make World 2 or deploy until separately authorized. Sound integration and versioned in-progress resume are not included in this map-review phase.

