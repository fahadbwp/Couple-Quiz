import {decodeJourney,SAVE_KEY} from "./progress";
import {DAILY_SAVE_KEY,decodeDailyStore,generateDailyLevel} from "./daily";
import {ZEN_SAVE_KEY,decodeZenStore,generateZenLevel} from "./zen";
import {PAL_SAVE_KEY,FAVOURITE_PAL_KEY,decodePalStars,pals} from "./pals";
import {COSMETICS_KEY,decodeCosmetics} from "./cosmetics";

export const TRANSFER_KEYS=[SAVE_KEY,DAILY_SAVE_KEY,ZEN_SAVE_KEY,PAL_SAVE_KEY,FAVOURITE_PAL_KEY,COSMETICS_KEY] as const;
export const BACKUP_KEY="jelloo.transfer.backup.v1",JOURNAL_KEY="jelloo.transfer.journal.v1";
export type Saves=Partial<Record<typeof TRANSFER_KEYS[number],string>>;
export type Snapshot=Record<typeof TRANSFER_KEYS[number],string|null>;
export type Store=Pick<Storage,"getItem"|"setItem"|"removeItem">;
export type Transfer={format:"playnudge-save-transfer";version:1;createdAt:string;sourceOrigin:string;saves:Saves};
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==="object"&&!Array.isArray(v);
const keys=(v:Record<string,unknown>,allowed:readonly string[])=>Object.keys(v).every(k=>allowed.includes(k));
const int=(v:unknown,max=Number.MAX_SAFE_INTEGER):v is number=>typeof v==="number"&&Number.isSafeInteger(v)&&v>=0&&v<=max;
function date(v:unknown):v is string{return typeof v==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;}
function rotations(v:unknown,size:number){return Array.isArray(v)&&v.length===size&&v.every(n=>int(n,3));}
function choices(v:unknown,level:ReturnType<typeof generateDailyLevel>){return v===undefined||object(v)&&Object.entries(v).every(([k,n])=>level.fork&&k===String(level.fork.tile)&&level.fork.exits.includes(n as never));}
export function snapshot(store:Store):Snapshot{return Object.fromEntries(TRANSFER_KEYS.map(k=>[k,store.getItem(k)])) as Snapshot;}
function validate(saves:Saves){
 if(!object(saves)||!keys(saves,TRANSFER_KEYS)||Object.values(saves).some(v=>typeof v!=="string"))throw Error("Unknown or invalid save fields. Quiz and referral data are never accepted.");
 const raw=saves[SAVE_KEY],journey=raw&&decodeJourney(raw);
 if(!journey)throw Error("A valid Adventure save is required. Nothing has been changed.");
 // Preserve raw Adventure bytes, including historical generator revisions.
 const adventure=JSON.parse(raw!);
 if(!keys(adventure,["version","generator","multiRevision","rules","muted","best","seed","completed","motion","id","moves","rotations","choices","won","jellies"]))throw Error("Adventure contains unknown fields.");
 if(adventure.rotations.some((r:number,i:number)=>r!==journey.game.tiles[i].rotation))throw Error("Adventure contains inconsistent fixed-tile rotations.");
 if(saves[DAILY_SAVE_KEY]!==undefined){
  const text=saves[DAILY_SAVE_KEY]!;if(text.length>32768)throw Error("Daily save too large.");const s:unknown=JSON.parse(text);
  if(!object(s)||!keys(s,["version","currentStreak","maxStreak","lastCompletedDate","history","activeDate","activeRotations","activeMoves","activeChoices"])||s.version!==1||!int(s.currentStreak,100000)||!int(s.maxStreak,100000)||s.maxStreak<s.currentStreak||!date(s.activeDate)||s.lastCompletedDate!==undefined&&!date(s.lastCompletedDate)||!object(s.history)||Object.keys(s.history).length>90)throw Error("Invalid Daily save.");
  const active=generateDailyLevel(s.activeDate);
  if(s.activeRotations!==undefined&&!rotations(s.activeRotations,active.tiles.length)||s.activeMoves!==undefined&&!int(s.activeMoves)||!choices(s.activeChoices,active))throw Error("Invalid Daily board.");
  for(const [day,entry]of Object.entries(s.history)){
   if(!date(day)||!object(entry)||!keys(entry,["date","won","moves","stars","rotations","choices","completedAt"])||entry.date!==day||typeof entry.won!=="boolean"||!int(entry.moves)||!int(entry.stars,3)||!rotations(entry.rotations,generateDailyLevel(day).tiles.length)||!choices(entry.choices,generateDailyLevel(day))||entry.completedAt!==undefined&&(typeof entry.completedAt!=="string"||!Number.isFinite(Date.parse(entry.completedAt))))throw Error("Invalid Daily history.");
  }
  decodeDailyStore(text,s.activeDate);
 }
 if(saves[ZEN_SAVE_KEY]!==undefined){
  const text=saves[ZEN_SAVE_KEY]!;if(text.length>8192)throw Error("Zen save too large.");const s:unknown=JSON.parse(text);
  if(!object(s)||!keys(s,["version","size","world","solvedCount","seed","activeRotations","activeMoves"])||s.version!==1||![4,5,6].includes(Number(s.size))||!int(s.size)||!int(s.solvedCount,1000000)||!int(s.seed,0xffffffff)||s.seed<1||s.activeMoves!==undefined&&!int(s.activeMoves))throw Error("Invalid Zen save.");
  const decoded=decodeZenStore(text,journey.completed);
  if(decoded.world!==s.world||decoded.size!==s.size||s.activeRotations!==undefined&&!rotations(s.activeRotations,generateZenLevel(decoded.size,decoded.seed,decoded.world).tiles.length))throw Error("Invalid or locked Zen board.");
 }
 if(saves[PAL_SAVE_KEY]!==undefined){const raw=saves[PAL_SAVE_KEY]!;if(!decodePalStars(raw)||!keys(JSON.parse(raw),["version","stars"]))throw Error("Invalid Trial medals.");}
 if(saves[FAVOURITE_PAL_KEY]!==undefined&&!pals.some(p=>p.id===saves[FAVOURITE_PAL_KEY]))throw Error("Invalid Favourite Pal.");
 if(saves[COSMETICS_KEY]!==undefined&&!decodeCosmetics(saves[COSMETICS_KEY]!))throw Error("Invalid cosmetic preferences.");
 return {completed:journey.completed,level:journey.game.level.id,stars:Object.values(journey.best).reduce((a,b)=>a+b,0),rules:journey.rules,multiRevision:journey.multiRevision??0};
}
export function exportProgress(store:Store,sourceOrigin:string,createdAt=new Date().toISOString()):string{
 const saves=Object.fromEntries(Object.entries(snapshot(store)).filter(([,v])=>v!==null)) as Saves;validate(saves);
 const origin=new URL(sourceOrigin);if(origin.origin!==sourceOrigin||!["https:","http:"].includes(origin.protocol))throw Error("Invalid origin.");
 return JSON.stringify({format:"playnudge-save-transfer",version:1,createdAt,sourceOrigin,saves} satisfies Transfer,null,2);
}
export function parseTransfer(raw:string):Transfer{
 if(raw.length>65536)throw Error("File exceeds 64 KB.");const v:unknown=JSON.parse(raw);
 if(!object(v)||Object.keys(v).sort().join()!=="createdAt,format,saves,sourceOrigin,version"||v.format!=="playnudge-save-transfer"||v.version!==1||typeof v.createdAt!=="string"||!Number.isFinite(Date.parse(v.createdAt))||typeof v.sourceOrigin!=="string"||new URL(v.sourceOrigin).origin!==v.sourceOrigin||!/^https?:/.test(v.sourceOrigin)||!object(v.saves))throw Error("Unsupported transfer file.");
 validate(v.saves as Saves);return v as Transfer;
}
function pristine(key:string,raw:string){
 try{
  if(key===SAVE_KEY){const j=decodeJourney(raw);return !!j&&j.completed===0&&j.game.level.id===1&&j.game.moves===0&&Object.keys(j.best).length===0&&j.game.tiles.every((t,i)=>t.rotation===j.game.level.tiles[i].rotation);}
  if(key===DAILY_SAVE_KEY){const s=JSON.parse(raw);return object(s)&&keys(s,["version","currentStreak","maxStreak","lastCompletedDate","history","activeDate","activeRotations","activeMoves","activeChoices"])&&s.version===1&&date(s.activeDate)&&s.currentStreak===0&&s.maxStreak===0&&object(s.history)&&Object.keys(s.history).length===0&&!s.activeMoves&&!s.activeRotations&&!s.lastCompletedDate;}
  if(key===ZEN_SAVE_KEY){const s=JSON.parse(raw);return object(s)&&keys(s,["version","size","world","solvedCount","seed","activeRotations","activeMoves"])&&s.version===1&&[4,5,6].includes(Number(s.size))&&int(s.seed,0xffffffff)&&s.seed>0&&["meadow","beach","snow","candy","space"].includes(String(s.world))&&s.solvedCount===0&&!s.activeMoves&&!s.activeRotations;}
  if(key===PAL_SAVE_KEY){const s=decodePalStars(raw);return s!==null&&Object.keys(s).length===0;}
  if(key===COSMETICS_KEY){const s=decodeCosmetics(raw);return s!==null&&!s.crown&&!s.dream&&!s.legendary;}
 }catch{}return false;
}
export function previewImport(transfer:Transfer,current:Snapshot){
 const summary=validate(transfer.saves);
 const conflicts=TRANSFER_KEYS.filter(k=>transfer.saves[k]!==undefined&&current[k]!==null&&transfer.saves[k]!==current[k]&&!pristine(k,current[k]!));
 return {...summary,conflicts,slots:Object.keys(transfer.saves),sourceOrigin:transfer.sourceOrigin,createdAt:transfer.createdAt,current};
}
type Journal={version:1;before:Snapshot;after:Saves};
function journal(raw:string):Journal{
 if(raw.length>196608)throw Error("Recovery journal too large.");const v:unknown=JSON.parse(raw);
 if(!object(v)||v.version!==1||!keys(v,["version","before","after"])||!object(v.before)||Object.keys(v.before).sort().join()!==[...TRANSFER_KEYS].sort().join()||Object.values(v.before).some(x=>x!==null&&typeof x!=="string")||!object(v.after)||!keys(v.after,TRANSFER_KEYS)||Object.values(v.after).some(x=>typeof x!=="string"))throw Error("Invalid local recovery journal. Existing data is preserved.");
 return v as Journal;
}
export function recoverImport(store:Store){
 const raw=store.getItem(JOURNAL_KEY);if(!raw)return;
 const j=journal(raw);let conflict=false;
 for(const key of TRANSFER_KEYS){if(j.after[key]===undefined)continue;const current=store.getItem(key);if(current===j.before[key])continue;if(current!==j.after[key]){conflict=true;continue;}if(j.before[key]===null)store.removeItem(key);else store.setItem(key,j.before[key]!);}
 if(conflict)throw Error("Another tab changed progress. Recovery kept that data; your pre-import backup is retained. Stop and export both copies for review.");
 store.removeItem(JOURNAL_KEY);
}
export function applyImport(store:Store,transfer:Transfer,expected:Snapshot){
 parseTransfer(JSON.stringify(transfer));
 if(store.getItem(JOURNAL_KEY))throw Error("Recover the interrupted import first.");
 const current=snapshot(store);if(JSON.stringify(current)!==JSON.stringify(expected))throw Error("Progress changed after preview. Close other game tabs and preview again.");
 const plan=previewImport(transfer,current);if(plan.conflicts.length)throw Error("Import blocked: existing different progress must not be overwritten.");
 const backup=JSON.stringify({version:1,before:current,after:transfer.saves} satisfies Journal);
 // Never overwrite an older recovery backup: owner can download it first.
 if(backup.length>196608)throw Error("Destination backup too large. Nothing has changed.");
 const prior=store.getItem(BACKUP_KEY);if(prior!==null&&prior!==backup)throw Error("A prior import backup exists. Download it and use a fresh browser profile; it has not been overwritten.");
 store.setItem(BACKUP_KEY,backup);if(store.getItem(BACKUP_KEY)!==backup)throw Error("Backup could not be verified. Import cancelled.");
 store.setItem(JOURNAL_KEY,backup);
 try{
  for(const key of TRANSFER_KEYS){if(transfer.saves[key]===undefined)continue;if(store.getItem(key)!==current[key])throw Error("Another tab changed progress during import.");store.setItem(key,transfer.saves[key]!);if(store.getItem(key)!==transfer.saves[key])throw Error("Save write verification failed.");}
  store.removeItem(JOURNAL_KEY);
 }catch(error){try{recoverImport(store);}catch{throw Error("Import interrupted. Backup and recovery journal retained. Close other game tabs and use Recover interrupted import.");}throw error;}
}
