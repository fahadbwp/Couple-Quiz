// Standalone loopback QA only. Never included in Next routes or production builds.
import { createServer } from "node:http";
import { encodeJourney, newJourney, SAVE_KEY } from "../lib/jelloo/progress";
import { initialGame } from "../lib/jelloo/engine";
import { levelAt } from "../lib/jelloo/endless";
async function main() {
  if(process.env.NODE_ENV==="production" || process.env.VERCEL || process.env.NETLIFY) throw Error("Local QA only");
  Object.assign(process.env,{NODE_ENV:"development",JELLOO_LOCAL_QA:"1"});
  for(const k of ["SUPABASE_URL","NEXT_PUBLIC_SUPABASE_URL","SUPABASE_SERVICE_ROLE_KEY","SUPABASE_SERVICE_KEY","SUPABASE_SECRET_KEY","QUIZ_TEST_SUPABASE_URL","QUIZ_TEST_SUPABASE_SERVICE_ROLE_KEY","UPSTASH_REDIS_REST_URL","UPSTASH_REDIS_REST_TOKEN","JELLOO_REFERRAL_SECRET"])process.env[k]="";
  const {default:next}=await import("next");
  const app=next({dev:true,hostname:"127.0.0.1",port:3026});await app.prepare();
  const journey={...newJourney(42),completed:90,muted:true,motion:false,game:initialGame(levelAt(1,42,4,2)),best:Object.fromEntries(Array.from({length:90},(_,i)=>[i+1,3]))};
  createServer((req,res)=>{
    if(req.headers.host!=="127.0.0.1:3026"){res.writeHead(403).end();return;}
    const url=new URL(req.url!,"http://127.0.0.1:3026");
    if(url.pathname.startsWith("/api/")){res.writeHead(503).end();return;}
    const set=res.setHeader.bind(res);res.setHeader=(k,v)=>set(k,k.toLowerCase()==="x-frame-options"?"SAMEORIGIN":k.toLowerCase()==="content-security-policy"?String(v).replace("frame-ancestors 'none'","frame-ancestors 'self'"):v);
    if(url.pathname==="/_phase83"){
      const width=[320,390,1280].includes(Number(url.searchParams.get("width")))?Number(url.searchParams.get("width")):390;
      res.writeHead(200,{"Content-Type":"text/html"}).end(`<title>Isolated Phase 8.3 QA</title><h1>Disposable progress on port 3026</h1><button id="seed">Install unlocked fixture</button><p><a href="?width=320">320px</a> <a href="?width=390">390px</a> <a href="?width=1280">Desktop</a></p><p><a href="/jelloo/pals" target="game">Power Trials</a> <a href="/jelloo?level=1" target="game">Level 1</a> <a href="/jelloo?level=27" target="game">Level 27</a> <a href="/jelloo/qa?level=71" target="game">Two-Jelly</a> <a href="/jelloo/qa?level=91" target="game">Three-Jelly</a> <button id="measure">Measure viewport</button></p><pre id="metrics"></pre><iframe name="game" title="Game viewport" style="width:${width}px;height:844px;border:0" src="/jelloo"></iframe><script>document.querySelector('#measure').onclick=()=>{const d=document.querySelector('iframe').contentDocument;const cells=[...d.querySelectorAll('[data-status]')];document.querySelector('#metrics').textContent=JSON.stringify({width:d.documentElement.clientWidth,scroll:d.documentElement.scrollWidth,cells:cells.length,worlds:d.querySelectorAll('section[data-world]').length,minWidth:Math.min(...cells.map(e=>e.getBoundingClientRect().width)),minHeight:Math.min(...cells.map(e=>e.getBoundingClientRect().height)),outside:cells.filter(e=>{const r=e.getBoundingClientRect();return r.left<0||r.right>d.documentElement.clientWidth}).length});};document.querySelector('#seed').onclick=()=>{localStorage.setItem(${JSON.stringify(SAVE_KEY)},${JSON.stringify(encodeJourney(journey))});document.querySelector('iframe').src='/jelloo';};</script>`);return;
    }
    void app.getRequestHandler()(req,res);
  }).listen(3026,"127.0.0.1",()=>console.log("Isolated QA http://127.0.0.1:3026/_phase83"));
}
void main();
