# Isometric Candy Land renderer

Local implementation in Documents/jellypals. Changed CharacterWorlds.tsx and worlds.module.css only; no engine, level, gate or save changes.

Replaced tilted flat grid with orthographic isometric coordinates. Tiles have separate top/left/right faces, frosting edges, shaded materials, and depth ordering. Rotating path markings are projected onto the tile plane; Bunny position is computed from the same row/column projection. Cottage stays attached to the home tile. Blank cells remain water. Button clipping follows the isometric silhouette.

Verification: TypeScript and scoped ESLint pass. Focused preview tests: 9 passed, 0 failed, including all 50 engine auto-start and collectible replays. Real browser Level 1 clicks [1,2,2,2,6] finished automatically in 5 moves, 3 stars. At 320px clientWidth=scrollWidth=320. Screenshot: phase4-browser/isometric-candy.png. Tests used isolated localhost progress, not owner 127.0.0.1 data. Full suite/build not rerun for this renderer-only pass.

Limits: reference-guided 2.5D rendering, not pixel-identical artwork or a 3D model engine. Browser playtested Level 1; physical phone testing and denser late-level touch usability remain unverified. This update does not replace puzzle layouts with a decorative fixed winding route. No push or deploy.
