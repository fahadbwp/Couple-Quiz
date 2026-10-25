# Netlify context-IP fix and Vercel export preparation

25 October 2026. Started clean on `feature/playnudge-phase-8-4` at `2d0db17448c30d0d070c3db02c2fa98086815210`. All previous work preserved. No push, main merge, deployment, Netlify build activation, remote SQL/data change, domain change or new ad/referral activation.

## Owner-verified facts accepted without repeated dashboard audit

Existing `playnudge`, repository `fahadbwp/Couple-Quiz`, Next.js, build `npm run build`, configured publish directory `.next`, builds **STOPPED**, Free plan300 monthly credits,285 available at owner's inspection,0/1 concurrent builds,last published23October2026. These are owner-provided screenshot observations, not a new account query or a current spending guarantee. Stopped builds are intentional; existing published website is not assumed offline.

## Trusted-IP issue: local fix implemented; live acceptance BLOCKED

`lib/quiz/security.ts:extractClientIp` now uses the official **request-context** API `getContext().ip` on `NETLIFY=true` when Vercel's existing marker is absent. It normalizes one IP through the existing validator. Missing/outside-request context, wrong type, invalid IP, port or chain returns `unknown`. There is **no Netlify IP-header fallback**, including when a Cloudflare proxy flag exists. Existing Vercel precedence and restricted-Cloudflare behavior outside Netlify remain unchanged.

Exact header trusted by this fix: **none**. In particular `x-nf-client-connection-ip`, `x-forwarded-for`, `x-real-ip` and spoofed platform headers are ignored in the Netlify path. The environment marker selects a platform branch but **does not authenticate identity**. It must be accompanied by a valid request-local SDK context. A forged HTTP header cannot populate a Node AsyncLocalStorage context. Compromised server code/runtime is outside this trust model; no public setter, fingerprint, new identity database, IP logging or additional retention was introduced.

### Evidence establishing the boundary

- [Official Netlify Functions API](https://docs.netlify.com/build/functions/api/) defines `context.ip` as the client IP and `getContext()` as access to active request context from framework wrappers, throwing outside a request. This is a platform metadata contract, not a promise that every old installed adapter exposes it.
- Reviewed official registry `@netlify/functions@5.3.0` implementation: `getContext` reads `.context` from request-local AsyncLocalStorage stored under the SDK's shared symbol, never from the application `Request.headers`. Installed/pinned5.3.0 plus type-only dependency2.8.0 in lockfile; package enginesNode18+, compatible with Next15's support floor. Latest6.0.3 was researched then replaced **before final verification** because it unnecessarily requiresNode22.12+. No Node deployment setting changed.
- Prior pinned [OpenNext handler](https://github.com/opennextjs/opennextjs-netlify/blob/9fca3015da4d2e7eaece5196dfa4c0749c017ccf/src/run/handlers/server.ts) receives platform context and converts a Request for Next; its synthetic socket/connection do not provide a trustworthy peer IP. This upstream source is not evidence of this site's installed version. The SDK approach avoids depending on adapter internals/header rewriting.

Tests exercise the **actual pinned SDK store** in isolated processes, not a mocked header reader. Only tests seed the SDK's private symbol; production calls only its public API. They prove app integration/async isolation and spoof rejection under supplied platform context, not that deployed ingress attests metadata. HTTP clients cannot write that server-memory symbol. Missing context still deliberately shares `unknown`, so unsupported adapters remain a release blocker rather than silently accepting attacker data.

### Exact remaining runtime proof (no production quiz credentials)

In separately approved disposable/runtime verification, inspect exact installed adapter/runtime, verify real App Router handlers expose SDK context, and use two independent clients across async/concurrent requests. Verify forged individual/duplicate/chain IP headers cannot change the observed platform identity through public domain, rewrites and direct function paths. Confirm clientA's five failed attempts do not consume clientB's bucket, using disposable records; shared NAT remains a known limitation. Missing/invalid context and durable-storage failures must retain fail-closed behavior. Verify function cookies, auth origin/CSRF handling and durable Supabase RPC semantics. Never publish an IP-echo debug route or use the owner's quiz data for this exercise. If the adapter does not populate SDK context, stop: do not add a raw-header fallback, spoof Vercel or relax limits.

## Transfer route and dependency analysis

Existing `/jelloo/transfer` is unchanged. `TransferView` initializes React state only: no mount effect, storage writes, migration or save reset occurs merely by opening it. Reads happen on explicit export/file selection; game-slot writes only after explicit confirmed import/recovery. New regression verifies export+preview preserve every source byte and create no backup/journal keys. Read-only rendering is code evidence; earlier browser cross-origin round-trip evidence remains in [final acceptance](../final-acceptance/README.md), not misrepresented as new gameplay this turn.

The library imports existing historical Adventure decoder, Daily/Zen generation and validation, Power Trial/Favourite definitions, and Phase8.4 cosmetic preferences. Export uses a six-key allowlist; preserves raw Adventure revision/rules/Multi snapshot, completed levels/stars, valid optional Daily/Zen/Trial/Favourite/cosmetics. Invalid/unsupported optional data rejects instead of resetting it. File size64KB; strict version/envelope/schema validation; preview before writes; different meaningful progress blocks import; destination backup verified first; interrupted writes rollback or retain recovery journal; prior backups are not overwritten. Missing optional slots never delete destination data. Quiz secrets/private tokens, analytics and cookies are excluded. Local achievement files are editable, not server referral attestation.

**Recommendation: complete tested branch integration.** Transfer core is mostly self-contained, but `e17207e` also modifies GameView which already consumes earlier cosmetics/analytics state. Extracting that commit alone is not self-contained. A genuinely exporter-only release is possible only by separate deliberate extraction of page/library/schema dependencies and retesting against main; it would not preserve the same tested artifact and is unnecessary risk here. No extraction/cherry-pick/replacement branch made.

Complete branch release will visibly include cosmetics/navigation plus approved Daily/Level94 changes; it is not disguised as exporter-only. Remote analytics collection, new ad layer and referrals remain disabled. Existing Adsterra is unchanged, including its separately documented creative/consent risks. Owner approval must cover this honest feature surface.

## Stage A: GO for review; NO-GO for execution until separate approval

Review final local feature SHA, then verify actual Vercel project/team/production Git branch and previous READY rollback artifact. Existing Netlify stopped-build facts are accepted; inspect **only** unknown hooks/auto-publish/external CI that could react to main. Do not toggle/relink Netlify to inspect. Vercel Git production-branch pushes normally build automatically, but actual target/project binding still needs confirmation; do not issue a duplicate CLI deploy.

Future exact sequence (NOT EXECUTED; stop on any failed command):

```powershell
git status --porcelain
git fetch origin main
git rev-parse feature/playnudge-phase-8-4
git merge-base --is-ancestor origin/main feature/playnudge-phase-8-4
git switch main
git merge --ff-only origin/main
git merge --ff-only feature/playnudge-phase-8-4
git push origin main
```

Require clean status and exact approved feature SHA before switching. If main diverges, stop and separately integrate/test without losing either ancestry; never force-push, squash or reset. All prior commits remain through fast-forward. Main remains untouched by this task.

After intended Vercel commit isREADY: verify `/jelloo/transfer`200/noindex, QA/internal404, referral503 and existing quiz/game entry in an isolated profile, without production quiz writes. Owner privately exports from the **original Vercel browser/profile** after closing other game tabs. Confirm approximately93/100,Level94,expected stars/revisions/board in file preview; keep file plus original origin save and a second private copy. Export is not automatic cloud sync. Checksum/size can detect accidental file damage, not prove legitimacy. Never paste file contents/tokens into chat, URLs or analytics.

Rollback: restore recorded Vercel deployment artifact without rebuilding; leave old browser storage/export file intact. Platform rollback does not rewind Git main; freeze unintended auto-publishing and document artifact/source mismatch. Any source revert requires a normal reviewed commit, not history rewriting. Keep Vercel alive after export.

## Stage B: NO-GO pending runtime/configuration/backup acceptance

Do not recheck accepted project/repo/build/credit screenshots absent material change. Remaining unknowns only: exact adapter and SDK-context propagation, function/cookie runtime, private env names/scopes, durable quizSupabase configuration, adapter artifact output, external hooks/publish controls and previous production rollback artifact availability. No runtime probe using production credentials. Account credit balance remains the owner's inspection-time figure, not a live assertion.

Required names/scopes: existing server `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (never public-prefixed), nonconflicting legacy aliases; approved build-time `SITE_CANONICAL_ORIGIN` and `NEXT_PUBLIC_APP_URL` stayVercel; proper platform `CONTEXT`; local QA/test DB flags absent remotely. No new context secret or IP-header setting required. Netlify SDK/runtime must support the reviewed API. Do not change Supabase tables/RPC privileges or activate referrals.

After runtime proof, private Vercel backup and remaining controls pass, obtain approval for exact existing siteID/commit and one manual deployment with owner cost ceiling. Preserve stopped continuous builds. Use reviewed/pinned CLI and existing local site binding only; do not unlink/relink repository. Build once locally through Netlify's adapter pipeline (`netlify build --context production`), inspect packaged functions/edge/images/headers/static output, then one explicitly approved `netlify deploy --prod --no-build` with exact existing siteID and verified artifact paths. The configured `.next` directory relies on the Next adapter; it is not a plain static upload. No draft-plus-production second upload assumed. Do not run these commands during preparation.

Verify intended published commit, production guards, headers/redirects, approved non-production runtime fixtures and private owner import preview. Explicit import creates/verifies destination backup before writes; refuse conflicts instead of deleting progress. Check Level94 after refresh and optional saves. Keep original Vercel data/file. Restore recorded prior Netlify artifact if acceptance fails without rebuilding; builds remain stopped. No DNS/canonical switch or Vercel shutdown in this verification release.

Owner must confirm existing ad creative/category/consent control decisions separately. New ads/referrals stay off. No new advertising system, fingerprinting, Phase8.5 or monetization feature introduced.

## Changed files / results

Production changes: `lib/quiz/security.ts`, `package.json`, `package-lock.json`. Regression changes: `tests/netlify-launch-security.test.ts`, `tests/jelloo-transfer.test.ts`. Documentation/evidence: this directory. No artwork, tutorials, game engine/generator/scoring, schema revision, canonical, existing ad widget, quiz flow or SQL changes.

Focused security+transfer: **26 total,26 passed,0 failed,0 skipped**. Full gates and local production HTTP results are recorded in `verification.md`. No claimed live Netlify client isolation until the above real-runtime proof passes.
