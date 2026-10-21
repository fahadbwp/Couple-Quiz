# Jelloo difficulty review: 12, 14 and 19 versus 16 and 22

Measured 2026-10-21. Task 3 is documentation only; no generator changes were made in this task.

## Scope and reproducibility

The earlier 610-second playtest did not record its random journey seed in `endless-playtest.json`. A level number alone does not identify an endless board. These are reproducible **seed 42** measurements and a separate **seeds 0–9** sample, not a reconstruction of that player's exact boards.

Current means commit `a98869c` (after intro variety and star detours). Baseline means the power generator from reviewed commit `efae00d`. Normal levels 12, 14, 16 and 22 use the unchanged normal generator in both versions. Level 19 is Panda and changed in Task 2.

Measurements use `levelAt(id, seed, 4)` and `solvePowerLevel(level)` with the actual character, gate, locked tiles and rotation costs. No search exhausted its budget. For the baseline Panda board, load `git show efae00d:lib/jelloo/power-generator.ts` and call its `generatePowerPuzzle(19, seed)`; the solver's search rules are unchanged by Task 2 (it only gained route witnesses).

- **par:** minimum clockwise tile rotations to reach home, regardless of stars.
- **starPar:** minimum rotations to reach home with every collectible in one run.
- **Route length:** cells on the solver's minimum-move witness (`parPath`), including start and home. This is distinct from minimum geometric length, though both lengths match in the seed 42 table.
- **Decoy tiles:** occupied cells outside that minimum-move witness. This reproducible count includes useful optional star-detour tiles, so it measures off-route clutter/alternatives, not exclusively dead ends.
- **Forced turns:** two-port corner tiles on that witness. Each forces a bend when traversed. T-junction choices are excluded; these are not claimed to be mandatory across every possible solution. Equal-cost witness ties use solver traversal order.

## Seed 42: current boards

| Level | Character | par | starPar | Route length | All-star route length | Decoy tiles | Forced turns |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 12 | Normal | 18 | 18 | 12 | 12 | 4 | 5 |
| 14 | Normal | 21 | 21 | 12 | 12 | 1 | 6 |
| 19 | Panda | 14 | 22 | 12 | 14 | 3 | 5 |
| 16 | Normal | 16 | 16 | 12 | 12 | 2 | 5 |
| 22 | Normal | 21 | 21 | 14 | 14 | 0 | 7 |

For baseline level 19 at seed 42: **par 16, starPar 16, route length 12, decoys 0, forced turns 7**. Its star sat on the required corridor. Task 2 now offers a 12-cell direct route versus a 14-cell reward route, costing eight additional rotations for all stars. That eight-move premium deserves playtesting even though the geometric detour is small. The other four rows are unchanged from baseline.

Minimum-move route witnesses (zero-based row-major cells, width 5):

```text
12: 12,17,22,23,24,19,14,13,8,7,6,5
14: 13,14,9,4,3,8,7,6,1,0,5,10
19: 1,2,7,8,3,4,9,14,19,24,23,18
16: 4,3,2,7,8,9,14,19,18,17,16,21
22: 16,17,12,7,6,11,10,15,20,21,22,23,18,19
```

## Seeds 0–9: averages, not universal difficulty ratings

| Level/version | Mean par | Mean starPar | Mean route length | Mean decoys | Mean forced turns | Costlier stars, out of 10 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 12, unchanged | 13.7 | 14.5 | 11.6 | 3.2 | 5.0 | 1 |
| 14, unchanged | 14.8 | 15.2 | 11.6 | 3.8 | 5.0 | 1 |
| 19, reviewed baseline | 15.4 | 15.4 | 12.0 | 0.0 | 5.9 | 0 |
| 19, after Task 2 | 17.1 | 21.7 | 12.0 | 7.3 | 5.3 | 10 |
| 16, unchanged | 13.9 | 13.9 | 12.0 | 4.2 | 4.8 | 0 |
| 22, unchanged | 18.7 | 18.7 | 14.0 | 5.6 | 7.0 | 0 |

## Findings and recommendations only

1. **12 versus 16:** Their average par and forced-turn counts are close. Level 16 has more off-route tiles in this sample (4.2 versus 3.2). This is consistent with the tester considering a wrong route before finding the right one, but does not prove that decoy count causes engagement. Recommend measuring plausible wrong connections and decision points rather than raising rotation counts alone.
2. **14:** Seed 42 needs 21 rotations yet has only one off-route tile. A long, exposed corridor can create tapping work without much route-finding. Recommend testing an alternative-route quality gate for normal levels, rather than increasing par alone. No such gate was added here.
3. **19:** The reviewed generator supplied no decoy tiles in this sample and stars cost no extra moves. Panda's gate provided a real dependency, but the route was exposed. Task 2 adds an optional reward decision: all ten sampled current boards have `starPar > par`. Recommend checking whether the new off-route density and rotation premium feel satisfying or busy; automated solvability cannot settle that.
4. **22:** The sample has longer routes, more corners and more off-route tiles than 12/14/16. This offers a plausible structural explanation for the earlier positive impression. However seed 42 has no off-route tiles, and none of these ten sampled boards requires extra star moves. The prior observation of a star detour cannot be generalized without the missing playtest seed.
5. **Next playtest:** Record seed, level id, generator revision, completion time, rotations and retries alongside the player's comments. Compare normal boards with similar par but different decision points. Do not tune unlock thresholds from this small computational sample.

## Validation and limits

- Full repository `npm test`: **158 tests: 153 passed, 5 skipped, 0 failed**. Skips are explicitly opt-in real Supabase tests needing disposable project credentials; they were not run against production.
- Jelloo subset: **53 passed** (the previous 52 plus one explicit star-detour regression test; intro and 1,000-board tests gained assertions).
- 1,000 power levels: all solvable; own character required; all collectibles reachable together; every non-intro has `starPar >= par + 1`; tier 2+ non-intros have two collectibles. Intros intentionally retain their one-move, unlimited introduction.
- `npm run typecheck` and `npx eslint app/jelloo lib/jelloo tests/jelloo*.test.ts`: passed.
- No new browser/human playtest was performed for these changes. These are solver measurements, not enjoyment or retention scores.
- Bunny/source artwork, tutorials 1–10, unlock thresholds 10/20/30/40, normal-level generation and mixed-character scope remain unchanged. No save-format migration was added; generated power-board layouts for existing seeds have changed, so old in-progress power-board rotations are not guaranteed to reconstruct the previous board.
- Task 3 changes only this report. Recommendations above are not implemented.
