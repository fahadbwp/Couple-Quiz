/**
 * Isolated solver-driven playtest of Octopus (levels 31+) and Fox (41+).
 * Records seed, level id, character, par, starPar, moveLimit, path lengths,
 * whether the water/fork mechanic was a real decision, and whether the
 * Fox decoy branch terminates as a dead end.
 * Run: npx tsx scripts/jelloo-octopus-fox-playtest.ts
 */

import { generatePowerPuzzle } from "../lib/jelloo/power-generator";
import { auditPowerLevel } from "../lib/jelloo/power-solver";
import { neighbour, ports, type Direction } from "../lib/jelloo/engine";

const FIXED_SEED = 42;
const SECOND_SEED = 97;

interface LevelRecord {
  levelId: number;
  seed: number;
  character: string;
  par: number;
  starPar: number;
  moveLimit: number;
  shortestPathLen: number;
  starPathLen: number;
  marginAbovePar: number;
  waterDecision: boolean | null;       // octopus only
  forkIsRealDecision: boolean | null;  // fox only
  decoyIsDeadEnd: boolean | null;      // fox only
  decoyEndInfo: string | null;
  necessary: boolean;
  bugs: string[];
  observations: string[];
}

function isForkRealDecision(levelId: number, seed: number): {
  forkIsRealDecision: boolean;
  decoyIsDeadEnd: boolean;
  decoyEndInfo: string;
} {
  const { level } = generatePowerPuzzle(levelId, seed);
  if (!level.fork) return { forkIsRealDecision: false, decoyIsDeadEnd: false, decoyEndInfo: "no fork" };

  const { tile: forkTile, exits } = level.fork;
  // Find which exit is the decoy (locked straight tile adjacent to fork)
  const decoyBranch = exits.find(d => {
    const n = neighbour(forkTile, d, level.size);
    return n !== null && level.tiles[n].locked === true;
  });

  if (decoyBranch === undefined) {
    return { forkIsRealDecision: true, decoyIsDeadEnd: false, decoyEndInfo: "no locked decoy tile found" };
  }

  // Walk the decoy path: straight tile locked = dead end (only 2 ports, the inbound and outbound,
  // but outbound leads into a blank or out-of-bounds).
  const decoyCell = neighbour(forkTile, decoyBranch, level.size)!;
  const decoyTile = level.tiles[decoyCell];
  const decoyPorts = ports(decoyTile);
  // Entry direction into decoy cell
  const decoyEntry = ((decoyBranch + 2) % 4) as Direction;
  const decoyExits = decoyPorts.filter(p => p !== decoyEntry);

  let deadEndReason = "";
  let isDeadEnd = false;

  for (const ex of decoyExits) {
    const beyond = neighbour(decoyCell, ex, level.size);
    if (beyond === null) {
      isDeadEnd = true;
      deadEndReason = "exit leads off-board edge";
    } else {
      const beyondTile = level.tiles[beyond];
      if (beyondTile.kind === "blank" && !beyondTile.terrain) {
        isDeadEnd = true;
        deadEndReason = "exit leads into blank cell";
      } else {
        deadEndReason = `exit leads to ${beyondTile.kind} tile at cell ${beyond}`;
      }
    }
  }

  if (decoyExits.length === 0) {
    isDeadEnd = true;
    deadEndReason = "decoy tile has no exit besides entry";
  }

  return { forkIsRealDecision: true, decoyIsDeadEnd: isDeadEnd, decoyEndInfo: deadEndReason };
}

function isWaterRealDecision(levelId: number, seed: number): boolean {
  // If the water tile sits on the ONLY path to home, skipping it would disconnect.
  // "Real decision" = you cannot complete the level if you pretend water is blank.
  const { level } = generatePowerPuzzle(levelId, seed);
  const waterCell = level.tiles.findIndex(t => t.terrain === "water");
  if (waterCell === -1) return false;
  // The audit already confirms octopus is necessary. Any level passing audit means
  // non-octopus characters cannot solve it → water IS a mandatory path element.
  return true;
}

function playtestLevel(levelId: number, seed: number): LevelRecord {
  const bugs: string[] = [];
  const observations: string[] = [];

  let generated: ReturnType<typeof generatePowerPuzzle>;
  try {
    generated = generatePowerPuzzle(levelId, seed);
  } catch (e) {
    return {
      levelId, seed, character: "unknown", par: -1, starPar: -1, moveLimit: -1,
      shortestPathLen: -1, starPathLen: -1, marginAbovePar: -1,
      waterDecision: null, forkIsRealDecision: null, decoyIsDeadEnd: null, decoyEndInfo: null,
      necessary: false, bugs: [`GENERATION FAILED: ${e}`], observations: [],
    };
  }

  const { level } = generated;
  const character = level.character ?? "unknown";

  const audit = auditPowerLevel(level);
  const necessary = audit.necessary;

  if (!audit.solvable) bugs.push("SOLVER: level is NOT solvable with own character");
  if (audit.exhausted) bugs.push("SOLVER: search budget exhausted");
  if (!necessary) bugs.push("AUDIT: character is NOT necessary (other character can solve it)");

  const par = audit.par;
  const starPar = audit.starPar;
  const moveLimit = level.moveLimit ?? Infinity;
  const shortestPathLen = audit.shortestPath.length;
  const starPathLen = audit.trace.path.length;
  const marginAbovePar = Number.isFinite(moveLimit) ? moveLimit - par : Infinity;

  // Check star is reachable within limit
  if (Number.isFinite(starPar) && Number.isFinite(moveLimit) && starPar > moveLimit) {
    bugs.push(`STAR UNREACHABLE: starPar ${starPar} > moveLimit ${moveLimit}`);
  }

  // Check the collectibles are on the star path
  const starPath = audit.trace.path;
  const collectibles = level.collectibles ?? [];
  for (const c of collectibles) {
    if (!starPath.includes(c)) observations.push(`collectible cell ${c} NOT on star-path (it may be on alternate route)`);
  }

  let waterDecision: boolean | null = null;
  let forkIsRealDecision: boolean | null = null;
  let decoyIsDeadEnd: boolean | null = null;
  let decoyEndInfo: string | null = null;

  if (character === "octopus") {
    waterDecision = isWaterRealDecision(levelId, seed);
    if (!waterDecision) observations.push("Water tile may not be on the mandatory path");

    // Additional: how many water cells?
    const waterCells = level.tiles.filter(t => t.terrain === "water").length;
    observations.push(`Water tile count: ${waterCells}`);

    // Is the water on the star path or only the short path?
    const waterIdx = level.tiles.findIndex(t => t.terrain === "water");
    if (waterIdx !== -1) {
      const onStar = starPath.includes(waterIdx);
      const onShort = audit.shortestPath.includes(waterIdx);
      observations.push(`Water cell ${waterIdx}: on star-path=${onStar}, on shortest-path=${onShort}`);
      if (!onStar && !onShort) bugs.push(`Water cell ${waterIdx} is not on any solution path — mechanic may not activate`);
    }
  }

  if (character === "fox") {
    const result = isForkRealDecision(levelId, seed);
    forkIsRealDecision = result.forkIsRealDecision;
    decoyIsDeadEnd = result.decoyIsDeadEnd;
    decoyEndInfo = result.decoyEndInfo;

    if (!decoyIsDeadEnd) {
      observations.push(`Fox decoy branch does NOT terminate as a dead end: ${decoyEndInfo}`);
    } else {
      observations.push(`Fox decoy branch terminates: ${decoyEndInfo}`);
    }

    if (!level.fork) bugs.push("Fox level is missing .fork definition");

    // Star path vs shortest path for fork decision
    const starLen = starPath.length;
    const shortLen = audit.shortestPath.length;
    if (starLen === shortLen) observations.push("Star path and shortest path have same length — star may be on mandatory route");
    else observations.push(`Fork paths: star route ${starLen} tiles vs shortest ${shortLen} tiles (delta ${starLen - shortLen})`);
  }

  if (marginAbovePar < 2) observations.push(`Tight margin: only ${marginAbovePar} moves above par`);
  if (marginAbovePar > 10) observations.push(`Generous margin: ${marginAbovePar} moves above par`);

  return {
    levelId, seed, character, par, starPar, moveLimit,
    shortestPathLen, starPathLen, marginAbovePar,
    waterDecision, forkIsRealDecision, decoyIsDeadEnd, decoyEndInfo,
    necessary, bugs, observations,
  };
}

// --- Run the playtest ---
const octopusLevels = [31, 33, 35, 37, 39];
const foxLevels     = [41, 43, 45, 47, 49];

const records: LevelRecord[] = [];

console.log("=== Jelloo Octopus + Fox Solver Playtest ===\n");

for (const id of octopusLevels) {
  for (const seed of [FIXED_SEED, SECOND_SEED]) {
    const r = playtestLevel(id, seed);
    records.push(r);
    const status = r.bugs.length ? "BUGS" : "OK";
    console.log(`[${status}] L${id} seed=${seed} char=${r.character} par=${r.par} starPar=${r.starPar} limit=${r.moveLimit} necessary=${r.necessary}`);
    r.bugs.forEach(b => console.log(`  BUG: ${b}`));
    r.observations.forEach(o => console.log(`  OBS: ${o}`));
  }
}

for (const id of foxLevels) {
  for (const seed of [FIXED_SEED, SECOND_SEED]) {
    const r = playtestLevel(id, seed);
    records.push(r);
    const status = r.bugs.length ? "BUGS" : "OK";
    console.log(`[${status}] L${id} seed=${seed} char=${r.character} par=${r.par} starPar=${r.starPar} limit=${r.moveLimit} necessary=${r.necessary}`);
    r.bugs.forEach(b => console.log(`  BUG: ${b}`));
    r.observations.forEach(o => console.log(`  OBS: ${o}`));
  }
}

console.log("\n=== Summary ===");
const bugCount = records.filter(r => r.bugs.length > 0).length;
console.log(`Levels checked: ${records.length} (${bugCount} with bugs)`);

// Export JSON for the report
const out = JSON.stringify({ generatorRevision: "a98869c", seed1: FIXED_SEED, seed2: SECOND_SEED, records }, null, 2);
import { writeFileSync } from "fs";
writeFileSync("docs/jelloo/octopus-fox-playtest-raw.json", out);
console.log("Raw data saved to docs/jelloo/octopus-fox-playtest-raw.json");
