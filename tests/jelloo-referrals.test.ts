import test, { before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomBytes, randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { handleReferral, actorHash, configuration, type ReferralRpc } from "../lib/jelloo/referrals/server";
import { referralBoards, validStatus, type ReferralStatus, type ProofAction, type Challenge } from "../lib/jelloo/referrals/protocol";
import { verifyTutorial, REFERRAL_REVISION } from "../lib/jelloo/referrals/verify";
import { solvePowerLevel } from "../lib/jelloo/power-solver";
import { levelAt } from "../lib/jelloo/endless";
import { gameReducer, initialGame } from "../lib/jelloo/engine";

const config={origin:"https://jelloo.test",secret:"isolated-test-secret-".repeat(3),secure:true};
const db=new PGlite();
const migration=readFileSync(new URL("../supabase/migrations/20261023000001_jelloo_referrals.sql",import.meta.url),"utf8");
const rpc:ReferralRpc=async(op,actor,data)=>(await db.query<{result:unknown}>("select public.jelloo_referral_rpc($1,$2,$3::jsonb) as result",[op,actor,JSON.stringify(data)])).rows[0].result;
before(async()=>{await db.exec("create role anon; create role authenticated; create role service_role;");await db.exec(migration);await db.exec(migration);});
after(()=>db.close());
beforeEach(()=>db.exec("truncate public.jelloo_referral_people,public.jelloo_referral_edges,public.jelloo_referral_sessions,public.jelloo_referral_rewards,public.jelloo_referral_limits;"));
type Reply={status:ReferralStatus;recovery?:string;error?:string};
async function request(body:unknown,token?:string,adapter=rpc,headers:Record<string,string>={}){
 return handleReferral(new Request(config.origin+"/api/jelloo/referrals",{method:"POST",headers:{origin:config.origin,"content-type":"application/json",...(token?{cookie:`__Host-jelloo_referral=${token}`} :{}),...headers},body:JSON.stringify(body)}),config,adapter);
}
async function call(body:unknown,token?:string,adapter=rpc){const res=await request(body,token,adapter);assert.equal(res.status,200,await res.clone().text());return await res.json() as Reply;}
async function person(){const r=await call({op:"register"});assert.ok(r.recovery);return {token:r.recovery,status:r.status};}
async function invited(code:string){const p=await person();const r=await call({op:"start",code},p.token);assert.ok(r.status.challenge);return {...p,challenge:r.status.challenge};}
const proofs=referralBoards.map(board=>{
 const solved=solvePowerLevel(board);assert.ok(solved.solution);
 const actions:ProofAction[]=[];
 solved.solution.forEach((t,i)=>{for(let n=0;n<(t.rotation-board.tiles[i].rotation+4)%4;n++)actions.push({type:"rotate",index:i});});
 actions.push({type:"go"});return actions;
});
const submission=(c:Challenge,actions=proofs[c.level-1])=>({op:"submit",id:c.id,nonce:c.nonce,revision:c.revision,level:c.level,actions});
async function ready(code:string){const p=await invited(code);let c=p.challenge;for(let i=1;i<10;i++){const r=await call(submission(c),p.token);assert.equal(r.status.referred,"pending");c=r.status.challenge!;}return {...p,challenge:c};}

test("referral frozen tutorials match originals; all ten legal replays win in server and game",()=>{
 referralBoards.forEach((board,i)=>{
  assert.deepEqual(board,levelAt(i+1,0,4,0));
  assert.equal(verifyTutorial(i+1,REFERRAL_REVISION,proofs[i]),true);
  let game=initialGame(board);
  for(const a of proofs[i])game=gameReducer(game,a);
  for(let n=0;n<40 && game.status==="running";n++)game=gameReducer(game,{type:"tick",runId:game.runId});
  assert.equal(game.status,"won");
 });
});
test("SQL migration repeatable, RLS enabled; anonymous users cannot read or call private RPC",async()=>{
 const rows=(await db.query<{relrowsecurity:boolean}>("select relrowsecurity from pg_class where relname like 'jelloo_referral_%' and relkind='r'")).rows;
 assert.equal(rows.length,5);assert.ok(rows.every(r=>r.relrowsecurity));
 for(const role of ["anon","authenticated","service_role"]){
  const r=(await db.query<{read:boolean;execute:boolean}>("select has_table_privilege($1,'public.jelloo_referral_people','SELECT') as read,has_function_privilege($1,'public.jelloo_referral_rpc(text,text,jsonb)','EXECUTE') as execute",[role])).rows[0];
  assert.equal(r.read,false);assert.equal(r.execute,role==="service_role");
 }
});
test("valid journey credits only Level 10; exact concurrent retries issue one durable reward",async()=>{
 const owner=await person(),guest=await ready(owner.status.code);
 let s=(await call({op:"status"},owner.token)).status;assert.equal(s.qualified,0);assert.equal(s.pending,1);
 const final=submission(guest.challenge);
 const results=await Promise.all(Array.from({length:8},()=>call(final,guest.token)));
 assert.ok(results.every(r=>r.status.referred==="qualified"));
 s=(await call({op:"status"},owner.token)).status;assert.equal(s.qualified,1);assert.equal(s.pending,0);assert.deepEqual(s.rewards,[1]);
 const count=(await db.query<{n:number}>("select count(*)::int as n from jelloo_referral_rewards")).rows[0].n;assert.equal(count,1);
});
test("five different guests qualifying together grant thresholds 1,3,5 once each",async()=>{
 const owner=await person();const guests=[];
 for(let i=0;i<5;i++)guests.push(await ready(owner.status.code));
 await Promise.all(guests.flatMap(g=>[call(submission(g.challenge),g.token),call(submission(g.challenge),g.token)]));
 const s=(await call({op:"status"},owner.token)).status;assert.equal(s.qualified,5);assert.deepEqual(s.rewards,[1,3,5]);
});
test("same identity cannot refer itself and attribution cannot be replaced or duplicated",async()=>{
 const a=await person(),b=await person();
 assert.equal((await request({op:"start",code:a.status.code},a.token)).status,409);
 const g=await invited(a.status.code);
 assert.equal((await request({op:"start",code:b.status.code},g.token)).status,409);
 const repeated=await call({op:"start",code:a.status.code},g.token);assert.deepEqual(repeated.status.challenge,g.challenge);
 assert.equal((await call({op:"status"},a.token)).status.pending,1);
});

test("phase84 repeated registration and copied recovery stay one identity, not extra referrals",async()=>{
 const owner=await person(),guest=await invited(owner.status.code);
 const registered=await call({op:"register"},guest.token);
 assert.equal(registered.recovery,undefined);
 assert.equal(registered.status.code,guest.status.code);
 const restored=await call({op:"restore",recovery:guest.token});
 assert.equal(restored.status.code,guest.status.code);
 assert.deepEqual(restored.status.challenge,guest.challenge);
 const repeated=await call({op:"start",code:owner.status.code},guest.token);
 assert.deepEqual(repeated.status.challenge,guest.challenge);
 assert.equal((await call({op:"status"},owner.token)).status.pending,1);
 // Stolen bearer recovery remains a documented risk, not a new verified person.
 const count=(await db.query<{n:number}>("select count(*)::int as n from public.jelloo_referral_people")).rows[0].n;
 assert.equal(count,2);
});
test("no skipping levels, cross-identity sessions, unknown nonces, wrong revisions or replay mutation",async()=>{
 const a=await person(),g=await invited(a.status.code),other=await person();
 for(const body of [submission({...g.challenge,level:10}),submission({...g.challenge,nonce:randomUUID()}),submission({...g.challenge,revision:"0".repeat(64)})])assert.equal((await request(body,g.token)).status,409);
 assert.equal((await request(submission(g.challenge),other.token)).status,409);
 await call(submission(g.challenge),g.token);
 const altered=[{type:"reset"} as const,...proofs[0]];
 assert.equal((await request(submission(g.challenge,altered),g.token)).status,409);
 assert.equal((await call({op:"status"},g.token)).status.challenge?.level,2);
});
test("expired link and session rejected; restarting expires old nonce and preserves attribution",async()=>{
 const a=await person(),g=await invited(a.status.code);
 await db.query("update jelloo_referral_sessions set expires=now()-interval '1 second' where guest=$1",[actorHash(g.token)]);
 assert.equal((await request(submission(g.challenge),g.token)).status,410);
 const restarted=(await call({op:"start",code:a.status.code},g.token)).status.challenge!;assert.notEqual(restarted.id,g.challenge.id);assert.equal(restarted.level,1);
 assert.equal((await request(submission(g.challenge),g.token)).status,409);
 await db.query("update jelloo_referral_people set link_expires=now()-interval '1 second' where actor=$1",[actorHash(a.token)]);
 const fresh=await person();assert.equal((await request({op:"start",code:a.status.code},fresh.token)).status,400);
});
test("private recovery restores reward identity, secure cookie; public code/hash cannot restore",async()=>{
 const owner=await person(),g=await ready(owner.status.code);await call(submission(g.challenge),g.token);
 const res=await request({op:"restore",recovery:owner.token});assert.equal(res.status,200);
 assert.match(res.headers.get("set-cookie")!,/HttpOnly; SameSite=Strict; Max-Age=31536000; Secure/);
 assert.equal(res.headers.get("cache-control"),"no-store");
 assert.deepEqual(((await res.json()) as Reply).status.rewards,[1]);
 assert.equal((await request({op:"restore",recovery:owner.status.code})).status,400);
 assert.equal((await request({op:"restore",recovery:actorHash(owner.token)})).status,401);
});
test("renew link invalidates previous link without losing rewards or accepted sessions",async()=>{
 const a=await person(),g=await invited(a.status.code);const renewed=await call({op:"renew"},a.token);
 assert.notEqual(renewed.status.code,a.status.code);
 assert.deepEqual((await call({op:"status"},g.token)).status.challenge,g.challenge);
 const fresh=await person();assert.equal((await request({op:"start",code:a.status.code},fresh.token)).status,400);
});
test("fabricated flags, illegal actions, over-budget turns, undo refunds and unfinished paths rejected",async()=>{
 const a=await person(),g=await invited(a.status.code);
 const invalid:unknown[]=[[{type:"go"}],[{type:"tick"}], [{type:"rotate",index:12},{type:"go"}], [{type:"rotate",index:-1}], [{type:"rotate",index:13,moves:0}], [{type:"undo"},{type:"go"}], Array.from({length:257},()=>({type:"reset"})),[...Array.from({length:4},()=>({type:"rotate",index:13})),{type:"go"}], [{type:"rotate",index:13},{type:"undo"},{type:"rotate",index:13},{type:"undo"},{type:"rotate",index:13},{type:"undo"},...proofs[0]], [null], "won",null];
 for(const actions of invalid){assert.equal(verifyTutorial(1,REFERRAL_REVISION,actions),false);assert.equal((await request({...submission(g.challenge),actions},g.token)).status,422);}
 assert.equal((await request({...submission(g.challenge),completed:true},g.token)).status,400);
 assert.equal((await request({op:"submit",level:10,won:true},g.token)).status,400);
});
test("reset is a new legal attempt; legal undo never refunds moves",()=>{
 assert.equal(verifyTutorial(1,REFERRAL_REVISION,[{type:"rotate",index:13},{type:"reset"},...proofs[0]]),true);
 assert.equal(verifyTutorial(1,REFERRAL_REVISION,[{type:"rotate",index:13},{type:"undo"},...proofs[0]]),true);
 assert.equal(verifyTutorial(1,REFERRAL_REVISION,[...proofs[0],{type:"reset"}]),false);
});
test("request origin, body, content type and prototype operation input guards",async()=>{
 const a=await person();
 for(const body of [null,[],"x",{op:"__proto__"},{op:"constructor"},{op:"status",extra:1}])assert.equal((await request(body,a.token)).status,400);
 assert.equal((await request({op:"status"},a.token,rpc,{origin:"https://evil.test"})).status,403);
 assert.equal((await request({op:"status"},a.token,rpc,{"sec-fetch-site":"cross-site"})).status,403);
 assert.equal((await request({op:"status"},a.token,rpc,{"content-type":"text/plain"})).status,415);
 assert.equal((await request({op:"status",padding:"x".repeat(17000)},a.token)).status,413);
 assert.equal((await request({op:"status"})).status,401);
});
test("database rate limits bound identities and IP even with forged forwarding headers",async()=>{
 const a=await person();for(let i=0;i<39;i++)await call({op:"status"},a.token);
 const blocked=await request({op:"status"},a.token,rpc,{"x-forwarded-for":"8.8.8.8"});assert.equal(blocked.status,429);assert.equal(blocked.headers.get("retry-after"),"60");
 await db.exec("truncate jelloo_referral_limits");
 const ip="a".repeat(64);for(let i=0;i<120;i++)assert.deepEqual(await rpc("limit",randomBytes(32).toString("hex"),{ip}),{ok:true});
 assert.deepEqual(await rpc("limit",randomBytes(32).toString("hex"),{ip}),{error:"rate_limited"});
});
test("storage outage and commit-response loss fail safely and retry without duplicate credit",async()=>{
 const a=await person(),g=await ready(a.status.code);
 const unavailable:ReferralRpc=async()=>{throw new Error("test outage");};
 assert.equal((await request({op:"status"},a.token,unavailable)).status,503);
 const lost:ReferralRpc=async(op,actor,data)=>{const result=await rpc(op,actor,data);if(op==="advance")throw new Error("response lost after commit");return result;};
 const body=submission(g.challenge);assert.equal((await request(body,g.token,lost)).status,503);
 await call(body,g.token);assert.equal((await call({op:"status"},a.token)).status.qualified,1);
});
test("reward transaction failure rolls back qualification and nonce; retry safely awards once",async()=>{
 const a=await person(),g=await ready(a.status.code);
 await db.exec("create function referral_test_fail() returns trigger language plpgsql as $$ begin raise exception 'injected reward write failure'; end $$; create trigger referral_test_fail before insert on jelloo_referral_rewards for each row execute function referral_test_fail();");
 try {
  assert.equal((await request(submission(g.challenge),g.token)).status,503);
  assert.deepEqual((await call({op:'status'},g.token)).status.challenge,g.challenge);
  assert.equal((await call({op:'status'},a.token)).status.qualified,0);
 } finally {await db.exec("drop trigger referral_test_fail on jelloo_referral_rewards; drop function referral_test_fail();");}
 await call(submission(g.challenge),g.token);
 await db.exec(migration);
 const s=(await call({op:'status'},a.token)).status;assert.equal(s.qualified,1);assert.deepEqual(s.rewards,[1]);
});
test("streamed body limits ignore forged Content-Length; service role can execute only private RPC",async()=>{
 const a=await person();
 const stream=new ReadableStream<Uint8Array>({start(c){c.enqueue(new TextEncoder().encode(JSON.stringify({op:'status',padding:'x'.repeat(17000)})));c.close();}});
 const req=new Request(config.origin+'/api/jelloo/referrals',{method:'POST',headers:{origin:config.origin,'content-type':'application/json','content-length':'1',cookie:`__Host-jelloo_referral=${a.token}`},body:stream,duplex:'half'} as RequestInit);
 assert.equal((await handleReferral(req,config,rpc)).status,413);
 await db.exec('set role service_role');
 try{assert.ok(validStatus(await rpc('status',actorHash(a.token),{})));await assert.rejects(db.query('select * from jelloo_referral_people'));}
 finally{await db.exec('reset role');}
});
test("corrupt persistence output fails closed; SQL constraints protect counter and reward integrity",async()=>{
 const a=await person();
 for(const corrupt of [{...a.status,rewards:[5]}, {...a.status,qualified:-1}, {...a.status,challenge:{level:11}},null]){
  assert.equal(validStatus(corrupt),false);
  const adapter:ReferralRpc=async(op)=>op==="limit"?{ok:true}:corrupt;
  assert.equal((await request({op:"status"},a.token,adapter)).status,503);
 }
 await assert.rejects(db.query("update jelloo_referral_people set qualified=-1"));
 await assert.rejects(db.query("insert into jelloo_referral_rewards(actor,threshold) values($1,2)",[actorHash(a.token)]));
});
test("missing or invalid server configuration fails closed without contacting database",()=>{
 const names=["JELLOO_REFERRAL_ORIGIN","JELLOO_REFERRAL_SECRET","SUPABASE_URL","SUPABASE_SERVICE_ROLE_KEY"];
 const saved=names.map(n=>process.env[n]);
 try{
  for(const n of names)delete process.env[n];assert.throws(configuration);
  process.env.JELLOO_REFERRAL_ORIGIN="https://jelloo.test/path";process.env.JELLOO_REFERRAL_SECRET="s".repeat(32);process.env.SUPABASE_URL="https://isolated.supabase.co";process.env.SUPABASE_SERVICE_ROLE_KEY="sb_secret_"+"s".repeat(32);assert.throws(configuration);
  process.env.JELLOO_REFERRAL_ORIGIN="https://jelloo.test";process.env.SUPABASE_SERVICE_ROLE_KEY="anon-key";assert.throws(configuration);
  process.env.SUPABASE_SERVICE_ROLE_KEY="sb_secret_"+"s".repeat(32);assert.equal(configuration().config.origin,"https://jelloo.test");
 }finally{names.forEach((n,i)=>{if(saved[i]===undefined)delete process.env[n];else process.env[n]=saved[i];});}
});
