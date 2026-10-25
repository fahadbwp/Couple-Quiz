# Phase 8.4 independent final acceptance — 25 October 2026

**Recommendation: BLOCKED — WITH SPECIFIC REASONS for Netlify launch. Local corrections are ready for owner review.** No push, merge, deployment, DNS change, production storage access, migration, ad activation or referral activation was performed.

## Git and scope

Branch: `feature/playnudge-phase-8-4`. Starting HEAD: `332da554301732a5bc0cdf8d9e960c8c8a3102b7`, clean. Preserved `846ada8`, `0f10279`, `5c4075e`, `0b85516`, `332da55`. Fetched `origin/main`: `4d28eb33e22db3edb788199c711b9579a799767c`. Read-only GitHub API confirmed `fahadbwp/Couple-Quiz`, default branch main; the configured legacy origin alias was not changed. All local branches/worktrees were inspected; no separate relevant visual-polish branch existed. Other worktrees were clean and not modified.

No original character artwork, tutorials 1–10, generator revisions, movement engine, scoring rules, unlock thresholds, quiz implementation, SQL, canonical configuration or Netlify configuration changed. Daily persistence changed only to preserve the actual winning snapshot and handle day lifecycle correctly.

Evidence labels: **BROWSER** actual manual UI interactions through computer-use; **TEST** executed automated cases; **CODE** source inspection; **NOT TESTED** unavailable real target/runtime. Browser judgments are engineering QA, not a human enjoyment study.

## Defects reproduced and corrected

1. **Level 94 layout [BROWSER/CODE]:** character name tags extended above the board into heading/move space; mode cards cramped on phones; sound used a low-contrast foreground; team instructions described a single green route. Tags now sit below sprites inside cells, the board has ear clearance, cards become three readable rows on mobile, sound uses dark text/light background, and team instructions name matching homes and collisions. No path or movement changes.
2. **Daily date frozen [CODE/TEST/BROWSER]:** the date was initialized only once per mount. A UTC subscription now checks every ten seconds and on visibility changes; a changed day remounts a fresh Daily session. A deterministic development-only fixture exercises the same session component. This browser test simulated date advancement, not an operating-system midnight clock change.
3. **Daily winning snapshot stale [CODE/TEST/BROWSER]:** victory history was updated without saving the final active rotations/moves/choices. Winning snapshot now persists; refreshing restored all 15 moves and the selected Fox branch rather than the earlier in-progress board.
4. **Daily restart branch contamination [CODE/TEST/BROWSER]:** restore assigned choices onto the shared generated level. Restoration now clones the level; restart/replay clears the saved choice as intended.
5. **Origin migration missing [TEST/BROWSER]:** implemented `/jelloo/transfer`, strict allowlisted versioned export/import, preview, conflict refusal, verified pre-write backup, interrupted-write recovery and private-data exclusions. See [transfer guide](progress-transfer.md).

## Independent acceptance results

| Area | Result and evidence |
|---|---|
| Analytics consent | PASS locally [BROWSER/TEST]. Reject → reload → gameplay → dashboard retained zero events/export disabled. Opt-in → gameplay → dashboard showed four valid deduplicated events; refresh retained them. Revocation removed events without removing Adventure. Production collection remains disabled. |
| Sensitive analytics payloads / failure isolation | PASS [TEST]: names, answers, PINs, recovery/link/IP fields, unknown events, invalid bounds rejected; disabled/unconsented recorder never requests identity/storage; async revocation, blocked storage and adapter exceptions safely return false; log bounded to 3,000 records/30 days. Browser blocked-storage injection NOT TESTED; this failure evidence is unit-level. |
| Dashboard | PASS local guard [CODE/TEST]; production HTTP guard verified separately below. Local metrics clearly identify anonymous browsers, not people, and withhold unsupported retention. Forecast is explicitly assumptions, not income or observed traffic. |
| Cosmetics | PASS [BROWSER/TEST]. Synthetic 100-completion/300-star save: equip all three, reload retained all; unequip/reload cleared effects, achievements retained. Panda Favourite on compatible Level12 wore Crown and Dream palette; refresh retained Panda. Level27 still required Cat and displayed Crown. |
| Cosmetics integrity / balance | PASS implementation boundaries [TEST/CODE], balance PARTIAL. Thresholds 20/60/100+200 stars and historical numeric 1/3/5 mapping work; local achievements are editable, not server referral proof. No measured retention/balance claim. Forged local flags cannot grant backend entitlements. |
| Single / Two / Three Jelly | PASS [BROWSER/TEST]. Actual Adventure seed42, rules4, multiRevision2: Level1 one move/one collectible; Level71 four moves/two collectibles; Level94 three moves/three collectibles. All three earned three stars and Legendary banners when equipped. Teams and share statistics were accurate; Favourite did not replace team members. |
| Daily | PASS tested lifecycle [BROWSER/TEST]. 2026-10-25 Fox/Space: saved one move, refresh restored it, Restart reset it, selected down branch, completed in15, two collectibles, three stars, streak1. Refresh restored winning board; replay reset moves and branch without doubling streak. Simulated 26 October loaded Bunny/Meadow 4×4 and completed in7, one collectible, streak2. Dedicated Daily Back/Forward lifecycle and actual wall-clock-midnight browser tests NOT TESTED. |
| Referral gates | PASS [TEST/CODE], production HTTP check below. UI and API each gated; numeric legacy mapping retained. Protocol/SQL tests use isolated PGlite, not real managed Supabase independent connections. No staging access: concurrent live qualifications, managed RLS and recovery cookies remain NOT TESTED. |
| Save transfer | PASS [BROWSER/TEST]. Actual UI download from localhost3032 → chooser/preview/import on localhost3033; Level94/93 completed/279 stars, rules4/revision2, one saved move restored after refresh. Different destination board blocked with no apply action. Fourteen focused tests cover older revisions, six slots, corruption, conflicts, quotas, rollback, stale preview, interrupted recovery and secret exclusions. |
| Responsive / keyboard | PASS tested subset [BROWSER]. Actual viewport320×844,390×844,1280×900: before/after Level94 screenshots, no horizontal page overflow after fix, cards above board, tags inside board. Transfer preview also tested320. Enter rotated Level1 exactly once. Seeded motion=false path used successfully. OS reduced-motion emulation, full assistive-technology audit and physical-device testing NOT TESTED; existing CSS/media support and unit contracts remain. |
| Friendship Quiz | PASS [BROWSER/TEST] against disposable in-memory API only: create synthetic identity, ten answers, PIN, generated share page, separate participant name, ten answers,10/10 result. No external sharing or remote DB. Real Netlify/Supabase connectivity NOT TESTED. |
| Netlify configuration/runtime | BLOCKED. Actual dashboard request reached login; site connection, paused builds, auto-publish, environment scopes, billing credits and deployed adapter cannot be verified. Local source-IP probe reproduces shared `unknown` bucket on Netlify; see launch plan. |

## Browser evidence and reproducibility

All screenshots under `evidence/` are from isolated loopback origins, never the owner's production profile. No owner production screenshot accompanied this request; before/after images reproduce the described regression with synthetic Level94 progress rather than purporting to be owner screenshots.

- `level94-before-{320,390,1280}.jpg` / `level94-after-{320,390,1280}.jpg`: real viewport widths verified from rendered DOM. Seed42,93 completed,current94. Mobile cards require vertical scroll, not horizontal scroll.
- `transfer-preview.jpg`, `transfer-conflict.jpg`, `transfer-320.jpg`, `synthetic-level94-transfer.json`: actual downloaded synthetic file, destination preview and refusal.
- `daily-win.jpg`, `daily-rollover-result.jpg`: 25/26October controlled-date actual game outcomes.
- `level94-result.jpg`, `legendary-single.jpg`, `legendary-two.jpg`, `legendary-three.jpg`, `panda-crown-dream.jpg`: actual result/equipment states.
- `analytics-opt-in.jpg`: local consented dataset, not production analytics.
- `quiz-result.jpg`: mocked persistence, real quiz UI result.
- `netlify-access-blocked.jpg`: actual login wall, not verification of paused builds.

Harness `scripts/playnudge-acceptance-qa.ts` binds only127.0.0.1 ports3032/3033, allowlists hosts, clears known remote credential aliases, blocks external ad/scripts/connects with local CSP, proxies quiz only to `scripts/platform-api-qa.ts` at3015 (test-mode in-memory mock), rejects other APIs. Fixture writes occur only after explicit fixture button use in disposable origins. This standalone script is not a production route. Daily fixture is behind development+explicit local QA guard; production route guard checked even with QA flags set.

## Quality gates

Executed on this branch, not copied from the prior report:

- Full `npm test`: **311 total,306 passed,0 failed,5 skipped**,167904.4727ms. Logs: `evidence/full-tests.txt`. Original296 baseline increased by15 actual new cases (14 transfer,1 UTC watcher); no assertions removed or weakened. Five managed integration cases remain intentionally skipped without approved staging.
- Final focused analytics/cosmetics/Daily/transfer/UTC/Phase8.3-acceptance/referral suite: **71 total,71 passed,0 failed,0 skipped**; `evidence/focused-final.txt`. Earlier narrower67 and46 runs are not the full suite.
- `npm run typecheck`: PASS,zero errors (`evidence/typecheck.txt`). An initial QA-harness request-handler typing error was fixed before the final run.
- Full `npm run lint`: PASS,zero errors,15 pre-existing warnings (`evidence/eslint-final.txt`). No claim of warning-free repository. Changed-file scoped lint and production build/HTTP outcomes are recorded in `verification.md`.

## Remaining launch blockers

1. Owner-authenticated Netlify settings/paused-build and credit verification unavailable.
2. No verified Netlify trusted client-IP boundary: current quiz PIN rate-limit identity becomes shared `unknown`. Do not spoof VERCEL or trust arbitrary forwarded headers to bypass this.
3. Export page is local only. Owner needs a separately approved old-origin release before their real Vercel progress can be exported, plus a verified private backup. Do not redirect/remove the old origin first.
4. Existing Adsterra creative/placement and consent risks are unchanged. Account category enforcement and appropriate provider/domain approval remain unverified. New ads remain disabled.
5. Actual Netlify adapter, function headers/cookies, Supabase connectivity and managed referral staging have not been tested. No owner staging access exists; production is not a substitute.

Read [one controlled Netlify release procedure](netlify-launch-plan.md), [transfer instructions](progress-transfer.md) and [monetization activation checklist](monetization.md). None of those planned external actions were executed.
