import test from "node:test";
import assert from "node:assert/strict";
import {AsyncLocalStorage} from "node:async_hooks";
import {extractClientIp,normalizeClientIp,checkPinRateLimit,recordFailedPinAttempt,_resetPinRateLimit} from "../lib/quiz/security";
import {isSupabaseConfigured} from "../lib/quiz/supabase";

// No database/network access. Missing Netlify runtime context remains fail-closed.
function platform(env:Record<string,string|undefined>,run:()=>void){
 const names=["VERCEL","NETLIFY","QUIZ_TRUSTED_PROXY"];
 const before=Object.fromEntries(names.map(k=>[k,process.env[k]]));
 try{for(const k of names){if(env[k]===undefined)delete process.env[k];else process.env[k]=env[k];}run();}
 finally{for(const k of names){if(before[k]===undefined)delete process.env[k];else process.env[k]=before[k];}}
}
const request=(headers:Record<string,string>={})=>new Request("https://isolated.invalid/api/quiz/test/scoreboard",{headers});

test("unattested direct requests fail closed without a client-IP identity",()=>{
 platform({},()=>assert.equal(extractClientIp(request()),"unknown"));
});
test("Netlify flag alone never authenticates forwarded or spoofed platform headers",()=>{
 platform({NETLIFY:"true"},()=>{
  for(const header of ["x-forwarded-for","x-real-ip","x-nf-client-connection-ip","x-vercel-forwarded-for","cf-connecting-ip"])
   assert.equal(extractClientIp(request({[header]:"203.0.113.8"})),"unknown",header);
  assert.equal(extractClientIp(request({"x-forwarded-for":"203.0.113.8, 198.51.100.9","x-nf-client-connection-ip":"198.51.100.10","netlify":"true","vercel":"1"})),"unknown");
 });
});
test("Netlify clients without platform context still share the conservative bucket",()=>{
 platform({NETLIFY:"true"},()=>{
  const identities=["203.0.113.8","198.51.100.9"].map(ip=>extractClientIp(request({"x-nf-client-connection-ip":ip,"x-forwarded-for":ip})));
  assert.deepEqual(identities,["unknown","unknown"]);
  assert.equal(new Set(identities).size,1,"Do not call this multi-client isolation: both share a bucket until the runtime boundary is verified.");
 });
});

// Exercise the real SDK's request-local store, not a mock header reader. Only
// tests populate this internal symbol; production code exclusively calls the SDK.
const sdkStore=(globalThis as unknown as Record<symbol,unknown>)[Symbol.for("@netlify/functions/request-context-store")] as AsyncLocalStorage<{context?:{ip?:unknown}}>;
assert.ok(sdkStore instanceof AsyncLocalStorage,"Reviewed SDK request-context boundary changed; review the integration.");
test("Netlify SDK context separates clients despite spoofed forwarding chains",()=>{
 platform({NETLIFY:"true"},()=>{
  const forged=request({"x-nf-client-connection-ip":"192.0.2.99","x-forwarded-for":"192.0.2.99, 192.0.2.98","cf-connecting-ip":"192.0.2.97"});
  const clients=["203.0.113.8","198.51.100.9"].map(ip=>sdkStore.run({context:{ip}},()=>extractClientIp(forged)));
  assert.deepEqual(clients,["203.0.113.8","198.51.100.9"]);
  assert.equal(extractClientIp(forged),"unknown","SDK context must not leak outside a request");
 });
});
test("Netlify missing or malformed runtime metadata never falls back to headers",()=>{
 platform({NETLIFY:"true",QUIZ_TRUSTED_PROXY:"cloudflare"},()=>{
  const forged=request({"x-nf-client-connection-ip":"203.0.113.8","cf-connecting-ip":"203.0.113.8"});
  for(const ip of [undefined,null,42,{},"","not-an-ip","203.0.113.8, 198.51.100.9","203.0.113.8:443"])
   assert.equal(sdkStore.run({context:{ip}},()=>extractClientIp(forged)),"unknown");
  assert.equal(sdkStore.run({},()=>extractClientIp(forged)),"unknown");
 });
});
test("Netlify platform IPv6 normalizes without reading forwarded headers",()=>{
 platform({NETLIFY:"true"},()=>assert.equal(sdkStore.run({context:{ip:"::ffff:203.0.113.8"}},()=>extractClientIp(request())),"203.0.113.8"));
});
test("SDK context is ignored outside Netlify and preserves Vercel precedence",()=>{
 for(const env of [{},{NETLIFY:"false"},{NETLIFY:"1"}])platform(env,()=>assert.equal(sdkStore.run({context:{ip:"203.0.113.8"}},()=>extractClientIp(request())),"unknown"));
 platform({NETLIFY:"true",VERCEL:"1"},()=>assert.equal(sdkStore.run({context:{ip:"203.0.113.8"}},()=>extractClientIp(request({"x-vercel-forwarded-for":"198.51.100.9"}))),"198.51.100.9"));
});
test("concurrent Netlify SDK request contexts stay isolated across async work",async()=>{
 const before={netlify:process.env.NETLIFY,vercel:process.env.VERCEL,proxy:process.env.QUIZ_TRUSTED_PROXY};
 process.env.NETLIFY="true";delete process.env.VERCEL;delete process.env.QUIZ_TRUSTED_PROXY;
 try{
  const clients=await Promise.all(["203.0.113.8","198.51.100.9"].map(ip=>sdkStore.run({context:{ip}},async()=>{await new Promise<void>(resolve=>setImmediate(resolve));return extractClientIp(request({"x-nf-client-connection-ip":"192.0.2.99"}));})));
  assert.deepEqual(clients,["203.0.113.8","198.51.100.9"]);assert.equal(extractClientIp(request()),"unknown");
 }finally{for(const [key,value]of Object.entries({NETLIFY:before.netlify,VERCEL:before.vercel,QUIZ_TRUSTED_PROXY:before.proxy})){if(value===undefined)delete process.env[key];else process.env[key]=value;}}
});
test("spoofed IP headers cannot evade five local PIN failures for a platform client",async()=>{
 const before={netlify:process.env.NETLIFY,vercel:process.env.VERCEL,proxy:process.env.QUIZ_TRUSTED_PROXY};
 process.env.NETLIFY="true";delete process.env.VERCEL;delete process.env.QUIZ_TRUSTED_PROXY;
 try{
  assert.equal(isSupabaseConfigured(),false,"This regression must never access a configured database");_resetPinRateLimit();
  await sdkStore.run({context:{ip:"203.0.113.8"}},async()=>{
   for(let i=0;i<5;i++){const ip=extractClientIp(request({"x-forwarded-for":`192.0.2.${i+1}`,"x-nf-client-connection-ip":`192.0.2.${i+1}`}));assert.equal(ip,"203.0.113.8");assert.equal(await recordFailedPinAttempt(ip),true);}
   assert.equal(await checkPinRateLimit(extractClientIp(request({"x-forwarded-for":"198.51.100.9"}))),false);
  });
  assert.equal(await sdkStore.run({context:{ip:"198.51.100.9"}},()=>checkPinRateLimit(extractClientIp(request()))),true);
 }finally{_resetPinRateLimit();for(const [key,value]of Object.entries({NETLIFY:before.netlify,VERCEL:before.vercel,QUIZ_TRUSTED_PROXY:before.proxy})){if(value===undefined)delete process.env[key];else process.env[key]=value;}}
});
test("existing Vercel boundary separates clients and ignores attacker forwarding values",()=>{
 platform({VERCEL:"1"},()=>{
  const identities=["203.0.113.8","198.51.100.9"].map(ip=>extractClientIp(request({"x-vercel-forwarded-for":ip,"x-forwarded-for":"192.0.2.100","x-nf-client-connection-ip":"192.0.2.101"})));
  assert.deepEqual(identities,["203.0.113.8","198.51.100.9"]);
  for(const value of ["", "203.0.113.8, 198.51.100.9","203.0.113.8:443","not-an-ip"])
   assert.equal(extractClientIp(request({"x-vercel-forwarded-for":value,"x-forwarded-for":"203.0.113.8"})),"unknown");
 });
});
test("IP normalization rejects lists and ports, preserving the existing limit key contract",()=>{
 assert.equal(normalizeClientIp("203.0.113.8"),"203.0.113.8");
 assert.equal(normalizeClientIp("::ffff:203.0.113.8"),"203.0.113.8");
 for(const value of ["203.0.113.8, 198.51.100.9","203.0.113.8:443","999.1.1.1","unknown"])
  assert.equal(normalizeClientIp(value),null);
});
