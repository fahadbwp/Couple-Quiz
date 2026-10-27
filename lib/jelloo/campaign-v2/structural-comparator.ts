import {ports, type Level} from "../engine";
import {solvePowerLevel} from "../power-solver";

type Point = [number, number];
const point = (i: number, size: number): Point => [Math.floor(i/size), i%size];
function transform([r,c]: Point, symmetry: number): Point {
  if (symmetry >= 4) c = -c;
  for(let n=0;n<symmetry%4;n++) [r,c]=[c,-r];
  return [r,c];
}
function normalized(route: number[], size: number, symmetry: number): Point[] {
  const points=route.map(i=>transform(point(i,size),symmetry));
  const r=Math.min(...points.map(p=>p[0])), c=Math.min(...points.map(p=>p[1]));
  return points.map(([y,x])=>[y-r,x-c]);
}

/** Ordered route, normalized for translation and all eight square symmetries.
 * Jump lengths are retained. Start-to-home reversal is deliberately distinct. */
export function computeRouteSignature(route: number[], size: number): string {
  return Array.from({length:8},(_,s)=>JSON.stringify(normalized(route,size,s))).sort()[0];
}
export function computeTurnSequence(route: number[], size: number): string[] {
  const result: string[]=[];
  for(let i=1;i<route.length-1;i++) {
    const [ar,ac]=point(route[i-1],size), [br,bc]=point(route[i],size), [cr,cc]=point(route[i+1],size);
    const dr=br-ar, dc=bc-ac, er=cr-br, ec=cc-bc;
    const cross=dc*er-dr*ec, dot=dr*er+dc*ec;
    result.push(cross>0 ? "R" : cross<0 ? "L" : dot>0 ? "S" : "U");
  }
  return result;
}
function turnSignature(route: number[], size: number): string {
  const sequence=computeTurnSequence(route,size).join("");
  const reflected=sequence.replace(/[LR]/g,c=>c==="L"?"R":"L");
  return [sequence,reflected].sort()[0];
}

/** Complete topology signature, independent of title, level ID and scramble.
 * Free tile orientation is excluded intentionally; locked and endpoint ports are
 * transformed. Terrain, stars, gates, doors and fork exits remain significant.
 * This compares the supported single-pal topology, not every possible solution. */
export function computeCanonicalSignature(level: Level, route?: number[]): string {
  if(route?.some(i=>!Number.isInteger(i)||i<0||i>=level.tiles.length)) throw new Error("Invalid route cell");
  const active=level.tiles.flatMap((t,i)=>t.kind!=="blank"||t.terrain ? [i] : []);
  return Array.from({length:8},(_,symmetry)=>{
    const points=active.map(i=>transform(point(i,level.size),symmetry));
    const minR=Math.min(...points.map(p=>p[0])), minC=Math.min(...points.map(p=>p[1]));
    const at=(i:number)=>{const [r,c]=transform(point(i,level.size),symmetry);return [r-minR,c-minC];};
    const direction=(d:number)=>{
      const [r,c]=transform(([[ -1,0],[0,1],[1,0],[0,-1]] as Point[])[d],symmetry);
      return r<0?0:c>0?1:r>0?2:3;
    };
    const cells=active.map(i=>{
      const t=level.tiles[i];
      return {at:at(i),kind:t.kind,terrain:t.terrain??null,locked:!!t.locked,
        ports:t.locked||t.kind==="start"||t.kind==="home" ? ports(t).map(direction).sort() : null};
    }).sort((a,b)=>a.at[0]-b.at[0]||a.at[1]-b.at[1]);
    return JSON.stringify({size:level.size,character:level.character??null,powerVersion:level.powerVersion??null,foxRoute:level.foxRoute??null,cells,start:at(level.start),home:at(level.home),
      stars:(level.collectibles??[]).map(at).sort((a,b)=>a[0]-b[0]||a[1]-b[1]),
      gate:level.gate?{tile:at(level.gate.tile),trigger:at(level.gate.trigger)}:null,
      door:level.door?{tile:at(level.door.tile),switch:at(level.door.switch)}:null,
      fork:level.fork?{tile:at(level.fork.tile),exits:level.fork.exits.map(direction).sort()}:null});
  }).sort()[0];
}
function edges(points: Point[]): Set<string> {
  return new Set(points.slice(1).map((p,i)=>[points[i].join(":"),p.join(":")].sort().join("/")));
}
export interface SimilarityResult {
  levelA:number;levelB:number;isDuplicate:boolean;sameCoreRoute:boolean;
  jaccardSimilarity:number;sameTurnSequence:boolean;notes:string;
}
export function compareLevels(a:Level,routeA:number[],b:Level,routeB:number[]):SimilarityResult {
  const isDuplicate=computeCanonicalSignature(a)===computeCanonicalSignature(b);
  const sameCoreRoute=computeRouteSignature(routeA,a.size)===computeRouteSignature(routeB,b.size);
  const ea=edges(normalized(routeA,a.size,0));
  const jaccardSimilarity=Math.max(...Array.from({length:8},(_,s)=>{
    const eb=edges(normalized(routeB,b.size,s));
    const common=[...ea].filter(e=>eb.has(e)).length;
    return common/new Set([...ea,...eb]).size;
  }));
  const sameTurnSequence=turnSignature(routeA,a.size)===turnSignature(routeB,b.size);
  return {levelA:a.id,levelB:b.id,isDuplicate,sameCoreRoute,jaccardSimilarity,sameTurnSequence,
    notes:isDuplicate?"Equivalent complete topology":sameCoreRoute?"Same solution route despite other board differences":
      jaccardSimilarity>=0.85?"High route-edge overlap: review required":"Distinct sampled routes"};
}

/** Uses real minimum and all-star solver routes. It is not an exhaustive
 * enumeration of all equal-cost solutions; near matches require human review. */
export function auditBatchUniqueness(items:{level:Level;route?:number[]}[]) {
  const analyzed=items.map(({level})=>{
    const proof=solvePowerLevel(level);
    if(!proof.solvable||proof.exhausted||!Number.isFinite(proof.starPar)) throw new Error(`Cannot audit unverified level ${level.id}`);
    const routes=[proof.parPath,proof.trace.path].filter((r,i,a)=>i===0||JSON.stringify(r)!==JSON.stringify(a[0]));
    return {level,routes};
  });
  const duplicates:SimilarityResult[]=[], nearDuplicates:SimilarityResult[]=[];
  for(let i=0;i<analyzed.length;i++) for(let j=i+1;j<analyzed.length;j++) {
    const a=analyzed[i], b=analyzed[j];
    const comparisons=a.routes.flatMap(ra=>b.routes.map(rb=>compareLevels(a.level,ra,b.level,rb)));
    comparisons.sort((x,y)=>Number(y.isDuplicate)-Number(x.isDuplicate)||Number(y.sameCoreRoute)-Number(x.sameCoreRoute)||y.jaccardSimilarity-x.jaccardSimilarity);
    const cmp=comparisons[0];
    if(cmp.isDuplicate) duplicates.push(cmp);
    else if(cmp.sameCoreRoute||cmp.jaccardSimilarity>=0.85) nearDuplicates.push(cmp);
  }
  return {duplicates,nearDuplicates};
}
