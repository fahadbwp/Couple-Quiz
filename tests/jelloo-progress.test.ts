import test from "node:test";
import assert from "node:assert/strict";
import { generatePuzzle } from "../lib/jelloo/endless";
import { decodeJourney, encodeJourney, journeyReducer, newJourney } from "../lib/jelloo/progress";
import { initialGame, tracePath } from "../lib/jelloo/engine";
import { buildTutorial, tutorialSpecs } from "../lib/jelloo/levels";

test("1500 generated puzzles are solvable, initially unsolved, deterministic and varied",()=>{
  const shapes = new Set<string>();
  for (let seed=0;seed<5;seed++) for(let id=11;id<311;id++) {
    const {level,solution} = generatePuzzle(id,seed);
    assert.equal(tracePath(solution,solution.tiles).outcome,"home");
    assert.notEqual(tracePath(level,level.tiles).outcome,"home");
    assert.ok(level.size === 4 || level.size === 5);
    assert.deepEqual(generatePuzzle(id,seed).level,level);
    shapes.add(JSON.stringify(solution.tiles));
  }
  assert.ok(shapes.size>1400,`${shapes.size} distinct solved boards`);
});

test("sequential tutorial completion unlocks endless; replay cannot farm milestones",()=>{
  let journey = newJourney(42);
  assert.equal(journeyReducer(journey,{type:"visit",id:11}),journey);
  for (const spec of tutorialSpecs) {
    journey = journeyReducer(journey,{type:"visit",id:spec.id});
    journey = {...journey,game:initialGame(buildTutorial(spec,true))};
    journey = journeyReducer(journey,{type:"go"});
    for(let i=0;i<30;i++) journey = journeyReducer(journey,{type:"tick",runId:journey.game.runId});
    assert.equal(journey.completed,spec.id);
  }
  journey = journeyReducer(journey,{type:"visit",id:11});
  assert.equal(journey.game.level.id,11);
  journey = {...journey,game:initialGame(buildTutorial(tutorialSpecs[0],true))};
  journey = journeyReducer(journey,{type:"go"});
  for(let i=0;i<10;i++) journey = journeyReducer(journey,{type:"tick",runId:journey.game.runId});
  assert.equal(journey.completed,10);
});

test("save round trips rotations, moves, seed, settings and completed levels",()=>{
  let journey = newJourney(4294967295);
  journey = journeyReducer(journey,{type:"rotate",index:13});
  journey = journeyReducer(journey,{type:"motion"});
  const restored = decodeJourney(encodeJourney(journey))!;
  assert.deepEqual(restored.game.tiles.map(t=>t.rotation%4),journey.game.tiles.map(t=>t.rotation%4));
  assert.equal(restored.game.moves,1);
  assert.equal(restored.motion,false);
  assert.equal(restored.seed,4294967295);
  journey = journeyReducer(journey,{type:"go"});
  assert.equal(decodeJourney(encodeJourney(journey))!.game.status,"editing");
  for(let i=0;i<10;i++) journey = journeyReducer(journey,{type:"tick",runId:journey.game.runId});
  assert.equal(decodeJourney(encodeJourney(journey))!.game.status,"won");
  assert.equal(decodeJourney(encodeJourney(journey))!.completed,1);
});

test("invalid, oversized, future and inconsistent saves are rejected",()=>{
  const valid = JSON.parse(encodeJourney(newJourney()));
  for(const raw of ["bad","null","x".repeat(5000),...[
    {version:2},{generator:2},{seed:-1},{id:11},{completed:-1},{moves:NaN},
    {rotations:[]},{rotations:Array(16).fill(9)},{won:true},{motion:"yes"}
  ].map(change=>JSON.stringify({...valid,...change}))]) assert.equal(decodeJourney(raw),null);
});
