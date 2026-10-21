import test from "node:test";
import assert from "node:assert/strict";
import {initialGame,gameReducer,ports} from "../lib/jelloo/engine";
import {levelAt} from "../lib/jelloo/endless";
import {solvePowerLevel} from "../lib/jelloo/power-solver";
import {decodeJourney,encodeJourney,journeyReducer,newJourney} from "../lib/jelloo/progress";
import {playablePowerTrial,pals} from "../lib/jelloo/pals";

test("all character runs replay the solver witness and round-trip won states including Panda and Fox",()=>{
  for(const id of [11,13,15,21,31,41,43,45,47,49,51]) {
    const level=levelAt(id,99),proof=solvePowerLevel(level);
    let game=initialGame(level);
    if(level.fork) game=gameReducer(game,{type:"branch",direction:proof.choices[level.fork.tile]});
    for(let i=0;i<game.tiles.length;i++) {
      if(game.tiles[i].locked) continue;
      for(let r=0;r<4 && !ports(game.tiles[i]).every(d=>ports(proof.solution![i]).includes(d));r++) game=gameReducer(game,{type:"rotate",index:i});
    }
    game=gameReducer(game,{type:"auto",runId:game.runId,moves:game.moves});
    assert.equal(game.status,"running",String(id));
    let journey={...newJourney(99),completed:id-1,game};
    for(let i=0;i<30;i++) journey=journeyReducer(journey,{type:"tick",runId:journey.game.runId});
    assert.equal(journey.game.status,"won");assert.equal(journey.completed,id);
    const restored=decodeJourney(encodeJourney(journey))!;
    assert.ok(restored,String(id));assert.equal(restored.game.status,"won");
    assert.deepEqual(restored.game.trace,journey.game.trace);
  }
});
test("new normal levels and legacy boards preserve their existing rules",()=>{
  for(let id=12;id<=40;id+=2) assert.deepEqual(levelAt(id,42,4),levelAt(id,42,3));
  const old=levelAt(15,42,3),journey={...newJourney(42),rules:3,completed:14,game:initialGame(old)};
  assert.deepEqual(decodeJourney(encodeJourney(journey))!.game.level,old);
  const next=journeyReducer({...journey,completed:15},{type:"visit",id:16});
  assert.equal(next.rules,4);
});
test("introductions allow repeated mistakes without loss; locked paths cannot rotate",()=>{
  const level=levelAt(11,4),editable=level.tiles.findIndex(t=>!t.locked && ["straight","corner"].includes(t.kind));
  let game=initialGame(level);
  const fixed=level.tiles.findIndex(t=>t.locked);
  assert.equal(gameReducer(game,{type:"rotate",index:fixed}),game);
  for(let i=0;i<100;i++) game=gameReducer(game,{type:"rotate",index:editable});
  assert.notEqual(game.status,"lost");assert.equal(game.moves,100);
});
test("invalid saved branches are rejected; valid branch choices survive reload and reset clears them",()=>{
  const level=levelAt(41,42),proof=solvePowerLevel(level);
  const game=gameReducer(initialGame(level),{type:"branch",direction:proof.choices[level.fork!.tile]});
  const raw=JSON.parse(encodeJourney({...newJourney(42),completed:40,game}));
  assert.deepEqual(decodeJourney(JSON.stringify(raw))!.game.level.choices,game.level.choices);
  assert.equal(decodeJourney(JSON.stringify({...raw,choices:{999:0}})),null);
  assert.deepEqual(gameReducer(game,{type:"reset"}).level.choices,{});
});
test("playable trials also use stateful Panda gates and manual Fox choices",()=>{
  for(const pal of pals) for(const trial of [1,2,3]) {
    const level=playablePowerTrial(pal.id,trial),proof=solvePowerLevel(level);
    assert.ok(proof.solvable);assert.ok(Number.isFinite(proof.starPar));
    if(pal.id==="fox") assert.ok(level.fork && !level.choices);
    if(pal.id==="panda") assert.ok(level.gate);
  }
});
