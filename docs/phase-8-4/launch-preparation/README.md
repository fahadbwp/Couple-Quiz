# Final Netlify launch preparation — 25 October 2026

**NO-GO for deployment. GO for owner review of the prepared local release.** No push, merge, Vercel/Netlify deployment, automatic-build activation, project creation/relink, DNS/canonical change, production SQL/write, referral activation or ad change occurred.

## 1. Git / integration readiness

Started clean on `feature/playnudge-phase-8-4` at `5eee853`. All eight listed commits are ancestors of HEAD: `846ada8`, `0f10279`, `5c4075e`, `0b85516`, `332da55`, `4f83ab7`, `e17207e`, `5eee853`. Fetched main remains `4d28eb33e22db3edb788199c711b9579a799767c`; it is an ancestor, with no divergent main commits. Other two worktrees were clean and untouched. All branches/worktrees were inventoried before changes. No replacement branch, cherry-pick, reset, clean or discarded code.

New work is only five local security regression tests plus this release/evidence documentation. **No production implementation or dependency changes.** Existing `lib/quiz`, quiz APIs, Adsterra widget, Jelloo generator/engine, site canonical and next.config remain byte-identical to main. Existing Phase8.4 quiz-page edits are analytics calls only, gated off in production; the quiz itself is not rebuilt here.

### Verified existing release contents [CODE + newly executed TEST]

- Analytics consent rejects collection before opt-in; bounded typed payloads exclude private fields and storage failures cannot reject gameplay. `ANALYTICS_ENABLED=false`; actual browser collector additionally requires `NODE_ENV=development`. Internal dashboard is development-only.
- `ADS_ENABLED=false`; new slots remain inactive. **This does not disable the pre-existing Adsterra widget.**
- `REFERRALS_RELEASED=false` independently gates UI/API; server milestones remain 1/3/5. Real managed concurrency remains unverified without approved staging.
- Royal Crown, Dream Theme and Legendary are already visible local-achievement features. Favourite/required Pal selection and Multi-Jelly teams retained. Thresholds and movement/scoring unchanged.
- Daily winning snapshot, restored choices and UTC rollover corrections retained.
- Level94 tag/card/sound/team-instruction corrections retained.
- `/jelloo/transfer` preserves historical raw save revisions, preview/backup/conflict handling and secret exclusions. Historical revision1/Multi revision0 cases re-executed.

See [previous independent browser acceptance](../final-acceptance/README.md) for recorded real gameplay,320/390/desktop screenshots and synthetic cross-origin transfer. Those interactions were not repeated or presented as new browser play this turn. New browser work this turn only rechecked Netlify access; it still shows login (`evidence/netlify-login.jpg`). This proves unavailable authenticated configuration access, not a missing/offline project.

## 2. Netlify trusted-IP investigation — UNRESOLVED

No speculative header acceptance added. `extractClientIp` still trusts only configured Vercel/restricted Cloudflare paths; everything else is `unknown`. Five new executed tests cover direct requests, spoofed forwarded/platform headers, current Netlify multi-client collision, existing Vercel client separation and strict IP/list/port normalization. Passing the collision test **documents the defect**; it does not certify Netlify isolation or remove the release blocker.

Official [Functions API](https://docs.netlify.com/build/functions/api/) exposes request-context `ip` and `getContext()` for framework-wrapped handlers; that is a promising alternative to parsing arbitrary headers. A Netlify staff [header announcement](https://answers.netlify.com/t/upcoming-change-stripping-exposed-netlify-headers-from-function-and-proxy-requests/52665) identifies `x-nf-client-connection-ip` for connecting IP. Neither establishes the exact installed site's adapter/version and inbound-header overwrite boundary by itself.

Public OpenNext adapter source reviewed at upstream commit `9fca3015da4d2e7eaece5196dfa4c0749c017ccf`:

- [handler template](https://github.com/opennextjs/opennextjs-netlify/blob/9fca3015da4d2e7eaece5196dfa4c0749c017ccf/src/build/templates/handler.tmpl.js) receives Netlify context and passes it into server handling.
- [server handler](https://github.com/opennextjs/opennextjs-netlify/blob/9fca3015da4d2e7eaece5196dfa4c0749c017ccf/src/run/handlers/server.ts) adapts the Request for Next; socket/connection are empty and cannot provide an app-level peer IP.
- [request context](https://github.com/opennextjs/opennextjs-netlify/blob/9fca3015da4d2e7eaece5196dfa4c0749c017ccf/src/run/handlers/request-context.cts) does not expose an app-consumable IP in that adapter structure. This is upstream source, **not evidence of the installed production artifact**.

No `@netlify/functions` dependency or verified installed adapter is present in this repository. Do not install a new context SDK or trust `NETLIFY=true`/client headers as a substitute for verification. Local Netlify CLI simulation is not the real edge trust boundary; upstream CLI issue [8532](https://github.com/netlify/cli/issues/8532) is a reported local-emulation concern, not proof of a production vulnerability.

### Exact required staging/runtime proof

Using an owner-approved disposable environment, existing-site adapter artifact/version and no production quiz credentials:

1. Determine supported `getContext().ip` propagation into actual App Router handlers; normalize one valid IPv4/IPv6 address only. Missing/outside-context/invalid data must remain `unknown`, never use arbitrary forwarded fallback.
2. If considering a header path instead, obtain an explicit platform overwrite/strip guarantee and verify on deployed ingress. Forged `x-nf-client-connection-ip`, `x-forwarded-for`, `x-real-ip`, Vercel and Cloudflare headers, duplicate/list/port values must not control identity.
3. Two genuinely independent clients must map to their own platform-observed identities; one client's failed PIN attempts must not consume the other's bucket. Shared NAT remains a known legitimate limitation of IP rate limiting.
4. Verify direct function URL, public domain, rewrite/middleware paths and concurrency; missing trusted metadata must deny unsafe fallback. Exercise durable rate limits and unchanged PIN thresholds against disposable data only.
5. Record adapter/SDK/runtime versions and sanitised pass/fail evidence, then implement the minimum verified context bridge and repeat regressions. No debug IP echo route on public production; ephemeral IP observations stay private and are deleted under the test policy.

No staging/runtime resources or deploys were created here. Until those checks, StageB remains blocked.

## 3. Existing-project owner dashboard checklist

All entries below require owner-authenticated read-only inspection. Do not assume the historical intentional stopped state is lost; do not toggle it to test.

- [ ] Correct Netlify team, existing `playnudge` siteID and `playnudge.netlify.app`; no new site.
- [ ] Linked `fahadbwp/Couple-Quiz` repository, intended main branch/base directory; never unlink/relink, which can activate builds.
- [ ] Current published deployID/SHA/URL and available previous rollback artifact. Stopped builds do not take the published site offline.
- [ ] Build status **Stopped** remains deliberate. Inspect production/previews/branch builds and queued builds.
- [ ] Separately record auto-publishing state, hooks, build-ignore commands and manual CLI/API permissions. Do not activate continuous builds.
- [ ] Account plan, actual remaining credits, spend limits/alerts and cost of one planned release; do not assume prior published pricing is the account's plan.
- [ ] Build command `npm run build`, correct base/package directory, compatible approved Node version (local verification used24.21.0), Next15.5.28 and exact OpenNext adapter version. Do not use static export or deploy raw `.next` as a static folder.
- [ ] Production vs draft/preview environment names/scopes; serverless functions runtime and secret access. Do not copy production secrets into staging.
- [ ] `SUPABASE_URL` + server-only `SUPABASE_SERVICE_ROLE_KEY`; validate established quiz configuration without test writes. Legacy aliases must not conflict. No service key gets NEXT_PUBLIC prefix.
- [ ] Canonical/build-time `SITE_CANONICAL_ORIGIN` and `NEXT_PUBLIC_APP_URL` remain approved Vercel values; `CONTEXT` is appropriate to each deploy. QA/local-insights flags unset remotely.
- [ ] No test DB overrides, referral enablement, new ad IDs or ad activation. Scope-aware full env-name inventory is in the [previous launch plan](../final-acceptance/netlify-launch-plan.md).

[Netlify build controls](https://docs.netlify.com/build/configure-builds/stop-or-activate-builds/) distinguish stopped builds from held auto-publishing. A main push normally triggers connected Git builds; verified stopped Netlify builds suppress that path and hooks, but manual deploy APIs can still update a stopped site. Unknown external CI/deploy hooks must be inspected separately. **Do not unlink/relink Git to solve authentication.**

## 4. Stage A — Vercel save-backup release (future approval required)

**Recommended artifact: the complete tested Phase8.4 branch, preserving ancestry, with remote analytics/new ads/referrals still disabled.** Do not cherry-pick `e17207e` alone: it relies on earlier cosmetics/GameView and preservation work. This is not an exporter-only release: cosmetics, their navigation, privacy copy and approved Daily/Level94 fixes remain visible. Owner approval must name that complete feature surface. If owner requires strictly exporter-only UI, stop and scope a separate release; do not silently disable or remove accepted code.

Vercel Git integration generally builds production-branch pushes ([official workflow](https://vercel.com/docs/git/vercel-for-github)). Actual team/project settings are not verified: read-only lookup of project name `friend-quiz-game` returned404 in the available connector scope; that is not proof the live project is absent. Confirm correct team/project, Git connection, production branch, build/env gates and previous READY deployment before authorizing a push.

### Exact Git sequence after separate approval — NOT EXECUTED

Record the approved feature HEAD SHA from `git rev-parse feature/playnudge-phase-8-4` after reviewing this preparation commit. Then:

```powershell
git status --porcelain
git fetch origin main
git merge-base --is-ancestor origin/main feature/playnudge-phase-8-4
git switch main
git merge --ff-only origin/main
git merge --ff-only feature/playnudge-phase-8-4
git push origin main
```

Before executing, require a clean tree, verify branch still equals the approved SHA, and independently confirm Netlify builds remain stopped and no external deploy hook runs on main. Commands are sequential gates: **stop on any nonzero exit**. If main diverges, this sequence must stop; resolve/test in an approved integration checkout, preserving both histories, rather than force-push or invent a new release. Fast-forward preserves all meaningful commits. No command above ran here except read-only fetch/ancestry checks.

Expect Vercel production build only if verified Git configuration says so. Do not also issue a duplicate CLI deploy. Verify READY, intended main SHA, production hostname, exporter200/noindex, QA/internal404, referrals503 and unchanged quiz entry/approved assets in isolated profiles. No production quiz write smoke test. If it fails, keep current published artifact and stop; do not move domains.

### Owner export and validation

On **the original Vercel browser/profile**, close other game tabs; open `/jelloo/transfer`, download file and keep the old save. Privately preview expected93 completed/current94/stars/revisions/exact saved board; no PINs, quiz answers or referral recovery tokens. Keep a second private offline copy and record file size/hash locally if desired; never send save contents into analytics, URLs or public issues. Import preview on an isolated target profile is the non-destructive schema validation check. A checksum detects copy damage, not authorship/cheat-proofing. See [full transfer/backup instructions](../final-acceptance/progress-transfer.md).

**Rollback:** record old Vercel deploymentID before release; use the platform's verified rollback to that artifact, not `git reset`/force-push. Keep the downloaded file and original browser data. Git main will still contain new commits after an artifact rollback; record that state and freeze unintended subsequent auto-publishing. Any desired source revert is a separately reviewed normal commit. An exporter rollback removes the page but must never clear progress. Keep Vercel alive throughout migration.

## 5. Stage B — ONE controlled Netlify release (future approval required)

Only after dashboard checklist, trusted-IP proof/fix, quiz runtime/configuration, credit review, private Vercel save backup and ad-compliance decisions pass, request approval naming exact siteID, commit, artifact procedure and cost ceiling. Continuous builds remain stopped. No DNS/canonical cutover or Vercel disablement.

1. Select the approved, pinned Netlify CLI/adapter after confirming compatibility and correct existing siteID. Link only the local checkout to that existing site when authorized; **do not reconnect the site's Git repository**. Keep credentials in approved private local storage, never command-line token flags/logs.
2. Build **once locally through the Netlify build pipeline**, with reviewed environment scopes and approved adapter, using `netlify build --context production`. Plain `npm run build` validation alone is not a complete adapter artifact. Inspect packaged functions/images/static assets/headers and commit provenance without live publication. No cloud build activation.
3. With explicit owner deploy approval, publish that inspected artifact once to the existing site using the pinned CLI's documented `netlify deploy --prod --no-build` flow and exact existing siteID. Validate the resolved publish/functions/edge artifact paths for that version first; never let the deploy command rebuild implicitly or auto-create a project. [CLI build](https://cli.netlify.com/commands/build/) is local; [CLI deploy](https://cli.netlify.com/commands/deploy/) builds by default unless `--no-build`. No draft-upload/second production-upload cycle is planned here. If a remotely tested draft is required, obtain a separate explicit deployment/budget approval rather than claiming zero additional usage.
4. Verify READY/published commit and target hostname, HTTP guards, function behavior with approved non-production fixtures only, assets/redirects/CSP, quiz links and closed referral gate. Owner chooses file on new origin; preview → verified backup → explicit import. Confirm Level94 board/progress after refresh, then Daily/Zen/Trials/Favourite/cosmetics. Different progress blocks; do not clear it to force import.
5. Keep Vercel save/file and previous Netlify deployment artifact. If acceptance fails, restore the known published Netlify artifact without rebuilding; leave builds stopped and Vercel available. Import recovery follows retained journal/backup and refuses other-tab edits; do not restore cookies or erase local saves.

Published credit rates do not verify actual account billing. One manual production deployment may consume credits plus usage; owner must confirm the account-specific amount before authorization. Zero Netlify build/deploy requests were issued during this preparation.

## 6. Advertising / revenue go-no-go

Existing widget: `components/ads/AdsterraFooter.tsx`, `pl31875259.profitableratecpmnetwork.com/.../invoke.js`, displayed on quiz creation, play, share, result and scoreboard surfaces (including PIN/form contexts). Domain/ID/placements unchanged. Earlier adult/dating/gambling observations remain an unresolved risk, not a claim every visitor currently receives them. No live creative requests or provider settings changes were made here.

Owner must verify site-specific provider category restrictions, adult/dating/gambling/deceptive-download exclusions, geo/frequency enforcement and escalation with provider account/support. Do not promise perfect family-safe filtering. If insufficient, propose exact removal/restriction impact for approval; do not remove silently. Current analytics consent is not an advertising CMP and does not gate this legacy widget.

For new AdSense, verify target hostname ownership, account approval and [site Ready review](https://support.google.com/adsense/answer/12131223?hl=en), valid provider-issued verification/ads.txt, audience and regional consent/privacy requirements. Safe future placements: homepage after discovery/All Games after list, permitted Jelloo result transitions only; none during rotations, moves, quiz answers/PIN/submission. New ad code remains disabled. Compare actual provider-paid impressions/revenue with legitimate traffic and operating costs; slot presence and ad opportunities are not earnings. $1,000/month NET is an objective, not observed income or a guaranteed forecast.

Use the existing [activation checklist](../final-acceptance/monetization.md) rather than rebuilding monetization. Google H5 eligibility, Android/AdMob and new activation remain separately approved future work.

## Required owner actions / decision

1. Sign into the existing Netlify project and provide the checklist observations privately; no pasted secrets, no build toggles.
2. Approve a disposable runtime/staging verification route for trusted IP and quiz configuration; production credentials cannot substitute.
3. Resolve provider creative/consent decisions; explicitly approve any existing-widget change.
4. Review the complete tested StageA feature surface and separately approve its main integration/Vercel release; privately export original progress after READY.
5. Only after all StageB gates pass, approve one exact existing-site Netlify deployment with cost ceiling. Keep continuous builds stopped and Vercel/canonicals unchanged.

**Current recommendation: NO-GO for launch; prepared local work is ready for review.** Final executed quality results are in `verification.md`; remote runtime, actual account settings and owner save export remain unverified.
