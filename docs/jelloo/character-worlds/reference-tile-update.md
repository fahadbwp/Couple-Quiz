# Reference tile presentation update

Local only. Changed CharacterWorlds.tsx, worlds.module.css; added public/jelloo/worlds/candy-tile-v2.png.

- Replaced uniform tray and cream roads with floating pink jelly blocks, frosting drips, glossy top bevels, visible sides, fine white icing connections and surrounding water.
- Blank non-playable cells now show water. Tile data, connections, rotations, scoring, gates and saves are unchanged. Gap labels remain distinct.
- The tile is generated from the owner-supplied reference using built-in imagegen. Prompt: one transparent rounded square pink jelly block, glossy frosting top, darker pink front side, two icing drips, no path marking, character or text. Path markings are engine-driven SVGs.
- Approved Bunny sprites remain unchanged. This is a reference-guided rendering, not a pixel-identical extraction or a full model-based 3D engine. Other worlds remain out of this batch.

Verification: TypeScript pass; scoped ESLint pass; 9 focused preview tests pass, 0 failures (including 50-level auto-start/collectible replay). Full suite/build were not rerun for this presentation-only revision.
Real browser: Level 1 rotated [1,2,2,2,6], auto-completed in 5 moves with 3 stars. At 320px, clientWidth and scrollWidth both 320. Desktop and mobile visuals inspected; screenshots in phase4-browser/reference-tiles-*.png. QA used localhost isolated save; owner's 127.0.0.1 progress untouched. Cross-tab save guard correctly required reload after test completion in another tab.
