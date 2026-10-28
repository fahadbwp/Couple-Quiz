import test from "node:test";
import assert from "node:assert/strict";
import {BUNNY_PATH,PREVIOUS_WORLD_PATH,worldLevelHref,bunnyAliasDestination} from "../lib/jelloo/campaign-v2/routes";
test("current Bunny and previous campaign links never cross their content revisions",()=>{
 for(let id=1;id<=50;id++) {
  assert.equal(worldLevelHref(id),`${BUNNY_PATH}?level=${id}`);
  assert.equal(worldLevelHref(id,true),`${PREVIOUS_WORLD_PATH}?level=${id}`);
  assert.notEqual(worldLevelHref(id),worldLevelHref(id,true));
 }
 for(const id of [0,51,NaN,1.5])assert.throws(()=>worldLevelHref(id));
});
test("existing Bunny alias preserves legal level bookmarks without accepting redirect targets",()=>{
 for(let id=1;id<=50;id++)assert.equal(bunnyAliasDestination(String(id)),worldLevelHref(id));
 for(const input of [undefined,null,[],["1","2"],"0","01","51","NaN","https://evil.example","1&other=x"])
  assert.equal(bunnyAliasDestination(input),BUNNY_PATH);
});

test("accepted Bunny 1-50 content and original artwork remain frozen",async()=>{
 const {readFile}=await import("node:fs/promises");
 const {createHash}=await import("node:crypto");
 const manifest: {revision:string;files:Record<string,string>}=JSON.parse(await readFile("tests/fixtures/jelloo-bunny4-frozen.json","utf8"));
 assert.equal(manifest.revision,"bunny-4x4-v1");
 for(const [path,expected] of Object.entries(manifest.files)) {
  const raw=await readFile(path);
  const bytes=path.endsWith(".ts")?Buffer.from(raw.toString("utf8").replace(/\r\n/g,"\n")):raw;
  assert.equal(createHash("sha256").update(bytes).digest("hex"),expected,`${path} changed; preserve this approved batch or explicitly review a new revision`);
 }
});
