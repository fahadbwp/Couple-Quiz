import test from "node:test";
import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {createRequire} from "node:module";
import ts from "typescript";
import {levelAt} from "../lib/jelloo/endless";
import {decodeJourney,encodeJourney,newJourney,journeyReducer} from "../lib/jelloo/progress";
import {initialGame,gameReducer,type Level} from "../lib/jelloo/engine";
import {simulateMultiJelly,solveMultiJelly,twoJellyIntroFixture} from "../lib/jelloo/multi-jelly";

test("historical pre-Multi generator saves preserve boards, rotations and completed milestones",()=>{
 const source=execFileSync("git",["show","91e4e97:lib/jelloo/endless.ts"],{encoding:"utf8"});
 const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports:{levelAt?:typeof levelAt}={};
 new Function("require","exports",compiled)(createRequire(new URL("../lib/jelloo/endless.ts",import.meta.url)),exports);
 for(const id of [71,91]){
  const old=exports.levelAt!(id,42,4);
  assert.equal(old.jellies,undefined);
  assert.notDeepEqual(old.tiles,levelAt(id,42).tiles);
  const raw=JSON.parse(encodeJourney({...newJourney(42),completed:id-1,game:initialGame(old)}));
  delete raw.multiRevision;delete raw.jellies;
  raw.moves=1;const editable=old.tiles.findIndex(t=>!t.locked && t.kind==="corner");
  raw.rotations[editable]=(raw.rotations[editable]+1)%4;
  const restored=decodeJourney(JSON.stringify(raw))!;
  assert.ok(restored);assert.equal(restored.completed,id-1);
  assert.deepEqual(restored.game.level,initialGame(old).level);
  assert.deepEqual(restored.game.tiles.map(t=>t.rotation%4),raw.rotations);
  assert.deepEqual(decodeJourney(encodeJourney(restored)),restored);
  const next=journeyReducer({...restored,completed:id},{type:"visit",id:id+1});
  assert.equal(next.multiRevision,1);
 }
});
test("saved Jelly specifications reject corrupted fields and retain canonical valid data",()=>{
 const journey={...newJourney(42),completed:70,game:initialGame(levelAt(71,42))};
 const raw=JSON.parse(encodeJourney(journey));
 assert.ok(decodeJourney(JSON.stringify(raw)));
 for(const patch of [{start:-1},{home:999},{character:"dragon"},{color:"bad"},{extra:1}]){
  const bad=structuredClone(raw);Object.assign(bad.jellies[0],patch);
  assert.equal(decodeJourney(JSON.stringify(bad)),null);
 }
 for(const jellies of [null,[],[null],{},[raw.jellies[0],raw.jellies[0]]]){
  assert.equal(decodeJourney(JSON.stringify({...raw,jellies})),null);
 }
});
test("Multi solver distinguishes solved, impossible and exhausted and charges each quarter-turn",()=>{
 const level=twoJellyIntroFixture();
 assert.equal(solveMultiJelly(level,0).status,"unknown");
 const solved=solveMultiJelly(level);
 assert.equal(solved.status,"solved");assert.equal(solved.exhausted,false);
 const impossible={...level,tiles:level.tiles.map(t=>({...t,locked:true}))};
 assert.equal(solveMultiJelly(impossible).status,"impossible");
 let game=initialGame({...level,moveLimit:undefined});
 const index=game.tiles.findIndex(t=>!t.locked && t.kind==="corner");
 const rotation=game.tiles[index].rotation;
 for(let n=1;n<=4;n++){
  game=gameReducer(game,{type:"rotate",index});
  assert.equal(game.moves,n);assert.equal(game.tiles[index].rotation,rotation+n);
 }
});
export const junction:Level={id:71,title:"Water decoy",hint:"",size:4,start:13,home:11,
 jellies:[{character:"panda",start:13,home:11}],
 tiles:Array.from({length:16},(_,i)=>{
 if(i===13)return {kind:"start",rotation:0,port:0};
 if(i===11)return {kind:"home",rotation:0,port:3};
 if(i===9)return {kind:"tee",rotation:1};
 if(i===10)return {kind:"tee",rotation:0};
 if(i===5)return {kind:"corner",rotation:1,terrain:"water"};
 if(i===6)return {kind:"corner",rotation:2};
 return {kind:"blank",rotation:0};
 })};
test("junction reproduction: blocked water alternative must not hide the valid home route",()=>{
 assert.equal(simulateMultiJelly(junction,junction.tiles).multiOutcome,"home");
});
