import { buildTutorial, type TutorialSpec } from "./levels";
import { neighbour, ports, type Character, type Direction, type Level } from "./engine";
import { auditPowerLevel, solvePowerLevel } from "./power-solver";

export function characterForLevel(id:number):Character|null {
  if(id<=10 || id%2===0) return null;
  const pool:Character[]=["bunny","panda",...(id>20 ? ["cat" as const] : []),...(id>30 ? ["octopus" as const] : []),...(id>40 ? ["fox" as const] : [])];
  const base=id<21 ? 11 : id<31 ? 21 : id<41 ? 31 : 41;
  return pool[(Math.floor((id-base)/2)+pool.length-1)%pool.length];
}
export function isPowerIntro(id:number) {return [11,13,21,31,41].includes(id);}

// Different silhouettes, not just a different colour on the same path.
const introScaffolds = [
  [12,8,4,5,6,2,3],
  [0,4,8,9,10,14,15],
  [3,2,1,5,9,8,12],
];

function applyMechanic(level:Level,route:number[],character:Character,random:()=>number) {
  level.powerVersion=4;level.character=character;
  const cells=route.slice(2,-2);
  if(character==="bunny") {
    const options=cells.filter(i=>level.tiles[i].kind==="straight");
    if(!options.length) return false;
    const gap=options[Math.floor(random()*options.length)];
    level.tiles[gap]={kind:"blank",rotation:0,terrain:"gap"};
  } else if(character==="panda") {
    const trigger=route[Math.floor(route.length/3)],gate=route[Math.floor(route.length*2/3)];
    level.tiles[trigger].terrain="cracked";level.gate={tile:gate,trigger};
  } else if(character==="cat" || character==="octopus") {
    level.tiles[cells[Math.floor(random()*cells.length)]].terrain=character==="cat" ? "wall" : "water";
    if(character==="cat") level.tiles[route.at(-2)!].terrain="slow";
  } else {
    const isValidDecoy=(i:number,d:Direction)=>{
      if(ports(level.tiles[i]).includes(d)) return false;
      const decoy=neighbour(i,d,level.size);
      if(decoy===null || route.includes(decoy)) return false;
      const beyond=neighbour(decoy,d,level.size);
      return beyond===null || (!route.includes(beyond) && level.tiles[beyond].kind==="blank");
    };
    const options=cells.filter(i=>level.tiles[i].kind==="corner" && ([0,1,2,3] as Direction[]).some(d=>isValidDecoy(i,d)));
    if(!options.length) return false;
    const tile=options[Math.floor(random()*options.length)],step=route.indexOf(tile),required=ports(level.tiles[tile]);
    const incoming=([0,1,2,3] as Direction[]).find(d=>neighbour(tile,d,level.size)===route[step-1])!;
    const outgoing=required.find(d=>d!==incoming)!;
    const extra=([0,1,2,3] as Direction[]).find(d=>isValidDecoy(tile,d))!;
    const rotation=[0,1,2,3].find(r=>[...required,extra].every(d=>ports({kind:"tee",rotation:r}).includes(d)));
    if(rotation===undefined) return false;
    level.tiles[tile]={kind:"tee",rotation,locked:true};
    const decoy=neighbour(tile,extra,level.size)!;
    level.tiles[decoy]={kind:"straight",rotation:extra%2===0 ? 1 : 0,locked:true};
    level.fork={tile,exits:[outgoing,extra].sort()};
  }
  return true;
}

// A two-cell side path rejoins the main route. The power remains on the
// shared route; the necessity audit rejects any accidental power bypass.
function addStarDetour(level:Level,route:number[]) {
  for(let step=1;step<route.length-2;step++) {
    const a=route[step],b=route[step+1];
    if([a,b].some(i=>level.tiles[i].locked || level.tiles[i].terrain || level.gate?.tile===i)) continue;
    const direction=([0,1,2,3] as Direction[]).find(d=>neighbour(a,d,level.size)===b)!;
    for(const side of [(direction+1)%4,(direction+3)%4] as Direction[]) {
      const x=neighbour(a,side,level.size),y=neighbour(b,side,level.size);
      if(x===null || y===null || [x,y].some(i=>level.tiles[i].kind!=="blank" || level.tiles[i].terrain)) continue;
      const extended=[...route.slice(0,step+1),x,y,...route.slice(step+1)];
      const alternative=buildTutorial({id:level.id,size:level.size,route:extended,scramble:{},title:level.title,hint:level.hint},true);
      const rotations=[a,b].map(i=>[0,1,2,3].find(r=>[...ports(level.tiles[i]),...ports(alternative.tiles[i])].every(d=>ports({kind:"tee",rotation:r}).includes(d))));
      if(rotations.some(r=>r===undefined)) continue;
      [a,b].forEach((i,n)=>{level.tiles[i]={...level.tiles[i],kind:"tee",rotation:rotations[n]!};});
      level.tiles[x]=alternative.tiles[x];level.tiles[y]=alternative.tiles[y];
      return true;
    }
  }
  return false;
}

export function generatePowerPuzzle(id:number,seed:number) {
  const character=characterForLevel(id);
  if(!character) throw new Error("Not a power slot");
  let value=(seed^Math.imul(id,3266489917))>>>0;
  const random=()=>{value=(Math.imul(value,1664525)+1013904223)>>>0;return value/4294967296;};
  const tier=Math.min(3,Math.floor((id-11)/10));
  const intro=isPowerIntro(id);
  for(let attempt=0;attempt<6000;attempt++) {
    let route:number[],size:number;
    if(intro) {route=[...introScaffolds[[11,13,21,31,41].indexOf(id)%introScaffolds.length]];size=4;}
    else {
      size=5;route=[Math.floor(random()*25)];
      while(route.length<12+2*tier) {
        const options=([0,1,2,3] as Direction[]).map(d=>neighbour(route.at(-1)!,d,size)).filter((n):n is number=>n!==null && !route.includes(n));
        if(!options.length) break;
        route.push(options[Math.floor(random()*options.length)]);
      }
      if(route.length<12+2*tier) continue;
    }
    const spec:TutorialSpec={id,size,route,scramble:{},title:`${character[0].toUpperCase()+character.slice(1)} ${intro ? "says hello" : "adventure"}`,hint:"Connect the path and use your pal’s power."};
    const level=buildTutorial(spec,true);
    level.intro=intro;
    if(!applyMechanic(level,route,character,random)) continue;
    if(!intro && !addStarDetour(level,route)) continue;
    const protectedBlank = level.fork && character === "fox" ? (() => {
      const { tile, exits } = level.fork;
      const extra = exits.find(d => { const n = neighbour(tile, d, level.size); return n !== null && !route.includes(n); });
      if (extra === undefined) return null;
      const decoy = neighbour(tile, extra, level.size);
      return decoy !== null ? neighbour(decoy, extra, level.size) : null;
    })() : null;
    if(!intro) for(let i=0;i<level.tiles.length;i++) {
      if(i !== protectedBlank && level.tiles[i].kind==="blank" && !level.tiles[i].terrain && random()<.45) {
        level.tiles[i]={kind:random()<.5 ? "corner" : "straight",rotation:Math.floor(random()*4)};
      }
    }
    const editable=intro ? route.slice(1,-1).findLast(i=>!level.tiles[i].locked && ["straight","corner"].includes(level.tiles[i].kind)) : undefined;
    level.collectibles=[route.at(-2)!];
    level.intro=intro;level.difficulty=intro ? "Meet your pal" : ["Curious","Twisty","Tricky","Expert"][tier];
    for(let i=0;i<level.tiles.length;i++) {
      const tile=level.tiles[i];
      if(["straight","corner","tee"].includes(tile.kind) && !tile.locked) {
        if(intro) {tile.locked=i!==editable;if(i===editable) tile.rotation+=3;}
        else tile.rotation+=random()<.5 ? 1 : 3;
      }
    }
    if(!intro) {
      // First find the cheap/short routes without rewards. A star must tempt
      // the player away from both, not sit on the unavoidable home corridor.
      level.collectibles=[];
      const direct=solvePowerLevel(level);
      if(!direct.solvable) continue;
      const candidates=level.tiles.map((_,i)=>i).filter(i=>level.tiles[i].kind!=="blank" && !direct.parPath.includes(i) && !direct.shortestPath.includes(i));
      let placed=false;
      for(const star of candidates) {
        level.collectibles=[star];
        const detour=solvePowerLevel(level);
        if(!detour.solvable || !Number.isFinite(detour.starPar) || detour.starPar<=detour.par || detour.trace.path.length<=direct.shortestPath.length) continue;
        if(tier>=1) {
          const second=detour.trace.path.slice(1,-2).find(i=>i!==star);
          if(second===undefined) continue;
          level.collectibles.push(second);
        }
        placed=true;break;
      }
      if(!placed) continue;
    }
    const own=solvePowerLevel(level);
    if(!own.solvable || !Number.isFinite(own.starPar) || (!intro && own.par<6+tier*5)) continue;
    const proof=auditPowerLevel(level);
    if(!proof.necessary) continue;
    level.par=proof.par;
    if(!intro) level.moveLimit=proof.starPar+Math.max(2,5-tier);
    return {level,proof};
  }
  throw new Error("No verified power puzzle within search budget. Retry with another seed.");
}
