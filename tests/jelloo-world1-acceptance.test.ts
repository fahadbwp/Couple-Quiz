import test from 'node:test';
import assert from 'node:assert/strict';
import {buildAuthoredLevel} from '../lib/jelloo/campaign-v2/world1-specs';
import {resolveWorld1Level,validateWorld1Content} from '../lib/jelloo/campaign-v2/world1-provider';
import {computeCanonicalSignature,computeRouteSignature,compareLevels,auditBatchUniqueness} from '../lib/jelloo/campaign-v2/structural-comparator';
import {ports,initialGame,gameReducer,type Level,type Direction} from '../lib/jelloo/engine';
import {solvePowerLevel} from '../lib/jelloo/power-solver';
import {scoreRun} from '../lib/jelloo/scoring';

function mirrored(level:Level,rotate:boolean):Level {
 const size=level.size;
 const at=(i:number)=>{const r=Math.floor(i/size),c=i%size;return rotate?c*size+(size-1-r):r*size+size-1-c};
 const dir=(d:Direction):Direction=>rotate?((d+1)%4 as Direction):([0,3,2,1] as Direction[])[d];
 const tiles=level.tiles.map(t=>({...t}));
 level.tiles.forEach((t,i)=>{
  const connections=ports(t).map(dir);
  const tile={...t};
  if(t.kind==='start'||t.kind==='home') tile.port=dir(t.port!);
  else if(t.kind!=='blank') tile.rotation=[0,1,2,3].find(r=>{const p=ports({...tile,rotation:r});return p.length===connections.length&&p.every(d=>connections.includes(d))})!;
  tiles[at(i)]=tile;
 });
 return {...level,tiles,start:at(level.start),home:at(level.home),collectibles:level.collectibles?.map(at)};
}
const fixture=()=>buildAuthoredLevel({id:1,size:4,title:'fixture',hint:'',route:[0,1,5,9,10,11],collectibles:[9],scramble:{1:3,5:1,9:3,10:1}});

test('comparator detects rotated and mirrored complete boards using actual solver routes',()=>{
 const a=fixture();
 for(const b of [mirrored(a,true),mirrored(a,false)]) {
  const proof=solvePowerLevel(a),other=solvePowerLevel(b);
  assert(proof.solvable&&other.solvable);
  assert.equal(computeCanonicalSignature(a),computeCanonicalSignature(b));
  assert.equal(computeRouteSignature(proof.parPath,a.size),computeRouteSignature(other.parPath,b.size));
  assert.equal(auditBatchUniqueness([{level:a},{level:b}]).duplicates.length,1);
 }
});
test('comparator normalizes translation and flags the same core route with irrelevant moved decoys',()=>{
 const a=fixture(), b=structuredClone(a);
 a.tiles[15]={kind:'straight',rotation:0};b.tiles[2]={kind:'straight',rotation:1};
 const route=[0,1,5,9,10,11];
 const comparison=compareLevels(a,route,b,route);
 assert.equal(comparison.isDuplicate,false);assert.equal(comparison.sameCoreRoute,true);
 assert.equal(auditBatchUniqueness([{level:a},{level:b}]).nearDuplicates.length,1);
 const c=buildAuthoredLevel({id:2,title:'translated',hint:'',size:5,route:[6,7,12,17]});
 const d=buildAuthoredLevel({id:3,title:'original',hint:'',size:5,route:[0,1,6,11]});
 assert.equal(computeCanonicalSignature(c),computeCanonicalSignature(d));
});
test('comparator retains stars, locked connections and genuinely different routing',()=>{
 const a=fixture(), b=structuredClone(a);b.collectibles=[5];
 assert.notEqual(computeCanonicalSignature(a),computeCanonicalSignature(b));
 const c=structuredClone(a);c.tiles[1].locked=true;
 assert.notEqual(computeCanonicalSignature(a),computeCanonicalSignature(c));
 const d=resolveWorld1Level(12);
 assert.notEqual(computeCanonicalSignature(a),computeCanonicalSignature(d));
 assert.notEqual(computeRouteSignature(solvePowerLevel(a).parPath,4),computeRouteSignature(solvePowerLevel(d).parPath,d.size));
});
test('resolver definitions and two game instances cannot contaminate later resolutions',()=>{
 const original=resolveWorld1Level(1), a=resolveWorld1Level(1);
 a.tiles[0].rotation=987;a.collectibles!.push(999);a.targetBand.minPar=-10;
 assert.deepEqual(resolveWorld1Level(1),original);
 const x=initialGame(resolveWorld1Level(1)),y=initialGame(resolveWorld1Level(1));
 x.level.tiles[1].rotation=999;
 assert.deepEqual(y.level,initialGame(original).level);assert.deepEqual(resolveWorld1Level(1),original);
});
test('resolver rejects unreachable stars, unknown versions, unsafe seeds and unproven budgets',()=>{
 const bad=fixture();bad.collectibles=[15];
 assert.throws(()=>validateWorld1Content(bad),/all-star proof/);
 assert.throws(()=>validateWorld1Content(fixture(),0),/proof/);
 assert.throws(()=>resolveWorld1Level(1,0,{generatorVersion:'future'}),/Unsupported generator/);
 assert.throws(()=>resolveWorld1Level(1,0,{campaignId:'legacy'}),/Unsupported campaign/);
 for(const seed of [-1,NaN,Infinity,1.2,Number.MAX_SAFE_INTEGER+1,4294967296]) assert.throws(()=>resolveWorld1Level(1,seed),/Invalid seed/);
 assert.deepEqual(resolveWorld1Level(1,0),resolveWorld1Level(1,42));
});
test('all 50 solver boards win through the real reducer and collect every star at the certified cost',()=>{
 for(let id=1;id<=50;id++) {
  const level=resolveWorld1Level(id),proof=solvePowerLevel(level);
  assert(proof.solution);let game=initialGame(level),used=0;
  level.tiles.forEach((t,index)=>{
   const n=(proof.solution![index].rotation-t.rotation+4)%4;
   for(let i=0;i<n;i++) {
    const before=game.moves;game=gameReducer(game,{type:'rotate',index});used++;
    assert.equal(game.moves,before+1,`L${id} rotation accounting`);
   }
  });
  assert.equal(used,proof.starPar,`L${id} certified all-star cost`);
  game=gameReducer(game,{type:'go'});
  for(let tick=0;game.status==='running'&&tick<100;tick++) game=gameReducer(game,{type:'tick',runId:game.runId});
  assert.equal(game.status,'won',`L${id} actual engine completion`);
  assert.equal(scoreRun(game).collected,level.collectibles!.length,`L${id} actual engine star collection`);
  assert.equal(scoreRun(game).stars,3,`L${id} actual engine score`);
 }
});
