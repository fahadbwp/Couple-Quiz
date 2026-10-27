# Jelloo — Rectangular Foundation and Complete Bunny 1–50 Plan

Date: 27 October 2026
Status: APPROVED by the owner on 28 October 2026. Local implementation and verification are recorded in foundation-bunny-1-50-results.md.
Workspace: C:/Users/Fahad Saleem/Documents/jellypals
Scope: rectangular foundations for future worlds, plus the complete fifty-level Bunny world. Local development only.

## 1. Outcome and boundaries

Deliver a complete, verified Bunny world: fifty 4-column × 4-row puzzles, meaningful progression and collectible routes, accurate stars, fair move limits, safe saves, working navigation and accessible result dialogs.

Preserve the owner-approved blush garden, glossy pink tiles, cream roads, approved Bunny/source artwork, fixed top-right golden collectibles, automatic movement, current-world result mascot and win/loss popups. No return to previous floating-tile or isometric experiments. No active-gameplay Go/Undo/Restart controls. Result Replay/Try Again remains.

Future world dimension contracts:

| World | Global levels | Columns × rows | Implementation in this scope |
|---|---:|---:|---|
| Bunny / Pink Candy Land | 1–50 | 4×4 | Full content and gameplay |
| Panda / Bamboo Jungle | 51–100 | 5×4 | Geometry fixtures only |
| Cat / Cozy Rooftops | 101–150 | 6×4 | Geometry fixtures only |
| Octopus / Ocean Paradise | 151–200 | 7×4 | Geometry fixtures only |
| Fox / Enchanted Forest | 201–250 | 8×4 | Geometry fixtures only |

Do not build or unlock other worlds, mixed-character v2 levels, portals, hazards, an editor, new modes, advertising, referrals or payments. Preserve the legacy Adventure 1–100 and original legacy tutorials; new Character Worlds 1–50 is a distinct content set. Do not change Quiz functionality, production credentials, Supabase, hosting, DNS or deployment controls. No push/merge/deploy.

After approval, carry this full scope through internal checkpoints; correct reproducible in-scope defects as found. Do not stop after a ten-level demonstration or seek routine permission after every checkpoint. Stop for owner input only for a substantive design conflict, unsafe data operation, missing required access, or an issue outside approved scope.

## 2. Findings used to plan the work [CODE]

- Current branch: codex/character-worlds-phase3. HEAD d5c7762fc61c64f79c34ea9e5b33617066d4d105. Current campaign/UI/assets/tests are untracked additions, not represented by this old base HEAD. Preserve them before restructuring.
- engine.ts Level.size, neighbour(), power-solver.ts, authored level builder, structural comparator and preview coordinates assume squares. Square assumptions must be audited through their call sites, not fixed by stretching CSS.
- Current authored Bunny content includes larger square boards in later levels. All fifty must be reviewed/redesigned for the new fixed 4×4 constraint.
- Existing high move targets were written for those larger boards. They cannot be copied blindly into 4×4 content. Repeated rotations alone do not prove meaningful difficulty.
- World 1 content version is 1.0.2. Current allowance is certified all-star minimum +3. Current scoring is shared legacy-style 2/3 stars, not the proposed completion-plus-two-pickups model.
- Campaign v2 currently stores completion and best stars, but not a validated resumable board. Existing unsupported board-bearing saves are preserved rather than loaded.
- Last completed task recorded 384 total tests /379 passed /0 failed /5 skipped and a passing build. These are historical baseline results; rerun before implementation and report any drift. Five skips are opt-in Supabase integration tests, not proof of DB readiness.

## 3. Explicit design decisions included in this proposed approval

### Stars

For the NEW Bunny content revision only:
- A verified completion earns 1 rating star.
- Exactly two collectible golden stars per level; each reached before home adds 1 rating star.
- Maximum 3 rating stars per level. Zero/one/two pickups therefore award 1/2/3 on a win.
- A failed attempt awards nothing. Pickup visuals during a run do not save rewards prematurely.
- Replays improve the best result only; no duplicate farming and no reduction of earned best stars.
- Distinguish two board collectibles from the three result/rating stars in copy.
- Do not modify the legacy scorer's behavior for existing Adventure/Daily/Zen/Trials content. Use a campaign-specific policy or equally isolated dispatch.

### Moves and retries

- One clockwise quarter-turn always costs one move.
- Move limit remains the solver-certified all-star minimum +3, with visible budget and immediate free retry.
- A home path completed on the last allowed move runs to completion and wins.
- Exact arithmetic limitation: an accidental EXTRA corner turn plus three corrective turns costs FOUR extra moves overall. This plan keeps +3; it does not promise universal recovery, add hidden refunds or restore Undo.

### Route choice

- Levels 1–5 teach movement/collection; they may place pickups on the main route.
- Levels 6–10 gradually introduce optional detours; at least three levels in that band demonstrate genuine short/star alternatives.
- Levels 11–50 must offer a valid short completion route that misses at least one collectible and an all-star alternative requiring a real detour and at least one additional rotation.
- A longer route must introduce a meaningful turn/branch/power decision; a decorative corridor or a moved decoy does not qualify.
- One-star and three-star outcomes must be attainable by actual timed click sequences, not only by replacing the whole board with a solver solution. Two-star outcomes must be tested wherever the route structure permits one pickup.
- Retain auto-start. Prove that an all-star route can be prepared without an unintended shortcut launching early. Prefer authored final-connection ordering/geometry; do not introduce a Go button or an unapproved route-selection mode.
- Some levels deliberately require Bunny's existing one-gap jump. Prove those remain unsolvable without it. Never silently grant two jumps.

### Progression and difficulty

- Keep existing within-world gates: 10=15, 20=36, 30=60, 40=84, 50=110 stars from preceding world levels.
- Next-world eligibility remains previous finale +120/150 stars; planned Panda content stays unavailable until built.
- Stars are not spent by unlocking. Gate copy shows the shortfall and offers replay of accessible levels.
- Difficulty rises across five ten-level bands through route decisions, relevant decoys, star detours and power use. Do not enforce +1 click on every consecutive level or carry old 27–32 move targets into new 4×4 boards without evidence.
- Proposed tuning direction: 1–10 learning; 11–20 clear route tradeoffs; 21–30 interacting turns/decoys; 31–40 deeper planning; 41–49 mastery; 50 distinctive Bunny finale using existing mechanics.
- Before freezing content, publish actual minimum/all-star costs and decision metrics. Later-level one/two-move completion bypasses are rejection cases. Exact numeric bands follow measured feasible 4×4 content and are reported, not invented in advance.

## 4. Work order and pass gates

### Stage A — Protect the approved state and establish a baseline

1. Inventory current campaign files, assets and tests; identify authoritative current appearance and superseded experiments.
2. Create a recoverable local baseline snapshot/commit of the approved work, after checking staged scope and secrets. Preserve all existing history and unrelated files. Do not commit private saves, credentials, node_modules or build output.
3. Run focused campaign tests, full npm test, typecheck and lint. Reproduce and classify failures before changing assertions. Record existing unrelated warnings and skipped integrations.

Pass: approved state recoverable; baseline has exact results; no necessary current assets omitted.

### Stage B — Rectangular geometry and compatible engine foundation

1. Define explicit columns/rows with validation, preserving existing square Level.size callers through a compatibility boundary. A partial/invalid dimension pair must fail safely.
2. Centralize index-to-row/column, neighbour lookup, edge detection, tile count and coordinate conversion.
3. Update relevant engine/solver/authored builder/trace/comparator/UI consumers consistently. Audit square-only scoring/search helpers and visited-state representations, including cell 31 on the 32-cell 8×4 board.
4. Handle rectangular transformations correctly: 90-degree rotation exchanges dimensions; no signature may assume an unchanged square stride.
5. Add deterministic fixtures for 4×4/5×4/6×4/7×4/8×4, corners/edges, wraparound prevention, route traversal, collectibles, a Bunny gap and invalid dimensions.
6. Re-run legacy square, power and Multi-Jelly regressions. Changes to shared code are limited to the compatibility work required by this foundation.

Pass: all fixture dimensions replay correctly; horizontal row wrapping never creates a connection; old square boards retain behavior; no regression is accepted as the cost of rectangular support.

### Stage C — Content revisions, score isolation and safe progress

1. Define a content identity covering campaign, level revision and dimensions before replacing authored boards.
2. Preserve the existing v2 save bytes and legacy v1 save. Changing a 5×5 board into a new 4×4 puzzle must not silently reinterpret its achievements as proof of solving the new puzzle.
3. For changed boards, offer an explicit new-revision start with separate progress; retain the previous campaign revision and its completion/earned-star records through a supported read/replay path. Exact unchanged content may be recognized only through verified identity, not a matching level number.
4. Do not automatically reset real browser progress, copy old stars to new puzzles or lower archived best scores. Clearly distinguish current-revision progress from preserved previous progress.
5. Implement campaign-specific 1+pickups scoring; test rewards, farming protection, failed runs, replay improvement and gates.
6. Add validated in-progress restoration for the new revision: identity, dimensions, legal rotations, moves, editable/running/result state and pickups. A restored running attempt must resume or replay deterministically without duplicate rewards. Preserve corrupt/unsupported data and make storage failure explicit.
7. Test stale tabs/concurrent saves and restoration after content updates. No real player fixtures or private save imports.

Pass: old/new saves and score policies cannot contaminate each other; failed saves never claim success; current and historical progress remain accessible without silent changes.

### Stage D — Rebuild and verify ALL fifty 4×4 Bunny levels

Work internally in ten-level batches, but continue automatically to Level 50 under the single approved scope.

For every level, maintain an inventory row:
- revision, dimensions, start/home, two pickups, relevant decoys;
- shortest-completion route and all-star route;
- solver minimum/all-star rotations, move limit and actual click sequence;
- route turns/branch choices, Bunny-power necessity where applicable;
- similarity/duplicate findings and their resolution;
- engine replay, auto-start timing, star outcome and save result.

Reject unsolved/unknown solver results, unreachable pickups, invalid jumps, unintended cheap bypasses, solver/engine disagreement and solutions that cannot actually be entered before auto-start.

Run all 1,225 level-pair comparisons with rotation/reflection normalization. Exact duplicate topology and the same core solution with irrelevant decoys are rejection cases. Near matches receive written route-decision review; do not claim exhaustive uniqueness or alter similarity thresholds simply to make the audit green. If fifty meaningfully different 4×4 boards cannot pass the declared criteria, report the exact constraint instead of padding with repeats or increasing dimensions.

Pass per batch: all its levels meet content/score/route requirements and prior batches still pass. Final pass: all fifty have recorded evidence, not just a ten-level sample.

### Stage E — Complete the actual player journey

1. Keep approved visual materials; only responsive geometry, star slots and necessary instruction/status copy may change.
2. Test the whole progression, local gates, replay, next level, map navigation, Back/Forward and refresh with disposable progress.
3. Test win/loss dialogs, current-world Bunny, keyboard focus, Escape/reopen, Retry, last-move success and duplicate-tap safety.
4. Verify both target routes, collection animations and corner clearance at each tile orientation. Glow and collection effects must not cross the cream road or block taps.
5. Test widths 320/390/768/1280 and reduced-motion behavior. Future 5×4–8×4 fixtures must fit their viewport without silently unreadable targets. If later-world touch targets require a new zoom/landscape interaction, propose it separately; do not call that UX solved by shrinking tiles.
6. Protect owner's normal 3055 progress. Use isolated fixtures/origins for browser testing.

Pass: all fifty levels exercised through real browser interactions using verified click sequences; human-style untimed play on representative early/mid/late/detour/gap/finale levels, with level IDs and observations recorded. Automated browser replay is labeled as such, not described as a human playtest. At least one real browser short and all-star replay for every level; gate and save paths covered explicitly.

### Stage F — Fix, regress and deliver

- Correct all reproducible in-scope faults as they arise; add focused tests for actual defects rather than source-string checks or mirrored implementation assertions.
- Full npm test, TypeScript, scoped ESLint plus repository lint error check, and npm run build.
- Preserve baseline skipped external integrations unless disposable access is separately approved; list exact passed/failed/skipped counts. Existing unrelated lint warnings are disclosed, not silently fixed by unrelated edits.
- Re-run affected checks after fixes. Do not weaken tests, remove content or hide solver exhaustion to obtain a green report.
- Make meaningful local milestone commits with clear messages when each unit is verified. No push, merge or deployment.

## 5. Final definition of done

- Bunny levels 1–50 all exist and are exactly 4×4.
- Rectangular foundations pass 5×4 through 8×4 fixtures without releasing other worlds.
- Every Bunny level has two collectible stars; approved new-revision rating is 1+actual pickups, maximum three.
- Tutorial exceptions and required detour coverage above are met; late cheap bypasses and duplicate-padding defects are resolved.
- Every certified route is playable through actual rotations/auto-start and respects the move budget.
- All reachable outcomes, last-move wins, exhaustion, retries, star gates and Next Level work.
- New-revision board restoration is deterministic; original and previous-revision progress is preserved and never silently relabeled.
- Approved visuals and source artwork remain recognizable and unchanged in direction.
- Complete checks pass with exact counts and no unexplained failures; skipped/NOT TESTED items are clearly listed. Zero known in-scope blockers, not a claim that software can never contain a bug.
- Final package: fifty-level evidence inventory, variety/difficulty report, save-compatibility fixtures/results, browser matrix, engineering logs, local commit SHAs, remaining limitations and a clear local GO/NO-GO.

Stop after the complete local Bunny batch for owner review. Production release and the Panda world require later explicit authorization.
