# Candy Land visual and auto-start update

Local workspace: C:/Users/Fahad Saleem/Documents/jellypals. No push, deployment, migrations or owner-save edits.

## Changes
- Restored Adventure-style 250ms cancellable automatic start when the actual engine finds a home-connected path. Stale callbacks use runId/move guards; input locks during movement.
- Removed Go, Undo and Restart from active gameplay. Try again remains on completed/failed results.
- Preserved approved Bunny textures and existing blink, ears, squash/hop and celebration animations. Added traveller shadow and jump-power highlight.
- Candy scenery, transparent strawberry cottage, glossy raised tiles, perspective, highlights, water gaps and collected-path lighting.
- This is a 2.5D presentation (CSS 3D perspective plus rendered artwork), not a WebGL scene with fully modelled 3D characters. Reduced-motion styling remains supported.
- No level definitions, gates, engine mechanics or save schema changed.

## Asset provenance
Built-in imagegen used the owner's approved updated reference image, not external artwork. Two separate outputs: candy-scenery.png and strawberry-cottage.png under public/jelloo/worlds.
Prompts requested a glossy pink candy diorama with a calm central water area, no characters/text/grid; and a transparent single strawberry cottage with cream walls, pink frosting roof, leaf crown and heart door. Existing approved Bunny artwork was not regenerated.

## Evidence
- Focused preview tests: 9 passed, zero failures. Includes all 50 authored boards solved through auto action, all collectibles visited, exact quarter-turn move counting, running input lock and stale/incomplete auto rejection.
- Full tests: 381 total, 376 passed, 0 failed, 5 skipped (existing skips). Log: phase4-visual-full-tests.log.
- TypeScript: pass. Scoped ESLint: zero errors/warnings.
- Browser: isolated localhost:3055 origin, separate from owner's 127.0.0.1 save. Real Level 1 clicks [1,2,2,2,6] automatically finished in 5 moves, 3 stars, without Go. Score restored on revisit. Legacy sentinel retained.
- Browser iframe widths 320 and 390: measured scrollWidth equals clientWidth, no horizontal overflow. Desktop presentation inspected. Screenshots in phase4-browser/candy-*-updated.png.
- Only Level 1 played in this browser pass; all 50 covered by engine replay, not human playtesting. Physical phones and real OS reduced-motion preference not tested.
- Production build result recorded separately in phase4-visual-build.log.
