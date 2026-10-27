import test from "node:test";
import assert from "node:assert/strict";
import {BUNNY_SAVE_KEY,initializeBunnySave,persistBunnyAttempt,readBunnySave,restoreBunnyGame,type BunnySave} from "../lib/jelloo/campaign-v2/bunny-save";
import {bunnyLevel} from "../lib/jelloo/campaign-v2/bunny-provider";
import {BUNNY_PLANS} from "../lib/jelloo/campaign-v2/bunny-specs";
import {initialGame,gameReducer} from "../lib/jelloo/engine";
class Store {data=new Map<string,string>();getItem(k:string){return this.data.get(k)??null}setItem(k:string,v:string){this.data.set(k,v)}removeItem(k:string){this.data.delete(k)}}
function fresh(){const store=new Store();store.setItem("jelloo.progress.v1","legacy bytes");store.setItem("jelloo.campaign.v2","previous world bytes");const init=initializeBunnySave(store);assert(init.success);return {store,...init}}
test("new Bunny campaign restores every editing/running/won board while preserving previous campaigns",()=>{
 const setup=fresh();let {save,raw}=setup;const {store}=setup;
 for(let id=1;id<=50;id++) {
  let game=initialGame(bunnyLevel(id));
  for(const index of BUNNY_PLANS[id].stars){game=gameReducer(game,{type:"rotate",index});const write=persistBunnyAttempt(store,save,raw,game);assert(write.success,`edit ${id}`);save=write.save;raw=write.raw;assert.deepEqual(restoreBunnyGame(save)!.tiles,game.tiles);assert.equal(restoreBunnyGame(save)!.moves,game.moves)}
  game=gameReducer(game,{type:"auto",runId:game.runId,moves:game.moves});
  while(game.status==="running") {
   const write=persistBunnyAttempt(store,save,raw,game);assert(write.success,`running ${id}`);save=write.save;raw=write.raw;
   const restored=restoreBunnyGame(save)!;assert.equal(restored.cursor,game.cursor);assert.deepEqual(restored.trace,game.trace);
   game=gameReducer(restored,{type:"tick",runId:restored.runId});
  }
  assert.equal(game.status,"won");const write=persistBunnyAttempt(store,save,raw,game);assert(write.success,`win ${id}`);save=write.save;raw=write.raw;
  assert.equal(restoreBunnyGame(save)!.status,"won");assert.equal(save.completed,id);assert.equal(save.best[id],3);
  if(id>5) {
   let short=initialGame(bunnyLevel(id));
   for(const index of BUNNY_PLANS[id].short)short=gameReducer(short,{type:"rotate",index});
   short=gameReducer(short,{type:"auto",runId:short.runId,moves:short.moves});
   while(short.status==="running")short=gameReducer(short,{type:"tick",runId:short.runId});
   assert.equal(short.status,"won");
   const lower=persistBunnyAttempt(store,save,raw,short);assert(lower.success);save=lower.save;raw=lower.raw;
   assert.equal(save.best[id],3,"A one-star replay must preserve the earned three-star best");
  }

 }
 assert.equal(Object.values(save.best).reduce((a,b)=>a+b,0),150);
 assert.equal(store.getItem("jelloo.progress.v1"),"legacy bytes");assert.equal(store.getItem("jelloo.campaign.v2"),"previous world bytes");
});
test("corrupt and unknown new-revision saves are held without overwrite or reset",()=>{
 const {store,save,raw}=fresh();const game=gameReducer(initialGame(bunnyLevel(1)),{type:"rotate",index:BUNNY_PLANS[1].stars[0]});
 const write=persistBunnyAttempt(store,save,raw,game);assert(write.success);
 const broken:Array<(s:BunnySave)=>void>=[s=>{s.contentRevision="future" as typeof s.contentRevision},s=>{s.journey!.rotations[0]++},s=>{s.journey!.moves++},s=>{s.journey!.cursor=999},s=>{s.journey!.levelId=2},s=>{s.journey!.status="won"},s=>{s.journey!.revision="future" as NonNullable<BunnySave["journey"]>["revision"]},s=>{s.journey!.rotations.push(0)}];
 for(const mutate of broken){const bad:BunnySave=structuredClone(write.save);mutate(bad);const bytes:string=JSON.stringify(bad);store.setItem(BUNNY_SAVE_KEY,bytes);assert.equal(readBunnySave(store).status,"corrupt");assert(!initializeBunnySave(store).success);assert.equal(store.getItem(BUNNY_SAVE_KEY),bytes)}
});
test("stale writers and lost states never award progress; retry creates a fresh attempt",()=>{
 const {store,save,raw}=fresh();let game=initialGame(bunnyLevel(1));
 for(let i=0;i<game.level.moveLimit!;i++)game=gameReducer(game,{type:"rotate",index:BUNNY_PLANS[1].stars[0]});
 assert.equal(game.status,"lost");const written=persistBunnyAttempt(store,save,raw,game);assert(written.success);assert.equal(written.save.completed,0);assert.deepEqual(written.save.best,{});assert.equal(restoreBunnyGame(written.save)!.status,"lost");
 assert(!persistBunnyAttempt(store,save,raw,game).success);
 const retry=gameReducer(restoreBunnyGame(written.save)!,{type:"reset"});assert.equal(retry.moves,0);assert.equal(retry.status,"editing");
 const saved=persistBunnyAttempt(store,written.save,written.raw,retry);assert(saved.success);assert.equal(readBunnySave(store).status,"ready");
});


test("Bunny replay never lowers earned stars and unsupported storage never claims a saved result",()=>{
 const {store,save,raw}=fresh();let game=initialGame(bunnyLevel(1));
 for(const index of BUNNY_PLANS[1].stars)game=gameReducer(game,{type:"rotate",index});
 game=gameReducer(game,{type:"auto",runId:game.runId,moves:game.moves});
 while(game.status==="running")game=gameReducer(game,{type:"tick",runId:game.runId});
 const won=persistBunnyAttempt(store,save,raw,game);assert(won.success);
 const fail={getItem(){throw Error("denied")},setItem(){throw Error("denied")},removeItem(){throw Error("denied")}};
 assert.equal(readBunnySave(fail).status,"storage_unavailable");assert(!initializeBunnySave(fail).success);
 assert(!persistBunnyAttempt(fail,won.save,won.raw,game).success);
 assert.equal(won.save.best[1],3);
 const retry=gameReducer(game,{type:"reset"});
 const saved=persistBunnyAttempt(store,won.save,won.raw,retry);assert(saved.success);
 assert.equal(saved.save.best[1],3);assert.equal(saved.save.completed,1);
 const blocked=initialGame(bunnyLevel(50));assert(!persistBunnyAttempt(store,saved.save,saved.raw,blocked).success);
 assert.equal(store.getItem(BUNNY_SAVE_KEY),saved.raw);
});
