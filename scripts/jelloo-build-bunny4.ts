// Offline content authoring tool: emits candidates only after engine/solver checks.
import {writeFileSync} from "node:fs";
import {buildAuthoredLevel, WORLD_1_SPECS, type AuthoredLevelSpec} from "../lib/jelloo/campaign-v2/archive-1-0-2/world1-specs";
import {solvePowerLevel} from "../lib/jelloo/power-solver";
import {tracePath,neighbour,type Direction,type Level,type Tile} from "../lib/jelloo/engine";
import {compareLevels,computeCanonicalSignature} from "../lib/jelloo/campaign-v2/structural-comparator";
let seed=270028;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const shuffled=<T>(a:T[])=>a.map(v=>({v,r:random()})).sort((a,b)=>a.r-b.r).map(x=>x.v);
function randomRoute(length:number) {const visit=(path:number[]):number[]|null=>{if(path.length===length)return path;for(const n of shuffled(([0,1,2,3] as Direction[]).map(d=>neighbour(path.at(-1)!,d,4)).filter((x):x is number=>x!==null&&!path.includes(x)))){const r=visit([...path,n]);if(r)return r;}return null};return visit([Math.floor(random()*16)])!;}
function detourFor(route:number[]) {
 for(const i of shuffled(Array.from({length:route.length-3},(_,i)=>i+1)))for(const j of shuffled(Array.from({length:route.length-i-2},(_,j)=>i+j+1))) {
  const a=route[i],b=route[j],forbidden=new Set(route);
  const visit=(path:number[]):number[]|null=>{
   if(path.length>7)return null;
   for(const next of shuffled(([0,1,2,3] as Direction[]).map(d=>neighbour(path.at(-1)!,d,4)).filter((n):n is number=>n!==null))) {
    if(next===b&&path.length-1>j-i-1&&path.length>=3)return path.slice(1);
    if(forbidden.has(next)||path.includes(next)||route.length+path.length>16)continue;
    const found=visit([...path,next]);if(found)return found;
   }return null;
  };const path=visit([a]);if(path)return {branchTile:a,rejoinTile:b,detourRoute:path,collectible:path[0]};
 }return null;
}
export function clickPlan(level:Level,solution:Tile[],wanted:number):number[]|null {
 const groups=level.tiles.flatMap((t,i)=>{const count=(solution[i].rotation-t.rotation+4)%4;return count?[Array.from({length:count},()=>i)]:[]});
 for(let attempt=0;attempt<120;attempt++) {
  const order=attempt===0?groups:shuffled(groups);let board=level.tiles.map(t=>({...t}));const clicks:number[]=[];let invalid=false;
  for(const group of order){for(const index of group){board=board.map((t,i)=>i===index?{...t,rotation:t.rotation+1}:t);clicks.push(index);const walk=tracePath(level,board);if(walk.outcome==="home") {const n=level.collectibles!.filter(i=>walk.path.includes(i)).length;if(n===wanted)return clicks;invalid=true;break;}}if(invalid)break;}
 }return null;
}
type Item={spec:AuthoredLevelSpec;level:Level;par:number;starPar:number;short:number[];stars:number[];shortPath:number[];starPath:number[]};
const accepted:Item[]=[];const signatures=new Set<string>();let tries=0;
for(let id=1;id<=50;id++) {
 let found:Item|null=null;
 for(let trial=0;trial<30000&&!found;trial++) {
  tries++;const band=Math.floor((id-1)/10), route=id<=5?[...WORLD_1_SPECS[id-1].route]:randomRoute(6+Math.floor(random()*3)+Math.min(2,band));
  const detour=id<=5?undefined:detourFor(route);if(id>5&&!detour)continue;
  const union=new Set([...route,...(detour?.detourRoute??[])]);
  const gaps=id===5?[5]:id%5===0 ? route.slice(1,-1).filter((cell,i)=>{const prev=route[i],next=route[i+2];return Math.abs(prev-next)===2&&Math.floor(prev/4)===Math.floor(next/4)||Math.abs(prev-next)===8}).filter(cell=>cell!==detour?.branchTile&&cell!==detour?.rejoinTile).slice(0,1):[];
  if(id%5===0&&!gaps.length)continue;
  const collectibles=detour ? [detour.detourRoute[0],detour.detourRoute.at(-1)!] : route.slice(1,-1).filter(c=>!gaps.includes(c)).filter((_,i)=>i%2===0).slice(0,2);
  if(new Set(collectibles).size!==2)continue;
  const scramble=Object.fromEntries([...union].filter(c=>c!==route[0]&&c!==route.at(-1)&&!gaps.includes(c)).map(c=>[c,1+Math.floor(random()*3)]));
  const decoys=shuffled(Array.from({length:16},(_,i)=>i).filter(c=>!union.has(c))).slice(0,Math.min(3,band+1)).map(index=>({index,kind:"corner" as const,rotation:Math.floor(random()*4)}));
  const spec:AuthoredLevelSpec={id,size:4,title:WORLD_1_SPECS[id-1].title,hint:detour?"Choose the direct path, or take the golden-star trail.":"Connect the cream path and guide Bunny home.",route,gaps,collectibles,scramble,decoys,detour:detour?{...detour,scramble}:undefined};
  let level:Level;try{level=buildAuthoredLevel(spec)}catch{continue}
  if(tracePath(level,level.tiles).outcome==="home")continue;
  const proof=solvePowerLevel(level),short=solvePowerLevel({...level,collectibles:[]});
  const min=id<=5?3:3+band*2;
  if(!proof.solvable||!short.solution||!proof.solution||proof.par<min||proof.par>min+7||proof.starPar>proof.par+10)continue;
  if(detour&&(proof.starPar<=proof.par||proof.trace.path.length<=short.trace.path.length||level.collectibles!.some(c=>short.trace.path.includes(c))))continue;
  if(gaps.length&&solvePowerLevel(level,null).solvable)continue;
  const signature=computeCanonicalSignature(level);if(signatures.has(signature))continue;
  let repeats=false;
  for(const item of accepted){for(const ar of [proof.parPath,proof.trace.path])for(const br of [item.shortPath,item.starPath]){const c=compareLevels(level,ar,item.level,br);if(c.sameCoreRoute||c.jaccardSimilarity>=.85)repeats=true;}if(repeats)break;}
  if(repeats)continue;
  const shortClicks=clickPlan(level,short.solution,detour?0:2),starClicks=clickPlan(level,proof.solution,2);if(!shortClicks||!starClicks)continue;
  if(starClicks.length!==proof.starPar||shortClicks.length!==proof.par)continue;
  found={spec,level,par:proof.par,starPar:proof.starPar,short:shortClicks,stars:starClicks,shortPath:tracePath(level,short.solution).path,starPath:proof.trace.path};signatures.add(signature);
 }
 if(!found)throw new Error(`Could not certify distinct 4x4 Level ${id} after ${tries} attempts`);
 accepted.push(found);console.log(`Level ${id}: ${found.par}/${found.starPar}, ${found.shortPath.length}/${found.starPath.length} cells, attempts=${tries}`);
 writeFileSync("docs/jelloo/character-worlds/bunny4-authoring-candidates.json",JSON.stringify(accepted,null,2));
}
