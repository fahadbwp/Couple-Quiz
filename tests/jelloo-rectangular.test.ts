import test from "node:test";
import assert from "node:assert/strict";
import {ports,tracePath,initialGame,gameReducer,type Level,type Direction} from "../lib/jelloo/engine";
import {solvePowerLevel} from "../lib/jelloo/power-solver";
import {computeCanonicalSignature} from "../lib/jelloo/campaign-v2/structural-comparator";
import {buildAuthoredLevel} from "../lib/jelloo/campaign-v2/rectangular-authoring";
import {dimensions,gridNeighbour,gridPosition} from "../lib/jelloo/grid";
test("rectangular foundation validates all five world sizes and every cell's boundaries",()=>{
 for(const columns of [4,5,6,7,8]) {
  const grid={size:columns,columns,rows:4};assert.equal(dimensions(grid).count,columns*4);
  for(let index=0;index<columns*4;index++) {
   const {row,column}=gridPosition(index,grid);
   assert.equal(gridNeighbour(index,0,grid),row===0?null:index-columns);
   assert.equal(gridNeighbour(index,1,grid),column===columns-1?null:index+1);
   assert.equal(gridNeighbour(index,2,grid),row===3?null:index+columns);
   assert.equal(gridNeighbour(index,3,grid),column===0?null:index-1);
  }
 }
 assert.deepEqual(gridPosition(31,{size:8,columns:8,rows:4}),{row:3,column:7});
});
test("rectangular foundation keeps legacy squares and rejects partial or invalid dimensions",()=>{
 assert.deepEqual(dimensions(5),{columns:5,rows:5,count:25});assert.deepEqual(dimensions({size:4}),dimensions(4));
 for(const grid of [{size:4,columns:5},{size:4,rows:4},{size:4,columns:0,rows:4},{size:4,columns:4.5,rows:4},{size:NaN}]) assert.throws(()=>dimensions(grid),/dimensions/);
 assert.equal(gridNeighbour(-1,0,4),null);assert.equal(gridNeighbour(16,0,4),null);assert.throws(()=>gridPosition(32,{size:8,columns:8,rows:4}));
});

test("all rectangular world fixtures solve and replay with the real engine including cell 31",()=>{
 for(const columns of [4,5,6,7,8]) {
  const grid={size:columns,columns,rows:4};
  const route=[...Array.from({length:columns},(_,i)=>i),columns*2-1,columns*3-1,...Array.from({length:columns},(_,i)=>columns*4-1-i)];
  const direction=(a:number,b:number)=>[0,1,2,3].find(d=>gridNeighbour(a,d,grid)===b) as Direction;
  const level:Level={...grid,id:1,title:"Rectangle",hint:"",start:route[0],home:route.at(-1)!,tiles:Array.from({length:columns*4},()=>({kind:"blank",rotation:0})),character:"bunny",powerVersion:4,collectibles:[route[3],route.at(-2)!]};
  route.forEach((cell,i)=>{
   if(i===0||i===route.length-1) {level.tiles[cell]={kind:i===0?"start":"home",rotation:0,port:direction(cell,route[i===0?1:i-1])};return;}
   const a=direction(cell,route[i-1]),b=direction(cell,route[i+1]);
   const kind=(a+2)%4===b?"straight":"corner";
   const rotation=[0,1,2,3].find(r=>{const p=ports({kind,rotation:r});return p.includes(a)&&p.includes(b)})!;
   level.tiles[cell]={kind,rotation:(rotation+1)%4};
  });
  const proof=solvePowerLevel(level);assert(proof.solvable&&proof.solution);
  assert.equal(tracePath(level,proof.solution).outcome,"home");
  level.moveLimit=proof.starPar+3;let game=initialGame(level);
  level.tiles.forEach((tile,index)=>{for(let n=0;n<(proof.solution![index].rotation-tile.rotation+4)%4;n++)game=gameReducer(game,{type:"rotate",index})});
  game=gameReducer(game,{type:"auto",runId:game.runId,moves:game.moves});
  while(game.status==="running")game=gameReducer(game,{type:"tick",runId:game.runId});
  assert.equal(game.status,"won");assert(level.collectibles!.every(i=>game.trace!.path.includes(i)));
  assert(game.trace!.path.includes(columns*4-1));
  const gap=structuredClone(level);gap.tiles[2]={kind:"blank",rotation:0,terrain:"gap"};gap.collectibles=[3,route.at(-2)!];
  assert(solvePowerLevel(gap,"bunny").solvable);assert(!solvePowerLevel(gap,null).solvable);
 }
});

test("rectangular topology signatures exchange dimensions on rotation without false row strides",()=>{
 const a=buildAuthoredLevel({id:1,size:5,columns:5,rows:4,title:"A",hint:"",route:[0,1,2,7,12,17,18,19],collectibles:[7,18]});
 const at=(i:number)=>(i%5)*4+(3-Math.floor(i/5));
 const b:Level={...a,size:4,columns:4,rows:5,start:at(a.start),home:at(a.home),collectibles:a.collectibles!.map(at),tiles:Array.from({length:20},()=>({kind:"blank",rotation:0}))};
 a.tiles.forEach((t,i)=>{b.tiles[at(i)]={...t,rotation:t.rotation+1,...(t.port===undefined?{}:{port:(t.port+1)%4 as Direction})}});
 assert.equal(computeCanonicalSignature(a),computeCanonicalSignature(b));
 assert.equal(solvePowerLevel(a).solvable,true);assert.equal(solvePowerLevel(b).solvable,true);
});
