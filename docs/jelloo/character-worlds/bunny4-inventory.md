# Bunny 4x4 — Fifty-level inventory

Revision: `bunny-4x4-v1`. Dimensions: 4 columns x 4 rows throughout. Static authored content, not runtime random generation. Coordinates below are zero-based cell indices. Full routes, actual rotation sequences and two-star analysis are in `bunny4-inventory.json`.

[SOLVER] Minimum and all-star costs come from exhaustive bounded path/orientation search with no exhaustion. [CODE/ENGINE] Every published click sequence is replayed after each rotation with auto-start enabled. [BROWSER] Both routes for all fifty levels were clicked in the real browser; see `bunny4-browser-results.json`.

| Level | Par | All-star par | Limit | Short / star cells | Short / star turns | Authored decoys | Detour branch/rejoin | Jump required |
|---:|---:|---:|---:|---:|---:|---:|---|---|
| 1 | 3 | 3 | 6 | 5 / 5 | 1 / 1 | 1 | Teaching route | No |
| 2 | 4 | 4 | 7 | 6 / 6 | 2 / 2 | 1 | Teaching route | No |
| 3 | 8 | 8 | 11 | 7 / 7 | 4 / 4 | 1 | Teaching route | No |
| 4 | 10 | 10 | 13 | 7 / 7 | 5 / 5 | 1 | Teaching route | No |
| 5 | 4 | 4 | 7 | 5 / 5 | 2 / 2 | 1 | Teaching route | Yes |
| 6 | 10 | 15 | 18 | 8 / 10 | 4 / 6 | 1 | 14 / 10 | No |
| 7 | 5 | 11 | 14 | 7 / 11 | 1 / 5 | 1 | 2 / 11 | No |
| 8 | 5 | 13 | 16 | 8 / 12 | 4 / 6 | 1 | 8 / 14 | No |
| 9 | 8 | 9 | 12 | 8 / 10 | 3 / 5 | 1 | 10 / 11 | No |
| 10 | 6 | 13 | 16 | 7 / 11 | 4 / 4 | 1 | 13 / 11 | Yes |
| 11 | 7 | 13 | 16 | 7 / 9 | 3 / 5 | 2 | 10 / 11 | No |
| 12 | 11 | 19 | 22 | 9 / 11 | 5 / 7 | 2 | 7 / 6 | No |
| 13 | 10 | 12 | 15 | 9 / 11 | 4 / 6 | 2 | 10 / 14 | No |
| 14 | 7 | 11 | 14 | 7 / 9 | 3 / 5 | 2 | 6 / 7 | No |
| 15 | 8 | 11 | 14 | 7 / 11 | 3 / 5 | 2 | 2 / 4 | Yes |
| 16 | 7 | 17 | 20 | 8 / 14 | 4 / 6 | 2 | 10 / 6 | No |
| 17 | 8 | 15 | 18 | 9 / 15 | 3 / 7 | 1 | 9 / 8 | No |
| 18 | 8 | 12 | 15 | 8 / 10 | 4 / 6 | 2 | 6 / 2 | No |
| 19 | 7 | 12 | 15 | 7 / 9 | 4 / 6 | 2 | 4 / 6 | No |
| 20 | 6 | 12 | 15 | 7 / 9 | 4 / 6 | 2 | 6 / 2 | Yes |
| 21 | 11 | 14 | 17 | 10 / 12 | 5 / 5 | 2 | 2 / 9 | No |
| 22 | 8 | 14 | 17 | 8 / 12 | 5 / 9 | 3 | 10 / 9 | No |
| 23 | 13 | 18 | 21 | 9 / 13 | 6 / 8 | 1 | 2 / 9 | No |
| 24 | 9 | 12 | 15 | 8 / 10 | 3 / 7 | 3 | 6 / 5 | No |
| 25 | 7 | 9 | 12 | 8 / 10 | 4 / 6 | 3 | 2 / 6 | Yes |
| 26 | 7 | 14 | 17 | 5 / 11 | 2 / 6 | 2 | 14 / 6 | No |
| 27 | 7 | 11 | 14 | 8 / 10 | 4 / 6 | 3 | 10 / 14 | No |
| 28 | 13 | 17 | 20 | 10 / 12 | 6 / 8 | 3 | 6 / 7 | No |
| 29 | 11 | 13 | 16 | 10 / 12 | 5 / 7 | 3 | 10 / 7 | No |
| 30 | 8 | 17 | 20 | 9 / 11 | 6 / 8 | 1 | 9 / 11 | Yes |
| 31 | 11 | 15 | 18 | 9 / 13 | 5 / 7 | 3 | 5 / 4 | No |
| 32 | 10 | 15 | 18 | 10 / 14 | 5 / 5 | 0 | 7 / 9 | No |
| 33 | 14 | 20 | 23 | 10 / 12 | 6 / 8 | 3 | 6 / 2 | No |
| 34 | 12 | 14 | 17 | 10 / 12 | 7 / 9 | 3 | 14 / 10 | No |
| 35 | 10 | 19 | 22 | 9 / 13 | 3 / 7 | 2 | 11 / 7 | Yes |
| 36 | 9 | 15 | 18 | 10 / 12 | 3 / 7 | 3 | 11 / 7 | No |
| 37 | 10 | 15 | 18 | 10 / 12 | 4 / 8 | 3 | 6 / 5 | No |
| 38 | 11 | 14 | 17 | 9 / 11 | 5 / 5 | 3 | 7 / 6 | No |
| 39 | 16 | 21 | 24 | 10 / 12 | 5 / 9 | 3 | 7 / 11 | No |
| 40 | 11 | 12 | 15 | 8 / 12 | 6 / 6 | 3 | 10 / 6 | Yes |
| 41 | 11 | 17 | 20 | 9 / 11 | 4 / 6 | 3 | 5 / 6 | No |
| 42 | 15 | 21 | 24 | 10 / 12 | 6 / 8 | 3 | 6 / 5 | No |
| 43 | 11 | 12 | 15 | 10 / 12 | 7 / 7 | 0 | 6 / 8 | No |
| 44 | 13 | 16 | 19 | 10 / 12 | 6 / 8 | 3 | 2 / 6 | No |
| 45 | 11 | 15 | 18 | 9 / 11 | 6 / 8 | 2 | 10 / 4 | Yes |
| 46 | 13 | 20 | 23 | 10 / 12 | 5 / 7 | 3 | 4 / 5 | No |
| 47 | 13 | 18 | 21 | 9 / 11 | 4 / 6 | 3 | 8 / 9 | No |
| 48 | 11 | 15 | 18 | 8 / 12 | 3 / 7 | 3 | 10 / 9 | No |
| 49 | 14 | 15 | 18 | 10 / 12 | 5 / 7 | 3 | 10 / 14 | No |
| 50 | 11 | 16 | 19 | 8 / 10 | 5 / 5 | 3 | 1 / 5 | Yes |

## Difficulty and variety

| Levels | Mean short moves | Mean all-star moves | Mean short turns | Mean all-star turns |
|---|---:|---:|---:|---:|
| 1–10 | 6.3 | 9.0 | 3.0 | 4.0 |
| 11–20 | 7.9 | 13.4 | 3.7 | 5.9 |
| 21–30 | 9.4 | 13.9 | 4.6 | 7.0 |
| 31–40 | 11.4 | 16.0 | 4.9 | 7.1 |
| 41–50 | 12.3 | 16.5 | 5.1 | 6.9 |

- Levels 1–5 intentionally teach collection on the main route. All 45 levels from 6–50 offer a zero-pickup short route and a more expensive all-pickup detour.
- Gap-required levels: 5, 10, 15, 20, 25, 30, 35, 40, 45, 50. Each is unsolvable without Bunny; never needs a second jump.
- All-star detours cost at least one extra quarter-turn. Move limits are always all-star par +3. Individual levels may ease off between harder puzzles; the band averages rise.
- Levels 41–50 have minimum completion costs 11–15 moves; see exact table. No late one/two-move bypass was found.
- [SOLVER] All 1,225 pairs: zero duplicate complete topologies, zero repeated sampled core routes/high-overlap routes at the existing 0.85 cutoff. Rotation/reflection normalization retained; no threshold relaxation. This is not exhaustive proof that every equal-cost solution is unique.
- Authored decoy counts are reported honestly; not every decoy is a meaningful choice. The demonstrated decisions are the direct/detour branch and rejoin, turns and single jump. More clicks are not automatically more cognitive difficulty.
- Exactly-one-pickup routes: Level 23 certified, 15 moves. On the other 49 layouts, blocking either pickup cell makes a one-pickup home route impossible. Most detours therefore yield 1 or 3 rating stars; Level 23 also yields 2. No fake two-star board is used as gameplay evidence.
- Player enjoyment remains AI judgment, not a human enjoyment study. Owner feedback on pacing and replay remains valuable.
