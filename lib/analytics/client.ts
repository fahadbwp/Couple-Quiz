import {validEvent,validRecord,type AnalyticsRecord,type EventName,type EventProperties} from "./schema";
// No production ingest, identifier or collection until a separately reviewed release.
export const ANALYTICS_ENABLED:boolean=false;
export const ANALYTICS_KEY="playnudge.analytics.local.v1",CONSENT_KEY="playnudge.analytics.consent.v1";
const SESSION_KEY="playnudge.analytics.session.v1";
export const RETENTION_MS=30*86400000,MAX_RECORDS=3000;
type Identity={visitor:string;firstSeen:number};
export class AnalyticsRecorder {
 private pending=new Set<string>();
 constructor(private options:{enabled:()=>boolean;consented:()=>boolean;identity:()=>Identity&{session:string};read:()=>AnalyticsRecord[];write:(records:AnalyticsRecord[])=>void;now:()=>number}){}
 async emit(name:EventName,properties:EventProperties={},key:string=name):Promise<boolean>{
  try{
   if(!this.options.enabled()||!this.options.consented()||!validEvent(name,properties)||typeof key!=="string"||key.length>2048)return false;
   const now=this.options.now(),identity=this.options.identity();
   const input=new TextEncoder().encode(name+":"+key);
   const digest=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",input)),b=>b.toString(16).padStart(2,"0")).join("");
   if(this.pending.has(digest))return false;
   this.pending.add(digest);
   try{
    // Re-check consent after the asynchronous hash, before writing anything.
    if(!this.options.enabled()||!this.options.consented())return false;
    const records=this.options.read().filter(r=>validRecord(r)&&r.timestamp>=now-RETENTION_MS&&r.timestamp<=now);
    if(records.some(r=>r.dedupe===digest))return false;
    const record:AnalyticsRecord={version:1,name,properties:{...properties},timestamp:now,...identity,dedupe:digest};
    if(!validRecord(record))return false;
    this.options.write([...records,record].slice(-MAX_RECORDS));return true;
   }finally{this.pending.delete(digest);}
  }catch{return false;}
 }
}
const localAllowed=()=>typeof window!=="undefined"&&process.env.NODE_ENV==="development";
function consent(){return localAllowed()&&localStorage.getItem(CONSENT_KEY)==="yes"&&navigator.doNotTrack!=="1"&&!(navigator as Navigator&{globalPrivacyControl?:boolean}).globalPrivacyControl;}
export function readLocalEvents():AnalyticsRecord[]{
 if(!localAllowed())return [];
 try{const raw=localStorage.getItem(ANALYTICS_KEY);if(!raw||raw.length>2000000)return [];const records=JSON.parse(raw).records;return Array.isArray(records)?records.filter(validRecord).filter(r=>r.timestamp>=Date.now()-RETENTION_MS&&r.timestamp<=Date.now()).slice(-MAX_RECORDS):[];}catch{return [];}
}
function identity(){
 const now=Date.now();let saved:Identity|undefined;
 try{const s=JSON.parse(localStorage.getItem(ANALYTICS_KEY)??"null");if(s&&typeof s.visitor==="string"&&/^[a-f0-9-]{36}$/.test(s.visitor)&&Number.isSafeInteger(s.firstSeen)&&s.firstSeen<=now&&s.firstSeen>=now-RETENTION_MS)saved={visitor:s.visitor,firstSeen:s.firstSeen};}catch{}
 if(!saved)saved={visitor:crypto.randomUUID(),firstSeen:now};
 let session:{id:string;last:number}|undefined;
 try{const s=JSON.parse(sessionStorage.getItem(SESSION_KEY)??"null");if(s&&typeof s.id==="string"&&/^[a-f0-9-]{36}$/.test(s.id)&&Number.isFinite(s.last)&&s.last<=now&&now-s.last<1800000)session=s;}catch{}
 session={id:session?.id??crypto.randomUUID(),last:now};sessionStorage.setItem(SESSION_KEY,JSON.stringify(session));
 localStorage.setItem(ANALYTICS_KEY,JSON.stringify({...saved,records:readLocalEvents()}));
 return {...saved,session:session.id};
}
const recorder=new AnalyticsRecorder({enabled:localAllowed,consented:consent,identity,read:readLocalEvents,write:records=>{const s=JSON.parse(localStorage.getItem(ANALYTICS_KEY)!);localStorage.setItem(ANALYTICS_KEY,JSON.stringify({visitor:s.visitor,firstSeen:s.firstSeen,records}));},now:Date.now});
export function trackEvent(name:EventName,properties:EventProperties={},key?:string){void recorder.emit(name,properties,key).catch(()=>{});}
export function trackSessionEvent(name:EventName,properties:EventProperties={},key=""){if(!localAllowed())return;try{if(!consent())return;const s=identity();trackEvent(name,properties,s.session+":"+key);}catch{}}
export function setLocalAnalyticsConsent(allowed:boolean){
 if(!localAllowed())return;
 try{if(!allowed){localStorage.removeItem(ANALYTICS_KEY);sessionStorage.removeItem(SESSION_KEY);}localStorage.setItem(CONSENT_KEY,allowed?"yes":"no");}catch{}
}
