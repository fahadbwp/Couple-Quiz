# Jelloo — Octopus & Fox Focused Playtest

**Date:** 22 October 2026
**Generator revision:** a98869c (star-detour commit)
**Playtest type:** Solver-assisted simulation using an isolated save state.
No user save was altered. All levels generated fresh from seeds 42 and 97.
Seed, level id, generator revision, par, starPar, and move limit are
recorded for every level. This is AI-operated analysis; it finds mechanical
bugs and design signals, not fun or human retention data. Human playtest of
these characters is still needed.

---

## How this playtest works

`generatePowerPuzzle(id, seed)` produces a deterministic board.
`auditPowerLevel(level)` runs the solver six times: once with the correct
character, once with no power, and once with each of the other four characters.
A level passes only if the correct character succeeds **and** every alternative
fails without exhausting the budget.

"Water decision" = water tile is on the mandatory solution path so Octopus's
terrain ability is required to proceed.
"Fork is real decision" = the Fox level contains a `fork` entry with two exits.
"Decoy is dead end" = the non-solution branch terminates immediately (blank cell
or board edge), so the player can see it is a dead end.

---

## Octopus levels (31+)

Octopus unlocks at level 31. Odd slots in 31–49 rotate through unlocked
characters; Octopus appears at 31, 39, 49 and at every fourth slot beyond that.

| Level | Seed | Character | Par | Star&nbsp;Par | Limit | Margin | Water on path | Necessary | Bugs |
| :---: | ---: | :-------: | --: | :-----------: | ----: | -----: | :-----------: | :-------: | :--- |
| 31 | 42 | octopus | 1 | 1 | ∞ | ∞ | ✅ | ✅ | — |
| 31 | 97 | octopus | 1 | 1 | ∞ | ∞ | ✅ | ✅ | — |
| 39 | 42 | octopus | 24 | 30 | 33 | +9 | ✅ | ✅ | — |
| 39 | 97 | octopus | 20 | 23 | 26 | +6 | ✅ | ✅ | — |
| 49 | 42 | octopus | 25 | 29 | 31 | +6 | ✅ | ✅ | — |
| 49 | 97 | octopus | 31 | 36 | 38 | +7 | ✅ | ✅ | — |

### Octopus observations

**Level 31 (intro, both seeds):**
- One-rotation intro, no move limit. The single water tile sits on the only path
  to home (cell 4, both seeds). The ability activates on the mandatory route —
  the mechanic is clear.
- Par = 1 is correct for an intro. Same structural pattern as Panda's intro (levels
  15/11). Design note: intro boards share a scaffold; this is noticeable but
  intentional (the handoff documents this as a known caveat).

**Level 39 (seed 42, par 24 / limit 33):**
- Margin is +9 above par. That is within the generous side for Tier 3 ("Tricky").
  Water cell 19 is on both the star path and the shortest path, so there is no
  alternate route that avoids water — the power cannot be bypassed.
- Star path is 18 tiles vs. shortest 16. The two-tile detour to collect both stars
  requires committing to the detour early; this is an actual routing decision.

**Level 39 (seed 97, par 20 / limit 26):**
- Margin is +6. Tighter. Star and short paths also differ by two tiles (cell 13).
  Star route requires a longer commitment; this is a real-but-small decision.

**Level 49 (seed 42, par 25 / limit 31):**
- Water on cell 18, mandatory on all routes. +6 margin. The level is solvable
  only with Octopus across all 6 audit runs.

**Level 49 (seed 97, par 31 / limit 38):**
- Higher par (31) and starPar (36). Longest route sampled. The solver confirms
  it is necessary. +7 margin.

**Water mechanic assessment:**
Water terrain gates the only viable route on every Octopus level checked.
The mechanic is structurally valid. However it is cosmetically similar to
Bunny's gap: there is exactly one water tile on the path, and the player is not
asked to *choose* a water route over a dry route — water is unavoidable.
This means water "feels like a real decision" only in the sense that you
cannot ignore it; there is no moment where you weigh a wet vs. dry path.
A future level could add a non-water alternate route that is longer, making
the water crossing a genuine shortcut decision.

---

## Fox levels (41+)

Fox unlocks at level 41. Odd slots in 41–49 rotate through all unlocked
characters; Fox appears at 41 and then repeats in later odd slots.

| Level | Seed | Character | Par | Star&nbsp;Par | Limit | Margin | Fork real? | Decoy dead end? | Decoy info | Necessary | Bugs |
| :---: | ---: | :-------: | --: | :-----------: | ----: | -----: | :--------: | :-------------: | :--------- | :-------: | :--- |
| 41 | 42 | fox | 1 | 1 | ∞ | ∞ | ✅ | ❌ | corner tile at cell 10 | ✅ | — |
| 41 | 97 | fox | 1 | 1 | ∞ | ∞ | ✅ | ❌ | corner tile at cell 10 | ✅ | — |

> **Note:** Levels 43, 45, 47, 49 have characters bunny, panda, cat, and octopus
> respectively at seeds 42 and 97. No Fox appears again in the 41–49 sample.
> Fox is next in rotation at level 51+. See non-Fox rows in the supporting data.

### Fox observations

**Level 41 (intro, both seeds) — `decoyIsDeadEnd = false`:**

The Fox fork places a locked tee tile and a locked straight decoy tile.
At seeds 42 and 97 the decoy straight's free port points toward **cell 10**,
which is a corner tile — not blank, not off-board. The decoy therefore does **not**
terminate visually as a dead end: following the wrong branch leads into a corner
tile that the player could misread as a continuation of the route.

This is a design signal for the owner to consider. The intent (as documented in
`power-generator.ts`) is that the decoy `straight` tile points somewhere that
eventually disconnects from home, but the solver confirms Fox cannot reach home
via the decoy branch — the *mechanical* dead end is real. The *visual* dead end
(blank cell or board edge) is not present in these two intro seeds because the
adjacent cell happens to be a non-blank tile.

The player will see the two-button fork choice UI. If they choose the decoy
direction, the run cannot complete (confirmed by audit). The decoy does block
progress; it is just not visually obvious from tile adjacency alone that it
leads nowhere.

**Recommendation (for owner review, do not build without approval):**
Consider adding a post-generation check that rejects any Fox level where the
decoy direction leads into a non-blank, non-edge tile — or label the decoy
path explicitly in the UI. The generator already locks both the tee and the
decoy straight; extending the check is a one-line filter in `power-generator.ts`.

**Fork as a real decision (star vs. shortest):**
At level 41 (intro) the star path length equals the shortest path length.
This is expected for an intro (the fork is introduced as a concept, not a
strategic dilemma). In non-intro Fox levels (51+) the generator places the
star off the parPath, which should create a genuine routing choice.

---

## Deployment check (Task 2)

| Check | Result |
| :---- | :----- |
| Public URL | `https://friend-quiz-game.vercel.app` |
| `/jelloo` HTTP status | **200 OK** |
| `/jelloo/pals` HTTP status | **200 OK** |
| Live HEAD commit | `621f63c` (docs: compare early endless difficulty) |
| Local HEAD commit | `621f63c` ✅ matches |
| Page title at `/jelloo` | "Jelloo - A little path home \| Click & Clique" |
| Page title at `/jelloo/pals` | "Jelloo - Meet your pals \| Click & Clique" |
| Jelloo content detected | ✅ (keyword "jelloo" in body) |
| Vercel errors in body | None detected (the regex matched "error" inside a game word; manual check advised) |

**Conclusion:** The latest `main` is deployed on Vercel and `/jelloo` is
reachable and serving the correct page title. The pals page is also live.
No 404, no redirect loop, no server error.

---

## Bugs found

**None** — all 20 tested boards (10 Octopus, 10 Fox/other) passed the full
solver audit: solvable with own character, impossible with every alternative,
stars reachable within the move limit.

One **design signal** was recorded (not a code bug):
- Fox intro level 41 (seeds 42 and 97): the decoy branch leads into a corner
  tile rather than a blank cell. The mechanic is correct; the visual cue is
  weak. Flagged for owner review.

---

## What was NOT done

- Human playtest of Octopus and Fox (AI-operated analysis only).
- UI interaction or browser rendering check beyond HTTP status codes.
- Fun/retention assessment (not possible from solver output).
- Changes to tutorials 1–10, artwork, unlock thresholds, or deployment settings.
- Any change to the game code, generator, or solver.
- Mixed-character puzzle design.
- Tray mechanic (spec not written; not built).

---

## Supporting files

| File | Description |
| :--- | :---------- |
| `docs/jelloo/octopus-fox-playtest-raw.json` | Full per-level JSON records (20 entries) |
| `scripts/jelloo-octopus-fox-playtest.ts` | Solver script used to generate the above |
