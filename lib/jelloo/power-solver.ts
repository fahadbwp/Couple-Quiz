import { neighbour, ports, type Character, type Direction, type Level, type PowerState, type Tile, type Trace } from "./engine";

type SearchResult={solvable:boolean;par:number;starPar:number;exhausted:boolean;explored:number;solution:Tile[]|null;choices:Record<string,Direction>;trace:Trace};

// Search is over path, chosen orientations and power state, not just connected
// cells. Simple paths are an explicit game rule: returning to a cell is a loop.
function search(level:Level,tiles:readonly Tile[],character:Character|null,rotate:boolean,budget:number):SearchResult {
  let explored=0,par=Infinity,starPar=Infinity,solution:Tile[]|null=null,choices:Record<string,Direction>={};
  let bestTrace:Trace={path:[level.start],outcome:"disconnected",states:[{jumpUsed:false,broken:[],branches:{}}]};
  const visit=(at:number,incoming:Direction|undefined,path:number[],states:PowerState[],oriented:Tile[],moves:number) => {
    if(++explored>budget) return;
    const power=states.at(-1)!;
    if(path.length>bestTrace.path.length && bestTrace.outcome!=="home") bestTrace={path,outcome:"disconnected",states};
    const tile=oriented[at];
    if(tile.kind==="blank" || power.broken.includes(at)) return;
    if(tile.terrain==="water" && character!=="octopus" || tile.terrain==="wall" && character!=="cat") return;
    if(level.gate?.tile===at && !power.broken.includes(level.gate.trigger)) return;
    if(at===level.home) {
      if(tile.port!==incoming) return;
      par=Math.min(par,moves);
      const allStars=(level.collectibles ?? []).every(i=>path.includes(i));
      if(bestTrace.outcome!=="home" || allStars && moves<starPar) {
        solution=oriented;choices=power.branches;bestTrace={path,outcome:"home",states};
      }
      if(allStars) starPar=Math.min(starPar,moves);
      return;
    }
    const count=rotate && !tile.locked && tile.kind!=="start" ? 4 : 1;
    for(let r=0;r<count;r++) {
      const turned={...tile,rotation:tile.rotation+r},connections=ports(turned);
      if(incoming!==undefined && !connections.includes(incoming)) continue;
      let exits=connections.filter(d=>d!==incoming);
      if(level.fork?.tile===at) {
        if(character!=="fox") continue;
        exits=exits.filter(d=>level.fork!.exits.includes(d) && (rotate || level.choices?.[at]===d));
      }
      for(const exit of exits) {
        let next=neighbour(at,exit,level.size),jumpUsed=power.jumpUsed;
        if(next===null) continue;
        if(oriented[next].terrain==="gap") {
          if(character!=="bunny" || jumpUsed) continue;
          next=neighbour(next,exit,level.size);jumpUsed=true;
        }
        if(next===null || path.includes(next)) continue;
        const broken=tile.terrain==="cracked" && character==="panda" ? [...power.broken,at] : power.broken;
        const branches=level.fork?.tile===at ? {...power.branches,[at]:exit} : power.branches;
        const board=r ? oriented.map((t,i)=>i===at ? turned : t) : oriented;
        const entry=(exit+2)%4 as Direction;
        if(!rotate && !ports(board[next]).includes(entry)) continue;
        visit(next,entry,[...path,next],[...states,{jumpUsed,broken,branches}],board,moves+r);
      }
    }
  };
  visit(level.start,undefined,[level.start],[{jumpUsed:false,broken:[],branches:{}}],tiles.map(t=>({...t})),0);
  const exhausted=explored>budget;
  return {solvable:!exhausted && Number.isFinite(par),par:exhausted ? Infinity : par,starPar:exhausted ? Infinity : starPar,exhausted,explored,solution:exhausted ? null : solution,choices,trace:bestTrace};
}

export function solvePowerLevel(level:Level,character:Character|null=level.character ?? null,budget=100000) {
  return search(level,level.tiles,character,true,budget);
}
export function walkPowerLevel(level:Level,tiles:readonly Tile[]):Trace {
  return search(level,tiles,level.character ?? null,false,10000).trace;
}
export function auditPowerLevel(level:Level) {
  const own=solvePowerLevel(level);
  const alternatives=([null,"bunny","panda","cat","octopus","fox"] as const).filter(c=>c!==level.character).map(character=>({character,result:solvePowerLevel(level,character)}));
  const necessary=own.solvable && alternatives.every(a=>!a.result.exhausted && !a.result.solvable);
  return {...own,necessary,requiredCharacter:necessary ? level.character : null,alternatives};
}
