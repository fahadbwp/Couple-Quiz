import { neighbour, tracePath, type Direction, type Level } from "./engine";
import { buildTutorial, levels, type TutorialSpec } from "./levels";
import { analyzePuzzle } from "./scoring";
import { addJunction } from "./junctions";
import { tutorialSpecs } from "./levels";
import { characterForLevel,generatePowerPuzzle } from "./power-generator";
import { worldForLevel } from "./worlds";

// Version 1: saved seeds must keep producing the same boards.
export function generateLegacyPuzzle(id: number, seed: number) {
  let value = (seed ^ Math.imul(id, 2654435761)) >>> 0;
  const random = () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / 4294967296; };
  const tier = (id - 11) % 3;
  const size = tier === 0 ? 4 : 5;
  const length = [8, 12, 17][tier];
  let route: number[] = [];
  // Bounded walks; a serpentine fallback always supplies a valid route.
  for (let attempt = 0; attempt < 80; attempt++) {
    const candidate = [Math.floor(random() * size * size)];
    while (candidate.length < length) {
      const options = ([0,1,2,3] as Direction[]).map(d => neighbour(candidate.at(-1)!,d,size)).filter((n): n is number => n !== null && !candidate.includes(n));
      if (!options.length) break;
      candidate.push(options[Math.floor(random()*options.length)]);
    }
    if (candidate.length === length) { route = candidate; break; }
  }
  if (!route.length) route = Array.from({length},(_,i) => Math.floor(i/size)*size + (Math.floor(i/size)%2 ? size-1-i%size : i%size));
  const scramble: TutorialSpec["scramble"] = {};
  route.slice(1,-1).forEach(i => { scramble[i] = Math.floor(random()*4); });
  const decoys: NonNullable<TutorialSpec["decoys"]> = [];
  for (let i=0;i<size*size;i++) if (!route.includes(i) && random() < [0.15,0.35,0.65][tier]) decoys.push([i,random()<0.5 ? "straight" : "corner",Math.floor(random()*4)]);
  const spec: TutorialSpec = {id,size,route,scramble,decoys,title:["A gentle wander","Around the meadow","The winding way"][tier],hint:["A smaller path to catch your breath.","Trace the bends from home back to Bunny.","Some tiles are distractions. Find the connected route."][tier]};
  let level = buildTutorial(spec);
  if (tracePath(level,level.tiles).outcome === "home") {
    scramble[route[1]] = (scramble[route[1]] ?? 0)+1;
    level = buildTutorial(spec);
  }
  const solution = buildTutorial(spec,true);
  if (tracePath(solution,solution.tiles).outcome !== "home") throw new Error("Invalid generated puzzle");
  return {level,solution};
}

export function difficultyFor(id: number) {
  const tier = Math.min(3,Math.floor(Math.max(0,id-11)/10));
  return {tier,length:12+tier*2,minMoves:6+tier*5,minLength:8+tier*2,minTurns:3+tier,label:["Curious","Twisty","Tricky","Expert"][tier]};
}

export function generatePuzzle(id: number, seed: number, searchBudget = 2400) {
  const difficulty = difficultyFor(id);
  let value = (seed ^ Math.imul(id,2246822519)) >>> 0;
  const random = () => { value = (Math.imul(value,1664525)+1013904223) >>> 0; return value/4294967296; };
  for (let attempt=0;attempt<searchBudget;attempt++) {
    const route = [Math.floor(random()*25)];
    while (route.length < difficulty.length) {
      const choices = ([0,1,2,3] as Direction[]).map(d=>neighbour(route.at(-1)!,d,5)).filter((n):n is number=>n!==null && !route.includes(n));
      if (!choices.length) break;
      route.push(choices[Math.floor(random()*choices.length)]);
    }
    if (route.length !== difficulty.length) continue;
    const scramble: TutorialSpec["scramble"] = {};
    route.slice(1,-1).forEach(i=>{scramble[i] = random()<0.5 ? 1 : 3;});
    const decoys: NonNullable<TutorialSpec["decoys"]> = [];
    for(let i=0;i<25;i++) if(!route.includes(i) && random()<0.25+difficulty.tier*0.15) decoys.push([i,random()<0.5?"straight":"corner",Math.floor(random()*4)]);
    const spec: TutorialSpec = {id,size:5,route,scramble,decoys,title:`${difficulty.label} meadow`,hint:"Look ahead before turning. Collect the golden stars and stay within the move target for three stars."};
    const level = buildTutorial(spec), solution = buildTutorial(spec,true);
    level.collectibles = [route[Math.floor(route.length/3)],route[Math.floor(route.length*2/3)]];
    const analysis = analyzePuzzle(level);
    const detourChallenge = id >= 21 && id%3 === 0;
    if(analysis.exhausted || analysis.minMoves < difficulty.minMoves || analysis.shortest < difficulty.minLength || analysis.fewestTurns < difficulty.minTurns || !Number.isFinite(analysis.starMoves) || (detourChallenge && analysis.starMoves<=analysis.minMoves)) continue;
    level.moveLimit = analysis.starMoves + Math.max(2,5-difficulty.tier);
    level.difficulty = difficulty.label;
    return {level,solution};
  }
  // A verified branching template is used only when the search budget ends.
  const route = [23,24,19,18,17,22,21,20,15,10,11,6,7,8,9,4,3,2];
  const spec: TutorialSpec = {id,size:5,route,scramble:{3:3,4:1,6:1,7:1,8:1,9:1,10:3,11:3,15:1,17:3,18:1,19:1,20:1,21:1,22:1,24:1},decoys:[[0,"corner",0],[5,"corner",2],[12,"corner",1],[14,"corner",3],[16,"corner",2]],title:"The long way home",hint:"The shortest way home may miss a star. Find the golden detour."};
  const level = buildTutorial(spec), solution = buildTutorial(spec,true);
  level.collectibles = [21,7];
  const analysis = analyzePuzzle(level);
  if(analysis.exhausted || analysis.minMoves<difficulty.minMoves || analysis.shortest<difficulty.minLength || analysis.fewestTurns<difficulty.minTurns) throw new Error("Puzzle quality gate failed");
  level.moveLimit = analysis.starMoves+2; level.difficulty = difficulty.label;
  return {level,solution};
}

export function levelAt(id: number, seed: number, rules = 4) {
  let level: Level;
  if(rules>=4 && characterForLevel(id)) level = generatePowerPuzzle(id,seed).level;
  else if (levels[id-1]) level = rules>=3 && id>=4 ? addJunction(levels[id-1],buildTutorial(tutorialSpecs[id-1],true)) : levels[id-1];
  else if (rules === 1) {
    const {level: legacyLevel,solution} = generateLegacyPuzzle(id,seed);
    const route = tracePath(solution,solution.tiles).path;
    legacyLevel.collectibles = [route[Math.floor(route.length/2)]];
    legacyLevel.moveLimit = analyzePuzzle(legacyLevel).starMoves+4;
    legacyLevel.difficulty = "Classic";
    level = legacyLevel;
  } else {
    const generated=generatePuzzle(id,seed);
    level = rules>=3 ? addJunction(generated.level,generated.solution,difficultyFor(id),id>=21 && id%3===0) : generated.level;
  }
  level.world = worldForLevel(id).id;
  return level;
}

