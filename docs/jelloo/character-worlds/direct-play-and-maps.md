# Direct Play + Separate Level and World Maps

Date: 28 October 2026. Local-only implementation of the owner's reference flow.

## Behavior

- A genuinely new user enters Level 1 directly. Missing current-revision storage is initialized under the existing Web Lock, with no welcome or Start gate. Corrupt or inaccessible storage is never treated as a fresh save and is never overwritten.
- Returning users resume the saved attempt, including its moves and running/loss state. Startup pins the active level in the URL before accepting tile input. Verified wins remain on their result screen until the player chooses Next Level.
- Levels opens a connected Candy Land path with all 50 numbered nodes, earned stars, current Bunny marker, milestone star locks and automatic centering on the current level.
- Worlds is separate: five original themed island illustrations using the existing approved character sprites. Bunny opens its level path. Panda eligibility remains completion of Bunny 50 plus 120 stars. Unbuilt worlds stay locked/Soon even after qualification; no false playable content or unlock bypass is introduced.
- The new game shell shows only short titles, counts and icon navigation. Promotional paragraphs, welcome copy, preview/footer labels and gameplay tips are removed from the visible current-revision UI. Screen-reader status updates and genuine save-error messages remain available.
- Home/All Games Jelloo links enter direct play in development only. Production retains /jelloo/map and the released campaign. Quiz game URLs and preserve-session behavior are unchanged.
- Previously archived Character Worlds remains at /jelloo/character-worlds/previous. Legacy save keys and source campaign implementations remain intact.

Current routes: /jelloo/character-worlds?level=N, ?view=levels and ?view=worlds. Bare entry resolves the safe resume destination. All these remain unavailable in production mode.

## Frozen content

Bunny 1-50 specs, certified click plans, solver/scoring, save schema, thresholds and original character/garden/cottage bitmap assets have no changes from d7f4eee. The content/artwork SHA regression passes. No puzzle regeneration or gameplay mechanic was added. Original board materials are retained; compact mode sizes the board to the viewport height and appends only an invisible accessibility utility to the shared CSS.

The new illustrations are navigation graphics, not claimed records of player solution paths. Original reference screenshots were used for the two-map structure and minimal information hierarchy; their game art was not copied.

## Confirmed defect corrected

[BROWSER] The first direct-entry implementation derived its rendered level from updated completion. Saving a win immediately changed the level ID, skipping the win popup. The active URL now owns the attempt. A shared pure screen resolver and regression verify that changing the next resume destination from 2 to 3 does not replace an active Level 2 result.

[BROWSER] Level 2 completed in 4 moves with two pickups and three stars; the URL stayed ?level=2 with its victory dialog visible. Explicit navigation then opens the next level.

## Real browser evidence

Origin: http://localhost:3057, separate from the owner's localhost:3055 storage. CUA real browser, not a simulated DOM-only test.

- Fresh origin displayed Level 1 without any Start/welcome action. First rotation persisted through reload (1/6 moves).
- Completion recorded earned stars. Levels showed completed nodes and current Level 3, with six total stars after Levels 1 and 2.
- Level-map keyboard Enter selected Level 3. At 11/11 moves, the real engine displayed the loss dialog. Reload restored loss; keyboard Retry reset to 0/11 with prior stars retained.
- Levels/Worlds Back and Forward restored the appropriate screen and selected navigation icon.
- Games -> Play Jelloo navigated directly to ?level=3, restoring the saved attempt with no map/welcome gate.
- A clean tab loaded gameplay with zero browser error log entries. One development Fast Refresh diagnostic appeared while an effect dependency array was edited; it did not recur on a clean load and is not represented as a runtime pass without rechecking.
- The previous 100 short/all-star browser replays remain valid evidence for unchanged frozen puzzles; they were not falsely repeated or reported as new runs.

### Viewport matrix

All three screens were measured in real 320x640, 390x844, 768x1024 and 1280x800 viewport overrides (12 cases). Every document scroll width equals its client width. Levels always has 50 nodes; Worlds always has five islands. HUD controls are at least 44px (48px on larger screens); level targets are 60px on small screens. The 320px gameplay example had 60px tile targets and a board bottom at 516px inside a 640px viewport.

Raw per-screen geometry is in jelloo-direct-flow-metrics.json. Screenshots: jelloo-direct-game-390.png, jelloo-level-trail-390.png, jelloo-world-atlas.png. Viewport override was reset after QA.

[NOT TESTED] Physical Android/iOS hardware and OS reduced-motion emulation are unavailable. Existing reduced-motion preferences are respected in code/CSS, but no physical-device or emulated-media PASS is claimed.

## Gates

- Focused new entry-flow tests: 6 pass, 0 fail.
- Combined platform/route/frozen-content focused run: 17 pass, 0 fail; existing assertions unchanged.
- Full npm test: 406 total, 401 passed, 0 failed, 5 skipped. The five real Supabase opt-in tests remain skipped.
- TypeScript: PASS, zero errors.
- Repository lint: zero errors, the same 15 pre-existing warnings; no new warning left in the edited components.
- Production build: PASS. Local built-route checks: five internal preview/QA URLs return 404; Games, Quiz and Jelloo return 200. Production Games anchors still target /jelloo/map. See direct-play-build.log and direct-play-production.log.

No assertion was weakened. No owner save bytes were imported/reset, no Supabase production action, and no push, merge, deployment, advertising/referral activation or future-world gameplay implementation occurred.

## Files

UI: BunnyCampaign.tsx, BunnyMaps.tsx, scene.module.css, compact rendering in CharacterWorlds.tsx, accessibility utility in worlds.module.css; JellooHeader.tsx/layout.tsx; local-only discovery composition in components/platform/Platform.tsx.

Logic: campaign-v2/bunny-entry.ts and routes.ts. Regression: tests/jelloo-bunny-entry-flow.test.ts. Evidence and gate logs: this directory.

The earlier legacy /jelloo/map unreadable-save warning was not reset or repaired by this UX task. Normal local game discovery now enters the separate accepted Bunny revision. Production and historical data are preserved.
