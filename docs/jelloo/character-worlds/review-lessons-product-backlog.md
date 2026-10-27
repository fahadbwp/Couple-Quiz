# Jelloo — Review Lessons and Product Backlog

Date: 27 October 2026
Status: Planning comparison only. No new mechanic or implementation authorized by this document.
Workspace: C:/Users/Fahad Saleem/Documents/jellypals

## Evidence and authority

Compared:
- Owner-supplied Master PRD 1.0: attachment b7beb3c3-848d-4205-88e7-b88115ffd5e8/Pasted text.txt (especially ADV-002, MULTI-006/008/009, SAVE-001–007, MON-001–008).
- Owner's later Character Worlds decisions: five worlds, fifty levels per world, matching mascots, star gates, local development, approved blush-pink visual checkpoint, auto-start and no active-gameplay Go/Undo/Restart controls.
- New architecture note: attachment 9fd7af75-59b0-4b79-aecd-5d1163848cf7/Pasted text.txt.
- Owner's supplied review synthesis in this conversation.
- Current local source: campaign.ts, campaign-save.ts, scoring.ts, campaign-v2/world1-provider.ts, world1-specs.ts, structural-comparator.ts and app/jelloo/character-worlds/page.tsx; current result-popup report.

The five original review files, review URLs, sample selection, dates and full raw reviews were not included in this turn. Their authenticity, counts and representativeness were not independently verified. Treat review patterns as qualitative hypotheses supplied by the owner, not a market survey. No APK was inspected in this comparison. The architecture note itself reports that the inspected file was an installer; it does not establish reverse engineering of Rail Maze 2. Do not repeat its internal-algorithm claims as verified facts.

Later explicit owner decisions control the new Character Worlds campaign where they supersede the original PRD. The legacy 100-level campaign remains separate; it is not silently reinterpreted as the new campaign. Old reports describing other worktrees are historical.

## Current product baseline [CODE]

- New Character Worlds: 250 planned Adventure levels, grouped 1–50 Bunny/Pink Candy Land, 51–100 Panda/Bamboo Jungle, 101–150 Cat/Cozy Rooftops, 151–200 Octopus/Ocean Paradise, 201–250 Fox/Enchanted Forest.
- Only World 1's fifty authored puzzles are available in the development preview. The preview route returns 404 in production; subsequent worlds remain planned.
- New save key is jelloo.campaign.v2; legacy jelloo.progress.v1 remains separate. Completion and best stars persist; unfinished board rotations are not currently saved. Unsupported/corrupt saves are preserved.
- Existing within-world gates: local Level 10 = 15 stars; 20 = 36; 30 = 60; 40 = 84; 50 = 110, from earlier levels in that world. Next-world eligibility requires the previous finale plus 120/150 world stars. Unbuilt worlds remain unavailable even when eligibility is met.
- Replays improve best stars without farming duplicate awards or spending stars.
- Current shared scoring awards 2 stars for a within-limit completion missing collectibles, 3 for collecting all. The over-limit 1-star branch is not normally reachable in this move-limited preview. The discussed alternative of 1 completion star + 2 collectible stars remains a proposal, not an implemented scoring change.
- Optional detour content exists in World 1, but not every board has a meaningful pair of routes. Existing quality checks compare topology and sampled minimum/all-star routes, including symmetry normalization. They do not prove every possible solution is unique or that a puzzle is fun.
- Current move allowance is certified all-star rotations + 3. Exactly one clockwise quarter-turn consumes one move. Win/loss use modal dialogs; the win mascot is derived from the current world.
- Approved art direction is the latest glossy pink grid and blush garden, not a request to return to an older visual experiment. Preserve approved Bunny/source art and native modal behavior.
- Legacy Daily, Zen, Endless and Multi-Jelly systems exist independently; their presence is not evidence of integration into Character Worlds v2.

## Keep

| ID | Priority | Decision | Basis / acceptance |
|---|---|---|---|
| K01 | Critical | Unlimited attempts and normal play; no energy/tickets/wait-to-play system | A level's move budget may end an attempt, but Retry is immediate and free. Losing must not remove access to completed content. |
| K02 | Critical | Preserve approved art, source mascots and pink World 1 design | No broad art restoration/redesign from a competitor review. Other worlds follow their approved character identities when built. |
| K03 | Critical | Preserve saves, earned stars, old Quiz/share links and legacy campaign | SAVE-001–007. Never fabricate achievements or migrate different puzzles onto old completion IDs. |
| K04 | High | Keep core route rotation and free skill-based star progression | No payment, ad viewing or purchased lives required to pass a gate. Replays remain available and stars are not consumed by unlocking. |
| K05 | Critical | Keep gameplay, results and sensitive controls free of disruptive ads | MON-001–008. Only previously reviewed map-footer/non-gameplay placements may be considered through their separate consent, technical and release approval gates. This review activates nothing. |
| K06 | High | Preserve deterministic engine/solver validation | A published puzzle must be engine-playable, collectibles reachable, and required character powers genuine. Exhausted search is unknown, not proof of impossibility or quality. |

## Improve — next implementation candidates, pending scoped approval

| ID | Priority | Work item | Acceptance before calling it done |
|---|---|---|---|
| I01 | P1 | Finalize the star reward contract | Choose explicitly between existing 2/3 scoring and the proposed completion + two pickups system. Specify 0/1/2 pickup outcomes, failed-run behavior and best-score retention. Version any changed board/content identity; do not reduce historical earned stars. |
| I02 | P1 | Prove meaningful short and star routes in a small sample | Use approximately ten suitable existing World 1 levels, then extend only after review. Certify both completion and all-star solutions; star route must add at least one real move and a routing decision, not merely an irrelevant long corridor. An early teaching level need not have two routes. |
| I03 | P1 | Verify auto-start preserves route choice | With real browser clicks, show that a player can intentionally prepare the star route without being forced onto an already-complete shortcut. Keep Go absent. Any engine route-selection or timing change needs a reproduced case and separate approved scope. |
| I04 | P1 | Assess difficulty and repetition by decisions | Record minimum/all-star rotations, route turns, branch decisions, power use and decoy relevance. Compare complete topology and meaningful routes under rotation/reflection. More clicks alone do not establish harder gameplay. Pairwise tests supplement human review. |
| I05 | P1 | Validate free star-gate pacing | Playtest existing 15/36/60/84/110 and 120/150 requirements; show exact stars still needed and useful replays. Retain thresholds until approved data-backed adjustment. Distinguish a skill gate from a monetization paywall. |
| I06 | P1 | Versioned unfinished-board restoration for v2 | Specify resumable state, content revision, legal rotations, move count, run status and concurrency policy. Test corruption, storage failure, old content versions, export/rollback compatibility and save conflicts. Preserve completed stars; do not silently regenerate an in-progress board. |
| I07 | P1 | Complete World 1 human playtest before more content | Test early/mid/late levels and mobile 320/390/768 plus desktop 1280. Note confusing stars, premature auto-start, repeated routes, wrong navigation and click fatigue. No invented engagement/retention scores. |
| I08 | P2 | Make optional mastery and return play clear | Explain best-star improvement and available challenges without demanding a streak or lengthy daily session. Evaluate existing Daily/Zen compatibility before proposing a second system. No mode integration is authorized here. |

### Recommended execution order

1. A short design decision for I01, including compatibility for existing stars. This backlog does not approve the proposed replacement scoring by itself.
2. A ten-level route/collectible sample for I02–I03; report solver evidence and real click sequences.
3. Human playtest and difficulty/gate review (I04–I05, I07). Record observations; do not automatically change thresholds.
4. Separately scoped save restoration work (I06) before large new packs or versioned procedural content.
5. Complete/review the fifty-level Bunny world before starting Panda's next fifty-level world.

Current +3 allowance is retained. One accidental EXTRA corner quarter-turn plus three corrective turns costs four extra moves total. Any promise to always forgive that mistake needs an owner decision; do not quietly add refunds or change allowance.

## Add Later — not approved for implementation

| ID | Proposal | Prerequisite / boundary |
|---|---|---|
| L01 | Seasons and curated puzzle packs | Quality baseline and explicit pack design. New v2 campaign has 250 planned levels, so 'seasons after 100' is not an automatic checkpoint. Do not expire earned content or introduce FOMO requirements. A pack must add meaningful puzzle structures, not just skins. |
| L02 | Reviewed procedural supply after authored content | Deterministic versioned level identity, engine-backed validation, solver budgets and fallback to verified content. Avoid repeats within a specified window; never promise infinite globally unique boards on a bounded finite state space. |
| L03 | Character Worlds Daily/Zen/Endless integration | Assess existing modes and save identities first. Do not duplicate or prematurely expose legacy modes as v2 features. |
| L04 | Multi-character puzzles | Approved previously only within legacy systems. New character-world interaction rules, tutorials, solver coverage and owner approval are needed before v2 adoption. |
| L05 | Local Level Creator prototype | Explicit editor spec, schema validation, solvability checks and isolated saves. Public sharing additionally needs abuse prevention, moderation, privacy, ownership and backend authorization. Not a current dependency. |
| L06 | Portals, timed hazards, dynamic levers or new powers | Separate gameplay approval and teaching plan. Do not build because a supplied competitor architecture recommends them. Use existing powers meaningfully first. |

## Avoid

- Energy/ticket exhaustion, waiting timers, paid retry and pay-to-progress.
- Forced ads between levels, result-control obstructions, deceptive ad clicks and automatic provider activation.
- Redesigning approved characters or replacing the new pink grid in response to reviews of another game.
- Generating more rotations or swapping backgrounds and presenting that alone as new puzzle depth.
- Strictly increasing move count on every consecutive level; maintain an understandable difficulty curve and room for teaching/recovery rather than click fatigue.
- Promising one to two hours of daily engagement or guaranteed revenue from qualitative reviews. A player should be free to play briefly or continue longer.
- Treating 'exactly one solution' as mandatory when intentional short and collectible routes are a core design goal.
- Copying competitor sprites, level layouts, names, code or alleged internal architecture.
- Silently migrating legacy boards, changing earned stars, resetting saves, or releasing unreviewed mechanics.

## Corrections to the supplied infinite-progression architecture note

1. The note does not establish the claimed Rail Maze 2 internal solver, data schema or generation pipeline. These are proposals/inferences, not reverse-engineering evidence.
2. Portals change graph connectivity; they do not automatically make a two-dimensional board's topology matrix '3D' or establish a 10x variety multiplier.
3. A bounded grid with bounded kinds, rotations and mechanics has finitely many states. Endless supply can repeat eventually. Define and measure an anti-repeat window instead of claiming zero repetition forever.
4. Neither an A* label, a reverse random walk nor a unique completion proof establishes enjoyable difficulty. Branch decisions, fair decoys, reachable stars and actual engine replay still matter.
5. Cycles and stateful mechanics require an appropriate state graph; do not assume the puzzle is a DAG. Power-used flags and changed world state belong in solver states where those mechanics exist.
6. Requiring exactly one route conflicts with intentional short versus star routes. Validate each objective separately and exclude unintended cheap bypasses.
7. Moving existing typed authored data to JSON is not itself a variety improvement. Introduce interchange formats only when an editor/pack loader requires them.
8. Reusing a road shape with a new timer does not guarantee a '100% new' player experience. New mechanics also impose accessibility and teaching costs.

## Verification and scope of this document

Read-only source/PRD comparison plus this new planning file. No gameplay changes, asset edits, test execution, browser playtest or production checks were performed for this document. Prior 384/379/5 test results belong to the preceding popup task, not new verification of these proposals. No push, merge, deploy, ad activation, Supabase access or player-save modification.
