import {validRecord,type AnalyticsRecord,type EventName} from "./schema";
const DAY=86400000;
const day=(n:number)=>Math.floor(n/DAY);
export function growthReport(input:unknown,now=Date.now(),continuousCoverage=false){
 const seen=new Set<string>();
 const events=Array.isArray(input)?input.filter(validRecord).filter(r=>{const key=r.visitor+":"+r.dedupe;if(seen.has(key)||r.timestamp>now||r.timestamp<now-30*DAY)return false;seen.add(key);return true;}):[];
 const count=(name:EventName)=>events.filter(r=>r.name===name).length;
 const active=(days:number)=>events.length?new Set(events.filter(r=>day(r.timestamp)>=day(now)-days+1).map(r=>r.visitor)).size:null;
 const sessionIDs=new Set(events.map(r=>r.session));
 const today=events.filter(r=>day(r.timestamp)===day(now));
 const newIDs=new Set(today.filter(r=>day(r.firstSeen)===day(now)).map(r=>r.visitor));
 const returningIDs=new Set(today.filter(r=>day(r.firstSeen)<day(now)).map(r=>r.visitor));
 const observedSpans=[...sessionIDs].map(id=>{const stamps=events.filter(r=>r.session===id).map(r=>r.timestamp);return (Math.max(...stamps)-Math.min(...stamps))/1000;});
 const funnel=(from:number,to:number)=>{
  const visitors=(level:number)=>new Set(events.filter(r=>r.name==="adventure_level_complete"&&r.properties.level===level).map(r=>r.visitor));
  const start=visitors(from),end=visitors(to);return {from,to,started:start.size,observedBoth:[...start].filter(v=>end.has(v)).length,rate:start.size?[...start].filter(v=>end.has(v)).length/start.size:null};
 };
 const retention=(offset:number)=>{
  if(!continuousCoverage)return null;
  const first=new Map<string,number>();for(const e of events)first.set(e.visitor,Math.min(first.get(e.visitor)??Infinity,e.firstSeen));
  const eligible=[...first].filter(([,date])=>day(date)>=day(now)-29&&day(date)+offset<day(now));
  if(!eligible.length)return null;
  const retained=eligible.filter(([id,date])=>events.some(e=>e.visitor===id&&day(e.timestamp)===day(date)+offset)).length;
  return {eligible:eligible.length,retained,rate:retained/eligible.length};
 };
 const starts=count("adventure_level_start"),wins=count("adventure_level_complete");
 const boardStarts=new Set(events.filter(r=>r.name==="adventure_level_start").map(r=>`${r.visitor}:${r.properties.level}`));
 const boardWins=new Set(events.filter(r=>r.name==="adventure_level_complete").map(r=>`${r.visitor}:${r.properties.level}`));
 const matched=[...boardStarts].filter(k=>boardWins.has(k)).length;
 return {eventCount:events.length,anonymousActiveBrowsers:{daily:active(1),weekly:active(7),monthly:active(30)},newToday:events.length?newIDs.size:null,returningToday:events.length?returningIDs.size:null,sessions:events.length?sessionIDs.size:null,pageVisits:count("page_view"),gameStarts:count("game_start"),levelStarts:starts,levelWins:wins,completionRate:boardStarts.size?matched/boardStarts.size:null,level1To10:funnel(1,10),level10To30:funnel(10,30),dailyStarts:count("daily_start"),dailyWins:count("daily_complete"),trialsStarted:count("power_trial_start"),quiz:{created:count("quiz_create_complete"),shared:count("quiz_share_action"),participantStarts:count("quiz_participant_start"),participantCompletions:count("quiz_participant_complete")},meanObservedSessionSpanSeconds:observedSpans.length?observedSpans.reduce((a,b)=>a+b,0)/observedSpans.length:null,d1:retention(1),d7:retention(7)};
}
export function exportEvents(events:AnalyticsRecord[]){return JSON.stringify(events.filter(validRecord),null,2);}
