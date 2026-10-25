> Historical implementation record: the focused [release review](release-review.md) supersedes this document's banner activation, consent, sandbox and placement descriptions.

# PlayNudge Jelloo Monetization & Public Growth Release

## Executive Summary

This release prepares the technical and architectural foundation for genuine player growth, Netlify-first public canonical indexing, and family-friendly advertising monetization centered on **Jelloo** — without premature production deployment or uncontrolled ad exposure.

In accordance with strict release boundaries:
- **Zero third-party advertising scripts execute by default** (`JELLOO_BANNER_ENABLED = false`).
- **Zero changes** to Friendship Quiz game mechanics, Supabase database, or PIN auth flows.
- **Zero unapproved pushes, merges, or production deployments** were executed.
- All 100 Adventure levels, Multi-Jelly mechanics, Pal powers, Daily/Zen modes, cosmetic unlock thresholds, and historical saves remain 100% backward-compatible.

---

## A. Implementation

### 1. Local Branch & Commit
- **Branch**: `feature/jelloo-monetization-growth`
- **Base Ancestor**: `origin/main` (`3010bfdc51ffe20abae4026dbb7394928c745cd4`)
- **Integration Commit**: `95cae86` (`feat(monetization): prepare gated Adsterra 300x250 banner and Netlify primary SEO`)

### 2. Exact Files Modified & Created
1. `components/ads/JellooAdsterraBanner.tsx` *(new)*: Dedicated, reusable, isolated 300×250 banner component.
2. `lib/platform/ads.ts`: Adsterra 300×250 configuration constants, `JELLOO_BANNER_ENABLED = false` release gate, and `mayShowJellooBanner` validator.
3. `lib/platform/site.ts`: Primary origin configured to `https://playnudge.netlify.app`, preserving `LEGACY_ORIGIN = "https://friend-quiz-game.vercel.app"`.
4. `lib/quiz/sharing.ts`: Updated canonical production host detection to recognize both Netlify and legacy Vercel domains while preserving challenge URLs.
5. `app/robots.ts`: Updated sitemap directive to Netlify origin; explicitly allowed `/games` and `/jelloo`; disallowed `/jelloo/transfer`, `/jelloo/qa`, `/jelloo/art`.
6. `app/jelloo/page.tsx`: Integrated gated `<JellooAdsterraBanner />` below indexable game explanation.
7. `app/jelloo/GameView.tsx`: Integrated gated `<JellooAdsterraBanner />` inside level victory dialog below action buttons.
8. `app/jelloo/map/LevelMap.tsx`: Integrated gated `<JellooAdsterraBanner />` at the bottom of the Adventure map.
9. `next.config.mjs`: Added `*.bauval.org bauval.org` to production CSP (`script-src` and `frame-src`).
10. `tests/jelloo-monetization-growth.test.ts` *(new)*: 8 dedicated integration tests covering banner identity, gates, SEO, sharing, and the $1,000 revenue model.
11. `tests/configuration-consistency.test.ts`: Updated canonical fallback verification.
12. `tests/platform.test.ts`: Updated canonical origin assertions.
13. `tests/social-sharing.test.ts`: Updated challenge URL and production domain assertions.

### 3. Dedicated Adsterra 300×250 Banner Component (`components/ads/JellooAdsterraBanner.tsx`)
- **Preserved Owner Unit Identity**:
  - `key`: `'a4b11b585d5ff9edca2e271d80338cab'`
  - `src`: `'https://bauval.org/22/a4b11b585d5ff9edca2e271d80338cab'`
  - `format`: `'iframe'`
  - `width`: `300`
  - `height`: `250`
- **Release-Gate Behavior**:
  - Strictly returns `null` (or an empty inactive frame if space reservation is requested) whenever `mayShowJellooBanner()` evaluates to `false`.
  - Zero external HTTP/HTTPS requests or `<script>` tags are loaded when the gate is OFF.
  - Automatically suppresses ads in internal QA routes (`/jelloo/qa`), test harnesses, and during active puzzle interaction.
- **Isolation & Anti-CLS Design**:
  - Encapsulated within a friendly sandboxed `<iframe>` (`srcdoc`), completely shielding the main React DOM from global `window.atOptions` pollution or `document.write` interference.
  - Reserved slot: `w-[300px] h-[250px]` with clear `Sponsored • Adsterra 300×250` labeling.
  - Centered within `max-w-[320px]`, guaranteeing mobile layout compatibility at 320px screen widths.

### 4. SEO & Share-Origin Updates
- **Canonical Public Target**: `https://playnudge.netlify.app`.
- **Sitemap**: All 5 public paths (`/`, `/games`, `/jelloo`, `/quiz`, `/quiz/create`) output with `https://playnudge.netlify.app`.
- **Robots.txt**: Sitemap referenced at `https://playnudge.netlify.app/sitemap.xml`; crawlers directed away from private data/transfer paths.
- **Jelloo Sharing**: `getJellooUrl()` points to `https://playnudge.netlify.app/jelloo`. WhatsApp and native share cards encode the Netlify domain.
- **Legacy Preservation**: Existing Vercel links (`friend-quiz-game.vercel.app`) continue to resolve as valid production URLs without breaking existing shared quizzes.

---

## B. Quality & Verification Evidence

### 1. Test Suite Results
- **Full Test Suite (`npm test`)**:
  - **Total Tests**: `331`
  - **Passed**: `326`
  - **Failed**: `0`
  - **Skipped**: `5` (External live Supabase tests requiring explicit integration opt-in)
  - **Execution Time**: ~60.1s
- **Focused Monetization & Growth Suite (`tests/jelloo-monetization-growth.test.ts`)**:
  - **Passed**: `8 / 8` (100% passing in 503ms)
- **Platform & SEO Regressions (`tests/platform.test.ts`, `tests/configuration-consistency.test.ts`, `tests/social-sharing.test.ts`)**:
  - **Passed**: `21 / 21` (100% passing)

### 2. TypeScript & Static Analysis
- **TypeScript (`npm run typecheck` / `tsc --noEmit`)**:
  - Zero errors (`exited with code 0`).
- **ESLint (`npm run lint` / `eslint .`)**:
  - Zero errors (`exited with code 0`).
  - Pre-existing warnings in standalone scripts and test files preserved.

### 3. Production Build (`npm run build`)
- Next.js 15.5.28 optimized production build completed with exit code 0.
- All 22 routes compiled and prerendered cleanly.
- Shared First Load JS: 103 kB.
- No hydration errors or bundle size regressions.

---

## C. Advertising & Brand Safety

### 1. Adsterra Provider Approval Status
- **Current State**: Account setup is reported by owner (`playnudge.netlify.app`, Category: Other, Format: Banner 300×250, Adult: OFF).
- **Verification Gap**: Third-party provider domain activation on Adsterra's backend is not independently verifiable via local code. Live creative serving must be validated on an isolated staging run once approved.

### 2. Dating & Adult Creative Risk Analysis
- **Observed Production Incident**: Prior browser QA on live Friendship Quiz observed intrusive adult/dating creatives (*"Russian hotties wanna date"*).
- **Root Cause**: In Adsterra's ad exchange, selecting "Adult: OFF" only filters strictly explicit 18+ adult material. Mainstream casual dating, suggestive social platforms, and casino/gambling campaigns frequently leak through unless specifically restricted.
- **Practical Mitigation Options**:
  1. **Account-Level Category Blacklisting**: Contact Adsterra account manager / live support to strictly block **Dating**, **Gambling**, **Betting**, and **Utility/Cleaner Downloads** for domain `playnudge.netlify.app`.
  2. **Iframe Isolation**: The new Jelloo banner component uses an isolated sandboxed iframe to prevent popunders, new-window spawns, and parent frame redirection.
  3. **Placement Gating**: Placed exclusively on result/map views; never during active gameplay.
  4. **Strict Consent Alignment**: Ads are gated behind player consent; zero tracking or creative injection occurs when consent is denied.

---

## D. Revenue Model: Path to $1,000 USD Net Monthly Profit

### 1. Financial Mechanics & Formula
$$\text{Gross Ad Revenue} = \frac{\text{Billable Impressions}}{1,000} \times \text{Realized eCPM}$$
$$\text{Net Profit} = \text{Gross Ad Revenue} - \text{Operating Expenses}$$
$$\text{Required Billable Impressions} = \frac{(\$1,000 + \text{Expenses}) \times 1,000}{\text{Realized eCPM}}$$

### 2. Planning Scenarios (30-Day Month)

| Parameter | Conservative | Base | Optimistic |
| :--- | :---: | :---: | :---: |
| **Daily Active Users (DAU)** | 1,000 | 5,000 | 15,000 |
| **Estimated Monthly Active Users (MAU)** | 5,000 (DAU/MAU 0.20) | 25,000 (DAU/MAU 0.20) | 60,000 (DAU/MAU 0.25) |
| **Ad Opportunities / DAU / Day** | 2 | 3 | 4 |
| **Fill Rate** | 50% | 70% | 85% |
| **Realized Net eCPM (USD)** | **$0.30** | **$1.00** | **$3.00** |
| **Monthly Operating Costs (Hosting, Tools, APIs)** | $30 | $60 | $240 |
| **Monthly Billable Impressions** | 30,000 | 315,000 | 1,530,000 |
| **Monthly Gross Revenue** | $9.00 | $315.00 | $4,590.00 |
| **Monthly Net Profit** | **-$21.00** | **+$255.00** | **+$4,350.00** |

### 3. Workback: What It Takes to Reach Exactly $1,000 Net / Month

To achieve **$1,000 NET** per month:
- **At $0.30 realized eCPM** (Conservative / Tier-3 traffic dominant):
  - Gross Revenue needed: $1,030 / month.
  - Required Billable Impressions: **3,433,334 impressions**.
  - Required DAU (at 2 opps, 50% fill): **~114,445 DAU**.
- **At $1.00 realized eCPM** (Base / Mixed international traffic):
  - Gross Revenue needed: $1,060 / month.
  - Required Billable Impressions: **1,060,000 impressions**.
  - Required DAU (at 3 opps, 70% fill): **~16,826 DAU**.
- **At $3.00 realized eCPM** (Optimistic / Tier-1 US/UK/CA traffic dominant):
  - Gross Revenue needed: $1,240 / month.
  - Required Billable Impressions: **413,334 impressions**.
  - Required DAU (at 4 opps, 85% fill): **~4,053 DAU**.

### 4. Essential Metrics to Monitor Post-Launch
The financial model requires real data from the Adsterra publisher dashboard:
1. **Realized eCPM by Country**: Tier 1 (US/UK) vs Tier 2/3.
2. **Fill Rate & Viewability Rate**: Ratio of ad opportunities to rendered, billable impressions.
3. **Invalid Traffic Deductions (IVT)**: Adsterra post-billing clawbacks.
4. **Discrepancy Rate**: Adsterra-recorded impressions vs internal game completions.

---

## E. Organic Growth Foundation (First 30 Days)

### 1. Organic Distribution Channels (No Paid Ads or Spam)
- **Search Engine Discovery**:
  - Public indexing on `playnudge.netlify.app` with structured Schema.org `GameApplication` data.
  - Meta tags, Open Graph cards, and rich snippets for *"free online path puzzle game"*.
- **Player-to-Player Viral Sharing**:
  - High-fidelity spoiler-free emoji share cards for Level victories, Multi-Jelly triumphs, and Daily streaks.
  - Native 1-click WhatsApp / Web Share API with Netlify deep links.
- **Short-Form Video & Visual Hooks**:
  - Screen captures of satisfying multi-jelly path connections and Panda gate-break moves posted to TikTok, YouTube Shorts, and Instagram Reels.
- **Web Game Communities**:
  - Submissions to indie web game directories (Itch.io web embed, Reddit r/WebGames under self-promotion guidelines).

### 2. 30-Day Growth KPIs
- **D1 Retention**: $\ge 25\%$ (returning next day).
- **D7 Retention**: $\ge 10\%$.
- **Share Conversion Rate**: $\ge 5\%$ of victory screen views triggering a share action.
- **Daily Puzzle Streak Completion**: $\ge 30\%$ of active users completing the Daily.

---

## F. Proposed Release & Integration Procedure

### 1. Step-by-Step Merge & Deployment (Upon Owner Approval Only)
```bash
# 1. Ensure working directory is clean
git checkout main
git fetch origin main
git merge --ff-only feature/jelloo-monetization-growth

# 2. Run final local verification
npm test
npm run typecheck
npm run build

# 3. Push to GitHub main (Triggers production Vercel / Netlify build when unpaused)
git push origin main
```

### 2. Rollback Plan
- If any unexpected regression occurs, roll back instantly:
  ```bash
  git revert HEAD -m 1
  git push origin main
  ```
- On Netlify: Instant 1-click rollback to previous verified deployment `6add8ac10c9ee270bf98daa9` via the Netlify dashboard.

---

## G. GO / NO-GO Decisions for Owner Review

| Decision Area | Status | Recommendation |
| :--- | :---: | :--- |
| **1. Jelloo Player Growth Engine** | **GO** | Fully verified. 100 levels, Multi-Jelly, Pal mechanics, Daily, Zen, and clean share cards pointing to Netlify are ready. |
| **2. Netlify Primary SEO & Share Origin** | **GO** | Fully verified. Canonical meta, sitemaps, robots.txt, and sharing URLs safely target `playnudge.netlify.app`. Legacy Vercel preserved. |
| **3. Adsterra Jelloo Banner Activation** | **NO-GO (Hold)** | **Keep disabled** (`JELLOO_BANNER_ENABLED = false`). Await written Adsterra support confirmation that Dating/Gambling/Adult categories are strictly excluded for `playnudge.netlify.app`. |
| **4. Family-Friendly Compliance** | **NO-GO (Action Required)** | Owner must request category filtering on Adsterra account to ensure no dating creatives leak into Jelloo. |
