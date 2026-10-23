/** Read-only local HTTP smoke. Start scripts/platform-local-qa.ts first. */
import assert from "node:assert/strict";
const base="http://127.0.0.1:3014";
async function main(){
 const titles=new Set<string>();
 for(const path of ["/","/games","/quiz","/quiz/create","/jelloo","/jelloo/daily","/jelloo/zen","/jelloo/invite","/quiz/play/q_missing","/quiz/share/q_missing","/quiz/result/q_missing","/quiz/scoreboard/q_missing"]){
  const r=await fetch(base+path);const html=await r.text();assert.equal(r.status,200,path);
  const title=html.match(/<title>(.*?)<\/title>/)?.[1];assert.ok(title,path);assert.ok(!titles.has(title),`duplicate title ${path}`);titles.add(title);
  assert.match(r.headers.get("x-robots-tag")??"",/noindex/,`local QA must not index ${path}`);
  const canonical=html.match(/<link rel="canonical" href="([^"]+)"/ )?.[1];
  if(["/","/games","/quiz","/quiz/create","/jelloo"].includes(path)){assert.ok(canonical);assert.ok(!canonical.includes("127.0.0.1")&&!canonical.includes("netlify.app"));}
  if(path.includes("q_missing")||path.includes("/invite"))assert.match(html,/<meta name="robots" content="[^"]*noindex/);
  let schemas=0;for(const s of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)){JSON.parse(s[1]);schemas++;}
  console.log(JSON.stringify({path,status:r.status,title,canonical,schemas,previewHeader:r.headers.get("x-robots-tag")}));
 }
 const sitemap=await(await fetch(base+"/sitemap.xml")).text();assert.ok(sitemap.includes("/games"));assert.doesNotMatch(sitemap,/\/result\/|\/scoreboard\/|\/invite|\/qa/);
 const robots=await(await fetch(base+"/robots.txt")).text();assert.match(robots,/Disallow: \//);console.log("sitemap exclusions and local robots: PASS");
 for(const path of ["/playnudge.svg","/jelly-pals/bunny-blink-reference-v1.png","/opengraph-image"]){const r=await fetch(base+path);assert.equal(r.status,200);console.log(`asset ${path}: ${r.status}, ${r.headers.get("content-type")}`);}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
