import test from "node:test";
import assert from "node:assert/strict";
import { gameReducer, initialGame } from "../lib/jelloo/engine";
import { levels } from "../lib/jelloo/levels";
import { decodeJourney, encodeJourney, journeyReducer, newJourney } from "../lib/jelloo/progress";
import { powerTrial } from "../lib/jelloo/pals";
import { feedbackFor } from "../lib/jelloo/feedback";

test("last unsolved move loses immediately and blocks rapid taps, undo and stale auto",()=>{
  let state=initialGame({...levels[0],moveLimit:2});
  state=gameReducer(state,{type:"rotate",index:14});
  assert.equal(state.status,"editing");
  const before=state;
  state=gameReducer(state,{type:"rotate",index:14});
  assert.equal(state.status,"lost");assert.equal(state.moves,2);
  assert.deepEqual(feedbackFor(before,state),["confused"]);
  for(const action of [{type:"rotate",index:13},{type:"undo"},{type:"go"},{type:"auto",moves:2,runId:state.runId},{type:"tick",runId:state.runId}] as const) assert.equal(gameReducer(state,action),state);
  assert.deepEqual(feedbackFor(state,state),[]);
  const reset=gameReducer(state,{type:"reset"});
  assert.equal(reset.status,"editing");assert.equal(reset.moves,0);assert.deepEqual(reset.tiles,levels[0].tiles);
});
test("solving on the last allowed move starts a protected run and still wins",()=>{
  let state=initialGame({...levels[0],moveLimit:1});
  state=gameReducer(state,{type:"rotate",index:13});
  assert.equal(state.status,"running");assert.equal(state.moves,1);
  assert.equal(gameReducer(state,{type:"rotate",index:13}),state);
  for(let i=0;i<10;i++) state=gameReducer(state,{type:"tick",runId:state.runId});
  assert.equal(state.status,"won");
});
test("lost save survives reload without awarding progress or stars",()=>{
  let journey=newJourney(123);
  for(let i=0;i<journey.game.level.moveLimit!;i++) journey=journeyReducer(journey,{type:"rotate",index:14});
  assert.equal(journey.game.status,"lost");assert.equal(journey.completed,0);assert.deepEqual(journey.best,{});
  const restored=decodeJourney(encodeJourney(journey))!;
  assert.equal(restored.game.status,"lost");assert.equal(restored.game.moves,journey.game.moves);
  assert.equal(journeyReducer(restored,{type:"undo"}).game.status,"lost");
});
test("last-move running save resumes safely; historical over-budget wins stay readable",()=>{
  let journey=newJourney(123);
  // Level one allows three rotations; the third reconnects its straight tile.
  for(let i=0;i<3;i++) journey=journeyReducer(journey,{type:"rotate",index:13});
  assert.equal(journey.game.status,"running");
  let restored=decodeJourney(encodeJourney(journey))!;
  assert.equal(restored.game.status,"running");
  for(let i=0;i<10;i++) restored=journeyReducer(restored,{type:"tick",runId:restored.game.runId});
  assert.equal(restored.completed,1);
  const legacy=JSON.parse(encodeJourney(restored));legacy.moves=99;
  assert.equal(decodeJourney(JSON.stringify(legacy))!.game.status,"won");
});
test("power trials also lose at the move limit",()=>{
  const {level}=powerTrial("bunny",1);
  const game=gameReducer(initialGame({...level,moveLimit:1}),{type:"rotate",index:2});
  assert.equal(game.status,"lost");
});
