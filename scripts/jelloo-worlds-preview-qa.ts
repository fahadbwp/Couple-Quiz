// Disposable loopback-only QA harness. Not a Next route or production unlock mechanism.
import {createServer} from "node:http";
import {CAMPAIGN_V2_SAVE_KEY, LEGACY_SAVE_KEY} from "../lib/jelloo/campaign-save";
import {solvePowerLevel} from "../lib/jelloo/power-solver";
import {resolveWorld1Level} from "../lib/jelloo/campaign-v2/world1-provider";
async function main() {
  Object.assign(process.env,{NODE_ENV:"development"});
  for(const key of Object.keys(process.env)) if(/SUPABASE|UPSTASH|REFERRAL_SECRET/.test(key)) delete process.env[key];
  const port = Number(process.env.JELLOO_QA_PORT ?? 3055);
  if (![3055,3057].includes(port)) throw new Error("Unsupported loopback QA port");
  const {default:next}=await import("next");
  const app=next({dev:true,hostname:"127.0.0.1",port});await app.prepare();
  createServer((req,res)=>{
    if(![`127.0.0.1:${port}`,`localhost:${port}`].includes(req.headers.host ?? "")) {res.writeHead(403).end();return;}
    const url=new URL(req.url!,`http://127.0.0.1:${port}`);
    if(url.pathname.startsWith("/api/")) {res.writeHead(503).end();return;}
    if(url.pathname==="/_worlds-qa") {
      const width=[320,390,1280].includes(Number(url.searchParams.get("width")))?Number(url.searchParams.get("width")):390;
      const completed=[0,9,49,50].includes(Number(url.searchParams.get("completed")))?Number(url.searchParams.get("completed")):0;
      const stars=url.searchParams.get("stars")==="low"?1:3;
      const now="2026-10-27T12:00:00.000Z";
      const save={version:2,campaignId:"character_worlds_v2",completed,currentLevelId:Math.max(1,completed),best:Object.fromEntries(Array.from({length:completed},(_,i)=>[i+1,stars])),motion:true,muted:true,createdAt:now,updatedAt:now};
      const id=Number(url.searchParams.get("level")??1),level=resolveWorld1Level(id),solution=solvePowerLevel(level).solution!;
      const clicks=level.tiles.flatMap((tile,index)=>Array.from({length:(solution[index].rotation-tile.rotation+4)%4},()=>index));
      res.writeHead(200,{"Content-Type":"text/html; charset=utf-8"}).end(`<!doctype html><style>pre{white-space:pre-wrap;overflow-wrap:anywhere;max-width:100%}</style><meta name="viewport" content="width=device-width,initial-scale=1"><title>Candy Land isolated QA</title><h1>Disposable QA · ${width}px</h1><p><a href="?width=320">320px</a> <a href="?width=390">390px</a> <a href="?width=1280">Desktop</a></p><button id="fixture">Install isolated fixture (${completed} completed)</button> <button id="measure">Measure</button> <button id="solution">Show click plan</button><pre id="metrics"></pre><iframe title="Candy Land test viewport" style="width:${width + 15}px;height:900px;border:0" src="/jelloo/character-worlds"></iframe><script>const frame=document.querySelector('iframe');document.querySelector('#fixture').onclick=()=>{localStorage.setItem(${JSON.stringify(CAMPAIGN_V2_SAVE_KEY)},${JSON.stringify(JSON.stringify(save))});localStorage.setItem(${JSON.stringify(LEGACY_SAVE_KEY)},'ISOLATED-LEGACY-SENTINEL');frame.src='/jelloo/character-worlds';};document.querySelector('#measure').onclick=()=>{const d=frame.contentDocument;const cells=[...d.querySelectorAll('[aria-label^="Level "]')].filter(e=>e.tagName==='A'||e.tagName==='BUTTON');document.querySelector('#metrics').textContent=JSON.stringify({width:d.documentElement.clientWidth,scrollWidth:d.documentElement.scrollWidth,levels:cells.length,smallestTarget:cells.length?Math.min(...cells.map(e=>e.getBoundingClientRect().width)):null,legacy:localStorage.getItem(${JSON.stringify(LEGACY_SAVE_KEY)}),save:JSON.parse(localStorage.getItem(${JSON.stringify(CAMPAIGN_V2_SAVE_KEY)})||'null')});};document.querySelector('#solution').onclick=()=>document.querySelector('#metrics').textContent=${JSON.stringify(JSON.stringify({id,size:level.size,clicks}))};</script>`);return;
    }
    const set=res.setHeader.bind(res);res.setHeader=(key,value)=>set(key,key.toLowerCase()==="x-frame-options"?"SAMEORIGIN":key.toLowerCase()==="content-security-policy"?String(value).replace("frame-ancestors 'none'","frame-ancestors 'self'"):value);
    void app.getRequestHandler()(req,res);
  }).listen(port,"127.0.0.1",()=>console.log(`Candy Land QA http://127.0.0.1:${port}/_worlds-qa`));
}
void main();


