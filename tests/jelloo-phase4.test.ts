import test from "node:test";
import assert from "node:assert/strict";
import { gameReducer, initialGame, tracePath, type GameState } from "../lib/jelloo/engine";
import { difficultyFor, generateLegacyPuzzle, generatePuzzle } from "../lib/jelloo/endless";
import { analyzePuzzle, collectedStars, scoreRun } from "../lib/jelloo/scoring";
import { buildTutorial, levels } from "../lib/jelloo/levels";
import { feedbackFor, stepDuration, GameAudio } from "../lib/jelloo/feedback";
import { newJourney, journeyReducer, encodeJourney, decodeJourney } from "../lib/jelloo/progress";

function finish(game: GameState) {
  let next = gameReducer(game,{type:"go"});
  for(let i=0;i<30;i++) next=gameReducer(next,{type:"tick",runId:next.runId});
  return next;
}

test("quality gates reject cheap shortcuts and increase across four difficulty bands",()=>{
  const summaries = [];
  for(const id of [11,21,31,41]) {
    let moves=0, lengths=0, turns=0;
    for(let seed=0;seed<100;seed++) {
      const puzzleId=id+seed%10;
      const {level} = generatePuzzle(puzzleId,seed);
      const a=analyzePuzzle(level), d=difficultyFor(puzzleId);
      assert.equal(a.exhausted,false);
      assert.ok(a.minMoves>=d.minMoves);
      assert.ok(a.shortest>=d.minLength);
      assert.ok(a.fewestTurns>=d.minTurns);
      assert.ok(a.starMoves<=level.moveLimit!);
      assert.ok(level.moveLimit!-a.starMoves<=5);
      if(puzzleId>=21 && puzzleId%3===0) assert.ok(a.starMoves>a.minMoves,"golden detour has a real tradeoff");
      moves+=a.minMoves; lengths+=a.shortest; turns+=a.fewestTurns;
    }
    summaries.push({id,moves:moves/100,length:lengths/100,turns:turns/100});
  }
  console.log("Difficulty audit (100 seeds per band):",JSON.stringify(summaries));
  for(let i=1;i<summaries.length;i++) assert.ok(summaries[i].moves>summaries[i-1].moves);
});

test("bounded generation fallback also meets expert gates",()=>{
  const {level,solution}=generatePuzzle(100,8,0), a=analyzePuzzle(level), d=difficultyFor(100);
  assert.equal(tracePath(solution,solution.tiles).outcome,"home");
  assert.ok(a.minMoves>=d.minMoves && a.fewestTurns>=d.minTurns && a.shortest>=d.minLength);
  assert.ok(Number.isFinite(a.starMoves));
});

test("collectibles distinguish two-star shortcut from three-star route; over-budget attempts lose; legacy wins retain scoring",()=>{
  const upper=buildTutorial({id:1,size:4,route:[8,9,5,6,10,11],scramble:{},title:"",hint:"",decoys:[[13,"corner",0],[14,"corner",3]]},true);
  const lower=buildTutorial({id:1,size:4,route:[8,9,13,14,10,11],scramble:{},title:"",hint:"",decoys:[[5,"corner",1],[6,"corner",2]]},true);
  for(const l of [upper,lower]) {l.collectibles=[5];l.moveLimit=5;}
  assert.equal(scoreRun(finish(initialGame(upper))).stars,3);
  assert.equal(scoreRun(finish(initialGame(lower))).stars,2);
  assert.equal(scoreRun(finish({...initialGame(upper),moves:6})).stars,0);
  assert.equal(scoreRun({...finish(initialGame(upper)),moves:6}).stars,1);
  assert.equal(scoreRun(initialGame(upper)).stars,0);
  assert.deepEqual(collectedStars(initialGame(upper)),[]);
  assert.equal(analyzePuzzle(lower).solutions,2);
});

test("rapid Go/ticks emit one collection and victory cue; reset invalidates a run",()=>{
  let game=gameReducer(initialGame(levels[0]),{type:"rotate",index:13});
  game=gameReducer(game,{type:"go"});
  for(let i=0;i<20;i++) game=gameReducer(game,{type:"go"});
  const cues:string[]=[];
  for(let i=0;i<20;i++) {
    const next=gameReducer(game,{type:"tick",runId:game.runId});
    cues.push(...feedbackFor(game,next));game=next;
  }
  assert.equal(cues.filter(c=>c==="collect").length,1);
  assert.equal(cues.filter(c=>c==="win").length,1);
  const reset=gameReducer(game,{type:"reset"});
  assert.deepEqual(feedbackFor(game,reset),[]);
  assert.equal(gameReducer(reset,{type:"tick",runId:game.runId}),reset);
  assert.equal(stepDuration(true,false),420);
  assert.equal(stepDuration(true,true),100);
  assert.equal(stepDuration(false,false),100);
});

test("failed run emits confusion once; rapid rotations remain accurate and undo cannot refund score",()=>{
  let game=initialGame({...levels[0],moveLimit:undefined});
  for(let i=0;i<101;i++) game=gameReducer(game,{type:"rotate",index:13});
  assert.equal(game.moves,101);assert.equal(game.history.length,100);
  game=gameReducer(game,{type:"undo"});assert.equal(game.moves,101);
  game=gameReducer(game,{type:"go"});
  let confused=0;
  for(let i=0;i<20;i++) {const next=gameReducer(game,{type:"tick",runId:game.runId});confused+=feedbackFor(game,next).filter(c=>c==="confused").length;game=next;}
  assert.equal(confused,1);assert.equal(scoreRun(game).stars,0);
});

test("best stars and mute persist; replay cannot lower a best score",()=>{
  let j=newJourney();j=journeyReducer(j,{type:"rotate",index:13});j=journeyReducer(j,{type:"go"});
  for(let i=0;i<10;i++) j=journeyReducer(j,{type:"tick",runId:j.game.runId});
  assert.equal(j.best[1],3);
  j=journeyReducer(j,{type:"mute"});
  const restored=decodeJourney(encodeJourney(j))!;
  assert.equal(restored.muted,true);assert.equal(restored.best[1],3);
  j=journeyReducer(j,{type:"reset"});
  for(let i=0;i<5;i++) j=journeyReducer(j,{type:"rotate",index:14});
  j=journeyReducer(j,{type:"go"});for(let i=0;i<10;i++) j=journeyReducer(j,{type:"tick",runId:j.game.runId});
  assert.equal(j.game.status,"lost");assert.equal(scoreRun(j.game).stars,0);assert.equal(j.best[1],3);
});

test("phase-3 endless saves retain exact boards; following level uses new rules",()=>{
  const old=generateLegacyPuzzle(15,123).level;
  const raw=JSON.stringify({version:1,generator:1,seed:123,completed:14,id:15,motion:true,moves:4,rotations:old.tiles.map(t=>t.rotation%4),won:false});
  const j=decodeJourney(raw)!;
  assert.equal(j.rules,1);assert.deepEqual(j.game.tiles.map(t=>t.kind),old.tiles.map(t=>t.kind));
  assert.deepEqual(j.game.tiles.map(t=>t.rotation%4),old.tiles.map(t=>t.rotation%4));
  assert.equal(journeyReducer({...j,completed:15},{type:"visit",id:16}).rules,4);
});

test("audio remains optional when browser audio APIs are absent",()=>{
  const audio=new GameAudio();
  assert.doesNotThrow(()=>{audio.play("win");audio.unlock();audio.play("collect");audio.stop();audio.dispose();});
});

test("audio schedules distinct cues, throttles rapid taps, caps voices and stops on mute/disposal",()=>{
  const original=globalThis.AudioContext;
  const frequencies:number[]=[],starts:number[]=[],volumes:number[]=[];
  let stops=0,closed=0,constructed=0;
  class FakeAudio {
    currentTime=1;state="running";
    constructor(){constructed++;}
    destination={};
    resume(){return Promise.resolve();}
    close(){closed++;return Promise.resolve();}
    createOscillator(){const frequency={value:0};return {frequency,type:"",connect(){},disconnect(){},start(t:number){starts.push(t);frequencies.push(frequency.value);},stop(){stops++;},onended:null};}
    createGain(){return {connect(){},disconnect(){},gain:{setValueAtTime(v:number){volumes.push(v);},linearRampToValueAtTime(v:number){volumes.push(v);},exponentialRampToValueAtTime(v:number){volumes.push(v);}}};}
  }
  globalThis.AudioContext=FakeAudio as unknown as typeof AudioContext;
  try {
    const audio=new GameAudio();audio.play("rotate");assert.equal(constructed,0);
    audio.unlock();audio.unlock();assert.equal(constructed,1);
    for(let i=0;i<100;i++)audio.play("rotate");assert.equal(starts.length,1);
    audio.play("collect");audio.play("win");
    assert.deepEqual(frequencies,[440,880,1175,523,659,784,1047]);
    assert.ok(Math.max(...volumes)<=0.06);
    for(let i=0;i<100;i++)audio.play("win");assert.equal(starts.length,12);
    const before=stops;audio.stop();assert.equal(stops-before,12);
    audio.dispose();assert.equal(closed,1);
  } finally {globalThis.AudioContext=original;}
});
