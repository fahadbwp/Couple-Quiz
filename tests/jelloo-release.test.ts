import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {levelAt} from "../lib/jelloo/endless";
import {initialGame,gameReducer} from "../lib/jelloo/engine";
import {solveMultiJelly} from "../lib/jelloo/multi-jelly";

test("QA page is development opt-in only and game reducer cannot write adventure progress",()=>{
 const page=readFileSync("app/jelloo/qa/page.tsx","utf8"),game=readFileSync("app/jelloo/qa/LocalQAGame.tsx","utf8");
 assert.match(page,/process\.env\.NODE_ENV!=="development" \|\| process\.env\.JELLOO_LOCAL_QA!=="1"\)notFound\(\)/);
 assert.doesNotMatch(game,/localStorage\.|sessionStorage\.|journeyReducer\(/);
});
test("actual Level 71 and 91 fixture rotations win; Undo and Restart retain original semantics",()=>{
 for(const id of [71,91]){
  const level=levelAt(id,42),solved=solveMultiJelly(level);assert.equal(solved.status,"solved");
  let game=initialGame(level);const turns=solved.solution!.flatMap((t,i)=>Array.from({length:(t.rotation-level.tiles[i].rotation+4)%4},()=>i));
  game=gameReducer(game,{type:"rotate",index:turns[0]});assert.equal(game.moves,1);
  game=gameReducer(game,{type:"undo"});assert.equal(game.moves,1);assert.deepEqual(game.tiles,initialGame(level).tiles);
  game=gameReducer(game,{type:"reset"});assert.equal(game.moves,0);
  for(const index of turns)game=gameReducer(game,{type:"rotate",index});
  game=gameReducer(game,{type:"go"});
  for(let n=0;n<100 && game.status==="running";n++)game=gameReducer(game,{type:"tick",runId:game.runId});
  assert.equal(game.status,"won");assert.equal(game.moves,turns.length);
 }
});
