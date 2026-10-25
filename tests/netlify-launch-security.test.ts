import test from "node:test";
import assert from "node:assert/strict";
import {extractClientIp,normalizeClientIp} from "../lib/quiz/security";

// No database, network or rate-limit mutations. These tests document the current
// fail-closed boundary; the Netlify multi-client collision remains a release blocker.
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
test("UNRESOLVED Netlify multi-client identity collision is reproduced, not hidden",()=>{
 platform({NETLIFY:"true"},()=>{
  const identities=["203.0.113.8","198.51.100.9"].map(ip=>extractClientIp(request({"x-nf-client-connection-ip":ip,"x-forwarded-for":ip})));
  assert.deepEqual(identities,["unknown","unknown"]);
  assert.equal(new Set(identities).size,1,"Do not call this multi-client isolation: both share a bucket until the runtime boundary is verified.");
 });
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
