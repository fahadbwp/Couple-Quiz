import {
  neighbour,
  ports,
  type Character,
  type Direction,
  type Level,
  type PowerState,
  type Tile,
} from "./engine";
import { buildTutorial, type TutorialSpec } from "./levels";
import { worldForLevel } from "./worlds";

export type JellySpec = {
  character: Character;
  start: number;
  home: number;
  color?: string;
};

export type MultiJellyTrace = {
  path: number[];
  outcome: "home" | "disconnected" | "edge" | "loop";
  multiOutcome: "home" | "collision" | "swap" | "disconnected" | "edge" | "loop" | "blocked";
  steps: number;
  jellies: {
    character: Character;
    start: number;
    home: number;
    path: number[];
    reachedHome: boolean;
  }[];
  collisionCell?: number;
  collisionType?: "same_cell" | "swap";
  states: PowerState[];
};

export type MultiJellySolveResult = {
  status: "solved" | "impossible" | "unknown";
  exhausted: boolean;
  solvable: boolean;
  par: number;
  solution: Tile[] | null;
  trace: MultiJellyTrace;
};

/**
 * Deterministic simultaneous simulation of multiple Jellies on the board.
 * Each logical tick advances all moving Jellies by one step simultaneously.
 * Detects same-cell collisions, head-on swaps, shared paths, switch/door gates,
 * Panda cracked-tile crumbling, and Bunny gap jumping.
 */
export function simulateMultiJelly(level: Level, tiles: readonly Tile[]): MultiJellyTrace {
  const jellies: JellySpec[] =
    level.jellies && level.jellies.length > 0
      ? level.jellies
      : [{ character: level.character ?? "bunny", start: level.start, home: level.home }];

  const numJellies = jellies.length;
  const positions = jellies.map(j => j.start);
  const paths: number[][] = jellies.map(j => [j.start]);
  const reachedHome: boolean[] = Array(numJellies).fill(false);
  const jumpUsed: boolean[] = Array(numJellies).fill(false);
  const incoming: (Direction | undefined)[] = Array(numJellies).fill(undefined);
  const activeSwitches = new Set<number>();
  const brokenTiles = new Set<number>();

  // Check if any jelly starts on a switch
  positions.forEach(pos => {
    if (tiles[pos]?.terrain === "switch") activeSwitches.add(pos);
  });

  const states: PowerState[] = [
    {
      jumpUsed: false,
      broken: [],
      branches: {},
      switches: [...activeSwitches],
    },
  ];

  let stepCount = 0;
  const MAX_STEPS = 64;
  let multiOutcome: MultiJellyTrace["multiOutcome"] = "disconnected";
  let collisionCell: number | undefined;
  let collisionType: "same_cell" | "swap" | undefined;

  while (stepCount < MAX_STEPS) {
    // 1. Check if all jellies reached their designated home
    if (reachedHome.every(Boolean)) {
      multiOutcome = "home";
      break;
    }

    // 2. Compute candidate moves for all moving jellies
    const nextPos: number[] = [...positions];
    const nextIncoming: (Direction | undefined)[] = [...incoming];
    const nextJump: boolean[] = [...jumpUsed];
    let anyFailed = false;
    let failureOutcome: MultiJellyTrace["multiOutcome"] = "disconnected";

    for (let i = 0; i < numJellies; i++) {
      if (reachedHome[i]) continue;

      const cur = positions[i];
      const curTile = tiles[cur];
      if (!curTile || curTile.kind === "blank" || brokenTiles.has(cur)) {
        anyFailed = true;
        failureOutcome = "blocked";
        break;
      }

      // Determine valid exit direction
      const tilePorts = ports(curTile);
      let exits = tilePorts.filter(d => d !== incoming[i]);
      if (curTile.terrain === "slippery" && incoming[i] !== undefined) {
        const straight = ((incoming[i]! + 2) % 4) as Direction;
        exits = exits.filter(d => d === straight);
      }
      if (curTile.kind === "start" && incoming[i] === undefined && curTile.port !== undefined) {
        exits = [curTile.port];
      }

      // If multiple candidate exits exist (e.g. junction / tee), resolve to the unique exit leading to this jelly's home
      if (exits.length > 1) {
        const targetHome = jellies[i].home;
        const candidatePaths = exits.filter(dir => {
          // Look ahead with the same local terrain and power rules as movement.
          // Other Jellies' future switches/collisions are not predicted here.
          const reaches = (at:number, exit:Direction, seen:Set<number>, jumped:boolean, broken:Set<number>, switches:Set<number>):boolean => {
            let next=neighbour(at,exit,level);
            if(next===null) return false;
            if(tiles[next]?.terrain==="gap"){
              if(jellies[i].character!=="bunny" || jumped) return false;
              next=neighbour(next,exit,level);jumped=true;
            }
            if(next===null || seen.has(next) || broken.has(next)) return false;
            const tile=tiles[next],entry=((exit+2)%4) as Direction,char=jellies[i].character;
            if(!tile || tile.kind==="blank" || !ports(tile).includes(entry)) return false;
            if(tile.terrain==="water" && char!=="octopus" || tile.terrain==="wall" && char!=="cat" || tile.terrain==="cracked" && char!=="panda") return false;
            if(level.door?.tile===next && !switches.has(level.door.switch)) return false;
            if(level.gate?.tile===next && !(tiles[level.gate.trigger]?.terrain==="switch" ? switches.has(level.gate.trigger) : broken.has(level.gate.trigger))) return false;
            if(tile.kind==="home") return next===targetHome;
            const visited=new Set(seen).add(next),nextBroken=new Set(broken),nextSwitches=new Set(switches);
            if(tile.terrain==="switch") nextSwitches.add(next);
            if(tile.terrain==="cracked" && char==="panda") nextBroken.add(next);
            const nextExits=ports(tile).filter(d=>d!==entry && (tile.terrain!=="slippery" || d===(entry+2)%4));
            return nextExits.some(d=>reaches(next,d,visited,jumped,nextBroken,nextSwitches));
          };
          const departed=new Set(brokenTiles);
          if(curTile.terrain==="cracked" && jellies[i].character==="panda") departed.add(cur);
          return reaches(cur,dir,new Set(paths[i]),jumpUsed[i],departed,new Set(activeSwitches));
        });

        if (candidatePaths.length === 1) {
          exits = candidatePaths;
        }
      }

      if (exits.length !== 1) {
        anyFailed = true;
        failureOutcome = "disconnected";
        break;
      }

      const exitDir = exits[0];
      let nxt = neighbour(cur, exitDir, level);
      if (nxt === null) {
        anyFailed = true;
        failureOutcome = "edge";
        break;
      }

      // Bunny gap jump power
      let didJump = jumpUsed[i];
      if (tiles[nxt]?.terrain === "gap") {
        if (jellies[i].character !== "bunny" || didJump) {
          anyFailed = true;
          failureOutcome = "blocked";
          break;
        }
        nxt = neighbour(nxt, exitDir, level);
        if (nxt === null) {
          anyFailed = true;
          failureOutcome = "edge";
          break;
        }
        didJump = true;
      }

      const targetTile = tiles[nxt];
      if (!targetTile || targetTile.kind === "blank") {
        anyFailed = true;
        failureOutcome = "disconnected";
        break;
      }

      // Entry port compatibility
      const entryDir = ((exitDir + 2) % 4) as Direction;
      if (!ports(targetTile).includes(entryDir)) {
        anyFailed = true;
        failureOutcome = "disconnected";
        break;
      }

      // Terrain character restrictions
      const char = jellies[i].character;
      if (targetTile.terrain === "water" && char !== "octopus") {
        anyFailed = true; failureOutcome = "blocked"; break;
      }
      if (targetTile.terrain === "wall" && char !== "cat") {
        anyFailed = true; failureOutcome = "blocked"; break;
      }
      if (targetTile.terrain === "cracked" && char !== "panda") {
        anyFailed = true; failureOutcome = "blocked"; break;
      }
      if (brokenTiles.has(nxt)) {
        anyFailed = true; failureOutcome = "blocked"; break;
      }

      // Door and switch dependency check
      if (level.door && level.door.tile === nxt) {
        if (!activeSwitches.has(level.door.switch)) {
          anyFailed = true; failureOutcome = "blocked"; break;
        }
      }
      if (level.gate && level.gate.tile === nxt) {
        const isSwitch = tiles[level.gate.trigger]?.terrain === "switch";
        const open = isSwitch
          ? activeSwitches.has(level.gate.trigger)
          : brokenTiles.has(level.gate.trigger);
        if (!open) {
          anyFailed = true; failureOutcome = "blocked"; break;
        }
      }

      // Home tile check — must match THIS jelly's designated home
      if (targetTile.kind === "home") {
        if (nxt !== jellies[i].home || targetTile.port !== entryDir) {
          anyFailed = true; failureOutcome = "blocked"; break;
        }
      }

      nextPos[i] = nxt;
      nextIncoming[i] = entryDir;
      nextJump[i] = didJump;
    }

    if (anyFailed) {
      multiOutcome = failureOutcome;
      break;
    }

    // 3. Collision Detection
    // Check for Head-on Swap (Jelly A: u -> v and Jelly B: v -> u simultaneously)
    let hasSwap = false;
    for (let a = 0; a < numJellies; a++) {
      for (let b = a + 1; b < numJellies; b++) {
        if (!reachedHome[a] && !reachedHome[b]) {
          if (
            nextPos[a] === positions[b] &&
            nextPos[b] === positions[a] &&
            positions[a] !== positions[b]
          ) {
            hasSwap = true;
            collisionCell = positions[a];
            collisionType = "swap";
            break;
          }
        }
      }
      if (hasSwap) break;
    }

    if (hasSwap) {
      multiOutcome = "swap";
      stepCount++;
      for (let i = 0; i < numJellies; i++) {
        paths[i].push(nextPos[i]);
      }
      break;
    }

    // Check for Same-Cell Collision (Two jellies enter/occupy the exact same cell at step t + 1)
    let hasSameCell = false;
    for (let a = 0; a < numJellies; a++) {
      for (let b = a + 1; b < numJellies; b++) {
        if (nextPos[a] === nextPos[b]) {
          hasSameCell = true;
          collisionCell = nextPos[a];
          collisionType = "same_cell";
          break;
        }
      }
      if (hasSameCell) break;
    }

    if (hasSameCell) {
      multiOutcome = "collision";
      stepCount++;
      for (let i = 0; i < numJellies; i++) {
        paths[i].push(nextPos[i]);
      }
      break;
    }

    // 4. Advance step
    stepCount++;
    for (let i = 0; i < numJellies; i++) {
      if (!reachedHome[i]) {
        // Panda crumbling cracked tile upon departure
        if (jellies[i].character === "panda" && tiles[positions[i]]?.terrain === "cracked") {
          brokenTiles.add(positions[i]);
        }
        // Switch activation
        if (tiles[nextPos[i]]?.terrain === "switch") {
          activeSwitches.add(nextPos[i]);
        }
        if (nextPos[i] === jellies[i].home) {
          reachedHome[i] = true;
        }
        positions[i] = nextPos[i];
        incoming[i] = nextIncoming[i];
        jumpUsed[i] = nextJump[i];
      }
      paths[i].push(positions[i]);
    }

    // 5. Loop detection
    let hasLoop = false;
    for (let i = 0; i < numJellies; i++) {
      if (!reachedHome[i]) {
        if (new Set(paths[i]).size !== paths[i].length) {
          hasLoop = true;
          break;
        }
      }
    }
    if (hasLoop) {
      multiOutcome = "loop";
      break;
    }

    states.push({
      jumpUsed: jumpUsed.some(Boolean),
      broken: [...brokenTiles],
      branches: {},
      switches: [...activeSwitches],
    });
  }

  // Find longest path for the primary Trace.path
  const maxPathLen = Math.max(...paths.map(p => p.length));
  const primaryPath = paths[0];
  while (primaryPath.length < maxPathLen) {
    primaryPath.push(primaryPath[primaryPath.length - 1]);
  }

  const standardOutcome =
    multiOutcome === "home"
      ? "home"
      : multiOutcome === "loop"
      ? "loop"
      : multiOutcome === "edge"
      ? "edge"
      : "disconnected";

  return {
    path: primaryPath,
    outcome: standardOutcome,
    multiOutcome,
    steps: stepCount,
    jellies: jellies.map((j, i) => ({
      ...j,
      path: paths[i],
      reachedHome: reachedHome[i],
    })),
    collisionCell,
    collisionType,
    states,
  };
}

/**
 * Deterministic solver for Multi-Jelly levels.
 * Uses BFS over rotation moves to find minimal moves 'par' to victory.
 */
export function solveMultiJelly(level: Level, budget = 25000, requireAllStars = false): MultiJellySolveResult {
  const rotatable = level.tiles
    .map((t, idx) => idx)
    .filter(i => ["straight", "corner", "tee"].includes(level.tiles[i].kind) && !level.tiles[i].locked);

  const accepts = (trace: MultiJellyTrace) => trace.multiOutcome === "home" && (!requireAllStars || (level.collectibles ?? []).every(i => trace.jellies.some(j => j.path.includes(i))));
  const initialSim = simulateMultiJelly(level, level.tiles);
  if (accepts(initialSim)) {
    return {
      status: "solved", exhausted: false,
      solvable: true,
      par: 0,
      solution: level.tiles.map(t => ({ ...t })),
      trace: initialSim,
    };
  }

  if (rotatable.length === 0) {
    return {
      status: "impossible", exhausted: false,
      solvable: false,
      par: Infinity,
      solution: null,
      trace: initialSim,
    };
  }

  // BFS by rotation move count
  type State = {
    rotations: number[]; // relative rotations for each rotatable tile [0..3]
    moves: number;
  };

  const queue: State[] = [{ rotations: Array(rotatable.length).fill(0), moves: 0 }];
  const visited = new Set<string>();
  visited.add(Array(rotatable.length).fill(0).join(","));

  let explored = 0;
  let bestSim = initialSim;

  let head = 0;
  while (head < queue.length) {
    const { rotations, moves } = queue[head++];
    explored++;
    if (explored > budget) break;

    // Test candidate configuration
    const testTiles = level.tiles.map((t, idx) => {
      const rIdx = rotatable.indexOf(idx);
      if (rIdx === -1) return { ...t };
      return { ...t, rotation: (t.rotation + rotations[rIdx]) % 4 };
    });

    const sim = simulateMultiJelly(level, testTiles);
    if (accepts(sim)) {
      return {
        status: "solved", exhausted: false,
      solvable: true,
        par: moves,
        solution: testTiles,
        trace: sim,
      };
    }
    if (sim.steps > bestSim.steps) bestSim = sim;

    // Enqueue single-rotation neighbors
    for (let i = 0; i < rotatable.length; i++) {
      const nextR = [...rotations];
      nextR[i] = (nextR[i] + 1) % (level.tiles[rotatable[i]].kind === "straight" ? 2 : 4);
      const key = nextR.join(",");
      if (!visited.has(key)) {
        visited.add(key);
        queue.push({ rotations: nextR, moves: moves + 1 });
      }
    }
  }

  return {
    status: explored > budget ? "unknown" : "impossible", exhausted: explored > budget,
    solvable: false,
    par: Infinity,
    solution: null,
    trace: bestSim,
  };
}

/** Revision 3: routed teams instead of repeating exposed straight corridors.
 * Backbite mutations preserve a Hamiltonian grid path; partitions are disjoint.
 * Six editable tiles bound exhaustive proof to at most 4^6 configurations.
 * Legacy generators below remain available for historical save decoding.
 */
function generateVariedTeamPuzzle(id: number, seed: number, count: 2 | 3) {
  let state = (seed ^ Math.imul(id, 2246822519)) >>> 0;
  const random = () => { state = (Math.imul(state,1664525)+1013904223) >>> 0; return state / 4294967296; };
  let path = Array.from({length:25}, (_,i) => Math.floor(i/5)*5 + (Math.floor(i/5)%2 ? 4-i%5 : i%5));
  for(let n=0;n<80;n++) {
    if(random()<0.5) path.reverse();
    const neighbors = ([0,1,2,3] as Direction[]).map(d=>neighbour(path[0],d,5)).filter((i):i is number=>i!==null && i!==path[1]);
    const k = path.indexOf(neighbors[Math.floor(random()*neighbors.length)]);
    if(k>1) path = [...path.slice(0,k).reverse(),...path.slice(k)];
  }
  const cut = count===2 ? 10+Math.floor(random()*6) : 7+Math.floor(random()*3);
  const second = count===3 ? cut+7+Math.floor(random()*2) : 25;
  const routes = count===2 ? [path.slice(0,cut),path.slice(cut)] : [path.slice(0,cut),path.slice(cut,second),path.slice(second)];
  const characters: Character[] = count===3 ? ["bunny","panda","cat"] : id%2 ? ["cat","octopus"] : ["bunny","panda"];
  const tiles: Tile[] = Array.from({length:25},()=>({kind:"blank",rotation:0}));
  const dir = (a:number,b:number) => ([0,1,2,3] as Direction[]).find(d=>neighbour(a,d,5)===b)!;
  for(const route of routes) {
    tiles[route[0]]={kind:"start",rotation:0,port:dir(route[0],route[1]),locked:true};
    tiles[route.at(-1)!]={kind:"home",rotation:0,port:dir(route.at(-1)!,route.at(-2)!),locked:true};
    for(let i=1;i<route.length-1;i++) {
      const a=dir(route[i],route[i-1]), b=dir(route[i],route[i+1]);
      const kind=(a+2)%4===b ? "straight" : "corner";
      const rotation=[0,1,2,3].find(r=>[a,b].every(d=>ports({kind,rotation:r}).includes(d)))!;
      tiles[route[i]]={kind,rotation,locked:true};
    }
  }
  // Spread editable decisions across every pal, then increase corner rotation cost.
  const stage = Math.min(2,Math.floor(Math.max(0,id-(count===2?72:92))/3));
  for(const route of routes) {
    const cells=route.slice(1,-1);
    for(let i=cells.length-1;i>0;i--) {const j=Math.floor(random()*(i+1)); [cells[i],cells[j]]=[cells[j],cells[i]];}
    cells.sort((a,b)=>Number(tiles[b].kind==="corner")-Number(tiles[a].kind==="corner"));
    for(const cell of cells.slice(0,6/count)) {
      tiles[cell].locked=false;
      const cost=tiles[cell].kind==="corner" ? 1+Math.floor(random()*(stage+1)) : 1;
      tiles[cell].rotation=(tiles[cell].rotation+4-cost)%4;
    }
  }
  const level: Level = {
    id,size:5,title:count===2?`Twisting Duo #${id}`:`Orbiting Trio #${id}`,
    hint:"Connect each pal to its matching home. The fixed paths are clues; plan your turns before moving.",
    start:routes[0][0],home:routes[0].at(-1)!,tiles,world:worldForLevel(id).id,
    jellies:routes.map((r,i)=>({character:characters[i],start:r[0],home:r.at(-1)!})),
    collectibles:routes.map(r=>r[Math.floor(r.length/2)]),
  };
  // Existing linked-door rule: the first pal must reach the plate before the second door.
  if(id%3===0) {
    tiles[routes[0][1]].terrain="switch";
    level.door={switch:routes[0][1],tile:routes[1][3]};
  }
  if(characters[1]==="octopus") tiles[routes[1][2]].terrain="water";
  else tiles[routes[1][2]].terrain="cracked";
  const proof=solveMultiJelly(level,5000);
  if(proof.status!=="solved" || !Number.isFinite(proof.par)) throw new Error("Multi-Jelly revision 3 proof failed");
  const starProof=solveMultiJelly(level,5000,true);
  if(starProof.status!=="solved") throw new Error("Multi-Jelly collectible proof failed");
  level.par=proof.par;
  level.moveLimit=starProof.par+3;
  level.difficulty=count===2?"Two Jellies":"Three Jellies";
  return {level,proof};
}

/** Procedural Two-Jelly Puzzle Generator. */
export function generateTwoJellyPuzzle(id: number, seed: number, revision = 3) {
  if (revision >= 3 && id !== 71) return generateVariedTeamPuzzle(id, seed, 2);
  let value = (seed ^ Math.imul(id, 2654435761)) >>> 0;
  const random = () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };

  const isIntro = id === 71;
  const size = isIntro ? 4 : 5;

  // Helper to build contiguous valid tiles for two routes
  const buildRouteTiles = (r1: number[], r2: number[], s: number) => {
    const tiles: Tile[] = Array.from({ length: s * s }, () => ({ kind: "blank", rotation: 0 }));

    const placeRoute = (r: number[]) => {
      const sDir = ([0, 1, 2, 3] as Direction[]).find(d => neighbour(r[0], d, s) === r[1])!;
      tiles[r[0]] = { kind: "start", rotation: 0, port: sDir, locked: true };

      for (let step = 1; step < r.length - 1; step++) {
        const cur = r[step];
        const prev = r[step - 1];
        const nxt = r[step + 1];
        const d1 = ([0, 1, 2, 3] as Direction[]).find(d => neighbour(cur, d, s) === prev)!;
        const d2 = ([0, 1, 2, 3] as Direction[]).find(d => neighbour(cur, d, s) === nxt)!;
        const kind = (d1 + 2) % 4 === d2 ? "straight" : "corner";
        const rotation = [0, 1, 2, 3].find(rot => [d1, d2].every(d => ports({ kind, rotation: rot }).includes(d)))!;
        tiles[cur] = { kind, rotation, locked: false };
      }

      const hDir = ([0, 1, 2, 3] as Direction[]).find(d => neighbour(r[r.length - 1], d, s) === r[r.length - 2])!;
      tiles[r[r.length - 1]] = { kind: "home", rotation: 0, port: hDir, locked: true };
    };

    placeRoute(r1);
    placeRoute(r2);
    return tiles;
  };

  // Level 71 Intro Template: Two clear parallel paths, 1 or 2 rotations needed
  if (isIntro) {
    const route1 = [0, 4, 8, 12, 13, 14, 15]; // Bunny: left column and bottom row
    const route2 = [3, 7, 11, 10, 6, 2];      // Panda: right column and top inner loop
    const tiles = buildRouteTiles(route1, route2, size);

    const level: Level = {
      id,
      title: "Candy Duo Intro",
      hint: "Bunny and Panda move simultaneously! Connect both paths home.",
      size,
      start: route1[0],
      home: route1[route1.length - 1],
      jellies: [
        { character: "bunny", start: route1[0], home: route1[route1.length - 1] },
        { character: "panda", start: route2[0], home: route2[route2.length - 1] },
      ],
      world: "candy",
      collectibles: [route1[2], route2[2]],
      tiles,
    };

    // Scramble tiles (revision 1 scrambled 2 tiles; revision 2 scrambles 4 tiles for par 3-5)
    if (revision <= 1) {
      tiles[route1[1]].rotation = (tiles[route1[1]].rotation + 3) % 4;
      tiles[route2[1]].rotation = (tiles[route2[1]].rotation + 3) % 4;
    } else {
      tiles[route1[1]].rotation = (tiles[route1[1]].rotation + 3) % 4;
      tiles[route1[2]].rotation = (tiles[route1[2]].rotation + 3) % 4;
      tiles[route2[1]].rotation = (tiles[route2[1]].rotation + 3) % 4;
      tiles[route2[3]].rotation = (tiles[route2[3]].rotation + 3) % 4;
    }

    const proof = solveMultiJelly(level, 5000);
    level.par = proof.solvable ? proof.par : (revision <= 1 ? 2 : 4);
    level.moveLimit = (proof.solvable ? proof.par : (revision <= 1 ? 2 : 4)) + 3;
    level.difficulty = "Intro Duo";
    return { level, proof };
  }

  // 5x5 Procedural Two-Jelly Puzzle Templates
  const templates = [
    // Template A: Bunny and Panda (cracked bridge + parallel detour)
    {
      chars: ["bunny" as const, "panda" as const],
      r1: [0, 1, 6, 11, 16, 21, 22, 23, 24],
      r2: [4, 3, 8, 13, 18, 17, 12, 7, 2],
      cracked: 18,
      gap: 11,
      sw: null,
      door: null,
    },
    // Template B: Cat and Octopus (wall + water paths)
    {
      chars: ["cat" as const, "octopus" as const],
      r1: [0, 5, 10, 15, 20, 21, 22],
      r2: [4, 9, 14, 19, 24, 23, 18, 17, 16],
      wall: 10,
      water: 19,
      sw: null,
      door: null,
    },
    // Template C: Switch & Door Coordination (Jelly 1 hits switch, opens door for Jelly 2)
    {
      chars: ["bunny" as const, "panda" as const],
      r1: [0, 1, 2, 7, 12, 17, 22],
      r2: [4, 9, 14, 19, 24, 23],
      sw: 2,
      door: 19,
    },
    // Template D: Parallel dual track
    {
      chars: ["cat" as const, "panda" as const],
      r1: [0, 1, 2, 7, 12, 17, 22],
      r2: [4, 9, 14, 19, 24, 23],
      sw: null,
      door: null,
    },
  ];

  const tmplIdx = Math.floor(random() * templates.length);
  const tmpl = templates[tmplIdx];
  const tiles = buildRouteTiles(tmpl.r1, tmpl.r2, 5);

  // Apply terrain mechanics
  if (tmpl.cracked !== undefined && tmpl.cracked !== null) tiles[tmpl.cracked].terrain = "cracked";
  if (tmpl.gap !== undefined && tmpl.gap !== null) tiles[tmpl.gap].terrain = "gap";
  if ("wall" in tmpl && tmpl.wall !== undefined) tiles[tmpl.wall as number].terrain = "wall";
  if ("water" in tmpl && tmpl.water !== undefined) tiles[tmpl.water as number].terrain = "water";
  if (tmpl.sw !== null && tmpl.sw !== undefined && tmpl.door !== null && tmpl.door !== undefined) {
    tiles[tmpl.sw].terrain = "switch";
  }

  const level: Level = {
    id,
    title: `Two Pals Challenge #${id}`,
    hint: "Coordinate both pals! Watch for timing, powers and locked doors.",
    size: 5,
    start: tmpl.r1[0],
    home: tmpl.r1[tmpl.r1.length - 1],
    jellies: [
      { character: tmpl.chars[0], start: tmpl.r1[0], home: tmpl.r1[tmpl.r1.length - 1] },
      { character: tmpl.chars[1], start: tmpl.r2[0], home: tmpl.r2[tmpl.r2.length - 1] },
    ],
    collectibles: [tmpl.r1[Math.floor(tmpl.r1.length / 2)], tmpl.r2[Math.floor(tmpl.r2.length / 2)]],
    world: worldForLevel(id).id,
    tiles,
  };
  if (tmpl.door !== null && tmpl.door !== undefined && tmpl.sw !== null && tmpl.sw !== undefined) {
    level.door = { tile: tmpl.door, switch: tmpl.sw };
  }

  // Scramble 1 to 2 rotatable tiles (by +3, so 1 clockwise rotation solves each)
  const rotatables = level.tiles
    .map((t, idx) => idx)
    .filter(i => ["straight", "corner"].includes(level.tiles[i].kind) && !level.tiles[i].locked);

  const numToScramble = random() < 0.5 ? 1 : 2;
  const chosen: number[] = [];
  while (chosen.length < numToScramble && chosen.length < rotatables.length) {
    const tileIdx = rotatables[Math.floor(random() * rotatables.length)];
    if (!chosen.includes(tileIdx)) chosen.push(tileIdx);
  }
  for (const idx of chosen) {
    level.tiles[idx].rotation = (level.tiles[idx].rotation + 3) % 4;
  }

  const proof = solveMultiJelly(level, 5000);
  level.par = proof.solvable ? proof.par : numToScramble;
  level.moveLimit = (proof.solvable ? proof.par : numToScramble) + 3;
  level.difficulty = "Two Jellies";

  return { level, proof };
}

/**
 * Procedural Three-Jelly Puzzle Generator for Levels 91–100 and endless continuation.
 */
export function generateThreeJellyPuzzle(id: number, seed: number, revision = 3) {
  if (revision >= 3 && id !== 91) return generateVariedTeamPuzzle(id, seed, 3);
  let value = (seed ^ Math.imul(id, 3266489917)) >>> 0;
  const random = () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };

  const isIntro = id === 91;
  const size = 5;

  // 3-Jelly Routes: 3 parallel non-colliding corridors across 5x5 board
  // Route 1 (Top-left -> Mid-bottom): [0, 1, 6, 11, 16, 21]
  // Route 2 (Top-mid -> Bottom-left): [2, 7, 12, 17, 22, 20]
  // Route 3 (Top-right -> Bottom-right): [4, 9, 14, 19, 24]
  const r1 = [0, 1, 6, 11, 16, 21];
  const r2 = [2, 7, 12, 17, 22];
  const r3 = [4, 9, 14, 19, 24];

  const spec: TutorialSpec = {
    id,
    size,
    route: r1,
    scramble: {},
    title: isIntro ? "Cosmic Trio Intro" : `Cosmic Trio #${id}`,
    hint: "Three pals in space! Rotate the paths so all three reach home safely.",
  };

  const level = buildTutorial(spec, true);

  // Setup Jelly 2
  const j2StartDir = (([0, 1, 2, 3] as Direction[]).find(d => neighbour(r2[0], d, size) === r2[1]))!;
  const j2HomeDir = (([0, 1, 2, 3] as Direction[]).find(d => neighbour(r2[r2.length - 1], d, size) === r2[r2.length - 2]))!;
  level.tiles[r2[0]] = { kind: "start", rotation: 0, port: j2StartDir, locked: true };
  level.tiles[r2[r2.length - 1]] = { kind: "home", rotation: 0, port: j2HomeDir, locked: true };

  for (let s = 1; s < r2.length - 1; s++) {
    const cur = r2[s];
    const prev = r2[s - 1];
    const nxt = r2[s + 1];
    const d1 = ([0, 1, 2, 3] as Direction[]).find(d => neighbour(cur, d, size) === prev)!;
    const d2 = ([0, 1, 2, 3] as Direction[]).find(d => neighbour(cur, d, size) === nxt)!;
    const kind = (d1 + 2) % 4 === d2 ? "straight" : "corner";
    const rotation = [0, 1, 2, 3].find(r => [d1, d2].every(d => ports({ kind, rotation: r }).includes(d)))!;
    level.tiles[cur] = { kind, rotation, locked: false };
  }

  // Setup Jelly 3
  const j3StartDir = (([0, 1, 2, 3] as Direction[]).find(d => neighbour(r3[0], d, size) === r3[1]))!;
  const j3HomeDir = (([0, 1, 2, 3] as Direction[]).find(d => neighbour(r3[r3.length - 1], d, size) === r3[r3.length - 2]))!;
  level.tiles[r3[0]] = { kind: "start", rotation: 0, port: j3StartDir, locked: true };
  level.tiles[r3[r3.length - 1]] = { kind: "home", rotation: 0, port: j3HomeDir, locked: true };

  for (let s = 1; s < r3.length - 1; s++) {
    const cur = r3[s];
    const prev = r3[s - 1];
    const nxt = r3[s + 1];
    const d1 = ([0, 1, 2, 3] as Direction[]).find(d => neighbour(cur, d, size) === prev)!;
    const d2 = ([0, 1, 2, 3] as Direction[]).find(d => neighbour(cur, d, size) === nxt)!;
    const kind = (d1 + 2) % 4 === d2 ? "straight" : "corner";
    const rotation = [0, 1, 2, 3].find(r => [d1, d2].every(d => ports({ kind, rotation: r }).includes(d)))!;
    level.tiles[cur] = { kind, rotation, locked: false };
  }

  level.jellies = [
    { character: "bunny", start: r1[0], home: r1[r1.length - 1] },
    { character: "panda", start: r2[0], home: r2[r2.length - 1] },
    { character: "cat", start: r3[0], home: r3[r3.length - 1] },
  ];
  level.world = "space";
  level.collectibles = [r1[2], r2[2], r3[2]];

  // Scramble tiles (revision 1 scrambled 2 tiles; revision 2 scrambles 6 tiles for par 5-8)
  if (isIntro) {
    if (revision <= 1) {
      level.tiles[r1[2]].rotation = (level.tiles[r1[2]].rotation + 1) % 4;
      level.tiles[r2[2]].rotation = (level.tiles[r2[2]].rotation + 1) % 4;
    } else {
      level.tiles[r1[1]].rotation = (level.tiles[r1[1]].rotation + 3) % 4;
      level.tiles[r1[2]].rotation = (level.tiles[r1[2]].rotation + 3) % 4;
      level.tiles[r2[1]].rotation = (level.tiles[r2[1]].rotation + 3) % 4;
      level.tiles[r2[2]].rotation = (level.tiles[r2[2]].rotation + 3) % 4;
      level.tiles[r3[1]].rotation = (level.tiles[r3[1]].rotation + 3) % 4;
      level.tiles[r3[2]].rotation = (level.tiles[r3[2]].rotation + 3) % 4;
    }
  } else {
    level.tiles[r1[2]].rotation = (level.tiles[r1[2]].rotation + (random() < 0.5 ? 1 : 3)) % 4;
    level.tiles[r2[2]].rotation = (level.tiles[r2[2]].rotation + (random() < 0.5 ? 1 : 3)) % 4;
    level.tiles[r3[2]].rotation = (level.tiles[r3[2]].rotation + (random() < 0.5 ? 1 : 3)) % 4;
  }

  const proof = solveMultiJelly(level, 15000);
  level.par = proof.solvable ? proof.par : (isIntro && revision >= 2 ? 6 : 4);
  level.moveLimit = proof.solvable ? proof.par + 3 : 8;
  level.difficulty = isIntro ? "Intro Trio" : "Three Jellies";

  return { level, proof };
}

// -------------------------------------------------------------
// Multi-Jelly Fixtures for Unit and Integration Tests
// -------------------------------------------------------------

export function twoJellyIntroFixture(): Level {
  return generateTwoJellyPuzzle(71, 42, 1).level;
}

export function twoJellyCollisionFixture(): Level {
  // Two Jellies heading into the same center tile 5 at step 2
  // Jelly 1: [0, 1, 5] -> arrives at 5 at step 2
  // Jelly 2: [10, 9, 5] -> arrives at 5 at step 2
  const level: Level = {
    id: 791,
    title: "Collision Test",
    hint: "Pals collide if paths cross simultaneously",
    size: 4,
    start: 0,
    home: 15,
    jellies: [
      { character: "bunny", start: 0, home: 15 },
      { character: "panda", start: 10, home: 3 },
    ],
    tiles: [
      { kind: "start", rotation: 0, port: 1 }, // 0: east to 1
      { kind: "corner", rotation: 2 },        // 1: south (2) & west (3) -> enters from west, exits south to 5
      { kind: "blank", rotation: 0 },
      { kind: "home", rotation: 0, port: 2 },  // 3
      { kind: "blank", rotation: 0 },
      { kind: "tee", rotation: 1 },           // 5: center collision cell (ports 0, 1, 2)
      { kind: "blank", rotation: 0 },
      { kind: "blank", rotation: 0 },
      { kind: "blank", rotation: 0 },
      { kind: "corner", rotation: 0 },        // 9: north (0) & east (1) -> enters from east, exits north to 5
      { kind: "start", rotation: 0, port: 3 }, // 10: west to 9
      { kind: "blank", rotation: 0 },
      { kind: "blank", rotation: 0 },
      { kind: "blank", rotation: 0 },
      { kind: "blank", rotation: 0 },
      { kind: "home", rotation: 0, port: 0 },  // 15
    ],
  };
  return level;
}

export function twoJellySwapFixture(): Level {
  // Two Jellies facing each other on adjacent cells 5 and 6
  // Jelly 1 moves 5 -> 6, Jelly 2 moves 6 -> 5 at the same tick
  const level: Level = {
    id: 792,
    title: "Head-on Swap Test",
    hint: "Head-on swaps are collisions",
    size: 4,
    start: 5,
    home: 7,
    jellies: [
      { character: "bunny", start: 5, home: 7 },
      { character: "panda", start: 6, home: 4 },
    ],
    tiles: [
      { kind: "blank", rotation: 0 }, { kind: "blank", rotation: 0 }, { kind: "blank", rotation: 0 }, { kind: "blank", rotation: 0 },
      { kind: "home", rotation: 0, port: 1 },  // 4
      { kind: "start", rotation: 0, port: 1 }, // 5: east towards 6
      { kind: "start", rotation: 0, port: 3 }, // 6: west towards 5
      { kind: "home", rotation: 0, port: 3 },  // 7
      { kind: "blank", rotation: 0 }, { kind: "blank", rotation: 0 }, { kind: "blank", rotation: 0 }, { kind: "blank", rotation: 0 },
      { kind: "blank", rotation: 0 }, { kind: "blank", rotation: 0 }, { kind: "blank", rotation: 0 }, { kind: "blank", rotation: 0 },
    ],
  };
  return level;
}

export function twoJellySharedPathFixture(): Level {
  // Jelly 1 passes through cell 5 at step 1 and is at cell 6 at step 2.
  // Jelly 2 enters cell 5 at step 2. Both reach homes without collision!
  const level: Level = {
    id: 793,
    title: "Shared Path Timing Test",
    hint: "Shared paths work when timing differs",
    size: 4,
    start: 1,
    home: 7,
    jellies: [
      { character: "bunny", start: 1, home: 7 },
      { character: "cat", start: 8, home: 10 },
    ],
    tiles: [
      { kind: "blank", rotation: 0 },
      { kind: "start", rotation: 0, port: 2 }, // 1: south to 5 (at step 1)
      { kind: "blank", rotation: 0 },
      { kind: "blank", rotation: 0 },
      { kind: "corner", rotation: 1 },        // 4: south (2) & east (1) -> enters from south (8), exits east to 5 (at step 2)
      { kind: "tee", rotation: 0 },           // 5: ports north (0), east (1), west (3) -> enters from north or west, exits east
      { kind: "tee", rotation: 2 },           // 6: ports south (2), west (3), east (1) -> enters from west, exits east (7) or south (10)
      { kind: "home", rotation: 0, port: 3 },  // 7: Bunny home
      { kind: "start", rotation: 0, port: 0 }, // 8: north to 4 (Cat start)
      { kind: "blank", rotation: 0 },
      { kind: "home", rotation: 0, port: 0 },  // 10: Cat home
      { kind: "blank", rotation: 0 },
      { kind: "blank", rotation: 0 },
      { kind: "blank", rotation: 0 },
      { kind: "blank", rotation: 0 },
      { kind: "blank", rotation: 0 },
    ],
  };
  return level;
}

export function threeJellyIntroFixture(): Level {
  return generateThreeJellyPuzzle(91, 100, 1).level;
}

export function isMultiJellyLevel(id: number): boolean {
  if (id >= 71 && id <= 80) return true;
  if (id >= 91 && id <= 100) return true;
  if (id > 100) {
    const rem = id % 10;
    return rem === 7 || rem === 9;
  }
  return false;
}

export function multiJellyCountFor(id: number): 1 | 2 | 3 {
  if (id >= 91 && id <= 100) return 3;
  if (id > 100 && id % 10 === 9) return 3;
  if (id >= 71 && id <= 80) return 2;
  if (id > 100 && id % 10 === 7) return 2;
  return 1;
}
