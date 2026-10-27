import {buildAuthoredLevel} from "./rectangular-authoring";
import {BUNNY_SPECS,BUNNY_PLANS} from "./bunny-specs";
import {solvePowerLevel} from "../power-solver";
import {tracePath,type GameState,type Level} from "../engine";
import {collectedStars} from "../scoring";
export const BUNNY_REVISION="bunny-4x4-v1" as const;
export interface BunnyLevel extends Level {campaignId:"character_worlds_v2";generatorVersion:string;characterWorldId:"candy_land";solverPar:number;solverStarPar:number;moveLimit:number;targetBand:{band:number;minPar:number;maxPar:number};contentRevision:typeof BUNNY_REVISION;}
const cache=new Map<number,BunnyLevel>();
export function bunnyLevel(id:number):BunnyLevel {
 if(!Number.isInteger(id)||id<1||id>50)throw new Error("Invalid Bunny level");
 const cached=cache.get(id);if(cached)return structuredClone(cached);
 const spec=BUNNY_SPECS[id-1],level=buildAuthoredLevel(spec),proof=solvePowerLevel(level);
 if(!proof.solvable||proof.exhausted||!proof.solution||!Number.isFinite(proof.starPar)||proof.par!==BUNNY_PLANS[id].par||proof.starPar!==BUNNY_PLANS[id].starPar||level.collectibles?.length!==2||new Set(level.collectibles).size!==2)throw new Error(`Unverified Bunny level ${id}`);
 const walk=tracePath(level,proof.solution);if(walk.outcome!=="home"||!level.collectibles.every(i=>walk.path.includes(i)))throw new Error("Unreachable pickup");
 const band=Math.floor((id-1)/10)+1;
 const result:BunnyLevel={...level,campaignId:"character_worlds_v2",generatorVersion:"2.0.0",characterWorldId:"candy_land",contentRevision:BUNNY_REVISION,par:proof.par,solverPar:proof.par,solverStarPar:proof.starPar,moveLimit:proof.starPar+3,targetBand:{band,minPar:id<=5?3:3+(band-1)*2,maxPar:18}};
 cache.set(id,result);return structuredClone(result);
}
export const allBunnyLevels=()=>Array.from({length:50},(_,i)=>bunnyLevel(i+1));
export function bunnyScore(game:GameState) {
 const collected=collectedStars(game).length,total=game.level.collectibles?.length??0;
 return {stars:game.status==="won"?1+Math.min(2,collected):0,collected,total,withinLimit:game.moves<=(game.level.moveLimit??Infinity)};
}
