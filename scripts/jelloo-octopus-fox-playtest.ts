/**
 * Isolated solver-driven playtest of Octopus (levels 31+) and Fox (41+, 51+).
 * Records seed, level id, character, par, starPar, moveLimit, path lengths,
 * whether water/fork felt like a real decision, whether the Fox decoy branch
 * ends visibly at a blank cell or board edge, and solver audit metrics.
 *
 * Covers:
 * - 10 Octopus levels across 5 seeds: 31, 39, 49, 59, 69, 79, 89, 99, 109, 119
 * - Fox levels across 5 seeds: 41 (intro), 51, 61, 71, 81, 91 (51+)
 * - 5 seeds: 42, 97, 123, 777, 2026
 *
 * Run: npx tsx scripts/jelloo-octopus-fox-playtest.ts
 */

import { writeFileSync } from "fs";
import { generatePowerPuzzle } from "../lib/jelloo/power-generator";
import { auditPowerLevel, walkPowerLevel } from "../lib/jelloo/power-solver";
import { neighbour } from "../lib/jelloo/engine";

const SEEDS = [42, 97, 123, 777, 2026];

// 10 Octopus levels
const OCTOPUS_LEVELS = [31, 39, 49, 59, 69, 79, 89, 99, 109, 119];
// Fox levels: 41 (intro) and 51+ (51, 61, 71, 81, 91)
const FOX_LEVELS = [41, 51, 61, 71, 81, 91];

interface LevelRecord {
  levelId: number;
  seed: number;
  character: string;
  par: number;
  starPar: number;
  moveLimit: number | null;
  shortestPathLen: number;
  starPathLen: number;
  marginAbovePar: number | null;
  waterDecision: boolean | null;       // octopus only
  forkIsRealDecision: boolean | null;  // fox only
  decoyIsDeadEnd: boolean | null;      // fox only
  decoyEndInfo: string | null;         // fox only
  decoyOutcomeOnWrongChoice: string | null; // fox only
  necessary: boolean;
  bugs: string[];
  observations: string[];
}

function checkFoxFork(level: ReturnType<typeof generatePowerPuzzle>["level"], audit: ReturnType<typeof auditPowerLevel>) {
  if (!level.fork) {
    return { forkIsRealDecision: false, decoyIsDeadEnd: false, decoyEndInfo: "no fork definition", decoyOutcomeOnWrongChoice: "no fork" };
  }

  const { tile: forkTile, exits } = level.fork;

  // Find which exit leads along the solution trace
  const forkStep = audit.trace.path.indexOf(forkTile);
  const solutionNext = forkStep !== -1 && forkStep < audit.trace.path.length - 1 ? audit.trace.path[forkStep + 1] : null;
  const solutionExit = exits.find(d => neighbour(forkTile, d, level.size) === solutionNext);
  const decoyDirection = exits.find(d => d !== solutionExit);

  if (decoyDirection === undefined) {
    return { forkIsRealDecision: true, decoyIsDeadEnd: false, decoyEndInfo: "no decoy direction found", decoyOutcomeOnWrongChoice: "unknown" };
  }

  // Verify that if Fox chooses the decoy branch, the path fails/disconnects
  const wrongTrace = walkPowerLevel({ ...level, choices: { [forkTile]: decoyDirection } }, audit.solution ?? level.tiles);
  const decoyOutcomeOnWrongChoice = wrongTrace.outcome;

  const decoyCell = neighbour(forkTile, decoyDirection, level.size);
  if (decoyCell === null) {
    return { forkIsRealDecision: true, decoyIsDeadEnd: true, decoyEndInfo: "leads off board edge immediately", decoyOutcomeOnWrongChoice };
  }

  const beyond = neighbour(decoyCell, decoyDirection, level.size);
  if (beyond === null) {
    return { forkIsRealDecision: true, decoyIsDeadEnd: true, decoyEndInfo: `decoy cell ${decoyCell} leads off board edge`, decoyOutcomeOnWrongChoice };
  }

  const beyondTile = level.tiles[beyond];
  if (beyondTile.kind === "blank" && !beyondTile.terrain) {
    return { forkIsRealDecision: true, decoyIsDeadEnd: true, decoyEndInfo: `decoy cell ${decoyCell} leads to blank cell ${beyond}`, decoyOutcomeOnWrongChoice };
  }

  return {
    forkIsRealDecision: true,
    decoyIsDeadEnd: false,
    decoyEndInfo: `decoy cell ${decoyCell} leads to ${beyondTile.kind} tile at cell ${beyond}`,
    decoyOutcomeOnWrongChoice,
  };
}

function playtestLevel(levelId: number, seed: number): LevelRecord {
  const bugs: string[] = [];
  const observations: string[] = [];

  let generated: ReturnType<typeof generatePowerPuzzle>;
  try {
    generated = generatePowerPuzzle(levelId, seed);
  } catch (e) {
    return {
      levelId, seed, character: "unknown", par: -1, starPar: -1, moveLimit: null,
      shortestPathLen: -1, starPathLen: -1, marginAbovePar: null,
      waterDecision: null, forkIsRealDecision: null, decoyIsDeadEnd: null, decoyEndInfo: null,
      decoyOutcomeOnWrongChoice: null, necessary: false, bugs: [`GENERATION FAILED: ${e}`], observations: [],
    };
  }

  const { level, proof: audit } = generated;
  const character = level.character ?? "unknown";
  const necessary = audit.necessary;

  if (!audit.solvable) bugs.push("SOLVER: level is NOT solvable with own character");
  if (audit.exhausted) bugs.push("SOLVER: search budget exhausted");
  if (!necessary) bugs.push("AUDIT: character is NOT necessary (another pal can solve it)");

  const par = audit.par;
  const starPar = audit.starPar;
  const moveLimit = level.moveLimit ?? null;
  const shortestPathLen = audit.shortestPath.length;
  const starPathLen = audit.trace.path.length;
  const marginAbovePar = moveLimit !== null ? moveLimit - par : null;

  if (starPar !== Infinity && moveLimit !== null && starPar > moveLimit) {
    bugs.push(`STAR UNREACHABLE: starPar ${starPar} > moveLimit ${moveLimit}`);
  }

  let waterDecision: boolean | null = null;
  let forkIsRealDecision: boolean | null = null;
  let decoyIsDeadEnd: boolean | null = null;
  let decoyEndInfo: string | null = null;
  let decoyOutcomeOnWrongChoice: string | null = null;

  if (character === "octopus") {
    // Water tile must sit on the mandatory route (audit confirms no-water solves fail)
    const waterIdx = level.tiles.findIndex(t => t.terrain === "water");
    waterDecision = waterIdx !== -1 && necessary;
    const waterCells = level.tiles.filter(t => t.terrain === "water").length;
    observations.push(`Water tile count: ${waterCells}`);
    if (waterIdx !== -1) {
      const onStar = audit.trace.path.includes(waterIdx);
      const onShort = audit.shortestPath.includes(waterIdx);
      observations.push(`Water cell ${waterIdx}: on star-path=${onStar}, on shortest-path=${onShort}`);
    }
  }

  if (character === "fox") {
    const forkCheck = checkFoxFork(level, audit);
    forkIsRealDecision = forkCheck.forkIsRealDecision;
    decoyIsDeadEnd = forkCheck.decoyIsDeadEnd;
    decoyEndInfo = forkCheck.decoyEndInfo;
    decoyOutcomeOnWrongChoice = forkCheck.decoyOutcomeOnWrongChoice;

    observations.push(`Decoy branch: ${decoyEndInfo}`);
    observations.push(`Wrong fork choice outcome: ${decoyOutcomeOnWrongChoice}`);

    if (!decoyIsDeadEnd) {
      bugs.push(`VISUAL DEFECT: Fox decoy branch does not visibly end on a blank cell or board edge (${decoyEndInfo})`);
    }

    if (decoyOutcomeOnWrongChoice === "home") {
      bugs.push("MECHANICAL DEFECT: Decoy branch incorrectly reached home");
    }

    if (starPathLen !== shortestPathLen) {
      observations.push(`Fork routing decision: star route (${starPathLen} tiles) vs shortest (${shortestPathLen} tiles)`);
    }
  }

  if (marginAbovePar !== null && marginAbovePar < 2) observations.push(`Tight margin: only ${marginAbovePar} moves above par`);

  return {
    levelId, seed, character, par, starPar, moveLimit,
    shortestPathLen, starPathLen, marginAbovePar,
    waterDecision, forkIsRealDecision, decoyIsDeadEnd, decoyEndInfo,
    decoyOutcomeOnWrongChoice, necessary, bugs, observations,
  };
}

// --- Run extended playtest ---
console.log("=== Jelloo Extended Octopus & Fox Solver Playtest ===");
console.log(`Seeds: ${SEEDS.join(", ")}`);
console.log(`Octopus levels (${OCTOPUS_LEVELS.length}): ${OCTOPUS_LEVELS.join(", ")}`);
console.log(`Fox levels (${FOX_LEVELS.length}): ${FOX_LEVELS.join(", ")}\n`);

const records: LevelRecord[] = [];

console.log("--- Auditing Octopus Levels ---");
for (const id of OCTOPUS_LEVELS) {
  for (const seed of SEEDS) {
    const r = playtestLevel(id, seed);
    records.push(r);
    const status = r.bugs.length ? "FAIL" : "PASS";
    console.log(`[${status}] Octopus L${id} seed=${seed} par=${r.par} starPar=${r.starPar} limit=${r.moveLimit} necessary=${r.necessary}`);
    r.bugs.forEach(b => console.log(`  BUG: ${b}`));
  }
}

console.log("\n--- Auditing Fox Levels (including 51+) ---");
for (const id of FOX_LEVELS) {
  for (const seed of SEEDS) {
    const r = playtestLevel(id, seed);
    records.push(r);
    const status = r.bugs.length ? "FAIL" : "PASS";
    console.log(`[${status}] Fox L${id} seed=${seed} par=${r.par} starPar=${r.starPar} limit=${r.moveLimit} decoy=${r.decoyEndInfo}`);
    r.bugs.forEach(b => console.log(`  BUG: ${b}`));
  }
}

console.log("\n=== Playtest Summary ===");
const totalRuns = records.length;
const buggedRuns = records.filter(r => r.bugs.length > 0);
console.log(`Total audits: ${totalRuns}`);
console.log(`Passed audits: ${totalRuns - buggedRuns.length}`);
console.log(`Failed audits: ${buggedRuns.length}`);

// Save raw JSON
const out = JSON.stringify({
  date: new Date().toISOString(),
  generatorRevision: "6a3f56a",
  seeds: SEEDS,
  octopusLevelCount: OCTOPUS_LEVELS.length,
  foxLevelCount: FOX_LEVELS.length,
  totalAudits: totalRuns,
  passedAudits: totalRuns - buggedRuns.length,
  records,
}, null, 2);

writeFileSync("docs/jelloo/octopus-fox-playtest-raw.json", out);
console.log("Raw JSON saved to docs/jelloo/octopus-fox-playtest-raw.json");
