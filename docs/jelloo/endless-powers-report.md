# Jelloo — Endless powers implementation and review report

Date: 21 October 2026. Status: implementation and automated acceptance checks passed; ready for manager review. No deployment or push performed.

## Work completed in the approved order

1. State-aware solver first. `power-solver.ts` explores legal tile orientations and tracks jump-used, broken tile indices, and explicit Fox branch selections. Results include solvability, exact minimum clockwise rotations (par), all-collectible par, a replayable witness, exploration count and budget exhaustion. A route cannot revisit a cell, matching the existing game loop rule. Exhausted searches never count as proof.
2. Power necessity. Every candidate is solved again with no power and with each of the four other characters. It is accepted as a power level only if its own character succeeds and every alternative fails without exhausting the search budget.
3. Generator. Rules version 4 keeps the first ten tutorials and normal generated boards intact. From level 11, odd slots are power levels and even slots are normal puzzles. Power slots rotate through only characters unlocked before that level; consecutive power slots never repeat the same character. Normal slots retain Bunny and the previous generator. Generation is deterministic and bounded; failed verification does not release an unverified level.
4. Forgiving introductions. Levels 11/21/31/41 introduce the newly unlocked Panda/Cat/Octopus/Fox after completing milestone 10/20/30/40. Level 13 introduces Bunny's jump. Introductions have a highlighted editable tile, character greeting, fixed surrounding paths and no move limit. The fixed milestone thresholds have not been tuned.

## Mechanics

- Bunny: one gap jump per run, correct landing connection required. Existing Bunny art and first ten tutorials remain intact.
- Panda: departing the cracked tile changes the broken-tile state and opens a later marked gate. Removing Panda leaves that gate closed and the level unsolvable. The broken tile is visually removed; the gate changes from locked to open during traversal. This is a route dependency, not only an animation.
- Cat: wall traversal and faster crossing of sticky tiles.
- Octopus: water traversal.
- Fox: player chooses a directional branch using buttons. No route is selected automatically. A selection is required before the last allowed rotation; it is persisted and cleared by Restart. The UI does not use the solver's solution to make the player's choice.
- Playable dedicated trials now use the same stateful rules; the old definitions remain available for historical regression tests. The former Fox shortest/more-stars selector has been removed from playable trials.
- Progress schema accepts rules 1–4. An existing saved board retains its original rules until another level is visited. Power choices and completed Panda/Fox states round-trip safely. Recent unlocked levels can be replayed through the level selector.

## Acceptance evidence

| Criterion | Result |
| --- | --- |
| 1,000 generated levels solvable | PASS: 1,000 power boards, 10 seeds × 100 odd slots (11–209), all solved and replayed; over 900 distinct tile layouts required by test |
| Every power board impossible without its character | PASS: no-power plus each other character checked for every sample; none solvable, none exhausted |
| Collectibles reachable | PASS: all-star solution replay reaches every collectible within the limit (intros have no limit) |
| Fox choice made by player | PASS: no choice cannot complete; saved explicit branch enables the chosen route; UI has directional buttons |
| Panda destruction changes later route | PASS: later gate requires broken trigger state; no-power run cannot pass it; browser confirmed one broken tile and one opened gate |
| Existing regressions | PASS: original coverage retained; legacy junction audit explicitly requests rules 3; migration expectation updated to rules 4 |
| Full game tests | 52/52 PASS, including prior 39 and 13 new tests |
| Additional normal-generation coverage | Existing 1,500-board solvability/variety and 400-sample difficulty audits pass |
| TypeScript / scoped ESLint / whitespace | PASS |
| Bunny/source artwork | SHA-256 values unchanged |

Test files: `jelloo-power-solver.test.ts`, `jelloo-power-generator.test.ts`, `jelloo-power-integration.test.ts`, plus all existing Jelloo suites.

## Ten-minute playtest

Actual browser session: **610 seconds (10m 10s)**. Isolated `127.0.0.1` browser save; the user's localhost save was not changed. Started with an existing test save at 11 completed levels, replayed intro 11 and continued sequentially through 24. These are AI-operated observations from rendered boards and accessible tile labels, not human retention data. Solver witnesses were not used to play these levels. Elapsed time includes inspecting boards, tool overhead and result recording; do not infer human time-to-unlock from it.

All 14 played levels completed on the first attempt with 3 stars. No retries or losses. Move counts:

| Level | Moves / limit | Observation |
| --- | --- | --- |
| 11 | 1 / unlimited | Panda intro clearly demonstrates trigger then gate |
| 12 | 13 / 20 | Exposed corridor; comparatively easy |
| 13 | 1 / unlimited | Bunny gap obvious; intro outline repeats Panda's |
| 14 | 19 / 24 | More turns, but route still visually clear |
| 15 | 18 / 23 | Panda gate dependency works; mostly path alignment |
| 16 | 13 / 20 | Initial mental route was wrong; corner constraints forced a detour |
| 17 | 17 / 22 | Mandatory Bunny gap and landing connection clear |
| 18 | 17 / 24 | Long corridor and some decoys, generous margin |
| 19 | 12 / 17 | Many straights; easier than Panda level 15 |
| 20 | 15 / 22 | Cat unlock announcement and transition worked |
| 21 | 1 / unlimited | Cat wall/sticky intro worked; repeated intro outline |
| 22 | 17 / 24 | Denser board required more consideration; stronger than early corridors |
| 23 | 15 / 19 | Tighter margin, but route still exposed |
| 24 | 17 / 24 | Longer collectible detour, completed without retry |

No observed power bypass. The stronger evidence for impossibility is the counterfactual solver audit, not this small playtest. No browser error logs during the session. Raw timestamped notes: `endless-playtest.json`. Screenshot of broken Panda trigger plus opened gate: `endless-panda-gate.png`.

## Review points and limits

- **Fun/difficulty needs human review:** many early paths are visually exposed; rotation count is not a substitute for interesting decisions. Levels 16 and 22 felt more engaging to this tester. More carefully constrained decoys and less repetitive intro layouts are sensible review candidates, not changes silently applied here.
- Browser play covered Bunny/Panda and the Cat introduction. **Octopus and Fox were not reached in this timed browser session**; their solver, action/replay, save and trial flows have automated coverage. A focused browser/user playtest for those characters remains advisable.
- The Panda dependency currently uses one trigger opening one gate. It satisfies the state requirement but is deliberately a single-character mechanic, not the deferred mixed-character system.
- Intro layouts deliberately share a simple scaffold, which was noticeable in play. The game does not depend on explanatory prose to solve them, but labels and optional help remain available.
- Unlock pace remains 10/20/30/40, provisional. No pacing decision or mixed-character work was done.
- No production build, deployment, physical-device test or cross-browser performance claim. Mobile layout uses the existing tested responsive layout; the saved evidence image is at 390 px.
