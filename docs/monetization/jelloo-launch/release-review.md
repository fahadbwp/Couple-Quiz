# Monetization release review

## Decision

GO for owner-reviewed release of Netlify SEO and disabled Jelloo banner infrastructure. NO-GO for live banner activation. No push, merge, deployment, automatic-build activation or production database write was performed.

Reviewed branch: `feature/jelloo-monetization-growth`; original HEAD `ba31b48`, feature commit `95cae86`, freshly fetched origin/main `3010bfdc51ffe20abae4026dbb7394928c745cd4` (unchanged). Both existing commits are preserved.

## Findings and narrow corrections

- **Banner architecture: PASS for disabled release.** Confirmed environment activation fallback and public forceEnabled bypass were removed. Source gate remains false. Missing consent/family approval now fails closed. The duplicate iframe guard and cleanup remain.
- **Isolation/CSP/consent: PASS for disabled release only.** Scripts plus same-origin plus popup permissions were unsafe together. Sandbox now grants scripts only: opaque origin, no popups or top navigation. Redundant provider additions to CSP were removed; script/frame directives match main. Main's existing broad HTTPS/inline policy was not hardened in this scoped review. No real consent flow is connected; therefore activation is not approved.
- **Placement: corrected.** Removed the 300px banner from the narrow victory dialog and from the interactive page that incorrectly claimed idle phase. Map placement is outside its padded shell; the exact 300x250 iframe no longer loses two pixels to a border. Result controls are preserved.
- **Netlify SEO/share origin: PASS.** Default canonical, robots and sitemap use Netlify. Explicit origin overrides remain supported, but the inspected production environment contains only four Supabase variable names, with neither canonical override present. No secret values were recorded. Recheck environment before release. Legacy Vercel URLs remain supported by sharing compatibility tests. Current production has not received these changes.

Changed source: `components/ads/JellooAdsterraBanner.tsx`, `lib/platform/ads.ts`, `app/jelloo/GameView.tsx`, `app/jelloo/page.tsx`, `app/jelloo/map/LevelMap.tsx`, `next.config.mjs`. Added four regressions in `tests/jelloo-banner-release-review.test.ts`.

The original feature diff contains 14 scoped files, including deliberate Quiz sharing URL compatibility changes. No Jelloo engine/save/artwork, Quiz mechanics, API or Supabase source changes were found. Original game modes, mascots and saves are preserved by scope and regression checks.

## Evidence

- Focused suite: **55 total, 55 passed, 0 failed, 0 skipped**.
- Full npm test: **335 total, 330 passed, 0 failed, 5 skipped** (four new tests versus the previous 331 total).
- TypeScript: **0 errors**. Full ESLint: **0 errors, 15 existing warnings**. Scoped changed-file ESLint: **0 errors, 0 warnings**.
- Production build: **PASS**. git diff --check: **PASS**.
- Local production browser at 320x844: viewport 320, document width 305; **0 iframes, 0 provider script elements, 0 ad slots**. Screenshot: [mobile map](review-evidence/map-320.jpg). No independent network packet capture was performed; disabled execution is additionally established by the source/effect gate and empty server-render regression.
- Local production HTTP: home 200 with Netlify canonical; robots/sitemap 200 containing Netlify; transfer 200 and noindex; `/jelloo/qa` and `/internal/growth` both 404/noindex. Preview noindex and historical sharing covered by focused tests.
- Provider fill, actual clicks and activated-slot mobile behavior: **NOT TESTED**, intentionally no live advertising request.

## Advertising restrictions before activation

Existing Friendship Quiz ads were not disabled or changed. The previous live acceptance reported a dating creative; this review did not re-trigger that widget. Owner must obtain provider-side dating and gambling category blocks for the exact existing unit and confirm available controls. Adult OFF alone is not a complete brand-safety guarantee. If adequate restriction is unavailable, owner must decide whether to pause or replace that unit separately.

Jelloo activation additionally requires approved creatives/domain/unit, a real consent integration, and isolated provider fill/click testing. The stricter sandbox may block legitimate ad click flow; compatibility remains unverified, not silently relaxed.

## Future integration and rollback — plan only

1. Obtain separate release approval. Fetch main and verify no unexpected changes, disabled ad/referral gates, canonical environment, stopped Netlify builds and empty build queue. Verify Vercel Git auto-deployment consequences before any main push; denied dashboard access is not proof of safety.
2. Preserve ancestry with a normal non-squash integration, rerun gates on the integrated tree, then use only separately approved Netlify hosted Linux deployment of the recorded commit. No Windows artifact or database migration is needed.
3. Before release, verify the retained rollback deployment `6add8ac10c9ee270bf98daa9` is available and record the currently published deployment. On regression, republish that verified artifact through an approved rollback; do not roll back player saves or Supabase. Any Git revert is a normal reviewed commit, never a force-push.

Two preexisting untracked acceptance-report directories are preserved and excluded from this fix commit. No gameplay redesign, progression changes, referrals, DNS changes or unrelated phase work was performed.
