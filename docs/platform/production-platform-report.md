# PlayNudge platform foundation — engineering report

2026-10-23. Local implementation only. **Overall verdict: PARTIAL for production release; platform implementation is complete, with verification and external limitations detailed below.** No GitHub push, commit, merge, domain change, deployment, database migration or production data write.

## Working-tree safety

Branch remains `codex/jelloo-task5-integration`, HEAD `91e4e97f588dfd2147eae8c467284a7d053f982e`. Four existing commits remain ahead of the locally available origin/main reference: `42931cb` (worlds), `53869a6` (Daily), `006db99` (sharing), `91e4e97` (Zen). No fetch or destructive Git command was needed. Baseline status and HEAD are saved under `evidence/`.

Earlier uncommitted Task 4/5 work, Multi-Jelly, referral migration, dependency patches and evidence remain intact. This task did not edit Jelloo engine, generator, reducer, save schema, scoring, tutorials, character selection or artwork. Changes to the already-modified GameView are limited to the platform Home destination and English presentation text. Existing phase work is not claimed as newly implemented here.

## Implemented architecture

- `/` is now a server-rendered PlayNudge gaming homepage with hero, equally styled featured cards, library entry, genuine platform explanation and footer.
- `/games` uses the same typed registry and same card component, with equal placement for Jelloo and Friendship Quiz. Only two real available games are listed. No fictitious ratings, counts, empty categories or unavailable inventory.
- `lib/platform/games.ts` stores stable IDs, name, description, category, play URL, approved artwork reference, availability and feature labels. Adding another real game extends the registry rather than duplicating homepage data.
- `/quiz` remains the Friendship Quiz landing and creator modal. Existing create/share/play/result/scoreboard routes and APIs remain in place. Removed its unimplemented Couple Quiz card; retained useful how-to/FAQ content.
- Added compact platform navigation above quiz and Jelloo routes. Links remain visible at narrow widths rather than hiding the only three destinations in a menu. On quiz pages platform links open a new tab with noopener and an accessible explanation; unsaved question state stays in the original tab. This does not add a new quiz draft/storage schema. Existing in-game navigation behavior is retained.
- Jelloo Home now leads to `/`. Daily/Zen/Invite entry points remain in the game; no board or mechanic redesign.

Approved Bunny sprite crop and existing FriendsArt SVG are reused, without altering the source art. New PlayNudge favicon is a simple brand mark, not character artwork. New social image is a lightweight textual image rendered by Next ImageResponse.

No legal/privacy pages existed in the inspected app routes. The footer includes a truthful privacy reminder and working game links; no placeholder legal links or invented legal organization details were added.

## Exact implementation files

New platform source:

- `lib/platform/site.ts`, `lib/platform/games.ts`
- `components/platform/Platform.tsx`, `components/platform/platform.module.css`
- `app/games/page.tsx`, `app/opengraph-image.tsx`
- `app/jelloo/layout.tsx`, `app/quiz/create/layout.tsx`
- `public/playnudge.svg`

Changed integration files:

- `app/page.tsx`, `app/layout.tsx`, `app/robots.ts`, `app/sitemap.ts`
- `app/quiz/page.tsx`, `app/quiz/layout.tsx`
- `app/quiz/create/page.tsx`, `app/quiz/play/[id]/page.tsx`, `app/quiz/share/[id]/page.tsx`, `app/quiz/result/[id]/page.tsx`, `app/quiz/scoreboard/[id]/page.tsx`: branding/copy only; gameplay/backend unchanged.
- `app/quiz/share/[id]/layout.tsx`, `app/quiz/result/[id]/layout.tsx`, `app/quiz/scoreboard/[id]/layout.tsx`: page titles; existing privacy directives retained.
- `app/jelloo/page.tsx`, `app/jelloo/daily/page.tsx`, `app/jelloo/zen/page.tsx`, `app/jelloo/invite/page.tsx`: metadata; Adventure game schema and a server-rendered game description/mode links below the unchanged game.
- `app/jelloo/GameView.tsx`: Home target and English subtitle/victory wording only in this task.
- `components/quiz-home/Homepage.tsx`: landing brand, unavailable card removal, schema moved out of the client component.
- `components/seo/JsonLd.tsx`: truthful platform/game naming and quiz-specific schema IDs/URL.
- `components/ads/AdsterraFooter.tsx`: visible brand/footer wording only; ad loading/configuration unchanged.
- `lib/quiz/sharing.ts`: canonical origin delegates to shared site policy. Existing link generation, IDs, social message contract and backend untouched.
- `next.config.mjs`: noindex response header in recognized previews/staging/local development.
- `.env.example`: documented canonical and staging environment configuration.

Verification files: `tests/platform.test.ts`; `scripts/platform-api-qa.ts`, `scripts/platform-local-qa.ts`, `scripts/platform-http-qa.ts`, `scripts/platform-production-check.mjs`; this report and `docs/platform/evidence/`.

No new runtime dependency. Prettier ran from npm's tooling cache to format new source, without changing project dependency declarations. Existing dependency changes in the working tree belong to prior integration work.

## SEO and canonical policy

Unique titles/descriptions, canonical links, Open Graph and Twitter metadata are generated for public homepage, library and game entry pages. Jelloo Adventure is public/indexable in production; Daily and Zen remain noindex stateful gameplay destinations with their own canonical/metadata. Invite remains noindex and no-referrer. Personal quiz play/share/result/scoreboard pages retain noindex. Bots are allowed to fetch private-page HTML in production to observe noindex; this is not an authorization mechanism.

Canonical origin precedence:

1. Valid `SITE_CANONICAL_ORIGIN`.
2. Valid existing `NEXT_PUBLIC_APP_URL`.
3. `VERCEL_PROJECT_PRODUCTION_URL`.
4. `VERCEL_URL` only in Vercel production, preserving the pre-existing fallback behavior.
5. Existing historical fallback `https://friend-quiz-game.vercel.app`.

Explicit origins must be HTTPS origins without path, credentials, query or fragment. Request Host, Netlify URL and DEPLOY_PRIME_URL are never used to select a new canonical. **No canonical migration to playnudge.netlify.app was performed.** Set both SITE_CANONICAL_ORIGIN and NEXT_PUBLIC_APP_URL to the same owner-approved stable domain at build time; the explicit value avoids dependence on deployment-specific fallbacks.

`VERCEL_ENV` other than production, Netlify `CONTEXT` other than production, `SITE_ENV=preview|staging`, or development NODE_ENV disable indexing. Header `X-Robots-Tag: noindex, nofollow` additionally protects child metadata overrides. Preview robots disallows `/`; production robots allows public pages and OG images while excluding general APIs/design/QA/art surfaces. Other staging hosts must explicitly set SITE_ENV=staging. Do not retain staging flags on actual production.

Sitemap contains `/`, `/games`, `/quiz`, `/quiz/create`, `/jelloo`. The public initial quiz creation form contains no user records, so it remains indexable, preserving the existing contract. No personal dynamic URLs, result tokens, Invite or QA routes are included. Sitemap entries point at the configured production origin even when fetched in a noindex preview. Fabricated last-modified timestamps were removed.

JSON-LD: truthful WebSite, WebApplication with GameApplication category, Games Library ItemList, and existing visible FAQ content. JSON is escaped against script-tag termination. No fake ratings, legal business address, SearchAction for nonexistent search, or rich-result eligibility guarantee. No unsupported Organization details invented.

### Preserved legacy metadata contract

Existing dynamic quiz challenge metadata and share-message tests assert the original Click & Clique identity. An attempted wrapper branding change failed that regression. The implementation was corrected to preserve the contract, **not change the test assertion**. Parent quiz metadata avoids appending a second brand. Public discovery pages and visible navigation use PlayNudge; old challenge OG/message branding remains a documented future migration item. Legacy links retain identifiers and query behavior; no redirects were added.

## OpenSEO skills requested by owner

Read the actual repository's [seo-audit](https://github.com/every-app/open-seo/blob/main/plugins/openseo/skills/seo-audit/SKILL.md) and [seo-coach](https://github.com/every-app/open-seo/blob/main/plugins/openseo/skills/seo-coach/SKILL.md). Applied their evidence/source distinction and page-family/indexability approach to local engineering. Also applied the repository's local SEO skill and React best-practices checklist.

The full OpenSEO audit workflow requires an OpenSEO MCP connection; none is available in this session. Its live crawl/ranking/keyword/credit/project-context/report-saving steps were **NOT RUN**. This file is an engineering report, not a completed data-backed OpenSEO market audit. No OpenSEO installation/account setup or paid calls were made. Search volume, keyword difficulty, rankings, traffic, conversion estimates and Search Console data are not claimed. Topic targeting follows the owner's brief rather than measured demand.

## Browser verification

Real IAB browser, local `127.0.0.1:3014`; disposable API on loopback 3015. Test worker executes existing quiz handlers with the existing in-memory test backend; normal development credentials are cleared. No production or staging Supabase was contacted. Test data disappears when the worker stops. QA server/control routes are standalone scripts, not production app routes.

Desktop captures are 1265×712 pixels. Narrow views use actual 320px/390px-wide same-origin iframes, 844px high; screenshot clipping depends on the app panel. The outer browser was resized during QA (later measured 491×532, document width 476); smaller screenshots are 476×516. These are CSS responsiveness checks, **not physical mobile touch or Safari/iOS/Android certification**. Only the standalone QA server permits same-origin frames; production frame protection stays unchanged.

Observed flows:

- Homepage Explore games → `/games` → Friendship Quiz card → `/quiz` → creator modal.
- Entered synthetic Platform QA name, answered all ten creation questions, supplied a disposable test PIN, created a quiz and copied its local share link. No message was sent through WhatsApp/Facebook.
- Opened `/quiz/play/q_1792744616507_5b3cbc7570de`, entered Test Friend, answered ten questions, received **10/10**; reload retained result. Creator scoreboard showed one participant and 10/10. Same browser profile, separate tab; this is not a different-device authentication test.
- Jelloo original Level 1: one legal rotation, one move, three stars. Advanced to Level 2, navigated to platform Home and Back; Level 2 and completed Level 1 restored. Only disposable origin progress was affected.
- Daily loaded the UTC 2026-10-23 Cat puzzle; Zen loaded its controls and board; Invite loaded its screen. Referral backend is intentionally unavailable in this platform harness; the prior full referral QA is not re-claimed here.
- 320px/390px layouts showed readable stacking and visible navigation without visible horizontal overflow. The 390px All Games link navigated successfully. Tab and Shift+Tab moved between All Games and Jelloo. Minimum 44px navigation/CTA targets and reduced-motion CSS are implemented.
- No full Daily/Zen playthrough, physical touch/double tap, screen-reader session, native OS share, reduced-motion emulation or live Supabase/browser concurrency was performed in this task.

Screenshots in `evidence/`: `home-desktop.jpg`, `games-desktop.jpg`, `games-320.jpg`, `home-390.jpg`, `home-320.jpg`, `quiz-result.jpg`, `quiz-scoreboard.jpg`, `jelloo-restored.jpg`.

Final built-app browser check on port 3016: measured **1280×720 viewport**, document scroll width **1265px**, both cards **539×552.46px**, all three header navigation links **45px high**. No console errors appeared in this fresh production tab. Evidence: `production-games.jpg`, `browser-measurements.json`. This final measurement supersedes uncertainty about the outer desktop viewport during earlier panel resizing.

Read-only HTTP smoke (`http.log`) verified 12 page routes, unique titles, local preview header, canonical targets, private-page noindex, parseable JSON-LD, sitemap exclusions, robots and three successful image/favicon endpoints. HTTP success for missing quiz IDs is the existing client-side not-found presentation; it does not mean a nonexistent quiz is playable.

## Security, accessibility and performance

No schema/auth/session/API changes, referral weakening, game storage writes from platform components, new third-party calls, remote fonts or heavy animation library. All game inventory is server-rendered from fixed trusted data. Decorative artwork is hidden from accessibility APIs because adjacent titles describe it; meaningful link names, semantic sections, focus outlines, skip links and shared card markup are present. Tests cover registry integrity, public/private metadata, hostile origin inputs and JSON-LD escaping.

Production build output provides route bundle sizes; those are build measurements, not Core Web Vitals. Field LCP/INP/CLS, throttled mobile loading and production Lighthouse are **NOT MEASURED**. Existing quiz ads remain third-party requests and may dominate its loading/shift behavior. No broad CSP/security-policy rewrite was performed.

## Automated verification

| Check | Result | Evidence |
|---|---|---|
| Full npm test | **231 tests: 226 PASS, 0 FAIL, 5 SKIPPED** | evidence/tests.log |
| Focused platform/sharing/homepage | **21 PASS, 0 FAIL, 0 SKIPPED** | evidence/focused.log |
| TypeScript | PASS, zero errors | evidence/typecheck.log |
| Scoped ESLint | 0 errors; one pre-existing unused event warning in quiz play | evidence/lint.log |
| Production build | PASS, Next 15.5.28 | evidence/build.log |
| Local HTTP SEO/route smoke | PASS, 12 routes plus sitemap/robots and three assets | evidence/http.log |
| Built production indexing | PASS: four public pages indexable, five private pages noindex, two test routes 404 | evidence/production-http.log |
| Original source assertions | Preserved; no existing tests edited | Git diff |

Eight new platform tests explain the increase from the preceding integration's 223 to 231 tests. Five existing skipped Supabase integration tests remain skipped, not passed. The earlier failed metadata wrapper run is retained in evidence/tests-before-compatibility-fix.log; final tests pass after restoring the implementation contract. A temporary CSS editing typo and test-harness route typing errors were corrected before final checks.

Reproduce local browser QA in two terminals: `node --import ./tests/setup.mjs --import tsx scripts/platform-api-qa.ts`, then `node --import tsx scripts/platform-local-qa.ts`. Open port 3014; run `node --import tsx scripts/platform-http-qa.ts` for the HTTP assertions. Stop both disposable servers before building because the development server and build share `.next`. For the production check, start the build on loopback port 3016 with backend variables explicitly empty in the Node process, then run `node scripts/platform-production-check.mjs`. Do not substitute live backend credentials. No QA server is intended for a hosted deployment.

## Remaining risks and owner decisions

1. Existing quiz ad widget visibly served adult/dating/gambling-themed creatives in local browser QA. This conflicts with a broadly friendly gaming presentation. Ad provider/content controls need separate owner review; only footer branding was changed here. Screenshots of results hide the ad using its existing Hide advertisement button.
2. Full OpenSEO research, Search Console, deployed robots/canonicals and real-device accessibility/performance remain unverified.
3. Live Supabase staging remains unavailable. Disposable mock coverage is not proof of production RLS/locking behavior. Previous referral release gates and seven tooling audit advisories still apply; this platform task did not resolve them.
4. Legacy quiz social metadata/messages retain old branding for explicit compatibility tests. A coordinated test/branding migration needs owner approval; no assertions weakened.
5. Existing creator UI briefly renders “Question 11 of 10” behind its PIN modal after ten answers. It did not block creation; left for separate game UI QA.
6. New-tab platform navigation preserves a quiz left open, but does not promise restoration after closing its tab or refreshing an unfinished quiz. That existing limitation was not addressed with a new draft schema.

## Future domain migration checklist — approval required

1. Owner chooses the final production domain and explicitly approves hosting/domain migration. Confirm Preview protection, repository visibility and staging-vs-production backend isolation first.
2. Configure canonical origin and matching public app URL at build time; preserve the current values until approval. Use Netlify CONTEXT or explicit SITE_ENV for previews, production context for the approved site.
3. Configure server-only Supabase credentials, referral exact-origin/secret and existing proxy security correctly on the approved host. Never copy production credentials into unprotected previews. No migration/data copy is required for these platform changes.
4. Validate actual Netlify Next.js adapter support for routes, server APIs, metadata image, cookies and headers in protected staging; local Next build does not certify the hosting adapter.
5. Verify old quiz IDs and query parameters on the new deployment, correct canonical/OG URLs, noindex private pages, public robots and sitemap. Preserve one-hop path-and-query redirects only if the owner approves a domain change; never redirect all quizzes to Home.
6. Account for browser-origin storage: Jelloo localStorage progress and referral cookies **do not automatically transfer to another domain**. Keep old-origin access or implement a separately approved migration/recovery plan before retiring it. Referral recovery codes retain their existing role; no new progress migration mechanism was introduced here.
7. Check DNS/TLS, crawler access, production indexability, Search Console property/sitemap and rollback path after explicit deployment approval. Monitor real failures and traffic; do not promise rankings.

Stop at owner review. No Level Map, Panda-selection fixes, Out-of-Moves redesign, new mechanics or later phase started.
