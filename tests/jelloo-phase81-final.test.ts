import test from "node:test";
import assert from "node:assert/strict";
import {gameReducer,initialGame,tracePath} from "../lib/jelloo/engine";
import {switchFixture,playablePowerTrial} from "../lib/jelloo/pals";
import {solvePowerLevel} from "../lib/jelloo/power-solver";

test("pressure plate is active on arrival and only its linked door opens",()=>{
 const level=switchFixture(), solved=solvePowerLevel(level);assert.ok(solved.solution);
 const trace=tracePath(level,solved.solution);assert.equal(trace.outcome,"home");
 const plate=trace.path.indexOf(level.door!.switch);
 assert.ok(trace.states![plate].switches.includes(level.door!.switch));
 const missing={...level,tiles:solved.solution.map(t=>({...t,terrain:undefined}))};
 assert.notEqual(tracePath(missing,missing.tiles).outcome,"home");
 assert.notEqual(tracePath({...level,door:{tile:5,switch:7}},solved.solution).outcome,"home");
});

test("real reducer resets pressure and door state on undo, restart and retry",()=>{
 const level=switchFixture(), solution=solvePowerLevel(level).solution!;
 let game=initialGame(level);
 for(const [i,t] of solution.entries())for(let r=0,n=(t.rotation-level.tiles[i].rotation+4)%4;r<n;r++)game=gameReducer(game,{type:"rotate",index:i});
 game=gameReducer(game,{type:"go"});
 while(game.status==="running")game=gameReducer(game,{type:"tick",runId:game.runId});
 assert.equal(game.status,"won");assert.ok(game.trace!.states!.at(-1)!.switches.includes(1));
 game=gameReducer(game,{type:"reset"});assert.equal(game.trace,null);assert.deepEqual(game.tiles,level.tiles);assert.equal(game.moves,0);
 game=gameReducer(game,{type:"rotate",index:1});game=gameReducer(game,{type:"undo"});assert.equal(game.trace,null);assert.deepEqual(game.tiles,level.tiles);
 const limited={...level,moveLimit:1};let lost=gameReducer(initialGame(limited),{type:"rotate",index:4});assert.equal(lost.status,"lost");
 lost=gameReducer(lost,{type:"reset"});assert.equal(lost.status,"editing");assert.equal(lost.trace,null);
});

test("all actual Panda trials retain cracked-tile gates distinct from pressure plates",()=>{
 for(const id of [1,2,3]){
  const level=playablePowerTrial("panda",id), solved=solvePowerLevel(level);assert.ok(solved.solution);
  assert.equal(level.tiles[level.gate!.trigger].terrain,"cracked");assert.equal(level.door,undefined);
  assert.equal(tracePath(level,solved.solution).outcome,"home");
  assert.notEqual(tracePath({...level,character:"cat"},solved.solution).outcome,"home");
 }
});
