# Phase 5 — Character collection and power trials

Implemented 21 October 2026. Entry: `/jelloo` → **Meet your pals** → `/jelloo/pals`.

## Delivered

- Bunny is available immediately. Panda, Cat, Octopus and Fox unlock after 10, 20, 30 and 40 completed adventure levels respectively. Replaying levels does not advance unlocks.
- Fifteen authored power trials, three per character. Bunny/Panda/Cat/Octopus trials increase route length; Fox trials rotate its branching layout to practise the same choice from different orientations.
- Bunny jumps over one explicitly marked gap per attempt; correct landing ports are required. Two gaps cannot be crossed.
- Panda breaks through cracked paths; these disappear after departure and return on Restart. Other pals cannot enter these trial obstacles.
- Cat traverses wall paths and crosses sticky tiles at 210 ms rather than the normal sticky delay of 840 ms.
- Octopus traverses water paths. Other characters cannot cross them.
- Fox has an explicit shortest-route / more-stars choice. The star route is two steps longer on the solved trial layout. Changing preference starts a fresh attempt.
- Auto-run, 1–3 stars, sounds, reduced-motion handling, disabled inputs during movement, restart, undo and accessible result dialog reuse the existing game flow.
- Best trial medals persist separately in `jelloo.pals.v1`. Invalid data is preserved. Trials never increment adventure progress or modify the adventure save.
- New milestone text in the adventure win dialog announces the available pal.

## Scope

The endless adventure remains its existing Bunny puzzle sequence with unchanged generation rules and saves. New powers are playable in the dedicated trials, not yet injected into endless generated boards. Trial medals persist; an unfinished trial restarts after a reload. Sound/motion initially inherit adventure preferences; trial-session changes do not overwrite adventure settings. Unlocks are local browser progression, not server-enforced entitlements.

## Artwork provenance

Approved source: `public/jelly-pals/approved-reference.png`.
Existing Bunny sheet was not altered. SHA-256 remains `304112EEF8583C71245612B45E39A42EAA38F9F221E66ABB44C8FEE0D002425A`. Source SHA-256 remains `96C67B207D4D58EE8EFA6A0C404E86DD982016CF7EE4E33DD64A0CC3E000F5B6`.

New `public/jelly-pals/pals-atlas-reference-v1.png` is a transparent 2×2 AI-edited derivative of that source: Panda / Cat / Octopus / Fox. It is not an exact pixel extraction. CSS uses equal quadrants; original source and Bunny remain intact.

Generation prompt: Create ONE square production sprite atlas based ONLY on the attached approved reference. Exact invisible 2 by 2 grid: Panda top-left, Cat top-right, Octopus bottom-left, Fox bottom-right. Preserve identities, colors, facial proportions, reference poses and glossy jelly material. Center complete characters in quadrants with transparent padding. No labels, text, floor, frames or extra characters. Truly transparent background.

## Validation

- Existing 25 tests plus 9 power tests cover all 15 solutions, initially unsolved boards, minimum five rotations (solver verified), all-star reachability, milestones, wrong-character restrictions, one-gap limit, Panda collapse/reset, stale ticks, Fox route choice, Cat timing, reduced-motion timing and bounded medal validation.
- Existing 1,500-puzzle and 400-sample difficulty audits retained; no generator change.
- Browser: Bunny trial 1 completed in 6 moves for 3 stars; Panda trial 1 completed in 7 for 3 stars; collapsed tile verified absent after traversal. Reload restored both medals and preserved the 11-level adventure progress on the isolated test origin.
- Result dialog Shift+Tab wraps to Next trial, Escape closes, and board focus returns.
- Mobile layouts checked at 390 px and 320 px; no horizontal overflow; narrow-width tile buttons approximately 49.7 px. Screenshot: `phase-5-pals-mobile.png`.
- Browser error log empty during these checks. Cat/Octopus/Fox covered by engine tests; their locked UI was verified, but their full browser flows were not exercised by altering user progress.
- TypeScript, scoped ESLint and diff whitespace checks pass. No production build/deployment or physical-device test claimed.
