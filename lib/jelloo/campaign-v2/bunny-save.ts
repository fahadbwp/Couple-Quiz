import {validateCampaignV2Schema,type CharacterWorldsSave,type StorageReader,type StorageWriter} from "../campaign-save";
import {bunnyLevel,bunnyScore,BUNNY_REVISION} from "./bunny-provider";
import {initialGame,tracePath,type GameState} from "../engine";
import {recordLevelResult,evaluateLevelAccess} from "../campaign";
export const BUNNY_SAVE_KEY="jelloo.campaign.bunny4.v1";
export type BunnyJourney={revision:typeof BUNNY_REVISION;levelId:number;rotations:number[];moves:number;status:GameState["status"];cursor:number;runId:number};
export interface BunnySave extends CharacterWorldsSave {contentRevision:typeof BUNNY_REVISION;journey?:BunnyJourney;}
const availability=(id:string)=>id==="candy_land"?"available" as const:"planned" as const;
function object(x:unknown):x is Record<string,unknown>{return !!x&&typeof x==="object"&&!Array.isArray(x)}
function keys(x:Record<string,unknown>,allowed:string[]){return Object.keys(x).every(k=>allowed.includes(k))}
function integer(x:unknown,max:number){return typeof x==="number"&&Number.isSafeInteger(x)&&x>=0&&x<=max}
export function restoreBunnyGame(save:BunnySave):GameState|null {
 const j=save.journey;if(!j)return null;
 if(!object(j)||!keys(j,["revision","levelId","rotations","moves","status","cursor","runId"])||j.revision!==BUNNY_REVISION||!integer(j.levelId,50)||j.levelId<1||j.levelId!==save.currentLevelId)throw new Error("Unsupported saved puzzle");
 if(!evaluateLevelAccess(j.levelId,save.completed,save.best,availability).accessible)throw new Error("Saved level is locked");
 const level=bunnyLevel(j.levelId),game=initialGame(level);
 if(!Array.isArray(j.rotations)||j.rotations.length!==level.tiles.length||!integer(j.moves,level.moveLimit)||!integer(j.cursor,level.tiles.length)||!integer(j.runId,1e9)||!["editing","running","blocked","won","lost"].includes(j.status))throw new Error("Invalid saved state");
 let cost=0;
 game.tiles=level.tiles.map((t,i)=>{
  const rotation=j.rotations[i],editable=!t.locked&&["straight","corner","tee"].includes(t.kind);
  if(!integer(rotation,t.rotation+j.moves)||rotation<t.rotation||(!editable&&rotation!==t.rotation))throw new Error("Invalid saved rotation");
  cost+=rotation-t.rotation;return {...t,rotation};
 });
 if(cost!==j.moves)throw new Error("Saved moves do not match rotations");
 const trace=tracePath(level,game.tiles);
 if(j.status==="running"||j.status==="won") {
  if(trace.outcome!=="home"||j.cursor>=trace.path.length||(j.status==="won"&&j.cursor!==trace.path.length-1))throw new Error("Invalid saved route");
  game.trace=trace;
 }else if(j.cursor!==0)throw new Error("Invalid saved cursor");
 if(j.status==="lost"&&(j.moves!==level.moveLimit||trace.outcome==="home"))throw new Error("Invalid saved loss");
 if(["editing","blocked"].includes(j.status)&&j.moves>=level.moveLimit)throw new Error("Move limit already exhausted");
 Object.assign(game,{moves:j.moves,status:j.status,cursor:j.cursor,runId:j.runId});
 if(j.status==="won"&&(save.completed<j.levelId||(save.best[String(j.levelId)]??0)<bunnyScore(game).stars))throw new Error("Unrecorded saved victory");
 return game;
}
export function validBunnySave(value:unknown):value is BunnySave {
 if(!object(value)||value.contentRevision!==BUNNY_REVISION||!keys(value,["version","campaignId","completed","currentLevelId","best","motion","muted","createdAt","updatedAt","contentRevision","journey"]))return false;
 const {contentRevision,journey,...base}=value;void contentRevision;void journey;
 if(!validateCampaignV2Schema(base)||base.completed>50||base.currentLevelId>50||Object.keys(base.best).length!==base.completed)return false;
 for(let id=1;id<=base.completed;id++)if(!base.best[String(id)])return false;
 try{restoreBunnyGame(value as unknown as BunnySave);return true}catch{return false}
}
export function readBunnySave(store:StorageReader) {
 let raw:string|null;try{raw=store.getItem(BUNNY_SAVE_KEY)}catch{return {status:"storage_unavailable" as const,error:"Storage unavailable"}}
 if(raw===null)return {status:"missing" as const};
 try{if(raw.length>50000)throw new Error();const save:unknown=JSON.parse(raw);if(!validBunnySave(save))throw new Error();return {status:"ready" as const,save,raw};}
 catch{return {status:"corrupt" as const,raw,error:"Unsupported or damaged Bunny save was preserved"}}
}
function write(store:StorageWriter,save:BunnySave,expected:string|null) {
 if(!validBunnySave(save))return {success:false as const,error:"Puzzle state could not be verified"};
 const raw=JSON.stringify(save);
 try {
  if(store.getItem(BUNNY_SAVE_KEY)!==expected)return {success:false as const,error:"Progress changed in another tab. Reload before continuing."};
  store.setItem(BUNNY_SAVE_KEY,raw);
  if(store.getItem(BUNNY_SAVE_KEY)!==raw)return {success:false as const,error:"Progress changed during saving. Reload before continuing."};
  return {success:true as const,save,raw};
 }catch{return {success:false as const,error:"Progress could not be saved. Existing campaigns are preserved."}}
}
/** UI callers serialize writes using a Web Lock. Never touches previous save keys. */
export function initializeBunnySave(store:StorageWriter) {
 const previous=readBunnySave(store);if(previous.status==="ready")return {success:true as const,save:previous.save,raw:previous.raw};
 if(previous.status!=="missing")return {success:false as const,error:"Existing Bunny data needs attention and was preserved"};
 const now=new Date().toISOString();
 return write(store,{version:2,campaignId:"character_worlds_v2",contentRevision:BUNNY_REVISION,completed:0,currentLevelId:1,best:{},motion:true,muted:true,createdAt:now,updatedAt:now},null);
}
export function persistBunnyAttempt(store:StorageWriter,save:BunnySave,expected:string,game:GameState) {
 const level=bunnyLevel(game.level.id);
 if(JSON.stringify(game.level)!==JSON.stringify({...level,choices:{}}))return {success:false as const,error:"Puzzle revision mismatch"};
 let next={...save};
 if(game.status==="won") {
  const trace=tracePath(level,game.tiles);
  if(JSON.stringify(trace)!==JSON.stringify(game.trace)||trace.outcome!=="home"||game.cursor!==trace.path.length-1)return {success:false as const,error:"Victory could not be verified"};
  const recorded=recordLevelResult(level.id,bunnyScore(game).stars,save.completed,save.best,availability);
  if(!recorded.success)return {success:false as const,error:recorded.error};
  next={...next,completed:recorded.newCompleted,best:recorded.newBest};
 }
 next={...next,currentLevelId:level.id,updatedAt:new Date().toISOString(),journey:{revision:BUNNY_REVISION,levelId:level.id,rotations:game.tiles.map(t=>t.rotation),moves:game.moves,status:game.status,cursor:game.cursor,runId:game.runId}};
 return write(store,next,expected);
}
