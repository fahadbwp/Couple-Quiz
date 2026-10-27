import {writeFileSync} from 'node:fs';
import {resolveWorld1Level,GENERATOR_VERSION} from '../lib/jelloo/campaign-v2/world1-provider';
import {solvePowerLevel,auditPowerLevel} from '../lib/jelloo/power-solver';
import {computeCanonicalSignature,computeRouteSignature,computeTurnSequence,auditBatchUniqueness} from '../lib/jelloo/campaign-v2/structural-comparator';
const rows:unknown[][]=[],samples:number[]=[];
const items=[];
for(let id=1;id<=50;id++) {
 const t=performance.now(),level=resolveWorld1Level(id);samples.push(performance.now()-t);
 const p=solvePowerLevel(level),audit=auditPowerLevel(level);
 if(!p.solvable||p.exhausted||!Number.isFinite(p.starPar))throw Error(`Invalid L${id}`);
 const turns=computeTurnSequence(p.parPath,level.size).filter(t=>t!=='S').length;
 rows.push([id,'Pink Candy Land','Bunny',level.title,`${level.size}x${level.size}`,`${level.targetBand.minPar}-${level.targetBand.maxPar}`,p.par,p.starPar,level.moveLimit,p.parPath.length,turns,audit.necessary?'YES':'NO',p.starPar>p.par?'YES':'NO',level.collectibles!.join(';'),computeCanonicalSignature(level), 'Validated',computeRouteSignature(p.parPath,level.size),computeRouteSignature(p.trace.path,level.size),level.tiles.filter(t=>t.kind==='tee').length,GENERATOR_VERSION]);
 items.push({level});
}
const csv=(v:unknown)=>'"'+String(v).replace(/"/g,'""')+'"';
const header=['LevelID','World','Character','Title','Size','TargetBand','SolverPar','SolverStarPar','MoveLimit','RouteLength','TurnCount','PowerRequired','DetourChallenge','CollectibleTiles','CanonicalSignature','Status','MinimumRouteSignature','AllStarRouteSignature','TeeTiles','GeneratorVersion'];
writeFileSync('docs/jelloo/character-worlds/world1-level-inventory.csv',[header,...rows].map(r=>r.map(csv).join(',')).join('\n')+'\n');
const similarity=auditBatchUniqueness(items),sorted=[...samples].sort((a,b)=>a-b);
const report={boards:50,pairs:1225,duplicates:similarity.duplicates,nearDuplicates:similarity.nearDuplicates,levelChanges:[3,9,43,45],generatorVersion:GENERATOR_VERSION,timing:{metric:'cold resolver including proof and replay, milliseconds',median:sorted[24],p95:sorted[47],worst:sorted[49]},seedPolicy:'fixed authored geometry; uint32 seed ignored for compatibility, not procedural variety'};
writeFileSync('docs/jelloo/character-worlds/phase31-audit.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
