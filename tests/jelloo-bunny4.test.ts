import test from "node:test";
import assert from "node:assert/strict";
import {bunnyLevel,allBunnyLevels,bunnyScore} from "../lib/jelloo/campaign-v2/bunny-provider";
import {BUNNY_PLANS,BUNNY_SPECS} from "../lib/jelloo/campaign-v2/bunny-specs";
import {initialGame,gameReducer,tracePath,type GameState} from "../lib/jelloo/engine";
import {solvePowerLevel} from "../lib/jelloo/power-solver";
import {auditBatchUniqueness} from "../lib/jelloo/campaign-v2/structural-comparator";
function play(id:number,kind:"short"|"stars") {
 let game=initialGame(bunnyLevel(id));const clicks=BUNNY_PLANS[id][kind];
 clicks.forEach((index,n)=>{
  assert.equal(game.status,"editing",`Level ${id}: premature auto-start`);
  game=gameReducer(game,{type:"rotate",index});assert.equal(game.moves,n+1);
  game=gameReducer(game,{type:"auto",runId:game.runId,moves:game.moves});
  if(n<clicks.length-1)assert.equal(game.status,"editing",`Level ${id}: star route unavailable with normal 250ms pauses`);
 });
 while(game.status==="running")game=gameReducer(game,{type:"tick",runId:game.runId});
 assert.equal(game.status,"won");return game;
}
test("Bunny revision contains all fifty 4x4 levels and both certified click journeys",()=>{
 for(const level of allBunnyLevels()) {
  assert.equal(level.columns,4);assert.equal(level.rows,4);assert.equal(level.tiles.length,16);assert.equal(level.collectibles!.length,2);
  assert.equal(level.moveLimit,level.solverStarPar+3);
  assert.equal(bunnyScore(play(level.id,"stars")).stars,3);
  assert.equal(bunnyScore(play(level.id,"short")).stars,level.id<=5?3:1);
  if(level.id>5){assert(level.solverStarPar>level.solverPar);assert(BUNNY_PLANS[level.id].stars.length>BUNNY_PLANS[level.id].short.length);}
  if(level.id>=41)assert(level.solverPar>=11);
 }
});
test("Bunny power levels need exactly the approved single jump",()=>{
 const ids=BUNNY_SPECS.filter(s=>s.gaps?.length).map(s=>s.id);assert(ids.length>=10);
 for(const id of ids){const level=bunnyLevel(id);assert(solvePowerLevel(level).solvable);assert(!solvePowerLevel(level,null).solvable);const game=play(id,"stars");assert(game.trace!.states!.at(-1)!.jumpUsed);}
});
test("all 1225 Bunny pairs reject repeated topology, core routes and high-overlap detours",()=>{
 const report=auditBatchUniqueness(allBunnyLevels().map(level=>({level})));
 assert.deepEqual(report.duplicates,[]);assert.deepEqual(report.nearDuplicates,[]);
});
test("new campaign rewards are actual reached pickups and cannot award failed attempts",()=>{
 const game=play(6,"stars");assert.equal(bunnyScore(game).stars,3);
 const short=play(6,"short");assert.equal(bunnyScore(short).stars,1);
 const partial:GameState={...game,trace:{...game.trace!,path:game.trace!.path.filter(i=>i!==game.level.collectibles![1])}};
 assert.equal(bunnyScore(partial).stars,2);
 assert.equal(bunnyScore({...game,status:"lost"}).stars,0);
 assert.equal(bunnyScore(initialGame(bunnyLevel(1))).stars,0);
 assert.equal(tracePath(game.level,game.tiles).outcome,"home");
});
