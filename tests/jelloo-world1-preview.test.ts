import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {previewAccess, persistPreviewWin} from "../lib/jelloo/campaign-v2/preview-session";
import {initializeCampaignV2, readCampaignV2Save, CAMPAIGN_V2_SAVE_KEY, LEGACY_SAVE_KEY} from "../lib/jelloo/campaign-save";
import {resolveWorld1Level} from "../lib/jelloo/campaign-v2/world1-provider";
import {solvePowerLevel} from "../lib/jelloo/power-solver";
import {initialGame, gameReducer, type GameState} from "../lib/jelloo/engine";

class Store {
  data = new Map<string,string>();
  getItem(key: string) {return this.data.get(key) ?? null;}
  setItem(key: string, value: string) {this.data.set(key,value);}
  removeItem(key: string) {this.data.delete(key);}
}
function fresh() {
  const store = new Store(); store.setItem(LEGACY_SAVE_KEY, "legacy bytes left alone");
  const init = initializeCampaignV2(store); assert(init.success);
  return {store, save: init.save, raw: init.raw};
}
function win(id: number, allStars = true): GameState {
  const level = resolveWorld1Level(id), proof = solvePowerLevel(allStars ? level : {...level,collectibles:[]});
  const solution = proof.solution!;
  let game = initialGame(level);
  level.tiles.forEach((t,index) => {
    const turns = (solution[index].rotation - t.rotation + 4) % 4;
    for(let i=0;i<turns;i++) game = gameReducer(game,{type:"rotate",index});
  });
  game = gameReducer(game,{type:"go"});
  for(let i=0;i<100&&game.status==="running";i++) game=gameReducer(game,{type:"tick",runId:game.runId});
  assert.equal(game.status,"won"); return game;
}

test("Phase 4 preview applies sequential and star gates without unlocking planned worlds", () => {
  const {save} = fresh();
  assert(previewAccess(1,save).accessible); assert(!previewAccess(2,save).accessible);
  const gate = {...save, completed:9, best:Object.fromEntries(Array.from({length:9},(_,i)=>[i+1,1]))};
  assert.equal(previewAccess(10,gate).accessible,false);
  gate.best = Object.fromEntries(Array.from({length:9},(_,i)=>[i+1,3]));
  assert(previewAccess(10,gate).accessible);
  assert(!previewAccess(51,{...save,completed:50,best:Object.fromEntries(Array.from({length:50},(_,i)=>[i+1,3]))}).accessible);
});
test("Phase 4 real wins persist all 50 completions and restore stars without writing legacy bytes", () => {
  const fixture = fresh(), store = fixture.store; let {save,raw} = fixture;
  for(let id=1;id<=50;id++) {
    const saved = persistPreviewWin(store,save,raw,win(id)); assert(saved.success,`Level ${id}`);
    save=saved.save;raw=saved.raw;
  }
  const read=readCampaignV2Save(store);assert.equal(read.status,"ready");
  if(read.status!=="ready") throw new Error("unreachable");
  assert.equal(read.save.completed,50);assert.equal(Object.values(read.save.best).reduce((a,b)=>a+b,0),150);
  assert.equal(store.getItem(LEGACY_SAVE_KEY),"legacy bytes left alone");
});
test("Phase 4 replay cannot reduce a best score, duplicate completion or overwrite a stale snapshot", () => {
  const {store,save,raw}=fresh();const result=persistPreviewWin(store,save,raw,win(1));assert(result.success);
  assert.equal(persistPreviewWin(store,save,raw,win(1)).success,false);
  const replay=persistPreviewWin(store,result.save,result.raw,win(1));assert(replay.success);
  assert.equal(replay.save.completed,1);assert.equal(replay.save.best["1"],3);
});
test("Phase 4 unfinished, mismatched and fabricated wins cannot award progress", () => {
  const {store,save,raw}=fresh();
  assert.equal(persistPreviewWin(store,save,raw,initialGame(resolveWorld1Level(1))).success,false);
  const wrong=win(1);wrong.level.title="Changed board";
  assert.equal(persistPreviewWin(store,save,raw,wrong).success,false);
  const forged=initialGame(resolveWorld1Level(1));forged.status="won";
  assert.equal(persistPreviewWin(store,save,raw,forged).success,false);
  assert.equal(persistPreviewWin(store,save,raw,win(2)).success,false);
  assert.equal(store.getItem(CAMPAIGN_V2_SAVE_KEY),raw);
});
test("Phase 4 corrupt and unsupported destinations are preserved when recording results", () => {
  for(const value of ["{broken",JSON.stringify({...fresh().save,inProgressBoard:{levelId:1,moves:0,rotations:[]}})]) {
    const {store,save}=fresh();store.setItem(CAMPAIGN_V2_SAVE_KEY,value);
    assert.equal(persistPreviewWin(store,save,value,win(1)).success,false);
    assert.equal(store.getItem(CAMPAIGN_V2_SAVE_KEY),value);
  }
});
test("Phase 4 preview route fails closed in production and original Adventure entry is untouched", () => {
  const page=readFileSync("app/jelloo/character-worlds/page.tsx","utf8");
  assert.match(page,/process.env.NODE_ENV !== "development"\) notFound\(\)/);
  const ui=readFileSync("app/jelloo/character-worlds/CharacterWorlds.tsx","utf8");
  assert.match(ui,/Refreshing an unfinished puzzle restarts that board/);
  assert(!ui.includes("jelloo.progress.v1"));
  const adventure=readFileSync("app/jelloo/page.tsx","utf8");assert(!adventure.includes("CharacterWorlds"));
});



test("Candy auto-start ignores stale callbacks and never launches an incomplete path", () => {
  let game=initialGame(resolveWorld1Level(1));
  assert.equal(gameReducer(game,{type:"auto",runId:game.runId,moves:game.moves}),game);
  const stale={type:"auto" as const,runId:game.runId,moves:game.moves};
  game=gameReducer(game,{type:"rotate",index:1});
  assert.equal(gameReducer(game,stale),game);
  const beforeReset=game;
  game=gameReducer(game,{type:"reset"});
  assert.equal(gameReducer(game,{type:"auto",runId:beforeReset.runId,moves:beforeReset.moves}),game);
});
test("Candy all 50 levels finish with automatic start, correct stars and locked running input", () => {
  for(let id=1;id<=50;id++) {
    const level=resolveWorld1Level(id), solution=solvePowerLevel(level).solution!;
    let game=initialGame(level);
    level.tiles.forEach((tile,index)=>{
      for(let turn=0;turn<(solution[index].rotation-tile.rotation+4)%4;turn++) {
        const moves=game.moves; game=gameReducer(game,{type:"rotate",index});
        assert.equal(game.moves,moves+1,`Level ${id} quarter turn`);
      }
    });
    game=gameReducer(game,{type:"auto",runId:game.runId,moves:game.moves});
    assert.equal(game.status,"running",`Level ${id}`);
    assert.equal(gameReducer(game,{type:"rotate",index:1}),game);
    assert.equal(gameReducer(game,{type:"auto",runId:game.runId,moves:game.moves}),game);
    for(let tick=0;tick<100&&game.status==="running";tick++) game=gameReducer(game,{type:"tick",runId:game.runId});
    assert.equal(game.status,"won");
    assert.equal(game.trace?.outcome,"home");
    assert(level.collectibles?.every(star=>game.trace?.path.includes(star)));
  }
});
test("Candy UI exposes auto-start without manual Go, Undo or Restart controls", () => {
  const ui=readFileSync("app/jelloo/character-worlds/CharacterWorlds.tsx","utf8");
  assert.match(ui,/type: "auto"/);
  assert(!ui.includes('type: "go"'));assert(!ui.includes('type: "undo"'));
  assert(!ui.includes('>Restart<'));assert(!ui.includes('>Go!'));
  assert.match(ui,/>Try again</); // A failed run remains recoverable.
});

test("Candy budget grants exactly three spare quarter-turns on every authored level", () => {
  for(let id=1;id<=50;id++) {
    const level=resolveWorld1Level(id);
    assert.equal(level.moveLimit-level.solverStarPar,3,`Level ${id}`);
  }
});
test("Candy a home path completed on the final allowed move wins rather than loses", () => {
  const level=resolveWorld1Level(1), proof=solvePowerLevel(level);
  let game=initialGame(level);
  // Tile 9 is an editable decoy outside the certified all-star route.
  assert(proof.solution);
  for(let i=0;i<3;i++) game=gameReducer(game,{type:"rotate",index:9});
  level.tiles.forEach((tile,index)=>{
    const turns=(proof.solution![index].rotation-tile.rotation+4)%4;
    for(let i=0;i<turns;i++) game=gameReducer(game,{type:"rotate",index});
  });
  assert.equal(game.moves,level.moveLimit);
  assert.equal(game.status,"running");
  for(let i=0;i<100&&game.status==="running";i++) game=gameReducer(game,{type:"tick",runId:game.runId});
  assert.equal(game.status,"won");
});
test("Candy exhausted moves block further rotation until a clean retry", () => {
  const level=resolveWorld1Level(1);let game=initialGame(level);
  for(let i=0;i<level.moveLimit;i++) game=gameReducer(game,{type:"rotate",index:9});
  assert.equal(game.status,"lost");assert.equal(game.moves,level.moveLimit);
  assert.equal(gameReducer(game,{type:"rotate",index:1}),game);
  const retry=gameReducer(game,{type:"reset"});
  assert.equal(retry.status,"editing");assert.equal(retry.moves,0);
  assert.deepEqual(retry.tiles,level.tiles);assert(retry.runId>game.runId);
});
