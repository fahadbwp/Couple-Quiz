import {gridNeighbour, type GridLike} from "./grid";
import { walkPowerLevel } from "./power-solver";
import { simulateMultiJelly, type MultiJellyTrace } from "./multi-jelly";
import type { WorldId } from "./worlds";
export type Direction = 0 | 1 | 2 | 3; // north, east, south, west
export type TileKind = "blank" | "straight" | "corner" | "tee" | "start" | "home";
export type Character = "bunny" | "panda" | "cat" | "octopus" | "fox";
export type TerrainKind = "gap" | "cracked" | "wall" | "slow" | "water" | "switch" | "slippery";
export type Tile = { kind: TileKind; rotation: number; port?: Direction; locked?:boolean; terrain?: TerrainKind };
export type Level = {
  id: number; title: string; hint: string; size: number; columns?:number; rows?:number;
  start: number; home: number; tiles: Tile[];
  collectibles?: number[]; moveLimit?: number; difficulty?: string;
  character?: Character; foxRoute?: "shortest" | "stars";
  powerVersion?:4; gate?:{tile:number;trigger:number}; door?:{tile:number;switch:number}; fork?:{tile:number;exits:Direction[]}; choices?:Record<string,Direction>; intro?:boolean; par?:number;
  world?: WorldId; dailyDate?: string;
  jellies?: { character: Character; start: number; home: number; color?: string }[];
};
export type PowerState={jumpUsed:boolean;broken:number[];branches:Record<string,Direction>;switches:number[]};
export type Trace = { path: number[]; outcome: "home" | "disconnected" | "edge" | "loop"; states?:PowerState[] };

export function ports(tile: Tile): Direction[] {
  if (tile.kind === "blank") return [];
  if (tile.kind === "start" || tile.kind === "home") return tile.port === undefined ? [] : [tile.port];
  const base = tile.kind === "straight" ? [1, 3] : tile.kind === "tee" ? [0,1,3] : [0, 1];
  return base.map(d => ((d + tile.rotation) % 4 + 4) % 4 as Direction);
}

export function neighbour(index:number,direction:Direction,grid:GridLike):number|null {
  return gridNeighbour(index,direction,grid);
}

export function tracePath(level: Level, tiles: readonly Tile[]): Trace {
  if (level.jellies && level.jellies.length > 1) return simulateMultiJelly(level, tiles);
  if(level.powerVersion===4 || level.door || tiles.some(t=>t.terrain==="switch" || t.terrain==="slippery")) return walkPowerLevel(level,tiles);
  if (level.character) return powerPaths(level,tiles).trace;
  if(tiles.some(t=>t.kind === "tee")) {
    const {parents,connected}=connectedPaths(level,tiles);
    const end=connected.includes(level.home) ? level.home : connected.at(-1)!;
    const path:number[]=[];
    for(let at=end;at!==-1;at=parents[at]) path.unshift(at);
    return {path,outcome:end===level.home ? "home" : "disconnected"};
  }
  const path = [level.start];
  const seen = new Set<number>(path);
  let current = level.start;
  let incoming: Direction | undefined;
  for (let steps = 0; steps <= tiles.length; steps++) {
    if (current === level.home) return { path, outcome: "home" };
    const exits = ports(tiles[current]).filter(d => d !== incoming);
    if (exits.length !== 1) return { path, outcome: "disconnected" };
    const direction = exits[0];
    const next = neighbour(current, direction, level.size);
    if (next === null) return { path, outcome: "edge" };
    const entry = (direction + 2) % 4 as Direction;
    if (!ports(tiles[next]).includes(entry)) return { path, outcome: "disconnected" };
    if (seen.has(next)) return { path, outcome: "loop" };
    seen.add(next);
    path.push(next);
    incoming = entry;
    current = next;
  }
  return { path, outcome: "loop" };
}

export function connectedPaths(level: Level, tiles: readonly Tile[]) {
  if (level.jellies && level.jellies.length > 1) {
    const trace = simulateMultiJelly(level, tiles);
    const connected = Array.from(new Set(trace.jellies.flatMap(j => j.path)));
    const parents: Record<number, number> = {};
    trace.jellies.forEach(j => {
      j.path.forEach((at, i) => { parents[at] = i ? j.path[i - 1] : -1; });
    });
    return { connected, parents };
  }
  if(level.powerVersion===4 || level.door || tiles.some(t=>t.terrain==="switch" || t.terrain==="slippery")) {
    const trace=walkPowerLevel(level,tiles),parents:Record<number,number>={};
    trace.path.forEach((at,i)=>{parents[at]=i ? trace.path[i-1] : -1;});
    return {connected:trace.path,parents};
  }
  if (level.character) {
    const result=powerPaths(level,tiles);
    const parents:Record<number,number>={};
    result.trace.path.forEach((at,i)=>{parents[at]=i ? result.trace.path[i-1] : -1;});
    return {connected:result.connected,parents};
  }
  const connected=[level.start],parents:Record<number,number>={[level.start]:-1};
  for(let step=0;step<connected.length;step++) {
    const at=connected[step];
    for(const direction of ports(tiles[at])) {
      const next=neighbour(at,direction,level);
      if(next===null || next in parents || !ports(tiles[next]).includes((direction+2)%4 as Direction)) continue;
      parents[next]=at;connected.push(next);
    }
  }
  return {connected,parents};
}

// Power trials are small authored boards. Enumerate simple routes with one
// Bunny jump per attempt; deterministic tie-breaking keeps previews and runs identical.
export function powerPaths(level: Level, tiles: readonly Tile[]) {
  const connected=new Set<number>([level.start]);
  let best:number[]|null=null, longest=[level.start], explored=0, bestStars=-1;
  const visit=(path:number[],jumped:boolean) => {
    if(++explored>50000) return;
    const at=path.at(-1)!;
    if(path.length>longest.length) longest=path;
    if(at===level.home) {
      const stars=(level.collectibles ?? []).filter(i=>path.includes(i)).length;
      const preferStars=level.character==="fox" && level.foxRoute==="stars";
      if(!best || (preferStars && stars>bestStars) || ((!preferStars || stars===bestStars) && path.length<best.length)) {best=path;bestStars=stars;}
      return;
    }
    for(const direction of ports(tiles[at])) {
      let next=neighbour(at,direction,level), usedJump=jumped;
      if(next===null) continue;
      if(tiles[next].terrain==="gap") {
        if(level.character!=="bunny" || jumped) continue;
        next=neighbour(next,direction,level);usedJump=true;
      }
      if(next===null || path.includes(next)) continue;
      const tile=tiles[next], entry=(direction+2)%4 as Direction;
      if((tile.terrain==="water" && level.character!=="octopus") || (tile.terrain==="wall" && level.character!=="cat") || (tile.terrain==="cracked" && level.character!=="panda") || !ports(tile).includes(entry)) continue;
      connected.add(next);visit([...path,next],usedJump);
    }
  };
  visit([level.start],false);
  return {trace:{path:best ?? longest,outcome:best ? "home" : "disconnected"} as Trace,connected:[...connected],exhausted:explored>50000};
}

export type GameState = {
  level: Level; tiles: Tile[]; history: Tile[][]; moves: number;
  status: "editing" | "running" | "blocked" | "won" | "lost";
  trace: Trace | null; cursor: number; runId: number;
};
export type Action =
  | { type: "rotate"; index: number }
  | { type: "undo" }
  | { type: "branch"; direction:Direction }
  | { type: "reset" }
  | { type: "load"; level: Level }
  | { type: "go" }
  | { type: "auto"; runId:number; moves:number }
  | { type: "tick"; runId: number };

export function initialGame(level: Level, runId = 0): GameState {
  return { level:level.powerVersion===4 ? {...level,choices:{}} : level, tiles: level.tiles.map(t => ({...t})), history: [], moves: 0,
    status: "editing", trace: null, cursor: 0, runId };
}

export function enforceMoveLimit(state: GameState): GameState {
  const limit=state.level.moveLimit;
  if(limit===undefined || state.moves<limit || state.status==="won") return state;
  const trace=tracePath(state.level,state.tiles);
  if(state.moves===limit && trace.outcome==="home") return {...state,status:"running",trace,cursor:0,runId:state.runId+1};
  return {...state,status:"lost",trace:null,cursor:0};
}

export function gameReducer(state: GameState, action: Action): GameState {
  if (action.type === "load") return initialGame(action.level, state.runId + 1);
  if (action.type === "reset") return initialGame(state.level, state.runId + 1);
  if (action.type === "tick") {
    if (state.status !== "running" || action.runId !== state.runId || !state.trace) return state;
    if (state.cursor < state.trace.path.length - 1) {
      const departed=state.trace.path[state.cursor];
      let tiles = state.tiles;
      if (state.level.jellies && state.level.jellies.length > 1) {
        const multiTrace = state.trace as MultiJellyTrace;
        multiTrace.jellies?.forEach(j => {
          if (j.character === "panda" && state.cursor < j.path.length - 1) {
            const cell = j.path[state.cursor];
            if (state.tiles[cell]?.terrain === "cracked") {
              tiles = tiles.map((t, i) => i === cell ? { kind: "blank" as const, rotation: 0 } : t);
            }
          }
        });
      } else if (state.level.powerVersion!==4 && state.level.character==="panda" && state.tiles[departed]?.terrain==="cracked") {
        tiles = state.tiles.map((t,i)=>i===departed ? {kind:"blank" as const,rotation:0} : t);
      }
      return {...state,tiles,cursor:state.cursor+1};
    }
    return {...state, status: state.trace.outcome === "home" ? "won" : "blocked"};
  }
  if (state.status === "running" || state.status === "won" || state.status === "lost") return state;
  if(action.type==="branch") {
    const fork=state.level.fork;
    if(state.level.character!=="fox" || !fork?.exits.includes(action.direction)) return state;
    return enforceMoveLimit({...state,level:{...state.level,choices:{[fork.tile]:action.direction}},trace:null,cursor:0,status:"editing",runId:state.runId+1});
  }
  if(state.level.moveLimit!==undefined && state.moves>=state.level.moveLimit) return enforceMoveLimit(state);
  if(action.type === "auto") {
    if(action.runId!==state.runId || action.moves!==state.moves) return state;
    const trace=tracePath(state.level,state.tiles);
    return trace.outcome === "home" ? {...state,status:"running",trace,cursor:0,runId:state.runId+1} : state;
  }
  if (action.type === "go") return {...state, status: "running", trace: tracePath(state.level, state.tiles), cursor: 0, runId: state.runId + 1};
  if (action.type === "undo") {
    if (!state.history.length) return state;
    return {...state, tiles: state.history[state.history.length - 1], history: state.history.slice(0,-1), status: "editing", cursor: 0, trace: null};
  }
  if (action.type === "rotate") {
    const tile = state.tiles[action.index];
    if (!tile || tile.locked || (tile.kind !== "straight" && tile.kind !== "corner" && tile.kind !== "tee")) return state;
    return enforceMoveLimit({...state, tiles: state.tiles.map((t,i) => i === action.index ? {...t, rotation: t.rotation + 1} : t),
      history: [...state.history.slice(-99), state.tiles], moves: state.moves + 1, status: "editing", trace: null, cursor: 0});
  }
  return state;
}
