import test from "node:test";
import assert from "node:assert/strict";
import {formatShareCard,generateMultiJellyGrid} from "../lib/jelloo/share";
import {trialSelection,trialUrl} from "../lib/jelloo/trial-navigation";

test("visible Trial Back resolves to selection; stored Trial URLs restore the exact unlocked Pal and trial",()=>{
 const selection=trialUrl(null);
 assert.equal(selection,"/jelloo/pals");assert.equal(trialSelection(new URL(selection,"https://qa.test").search,90),null);
 for(const pal of ["panda","cat"] as const)for(const trial of [1,2,3]){
  const url=trialUrl(pal,trial);assert.deepEqual(trialSelection(new URL(url,"https://qa.test").search,90),{pal,trial});
 }
 assert.equal(trialSelection("?pal=panda&trial=1",9),null);
 assert.equal(trialSelection("?pal=invalid&trial=1",90),null);
 assert.deepEqual(trialSelection("?pal=panda&trial=2junk",90),{pal:"panda",trial:1});
});

test("incomplete or invalid team paths use a decorative graphic, never partial route records",()=>{
 for(const jellies of [
  [{character:"bunny" as const,path:[0,1]},{character:"panda" as const}],
  [{character:"bunny" as const,path:[0,1]},{character:"panda" as const,path:[16]}],
  [{character:"bunny" as const,path:[0,1]},{character:"panda" as const,path:[1.5]}],
 ]) {
  assert.equal(generateMultiJellyGrid(4,jellies),"✨ 🐾 🎉 🐾 ✨");
  const card=formatShareCard({mode:"adventure",levelId:71,moves:6,stars:2,collectedStars:1,totalStars:2,character:"bunny",world:"candy",size:4,path:[],jellies});
  assert.match(card.fullMessage,/Team Celebration Graphic/);assert.doesNotMatch(card.fullMessage,/Routes:/);
 }
});

test("real two- and three-Jelly cards preserve identity, stars, moves and supplied paths",()=>{
 for(const count of [2,3]){
  const jellies=[{character:"bunny" as const,path:[0,1]},{character:"panda" as const,path:[4,5]},{character:"cat" as const,path:[8,9]}].slice(0,count);
  const card=formatShareCard({mode:"adventure",levelId:count===2?71:91,moves:7,stars:3,collectedStars:2,totalStars:2,character:"fox",world:"candy",size:4,path:[],jellies});
  assert.match(card.fullMessage,/7 moves/);assert.match(card.fullMessage,/★★★/);assert.match(card.fullMessage,/Bunny/);assert.match(card.fullMessage,/Panda/);assert.doesNotMatch(card.fullMessage,/Fox/);
  assert.match(card.fullMessage,/Routes:/);assert.equal(card.fullMessage.includes("Cat"),count===3);
 }
});
