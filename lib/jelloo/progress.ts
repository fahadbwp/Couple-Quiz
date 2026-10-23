import { enforceMoveLimit, gameReducer, initialGame, tracePath, type Action, type GameState, type Level } from "./engine";
import { levelAt } from "./endless";
import { scoreRun } from "./scoring";

export const SAVE_KEY = "jelloo.progress.v1";
export type Journey = { game: GameState; seed: number; completed: number; motion: boolean; muted: boolean; rules: number; multiRevision?: number; best: Record<string,number> };
export function newJourney(seed = 1): Journey { return {game:initialGame(levelAt(1,seed)),seed,completed:0,motion:true,muted:false,rules:4,best:{}}; }
export type JourneyAction = Action | {type:"restore";journey:Journey} | {type:"visit";id:number;prepared?:Level} | {type:"jump";id:number} | {type:"motion"} | {type:"mute"};
export function journeyReducer(state: Journey, action: JourneyAction): Journey {
  if (action.type === "restore") return action.journey;
  if (action.type === "motion") return {...state,motion:!state.motion};
  if (action.type === "mute") return {...state,muted:!state.muted};
  if (action.type === "jump") {
    if (process.env.NODE_ENV === "production") return state;
    if (!Number.isSafeInteger(action.id) || action.id < 1) return state;
    const completed = Math.max(state.completed, action.id - 1);
    return {...state,completed,rules:4,multiRevision:1,game:initialGame(levelAt(action.id,state.seed),state.game.runId+1)};
  }
  if (action.type === "visit") {
    if (!Number.isSafeInteger(action.id) || action.id < 1 || action.id > state.completed+1 || action.id === state.game.level.id) return state;
    return {...state,rules:4,multiRevision:1,game:initialGame(action.prepared?.id === action.id ? action.prepared : levelAt(action.id,state.seed),state.game.runId+1)};
  }
  const game = gameReducer(state.game,action);
  const best = {...state.best};
  if(game.status === "won" && state.game.status !== "won") best[game.level.id] = Math.max(best[game.level.id] ?? 0,scoreRun(game).stars);
  const boundedBest = Object.fromEntries(Object.entries(best).sort((a,b)=>Number(b[0])-Number(a[0])).slice(0,200));
  return {...state,game,best:boundedBest,completed:game.status === "won" && game.level.id === state.completed+1 ? state.completed+1 : state.completed};
}
export function encodeJourney(state: Journey) {
  return JSON.stringify({
    version: 1,
    generator: 1,
    multiRevision: state.multiRevision ?? 1,
    rules: state.rules,
    muted: state.muted,
    best: state.best,
    seed: state.seed,
    completed: state.completed,
    motion: state.motion,
    id: state.game.level.id,
    moves: state.game.moves,
    rotations: state.game.tiles.map(t => ((t.rotation % 4) + 4) % 4),
    choices: state.game.level.choices,
    won: state.game.status === "won",
    jellies: state.game.level.jellies,
  });
}
export function decodeJourney(raw: string): Journey | null {
  try {
    if (raw.length > 8192) return null;
    const s = JSON.parse(raw);
    const integer = (n: unknown, max: number) => typeof n === "number" && Number.isSafeInteger(n) && n >= 0 && n <= max;
    if (!s || s.version !== 1 || s.generator !== 1 || !integer(s.seed,4294967295) || !integer(s.completed,Number.MAX_SAFE_INTEGER-2) || !integer(s.id,s.completed+1) || s.id < 1 || !integer(s.moves,Number.MAX_SAFE_INTEGER) || typeof s.motion !== "boolean" || typeof s.won !== "boolean") return null;
    const rules = s.rules ?? 1;
    if((rules !== 1 && rules !== 2 && rules !== 3 && rules !== 4 && rules !== 5) || (s.muted !== undefined && typeof s.muted !== "boolean")) return null;
    const best = s.best ?? {};
    if(typeof best !== "object" || best === null || Array.isArray(best) || Object.keys(best).length>200 || !Object.entries(best).every(([id,stars])=> /^[1-9]\d*$/.test(id) && integer(Number(id),s.completed) && integer(stars,3) && Number(stars)>0)) return null;
    const multiRevision = s.multiRevision ?? (s.jellies === undefined ? 0 : 1);
    if(multiRevision !== 0 && multiRevision !== 1) return null;
    const game = initialGame(levelAt(s.id,s.seed,rules,multiRevision));
    if(s.jellies !== undefined) {
      const expected = game.level.jellies;
      if(!expected || !Array.isArray(s.jellies) || s.jellies.length !== expected.length) return null;
      for(let i=0;i<expected.length;i++) {
        const actual=s.jellies[i], wanted=expected[i];
        if(!actual || typeof actual !== "object" || Array.isArray(actual) ||
          Object.keys(actual).some(k=>!["character","start","home","color"].includes(k)) ||
          actual.character!==wanted.character || actual.start!==wanted.start ||
          actual.home!==wanted.home || actual.color!==wanted.color) return null;
      }
    } else if(game.level.jellies) return null;
    if (!Array.isArray(s.rotations) || s.rotations.length !== game.tiles.length || !s.rotations.every((r: unknown)=>integer(r,3))) return null;
    game.tiles = game.tiles.map((t,i)=> ({...t,rotation:t.kind === "straight" || t.kind === "corner" || t.kind === "tee" ? s.rotations[i] : t.rotation}));
    game.moves = s.moves;
    if(s.choices!==undefined) {
      if(!s.choices || typeof s.choices!=="object" || Array.isArray(s.choices)) return null;
      const fork=game.level.fork;
      if(Object.entries(s.choices).some(([key,value])=>!fork || key!==String(fork.tile) || !fork.exits.includes(value as never))) return null;
      game.level={...game.level,choices:s.choices};
    }
    if (s.won) {
      const trace = tracePath(game.level,game.tiles);
      if (trace.outcome !== "home" || s.id > s.completed) return null;
      game.status = "won"; game.trace = trace; game.cursor = trace.path.length-1;
    }
    return {game:s.won ? game : enforceMoveLimit(game),seed:s.seed,completed:s.completed,motion:s.motion,muted:s.muted ?? false,rules,multiRevision,best};
  } catch { return null; }
}
