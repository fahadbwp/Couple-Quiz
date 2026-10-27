# Phase 3.1 - World 1 acceptance corrections

Date: 2026-10-27. Working folder: `C:/Users/Fahad Saleem/Documents/jellypals`.
Branch: `codex/character-worlds-phase3`; base HEAD: `d5c7762fc61c64f79c34ea9e5b33617066d4d105`.
Status: local implementation and engine verification complete; owner review required before UI integration.

## Reproduced defects and corrections

1. **Comparator false confidence.** The previous signatures and edge comparisons did not reliably normalize rotation, reflection and translation. Minimum routes for 2/3 and 4/9 repeated under symmetry; corrected comparison also identified substantial overlap among 43/45/47. Rebuilt topology normalization and compared actual solver minimum and all-star routes. Added positive-control rotated, mirrored, translated and irrelevant-decoy fixtures. Redesigned levels 3, 9, 43 and 45 rather than lowering the threshold.
2. **Gameplay/solver disagreement.** Actual reducer replay on Level 16 missed its optional star because new content omitted `powerVersion: 4`, invoking legacy route selection. Authored content now explicitly selects the existing version-4 traversal. All 50 levels now pass rotation -> Go -> movement -> victory -> all-star scoring through the actual reducer. No legacy engine source was changed.
3. **Mutable cached definitions.** Returning cached objects allowed one consumer to change later levels or another game instance. Cache storage and returned levels are independently cloned, including tiles, collectibles and target bands. Regression tests mutate both resolved levels and game-instance definitions.
4. **Unproven all-star fallback.** Resolver now rejects exhausted search, impossible content, nonfinite par/starPar and failed all-star traversal. It never substitutes normal par for an unavailable star solution. Move limits remain solver-derived: max(starPar + 3, par + 4).
5. **Identity and seed ambiguity.** Unsupported campaign/version identities and unsafe seed inputs are rejected. Content version is now `1.0.1`; seed is explicitly a validated uint32 compatibility parameter that does not vary these 50 authored boards. No claim of 1,000 distinct generated puzzles is made.

## Content evidence

| Level | Current title | Par | Star par | Move limit |
| --- | --- | ---: | ---: | ---: |
| 3 | Lollipop Lane | 5 | 5 | 9 |
| 9 | Taffy Trail | 7 | 7 | 11 |
| 43 | Glaze Garden Crossing | 31 | 35 | 38 |
| 45 | Truffle Switchback | 27 | 27 | 31 |

50 boards, 1,225 pairs: zero duplicate complete topologies and zero near-duplicate candidates under the implemented minimum/all-star route checks (same core route or normalized edge overlap >= 0.85). Eleven Bunny-required gap levels and eleven optional star-detour levels remain. All target par bands pass. Every quarter-turn in all 50 replayed solutions consumes exactly one move, and each certified all-star solution earns three stars.

This is NOT an exhaustive enumeration of every possible solution or proof of enjoyment. More rotations are not automatically more interesting decisions. Human playtesting and visual readability remain unverified until campaign UI integration.

Cold resolver measurements on this machine, including solver proof and traversal replay: median 0.484 ms, p95 6.915 ms, worst 39.470 ms. These are one-run measurements, not a mobile performance guarantee.

## Exact verification

| Check | Result | Evidence |
| --- | --- | --- |
| Focused campaign/content/acceptance tests | 27 total, 27 passed, 0 failed, 0 skipped | phase31-focused.log |
| Full npm test | 372 total, 367 passed, 0 failed, 5 skipped | phase31-full-tests.log |
| npm run typecheck | PASS, exit 0 | phase31-typecheck.log |
| Scoped ESLint | PASS, 0 errors, 0 warnings, exit 0 | phase31-scoped-lint.log |
| npm run lint | PASS, 0 errors, 15 existing warnings, exit 0 | phase31-lint.log |
| npm run build | PASS, exit 0 | phase31-build.log |
| Browser campaign play | NOT TESTED - new content is not connected to UI | No browser-play claim |

The previous Phase 3 report's 366-total baseline increases by six new acceptance tests to 372 total; five skipped integration tests remain skipped. No assertion was removed to obtain this result. The content-version expectation was updated for the deliberate 1.0.1 content revision.

## Files and reproducibility

Runtime-content fixes: `lib/jelloo/campaign-v2/constants.ts`, `world1-provider.ts`, `world1-specs.ts`, `structural-comparator.ts`.
Tests: `tests/jelloo-world1-acceptance.test.ts` (six new tests), `tests/jelloo-world1-content.test.ts` (content-version expectation).
Evidence scripts: `scripts/jelloo-world1-acceptance-audit.ts`, `scripts/jelloo-world1-design-candidates.ts`.
Artifacts: `phase31-audit.json`, `world1-level-inventory.csv`, `world1-redesign-candidates.json`, verification logs and this report. Inventory contains all 50 rows and solver-derived routes/turn metrics, not an invented decision count.

Run from this workspace:

```powershell
node --import tsx scripts/jelloo-world1-acceptance-audit.ts
node --import ./tests/setup.mjs --import tsx --test tests/jelloo-campaign-v2.test.ts tests/jelloo-world1-content.test.ts tests/jelloo-world1-acceptance.test.ts
npm test
npm run typecheck
npm run lint
npm run build
```

## Workspace preservation and boundaries

The requested Documents/jellypals folder now contains a standalone local Git checkout based on the verified release commit, plus the latest Phase 2/3 foundation and content copied from the prior worktree. Differing preexisting documents were preserved as `.before-workspace-import` files. Original Downloads and victory-release worktrees were not reset or modified. The existing reference image was retained.

Installed dependencies are reused via a local node_modules junction to the prior worktree; no dependency versions or credentials were copied/changed. The local repository has no configured remote. Changes remain uncommitted and no push, merge, deployment, database access, artwork replacement or advertising activation occurred.

All new worlds remain `planned`; production UI continues using legacy content. Original tutorials 1-10 are unchanged; new v2 authored levels are separate. Version 1.0.0 was unreleased draft content; no live save migration was performed. Board-bearing v2 saves remain unsupported and preserved by the existing save safeguards. Multi-tab write atomicity remains a documented foundation limitation.

Next phase requires owner review and campaign UI/map integration; it was not started here.
