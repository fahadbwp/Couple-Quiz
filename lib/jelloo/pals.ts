import { buildTutorial } from "./levels";
import { neighbour, ports, tracePath, type Character, type Direction, type GameState, type Level, type Tile } from "./engine";

export const pals: {id:Character;name:string;unlock:number;power:string}[] = [
  {id:"bunny",name:"Bunny",unlock:0,power:"Jump over one gap. Line up the landing path!"},
  {id:"panda",name:"Panda",unlock:10,power:"Break through cracked paths. They crumble behind Panda."},
  {id:"cat",name:"Cat",unlock:20,power:"Walk along walls and zip across sticky tiles."},
  {id:"octopus",name:"Octopus",unlock:30,power:"Swim across water paths that stop other pals."},
  {id:"fox",name:"Fox",unlock:40,power:"Choose the shortest route or a route with more stars."},
];
export const PAL_SAVE_KEY="jelloo.pals.v1";
export function canPlayPal(id:Character,completed:number) {return pals.some(p=>p.id===id && completed>=p.unlock);}
export function decodePalStars(raw:string|null):Record<string,number>|null {
  if(raw===null) return {};
  try {
    if(raw.length>2048) return null;
    const value=JSON.parse(raw);
    if(value.version!==1 || !value.stars || typeof value.stars!=="object" || Array.isArray(value.stars)) return null;
    const entries=Object.entries(value.stars);
    if(entries.length>15 || entries.some(([key,n])=>!pals.some(p=>[1,2,3].some(t=>key===`${p.id}-${t}`)) || typeof n!=="number" || !Number.isInteger(n) || n<1 || n>3)) return null;
    return value.stars;
  } catch {return null;}
}

const routes=[
  [20,15,10,11,12,7,2,3,4],
  [20,21,22,17,12,11,10,5,0,1,2,3,4],
  [20,15,10,5,0,1,6,11,16,17,18,13,8,3,4],
];
export function powerTrial(character:Character,trial:number,foxRoute:"shortest"|"stars"="stars") {
  if(!Number.isInteger(trial) || trial<1 || trial>3) throw new Error("Unknown power trial");
  const route=character==="fox" ? [20,15,10,11,16,17,12,7,2,3,4] : routes[trial-1];
  const solution=buildTutorial({id:trial,title:`${character} trial ${trial}`,hint:"",size:5,route,scramble:{}},true);
  const tiles=solution.tiles;
  if(character==="fox") {
    // The north shortcut saves two steps; the east detour earns a golden star.
    tiles[10]={kind:"tee",rotation:1}; // north, east, south
    tiles[5]={kind:"straight",rotation:1};
    tiles[0]={kind:"corner",rotation:1};
    tiles[1]={kind:"straight",rotation:0};
    tiles[2]={kind:"tee",rotation:2}; // east, south, west
    // Rotate the whole layout for the next trial, including fixed entry ports.
    for(let turn=1;turn<trial;turn++) {
      const before=tiles.map(t=>({...t}));
      before.forEach((t,i)=>{tiles[rotateCell(i)]={...t,rotation:t.rotation+1,port:t.port===undefined ? undefined : (t.port+1)%4 as Direction};});
      solution.start=rotateCell(solution.start);solution.home=rotateCell(solution.home);
    }
  } else if(character==="bunny") tiles[[15,17,10][trial-1]]={kind:"blank",rotation:0,terrain:"gap"};
  else {
    const at=route[3];
    tiles[at]={...tiles[at],terrain:character==="panda" ? "cracked" : character==="cat" ? "wall" : "water"};
    if(character==="cat") tiles[route[5]]={...tiles[route[5]],terrain:"slow"};
    if(trial>1 && character!=="cat") tiles[route[6]]={...tiles[route[6]],terrain:character==="panda" ? "cracked" : "water"};
  }
  let star=character==="fox" ? 12 : route.at(-3)!;
  if(character==="fox") for(let i=1;i<trial;i++) star=rotateCell(star);
  const scrambled=tiles.map((t,i)=>["straight","corner","tee"].includes(t.kind) ? {...t,rotation:t.rotation+(i%2 ? 1 : 3)} : {...t});
  // A known all-star solution is retained for validation and fair move targets.
  const cost=scrambled.reduce((sum,t,i)=>sum+(["straight","corner","tee"].includes(t.kind) ? [0,1,2,3].find(r=>samePorts({...t,rotation:t.rotation+r},tiles[i]))! : 0),0);
  const level:Level={...solution,tiles:scrambled,character,foxRoute,collectibles:[star],moveLimit:cost+2,difficulty:`Power trial ${trial}/3`,hint:pals.find(p=>p.id===character)!.power};
  return {level,solution:tiles};
}
function rotateCell(i:number) {return i%5*5+4-Math.floor(i/5);}
function samePorts(a:Tile,b:Tile) {const pa=ports(a),pb=ports(b);return pa.length===pb.length && pa.every(p=>pb.includes(p));}
export function powerStepDuration(game:GameState,animate:boolean) {
  if(!animate) return 100;
  const at=game.trace?.path[game.cursor];
  if(at!==undefined && game.tiles[at].terrain==="slow") return game.level.character==="cat" ? 210 : 840;
  return 420;
}

// Keep the original trial definitions reproducible, but use explicit current
// mechanics in the playable UI (no automatic Fox route optimization).
export function playablePowerTrial(character:Character,trial:number) {
  const {level,solution}=powerTrial(character,trial);
  const route=tracePath(level,solution).path;
  level.powerVersion=4;
  if(character==="panda") level.gate={trigger:solution.findIndex(t=>t.terrain==="cracked"),tile:route.at(-2)!};
  if(character==="fox") {
    const tile=route.find(i=>solution[i].kind==="tee")!,previous=route[route.indexOf(tile)-1];
    const incoming=([0,1,2,3] as Direction[]).find(d=>neighbour(tile,d,level.size)===previous)!;
    level.tiles[tile]={...solution[tile],locked:true};
    level.fork={tile,exits:ports(solution[tile]).filter(d=>d!==incoming)};
  }
  return level;
}
