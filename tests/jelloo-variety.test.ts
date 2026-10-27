import test from "node:test";
import assert from "node:assert/strict";
import {generateDailyLevel} from "../lib/jelloo/daily";
import {solvePowerLevel} from "../lib/jelloo/power-solver";
import {generateTwoJellyPuzzle,generateThreeJellyPuzzle,solveMultiJelly} from "../lib/jelloo/multi-jelly";
import {levelAt} from "../lib/jelloo/endless";
import {initialGame,gameReducer} from "../lib/jelloo/engine";
import {newJourney,encodeJourney,decodeJourney,journeyReducer} from "../lib/jelloo/progress";

test("Daily: reported gap dates have reachable stars and finite budgets",()=>{
  for(const date of ["2026-10-05","2026-10-07","2026-10-14","2026-10-28"]) {
    const level=generateDailyLevel(date), proof=solvePowerLevel(level);
    assert(proof.solvable && Number.isFinite(proof.starPar),date);
    assert(Number.isFinite(level.moveLimit),date);
    assert(level.collectibles!.every(i=>level.tiles[i].terrain!=="gap"),date);
  }
});

test("Daily: full 2026 calendar is home and all-star solvable",()=>{
  for(let day=0;day<365;day++) {
    const date=new Date(Date.UTC(2026,0,1+day)).toISOString().slice(0,10);
    const level=generateDailyLevel(date), proof=solvePowerLevel(level);
    assert(proof.solvable && Number.isFinite(proof.starPar),date);
    assert(level.moveLimit!>=proof.starPar,date);
  }
});

test("Multi revision 3: consecutive late levels have distinct layouts and nontrivial pars",()=>{
  for(const seed of [1,42,2026,123456789,4294967295]) {
    for(const count of [2,3]) {
      const signatures=new Set<string>();
      const first=count===2?72:92;
      for(let id=first;id<=first+8;id++) {
        const {level,proof} = count===2?generateTwoJellyPuzzle(id,seed):generateThreeJellyPuzzle(id,seed);
        assert.equal(proof.status,"solved");
        assert(proof.par>=6,`${seed}/${id}: ${proof.par}`);
        signatures.add(JSON.stringify({tiles:level.tiles.map(t=>({kind:t.kind,terrain:t.terrain})),jellies:level.jellies}));
        const allStars=solveMultiJelly(level,5000,true);
        assert.equal(allStars.status,"solved");
        assert(level.collectibles!.every(i=>allStars.trace.jellies.some(j=>j.path.includes(i))));
      }
      assert(signatures.size>=8,`${seed}/${count}: only ${signatures.size} layouts`);
    }
  }
});

test("Multi revision 3: old in-progress boards round-trip unchanged and upgrade only on visit",()=>{
  for(const revision of [1,2]) for(const id of [72,92]) {
    const original={...newJourney(42),multiRevision:revision,completed:100,best:{"1":3},game:initialGame(levelAt(id,42,4,revision))};
    const restored=decodeJourney(encodeJourney(original));
    assert(restored);
    assert.deepEqual(restored.game.level,original.game.level);
    assert.deepEqual(restored.game.tiles,original.game.tiles);
    assert.equal(restored.multiRevision,revision);
    const next=journeyReducer(restored,{type:"visit",id:id+1});
    assert.equal(next.multiRevision,3);
    assert.deepEqual(next.best,original.best);
    assert.equal(next.completed,100);
    assert(decodeJourney(encodeJourney(next)));
  }
});

test("Multi revision 3: every editable quarter turn costs exactly one move",()=>{
  const level=generateThreeJellyPuzzle(99,42).level;
  const index=level.tiles.findIndex(t=>!t.locked && t.kind==="corner");
  assert(index>=0);
  const initial=initialGame(level);
  const turned=gameReducer(initial,{type:"rotate",index});
  assert.equal(turned.moves,1);
  assert.equal(turned.tiles[index].rotation,initial.tiles[index].rotation+1);
});
