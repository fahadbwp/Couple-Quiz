# Phase 7 Task 5 — Production integration review

Date: 2026-10-23. **Readiness: PARTIAL; release blocked pending staging and Preview safety verification.**

Existing implementation was retained. Initial branch: `feature/jelloo-phase-7`; HEAD `91e4e97f588dfd2147eae8c467284a7d053f982e`. Four existing Phase 6–7 commits are ahead of the local origin/main reference. Existing uncommitted Task 4/5 implementation and evidence were preserved. No push, merge, remote migration or deployment occurred.

## Changes in this integration task

- `package.json`, `package-lock.json`: Next.js and matching eslint-config-next 15.5.27 → 15.5.28; resolved sharp 0.35.5. Same framework major/minor and React version. No force audit fix, Tailwind major upgrade or hosting configuration rewrite.
- `app/jelloo/GameView.tsx`: browser-reproduced verification heading omitted the level number. It now displays the actual level ID. No tutorial definitions or game rules changed.
- `scripts/jelloo-local-qa.ts`: disposable loopback-only Next/PGlite harness using the actual referral handler, proof verification and SQL migration. Real Supabase credentials are cleared, other API routes blocked, and data disappears when the process stops. Local controls exercise expired links and lost responses without changing production handlers.
- `app/jelloo/qa/page.tsx`, `app/jelloo/qa/LocalQAGame.tsx`: explicitly opted-in development-only test surface for actual generated Levels 71/91, seed 42. Isolated reducer does not write adventure progress. Production returns 404 even with the QA flag enabled.
- `tests/jelloo-release.test.ts`: two regression tests covering test-surface isolation and actual 71/91 rotation, Undo, Restart and completion semantics.
- This report and `docs/jelloo/integration-evidence/`: reproducible logs and browser screenshots.

The broader working-tree diff also contains earlier Task 4 fixes, Multi-Jelly and the original referral implementation. Those are preserved work, not claimed as newly implemented here.

## Dependency security

The original eight reported affected package entries comprised one critical and seven high findings; package counts are not eight independent vulnerabilities.

| Affected package | Inspected installed version | Result |
|---|---|---|
| next | 15.5.27 → 15.5.28 | Critical image optimizer and high Server Actions advisory remediated by patch |
| eslint-config-next | 15.5.27 → 15.5.28 | Matched framework; transitive braces finding remains |
| @next/eslint-plugin-next | 15.5.27 → 15.5.28 | Transitive finding remains |
| tailwindcss | 3.4.19 | Transitive finding remains |
| fast-glob | 3.3.1 / 3.3.3 | Transitive finding remains |
| chokidar | 3.6.0 | Transitive finding remains |
| micromatch | 4.0.8 | Transitive finding remains |
| braces | 3.0.3 | Direct advisory; no published patched version at inspection |

Official references: [Next image optimization advisory](https://github.com/advisories/GHSA-2464-fhr4-w9xw), [Server Actions DoS advisory](https://github.com/advisories/GHSA-p3m5-59mp-jv5r), [braces recursion advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).

The image issue concerns upstream image processing on affected Linux configurations. Source search found no next/image use, dangerouslyAllowSVG configuration or Server Actions declaration; exploitability of this deployed site was not demonstrated. Patching is still appropriate because unused framework endpoints/configuration can change. The braces problem affects glob parsing in the build/lint toolchain. No application API accepting user-controlled globs was found. Untrusted build/repository input remains a risk; this is not a claim of zero exposure. Suggested major Tailwind changes or framework-config downgrades were not applied merely to suppress audit findings.

After patch: **full audit 7 high, 0 critical; runtime `npm audit --omit=dev` 0 vulnerabilities**. Full audit remains failing due to those seven tooling entries. Hosting compatibility is supported by the successful Next production build; real Netlify/Vercel builds were NOT TESTED and no deployment was attempted.

## Database boundaries and security

Owner confirmed staging access is unavailable and instructed local QA to continue. **Live Supabase RLS/PostgREST access, independent-connection concurrent transactions and rollback behavior: NOT TESTED.** No staging resources created; no remote migrations or production credentials used for these tests.

Actual additive referral SQL was executed locally in PGlite with anon, authenticated and service_role roles. The existing 18 referral tests exercise private RPC/RLS boundaries, repeatable migrations, self-referral and attribution rejection, immutable tutorial proofs, recovery, expiry, nonce/session validation, rate limits, duplicate qualifications, threshold rewards and transaction rollback. Local Promise concurrency is not proof of independent PostgreSQL connection locking behavior. Quiz tables are outside this migration and local QA blocks other APIs.

Anti-cheat was retained: existing local adventure progress cannot substitute for the server-verified ten-level journey. Anonymous identities prove valid puzzle actions, not unique human friendship; recovery-code sharing and distributed account farming remain design limitations. Approved Golden Clover/Rainbow Trail art remains unavailable: entitlements persist, but missing cosmetics are explicitly not applied. No replacement artwork was introduced.

## Browser evidence — real IAB browser

Local disposable server at port 3012; outer viewport 1280×720. Narrow invite views used same-origin frames with actual CSS viewport widths 320 and 390, height 844. Only the disposable server relaxed framing to same-origin; production CSP was unchanged. No physical phone, native touch event, Safari, iOS, Android, landscape or native OS share-sheet claim is made.

### Referral flow

1. Created inviter at 127.0.0.1; generated/copied its link. Opened the link at localhost, using a separate cookie identity; created the participant and accepted attribution.
2. Played all frozen original verification Levels 1–10 through tile buttons: winning rotation counts respectively **1, 2, 7, 10, 8, 9, 11, 15, 13, 25**. These are immutable tutorial boards, not random seeds. Solver reference turns guided the AI tester; this was correctness QA, not an unassisted human difficulty study.
3. Dropped the Level 1 submit response after SQL commit. UI showed the network failure; retry recovered the checkpoint without duplicate credit. Reload confirmed Level 2. All later proofs were submitted through the UI, ending with qualified status after Level 10.
4. Reloaded inviter: one qualified referral and Golden Clover entitlement persisted.
5. Independently prepared another earned identity through the real local API using legal ten-level proofs, then restored it using the browser recovery form. Reward survived reload. This recovery fixture was API-prepared, not a second claim of ten levels browser-played.
6. Expired a link only in disposable SQL; UI showed the invalid/expired-link error. Narrow-screen copy action showed Copied. Invalid recovery submission was disabled.
7. Victory dialog forward/reverse Tab checks confirmed the close/verify focus cycle. Rapid sequential tile clicks were exercised. Physical double taps, full screen-reader coverage and native sharing remain NOT TESTED. Duplicate request behavior is covered by API/SQL tests.

Screenshots: `integration-evidence/invite-320.png`, `invite-390.png`, `referral-earned.png`. Visual narrow views showed wrapping without visible horizontal overflow; no instrumented cross-frame scroll-width measurement or physical-device usability certification is claimed. Local network-response loss was tested; OS-level offline mode was not.

### Actual Multi-Jelly levels

- **Level 71, seed 42:** 4×4 Two-Jelly board; manual clockwise rotations at indices 4 and 7; victory at two moves, both collectibles and both Jelly homes. Undo/Restart were exercised; their exact retained-move semantics are also asserted in the new test.
- **Level 91, seed 42:** 5×5 Three-Jelly board; manual clockwise rotations at indices 6 and 12; victory at two moves, three collectibles and three Jelly homes.
- Screenshots: `integration-evidence/multi-71-win.png`, `multi-91-win.png`.
- The isolated test wrapper reuses verification presentation, so its result text includes referral wording. This is a QA wrapper limitation, not proof that the adventure result screen has that wording. No normal adventure save/unlock was modified. Multi-Jelly gameplay was not changed.

Production server at 127.0.0.1:3013, built with Next 15.5.28: `/jelloo/qa?level=71`, `?level=91`, `?width=320` and `/_qa/control?fault=offline` all returned **404**, despite `JELLOO_LOCAL_QA=1`. Evidence: `production-qa-guard.log`.

## Verification

| Check | Result | Evidence |
|---|---|---|
| Full npm test | **223 total; 218 PASS, 0 FAIL, 5 SKIPPED** | tests.log |
| Focused referral/release tests | **20 PASS, 0 FAIL, 0 SKIPPED** | focused-tests.log |
| Scoped Jelloo ESLint | PASS, zero errors/warnings | scoped-eslint.log |
| Production build | PASS | build.log |
| TypeScript | PASS, zero errors | typecheck.log |
| Full ESLint | PASS exit; 0 errors, 4 existing warnings | lint.log |
| Runtime dependency audit | PASS, zero vulnerabilities | integration-audit-runtime.json |
| Full dependency audit | FAIL release-clean criterion: 7 high tooling findings | integration-audit-after.json |
| Production QA guard | PASS, four 404 responses | production-qa-guard.log |
| Referral/Multi browser QA | PASS for cases above; device/staging limitations remain | five screenshots |
| Supabase staging | NOT TESTED, no owner access | owner direction |
| Vercel/Netlify deployment | NOT TESTED; not authorized | no deployment |

The full-suite count increases from the earlier Task 5 report's 221/216/5 by exactly two new release tests. Five skipped tests must not be represented as passes. Existing full-lint warnings are the unused quiz event argument and unused values in capture-mechanics.mjs/capture-zen.mjs; these unrelated files were not changed.

## GitHub and release safety

GitHub resolves the older advertisingbwp-cmyk repository URL to **fahadbwp/Couple-Quiz**, which is **public**. Prepared local branch **codex/jelloo-task5-integration**, preserving the four unpublished Phase 6–7 commits and all existing working changes. Integration and earlier Task 4/5 changes remain uncommitted for owner review; no remote branch or PR was created. No push is authorized here.

Vercel repository lookup identified project `click-clique`. Project detail/environment metadata requests returned **403**. Therefore Preview protection and whether Preview shares production Supabase are **NOT VERIFIED**. This blocks push/release, rather than implying a protected Preview. No secret-decryption request or production database call was made.

A local check compared current .env.local secret values with 864 tracked/nonignored files and found no exact matches; .env.example is the only tracked environment file. This is not an exhaustive historical secret audit or proof that every possible secret format is absent. Disposable recovery secrets are not saved in the evidence/report.

## Required owner gates

1. Supply approved disposable staging access; verify independent-connection races, RLS/PostgREST privileges, rollback and full browser journey there.
2. Confirm Preview access protection and non-production environment isolation before any push. Repository is public.
3. Review seven residual tooling advisories and approved cosmetic availability. Run device-specific touch/orientation/native-share QA.
4. Separately approve push/deployment after reviewing the branch/diff and these limitations.

No new mechanics, artwork, original tutorial definitions, quiz functionality, unlock thresholds or Phase 8 work were introduced. No production Supabase writes. Stop at owner review.
