// Local evidence generation only; never modifies application content or saves.
import {writeFileSync} from "node:fs";
import {allBunnyLevels,bunnyScore} from "../lib/jelloo/campaign-v2/bunny-provider";
import {BUNNY_PLANS,BUNNY_SPECS} from "../lib/jelloo/campaign-v2/bunny-specs";
import {initialGame,gameReducer,tracePath,type Level,type Tile} from "../lib/jelloo/engine";
import {solvePowerLevel} from "../lib/jelloo/power-solver";
import {computeTurnSequence,auditBatchUniqueness} from "../lib/jelloo/campaign-v2/structural-comparator";
let seed=28;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
function plan(level:Level,solution:Tile[]) {
 const groups=level.tiles.flatMap((t,i)=>{const n=(solution[i].rotation-t.rotation+4)%4;return n?[Array.from({length:n},()=>i)]:[]});
 for(let attempt=0;attempt<200;attempt++) {
  const order=attempt?groups.map(g=>({g,r:random()})).sort((a,b)=>a.r-b.r).map(x=>x.g):groups;
  let game=initialGame(level);const clicks:number[]=[];
  for(const index of order.flat()) {
   game=gameReducer(game,{type:"rotate",index});clicks.push(index);
   game=gameReducer(game,{type:"auto",runId:game.runId,moves:game.moves});
   if(game.status==="running")break;
  }
  while(game.status==="running")game=gameReducer(game,{type:"tick",runId:game.runId});
  if(game.status==="won"&&bunnyScore(game).stars===2)return clicks;
 }
 return null;
}
const levels=allBunnyLevels();
const rows=levels.map(level=>{
 const id=level.id,proof=solvePowerLevel(level),spec=BUNNY_SPECS[id-1];
 const two:number[][]=[];const outcomes:string[]=[];
 for(const omit of level.collectibles!) {
  const constrained={...level,collectibles:level.collectibles!.filter(c=>c!==omit),tiles:level.tiles.map((t,i)=>i===omit?{kind:"blank" as const,rotation:0}:t)};
  const solved=solvePowerLevel(constrained);if(solved.exhausted)throw Error("Unknown two-star search");
  if(!solved.solvable||!Number.isFinite(solved.starPar)||!solved.solution){outcomes.push("impossible without excluded pickup");continue}
  const solution=solved.solution.map((t,i)=>i===omit?level.tiles[i]:t),walk=tracePath(level,solution);
  const clicks=walk.outcome==="home"&&level.collectibles!.filter(c=>walk.path.includes(c)).length===1?plan(level,solution):null;
  outcomes.push(clicks?"certified one-pickup click route":"route requires review");if(clicks)two.push(clicks);
 }
 return {id,revision:level.contentRevision,columns:level.columns,rows:level.rows,start:level.start,home:level.home,pickups:level.collectibles,decoys:spec.decoys?.length??0,branches:spec.detour?2:0,jumpRequired:!!spec.gaps?.length,par:proof.par,starPar:proof.starPar,limit:level.moveLimit,shortRoute:proof.parPath,starRoute:proof.trace.path,shortTurns:computeTurnSequence(proof.parPath,4).filter(t=>t!=="S").length,starTurns:computeTurnSequence(proof.trace.path,4).filter(t=>t!=="S").length,shortClicks:BUNNY_PLANS[id].short,starClicks:BUNNY_PLANS[id].stars,twoStarClicks:two,twoStarOutcomes:outcomes};
});
const similarity=auditBatchUniqueness(levels.map(level=>({level})));
writeFileSync("docs/jelloo/character-worlds/bunny4-inventory.json",JSON.stringify({rows,similarity},null,2));
console.log(JSON.stringify({levels:rows.length,pairs:1225,duplicates:similarity.duplicates.length,nearDuplicates:similarity.nearDuplicates.length,twoStarLevels:rows.filter(r=>r.twoStarClicks.length).map(r=>r.id),review:rows.filter(r=>r.twoStarOutcomes.includes("route requires review")).map(r=>r.id)},null,2));
