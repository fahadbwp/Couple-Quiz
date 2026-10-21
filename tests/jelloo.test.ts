import test from "node:test";
import assert from "node:assert/strict";
import { gameReducer, initialGame, neighbour, ports, tracePath, type GameState, type Level } from "../lib/jelloo/engine";
import { buildTutorial, levels, tutorialSpecs } from "../lib/jelloo/levels";

function finishRun(state: GameState) {
  let result = state;
  for (let i=0; i<100 && result.status === "running"; i++) result = gameReducer(result,{type:"tick",runId:result.runId});
  return result;
}

test("all 10 authored routes are adjacent, solvable, and initially unsolved", () => {
  assert.equal(levels.length,10);
  assert.equal(new Set(levels.map(l=>l.id)).size,10);
  tutorialSpecs.forEach((spec,i)=>{
    const solved = buildTutorial(spec,true);
    assert.deepEqual(tracePath(solved,solved.tiles),{path:spec.route,outcome:"home"},`solution ${spec.id}`);
    assert.notEqual(tracePath(levels[i],levels[i].tiles).outcome,"home",`scramble ${spec.id}`);
    assert.equal(solved.tiles.length,solved.size**2);
  });
});

test("first tutorial is won with one rotation; fixed endpoints cannot rotate",()=>{
  let game = initialGame(levels[0]);
  assert.equal(gameReducer(game,{type:"rotate",index:12}),game);
  assert.equal(gameReducer(game,{type:"rotate",index:15}),game);
  game = gameReducer(game,{type:"rotate",index:13});
  assert.equal(game.moves,1);
  game = finishRun(gameReducer(game,{type:"go"}));
  assert.equal(game.status,"won");
  assert.equal(game.trace!.path[game.cursor],levels[0].home);
});

test("rotations are immutable; undo restores board without refunding moves; reset restores attempt",()=>{
  const original = initialGame(levels[2]);
  const snapshot = JSON.stringify(original);
  let game = gameReducer(original,{type:"rotate",index:8});
  game = gameReducer(game,{type:"rotate",index:9});
  assert.equal(JSON.stringify(original),snapshot);
  game = gameReducer(game,{type:"undo"});
  game = gameReducer(game,{type:"undo"});
  assert.deepEqual(game.tiles,original.tiles);
  assert.equal(game.moves,2);
  assert.deepEqual(gameReducer(game,{type:"reset"}).tiles,original.tiles);
  assert.equal(gameReducer(game,{type:"reset"}).moves,0);
});

test("incomplete path stops at last reachable cell; edits return Bunny to start",()=>{
  let game = initialGame(levels[0]);
  game = finishRun(gameReducer(game,{type:"go"}));
  assert.equal(game.status,"blocked");
  assert.deepEqual(game.trace?.path,[12]);
  game = gameReducer(game,{type:"rotate",index:13});
  assert.equal(game.status,"editing");
  assert.equal(game.cursor,0);
  assert.equal(game.trace,null);
});

test("double Go and edits during traversal are ignored; reset invalidates queued callbacks",()=>{
  let game = gameReducer(initialGame(levels[0]),{type:"rotate",index:13});
  game = gameReducer(game,{type:"go"});
  assert.equal(gameReducer(game,{type:"go"}),game);
  assert.equal(gameReducer(game,{type:"rotate",index:14}),game);
  assert.equal(gameReducer(game,{type:"undo"}),game);
  const oldId = game.runId;
  const reset = gameReducer(game,{type:"reset"});
  const newRun = gameReducer(reset,{type:"go"});
  assert.equal(gameReducer(newRun,{type:"tick",runId:oldId}),newRun);
  const loaded = gameReducer(game,{type:"load",level:levels[9]});
  assert.equal(loaded.level.id,10);
  assert.equal(gameReducer(loaded,{type:"tick",runId:oldId}),loaded);
});

test("grid edges never wrap and an incorrectly oriented home is not accepted",()=>{
  assert.equal(neighbour(3,1,4),null);
  assert.equal(neighbour(4,3,4),null);
  assert.equal(neighbour(0,0,4),null);
  assert.equal(neighbour(15,2,4),null);
  const level: Level = {id:1,title:"edge",hint:"",size:2,start:0,home:1,tiles:[
    {kind:"start",rotation:0,port:0},{kind:"home",rotation:0,port:0},
    {kind:"blank",rotation:0},{kind:"blank",rotation:0},
  ]};
  assert.deepEqual(tracePath(level,level.tiles),{path:[0],outcome:"edge"});
  level.tiles[0].port=1;
  assert.equal(tracePath(level,level.tiles).outcome,"disconnected");
  level.tiles[1].port=3;
  assert.equal(tracePath(level,level.tiles).outcome,"home");
});

test("four rotations restore ports; large rotations remain valid",()=>{
  for (const kind of ["straight","corner"] as const) {
    assert.deepEqual(ports({kind,rotation:0}),ports({kind,rotation:4}));
    assert.deepEqual(ports({kind,rotation:1}),ports({kind,rotation:1001}));
  }
});

test("path checks terminate and preserve adjacency on 1000 rotated boards",()=>{
  let seed=123456;
  for(const level of levels) for(let sample=0;sample<100;sample++) {
    const tiles=level.tiles.map(t=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return {...t,rotation:seed%4};});
    const result=tracePath(level,tiles);
    assert.ok(result.path.length<=tiles.length);
    assert.equal(new Set(result.path).size,result.path.length);
    result.path.slice(1).forEach((index,i)=>assert.ok([0,1,2,3].some(d=>neighbour(result.path[i],d as 0|1|2|3,level.size)===index)));
    if(result.outcome==="home") assert.equal(result.path.at(-1),level.home);
  }
});

test("a closed cycle without a valid start exit is rejected rather than hanging",()=>{
  const level: Level={id:99,title:"loop",hint:"",size:2,start:0,home:9,tiles:[
    {kind:"corner",rotation:1},{kind:"corner",rotation:2},
    {kind:"corner",rotation:0},{kind:"corner",rotation:3},
  ]};
  assert.equal(tracePath(level,level.tiles).outcome,"disconnected");
});
