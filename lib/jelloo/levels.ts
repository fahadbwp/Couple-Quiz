import tutorials from "@/data/jelloo/tutorials.json";
import { ports, neighbour, type Direction, type Level, type Tile } from "./engine";

export type TutorialSpec = {
  id: number; title: string; hint: string; size: number;
  route: number[]; scramble: Record<string, number | undefined>;
  decoys?: (string | number)[][];
};

function directionTo(from: number, to: number, size: number): Direction {
  const direction = ([0,1,2,3] as Direction[]).find(d => neighbour(from,d,size) === to);
  if (direction === undefined) throw new Error(`Non-adjacent tutorial cells: ${from}, ${to}`);
  return direction;
}

export function buildTutorial(spec: TutorialSpec, solved = false): Level {
  if (new Set(spec.route).size !== spec.route.length || spec.route.some(i => i < 0 || i >= spec.size ** 2)) throw new Error("Invalid tutorial route");
  const tiles: Tile[] = Array.from({length:spec.size ** 2},()=>({kind:"blank",rotation:0}));
  spec.route.forEach((index, step) => {
    if (step === 0 || step === spec.route.length - 1) {
      tiles[index] = {kind:step === 0 ? "start" : "home",rotation:0,port:directionTo(index,spec.route[step === 0 ? 1 : step-1],spec.size)};
      return;
    }
    const desired = [directionTo(index,spec.route[step-1],spec.size),directionTo(index,spec.route[step+1],spec.size)];
    const kind = (desired[0]+2)%4 === desired[1] ? "straight" : "corner";
    const rotation = [0,1,2,3].find(r => desired.every(d => ports({kind,rotation:r}).includes(d)));
    if (rotation === undefined) throw new Error("Unsupported tutorial connection");
    tiles[index] = {kind,rotation:rotation+(solved ? 0 : spec.scramble[String(index)] ?? 0)};
  });
  for (const [index,kind,rotation] of spec.decoys ?? []) {
    if (typeof index !== "number" || tiles[index]?.kind !== "blank" || (kind !== "straight" && kind !== "corner") || typeof rotation !== "number") throw new Error("Invalid decoy");
    tiles[index] = {kind,rotation};
  }
  return {id:spec.id,title:spec.title,hint:spec.hint,size:spec.size,start:spec.route[0],home:spec.route.at(-1)!,tiles};
}

export const tutorialSpecs: TutorialSpec[] = tutorials;
export const levels = tutorialSpecs.map(spec => {
  const level = buildTutorial(spec);
  const solved = buildTutorial(spec,true);
  level.collectibles = [spec.route[Math.floor(spec.route.length/2)]];
  level.moveLimit = level.tiles.reduce((sum,t,i)=>{
    if(t.kind !== "straight" && t.kind !== "corner") return sum;
    if(!spec.route.includes(i)) return sum;
    return sum + [0,1,2,3].find(r=>ports({...t,rotation:t.rotation+r}).every(d=>ports(solved.tiles[i]).includes(d)))!;
  },0) + (spec.id<=3 ? 2 : 3);
  level.difficulty = "Tutorial";
  return level;
});
