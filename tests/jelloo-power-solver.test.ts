import test from "node:test";
import assert from "node:assert/strict";
import { powerTrial,pals } from "../lib/jelloo/pals";
import { auditPowerLevel,solvePowerLevel,walkPowerLevel } from "../lib/jelloo/power-solver";
import type { Character,Level } from "../lib/jelloo/engine";

function fixture(character:Character):Level {
  const level=powerTrial(character,1).level;
  level.powerVersion=4;
  if(character==="panda") level.gate={tile:7,trigger:11};
  if(character==="fox") {level.fork={tile:10,exits:[0,1]};level.tiles[10].locked=true;level.tiles[10].rotation=1;}
  return level;
}
test("state solver returns par, all-star solution and uniquely required character",()=>{
  for(const pal of pals) {
    const level=fixture(pal.id),a=auditPowerLevel(level);
    assert.equal(a.exhausted,false);assert.equal(a.solvable,true,pal.id);
    assert.equal(a.necessary,true,pal.id);assert.equal(a.requiredCharacter,pal.id);
    assert.ok(a.par>=0 && Number.isFinite(a.starPar));
    const trace=walkPowerLevel({...level,choices:a.choices},a.solution!);
    assert.equal(trace.outcome,"home");
    assert.ok(level.collectibles!.every(i=>trace.path.includes(i)));
  }
});
test("Panda destruction opens a later gate; disabling power leaves that gate closed",()=>{
  const level=fixture("panda"),a=solvePowerLevel(level),trace=walkPowerLevel(level,a.solution!);
  const triggerStep=trace.path.indexOf(level.gate!.trigger),gateStep=trace.path.indexOf(level.gate!.tile);
  assert.ok(gateStep>triggerStep);
  assert.equal(trace.states![triggerStep].broken.length,0);
  assert.ok(trace.states![gateStep].broken.includes(level.gate!.trigger));
  assert.equal(solvePowerLevel(level,null).solvable,false);
  assert.equal(solvePowerLevel({...level,gate:undefined},null).solvable,true);
});
test("Fox cannot auto-select a route; solver branch assignment must be supplied by player",()=>{
  const level=fixture("fox"),a=solvePowerLevel(level);
  assert.notEqual(walkPowerLevel(level,a.solution!).outcome,"home");
  assert.equal(walkPowerLevel({...level,choices:a.choices},a.solution!).outcome,"home");
  assert.equal(a.choices[10],1);
  assert.equal(a.trace.states!.at(-1)!.branches[10],1);
});
test("Bunny tracks one jump, solver rejects budget exhaustion as proof",()=>{
  const level=fixture("bunny"),a=solvePowerLevel(level);
  assert.equal(a.trace.states!.at(-1)!.jumpUsed,true);
  const exhausted=solvePowerLevel(level,"bunny",1);
  assert.equal(exhausted.exhausted,true);assert.equal(exhausted.solvable,false);assert.equal(exhausted.par,Infinity);
});
test("necessity check rejects a decorative power; par counts clockwise rotations",()=>{
  const level=fixture("octopus");level.tiles=level.tiles.map(t=>({...t,terrain:undefined}));
  assert.equal(auditPowerLevel(level).necessary,false);
  const tiny:Level={id:1,title:"",hint:"",size:2,start:0,home:3,powerVersion:4,tiles:[{kind:"start",rotation:0,port:1},{kind:"corner",rotation:0},{kind:"blank",rotation:0},{kind:"home",rotation:0,port:0}]};
  assert.equal(solvePowerLevel(tiny).par,2);
});
