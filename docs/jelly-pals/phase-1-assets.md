# Phase 1: reference-first visual foundation

Scope: Bunny and visual asset review only. Route: `/jelly-pals` (noindex).

## Source

`public/jelly-pals/approved-reference.png` is an unchanged copy of the user-approved attachment `codex-clipboard-b558e6ef-f175-4452-8758-9ecf8fd16c02.png`.
The study gallery uses original reference pixels. The second pass adds AI-edited derivatives made using this sheet as the sole visual reference; they are not pixel-exact extractions and are presented for visual review. No stock artwork or additional reference was used.

## Included

- Bunny hero reference plus a transparent two-frame Bunny derivative with idle/blink preview; respects reduced motion.
- A fixed 5×5 Meadow board composition with reference-derived blank, straight, corner and cottage assets.
- Expression radio controls and pause/resume for both Bunny instances in the board preview.
- Seven original animation key poses, displayed as a study rather than a sprite animation.
- Meadow environment and four original path tile designs.
- Responsive review page and full source reference link.

## Still required before a production board

- User review of derivative fidelity; transparent movement/jump frames still needed.
- Sprite atlas packing/compression and edge cleanup before production use. Meadow atlas has baked soft glow; its display windows exclude most surrounding glow but it is not a polished production atlas.
- Playable board, PixiJS integration and game rules belong to later work.

The original sheet contains baked lighting, backgrounds, labels and low-resolution elements. Enlarging original crops cannot restore detail. The new assets are high-resolution edited interpretations. This is still a visual foundation, not a playable game; no rotation, movement traversal, score, save or unlock logic has been added.
No existing quiz route, database, homepage entry, dependencies or deployment was changed.

## Verification

- Saved source SHA256 matches original: `96C67B207D4D58EE8EFA6A0C404E86DD982016CF7EE4E33DD64A0CC3E000F5B6`.
- Next dev compiled `/jelly-pals`; HTTP 200.
- Browser preview confirmed page content and Bunny crop in the narrow in-app viewport.
- Initial full typecheck encountered stale `.next/types` references to absent `app/tools/pdf-converter/page.js`; after Next dev regenerated route types, `npx tsc --noEmit` passed. Targeted ESLint and `git diff --check` passed.
- Second pass: 390px and 1440px screenshots inspected; no horizontal overflow measured at 320, 390 and 1440px. Screenshot capture at 320px failed, so only DOM width verification at that size is confirmed.
- Selecting Blink pose switches both instances to the closed frame; open opacity 0 / closed opacity 1 verified in browser. Pause removes both idle animations; Resume restores automatic blink and idle CSS animation names.
- PNG alpha channel verified; Bunny corner alpha is 0. Opaque bounds: open [212,93,769,809], closed [1064,94,1620,809]. Display registration uses equally sized 600×760 windows starting [190,72] and [1042,72].
- Reduced-motion behavior exists in CSS; OS-level emulation was not exercised. Physical iOS/Android devices and other browsers untested.
- Desktop evidence: `docs/jelly-pals/phase-1-meadow-desktop.png`.

## Derivative assets

- `public/jelly-pals/bunny-blink-reference-v1.png`: 1774×887 RGBA; open and closed eyes. Generated via imagegen edit using approved source only.
- `public/jelly-pals/meadow-assets-reference-v1.png`: 1536×1024 RGBA; blank/straight/corner tiles and cottage. Generated via imagegen edit using approved source only. Paths were extended to tile edges for the board composition.
- Originals are retained; no replacement of approved reference.
