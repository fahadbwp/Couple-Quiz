import {writeFileSync} from 'node:fs';
import {WORLD_1_SPECS,buildAuthoredLevel,type AuthoredLevelSpec} from '../lib/jelloo/campaign-v2/world1-specs';
import {solvePowerLevel} from '../lib/jelloo/power-solver';
import {neighbour,type Direction} from '../lib/jelloo/engine';
import {compareLevels} from '../lib/jelloo/campaign-v2/structural-comparator';
let seed=310127;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const existing=WORLD_1_SPECS.filter(s=>s.id!==43&&s.id!==45).map(s=>{const level=buildAuthoredLevel(s),p=solvePowerLevel(level);return {level,routes:[p.parPath,p.trace.path]}});
const selected:AuthoredLevelSpec[]=[];
for(const id of [43,45]) {
 for(let attempt=0;attempt<12000;attempt++) {
  const route=[Math.floor(random()*25)],length=17+Math.floor(random()*4);
  while(route.length<length) {
   const next=([0,1,2,3] as Direction[]).map(d=>neighbour(route.at(-1)!,d,5)).filter((i):i is number=>i!==null&&!route.includes(i));
   if(!next.length)break;
   route.push(next[Math.floor(random()*next.length)]);
  }
  if(route.length!==length)continue;
  let detour:AuthoredLevelSpec['detour'];
  if(id===43) {
   for(let k=2;k<route.length-3;k++) {
    const a=route[k],b=route[k+1];
    for(const d of [0,1,2,3] as Direction[]) {
     const u=neighbour(a,d,5),v=neighbour(b,d,5);
     if(u!==null&&v!==null&&!route.includes(u)&&!route.includes(v)) {detour={branchTile:a,detourRoute:[u,v],rejoinTile:b,collectible:u,scramble:{[u]:2,[v]:2}};break;}
    }
    if(detour)break;
   }
   if(!detour)continue;
  }
  const spec:AuthoredLevelSpec={id,size:5,title:id===43?'Glaze Garden Crossing':'Truffle Switchback',hint:id===43?'Choose the garden loop to collect the golden star.':'Plan the turns through the winding truffle trail.',route,detour,scramble:{}};
  let level;
  try{level=buildAuthoredLevel(spec)}catch{continue}
  let cost=0;
  for(const cell of route.slice(1,-1)) {
   const t=level.tiles[cell];
   // Default +1 gives 3-click corners; tune a mix of 1/2/3-click corners.
   spec.scramble![cell]=t.kind==='straight'?1:(random()<0.55?1:random()<0.5?2:3);
   if(t.kind==='tee')spec.scramble![cell]=0;
   cost+=t.kind==='straight'?1:4-(spec.scramble![cell]||4);
  }
  if(cost<27||cost>35)continue;
  level=buildAuthoredLevel(spec);
  const p=solvePowerLevel(level);
  if(!p.solvable||p.exhausted||p.par<27||p.par>32||!Number.isFinite(p.starPar)||(id===43&&p.starPar<=p.par))continue;
  const routes=[p.parPath,p.trace.path];
  if(existing.some(o=>routes.some(r=>o.routes.some(q=>{const c=compareLevels(level,r,o.level,q);return c.isDuplicate||c.sameCoreRoute||c.jaccardSimilarity>=0.85}))))continue;
  selected.push(spec);existing.push({level,routes});
  console.log(JSON.stringify({id,attempt,par:p.par,starPar:p.starPar,route}));break;
 }
 if(!selected.some(s=>s.id===id))throw Error(`No accepted candidate for ${id}`);
}
writeFileSync('docs/jelloo/character-worlds/world1-redesign-candidates.json',JSON.stringify(selected,null,2));
