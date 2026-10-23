import { createHash } from "node:crypto";
import { MAX_ACTIONS, referralBoards, type ProofAction } from "./protocol";

export const REFERRAL_REVISION=createHash("sha256").update("jelloo-referral-replay-v1:"+JSON.stringify(referralBoards)).digest("hex");

// Deliberately independent of the evolving adventure reducer. Only the frozen
// rotation tutorial protocol is accepted. No ticks, flags, scores or client boards.
export function verifyTutorial(level: unknown, revision: unknown, actions: unknown): actions is ProofAction[] {
  if(revision!==REFERRAL_REVISION || !Number.isInteger(level) || Number(level)<1 || Number(level)>10 || !Array.isArray(actions) || !actions.length || actions.length>MAX_ACTIONS) return false;
  const board=referralBoards[Number(level)-1];
  let rotations=board.tiles.map(t=>t.rotation), history:number[][]=[], moves=0;
  for(let n=0;n<actions.length;n++) {
    const a=actions[n];
    if(!a || typeof a!=="object" || Array.isArray(a)) return false;
    if(a.type==="rotate") {
      if(Object.keys(a).sort().join()!=="index,type" || !Number.isInteger(a.index)) return false;
      const tile=board.tiles[a.index];
      if(!tile || tile.locked || !["straight","corner","tee"].includes(tile.kind) || moves>=board.moveLimit!) return false;
      history.push([...rotations]); rotations[a.index]=(rotations[a.index]+1)%4; moves++;
    } else {
      if(Object.keys(a).join()!=="type") return false;
      if(a.type==="reset") {rotations=board.tiles.map(t=>t.rotation);history=[];moves=0;}
      else if(a.type==="undo") {if(!history.length || moves>=board.moveLimit!) return false;rotations=history.pop()!;}
      else if(a.type==="go") {
        if(n!==actions.length-1 || moves>board.moveLimit!) return false;
        const ports=(i:number)=>{
          const t=board.tiles[i];
          if(t.kind==="start" || t.kind==="home") return [t.port!];
          const p=t.kind==="straight" ? [1,3] : t.kind==="corner" ? [0,1] : t.kind==="tee" ? [0,1,3] : [];
          return p.map(d=>(d+rotations[i])%4);
        };
        const visited=new Set([board.start]), queue=[board.start];
        for(let q=0;q<queue.length;q++) {
          const at=queue[q],row=Math.floor(at/board.size),col=at%board.size;
          if(at===board.home) return true;
          for(const d of ports(at)) {
            if(d===0 && row===0 || d===1 && col===board.size-1 || d===2 && row===board.size-1 || d===3 && col===0) continue;
            const next=at+[-board.size,1,board.size,-1][d];
            if(!visited.has(next) && ports(next).includes((d+2)%4)) {visited.add(next);queue.push(next);}
          }
        }
        return false;
      } else return false;
    }
  }
  return false;
}
