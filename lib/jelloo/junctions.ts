import { ports, tracePath, type Level } from "./engine";
import { analyzePuzzle } from "./scoring";

export function addJunction(level:Level, solution:Level, minimum={minMoves:0,minLength:0,minTurns:0}, detour=false):Level {
  const route=tracePath(solution,solution.tiles).path;
  for(const index of route.slice(1,-1)) {
    const desired=ports(solution.tiles[index]);
    for(let rotation=0;rotation<4;rotation++) {
      if(!desired.every(d=>ports({kind:"tee",rotation}).includes(d))) continue;
      const solved={...solution,tiles:solution.tiles.map((t,i)=>i===index?{kind:"tee" as const,rotation}:t)};
      const traced=tracePath(solved,solved.tiles);
      if(traced.outcome!=="home" || !level.collectibles?.every(i=>traced.path.includes(i))) continue;
      const next={...level,tiles:level.tiles.map((t,i)=>i===index?{kind:"tee" as const,rotation:rotation+1}:t)};
      const a=analyzePuzzle(next);
      if(a.exhausted || !Number.isFinite(a.starMoves) || a.minMoves<minimum.minMoves || a.shortest<minimum.minLength || a.fewestTurns<minimum.minTurns || (detour && a.starMoves<=a.minMoves) || tracePath(next,next.tiles).outcome==="home") continue;
      const knownCost=traced.path.reduce((cost,i)=>{
        if(i===next.start || i===next.home) return cost;
        return cost+[0,1,2,3].find(r=>ports({...next.tiles[i],rotation:next.tiles[i].rotation+r}).every(d=>ports(solved.tiles[i]).includes(d)))!;
      },0);
      return {...next,moveLimit:Math.max(a.starMoves,knownCost)+4,hint:"Green paths are connected to Bunny. T-junctions branch; Bunny takes the shortest connected route home. Keep the stars on that route."};
    }
  }
  return level;
}
