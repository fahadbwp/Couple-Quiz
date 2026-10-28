# Bunny 1-50 - Final entry correction and accepted-content protection

Date: 28 October 2026. Local only. Continues the accepted e6f38e8 batch; no level regeneration.

## Confirmed defect and fix

[CODE/BROWSER] The familiar /jelloo/character-worlds entry still served the previous content revision, while the completed Bunny batch lived at /bunny. This explained the owner's repeated view of the old board after the new batch was delivered.

- Current entry: /jelloo/character-worlds (and ?level=1 through 50) now serves the accepted Bunny batch.
- Existing /jelloo/character-worlds/bunny links redirect to the current entry and preserve valid level bookmarks.
- Previous campaign: /jelloo/character-worlds/previous, with its map, levels and return links staying in that revision.
- New and previous save keys, schemas, earned stars, puzzle generation, move limits and artwork are unchanged. No automatic conversion, reset or copying of achievements occurs. A new revision still requires the existing explicit Start action if it has no save.
- Original /jelloo Adventure and Quiz entries remain unchanged. Every preview route remains development-only.

## Freeze contract

[TEST] tests/fixtures/jelloo-bunny4-frozen.json records the SHA-256 of accepted bunny-specs.ts (normalized newlines) and the approved garden, cottage and Bunny artwork. A new regression fails if these change without an explicit reviewed baseline/revision update. The baseline is e6f38e8f037f72348ff766580706dcdc1054c5ce.

[CODE] Git comparison against that baseline confirms no differences in Bunny specs, provider, save implementation, visual CSS or source artwork. All previously certified 100 browser runs and fifty-level solver/engine proofs still refer to this exact content. They were not regenerated or relabeled as new runs.

## Additional browser evidence

[BROWSER] Isolated origin http://127.0.0.1:3055 only; owner's localhost origin was not written. Real browser viewport overrides are now available and were verified through DOM geometry, supplementing the previous iframe-width tests.

- 320x640: actual client/scroll width 305/305 (15px scrollbar), Level 1 editable targets 56.25px square.
- Resized to 390x844 after the first rotation: same board, 1/6 moves retained. Two more actual tile clicks produced the saved 3-star win.
- Resized the open win dialog to 844x390 landscape: client/scroll width 844/844; dialog width 440px, client height 366px, scroll height 420px. Result controls remain reachable through normal dialog scroll and keyboard navigation. Close is 44x44; main/replay buttons are 46.33px tall.
- Keyboard Tab reached result controls; Next Level opened the canonical ?level=2 route.
- Synthetic historical save with 9 completions/27 stars opened in Previous adventure. Continue opened /previous?level=10, and its map link returned to /previous.
- Switching back to the current batch retained its independent 1 completion/3 stars and Level 2 continue link. The old 27 stars were not copied to the new campaign.
- Browser error log after switching revisions: no errors observed.
- Viewport override was reset after testing. No owner save import or reset.

Screenshots: jelloo-bunny-entry-portrait.png and jelloo-bunny-landscape-acceptance.png.

[NOT TESTED] No physical Android/iOS device is connected to these tools, and the browser exposes viewport overrides but no reduced-motion media emulation. Real hardware touch/OS preference checks cannot honestly be marked PASS. Existing reduced-motion CSS and movement logic are preserved; no claim of actual OS emulation is made. These hardware limits do not imply the fifty-level content needs rebuilding.

## Final gates

| Check | Result |
|---|---|
| Focused navigation + historical preview tests | 15 passed, 0 failed, 0 skipped |
| Full npm test | 400 total, 395 passed, 0 failed, 5 skipped |
| TypeScript | PASS, zero errors |
| Repository ESLint | 0 errors, 15 unchanged pre-existing warnings |
| Production build | PASS, Next.js 15.5.28 |
| Built app current/alias/previous preview and QA harness | 404 on all four |
| Built app /jelloo and /quiz | 200 |
| Accepted content/artwork hash regression | PASS |

The initial full run found one formatting-dependent source assertion for the production guard (394 pass, 1 fail, 5 skip). Restoring the established readable guard syntax fixed it; no assertion was weakened. The rerun above is final. Initial and final logs are retained.

## Exact changed areas

- app/jelloo/character-worlds/page.tsx: accepted batch becomes current local entry.
- app/jelloo/character-worlds/bunny/page.tsx: backwards-compatible local alias.
- app/jelloo/character-worlds/previous/page.tsx: preserved previous entry.
- BunnyCampaign.tsx and CharacterWorlds.tsx: revision-correct map/level links.
- lib/jelloo/campaign-v2/routes.ts: typed safe local destinations.
- scripts/jelloo-worlds-preview-qa.ts: correct disposable fixture destinations.
- tests/jelloo-world-entry.test.ts and tests/fixtures/jelloo-bunny4-frozen.json: navigation/alias/content protection.
- This report, evidence and gate logs.

Decision: GO for the same accepted local Bunny batch. It is a frozen baseline for future work, not another development restart. No Panda implementation, production push, merge, deployment, advertising/referrals activation or remote database change occurred.

## Handoff observation

[BROWSER] The owner's existing localhost:3055/jelloo/map tab displayed "Progress unavailable" before navigation to the corrected Bunny entry. That legacy Adventure route and decoder are unchanged by this correction. No owner save bytes were exported, reset or modified. This separate legacy-save warning remains unresolved; do not describe the entire pre-existing platform as error-free. The accepted Bunny revision uses its independent save and the correct entry is now open for the owner.

[BROWSER] After restoring the dev server, the old /character-worlds/bunny?level=2 bookmark redirected to /character-worlds?level=2 and rendered Peppermint Bend correctly.

[BROWSER] Final settled 390px layout check: document client/scroll widths 375/375; level-label right edge 362.67px and board right edge 349px, both within the viewport. Portrait evidence was replaced with this settled capture.
