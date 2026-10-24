# PlayNudge Phase 8.4 — local acceptance report

Date: 2026-10-24. Owner review required. **No push, merge, deployment, remote SQL, referral activation, new live advertising or payment operations.**

## Baseline and preservation

Started clean on main at `4d28eb33e22db3edb788199c711b9579a799767c`; fetched origin/main, verified the expected Phase 8.3 ancestor, and created `feature/playnudge-phase-8-4`. Baseline was 267 tests: 262 pass, 0 fail, 5 skipped. All prior ancestry is preserved. Source artwork, tutorials 1–10, generators, solving/power/scoring engines, Adventure save schema, character/70/90 unlock thresholds, quiz backend, existing Adsterra script, canonical domains and Netlify configuration are unchanged. A separate cosmetic-preference key was added; existing player saves were not reset.

## IMPLEMENTED

1. Shared strict nineteen-event analytics interface across Jelloo and Friendship Quiz, local explicit consent/revoke, DNT/GPC, bounded storage and logical dedupe. Production collection has no ingest adapter and remains disabled.
2. Development-only `/internal/growth`, including UTC browser/session/event distinctions, limited funnels, honest insufficient-data states, private manual export/memory-only import and editable assumption-based economics/sensitivity. Production must return 404, even with local flags set.
3. New disabled ad-placement boundary with no script, provider ID or request. Existing live advertising is preserved and its quality/consent issues are documented separately.
4. Royal Crown, Dream Theme and Legendary Celebration with opt-in equip/unequip, five-character accessory previews, live single/team rendering, motion support and no solving/statistics changes. Adventure alternatives: 20 levels / 60 levels / 100 levels plus 200 first-100 stars. These are balancing assumptions for review, not data-driven retention claims.
5. Numeric referral reward compatibility 1/3/5, renamed presentation and retained legacy badge; release gate remains false. Forged client status cannot grant referrals under the closed gate. No DB migration required for numeric mapping.
6. Referral threat model, another real isolated SQL test for repeated registration/copied recovery, and clear staging limitations.
7. Android expansion and explicit cross-origin save/recovery migration notes; no app, offline engine or migration implemented.
8. Two browser-reproduced Daily lifecycle corrections encountered during regression: load persisted state once per mount; make already-recorded wins return the same store identity so the result effect settles. No Daily puzzle-generation, streak rule, scoring or save-shape change.

## TESTED — exact command evidence

| Check | Result | Evidence |
|---|---|---|
| Focused Phase 8.4 + referral + Daily result suites | **47 total, 47 pass, 0 fail, 0 skipped** | [focused-tests.txt](evidence/focused-tests.txt) |
| Full `npm test` | **296 total, 291 pass, 0 fail, 5 skipped** | [full-tests.txt](evidence/full-tests.txt) |
| TypeScript | **PASS: zero errors** | [typecheck.txt](evidence/typecheck.txt) |
| Full ESLint | **PASS: zero errors, 15 pre-existing warnings**; scoped new/touched feature files zero errors/warnings | [eslint.txt](evidence/eslint.txt) |
| Production build | **PASS: Next.js 15.5.28, 21/21 static pages** | [build.txt](evidence/build.txt) |
| Production route/release guards | **PASS: internal/QA 404 + noindex, referral POST 503/no-store, public routes 200** | [production-guards.txt](evidence/production-guards.txt) |

The additional 29 tests explain 267 → 296: 16 analytics/report tests, 11 economics/ads/cosmetics/gates tests, one SQL recovery/registration test, one real-engine Daily result idempotence test. The five skipped remote Supabase cases remain skipped; no tests were weakened. Full ESLint baseline had 15 existing unused-variable warnings, zero errors. A first 295-test pass preceded the additional Daily result regression; the linked final log is the 296-test run after both Daily fixes.

## Actual browser acceptance (AI-operated QA, not human retention validation)

Development interactions used a disposable **127.0.0.1:3028** origin with separate browser storage from owner production/dev ports. Adventure fixtures used seed **42**; Daily used the stated UTC date-derived seed. Zen checks covered its size control only; its random seed was not captured and no solved-Zen claim is made. `scripts/playnudge-phase84-qa.ts` is standalone loopback code, not a Next route and not deployed. Credential-cleared game server blocks external ad scripts with a local-only CSP; quiz requests proxy only to the existing in-memory mock API on **127.0.0.1:3015**. No real advertisement requests, real quiz publication, production data or external social messages were used.

| Case | Evidence / result |
|---|---|
| New save, stale equipped flags, 320px | All three rewards disabled/unpressed; gameplay Bunny without Crown or Dream. No overflow: innerWidth 320, document scrollWidth 305 (scrollbar). [New save](evidence/new-save-320.jpg) |
| Advanced save | 100 completed levels, 300 stars, same v1 Adventure format/current generator revisions. Three rewards equip/unequip through real controls, persisted after refresh; no real progress overwritten. [320px](evidence/collection-320.jpg), [390px](evidence/collection-390.jpg) |
| Five-character Crown | Selected Bunny/Panda/Cat/Octopus/Fox individually through preview select; each retains its own approved sprite with one accessory. Actual Favourite Panda at compatible L12 and Cat-required L27 both display correct identity with crown. [Panda desktop](evidence/favourite-panda-desktop.jpg) |
| Single victory / controls | L1 seed42: index13 once, 1 move, 1/1 collectibles, 3 stars; Legendary banner; Next Level enters L2. Win also works before opt-in. [320px result](evidence/victory-320.jpg) |
| Two-Jelly | Actual unlocked Adventure L71 seed42, reference actions 4,7,8,10; 4 moves, 2/2 collectibles, 3 stars, Bunny/Panda unchanged, two crowns and Legendary result. QA reference route was read, then actions entered manually on actual Adventure. [Desktop result](evidence/two-jelly-victory-desktop.jpg) |
| Three-Jelly | Actual Adventure L91 seed42, actions 1,6,7,9,12,14; 6 moves, 3/3 collectibles, 3 stars, Bunny/Panda/Cat unchanged, three crowns and Legendary result. [390px result](evidence/three-jelly-victory-390.jpg) |
| Motion | Existing Adventure fixture motion=false yields computed celebration animation `none`; preview also respects saved preference. CSS additionally handles OS reduced-motion, but OS preference emulation was unavailable. |
| Mobile / keyboard | 320×844, 390×844, 1280×900. No horizontal page overflow on collection/report/tested game states. Cosmetic buttons measured 44px or more high. Enter rotates tile/equips, Tab advances consent controls with visible outline. Existing result controls remain usable; no overlay intercepts Next/Replay. |
| Local analytics | No pre-opt-in collection; opt-in produces actual local events. Initial single-board sample: 5 events, one browser/session. Later sample: **37 events**, ten normalized visits, six mode starts, Daily 1/1 and quiz aggregate 1→1→1→1. Refresh leaves 37 unchanged; Daily replay does not add another logical completion. These are **test-browser numbers**, not platform usage. |
| Consent deletion | Revoke clears log/identity; Export disables and metrics return to Insufficient data. Advanced 100-level progress and cosmetic preferences remain. [Local report 390px](evidence/growth-390.jpg) |
| Model | Changing eCPM from 1 to 3 changed base revenue 315→945 and net 255→885; assumptions editable and sensitivity correct. Keyboard focus checked. [Desktop report](evidence/growth-desktop.jpg) |
| Quiz regression | Existing creator modal → ten answers → synthetic PIN → share page → copy link → named test participant → ten answers → 10/10 result, against mock API only. Analytics shows create/share/start/complete once and result event without names/answers/PIN/link properties. Native social delivery was not exercised. |
| Daily lifecycle | UTC 2026-10-24, generated seed `seedFromUtcDate(date)`, Octopus 5×5. Before: tile input reverted to 0 moves/original rotation. After: 1 move/rotation persisted through refresh. Solver reference 0,0,0,1,2,3,4,4,4,5,6,7,9 manually entered; actual win 13 moves/2 collectibles/3 stars; result modal opens and streak remains one day on replay. [Daily result](evidence/daily-win-390.jpg) |
| Existing side modes/navigation | Zen switches 5×5→4×4; Panda Trial1 enters and visible Back returns to collection. Browser Back/Forward between collection/report and refresh restore saved preferences. Daily/Zen completion coverage beyond the listed Daily board was not claimed. |
| Invite gate | Actual Invite UI says unavailable; direct handler test returns 503/no-store before DB configuration. Numeric mapping tests do not enable release. |

During live code editing, React Fast Refresh briefly reported hook-order errors when a hook gained state; full reload restored the new hook signature. That transient HMR event is not reported as a clean production run. Browser-driven Daily testing additionally exposed the inherited result loop and it was corrected/tested rather than ignored. Production-mode checks are recorded separately below.

## Documentation and limitations

- [Analytics taxonomy, privacy, reporting methodology and economics](analytics-and-economics.md)
- [Advertising risk/placement policy, Android architecture and origin migration](ads-android-and-origin.md)
- [Reward mapping, balance assumptions and referral threat model](rewards-and-referral-security.md)
- [Exact changed-file inventory](changed-files.txt)

**NOT TESTED:** physical Android/iOS, other browser engines, OS-level reduced-motion emulation, real market retention/revenue, authenticated staging analytics, native share delivery and every possible legacy board/UI state. A pre-existing quiz question counter can show 11/10 behind its PIN modal; existing Daily share world badge can differ from board theme. Those presentation issues are outside this implementation and remain for owner review.

**BLOCKED:** owner-provided disposable Supabase staging; independent PostgreSQL-connection concurrency, managed RLS/JWT/PostgREST/cookie/proxy behavior, production referral verification and operational abuse controls. PGlite is real SQL on one isolated connection, not real Supabase concurrency or proof of unique humans.

**REQUIRES OWNER APPROVAL:** production collection/consent policy and ingest infrastructure; referral staging/migration/activation and authoritative entitlement wiring; ad account/category controls or replacement of existing ads; premium visual/balance acceptance; Android/offline build; domain/save/recovery migration; push/merge/deploy. The $1,000 target is an editable business scenario, not guaranteed earnings.

Production-mode HTTP checks ran against loopback 3030 with known database aliases forced to an unusable local endpoint and both QA flags enabled. Browser independently confirmed internal growth and Jelloo QA return 404 ([screenshot](evidence/production-internal-404.jpg)). Existing public routes return 200 and cosmetic/Invite pages are noindex. No production deployment was created.

Local commits and final clean-tree results are appended after verification. Stop at owner review; no Phase 8.5.

## Local implementation commits

- `846ada8` — shared opt-in analytics, reporting, economics and quiz instrumentation.
- `0f10279` — disabled future ads, privacy route and platform safety notes.
- `5c4075e` — premium cosmetics, achievement entitlements and legacy reward presentation.
- `0b85516` — browser-reproduced Daily lifecycle fixes and regression.
- Final evidence/security commit contains this report, standalone QA harness, additional SQL recovery test and exact outputs. Its SHA is supplied in the owner handoff; resolve with `git log -1` on this feature branch.

Final checks: [credential-pattern/protected-path scan](evidence/safety-check.txt), [scoped ESLint](evidence/scoped-eslint.txt). No protected source/config paths changed and no credential-pattern matches were found in changed text files (heuristic, not a full secret-history audit). All three temporary loopback servers were stopped; viewport override reset and test tabs closed. Working tree must be clean after the final evidence commit. Main remains at the release ancestor; this branch has not been pushed.
