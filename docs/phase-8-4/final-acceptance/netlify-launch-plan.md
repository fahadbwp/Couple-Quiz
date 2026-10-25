# One controlled Netlify release — preparation only

**NO-GO today. No Netlify configuration changed and zero Netlify deploy/build requests were issued.** Dashboard at the target site's deploy configuration redirected to login (`evidence/netlify-access-blocked.jpg`). No authenticated site settings, repository connection, actual paused state, adapter installation, environment scopes or credit balance are verified. A failed external fetch is not evidence that the public site is down.

## Compatibility and boundaries

Installed Next.js15.5.28 is within Netlify's documented modern Next.js support range (13.5+). Netlify's [official Next.js adapter overview](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/) describes OpenNext support for App Router, route handlers, SSR and image optimization. This is framework-level compatibility, not proof that this site has the right adapter/version/configuration. No local `netlify.toml`, `.netlify/state.json` or Netlify CLI was found. Do not introduce static export: quiz API and metadata routes require the server adapter.

Source inspection preserves next.config.mjs redirects/headers/CSP, approved local artwork and image assets, existing quiz links and the current Vercel canonical. `CONTEXT` preview contexts request noindex, but this must be verified on the actual adapter. `SITE_CANONICAL_ORIGIN` and `NEXT_PUBLIC_APP_URL` must not be changed to Netlify without separate domain/canonical approval. Public client variables are [inlined at Next.js build time](https://nextjs.org/docs/15/app/guides/environment-variables), not fixed by changing a runtime variable after build.

### Environment NAMES to reconcile privately, never print values

| Name | Required treatment |
|---|---|
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Existing quiz durable storage; server/functions only for service key. No new schema/migration; inspect existing approved account configuration privately. Never use production for QA. |
| `SITE_CANONICAL_ORIGIN`, `NEXT_PUBLIC_APP_URL` | Preserve existing approved Vercel origin until separate cutover approval; ensure build values match intended release. |
| `NODE_ENV`, `CONTEXT` | Platform-managed production/deploy-preview context; do not disguise staging as production. |
| `QUIZ_TRUSTED_PROXY` | Only Cloudflare when origin access is independently restricted. NOT a Netlify shortcut. |
| `QUIZ_REQUIRE_DURABLE_STORAGE` | Existing optional fail-closed durable-storage control; reconcile without weakening production behavior. |
| `JELLOO_LOCAL_QA`, `PLAYNUDGE_LOCAL_INSIGHTS` | Unset in deployed environments; production guards remain effective even if accidentally set. |
| `QUIZ_TEST_SUPABASE_URL`, `QUIZ_TEST_SUPABASE_SERVICE_ROLE_KEY`, `QUIZ_SUPABASE_INTEGRATION` | Never configure test overrides against production. Only separately approved disposable staging. |
| Referral/Upstash aliases | Do not copy unused secrets. Referral release constant remains false; no referral credentials/migration needed for this launch. Preserve any independently required approved quiz runtime configuration. |

Supabase loader supports legacy aliases (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_SECRET_KEY`); inventory conflicts privately and prefer the established canonical server names. Do not put service credentials into NEXT_PUBLIC variables. Scope/context behavior must follow [Netlify environment-variable documentation](https://docs.netlify.com/build/environment-variables/overview/).

### Reproduced launch blocker: client-IP trust

`lib/quiz/security.ts:extractClientIp` recognizes Vercel's attested header or explicitly approved restricted Cloudflare origin. With `NETLIFY=true`, no Vercel/proxy flag, and forwarded/Netlify-like headers, a real local invocation returned **unknown** (`evidence/netlify-ip-probe.txt`). All PIN requests can therefore share one conservative rate-limit bucket. This avoids spoofing but risks unrelated users locking one another out. Real adapter behavior is NOT TESTED.

Do not set `VERCEL=1`, trust arbitrary `x-forwarded-for`, or weaken PIN limits. Before launch, independently verify Netlify's immutable client identity boundary for the actual adapter and test direct/spoofed/multi-client requests in approved staging; implement only a justified trusted adapter under separate scope. Owner may instead explicitly accept the conservative shared-bucket restriction, but this report does not recommend it for broad traffic.

## Credit impact

Netlify's current [credit documentation](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/) lists15credits per successful production deploy,0deploy credits for preview/branch deploys, plus compute/bandwidth/requests charges (10/GB-hour,20/GB,2/10,000 requests). These are published credit-plan rates, **not this account's verified plan/balance or a promise of free previews**. Confirm account billing first. Avoid repeated CLI/UI/hook pushes; one owner-approved controlled build, inspect it, then publish the same intended artifact where supported. Never create a second production build just to obtain a screenshot.

## Owner-approved future procedure — execute only after new authorization

1. Owner signs into the exact `playnudge` Netlify project. Verify team/siteID, target hostname and connection to `fahadbwp/Couple-Quiz`. Record current published deploy and rollback option. Verify billing plan, credits and spending controls. No charge-bearing build yet.
2. Before any Git push, explicitly verify **builds stopped** and automatic publishing paused where applicable. [Stopped builds](https://docs.netlify.com/build/configure-builds/stop-or-activate-builds/) differ from stopped auto-publishing: stopping auto-publish still permits charged builds; manual API/CLI deploy can still change a stopped site. Inspect all hooks/branch deploy paths. Do not rely on inaccessible dashboard settings.
3. Resolve the client-IP blocker and approve disposable staging if real quiz runtime verification is required. Validate actual adapter redirects/CSP/image handling, same-origin request checks, PIN limits, secure cookies and independent-client behavior. No remote production test writes or migrations.
4. Separately approve and release only the save-transfer facility on the existing Vercel origin so real players can export there. Owner privately downloads and verifies93/100 Level94 file; keep original storage/site accessible. This prerequisite itself is an external release requiring approval, not performed here.
5. Finish ad category/provider/domain/privacy decisions described in `monetization.md`. Existing problematic widget must not accidentally be promoted as family-safe. Keep `ADS_ENABLED=false`, analytics production ingestion disabled and referrals false.
6. Review final exact feature commit, complete logs and source secret scan; obtain explicit owner authorization for intended Git integration and **one** Netlify release. Preserve ancestry; no force-push. Keep Vercel/Netlify automation protected until that authorization specifies the intended deployment.
7. Privately reconcile build/runtime env names and scopes; establish compatible Node/build adapter configuration; run `npm ci`, tests, typecheck, lint and production build locally first. Use `npm run build`, server adapter output, no static SPA rewrite. Do not change canonical/DNS in this preparation release.
8. Execute one approved Netlify build with intended commit and approved configuration, automatic publication held. Inspect logs and exact commit/artifact. If failed, stop and diagnose before another paid build. Confirm productionQA/internal routes404, referralAPI503, assets/images200, previewrobots noindex and no secrets in public output. No real DB mutation for smoke tests.
9. Owner reviews preview/artifact, progress transfer results and spend, then authorizes publishing that verified artifact. Verify intended SHA/URL, old quiz links, images/headers, saved-game behavior in isolated profiles. Actual production data writes require separate authorization and must not be disguised as acceptance tests.
10. Monitor only approved metrics/logs, keep rollback artifact and old-origin export available. DNS/canonical change, referral migration/activation, new ads/payments and Phase8.5 remain separate decisions. Re-stopping builds must not be assumed to disable manual publish access.

## Go/no-go checklist

- [ ] Authenticated correct site/repository/billing/paused-build evidence.
- [ ] Verified Netlify client-IP boundary and safe quiz rate limiting.
- [ ] Adapter/functions/images/headers/cookies validated in approved environment.
- [ ] No production schema changes; quiz durable configuration verified privately.
- [ ] Old-origin exporter deployed under separate approval; owner private backup verified.
- [ ] Target import preview/backup/conflict policy accepted; old origin retained.
- [ ] Existing ad creative/placement/consent decision approved; new monetization off.
- [ ] Intended commit and one build/publish budget explicitly approved.
- [ ] Live QA routes404, referralAPI503, canonical unchanged until approved cutover.

Unchecked items are blockers, not assumptions. No Netlify launch is authorized by this preparation document.
