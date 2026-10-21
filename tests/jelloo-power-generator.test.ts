import test from "node:test";
import assert from "node:assert/strict";
import {characterForLevel,generatePowerPuzzle,isPowerIntro} from "../lib/jelloo/power-generator";
import {auditPowerLevel,walkPowerLevel} from "../lib/jelloo/power-solver";
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
test("each introduction is one editable tile, has no loss limit, and passes necessity",()=>{
  for(const id of [11,13,21,31,41]) {
    const {level}=generatePowerPuzzle(id,123);
    assert.ok(isPowerIntro(id));assert.equal(level.moveLimit,undefined);
    assert.equal(level.tiles.filter(t=>!t.locked && ["straight","corner","tee"].includes(t.kind)).length,1);
    assert.equal(auditPowerLevel(level).necessary,true);
  }
});
