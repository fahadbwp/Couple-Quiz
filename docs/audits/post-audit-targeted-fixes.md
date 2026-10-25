# Targeted post-audit fixes — local acceptance

2026-10-25. **LOCAL GO for owner review. No push, merge or deployment.**

## Isolation

- Branch: `codex/playnudge-post-audit-fixes`.
- Worktree: `C:/Users/Fahad Saleem/.codex/worktrees/playnudge-post-audit-fixes/Couple quiz`.
- Verified clean starting SHA: `1048b64c7d76e892b408c31e5990ec783a3f8fe2`.
- Original advertising branch remains at `04cf3315181dd92c3b8c528ef90ccfb5c226348f`; `d417b98` ancestry intact. Original untracked audit/evidence files were read, not moved or staged. No private backup accessed.
- Dependencies reused through a local node_modules junction; no installation or lockfile change.

## Issue fixes / exact files

| Issue | Change | Files |
|---|---|---|
| PN-02 | Preserve Adventure 1–100 earned stars permanently; bound only latest 200 Endless awards. Existing valid <=200-record saves migrate without losing records. | `lib/jelloo/progress.ts` |
| PN-03 | Map distinguishes absent saves from corruption/storage errors; recovery notice and read-only Check again replace misleading zero progress. Game warning is visible outside collapsed settings. | `lib/jelloo/saved-progress.ts`, `app/jelloo/map/LevelMap.tsx`, `app/jelloo/JellooGame.tsx` |
| PN-01 | Remove rendered duplicate Quiz navbar, game catalogue/Jelloo promo and repeated CTA. Keep hero/Create, explanation, FAQ and session-safe shared navigation. | `components/quiz-home/Homepage.tsx` |
| PN-04/05 | Mode-accurate unlimited Zen copy; visible and accessible Undo explanation that moves are not refunded. No engine change. | `app/jelloo/GameView.tsx` |
| PN-06 | Direct Privacy link opens separately; existing ad initialization unchanged. | `components/ads/AdsterraFooter.tsx` |
| QA | Five save regression tests and loopback-only fixture runner, not a Next route. | `tests/jelloo-post-audit-save.test.ts`, `scripts/post-audit-qa.ts` |
| Report | Acceptance and caveats. | `docs/audits/post-audit-targeted-fixes.md` |

## Browser evidence

In-app Chromium, temporary local origin `http://127.0.0.1:3057`. Synthetic seed42 save: completed2, best={1:3,2:2}, sound off; separate corrupt sentinel. Runner blocks APIs and external content. Its local test-only outbound policy does not change production CSP. No screenshots/video or private saves used.

**PN-03 reproduced before fix:** corrupt sentinel displayed 0/100, Continue Level1 and locked levels without warning. After fix, Map shows Progress unavailable; retry and refresh preserve the warning. Game prominently explains that unreadable bytes are preserved and this visit is not saved. Rotate/reload then fixture-page check confirmed original sentinel unchanged. Installing the valid synthetic fixture restored 2/100, Level1 three stars, Level2 two stars and current Level3.

| Width × height | Actual interactions | DOM/layout measurements |
|---|---|---|
| 320×844 | Quiz Create, blank-name validation, QA nickname/Female handoff, first answer and advance to Question2 without publishing. Map replay Level1; rotate, Undo retains one move, Restart, win at one move/three stars, Next Level. Library Quiz link returns to Quiz. | Quiz/creator/Map/Adventure scrollWidth305 <= viewport320. Map retains100 levels. |
| 390×844 | Creator dialog; Escape returns focus to Create. Continue Level3, rotate corner, refresh restores right/down orientation and one move, completed2. | Quiz/Adventure scrollWidth375; dialog x19, width336.67. |
| 768×900 | Creator dialog opens/closes; Map restored. Zen rotate/Undo retains one move; footer no longer claims limited moves. | Quiz/Map/Zen scrollWidth753; dialog width450. |
| 1280×900 | Creator dialog opens/closes. Home → Explore games → library → Play Jelloo → Map → Continue Level3 restores one move. Privacy click preserves source Quiz; local server logged GET /privacy200. | Quiz/Adventure scrollWidth1265; dialog width450. |

15px differences are scrollbar space, not horizontal overflow. Quiz has one nav/one primary Create button, no rendered #challenges. FAQs retained. Quiz nav and Privacy use target=_blank; Privacy rel=noopener noreferrer. No separate Privacy tab was exposed by automation: visual new-tab rendering is NOT independently verified. Escape/focus restoration passed; Enter activation had control timeouts/no transition, so a full keyboard audit is NOT claimed. One Next Question click timed out in the tool but actual UI subsequently confirmed Question2/1-of-10 selected. Final Quiz/Adventure console error/warning queries returned empty arrays; this is limited observation, not all-route certification.

## Verification results

All run in the isolated worktree after source changes:

- Save focus: `node --import ./tests/setup.mjs --import tsx --test tests/jelloo-post-audit-save.test.ts tests/jelloo-save-compatibility.test.ts tests/jelloo-transfer.test.ts`: **26 total / 26 pass / 0 fail / 0 skipped**.
- UX focus: same runner, `tests/homepage.test.ts tests/jelloo-navigation.test.ts tests/jelloo-zen.test.ts tests/jelloo-phase4.test.ts`: **23 total / 23 pass / 0 fail / 0 skipped**.
- `npm test`: **340 total / 335 pass / 0 fail / 5 skipped**; 101256ms. Five tests added to approved base's335 total. Skips require disposable real Supabase credentials; production was not used.
- `npm run typecheck`: PASS, zero errors.
- `npm run lint`: PASS, zero errors, **15 pre-existing warnings**, zero new warnings. Unchanged files: quiz/play/[id]/page.tsx(1), capture-mechanics(2), capture-phase8-integrated(2), capture-phase8(5), capture-zen(1), jelloo-navigation.test(1), jelloo-phase8.test(3).
- `npm run build`: PASS, Next15.5.28, compiled,22/22 static pages, finalized traces; existing quiz/play unused-event warning only.
- `git diff --check`: PASS.

## Data safety / remaining limits

- Already-discarded stars were NOT recovered or fabricated. Existing valid records are retained on migration. Future Endless history remains bounded to its latest200 records.
- Stored field names/version and board/generator revisions remain unchanged. Reader accepts up to100 Adventure +200 Endless records within the existing8192-character limit; maximum-ID boundary fixture passed.
- **Rollback caveat:** old production code rejects saves with >200 total awards. Once released, any rollback must retain this expanded decoder and Adventure retention fix; UI may be reverted independently. Do not blindly deploy the old decoder over newer saves. Current production rollback commit remains unchanged.
- PN-07 touch targets and PN-08 asset optimization deferred as P3. No gameplay, level, unlock, artwork, Quiz backend, `/` or `/games` changes.
- Real production Quiz create/share/PIN/scoreboard roundtrip, real ads, physical devices and broad keyboard checks remain unverified. Local unit/API mocks pass. No production writes.
- Jelloo banner remains false; referrals, production CSP and deployment settings untouched. Existing Quiz ad behavior unchanged.
- Save commit: `80fac4b`. UI/report commit recorded in final owner response. Both local only.

**LOCAL GO for review, subject to the documented rollback compatibility caveat. Stop for owner approval before release.**
