import test from "node:test";
import assert from "node:assert/strict";
import { connectedPaths, gameReducer, initialGame, ports, tracePath } from "../lib/jelloo/engine";
import { levels } from "../lib/jelloo/levels";
import { levelAt, generatePuzzle, difficultyFor } from "../lib/jelloo/endless";
import { analyzePuzzle } from "../lib/jelloo/scoring";
import { decodeJourney } from "../lib/jelloo/progress";

test("live connection highlights stop at mismatched edges; auto starts only a complete current board",()=>{
  let game=initialGame(levels[0]);
  assert.deepEqual(connectedPaths(game.level,game.tiles).connected,[12]);
  const stale={type:"auto" as const,runId:game.runId,moves:game.moves};
  assert.equal(gameReducer(game,stale),game);
  game=gameReducer(game,{type:"rotate",index:13});
  assert.deepEqual(connectedPaths(game.level,game.tiles).connected,[12,13,14,15]);
  assert.equal(gameReducer(game,stale),game);
  const action={type:"auto" as const,runId:game.runId,moves:game.moves};
  const running=gameReducer(game,action);
  assert.equal(running.status,"running");
  assert.equal(gameReducer(running,action),running);
  const reset=gameReducer(running,{type:"reset"});
  assert.equal(gameReducer(reset,action),reset);
});

test("T ports rotate through all four orientations and shortest-route traversal ignores a dead branch",()=>{
  assert.deepEqual(ports({kind:"tee",rotation:0}),[0,1,3]);
  assert.deepEqual(ports({kind:"tee",rotation:1}),[1,2,0]);
  const level={...levels[0],tiles:levels[0].tiles.map(t=>({...t}))};
  level.tiles[13]={kind:"tee",rotation:0};
  level.tiles[9]={kind:"straight",rotation:1};
  assert.deepEqual(tracePath(level,level.tiles),{path:[12,13,14,15],outcome:"home"});
  assert.ok(connectedPaths(level,level.tiles).connected.includes(9));
  assert.equal(gameReducer(initialGame(level),{type:"rotate",index:13}).tiles[13].rotation,1);
});

test("junction boards keep difficulty gates and legacy phase-4 saves preserve their tiles",()=>{
  for(let id=11;id<51;id++) {
    const level=levelAt(id,42,3),a=analyzePuzzle(level),d=difficultyFor(id);
    assert.equal(a.exhausted,false);
    assert.ok(a.minMoves>=d.minMoves && a.shortest>=d.minLength && a.fewestTurns>=d.minTurns);
    assert.ok(a.starMoves<=level.moveLimit!);
    assert.notEqual(tracePath(level,level.tiles).outcome,"home");
  }
  assert.ok(levelAt(4,42).tiles.some(t=>t.kind==="tee"));
  const old=generatePuzzle(11,42).level;
  const saved=decodeJourney(JSON.stringify({version:1,generator:1,rules:2,seed:42,completed:10,id:11,moves:0,motion:true,won:false,rotations:old.tiles.map(t=>t.rotation%4)}))!;
  assert.deepEqual(saved.game.tiles.map(t=>t.kind),old.tiles.map(t=>t.kind));
  assert.deepEqual(saved.game.tiles.map(t=>t.rotation%4),old.tiles.map(t=>t.rotation%4));
  const junction=levelAt(4,42);
  const rotations=junction.tiles.map(t=>(t.rotation+(t.kind==="tee" ? 1 : 0))%4);
  const restored=decodeJourney(JSON.stringify({version:1,generator:1,rules:3,seed:42,completed:3,id:4,moves:1,motion:true,won:false,rotations}))!;
  assert.deepEqual(restored.game.tiles.map(t=>t.rotation%4),rotations);
  assert.ok(restored.game.tiles.some(t=>t.kind==="tee"));
});
