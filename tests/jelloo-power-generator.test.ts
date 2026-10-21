import test from "node:test";
import assert from "node:assert/strict";
import {characterForLevel,generatePowerPuzzle,isPowerIntro} from "../lib/jelloo/power-generator";
import {auditPowerLevel,solvePowerLevel,walkPowerLevel} from "../lib/jelloo/power-solver";
import {pals} from "../lib/jelloo/pals";

test("1000 generated power levels are solvable, require their own character and reach every collectible",()=>{
  const shapes=new Set<string>();
  for(let seed=0;seed<10;seed++) for(let slot=0;slot<100;slot++) {
    const id=11+slot*2,{level,proof}=generatePowerPuzzle(id,seed);
    assert.ok(proof.solvable && !proof.exhausted && proof.necessary,`${id}/${seed}`);
    assert.equal(proof.requiredCharacter,level.character);
    assert.ok(proof.alternatives.every(a=>!a.result.solvable && !a.result.exhausted));
    const trace=walkPowerLevel({...level,choices:proof.choices},proof.solution!);
    assert.equal(trace.outcome,"home");assert.ok(level.collectibles!.every(i=>trace.path.includes(i)));
    assert.ok(level.intro || proof.starPar<=level.moveLimit!);
    if(!level.intro) {
      assert.ok(proof.starPar>=proof.par+1,`star detour ${id}/${seed}`);
      assert.ok(proof.trace.path.length>proof.shortestPath.length);
      assert.ok(level.collectibles!.some(i=>!proof.shortestPath.includes(i) && !proof.parPath.includes(i)));
      assert.equal(level.collectibles!.length,id>=21 ? 2 : 1);
      assert.equal(level.moveLimit,proof.starPar+Math.max(2,5-Math.min(3,Math.floor((id-11)/10))));
    }
    assert.ok(pals.find(p=>p.id===level.character)!.unlock<id);
    shapes.add(JSON.stringify(level.tiles));
  }
  assert.ok(shapes.size>900,`${shapes.size} distinct power boards`);
});
test("schedule alternates normal/power, uses unlocked pals and avoids consecutive power repeats",()=>{
  let previous=null;
  for(let id=11;id<400;id++) {
    const character=characterForLevel(id);
    assert.equal(character===null,id%2===0);
    if(character) {assert.notEqual(character,previous);previous=character;assert.ok(pals.find(p=>p.id===character)!.unlock<id);}
  }
});

test("power stars are optional detours and tier two onwards offers two reachable collectibles",()=>{
  for(const id of [15,17,23,25,27,33,39,43,51]) {
    const {level,proof}=generatePowerPuzzle(id,2026);
    const withoutStars=solvePowerLevel({...level,collectibles:[]});
    assert.equal(withoutStars.par,proof.par);
    const direct=walkPowerLevel({...level,choices:withoutStars.choices},withoutStars.solution!);
    assert.equal(direct.outcome,"home");
    assert.ok(level.collectibles!.some(i=>!direct.path.includes(i)));
    assert.ok(proof.starPar>withoutStars.par);
    assert.equal(level.collectibles!.length,id<21 ? 1 : 2);
    const collected=walkPowerLevel({...level,choices:proof.choices},proof.solution!);
    assert.ok(level.collectibles!.every(i=>collected.path.includes(i)));
  }
});
test("each introduction is one editable tile, has no loss limit, and passes necessity",()=>{
  const layouts=new Set<string>();
  for(const id of [11,13,21,31,41]) {
    const {level}=generatePowerPuzzle(id,123);
    assert.deepEqual(generatePowerPuzzle(id,123).level,level);
    assert.ok(isPowerIntro(id));assert.equal(level.moveLimit,undefined);
    assert.equal(level.tiles.filter(t=>!t.locked && ["straight","corner","tee"].includes(t.kind)).length,1);
    const proof=auditPowerLevel(level);
    assert.equal(proof.necessary,true);
    assert.equal(proof.solvable,true);
    assert.equal(proof.requiredCharacter,level.character);
    assert.equal(proof.par,1);
    layouts.add(JSON.stringify([level.start,level.home,level.tiles.map(t=>t.kind!=="blank" || t.terrain==="gap")]));
  }
  assert.ok(layouts.size>=3);
});
