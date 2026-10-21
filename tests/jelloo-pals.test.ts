import test from "node:test";
import assert from "node:assert/strict";
import { gameReducer, initialGame, ports, powerPaths, tracePath, type Character, type Level } from "../lib/jelloo/engine";
import { canPlayPal, decodePalStars, pals, powerStepDuration, powerTrial } from "../lib/jelloo/pals";
import { analyzePuzzle, scoreRun } from "../lib/jelloo/scoring";
import { decodeJourney, encodeJourney, newJourney } from "../lib/jelloo/progress";

test("all 15 power trials start unsolved, need multiple rotations, and finish with all stars under target",()=>{
  for(const pal of pals) for(let trial=1;trial<=3;trial++) {
    const {level,solution}=powerTrial(pal.id,trial);
    assert.notEqual(tracePath(level,level.tiles).outcome,"home");
    const quality=analyzePuzzle(level);
    assert.equal(quality.exhausted,false);
    assert.ok(quality.minMoves>=5 && Number.isFinite(quality.starMoves),`${pal.id} ${trial}: weak or unreachable puzzle`);
    let game=initialGame(level);
    for(let i=0;i<solution.length;i++) {
      if(!["straight","corner","tee"].includes(solution[i].kind)) continue;
      for(let r=0;r<4 && !ports(game.tiles[i]).every(d=>ports(solution[i]).includes(d));r++) game=gameReducer(game,{type:"rotate",index:i});
    }
    assert.ok(game.moves>=5,`${pal.id} ${trial} too easy`);
    assert.equal(powerPaths(level,game.tiles).exhausted,false);
    game=gameReducer(game,{type:"auto",runId:game.runId,moves:game.moves});
    assert.equal(game.status,"running",`${pal.id} ${trial} unsolvable`);
    for(let tick=0;tick<30 && game.status==="running";tick++) game=gameReducer(game,{type:"tick",runId:game.runId});
    assert.equal(game.status,"won");assert.equal(scoreRun(game).stars,3);
  }
});
test("milestones unlock at exactly 10, 20, 30 and 40 completed adventure levels",()=>{
  for(const pal of pals) {
    assert.equal(canPlayPal(pal.id,pal.unlock),true);
    if(pal.unlock) assert.equal(canPlayPal(pal.id,pal.unlock-1),false);
  }
  assert.equal(canPlayPal("unknown" as Character,100),false);
});
test("Bunny crosses one gap, cannot cross two, and other pals cannot jump",()=>{
  const {level,solution}=powerTrial("bunny",1);
  assert.equal(tracePath(level,solution).outcome,"home");
  assert.ok(!tracePath(level,solution).path.includes(15));
  assert.notEqual(tracePath({...level,character:"cat"},solution).outcome,"home");
  const twice=solution.map((t,i)=>i===7 ? {kind:"blank" as const,rotation:0,terrain:"gap" as const} : t);
  assert.notEqual(tracePath(level,twice).outcome,"home");
});
test("terrain really gates routes to its matching pal",()=>{
  for(const character of ["panda","cat","octopus"] as const) {
    const {level,solution}=powerTrial(character,2);
    assert.equal(tracePath(level,solution).outcome,"home");
    for(const wrong of pals.filter(p=>p.id!==character)) assert.notEqual(tracePath({...level,character:wrong.id},solution).outcome,"home",`${wrong.id} bypassed ${character} obstacle`);
  }
});
test("Panda breaks a bridge only after departure; restart restores it and stale ticks are ignored",()=>{
  const {level,solution}=powerTrial("panda",1);
  let game=initialGame({...level,tiles:solution});
  game=gameReducer(game,{type:"go"});
  const bridge=solution.findIndex(t=>t.terrain==="cracked");
  while(game.trace!.path[game.cursor]!==bridge) game=gameReducer(game,{type:"tick",runId:game.runId});
  assert.equal(game.tiles[bridge].terrain,"cracked");
  game=gameReducer(game,{type:"tick",runId:game.runId});
  assert.equal(game.tiles[bridge].kind,"blank");
  const oldRun=game.runId;
  game=gameReducer(game,{type:"reset"});
  assert.equal(game.tiles[bridge].terrain,"cracked");
  assert.equal(gameReducer(game,{type:"tick",runId:oldRun}),game);
});
test("Fox route preference changes the actual branch and collectible score in every orientation",()=>{
  for(let trial=1;trial<=3;trial++) {
    const {level,solution}=powerTrial("fox",trial);
    const stars=tracePath(level,solution),short=tracePath({...level,foxRoute:"shortest"},solution);
    assert.equal(stars.outcome,"home");assert.equal(short.outcome,"home");
    assert.notDeepEqual(stars.path,short.path);
    assert.ok(stars.path.includes(level.collectibles![0]));
    assert.ok(!short.path.includes(level.collectibles![0]));
  }
});
test("Cat ignores sticky slowdown; reduced motion removes extended timing",()=>{
  const {level,solution}=powerTrial("cat",1);
  const game=initialGame({...level,tiles:solution});
  game.trace=tracePath(level,solution);game.cursor=game.trace.path.findIndex(i=>solution[i].terrain==="slow");
  assert.equal(powerStepDuration(game,true),210);
  assert.equal(powerStepDuration({...game,level:{...game.level,character:"bunny"}},true),840);
  assert.equal(powerStepDuration(game,false),100);
});
test("trial medals validate bounded schema; adventure saves remain unchanged",()=>{
  assert.deepEqual(decodePalStars(null),{});
  assert.deepEqual(decodePalStars(JSON.stringify({version:1,stars:{"bunny-1":3,"fox-3":2}})),{"bunny-1":3,"fox-3":2});
  for(const value of [{version:2,stars:{}},{version:1,stars:{"bunny-4":3}},{version:1,stars:{"fox-1":4}},{version:1,stars:[]}]) assert.equal(decodePalStars(JSON.stringify(value)),null);
  const save=encodeJourney(newJourney(123));
  assert.equal(encodeJourney(decodeJourney(save)!),save);
});
test("power traversal is cycle-safe and refuses off-grid jumps",()=>{
  const level:Level={id:1,title:"Edge",hint:"",size:2,start:1,home:2,character:"bunny",tiles:[{kind:"blank",rotation:0},{kind:"start",rotation:0,port:1},{kind:"home",rotation:0,port:0},{kind:"blank",rotation:0,terrain:"gap"}]};
  assert.equal(tracePath(level,level.tiles).outcome,"disconnected");
  assert.equal(powerPaths(level,level.tiles).exhausted,false);
});
