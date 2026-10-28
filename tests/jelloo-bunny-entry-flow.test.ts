import test from "node:test";
import assert from "node:assert/strict";
import {bunnyResume,bunnyScreen} from "../lib/jelloo/campaign-v2/bunny-entry";
import {initializeBunnySave,persistBunnyAttempt,BUNNY_SAVE_KEY,type BunnySave} from "../lib/jelloo/campaign-v2/bunny-save";
import {bunnyLevel} from "../lib/jelloo/campaign-v2/bunny-provider";
import {BUNNY_PLANS} from "../lib/jelloo/campaign-v2/bunny-specs";
import {initialGame,gameReducer} from "../lib/jelloo/engine";
import {usesBunnyShell,jellooEntryHref} from "../lib/jelloo/campaign-v2/routes";
class Store{data=new Map<string,string>();getItem(k:string){return this.data.get(k)??null}setItem(k:string,v:string){this.data.set(k,v)}removeItem(k:string){this.data.delete(k)}}
function setup(){const store=new Store();store.setItem("jelloo.campaign.v2","old-world-bytes");store.setItem("jelloo.progress.v1","old-adventure-bytes");const init=initializeBunnySave(store);assert(init.success);return {store,...init}}
test("fresh entry opens Level 1 without a welcome gate and repeated initialization preserves all revisions",()=>{
 const {store,save,raw}=setup();assert.deepEqual(bunnyResume(save),{view:"play",level:1});
 assert.deepEqual(initializeBunnySave(store),{success:true,save,raw});
 assert.equal(store.getItem("jelloo.campaign.v2"),"old-world-bytes");assert.equal(store.getItem("jelloo.progress.v1"),"old-adventure-bytes");
 const corrupt="{broken";store.setItem(BUNNY_SAVE_KEY,corrupt);assert(!initializeBunnySave(store).success);assert.equal(store.getItem(BUNNY_SAVE_KEY),corrupt);
});
test("entry resumes unfinished and lost boards; verified wins advance to the next playable board",()=>{
 const {store,save,raw}=setup();let game=initialGame(bunnyLevel(1));
 game=gameReducer(game,{type:"rotate",index:BUNNY_PLANS[1].stars[0]});
 const edit=persistBunnyAttempt(store,save,raw,game);assert(edit.success);assert.deepEqual(bunnyResume(edit.save),{view:"play",level:1});
 for(const index of BUNNY_PLANS[1].stars.slice(1))game=gameReducer(game,{type:"rotate",index});
 game=gameReducer(game,{type:"auto",runId:game.runId,moves:game.moves});
 while(game.status==="running")game=gameReducer(game,{type:"tick",runId:game.runId});
 const win=persistBunnyAttempt(store,edit.save,edit.raw,game);assert(win.success);assert.deepEqual(bunnyResume(win.save),{view:"play",level:2});
 game=initialGame(bunnyLevel(2));while(game.status!=="lost")game=gameReducer(game,{type:"rotate",index:BUNNY_PLANS[2].stars[0]});
 const lost=persistBunnyAttempt(store,win.save,win.raw,game);assert(lost.success);assert.deepEqual(bunnyResume(lost.save),{view:"play",level:2});
});
test("star-gated continuation opens Levels and completed Bunny opens Worlds without unlocking unbuilt content",()=>{
 const {save}=setup();const gate:BunnySave={...save,completed:19,currentLevelId:19,best:Object.fromEntries(Array.from({length:19},(_,i)=>[i+1,i<5?3:1]))};
 assert.deepEqual(bunnyResume(gate),{view:"levels"});
 const complete:BunnySave={...save,completed:50,currentLevelId:50,best:Object.fromEntries(Array.from({length:50},(_,i)=>[i+1,3]))};
 assert.deepEqual(bunnyResume(complete),{view:"worlds"});assert.equal(complete.completed,50);
});
test("immersive shell is restricted to current character worlds; Quiz and historical Adventure retain their header",()=>{
 for(const path of ["/jelloo/character-worlds","/jelloo/character-worlds/bunny"])assert(usesBunnyShell(path));
 for(const path of ["/quiz","/jelloo","/jelloo/map","/jelloo/character-worlds/previous"])assert(!usesBunnyShell(path));
});

test("active level URL preserves the victory screen when completion changes the next resume destination",()=>{
 const before=bunnyScreen({view:"play",level:2},"2",null);
 const after=bunnyScreen({view:"play",level:3},"2",null);
 assert.deepEqual(after,before);assert.equal(after.level,2);assert.equal(after.canonicalize,false);
 const direct=bunnyScreen({view:"play",level:2},null,null);assert(direct.canonicalize);assert.equal(direct.level,2);
 assert.equal(bunnyScreen({view:"play",level:2},null,"levels").view,"levels");
 assert.equal(bunnyScreen({view:"worlds"},null,null).view,"worlds");
 assert(Number.isNaN(bunnyScreen({view:"play",level:1},"invalid",null).level));
});

test("local game discovery enters direct play while released production links remain unchanged",()=>{
 assert.equal(jellooEntryHref("development"),"/jelloo/character-worlds");
 for(const mode of ["production","test",undefined])assert.equal(jellooEntryHref(mode),"/jelloo/map");
});
