# PlayNudge main integration — 2026-10-23

Owner authorized main integration and, in the final instruction, Vercel production deployment. No production migration or Netlify change is authorized.

## Prepared scope

- Base: origin/main 6ed7bb45dea725ada77ab5f2a9aacad6e9f0128b. Development HEAD before integration: 91e4e97f588dfd2147eae8c467284a7d053f982e, branch codex/jelloo-task5-integration.
- Preserve four existing Phase 6–7 commits (worlds, Daily, sharing, Zen), Multi-Jelly and save/solver fixes, referral implementation and its unapplied migration, PlayNudge platform/SEO, assets, QA scripts and evidence.
- New release protection: lib/jelloo/referrals/release.ts remains false. Both public page and API reject activation independently of credentials. Referral API performs no RPC, writes no cookie and returns uncached 503 for all six operations. Changing this source gate requires separately approved migration and verification.
- Original tutorial and artwork files are unchanged. Existing quiz backend/storage remains unchanged; sharing base URL uses the tested canonical policy. Existing production domain remains in use, preserving browser-origin progress.

## Release gate evidence

- GitHub CLI confirms public fahadbwp/Couple-Quiz, default branch main. Origin uses the older redirecting advertisingbwp-cmyk URL. Refreshed origin/main is an ancestor of the development branch.
- Vercel MCP project read returns 403 for bwp2. This was not treated as safety evidence. Authenticated browser independently confirms project click-clique, linked fahadbwp/Couple-Quiz, production source main, current production commit 6ed7bb4 and friend-quiz-game.vercel.app.
- Dashboard explicitly states pushing main updates production. This is authorized by the owner's final instruction. Build/Install overrides are off, framework Next.js, root directory empty, ignored build step Automatic, Node 24.x, Standard Protection, no deployment checks configured. No dashboard settings changed.
- Repository has no GitHub deployment workflow or automatic migration lifecycle script. Build runs next build; migrate:legacy is manual and was not run. Referral migration is only a committed SQL file, not applied.
- Exact local secret-value scan over 920 tracked/nonignored files found zero matching files. Only .env.example is included. Common private-key/GitHub-token/AWS-key signature scan found no files. These scans are not a proof about all historical commits.
- No Netlify configuration changed. No production Supabase migration or data operations performed during preparation.

## Verification of prepared source

- npm test: **232 total, 227 pass, 0 fail, 5 skipped**; five real Supabase integration cases remain skipped.
- npm run typecheck: PASS, zero errors.
- npm run lint: PASS, zero errors, four pre-existing unused-variable warnings (quiz play event; capture-mechanics ports/directions; capture-zen ZEN_SIZE_LABELS).
- npm run build: PASS, Next.js 15.5.28.
- Isolated built-production route checks: four public routes 200/indexable, five private routes noindex, both test-only routes 404; referral API 503 and unavailable page PASS.
- Full suite includes quiz compatibility, saved progress, original tutorials and Multi-Jelly solvability cases. No assertions weakened.
- Raw current-run outputs: tests.log, typecheck.log, lint.log, build.log, routes.log in this directory.

## Remaining launch limitations

Referral release still requires disposable Supabase validation, separately approved production migration/credentials, concurrency and permission verification. Seven previously documented tooling dependency advisories remain; production dependency audit previously reported zero. Existing ad-provider content quality and four lint warnings remain as documented. No new game phase started.

Final GitHub SHA and deployed commit verification will be reported after normal push and Vercel build completion; this document records pre-push evidence only.
